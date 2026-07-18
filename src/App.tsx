import { useState } from "react";
import { HdriViewer360 } from "./components/HdriViewer360";
import { BruxosLogo } from "./components/BruxosLogo";
import * as THREE from "three";
import { motion, AnimatePresence } from "motion/react";
import {
  ENVIRONMENT_PRESETS,
} from "./utils/proceduralHdri";
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
  ChevronRight,
  RefreshCw,
  FolderOpen,
  Image as ImageIcon,
  CheckCircle,
  HelpCircle,
  TrendingUp,
} from "lucide-react";

export default function App() {
  // General State
  const [exposure, setExposure] = useState<number>(0.0); // exposure in EVs (-8 to +8)
  const [toneMapping, setToneMapping] = useState<THREE.ToneMapping>(THREE.ACESFilmicToneMapping);
  const [bgBlur, setBgBlur] = useState<number>(0.0);
  const [cameraMode, setCameraMode] = useState<"immersive" | "orbit">("orbit");
  const [showSpheres, setShowSpheres] = useState<boolean>(true);
  const [autoRotate, setAutoRotate] = useState<boolean>(false);
  const [autoRotateSpeed, setAutoRotateSpeed] = useState<number>(1.0);
  const [selectedPreset, setSelectedPreset] = useState<string>("vfx_studio");
  const [sphereMaterialType, setSphereMaterialType] = useState<"gold" | "plastic" | "glass" | "copper">("gold");

  // Loaded File State
  const [loadedFileName, setLoadedFileName] = useState<string>("Estúdio de Luz VFX");
  const [loadedFileType, setLoadedFileType] = useState<string>("PROCEDURAL");

  // Info Modal Toggle
  const [showInfoModal, setShowInfoModal] = useState<boolean>(false);

  // File Loaded callback
  const handleFileLoaded = (name: string, type: string) => {
    setLoadedFileName(name);
    setLoadedFileType(type);
  };

  // Tone mapping descriptions
  const getToneMappingDescription = (type: THREE.ToneMapping) => {
    switch (type) {
      case THREE.ACESFilmicToneMapping:
        return "ACES Filmic: Padrão cinematográfico de alta fidelidade (ideal para VFX realista).";
      case THREE.ReinhardToneMapping:
        return "Reinhard: Compressão suave de alta intensidade para evitar estouros de branco.";
      case THREE.CineonToneMapping:
        return "Cineon: Resposta de filme tradicional Kodak, contraste suave nas sombras.";
      case THREE.LinearToneMapping:
        return "Linear: Dados sem compressão. Exposição pura sem tratamento estético.";
      case THREE.NoToneMapping:
        return "Sem Mapeamento: Renderização crua. Recomendado para testes puros.";
      default:
        return "Mapeamento padrão.";
    }
  };

  // Handle Capture / Reference Card Screenshot
  const handleCapture = () => {
    const canvas = document.querySelector("canvas");
    if (!canvas) return;

    // Create virtual canvas to combine WebGL + Watermark Card
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const ctx = tempCanvas.getContext("2d");
    if (!ctx) return;

    // 1. Draw WebGL frame
    ctx.drawImage(canvas, 0, 0);

    // 2. Draw nice info reference card in the lower left corner
    ctx.fillStyle = "rgba(13, 15, 20, 0.9)";
    ctx.strokeStyle = "rgba(115, 32, 130, 0.4)";
    ctx.lineWidth = 1.5;

    const rectW = 300;
    const rectH = 65;
    const rectX = 20;
    const rectY = tempCanvas.height - rectH - 20;

    // Card background
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(rectX, rectY, rectW, rectH, 8);
    } else {
      ctx.rect(rectX, rectY, rectW, rectH);
    }
    ctx.fill();
    ctx.stroke();

    // Text details
    ctx.fillStyle = "#8cc63f"; // Lime green
    ctx.font = "bold 12px monospace";
    ctx.fillText("BRUXOS DO VFX • HDRI VIEW 360", rectX + 15, rectY + 22);

    ctx.fillStyle = "#ffffff";
    ctx.font = "11px sans-serif";
    ctx.fillText(`Arquivo: ${loadedFileName.length > 28 ? loadedFileName.substring(0, 26) + "..." : loadedFileName}`, rectX + 15, rectY + 40);

    ctx.fillStyle = "#94a3b8"; // Slate text
    ctx.font = "10px monospace";
    ctx.fillText(`EV: ${exposure >= 0 ? "+" : ""}${exposure.toFixed(1)} | Mapeamento: ${
      toneMapping === THREE.ACESFilmicToneMapping ? "ACES" : toneMapping === THREE.LinearToneMapping ? "Linear" : "Compressivo"
    }`, rectX + 15, rectY + 54);

    // Save image
    const dataUrl = tempCanvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.download = `bruxos_ref_card_${loadedFileName.replace(/\.[^/.]+$/, "")}_ev${exposure.toFixed(1)}.png`;
    link.href = dataUrl;
    link.click();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-purple-600 selection:text-white">
      {/* HEADER SECTION */}
      <header className="border-b border-slate-900 bg-slate-950/80 backdrop-blur-md px-4 sm:px-6 py-3 flex flex-col sm:flex-row items-center justify-between gap-4 sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="bg-slate-900/50 p-1.5 rounded-xl border border-slate-800/40 shadow-inner flex items-center justify-center">
            <BruxosLogo size={42} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-bold tracking-wider uppercase font-mono text-white">
                Bruxos do VFX
              </h1>
              <span className="bg-purple-950/60 border border-purple-500/30 text-[10px] font-bold text-purple-300 px-1.5 py-0.5 rounded uppercase tracking-wider">
                HDRI Studio
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Visualizador de Alta Fidelidade & Controle de Exposição 360°
            </p>
          </div>
        </div>

        {/* Current Map Metadata Indicator */}
        <div className="flex items-center gap-3 bg-slate-900/60 border border-slate-800/60 px-3 py-1.5 rounded-lg text-xs font-mono max-w-full sm:max-w-xs md:max-w-md">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <div className="truncate text-slate-300">
            <span className="text-slate-500">MAPA: </span>
            <span className="font-semibold text-white">{loadedFileName}</span>
          </div>
          <span className="bg-slate-800 text-[10px] text-slate-400 px-1.5 py-0.5 rounded font-bold uppercase shrink-0">
            {loadedFileType}
          </span>
        </div>

        {/* Header CTA Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowInfoModal(true)}
            className="text-slate-400 hover:text-white p-2 rounded-lg bg-slate-900/40 hover:bg-slate-900 transition-colors border border-slate-900"
            title="Como funciona?"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
          
          <button
            onClick={handleCapture}
            className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-green-600 hover:from-purple-500 hover:to-green-500 text-white text-xs font-medium px-3.5 py-2 rounded-lg shadow-lg hover:shadow-purple-500/10 transition-all duration-200 active:scale-95"
            title="Capturar imagem de referência com marca d'água"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Salvar Referência</span>
          </button>
        </div>
      </header>

      {/* CORE WORKSPACE */}
      <main className="flex-1 flex flex-col lg:flex-row min-h-0 relative">
        {/* VIEWPORT AREA */}
        <section className="flex-1 h-[450px] lg:h-auto min-h-0 relative border-b lg:border-b-0 lg:border-r border-slate-900">
          <HdriViewer360
            exposure={exposure}
            setExposure={setExposure}
            toneMapping={toneMapping}
            setToneMapping={setToneMapping}
            bgBlur={bgBlur}
            setBgBlur={setBgBlur}
            cameraMode={cameraMode}
            setCameraMode={setCameraMode}
            showSpheres={showSpheres}
            setShowSpheres={setShowSpheres}
            autoRotate={autoRotate}
            setAutoRotate={setAutoRotate}
            autoRotateSpeed={autoRotateSpeed}
            setAutoRotateSpeed={setAutoRotateSpeed}
            selectedPreset={selectedPreset}
            setSelectedPreset={setSelectedPreset}
            onFileLoaded={handleFileLoaded}
            sphereMaterialType={sphereMaterialType}
            setSphereMaterialType={setSphereMaterialType}
          />
        </section>

        {/* CONTROLS SIDEBAR */}
        <section className="w-full lg:w-[420px] bg-slate-950/70 backdrop-blur px-5 py-6 overflow-y-auto flex flex-col gap-6 select-none border-l border-slate-900/50">
          {/* EXPOSURE CONTROLS */}
          <div className="space-y-4 bg-slate-900/30 p-4 rounded-xl border border-slate-900/60 shadow-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sun className="w-4 h-4 text-green-400" />
                <h2 className="text-xs font-bold font-mono tracking-wider text-slate-300 uppercase">
                  Exposição (EV Stop)
                </h2>
              </div>
              <button
                onClick={() => setExposure(0)}
                className="text-[10px] font-mono text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-1 bg-purple-950/20 px-2 py-0.5 rounded border border-purple-950"
              >
                <RefreshCw className="w-2.5 h-2.5" />
                <span>Reset (0.0)</span>
              </button>
            </div>

            {/* Slider Value Display */}
            <div className="text-center py-2 relative">
              <div className="text-3xl font-extrabold font-mono text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-purple-400 select-none">
                {exposure >= 0 ? "+" : ""}
                {exposure.toFixed(2)}
              </div>
              <div className="text-[10px] font-mono text-slate-500 mt-1 uppercase">
                Fator de Brilho: <span className="text-slate-300">{(Math.pow(2, exposure)).toFixed(2)}x</span>
              </div>
            </div>

            {/* Range Input Slider */}
            <input
              type="range"
              min="-8.0"
              max="8.0"
              step="0.05"
              value={exposure}
              onChange={(e) => setExposure(parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-green-400 focus:outline-none"
            />

            {/* EV STOP TICK SELECTIONS (Very helpful for VFX) */}
            <div className="grid grid-cols-7 gap-1 mt-2">
              {[-6, -4, -2, 0, 2, 4, 6].map((stop) => (
                <button
                  key={stop}
                  onClick={() => setExposure(stop)}
                  className={`text-[9px] font-mono py-1 rounded transition-colors ${
                    Math.abs(exposure - stop) < 0.25
                      ? "bg-purple-600 text-white font-bold"
                      : "bg-slate-900 text-slate-500 hover:text-slate-300 hover:bg-slate-850"
                  }`}
                  title={`Saltar para ${stop} EV`}
                >
                  {stop > 0 ? `+${stop}` : stop}
                </button>
              ))}
            </div>
          </div>

          {/* BACKGROUND BLUR */}
          <div className="space-y-3 bg-slate-900/30 p-4 rounded-xl border border-slate-900/60 shadow-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-purple-400" />
                <h2 className="text-xs font-bold font-mono tracking-wider text-slate-300 uppercase">
                  Desfoque do Fundo
                </h2>
              </div>
              <span className="text-[10px] font-mono text-slate-400">
                {Math.round(bgBlur * 100)}%
              </span>
            </div>

            <input
              type="range"
              min="0.0"
              max="1.0"
              step="0.01"
              value={bgBlur}
              onChange={(e) => setBgBlur(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500 focus:outline-none"
            />
            <p className="text-[10px] text-slate-500">
              Desfoque o plano de fundo para destacar as esferas e avaliar o rebatimento de luz limpa.
            </p>
          </div>

          {/* TONE MAPPING PANEL */}
          <div className="space-y-3 bg-slate-900/30 p-4 rounded-xl border border-slate-900/60 shadow-md">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-green-400" />
              <h2 className="text-xs font-bold font-mono tracking-wider text-slate-300 uppercase">
                Mapeamento de Tom (Tone Mapping)
              </h2>
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              {[
                { name: "ACES Filmic", value: THREE.ACESFilmicToneMapping },
                { name: "Reinhard", value: THREE.ReinhardToneMapping },
                { name: "Cineon", value: THREE.CineonToneMapping },
                { name: "Linear", value: THREE.LinearToneMapping },
                { name: "Sem Filtro", value: THREE.NoToneMapping },
              ].map((item) => (
                <button
                  key={item.name}
                  onClick={() => setToneMapping(item.value)}
                  className={`text-[11px] py-2 px-3 rounded-lg border text-left transition-all ${
                    toneMapping === item.value
                      ? "bg-purple-950/60 text-purple-200 border-purple-500/50 font-medium"
                      : "bg-slate-900/30 text-slate-400 border-slate-900 hover:text-slate-200 hover:border-slate-800"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>{item.name}</span>
                    {toneMapping === item.value && (
                      <div className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                    )}
                  </div>
                </button>
              ))}
            </div>

            <p className="text-[10px] text-slate-400 italic bg-slate-950/40 p-2 rounded border border-slate-900/50 font-mono">
              {getToneMappingDescription(toneMapping)}
            </p>
          </div>

          {/* SAMPLES / PRESETS */}
          <div className="space-y-3 bg-slate-900/30 p-4 rounded-xl border border-slate-900/60 shadow-md">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-purple-400" />
              <h2 className="text-xs font-bold font-mono tracking-wider text-slate-300 uppercase">
                Ambientes Predefinidos
              </h2>
            </div>

            <div className="space-y-1.5">
              {ENVIRONMENT_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => {
                    setSelectedPreset(preset.id);
                    setLoadedFileName(preset.name);
                    setLoadedFileType("PROCEDURAL");
                  }}
                  className={`w-full text-left p-2.5 rounded-lg border text-xs transition-all flex items-center justify-between ${
                    selectedPreset === preset.id
                      ? "bg-green-950/40 text-green-200 border-green-500/50"
                      : "bg-slate-900/30 text-slate-400 border-slate-900 hover:text-slate-200 hover:border-slate-800"
                  }`}
                >
                  <div>
                    <span className="font-semibold block">{preset.name}</span>
                    <span className="text-[9px] text-slate-500 block truncate max-w-[280px]">
                      {preset.description}
                    </span>
                  </div>
                  {selectedPreset === preset.id && (
                    <CheckCircle className="w-4 h-4 text-green-400 shrink-0 ml-2" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* LOCAL FILE UPLOADER */}
          <div className="space-y-3 bg-slate-900/30 p-4 rounded-xl border border-slate-900/60 shadow-md">
            <div className="flex items-center gap-2">
              <Upload className="w-4 h-4 text-green-400" />
              <h2 className="text-xs font-bold font-mono tracking-wider text-slate-300 uppercase">
                Carregar HDRI/EXR Próprio (.hdr, .exr, .jpg, .png)
              </h2>
            </div>

            <label className="flex flex-col items-center justify-center border border-dashed border-slate-800 hover:border-purple-500/60 hover:bg-purple-950/5 rounded-lg p-4 cursor-pointer transition-all duration-150 group">
              <FolderOpen className="w-6 h-6 text-slate-500 group-hover:text-purple-400 mb-1.5" />
              <span className="text-xs text-slate-300 font-medium">Selecione uma imagem local</span>
              <span className="text-[9px] text-slate-500 mt-1">Sua imagem será processada 100% no navegador</span>
              <input
                type="file"
                accept=".hdr,.exr,.jpg,.jpeg,.png,.webp"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    const file = e.target.files[0];
                    // Trigger custom handler from file reader inside viewer
                    const customEvent = new CustomEvent("upload-hdri", { detail: file });
                    window.dispatchEvent(customEvent);
                    
                    // Trigger manual parser directly on file
                    const canvas = document.querySelector("canvas");
                    if (canvas) {
                      // Workaround to let the child load the uploaded file easily
                      // (We bound a window listener to handle this asynchronously inside HdriViewer360)
                    }
                  }
                }}
                className="hidden"
              />
            </label>

            {/* Custom load script connector to child component */}
            <CustomLoaderBridge onUpload={handleFileLoaded} />
          </div>

          {/* VFX SPHERES CONFIGURATION */}
          <div className="space-y-4 bg-slate-900/30 p-4 rounded-xl border border-slate-900/60 shadow-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <SphereIcon className="w-4 h-4 text-purple-400" />
                <h2 className="text-xs font-bold font-mono tracking-wider text-slate-300 uppercase">
                  Bolas de Referência VFX
                </h2>
              </div>
              <button
                onClick={() => setShowSpheres(!showSpheres)}
                className={`text-[10px] font-mono px-2 py-0.5 rounded transition-colors ${
                  showSpheres ? "bg-green-950 text-green-400 border border-green-900" : "bg-slate-900 text-slate-500 border border-slate-800"
                }`}
              >
                {showSpheres ? "VISÍVEIS" : "OCULTAS"}
              </button>
            </div>

            <div className="space-y-3">
              {/* Ball 3 customizable material */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-mono text-slate-400 block uppercase">
                  Material da 3ª Esfera:
                </span>
                <div className="grid grid-cols-4 gap-1">
                  {[
                    { id: "gold", label: "Ouro" },
                    { id: "copper", label: "Cobre" },
                    { id: "plastic", label: "Plástico" },
                    { id: "glass", label: "Vidro" },
                  ].map((mat) => (
                    <button
                      key={mat.id}
                      onClick={() => setSphereMaterialType(mat.id as any)}
                      className={`text-[10px] py-1 px-1.5 rounded transition-all text-center border ${
                        sphereMaterialType === mat.id
                          ? "bg-purple-900/60 text-purple-200 border-purple-500/50 font-bold"
                          : "bg-slate-950/50 text-slate-500 border-slate-900 hover:text-slate-300"
                      }`}
                    >
                      {mat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Automatic rotational control */}
              <div className="bg-slate-950/40 p-2.5 rounded border border-slate-900 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <RotateCw className="w-3 h-3 text-slate-400" />
                    <span className="text-[10px] font-mono text-slate-300 uppercase">Auto-Rotação 360°</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={autoRotate}
                    onChange={(e) => setAutoRotate(e.target.checked)}
                    className="rounded bg-slate-800 border-slate-700 text-purple-600 focus:ring-purple-500 h-3.5 w-3.5"
                  />
                </div>

                {autoRotate && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[9px] font-mono text-slate-500">
                      <span>Velocidade:</span>
                      <span>{autoRotateSpeed.toFixed(1)}x</span>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="4.0"
                      step="0.1"
                      value={autoRotateSpeed}
                      onChange={(e) => setAutoRotateSpeed(parseFloat(e.target.value))}
                      className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-slate-900 bg-slate-950 py-3 px-4 text-center text-[10px] font-mono text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
        <div>
          Desenvolvido para a comunidade de VFX • <span className="text-purple-400 font-bold">Bruxos do VFX</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[9px] bg-slate-900 px-2 py-0.5 rounded text-slate-400 border border-slate-800">
            100% Serverless (Ideal para GitHub Pages)
          </span>
          <span className="text-slate-600">•</span>
          <span className="text-green-500">Pronto para Hospedar</span>
        </div>
      </footer>

      {/* HELP INFO DIALOG / MODAL */}
      <AnimatePresence>
        {showInfoModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative overflow-hidden"
            >
              {/* Purple/Green Ambient Light Glow effect in background of modal */}
              <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-green-500/10 rounded-full blur-2xl" />

              <div className="flex items-center gap-3 border-b border-slate-800 pb-3 mb-4">
                <BruxosLogo size={36} />
                <div>
                  <h3 className="text-sm font-bold uppercase font-mono text-white">Manual do HDRI Studio</h3>
                  <p className="text-[10px] text-slate-400">Guia rápido de uso profissional</p>
                </div>
              </div>

              <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
                <div>
                  <h4 className="font-bold text-green-400 flex items-center gap-1 mb-1 font-mono">
                    <TrendingUp className="w-3.5 h-3.5" /> 1. Por que as esferas são necessárias?
                  </h4>
                  <p>
                    No cinema e publicidade, as esferas de referência são usadas no set para capturar a iluminação real:
                  </p>
                  <ul className="list-disc pl-5 space-y-1 mt-1 text-slate-400 font-mono text-[10px]">
                    <li><strong className="text-slate-300">Esfera Cromada (Espelhada):</strong> Revela as fontes de luz, direções e reflexos finos do ambiente de forma imediata.</li>
                    <li><strong className="text-slate-300">Esfera Cinza (18% Neutro):</strong> Avalia a intensidade da luz difusa, a suavidade das sombras e a cor ambiente geral.</li>
                    <li><strong className="text-slate-300">Esfera de Material:</strong> Permite ver o rebatimento real em materiais típicos de renderização (cobre, ouro, vidro, plástico).</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-bold text-purple-400 flex items-center gap-1 mb-1 font-mono">
                    <Sun className="w-3.5 h-3.5" /> 2. O que é Exposure (EV Stop)?
                  </h4>
                  <p>
                    Diferente de imagens tradicionais, arquivos HDRI carregam brilho exponencial. Cada acréscimo de 1 EV dobra a luz. Nosso slider de exposição permite reavaliar as luzes e ver o conteúdo oculto em áreas escuras ou extremamente brilhantes (luzes de estúdio, sol real).
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-white flex items-center gap-1 mb-1 font-mono">
                    <FolderOpen className="w-3.5 h-3.5" /> 3. Privacidade e Hosting no Github
                  </h4>
                  <p>
                    Este aplicativo funciona inteiramente no lado do cliente (Client-Side). Seus arquivos locais <strong className="text-green-400">nunca</strong> são enviados para nenhum servidor! Isso torna o app extremamente rápido, seguro e perfeitamente compatível para ser hospedado no <strong className="text-purple-400">Github Pages</strong> gratuitamente!
                  </p>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowInfoModal(false)}
                  className="bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs py-2 px-5 rounded-lg border border-slate-700 transition-colors"
                >
                  Entendido!
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Invisible custom bridge to trigger file load inside the canvas component
// This maps window event listener so when the React page loads a file, the active Three canvas receives it.
function CustomLoaderBridge({ onUpload }: { onUpload: (name: string, type: string) => void }) {
  useState(() => {
    const handleEvent = (e: Event) => {
      const file = (e as CustomEvent).detail as File;
      if (file) {
        onUpload(file.name, file.name.split(".").pop()?.toUpperCase() || "CUSTOM");
      }
    };
    window.addEventListener("upload-hdri", handleEvent);
    return () => {
      window.removeEventListener("upload-hdri", handleEvent);
    };
  });

  return null;
}

