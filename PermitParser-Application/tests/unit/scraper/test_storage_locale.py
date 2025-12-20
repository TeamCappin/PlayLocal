import json
import hashlib
import pytest
from services.scraper_service.lib.storage import local as storage


@pytest.fixture
def sample_docs():
    return [
        {"id": 1, "title": "First"},
        {"id": 2, "title": "Second"},
    ]

def test_save_to_file_jsonl(tmp_path, sample_docs, monkeypatch):
    monkeypatch.setattr(storage, "DATA_DIR", tmp_path)

    output = storage.save_to_file(
        sample_docs, scraper_name="council", municipality="laval", format="jsonl"
    )

    assert output.exists()
    assert output.suffix == ".jsonl"

    assert output.parent.name == "council"
    assert output.parent.parent.name == "laval"

    content = output.read_text(encoding="utf-8")
    lines = content.splitlines()
    parsed = [json.loads(line) for line in lines]
    assert parsed == sample_docs

    assert content.endswith("\n")
    assert not content.endswith("\n\n")

def test_save_to_file_json(tmp_path, sample_docs, monkeypatch):
    monkeypatch.setattr(storage, "DATA_DIR", tmp_path)

    output = storage.save_to_file(
        sample_docs, scraper_name="council", municipality="laval", format="json"
    )

    assert output.exists()
    data = json.loads(output.read_text(encoding="utf-8"))
    assert isinstance(data, list)
    assert len(data) == 2

def test_save_to_file_unsupported_format(tmp_path, sample_docs, monkeypatch):
    monkeypatch.setattr(storage, "DATA_DIR", tmp_path)
    with pytest.raises(ValueError, match="Unsupported format"):
        storage.save_to_file(
            sample_docs, scraper_name="council", municipality="laval", format="yaml"
        )

def test_save_to_file_empty_list_raises(tmp_path, monkeypatch):
    monkeypatch.setattr(storage, "DATA_DIR", tmp_path)
    with pytest.raises(ValueError):
        storage.save_to_file([], scraper_name="empty", municipality="nowhere")

def test_sha256_of_bytes():
    data = b"hello world"
    expected = hashlib.sha256(data).hexdigest()
    result = storage.sha256_of_bytes(data)
    assert result == expected


def test_sha256_of_file(tmp_path):
    test_file = tmp_path / "test.txt"
    test_file.write_text("abc", encoding="utf-8")

    expected = hashlib.sha256(b"abc").hexdigest()
    result = storage.sha256_of_file(test_file)
    assert result == expected


def test_sha256_of_file_missing_raises(tmp_path):
    missing = tmp_path / "nope.txt"
    with pytest.raises(Exception):
        storage.sha256_of_file(missing)
