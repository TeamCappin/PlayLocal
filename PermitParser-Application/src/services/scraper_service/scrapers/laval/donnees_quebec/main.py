"""
Scraper for Données Québec datasets published by Laval.

This script queries the CKAN API on donneesquebec.ca to list
datasets and downloads selected resources (e.g. permits, addresses,
roadworks).  It writes dataset metadata and resource details to the
configured sink and uploads downloaded files to GCS.
Currently it emits static examples.
"""

from __future__ import annotations

import argparse
import json
import logging
import os
from datetime import date
from typing import Dict, List

from lib.storage.sinks import get_sink
import requests
from lib.storage.storage import StorageClient
from lib.logging_conf import configure_logging


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Données Québec dataset fetcher")
    parser.add_argument(
        "--dataset",
        default="all",
        help="Which dataset to fetch (e.g. permits, roadworks, addresses, buildings, zoning). Use 'all' to fetch all datasets."
    )
    return parser.parse_args()


def fetch_open_data(dataset: str) -> List[Dict[str, object]]:
    """
    Fetch metadata for one or all datasets from the Données Québec CKAN API.

    Parameters
    ----------
    dataset: str
        The dataset short name to fetch (e.g. ``permits`` or ``addresses``).
        If set to ``all``, this function will return metadata for all
        datasets published by ``ville-de-laval``.

    Returns
    -------
    list of dict
        Each dict contains ``dataset_name``, ``resource_name``,
        ``resource_url``, ``file_type``, ``last_modified`` and
        ``data_ingested_at``.
    """
    today = date.today().isoformat()
    base_search = "https://www.donneesquebec.ca/recherche/api/3/action/package_search"
    base_show = "https://www.donneesquebec.ca/recherche/api/3/action/package_show"
    try:
        resp = requests.get(base_search, params={"q": "organization:ville-de-laval", "rows": 1000}, timeout=30)
        resp.raise_for_status()
        search_data = resp.json()
    except Exception as e:
        logging.warning(f"Failed to search datasets: {e}")
        return []
    packages = search_data.get("result", {}).get("results", [])
    rows: List[Dict[str, object]] = []
    for pkg in packages:
        pkg_name = pkg.get("name")
        # Filter by dataset parameter if not 'all'
        if dataset != "all" and dataset.lower() not in pkg_name.lower():
            continue
        try:
            show_resp = requests.get(base_show, params={"id": pkg_name}, timeout=30)
            show_resp.raise_for_status()
            pkg_data = show_resp.json().get("result", {})
        except Exception as e:
            logging.warning(f"Failed to fetch dataset {pkg_name}: {e}")
            continue
        for res in pkg_data.get("resources", []):
            file_type = (res.get("format") or "").lower()
            resource_name = res.get("name") or res.get("description") or ""
            resource_url = res.get("url")
            last_modified = res.get("last_modified") or res.get("created") or today
            rows.append(
                {
                    "dataset_name": pkg_name,
                    "resource_name": resource_name,
                    "resource_url": resource_url,
                    "file_type": file_type,
                    "last_modified": last_modified,
                    "data_ingested_at": today,
                }
            )
    return rows


def main() -> None:
    configure_logging()
    args = parse_args()
    sink = get_sink()
    bucket_name = os.environ.get("GCS_OPEN_BUCKET") or os.environ.get("GCS_BUCKET")
    storage = StorageClient(bucket_name)
    rows = fetch_open_data(args.dataset)
    sink.write_rows("open_data_raw", rows)


if __name__ == "__main__":
    main()