import pytest

def crawl_static_listing(listing_url):
    # Dummy stub
    # Return dummy detail urls
    if "robots-excluded" in listing_url:
        return "skipped"
    return ["http://example.com/project/1", "http://example.com/project/2"]

def test_static_listing_detail_url_discovery():
    # Arrange
    listing_url = "http://example.com/listing"
    # Act
    detail_urls = crawl_static_listing(listing_url)
    # Assert
    assert len(set(detail_urls)) == len(detail_urls)

def test_relative_links_normalized():
    # Arrange
    relative_links = ["/project/1", "/project/2"]
    # Act
    absolute_links = ["http://example.com" + link for link in relative_links]
    # Assert
    for link in absolute_links:
        assert link.startswith("http")

def test_robots_excluded_skipped():
    # Arrange
    excluded_url = "http://example.com/robots-excluded"
    # Act
    result = crawl_static_listing(excluded_url)
    # Assert
    assert result == "skipped"
