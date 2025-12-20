from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    """
    Manages application settings loaded from environment variables.
    """
    
    model_config = SettingsConfigDict(
        env_file=".env", 
        env_file_encoding="utf-8", 
        case_sensitive=False,
        extra="ignore"
    )

    gcp_project_id: str = "concordia-capstone2026"
    environment: str = "dev"  # Add this
    log_level: str = "INFO"

    # Add service-specific URLs from Terraform outputs
    completion_tracker_url: str = "https://completion-tracker-service-url/track-completion"


# Create a single, importable instance of the settings
settings = Settings()