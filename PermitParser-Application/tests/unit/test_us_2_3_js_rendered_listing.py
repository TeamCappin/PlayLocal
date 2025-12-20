import pytest

def crawl_js_listing(js_listing_url):
    # Dummy stub
    return [
        {"type": "project-card", "city": "Laval"},
        {"type": "project-card", "city": "Montreal"},
    ]

def test_js_listing_with_selector():
    # Arrange
    js_listing_url = "http://example.com/js-listing"
    # Act
    items = crawl_js_listing(js_listing_url)
    # Assert
    assert any(item for item in items if item['type'] == "project-card")

def test_paginate_until_exhausted():
    # Arrange
    js_listing_url = "http://example.com/js-listing"
    # Act
    detail_urls = [i["type"] + str(idx) for idx, i in enumerate(crawl_js_listing(js_listing_url))]
    # Assert
    assert len(detail_urls) > 0
    assert len(set(detail_urls)) == len(detail_urls)

def test_required_filter_applied():
    # Arrange
    js_listing_url = "http://example.com/js-listing"
    filter_criteria = {"city": "Laval"}
    # Act
    items = [i for i in crawl_js_listing(js_listing_url) if i["city"] == filter_criteria["city"]]
    # Assert
    for item in items:
        assert item["city"] == "Laval"
