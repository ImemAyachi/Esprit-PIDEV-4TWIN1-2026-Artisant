import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, useTexture, ContactShadows, Text, Box } from '@react-three/drei';
import * as THREE from 'three';

const TexturedPlane = ({ imageUrl, category }) => {
  const [texture, setTexture] = React.useState(null);

  React.useEffect(() => {
    // WebGL requires CORS to load external images. We use a proxy to bypass strict CORS from Unsplash.
    let proxiedUrl = imageUrl;
    if (imageUrl && !imageUrl.startsWith('blob:') && !imageUrl.startsWith('data:') && !imageUrl.startsWith('http://localhost') && !imageUrl.startsWith('/')) {
      proxiedUrl = `https://images.weserv.nl/?url=${encodeURIComponent(imageUrl)}&w=512`;
    }
      
    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin("anonymous");
    loader.load(
      proxiedUrl,
      (tex) => {
        tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
        tex.repeat.set(5, 5);
        setTexture(tex);
      },
      undefined,
      (err) => {
        console.warn("Could not load texture, using fallback color.", err);
      }
    );
  }, [imageUrl]);

  // Propriétés physiques selon le matériau
  const isMarble = category?.toLowerCase().includes('marbre');
  const isWood = category?.toLowerCase().includes('bois');
  const isMetal = category?.toLowerCase().includes('métal') || category?.toLowerCase().includes('metal');

  const roughness = isMarble ? 0.1 : isWood ? 0.7 : 0.5;
  const metalness = isMetal ? 0.8 : 0.1;

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[15, 15]} />
      <meshStandardMaterial 
        map={texture} 
        color={!texture ? "#94a3b8" : "#ffffff"}
        roughness={roughness}
        metalness={metalness}
      />
    </mesh>
  );
};

// Une petite scène de contexte pour donner l'échelle (des murs basiques et un socle)
const RoomContext = () => {
  return (
    <group>
      {/* Mur arrière */}
      <mesh position={[0, 2.5, -7.5]}>
        <boxGeometry args={[15, 5, 0.2]} />
        <meshStandardMaterial color="#f1f5f9" />
      </mesh>
      {/* Mur droit */}
      <mesh position={[7.5, 2.5, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <boxGeometry args={[15, 5, 0.2]} />
        <meshStandardMaterial color="#f8fafc" />
      </mesh>

      {/* Un petit socle d'exposition */}
      <mesh position={[0, 0.5, 0]}>
        <cylinderGeometry args={[1, 1, 1, 32]} />
        <meshStandardMaterial color="#ffffff" roughness={0.1} metalness={0.9} />
      </mesh>

      <Text 
        position={[0, 1.5, 0]} 
        fontSize={0.3} 
        color="#1e293b" 
        anchorX="center" 
        anchorY="middle"
      >
        Aperçu Architectural
      </Text>
    </group>
  );
};

const Material3DPreview = ({ imageUrl, category, onClose }) => {
  return (
    <>
      <style>{`
        .material-3d-overlay {
          position: fixed; inset: 0;
          background: rgba(15, 23, 42, 0.8); backdrop-filter: blur(12px);
          display: flex; align-items: center; justify-content: center;
          z-index: 9999; padding: 1rem;
        }
      `}</style>
      <div className="material-3d-overlay" onClick={onClose}>
        <div 
          className="premium-modal-content" 
          onClick={e => e.stopPropagation()} 
        style={{ width: '85vw', height: '85vh', display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden', borderRadius: '16px' }}
      >
        <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white' }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#0f172a', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
            Simulateur 3D Interactif ({category})
          </h2>
          <button onClick={onClose} style={{ background: '#f1f5f9', border: 'none', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b', fontWeight: 'bold' }}>&times;</button>
        </div>
        
        <div style={{ flex: 1, position: 'relative', background: 'linear-gradient(to bottom, #e0e7ff, #f8fafc)' }}>
          <Suspense fallback={
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#475569' }}>
              <div className="animate-spin" style={{ width: '40px', height: '40px', border: '4px solid #cbd5e1', borderTopColor: '#3b82f6', borderRadius: '50%', marginBottom: '1rem' }}></div>
              <p style={{ fontWeight: 600 }}>Génération de l'environnement 3D en cours...</p>
            </div>
          }>
            <Canvas 
              frameloop="demand"
              dpr={1}
              shadows={false} 
              gl={{ powerPreference: "low-power", antialias: false, preserveDrawingBuffer: true }}
              camera={{ position: [5, 4, 5], fov: 50 }}
            >
              <ambientLight intensity={0.4} />
              <directionalLight position={[10, 10, 5]} intensity={1.5} />
              <pointLight position={[-5, 5, -5]} intensity={0.5} />
              
              {/* Le sol texturé avec le produit du fournisseur */}
              <TexturedPlane imageUrl={imageUrl} category={category} />
              <RoomContext />
              
              <OrbitControls makeDefault minPolarAngle={0} maxPolarAngle={Math.PI / 2.1} minDistance={2} maxDistance={15} />
              <hemisphereLight intensity={0.5} color="#ffffff" groundColor="#cbd5e1" />
            </Canvas>
          </Suspense>
          
          <div style={{ position: 'absolute', bottom: '20px', left: '50%', transform: 'translateX(-50%)', background: 'rgba(255,255,255,0.95)', padding: '12px 24px', borderRadius: '30px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', gap: '1rem', backdropFilter: 'blur(4px)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', fontWeight: 600, color: '#334155' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 15l7-7 7 7"/></svg>
              Faites glisser pour tourner
            </span>
            <div style={{ width: '1px', height: '20px', background: '#cbd5e1' }}></div>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', fontWeight: 600, color: '#334155' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
              Molette pour zoomer
            </span>
          </div>
        </div>
      </div>
      </div>
    </>
  );
};

export default Material3DPreview;
