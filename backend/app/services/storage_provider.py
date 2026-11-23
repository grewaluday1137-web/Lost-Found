import os
import uuid
import aiofiles
from abc import ABC, abstractmethod
from fastapi import UploadFile, HTTPException
from app.core.config import settings

class StorageProvider(ABC):
    @abstractmethod
    async def save_file(self, file: UploadFile, subfolder: str = "") -> str:
        pass

    @abstractmethod
    async def delete_file(self, file_url: str) -> bool:
        pass

class LocalStorageProvider(StorageProvider):
    def __init__(self, base_upload_dir: str = settings.UPLOAD_DIR):
        self.base_dir = os.path.abspath(base_upload_dir)
        os.makedirs(self.base_dir, exist_ok=True)

    async def save_file(self, file: UploadFile, subfolder: str = "") -> str:
        # Validate extension
        filename = file.filename or "file.jpg"
        ext = filename.split(".")[-1].lower() if "." in filename else ""
        if ext not in settings.ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid file extension '.{ext}'. Allowed extensions: {', '.join(settings.ALLOWED_EXTENSIONS)}"
            )

        # Generate unique storage filename
        unique_name = f"{uuid.uuid4().hex}.{ext}"
        target_dir = os.path.join(self.base_dir, subfolder) if subfolder else self.base_dir
        os.makedirs(target_dir, exist_ok=True)
        file_path = os.path.join(target_dir, unique_name)

        # Read and check size
        content = await file.read()
        max_bytes = settings.MAX_FILE_SIZE_MB * 1024 * 1024
        if len(content) > max_bytes:
            raise HTTPException(
                status_code=400,
                detail=f"File exceeds maximum allowed size of {settings.MAX_FILE_SIZE_MB}MB"
            )

        # Write file to disk
        with open(file_path, "wb") as f:
            f.write(content)

        # Return relative URL for static mount
        rel_path = f"/uploads/{subfolder}/{unique_name}" if subfolder else f"/uploads/{unique_name}"
        return rel_path.replace("//", "/")

    async def delete_file(self, file_url: str) -> bool:
        try:
            rel_path = file_url.lstrip("/uploads/")
            abs_path = os.path.join(self.base_dir, rel_path)
            if os.path.exists(abs_path):
                os.remove(abs_path)
                return True
        except Exception:
            pass
        return False

# Global instance
_storage_provider = LocalStorageProvider()

def get_storage_provider() -> StorageProvider:
    return _storage_provider
