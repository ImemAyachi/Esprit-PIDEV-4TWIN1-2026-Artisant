import React, { useState, useRef } from 'react';
import api from '../../services/api';
import './VirtualStaging.css';

const VirtualStaging = () => {
  const [stage, setStage] = useState('upload'); // upload | generating | result
  const [selectedStyle, setSelectedStyle] = useState('modern');
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  
  // New Result State
  const [resultData, setResultData] = useState({
    resultUrl: null,
    analysis: '',
    materials: [],
    budget: ''
  });
  
  const [isDragging, setIsDragging] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef(null);

  const styles = [
    { id: 'modern', name: 'Contemporain', icon: '🏛️' },
    { id: 'industrial', name: 'Indus / Loft', icon: '🏭' },
    { id: 'minimalist', name: 'Minimaliste', icon: '✨' },
    { id: 'scandinavian', name: 'Scandinave', icon: '🌿' },
    { id: 'luxury', name: 'Luxe Moderne', icon: '💎' },
  ];

  const handleFileUpload = (file) => {
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setPreviewUrl(e.target.result);
    reader.readAsDataURL(file);
    setStage('upload');
  };

  const handleGenerate = async () => {
    if (!imageFile) return;

    setStage('generating');
    setProgress(0);

    const fakeTimer = setInterval(() => setProgress(p => Math.min(p + 5, 85)), 1000);

    try {
      const formData = new FormData();
      formData.append('image', imageFile);
      const chosenStyle = styles.find(s => s.id === selectedStyle)?.name || selectedStyle;
      formData.append('style', chosenStyle);

      const response = await api.post('/ai/virtual-staging', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 60000
      });

      clearInterval(fakeTimer);
      setProgress(100);

      setResultData({
        resultUrl: response.data.resultUrl,
        analysis: response.data.analysis,
        materials: response.data.materials,
        budget: response.data.budget
      });
      setStage('result');
    } catch (err) {
      clearInterval(fakeTimer);
      console.error(err);
      
      const chosenStyle = styles.find(s => s.id === selectedStyle)?.name || selectedStyle;
      const seed = Math.floor(Math.random() * 1000000);
      const fallbackPrompt = `A highly realistic professional interior photography of a completely renovated room in a ${chosenStyle} style.`;
      
      setResultData({
        resultUrl: `https://image.pollinations.ai/prompt/${encodeURIComponent(fallbackPrompt)}?width=800&height=600&nologo=true&seed=${seed}`,
        analysis: "Une erreur de communication avec le réseau IA est survenue. Voici tout de même notre concept génératif de secours basé sur votre style.",
        materials: ["Matériaux génériques", "Revêtements premium"],
        budget: "Non estimé (Erreur IA)"
      });
      setStage('result');
    }
  };

  return (
    <div className="vs-root">
      <div className="vs-header">
        <div className="vs-header-content">
          <div className="vs-badge">
            <span className="vs-badge-dot"></span>
            Estimation IA
          </div>
          <h1 className="vs-title">Smart Renovation Concept</h1>
          <p className="vs-subtitle">
            Uploadez une pièce. L'IA génère un concept d'inspiration et calcule le devis matériel estimé.
          </p>
        </div>
      </div>

      <div className="vs-container">
        
        {/* Sidebar Configuration */}
        <div className="vs-sidebar">
          <div className="vs-panel">
            <h3 className="vs-panel-title">1. Votre Espace</h3>
            
            <div 
              className={`vs-dropzone ${isDragging ? 'drag-over' : ''}`}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleFileUpload(e.dataTransfer.files[0]); }}
              onClick={() => fileInputRef.current?.click()}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={(e) => handleFileUpload(e.target.files[0])} 
                style={{ display: 'none' }} 
                accept="image/*" 
              />
              {previewUrl && stage !== 'generating' && stage !== 'result' ? (
                <img src={previewUrl} alt="Preview" className="vs-preview" />
              ) : (
                <div className="vs-dropzone-content">
                  <span className="vs-icon">📸</span>
                  <p>Déposez une photo du chantier</p>
                  <span>ou cliquez pour parcourir</span>
                </div>
              )}
            </div>

            <div className="vs-divider"></div>

            <h3 className="vs-panel-title">2. Concept Désiré</h3>
            <div className="vs-style-grid">
              {styles.map(style => (
                <button 
                  key={style.id} 
                  className={`vs-style-btn ${selectedStyle === style.id ? 'active' : ''}`}
                  onClick={() => setSelectedStyle(style.id)}
                >
                  <span className="vs-style-icon">{style.icon}</span>
                  <span className="vs-style-name">{style.name}</span>
                </button>
              ))}
            </div>

            <button 
              className={`vs-generate-btn ${stage === 'generating' || !imageFile ? 'loading' : ''}`}
              onClick={handleGenerate}
              disabled={stage === 'generating' || !imageFile}
            >
              {stage === 'generating' ? 'Analyse Structurelle...' : '🪄 Analyser & Concevoir'}
            </button>
          </div>
        </div>

        {/* Main Display Area */}
        <div className="vs-main">
          
          {stage === 'upload' && (
             <div className="vs-placeholder">
               <div className="vs-placeholder-icon">📐</div>
               <h2>Analysez votre chantier</h2>
               <p>Fournissez une photographie. L'IA va scanner l'architecture, générer un concept visuel et lister les matériaux requis.</p>
             </div>
          )}

          {stage === 'generating' && (
            <div className="vs-loading">
              <div className="vs-loading-spinner"></div>
              <h2>Inspection Virtuelle en cours...</h2>
              <div className="vs-progress-bar">
                <div className="vs-progress-fill" style={{ width: `${progress}%` }}></div>
              </div>
              <p className="vs-loading-text">Extraction de l'architecture, suggestion du devis matériel et rendu volumétrique 3D...</p>
            </div>
          )}

          {stage === 'result' && (
            <div className="vs-result-grid-view">
              
              <div className="vs-result-header-action">
                <h2>Rapport d'Expertise IA</h2>
                <button className="vs-reset-btn" onClick={() => setStage('upload')}>Nouveau Projet</button>
              </div>

              {/* Dual Image Comparison (Not Slider) */}
              <div className="vs-compare-cards">
                <div className="vs-compare-card">
                  <div className="vs-compare-badge">1. État Actuel</div>
                  <img src={previewUrl} alt="Original" />
                </div>
                <div className="vs-compare-card">
                  <div className="vs-compare-badge">2. Amélioration IA {styles.find(s => s.id === selectedStyle)?.name}</div>
                  <img 
                    src={resultData.resultUrl} 
                    alt="Enhanced" 
                  />
                </div>
              </div>

              {/* AI Analysis Data */}
              <div className="vs-expert-report">
                <div className="vs-report-section">
                  <h3><span className="vs-icon-sm">🔍</span> Analyse Technique</h3>
                  <p>{resultData.analysis}</p>
                </div>

                <div className="vs-report-meta">
                  <div className="vs-meta-box">
                    <h4>🛠️ Matériaux Requis (Estimation)</h4>
                    <ul>
                      {resultData.materials.map((m, i) => <li key={i}>{m}</li>)}
                    </ul>
                  </div>
                  <div className="vs-meta-box budget-box">
                    <h4>💰 Budget Estimé</h4>
                    <div className="vs-budget-val">{resultData.budget}</div>
                    <div className="vs-budget-sub">hors main d'oeuvre complexe</div>
                  </div>
                </div>
              </div>

            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default VirtualStaging;
