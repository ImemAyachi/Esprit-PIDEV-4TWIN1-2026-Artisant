import React, { useRef, useState, useEffect, useCallback } from 'react';
import { loadFaceModels, faceapi } from '../../utils/faceApi';

/**
 * FaceCapture — Optional face enrollment widget for Signup.
 * Calls onCapture(descriptor: number[]) when a face is successfully captured.
 * Calls onSkip() when user dismisses without capturing.
 */
const FaceCapture = ({ onCapture, onSkip }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const intervalRef = useRef(null);

  const [phase, setPhase] = useState('idle'); // idle | loading | streaming | captured | error
  const [message, setMessage] = useState('');
  const [countdown, setCountdown] = useState(null);

  const stopCamera = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  useEffect(() => () => stopCamera(), [stopCamera]);

  const startCamera = async () => {
    setPhase('loading');
    setMessage('Chargement des modèles IA…');
    try {
      await loadFaceModels();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 320, height: 240 },
      });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setPhase('streaming');
      setMessage('Regardez la caméra et restez immobile.');
      startDetectionLoop();
    } catch (err) {
      setPhase('error');
      setMessage("Impossible d'accéder à la caméra. Vérifiez les permissions.");
    }
  };

  const startDetectionLoop = () => {
    let stable = 0;
    intervalRef.current = setInterval(async () => {
      if (!videoRef.current || videoRef.current.readyState < 2) return;
      const detection = await faceapi
        .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions({ scoreThreshold: 0.5 }))
        .withFaceLandmarks()
        .withFaceDescriptor();

      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (detection) {
        const { box } = detection.detection;
        // Draw clean bounding rectangle
        ctx.strokeStyle = '#4a5d23';
        ctx.lineWidth = 2;
        ctx.strokeRect(box.x, box.y, box.width, box.height);
        stable++;
        setCountdown(3 - Math.min(stable, 3));
        if (stable >= 3) {
          clearInterval(intervalRef.current);
          stopCamera();
          setPhase('captured');
          setMessage('Visage enregistré avec succès !');
          setCountdown(null);
          onCapture(Array.from(detection.descriptor));
        }
      } else {
        stable = 0;
        setCountdown(null);
        setMessage('Aucun visage détecté. Ajustez votre position.');
      }
    }, 700);
  };

  const handleSkip = () => {
    stopCamera();
    onSkip();
  };

  return (
    <div className="face-capture-widget">
      <div className="face-capture-header">
        <div className="face-capture-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18"/>
          </svg>
        </div>
        <div>
          <div className="face-capture-title">Reconnaissance faciale</div>
          <div className="face-capture-sub">Optionnel — pour une connexion rapide</div>
        </div>
      </div>

      {phase === 'idle' && (
        <div className="face-capture-actions">
          <button type="button" className="btn btn-outline w-full" onClick={startCamera} id="start-face-capture">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '0.5rem' }}>
              <circle cx="12" cy="12" r="3"/><path d="M20.188 10.934c.216.613.312 1.36.312 2.066 0 4.411-3.589 8-8 8s-8-3.589-8-8 3.589-8 8-8c.706 0 1.453.096 2.066.312M20 4l-8 8"/>
            </svg>
            Activer le visage
          </button>
          <button type="button" className="face-capture-skip" onClick={handleSkip} id="skip-face-capture">
            Ignorer
          </button>
        </div>
      )}

      {(phase === 'loading' || phase === 'streaming' || phase === 'error') && (
        <div className="face-capture-viewport">
          <div className="face-capture-video-wrap">
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              width={320}
              height={240}
              style={{ display: phase === 'streaming' ? 'block' : 'none', borderRadius: 'var(--radius-md)' }}
            />
            <canvas
              ref={canvasRef}
              width={320}
              height={240}
              style={{ position: 'absolute', top: 0, left: 0 }}
            />
            {phase === 'loading' && (
              <div className="face-capture-overlay">
                <div className="face-capture-spinner" />
                <span>{message}</span>
              </div>
            )}
          </div>

          <p className="face-capture-msg" style={{ color: phase === 'error' ? 'var(--clr-danger)' : 'var(--clr-text-muted)' }}>
            {message}
            {countdown !== null && countdown > 0 && (
              <span className="face-capture-countdown"> · Stabilisation : {countdown}</span>
            )}
          </p>

          <button type="button" className="face-capture-skip" onClick={handleSkip}>
            Ignorer
          </button>
        </div>
      )}

      {phase === 'captured' && (
        <div className="face-capture-success">
          <div className="face-capture-check">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <span>{message}</span>
        </div>
      )}
    </div>
  );
};

export default FaceCapture;
