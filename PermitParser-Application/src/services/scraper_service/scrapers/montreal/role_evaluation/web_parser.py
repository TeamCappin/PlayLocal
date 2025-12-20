"""Parser for Montréal role evaluation detail pages.

This module implements ``AbstractParser`` to transform raw HTML
strings of lot detail pages into structured dictionaries.  The parser
extracts key fields from the "Identification de l'unité d'évaluation"
section, the "Propriétaire" section, and other sections such as
"Caractéristiques de l'unité d'évaluation", "Valeurs au rôle
d'évaluation", "Répartition fiscale" and "Compte de taxes".  It
also collects the current-year “compte de taxes” PDF link; ``CURRENT_TAX_YEAR`` is
accepted for backward compatibility.
"""

from __future__ import annotations

import logging
import re
from datetime import date
from typing import Any, Dict, List, Optional

from bs4 import BeautifulSoup  # type: ignore
from urllib.parse import urljoin

from lib.abstract_scraper import AbstractParser


logger = logging.getLogger(__name__)


class MontrealRoleEvaluationParser(AbstractParser):
    """Parser for Montréal role evaluation detail pages.

    This parser extracts structured information from the HTML of a
    single lot detail page.  It is designed to work without network
    access and can be unit tested using static HTML fixtures.  PDF
    links are normalised and filtered based on ``CURRENT_TAX_YEAR``.
    """

    # Base URL used to normalise relative PDF links.  If the site
    # serves PDFs from a different subdomain, update this accordingly.
    BASE_URL = "https://montreal.ca"
    # Regex to extract four-digit years from file names or URLs
    YEAR_REGEX = re.compile(r"(\d{4})")

    def __init__(self, settings: Optional[Dict[str, Any]] = None) -> None:
        """
        Initialise the parser with optional settings.

        ``settings`` may contain a ``CURRENT_TAX_YEAR`` key in the old API; this
        refactored parser no longer uses the year floor for filtering but
        accepts it for backward compatibility.  A set of seen PDF URLs is
        maintained to deduplicate links across pages.
        """
        settings = settings or {}
        # Retain the setting for backward compatibility but do not enforce it.
        self.current_tax_year: int = int(settings.get("CURRENT_TAX_YEAR", 2025))

        # Track seen PDF URLs to avoid emitting duplicates across pages
        self.seen_pdf_urls: set[str] = set()

    def _extract_dt_dd_pairs(self, container) -> Dict[str, Any]:
        """Extract key/value pairs from ``<dt>``/``<dd>`` elements within a container.

        This helper scans a container for description lists and builds a dictionary of
        keys and values.  When the same key appears multiple times (as can happen
        in the valuation section where current and previous roll values share
        identical labels), the corresponding dictionary value will be a list
        preserving the order of appearance rather than silently overwriting
        earlier entries.  This ensures no data is lost due to duplicate keys.

        Args:
            container: A BeautifulSoup element expected to contain ``<dt>``/``<dd>`` pairs.

        Returns:
            A dictionary mapping the text of each ``<dt>`` to its corresponding value(s).
            If a key occurs more than once, the value will be a list of strings in
            order of appearance.
        """
        pairs: Dict[str, Any] = {}
        if not container:
            return pairs
        for dt in container.find_all("dt"):
            dd = dt.find_next_sibling("dd")
            if not dd:
                continue
            key = dt.get_text(strip=True)
            value = dd.get_text(strip=True)
            # Accumulate values when duplicate keys are encountered
            if key in pairs:
                existing = pairs[key]
                if isinstance(existing, list):
                    existing.append(value)
                else:
                    pairs[key] = [existing, value]
            else:
                pairs[key] = value
        return pairs

    def _set_bilingual(self, record: Dict[str, Any], canonical: str, french: str, value: Any) -> None:
        """
        Write-through setter that preserves the repo's French schema while keeping
        English aliases for internal consumers. Does not overwrite existing keys.
        """
        if canonical not in record:
            record[canonical] = value
        if french not in record:
            record[french] = value

    def parse_element(self, html: str) -> Optional[Dict[str, Any]]:
        """
        Parse a single lot detail HTML page into a dictionary.

        The HTML may contain special comment markers injected by the web handler
        of the form ``<!--SOURCE_URL:...--><!--SEARCH_LOT:...--><!--EVAL_ID:...-->``.
        These markers carry metadata such as the detail page URL, the lot
        number that was searched, and the evaluation unit identifier.  If
        present, these markers are extracted and removed prior to parsing.

        Args:
            html: A string containing the HTML (with optional metadata
                comments) of a lot detail page.

        Returns:
            A dictionary with extracted data or ``None`` if mandatory
            fields could not be found.
        """
        if not html:
            return None

        # Extract optional metadata comments inserted by the web handler.
        # These comments may include SOURCE_URL, SEARCH_LOT, EVAL_ID and
        # optionally DUP_INDEX.  Use a single regex to capture up to four
        # groups.  The duplicate index is used to disambiguate records
        # when the same evalUnitId appears multiple times on a list page.
        source_url: Optional[str] = None
        search_lot: Optional[str] = None
        eval_unit_id: Optional[str] = None
        dup_index: Optional[str] = None
        try:
            if html.startswith("<!--"):
                # The comment may contain multiple markers back-to-back.  The
                # DUP_INDEX marker is optional.  If it is absent,
                # group(4) will be None.
                meta_match = re.match(
                    r"<!--SOURCE_URL:(.*?)-->"   # source URL
                    r"<!--SEARCH_LOT:(.*?)-->"   # searched lot
                    r"<!--EVAL_ID:(.*?)-->"      # eval unit id
                    r"(?:<!--DUP_INDEX:(.*?)-->)?",  # optional dup index
                    html,
                    re.DOTALL,
                )
                if meta_match:
                    source_url = meta_match.group(1) or None
                    search_lot = meta_match.group(2) or None
                    eval_unit_id = meta_match.group(3) or None
                    dup_index = meta_match.group(4) or None
                    html = html[meta_match.end():]

        except Exception as exc:
            logger.debug(
                "Metadata comment parse failed; continuing",
                extra={"prefix": html[:80]},
                exc_info=exc,
            )

        try:
            soup = BeautifulSoup(html, "html.parser")
        except Exception as exc:
            logger.debug("Failed to parse HTML; returning None", exc_info=exc)
            return None

        record: Dict[str, Any] = {}

        # Attach metadata if provided
        if source_url:
            record["source_url"] = source_url
        if search_lot:
            record["searched_lot"] = search_lot
        if eval_unit_id:
            record["eval_unit_id"] = eval_unit_id
            # Construct a unique record_id.  If a duplicate index is
            # present, include it so that multiple occurrences of the same
            # evalUnitId produce distinct identifiers.  Otherwise fall
            # back to the older scheme (lot__evalUnitId).
            if search_lot:
                if dup_index:
                    record["record_id"] = f"{search_lot}__{eval_unit_id}__{dup_index}"
                    record["duplicate_index"] = dup_index
                else:
                    record["record_id"] = f"{search_lot}__{eval_unit_id}"

        # Extract identification fields using the reusable dt/dd helper
        # Find the "Identification de l'unité d'évaluation" section first
        ident_heading = soup.find(
            lambda tag: tag.name in ["h2", "h3"] and "identification" in tag.get_text(strip=True).lower()
        )
        ident_section = ident_heading.find_next_sibling() if ident_heading else None

        id_pairs = self._extract_dt_dd_pairs(ident_section)

        # If the section wasn't found or produced nothing, (rare) fall back to scanning
        # the whole document once via the helper (still no manual duplication).
        if not id_pairs:
            id_pairs = self._extract_dt_dd_pairs(soup)

        def _val_to_str(v: Any) -> str:
            if isinstance(v, list):
                return " ".join(x for x in v if isinstance(x, str))
            return v if isinstance(v, str) else ""

        for key_raw, val in id_pairs.items():
            key = key_raw.replace("\xa0", " ").lower()
            v = _val_to_str(val)

            if not v:
                continue

            # Preserve French keys for downstream consumers; also keep English aliases.
            if "adresse" in key:
                self._set_bilingual(record, "address", "Adresse", v)
            elif "arrondissement" in key:
                self._set_bilingual(record, "arrondissement", "Arrondissement", v)
            elif "numéro" in key and "matricule" in key:
                self._set_bilingual(record, "matricule_number", "Numéro de matricule", v)
            elif "utilisation" in key and "prédominante" in key:
                self._set_bilingual(record, "utilisation_predominante", "Utilisation prédominante", v)
            elif (("numéro" in key and "unité" in key and "voisinage" in key)
                  or ("numéro d'unité" in key and "voisinage" in key)):
                self._set_bilingual(record, "unite_voisinage_number", "Numéro d'unité de voisinage", v)
            elif "numéro" in key and "compte" in key and "foncier" in key:
                self._set_bilingual(record, "compte_foncier_number", "Numéro de compte foncier", v)
            elif "numéro" in key and "lot" in key:
                # Text form + parsed list
                self._set_bilingual(record, "lot_numbers_text", "Numéro de lot", v)
                candidates = re.split(r"[\s,;]+", v)
                lot_numbers = [c.strip() for c in candidates if c.strip()]
                record.setdefault("lot_numbers", lot_numbers)

        # Set primary lot_number: prefer the searched lot if provided; otherwise first in list
        if search_lot:
            record["lot_number"] = search_lot
            # Ensure French schema and mirrors exist when only search_lot is known
            record.setdefault("Numéro de lot", search_lot)
            record.setdefault("lot_numbers", [search_lot])
            record.setdefault("lot_numbers_text", search_lot)
        elif record.get("lot_numbers"):
            record["lot_number"] = record["lot_numbers"][0]

        # If we didn't find an address or a lot number, consider the page invalid
        if not record.get("address") and not record.get("lot_number"):
            return None

        # Extract owner information.  Multiple owners may be listed; group them.
        try:
            heading = soup.find(lambda tag: tag.name in ["h2", "h3"] and "propri" in tag.get_text(strip=True).lower())
            if heading:
                section = heading.find_next_sibling()
                # Flatten dt/dd pairs into a list for grouping
                dt_tags = section.find_all("dt") if section else []
                owners: List[Dict[str, Any]] = []
                current_owner: Dict[str, Any] = {}
                for dt_tag in dt_tags:
                    dd = dt_tag.find_next_sibling("dd")
                    if not dd:
                        continue
                    k = dt_tag.get_text(strip=True).lower()
                    v = dd.get_text(strip=True)
                    if "nom" in k:
                        # Start a new owner if current exists
                        if current_owner:
                            owners.append(current_owner)
                            current_owner = {}
                        current_owner["name"] = v
                    elif "statut" in k:
                        current_owner["status"] = v
                    elif "adresse" in k:
                        current_owner["postal_address"] = v
                    elif "date" in k:
                        current_owner["inscription_date"] = v
                if current_owner:
                    owners.append(current_owner)
                if owners:
                    record["owners"] = owners
                    # For backward compatibility, also expose the first owner as "owner"
                    record["owner"] = owners[0]
        except Exception as exc:
            logger.debug("Failed to parse owner section; skipping", exc_info=exc)

        # Extract other sections into nested dictionaries
        for heading in soup.find_all(["h2", "h3"]):
            text = heading.get_text(strip=True).lower()
            # Characteristics
            if "caractéristique" in text:
                section = heading.find_next_sibling()
                data = self._extract_dt_dd_pairs(section)
                if data:
                    record["characteristics"] = data
            # Valuation values
            elif "valeur" in text:
                section = heading.find_next_sibling()
                data = self._extract_dt_dd_pairs(section)
                if data:
                    record["valuation"] = data
            # Fiscal distribution
            elif "répartition fiscale" in text:
                section = heading.find_next_sibling()
                data = self._extract_dt_dd_pairs(section)
                if data:
                    record["fiscal_distribution"] = data
                # Additionally parse any table rows present in this section.
                try:
                    table = section.find("table") if section else None
                    if table:
                        rows = []
                        headers: Optional[List[str]] = None
                        for tr in table.find_all("tr"):
                            # Gather all header or data cells
                            cells = [c.get_text(strip=True) for c in tr.find_all(["th", "td"])]
                            if not cells:
                                continue
                            # If this row contains TH elements and we don't yet have headers,
                            # treat it as the header row.
                            if headers is None and tr.find("th"):
                                headers = cells
                                continue
                            if headers:
                                # Map each cell to the corresponding header key.  If a row
                                # has fewer cells than headers, fill missing entries with
                                # empty strings.
                                row_dict: Dict[str, Any] = {}
                                for idx, h in enumerate(headers):
                                    row_dict[h] = cells[idx] if idx < len(cells) else ""
                                rows.append(row_dict)
                            else:
                                # Without headers, just append the list of cells
                                rows.append(cells)
                        if rows:
                            record["fiscal_distribution_table"] = rows
                except Exception as exc:
                    logger.debug(
                        "Failed to parse fiscal distribution table; skipping table",
                        exc_info=exc,
                    )

            # Compte de taxes (we still parse dt/dd but PDFs are handled below)
            elif "compte de taxes" in text:
                section = heading.find_next_sibling()
                data = self._extract_dt_dd_pairs(section)
                if data:
                    record["tax_account"] = data

        # Extract PDF links from any attribute on anchor or button elements and determine most recent
        pdf_links: List[Dict[str, Any]] = []
        # Helper to process a candidate URL
        def maybe_add_pdf(attr_val: str, text: str) -> None:
            """Inspect a candidate attribute value and add a PDF link if appropriate.

            The Montréal site serves tax account downloads via both true PDF files
            (with a ``.pdf`` extension) and API endpoints such as
            ``/compte-taxes/rapport/<uuid>`` which generate the PDF on demand.  We
            therefore treat any attribute value containing ``.pdf`` *or*
            ``compte-taxes`` as a potential PDF link.  Duplicate URLs are
            suppressed via ``self.seen_pdf_urls``.

            Args:
                attr_val: The raw attribute string to inspect (e.g. an href or data-href).
                text: The visible text associated with the link or button (used to infer year).
            """
            # Only capture the tax account PDF for the current year (green button).
            # If the visible text does not mention "compte de taxes" and a year,
            # ignore this link entirely.  We specifically look for
            # "compte de taxes" followed by a four-digit year (e.g. 2025).
            if not attr_val:
                return
            val = attr_val.strip()
            val_lower = val.lower()
            # Accept true PDFs or compte-taxes endpoints
            if ".pdf" not in val_lower and "compte-taxes" not in val_lower:
                return
            # Check if this link's visible text references a tax account year.
            m_label = re.search(r"compte\s+de\s+taxes\s+(19\d{2}|20\d{2})", text, re.IGNORECASE)
            if not m_label:
                # If the label doesn't specify a year, skip (do not collect
                # previous-year links like "Télécharger une copie").
                return
            try:
                year_candidate = int(m_label.group(1))
            except Exception as exc:
                logger.debug("Could not parse year from PDF label", extra={"label": text}, exc_info=exc)
                return
            # Only collect the current-year PDF (green button).  Current year
            # refers to the year extracted from the label.  Previous years
            # should be ignored.
            current_year = year_candidate
            url = urljoin(self.BASE_URL, val)
            if url in self.seen_pdf_urls:
                return
            self.seen_pdf_urls.add(url)
            pdf_links.append({"year": current_year, "url": url})

        # Process anchors
        for a in soup.find_all("a"):
            href = a.get("href")
            txt = a.get_text() or ""
            if href:
                maybe_add_pdf(href, txt)
            # Also check data attributes
            for attr_val in a.attrs.values():
                if isinstance(attr_val, str):
                    maybe_add_pdf(attr_val, txt)

        # Process buttons (some download links are implemented as buttons with data attributes)
        for b in soup.find_all("button"):
            txt = b.get_text() or ""
            for attr_val in b.attrs.values():
                if isinstance(attr_val, str):
                    maybe_add_pdf(attr_val, txt)

        # Remove duplicates within this page (in case the same URL is found in multiple attributes)
        if pdf_links:
            # Unique by URL
            unique_links = {}
            for p in pdf_links:
                unique_links[p["url"]] = p
            pdf_links = list(unique_links.values())
            record["pdf_links"] = pdf_links
            # Select the most recent PDF by year (None treated as -1)
            def year_key(item: Dict[str, Any]) -> int:
                return item["year"] if isinstance(item.get("year"), int) else -1
            most_recent = max(pdf_links, key=year_key)
            record["pdf_most_recent_url"] = most_recent["url"]

        # Record the ingestion date
        record["data_ingested_at"] = date.today().isoformat()

        # Map certain French labels to canonical field names if the canonical
        # fields are absent.  This helps unify the representation across
        # different extraction strategies (definition lists vs. bullet lists).
        label_mapping = {
            "Adresse": "address",
            "Arrondissement": "arrondissement",
            "Numéro de lot": "lot_numbers_text",
            "Numéro de matricule": "matricule_number",
            "Utilisation prédominante": "utilisation_predominante",
            "Numéro d'unité de voisinage": "unite_voisinage_number",
            "Numéro de compte foncier": "compte_foncier_number",
        }
        for fr_label, canonical in label_mapping.items():
            if canonical not in record and fr_label in record:
                record[canonical] = record[fr_label]
                # For lot numbers, derive the list of lot_numbers if not already
                if canonical == "lot_numbers_text" and "lot_numbers" not in record:
                    raw_val = record[fr_label]
                    # Split on whitespace, comma or semicolon
                    candidates = re.split(r"[\s,;]+", raw_val)
                    nums = [c.strip() for c in candidates if c.strip()]
                    if nums:
                        record["lot_numbers"] = nums

        # ------------------------------------------------------------------
        # Fallback extraction using list items.  Some pages structure the
        # evaluation details as bullet lists (<li> elements) rather than
        # definition lists.  Iterate through all <li> elements on the page,
        # ignoring those that refer to past tax account downloads (e.g.
        # "Télécharger une copie") or duplicate content.  Each <li>
        # typically contains a label followed by a value.  If a label is
        # already present in the record and the new value differs, accumulate
        # both values into a list to preserve all data.
        try:
            for li in soup.find_all("li"):
                texts = [t.strip() for t in li.stripped_strings if t.strip()]
                if len(texts) < 2:
                    continue
                label = texts[0].rstrip(":").strip()
                value = " ".join(texts[1:]).strip()
                label_lower = label.lower()
                # Skip tax account download entries
                if "compte de taxes" in label_lower or "télécharger" in label_lower:
                    continue
                # Skip completely empty values
                if not value:
                    continue
                existing = record.get(label)
                if existing is None:
                    record[label] = value
                else:
                    # If existing is a list, append; else create list
                    if isinstance(existing, list):
                        if value not in existing:
                            existing.append(value)
                    else:
                        if value != existing:
                            record[label] = [existing, value]
        except Exception as exc:
            logger.debug(
                "Fallback <li> extraction failed; proceeding without list-derived fields",
                exc_info=exc,
            )

        return record

    def parse_all(self, elements: List[str]) -> List[Dict[str, Any]]:
        """Parse a list of HTML strings into structured records.

        Args:
            elements: List of raw HTML strings returned by the web handler.

        Returns:
            A list of dictionaries representing parsed records.
        """
        results: List[Dict[str, Any]] = []
        for html in elements:
            parsed = self.parse_element(html)
            if parsed:
                results.append(parsed)
        return results
