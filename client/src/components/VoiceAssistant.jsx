import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const VoiceAssistant = () => {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [response, setResponse] = useState('');
    const recognitionRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = false;
            recognitionRef.current.lang = 'en-US';
            recognitionRef.current.interimResults = true;

            recognitionRef.current.onstart = () => {
                setIsListening(true);
                setResponse('Listening...');
            };

            recognitionRef.current.onresult = (event) => {
                const current = event.resultIndex;
                const transcriptText = event.results[current][0].transcript;
                setTranscript(transcriptText);
            };

            recognitionRef.current.onend = () => {
                setIsListening(false);
            };

            recognitionRef.current.onerror = (event) => {
                console.error('Speech recognition error', event.error);
                setIsListening(false);
                setResponse('Error listening.');
            };

        } else {
            setResponse('Voice features not supported.');
        }

        return () => {
            if (recognitionRef.current) recognitionRef.current.stop();
        };
    }, []);

    useEffect(() => {
        if (!isListening && transcript) {
            processCommand(transcript);
        }
    }, [isListening]);

    const toggleListening = () => {
        if (isListening) {
            recognitionRef.current.stop();
        } else {
            setTranscript('');
            recognitionRef.current.start();
        }
    };

    const processCommand = (command) => {
        const cmd = command.toLowerCase();

        if (cmd.includes('home') || cmd.includes('dashboard')) {
            navigate('/dashboard');
            setResponse('Navigating to Dashboard...');
        } else if (cmd.includes('users') || cmd.includes('manage users')) {
            setResponse('Opening User Management...');
        } else if (cmd.includes('documents') || cmd.includes('library')) {
            setResponse('Opening Document Library...');
        } else if (cmd.includes('logout')) {
            setResponse('Logging out...');
        } else {
            setResponse(`Command not recognized.`);
        }

        setTimeout(() => {
            setResponse('');
            setTranscript('');
        }, 3000);
    };

    return (
        <div className="fixed bottom-8 right-8 z-50 flex flex-col items-end gap-4 pointer-events-none">
            {/* Feedback Bubble */}
            {(transcript || response) && (
                <div className="bg-brand-teal text-white p-4 border-2 border-brand-orange shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] max-w-xs animate-in slide-in-from-bottom-2 fade-in duration-300 pointer-events-auto">
                    <div className="flex justify-between items-center mb-2 gap-4">
                        <span className="text-[10px] font-black uppercase tracking-widest text-brand-orange">AI Assistant</span>
                        <Activity size={12} className="text-brand-orange animate-pulse" />
                    </div>
                    <p className="font-bold text-sm leading-tight">
                        {isListening ? `"${transcript}"` : response}
                    </p>
                </div>
            )}

            {/* Mic Toggle */}
            <button
                onClick={toggleListening}
                className={`pointer-events-auto w-16 h-16 flex items-center justify-center border-4 transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] ${isListening
                    ? 'bg-brand-orange border-brand-orange text-white animate-pulse'
                    : 'bg-white border-brand-teal text-brand-teal hover:bg-brand-teal hover:text-white'
                    }`}
            >
                {isListening ? <MicOff size={24} /> : <Mic size={24} />}
            </button>
        </div>
    );
};

export default VoiceAssistant;
