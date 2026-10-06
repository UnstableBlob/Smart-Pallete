import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { api } from '../services/api';
import { sounds } from '../services/audio';
import { SAMPLE_FRIDGE_PHOTOS, getIngredientEmoji } from '../services/mockData';
import { VerificationModal } from '../components/VerificationModal/VerificationModal';
import { Upload, Camera, ArrowLeft } from 'lucide-react';

const INFERENCE_STEPS = [
  'Analyzing image…',
  'Identifying ingredients…',
  'Matching your pantry…',
];

type ScanStep = 1 | 2 | 3;

export const CameraScanPage: React.FC = () => {
  const navigate = useNavigate();
  const { userId, setDetectedBuffer, addToast } = useAppStore();

  const [scanStep, setScanStep] = useState<ScanStep>(1);
  const [activeSource, setActiveSource] = useState<'sample' | 'webcam'>('sample');
  const [selectedSampleIndex, setSelectedSampleIndex] = useState(0);
  const [isInferencing, setIsInferencing] = useState(false);
  const [inferenceStatusText, setInferenceStatusText] = useState(INFERENCE_STEPS[0]);
  const [isVerificationOpen, setIsVerificationOpen] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Webcam setup
  useEffect(() => {
    let stream: MediaStream | null = null;
    if (activeSource === 'webcam') {
      navigator.mediaDevices
        ?.getUserMedia({ video: { facingMode: 'environment' }, audio: false })
        .then((s) => {
          stream = s;
          if (videoRef.current) {
            videoRef.current.srcObject = s;
            videoRef.current.play().catch(() => {});
          }
        })
        .catch(() => {
          setActiveSource('sample');
          addToast('Camera not accessible — switched to sample images.', 'info');
        });
    }
    return () => {
      if (stream) stream.getTracks().forEach((t) => t.stop());
    };
  }, [activeSource, addToast]);

  // Cycle inference status text
  useEffect(() => {
    if (!isInferencing) return;
    let step = 0;
    const interval = setInterval(() => {
      step = (step + 1) % INFERENCE_STEPS.length;
      setInferenceStatusText(INFERENCE_STEPS[step]);
    }, 900);
    return () => clearInterval(interval);
  }, [isInferencing]);

  const runInference = async (imageUrl: string, activeSampleIdx?: number) => {
    if (isInferencing) return;
    sounds.playShutter();
    setIsInferencing(true);
    setScanStep(2);

    try {
      const results = await api.scanFridgeImage(imageUrl, userId || 'usr_kitchen_master_01');

      const mappedBuffer = results.map((item) => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        category: item.category,
        confidence: item.confidence,
        emoji: getIngredientEmoji(item.name),
        addedAt: 'Just scanned',
      }));

      // Merge sample-specific items if using sample
      const sampleIdx = activeSampleIdx ?? selectedSampleIndex;
      if (activeSource === 'sample') {
        const activeSample = SAMPLE_FRIDGE_PHOTOS[sampleIdx];
        activeSample?.detectedItems?.forEach((sampleItem, idx) => {
          if (!mappedBuffer.find((m) => m.name.toLowerCase() === sampleItem.name.toLowerCase())) {
            mappedBuffer.push({
              id: `det-sample-${idx}`,
              name: sampleItem.name,
              quantity: sampleItem.quantity,
              unit: sampleItem.unit,
              category: sampleItem.category,
              confidence: sampleItem.confidence,
              emoji: getIngredientEmoji(sampleItem.name),
              addedAt: 'Just scanned',
            });
          }
        });
      }

      setDetectedBuffer(mappedBuffer);
      setIsInferencing(false);
      setScanStep(3);
      setIsVerificationOpen(true);
    } catch {
      setIsInferencing(false);
      setScanStep(1);
      addToast('Failed to scan image — please try again.', 'error');
    }
  };

  const handleSampleScan = () => {
    const activeSample = SAMPLE_FRIDGE_PHOTOS[selectedSampleIndex];
    runInference(activeSample.url, selectedSampleIndex);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    sounds.playShutter();
    setIsInferencing(true);
    setScanStep(2);

    try {
      const uploadRes = await api.uploadFile(file);
      runInference(uploadRes.url);
    } catch {
      setIsInferencing(false);
      setScanStep(1);
      addToast('Failed to upload file.', 'error');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (!file || !file.type.startsWith('image/')) {
      addToast('Please drop an image file.', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      runInference(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="content-container">
      <div className="scan-page-container">
        {/* Page header */}
        <div className="page-header" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <button
            className="btn btn-ghost btn-icon"
            onClick={() => {
              sounds.playTap();
              navigate('/pantry');
            }}
            aria-label="Back to pantry"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="page-title" style={{ fontSize: 'var(--text-h1-size)' }}>
              Scan your kitchen
            </h1>
            <p className="page-subtitle">
              Upload a photo to detect and add ingredients automatically.
            </p>
          </div>
        </div>

        {/* Step indicator */}
        <div className="scan-stepper" role="status" aria-live="polite">
          <div className={`scan-step ${scanStep >= 1 ? 'active' : ''}`}>
            <span className="scan-step-dot" />
            <span>Capture</span>
          </div>
          <div className="scan-step-divider" />
          <div className={`scan-step ${scanStep >= 2 ? 'active' : ''}`}>
            <span className="scan-step-dot" />
            <span>Review</span>
          </div>
          <div className="scan-step-divider" />
          <div className={`scan-step ${scanStep >= 3 ? 'active' : ''}`}>
            <span className="scan-step-dot" />
            <span>Confirm</span>
          </div>
        </div>

        {/* Main content: upload zone or loading */}
        {!isInferencing ? (
          <>
            {/* Drop zone */}
            <div
              className={`scan-dropzone ${isDragOver ? 'drag-over' : ''}`}
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
              onDragLeave={() => setIsDragOver(false)}
              onClick={() => fileInputRef.current?.click()}
              role="button"
              tabIndex={0}
              aria-label="Upload a photo — click or drag and drop"
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  fileInputRef.current?.click();
                }
              }}
            >
              <div className="scan-dropzone-icon">
                <Upload size={40} aria-hidden="true" />
              </div>
              <p className="scan-dropzone-title">Upload a photo of your fridge or pantry</p>
              <p className="scan-dropzone-sub">
                Drag and drop an image, or use one of the options below
              </p>
              <div className="scan-dropzone-actions" onClick={(e) => e.stopPropagation()}>
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    sounds.playTap();
                    if (activeSource === 'webcam') {
                      handleSampleScan();
                    } else {
                      setActiveSource('webcam');
                    }
                  }}
                  id="btn-take-photo"
                >
                  <Camera size={16} />
                  <span>Take photo</span>
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    sounds.playTap();
                    fileInputRef.current?.click();
                  }}
                  id="btn-choose-file"
                >
                  <Upload size={16} />
                  <span>Choose file</span>
                </button>
              </div>
            </div>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              id="input-hidden-file"
              accept="image/*"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
              aria-hidden="true"
            />

            {/* Sample images */}
            <div style={{ marginTop: 'var(--space-5)' }}>
              <p
                style={{
                  fontSize: 'var(--text-body-sm-size)',
                  color: 'var(--color-text-secondary)',
                  marginBottom: 'var(--space-3)',
                  fontWeight: 500,
                }}
              >
                Or try a sample fridge scan
              </p>
              <div className="sample-picker-row">
                {SAMPLE_FRIDGE_PHOTOS.map((sample, idx) => (
                  <button
                    key={sample.id}
                    className={`sample-thumb-btn ${
                      activeSource === 'sample' && selectedSampleIndex === idx ? 'active' : ''
                    }`}
                    onClick={() => {
                      sounds.playTap();
                      setActiveSource('sample');
                      setSelectedSampleIndex(idx);
                    }}
                    aria-label={`Select sample: ${sample.title}`}
                    aria-pressed={activeSource === 'sample' && selectedSampleIndex === idx}
                  >
                    <img
                      src={sample.url}
                      alt={sample.title}
                      className="sample-thumb-img"
                    />
                    <span className="sample-thumb-label">{sample.title}</span>
                  </button>
                ))}
              </div>

              {activeSource === 'sample' && (
                <button
                  className="btn btn-primary"
                  style={{ marginTop: 'var(--space-4)', width: '100%' }}
                  onClick={() => {
                    sounds.playTap();
                    handleSampleScan();
                  }}
                  id="btn-scan-sample"
                >
                  Scan selected photo
                </button>
              )}

              {/* Webcam preview */}
              {activeSource === 'webcam' && (
                <div style={{ marginTop: 'var(--space-4)' }}>
                  <video
                    ref={videoRef}
                    playsInline
                    autoPlay
                    muted
                    style={{
                      width: '100%',
                      borderRadius: 'var(--radius-lg)',
                      backgroundColor: 'var(--color-bg-subtle)',
                      aspectRatio: '16/9',
                      objectFit: 'cover',
                    }}
                    aria-label="Live camera preview"
                  />
                  <button
                    className="btn btn-primary"
                    style={{ marginTop: 'var(--space-3)', width: '100%' }}
                    onClick={() => {
                      sounds.playTap();
                      handleSampleScan();
                    }}
                    id="btn-capture-webcam"
                  >
                    <Camera size={16} />
                    <span>Capture photo</span>
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          /* Loading state */
          <div className="scan-loading-state" role="status" aria-live="assertive">
            <div
              className="scanning-indicator"
              style={{ flexDirection: 'column', gap: 'var(--space-4)' }}
            >
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true">
                <circle cx="24" cy="24" r="20" stroke="var(--color-border-default)" strokeWidth="4" />
                <path
                  d="M24 4 A20 20 0 0 1 44 24"
                  stroke="var(--color-accent-600)"
                  strokeWidth="4"
                  strokeLinecap="round"
                  style={{ animation: 'spin 1s linear infinite' }}
                />
              </svg>
            </div>
            <p
              style={{
                fontSize: 'var(--text-h3-size)',
                fontWeight: 600,
                color: 'var(--color-text-primary)',
              }}
            >
              {inferenceStatusText}
            </p>
            <p style={{ fontSize: 'var(--text-body-sm-size)', color: 'var(--color-text-secondary)' }}>
              This usually takes a few seconds
            </p>
          </div>
        )}

        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); transform-origin: 24px 24px; }
            to   { transform: rotate(360deg); transform-origin: 24px 24px; }
          }
        `}</style>
      </div>

      {/* Verification modal (review + confirm step) */}
      <VerificationModal
        isOpen={isVerificationOpen}
        onClose={() => {
          setIsVerificationOpen(false);
          setScanStep(1);
        }}
        onRescan={() => {
          setIsVerificationOpen(false);
          setScanStep(1);
        }}
      />
    </div>
  );
};
