import React, { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { GitBranch } from 'lucide-react';

const MotionDiv = motion.div;
const MotionLi = motion.li;
const MotionSpan = motion.span;

const nodeVariants = {
  hidden: { opacity: 0, x: -16, filter: 'blur(4px)' },
  visible: (i) => ({
    opacity: 1,
    x: 0,
    filter: 'blur(0px)',
    transition: {
      delay: 0.15 + i * 0.1,
      duration: 0.45,
      ease: [0.22, 1, 0.36, 1],
    },
  }),
};

const nodeVariantsReduced = {
  hidden: { opacity: 1, x: 0, filter: 'none' },
  visible: { opacity: 1, x: 0, filter: 'none', transition: { duration: 0 } },
};

export default function ProductionTimeline({ steps = [], className = '' }) {
  const prefersReducedMotion = useReducedMotion();
  const reduceMotion = prefersReducedMotion === true;
  const items = Array.isArray(steps) ? steps.map(String).filter(Boolean) : [];
  const [pulseIndex, setPulseIndex] = useState(0);

  useEffect(() => {
    if (reduceMotion || items.length <= 1) return undefined;
    const t = setInterval(() => {
      setPulseIndex((i) => (i + 1) % items.length);
    }, 2800);
    return () => clearInterval(t);
  }, [items.length, reduceMotion]);

  if (items.length === 0) {
    return (
      <p className="text-sm font-bold text-brand-slate/40" role="status">
        —
      </p>
    );
  }

  return (
    <div className={className}>
      <div className="flex items-center gap-2 mb-5">
        <GitBranch className="w-4 h-4 text-brand-orange shrink-0" aria-hidden />
        <span className="text-[9px] font-black uppercase tracking-[0.25em] text-brand-teal/55">
          Parcours de réalisation
        </span>
      </div>

      <div className="relative pl-1">
        {/* Animated spine */}
        <div
          className="absolute left-[13px] top-4 bottom-4 w-1 rounded-full bg-brand-teal/10 overflow-hidden"
          aria-hidden
        >
          <MotionDiv
            className="w-full h-full origin-top rounded-full bg-gradient-to-b from-brand-teal via-brand-orange/70 to-brand-teal"
            initial={reduceMotion ? { scaleY: 1 } : { scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={
              reduceMotion
                ? { duration: 0 }
                : { duration: 0.85, ease: [0.22, 1, 0.36, 1] }
            }
          />
        </div>

        <ol className="relative z-[1] space-y-0 list-none m-0 p-0">
          {items.map((text, i) => {
            const isPulse = !reduceMotion && i === pulseIndex;
            return (
              <MotionLi
                key={`${i}-${String(text).slice(0, 40)}`}
                className="relative flex gap-5 pb-12 last:pb-3"
                custom={i}
                variants={reduceMotion ? nodeVariantsReduced : nodeVariants}
                initial={reduceMotion ? false : 'hidden'}
                animate="visible"
              >
                <div className="relative flex shrink-0 w-7 justify-center pt-0.5">
                  <MotionSpan
                    className={[
                      'flex h-7 w-7 items-center justify-center rounded-full border-2 text-[10px] font-black tabular-nums',
                      isPulse
                        ? 'border-brand-orange bg-brand-orange text-white shadow-[0_0_0_4px_rgba(166,110,78,0.25)]'
                        : 'border-brand-teal bg-white text-brand-teal',
                    ].join(' ')}
                    animate={
                      reduceMotion
                        ? undefined
                        : isPulse
                          ? { scale: [1, 1.06, 1] }
                          : { scale: 1 }
                    }
                    transition={{ duration: 0.6, ease: 'easeInOut' }}
                  >
                    {i + 1}
                  </MotionSpan>
                </div>

                <MotionDiv
                  className="min-w-0 flex-1 bg-gradient-to-br from-white to-brand-teal/[0.03] px-4 py-3.5 rounded-lg"
                  whileHover={reduceMotion ? undefined : { x: 2 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                >
                  <p className="text-sm font-bold text-brand-slate/90 leading-snug">{text}</p>
                </MotionDiv>
              </MotionLi>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
