"""
Input sanitization utilities — strips HTML, dangerous characters, normalizes whitespace.
"""

import re
import html


def sanitize_string(value: str) -> str:
    """Strip HTML tags, escape entities, normalize whitespace."""
    if not value:
        return ""
    # Strip HTML tags
    value = re.sub(r'<[^>]+>', '', value)
    # Escape HTML entities
    value = html.escape(value.strip())
    # Normalize whitespace (collapse multiple spaces)
    value = re.sub(r'\s+', ' ', value)
    return value.strip()
