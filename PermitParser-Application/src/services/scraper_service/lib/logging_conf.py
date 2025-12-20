"""
Configure basic logging for the scrapers.

When imported, this module sets up a simple console logger with
timestamps and severity.  The log level can be controlled via the
LOG_LEVEL environment variable (default: INFO).
"""

import logging
import os
# `colorlog` is optional.  If it is not installed, fall back to the
# standard library logging.
try:
    import colorlog  # type: ignore
except Exception:
    colorlog = None

def configure_logging2():
    """Configure logging with coloured output if `colorlog` is available.

    Falls back to the basic configuration if `colorlog` is not
    installed.  The log level is determined from the LOG_LEVEL
    environment variable.
    """
    log_level = os.environ.get("LOG_LEVEL", "INFO").upper()

    logger = logging.getLogger()
    logger.handlers = []
    if colorlog is not None:
        handler = colorlog.StreamHandler()
        handler.setFormatter(colorlog.ColoredFormatter(
            "%(log_color)s%(asctime)s [%(levelname)s] %(name)s: %(message)s",
            log_colors={
                'DEBUG':    'cyan',
                'INFO':     'green',
                'WARNING':  'yellow',
                'ERROR':    'red',
                'CRITICAL': 'bold_red',
            },
            datefmt='%Y-%m-%d %H:%M:%S'
        ))
        logger.setLevel(getattr(logging, log_level, logging.INFO))
        logger.addHandler(handler)
    else:
        # Fall back to a simple formatter
        logging.basicConfig(
            level=getattr(logging, log_level, logging.INFO),
            format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
        )

def configure_logging():
    log_level = os.environ.get("LOG_LEVEL", "INFO").upper()
    logging.basicConfig(
        level=getattr(logging, log_level, logging.INFO),
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    )
