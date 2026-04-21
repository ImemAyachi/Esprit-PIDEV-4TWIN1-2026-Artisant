import React, { useState } from 'react';
import toast from 'react-hot-toast';
import api from '../services/api';

const AGENTS = [
  { key: 'architectBrain',   label: 'Agent 1 — Architect Brain',     desc: 'Décompose le projet en phases professionnelles' },
  { key: 'costIntelligence', label: 'Agent 2 — Cost Intelligence',    desc: 'Calcule les coûts avec les prix réels du marché' },
  { key: 'riskAnalysis',     label: 'Agent 3 — Risk Predictor',       desc: 'Identifie les risques avant le chantier' },
  { key: 'teamBuilder',      label: 'Agent 4 — Smart Team Builder',   desc: "Compose l'équipe idéale depuis la plateforme" },
  { key: 'timeline',         label: 'Agent 5 — Timeline Architect',   desc: 'Génère le planning semaine par semaine' },
];

const SEVERITY_COLOR   = { 'Élevé': '#ef4444', 'Moyen': '#f59e0b', 'Faible': '#22c55e' };
const FEASIBILITY_COLOR = { 'Réalisable': '#22c55e', 'Tendu': '#f59e0b', 'Insuffisant': '#ef4444' };

function Badge({ label, color }) {
  return (
    <span style={{
      display: 'inline-block',
      padding: '2px 10px',
      borderRadius: 999,
      fontSize: '0.72rem',
      fontWeight: 700,
      background: color + '22',
      color: color,
      border: `1px solid ${color}44`,
    }}>
      {label}
    </span>
  );
}

function Collapsible({ title, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1rem 1.25rem',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--clr-text)',
          fontWeight: 800,
          fontSize: '1rem',
        }}
      >
        <span>{title}</span>
        <span style={{ color: 'var(--clr-text-muted)', fontSize: '1rem' }}>{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div style={{ padding: '0 1.25rem 1.25rem', borderTop: '1px solid var(--clr-border)' }}>
          {children}
        </div>
      )}
    </div>
  );
}

export default function AiChantierBrainPage() {
  const [projectDescription, setProjectDescription] = useState('');
  const [budget, setBudget]         = useState('');
  const [location, setLocation]     = useState('');
  const [loading, setLoading]       = useState(false);
  const [activeAgent, setActiveAgent] = useState(-1);
  const [report, setReport]         = useState(null);
  const [error, setError]           = useState(null);

  const runAnalysis = async (e) => {
    e.preventDefault();
    if (!projectDescription.trim()) { toast.error("Décrivez votre projet d'abord."); return; }
    setLoading(true); setReport(null); setError(null); setActiveAgent(0);

    let idx = 0;
    const interval = setInterval(() => { idx = Math.min(idx + 1, 4); setActiveAgent(idx); }, 6000);

    try {
      const { data } = await api.post('/ai/chantier-brain', { projectDescription, budget, location });
      clearInterval(interval); setActiveAgent(5);
      if (data.success) { 
        setReport(data.report); 
        toast.success('Rapport généré avec succès !'); 
      } else {
        setError(data.message);
        toast.error(data.message);
        setActiveAgent(-1);
      }
    } catch (err) {
      clearInterval(interval); setActiveAgent(-1);
      const msg = err.response?.data?.message || "Erreur lors de l'analyse multi-agents.";
      setError(msg); toast.error(msg);
    } finally { setLoading(false); }
  };

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '1.5rem 1rem' }}>

      {/* Header */}
      <div className="card" style={{ marginBottom: '1rem', padding: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ margin: '0 0 0.5rem', fontWeight: 900 }}>AI Chantier Brain</h2>
            <p style={{ margin: 0, color: 'var(--clr-text-muted)', lineHeight: 1.6 }}>
              5 agents IA spécialisés analysent votre projet en chaîne — architecture, coûts, risques, équipe et planning — en utilisant les données réelles de la plateforme.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {AGENTS.map(a => (
              <span key={a.key} style={{ fontSize: '0.7rem', color: 'var(--clr-text-muted)', padding: '3px 8px', borderRadius: 99, border: '1px solid var(--clr-border)' }}>
                {a.label.split(' — ')[1]}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="card" style={{ marginBottom: '1rem', padding: '1.25rem' }}>
        <form onSubmit={runAnalysis}>
          {error && (
            <div role="alert" style={{
              marginBottom: '1.25rem',
              padding: '1rem 1.25rem',
              borderRadius: '14px',
              background: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              borderLeft: '5px solid #ef4444',
              display: 'flex',
              alignItems: 'center',
              gap: '0.85rem',
              color: '#991b1b',
              fontSize: '0.9rem',
              fontWeight: 600,
              lineHeight: 1.5,
              boxShadow: '0 4px 12px rgba(239, 68, 68, 0.05)'
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <span>{error}</span>
            </div>
          )}
          <label className="form-label">Description du projet *</label>
          <textarea
            value={projectDescription}
            onChange={e => setProjectDescription(e.target.value)}
            rows={4}
            className="form-input"
            style={{ resize: 'vertical' }}
            placeholder="Ex: Je veux construire une villa R+1 à Sousse, 180m², 4 chambres, salon 35m², cuisine équipée, 2 salles de bain, piscine extérieure..."
            disabled={loading}
          />
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '0.75rem' }}>
            <div style={{ flex: 1, minWidth: 180 }}>
              <label className="form-label">Budget (DT)</label>
              <input type="number" value={budget} onChange={e => setBudget(e.target.value)}
                className="form-input" placeholder="Ex: 450000" disabled={loading} />
            </div>
            <div style={{ flex: 1, minWidth: 180 }}>
              <label className="form-label">Localisation</label>
              <input type="text" value={location} onChange={e => setLocation(e.target.value)}
                className="form-input" placeholder="Ex: Tunis, Sousse, Sfax..." disabled={loading} />
            </div>
          </div>
          <div style={{ marginTop: '1rem' }}>
            <button type="submit" className="btn btn-primary" disabled={loading || !projectDescription.trim()}>
              {loading ? 'Les 5 agents travaillent...' : "Lancer l'analyse multi-agents"}
            </button>
          </div>
        </form>
      </div>

      {/* Agent Progress */}
      {loading && (
        <div className="card" style={{ marginBottom: '1rem', padding: '1.25rem' }}>
          <h3 style={{ margin: '0 0 1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ display: 'inline-block', width: 10, height: 10, background: 'var(--clr-primary)', borderRadius: '50%', animation: 'pulse 1s infinite' }} />
            Analyse en cours...
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {AGENTS.map((agent, idx) => {
              const isDone   = idx < activeAgent;
              const isActive = idx === activeAgent;
              return (
                <div key={agent.key} style={{
                  display: 'flex', alignItems: 'center', gap: '0.75rem',
                  padding: '0.75rem 1rem', borderRadius: 10,
                  border: '1px solid var(--clr-border)',
                  background: isDone ? 'rgba(34,197,94,0.06)' : isActive ? 'rgba(99,102,241,0.08)' : 'transparent',
                  opacity: (!isDone && !isActive) ? 0.45 : 1,
                  transition: 'all 0.4s',
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--clr-text)' }}>{agent.label}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--clr-text-muted)' }}>{agent.desc}</div>
                  </div>
                  {isDone   && <span style={{ fontSize: '0.75rem', color: '#22c55e', fontWeight: 700 }}>Complété</span>}
                  {isActive && <span style={{ fontSize: '0.75rem', color: 'var(--clr-primary)', fontWeight: 700 }}>En cours...</span>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Report */}
      {report && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* Summary Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px,1fr))', gap: '0.75rem' }}>
            {[
              { label: 'Coût Estimé',   value: `${(report.costIntelligence?.totalEstimatedCost || 0).toLocaleString()} DT`, color: '#22c55e' },
              { label: 'Durée Projet',  value: `${report.timeline?.totalDurationWeeks || '?'} semaines`,                   color: '#3b82f6' },
              { label: 'Risque',        value: report.riskAnalysis?.riskLevel || '?',                                       color: '#f59e0b' },
              { label: 'Complexité',    value: report.architectBrain?.complexity || '?',                                    color: '#8b5cf6' },
            ].map((stat, i) => (
              <div key={i} className="card" style={{ padding: '1rem' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--clr-text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{stat.label}</div>
                <div style={{ fontWeight: 800, color: stat.color, fontSize: '1.1rem', marginTop: 4 }}>{stat.value}</div>
              </div>
            ))}
          </div>

          {/* Agent 1 — Architecture */}
          <Collapsible title="Architecture & Phases du Projet" defaultOpen>
            <p style={{ color: 'var(--clr-text-muted)', fontSize: '0.85rem', fontStyle: 'italic', margin: '0.75rem 0' }}>
              {report.architectBrain?.structuralNotes}
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px,1fr))', gap: '0.75rem' }}>
              {report.architectBrain?.phases?.map((phase, i) => (
                <div key={i} style={{ padding: '1rem', border: '1px solid var(--clr-border)', borderRadius: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>{phase.order}. {phase.name}</span>
                    <Badge label={`${phase.durationWeeks} sem.`} color="#6366f1" />
                  </div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--clr-text-muted)', margin: '0 0 0.5rem' }}>{phase.description}</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                    {phase.keyMaterials?.map((m, j) => (
                      <span key={j} style={{ fontSize: '0.68rem', padding: '2px 7px', borderRadius: 6, border: '1px solid var(--clr-border)', color: 'var(--clr-text-muted)' }}>{m}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Collapsible>

          {/* Agent 2 — Cost */}
          <Collapsible title="Intelligence Financière" defaultOpen>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', margin: '0.75rem 0', flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>Faisabilité budget :</span>
              <Badge
                label={report.costIntelligence?.budgetFeasibility || '?'}
                color={FEASIBILITY_COLOR[report.costIntelligence?.budgetFeasibility] || '#888'}
              />
              {report.costIntelligence?.budgetGapDT > 0 && (
                <Badge label={`Écart: ${report.costIntelligence.budgetGapDT.toLocaleString()} DT`} color="#ef4444" />
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {report.costIntelligence?.breakdown?.map((cat, i) => (
                <div key={i} style={{ border: '1px solid var(--clr-border)', borderRadius: 10, overflow: 'hidden' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem 1rem', background: 'var(--clr-surface-2, rgba(0,0,0,0.04))' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>{cat.category}</span>
                    <span style={{ fontWeight: 800, color: '#22c55e' }}>{(cat.subtotal || 0).toLocaleString()} DT</span>
                  </div>
                  <div style={{ padding: '0.5rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    {cat.items?.map((item, j) => (
                      <div key={j} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--clr-text-muted)' }}>
                        <span>{item.name} ({item.qty})</span>
                        <span>{(item.total || 0).toLocaleString()} DT</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            {report.costIntelligence?.savingsTips?.length > 0 && (
              <div style={{ marginTop: '0.75rem', padding: '0.75rem 1rem', borderRadius: 10, border: '1px solid #22c55e44', background: '#22c55e11' }}>
                <div style={{ fontWeight: 700, fontSize: '0.8rem', color: '#22c55e', marginBottom: '0.4rem' }}>Conseils d'optimisation</div>
                {report.costIntelligence.savingsTips.map((tip, i) => (
                  <div key={i} style={{ fontSize: '0.78rem', color: 'var(--clr-text-muted)', marginBottom: '0.2rem' }}>— {tip}</div>
                ))}
              </div>
            )}
          </Collapsible>

          {/* Agent 3 — Risks */}
          <Collapsible title="Analyse des Risques">
            {report.riskAnalysis?.criticalWarning && (
              <div role="alert" className="pdf-alert pdf-alert-error" style={{ marginTop: '0.75rem' }}>
                {report.riskAnalysis.criticalWarning}
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.75rem' }}>
              {report.riskAnalysis?.risks?.map((risk, i) => (
                <div key={i} style={{ padding: '0.85rem 1rem', borderRadius: 10, border: `1px solid ${SEVERITY_COLOR[risk.severity] || '#888'}44` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>{risk.title}</span>
                    <Badge label={risk.severity} color={SEVERITY_COLOR[risk.severity] || '#888'} />
                  </div>
                  <p style={{ margin: '0 0 0.4rem', fontSize: '0.8rem', color: 'var(--clr-text-muted)' }}>{risk.description}</p>
                  <p style={{ margin: 0, fontSize: '0.78rem', color: '#22c55e' }}>Action : {risk.mitigation}</p>
                </div>
              ))}
            </div>
          </Collapsible>

          {/* Agent 4 — Team */}
          <Collapsible title="Composition de l'Équipe">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px,1fr))', gap: '0.75rem', marginTop: '0.75rem' }}>
              {report.teamBuilder?.teamStructure?.map((member, i) => (
                <div key={i} style={{ padding: '1rem', border: '1px solid var(--clr-border)', borderRadius: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>{member.role}</span>
                    <span style={{ fontWeight: 800, color: 'var(--clr-primary)', fontSize: '0.875rem' }}>{(member.totalCost || 0).toLocaleString()} DT</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.25rem', fontSize: '0.78rem', color: 'var(--clr-text-muted)', marginBottom: '0.5rem' }}>
                    <span>Quantité : {member.quantity}</span>
                    <span>Durée : {member.estimatedDays} jours</span>
                    <span>Taux : {member.dailyRate} DT/j</span>
                    <span style={{ textTransform: 'capitalize' }}>Métier : {member.craft}</span>
                  </div>
                  {member.realArtisan && (
                    <div style={{ padding: '0.5rem 0.75rem', borderRadius: 8, background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)' }}>
                      <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--clr-primary)', marginBottom: '0.2rem' }}>Artisan disponible sur Artisanet</div>
                      <div style={{ fontWeight: 700, fontSize: '0.82rem' }}>{member.realArtisan.firstName} {member.realArtisan.lastName}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--clr-text-muted)' }}>
                        Note : {member.realArtisan.rating?.average?.toFixed(1) || 'N/A'} · {member.realArtisan.experience || '?'} ans d'exp.
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Collapsible>

          {/* Agent 5 — Timeline */}
          <Collapsible title="Planning Semaine par Semaine">
            <p style={{ color: 'var(--clr-text-muted)', fontSize: '0.82rem', fontStyle: 'italic', margin: '0.75rem 0' }}>
              {report.timeline?.startRecommendation}
            </p>
            {(!report.timeline?.weeks || report.timeline.weeks.length === 0) ? (
              <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--clr-text-muted)', fontSize: '0.85rem', border: '1px dashed var(--clr-border)', borderRadius: 10 }}>
                Planning non disponible — relancez l'analyse pour obtenir le planning détaillé.
              </div>
            ) : (
              <div style={{ maxHeight: 480, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingRight: '0.25rem' }}>
                {report.timeline.weeks.map((week, i) => (
                  <div key={i} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                    <div style={{ flexShrink: 0, width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 10, border: '1px solid var(--clr-border)', fontWeight: 800, fontSize: '0.75rem', color: 'var(--clr-primary)' }}>
                      S{week.weekNumber}
                    </div>
                    <div style={{ flex: 1, padding: '0.75rem 1rem', border: '1px solid var(--clr-border)', borderRadius: 10 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.3rem', marginBottom: '0.3rem' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>{week.phase}</span>
                        {week.milestone && <Badge label={week.milestone} color="#3b82f6" />}
                      </div>
                      {week.tasks?.map((t, j) => (
                        <div key={j} style={{ fontSize: '0.78rem', color: 'var(--clr-text-muted)', marginBottom: '0.15rem' }}>— {t}</div>
                      ))}
                      {week.materialsToOrder?.length > 0 && (
                        <div style={{ marginTop: '0.4rem', fontSize: '0.72rem', color: '#f59e0b', fontWeight: 600 }}>
                          Commander : {week.materialsToOrder.join(', ')}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Collapsible>

        </div>
      )}
    </div>
  );
}
