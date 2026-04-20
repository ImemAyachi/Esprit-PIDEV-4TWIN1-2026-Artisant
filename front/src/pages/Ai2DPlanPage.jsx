import React, { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../services/api';

function downloadSvg(svg, filename = 'plan-2d.svg') {
  const svgStr = String(svg || '').trim();
  if (!svgStr) return;
  const blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function Ai2DPlanPage() {
  const [input, setInput] = useState('');
  const [plan, setPlan] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [norms, setNorms] = useState('fr');
  const [svgZoom, setSvgZoom] = useState(1);

  const dimsText = useMemo(() => {
    const w = plan?.plan?.width_m;
    const h = plan?.plan?.height_m;
    if (!w || !h) return '';
    return `${w}m x ${h}m`;
  }, [plan]);

  const onSubmit = async (e) => {
    e.preventDefault();
    const trimmed = String(input || '').trim();
    if (!trimmed) return;

    setError(null);
    setBusy(true);
    try {
      const { data } = await api.post('/ai/plan-2d', { input: trimmed, norms });
      if (!data?.success) throw new Error(data?.message || 'Réponse serveur invalide');
      if (!data?.data?.svg) throw new Error('SVG manquant dans la réponse');
      setPlan(data.data);
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Erreur génération plan 2D';
      setError(msg);
      toast.error(msg);
      setPlan(null);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '1.5rem 1rem' }}>
      <div className="card" style={{ marginBottom: '1rem', padding: '1.25rem 1.25rem' }}>
        <h2 style={{ margin: 0, fontWeight: 900 }}>Texte → Plan 2D</h2>
        <p style={{ marginTop: '0.5rem', color: 'var(--clr-text-muted)', lineHeight: 1.6 }}>
          Décrivez votre logement (pièces, surfaces approximatives, disposition). Le serveur génère un plan SVG
          téléchargeable.
        </p>
      </div>

      <div className="card" style={{ marginBottom: '1rem', padding: '1.25rem 1.25rem' }}>
        <form onSubmit={onSubmit}>
          {error && (
            <div role="alert" className="pdf-alert pdf-alert-error" style={{ marginBottom: '1rem' }}>
              {error}
            </div>
          )}

          <label htmlFor="ai-2d-input" className="form-label">
            Description du plan
          </label>
          <textarea
            id="ai-2d-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={6}
            className="form-input min-h-[140px] disabled:opacity-60"
            style={{ resize: 'vertical' }}
            placeholder="Ex: Appartement 2 chambres. Entrée au nord, séjour au centre, cuisine à l'est, salle de bain près des chambres. Dimensions approximatives 10x8m."
            disabled={busy}
          />

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '1rem' }}>
            <div style={{ minWidth: 220 }}>
              <label className="form-label">Norme (client)</label>
              <select
                className="form-input"
                value={norms}
                onChange={(e) => setNorms(e.target.value)}
                disabled={busy}
              >
                <option value="fr">France / Tunisie (CAD)</option>
                <option value="int">International</option>
              </select>
            </div>
            <button type="submit" className="btn btn-primary" disabled={busy || !input.trim()}>
              {busy ? 'Génération…' : 'Générer le plan 2D'}
            </button>
            <button type="button" className="btn btn-secondary" disabled={!plan?.svg} onClick={() => downloadSvg(plan?.svg)}>
              Télécharger SVG
            </button>
          </div>
        </form>
      </div>

      {plan?.svg && (
        <div className="card" style={{ padding: '1rem 1rem', overflow: 'hidden' }}>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'baseline',
              gap: '0.75rem',
              marginBottom: '0.5rem',
            }}
          >
            <div style={{ fontWeight: 900 }}>Aperçu</div>
            {dimsText && <div style={{ color: 'var(--clr-text-muted)' }}>{dimsText}</div>}
            {Array.isArray(plan?.plan?.rooms) && plan.plan.rooms.length > 0 && (
              <div style={{ color: 'var(--clr-text-muted)' }}>Pièces: {plan.plan.rooms.length}</div>
            )}
            <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setSvgZoom((z) => Math.max(0.5, Math.round((z - 0.1) * 10) / 10))}
              >
                −
              </button>
              <div style={{ minWidth: 64, textAlign: 'center', color: 'var(--clr-text-muted)' }}>{Math.round(svgZoom * 100)}%</div>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setSvgZoom((z) => Math.min(3, Math.round((z + 0.1) * 10) / 10))}
              >
                +
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => setSvgZoom(1)}>
                Reset
              </button>
            </div>
          </div>

          <div
            style={{
              border: '1px solid var(--clr-border, #e5e5e5)',
              borderRadius: 12,
              overflow: 'auto',
              background: '#fff',
            }}
          >
            <div style={{ transform: `scale(${svgZoom})`, transformOrigin: 'top left', width: 'fit-content' }}>
              <div dangerouslySetInnerHTML={{ __html: plan.svg }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
