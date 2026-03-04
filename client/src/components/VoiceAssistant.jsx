import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Activity, Volume2 } from 'lucide-react';
import useInvoiceStore from '../store/invoiceStore';

const VoiceAssistant = ({ onNavigate, role }) => {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [response, setResponse] = useState('');
    const [isSpeaking, setIsSpeaking] = useState(false);
    const recognitionRef = useRef(null);
    const { summary, fetchSummary } = useInvoiceStore();

    useEffect(() => {
        fetchSummary();
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = false;
            recognitionRef.current.lang = 'fr-FR'; // User is French speaking
            recognitionRef.current.interimResults = true;

            recognitionRef.current.onstart = () => {
                setIsListening(true);
                setResponse('À votre écoute...');
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
                setResponse('Erreur de reconnaissance.');
            };

        } else {
            setResponse('Commandes vocales non supportées.');
        }

        return () => {
            if (recognitionRef.current) recognitionRef.current.stop();
        };
    }, [fetchSummary]);

    useEffect(() => {
        if (!isListening && transcript) {
            processCommand(transcript);
        }
    }, [isListening]);

    const speak = (text) => {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'fr-FR';
            utterance.onstart = () => setIsSpeaking(true);
            utterance.onend = () => setIsSpeaking(false);
            window.speechSynthesis.speak(utterance);
        }
    };

    const toggleListening = () => {
        if (isListening) {
            recognitionRef.current.stop();
        } else {
            setTranscript('');
            setResponse('');
            recognitionRef.current.start();
        }
    };

    const processCommand = (command) => {
        const cmd = command.toLowerCase();
        let feedback = '';

        if (cmd.includes('overview') || cmd.includes('vue d\'ensemble') || cmd.includes('accueil')) {
            onNavigate('Overview');
            feedback = 'Chargement de la vue d\'ensemble.';
        } else if (cmd.includes('projet')) {
            onNavigate('Projects');
            feedback = 'Ouverture de vos projets.';
        } else if (cmd.includes('devis')) {
            onNavigate('Quotes');
            feedback = 'Section devis activée.';
        } else if (cmd.includes('factures') || cmd.includes('comptabilité')) {
            onNavigate('Invoices');
            feedback = 'Consultation du registre des factures.';
        } else if (cmd.includes('résumé') || cmd.includes('somme') || cmd.includes('total')) {
            onNavigate('Invoices');
            if (summary) {
                feedback = `Voici votre résumé financier. Vous avez généré ${summary.count} factures pour un montant total de ${summary.totalRevenue} dinars. ${summary.paidAmount} dinars ont été payés.`;
            } else {
                feedback = 'Je n\'ai pas encore accès aux données de facturation. Veuillez réessayer.';
            }
        } else if (cmd.includes('document')) {
            onNavigate('Documents');
            feedback = 'Ouverture de la bibliothèque.';
        } else if (cmd.includes('paramètre') || cmd.includes('profil')) {
            onNavigate('Settings');
            feedback = 'Accès à vos paramètres.';
        } else {
            feedback = 'Commande non reconnue. Essayez de dire "Ouvre les devis" ou "Donne moi le résumé".';
        }

        setResponse(feedback);
        speak(feedback);

        setTimeout(() => {
            setResponse('');
            setTranscript('');
        }, 6000);
    };

    return (
        <div className="fixed bottom-8 right-8 z-[100] flex flex-col items-end gap-4 pointer-events-none">
            {/* Feedback Bubble */}
            {(transcript || response) && (
                <div className="bg-brand-teal text-white p-6 border-4 border-brand-orange shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-w-sm animate-in slide-in-from-bottom-4 fade-in duration-300 pointer-events-auto">
                    <div className="flex justify-between items-center mb-3">
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-orange">IA Assistante</span>
                            {isSpeaking && <Volume2 size={12} className="text-brand-orange animate-bounce" />}
                        </div>
                        <Activity size={14} className="text-brand-orange animate-pulse" />
                    </div>
                    <p className="font-black text-sm leading-tight italic opacity-70 mb-2">
                        {transcript ? `"${transcript}"` : ''}
                    </p>
                    {response && (
                        <p className="font-black text-base leading-tight text-white border-t border-white/10 pt-2">
                            {response}
                        </p>
                    )}
                </div>
            )}

            {/* Mic Toggle */}
            <button
                onClick={toggleListening}
                aria-label={isListening ? "Arrêter l'écoute" : "Démarrer l'assistant vocal"}
                className={`pointer-events-auto w-20 h-20 flex items-center justify-center border-4 transition-all shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[4px] active:translate-y-[4px] ${isListening
                    ? 'bg-brand-orange border-brand-orange text-white animate-pulse'
                    : 'bg-white border-brand-teal text-brand-teal hover:bg-brand-teal hover:text-white'
                    }`}
            >
                {isListening ? <MicOff size={32} /> : <Mic size={32} />}
            </button>
        </div>
    );
};

export default VoiceAssistant;
