import pytest
from unittest.mock import Mock, patch
from services.scraper_service.lib.http import HTTPClient
import time
from requests.exceptions import HTTPError, RequestException
from tenacity import RetryError

def test_respect_rate_limit_sleeps(monkeypatch):
    slept = {}

    def fake_sleep(duration):
        slept["duration"] = duration
    monkeypatch.setattr(time, "sleep", fake_sleep)

    client = HTTPClient(user_agent="test-agent", rate_limit_rps=2.0)
    netloc = "example.com"
    import time as real_time
    client._last_request_time[netloc] = real_time.monotonic()

    client._respect_rate_limit(netloc)

    assert "duration" in slept
    assert slept["duration"] >= 0.49


def test_respect_rate_limit_no_sleep(monkeypatch):
    slept = {}
    monkeypatch.setattr(time, "sleep", lambda d: slept.setdefault("called", True))

    client = HTTPClient(user_agent="test-agent", rate_limit_rps=2.0)
    netloc = "example.com"
    client._last_request_time[netloc] = 0

    client._respect_rate_limit(netloc)

    assert "called" not in slept

def test_user_agent_header_set():
    agent = "MyTestAgent/1.0"
    client = HTTPClient(user_agent=agent)
    assert client.session.headers["User-Agent"] == agent

@patch("services.scraper_service.lib.http.requests.Session.get")
def test_get_success(mock_get):
    mock_response = Mock()
    mock_response.status_code = 200
    mock_response.raise_for_status = Mock()
    mock_get.return_value = mock_response

    client = HTTPClient("Agent")
    resp = client.get("https://example.com")

    assert resp == mock_response
    mock_response.raise_for_status.assert_called_once()

def test_get_client_error_no_retry_for_404(monkeypatch):
    client = HTTPClient(user_agent="test")

    # Mock response with 404
    class MockResponse:
        status_code = 404
        def raise_for_status(self):
            raise HTTPError(response=self)

    # Patch session.get
    monkeypatch.setattr(client.session, "get", lambda url, **kwargs: MockResponse())

    # Patch retry predicate to skip 404
    client._retry_on_exception = lambda exc: not (
        isinstance(exc, HTTPError) and exc.response.status_code == 404
    )

    # Should raise immediately as HTTPError (no RetryError)
    from requests.exceptions import HTTPError
    with pytest.raises(HTTPError):
        client.get("https://fake-domain.test")


def test_get_network_failure_retries(monkeypatch):
    client = HTTPClient(user_agent="test")
    call_count = {"count": 0}

    def mock_get(url, **kwargs):
        call_count["count"] += 1
        raise RequestException("Timeout")

    monkeypatch.setattr(client.session, "get", mock_get)

    from tenacity import RetryError
    with pytest.raises(RetryError):
        client.get("https://fake-domain.test")

    assert call_count["count"] > 1
    
def test_404_logging(monkeypatch, caplog):
    client = HTTPClient(user_agent="test")

    class MockResponse:
        status_code = 404
        def raise_for_status(self):
            raise HTTPError(response=self)

    monkeypatch.setattr(client.session, "get", lambda url, **kwargs: MockResponse())
    client._retry_on_exception = lambda exc: not (
        isinstance(exc, HTTPError) and exc.response.status_code == 404
    )

    with caplog.at_level("ERROR"):
        from requests.exceptions import HTTPError
        with pytest.raises(HTTPError):
            client.get("https://fake-domain.test")

    assert any("Client error 404" in r.message for r in caplog.records)

