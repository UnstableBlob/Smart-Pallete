import React from 'react';
import { X, Sparkles, Lightbulb, CheckCircle2, ShieldCheck } from 'lucide-react';
import { sounds } from '../../services/audio';

interface ScanningTipsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ScanningTipsModal: React.FC<ScanningTipsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.7)',
      backdropFilter: 'blur(8px)',
      zIndex: 60,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
    }} onClick={onClose}>
      <div style={{
        backgroundColor: 'var(--color-surface)',
        borderRadius: 'var(--radius-xl)',
        maxWidth: '460px',
        width: '100%',
        padding: '24px',
        boxShadow: 'var(--shadow-lg)',
        border: '1px solid var(--color-border)',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
      }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: 'var(--radius-pill)',
              backgroundColor: 'var(--color-primary-light)',
              color: 'var(--color-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Lightbulb size={20} />
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--color-text)' }}>
              Shelf Scanning Tips
            </h3>
          </div>
          <button
            onClick={() => {
              sounds.playTap();
              onClose();
            }}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: 'var(--radius-pill)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-text-muted)',
              backgroundColor: 'var(--color-surface-alt)',
            }}
          >
            <X size={18} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '14px' }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <CheckCircle2 size={18} color="#3A7D44" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong style={{ color: 'var(--color-text)' }}>Bright, even lighting:</strong>
              <p style={{ color: 'var(--color-text-muted)', marginTop: '2px' }}>
                Open fridge doors fully or use the flashlight button to avoid dark corners.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <CheckCircle2 size={18} color="#3A7D44" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong style={{ color: 'var(--color-text)' }}>Align shelves horizontally:</strong>
              <p style={{ color: 'var(--color-text-muted)', marginTop: '2px' }}>
                Frame primary shelves inside the corner brackets to capture multiple food categories simultaneously.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <Sparkles size={18} color="#E67E22" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong style={{ color: 'var(--color-text)' }}>Review and refine:</strong>
              <p style={{ color: 'var(--color-text-muted)', marginTop: '2px' }}>
                After shutter capture, the verification drawer lets you tweak quantities or add hidden staples.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <ShieldCheck size={18} color="#3A7D44" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong style={{ color: 'var(--color-text)' }}>Privacy protected:</strong>
              <p style={{ color: 'var(--color-text-muted)', marginTop: '2px' }}>
                Images are analyzed for ingredient bounding boxes and not permanently stored.
              </p>
            </div>
          </div>
        </div>

        <button
          className="btn-primary"
          onClick={() => {
            sounds.playTap();
            onClose();
          }}
          style={{ width: '100%' }}
        >
          Got it, let's scan!
        </button>
      </div>
    </div>
  );
};
