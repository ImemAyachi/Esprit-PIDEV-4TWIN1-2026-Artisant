import { useRef, useEffect, useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Hand, StopCircle, ArrowLeft, ArrowRight, X, ArrowUp, ArrowDown, MousePointer2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../utils/cn';
import toast from 'react-hot-toast';

// App routes in navigation order (Artisant platform)
const APP_ROUTES = [
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/profile', label: 'Profil' },
    { path: '/admin', label: 'Administration' },
];

const CONFIDENCE_THRESHOLD = 0.70;
const FRAMES_TO_TRIGGER = 10;
const PINCH_THRESHOLD = 0.08;
const CURSOR_SMOOTHING = 0.7;

// Hand landmark connections (pairs of indices to draw lines between)
const HAND_CONNECTIONS = [
    [0, 1], [1, 2], [2, 3], [3, 4],       // Thumb
    [0, 5], [5, 6], [6, 7], [7, 8],       // Index
    [0, 9], [9, 10], [10, 11], [11, 12],  // Middle
    [0, 13], [13, 14], [14, 15], [15, 16],// Ring
    [0, 17], [17, 18], [18, 19], [19, 20],// Pinky
    [5, 9], [9, 13], [13, 17]             // Palm
];

const FINGER_COLORS = {
    thumb: '#f97316',
    index: '#22c55e',
    middle: '#3b82f6',
    ring: '#eab308',
    pinky: '#ec4899',
    palm: '#a855f7'
};

const GestureController = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const videoRef = useRef(null);
    const [recognizer, setRecognizer] = useState(null);
    const [isEnabled, setIsEnabled] = useState(false);
    const [isPanelOpen, setIsPanelOpen] = useState(false);
    const [cameraError, setCameraError] = useState(null);
    const [isScrolling, setIsScrolling] = useState(false);
    const [scrollDirection, setScrollDirection] = useState(null);
    const [detectedGesture, setDetectedGesture] = useState(null);
    const [gestureProgress, setGestureProgress] = useState(0);

    // Cursor mode state
    const [cursorMode, setCursorMode] = useState(false);
    const [isPinching, setIsPinching] = useState(false);
    const [clickAnimation, setClickAnimation] = useState(false);
    const [hoveredElement, setHoveredElement] = useState(null);

    const streamRef = useRef(null);
    const scrollIntervalRef = useRef(null);
    const isEnabledRef = useRef(false);
    const lastVideoTimeRef = useRef(-1);
    const frameCountRef = useRef(0);
    const currentGestureRef = useRef(null);
    const hasFiredRef = useRef(false);

    // Cursor refs
    const smoothCursorRef = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
    const wasPinchingRef = useRef(false);
    const pinchFrameCountRef = useRef(0);
    const cursorModeRef = useRef(false);
    const cursorElementRef = useRef(null);
    const canvasRef = useRef(null);

    useEffect(() => { isEnabledRef.current = isEnabled; }, [isEnabled]);
    useEffect(() => { cursorModeRef.current = cursorMode; }, [cursorMode]);

    const getCurrentRouteIndex = () => {
        const path = window.location.pathname;
        const idx = APP_ROUTES.findIndex(r => path.startsWith(r.path));
        return idx >= 0 ? idx : 0;
    };

    const startScroll = useCallback((dir) => {
        if (scrollIntervalRef.current) clearInterval(scrollIntervalRef.current);
        setIsScrolling(true);
        setScrollDirection(dir);
        const amt = dir === 'up' ? -50 : 50;
        scrollIntervalRef.current = setInterval(() => {
            window.scrollBy({ top: amt, behavior: 'auto' });
        }, 40);
        toast.success(`Défilement ${dir === 'up' ? '↑' : '↓'}`, { id: 'scroll' });
    }, []);

    const stopScroll = useCallback(() => {
        if (scrollIntervalRef.current) {
            clearInterval(scrollIntervalRef.current);
            scrollIntervalRef.current = null;
            setIsScrolling(false);
            setScrollDirection(null);
        }
    }, []);

    const clickAtPosition = useCallback((x, y) => {
        setClickAnimation(true);
        setTimeout(() => setClickAnimation(false), 300);
        const element = document.elementFromPoint(x, y);
        if (element) {
            const isClickable =
                element.tagName === 'BUTTON' ||
                element.tagName === 'A' ||
                element.tagName === 'INPUT' ||
                element.onclick ||
                element.closest('button') ||
                element.closest('a') ||
                element.closest('[role="button"]') ||
                window.getComputedStyle(element).cursor === 'pointer';
            if (isClickable) {
                const clickTarget = element.closest('button') || element.closest('a') || element.closest('[role="button"]') || element;
                clickTarget.click();
                toast.success('✓ Cliqué', { id: 'click', duration: 1000 });
                clickTarget.style.transform = 'scale(0.95)';
                setTimeout(() => { clickTarget.style.transform = ''; }, 150);
            }
        }
    }, []);

    const updateHoveredElement = useCallback((x, y) => {
        const element = document.elementFromPoint(x, y);
        if (element) {
            const clickable = element.closest('button') || element.closest('a') || element.closest('[role="button"]') || element.closest('input');
            setHoveredElement(clickable ? clickable.textContent?.slice(0, 20) || 'Élément' : null);
        } else {
            setHoveredElement(null);
        }
    }, []);

    const doAction = useCallback((gesture) => {
        if (gesture === 'Pointing_Up') {
            const idx = getCurrentRouteIndex();
            if (idx > 0) {
                const target = APP_ROUTES[idx - 1];
                navigate(target.path);
                toast.success(`← ${target.label}`, { id: 'nav' });
            } else {
                toast('Première page', { id: 'nav', icon: '🏠' });
            }
        } else if (gesture === 'Victory') {
            const idx = getCurrentRouteIndex();
            if (idx < APP_ROUTES.length - 1) {
                const target = APP_ROUTES[idx + 1];
                navigate(target.path);
                toast.success(`→ ${target.label}`, { id: 'nav' });
            } else {
                toast('Dernière page', { id: 'nav', icon: '🏁' });
            }
        } else if (gesture === 'Thumb_Up') {
            startScroll('up');
        } else if (gesture === 'Thumb_Down') {
            startScroll('down');
        } else if (gesture === 'Closed_Fist') {
            stopScroll();
        }
    }, [navigate, startScroll, stopScroll]);

    // Load MediaPipe model
    useEffect(() => {
        const loadModel = async () => {
            try {
                const { FilesetResolver, GestureRecognizer } = await import('@mediapipe/tasks-vision');
                const vision = await FilesetResolver.forVisionTasks(
                    'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm'
                );
                const gr = await GestureRecognizer.createFromOptions(vision, {
                    baseOptions: {
                        modelAssetPath: '/models/gesture_recognizer.task',
                        delegate: 'GPU'
                    },
                    runningMode: 'VIDEO',
                    numHands: 1
                });
                setRecognizer(gr);
            } catch (err) {
                console.error('Model load failed:', err);
            }
        };
        loadModel();
    }, []);

    const startCamera = async () => {
        setCameraError(null);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
            streamRef.current = stream;
            setIsEnabled(true);
            setIsPanelOpen(true);
        } catch (err) {
            setCameraError('Impossible d\'accéder à la caméra');
        }
    };

    const stopCamera = () => {
        setIsEnabled(false);
        setIsPanelOpen(false);
        setDetectedGesture(null);
        setGestureProgress(0);
        setCursorMode(false);
        frameCountRef.current = 0;
        currentGestureRef.current = null;
        hasFiredRef.current = false;
        stopScroll();
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(t => t.stop());
            streamRef.current = null;
        }
        if (videoRef.current) videoRef.current.srcObject = null;
    };

    useEffect(() => {
        if (isEnabled && streamRef.current && videoRef.current) {
            videoRef.current.srcObject = streamRef.current;
            videoRef.current.play().then(() => { requestAnimationFrame(predict); });
        }
    }, [isEnabled, recognizer]);

    useEffect(() => {
        return () => { if (scrollIntervalRef.current) clearInterval(scrollIntervalRef.current); };
    }, []);

    const getLandmarkDistance = (landmarks, idx1, idx2) => {
        const l1 = landmarks[idx1], l2 = landmarks[idx2];
        return Math.sqrt(Math.pow(l1.x - l2.x, 2) + Math.pow(l1.y - l2.y, 2));
    };

    const getLandmarkColor = (idx) => {
        if (idx <= 4) return FINGER_COLORS.thumb;
        if (idx <= 8) return FINGER_COLORS.index;
        if (idx <= 12) return FINGER_COLORS.middle;
        if (idx <= 16) return FINGER_COLORS.ring;
        if (idx <= 20) return FINGER_COLORS.pinky;
        return FINGER_COLORS.palm;
    };

    const drawHandSkeleton = useCallback((landmarks) => {
        const canvas = canvasRef.current;
        const video = videoRef.current;
        if (!canvas || !video) return;
        const ctx = canvas.getContext('2d');
        const rect = video.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (!landmarks || landmarks.length === 0) return;

        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        HAND_CONNECTIONS.forEach(([startIdx, endIdx]) => {
            const start = landmarks[startIdx], end = landmarks[endIdx];
            const sx = (1 - start.x) * canvas.width, sy = start.y * canvas.height;
            const ex = (1 - end.x) * canvas.width, ey = end.y * canvas.height;
            const gradient = ctx.createLinearGradient(sx, sy, ex, ey);
            gradient.addColorStop(0, getLandmarkColor(startIdx));
            gradient.addColorStop(1, getLandmarkColor(endIdx));
            ctx.strokeStyle = gradient;
            ctx.beginPath();
            ctx.moveTo(sx, sy);
            ctx.lineTo(ex, ey);
            ctx.stroke();
        });
        landmarks.forEach((landmark, idx) => {
            const x = (1 - landmark.x) * canvas.width;
            const y = landmark.y * canvas.height;
            ctx.beginPath(); ctx.arc(x, y, 7, 0, 2 * Math.PI);
            ctx.fillStyle = getLandmarkColor(idx) + '40'; ctx.fill();
            ctx.beginPath(); ctx.arc(x, y, 4, 0, 2 * Math.PI);
            ctx.fillStyle = getLandmarkColor(idx); ctx.fill();
            ctx.beginPath(); ctx.arc(x, y, 1.5, 0, 2 * Math.PI);
            ctx.fillStyle = '#fff'; ctx.fill();
        });
    }, []);

    const predict = () => {
        if (!recognizer || !videoRef.current || videoRef.current.videoWidth === 0) {
            if (isEnabledRef.current) requestAnimationFrame(predict);
            return;
        }
        const now = performance.now();
        if (videoRef.current.currentTime !== lastVideoTimeRef.current) {
            lastVideoTimeRef.current = videoRef.current.currentTime;
            try {
                const results = recognizer.recognizeForVideo(videoRef.current, now);
                if (results.gestures.length > 0 && results.landmarks?.length > 0) {
                    const landmarks = results.landmarks[0];
                    const top = results.gestures[0][0];
                    const name = top.categoryName;
                    const score = top.score;

                    drawHandSkeleton(landmarks);

                    // Exit cursor mode
                    if (cursorModeRef.current && name === 'Closed_Fist' && score > CONFIDENCE_THRESHOLD) {
                        setCursorMode(false);
                        cursorModeRef.current = false;
                        setIsPinching(false);
                        setHoveredElement(null);
                        toast('Mode curseur désactivé', { id: 'cursor-mode' });
                        setDetectedGesture(null);
                    }
                    // Active cursor tracking
                    else if (cursorModeRef.current) {
                        const indexTip = landmarks[8];
                        const screenX = (1 - indexTip.x) * window.innerWidth;
                        const screenY = indexTip.y * window.innerHeight;
                        smoothCursorRef.current.x += (screenX - smoothCursorRef.current.x) * CURSOR_SMOOTHING;
                        smoothCursorRef.current.y += (screenY - smoothCursorRef.current.y) * CURSOR_SMOOTHING;
                        if (cursorElementRef.current) {
                            cursorElementRef.current.style.left = smoothCursorRef.current.x + 'px';
                            cursorElementRef.current.style.top = smoothCursorRef.current.y + 'px';
                        }
                        updateHoveredElement(smoothCursorRef.current.x, smoothCursorRef.current.y);
                        const pinchDistance = getLandmarkDistance(landmarks, 4, 8);
                        const currentlyPinching = pinchDistance < PINCH_THRESHOLD;
                        setIsPinching(currentlyPinching);
                        if (currentlyPinching && !wasPinchingRef.current) {
                            pinchFrameCountRef.current++;
                            if (pinchFrameCountRef.current >= 3) {
                                clickAtPosition(smoothCursorRef.current.x, smoothCursorRef.current.y);
                                wasPinchingRef.current = true;
                            }
                        } else if (!currentlyPinching) {
                            wasPinchingRef.current = false;
                            pinchFrameCountRef.current = 0;
                        }
                        setDetectedGesture('cursor');
                        if (isEnabledRef.current) requestAnimationFrame(predict);
                        return;
                    }
                    // Enter cursor mode with Open_Palm
                    else if (name === 'Open_Palm' && score > CONFIDENCE_THRESHOLD) {
                        setCursorMode(true);
                        cursorModeRef.current = true;
                        smoothCursorRef.current.x = window.innerWidth / 2;
                        smoothCursorRef.current.y = window.innerHeight / 2;
                        toast('🖱️ Mode curseur activé', { id: 'cursor-mode' });
                        setDetectedGesture('cursor');
                        if (isEnabledRef.current) requestAnimationFrame(predict);
                        return;
                    }

                    // Normal gesture recognition
                    const actionable = ['Pointing_Up', 'Victory', 'Thumb_Up', 'Thumb_Down', 'Closed_Fist'].includes(name);
                    if (score > CONFIDENCE_THRESHOLD && actionable) {
                        if (name === currentGestureRef.current) {
                            frameCountRef.current++;
                        } else {
                            currentGestureRef.current = name;
                            frameCountRef.current = 1;
                            hasFiredRef.current = false;
                        }
                        setDetectedGesture(name);
                        setGestureProgress(Math.min(frameCountRef.current / FRAMES_TO_TRIGGER, 1));
                        if (frameCountRef.current >= FRAMES_TO_TRIGGER && !hasFiredRef.current) {
                            hasFiredRef.current = true;
                            doAction(name);
                        }
                    } else if (!cursorMode) {
                        currentGestureRef.current = null;
                        frameCountRef.current = 0;
                        hasFiredRef.current = false;
                        setDetectedGesture(null);
                        setGestureProgress(0);
                    }
                } else {
                    drawHandSkeleton(null);
                    if (!cursorMode) {
                        currentGestureRef.current = null;
                        frameCountRef.current = 0;
                        hasFiredRef.current = false;
                        setDetectedGesture(null);
                        setGestureProgress(0);
                    }
                }
            } catch (err) {
                console.error('Predict error:', err);
            }
        }
        if (isEnabledRef.current) requestAnimationFrame(predict);
    };

    const gestureInfo = {
        'Pointing_Up': { icon: ArrowLeft, label: 'Page précédente', color: 'text-purple-400' },
        'Victory': { icon: ArrowRight, label: 'Page suivante', color: 'text-blue-400' },
        'Thumb_Up': { icon: ArrowUp, label: 'Défiler en haut', color: 'text-cyan-400' },
        'Thumb_Down': { icon: ArrowDown, label: 'Défiler en bas', color: 'text-orange-400' },
        'Closed_Fist': { icon: StopCircle, label: 'Arrêter', color: 'text-red-400' },
        'cursor': { icon: MousePointer2, label: 'Mode Curseur', color: 'text-emerald-400' },
    };

    const info = detectedGesture ? gestureInfo[detectedGesture] : null;

    return (
        <>
            {/* Virtual Cursor */}
            <AnimatePresence>
                {cursorMode && isEnabled && (
                    <>
                        <motion.div
                            ref={cursorElementRef}
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 400 }}
                            className="fixed z-[99999] pointer-events-none"
                            style={{
                                left: smoothCursorRef.current.x,
                                top: smoothCursorRef.current.y,
                                transform: 'translate(-50%, -50%)'
                            }}
                        >
                            <div className={cn(
                                'w-8 h-8 rounded-full border-4 flex items-center justify-center shadow-lg shadow-black/50',
                                isPinching
                                    ? 'bg-emerald-500 border-emerald-300 scale-90'
                                    : 'bg-purple-500/80 border-white'
                            )}>
                                <div className="w-2 h-2 bg-white rounded-full" />
                            </div>
                        </motion.div>

                        {/* Click ripple */}
                        <AnimatePresence>
                            {clickAnimation && (
                                <motion.div
                                    initial={{ scale: 0.5, opacity: 1 }}
                                    animate={{ scale: 2, opacity: 0 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.3 }}
                                    className="fixed z-[99998] pointer-events-none"
                                    style={{
                                        left: smoothCursorRef.current.x,
                                        top: smoothCursorRef.current.y,
                                        transform: 'translate(-50%, -50%)'
                                    }}
                                >
                                    <div className="w-10 h-10 rounded-full border-2 border-emerald-400" />
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Hovered element tooltip */}
                        {hoveredElement && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="fixed z-[99997] pointer-events-none bg-black/80 text-white text-xs px-2 py-1 rounded-lg"
                                style={{
                                    left: smoothCursorRef.current.x + 20,
                                    top: smoothCursorRef.current.y + 20,
                                }}
                            >
                                {hoveredElement}
                            </motion.div>
                        )}
                    </>
                )}
            </AnimatePresence>

            {/* Floating trigger button */}
            <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end gap-3">

                {/* Expanded Panel */}
                <AnimatePresence>
                    {isPanelOpen && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="w-72 bg-zinc-900/95 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl"
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
                                <div className="flex items-center gap-2">
                                    <span className={cn(
                                        'w-2 h-2 rounded-full animate-pulse',
                                        cursorMode ? 'bg-emerald-500' : isScrolling ? 'bg-orange-500' : 'bg-purple-500'
                                    )} />
                                    <span className="text-xs font-bold text-white/70 uppercase tracking-wider">
                                        {cursorMode
                                            ? '🖱️ Mode Curseur'
                                            : isScrolling
                                                ? `Défilement ${scrollDirection === 'up' ? '↑' : '↓'}`
                                                : 'Contrôle Gestuel'}
                                    </span>
                                </div>
                                <button onClick={stopCamera} className="text-white/30 hover:text-white transition-colors">
                                    <X size={16} />
                                </button>
                            </div>

                            {/* Camera preview */}
                            <div className="relative aspect-video bg-black m-3 rounded-xl overflow-hidden border border-white/10">
                                {cameraError ? (
                                    <div className="absolute inset-0 flex items-center justify-center text-red-400 text-sm text-center px-4">
                                        {cameraError}
                                    </div>
                                ) : (
                                    <>
                                        <video
                                            ref={videoRef}
                                            className="w-full h-full object-cover"
                                            style={{ transform: 'scaleX(-1)' }}
                                            autoPlay
                                            playsInline
                                            muted
                                        />
                                        <canvas
                                            ref={canvasRef}
                                            className="absolute inset-0 w-full h-full pointer-events-none"
                                        />
                                    </>
                                )}

                                {/* Cursor mode badge */}
                                {cursorMode && (
                                    <div className="absolute top-2 left-2 bg-emerald-500/20 text-emerald-400 text-xs px-2 py-1 rounded-full border border-emerald-500/30">
                                        🖱️ Actif
                                    </div>
                                )}

                                {/* Gesture progress ring */}
                                {info && !cursorMode && gestureProgress > 0 && gestureProgress < 1 && (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <svg className="w-20 h-20 -rotate-90" viewBox="0 0 100 100">
                                            <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="6" />
                                            <circle
                                                cx="50" cy="50" r="40"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="6"
                                                strokeLinecap="round"
                                                strokeDasharray={251.2}
                                                strokeDashoffset={251.2 * (1 - gestureProgress)}
                                                className={info.color}
                                            />
                                        </svg>
                                        <div className="absolute">
                                            <info.icon size={28} className={info.color} />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Status */}
                            <div className="px-4 py-3 text-center border-t border-white/5">
                                {cursorMode ? (
                                    <div className="text-emerald-400 text-sm font-bold">
                                        {isPinching ? '✊ Clic en cours...' : '☝️ Déplacez votre doigt'}
                                    </div>
                                ) : info ? (
                                    <span className={cn('font-bold uppercase text-sm', info.color)}>
                                        {info.label} {gestureProgress < 1 ? '...' : '✓'}
                                    </span>
                                ) : (
                                    <span className="text-xs text-white/30 uppercase tracking-wider">Montrez un geste à la caméra</span>
                                )}
                            </div>

                            {/* Gesture cheat-sheet */}
                            <div className="px-4 py-3 bg-white/5 border-t border-white/5">
                                <div className="grid grid-cols-2 gap-1 text-[10px] text-white/40">
                                    <span>✋ Paume → Curseur</span>
                                    <span>🤏 Pincement → Clic</span>
                                    <span>☝️ Index → Page préc.</span>
                                    <span>✌️ Victoire → Page suiv.</span>
                                    <span>👍 Pouce haut → Monter</span>
                                    <span>👊 Poing → Stop</span>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Main FAB */}
                <motion.button
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.92 }}
                    onClick={() => {
                        if (isEnabled) {
                            if (isPanelOpen) stopCamera();
                            else setIsPanelOpen(true);
                        } else {
                            startCamera();
                        }
                    }}
                    className={cn(
                        'w-14 h-14 rounded-2xl shadow-2xl flex items-center justify-center transition-all duration-300 relative overflow-hidden',
                        isEnabled
                            ? 'bg-purple-600 text-white shadow-purple-600/40'
                            : 'bg-zinc-900 text-white/60 hover:bg-zinc-800 hover:text-white border border-white/10'
                    )}
                    title={isEnabled ? 'Contrôle gestuel actif' : 'Activer le contrôle gestuel'}
                >
                    {isEnabled && (
                        <motion.div
                            className="absolute inset-0 bg-purple-400/20 rounded-2xl"
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ repeat: Infinity, duration: 2 }}
                        />
                    )}
                    <Hand size={22} className="relative z-10" />
                </motion.button>
            </div>
        </>
    );
};

export default GestureController;
