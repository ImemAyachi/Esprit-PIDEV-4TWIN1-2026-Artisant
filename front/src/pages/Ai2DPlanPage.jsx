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

function downloadUrl(url, filename = 'render.png') {
  const u = String(url || '').trim();
  if (!u) return;
  const a = document.createElement('a');
  a.href = u;
  a.download = filename;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export default function Ai2DPlanPage() {
  const [input, setInput] = useState('');
  const [plan, setPlan] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [norms, setNorms] = useState('fr');
  const [svgZoom, setSvgZoom] = useState(1);
  const [showExplain, setShowExplain] = useState(true);
  const [estimate, setEstimate] = useState(null);
  const [estimating, setEstimating] = useState(false);
  const [showEstimate, setShowEstimate] = useState(true);
  const [stylePresets, setStylePresets] = useState([]);
  const [styleLoading, setStyleLoading] = useState(false);
  const [renderView, setRenderView] = useState('interior');
  const [selectedStyleId, setSelectedStyleId] = useState('');
  const [rendering, setRendering] = useState(false);
  const [renderOut, setRenderOut] = useState(null);
  const [renderMeta, setRenderMeta] = useState(null);

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
      setEstimate(null);
      setStylePresets([]);
      setSelectedStyleId('');
      setRenderOut(null);
      setRenderMeta(null);

      setStyleLoading(true);
      try {
        const resp = await api.post('/ai/plan-2d/style-suggest', { plan: data.data.plan, input: trimmed });
        const presets = resp?.data?.data?.presets;
        if (Array.isArray(presets)) {
          setStylePresets(presets.slice(0, 8));
          setSelectedStyleId(String(presets?.[0]?.id || ''));
        }
      } catch {
        
      } finally {
        setStyleLoading(false);
      }
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Erreur génération plan 2D';
      setError(msg);
      toast.error(msg);
      setPlan(null);
      setEstimate(null);
      setStylePresets([]);
      setSelectedStyleId('');
      setRenderOut(null);
      setRenderMeta(null);
    } finally {
      setBusy(false);
    }
  };

  const formatTnd = (n) => {
    const v = Number(n);
    if (!Number.isFinite(v)) return '';
    return `${Math.round(v).toLocaleString('fr-TN')} د.ت`;
  };

  const onEstimate = async () => {
    if (!plan?.plan) return;
    setEstimating(true);
    try {
      const { data } = await api.post('/ai/plan-2d/estimate', { plan: plan.plan });
      if (!data?.success) throw new Error(data?.message || 'Réponse serveur invalide');
      setEstimate(data.data);
      setShowEstimate(true);
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Erreur estimation';
      toast.error(msg);
      setEstimate(null);
    } finally {
      setEstimating(false);
    }
  };

  const selectedStyle = useMemo(() => {
    if (!Array.isArray(stylePresets) || !stylePresets.length) return null;
    return stylePresets.find((s) => String(s?.id) === String(selectedStyleId)) || stylePresets[0] || null;
  }, [stylePresets, selectedStyleId]);

  const onRenderStyle = async () => {
    if (!plan?.plan || !selectedStyle) return;
    setRendering(true);
    try {
      const style = String(selectedStyle.promptStyle || selectedStyle.name || '').trim().slice(0, 90);
      const { data } = await api.post('/ai/plan-2d/render', {
        plan: plan.plan,
        svg: plan.svg,
        style,
        view: renderView,
      });
      if (!data?.success) throw new Error(data?.message || 'Réponse serveur invalide');
      if (!data?.data?.url) throw new Error('URL image manquante');
      setRenderOut(data.data);
      setRenderMeta(data.meta || null);
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Erreur rendu style';
      toast.error(msg);
      setRenderOut(null);
      setRenderMeta(null);
    } finally {
      setRendering(false);
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
            <button
              type="button"
              className="btn btn-secondary"
              disabled={estimating || !plan?.plan}
              onClick={onEstimate}
              style={{ marginLeft: '0.5rem' }}
            >
              {estimating ? 'Estimation…' : 'Estimer coût (TND)'}
            </button>
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

          {plan?.explain && (
            <div style={{ marginTop: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                <div style={{ fontWeight: 900 }}>Reasoning / Checks</div>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowExplain((v) => !v)}
                  style={{ marginLeft: 'auto' }}
                >
                  {showExplain ? 'Masquer' : 'Afficher'}
                </button>
              </div>

              {showExplain && (
                <div
                  style={{
                    border: '1px solid var(--clr-border, #e5e5e5)',
                    borderRadius: 12,
                    padding: '0.75rem 0.85rem',
                    background: 'rgba(255,255,255,0.7)',
                  }}
                >
                  {plan?.explain?.layout_summary && (
                    <div style={{ marginBottom: '0.75rem' }}>
                      <div style={{ fontWeight: 800, marginBottom: '0.25rem' }}>Résumé</div>
                      <div style={{ color: 'var(--clr-text-muted)' }}>{plan.explain.layout_summary}</div>
                    </div>
                  )}

                  {Array.isArray(plan?.explain?.constraints_applied) && plan.explain.constraints_applied.length > 0 && (
                    <div style={{ marginBottom: '0.75rem' }}>
                      <div style={{ fontWeight: 800, marginBottom: '0.25rem' }}>Contraintes appliquées</div>
                      <ul style={{ margin: 0, paddingLeft: '1.25rem', color: 'var(--clr-text-muted)' }}>
                        {plan.explain.constraints_applied.slice(0, 12).map((x, idx) => (
                          <li key={`applied-${idx}`}>{x}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {Array.isArray(plan?.explain?.constraints_violated) && plan.explain.constraints_violated.length > 0 && (
                    <div style={{ marginBottom: '0.75rem' }}>
                      <div style={{ fontWeight: 800, marginBottom: '0.25rem' }}>Points à corriger</div>
                      <ul style={{ margin: 0, paddingLeft: '1.25rem', color: 'var(--clr-text-muted)' }}>
                        {plan.explain.constraints_violated.slice(0, 10).map((x, idx) => (
                          <li key={`violated-${idx}`}>{x?.message || String(x)}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {Array.isArray(plan?.explain?.improvements) && plan.explain.improvements.length > 0 && (
                    <div style={{ marginBottom: '0.25rem' }}>
                      <div style={{ fontWeight: 800, marginBottom: '0.25rem' }}>Améliorations proposées</div>
                      <ul style={{ margin: 0, paddingLeft: '1.25rem', color: 'var(--clr-text-muted)' }}>
                        {plan.explain.improvements.slice(0, 10).map((x, idx) => (
                          <li key={`improve-${idx}`}>{x}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {Array.isArray(plan?.explain?.not_modeled) && plan.explain.not_modeled.length > 0 && (
                    <div style={{ marginTop: '0.75rem' }}>
                      <div style={{ fontWeight: 800, marginBottom: '0.25rem' }}>Non modélisé (à venir)</div>
                      <ul style={{ margin: 0, paddingLeft: '1.25rem', color: 'var(--clr-text-muted)' }}>
                        {plan.explain.not_modeled.slice(0, 8).map((x, idx) => (
                          <li key={`todo-${idx}`}>{x}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <div style={{ marginTop: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <div style={{ fontWeight: 900 }}>Styles IA</div>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <select
                  className="form-input"
                  value={renderView}
                  onChange={(e) => setRenderView(e.target.value)}
                  disabled={rendering}
                  style={{ minWidth: 160 }}
                >
                  <option value="interior">Intérieur</option>
                  <option value="facade">Façade</option>
                </select>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={onRenderStyle}
                  disabled={rendering || !selectedStyle}
                >
                  {rendering ? 'Rendu…' : 'Générer rendu'}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => downloadUrl(renderOut?.url, `render-${renderView}.png`)}
                  disabled={!renderOut?.url}
                >
                  Télécharger PNG
                </button>
              </div>
            </div>

            {styleLoading && (
              <div style={{ color: 'var(--clr-text-muted)', marginBottom: '0.5rem' }}>
                Suggestion de styles…
              </div>
            )}

            {Array.isArray(stylePresets) && stylePresets.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
                {stylePresets.map((s) => {
                  const active = String(selectedStyleId) === String(s?.id);
                  const palette = Array.isArray(s?.palette) ? s.palette : [];
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setSelectedStyleId(String(s.id))}
                      className="card"
                      style={{
                        textAlign: 'left',
                        padding: '0.75rem 0.75rem',
                        borderRadius: 14,
                        border: active ? '2px solid rgba(59,130,246,0.9)' : '1px solid var(--clr-border, #e5e5e5)',
                        background: 'rgba(255,255,255,0.9)',
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{ fontWeight: 900, marginBottom: 6 }}>{s.name}</div>
                      <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                        {palette.slice(0, 5).map((c) => (
                          <div
                            key={c}
                            style={{
                              width: 16,
                              height: 16,
                              borderRadius: 999,
                              background: c,
                              border: '1px solid rgba(0,0,0,0.08)',
                            }}
                          />
                        ))}
                      </div>
                      {s.note ? (
                        <div style={{ color: 'var(--clr-text-muted)', fontSize: 12, lineHeight: 1.35 }}>{s.note}</div>
                      ) : Array.isArray(s?.highlights) && s.highlights.length ? (
                        <div style={{ color: 'var(--clr-text-muted)', fontSize: 12, lineHeight: 1.35 }}>
                          {s.highlights.slice(0, 3).join(' • ')}
                        </div>
                      ) : (
                        <div style={{ color: 'var(--clr-text-muted)', fontSize: 12 }}>Style prêt à générer</div>
                      )}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div style={{ color: 'var(--clr-text-muted)' }}>
                Aucun style disponible (vérifiez la connexion serveur).
              </div>
            )}

            {renderOut?.url && (
              <div style={{ marginTop: '0.75rem' }}>
                <div
                  style={{
                    border: '1px solid var(--clr-border, #e5e5e5)',
                    borderRadius: 12,
                    overflow: 'hidden',
                    background: '#fff',
                  }}
                >
                  <img src={renderOut.url} alt="Rendu" style={{ width: '100%', display: 'block' }} />
                </div>
                <div style={{ marginTop: 6, color: 'var(--clr-text-muted)', fontSize: 12 }}>
                  Mode: {renderOut.mode} • Vue: {renderOut.view}
                </div>
                {renderOut.mode === 'fallback_svg' && (
                  <div style={{ marginTop: 6, color: '#b45309', fontSize: 12 }}>
                    Rendu photo non disponible → affichage du SVG.
                    {renderMeta?.provider ? ` Provider: ${renderMeta.provider}.` : ''}
                    {renderMeta?.reason ? ` Raison: ${renderMeta.reason}` : ' Vérifiez `HF_TOKEN` ou `OPENAI_API_KEY`.'}
                  </div>
                )}
              </div>
            )}
          </div>

          {estimate && (
            <div style={{ marginTop: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                <div style={{ fontWeight: 900 }}>Devis estimatif (TND)</div>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowEstimate((v) => !v)}
                  style={{ marginLeft: 'auto' }}
                >
                  {showEstimate ? 'Masquer' : 'Afficher'}
                </button>
              </div>

              {showEstimate && (
                <div
                  style={{
                    border: '1px solid var(--clr-border, #e5e5e5)',
                    borderRadius: 12,
                    padding: '0.75rem 0.85rem',
                    background: 'rgba(255,255,255,0.7)',
                  }}
                >
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.75rem' }}>
                    <div>
                      <div style={{ fontWeight: 800 }}>Total (bas)</div>
                      <div style={{ color: 'var(--clr-text-muted)' }}>{formatTnd(estimate?.total_tnd?.low)}</div>
                    </div>
                    <div>
                      <div style={{ fontWeight: 800 }}>Total (moyen)</div>
                      <div style={{ color: 'var(--clr-text-muted)' }}>{formatTnd(estimate?.total_tnd?.mid)}</div>
                    </div>
                    <div>
                      <div style={{ fontWeight: 800 }}>Total (haut)</div>
                      <div style={{ color: 'var(--clr-text-muted)' }}>{formatTnd(estimate?.total_tnd?.high)}</div>
                    </div>
                  </div>

                  <div style={{ marginBottom: '0.75rem' }}>
                    <div style={{ fontWeight: 800, marginBottom: '0.25rem' }}>Quantités (approx.)</div>
                    <div style={{ color: 'var(--clr-text-muted)', display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                      <div>Sol: {estimate?.quantities?.floor_m2} m²</div>
                      <div>Peinture murs: {estimate?.quantities?.paint_m2} m²</div>
                      <div>Plinthes: {estimate?.quantities?.skirting_ml} ml</div>
                      <div>Cloisons: {estimate?.quantities?.partitions_ml} ml</div>
                      <div>Portes: {estimate?.quantities?.doors_unit}</div>
                    </div>
                  </div>

                  {estimate?.breakdown_tnd && (
                    <div style={{ marginBottom: '0.75rem' }}>
                      <div style={{ fontWeight: 800, marginBottom: '0.25rem' }}>Détail (moyen)</div>
                      <ul style={{ margin: 0, paddingLeft: '1.25rem', color: 'var(--clr-text-muted)' }}>
                        <li>Sol: {formatTnd(estimate.breakdown_tnd.floor?.mid)}</li>
                        <li>Peinture: {formatTnd(estimate.breakdown_tnd.paint?.mid)}</li>
                        <li>Plinthes: {formatTnd(estimate.breakdown_tnd.skirting?.mid)}</li>
                        <li>Cloisons: {formatTnd(estimate.breakdown_tnd.partitions?.mid)}</li>
                        {estimate?.quantities?.doors_unit ? <li>Portes: {formatTnd(estimate.breakdown_tnd.doors?.mid)}</li> : null}
                      </ul>
                    </div>
                  )}

                  {Array.isArray(estimate?.assumptions) && estimate.assumptions.length > 0 && (
                    <div>
                      <div style={{ fontWeight: 800, marginBottom: '0.25rem' }}>Hypothèses</div>
                      <ul style={{ margin: 0, paddingLeft: '1.25rem', color: 'var(--clr-text-muted)' }}>
                        {estimate.assumptions.slice(0, 6).map((x, idx) => (
                          <li key={`ass-${idx}`}>{x}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
