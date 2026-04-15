import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, VolumeX } from 'lucide-react';

/* ─── Tags to skip entirely ─────────────────────────────────── */
const SKIP_TAGS = new Set([
    'SCRIPT','STYLE','NOSCRIPT','META','HEAD',
    'SVG','PATH','DEFS','CLIPPATH','USE','SYMBOL','G',
    'CANVAS','VIDEO','AUDIO','OBJECT','EMBED',
    'BR','HR','WBR',
]);

/* ─── Build readable element list ───────────────────────────── */
function buildReadableList() {
    const results = [];

    const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_ELEMENT,
        {
            acceptNode(node) {
                if (SKIP_TAGS.has(node.tagName)) return NodeFilter.FILTER_REJECT;

                // Skip our own UI
                if (node.closest?.('[data-sr-ignore]')) return NodeFilter.FILTER_REJECT;

                const style = window.getComputedStyle(node);
                if (
                    style.display     === 'none'   ||
                    style.visibility  === 'hidden'  ||
                    parseFloat(style.opacity) === 0
                ) return NodeFilter.FILTER_REJECT;

                return NodeFilter.FILTER_ACCEPT;
            },
        }
    );

    let node;
    while ((node = walker.nextNode())) {
        const rect = node.getBoundingClientRect();
        if (rect.width < 2 || rect.height < 2) continue;

        const tag      = node.tagName;
        const isForm   = ['INPUT','SELECT','TEXTAREA'].includes(tag);
        const isImg    = tag === 'IMG' && !!node.getAttribute('alt')?.trim();

        // Collect direct text from text node children only
        let directText = '';
        for (const child of node.childNodes) {
            if (child.nodeType === Node.TEXT_NODE) {
                directText += child.textContent;
            }
        }
        directText = directText.replace(/\s+/g, ' ').trim();

        // Must have at least 2 meaningful characters of direct text
        if (!isForm && !isImg && directText.length < 2) continue;

        results.push(node);
    }

    // De-duplicate: remove any element whose direct text is 100% contained
    // inside a sibling that immediately follows it in results
    // (prevents parent-label reading the same text as its lone text child)
    const deduped = [];
    for (let i = 0; i < results.length; i++) {
        const el   = results[i];
        const next = results[i + 1];
        // If next element is a child of current AND has the same visible text, skip current
        if (next && el.contains(next)) {
            const elText   = getDirectText(el);
            const nextText = getDirectText(next);
            if (elText === nextText) continue;
        }
        deduped.push(el);
    }

    return deduped;
}

function getDirectText(el) {
    let t = '';
    for (const child of el.childNodes) {
        if (child.nodeType === Node.TEXT_NODE) t += child.textContent;
    }
    return t.replace(/\s+/g, ' ').trim();
}

/* ─── Extract clean speech text ─────────────────────────────── */
function getSpeechText(el) {
    if (!el) return '';

    const ariaLabel = el.getAttribute('aria-label')?.trim();
    if (ariaLabel) return ariaLabel;

    const labelledById = el.getAttribute('aria-labelledby');
    if (labelledById) {
        const ref = document.getElementById(labelledById);
        if (ref?.textContent?.trim()) return ref.textContent.trim();
    }

    const title = el.getAttribute('title')?.trim();
    if (title) return title;

    if (el.tagName === 'IMG') return el.getAttribute('alt')?.trim() || '';

    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
        const labelEl = el.id ? document.querySelector(`label[for="${el.id}"]`) : null;
        const label       = labelEl?.textContent?.trim() || '';
        const placeholder = el.getAttribute('placeholder')?.trim() || '';
        const value       = el.value?.trim() || '';
        if (el.type === 'checkbox' || el.type === 'radio') {
            return `${label || placeholder}${el.checked ? ', coché' : ''}`;
        }
        const base = label || placeholder;
        return value && el.type !== 'password' ? (base ? `${base} : ${value}` : value) : base;
    }

    if (el.tagName === 'SELECT') {
        const labelEl = el.id ? document.querySelector(`label[for="${el.id}"]`) : null;
        const label    = labelEl?.textContent?.trim() || '';
        const selected = el.options[el.selectedIndex]?.text?.trim() || '';
        return label ? `${label} : ${selected}` : selected;
    }

    return getDirectText(el).slice(0, 200);
}

/* ─── Main component ─────────────────────────────────────────── */
export default function ScreenReader() {
    const [enabled,   setEnabled]   = useState(true);
    const [speaking,  setSpeaking]  = useState(false);
    const [readText,  setReadText]  = useState('');

    const indexRef       = useRef(-1);
    const hideTimer      = useRef(null);
    const enabledRef     = useRef(true);
    const focusedElRef   = useRef(null);   // no state — direct DOM update
    const rafRef         = useRef(null);
    const highlightRef   = useRef(null);   // the overlay div ref

    useEffect(() => { enabledRef.current = enabled; }, [enabled]);

    /* ── Position highlight imperatively (no React state, no flicker) ── */
    const positionHighlight = useCallback(() => {
        const el = focusedElRef.current;
        const ov = highlightRef.current;
        if (!ov) return;
        if (!el) { ov.style.opacity = '0'; return; }

        const r = el.getBoundingClientRect();
        if (r.width < 1 || r.height < 1) { ov.style.opacity = '0'; return; }

        ov.style.top    = `${r.top  - 4}px`;
        ov.style.left   = `${r.left - 4}px`;
        ov.style.width  = `${r.width  + 8}px`;
        ov.style.height = `${r.height + 8}px`;
        ov.style.opacity = '1';
    }, []);

    /* ── RAF scroll/resize loop ── */
    useEffect(() => {
        const onScroll = () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
            rafRef.current = requestAnimationFrame(positionHighlight);
        };
        window.addEventListener('scroll', onScroll, { passive: true, capture: true });
        window.addEventListener('resize', onScroll);
        return () => {
            window.removeEventListener('scroll', onScroll, true);
            window.removeEventListener('resize', onScroll);
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    }, [positionHighlight]);

    /* ── Speak ── */
    const speak = useCallback((text) => {
        if (!text || !window.speechSynthesis) return;
        window.speechSynthesis.cancel();

        const utt   = new SpeechSynthesisUtterance(text);
        utt.lang    = 'fr-FR';
        utt.rate    = 1.08;
        utt.pitch   = 1.0;

        const voices = window.speechSynthesis.getVoices();
        const frVoice = voices.find(v => v.lang.startsWith('fr'));
        if (frVoice) utt.voice = frVoice;

        utt.onstart = () => setSpeaking(true);
        utt.onend   = () => {
            setSpeaking(false);
            hideTimer.current = setTimeout(() => setReadText(''), 2000);
        };

        window.speechSynthesis.speak(utt);

        const display = text.length > 70 ? text.slice(0, 70) + '…' : text;
        if (hideTimer.current) clearTimeout(hideTimer.current);
        setReadText(display);
    }, []);

    /* ── Tab handler ── */
    useEffect(() => {
        const onKey = (e) => {
            if (!enabledRef.current || e.key !== 'Tab') return;
            e.preventDefault();

            const all = buildReadableList();
            if (!all.length) return;

            indexRef.current = e.shiftKey
                ? (indexRef.current - 1 + all.length) % all.length
                : (indexRef.current + 1) % all.length;

            const target = all[indexRef.current];
            try { target.focus({ preventScroll: false }); } catch (_) {}
            target.scrollIntoView({ block: 'nearest', behavior: 'smooth' });

            // Update highlight directly — no state
            focusedElRef.current = target;
            // Position after scroll settles
            requestAnimationFrame(positionHighlight);
            setTimeout(positionHighlight, 120);

            const text = getSpeechText(target);
            if (text) speak(text);
        };

        window.addEventListener('keydown', onKey, true);
        return () => window.removeEventListener('keydown', onKey, true);
    }, [speak, positionHighlight]);

    /* ── Escape ── */
    useEffect(() => {
        const onEsc = (e) => {
            if (e.key === 'Escape') { window.speechSynthesis?.cancel(); setSpeaking(false); }
        };
        window.addEventListener('keydown', onEsc);
        return () => window.removeEventListener('keydown', onEsc);
    }, []);

    /* ── Alt+S toggle ── */
    useEffect(() => {
        const onShortcut = (e) => {
            if (!e.altKey || e.key.toLowerCase() !== 's') return;
            e.preventDefault();
            setEnabled(prev => {
                if (prev) {
                    window.speechSynthesis?.cancel();
                    focusedElRef.current = null;
                    setReadText('');
                    indexRef.current = -1;
                    if (highlightRef.current) highlightRef.current.style.opacity = '0';
                }
                return !prev;
            });
        };
        window.addEventListener('keydown', onShortcut);
        return () => window.removeEventListener('keydown', onShortcut);
    }, []);

    /* ── Cleanup ── */
    useEffect(() => () => {
        window.speechSynthesis?.cancel();
        if (hideTimer.current) clearTimeout(hideTimer.current);
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
    }, []);

    /* ─── RENDER ─────────────────────────────────────────────── */
    return (
        <>
            {/* ── Highlight overlay — always in DOM, positioned imperatively ── */}
            <div
                ref={highlightRef}
                data-sr-ignore
                style={{
                    position: 'fixed',
                    top: 0, left: 0, width: 0, height: 0,
                    opacity: 0,
                    pointerEvents: 'none',
                    zIndex: 99990,
                    borderRadius: 8,
                    border: '2px solid #4ade80',
                    boxShadow: '0 0 0 4px rgba(74,222,128,0.12), 0 0 20px rgba(74,222,128,0.2)',
                    // CSS transition for smooth repositioning — no React re-renders
                    transition: 'top 80ms ease, left 80ms ease, width 80ms ease, height 80ms ease, opacity 150ms ease',
                }}
            />

            {/* ── Reading banner ── */}
            <AnimatePresence>
                {enabled && readText && (
                    <div data-sr-ignore style={{
                        position: 'fixed', top: 18, left: 0, right: 0,
                        zIndex: 99999, pointerEvents: 'none',
                        display: 'flex', justifyContent: 'center',
                    }}>
                        <motion.div
                            key="banner"
                            initial={{ opacity: 0, y: -14, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0,   scale: 1    }}
                            exit={{    opacity: 0, y: -14, scale: 0.95 }}
                            transition={{ type: 'spring', damping: 26, stiffness: 380 }}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 10,
                                padding: '9px 20px 9px 12px',
                                background: 'rgba(9,12,17,0.96)',
                                border: '1px solid rgba(74,222,128,0.28)',
                                borderRadius: 100,
                                backdropFilter: 'blur(20px)',
                                boxShadow: '0 0 0 1px rgba(74,222,128,0.06), 0 10px 40px rgba(0,0,0,0.5)',
                                maxWidth: '80vw',
                            }}
                        >
                            {/* Waveform */}
                            <div style={{ display:'flex', alignItems:'center', gap:2.5, flexShrink:0 }}>
                                {[0, 0.1, 0.2, 0.1, 0].map((delay, i) =>
                                    speaking ? (
                                        <motion.div key={i}
                                            animate={{ scaleY: [0.3, 1, 0.3] }}
                                            transition={{ duration:0.65, repeat:Infinity, delay, ease:'easeInOut' }}
                                            style={{ width:2.5, height:14, borderRadius:99, background:'#4ade80', transformOrigin:'center' }}
                                        />
                                    ) : (
                                        <div key={i} style={{ width:2.5, height:5, borderRadius:99, background:'rgba(74,222,128,0.3)' }} />
                                    )
                                )}
                            </div>
                            {/* Text */}
                            <span style={{
                                color:'rgba(255,255,255,0.9)',
                                fontSize:13.5, fontWeight:600,
                                fontFamily:'Inter, system-ui, sans-serif',
                                whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis',
                                maxWidth:'68vw', letterSpacing:'0.01em',
                            }}>
                                {readText}
                            </span>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* ── FAB ── */}
            <div data-sr-ignore style={{
                position:'fixed', bottom:32, left:32,
                zIndex:9997,
            }}>
                <motion.button
                    whileHover={{ scale:1.07 }}
                    whileTap={{ scale:0.92 }}
                    onClick={() => {
                        setEnabled(prev => {
                            if (prev) {
                                window.speechSynthesis?.cancel();
                                focusedElRef.current = null;
                                setReadText('');
                                indexRef.current = -1;
                                if (highlightRef.current) highlightRef.current.style.opacity = '0';
                            }
                            return !prev;
                        });
                    }}
                    title={`${enabled ? 'Désactiver' : 'Activer'} le lecteur vocal (Alt+S)`}
                    style={{
                        width:52, height:52, borderRadius:16,
                        border:'none', cursor:'pointer', position:'relative',
                        display:'flex', alignItems:'center', justifyContent:'center',
                        background: enabled
                            ? 'linear-gradient(135deg,#14532d,#166534)'
                            : 'rgba(255,255,255,0.92)',
                        color: enabled ? '#fff' : '#374151',
                        boxShadow: enabled
                            ? '0 6px 24px rgba(22,101,52,0.5), 0 0 0 1px rgba(74,222,128,0.18)'
                            : '0 4px 16px rgba(0,0,0,0.1)',
                        transition:'background 0.2s, box-shadow 0.2s',
                    }}
                >
                    {enabled
                        ? <Volume2 size={21} strokeWidth={2.2} />
                        : <VolumeX size={21} strokeWidth={2.2} />
                    }
                    {enabled && speaking && (
                        <motion.span
                            animate={{ scale:[1,1.65,1], opacity:[0.45,0,0.45] }}
                            transition={{ duration:1.3, repeat:Infinity, ease:'easeInOut' }}
                            style={{
                                position:'absolute', inset:-5, borderRadius:21,
                                border:'2px solid rgba(74,222,128,0.45)',
                                pointerEvents:'none',
                            }}
                        />
                    )}
                </motion.button>
            </div>
        </>
    );
}
