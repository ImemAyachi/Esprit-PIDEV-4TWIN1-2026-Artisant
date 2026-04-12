import { useRef, useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Hand, X, MousePointer2, ChevronLeft, ChevronRight, ChevronsUp, ChevronsDown, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

/* ─── Config ──────────────────────────────────────────────────── */
const APP_ROUTES = [
    { path: '/dashboard/home',     label: 'Accueil',    emoji: '🏠' },
    { path: '/dashboard/catalog',  label: 'Catalogue',  emoji: '📦' },
    { path: '/dashboard/artisans', label: 'Artisans',   emoji: '🔨' },
    { path: '/dashboard/quotes',   label: 'Devis',      emoji: '📋' },
    { path: '/dashboard/projects', label: 'Projets',    emoji: '🏗️' },
    { path: '/dashboard/profile',  label: 'Profil',     emoji: '👤' },
];

const CONFIDENCE    = 0.72;
const FRAMES_NEEDED = 18;
const COOLDOWN_MS   = 1500;
const PINCH_DIST    = 0.08;
const SMOOTHING     = 0.7;

const CONNECTIONS = [
    [0,1],[1,2],[2,3],[3,4],
    [0,5],[5,6],[6,7],[7,8],
    [0,9],[9,10],[10,11],[11,12],
    [0,13],[13,14],[14,15],[15,16],
    [0,17],[17,18],[18,19],[19,20],
    [5,9],[9,13],[13,17],
];

const LCOLOR = (i) =>
    i<=4 ? '#86efac' : i<=8 ? '#4ade80' : i<=12 ? '#22c55e' : i<=16 ? '#16a34a' : '#15803d';

const GESTURES = {
    Pointing_Up: { emoji:'☝️', label:'Page précédente', color:'#4ade80', Icon: ChevronLeft  },
    Victory:     { emoji:'✌️', label:'Page suivante',   color:'#86efac', Icon: ChevronRight },
    Thumb_Up:    { emoji:'👍', label:'Défiler haut',    color:'#4ade80', Icon: ChevronsUp   },
    Thumb_Down:  { emoji:'👎', label:'Défiler bas',     color:'#86efac', Icon: ChevronsDown },
    Closed_Fist: { emoji:'✊', label:'Stop',            color:'#f87171', Icon: X            },
    cursor:      { emoji:'🖱️', label:'Mode curseur',   color:'#fbbf24', Icon: MousePointer2 },
};

const SHORTCUTS = [
    { emoji:'☝️', gesture:'1 doigt',  action:'Page précédente' },
    { emoji:'✌️', gesture:'2 doigts', action:'Page suivante'   },
    { emoji:'✋', gesture:'Paume',    action:'Mode curseur'    },
    { emoji:'👌', gesture:'Pincer',   action:'Cliquer'         },
    { emoji:'👍', gesture:'Pouce ↑',  action:'Défiler haut'    },
    { emoji:'✊', gesture:'Poing',    action:'Stop / Quitter'  },
];

/* ─── Component ───────────────────────────────────────────────── */
export default function GestureController() {
    const navigate = useNavigate();

    /* refs */
    const videoRef   = useRef(null);
    const canvasRef  = useRef(null);
    const cursorRef  = useRef(null);
    const streamRef  = useRef(null);
    const scrollRef  = useRef(null);
    const enabledR   = useRef(false);
    const lastTimeR  = useRef(-1);
    const frameR     = useRef(0);
    const gestureR   = useRef(null);
    const firedR     = useRef(false);
    const cooldownR  = useRef(0);
    const cursorMR   = useRef(false);
    const wasPinchR  = useRef(false);
    const pinchFR    = useRef(0);
    const cursorPos  = useRef({ x: innerWidth/2, y: innerHeight/2 });

    /* state */
    const [recognizer, setRecognizer] = useState(null);
    const [modelReady,  setModelReady] = useState(false);
    const [isLive,      setIsLive]     = useState(false);
    const [open,        setOpen]       = useState(false);
    const [camErr,      setCamErr]     = useState(null);
    const [scrolling,   setScrolling]  = useState(false);
    const [scrollDir,   setScrollDir]  = useState(null);
    const [gesture,     setGesture]    = useState(null);
    const [progress,    setProgress]   = useState(0);
    const [cursorMode,  setCursorMode] = useState(false);
    const [pinching,    setPinching]   = useState(false);
    const [clickFx,     setClickFx]    = useState(false);
    const [hovered,     setHovered]    = useState(null);

    useEffect(() => { enabledR.current = isLive; },    [isLive]);
    useEffect(() => { cursorMR.current = cursorMode; }, [cursorMode]);

    /* ── helpers ────────────────────────────────────────────────── */
    const routeIdx = () => {
        const p = location.pathname;
        const i = APP_ROUTES.findIndex(r => p.startsWith(r.path));
        return i >= 0 ? i : 0;
    };

    const startScroll = useCallback((dir) => {
        if (scrollRef.current) clearInterval(scrollRef.current);
        setScrolling(true); setScrollDir(dir);
        scrollRef.current = setInterval(() =>
            window.scrollBy({ top: dir==='up' ? -60 : 60 }), 40);
    }, []);

    const stopScroll = useCallback(() => {
        if (scrollRef.current) { clearInterval(scrollRef.current); scrollRef.current = null; }
        setScrolling(false); setScrollDir(null);
    }, []);

    const ldist = (lm, a, b) => {
        const A=lm[a], B=lm[b];
        return Math.hypot(A.x-B.x, A.y-B.y);
    };

    const doClick = useCallback((x, y) => {
        setClickFx(true);
        setTimeout(() => setClickFx(false), 400);
        const el = document.elementFromPoint(x, y);
        if (!el) return;
        const t = el.closest('button') || el.closest('a') || el.closest('[role="button"]') || el;
        if (window.getComputedStyle(el).cursor==='pointer' || t!==el) {
            t.click();
            t.style.transform='scale(0.95)';
            setTimeout(() => { t.style.transform=''; }, 150);
        }
    }, []);

    const doHover = useCallback((x, y) => {
        const el = document.elementFromPoint(x, y);
        if (!el) { setHovered(null); return; }
        const t = el.closest('button')||el.closest('a')||el.closest('[role="button"]');
        setHovered(t ? (t.textContent?.trim().slice(0,22)||'Élément') : null);
    }, []);

    const doAction = useCallback((g) => {
        if (g==='Pointing_Up') {
            const i=routeIdx();
            if (i>0) { const t=APP_ROUTES[i-1]; navigate(t.path); toast.success(`${t.emoji} ${t.label}`,{id:'nav'}); }
            else toast('🏠 Première page',{id:'nav'});
        } else if (g==='Victory') {
            const i=routeIdx();
            if (i<APP_ROUTES.length-1) { const t=APP_ROUTES[i+1]; navigate(t.path); toast.success(`${t.emoji} ${t.label}`,{id:'nav'}); }
            else toast('🏁 Dernière page',{id:'nav'});
        } else if (g==='Thumb_Up')   startScroll('up');
        else if (g==='Thumb_Down')   startScroll('down');
        else if (g==='Closed_Fist')  stopScroll();
    }, [navigate, startScroll, stopScroll]);

    /* ── model load ─────────────────────────────────────────────── */
    useEffect(() => {
        (async () => {
            try {
                const { FilesetResolver, GestureRecognizer } = await import('@mediapipe/tasks-vision');
                const vision = await FilesetResolver.forVisionTasks(
                    'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm');
                setRecognizer(await GestureRecognizer.createFromOptions(vision, {
                    baseOptions: { modelAssetPath:'/models/gesture_recognizer.task', delegate:'GPU' },
                    runningMode:'VIDEO', numHands:1,
                }));
                setModelReady(true);
            } catch(e) { console.error(e); }
        })();
        return () => { if (scrollRef.current) clearInterval(scrollRef.current); };
    }, []);

    /* ── camera ─────────────────────────────────────────────────── */
    const startCam = async () => {
        setCamErr(null);
        try {
            streamRef.current = await navigator.mediaDevices.getUserMedia({ video:{width:640,height:480} });
            setIsLive(true);
        } catch { setCamErr('Accès caméra refusé'); }
    };

    const stopCam = () => {
        setIsLive(false); setOpen(false); setGesture(null); setProgress(0);
        setCursorMode(false); stopScroll();
        frameR.current=0; gestureR.current=null; firedR.current=false;
        streamRef.current?.getTracks().forEach(t=>t.stop()); streamRef.current=null;
        if (videoRef.current) videoRef.current.srcObject=null;
    };

    // Initial stream attach (camera just turned on)
    useEffect(() => {
        if (isLive && streamRef.current && videoRef.current) {
            videoRef.current.srcObject = streamRef.current;
            videoRef.current.play().then(() => requestAnimationFrame(predict));
        }
    }, [isLive, recognizer]);

    // Re-attach stream whenever the panel reopens (AnimatePresence recreates the <video> node)
    useEffect(() => {
        if (open && isLive && streamRef.current && videoRef.current) {
            if (!videoRef.current.srcObject) {
                videoRef.current.srcObject = streamRef.current;
                videoRef.current.play().catch(() => {});
            }
        }
    }, [open]);

    /* ── skeleton ───────────────────────────────────────────────── */
    const drawSkeleton = useCallback((lm) => {
        const cv=canvasRef.current, vid=videoRef.current;
        if (!cv||!vid) return;
        const ctx=cv.getContext('2d');
        const r=vid.getBoundingClientRect();
        cv.width=r.width; cv.height=r.height;
        ctx.clearRect(0,0,cv.width,cv.height);
        if (!lm?.length) return;

        ctx.lineWidth=2; ctx.lineCap='round';
        CONNECTIONS.forEach(([si,ei]) => {
            const s=lm[si], e=lm[ei];
            const sx=(1-s.x)*cv.width, sy=s.y*cv.height;
            const ex=(1-e.x)*cv.width, ey=e.y*cv.height;
            const g=ctx.createLinearGradient(sx,sy,ex,ey);
            g.addColorStop(0,LCOLOR(si)+'cc');
            g.addColorStop(1,LCOLOR(ei)+'cc');
            ctx.strokeStyle=g;
            ctx.beginPath(); ctx.moveTo(sx,sy); ctx.lineTo(ex,ey); ctx.stroke();
        });

        lm.forEach((p,i) => {
            const x=(1-p.x)*cv.width, y=p.y*cv.height, c=LCOLOR(i);
            ctx.beginPath(); ctx.arc(x,y,6,0,Math.PI*2);
            ctx.fillStyle=c+'44'; ctx.fill();
            ctx.beginPath(); ctx.arc(x,y,3.5,0,Math.PI*2);
            ctx.fillStyle=c; ctx.fill();
            ctx.beginPath(); ctx.arc(x,y,1.2,0,Math.PI*2);
            ctx.fillStyle='#fff'; ctx.fill();
        });
    }, []);

    /* ── predict loop ───────────────────────────────────────────── */
    const predict = () => {
        if (!recognizer||!videoRef.current||videoRef.current.videoWidth===0) {
            if (enabledR.current) requestAnimationFrame(predict);
            return;
        }
        const now=performance.now();
        if (videoRef.current.currentTime===lastTimeR.current) {
            if (enabledR.current) requestAnimationFrame(predict);
            return;
        }
        lastTimeR.current=videoRef.current.currentTime;

        try {
            const res=recognizer.recognizeForVideo(videoRef.current,now);
            if (res.gestures.length>0 && res.landmarks?.length>0) {
                const lm=res.landmarks[0];
                const top=res.gestures[0][0];
                const name=top.categoryName, score=top.score;
                drawSkeleton(lm);

                // exit cursor
                if (cursorMR.current && name==='Closed_Fist' && score>CONFIDENCE) {
                    setCursorMode(false); cursorMR.current=false;
                    setPinching(false); setHovered(null); setGesture(null);
                    toast('Mode curseur désactivé',{id:'cm',icon:'🖱️'});
                }
                // in cursor mode
                else if (cursorMR.current) {
                    const tip=lm[8];
                    const tx=(1-tip.x)*innerWidth, ty=tip.y*innerHeight;
                    cursorPos.current.x += (tx-cursorPos.current.x)*SMOOTHING;
                    cursorPos.current.y += (ty-cursorPos.current.y)*SMOOTHING;
                    if (cursorRef.current) {
                        cursorRef.current.style.left=cursorPos.current.x+'px';
                        cursorRef.current.style.top=cursorPos.current.y+'px';
                    }
                    doHover(cursorPos.current.x, cursorPos.current.y);
                    const p=ldist(lm,4,8)<PINCH_DIST;
                    setPinching(p);
                    if (p && !wasPinchR.current) {
                        pinchFR.current++;
                        if (pinchFR.current>=3) { doClick(cursorPos.current.x,cursorPos.current.y); wasPinchR.current=true; }
                    } else if (!p) { wasPinchR.current=false; pinchFR.current=0; }
                    setGesture('cursor');
                    if (enabledR.current) requestAnimationFrame(predict);
                    return;
                }
                // enter cursor
                else if (name==='Open_Palm' && score>CONFIDENCE) {
                    setCursorMode(true); cursorMR.current=true;
                    cursorPos.current={x:innerWidth/2, y:innerHeight/2};
                    setGesture('cursor');
                    toast('Mode curseur activé',{id:'cm',icon:'🖱️'});
                    if (enabledR.current) requestAnimationFrame(predict);
                    return;
                }

                const actionable=['Pointing_Up','Victory','Thumb_Up','Thumb_Down','Closed_Fist'].includes(name);
                const inCD=(now-cooldownR.current)<COOLDOWN_MS;

                if (score>CONFIDENCE && actionable) {
                    if (name===gestureR.current) { if (!inCD) frameR.current++; }
                    else {
                        gestureR.current=name;
                        frameR.current=inCD?0:1;
                        if (!inCD) firedR.current=false;
                    }
                    setGesture(name);
                    setProgress(inCD?0:Math.min(frameR.current/FRAMES_NEEDED,1));
                    if (frameR.current>=FRAMES_NEEDED && !firedR.current && !inCD) {
                        firedR.current=true; cooldownR.current=now;
                        doAction(name);
                    }
                } else if (!cursorMR.current) {
                    gestureR.current=null; frameR.current=0;
                    if ((now-cooldownR.current)>=COOLDOWN_MS) firedR.current=false;
                    setGesture(null); setProgress(0);
                }
            } else {
                drawSkeleton(null);
                if (!cursorMR.current) {
                    gestureR.current=null; frameR.current=0;
                    if ((now-cooldownR.current)>=COOLDOWN_MS) firedR.current=false;
                    setGesture(null); setProgress(0);
                }
            }
        } catch(e) { console.error(e); }
        if (enabledR.current) requestAnimationFrame(predict);
    };

    const gMeta = gesture ? GESTURES[gesture] : null;
    const arc   = 2*Math.PI*36;

    /* ─── RENDER ─────────────────────────────────────────────────── */
    return (
        <>
            {/* ═══ Virtual Cursor ════════════════════════════════════ */}
            <AnimatePresence>
                {cursorMode && isLive && (
                    <>
                        <motion.div
                            ref={cursorRef}
                            initial={{scale:0}} animate={{scale:1}} exit={{scale:0}}
                            transition={{type:'spring',stiffness:500,damping:30}}
                            className="fixed z-[99999] pointer-events-none"
                            style={{left:cursorPos.current.x, top:cursorPos.current.y, transform:'translate(-50%,-50%)'}}
                        >
                            {/* outer pulse */}
                            <span className="absolute inset-0 rounded-full animate-ping"
                                style={{background: pinching ? 'rgba(251,191,36,0.4)' : 'rgba(74,222,128,0.35)'}} />
                            {/* ring */}
                            <div style={{
                                width:36, height:36, borderRadius:'50%',
                                border: `2.5px solid ${pinching ? '#fbbf24' : '#4ade80'}`,
                                background: pinching ? 'rgba(251,191,36,0.15)' : 'rgba(74,222,128,0.12)',
                                display:'flex', alignItems:'center', justifyContent:'center',
                                boxShadow: pinching
                                    ? '0 0 18px rgba(251,191,36,0.6)'
                                    : '0 0 18px rgba(74,222,128,0.5)',
                                transition:'all 0.12s',
                            }}>
                                <div style={{width:6,height:6,borderRadius:'50%',
                                    background: pinching ? '#fbbf24' : '#4ade80'}} />
                            </div>
                        </motion.div>

                        {/* Click ripple */}
                        <AnimatePresence>
                            {clickFx && (
                                <motion.div key="ripple"
                                    initial={{scale:0.5,opacity:1}} animate={{scale:3,opacity:0}}
                                    transition={{duration:0.5,ease:'easeOut'}}
                                    className="fixed z-[99998] pointer-events-none"
                                    style={{
                                        left:cursorPos.current.x, top:cursorPos.current.y,
                                        transform:'translate(-50%,-50%)',
                                        width:36, height:36, borderRadius:'50%',
                                        border:'2px solid #fbbf24',
                                    }}
                                />
                            )}
                        </AnimatePresence>

                        {/* Hover label */}
                        <AnimatePresence>
                            {hovered && (
                                <motion.div key="tip"
                                    initial={{opacity:0,y:4}} animate={{opacity:1,y:0}} exit={{opacity:0}}
                                    className="fixed z-[99997] pointer-events-none"
                                    style={{left:cursorPos.current.x+16, top:cursorPos.current.y+16}}
                                >
                                    <div style={{
                                        background:'rgba(0,0,0,0.85)',
                                        color:'#fff', fontSize:11, fontWeight:600,
                                        padding:'4px 10px', borderRadius:8,
                                        backdropFilter:'blur(8px)',
                                        border:'1px solid rgba(255,255,255,0.08)',
                                        maxWidth:160, whiteSpace:'nowrap', overflow:'hidden',
                                        textOverflow:'ellipsis',
                                    }}>
                                        {hovered}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </>
                )}
            </AnimatePresence>

            {/* ═══ FAB ═══════════════════════════════════════════════ */}
            <div className="fixed bottom-8 right-8 z-[9999] flex flex-col items-end gap-3">

                {/* Floating gesture pill – visible when live + panel closed */}
                <AnimatePresence>
                    {isLive && !open && gMeta && (
                        <motion.div
                            initial={{opacity:0,x:12,scale:0.9}}
                            animate={{opacity:1,x:0,scale:1}}
                            exit={{opacity:0,x:12,scale:0.9}}
                            style={{
                                background:'rgba(15,20,26,0.92)',
                                border:'1px solid rgba(255,255,255,0.09)',
                                borderRadius:100,
                                backdropFilter:'blur(16px)',
                                display:'flex', alignItems:'center', gap:8,
                                padding:'8px 14px 8px 10px',
                                boxShadow:'0 8px 32px rgba(0,0,0,0.4)',
                            }}
                        >
                            <span style={{fontSize:18,lineHeight:1}}>{gMeta.emoji}</span>
                            <span style={{color:gMeta.color,fontSize:12,fontWeight:700}}>{gMeta.label}</span>
                            {progress>0 && progress<1 && (
                                <div style={{width:40,height:3,background:'rgba(255,255,255,0.1)',borderRadius:99,overflow:'hidden'}}>
                                    <motion.div
                                        style={{height:'100%',background:gMeta.color,borderRadius:99}}
                                        animate={{width:`${progress*100}%`}}
                                        transition={{duration:0.05}}
                                    />
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* FAB button */}
                <motion.button
                    whileHover={{scale:1.06}} whileTap={{scale:0.93}}
                    onClick={() => {
                        if (!isLive) { startCam(); setOpen(true); }
                        else setOpen(o => !o);
                    }}
                    style={{
                        width:60, height:60, borderRadius:18,
                        background: isLive
                            ? 'linear-gradient(135deg,#4a5d23,#6b8030)'
                            : '#fff',
                        border: isLive ? 'none' : '1px solid rgba(0,0,0,0.08)',
                        color: isLive ? '#fff' : '#4a5d23',
                        display:'flex', alignItems:'center', justifyContent:'center',
                        cursor:'pointer', position:'relative',
                        boxShadow: isLive
                            ? '0 8px 28px rgba(74,93,35,0.45)'
                            : '0 4px 20px rgba(0,0,0,0.1)',
                        transition:'background 0.2s, box-shadow 0.2s',
                    }}
                >
                    <Hand size={24} strokeWidth={2.2} />
                    {isLive && (
                        <span style={{
                            position:'absolute', top:8, right:8,
                            width:9, height:9, borderRadius:'50%',
                            background:'#ef4444',
                            border:'1.5px solid #fff',
                            boxShadow:'0 0 0 0 rgba(239,68,68,0.7)',
                            animation:'live-ping 1.5s ease-out infinite',
                        }} />
                    )}
                </motion.button>
            </div>

            {/* ═══ Panel ══════════════════════════════════════════════ */}
            <AnimatePresence>
                {open && isLive && (
                    <motion.div
                        initial={{opacity:0,y:20,scale:0.96}}
                        animate={{opacity:1,y:0,scale:1}}
                        exit={{opacity:0,y:20,scale:0.96}}
                        transition={{type:'spring',damping:30,stiffness:360}}
                        style={{
                            position:'fixed', bottom:96, right:32,
                            width:320, zIndex:9998,
                            background:'rgba(10,13,18,0.97)',
                            border:'1px solid rgba(255,255,255,0.08)',
                            borderRadius:24,
                            overflow:'hidden',
                            boxShadow:'0 24px 80px rgba(0,0,0,0.55), 0 0 0 1px rgba(74,93,35,0.2)',
                            backdropFilter:'blur(20px)',
                        }}
                    >
                        {/* ─ Top bar ─ */}
                        <div style={{
                            display:'flex', alignItems:'center', justifyContent:'space-between',
                            padding:'16px 18px',
                            borderBottom:'1px solid rgba(255,255,255,0.06)',
                        }}>
                            <div style={{display:'flex',alignItems:'center',gap:10}}>
                                {/* Live dot */}
                                <div style={{position:'relative',width:8,height:8}}>
                                    <span style={{
                                        position:'absolute',inset:0,borderRadius:'50%',
                                        background: cursorMode?'#fbbf24':scrolling?'#f97316':'#4ade80',
                                        animation:'live-ping 1.4s ease-out infinite',
                                        opacity:0.5,
                                    }} />
                                    <span style={{
                                        position:'absolute',inset:0,borderRadius:'50%',
                                        background: cursorMode?'#fbbf24':scrolling?'#f97316':'#4ade80',
                                    }} />
                                </div>
                                <span style={{
                                    color:'rgba(255,255,255,0.85)',
                                    fontSize:13, fontWeight:700, letterSpacing:'0.01em',
                                }}>
                                    {cursorMode ? 'Mode Curseur' : scrolling ? `Défilement ${scrollDir==='up'?'↑':'↓'}` : 'Contrôle Gestuel'}
                                </span>
                            </div>
                            <button
                                onClick={stopCam}
                                style={{
                                    background:'rgba(255,255,255,0.06)',
                                    border:'1px solid rgba(255,255,255,0.08)',
                                    borderRadius:8, width:28, height:28,
                                    display:'flex', alignItems:'center', justifyContent:'center',
                                    color:'rgba(255,255,255,0.5)', cursor:'pointer',
                                }}
                                onMouseOver={e=>{ e.currentTarget.style.background='rgba(255,255,255,0.12)'; e.currentTarget.style.color='#fff'; }}
                                onMouseOut={e=>{  e.currentTarget.style.background='rgba(255,255,255,0.06)'; e.currentTarget.style.color='rgba(255,255,255,0.5)'; }}
                            >
                                <X size={13} />
                            </button>
                        </div>

                        {/* ─ Camera ─ */}
                        <div style={{padding:'14px 14px 0'}}>
                            <div style={{
                                position:'relative', borderRadius:16, overflow:'hidden',
                                aspectRatio:'16/9',
                                background:'#000',
                                border:'1px solid rgba(255,255,255,0.06)',
                            }}>
                                {camErr ? (
                                    <div style={{
                                        position:'absolute',inset:0,display:'flex',flexDirection:'column',
                                        alignItems:'center',justifyContent:'center',gap:8,
                                        color:'#f87171',
                                    }}>
                                        <X size={22}/>
                                        <span style={{fontSize:12}}>{camErr}</span>
                                    </div>
                                ) : (
                                    <>
                                        <video ref={videoRef} autoPlay playsInline muted
                                            style={{width:'100%',height:'100%',objectFit:'cover',transform:'scaleX(-1)'}}/>
                                        <canvas ref={canvasRef}
                                            style={{position:'absolute',inset:0,width:'100%',height:'100%',pointerEvents:'none'}}/>
                                    </>
                                )}

                                {/* scan corners */}
                                {[
                                    {top:8,left:8,  bt:'2px solid #4a5d23',bl:'2px solid #4a5d23',br:'none',bb:'none', tl:5},
                                    {top:8,right:8, bt:'2px solid #4a5d23',br:'2px solid #4a5d23',bl:'none',bb:'none', tr:5},
                                    {bottom:8,left:8, bb:'2px solid #4a5d23',bl:'2px solid #4a5d23',bt:'none',br:'none', bl2:5},
                                    {bottom:8,right:8,bb:'2px solid #4a5d23',br:'2px solid #4a5d23',bt:'none',bl:'none', br2:5},
                                ].map((c,i) => (
                                    <div key={i} style={{
                                        position:'absolute', width:14, height:14,
                                        top:c.top, bottom:c.bottom, left:c.left, right:c.right,
                                        borderTop:    c.bt||'none',
                                        borderRight:  c.br||'none',
                                        borderBottom: c.bb||'none',
                                        borderLeft:   c.bl||'none',
                                        borderTopLeftRadius:     i===0?5:0,
                                        borderTopRightRadius:    i===1?5:0,
                                        borderBottomLeftRadius:  i===2?5:0,
                                        borderBottomRightRadius: i===3?5:0,
                                    }}/>
                                ))}

                                {/* cursor badge */}
                                <AnimatePresence>
                                    {cursorMode && (
                                        <motion.div initial={{opacity:0,y:-6}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-6}}
                                            style={{
                                                position:'absolute',top:10,left:10,
                                                background:'rgba(0,0,0,0.7)',
                                                backdropFilter:'blur(8px)',
                                                border:'1px solid rgba(251,191,36,0.3)',
                                                borderRadius:100,
                                                display:'flex',alignItems:'center',gap:6,
                                                padding:'4px 10px',
                                            }}
                                        >
                                            <span style={{width:6,height:6,borderRadius:'50%',background:'#fbbf24',animation:'live-ping 1.5s ease-out infinite'}}/>
                                            <span style={{color:'#fbbf24',fontSize:10,fontWeight:700,letterSpacing:'0.06em'}}>
                                                MODE CURSEUR
                                            </span>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* gesture progress overlay */}
                                <AnimatePresence>
                                    {gMeta && !cursorMode && progress>0 && (
                                        <motion.div
                                            key={gesture}
                                            initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
                                            style={{
                                                position:'absolute',inset:0,
                                                display:'flex',alignItems:'center',justifyContent:'center',
                                                background:`radial-gradient(circle, ${gMeta.color}15 0%, transparent 70%)`,
                                            }}
                                        >
                                            <div style={{position:'relative',width:80,height:80}}>
                                                <svg width="80" height="80" style={{transform:'rotate(-90deg)',position:'absolute',inset:0}}>
                                                    <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="4"/>
                                                    <motion.circle
                                                        cx="40" cy="40" r="34" fill="none"
                                                        stroke={gMeta.color} strokeWidth="4"
                                                        strokeLinecap="round"
                                                        strokeDasharray={arc}
                                                        animate={{strokeDashoffset: arc*(1-progress)}}
                                                        transition={{duration:0.05}}
                                                        style={{filter:`drop-shadow(0 0 6px ${gMeta.color}88)`}}
                                                    />
                                                </svg>
                                                <div style={{
                                                    position:'absolute',inset:0,
                                                    display:'flex',flexDirection:'column',
                                                    alignItems:'center',justifyContent:'center',gap:2,
                                                }}>
                                                    <span style={{fontSize:22,lineHeight:1}}>{gMeta.emoji}</span>
                                                    {progress>=1 && <span style={{color:gMeta.color,fontSize:10,fontWeight:800}}>✓</span>}
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>

                        {/* ─ Status area ─ */}
                        <div style={{padding:'12px 14px'}}>
                            <AnimatePresence mode="wait">
                                {cursorMode ? (
                                    <motion.div key="cmode"
                                        initial={{opacity:0,y:6}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-6}}
                                        style={{
                                            background:'rgba(251,191,36,0.08)',
                                            border:'1px solid rgba(251,191,36,0.2)',
                                            borderRadius:12,
                                            padding:'10px 14px',
                                            display:'flex', alignItems:'center', gap:12,
                                        }}
                                    >
                                        <span style={{fontSize:22}}>🖱️</span>
                                        <div>
                                            <div style={{color:'#fbbf24',fontSize:12,fontWeight:700}}>
                                                {pinching ? 'Pincement — clic !' : 'Bougez votre index'}
                                            </div>
                                            <div style={{color:'rgba(255,255,255,0.35)',fontSize:11,marginTop:2}}>
                                                ✊ Poing pour quitter
                                            </div>
                                        </div>
                                    </motion.div>
                                ) : gMeta ? (
                                    <motion.div key={gesture}
                                        initial={{opacity:0,y:6}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-6}}
                                        style={{
                                            background:`rgba(${gMeta.color==='#f87171'?'248,113,113':'74,222,128'},0.07)`,
                                            border:`1px solid ${gMeta.color}28`,
                                            borderRadius:12,
                                            padding:'10px 14px',
                                            display:'flex', alignItems:'center', gap:12,
                                        }}
                                    >
                                        <span style={{fontSize:22,lineHeight:1}}>{gMeta.emoji}</span>
                                        <div style={{flex:1}}>
                                            <div style={{color:gMeta.color,fontSize:12,fontWeight:700}}>{gMeta.label}</div>
                                            <div style={{
                                                marginTop:6, height:3,
                                                background:'rgba(255,255,255,0.08)',
                                                borderRadius:99, overflow:'hidden',
                                            }}>
                                                <motion.div
                                                    style={{height:'100%',borderRadius:99,background:gMeta.color,
                                                        boxShadow:`0 0 8px ${gMeta.color}88`}}
                                                    animate={{width:`${progress*100}%`}}
                                                    transition={{duration:0.05}}
                                                />
                                            </div>
                                        </div>
                                    </motion.div>
                                ) : (
                                    <motion.div key="idle"
                                        initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
                                        style={{
                                            display:'flex',alignItems:'center',justifyContent:'center',gap:8,
                                            padding:'12px',
                                            background:'rgba(255,255,255,0.03)',
                                            borderRadius:12, border:'1px solid rgba(255,255,255,0.06)',
                                        }}
                                    >
                                        <Zap size={13} color="rgba(255,255,255,0.2)"/>
                                        <span style={{color:'rgba(255,255,255,0.25)',fontSize:11,fontWeight:500}}>
                                            Montrez un geste à la caméra
                                        </span>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* ─ Shortcuts ─ */}
                        <div style={{
                            margin:'0 14px 14px',
                            borderRadius:12,
                            border:'1px solid rgba(255,255,255,0.06)',
                            overflow:'hidden',
                        }}>
                            <div style={{
                                padding:'8px 14px',
                                background:'rgba(255,255,255,0.03)',
                                borderBottom:'1px solid rgba(255,255,255,0.05)',
                                display:'flex',alignItems:'center',gap:6,
                            }}>
                                <Zap size={10} color="#4a5d23"/>
                                <span style={{
                                    color:'#4ade80',fontSize:10,fontWeight:800,
                                    letterSpacing:'0.1em',textTransform:'uppercase',
                                }}>
                                    Raccourcis
                                </span>
                            </div>
                            {SHORTCUTS.map((s,i) => (
                                <div key={i} style={{
                                    display:'flex',alignItems:'center',gap:10,
                                    padding:'8px 14px',
                                    borderTop: i>0?'1px solid rgba(255,255,255,0.04)':'none',
                                    background:'transparent',
                                }}>
                                    <span style={{fontSize:14,width:20,textAlign:'center',flexShrink:0}}>{s.emoji}</span>
                                    <span style={{color:'rgba(255,255,255,0.35)',fontSize:11}}>
                                        <strong style={{color:'rgba(255,255,255,0.6)',fontWeight:600}}>{s.gesture}</strong>
                                        {' — '}{s.action}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ─ Global keyframe for live ping ─ */}
            <style>{`
                @keyframes live-ping {
                    0%   { transform:scale(1);   opacity:0.75; }
                    75%  { transform:scale(2.2); opacity:0;    }
                    100% { transform:scale(2.2); opacity:0;    }
                }
            `}</style>
        </>
    );
}
