"""Logging configuration for RankForge"""

import logging
import sys
from typing import Any
from app.config import settings


def setup_logger(name: str) -> logging.Logger:
    """Configure and return a logger instance"""
    
    logger = logging.getLogger(name)
    logger.setLevel(getattr(logging, settings.log_level.upper()))
    
    if not logger.handlers:
        handler = logging.StreamHandler(sys.stdout)
        handler.setLevel(getattr(logging, settings.log_level.upper()))
        
        formatter = logging.Formatter(
            fmt="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S"
        )
        handler.setFormatter(formatter)
        logger.addHandler(handler)
    
    return logger


def log_agent_activity(logger: logging.Logger, agent_name: str, action: str, data: Any = None) -> None:
    """Log agent activity with structured format"""
    log_msg = f"[{agent_name}] {action}"
    if data:
        log_msg += f" | Data: {data}"
    logger.info(log_msg)
