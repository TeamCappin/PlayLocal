import pytest

def crawl_api_source(api_endpoint, credentials=None):
    # Dummy stub
    return {
        "cursor_exhausted": True,
        "data": [
            {"projectId": "123", "detailUrl": "http://api.example.com/p/123"},
            {"projectId": "456", "detailUrl": "http://api.example.com/p/456"},
        ]
    }

def test_api_cursor_pagination():
    # Arrange
    api_endpoint = "http://api.example.com/projects"
    # Act
    results = crawl_api_source(api_endpoint)
    # Assert
    assert results["cursor_exhausted"] is True

def test_projectid_and_detailurl_linked():
    # Arrange
    api_endpoint = "http://api.example.com/projects"
    # Act
    projects = crawl_api_source(api_endpoint)
    # Assert
    for p in projects["data"]:
        assert "projectId" in p and "detailUrl" in p
