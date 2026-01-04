'use client';

import { useState, useEffect, useCallback } from 'react';
import type { ProgressPicture } from '../../types';
import { progressPictureApi } from '../../api';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface ComparisonPhoto {
  id: string;
  pictureId: number;
  url: string;
  label?: string;
  date: string;
  gridColumn: number;
  gridRow: number;
  width: number; // in grid units
  height: number; // in grid units
}

interface Comparison {
  id: string;
  name: string;
  photos: ComparisonPhoto[];
  createdAt: string;
  updatedAt: string;
}

const STORAGE_KEY = 'progressComparisons';
const GRID_COLS = 4;

export default function ComparisonTool() {
  const [comparisons, setComparisons] = useState<Comparison[]>([]);
  const [activeComparison, setActiveComparison] = useState<Comparison | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [availablePictures, setAvailablePictures] = useState<ProgressPicture[]>([]);
  const [showPicturePicker, setShowPicturePicker] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [draggedPhoto, setDraggedPhoto] = useState<string | null>(null);
  const [comparisonName, setComparisonName] = useState('');
  const [showNameDialog, setShowNameDialog] = useState(false);

  // Load comparisons from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setComparisons(JSON.parse(saved));
      } catch {
        setComparisons([]);
      }
    }
  }, []);

  // Save comparisons to localStorage
  const saveComparisons = useCallback((newComparisons: Comparison[]) => {
    setComparisons(newComparisons);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newComparisons));
  }, []);

  // Load available pictures
  useEffect(() => {
    const loadPictures = async () => {
      try {
        const pictures = await progressPictureApi.getAll();
        setAvailablePictures(pictures);
      } catch (error) {
        console.error('Failed to load pictures:', error);
      }
    };
    loadPictures();
  }, []);

  const createNewComparison = () => {
    const newComparison: Comparison = {
      id: `comparison-${Date.now()}`,
      name: 'New Comparison',
      photos: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setActiveComparison(newComparison);
    setIsEditing(true);
    setComparisonName('New Comparison');
  };

  const loadComparison = (comparison: Comparison) => {
    setActiveComparison(comparison);
    setComparisonName(comparison.name);
    setIsEditing(false);
  };

  const saveActiveComparison = () => {
    if (!activeComparison) return;

    const updatedComparison = {
      ...activeComparison,
      name: comparisonName || 'Untitled Comparison',
      updatedAt: new Date().toISOString(),
    };

    const existingIndex = comparisons.findIndex(c => c.id === activeComparison.id);
    let newComparisons: Comparison[];
    
    if (existingIndex >= 0) {
      newComparisons = [...comparisons];
      newComparisons[existingIndex] = updatedComparison;
    } else {
      newComparisons = [...comparisons, updatedComparison];
    }

    saveComparisons(newComparisons);
    setActiveComparison(updatedComparison);
    setIsEditing(false);
  };

  const deleteComparison = (comparisonId: string) => {
    const newComparisons = comparisons.filter(c => c.id !== comparisonId);
    saveComparisons(newComparisons);
    if (activeComparison?.id === comparisonId) {
      setActiveComparison(null);
      setIsEditing(false);
    }
  };

  const addPhotoToComparison = (picture: ProgressPicture) => {
    if (!activeComparison) return;

    // Find the next available position
    const existingPositions = new Set(
      activeComparison.photos.map(p => `${p.gridColumn}-${p.gridRow}`)
    );
    
    let col = 0;
    let row = 0;
    while (existingPositions.has(`${col}-${row}`)) {
      col++;
      if (col >= GRID_COLS) {
        col = 0;
        row++;
      }
    }

    const newPhoto: ComparisonPhoto = {
      id: `photo-${Date.now()}`,
      pictureId: picture.id,
      url: `${API_BASE}${picture.url}`,
      label: picture.label,
      date: picture.created_at,
      gridColumn: col,
      gridRow: row,
      width: 1,
      height: 1,
    };

    setActiveComparison({
      ...activeComparison,
      photos: [...activeComparison.photos, newPhoto],
    });
    setShowPicturePicker(false);
  };

  const removePhotoFromComparison = (photoId: string) => {
    if (!activeComparison) return;
    setActiveComparison({
      ...activeComparison,
      photos: activeComparison.photos.filter(p => p.id !== photoId),
    });
    setSelectedPhoto(null);
  };

  const movePhoto = (photoId: string, direction: 'left' | 'right' | 'up' | 'down') => {
    if (!activeComparison) return;

    const photo = activeComparison.photos.find(p => p.id === photoId);
    if (!photo) return;

    let newCol = photo.gridColumn;
    let newRow = photo.gridRow;

    switch (direction) {
      case 'left':
        newCol = Math.max(0, photo.gridColumn - 1);
        break;
      case 'right':
        newCol = Math.min(GRID_COLS - 1, photo.gridColumn + 1);
        break;
      case 'up':
        newRow = Math.max(0, photo.gridRow - 1);
        break;
      case 'down':
        newRow = photo.gridRow + 1;
        break;
    }

    setActiveComparison({
      ...activeComparison,
      photos: activeComparison.photos.map(p =>
        p.id === photoId ? { ...p, gridColumn: newCol, gridRow: newRow } : p
      ),
    });
  };

  const handleDragStart = (photoId: string) => {
    setDraggedPhoto(photoId);
  };

  const handleDragOver = (e: React.DragEvent, col: number, row: number) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, col: number, row: number) => {
    e.preventDefault();
    if (!draggedPhoto || !activeComparison) return;

    setActiveComparison({
      ...activeComparison,
      photos: activeComparison.photos.map(p =>
        p.id === draggedPhoto ? { ...p, gridColumn: col, gridRow: row } : p
      ),
    });
    setDraggedPhoto(null);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Calculate the grid dimensions needed
  const getGridDimensions = () => {
    if (!activeComparison || activeComparison.photos.length === 0) {
      return { rows: 2, cols: GRID_COLS };
    }
    const maxRow = Math.max(...activeComparison.photos.map(p => p.gridRow + p.height));
    return { rows: Math.max(2, maxRow + 1), cols: GRID_COLS };
  };

  const { rows: gridRows } = getGridDimensions();

  return (
    <div className="comparison-tool">
      <div className="comparison-header">
        <h1>📸 Progress Picture Comparison</h1>
        <p className="comparison-subtitle">Compare your progress pictures side by side</p>
      </div>

      <div className="comparison-layout">
        {/* Sidebar with saved comparisons */}
        <div className="comparison-sidebar">
          <div className="comparison-sidebar-header">
            <h3>Saved Comparisons</h3>
            <button className="btn-new-comparison" onClick={createNewComparison}>
              + New
            </button>
          </div>
          
          <div className="comparison-list">
            {comparisons.length === 0 ? (
              <div className="comparison-list-empty">
                <p>No saved comparisons yet</p>
                <p className="hint">Click "+ New" to create one</p>
              </div>
            ) : (
              comparisons.map(comparison => (
                <div
                  key={comparison.id}
                  className={`comparison-list-item ${activeComparison?.id === comparison.id ? 'active' : ''}`}
                  onClick={() => loadComparison(comparison)}
                >
                  <div className="comparison-list-item-info">
                    <span className="comparison-list-item-name">{comparison.name}</span>
                    <span className="comparison-list-item-meta">
                      {comparison.photos.length} photo{comparison.photos.length !== 1 ? 's' : ''} • {formatDate(comparison.updatedAt)}
                    </span>
                  </div>
                  <button
                    className="comparison-list-item-delete"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteComparison(comparison.id);
                    }}
                    title="Delete comparison"
                  >
                    ×
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Main comparison view */}
        <div className="comparison-main">
          {!activeComparison ? (
            <div className="comparison-empty">
              <div className="comparison-empty-icon">📷</div>
              <h2>No Comparison Selected</h2>
              <p>Select a saved comparison or create a new one to get started</p>
              <button className="btn-primary" onClick={createNewComparison}>
                Create New Comparison
              </button>
            </div>
          ) : (
            <>
              {/* Comparison toolbar */}
              <div className="comparison-toolbar">
                {isEditing ? (
                  <input
                    type="text"
                    className="comparison-name-input"
                    value={comparisonName}
                    onChange={(e) => setComparisonName(e.target.value)}
                    placeholder="Comparison name..."
                  />
                ) : (
                  <h2 className="comparison-name">{activeComparison.name}</h2>
                )}
                
                <div className="comparison-toolbar-actions">
                  {isEditing ? (
                    <>
                      <button
                        className="btn-add-photo"
                        onClick={() => setShowPicturePicker(true)}
                      >
                        + Add Photo
                      </button>
                      <button className="btn-save" onClick={saveActiveComparison}>
                        Save
                      </button>
                      <button
                        className="btn-cancel"
                        onClick={() => {
                          if (comparisons.find(c => c.id === activeComparison.id)) {
                            loadComparison(comparisons.find(c => c.id === activeComparison.id)!);
                          } else {
                            setActiveComparison(null);
                          }
                          setIsEditing(false);
                        }}
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button className="btn-edit" onClick={() => setIsEditing(true)}>
                      Edit
                    </button>
                  )}
                </div>
              </div>

              {/* Comparison grid */}
              <div 
                className="comparison-grid"
                style={{
                  gridTemplateColumns: `repeat(${GRID_COLS}, 1fr)`,
                  gridTemplateRows: `repeat(${gridRows}, minmax(200px, auto))`,
                }}
              >
                {activeComparison.photos.length === 0 ? (
                  <div className="comparison-grid-empty">
                    <p>No photos in this comparison</p>
                    {isEditing && (
                      <button
                        className="btn-add-photo-large"
                        onClick={() => setShowPicturePicker(true)}
                      >
                        + Add Your First Photo
                      </button>
                    )}
                  </div>
                ) : (
                  activeComparison.photos.map(photo => (
                    <div
                      key={photo.id}
                      className={`comparison-photo ${selectedPhoto === photo.id ? 'selected' : ''} ${isEditing ? 'editable' : ''}`}
                      style={{
                        gridColumn: `${photo.gridColumn + 1} / span ${photo.width}`,
                        gridRow: `${photo.gridRow + 1} / span ${photo.height}`,
                      }}
                      draggable={isEditing}
                      onDragStart={() => handleDragStart(photo.id)}
                      onClick={() => isEditing && setSelectedPhoto(photo.id === selectedPhoto ? null : photo.id)}
                    >
                      <img src={photo.url} alt={photo.label || 'Progress photo'} />
                      <div className="comparison-photo-overlay">
                        <span className="comparison-photo-date">{formatDate(photo.date)}</span>
                        {photo.label && <span className="comparison-photo-label">{photo.label}</span>}
                      </div>
                      
                      {isEditing && selectedPhoto === photo.id && (
                        <div className="comparison-photo-controls">
                          <button onClick={() => movePhoto(photo.id, 'up')} title="Move up">↑</button>
                          <div className="controls-row">
                            <button onClick={() => movePhoto(photo.id, 'left')} title="Move left">←</button>
                            <button 
                              className="delete"
                              onClick={() => removePhotoFromComparison(photo.id)} 
                              title="Remove"
                            >
                              ×
                            </button>
                            <button onClick={() => movePhoto(photo.id, 'right')} title="Move right">→</button>
                          </div>
                          <button onClick={() => movePhoto(photo.id, 'down')} title="Move down">↓</button>
                        </div>
                      )}
                    </div>
                  ))
                )}

                {/* Drop zones for drag and drop */}
                {isEditing && activeComparison.photos.length > 0 && Array.from({ length: gridRows }).map((_, row) =>
                  Array.from({ length: GRID_COLS }).map((_, col) => {
                    const isOccupied = activeComparison.photos.some(
                      p => p.gridColumn === col && p.gridRow === row
                    );
                    if (isOccupied) return null;
                    return (
                      <div
                        key={`drop-${col}-${row}`}
                        className="comparison-drop-zone"
                        style={{
                          gridColumn: col + 1,
                          gridRow: row + 1,
                        }}
                        onDragOver={(e) => handleDragOver(e, col, row)}
                        onDrop={(e) => handleDrop(e, col, row)}
                      />
                    );
                  })
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Picture picker modal */}
      {showPicturePicker && (
        <div className="picture-picker-overlay" onClick={() => setShowPicturePicker(false)}>
          <div className="picture-picker-modal" onClick={e => e.stopPropagation()}>
            <div className="picture-picker-header">
              <h3>Select a Photo</h3>
              <button className="picture-picker-close" onClick={() => setShowPicturePicker(false)}>
                ×
              </button>
            </div>
            <div className="picture-picker-grid">
              {availablePictures.length === 0 ? (
                <div className="picture-picker-empty">
                  <p>No progress pictures found</p>
                  <p className="hint">Add progress pictures from the Daily Log view first</p>
                </div>
              ) : (
                availablePictures.map(picture => (
                  <div
                    key={picture.id}
                    className="picture-picker-item"
                    onClick={() => addPhotoToComparison(picture)}
                  >
                    <img src={`${API_BASE}${picture.url}`} alt={picture.label || 'Progress photo'} />
                    <div className="picture-picker-item-info">
                      <span className="picture-picker-item-date">{formatDate(picture.created_at)}</span>
                      {picture.label && <span className="picture-picker-item-label">{picture.label}</span>}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

