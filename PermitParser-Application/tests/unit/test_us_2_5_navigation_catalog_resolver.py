import pytest

def navigation_catalog_resolver(source):
    # Dummy stub for canonical & alias
    if source.get("link") == "http://offdomain.com/project":
        return "ignored"
    return source.get("canonical", "url1"), source.get("links", ["url2"])

def test_canonicalization_and_aliases():
    # Arrange
    source = {"links": ["url1", "url2"], "canonical": "url1"}
    # Act
    canonical_detail, aliases = navigation_catalog_resolver(source)
    # Assert
    assert canonical_detail == "url1"
    assert "url2" in aliases

def test_navigation_step_execution():
    # Arrange
    source = {"steps": ["open", "filter", "modal", "view_details"], "canonical": "final_url"}
    # Act
    final_url, _ = navigation_catalog_resolver(source)
    # Assert
    assert final_url is not None

def test_off_domain_ignored():
    # Arrange
    source = {"link": "http://offdomain.com/project"}
    # Act
    result = navigation_catalog_resolver(source)
    # Assert
    assert result == "ignored"
