#!/usr/bin/env python3
"""
Labeled-set precision demo for US-7.2.
Runs the real relevance filter with YAML config (incl. municipality overrides)
on a larger human-labeled set. Prints precision/recall/F1/accuracy and a
confusion matrix. Asserts precision >= 0.80.

Run from repo root:
    PYTHONPATH=. python tests/demo_us_7_2_labeled_set_precision.py
"""

from src.models.RawDocument.raw_document import RawDocument
from src.models.RawDocument.enums import DocumentType
from src.services.decomposition_service.relevance_filter import check_document_relevance, get_filter_config

def print_summary(report):
    counts = report["counts"]
    m = report["metrics"]
    true_positives  = counts["tp"]
    false_positives = counts["fp"]
    true_negatives  = counts["tn"]
    false_negatives = counts["fn"]
    total = true_positives + false_positives + true_negatives + false_negatives

    # Aligned rows: fixed label + number columns, common bar scale
    def _bar(n, max_n, width=40):
        if max_n <= 0:
            return ""
        blocks = int(round(n * width / max_n))
        return "█" * max(blocks, 1)

    rows = [
        ("True Positives",  "correctly kept as relevant",      true_positives),
        ("False Positives", "incorrectly kept as relevant",    false_positives),
        ("True Negatives",  "correctly skipped",               true_negatives),
        ("False Negatives", "missed relevant docs",            false_negatives),
    ]

    label_texts = [f"{name} ({expl})" for name, expl, _ in rows]
    label_w = max(len(s) for s in label_texts)   # width of left text column
    num_w   = 4                                   # width of the number column
    max_n   = max(v for _, _, v in rows)          # bar scale

    print("\n" + "=" * 60)
    print(" Relevance Filter — Evaluation Summary")
    print("=" * 60)
    print(f" Total samples: {total}")
    for (name, expl, val), text in zip(rows, label_texts):
        print(f"  {text:<{label_w}} : {val:>{num_w}d}  {_bar(val, max_n)}")


    print("\n Metrics")
    print(" -------")
    print(f"  Precision : {m['precision']:.4f}  ({m['precision']*100:.1f}%)  -> Of the docs we kept, how many were truly relevant.")
    print(f"  Recall    : {m['recall']:.4f}  ({m['recall']*100:.1f}%)  -> Of all truly relevant docs, how many we actually kept.")
    print(f"  F1 Score  : {m['f1']:.4f}        -> Balance between precision and recall.")
    print(f"  Accuracy  : {m['accuracy']:.4f}  ({m['accuracy']*100:.1f}%)  -> Overall correctness across all samples.")

    print("\n Confusion Matrix (Ground Truth × Prediction)")
    print(" -------------------------------------------")
    print("                       Predicted Relevant   Predicted Skip")
    print(f"   Actually Relevant         {true_positives:3d}                  {false_negatives:3d}")
    print(f"   Actually Irrelevant       {false_positives:3d}                  {true_negatives:3d}")
    print("=" * 60)

    # One-liner takeaways (edit as you like)
    print("\n Takeaways")
    print(" ---------")
    print(" • High precision means we rarely keep non-construction docs (few false positives).")
    print(" • Lower recall means we’re missing some construction docs (false negatives).")
    print(" • To raise recall without hurting precision, expand construction keywords in filters.yaml,")
    print("   especially for common edge terms (e.g., 'blueprint', 'site plan', 'zoning') and city-specific variants.")





def main():
    # expected=True => construction/relevant
    # expected=False => non-construction/skip
    
    labeled = [
        # --- Clear POSITIVES (EN/FR construction terms present) ---
        ("laval", "building permit application", "PERMIT", True),
        ("laval", "construction permit phase 2", "PERMIT", True),
        ("laval", "site plan review & architectural blueprint", "PERMIT", True),
        ("laval", "zoning variance for development project", "PERMIT", True),
        ("laval", "renovation and expansion project", "PERMIT", True),
        ("laval", "infrastructure upgrade for subdivision", "PERMIT", True),
        ("montreal", "certificat d'autorisation pour travaux", "PERMIT", True),
        ("montreal", "permis de construction — agrandissement", "PERMIT", True),
        ("montreal", "plan d'architecture et plan de site", "PERMIT", True),
        ("montreal", "projet immobilier: développement immobilier", "PERMIT", True),
        ("laval", "real estate development subdivision land development", "PERMIT", True),
        ("laval", "architectural drawing; blueprint attached", "PERMIT", True),
        ("laval", "demolition request for old building", "PERMIT", True),
        ("laval", "building permit: residential project", "PERMIT", True),
        ("montreal", "certificat d'autorisation démolition", "PERMIT", True),
        ("montreal", "permis de bâtiment rénovation", "PERMIT", True),
        ("montreal", "zonage et plan de site", "PERMIT", True),
        ("laval", "development permit for real estate project", "PERMIT", True),
        ("laval", "site plan for building expansion", "PERMIT", True),
        ("laval", "architectural review for renovation", "PERMIT", True),
        ("laval", "construction of new infrastructure", "PERMIT", True),
        ("montreal", "permis de développement pour lotissement", "PERMIT", True),
        ("montreal", "certificat d'autorisation agrandissement bâtiment", "PERMIT", True),
        ("laval", "blueprint and zoning checklist", "PERMIT", True),
        ("laval", "development application: building permit", "PERMIT", True),
        ("montreal", "permis de construction et plan d'architecture", "PERMIT", True),
        ("montreal", "projet de rénovation résidentielle", "PERMIT", True),
        ("laval", "construction blueprint package", "PERMIT", True),
        ("laval", "site plan + zoning approval", "PERMIT", True),
        ("laval", "infrastructure construction — new project", "PERMIT", True),

        # --- Edge POSITIVES with numbers/punctuation stuck to keywords (regex-ish) ---
        ("laval", "1plan d'architecture soumis", "PERMIT", True),
        ("laval", "blueprint2 ready for review", "PERMIT", True),
        ("montreal", "3permis de construction déposés", "PERMIT", True),
        ("montreal", "certificat d'autorisation#2025", "PERMIT", True),
        ("laval", "zoning2025 variance request", "PERMIT", True),
        ("laval", "site-plan_v2 final", "PERMIT", True),
        ("montreal", "PERMIS-DE-CONSTRUCTION urgent", "PERMIT", True),
        ("laval", "building-permit_v3", "PERMIT", True),
        ("laval", "renovation(phase-1)", "PERMIT", True),
        ("montreal", "plan_de_site-01", "PERMIT", True),

        # --- Mixed-case/accents POSITIVES ---
        ("laval", "BUILDING Permit and Architectural review", "PERMIT", True),
        ("montreal", "Certificat D'AUTORISATION – rénovation", "PERMIT", True),
        ("montreal", "Plan d’architecture – mise à jour", "PERMIT", True),
        ("laval", "Development PERMIT + Site Plan", "PERMIT", True),
        ("montreal", "permis de BÂTIMENT (agrandissement)", "PERMIT", True),

        # --- Clear NEGATIVES (no construction keywords) ---
        ("laval", "water bill statement", "NOTICE", False),
        ("laval", "garbage collection schedule", "NOTICE", False),
        ("laval", "utility outage information", "NOTICE", False),
        ("laval", "business license renewal", "NOTICE", False),
        ("laval", "property tax assessment", "NOTICE", False),
        ("montreal", "facture d'eau et service public", "NOTICE", False),
        ("montreal", "déchets et ordures — calendrier", "NOTICE", False),
        ("montreal", "service public: facture mensuelle", "NOTICE", False),
        ("laval", "annual community newsletter", "NOTICE", False),
        ("montreal", "avis public: changement d'horaires", "NOTICE", False),
        ("laval", "holiday events schedule", "NOTICE", False),
        ("montreal", "flyer: programme culturel", "NOTICE", False),

        # --- NEGATIVES (exclusion keywords only) ---
        ("laval", "parking violation appeal", "NOTICE", False),
        ("laval", "tax bill 2025 – second notice", "NOTICE", False),
        ("laval", "ticket for parking near hydrant", "NOTICE", False),
        ("montreal", "amende et pénalité de stationnement", "NOTICE", False),
        ("montreal", "avis de taxe et facture de taxe", "NOTICE", False),
        ("laval", "utility penalty notice for late payment", "NOTICE", False),
        ("montreal", "taxe foncière — évaluation annuelle", "NOTICE", False),
        ("laval", "garbage fee penalty", "NOTICE", False),
        ("montreal", "contravention de stationnement (ticket)", "NOTICE", False),
        ("laval", "water bill penalty", "NOTICE", False),

        # --- Exclusion WINS (PERMIT-looking text but should SKIP due to exclusions) ---
        ("laval", "building permit tax notice", "PERMIT", False),
        ("laval", "site plan parking violation", "PERMIT", False),
        ("laval", "architectural blueprint property tax assessment", "PERMIT", False),
        ("montreal", "permis de construction ticket de stationnement", "PERMIT", False),
        ("montreal", "certificat d'autorisation facture d'eau", "PERMIT", False),
        ("montreal", "plan d'architecture amende stationnement", "PERMIT", False),
        ("laval", "zoning change utility penalty", "PERMIT", False),
        ("laval", "construction permit garbage fee", "PERMIT", False),
        ("montreal", "permis de bâtiment avis de taxe", "PERMIT", False),
        ("montreal", "développement immobilier – contravention", "PERMIT", False),

        # --- Tricky NEGATIVES (words that look close but not in list) ---
        ("laval", "architecture meetup (no plans)", "NOTICE", False),
        ("laval", "constructive feedback workshop", "NOTICE", False),
        ("montreal", "bâtir une communauté (événement)", "NOTICE", False),
        ("montreal", "projet scolaire (non-bâtiment)", "NOTICE", False),
        ("laval", "blue-ish print festival", "NOTICE", False),

        # --- Zero-hit NEGATIVES even with PERMIT dtype (should still skip) ---
        ("laval", "community picnic flyer", "PERMIT", False),
        ("montreal", "festival de musique locale", "PERMIT", False),
        ("laval", "sports league registration", "PERMIT", False),
        ("montreal", "programme jeunesse 2025", "PERMIT", False),
        ("laval", "city newsletter: events", "PERMIT", False),

        # --- Barely-POSITIVES with single keyword hit (min=1 satisfied) ---
        ("laval", "blueprint submitted", "PERMIT", True),
        ("montreal", "rénovation confirmée", "PERMIT", True),
        ("laval", "zoning approved", "PERMIT", True),
        ("montreal", "infrastructure plan", "PERMIT", True),
        ("laval", "demolition scheduled", "PERMIT", True),

        # --- Municipality override POSITIVES (Montreal terms) ---
        ("montreal", "certificat d'autorisation pour agrandissement", "PERMIT", True),
        ("montreal", "permis de bâtiment: certificat d'autorisation joint", "PERMIT", True),
        ("montreal", "demande de certificat d'autorisation – rénovation", "PERMIT", True),
        ("montreal", "certificat d'autorisation (lotissement)", "PERMIT", True),
        ("montreal", "certificat d'autorisation et plan de site", "PERMIT", True),

        # --- Laval override POSITIVES (real estate terms) ---
        ("laval", "real estate development permit", "PERMIT", True),
        ("laval", "subdivision land development request", "PERMIT", True),
        ("laval", "land development blueprint", "PERMIT", True),
        ("laval", "real estate project site plan", "PERMIT", True),
        ("laval", "subdivision infrastructure plan", "PERMIT", True),

        # --- Regex-ish edge POSITIVES (numbers/underscores/hyphens) ---
        ("laval", "plan_d'architecture1 final", "PERMIT", True),
        ("montreal", "permis-de-construction_v2", "PERMIT", True),
        ("laval", "blueprint-2026_revA", "PERMIT", True),
        ("montreal", "plan-de-site#3", "PERMIT", True),
        ("laval", "RENOVATION-01 checklist", "PERMIT", True),

        # --- Exclusion WINS with numbers attached (still skip) ---
        ("laval", "building-permit tax2 notice", "PERMIT", False),
        ("montreal", "certificat d'autorisation ticket3 stationnement", "PERMIT", False),
        ("laval", "zoning1 parking2 violation", "PERMIT", False),
        ("montreal", "plan_de_site amende5", "PERMIT", False),
        ("laval", "infrastructure penalty9", "PERMIT", False),

        # --- Clear NEGATIVES (misc admin) ---
        ("laval", "library card renewal", "NOTICE", False),
        ("montreal", "school enrollment notice", "NOTICE", False),
        ("laval", "dog license renewal", "NOTICE", False),
        ("montreal", "community survey results", "NOTICE", False),
        ("laval", "public transit schedule update", "NOTICE", False),

        # --- POSITIVES (English multi-terms) ---
        ("laval", "building permit and site plan package", "PERMIT", True),
        ("laval", "zoning & development permit application", "PERMIT", True),
        ("montreal", "architectural blueprint with demolition plan", "PERMIT", True),
        ("montreal", "certificate of authorization for construction", "PERMIT", True),
        ("laval", "infrastructure expansion project blueprint", "PERMIT", True),

        # --- POSITIVES (French multi-terms) ---
        ("montreal", "permis de développement et plan d'architecture", "PERMIT", True),
        ("montreal", "rénovation: plan de site et zonage", "PERMIT", True),
        ("laval", "agrandissement bâtiment – permis de bâtiment", "PERMIT", True),
        ("laval", "démolition et reconstruction: plan d'architecture", "PERMIT", True),
        ("montreal", "projet immobilier – certificat d'autorisation joint", "PERMIT", True),

        # POSITIVES (URLs)
        ("laval",    "https://city.ca/construction/building-permit-application",              "PERMIT", True),
        ("laval",    "https://laval.ca/dev/site-plan/architectural-blueprint2.pdf",           "PERMIT", True),
        ("laval",    "https://laval.ca/zoning/variance/new-project",                           "PERMIT", True),
        ("montreal", "https://montreal.qc.ca/urbanisme/permis-de-construction-lotissement",   "PERMIT", True),
        ("montreal", "https://montreal.qc.ca/autorisation/certificat-autorisation-travaux",   "PERMIT", True),
        ("montreal", "https://ville.montreal.ca/plan/plan-de-site_1plan_v3",                   "PERMIT", True),
        ("laval",    "https://city.ca/infra/renovation/expansion/blueprint-2026_revA",         "PERMIT", True),
        ("laval",    "https://city.ca/projects/real-estate-development/subdivision-permit",    "PERMIT", True),
        ("montreal", "https://montreal.ca/batiment/permis-de-batiment?type=renovation",        "PERMIT", True),

        # NEGATIVES (URLs – exclusions / non-construction)
        ("laval",    "https://city.ca/finance/property-tax-bill-2025",                        "NOTICE", False),
        ("laval",    "https://laval.ca/parking/ticket/violation-12345",                       "NOTICE", False),
        ("montreal", "https://montreal.qc.ca/services/facture-eau-mensuelle",                 "NOTICE", False),
        ("montreal", "https://montreal.ca/avis-public/horaire-dechets-ordures",               "NOTICE", False),
        ("laval",    "https://city.ca/utilities/water-bill/late-penalty",                     "NOTICE", False),

        # EXCLUSION WINS (URLs that look permit-ish but should SKIP)
        ("laval",    "https://city.ca/construction/building-permit?notice=tax",               "PERMIT", False),
        ("montreal", "https://montreal.qc.ca/urbanisme/permis-de-construction?ticket=parking","PERMIT", False),
        ("laval",    "https://laval.ca/dev/site-plan/parking-violation",                      "PERMIT", False),
        ("montreal", "https://montreal.ca/autorisation/certificat-autorisation/facture-eau",  "PERMIT", False),
    ]


    tp = fp = tn = fn = 0
    rows = []
    for muni, text, dtype, expected in labeled:
        cfg = get_filter_config(muni)
        doc = RawDocument(
            projectId="demo",
            documentType=DocumentType[dtype],
            municipality=muni,
            rawDataGcsUri=f"gs://demo/{text}.pdf",
            sourceUrl=text,
        )
        res = check_document_relevance(doc, cfg)
        pred = bool(res.is_relevant)

        if   pred and expected:  tp += 1
        elif pred and not expected: fp += 1
        elif not pred and not expected: tn += 1
        else: fn += 1

        rows.append({
            "municipality": muni,
            "text": text,
            "dtype": dtype,
            "expected_relevant": expected,
            "pred_relevant": pred,
            "reason": res.reason,
            "construction_matches": res.construction_matches,
            "exclusion_matches": res.exclusion_matches,
        })

    precision = tp / (tp + fp) if (tp + fp) else 1.0
    recall    = tp / (tp + fn) if (tp + fn) else 1.0
    f1        = (2*precision*recall)/(precision+recall) if (precision+recall) else 0.0
    accuracy  = (tp + tn) / (tp + tn + fp + fn) if (tp + tn + fp + fn) else 1.0

    report = {
        "counts": {"tp": tp, "fp": fp, "tn": tn, "fn": fn},
        "metrics": {
            "precision": round(precision, 4),
            "recall": round(recall, 4),
            "f1": round(f1, 4),
            "accuracy": round(accuracy, 4),
        },
        "confusion_matrix": [
            ["",        "Pred+ (rel)", "Pred- (skip)"],
            ["True+ ",  tp,             fn],
            ["True- ",  fp,             tn],
        ],
        "samples": rows,
        "note": "Goal: precision >= 0.80 on this expanded labeled set.",
    }

    print_summary(report)
    assert precision >= 0.80, f"Precision {precision:.3f} < 0.80 on this labeled set"


if __name__ == "__main__":
    main()
