from argparse import Namespace
from services.scraper_service.lib.cli import get_scraper_parser
import pytest

def test_get_scraper_parser_defaults():
    parser = get_scraper_parser()
    args = parser.parse_args([])
    assert isinstance(args, Namespace)
    assert args.output == "STDOUT"


def test_get_scraper_parser_with_output_choices():
    parser = get_scraper_parser()
    args = parser.parse_args(["--output", "FILE"])
    assert args.output == "FILE"

    args2 = parser.parse_args(["--output", "GCS"])
    assert args2.output == "GCS"

def test_get_scraper_parser_invalid_choice(capsys):
    parser = get_scraper_parser()
    with pytest.raises(SystemExit) as excinfo:
        parser.parse_args(["--output", "INVALID"])
    assert excinfo.value.code == 2

    captured = capsys.readouterr()
    assert "invalid choice" in captured.err
    assert "STDOUT" in captured.err
    assert "FILE" in captured.err
    assert "GCS" in captured.err