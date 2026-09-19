"""
Storage Service Abstraction
BACKEND.md Phase 40 - Image Storage

Provides a StorageService abstraction that:
- In demo/hackathon mode: stores files to a local tmp directory with clear limitations
- In production: can be swapped to S3-compatible or Cloud Object Storage without caller changes

Never depend on Render local filesystem for permanent storage.
"""

from __future__ import annotations

import os
import uuid
import shutil
from abc import ABC, abstractmethod
from pathlib import Path
from typing import Optional, BinaryIO
from datetime import datetime, timezone

from app.core.logging import logger
from app.core.config import get_settings

settings = get_settings()

# Supported upload types
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp", ".pdf"}
MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB


class StorageError(Exception):
    """Raised when a storage operation fails."""


class StoredFile:
    """Represents a file stored by StorageService."""

    def __init__(
        self,
        file_id: str,
        original_name: str,
        storage_key: str,
        content_type: str,
        size_bytes: int,
        url: str,
        backend: str,
        created_at: datetime,
    ):
        self.file_id = file_id
        self.original_name = original_name
        self.storage_key = storage_key
        self.content_type = content_type
        self.size_bytes = size_bytes
        self.url = url
        self.backend = backend
        self.created_at = created_at

    def to_dict(self) -> dict:
        return {
            "file_id": self.file_id,
            "original_name": self.original_name,
            "storage_key": self.storage_key,
            "content_type": self.content_type,
            "size_bytes": self.size_bytes,
            "url": self.url,
            "backend": self.backend,
            "created_at": self.created_at.isoformat(),
        }


class BaseStorageBackend(ABC):
    """Abstract storage backend interface."""

    @abstractmethod
    def save(self, data: bytes, key: str) -> str:
        """Persist data and return the accessible URL/path."""

    @abstractmethod
    def delete(self, key: str) -> bool:
        """Remove stored object. Returns True if deleted."""

    @abstractmethod
    def get_url(self, key: str) -> Optional[str]:
        """Return a publicly accessible URL (or local path) for the stored key."""

    @property
    @abstractmethod
    def backend_name(self) -> str: ...


class LocalStorageBackend(BaseStorageBackend):
    """
    Demo/hackathon local storage backend.
    
    ⚠ WARNING: This backend stores files in a local directory.
    Files will be lost on Render deployment restarts.
    For production, configure an S3-compatible backend.
    """

    def __init__(self, base_dir: Optional[str] = None):
        self._base_dir = Path(base_dir or "/tmp/krishinirnay_uploads")
        self._base_dir.mkdir(parents=True, exist_ok=True)
        logger.warning(
            "StorageService using LOCAL backend — files are ephemeral (lost on restart). "
            "Configure S3_BUCKET for production use."
        )

    @property
    def backend_name(self) -> str:
        return "local"

    def save(self, data: bytes, key: str) -> str:
        dest = self._base_dir / key
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_bytes(data)
        logger.debug(f"Stored file locally: {dest}")
        return f"/uploads/{key}"

    def delete(self, key: str) -> bool:
        dest = self._base_dir / key
        if dest.exists():
            dest.unlink()
            return True
        return False

    def get_url(self, key: str) -> Optional[str]:
        dest = self._base_dir / key
        if dest.exists():
            return f"/uploads/{key}"
        return None


class S3StorageBackend(BaseStorageBackend):
    """
    S3-compatible storage backend stub.
    Configure AWS_S3_BUCKET, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY in settings.
    """

    def __init__(self, bucket: str, region: str = "us-east-1"):
        self._bucket = bucket
        self._region = region
        # boto3 client would be initialized here in production
        logger.info(f"S3 storage backend initialized for bucket: {bucket}")

    @property
    def backend_name(self) -> str:
        return "s3"

    def save(self, data: bytes, key: str) -> str:
        raise NotImplementedError("S3 backend: configure boto3 client in production.")

    def delete(self, key: str) -> bool:
        raise NotImplementedError("S3 backend: configure boto3 client in production.")

    def get_url(self, key: str) -> Optional[str]:
        return f"https://{self._bucket}.s3.{self._region}.amazonaws.com/{key}"


class StorageService:
    """
    High-level file storage service with validation and metadata.
    Backend is pluggable: local (demo) → S3 (production).
    """

    def __init__(self, backend: Optional[BaseStorageBackend] = None):
        self._backend = backend or self._auto_backend()

    @staticmethod
    def _auto_backend() -> BaseStorageBackend:
        # Check for S3 configuration
        s3_bucket = os.getenv("AWS_S3_BUCKET", "").strip()
        if s3_bucket:
            region = os.getenv("AWS_REGION", "us-east-1")
            return S3StorageBackend(bucket=s3_bucket, region=region)
        return LocalStorageBackend()

    @property
    def backend_name(self) -> str:
        return self._backend.backend_name

    def validate_file(
        self, filename: str, file_size: int, allowed_extensions: Optional[set] = None
    ) -> None:
        """Validate extension and size. Raises StorageError on violation."""
        ext = Path(filename).suffix.lower()
        exts = allowed_extensions or ALLOWED_EXTENSIONS
        if ext not in exts:
            raise StorageError(
                f"Unsupported file extension '{ext}'. Allowed: {', '.join(sorted(exts))}"
            )
        if file_size > MAX_FILE_SIZE_BYTES:
            raise StorageError(
                f"File size {file_size} bytes exceeds maximum {MAX_FILE_SIZE_BYTES} bytes (10 MB)."
            )

    def store(
        self,
        data: bytes,
        original_name: str,
        content_type: str = "application/octet-stream",
        folder: str = "uploads",
    ) -> StoredFile:
        """
        Validate and store a file. Returns a StoredFile with metadata.

        Steps:
        1. Validate extension and size
        2. Generate a unique storage key
        3. Persist to configured backend
        4. Return StoredFile metadata
        """
        ext = Path(original_name).suffix.lower()
        self.validate_file(original_name, len(data))

        file_id = str(uuid.uuid4())
        storage_key = f"{folder}/{file_id}{ext}"

        url = self._backend.save(data, storage_key)

        stored = StoredFile(
            file_id=file_id,
            original_name=original_name,
            storage_key=storage_key,
            content_type=content_type,
            size_bytes=len(data),
            url=url,
            backend=self._backend.backend_name,
            created_at=datetime.now(timezone.utc),
        )
        logger.info(f"File stored [{self._backend.backend_name}]: {storage_key} ({len(data)} bytes)")
        return stored

    def delete(self, storage_key: str) -> bool:
        """Remove a previously stored file."""
        result = self._backend.delete(storage_key)
        if result:
            logger.info(f"File deleted [{self._backend.backend_name}]: {storage_key}")
        return result

    def get_url(self, storage_key: str) -> Optional[str]:
        """Resolve accessible URL for a stored key."""
        return self._backend.get_url(storage_key)


# Global singleton
storage_service = StorageService()
