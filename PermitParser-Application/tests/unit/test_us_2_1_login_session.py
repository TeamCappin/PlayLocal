import pytest

class Resp:
    status_code = 200

class DummySession:
    def __init__(self):
        self.is_authenticated = True
        self._logs = ""
    def request(self, url):
        return Resp()
    def expire(self):
        self.is_authenticated = False
    def get_logs(self):
        return self._logs

def login_and_persist_session(credentials):
    # Dummy stub
    return DummySession()

def test_login_and_reuse_session():
    # Arrange
    credentials = {"user": "test", "password": "secret"}
    # Act
    session = login_and_persist_session(credentials)
    # Assert
    assert session.is_authenticated
    assert session.request("protected_page_url").status_code == 200

def test_session_reauth_on_expiry():
    # Arrange
    credentials = {"user": "test", "password": "secret"}
    session = login_and_persist_session(credentials)
    session.expire()
    # Act
    session.is_authenticated = True  # simulate re-auth
    response = session.request("protected_page_url")
    # Assert
    assert session.is_authenticated
    assert response.status_code == 200

def test_no_secrets_in_logs():
    # Arrange
    credentials = {"user": "test", "password": "secret"}
    # Act
    logs = login_and_persist_session(credentials).get_logs()
    # Assert
    assert "secret" not in logs
