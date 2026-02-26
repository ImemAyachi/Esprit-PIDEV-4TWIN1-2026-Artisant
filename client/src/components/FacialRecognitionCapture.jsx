import React, { useRef, useEffect, useState } from 'react';
import { Camera, Scan, CheckCircle, RefreshCcw, Loader2 } from 'lucide-react';

const FacialRecognitionCapture = ({ onCapture }) => {
    const videoRef = useRef(null);
    const [stream, setStream] = useState(null);
    const [capturing, setCapturing] = useState(false);
    const [captured, setCaptured] = useState(false);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        startVideo();
        return () => stopVideo();
    }, []);

    // Monitor progress to trigger completion
    useEffect(() => {
        if (progress >= 100 && capturing) {
            const timer = setTimeout(() => {
                completeCapture();
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [progress, capturing]);

    const startVideo = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
            setStream(mediaStream);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
        } catch (err) {
            console.error("Error accessing webcam:", err);
        }
    };

    const stopVideo = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
    };

    const handleCapture = () => {
        setCapturing(true);
        setProgress(0);

        // Simulation of AI processing
        const interval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    clearInterval(interval);
                    return 100;
                }
                return prev + 5;
            });
        }, 100);
    };

    const completeCapture = () => {
        // Generate a simulated 128-float descriptor (standard for face-api.js)
        const mockDescriptor = Array.from({ length: 128 }, () => Math.random());
        setCapturing(false);
        setCaptured(true);
        onCapture(mockDescriptor);
    };

    const reset = () => {
        setCaptured(false);
        setProgress(0);
        startVideo();
    };

    return (
        <div className="relative w-full h-full bg-black flex flex-col items-center justify-center">
            {!captured ? (
                <>
                    <video
                        ref={videoRef}
                        autoPlay
                        muted
                        playsInline
                        className="w-full h-full object-cover grayscale brightness-75 contrast-125"
                    />

                    {/* UI Overlay */}
                    <div className="absolute inset-0 pointer-events-none">
                        {/* Corner Accents */}
                        <div className="absolute top-8 left-8 w-12 h-12 border-t-4 border-l-4 border-brand-orange"></div>
                        <div className="absolute top-8 right-8 w-12 h-12 border-t-4 border-r-4 border-brand-orange"></div>
                        <div className="absolute bottom-8 left-8 w-12 h-12 border-b-4 border-l-4 border-brand-orange"></div>
                        <div className="absolute bottom-8 right-8 w-12 h-12 border-b-4 border-r-4 border-brand-orange"></div>

                        {/* Scan Line */}
                        {capturing && (
                            <div className="absolute inset-x-8 h-1 bg-brand-orange/50 shadow-[0_0_15px_rgba(255,107,0,0.5)] animate-scan"></div>
                        )}

                        {/* Face Guide */}
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className={`w-64 h-80 border-2 border-dashed transition-colors duration-500 ${capturing ? 'border-brand-orange animate-pulse' : 'border-white/30'}`}></div>
                        </div>
                    </div>

                    <div className="absolute bottom-12 inset-x-0 flex justify-center px-12 gap-4 pointer-events-auto">
                        {!capturing ? (
                            <button
                                onClick={handleCapture}
                                className="bg-brand-orange text-white px-8 py-3 font-black uppercase tracking-[0.2em] text-[10px] flex items-center gap-3 hover:bg-brand-teal transition-colors border-4 border-white"
                            >
                                <Scan size={18} />
                                Start Scan
                            </button>
                        ) : (
                            <div className="w-full max-w-xs space-y-2">
                                <div className="flex justify-between text-[10px] font-black text-white uppercase tracking-widest">
                                    <span>Extracting identity</span>
                                    <span>{progress}%</span>
                                </div>
                                <div className="h-2 bg-white/20 border border-white/10">
                                    <div
                                        className="h-full bg-brand-orange transition-all duration-100"
                                        style={{ width: `${progress}%` }}
                                    ></div>
                                </div>
                            </div>
                        )}
                    </div>
                </>
            ) : (
                <div className="flex flex-col items-center justify-center p-12 text-center space-y-6">
                    <div className="w-24 h-24 bg-brand-orange text-white flex items-center justify-center rounded-full animate-in zoom-in duration-500">
                        <CheckCircle size={48} strokeWidth={3} />
                    </div>
                    <div className="space-y-2">
                        <h4 className="text-xl font-black text-white uppercase tracking-tighter">Fingerprint Latched</h4>
                        <p className="text-[10px] font-medium text-white/50 uppercase tracking-widest">
                            Biometric hash generated and stored in local protocol buffer.
                        </p>
                    </div>
                    <button
                        onClick={reset}
                        className="text-white/40 hover:text-white transition-colors flex items-center gap-2 text-[10px] font-black uppercase tracking-widest"
                    >
                        <RefreshCcw size={14} />
                        Recalibrate
                    </button>
                </div>
            )}

            <div className="absolute top-6 left-6 flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-[9px] font-black text-white/80 uppercase tracking-widest">LIVE SENSOR FEED</span>
            </div>
        </div>
    );
};

export default FacialRecognitionCapture;
