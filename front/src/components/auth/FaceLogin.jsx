import React, { useRef, useState, useEffect, useCallback } from 'react';
import { loadFaceModels, faceapi } from '../../utils/faceApi';

/**
 * FaceLogin — Optional face recognition for login.
 * Calls onMatch(descriptor: number[]) when a face is confidently detected.
 * Calls onClose() when dismissed.
 */
const FaceLogin = ({ onMatch, onClose }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const intervalRef = useRef(null);

  const [phase, setPhase] = useState('loading'); // loading | scanning | error
  const [message, setMessage] = useState('Chargement des modèles IA…');
  const [scanCount, setScanCount] = useState(0);

  const stopCamera = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      try {
        await loadFaceModels();
        if (cancelled) return;
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: 320, height: 240 },
        });
        if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
        setPhase('scanning');
        setMessage('Regardez la caméra…');
        startLoop();
      } catch {
        if (!cancelled) { setPhase('error'); setMessage("Impossible d'accéder à la caméra."); }
      }
    };
    init();
    return () => { cancelled = true; stopCamera(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startLoop = () => {
    let detectedCount = 0;
    intervalRef.current = setInterval(async () => {
      if (!videoRef.current || videoRef.current.readyState < 2) return;
      const detection = await faceapi
        .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions({ scoreThreshold: 0.55 }))
        .withFaceLandmarks()
        .withFaceDescriptor();

      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (detection) {
        const { box } = detection.detection;
        ctx.strokeStyle = '#4a5d23';
        ctx.lineWidth = 2.5;
        ctx.strokeRect(box.x, box.y, box.width, box.height);
        detectedCount++;
        setScanCount(detectedCount);
        if (detectedCount >= 2) {
          stopCamera();
          onMatch(Array.from(detection.descriptor));
        }
      } else {
        detectedCount = 0;
        setMessage('Aucun visage. Ajustez votre position.');
      }
    }, 800);
  };

  const handleClose = () => {
    stopCamera();
    onClose();
  };

  return (
    <div className="face-login-overlay" onClick={(e) => e.target === e.currentTarget && handleClose()}>
      <div className="face-login-modal">
        <div className="face-login-header">
          <div className="face-login-title-wrap">
            <div className="face-login-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
              </svg>
            </div>
            <div>
              <div className="face-login-title">Connexion par visage</div>
              <div className="face-login-sub">Regardez la caméra pour vous identifier</div>
            </div>
          </div>
          <button type="button" className="btn btn-ghost face-login-close" onClick={handleClose} aria-label="Fermer">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="face-login-viewport">
          {phase === 'loading' && (
            <div className="face-login-loader">
              <div className="face-capture-spinner" />
              <span>{message}</span>
            </div>
          )}

          {phase === 'error' && (
            <div className="face-login-loader" style={{ color: 'var(--clr-danger)' }}>
              <span>{message}</span>
            </div>
          )}

          <div style={{ position: 'relative', display: phase === 'scanning' ? 'block' : 'none' }}>
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              width={320}
              height={240}
              style={{ borderRadius: 'var(--radius-md)', display: 'block' }}
            />
            <canvas
              ref={canvasRef}
              width={320}
              height={240}
              style={{ position: 'absolute', top: 0, left: 0 }}
            />
            {/* Corner frame decorations */}
            <div className="face-corner tl" />
            <div className="face-corner tr" />
            <div className="face-corner bl" />
            <div className="face-corner br" />
          </div>
        </div>

        <div className="face-login-footer">
          {phase === 'scanning' && (
            <>
              <div className="face-scan-bar">
                <div className="face-scan-progress" style={{ width: `${Math.min(scanCount * 50, 100)}%` }} />
              </div>
              <p className="face-login-msg">{message}</p>
            </>
          )}
          <button type="button" className="face-login-cancel" onClick={handleClose}>
            Utiliser email / mot de passe
          </button>
        </div>
      </div>
    </div>
  );
};

export default FaceLogin;
