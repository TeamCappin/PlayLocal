import gzip
from datetime import datetime, timezone
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import MagicMock

import pytest
from google.api_core import exceptions as google_exceptions

from services.scraper_service.lib.storage import gcs
from services.scraper_service.lib.storage.gcs import StorageClient


def _make_client(**kwargs) -> StorageClient:
    client = StorageClient(bucket_name="test-bucket", client=MagicMock(), **kwargs)
    fake_bucket = MagicMock()
    fake_blob = MagicMock()
    fake_blob.chunk_size = None
    fake_bucket.blob.return_value = fake_blob
    client._bucket = fake_bucket
    return client


def test_upload_file_simple_sets_metadata(tmp_path):
    client = _make_client()
    blob = client._get_bucket().blob("unused")
    blob.reset_mock()
    source = tmp_path / "doc.txt"
    source.write_text("content")

    uri = client.upload_file(
        source,
        object_name="objects/doc.txt",
        content_type="text/plain",
        metadata={"foo": "bar"},
        resumable=False,
    )

    assert uri == "gs://test-bucket/objects/doc.txt"
    blob.upload_from_filename.assert_called_once_with(
        source.as_posix(),
        content_type="text/plain",
        timeout=None,
        if_generation_match=None,
        retry=None,
    )
    assert blob.metadata == {"foo": "bar"}
    assert blob.chunk_size is None


def test_upload_file_retries_on_transient_errors(tmp_path, monkeypatch):
    client = _make_client(max_attempts=3, base_delay=0.01)
    blob = client._get_bucket().blob("unused")
    blob.upload_from_filename.side_effect = [
        google_exceptions.TooManyRequests("429"),
        None,
    ]
    source = tmp_path / "data.bin"
    source.write_bytes(b"x")

    monkeypatch.setattr(gcs.time, "sleep", lambda *_: None)

    uri = client.upload_file(source, object_name="obj.bin")

    assert uri.startswith("gs://test-bucket/")
    assert blob.upload_from_filename.call_count == 2


def test_upload_file_resumable_threshold(tmp_path):
    client = _make_client(resumable_threshold=1, resumable_chunk_size=256 * 1024)
    blob = client._get_bucket().blob("unused")
    blob.chunk_size = "initial"
    source = tmp_path / "big.bin"
    source.write_bytes(b"abcdef")

    def upload_side_effect(filename, **kwargs):
        assert blob.chunk_size == 256 * 1024
        return None

    blob.upload_from_filename.side_effect = upload_side_effect

    client.upload_file(source, object_name="obj.bin")
    assert blob.chunk_size == "initial"


def test_upload_file_gzip_for_text(tmp_path):
    client = _make_client(enable_gzip_for_text=True)
    blob = client._get_bucket().blob("unused")
    blob.chunk_size = None
    captured = {}

    def capture_upload(filename, **kwargs):
        captured["name"] = filename
        with gzip.open(filename, "rt") as fh:
            assert fh.read() == "a,b\n1,2\n"
        return None

    blob.upload_from_filename.side_effect = capture_upload

    source = tmp_path / "data.csv"
    source.write_text("a,b\n1,2\n")

    client.upload_file(source, object_name="obj.csv", content_type="text/csv", resumable=False)

    uploaded_path = Path(captured["name"])
    assert uploaded_path.suffix == ".gz"
    assert blob.content_encoding == "gzip"
    assert not uploaded_path.exists()


def test_default_object_name(monkeypatch):
    fixed_uuid = SimpleNamespace(hex="cafebabecafebabe")
    monkeypatch.setattr(gcs.uuid, "uuid4", lambda: fixed_uuid)

    class FixedDateTime:
        @classmethod
        def now(cls, tz=None):
            assert tz == timezone.utc
            return datetime(2024, 1, 2, tzinfo=timezone.utc)

    monkeypatch.setattr(gcs, "datetime", FixedDateTime)

    result = StorageClient._default_object_name(Path("Some Document.PDF"))
    assert result == "misc/2024/01/02/cafebabe_some_document.pdf"


def test_build_pdf_object_name_with_project(monkeypatch):
    fixed_uuid = SimpleNamespace(hex="1234567890abcdef")
    monkeypatch.setattr(gcs.uuid, "uuid4", lambda: fixed_uuid)

    class FixedDateTime:
        @classmethod
        def now(cls, tz=None):
            assert tz == timezone.utc
            return datetime(2024, 3, 15, tzinfo=timezone.utc)

    monkeypatch.setattr(gcs, "datetime", FixedDateTime)

    path = Path("Permit.pdf")
    result = StorageClient._build_pdf_object_name(path, muni_slug="montreal", project_id="Project Alpha")
    assert result == "montreal/project-alpha/2024/03/15/12345678_permit.pdf"


def test_upload_pdf_adds_metadata(monkeypatch, tmp_path):
    client = _make_client()
    pdf_path = tmp_path / "permit.pdf"
    pdf_path.write_bytes(b"%PDF-1.4 content")

    captured_kwargs = {}

    def fake_upload(_, **kwargs):
        captured_kwargs.update(kwargs)
        return "gs://test-bucket/result"

    monkeypatch.setattr(client, "upload_file", fake_upload)
    monkeypatch.setattr(client, "_build_pdf_object_name", lambda *args, **kwargs: "custom/object")

    uri = client.upload_pdf(
        municipality_name="Quebec City",
        scraped_file=pdf_path,
        project_id="Project 42",
        metadata={"source": "scraper", "projectId": "existing"},
    )

    assert uri == "gs://test-bucket/result"
    assert captured_kwargs["object_name"] == "custom/object"
    assert captured_kwargs["metadata"]["municipality"] == "quebec-city"
    assert captured_kwargs["metadata"]["projectId"] == "existing"
    assert captured_kwargs["metadata"]["source"] == "scraper"
    assert captured_kwargs["content_type"] == "application/pdf"
