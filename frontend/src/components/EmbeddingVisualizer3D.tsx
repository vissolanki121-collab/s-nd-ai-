import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GraphPoint } from '../types';
import { RotateCw, ZoomIn, ZoomOut, Compass, Eye, Sparkles, Move } from 'lucide-react';

interface Props {
  points: GraphPoint[];
  sentence1Point?: GraphPoint;
  sentence2Point?: GraphPoint;
  similarityScore?: number | null;
}

export const EmbeddingVisualizer3D: React.FC<Props> = ({
  points,
  sentence1Point,
  sentence2Point,
  similarityScore,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const pointsGroupRef = useRef<THREE.Group | null>(null);
  const labelsGroupRef = useRef<THREE.Group | null>(null);
  const connectionLineRef = useRef<THREE.Line | null>(null);

  const [hoveredPoint, setHoveredPoint] = useState<GraphPoint | null>(null);
  const [selectedPoint, setSelectedPoint] = useState<GraphPoint | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [autoRotate, setAutoRotate] = useState<boolean>(false);
  const [showLabels, setShowLabels] = useState<boolean>(true);
  const [showGrid, setShowGrid] = useState<boolean>(true);

  // Helper to create high-resolution crisp canvas sprite for labels
  const createTextSprite = (text: string, colorHex: string) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const fontSize = 32;
    ctx.font = `600 ${fontSize}px "Inter", sans-serif`;
    
    // Shorten long text for 3D label
    const maxChars = 26;
    const displayText = text.length > maxChars ? text.substring(0, maxChars) + '…' : text;
    
    const textWidth = ctx.measureText(displayText).width;
    const paddingX = 24;
    const paddingY = 12;
    canvas.width = textWidth + paddingX * 2;
    canvas.height = fontSize + paddingY * 2;

    // Redraw after sizing
    ctx.font = `600 ${fontSize}px "Inter", sans-serif`;
    
    // Background pill
    ctx.fillStyle = 'rgba(7, 11, 20, 0.85)';
    ctx.beginPath();
    ctx.roundRect(0, 0, canvas.width, canvas.height, 12);
    ctx.fill();

    // Border
    ctx.strokeStyle = colorHex;
    ctx.lineWidth = 3;
    ctx.stroke();

    // Text
    ctx.fillStyle = '#ffffff';
    ctx.textBaseline = 'middle';
    ctx.fillText(displayText, paddingX, canvas.height / 2);

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    const spriteMaterial = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthTest: false,
    });

    const sprite = new THREE.Sprite(spriteMaterial);
    const aspect = canvas.width / canvas.height;
    const spriteHeight = 0.55;
    sprite.scale.set(spriteHeight * aspect, spriteHeight, 1);
    return sprite;
  };

  // Setup Three.js scene once
  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight || 550;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#070b14');
    scene.fog = new THREE.FogExp2('#070b14', 0.015);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(16, 12, 20);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxDistance = 60;
    controls.minDistance = 2;
    controlsRef.current = controls;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0x38bdf8, 1.2);
    dirLight1.position.set(15, 20, 10);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x10b981, 0.8);
    dirLight2.position.set(-15, -10, -10);
    scene.add(dirLight2);

    const pointLight = new THREE.PointLight(0xffffff, 1, 50);
    pointLight.position.set(0, 10, 0);
    scene.add(pointLight);

    // 3D Grids
    const gridGroup = new THREE.Group();
    gridGroup.name = 'gridGroup';

    // Horizontal ground grid (XZ)
    const gridXZ = new THREE.GridHelper(24, 24, 0x38bdf8, 0x1e293b);
    gridXZ.position.y = -8;
    gridGroup.add(gridXZ);

    // Center plane subtle grid
    const centerGrid = new THREE.GridHelper(24, 24, 0x475569, 0x0f172a);
    centerGrid.position.y = 0;
    gridGroup.add(centerGrid);

    // Axes with custom colors and labels
    const axesHelper = new THREE.AxesHelper(12);
    // Customize axis colors: X = Cyan/Blue, Y = Emerald, Z = Rose
    const colors = axesHelper.geometry.attributes.color;
    colors.setXYZ(0, 0.23, 0.51, 0.96); // X1
    colors.setXYZ(1, 0.02, 0.71, 0.83); // X2
    colors.setXYZ(2, 0.06, 0.72, 0.51); // Y1
    colors.setXYZ(3, 0.20, 0.83, 0.60); // Y2
    colors.setXYZ(4, 0.95, 0.25, 0.37); // Z1
    colors.setXYZ(5, 0.98, 0.44, 0.52); // Z2
    gridGroup.add(axesHelper);

    scene.add(gridGroup);

    // Dynamic Groups
    const pointsGroup = new THREE.Group();
    pointsGroup.name = 'pointsGroup';
    scene.add(pointsGroup);
    pointsGroupRef.current = pointsGroup;

    const labelsGroup = new THREE.Group();
    labelsGroup.name = 'labelsGroup';
    scene.add(labelsGroup);
    labelsGroupRef.current = labelsGroup;

    // Raycasting for interactive hover and click
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handlePointerMove = (event: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      mouse.x = x;
      mouse.y = y;
      setMousePos({ x: event.clientX - rect.left, y: event.clientY - rect.top });

      raycaster.setFromCamera(mouse, camera);
      if (pointsGroupRef.current) {
        const intersects = raycaster.intersectObjects(pointsGroupRef.current.children, true);
        if (intersects.length > 0) {
          const hit = intersects[0].object;
          const pt = hit.userData.pointData as GraphPoint;
          if (pt) {
            setHoveredPoint(pt);
            container.style.cursor = 'pointer';
            return;
          }
        }
      }
      setHoveredPoint(null);
      container.style.cursor = 'grab';
    };

    const handleClick = () => {
      raycaster.setFromCamera(mouse, camera);
      if (pointsGroupRef.current) {
        const intersects = raycaster.intersectObjects(pointsGroupRef.current.children, true);
        if (intersects.length > 0) {
          const hit = intersects[0].object;
          const pt = hit.userData.pointData as GraphPoint;
          if (pt) {
            setSelectedPoint(pt);
            return;
          }
        }
      }
    };

    renderer.domElement.addEventListener('mousemove', handlePointerMove);
    renderer.domElement.addEventListener('click', handleClick);

    // Animation loop
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      if (controlsRef.current) {
        controlsRef.current.update();
      }

      // Rotate group or scene if autoRotate is true
      if (sceneRef.current && (sceneRef.current.userData.autoRotate as boolean)) {
        sceneRef.current.rotation.y += 0.003;
      }

      renderer.render(scene, camera);
    };
    animate();

    // Handle resize
    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current || !cameraRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight || 550;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      renderer.domElement.removeEventListener('mousemove', handlePointerMove);
      renderer.domElement.removeEventListener('click', handleClick);
      renderer.dispose();
    };
  }, []);

  // Update auto-rotate state in Three scene
  useEffect(() => {
    if (sceneRef.current) {
      sceneRef.current.userData.autoRotate = autoRotate;
    }
  }, [autoRotate]);

  // Update grid visibility
  useEffect(() => {
    if (sceneRef.current) {
      const grid = sceneRef.current.getObjectByName('gridGroup');
      if (grid) grid.visible = showGrid;
    }
  }, [showGrid]);

  // Update labels visibility
  useEffect(() => {
    if (labelsGroupRef.current) {
      labelsGroupRef.current.visible = showLabels;
    }
  }, [showLabels]);

  // Rebuild points & labels whenever points prop changes
  useEffect(() => {
    const pointsGroup = pointsGroupRef.current;
    const labelsGroup = labelsGroupRef.current;
    const scene = sceneRef.current;
    if (!pointsGroup || !labelsGroup || !scene) return;

    // Clear old points and labels
    while (pointsGroup.children.length > 0) {
      const obj = pointsGroup.children[0] as THREE.Mesh;
      if (obj.geometry) obj.geometry.dispose();
      pointsGroup.remove(obj);
    }
    while (labelsGroup.children.length > 0) {
      const obj = labelsGroup.children[0] as THREE.Sprite;
      if (obj.material) obj.material.dispose();
      labelsGroup.remove(obj);
    }

    // Remove old connection line if exists
    if (connectionLineRef.current) {
      scene.remove(connectionLineRef.current);
      connectionLineRef.current.geometry.dispose();
      connectionLineRef.current = null;
    }

    if (points.length === 0) return;

    // Add each point
    points.forEach((point) => {
      const [x, y, z] = point.coordinates;

      // Color mapping
      let colorHex = 0x3b82f6; // Blue default
      if (point.type === 'sentence2') colorHex = 0x10b981; // Green
      else if (point.type === 'custom') colorHex = 0xf43f5e; // Red

      const colorString =
        point.type === 'sentence1'
          ? '#3b82f6'
          : point.type === 'sentence2'
          ? '#10b981'
          : '#f43f5e';

      // Sphere geometry
      const radius = point.type === 'sentence1' || point.type === 'sentence2' ? 0.42 : 0.35;
      const sphereGeo = new THREE.SphereGeometry(radius, 32, 32);
      const sphereMat = new THREE.MeshStandardMaterial({
        color: colorHex,
        emissive: colorHex,
        emissiveIntensity: 0.45,
        roughness: 0.2,
        metalness: 0.8,
      });

      const mesh = new THREE.Mesh(sphereGeo, sphereMat);
      mesh.position.set(x, y, z);
      mesh.userData = { pointData: point };
      pointsGroup.add(mesh);

      // Outer glow ring
      const ringGeo = new THREE.RingGeometry(radius * 1.15, radius * 1.45, 32);
      const ringMat = new THREE.MeshBasicMaterial({
        color: colorHex,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.4,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.set(x, y, z);
      ring.lookAt(cameraRef.current ? cameraRef.current.position : new THREE.Vector3(16, 12, 20));
      pointsGroup.add(ring);

      // Text label sprite
      const sprite = createTextSprite(point.text, colorString);
      if (sprite) {
        sprite.position.set(x, y + radius + 0.65, z);
        labelsGroup.add(sprite);
      }
    });

    // Draw connection line between sentence 1 and sentence 2 if both present
    if (sentence1Point && sentence2Point) {
      const p1 = new THREE.Vector3(...sentence1Point.coordinates);
      const p2 = new THREE.Vector3(...sentence2Point.coordinates);

      const lineGeo = new THREE.BufferGeometry().setFromPoints([p1, p2]);
      const lineMat = new THREE.LineDashedMaterial({
        color: 0x38bdf8,
        dashSize: 0.4,
        gapSize: 0.2,
        linewidth: 2,
        transparent: true,
        opacity: 0.7,
      });

      const line = new THREE.Line(lineGeo, lineMat);
      line.computeLineDistances();
      scene.add(line);
      connectionLineRef.current = line;
    }
  }, [points, sentence1Point, sentence2Point]);

  // Camera control helpers
  const handleResetCamera = () => {
    if (!cameraRef.current || !controlsRef.current) return;
    cameraRef.current.position.set(16, 12, 20);
    controlsRef.current.target.set(0, 0, 0);
    controlsRef.current.update();
    if (sceneRef.current) {
      sceneRef.current.rotation.set(0, 0, 0);
    }
  };

  const handleZoom = (delta: number) => {
    if (!cameraRef.current || !controlsRef.current) return;
    const factor = delta > 0 ? 0.85 : 1.15;
    cameraRef.current.position.multiplyScalar(factor);
    controlsRef.current.update();
  };

  return (
    <div className="relative w-full h-[600px] rounded-2xl overflow-hidden glass-panel border border-cyan-500/20 shadow-2xl">
      {/* 3D Canvas Container */}
      <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Floating Toolbar Top Right */}
      <div className="absolute top-4 right-4 flex flex-wrap items-center gap-2 bg-slate-900/80 backdrop-blur-md p-1.5 rounded-xl border border-white/10 z-10">
        <button
          onClick={() => setAutoRotate(!autoRotate)}
          className={`p-2 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
            autoRotate
              ? 'bg-cyan-500 text-white shadow-glow-blue'
              : 'text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
          title="Toggle Auto Rotation"
        >
          <RotateCw className={`w-3.5 h-3.5 ${autoRotate ? 'animate-spin' : ''}`} />
          <span>{autoRotate ? 'Rotating' : 'Rotate'}</span>
        </button>

        <button
          onClick={() => setShowLabels(!showLabels)}
          className={`p-2 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
            showLabels
              ? 'bg-slate-700 text-cyan-300'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
          title="Toggle Labels in 3D Space"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Labels</span>
        </button>

        <button
          onClick={() => setShowGrid(!showGrid)}
          className={`p-2 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
            showGrid
              ? 'bg-slate-700 text-cyan-300'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
          title="Toggle 3D Coordinate Grids"
        >
          <Compass className="w-3.5 h-3.5" />
          <span>Grid</span>
        </button>

        <div className="h-4 w-px bg-slate-700 mx-0.5" />

        <button
          onClick={() => handleZoom(1)}
          className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
          title="Zoom In"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={() => handleZoom(-1)}
          className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
          title="Zoom Out"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={handleResetCamera}
          className="px-2.5 py-1.5 text-xs text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-all border border-slate-700"
          title="Reset Camera View"
        >
          Reset View
        </button>
      </div>

      {/* Floating Legend Top Left */}
      <div className="absolute top-4 left-4 bg-slate-900/85 backdrop-blur-md p-3.5 rounded-xl border border-white/10 z-10 max-w-xs pointer-events-auto">
        <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2.5 flex items-center justify-between">
          <span>Legend & Projection</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800 font-mono">
            384D &rarr; 3D
          </span>
        </div>
        <div className="space-y-2 text-xs">
          <div className="flex items-center gap-2.5">
            <span className="w-3.5 h-3.5 rounded-full bg-blue-500 shadow-[0_0_8px_#3b82f6] shrink-0" />
            <span className="text-slate-200 font-medium">Sentence 1</span>
            <span className="text-slate-400 text-[11px] ml-auto">Blue Point</span>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981] shrink-0" />
            <span className="text-slate-200 font-medium">Sentence 2</span>
            <span className="text-slate-400 text-[11px] ml-auto">Green Point</span>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="w-3.5 h-3.5 rounded-full bg-rose-500 shadow-[0_0_8px_#f43f5e] shrink-0" />
            <span className="text-slate-200 font-medium">Added Words / Sentences</span>
            <span className="text-slate-400 text-[11px] ml-auto">Red Points</span>
          </div>
        </div>

        {similarityScore !== undefined && similarityScore !== null && (
          <div className="mt-3 pt-2.5 border-t border-slate-800/80 text-[11px] flex items-center justify-between text-slate-300">
            <span>384D Cosine Similarity:</span>
            <span className="font-mono font-bold text-cyan-400 text-xs">
              {(similarityScore * 100).toFixed(1)}% ({similarityScore.toFixed(4)})
            </span>
          </div>
        )}
      </div>

      {/* Navigation hints Bottom Left */}
      <div className="absolute bottom-4 left-4 bg-slate-900/80 backdrop-blur-md px-3 py-2 rounded-xl border border-white/10 text-[11px] text-slate-400 flex items-center gap-3">
        <span className="flex items-center gap-1">
          <RotateCw className="w-3 h-3 text-cyan-400" /> Left-drag: Rotate
        </span>
        <span className="flex items-center gap-1">
          <Move className="w-3 h-3 text-emerald-400" /> Right-drag: Pan
        </span>
        <span className="flex items-center gap-1">
          <ZoomIn className="w-3 h-3 text-rose-400" /> Scroll: Zoom
        </span>
      </div>

      {/* Mathematical Projection Notice Bottom Right */}
      <div className="absolute bottom-4 right-4 max-w-sm bg-slate-900/85 backdrop-blur-md p-2.5 rounded-xl border border-cyan-500/20 text-[11px] text-slate-300 leading-relaxed shadow-lg">
        <div className="flex items-start gap-2">
          <Sparkles className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-cyan-300">Deterministic PCA Projection: </span>
            The 3D coordinates are projected using a frozen PCA basis fitted once on a diverse reference corpus.
            Points never move when new items are added. Cosine similarity is calculated directly on the original 384-dimensional vectors.
          </div>
        </div>
      </div>

      {/* Hover Tooltip Overlay */}
      {hoveredPoint && (
        <div
          className="absolute z-30 pointer-events-none transform -translate-x-1/2 -translate-y-full -mt-3"
          style={{ left: `${mousePos.x}px`, top: `${mousePos.y}px` }}
        >
          <div className="glass-panel p-3 rounded-xl border border-cyan-400/50 shadow-2xl min-w-[220px] max-w-xs text-left">
            <div className="flex items-center justify-between mb-1">
              <span
                className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                  hoveredPoint.type === 'sentence1'
                    ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                    : hoveredPoint.type === 'sentence2'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                }`}
              >
                {hoveredPoint.type === 'sentence1'
                  ? 'Sentence 1'
                  : hoveredPoint.type === 'sentence2'
                  ? 'Sentence 2'
                  : 'Added Sentence'}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">384-D vector</span>
            </div>
            <p className="text-xs text-white font-medium line-clamp-2 mb-2">"{hoveredPoint.text}"</p>
            <div className="text-[10px] text-slate-300 font-mono bg-slate-950/80 p-1.5 rounded border border-slate-800 flex justify-between">
              <span>X: {hoveredPoint.coordinates[0].toFixed(2)}</span>
              <span>Y: {hoveredPoint.coordinates[1].toFixed(2)}</span>
              <span>Z: {hoveredPoint.coordinates[2].toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Selected Point Modal / Drawer */}
      {selectedPoint && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-40 flex items-center justify-center p-4">
          <div className="glass-panel p-6 rounded-2xl border border-cyan-500/30 max-w-lg w-full text-left relative shadow-2xl">
            <button
              onClick={() => setSelectedPoint(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
            >
              ✕
            </button>
            <div className="flex items-center gap-2 mb-3">
              <span
                className={`w-3.5 h-3.5 rounded-full ${
                  selectedPoint.type === 'sentence1'
                    ? 'bg-blue-500'
                    : selectedPoint.type === 'sentence2'
                    ? 'bg-emerald-500'
                    : 'bg-rose-500'
                }`}
              />
              <h4 className="text-sm font-bold uppercase tracking-wider text-slate-200">
                {selectedPoint.type === 'sentence1'
                  ? 'Sentence 1 Details'
                  : selectedPoint.type === 'sentence2'
                  ? 'Sentence 2 Details'
                  : 'Added Sentence Details'}
              </h4>
            </div>

            <div className="mb-4">
              <label className="text-[11px] uppercase tracking-wider text-slate-400 block mb-1">Text</label>
              <div className="text-sm font-medium text-white bg-slate-950/70 p-3 rounded-xl border border-slate-800">
                "{selectedPoint.text}"
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-4 font-mono text-xs">
              <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 text-center">
                <div className="text-[10px] text-cyan-400 mb-0.5">X Coordinate</div>
                <div className="text-white font-bold">{selectedPoint.coordinates[0].toFixed(4)}</div>
              </div>
              <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 text-center">
                <div className="text-[10px] text-emerald-400 mb-0.5">Y Coordinate</div>
                <div className="text-white font-bold">{selectedPoint.coordinates[1].toFixed(4)}</div>
              </div>
              <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 text-center">
                <div className="text-[10px] text-rose-400 mb-0.5">Z Coordinate</div>
                <div className="text-white font-bold">{selectedPoint.coordinates[2].toFixed(4)}</div>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-[11px] uppercase tracking-wider text-slate-400">
                  Original 384-D Vector (First 16 dimensions)
                </label>
                <span className="text-[10px] font-mono text-cyan-400">Total: 384 dims</span>
              </div>
              <div className="bg-slate-950/90 p-3 rounded-xl border border-slate-800 max-h-24 overflow-y-auto font-mono text-[11px] text-slate-300 flex flex-wrap gap-1.5">
                {selectedPoint.rawEmbedding.slice(0, 24).map((val, idx) => (
                  <span
                    key={idx}
                    className="bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800 text-cyan-300"
                  >
                    [{idx}]: {val.toFixed(4)}
                  </span>
                ))}
                <span className="text-slate-500 py-0.5">... +360 more dimensions</span>
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setSelectedPoint(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-medium transition-all"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
