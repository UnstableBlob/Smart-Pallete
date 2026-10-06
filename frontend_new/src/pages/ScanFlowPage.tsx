import { Camera, Check, FileImage, Upload, X } from 'lucide-react';
import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { VerificationModal } from '../components/VerificationModal/VerificationModal';
import { api } from '../services/api';
import { getIngredientEmoji } from '../services/mockData';
import { useAppStore } from '../store/useAppStore';

export const ScanFlowPage: React.FC = () => {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const { userId, setDetectedBuffer, detectedBuffer, addToast } = useAppStore();
  const [preview, setPreview] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isReviewOpen, setIsReviewOpen] = useState(false);

  const processImage = async (file: File) => {
    setPreview(URL.createObjectURL(file));
    setIsScanning(true);
    try {
      const upload = await api.uploadFile(file);
      const results = await api.scanFridgeImage(upload.url, userId || 'usr_kitchen_master_01');
      setDetectedBuffer(results.map((item) => ({ ...item, emoji: getIngredientEmoji(item.name), addedAt: 'Just scanned' })));
      setIsReviewOpen(true);
    } catch {
      addToast('Could not process that image. Please try again.', 'error');
    } finally {
      setIsScanning(false);
    }
  };

  const reset = () => { setPreview(null); setDetectedBuffer([]); setIsReviewOpen(false); };

  return (
    <main className="scan-page-container page-surface">
      <button className="scan-close-button" onClick={() => navigate('/pantry')} aria-label="Close scan"><X size={19} /></button>
      <header className="page-header scan-page-header"><p className="eyebrow">Kitchen inventory</p><h1 className="page-title">Scan your kitchen</h1><p className="page-subtitle">Add what is on hand and keep your pantry current.</p></header>
      <div className="scan-stepper" aria-label="Scan progress"><span className="scan-step active"><span className="scan-step-dot" />1 Capture</span><span className="scan-step-divider" /><span className={`scan-step ${preview ? 'active' : ''}`}><span className="scan-step-dot" />2 Review</span><span className="scan-step-divider" /><span className="scan-step"><span className="scan-step-dot" />3 Confirm</span></div>
      {!preview ? <section className="scan-dropzone" onClick={() => inputRef.current?.click()}><Upload size={30} className="scan-dropzone-icon" /><h2 className="scan-dropzone-title">Upload a photo of your fridge or pantry</h2><p className="scan-dropzone-sub">A clear photo helps us identify ingredients accurately.</p><div className="scan-dropzone-actions"><button className="btn btn-primary" onClick={(event) => { event.stopPropagation(); inputRef.current?.click(); }}><Camera size={17} /> Take photo</button><button className="btn btn-secondary" onClick={(event) => { event.stopPropagation(); inputRef.current?.click(); }}><FileImage size={17} /> Choose file</button></div><input ref={inputRef} className="visually-hidden" type="file" accept="image/*" capture="environment" onChange={(event) => { const file = event.target.files?.[0]; if (file) void processImage(file); }} /></section> : <section className="scan-review-panel"><div className="scan-preview-grid"><div><img className="scan-preview-img" src={preview} alt="Uploaded fridge or pantry" /></div><div className="scan-review-copy"><span className="badge badge-neutral">{isScanning ? 'Reviewing photo' : `${detectedBuffer.length} items found`}</span><h2>Check the detected items</h2><p>Names and quantities can be edited before they are added to your pantry.</p>{isScanning && <div className="scanning-indicator">Scanning image...</div>} {!isScanning && <div className="scan-review-actions"><button className="btn btn-primary" onClick={() => setIsReviewOpen(true)}><Check size={17} /> Review items</button><button className="btn btn-ghost" onClick={reset}>Choose another photo</button></div>}</div></div></section>}
      <VerificationModal isOpen={isReviewOpen} onClose={() => setIsReviewOpen(false)} onRescan={reset} />
    </main>
  );
};
