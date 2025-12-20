import pytest
import yaml
from pathlib import Path
from services.scraper_service.lib.config import ScraperConfig


def test_load_config_success(tmp_path):
    config_data = {
        "laval": {
            "scrapers": {
                "council": {
                    "url": "https://example.com"}
            }
        }
    }
    yaml_path = tmp_path / "config.yaml"
    yaml_path.write_text(yaml.dump(config_data))

    config = ScraperConfig(yaml_path)
    settings = config.get_scraper_settings("laval", "council")

    assert settings["url"] == "https://example.com"


def test_load_config_missing_file():
    fake_path = Path("does_not_exist.yaml")
    with pytest.raises(FileNotFoundError):
        ScraperConfig(fake_path)


def test_get_scraper_settings_invalid_key(tmp_path):
    yaml_path = tmp_path / "config.yaml"
    yaml_path.write_text("laval: {}\n")

    config = ScraperConfig(yaml_path)
    with pytest.raises(ValueError):
        config.get_scraper_settings("laval", "missing_scraper")
