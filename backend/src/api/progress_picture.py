import os
import uuid
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from src.database import get_db
from src.domain.ProgressPicture import progress_picture_service
from src.domain.ProgressPicture.schemas import ProgressPicture

progress_picture_router = APIRouter(prefix="/api/progress-pictures", tags=["progress-pictures"])

# Allowed MIME types for security
ALLOWED_MIME_TYPES = {
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/heic",
    "image/heif",
}

# Allowed extensions (double-check against MIME type)
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp", ".heic", ".heif"}

# Max file size: 10MB
MAX_FILE_SIZE = 10 * 1024 * 1024

# Upload directory
UPLOAD_DIR = Path("uploads/progress_pictures")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


def validate_image_file(file: UploadFile) -> None:
    """Validate that the uploaded file is a valid image"""
    # Check MIME type
    if file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type: {file.content_type}. Allowed types: JPEG, PNG, GIF, WebP, HEIC"
        )
    
    # Check extension
    if file.filename:
        ext = Path(file.filename).suffix.lower()
        if ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid file extension: {ext}. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"
            )


def generate_unique_filename(original_filename: str) -> str:
    """Generate a unique filename while preserving extension"""
    ext = Path(original_filename).suffix.lower() if original_filename else ".jpg"
    return f"{uuid.uuid4()}{ext}"


@progress_picture_router.post("/{log_entry_id}", response_model=ProgressPicture)
async def upload_progress_picture(
    log_entry_id: int,
    file: UploadFile = File(...),
    label: str = Form(default=None),
    db: Session = Depends(get_db)
):
    """Upload a progress picture for a log entry"""
    # Validate file type
    validate_image_file(file)
    
    # Read file content and check size
    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Maximum size is {MAX_FILE_SIZE // (1024 * 1024)}MB"
        )
    
    # Additional validation: check file magic bytes for common image formats
    # JPEG: FF D8 FF
    # PNG: 89 50 4E 47
    # GIF: 47 49 46
    # WebP: 52 49 46 46 ... 57 45 42 50
    magic_bytes = content[:12]
    is_valid_magic = (
        magic_bytes[:3] == b'\xff\xd8\xff' or  # JPEG
        magic_bytes[:8] == b'\x89PNG\r\n\x1a\n' or  # PNG
        magic_bytes[:6] in (b'GIF87a', b'GIF89a') or  # GIF
        (magic_bytes[:4] == b'RIFF' and magic_bytes[8:12] == b'WEBP') or  # WebP
        magic_bytes[:4] == b'\x00\x00\x00\x0c'  # HEIC (simplified check)
    )
    
    if not is_valid_magic:
        raise HTTPException(
            status_code=400,
            detail="File content does not match a valid image format"
        )
    
    # Generate unique filename and save
    unique_filename = generate_unique_filename(file.filename)
    file_path = UPLOAD_DIR / unique_filename
    
    with open(file_path, "wb") as f:
        f.write(content)
    
    # Create database record
    try:
        picture = progress_picture_service.create_progress_picture(
            db=db,
            log_entry_id=log_entry_id,
            filename=unique_filename,
            original_filename=file.filename or "image",
            mime_type=file.content_type,
            label=label
        )
        return picture
    except Exception as e:
        # Clean up file if database insert fails
        if file_path.exists():
            file_path.unlink()
        raise HTTPException(status_code=500, detail=str(e))


@progress_picture_router.get("/all", response_model=list[ProgressPicture])
def get_all_pictures(db: Session = Depends(get_db)):
    """Get all progress pictures across all log entries"""
    return progress_picture_service.get_all_progress_pictures(db)


@progress_picture_router.get("/log-entry/{log_entry_id}", response_model=list[ProgressPicture])
def get_pictures_for_log_entry(log_entry_id: int, db: Session = Depends(get_db)):
    """Get all progress pictures for a log entry"""
    return progress_picture_service.get_progress_pictures_by_log_entry(db, log_entry_id)


@progress_picture_router.get("/file/{filename}")
def get_picture_file(filename: str):
    """Serve a progress picture file"""
    # Sanitize filename to prevent path traversal
    safe_filename = Path(filename).name
    file_path = UPLOAD_DIR / safe_filename
    
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Image not found")
    
    return FileResponse(file_path)


@progress_picture_router.put("/{picture_id}", response_model=ProgressPicture)
def update_picture_label(
    picture_id: int,
    label: str = Form(default=None),
    db: Session = Depends(get_db)
):
    """Update the label of a progress picture"""
    picture = progress_picture_service.update_progress_picture_label(db, picture_id, label)
    if not picture:
        raise HTTPException(status_code=404, detail="Picture not found")
    return picture


@progress_picture_router.delete("/{picture_id}")
def delete_picture(picture_id: int, db: Session = Depends(get_db)):
    """Delete a progress picture"""
    filename = progress_picture_service.delete_progress_picture(db, picture_id)
    if not filename:
        raise HTTPException(status_code=404, detail="Picture not found")
    
    # Delete file from disk
    file_path = UPLOAD_DIR / filename
    if file_path.exists():
        file_path.unlink()
    
    return {"status": "deleted"}

