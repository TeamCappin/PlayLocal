#!/usr/bin/env python3
"""
Demo script that reuses the same helpers our unit tests use to show acceptance criteria.

Run from repo root:
    PYTHONPATH=. python tests/demo_us_7_2_relevance_filter.py
"""

import json

# Unit-test helpers you already have
from tests.unit.test_us_7_2_relevance_filters import (
    create_relevant_doc,
    create_non_relevant_doc,
    get_test_config,
)

# Core functions under test
from src.services.decomposition_service.relevance_filter import (
    check_document_relevance,
    match_keyword_in_text,
)

def demo_construction_keywords_pass():
    """Documents with construction keywords -> processed normally"""
    doc = create_relevant_doc()
    cfg = get_test_config()
    res = check_document_relevance(doc, cfg)
    return {
        "acceptance": "construction keywords -> processed",
        "is_relevant": res.is_relevant,
        "reason": res.reason,
        "construction_matches": res.construction_matches,
        "exclusion_matches": res.exclusion_matches,
    }

def demo_exclusion_keywords_skip():
    """Documents with exclusion keywords -> skipped"""
    doc = create_non_relevant_doc()
    cfg = get_test_config()
    res = check_document_relevance(doc, cfg)
    return {
        "acceptance": "exclusion keywords -> skipped",
        "is_relevant": res.is_relevant,
        "reason": res.reason,
        "construction_matches": res.construction_matches,
        "exclusion_matches": res.exclusion_matches,
    }

def demo_french_keyword_support():
    """Support French keywords"""
    term = "rénovation"
    text = "projet de rénovation d'un bâtiment existant"
    ok = match_keyword_in_text(term, text)
    return {"acceptance": "French keyword recognized", "term": term, "matched": ok}


def demo_run_unit_test_min_zero_hits():
    """
    Calls the actual unit test function:
      test_min_match_threshold_zero_hits_skips
    If it raises AssertionError, we mark it as failed; otherwise it's passed.
    """
    try:
        # Import the unit test function and execute it.
        from tests.unit.test_us_7_2_relevance_filters import (
            test_min_match_threshold_zero_hits_skips,
        )
        test_min_match_threshold_zero_hits_skips()
        return {"acceptance": "min=1 but zero hits -> skipped", "unit_test": "passed"}
    except AssertionError as e:
        return {"acceptance": "min=1 but zero hits -> skipped", "unit_test": "FAILED", "error": str(e)}
    except ModuleNotFoundError as e:
        # If the extra test file isn't added yet
        return {"acceptance": "min=1 but zero hits -> skipped", "unit_test": "NOT_FOUND", "hint": "Add tests/unit/test_us_7_2_relevance_filters.py"}

def demo_run_unit_test_exclusion_overrides():
    """Run the actual unit test: test_exclusion_overrides_construction"""
    try:
        from tests.unit.test_us_7_2_relevance_filters import test_exclusion_overrides_construction
        test_exclusion_overrides_construction()
        return {"acceptance": "exclusion wins over construction", "unit_test": "passed"}
    except AssertionError as e:
        return {"acceptance": "exclusion wins over construction", "unit_test": "FAILED", "error": str(e)}
    except ModuleNotFoundError:
        return {"acceptance": "exclusion wins over construction", "unit_test": "NOT_FOUND"}

def demo_run_unit_test_precision_sanity():
    """Run the actual unit test: test_precision_sanity_no_false_positives"""
    try:
        from tests.unit.test_us_7_2_relevance_filters import test_precision_sanity_no_false_positives
        test_precision_sanity_no_false_positives()
        return {"acceptance": "precision sanity (tiny set)", "unit_test": "passed"}
    except AssertionError as e:
        return {"acceptance": "precision sanity (tiny set)", "unit_test": "FAILED", "error": str(e)}
    except ModuleNotFoundError:
        return {"acceptance": "precision sanity (tiny set)", "unit_test": "NOT_FOUND"}

def _run_logging_acceptance_test():
    import pytest
    print("\n[Demo] Running logging acceptance test…")
    code = pytest.main([
        "-q", "-s",
        "tests/unit/test_us_7_2_relevance_filters.py::test_logging_on_skip_is_emitted_with_reason",
    ])
    print("[Demo] Logging test:", "PASSED" if code == 0 else "FAILED")


def main():
    results = {
        "construction_keywords_pass": demo_construction_keywords_pass(),
        "exclusion_keywords_skip": demo_exclusion_keywords_skip(),
        "french_keyword_support": demo_french_keyword_support(),
        "min_matches_zero_hits_unit_test": demo_run_unit_test_min_zero_hits(),
        "exclusion_overrides_construction_unit_test": demo_run_unit_test_exclusion_overrides(),
        "precision_sanity_unit_test": demo_run_unit_test_precision_sanity(),
        "notes": [
            "This demo calls the REAL unit test helpers and functions.",
            "Run with: PYTHONPATH=. python tests/demo_us_7_2_relevance_filter.py",
        ],
    }
    _run_logging_acceptance_test()

    print(json.dumps(results, ensure_ascii=False, indent=2))

if __name__ == "__main__":
    main()
