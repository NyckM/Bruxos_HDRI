import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";
import { EXRLoader } from "three/examples/jsm/loaders/EXRLoader.js";
import {
  generateProceduralHdri,
  ENVIRONMENT_PRESETS,
  EnvironmentPreset,
} from "../utils/proceduralHdri";
import {
  Sun,
  Eye,
  RotateCw,
  Sliders,
  CircleDot as SphereIcon,
  Upload,
  Layers,
  Sparkles,
  Camera,
  Info,
  Maximize2,
  Minimize2,
  RotateCcw,
  Check,
} from "lucide-react";

interface HdriViewer360Props {
  exposure: number;
  setExposure: (val: number) => void;
  toneMapping: THREE.ToneMapping;
  setToneMapping: (val: THREE.ToneMapping) => void;
  bgBlur: number;
  setBgBlur: (val: number) => void;
  cameraMode: "immersive" | "orbit"; // immersive = look around from center, orbit = look at reference spheres
  setCameraMode: (val: "immersive" | "orbit") => void;
  showSpheres: boolean;
  setShowSpheres: (val: boolean) => void;
  autoRotate: boolean;
  setAutoRotate: (val: boolean) => void;
  autoRotateSpeed: number;
  setAutoRotateSpeed: (val: number) => void;
  selectedPreset: string;
  setSelectedPreset: (val: string) => void;
  onFileLoaded: (name: string, type: string) => void;
  sphereMaterialType: "gold" | "plastic" | "glass" | "copper";
  setSphereMaterialType: (val: "gold" | "plastic" | "glass" | "copper") => void;
}

export const HdriViewer360: React.FC<HdriViewer360Props> = ({
  exposure,
  setExposure,
  toneMapping,
  setToneMapping,
  bgBlur,
  setBgBlur,
  cameraMode,
  setCameraMode,
  showSpheres,
  setShowSpheres,
  autoRotate,
  setAutoRotate,
  autoRotateSpeed,
  setAutoRotateSpeed,
  selectedPreset,
  setSelectedPreset,
  onFileLoaded,
  sphereMaterialType,
  setSphereMaterialType,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // ThreeJS References
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  
  // 3D meshes references
  const spheresGroupRef = useRef<THREE.Group | null>(null);
  const chromeSphereRef = useRef<THREE.Mesh | null>(null);
  const graySphereRef = useRef<THREE.Mesh | null>(null);
  const materialSphereRef = useRef<THREE.Mesh | null>(null);
  const standRef = useRef<THREE.Mesh | null>(null);

  // Interaction State for Pan/Orbit
  const isPointerDownRef = useRef(false);
  const pointerXRef = useRef(0);
  const pointerYRef = useRef(0);
  
  // Spherical Coordinates
  const lonRef = useRef(180); // start facing S (which is 180 degrees)
  const latRef = useRef(0);
  const orbitRadiusRef = useRef(6);
  const targetOrbitRadiusRef = useRef(6);

  // Smooth dampening
  const currentLonRef = useRef(180);
  const currentLatRef = useRef(0);
  const currentFovRef = useRef(75);
  const targetFovRef = useRef(75);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Initialize ThreeJS Scene
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth || 800;
    const height = containerRef.current.clientHeight || 500;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.set(0, 0, 0.01); // inside immersive mode start
    cameraRef.current = camera;

    // 3. WebGL Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      alpha: false,
      preserveDrawingBuffer: true, // for screenshots
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.toneMapping = toneMapping;
    renderer.toneMappingExposure = Math.pow(2, exposure); // 2^exposure is standard exposure multiplier
    rendererRef.current = renderer;

    // 4. Create VFX reference sphere objects
    const spheresGroup = new THREE.Group();
    scene.add(spheresGroup);
    spheresGroupRef.current = spheresGroup;

    // Stand / Pedestal base
    const standGeo = new THREE.CylinderGeometry(2, 2.2, 0.15, 32);
    const standMat = new THREE.MeshStandardMaterial({
      color: 0x1a1d24,
      roughness: 0.8,
      metalness: 0.2,
    });
    const stand = new THREE.Mesh(standGeo, standMat);
    stand.position.y = -1.5;
    spheresGroup.add(stand);
    standRef.current = stand;

    // Chrome Sphere (Perfect reflections)
    const sphereGeo = new THREE.SphereGeometry(0.8, 64, 64);
    const chromeMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      metalness: 1.0,
      roughness: 0.0,
    });
    const chromeSphere = new THREE.Mesh(sphereGeo, chromeMat);
    chromeSphere.position.set(-1.8, -0.6, 0);
    spheresGroup.add(chromeSphere);
    chromeSphereRef.current = chromeSphere;

    // Matte Gray Sphere (18% Gray diffuse)
    const grayMat = new THREE.MeshStandardMaterial({
      color: 0x777777, // neutral midgray
      metalness: 0.0,
      roughness: 0.85,
    });
    const graySphere = new THREE.Mesh(sphereGeo, grayMat);
    graySphere.position.set(0, -0.6, 0);
    spheresGroup.add(graySphere);
    graySphereRef.current = graySphere;

    // Material Sphere (Interactive customizable material)
    const materialSphere = new THREE.Mesh(sphereGeo, createSphereMaterial(sphereMaterialType));
    materialSphere.position.set(1.8, -0.6, 0);
    spheresGroup.add(materialSphere);
    materialSphereRef.current = materialSphere;

    // Ambient light - very low to let HDRI lighting dominate
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.02);
    scene.add(ambientLight);

    // Initial load of selected procedural environment
    loadProceduralPreset(selectedPreset as EnvironmentPreset["type"]);

    // Handle Resize
    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const { width: newW, height: newH } = entries[0].contentRect;
      if (cameraRef.current && rendererRef.current) {
        cameraRef.current.aspect = newW / newH;
        cameraRef.current.updateProjectionMatrix();
        rendererRef.current.setSize(newW, newH);
      }
    });
    resizeObserver.observe(containerRef.current);

    // Animation Loop
    let animationFrameId = 0;
    
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      // Handle auto-rotation (rotate background and/or stand depending on cameraMode)
      if (autoRotate && !isPointerDownRef.current) {
        lonRef.current += autoRotateSpeed * 0.05;
        if (lonRef.current >= 360) lonRef.current -= 360;
      }

      // Smooth dampening of Lon, Lat, and FOV coordinates
      currentLonRef.current += (lonRef.current - currentLonRef.current) * 0.15;
      currentLatRef.current += (latRef.current - currentLatRef.current) * 0.15;
      currentFovRef.current += (targetFovRef.current - currentFovRef.current) * 0.15;
      orbitRadiusRef.current += (targetOrbitRadiusRef.current - orbitRadiusRef.current) * 0.15;

      // Bound Latitude to prevent flipping over poles
      currentLatRef.current = Math.max(-85, Math.min(85, currentLatRef.current));

      // Apply camera zoom (FOV)
      if (cameraRef.current) {
        cameraRef.current.fov = currentFovRef.current;
        cameraRef.current.updateProjectionMatrix();
      }

      // Position camera based on Mode
      if (cameraMode === "immersive") {
        // Hide spheres
        spheresGroup.visible = false;

        // Camera is placed at the center, looking outwards
        const phi = THREE.MathUtils.degToRad(90 - currentLatRef.current);
        const theta = THREE.MathUtils.degToRad(currentLonRef.current);

        const target = new THREE.Vector3();
        target.x = Math.sin(phi) * Math.sin(theta);
        target.y = Math.cos(phi);
        target.z = Math.sin(phi) * Math.cos(theta);

        if (cameraRef.current) {
          cameraRef.current.position.set(0, 0, 0);
          cameraRef.current.lookAt(target);
        }
      } else {
        // Orbit mode: show spheres and orbit around them
        spheresGroup.visible = showSpheres;

        const phi = THREE.MathUtils.degToRad(90 - currentLatRef.current);
        const theta = THREE.MathUtils.degToRad(currentLonRef.current);

        if (cameraRef.current) {
          // Camera orbits around spheres center (0, -0.6, 0)
          const targetCenter = new THREE.Vector3(0, -0.6, 0);
          cameraRef.current.position.x = targetCenter.x + orbitRadiusRef.current * Math.sin(phi) * Math.sin(theta);
          cameraRef.current.position.y = targetCenter.y + orbitRadiusRef.current * Math.cos(phi);
          cameraRef.current.position.z = targetCenter.z + orbitRadiusRef.current * Math.sin(phi) * Math.cos(theta);
          cameraRef.current.lookAt(targetCenter);
        }
      }

      // Render scene
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };

    animate();

    // Clean up
    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      renderer.dispose();
      standGeo.dispose();
      sphereGeo.dispose();
      standMat.dispose();
      chromeMat.dispose();
      grayMat.dispose();
    };
  }, []);

  // Update exposure on WebGL Renderer
  useEffect(() => {
    if (rendererRef.current) {
      // EV multiplier: intensity = 2^EV
      rendererRef.current.toneMappingExposure = Math.pow(2, exposure);
    }
  }, [exposure]);

  // Update Tone Mapping
  useEffect(() => {
    if (rendererRef.current) {
      rendererRef.current.toneMapping = toneMapping;
    }
  }, [toneMapping]);

  // Update Background Blur and Spheres Visibility
  useEffect(() => {
    if (sceneRef.current) {
      sceneRef.current.backgroundBlurriness = bgBlur;
    }
  }, [bgBlur]);

  // Handle camera mode change
  useEffect(() => {
    if (cameraMode === "immersive") {
      latRef.current = 0;
      targetOrbitRadiusRef.current = 0.01;
    } else {
      // Default orbit distance
      latRef.current = 10;
      targetOrbitRadiusRef.current = 6;
    }
  }, [cameraMode]);

  // Update Material for the customizable material sphere
  useEffect(() => {
    if (materialSphereRef.current) {
      const oldMat = materialSphereRef.current.material;
      materialSphereRef.current.material = createSphereMaterial(sphereMaterialType);
      if (Array.isArray(oldMat)) {
        oldMat.forEach((m) => m.dispose());
      } else {
        oldMat.dispose();
      }
    }
  }, [sphereMaterialType]);

  // Function to create a custom material for testing lighting
  const createSphereMaterial = (type: string): THREE.Material => {
    switch (type) {
      case "gold":
        return new THREE.MeshStandardMaterial({
          color: 0xffd700, // Gold yellow
          metalness: 0.95,
          roughness: 0.15,
          name: "gold",
        });
      case "plastic":
        return new THREE.MeshStandardMaterial({
          color: 0x1d4ed8, // Deep blue plastic
          metalness: 0.0,
          roughness: 0.25,
          name: "plastic",
        });
      case "glass":
        return new THREE.MeshPhysicalMaterial({
          color: 0xffffff,
          transparent: true,
          opacity: 0.3,
          transmission: 0.9,
          roughness: 0.05,
          metalness: 0.0,
          ior: 1.5,
          thickness: 0.5,
          name: "glass",
        });
      case "copper":
        return new THREE.MeshStandardMaterial({
          color: 0xd97706, // Copper orange
          metalness: 0.9,
          roughness: 0.35,
          name: "copper",
        });
      default:
        return new THREE.MeshStandardMaterial({
          color: 0x9966cc, // Purple
          metalness: 0.5,
          roughness: 0.5,
        });
    }
  };

  // Load procedural HDRI as texture
  const loadProceduralPreset = (type: EnvironmentPreset["type"]) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const canvasTex = generateProceduralHdri(type);
      const texture = new THREE.CanvasTexture(canvasTex);
      texture.mapping = THREE.EquirectangularReflectionMapping;
      texture.colorSpace = THREE.SRGBColorSpace;

      if (sceneRef.current) {
        // Dispose of existing backgrounds/environments if any
        if (sceneRef.current.background) {
          (sceneRef.current.background as THREE.Texture).dispose();
        }
        
        sceneRef.current.background = texture;
        sceneRef.current.environment = texture;
        sceneRef.current.backgroundBlurriness = bgBlur;
      }
      setLoading(false);
    } catch (err: any) {
      console.error(err);
      setErrorMsg("Erro ao gerar ambiente procedural.");
      setLoading(false);
    }
  };

  // Trigger loading procedural presets when selection changes
  useEffect(() => {
    if (selectedPreset && selectedPreset !== "custom") {
      const preset = ENVIRONMENT_PRESETS.find((p) => p.id === selectedPreset);
      if (preset) {
        loadProceduralPreset(preset.type);
      }
    }
  }, [selectedPreset]);

  // Drag and drop or File Selection loader
  const handleFileUpload = (file: File) => {
    setLoading(true);
    setErrorMsg(null);
    const fileName = file.name;
    const fileExt = fileName.split(".").pop()?.toLowerCase() || "";

    onFileLoaded(fileName, fileExt.toUpperCase());

    const reader = new FileReader();

    if (fileExt === "hdr") {
      // Parse HDR via RGBELoader using a Blob URL
      const blobUrl = URL.createObjectURL(file);
      const rgbeLoader = new RGBELoader();
      
      rgbeLoader.load(
        blobUrl,
        (texture) => {
          texture.mapping = THREE.EquirectangularReflectionMapping;
          // Note: HDR textures usually need LinearSRGB or NoToneMapping for raw data,
          // but sRGBColorSpace is suitable for display, or ThreeJS handles it inside WebGLRenderer.
          
          if (sceneRef.current) {
            if (sceneRef.current.background) {
              (sceneRef.current.background as THREE.Texture).dispose();
            }
            sceneRef.current.background = texture;
            sceneRef.current.environment = texture;
          }
          
          setSelectedPreset("custom");
          setLoading(false);
          URL.revokeObjectURL(blobUrl);
        },
        undefined,
        (err) => {
          console.error("RGBELoader failed:", err);
          setErrorMsg("Falha ao processar arquivo HDR. Verifique se é um arquivo RGBE válido.");
          setLoading(false);
          URL.revokeObjectURL(blobUrl);
        }
      );
    } else if (fileExt === "exr") {
      // Parse EXR via EXRLoader using a Blob URL
      const blobUrl = URL.createObjectURL(file);
      const exrLoader = new EXRLoader();
      
      exrLoader.load(
        blobUrl,
        (texture) => {
          texture.mapping = THREE.EquirectangularReflectionMapping;
          
          if (sceneRef.current) {
            if (sceneRef.current.background) {
              (sceneRef.current.background as THREE.Texture).dispose();
            }
            sceneRef.current.background = texture;
            sceneRef.current.environment = texture;
          }
          
          setSelectedPreset("custom");
          setLoading(false);
          URL.revokeObjectURL(blobUrl);
        },
        undefined,
        (err) => {
          console.error("EXRLoader failed:", err);
          setErrorMsg("Falha ao processar arquivo EXR. Verifique se é um arquivo OpenEXR válido.");
          setLoading(false);
          URL.revokeObjectURL(blobUrl);
        }
      );
    } else if (["png", "jpg", "jpeg", "webp"].includes(fileExt)) {
      // Standard image
      reader.onload = (event) => {
        if (!event.target?.result) {
          setErrorMsg("Erro ao ler imagem local.");
          setLoading(false);
          return;
        }

        const img = new Image();
        img.onload = () => {
          const texture = new THREE.Texture(img);
          texture.mapping = THREE.EquirectangularReflectionMapping;
          texture.colorSpace = THREE.SRGBColorSpace;
          texture.needsUpdate = true;

          if (sceneRef.current) {
            if (sceneRef.current.background) {
              (sceneRef.current.background as THREE.Texture).dispose();
            }
            sceneRef.current.background = texture;
            sceneRef.current.environment = texture;
          }

          setSelectedPreset("custom");
          setLoading(false);
        };
        img.onerror = () => {
          setErrorMsg("Erro ao carregar elemento de imagem.");
          setLoading(false);
        };
        img.src = event.target.result as string;
      };

      reader.onerror = () => {
        setErrorMsg("Erro na leitura do arquivo.");
        setLoading(false);
      };
      reader.readAsDataURL(file);
    } else {
      setErrorMsg("Formato não suportado. Use .hdr, .exr, .png ou .jpg.");
      setLoading(false);
    }
  };

  // Listen for custom upload events from the main UI
  const handleFileUploadRef = useRef(handleFileUpload);
  useEffect(() => {
    handleFileUploadRef.current = handleFileUpload;
  });

  useEffect(() => {
    const handleUploadEvent = (e: Event) => {
      const file = (e as CustomEvent).detail as File;
      if (file) {
        handleFileUploadRef.current(file);
      }
    };
    window.addEventListener("upload-hdri", handleUploadEvent);
    return () => {
      window.removeEventListener("upload-hdri", handleUploadEvent);
    };
  }, []);

  // Pointer Event Handlers for Drag-to-Rotate / Orbit
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    isPointerDownRef.current = true;
    pointerXRef.current = e.clientX;
    pointerYRef.current = e.clientY;
    
    if (canvasRef.current) {
      canvasRef.current.setPointerCapture(e.pointerId);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isPointerDownRef.current) return;

    const deltaX = e.clientX - pointerXRef.current;
    const deltaY = e.clientY - pointerYRef.current;

    pointerXRef.current = e.clientX;
    pointerYRef.current = e.clientY;

    // Adjust longitude (horizontal rotate) and latitude (vertical tilt)
    // Sensibility depends on camera mode and FOV
    const speedMultiplier = currentFovRef.current / 150;
    
    lonRef.current -= deltaX * 0.4 * speedMultiplier;
    latRef.current += deltaY * 0.4 * speedMultiplier;

    // Prevent vertical lock/flip
    latRef.current = Math.max(-85, Math.min(85, latRef.current));
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    isPointerDownRef.current = false;
    if (canvasRef.current) {
      canvasRef.current.releasePointerCapture(e.pointerId);
    }
  };

  // Zoom / FOV Controller via Mouse Wheel
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (cameraMode === "immersive") {
      // Zoom field of view (min 30deg, max 110deg)
      targetFovRef.current = Math.max(30, Math.min(110, targetFovRef.current + e.deltaY * 0.05));
    } else {
      // In orbit mode, wheel can change zoom radius
      targetOrbitRadiusRef.current = Math.max(2.5, Math.min(12, targetOrbitRadiusRef.current + e.deltaY * 0.005));
    }
  };

  // Reset Camera Angles
  const resetCamera = () => {
    lonRef.current = 180;
    latRef.current = cameraMode === "orbit" ? 10 : 0;
    targetFovRef.current = 75;
    targetOrbitRadiusRef.current = 6;
  };

  // Drag over files
  const [dragActive, setDragActive] = useState(false);
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-slate-950 overflow-hidden select-none group"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* GL Canvas */}
      <canvas
        ref={canvasRef}
        className="w-full h-full block cursor-grab active:cursor-grabbing touch-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onWheel={handleWheel}
      />

      {/* Grid Overlay Overlay */}
      <div className="absolute inset-0 pointer-events-none border border-slate-800/40" />

      {/* Crosshair reference center */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 pointer-events-none flex items-center justify-center opacity-20 group-hover:opacity-30 transition-opacity duration-300">
        <div className="absolute w-4 h-0.5 bg-white" />
        <div className="absolute h-4 w-0.5 bg-white" />
        <div className="w-1.5 h-1.5 rounded-full border border-white" />
      </div>

      {/* Cardinal Direction Compass Floating Marker */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-slate-900/90 backdrop-blur-md border border-slate-800 px-3 py-1.5 rounded-full flex items-center gap-3 text-[10px] font-mono text-slate-400 pointer-events-none select-none shadow-xl shadow-black/40">
        <span className={Math.abs(currentLonRef.current % 360) < 15 || Math.abs(currentLonRef.current % 360) > 345 ? "text-purple-400 font-bold" : ""}>N (0°)</span>
        <span className={Math.abs((currentLonRef.current % 360) - 90) < 15 ? "text-purple-400 font-bold" : ""}>E (90°)</span>
        <span className={Math.abs((currentLonRef.current % 360) - 180) < 15 ? "text-green-400 font-bold" : ""}>S (180°)</span>
        <span className={Math.abs((currentLonRef.current % 360) - 270) < 15 ? "text-purple-400 font-bold" : ""}>W (270°)</span>
        <span className="text-slate-500">|</span>
        <span>Lat: {Math.round(currentLatRef.current)}°</span>
        <span>Lon: {Math.round(currentLonRef.current % 360)}°</span>
        <span>FOV: {Math.round(currentFovRef.current)}°</span>
      </div>

      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center gap-3 pointer-events-auto">
          <div className="relative w-12 h-12 flex items-center justify-center">
            <div className="absolute inset-0 border-4 border-purple-500/20 rounded-full" />
            <div className="absolute inset-0 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
          </div>
          <span className="text-xs font-mono text-slate-300 animate-pulse">CARREGANDO MAPA 360°...</span>
        </div>
      )}

      {/* Drag & Drop Overlay Alert */}
      {dragActive && (
        <div className="absolute inset-4 bg-purple-950/40 backdrop-blur-md border-2 border-dashed border-purple-500 rounded-xl flex flex-col items-center justify-center gap-2 pointer-events-none animate-in fade-in zoom-in-95 duration-200">
          <Upload className="w-12 h-12 text-green-400 animate-bounce" />
          <p className="text-sm font-semibold text-slate-100">Solte seu arquivo de HDRI aqui!</p>
          <p className="text-xs text-slate-400">Aceita .hdr, .exr, .png, .jpg ou .webp</p>
        </div>
      )}

      {/* Top Floating View Actions */}
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <button
          onClick={resetCamera}
          className="flex items-center gap-1.5 bg-slate-900/95 hover:bg-slate-800 text-slate-300 border border-slate-800 p-2 rounded-lg text-xs font-medium transition-all shadow-md active:scale-95"
          title="Resetar Câmera"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Resetar</span>
        </button>

        <button
          onClick={() => setCameraMode(cameraMode === "immersive" ? "orbit" : "immersive")}
          className={`flex items-center gap-1.5 border p-2 rounded-lg text-xs font-medium transition-all shadow-md active:scale-95 ${
            cameraMode === "orbit"
              ? "bg-purple-900/40 text-purple-200 border-purple-500/50"
              : "bg-slate-900/95 text-slate-300 border-slate-800 hover:bg-slate-800"
          }`}
          title={cameraMode === "immersive" ? "Mudar para Modo Globo" : "Mudar para Modo Imersivo"}
        >
          {cameraMode === "immersive" ? <SphereIcon className="w-3.5 h-3.5" /> : <Layers className="w-3.5 h-3.5" />}
          <span>{cameraMode === "immersive" ? "Modo Globo (Bolas)" : "Modo 360°"}</span>
        </button>
      </div>

      {/* Error Floating Banner */}
      {errorMsg && (
        <div className="absolute bottom-16 left-4 right-4 bg-red-950/90 border border-red-500/50 text-red-200 p-3 rounded-lg text-xs font-mono shadow-2xl flex items-start gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <Info className="w-4 h-4 text-red-400 shrink-0" />
          <div className="flex-1">
            <span className="font-bold">ERRO DE PROCESSAMENTO: </span>
            {errorMsg}
          </div>
          <button
            onClick={() => setErrorMsg(null)}
            className="text-red-400 hover:text-white font-bold px-1.5"
          >
            ×
          </button>
        </div>
      )}

      {/* Drag zone helper inside */}
      <div className="absolute bottom-4 left-4 pointer-events-none opacity-40 group-hover:opacity-70 transition-opacity duration-300">
        <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400">
          <Info className="w-3 h-3 text-green-400" />
          <span>Arraste com o mouse para girar • Rolar para zoom</span>
        </div>
      </div>
    </div>
  );
};
