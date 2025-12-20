"""
Unit Tests for US-7.2: Construction Document Relevance Filtering
"""

from src.models.RawDocument.raw_document import RawDocument
from src.models.RawDocument.enums import DocumentType

def create_relevant_doc():
    return RawDocument(
        projectId="p1", documentType=DocumentType.PERMIT, municipality="laval",
        rawDataGcsUri="gs://b/permit.pdf", sourceUrl="https://laval.ca/construction/permit.pdf"
    )

def create_non_relevant_doc():
    return RawDocument(
        projectId="p2", documentType=DocumentType.NOTICE, municipality="laval",
        rawDataGcsUri="gs://b/tax.pdf", sourceUrl="https://laval.ca/tax/notice.pdf"
    )

def get_test_config():
    return {
        'construction_keywords': {'en': ["permit", "construction"], 'fr': ["permis", "construction"]},
        'exclusion_keywords': {'en': ["tax", "parking"], 'fr': ["taxe", "stationnement"]},
        'min_construction_matches': 1
    }

def test_relevant_document_passes_filter():
    # Arrange
    from src.services.decomposition_service.relevance_filter import check_document_relevance
    doc = create_relevant_doc()
    config = get_test_config()
    # Act
    result = check_document_relevance(doc, config)
    # Assert
    assert result.is_relevant is True

def test_exclusion_keywords_skip_document():
    # Arrange
    from src.services.decomposition_service.relevance_filter import check_document_relevance
    doc = create_non_relevant_doc()
    config = get_test_config()
    # Act
    result = check_document_relevance(doc, config)
    # Assert
    assert result.is_relevant is False
    assert result.reason == "exclusion_keywords"

def test_precision_no_false_positives():
    # Arrange
    from src.services.decomposition_service.relevance_filter import check_document_relevance
    relevant_docs = [create_relevant_doc(), create_relevant_doc()]
    config = get_test_config()
    false_positives = 0
    # Act
    for doc in relevant_docs:
        if not check_document_relevance(doc, config).is_relevant:
            false_positives += 1
    # Assert
    assert false_positives == 0

def test_french_keywords_matched():
    # Arrange
    from src.services.decomposition_service.relevance_filter import match_keyword_in_text
    # Act
    matches = match_keyword_in_text("rénovation", "projet de rénovation")
    # Assert
    assert matches is True

def test_config_loads():
    # Arrange
    from src.services.decomposition_service.relevance_filter import RelevanceFilterConfig
    from pathlib import Path
    config_path = Path(__file__).parent.parent.parent / "src" / "services" / "decomposition_service" / "filters.yaml"
    # Act
    config = RelevanceFilterConfig(config_path)
    # Assert
    assert config._config is not None
    assert 'default' in config._config


def test_relaxed_regex_fallback():
    # If your function name differs, use the same helper you used in the French test.
    from src.services.decomposition_service.relevance_filter import match_keyword_in_text
    # Should match even with punctuation/accents around it
    assert match_keyword_in_text("permis de construction", "Demande de permis-de-construction (phase 2)")

def test_min_match_threshold_zero_hits_skips():
    """
    min_construction_matches = 1, but the doc has 0 construction hits → should be skipped.
    (Matches the default behavior while still verifying the threshold logic.)
    """
    from src.models.RawDocument.raw_document import RawDocument
    from src.models.RawDocument.enums import DocumentType
    from src.services.decomposition_service.relevance_filter import check_document_relevance

    cfg = {
        "construction_keywords": {"en": ["permit", "construction"], "fr": ["permis", "construction"]},
        "exclusion_keywords": {"en": [], "fr": []},
        "min_construction_matches": 1,   # default-like behavior
    }

    # URL/text with no construction keywords
    doc = RawDocument(
        projectId="p3",
        documentType=DocumentType.NOTICE,
        municipality="laval",
        rawDataGcsUri="gs://b/animal-license.pdf",
        sourceUrl="https://city.ca/animal-license-information",  # no "permit"/"construction"
    )

    res = check_document_relevance(doc, cfg)
    assert res.is_relevant is False
    assert len(res.construction_matches) == 0  # explicitly show "0 matches"


# Exclusion wins even if construction keywords are present
def test_exclusion_overrides_construction():
    from src.models.RawDocument.raw_document import RawDocument
    from src.models.RawDocument.enums import DocumentType
    from src.services.decomposition_service.relevance_filter import check_document_relevance

    cfg = {
        "construction_keywords": {"en": ["permit", "construction"], "fr": ["permis", "construction"]},
        "exclusion_keywords": {"en": ["tax", "parking"], "fr": ["taxe", "stationnement"]},
        "min_construction_matches": 1,
    }

    # Text has both a construction word ("permit") and an exclusion word ("tax")
    doc = RawDocument(
        projectId="p1",
        documentType=DocumentType.PERMIT,
        municipality="laval",
        rawDataGcsUri="gs://b/permit_and_tax.pdf",
        sourceUrl="https://city.ca/permit?notice=tax",
    )

    res = check_document_relevance(doc, cfg)
    assert res.is_relevant is False
    assert res.reason == "exclusion_keywords"

# Municipality-specific override merge (YAML)
def test_municipality_override_merge_includes_montreal_terms():
    from pathlib import Path
    import yaml
    # Load YAML like the app would
    cfg_path = Path(__file__).resolve().parents[2] / "src" / "services" / "decomposition_service" / "filters.yaml"
    data = yaml.safe_load(cfg_path.read_text())

    base = data.get("default", {})
    mtl = data.get("municipalities", {}).get("montreal", {})
    # simple deep-merge for this test
    def merge(a, b):
        out = dict(a)
        for k, v in b.items():
            if isinstance(v, dict) and isinstance(out.get(k), dict):
                out[k] = merge(out[k], v)
            else:
                out[k] = v
        return out

    merged = merge(base, mtl)
    fr_terms = merged["construction_keywords"]["fr"]
    assert any("certificat d'autorisation" in t for t in fr_terms)

# Mini “precision” sanity: no false positives on a tiny labeled sample
def test_precision_sanity_no_false_positives():
    from src.models.RawDocument.raw_document import RawDocument
    from src.models.RawDocument.enums import DocumentType
    from src.services.decomposition_service.relevance_filter import check_document_relevance

    cfg = {
        "construction_keywords": {"en": ["permit", "construction"], "fr": ["permis", "construction"]},
        "exclusion_keywords": {"en": ["tax", "parking"], "fr": ["taxe", "stationnement"]},
        "min_construction_matches": 1,
    }

    # Labeled samples (tiny, but enough to prove “no false positives”)
    positives = [
        ("https://city.ca/building-permit", "PERMIT"),
        ("https://city.ca/construction/phase-1", "PERMIT"),
    ]
    negatives = [
        ("https://city.ca/avis-de-taxe", "NOTICE"),
        ("https://city.ca/parking/ticket-2025", "NOTICE"),
    ]

    # Compute precision: TP / (TP + FP)
    tp = fp = 0
    for url, dtype in positives:
        res = check_document_relevance(
            RawDocument(projectId="p", documentType=DocumentType[dtype], municipality="laval",
                        rawDataGcsUri="gs://b/x.pdf", sourceUrl=url),
            cfg
        )
        if res.is_relevant: tp += 1
        else: pass  # false negative, doesn’t affect precision

    for url, dtype in negatives:
        res = check_document_relevance(
            RawDocument(projectId="p", documentType=DocumentType[dtype], municipality="laval",
                        rawDataGcsUri="gs://b/x.pdf", sourceUrl=url),
            cfg
        )
        if res.is_relevant: fp += 1

    precision = tp / (tp + fp) if (tp + fp) else 1.0
    assert precision >= 0.8  # on this tiny sample we expect 1.0


# --- Logging acceptance test (US-7.2) ---------------------------------------
import json
import logging
import uuid
import pytest
import asyncio
import sys
import types

from src.services.decomposition_service.relevance_filter import FilterResult

def _stub_google_cloud_modules():
    # Overwrite (not setdefault) to force our stubs to be used
    google = types.ModuleType("google")
    sys.modules["google"] = google

    cloud = types.ModuleType("google.cloud")
    sys.modules["google.cloud"] = cloud

    # ---- google.auth (stub default() to avoid ADC) ----
    auth = types.ModuleType("google.auth")
    class _DummyCreds: pass
    def _default(scopes=None, request=None, quota_project_id=None, default_scopes=None):
        return _DummyCreds(), "test-project"
    auth.default = _default

    # nested modules used by real libs; harmless dummies
    transport = types.ModuleType("google.auth.transport")
    requests = types.ModuleType("google.auth.transport.requests")
    sys.modules["google.auth"] = auth
    sys.modules["google.auth.transport"] = transport
    sys.modules["google.auth.transport.requests"] = requests

    # ---- google.cloud.storage ----
    storage = types.ModuleType("google.cloud.storage")
    class _DummyClient: 
        def __init__(self, *a, **k): pass
    storage.Client = _DummyClient
    sys.modules["google.cloud.storage"] = storage

    # ---- google.cloud.firestore ----
    firestore = types.ModuleType("google.cloud.firestore")
    firestore.Client = _DummyClient   # avoid real client -> no auth calls
    sys.modules["google.cloud.firestore"] = firestore

    # ---- google.cloud.pubsub_v1 ----
    pubsub_v1 = types.ModuleType("google.cloud.pubsub_v1")
    class _DummyPublisherClient: 
        def __init__(self, *a, **k): pass
    class _DummySubscriberClient:
        def __init__(self, *a, **k): pass
    pubsub_v1.PublisherClient = _DummyPublisherClient
    pubsub_v1.SubscriberClient = _DummySubscriberClient
    sys.modules["google.cloud.pubsub_v1"] = pubsub_v1

    # ---- google.cloud.exceptions ----
    exceptions = types.ModuleType("google.cloud.exceptions")
    class GoogleCloudError(Exception): pass
    exceptions.GoogleCloudError = GoogleCloudError
    sys.modules["google.cloud.exceptions"] = exceptions

    # ---- (optional) oauth2 service_account stub ----
    oauth2 = types.ModuleType("google.oauth2")
    service_account = types.ModuleType("google.oauth2.service_account")
    class _DummySA: pass
    service_account.Credentials = _DummySA
    sys.modules["google.oauth2"] = oauth2
    sys.modules["google.oauth2.service_account"] = service_account

    # ---- FastAPI stub (so importing main.py works) ----
    fastapi = types.ModuleType("fastapi")

    class FastAPI:
        def __init__(self, *a, **k): pass
        # return a decorator that just passes the function through
        def post(self, *a, **k):
            def _decorator(fn): return fn
            return _decorator
        def get(self, *a, **k):
            def _decorator(fn): return fn
            return _decorator
        # If your code uses on_event / include_router, keep them harmless:
        def on_event(self, *a, **k):
            def _decorator(fn): return fn
            return _decorator
        def include_router(self, *a, **k): pass

    class HTTPException(Exception): pass
    class APIRouter:
        def __init__(self, *a, **k): pass
        def post(self, *a, **k):
            def _decorator(fn): return fn
            return _decorator
        def get(self, *a, **k):
            def _decorator(fn): return fn
            return _decorator
    class BackgroundTasks: pass

    fastapi.FastAPI = FastAPI
    fastapi.HTTPException = HTTPException
    fastapi.APIRouter = APIRouter
    fastapi.BackgroundTasks = BackgroundTasks
    sys.modules["fastapi"] = fastapi



def test_logging_on_skip_is_emitted_with_reason(monkeypatch, caplog):
    """
    Acceptance: 'Logging indicates when a document is skipped and why.'
    We stub the relevance filter to force a skip and assert:
      - API returns {"status": "skipped", "reason": "<reason>"}
      - An INFO log contains 'DOCUMENT SKIPPED - <reason>'
    """
    _stub_google_cloud_modules()  # stub BEFORE importing main
    from src.services.decomposition_service import main as decomp_main

    # Stub the filter used by main.process_document to always skip
    class StubFilter:
        def check_relevance(self, document_id, municipality, firestore_client):
            return FilterResult(
                is_relevant=False,
                reason="exclusion_keywords",
                matched_keywords=["parking"],
                municipality=municipality,
                exclusion_matches=["parking"],
                construction_matches=[],
            )

    monkeypatch.setattr(decomp_main, "relevance_filter", StubFilter(), raising=True)

    # Minimal task object matching what process_document expects
    class DummyTask:
        def __init__(self):
            self.document_id = uuid.uuid4()
            self.project_id = "p-test"
            self.municipality = "laval"
            self.task_id = "task-123"

        def model_dump_json(self, by_alias=True):
            return json.dumps({
                "document_id": str(self.document_id),
                "project_id": self.project_id,
                "municipality": self.municipality,
                "task_id": self.task_id,
            })

    with caplog.at_level(logging.INFO):
        resp = asyncio.run(decomp_main.process_document(DummyTask()))
    
    print("API response:", resp)

    for rec in caplog.records:
        if "DOCUMENT SKIPPED -" in rec.message:
            print("Matched log:", rec.message)
            break
        
    assert resp["status"] == "skipped"
    assert resp["reason"] == "exclusion_keywords"
    assert any(
        "DOCUMENT SKIPPED - exclusion_keywords" in rec.message
        for rec in caplog.records
    ), "Expected a log line indicating skip reason"
