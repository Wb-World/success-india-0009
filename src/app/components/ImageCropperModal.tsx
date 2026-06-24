'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ZoomIn, ZoomOut, Check, X, RefreshCw } from 'lucide-react';

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
  const [faceCenteringActive, setFaceCenteringActive] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Viewport and Crop Box size configuration (in displayed px)
  const viewWidth = 360;
  const viewHeight = 360;
  
  // Calculate crop box size based on aspect ratio
  let cropWidth = 280;
  let cropHeight = 280;
  if (aspectRatio < 1) {
    // e.g. 4:5 -> 0.8
    cropHeight = 300;
    cropWidth = cropHeight * aspectRatio; // 240
  } else if (aspectRatio > 1) {
    cropWidth = 300;
    cropHeight = cropWidth / aspectRatio;
  }

  // Reset states when a new image URL is loaded
  useEffect(() => {
    if (isOpen && imageUrl) {
      setScale(1);
      setPosition({ x: 0, y: 0 });
      setLoading(true);
      setFaceCenteringActive(false);
    }
  }, [isOpen, imageUrl]);

  if (!isOpen) return null;

  const handleImageLoad = async (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    const w = img.naturalWidth;
    const h = img.naturalHeight;
    setNaturalSize({ width: w, height: h });
    setLoading(false);

    // Initial scale to cover the crop box area
    const scaleX = cropWidth / w;
    const scaleY = cropHeight / h;
    const initialScale = Math.max(scaleX, scaleY) * 1.1; // scale slightly larger to allow comfortable cropping
    setScale(initialScale);

    // Run progressive face detection using native FaceDetector if supported
    if ('FaceDetector' in window) {
      try {
        const detector = new (window as any).FaceDetector({ maxDetectedFaces: 1 });
        const faces = await detector.detect(img);
        if (faces && faces.length > 0) {
          const face = faces[0].boundingBox;
          const faceCenterX = face.x + face.width / 2;
          const faceCenterY = face.y + face.height / 2;

          // Center crop box on the detected face
          // offset of face center from image center (in original pixels)
          const dxOrig = w / 2 - faceCenterX;
          const dyOrig = h / 2 - faceCenterY;

          // set position in displayed pixels
          setPosition({
            x: dxOrig * initialScale,
            y: dyOrig * initialScale,
          });
          setFaceCenteringActive(true);
        }
      } catch (err) {
        console.warn('Browser face detection failed:', err);
      }
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    const touch = e.touches[0];
    setIsDragging(true);
    setDragStart({ x: touch.clientX - position.x, y: touch.clientY - position.y });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    const touch = e.touches[0];
    setPosition({
      x: touch.clientX - dragStart.x,
      y: touch.clientY - dragStart.y,
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomIntensity = 0.1;
    const factor = e.deltaY < 0 ? 1 + zoomIntensity : 1 - zoomIntensity;
    const newScale = Math.min(Math.max(scale * factor, 0.1), 10);
    setScale(newScale);
  };

  const handleSave = () => {
    const img = imageRef.current;
    if (!img || naturalSize.width === 0) return;

    // Create canvas with high-res target crop output
    const canvas = document.createElement('canvas');
    // Save cropped image in high resolution matching ratio
    const outputWidth = aspectRatio === 1 ? 500 : 400;
    const outputHeight = Math.round(outputWidth / aspectRatio); // 500 or 500 for 4:5 -> 400:500

    canvas.width = outputWidth;
    canvas.height = outputHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Calculate source coords based on display properties
    const S = scale;
    const dispWidth = naturalSize.width * S;
    const dispHeight = naturalSize.height * S;

    // Center offset relative to crop box
    // leftDisp/topDisp are cropBox top-left coords relative to image top-left
    const leftDisp = dispWidth / 2 - position.x - cropWidth / 2;
    const topDisp = dispHeight / 2 - position.y - cropHeight / 2;

    // Translate coordinates back to original image
    const sourceX = leftDisp / S;
    const sourceY = topDisp / S;
    const sourceW = cropWidth / S;
    const sourceH = cropHeight / S;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Draw slice of image onto output canvas
    ctx.drawImage(
      img,
      sourceX,
      sourceY,
      sourceW,
      sourceH,
      0,
      0,
      outputWidth,
      outputHeight
    );

    // Convert canvas image to Blob
    canvas.toBlob(
      (blob) => {
        if (blob) {
          onSave(blob);
        }
      },
      'image/jpeg',
      0.92
    );
  };

  return (
    <div className="cropper-modal-overlay">
      <div className="cropper-modal-card animate-scale-in">
        <div className="cropper-modal-header">
          <h3 className="cropper-title">Adjust Profile Photo</h3>
          <button className="cropper-close-btn" type="button" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="cropper-modal-body">
          <p className="cropper-hint">
            Drag to reposition. Use the slider or mouse wheel to zoom.
          </p>

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
            onWheel={handleWheel}
          >
            {loading && (
              <div className="cropper-loading-overlay">
                <RefreshCw size={24} className="spin-icon" />
                <span>Loading Image...</span>
              </div>
            )}

            {/* Source Image */}
            <img
              ref={imageRef}
              src={imageUrl}
              alt="Source"
              crossOrigin="anonymous"
              onLoad={handleImageLoad}
              style={{
                transform: `translate3d(${position.x}px, ${position.y}px, 0) scale(${scale})`,
                transformOrigin: 'center center',
                position: 'absolute',
                display: loading ? 'none' : 'block',
                cursor: isDragging ? 'grabbing' : 'grab',
                pointerEvents: 'none', // disable native drag so handleMouseDown works perfectly
                userSelect: 'none',
              }}
            />

            {/* Visual Crop Overlay Mask */}
            <div className="cropper-overlay-mask" style={{ pointerEvents: 'none' }}>
              {/* Top border mask */}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: `${(viewHeight - cropHeight) / 2}px`,
                  background: 'rgba(15, 23, 42, 0.75)',
                }}
              />
              {/* Bottom border mask */}
              <div
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: `${(viewHeight - cropHeight) / 2}px`,
                  background: 'rgba(15, 23, 42, 0.75)',
                }}
              />
              {/* Left border mask */}
              <div
                style={{
                  position: 'absolute',
                  top: `${(viewHeight - cropHeight) / 2}px`,
                  left: 0,
                  width: `${(viewWidth - cropWidth) / 2}px`,
                  height: `${cropHeight}px`,
                  background: 'rgba(15, 23, 42, 0.75)',
                }}
              />
              {/* Right border mask */}
              <div
                style={{
                  position: 'absolute',
                  top: `${(viewHeight - cropHeight) / 2}px`,
                  right: 0,
                  width: `${(viewWidth - cropWidth) / 2}px`,
                  height: `${cropHeight}px`,
                  background: 'rgba(15, 23, 42, 0.75)',
                }}
              />

              {/* Crop box border/outline */}
              <div
                style={{
                  position: 'absolute',
                  top: `${(viewHeight - cropHeight) / 2}px`,
                  left: `${(viewWidth - cropWidth) / 2}px`,
                  width: `${cropWidth}px`,
                  height: `${cropHeight}px`,
                  border: '2px solid #10b981',
                  boxSizing: 'border-box',
                  borderRadius: aspectRatio === 1 ? '50%' : '12px', // Circular crop for 1:1, rounded rectangular for 4:5
                  boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.2)',
                }}
              >
                {/* Guide Lines */}
                <div style={{ position: 'absolute', top: '33.33%', left: 0, right: 0, borderTop: '1px dashed rgba(16, 185, 129, 0.35)' }} />
                <div style={{ position: 'absolute', top: '66.66%', left: 0, right: 0, borderTop: '1px dashed rgba(16, 185, 129, 0.35)' }} />
                <div style={{ position: 'absolute', left: '33.33%', top: 0, bottom: 0, borderLeft: '1px dashed rgba(16, 185, 129, 0.35)' }} />
                <div style={{ position: 'absolute', left: '66.66%', top: 0, bottom: 0, borderLeft: '1px dashed rgba(16, 185, 129, 0.35)' }} />
              </div>
            </div>
          </div>

          {/* Face detection badge indicator */}
          {faceCenteringActive && (
            <div className="face-centering-indicator">
              <span>✨ Auto Face Centered</span>
            </div>
          )}

          {/* Zoom Slider Panel */}
          <div className="cropper-slider-panel">
            <ZoomOut size={16} color="#64748b" />
            <input
              type="range"
              min="0.1"
              max="4"
              step="0.01"
              value={scale}
              onChange={(e) => setScale(parseFloat(e.target.value))}
              className="cropper-zoom-range"
            />
            <ZoomIn size={16} color="#64748b" />
          </div>
        </div>

        <div className="cropper-modal-footer">
          <button type="button" className="btn-crop-cancel" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="btn-crop-save" onClick={handleSave}>
            <Check size={16} style={{ marginRight: '4px' }} /> Done Crop
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
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(226, 232, 240, 0.8);
          border-radius: 20px;
          width: 100%;
          max-width: 420px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.15);
          overflow: hidden;
          box-sizing: border-box;
        }

        .cropper-modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1.25rem 1.5rem;
          border-bottom: 1px solid #e2e8f0;
        }

        .cropper-title {
          font-size: 1.1rem;
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

        .cropper-close-btn:hover {
          background: #f1f5f9;
          color: #0f172a;
        }

        .cropper-modal-body {
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .cropper-hint {
          font-size: 0.85rem;
          color: #64748b;
          text-align: center;
          margin: 0 0 1.25rem;
          line-height: 1.4;
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
          animation: spin 1s linear infinite;
        }

        .face-centering-indicator {
          margin-top: 0.75rem;
          background: #ecfdf5;
          color: #047857;
          border: 1px solid #a7f3d0;
          font-size: 0.75rem;
          font-weight: 700;
          padding: 4px 10px;
          border-radius: 9999px;
          display: flex;
          align-items: center;
          gap: 4px;
          box-shadow: 0 2px 4px rgba(4, 120, 87, 0.05);
        }

        .cropper-slider-panel {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-top: 1.25rem;
          padding: 0 0.5rem;
          box-sizing: border-box;
        }

        .cropper-zoom-range {
          flex: 1;
          height: 5px;
          border-radius: 9999px;
          background: #cbd5e1;
          outline: none;
          cursor: pointer;
          accent-color: #10b981;
          -webkit-appearance: none;
        }

        .cropper-zoom-range::-webkit-slider-runnable-track {
          height: 5px;
        }

        .cropper-modal-footer {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 0.75rem;
          padding: 1.25rem 1.5rem;
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
          transition: all 0.2s;
        }

        .btn-crop-cancel:hover {
          background: #f8fafc;
          border-color: #94a3b8;
        }

        .btn-crop-save {
          padding: 0.55rem 1.25rem;
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
          transition: all 0.2s;
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.15);
        }

        .btn-crop-save:hover {
          background: #059669;
          border-color: #059669;
          box-shadow: 0 6px 16px rgba(16, 185, 129, 0.25);
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
