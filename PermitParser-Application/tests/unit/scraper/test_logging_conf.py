import logging
from services.scraper_service.lib.logging_conf import configure_logging2
from services.scraper_service.lib import logging_conf
import colorlog

def test_configure_logging_sets_level(monkeypatch):
    for handler in logging.root.handlers[:]:
        logging.root.removeHandler(handler)

    monkeypatch.setenv("LOG_LEVEL", "DEBUG")
    logging_conf.configure_logging()

    assert logging.getLogger().level == logging.DEBUG


def test_configure_logging2_adds_handler(monkeypatch):
    monkeypatch.setenv("LOG_LEVEL", "INFO")
    configure_logging2()
    logger = logging.getLogger()
    assert any(isinstance(h, logging.Handler) for h in logger.handlers)

def test_configure_logging2_formatter_and_no_duplicate_handlers(monkeypatch):
    for handler in logging.root.handlers[:]:
        logging.root.removeHandler(handler)

    monkeypatch.setenv("LOG_LEVEL", "INFO")
    logger = logging.getLogger()

    configure_logging2()
    initial_handler_count = len(logger.handlers)
    assert initial_handler_count > 0

    handler = logger.handlers[0]

    fmt = handler.formatter._fmt
    assert "%(log_color)s" in fmt 

    configure_logging2()
    assert len(logger.handlers) == initial_handler_count
