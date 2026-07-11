import html
from typing import Annotated
from pydantic import BeforeValidator

def sanitize_text(v: str) -> str:
    """Sanitizes text by escaping HTML characters to prevent XSS."""
    if isinstance(v, str):
        return html.escape(v)
    return v

# Annotated type for safe text fields
SafeStr = Annotated[str, BeforeValidator(sanitize_text)]
