import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import api from '../../services/api';
import './PlanTo3D.css';

// ─── Constants ────────────────────────────────────────────────────────────────
const WALL_HEIGHT = 3.0;
const WALL_THICKNESS = 0.18;
const FLOOR_THICKNESS = 0.05;
const GRID_SIZE = 30;

// ─── Procedural Generators ───────────────────────────────────────────────────
const getWallMaterial = () => {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  
  // Base color: light warm beige
  ctx.fillStyle = '#e8dcc7';
  ctx.fillRect(0, 0, 512, 512);
  
  // Vertical subtle stripes for a "wallpaper" look
  for (let x = 0; x < 512; x += 32) {
      ctx.fillStyle = (x % 64 === 0) ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.06)';
      ctx.fillRect(x, 0, 16, 512);
  }
  
  // Noise
  for (let i = 0; i < 60000; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      ctx.fillStyle = `rgba(0,0,0,${Math.random() * 0.05})`;
      ctx.fillRect(x, y, 2, 2);
  }
  
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 1);
  texture.colorSpace = THREE.SRGBColorSpace;
  
  return new THREE.MeshStandardMaterial({
    map: texture,
    roughness: 0.95,
    metalness: 0.0,
    opacity: 1.0,
    transparent: false,
  });
};

const addFurnitureToRoom = (scene, room, cx, cz, rw, rd, objectsRef) => {
  const name = room.name.toLowerCase();
  
  const createBox = (w, h, d, color, x, y, z) => {
    const geo = new THREE.BoxGeometry(w, h, d);
    const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.8 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(cx + x, y, cz + z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData = { type: 'furniture', baseOpacity: 1.0 };
    scene.add(mesh);
    objectsRef.current.push(mesh);
    return mesh;
  };

  const createCyl = (r, h, color, x, y, z) => {
    const geo = new THREE.CylinderGeometry(r, r, h, 16);
    const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.8 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(cx + x, y, cz + z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData = { type: 'furniture', baseOpacity: 1.0 };
    scene.add(mesh);
    objectsRef.current.push(mesh);
    return mesh;
  };

  const s = Math.min(rw / 4, rd / 4, 1.0);

  if (name.includes('salon') || name.includes('living')) {
    createBox(rw * 0.5, 0.02, rd * 0.5, 0x907060, 0, 0.02, 0);
    createBox(2.0*s, 0.4*s, 0.8*s, 0x4a5d23, 0, 0.2*s, -rd*0.25);
    createBox(2.0*s, 0.5*s, 0.2*s, 0x4a5d23, 0, 0.65*s, -rd*0.25 - 0.3*s);
    createBox(1.0*s, 0.3*s, 0.6*s, 0x8b5a2b, 0, 0.15*s, -rd*0.25 + 0.8*s);
    createBox(1.8*s, 0.5*s, 0.4*s, 0x222222, 0, 0.25*s, rd*0.35);
    createBox(1.4*s, 0.8*s, 0.05*s, 0x111111, 0, 0.9*s, rd*0.35);
  } 
  else if (name.includes('chambre') || name.includes('bed')) {
    createBox(1.6*s, 0.3*s, 2.0*s, 0x5c4033, 0, 0.15*s, -rd*0.3);
    createBox(1.5*s, 0.2*s, 1.9*s, 0xffffff, 0, 0.4*s, -rd*0.3);
    createBox(0.6*s, 0.1*s, 0.4*s, 0xdddddd, -0.4*s, 0.55*s, -rd*0.3 - 0.7*s);
    createBox(0.6*s, 0.1*s, 0.4*s, 0xdddddd, 0.4*s, 0.55*s, -rd*0.3 - 0.7*s);
    createBox(0.4*s, 0.5*s, 0.4*s, 0x5c4033, -1.1*s, 0.25*s, -rd*0.3 - 0.8*s);
    createBox(0.4*s, 0.5*s, 0.4*s, 0x5c4033, 1.1*s, 0.25*s, -rd*0.3 - 0.8*s);
    
    if (rw > 3 && rd > 3) {
      createBox(1.2*s, 2.0*s, 0.6*s, 0xd4c4b7, -rw*0.4 + 0.6*s, 1.0*s, rd*0.3);
    }
  }
  else if (name.includes('cuisine') || name.includes('kitchen')) {
    createBox(2.0*s, 0.9*s, 0.8*s, 0xeeeeee, 0, 0.45*s, 0);
    createBox(2.1*s, 0.05*s, 0.9*s, 0x333333, 0, 0.925*s, 0);
    createBox(rw*0.8, 0.9*s, 0.6*s, 0xeeeeee, 0, 0.45*s, -rd*0.5 + 0.3*s);
    createBox(rw*0.8, 0.05*s, 0.65*s, 0x333333, 0, 0.925*s, -rd*0.5 + 0.3*s);
    createBox(0.8*s, 1.8*s, 0.7*s, 0xcccccc, -rw*0.4 + 0.4*s, 0.9*s, -rd*0.5 + 0.35*s);
  }
  else if (name.includes('bain') || name.includes('bath') || name.includes('eau') || name.includes('wc')) {
    createBox(1.6*s, 0.6*s, 0.8*s, 0xffffff, -rw*0.5 + 0.8*s, 0.3*s, 0);
    createBox(1.4*s, 0.5*s, 0.6*s, 0xeeeeee, -rw*0.5 + 0.8*s, 0.4*s, 0);
    createBox(0.8*s, 0.8*s, 0.5*s, 0xffffff, rw*0.5 - 0.4*s, 0.4*s, -rd*0.5 + 0.3*s);
    createBox(0.6*s, 0.8*s, 0.02*s, 0x88ccff, rw*0.5 - 0.4*s, 1.4*s, -rd*0.5 + 0.05*s);
  }
  else if (name.includes('manger') || name.includes('dining')) {
    createBox(1.8*s, 0.05*s, 1.0*s, 0x8b5a2b, 0, 0.75*s, 0);
    createBox(0.2*s, 0.75*s, 0.2*s, 0x333333, 0, 0.375*s, 0);
    for (let i = -0.6*s; i <= 0.6*s; i+=0.6*s) {
      createBox(0.4*s, 0.45*s, 0.4*s, 0x444444, i, 0.225*s, 0.7*s);
      createBox(0.4*s, 0.45*s, 0.4*s, 0x444444, i, 0.225*s, -0.7*s);
    }
  }
  else if (name.includes('bureau') || name.includes('office')) {
    createBox(1.6*s, 0.05*s, 0.8*s, 0x8b5a2b, 0, 0.75*s, 0);
    createBox(0.4*s, 0.75*s, 0.7*s, 0x333333, -0.6*s, 0.375*s, 0);
    createBox(0.4*s, 0.75*s, 0.7*s, 0x333333, 0.6*s, 0.375*s, 0);
    createBox(0.5*s, 0.5*s, 0.5*s, 0x222222, 0, 0.25*s, 0.6*s);
    createBox(0.5*s, 0.6*s, 0.1*s, 0x222222, 0, 0.8*s, 0.8*s);
  }
  else {
    createCyl(0.2*s, 0.4*s, 0x8b4513, -rw*0.4 + 0.2*s, 0.2*s, -rd*0.4 + 0.2*s);
    createCyl(0.3*s, 0.6*s, 0x228b22, -rw*0.4 + 0.2*s, 0.7*s, -rd*0.4 + 0.2*s);
  }
};

// ─── Main Component ────────────────────────────────────────────────────────────
const PlanTo3D = () => {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);
  const animFrameRef = useRef(null);
  const objectsRef = useRef([]);

  const [stage, setStage] = useState('upload'); // upload | analyzing | viewing
  const [isDragging, setIsDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [planData, setPlanData] = useState(null);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [viewMode, setViewMode] = useState('realistic'); // realistic | wireframe | xray
  const [showGrid, setShowGrid] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const fileInputRef = useRef(null);

  // ── Three.js Scene Setup ────────────────────────────────────────────────────
  const initScene = useCallback(() => {
    if (!mountRef.current) return;
    const W = mountRef.current.clientWidth;
    const H = mountRef.current.clientHeight;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f1117);
    scene.fog = new THREE.FogExp2(0x0f1117, 0.018);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(50, W / H, 0.1, 1000);
    camera.position.set(12, 14, 14);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Orbit Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.minDistance = 3;
    controls.maxDistance = 60;
    controls.maxPolarAngle = Math.PI / 2.05;
    controls.target.set(0, 1, 0);
    controlsRef.current = controls;

    // Lighting
    setupLighting(scene);

    // Grid
    if (showGrid) addGrid(scene);

    // Animate
    const animate = () => {
      animFrameRef.current = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Resize
    const handleResize = () => {
      if (!mountRef.current) return;
      const W2 = mountRef.current.clientWidth;
      const H2 = mountRef.current.clientHeight;
      camera.aspect = W2 / H2;
      camera.updateProjectionMatrix();
      renderer.setSize(W2, H2);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const setupLighting = (scene) => {
    // Ambient
    const ambient = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambient);

    // Main sun light
    const sun = new THREE.DirectionalLight(0xfff5e0, 1.8);
    sun.position.set(10, 20, 10);
    sun.castShadow = true;
    sun.shadow.mapSize.width = 2048;
    sun.shadow.mapSize.height = 2048;
    sun.shadow.camera.near = 0.5;
    sun.shadow.camera.far = 100;
    sun.shadow.camera.left = -25;
    sun.shadow.camera.right = 25;
    sun.shadow.camera.top = 25;
    sun.shadow.camera.bottom = -25;
    sun.shadow.bias = -0.001;
    scene.add(sun);

    // Fill light (cool blue)
    const fill = new THREE.DirectionalLight(0x6699ff, 0.5);
    fill.position.set(-10, 5, -10);
    scene.add(fill);

    // Rim light
    const rim = new THREE.DirectionalLight(0xffaa44, 0.3);
    rim.position.set(0, -5, -15);
    scene.add(rim);

    // Ground hemisphere
    const hemisphere = new THREE.HemisphereLight(0x87ceeb, 0x4a5d23, 0.3);
    scene.add(hemisphere);
  };

  const addGrid = (scene) => {
    const grid = new THREE.GridHelper(GRID_SIZE, GRID_SIZE, 0x2a3a1a, 0x1a2a0a);
    grid.position.y = 0;
    grid.material.opacity = 0.4;
    grid.material.transparent = true;
    scene.add(grid);
  };

  // ── Build 3D Model from Plan Data ───────────────────────────────────────────
  const build3DModel = useCallback((data, planImageUrl) => {
    if (!sceneRef.current) return;
    const scene = sceneRef.current;

    // Clear old objects
    objectsRef.current.forEach(obj => {
      scene.remove(obj);
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
        else obj.material.dispose();
      }
    });
    objectsRef.current = [];

    const { rooms } = data;
    const scale = data.scale_meters || 15;

    // ── The plan image IS the floor — this guarantees visual accuracy ────────
    const planW = scale;
    const aspectRatio = data.image_aspect || data._imageAspect || 1.0;
    const planD = scale / aspectRatio;

    // Load the uploaded image as a texture for the floor
    const textureLoader = new THREE.TextureLoader();
    const planTexture = textureLoader.load(planImageUrl);
    planTexture.colorSpace = THREE.SRGBColorSpace;
    planTexture.minFilter = THREE.LinearFilter;
    planTexture.magFilter = THREE.LinearFilter;

    // ── Floor = the plan image itself ──────────────────────────────────────
    const floorMat = new THREE.MeshStandardMaterial({
      map: planTexture,
      roughness: 0.5,
      metalness: 0.0,
    });
    const floorGeo = new THREE.PlaneGeometry(planW, planD);
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0;
    floor.receiveShadow = true;
    floor.userData = { type: 'planFloor', baseOpacity: 1.0 };
    scene.add(floor);
    objectsRef.current.push(floor);

    // ── Outer ground ──────────────────────────────────────────────────────
    const outerGeo = new THREE.PlaneGeometry(planW + 8, planD + 8);
    const outerMat = new THREE.MeshStandardMaterial({ color: 0x1a1f12, roughness: 0.95 });
    const outer = new THREE.Mesh(outerGeo, outerMat);
    outer.rotation.x = -Math.PI / 2;
    outer.position.y = -0.01;
    outer.receiveShadow = true;
    outer.userData = { type: 'ground', baseOpacity: 1.0 };
    scene.add(outer);
    objectsRef.current.push(outer);

    // ── Build room overlays + walls from AI data ────────────────────────────
    const mainWallMat = getWallMaterial();

    if (rooms && rooms.length > 0) {
      rooms.forEach((room, idx) => {
        const rw = room.width * planW;
        const rd = room.height * planD;
        const wallH = room.wall_height_m || WALL_HEIGHT;

        // Position: room center relative to plan center
        const cx = (room.x + room.width / 2 - 0.5) * planW;
        const cz = (room.y + room.height / 2 - 0.5) * planD;

        if (rw < 0.2 || rd < 0.2) return;

        // Semi-transparent floor overlay (tinted)
        const color = new THREE.Color(room.color || '#4a9e6e');
        const overlayMat = new THREE.MeshStandardMaterial({
          color, roughness: 0.7, metalness: 0.0,
          opacity: 0.25, transparent: true, depthWrite: false,
        });
        const overlayGeo = new THREE.PlaneGeometry(rw, rd);
        const overlay = new THREE.Mesh(overlayGeo, overlayMat);
        overlay.rotation.x = -Math.PI / 2;
        overlay.position.set(cx, 0.01, cz);
        overlay.userData = { room, type: 'overlay', idx, baseOpacity: 0.25 };
        scene.add(overlay);
        objectsRef.current.push(overlay);

        // Add furniture to the room
        addFurnitureToRoom(scene, room, cx, cz, rw, rd, objectsRef);

        // Walls (full opacity)
        const wallMat = mainWallMat.clone();

        const addWall = (wx, wz, ww, wd) => {
          const geo = new THREE.BoxGeometry(ww, wallH, wd);
          const mesh = new THREE.Mesh(geo, wallMat.clone());
          mesh.position.set(wx, wallH / 2, wz);
          mesh.castShadow = true;
          mesh.receiveShadow = true;
          mesh.userData = { room, type: 'wall', baseOpacity: 1.0 };
          scene.add(mesh);
          objectsRef.current.push(mesh);
        };

        addWall(cx, cz - rd / 2, rw + WALL_THICKNESS, WALL_THICKNESS); // North
        addWall(cx, cz + rd / 2, rw + WALL_THICKNESS, WALL_THICKNESS); // South
        addWall(cx - rw / 2, cz, WALL_THICKNESS, rd + WALL_THICKNESS);  // West
        addWall(cx + rw / 2, cz, WALL_THICKNESS, rd + WALL_THICKNESS);  // East

        // Room label
        if (showLabels) {
          const dimText = `${(room.real_width_m || rw).toFixed?.(1)}m × ${(room.real_depth_m || rd).toFixed?.(1)}m`;
          const label = createRoomLabel(room.name, dimText, room.color || '#4a9e6e');
          label.position.set(cx, wallH + 0.6, cz);
          scene.add(label);
          objectsRef.current.push(label);
        }
      });
    }

    // ── Extrude walls from Python-detected Hough lines ──────────────────────
    const { walls } = data;
    if (walls && walls.length > 0) {
      const wallExtMat = mainWallMat.clone();

      walls.forEach(wall => {
        if (!wall.is_horizontal && !wall.is_vertical) return;

        const x1 = (wall.x1 - 0.5) * planW;
        const z1 = (wall.y1 - 0.5) * planD;
        const x2 = (wall.x2 - 0.5) * planW;
        const z2 = (wall.y2 - 0.5) * planD;

        const length = Math.sqrt((x2 - x1) ** 2 + (z2 - z1) ** 2);
        if (length < 0.3) return;

        const midX = (x1 + x2) / 2;
        const midZ = (z1 + z2) / 2;
        const wH = WALL_HEIGHT;

        const geo = new THREE.BoxGeometry(
          wall.is_horizontal ? length + WALL_THICKNESS : WALL_THICKNESS,
          wH,
          wall.is_vertical ? length + WALL_THICKNESS : WALL_THICKNESS
        );
        const mesh = new THREE.Mesh(geo, wallExtMat.clone());
        mesh.position.set(midX, wH / 2, midZ);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.userData = { type: 'wall', baseOpacity: 1.0 };
        scene.add(mesh);
        objectsRef.current.push(mesh);
      });
    }

    fitCamera(planW, planD);
  }, [showLabels]);

  const addWallSegment = (scene, x, wallH, z, width, depth, height, mat, room) => {
    const geo = new THREE.BoxGeometry(width, height, depth);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, height / 2, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData = { room, type: 'wall' };
    scene.add(mesh);
    objectsRef.current.push(mesh);
    return mesh;
  };

  const createRoomLabel = (name, dims, color) => {
    // Canvas-based sprite for room labels with name + dimensions
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 80;
    const ctx = canvas.getContext('2d');

    // Background pill
    ctx.fillStyle = 'rgba(15,17,23,0.88)';
    ctx.beginPath();
    ctx.roundRect(4, 4, 504, 72, 14);
    ctx.fill();

    // Color accent bar
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(4, 4, 10, 72, [14, 0, 0, 14]);
    ctx.fill();

    // Room name
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px Inter, Arial, sans-serif';
    ctx.fillText(name, 24, 34);

    // Dimensions
    ctx.fillStyle = '#9ca3af';
    ctx.font = '16px Inter, Arial, sans-serif';
    ctx.fillText(dims, 24, 58);

    const texture = new THREE.CanvasTexture(canvas);
    const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.scale.set(4, 0.65, 1);
    return sprite;
  };

  const fitCamera = (totalW, totalD) => {
    if (!cameraRef.current || !controlsRef.current) return;
    const maxDim = Math.max(totalW, totalD, 8);
    const dist = maxDim * 1.3;
    cameraRef.current.position.set(dist * 0.7, dist * 0.85, dist * 0.7);
    controlsRef.current.target.set(0, 1.5, 0);
    controlsRef.current.update();
  };

  const resetCamera = () => {
    if (!cameraRef.current || !controlsRef.current) return;
    cameraRef.current.position.set(12, 14, 14);
    cameraRef.current.lookAt(0, 0, 0);
    controlsRef.current.target.set(0, 1, 0);
    controlsRef.current.update();
  };

  // ── View Mode ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!sceneRef.current || !planData) return;
    objectsRef.current.forEach(obj => {
      if (obj.material) {
        // Never alter the plan floor texture — it must always show the image
        if (obj.userData.type === 'planFloor' || obj.userData.type === 'ground') return;
        if (viewMode === 'wireframe') {
          obj.material.wireframe = true;
        } else {
          obj.material.wireframe = false;
          obj.material.opacity = viewMode === 'xray' ? 0.15 : obj.userData.baseOpacity || 1.0;
          obj.material.transparent = viewMode === 'xray' || obj.material.opacity < 1.0;
        }
      }
    });
  }, [viewMode, planData]);

  // ── Init scene when entering viewing stage ───────────────────────────────────
  useEffect(() => {
    if (stage === 'viewing') {
      const cleanup = initScene();
      return () => {
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
        if (rendererRef.current && mountRef.current) {
          try { mountRef.current.removeChild(rendererRef.current.domElement); } catch(e){}
          rendererRef.current.dispose();
        }
        cleanup && cleanup();
      };
    }
  }, [stage, initScene]);

  useEffect(() => {
    if (stage === 'viewing' && planData && sceneRef.current && previewUrl) {
      // Small delay to ensure scene is fully initialized
      const t = setTimeout(() => build3DModel(planData, previewUrl), 100);
      return () => clearTimeout(t);
    }
  }, [stage, planData, build3DModel, previewUrl]);

  // ── File Handling ────────────────────────────────────────────────────────────
  const imageAspectRef = useRef(1.0);

  const handleFile = useCallback(async (file) => {
    if (!file || !file.type.startsWith('image/')) {
      setError('Veuillez déposer une image (PNG, JPG, WEBP, etc.)');
      return;
    }

    // Show preview and compute aspect ratio
    const reader = new FileReader();
    reader.onload = (e) => {
      const url = e.target.result;
      setPreviewUrl(url);
      // Get natural image dimensions for correct 3D floor proportions
      const img = new Image();
      img.onload = () => {
        imageAspectRef.current = img.naturalWidth / img.naturalHeight;
      };
      img.src = url;
    };
    reader.readAsDataURL(file);

    setError(null);
    setStage('analyzing');
    setProgress(0);

    // Fake progress animation during analysis
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 88) { clearInterval(interval); return 88; }
        return p + Math.random() * 8;
      });
    }, 300);

    try {
      const formData = new FormData();
      formData.append('plan', file);

      const response = await api.post('/ai/analyze-plan', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 60000,
      });

      clearInterval(interval);
      setProgress(100);

      const data = response.data;

      if (data.error) {
        setError(`Erreur d'analyse : ${data.error}`);
        setStage('upload');
        return;
      }

      // We can render even with 0 rooms (plan image is the floor), but warn
      if (!data.rooms || data.rooms.length === 0) {
        console.warn('[PlanTo3D] No rooms detected by AI, showing plan image only.');
      }

      setPlanData({ ...data, _imageAspect: imageAspectRef.current });

      setTimeout(() => {
        setStage('viewing');
      }, 600);

    } catch (err) {
      clearInterval(interval);
      console.error('Plan analysis error:', err);
      setError(
        err.response?.data?.error ||
        'Analyse échouée. Vérifiez que le serveur est démarré et réessayez.'
      );
      setStage('upload');
    }
  }, []);

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const onFileChange = (e) => {
    const file = e.target.files[0];
    if (file) handleFile(file);
  };

  // ── Camera Presets ───────────────────────────────────────────────────────────
  const setCameraPreset = (preset) => {
    if (!cameraRef.current || !controlsRef.current) return;
    const cam = cameraRef.current;
    const ctrl = controlsRef.current;
    switch (preset) {
      case 'top':
        cam.position.set(0, 22, 0.01);
        ctrl.target.set(0, 0, 0);
        break;
      case 'iso':
        cam.position.set(12, 14, 14);
        ctrl.target.set(0, 1, 0);
        break;
      case 'front':
        cam.position.set(0, 5, 18);
        ctrl.target.set(0, 2, 0);
        break;
      case 'side':
        cam.position.set(18, 5, 0);
        ctrl.target.set(0, 2, 0);
        break;
    }
    ctrl.update();
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // ── RENDER ───────────────────────────────────────────────────────────────────
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="p3d-root">
      {/* Header */}
      <div className="p3d-header">
        <div className="p3d-header-left">
          <div className="p3d-badge">
            <span className="p3d-badge-dot"></span>
            AI 3D Vision
          </div>
          <div>
            <h1 className="p3d-title">Plan to 3D</h1>
            <p className="p3d-subtitle">
              Transformez votre plan dessiné à la main en modèle 3D interactif
            </p>
          </div>
        </div>

        {stage === 'viewing' && (
          <div className="p3d-header-actions">
            {/* View mode toggle */}
            <div className="p3d-toggle-group">
              {['realistic', 'wireframe', 'xray'].map(mode => (
                <button
                  key={mode}
                  className={`p3d-toggle ${viewMode === mode ? 'active' : ''}`}
                  onClick={() => setViewMode(mode)}
                  title={mode}
                >
                  {mode === 'realistic' ? '🏛️' : mode === 'wireframe' ? '⬡' : '👁️'}
                  <span>{mode.charAt(0).toUpperCase() + mode.slice(1)}</span>
                </button>
              ))}
            </div>

            <button
              className="p3d-btn-outline"
              onClick={() => {
                setPlanData(null);
                setPreviewUrl(null);
                setStage('upload');
              }}
            >
              ↩ Nouveau plan
            </button>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="p3d-body">

        {/* ── UPLOAD STAGE ──────────────────────────────────────────────── */}
        {stage === 'upload' && (
          <div className="p3d-upload-container">
            {/* Drop Zone */}
            <div
              className={`p3d-dropzone ${isDragging ? 'dragging' : ''}`}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={onFileChange}
                style={{ display: 'none' }}
              />
              <div className="p3d-dropzone-content">
                <div className="p3d-dropzone-icon">
                  <svg viewBox="0 0 80 80" fill="none">
                    <rect x="8" y="8" width="64" height="64" rx="12" stroke="#4a5d23" strokeWidth="2.5" strokeDasharray="6 4"/>
                    <path d="M40 52V30M40 30L32 38M40 30L48 38" stroke="#4a5d23" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <rect x="20" y="56" width="40" height="4" rx="2" fill="#4a5d23" fillOpacity="0.3"/>
                  </svg>
                </div>
                <h2 className="p3d-dropzone-title">Déposez votre plan architectural</h2>
                <p className="p3d-dropzone-sub">
                  Glissez-déposez une photo ou scan de votre plan dessiné à la main
                </p>
                <div className="p3d-dropzone-formats">
                  <span>PNG</span><span>JPG</span><span>WEBP</span><span>BMP</span>
                </div>
                <button className="p3d-btn-primary" onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}>
                  <span>📂</span> Choisir une image
                </button>
              </div>
            </div>

            {error && (
              <div className="p3d-error">
                <span>⚠️</span> {error}
              </div>
            )}

            {/* Tips */}
            <div className="p3d-tips">
              <h3 className="p3d-tips-title">💡 Conseils pour un meilleur résultat</h3>
              <div className="p3d-tips-grid">
                {[
                  { icon: '✏️', title: 'Lignes claires', desc: 'Tracez vos murs avec un stylo ou feutre épais sur fond blanc' },
                  { icon: '📐', title: 'Angles droits', desc: 'Les murs perpendiculaires sont mieux reconnus par l\'IA' },
                  { icon: '🔆', title: 'Bonne lumière', desc: 'Photographiez en bonne luminosité pour éviter les zones sombres' },
                  { icon: '🗂️', title: 'Plan complet', desc: 'Incluez tout le plan dans le cadre sans le recadrer partiellement' },
                ].map(tip => (
                  <div key={tip.title} className="p3d-tip-card">
                    <span className="p3d-tip-icon">{tip.icon}</span>
                    <div>
                      <div className="p3d-tip-title">{tip.title}</div>
                      <div className="p3d-tip-desc">{tip.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── ANALYZING STAGE ──────────────────────────────────────────── */}
        {stage === 'analyzing' && (
          <div className="p3d-analyzing">
            {previewUrl && (
              <div className="p3d-preview-wrap">
                <img src={previewUrl} alt="Plan uploaded" className="p3d-preview-img" />
                <div className="p3d-scan-overlay">
                  <div className="p3d-scan-line"></div>
                </div>
              </div>
            )}

            <div className="p3d-progress-card">
              <div className="p3d-progress-icon">
                <div className="p3d-spinner"></div>
              </div>

              <h2 className="p3d-progress-title">Analyse IA en cours...</h2>

              <div className="p3d-steps">
                {[
                  { label: 'Détection des contours', done: progress > 20 },
                  { label: 'Identification des murs', done: progress > 45 },
                  { label: 'Reconnaissance des pièces', done: progress > 65 },
                  { label: 'Calcul des dimensions', done: progress > 82 },
                  { label: 'Construction du modèle 3D', done: progress >= 100 },
                ].map((step, i) => (
                  <div key={i} className={`p3d-step ${step.done ? 'done' : ''} ${!step.done && progress > (i * 18) ? 'active' : ''}`}>
                    <div className="p3d-step-dot"></div>
                    <span>{step.label}</span>
                    {step.done && <span className="p3d-step-check">✓</span>}
                  </div>
                ))}
              </div>

              <div className="p3d-progress-bar-wrap">
                <div className="p3d-progress-bar" style={{ width: `${Math.min(progress, 100)}%` }}></div>
              </div>
              <div className="p3d-progress-pct">{Math.round(Math.min(progress, 100))}%</div>
            </div>
          </div>
        )}

        {/* ── VIEWING STAGE ────────────────────────────────────────────── */}
        {stage === 'viewing' && (
          <div className="p3d-viewer-layout">

            {/* Left: Stats Panel */}
            <div className="p3d-sidebar">
              {/* Stats */}
              {planData && (
                <div className="p3d-stats-card">
                  <div className="p3d-stats-title">Analyse du plan</div>
                  <div className="p3d-stat-row">
                    <span className="p3d-stat-label">Pièces détectées</span>
                    <span className="p3d-stat-val">{planData.rooms?.length || 0}</span>
                  </div>
                  <div className="p3d-stat-row">
                    <span className="p3d-stat-label">Murs détectés</span>
                    <span className="p3d-stat-val">{planData.stats?.total_walls || planData.walls?.length || 0}</span>
                  </div>
                  <div className="p3d-stat-row">
                    <span className="p3d-stat-label">Échelle estimée</span>
                    <span className="p3d-stat-val">{planData.scale_meters || 15}m</span>
                  </div>
                  <div className="p3d-stat-row">
                    <span className="p3d-stat-label">Surface totale</span>
                    <span className="p3d-stat-val">
                      {planData.rooms ? planData.rooms.reduce((sum, r) => sum + (r.real_width_m || 0) * (r.real_depth_m || 0), 0).toFixed(1) : 0} m²
                    </span>
                  </div>
                </div>
              )}

              {/* Camera presets */}
              <div className="p3d-camera-card">
                <div className="p3d-stats-title">Vues caméra</div>
                <div className="p3d-cam-grid">
                  {[
                    { id: 'iso', label: 'Isométrique', icon: '⬡' },
                    { id: 'top', label: 'Dessus', icon: '⬇' },
                    { id: 'front', label: 'Façade', icon: '▭' },
                    { id: 'side', label: 'Côté', icon: '◧' },
                  ].map(p => (
                    <button key={p.id} className="p3d-cam-btn" onClick={() => setCameraPreset(p.id)}>
                      <span>{p.icon}</span>
                      <span>{p.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Room list */}
              {planData?.rooms && planData.rooms.length > 0 && (
                <div className="p3d-rooms-card">
                  <div className="p3d-stats-title">Pièces</div>
                  <div className="p3d-rooms-list">
                    {planData.rooms.map((room, i) => (
                      <div
                        key={i}
                        className={`p3d-room-item ${selectedRoom === i ? 'active' : ''}`}
                        onClick={() => setSelectedRoom(selectedRoom === i ? null : i)}
                      >
                        <div className="p3d-room-color" style={{ background: room.color }}></div>
                        <div className="p3d-room-info">
                          <div className="p3d-room-name">{room.name}</div>
                          <div className="p3d-room-dims">
                            {room.real_width_m?.toFixed(1)}m × {room.real_depth_m?.toFixed(1)}m
                          </div>
                        </div>
                        <div className="p3d-room-area">
                          {(room.real_width_m * room.real_depth_m).toFixed(1)} m²
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right: 3D Canvas */}
            <div className="p3d-canvas-wrap">
              <div ref={mountRef} className="p3d-canvas"></div>

              {/* Canvas overlay controls */}
              <div className="p3d-canvas-controls">
                <button className="p3d-icon-btn" onClick={resetCamera} title="Réinitialiser la vue">
                  <span>⊹</span>
                </button>
                <button
                  className={`p3d-icon-btn ${showGrid ? 'active' : ''}`}
                  onClick={() => setShowGrid(g => !g)}
                  title="Grille"
                >
                  <span>⊞</span>
                </button>
              </div>

              {/* Interaction hint */}
              <div className="p3d-canvas-hint">
                🖱️ Clic + glisser pour tourner · Scroll pour zoomer · Clic droit pour déplacer
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PlanTo3D;
