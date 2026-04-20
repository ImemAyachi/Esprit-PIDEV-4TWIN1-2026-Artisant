import React, { useRef, useState } from 'react';
import {
  Sparkles,
  Boxes,
  Users,
  Clock,
  Coins,
  ListOrdered,
  Loader2,
  Lightbulb,
  AlertCircle,
  Target,
  AlertTriangle,
  Zap,
  Download,
  FileText,
} from 'lucide-react';
import api from '../../services/api';
import { extractQuantityFromDescription } from '../../utils/projectPlanner';
import { generateProjectPlanPDF } from '../../utils/projectPlanPdf';
import ProductionTimeline from './ProductionTimeline';

const Section = ({ icon, title, children }) => (
  <section className="pdf-section">
    <h4 className="flex items-center gap-2 pdf-label mb-4">
      {React.createElement(icon, {
        size: 16,
        className: 'text-brand-orange shrink-0',
        'aria-hidden': true,
      })}
      {title}
    </h4>
    <div className="px-5 sm:px-6">{children}</div>
  </section>
);

const BulletList = ({ items }) => (
  <ul className="pdf-bullets">
    {items.map((item, index) => (
      <li
        key={`${index}-${String(item).slice(0, 48)}`}
        className="pdf-bullet"
      >
        {item}
      </li>
    ))}
  </ul>
);

const ListOrEmpty = ({ items }) =>
  items.length > 0 ? <BulletList items={items} /> : <p className="text-sm font-bold planner-muted">—</p>;

const FIELD_NAME = 'projectDescription';

export default function AIProjectPlanner() {
  const planAbortRef = useRef(null);
  const [input, setInput] = useState('');
  const [plan, setPlan] = useState(null);
  const [planQty, setPlanQty] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [planVersion, setPlanVersion] = useState(0);
  const quickPrompts = [
    "Produire 30 sacs en cuir faits main (export), budget 8 000 DT, délai 4 semaines.",
    "Fabriquer 120 tasses en céramique (émaillage), livraison 3 semaines, packaging inclus.",
    "Créer 15 bijoux en argent (gravure), cible luxe, finition premium, délai 2 semaines.",
  ];
  const onSubmit = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const raw = new FormData(form).get(FIELD_NAME);
    const trimmed = typeof raw === 'string' ? raw.trim() : '';
    if (!trimmed) return;

    if (planAbortRef.current) {
      try {
        planAbortRef.current.abort();
      } catch {}
    }
    const controller = new AbortController();
    planAbortRef.current = controller;

    setError(null);
    setBusy(true);
    try {
      let lastErr;
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          const { data } = await api.post('/ai/project-plan', { input: trimmed }, { signal: controller.signal });
          if (!data?.success || !data?.data) {
            throw new Error(data?.message || 'Unexpected response from server');
          }

          setPlan(data.data);
          setPlanQty(extractQuantityFromDescription(trimmed));
          setPlanVersion((v) => v + 1);
          return;
        } catch (err) {
          lastErr = err;
          const status = err.response?.status;
          const isAbort = err.code === 'ERR_CANCELED' || err.name === 'CanceledError';
          if (isAbort) throw err;
          const retryable = status === 429 || status === 502 || status === 503 || !status;
          if (!retryable || attempt === 2) throw err;
          await new Promise((r) => setTimeout(r, 800 * 2 ** attempt));
        }
      }
      throw lastErr;

    } catch (err) {
      const isAbort = err.code === 'ERR_CANCELED' || err.name === 'CanceledError';
      if (isAbort) return;
      const msg =
        err.response?.data?.message ||
        err.message ||
        'Impossible de générer le plan. Vérifiez que l’API tourne et que GROQ_API_KEY ou OPENAI_API_KEY est défini.';
      setError(msg);
      setPlan(null);
    } finally {
      setBusy(false);
    }
  };

  const planExperts = Array.isArray(plan?.experts) ? plan.experts : [];

  return (
    <div
      className="planner-web-root w-full max-w-[980px] mx-auto px-4 sm:px-6"
      style={{ display: 'flex', flexDirection: 'column', gap: '2rem', paddingBottom: '4rem' }}
    >
      <div className="card" style={{ position: 'relative', overflow: 'hidden', padding: '2.5rem 1.5rem' }}>
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            background: 'var(--grad-primary)',
            height: 120,
            opacity: 0.1,
            zIndex: 0,
          }}
        />
        <div
          style={{
            position: 'relative',
            zIndex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: 88,
              height: 88,
              borderRadius: '50%',
              background: 'var(--grad-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '5px solid var(--clr-surface)',
              boxShadow: 'var(--shadow-lg)',
              marginBottom: '1.25rem',
            }}
          >
            <Sparkles size={36} color="#fff" aria-hidden />
          </div>
          <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 800, marginBottom: '0.5rem' }}>
            Plan de production
          </h2>
          <p style={{ color: 'var(--clr-text-muted)', fontSize: '0.9rem', maxWidth: 520, margin: '0 0 1rem', lineHeight: 1.6 }}>
            Matériaux, équipe, délais, coût (DT), étapes, analyse, recommandations artisans.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: plan ? '1rem' : 0 }}>
            <span className="badge badge-primary">IA</span>
            <span className="badge badge-muted">PDF</span>
          </div>
          {plan && (
            <button
              type="button"
              onClick={() => generateProjectPlanPDF(plan, { brief: input, quantity: planQty })}
              className="btn btn-secondary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <Download size={16} aria-hidden />
              Télécharger PDF
            </button>
          )}
        </div>
      </div>

      <div className="card">
        <h3 style={{ margin: '0 0 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FileText size={20} style={{ color: 'var(--clr-primary)' }} aria-hidden />
          Brief projet
        </h3>

        <form onSubmit={onSubmit} className="space-y-6">
          {error && (
            <div role="alert" className="pdf-alert pdf-alert-error">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" aria-hidden />
              <span className="break-words leading-relaxed">{error}</span>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="ai-planner-input" className="form-label">
              Description du projet
            </label>
            <textarea
              id="ai-planner-input"
              name={FIELD_NAME}
              rows={5}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Quantité, matière, finition, délais, budget, destination…"
              disabled={busy}
              className="form-input min-h-[140px] disabled:opacity-60"
              style={{ resize: 'vertical' }}
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-center gap-4 flex-wrap">
            <button
              type="submit"
              disabled={busy || !input.trim()}
              className="btn btn-primary flex items-center justify-center gap-2 min-w-[220px] px-7 py-3"
            >
              {busy ? <Loader2 className="w-5 h-5 animate-spin" aria-hidden /> : <Sparkles size={18} aria-hidden />}
              {busy ? 'Génération…' : 'Générer le plan'}
            </button>

            <div className="flex flex-wrap justify-center gap-2">
              {quickPrompts.map((p) => (
                <button
                  key={p}
                  type="button"
                  disabled={busy}
                  onClick={() => setInput(p)}
                  className="btn btn-ghost text-xs py-2 px-3"
                >
                  {p.split(' ').slice(0, 4).join(' ')}…
                </button>
              ))}
            </div>
          </div>
        </form>
      </div>

      {!plan && (
        <div className="card">
          <h3 style={{ margin: '0 0 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sparkles size={20} style={{ color: 'var(--clr-primary)' }} aria-hidden />
            Aperçu
          </h3>
          <p style={{ color: 'var(--clr-text-muted)', fontSize: '0.95rem', lineHeight: 1.65, margin: 0 }}>
            Décrivez le projet puis cliquez sur <strong>Générer le plan</strong>. Le résultat apparaîtra ici, avec export
            PDF.
          </p>
        </div>
      )}

      {plan && (
        <div key={planVersion} className="space-y-9 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--clr-text-muted)' }}>
                Synthèse
              </span>
              <span className="badge badge-primary">{plan.category}</span>
              {planQty > 1 && <span className="badge badge-muted">Qté ×{planQty}</span>}
            </div>

          <div className="pdf-grid">
            <Section icon={Boxes} title="Matériaux">
              <ListOrEmpty items={plan.materials} />
            </Section>
            <Section icon={Users} title="Experts / équipe">
              <ListOrEmpty items={planExperts} />
            </Section>
            <Section icon={Clock} title="Délai estimé">
              <p className="pdf-kpi">{plan.estimatedTime}</p>
            </Section>
            <Section icon={Coins} title="Coût estimé (DT)">
              <p className="pdf-kpi pdf-kpi-accent">{plan.estimatedCost}</p>
            </Section>
          </div>

          <Section icon={ListOrdered} title="Étapes">
            <ProductionTimeline steps={plan.steps} />
          </Section>

          <Section icon={Lightbulb} title="Analyse & justification">
            <p className="text-sm font-bold text-brand-slate/80 leading-relaxed whitespace-pre-wrap">{plan.reasoning}</p>
          </Section>

          <div className="pdf-grid-3">
            <Section icon={Target} title="Pistes / constats">
              <ListOrEmpty items={plan.insights || []} />
            </Section>
            <Section icon={AlertTriangle} title="Risques">
              <ListOrEmpty items={plan.risks || []} />
            </Section>
            <Section icon={Zap} title="Optimisations">
              <ListOrEmpty items={plan.optimizations || []} />
            </Section>
          </div>
          </div>
        </div>
      )}
    </div>
  );
}
