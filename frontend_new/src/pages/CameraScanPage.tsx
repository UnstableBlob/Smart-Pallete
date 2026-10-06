import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { api } from '../services/api';
import { sounds } from '../services/audio';
import { SAMPLE_FRIDGE_PHOTOS, getIngredientEmoji } from '../services/mockData';
import { VerificationModal } from '../components/VerificationModal/VerificationModal';
import { ScanningTipsModal } from '../components/ScanningTipsModal/ScanningTipsModal';
import { X, Zap, Image as ImageIcon, HelpCircle, Camera } from 'lucide-react';

const INFERENCE_STEPS = [
  'Analyzing fridge snapshot...',
  'Identifying ingredients...',
  'Matching pantry inventory...',
];

export const CameraScanPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    torchEnabled,
    toggleTorch,
    userId,
    setDetectedBuffer,
    addToast,
  } = useAppStore();

  const [activeSource, setActiveSource] = useState<'sample' | 'webcam'>('sample');
  const [selectedSampleIndex, setSelectedSampleIndex] = useState(0);
  const [isInferencing, setIsInferencing] = useState(false);
  const [inferenceStatusText, setInferenceStatusText] = useState(INFERENCE_STEPS[0]);
  const [isVerificationOpen, setIsVerificationOpen] = useState(false);
  const [isTipsOpen, setIsTipsOpen] = useState(false);
  const [isCapturingAnimation, setIsCapturingAnimation] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize live webcam if user selects webcam mode
  useEffect(() => {
    let stream: MediaStream | null = null;
    if (activeSource === 'webcam') {
      navigator.mediaDevices
        ?.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        })
        .then((s) => {
          stream = s;
          if (videoRef.current) {
            videoRef.current.srcObject = s;
            videoRef.current.play().catch(() => {});
          }
        })
        .catch(() => {
          setActiveSource('sample');
          addToast('Webcam not accessible, switched to simulated shelf view.', 'info');
        });
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [activeSource, addToast]);

  // Section 5.1: Cycle status text every 800ms during inference
  useEffect(() => {
    if (!isInferencing) return;
    let step = 0;
    const interval = setInterval(() => {
      step = (step + 1) % INFERENCE_STEPS.length;
      setInferenceStatusText(INFERENCE_STEPS[step]);
    }, 800);

    return () => clearInterval(interval);
  }, [isInferencing]);

  // Handle Shutter Trigger
  const triggerShutter = async () => {
    if (isInferencing) return;

    sounds.playShutter();
    setIsCapturingAnimation(true);
    setIsInferencing(true);

    setTimeout(() => {
      setIsCapturingAnimation(false);
    }, 250);

    try {
      const activeSample = SAMPLE_FRIDGE_PHOTOS[selectedSampleIndex];
      const imageUrl = activeSource === 'sample' ? activeSample.url : 'data:image/jpeg;base64,camera_snapshot';

      // Call API scan endpoint (Backend /api/v1/vision/scan with fallback)
      const results = await api.scanFridgeImage(imageUrl, userId || 'usr_kitchen_master_01');

      // Populate detectedBuffer in store
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

      // If sample was active and has specific items, merge them
      if (activeSource === 'sample' && activeSample.detectedItems) {
        activeSample.detectedItems.forEach((sampleItem, idx) => {
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
      setIsVerificationOpen(true);
    } catch {
      setIsInferencing(false);
      addToast('Error scanning image, please try again.', 'error');
    }
  };

  // Handle file gallery picker upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    sounds.playShutter();
    setIsInferencing(true);

    try {
      const uploadRes = await api.uploadFile(file);
      const results = await api.scanFridgeImage(uploadRes.url, userId || 'usr_kitchen_master_01');

      const mappedBuffer = results.map((item) => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        category: item.category,
        confidence: item.confidence,
        emoji: getIngredientEmoji(item.name),
        addedAt: 'Uploaded from gallery',
      }));

      setDetectedBuffer(mappedBuffer);
      setIsInferencing(false);
      setIsVerificationOpen(true);
    } catch {
      setIsInferencing(false);
      addToast('Failed to process uploaded file', 'error');
    }
  };

  return (
    <div id="camera-page-container">
      {/* 3.1 Header Bar */}
      <header id="scan-header-bar">
        <button
          id="btn-close-camera"
          onClick={() => {
            sounds.playTap();
            navigate('/pantry');
          }}
          title="Back to pantry"
          aria-label="Back to pantry"
        >
          <X size={20} />
        </button>

        <div id="camera-title-badge">
          <Camera size={14} color="#4ADE80" />
          <span>Smart Palette Scan</span>
        </div>

        <button
          id="btn-toggle-flash"
          className={torchEnabled ? 'torch-on' : ''}
          onClick={() => {
            sounds.playTap();
            toggleTorch();
          }}
          title={torchEnabled ? 'Torch On' : 'Torch Off'}
          aria-label="Toggle camera flash"
        >
          <Zap size={20} />
        </button>
      </header>

      {/* Main Viewfinder Wrapper */}
      <main id="viewfinder-wrapper">
        <div id="camera-feed-container">
          {/* Feed Switcher (Sample Presets vs Webcam) */}
          <div className="sample-shelf-selector-bar">
            {SAMPLE_FRIDGE_PHOTOS.map((sample, idx) => (
              <button
                key={sample.id}
                className={`sample-pill-btn ${activeSource === 'sample' && selectedSampleIndex === idx ? 'active' : ''}`}
                onClick={() => {
                  sounds.playTap();
                  setActiveSource('sample');
                  setSelectedSampleIndex(idx);
                }}
              >
                {sample.title}
              </button>
            ))}
            <button
              className={`sample-pill-btn ${activeSource === 'webcam' ? 'active' : ''}`}
              onClick={() => {
                sounds.playTap();
                setActiveSource('webcam');
              }}
            >
              📹 Live Cam
            </button>
          </div>

          {/* Video or Simulated Photo Feed */}
          {activeSource === 'webcam' ? (
            <video
              id="webcam-preview"
              ref={videoRef}
              playsInline
              autoPlay
              muted
              style={{
                filter: torchEnabled ? 'brightness(1.3) contrast(1.1)' : 'none',
              }}
            />
          ) : (
            <img
              src={SAMPLE_FRIDGE_PHOTOS[selectedSampleIndex].url}
              alt="Refrigerator Shelf Preview"
              className="simulated-shelf-img"
              style={{
                filter: torchEnabled ? 'brightness(1.25) contrast(1.15)' : 'none',
              }}
            />
          )}

          {/* Viewfinder Overlay Frame */}
          <div id="viewfinder-overlay-frame">
            <div className="corner-bracket top-left" />
            <div className="corner-bracket top-right" />
            <div className="corner-bracket bottom-left" />
            <div className="corner-bracket bottom-right" />
            <p id="viewfinder-instruction-text">
              Align open fridge or pantry shelves within frame
            </p>
          </div>

          {/* Section 5.1 Scan & Inference Loading State */}
          {isInferencing && (
            <div className="scan-inference-overlay" aria-live="assertive">
              <div className="scanning-laser-line" />
              <div className="inference-status-card">
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '9999px',
                  background: 'rgba(74, 222, 128, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Camera size={24} color="#4ADE80" />
                </div>
                <div className="pulsing-status-text">{inferenceStatusText}</div>
                <span style={{ fontSize: '12px', color: '#94A3B8' }}>
                  YOLO-World Open-Vocabulary Inference
                </span>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* 3.1 Footer Controls Bar */}
      <footer id="camera-controls-bar">
        <div id="controls-wrapper">
          {/* Gallery Picker */}
          <button
            id="btn-gallery-picker"
            title="Upload photo from gallery"
            aria-label="Upload photo from gallery"
            onClick={() => fileInputRef.current?.click()}
          >
            <ImageIcon size={22} />
            <input
              type="file"
              id="input-hidden-file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleFileUpload}
            />
          </button>

          {/* Shutter Button */}
          <button
            id="btn-shutter-outer"
            className={isCapturingAnimation ? 'capturing' : ''}
            onClick={triggerShutter}
            disabled={isInferencing}
            title="Capture Shelf Photo"
            aria-label="Capture Shelf Photo"
          >
            <div id="btn-shutter-inner" />
          </button>

          {/* Tips Modal Trigger */}
          <button
            id="btn-scanning-tips-modal"
            title="Scanning Tips"
            aria-label="Scanning Tips"
            onClick={() => {
              sounds.playTap();
              setIsTipsOpen(true);
            }}
          >
            <HelpCircle size={22} />
          </button>
        </div>
      </footer>

      {/* Section 3.2: Interactive Verification Drawer */}
      <VerificationModal
        isOpen={isVerificationOpen}
        onClose={() => setIsVerificationOpen(false)}
        onRescan={() => {
          setIsVerificationOpen(false);
          triggerShutter();
        }}
      />

      {/* Tips Modal */}
      <ScanningTipsModal isOpen={isTipsOpen} onClose={() => setIsTipsOpen(false)} />
    </div>
  );
};
