'use client';

import { useState, useRef } from 'react';
import type { ProgressPicture } from '../types';
import { progressPictureApi } from '../api';
import { useConfirmDialog } from './ConfirmDialog';

interface ProgressPicturesSectionProps {
  logEntryId?: number;
  pictures?: ProgressPicture[];
  onPictureAdded?: () => void;
  onPictureDeleted?: () => void;
  onEnsureLogEntry?: () => Promise<number | undefined>;  // Returns log entry id after creation
}

interface SelectedFile {
  file: File;
  label: string;
  previewUrl: string;
}

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/heic', 'image/heif'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export default function ProgressPicturesSection({ 
  logEntryId, 
  pictures, 
  onPictureAdded,
  onPictureDeleted,
  onEnsureLogEntry
}: ProgressPicturesSectionProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);
  const [viewingPicture, setViewingPicture] = useState<ProgressPicture | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { confirm, ConfirmDialogComponent } = useConfirmDialog();

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return `Invalid file type: ${file.type}. Allowed: JPEG, PNG, GIF, WebP, HEIC`;
    }
    if (file.size > MAX_FILE_SIZE) {
      return `File too large: ${file.name}. Maximum size is 10MB`;
    }
    return null;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newFiles: SelectedFile[] = [];
    const errors: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const error = validateFile(file);
      if (error) {
        errors.push(error);
      } else {
        newFiles.push({
          file,
          label: '',
          previewUrl: URL.createObjectURL(file),
        });
      }
    }

    if (errors.length > 0) {
      setUploadError(errors.join('\n'));
    } else {
      setUploadError(null);
    }

    setSelectedFiles(prev => [...prev, ...newFiles]);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const updateFileLabel = (index: number, label: string) => {
    setSelectedFiles(prev => prev.map((f, i) => 
      i === index ? { ...f, label } : f
    ));
  };

  const removeSelectedFile = (index: number) => {
    setSelectedFiles(prev => {
      const file = prev[index];
      URL.revokeObjectURL(file.previewUrl);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    setIsUploading(true);
    setUploadError(null);

    try {
      // If no log entry exists, create one first
      let entryId = logEntryId;
      console.log('handleUpload: logEntryId =', logEntryId, 'onEnsureLogEntry =', !!onEnsureLogEntry);
      if (!entryId && onEnsureLogEntry) {
        console.log('handleUpload: calling onEnsureLogEntry...');
        entryId = await onEnsureLogEntry();
        console.log('handleUpload: onEnsureLogEntry returned:', entryId);
      }
      
      if (!entryId) {
        console.error('handleUpload: entryId is still undefined/null');
        setUploadError('Could not create log entry');
        return;
      }

      // Upload all files
      for (const { file, label } of selectedFiles) {
        await progressPictureApi.upload(entryId, file, label || undefined);
      }
      
      // Reset form
      setShowUploadForm(false);
      selectedFiles.forEach(f => URL.revokeObjectURL(f.previewUrl));
      setSelectedFiles([]);
      
      onPictureAdded?.();
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (pictureId: number) => {
    const confirmed = await confirm({
      title: 'Delete Picture',
      message: 'Are you sure you want to delete this progress picture? This action cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'danger',
    });
    
    if (!confirmed) return;
    
    try {
      await progressPictureApi.delete(pictureId);
      onPictureDeleted?.();
    } catch (error) {
      console.error('Failed to delete picture:', error);
    }
  };

  const handleCancel = () => {
    setShowUploadForm(false);
    setUploadError(null);
    selectedFiles.forEach(f => URL.revokeObjectURL(f.previewUrl));
    setSelectedFiles([]);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  return (
    <div className="section-card">
      <div className="section-header">
        <div className="section-title">
          <span className="section-icon">📷</span>
          Progress Pictures
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {pictures && pictures.length > 0 && (
            <span className="section-badge">{pictures.length} photo{pictures.length !== 1 ? 's' : ''}</span>
          )}
          {!showUploadForm && (
            <button 
              className="section-add-btn" 
              onClick={() => setShowUploadForm(true)} 
              aria-label="Add progress picture"
            >
              +
            </button>
          )}
        </div>
      </div>

      {/* Upload Form */}
      {showUploadForm && (
        <div className="section-content" style={{ borderBottom: '1px solid var(--border-color)' }}>
          <div className="progress-picture-upload-form">
            {/* File Input Row */}
            <div className="upload-input-row">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,image/heic,image/heif"
                onChange={handleFileSelect}
                className="form-input"
                style={{ flex: 1, padding: '0.5rem' }}
              />
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
              Select multiple photos. Allowed: JPEG, PNG, GIF, WebP, HEIC (max 10MB each)
            </div>

            {/* Selected Files with Labels */}
            {selectedFiles.length > 0 && (
              <div className="selected-files-list">
                {selectedFiles.map((sf, index) => (
                  <div key={index} className="selected-file-item">
                    <div className="selected-file-preview">
                      <img src={sf.previewUrl} alt={`Preview ${index + 1}`} />
                      <button
                        type="button"
                        className="remove-file-btn"
                        onClick={() => removeSelectedFile(index)}
                        title="Remove"
                      >
                        ×
                      </button>
                    </div>
                    <input
                      type="text"
                      value={sf.label}
                      onChange={(e) => updateFileLabel(index, e.target.value)}
                      className="form-input"
                      placeholder="Label (optional)"
                      style={{ flex: 1 }}
                    />
                  </div>
                ))}
              </div>
            )}

            {uploadError && (
              <div className="form-error" style={{ 
                color: 'var(--accent-danger)', 
                fontSize: '0.85rem',
                marginBottom: '1rem',
                padding: '0.5rem',
                background: 'rgba(239, 68, 68, 0.1)',
                borderRadius: '4px',
                whiteSpace: 'pre-line'
              }}>
                {uploadError}
              </div>
            )}

            <div className="form-actions">
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={handleCancel}
                disabled={isUploading}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="btn btn-primary" 
                onClick={handleUpload}
                disabled={selectedFiles.length === 0 || isUploading || (!logEntryId && !onEnsureLogEntry)}
              >
                {isUploading ? 'Uploading...' : `Upload ${selectedFiles.length > 0 ? `(${selectedFiles.length})` : ''}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pictures Grid */}
      {pictures && pictures.length > 0 ? (
        <div className="section-content">
          <div className="progress-pictures-grid">
            {pictures.map((pic) => (
              <div key={pic.id} className="progress-picture-item">
                <div 
                  className="progress-picture-thumbnail"
                  onClick={() => setViewingPicture(pic)}
                  style={{ cursor: 'pointer' }}
                >
                  <img 
                    src={progressPictureApi.getFileUrl(pic.filename)} 
                    alt={pic.label || 'Progress picture'} 
                  />
                </div>
                <div className="progress-picture-info">
                  <span className="progress-picture-label">
                    {pic.label || 'No label'}
                  </span>
                  <span className="progress-picture-time">
                    {formatDate(pic.created_at)}
                  </span>
                </div>
                <button
                  className="btn-delete-small"
                  onClick={() => handleDelete(pic.id)}
                  title="Delete picture"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : !showUploadForm ? (
        <div className="section-empty">
          <span className="section-empty-icon">📸</span>
          <span>No progress pictures</span>
        </div>
      ) : null}

      {/* Lightbox Modal */}
      {viewingPicture && (
        <div 
          className="progress-picture-modal"
          onClick={() => setViewingPicture(null)}
        >
          <div className="progress-picture-modal-content" onClick={(e) => e.stopPropagation()}>
            <button 
              className="progress-picture-modal-close"
              onClick={() => setViewingPicture(null)}
            >
              ×
            </button>
            <img 
              src={progressPictureApi.getFileUrl(viewingPicture.filename)} 
              alt={viewingPicture.label || 'Progress picture'} 
            />
            {viewingPicture.label && (
              <div className="progress-picture-modal-label">
                {viewingPicture.label}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Confirm Dialog */}
      {ConfirmDialogComponent}
    </div>
  );
}

