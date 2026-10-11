'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ZoomIn, ZoomOut, Check, X, RefreshCw, Move } from 'lucide-react';

interface ImageCropperModalProps {
  isOpen: boolean;
  imageUrl: string;
  aspectRatio: number; // e.g. 1 for 1:1, 0.8 for 4:5
  onClose: () => void;
  onSave: (croppedBlob: Blob) => void;
}

export default function ImageCropperModal({
  isOpen,
  imageUrl,
  aspectRatio,
  onClose,
  onSave,
}: ImageCropperModalProps) {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [naturalSize, setNaturalSize] = useState({ width: 0, height: 0 });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [faceCenteringActive, setFaceCenteringActive] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const scaleRef = useRef(scale);
  const positionRef = useRef(position);
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });

  // Keep refs in sync so event listeners always have current values
  useEffect(() => { scaleRef.current = scale; }, [scale]);
  useEffect(() => { positionRef.current = position; }, [position]);

  // Viewport and Crop Box size configuration (in displayed px)
  const viewWidth = 360;
  const viewHeight = 360;

  // Calculate crop box size based on aspect ratio
  let cropWidth = 280;
  let cropHeight = 280;
  if (aspectRatio < 1) {
    cropHeight = 300;
    cropWidth = Math.round(cropHeight * aspectRatio);
  } else if (aspectRatio > 1) {
    cropWidth = 300;
    cropHeight = Math.round(cropWidth / aspectRatio);
  }

  // Reset states when a new image URL is loaded
  useEffect(() => {
    if (isOpen && imageUrl) {
      setScale(1);
      setPosition({ x: 0, y: 0 });
      setLoading(true);
      setLoadError(false);
      setFaceCenteringActive(false);
      setIsSaving(false);
    }
  }, [isOpen, imageUrl]);

  // Attach non-passive wheel listener so preventDefault works
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const zoomIntensity = 0.12;
      const factor = e.deltaY < 0 ? 1 + zoomIntensity : 1 - zoomIntensity;
      const newScale = Math.min(Math.max(scaleRef.current * factor, 0.1), 10);
      setScale(newScale);
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [isOpen]);

  const applyImageLoad = useCallback((img: HTMLImageElement) => {
    const w = img.naturalWidth;
    const h = img.naturalHeight;
    if (!w || !h) return;
    setNaturalSize({ width: w, height: h });
    const scaleX = cropWidth / w;
    const scaleY = cropHeight / h;
    const initialScale = Math.max(scaleX, scaleY) * 1.1;
    setScale(initialScale);
    setPosition({ x: 0, y: 0 });
    setLoading(false);

    // Optional face detection
    if ('FaceDetector' in window) {
      (async () => {
        try {
          const detector = new (window as any).FaceDetector({ maxDetectedFaces: 1 });
          const faces = await detector.detect(img);
          if (faces && faces.length > 0) {
            const face = faces[0].boundingBox;
            const dxOrig = w / 2 - (face.x + face.width / 2);
            const dyOrig = h / 2 - (face.y + face.height / 2);
            setPosition({ x: dxOrig * initialScale, y: dyOrig * initialScale });
            setFaceCenteringActive(true);
          }
        } catch (err) {
          console.warn('Face detection failed:', err);
        }
      })();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cropWidth, cropHeight]);

  // If the img element already has the image decoded (complete=true) before onLoad fires
  useEffect(() => {
    if (!isOpen || !imageUrl) return;
    // Small delay to let the img element mount and set its src
    const timer = setTimeout(() => {
      const el = imageRef.current;
      if (el && el.complete && el.naturalWidth > 0) {
        applyImageLoad(el);
      }
    }, 50);
    return () => clearTimeout(timer);
  }, [isOpen, imageUrl, applyImageLoad]);

  if (!isOpen) return null;

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    applyImageLoad(e.currentTarget);
  };

  const handleImageError = () => {
    setLoading(false);
    setLoadError(true);
  };

  // ─── Mouse drag ───────────────────────────────────────────────────────────────
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingRef.current = true;
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX - positionRef.current.x,
      y: e.clientY - positionRef.current.y,
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    setPosition({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y,
    });
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
    setIsDragging(false);
  };

  // ─── Touch drag ───────────────────────────────────────────────────────────────
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    const touch = e.touches[0];
    isDraggingRef.current = true;
    setIsDragging(true);
    dragStartRef.current = {
      x: touch.clientX - positionRef.current.x,
      y: touch.clientY - positionRef.current.y,
    };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDraggingRef.current || e.touches.length !== 1) return;
    const touch = e.touches[0];
    setPosition({
      x: touch.clientX - dragStartRef.current.x,
      y: touch.clientY - dragStartRef.current.y,
    });
  };

  const handleTouchEnd = () => {
    isDraggingRef.current = false;
    setIsDragging(false);
  };

  // ─── Zoom buttons ─────────────────────────────────────────────────────────────
  const zoomIn = () => setScale(s => Math.min(s * 1.15, 10));
  const zoomOut = () => setScale(s => Math.max(s / 1.15, 0.1));

  // ─── Save / crop ──────────────────────────────────────────────────────────────
  const handleSave = () => {
    const img = imageRef.current;
    if (!img || naturalSize.width === 0) return;
    setIsSaving(true);

    // High-res output canvas
    const outputWidth = aspectRatio === 1 ? 500 : Math.round(500 * aspectRatio);
    const outputHeight = Math.round(outputWidth / aspectRatio);

    const canvas = document.createElement('canvas');
    canvas.width = outputWidth;
    canvas.height = outputHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) { setIsSaving(false); return; }

    const S = scale;
    // How many display-px the full scaled image occupies
    const dispW = naturalSize.width * S;
    const dispH = naturalSize.height * S;

    // Top-left of the scaled image in the viewport's coordinate system
    // (viewport center is at viewWidth/2, viewHeight/2)
    const imgLeft = viewWidth  / 2 - dispW  / 2 + position.x;
    const imgTop  = viewHeight / 2 - dispH  / 2 + position.y;

    // Crop box top-left in viewport coordinates
    const cropLeft = (viewWidth  - cropWidth)  / 2;
    const cropTop  = (viewHeight - cropHeight) / 2;

    // Offset of the crop box relative to the scaled image's top-left
    const relLeft = cropLeft - imgLeft;
    const relTop  = cropTop  - imgTop;

    // Back-project to original image pixels
    const sourceX = relLeft / S;
    const sourceY = relTop  / S;
    const sourceW = cropWidth  / S;
    const sourceH = cropHeight / S;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    ctx.drawImage(img, sourceX, sourceY, sourceW, sourceH, 0, 0, outputWidth, outputHeight);

    canvas.toBlob(
      (blob) => {
        setIsSaving(false);
        if (blob) onSave(blob);
      },
      'image/jpeg',
      0.92
    );
  };

  return (
    <div className="cropper-modal-overlay" onClick={onClose}>
      <div className="cropper-modal-card animate-scale-in" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="cropper-modal-header">
          <h3 className="cropper-title">Adjust Profile Photo</h3>
          <button className="cropper-close-btn" type="button" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="cropper-modal-body">
          <p className="cropper-hint">
            <Move size={12} style={{ display: 'inline', marginRight: 4 }} />
            Drag or double-click &amp; hold to move · Scroll or use buttons to zoom
          </p>

          {/* Viewport */}
          <div
            ref={containerRef}
            className="cropper-viewport-container"
            style={{ width: `${viewWidth}px`, height: `${viewHeight}px` }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* Loading overlay */}
            {loading && (
              <div className="cropper-loading-overlay">
                <RefreshCw size={24} className="spin-icon" />
                <span>Loading Image...</span>
              </div>
            )}

            {/* Error overlay */}
            {loadError && (
              <div className="cropper-loading-overlay">
                <X size={24} color="#ef4444" />
                <span style={{ color: '#ef4444' }}>Failed to load image</span>
              </div>
            )}

            {/* Source Image — no crossOrigin so data: URLs work fine */}
            <img
              ref={imageRef}
              src={imageUrl}
              alt="Source"
              onLoad={handleImageLoad}
              onError={handleImageError}
              style={{
                transform: `translate3d(${position.x}px, ${position.y}px, 0) scale(${scale})`,
                transformOrigin: 'center center',
                position: 'absolute',
                display: loading || loadError ? 'none' : 'block',
                cursor: isDragging ? 'grabbing' : 'grab',
                pointerEvents: 'none',
                userSelect: 'none',
                maxWidth: 'none',
              }}
            />

            {/* Dark overlay mask — 4 pieces around the crop box */}
            {!loading && !loadError && (
              <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
                {/* Top */}
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: `${(viewHeight - cropHeight) / 2}px`, background: 'rgba(15,23,42,0.72)' }} />
                {/* Bottom */}
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: `${(viewHeight - cropHeight) / 2}px`, background: 'rgba(15,23,42,0.72)' }} />
                {/* Left */}
                <div style={{ position: 'absolute', top: `${(viewHeight - cropHeight) / 2}px`, left: 0, width: `${(viewWidth - cropWidth) / 2}px`, height: `${cropHeight}px`, background: 'rgba(15,23,42,0.72)' }} />
                {/* Right */}
                <div style={{ position: 'absolute', top: `${(viewHeight - cropHeight) / 2}px`, right: 0, width: `${(viewWidth - cropWidth) / 2}px`, height: `${cropHeight}px`, background: 'rgba(15,23,42,0.72)' }} />

                {/* Crop frame */}
                <div style={{
                  position: 'absolute',
                  top: `${(viewHeight - cropHeight) / 2}px`,
                  left: `${(viewWidth - cropWidth) / 2}px`,
                  width: `${cropWidth}px`,
                  height: `${cropHeight}px`,
                  border: '2px solid #10b981',
                  boxSizing: 'border-box',
                  borderRadius: aspectRatio === 1 ? '50%' : '12px',
                }}>
                  {/* Rule-of-thirds guides */}
                  <div style={{ position: 'absolute', top: '33.33%', left: 0, right: 0, borderTop: '1px dashed rgba(16,185,129,0.4)' }} />
                  <div style={{ position: 'absolute', top: '66.66%', left: 0, right: 0, borderTop: '1px dashed rgba(16,185,129,0.4)' }} />
                  <div style={{ position: 'absolute', left: '33.33%', top: 0, bottom: 0, borderLeft: '1px dashed rgba(16,185,129,0.4)' }} />
                  <div style={{ position: 'absolute', left: '66.66%', top: 0, bottom: 0, borderLeft: '1px dashed rgba(16,185,129,0.4)' }} />
                  {/* Corner handles */}
                  {[
                    { top: -3, left: -3 },
                    { top: -3, right: -3 },
                    { bottom: -3, left: -3 },
                    { bottom: -3, right: -3 },
                  ].map((pos, i) => (
                    <div key={i} style={{ position: 'absolute', width: 10, height: 10, background: '#10b981', borderRadius: 2, ...pos }} />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Face badge */}
          {faceCenteringActive && (
            <div className="face-centering-indicator">
              <span>✨ Auto Face Centered</span>
            </div>
          )}

          {/* Zoom Controls */}
          <div className="cropper-zoom-controls">
            <button
              type="button"
              className="zoom-btn"
              onClick={zoomOut}
              title="Zoom Out"
              aria-label="Zoom out"
            >
              <ZoomOut size={16} />
            </button>

            <input
              type="range"
              min="0.1"
              max="10"
              step="0.01"
              value={scale}
              onChange={(e) => setScale(parseFloat(e.target.value))}
              className="cropper-zoom-range"
              aria-label="Zoom level"
            />

            <button
              type="button"
              className="zoom-btn"
              onClick={zoomIn}
              title="Zoom In"
              aria-label="Zoom in"
            >
              <ZoomIn size={16} />
            </button>
          </div>

          {/* Zoom level display */}
          <div className="zoom-level-display">
            {Math.round(scale * 100)}%
          </div>
        </div>

        {/* Footer */}
        <div className="cropper-modal-footer">
          <button type="button" className="btn-crop-cancel" onClick={onClose} disabled={isSaving}>
            Cancel
          </button>
          <button type="button" className="btn-crop-save" onClick={handleSave} disabled={isSaving || loading || loadError}>
            {isSaving ? (
              <>
                <RefreshCw size={14} className="spin-icon" style={{ marginRight: 6 }} />
                Processing...
              </>
            ) : (
              <>
                <Check size={16} style={{ marginRight: 4 }} /> Done Crop
              </>
            )}
          </button>
        </div>
      </div>

      <style jsx global>{`
        .cropper-modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 99999;
          background: rgba(15, 23, 42, 0.65);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1.5rem;
        }

        .cropper-modal-card {
          background: rgba(255, 255, 255, 0.97);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(226, 232, 240, 0.8);
          border-radius: 20px;
          width: 100%;
          max-width: 430px;
          box-shadow: 0 25px 60px -12px rgba(0, 0, 0, 0.25);
          overflow: hidden;
          box-sizing: border-box;
        }

        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.92); }
          to   { opacity: 1; transform: scale(1); }
        }
        .animate-scale-in {
          animation: scaleIn 0.2s ease-out;
        }

        .cropper-modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1.1rem 1.5rem;
          border-bottom: 1px solid #e2e8f0;
        }

        .cropper-title {
          font-size: 1.05rem;
          font-weight: 800;
          color: #0f172a;
          margin: 0;
        }

        .cropper-close-btn {
          background: transparent;
          border: none;
          color: #64748b;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 4px;
          border-radius: 50%;
          transition: background 0.2s;
        }
        .cropper-close-btn:hover { background: #f1f5f9; color: #0f172a; }

        .cropper-modal-body {
          padding: 1.25rem 1.5rem;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .cropper-hint {
          font-size: 0.8rem;
          color: #64748b;
          text-align: center;
          margin: 0 0 1rem;
          line-height: 1.5;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
        }

        .cropper-viewport-container {
          position: relative;
          background: #020617;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: inset 0 2px 8px rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          touch-action: none;
        }

        .cropper-loading-overlay {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          color: #94a3b8;
          font-size: 0.85rem;
          background: #0f172a;
          z-index: 10;
        }

        .spin-icon {
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }

        .face-centering-indicator {
          margin-top: 0.6rem;
          background: #ecfdf5;
          color: #047857;
          border: 1px solid #a7f3d0;
          font-size: 0.74rem;
          font-weight: 700;
          padding: 3px 10px;
          border-radius: 9999px;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        /* ── Zoom Controls ──────────────────────────────────── */
        .cropper-zoom-controls {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 0.6rem;
          margin-top: 1rem;
          padding: 0 0.25rem;
          box-sizing: border-box;
        }

        .zoom-btn {
          flex-shrink: 0;
          width: 34px;
          height: 34px;
          border-radius: 8px;
          border: 1.5px solid #e2e8f0;
          background: #f8fafc;
          color: #334155;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.18s;
          padding: 0;
        }
        .zoom-btn:hover {
          background: #10b981;
          border-color: #10b981;
          color: #fff;
          box-shadow: 0 3px 8px rgba(16, 185, 129, 0.3);
        }
        .zoom-btn:active {
          transform: scale(0.93);
        }

        .cropper-zoom-range {
          flex: 1;
          height: 5px;
          border-radius: 9999px;
          background: linear-gradient(to right, #10b981 0%, #10b981 calc(var(--val, 50%)), #cbd5e1 calc(var(--val, 50%)), #cbd5e1 100%);
          outline: none;
          cursor: pointer;
          accent-color: #10b981;
          -webkit-appearance: none;
        }
        .cropper-zoom-range::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #10b981;
          border: 2px solid white;
          box-shadow: 0 1px 4px rgba(0,0,0,0.2);
          cursor: pointer;
        }
        .cropper-zoom-range::-webkit-slider-runnable-track {
          height: 5px;
          border-radius: 9999px;
        }

        .zoom-level-display {
          margin-top: 0.35rem;
          font-size: 0.75rem;
          font-weight: 700;
          color: #64748b;
          letter-spacing: 0.04em;
        }

        /* ── Footer ─────────────────────────────────────────── */
        .cropper-modal-footer {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 0.75rem;
          padding: 1rem 1.5rem;
          border-top: 1px solid #e2e8f0;
          background: #f8fafc;
        }

        .btn-crop-cancel {
          padding: 0.55rem 1.25rem;
          border-radius: 10px;
          font-size: 0.88rem;
          font-weight: 600;
          background: #fff;
          color: #334155;
          border: 1px solid #cbd5e1;
          cursor: pointer;
          transition: all 0.18s;
        }
        .btn-crop-cancel:hover:not(:disabled) { background: #f8fafc; border-color: #94a3b8; }
        .btn-crop-cancel:disabled { opacity: 0.5; cursor: not-allowed; }

        .btn-crop-save {
          padding: 0.55rem 1.4rem;
          border-radius: 10px;
          font-size: 0.88rem;
          font-weight: 700;
          background: #10b981;
          color: #fff;
          border: 1px solid #10b981;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.18s;
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);
        }
        .btn-crop-save:hover:not(:disabled) {
          background: #059669;
          border-color: #059669;
          box-shadow: 0 6px 16px rgba(16, 185, 129, 0.3);
        }
        .btn-crop-save:disabled { opacity: 0.55; cursor: not-allowed; box-shadow: none; }
      `}</style>
    </div>
  );
}
