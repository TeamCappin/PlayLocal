"""Storage helpers exposed for scraper modules."""

from .gcs import StorageClient, upload_scraped_pdf  # noqa: F401
from .local import (  # noqa: F401
    print_to_stdout,
    save_to_file,
    sha256_of_bytes,
    sha256_of_file,
)

__all__ = [
    "StorageClient",
    "upload_scraped_pdf",
    "save_to_file",
    "print_to_stdout",
    "sha256_of_file",
    "sha256_of_bytes",
]

