import pytest
from services.scraper_service.lib.abstract_scraper import AbstractWebHandler, AbstractParser

def test_abstract_web_handler_is_abstract():
    with pytest.raises(TypeError):
        AbstractWebHandler()  # type: ignore

def test_abstract_parser_is_abstract():
    with pytest.raises(TypeError):
        AbstractParser()  # type: ignore
