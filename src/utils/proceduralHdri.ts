/**
 * Utility to generate procedural equirectangular 360° environments (HDR-like)
 * using HTML5 Canvas. These are returned as Canvas elements which can be loaded
 * directly into Three.js as CanvasTextures.
 */

export interface EnvironmentPreset {
  id: string;
  name: string;
  description: string;
  type: "studio" | "sunset" | "neon" | "calibration";
}

export const ENVIRONMENT_PRESETS: EnvironmentPreset[] = [
  {
    id: "vfx_studio",
    name: "Estúdio de Luz VFX",
    description: "Estúdio escuro com painéis de softbox de alta intensidade para testes de reflexo e iluminação.",
    type: "studio",
  },
  {
    id: "magical_sunset",
    name: "Pôr do Sol Bruxos",
    description: "Gradiente de céu de fim de tarde com sol intenso de alto contraste e horizonte demarcado.",
    type: "sunset",
  },
  {
    id: "calibration_grid",
    name: "Grelha de Calibração 360°",
    description: "Coordenadas esféricas, escala cinza de 18% e palete de cores de referência VFX.",
    type: "calibration",
  },
  {
    id: "neon_cyber",
    name: "Santuário Cyberpunk",
    description: "Ambiente sintético com grelhas de neon roxo e painéis de iluminação cibernéticos de alta saturação.",
    type: "neon",
  },
];

export function generateProceduralHdri(type: EnvironmentPreset["type"]): HTMLCanvasElement {
  const width = 2048;
  const height = 1024;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  if (!ctx) return canvas;

  // Clear background
  ctx.fillStyle = "#0d0e12";
  ctx.fillRect(0, 0, width, height);

  switch (type) {
    case "studio":
      renderVfxStudio(ctx, width, height);
      break;
    case "sunset":
      renderSunset(ctx, width, height);
      break;
    case "calibration":
      renderCalibrationGrid(ctx, width, height);
      break;
    case "neon":
      renderNeonCyber(ctx, width, height);
      break;
  }

  return canvas;
}

function renderVfxStudio(ctx: CanvasRenderingContext2D, w: number, h: number) {
  // Dark charcoal background with subtle ambient vertical gradient
  const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
  bgGrad.addColorStop(0, "#08090b");
  bgGrad.addColorStop(0.5, "#12141a");
  bgGrad.addColorStop(1, "#050608");
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, w, h);

  // Draw some subtle metal floor panels in the lower half
  ctx.strokeStyle = "rgba(255, 255, 255, 0.03)";
  ctx.lineWidth = 2;
  const floorY = h * 0.55;
  for (let x = 0; x < w; x += 128) {
    ctx.beginPath();
    ctx.moveTo(x, floorY);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  for (let y = floorY; y < h; y += 64) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }

  // Draw a bright main Softbox (Left - Key Light)
  // We represent "High-Dynamic Range" by drawing extremely bright white cores with smooth halos
  const softbox1X = w * 0.25;
  const softbox1Y = h * 0.35;
  const softbox1W = 220;
  const softbox1H = 140;

  // Softbox Glow
  const glow1 = ctx.createRadialGradient(
    softbox1X + softbox1W / 2,
    softbox1Y + softbox1H / 2,
    20,
    softbox1X + softbox1W / 2,
    softbox1Y + softbox1H / 2,
    300
  );
  glow1.addColorStop(0, "rgba(255, 255, 255, 0.4)");
  glow1.addColorStop(0.3, "rgba(255, 255, 255, 0.1)");
  glow1.addColorStop(1, "rgba(255, 255, 255, 0)");
  ctx.fillStyle = glow1;
  ctx.fillRect(softbox1X - 200, softbox1Y - 200, softbox1W + 400, softbox1H + 400);

  // Softbox Core (Super White)
  ctx.fillStyle = "#ffffff";
  ctx.shadowColor = "#ffffff";
  ctx.shadowBlur = 40;
  ctx.fillRect(softbox1X, softbox1Y, softbox1W, softbox1H);
  ctx.shadowBlur = 0; // reset

  // Softbox diffuser edge
  ctx.strokeStyle = "#444444";
  ctx.lineWidth = 6;
  ctx.strokeRect(softbox1X, softbox1Y, softbox1W, softbox1H);

  // Draw a circular Rim Light (Right Back - Rim/Fill)
  const rimX = w * 0.75;
  const rimY = h * 0.3;
  const rimR = 70;

  const glow2 = ctx.createRadialGradient(rimX, rimY, 5, rimX, rimY, 200);
  glow2.addColorStop(0, "rgba(255, 240, 220, 0.5)");
  glow2.addColorStop(0.4, "rgba(255, 240, 220, 0.1)");
  glow2.addColorStop(1, "rgba(255, 240, 220, 0)");
  ctx.fillStyle = glow2;
  ctx.beginPath();
  ctx.arc(rimX, rimY, 200, 0, Math.PI * 2);
  ctx.fill();

  // Rim Core
  ctx.fillStyle = "#ffffff";
  ctx.shadowColor = "#fffaee";
  ctx.shadowBlur = 30;
  ctx.beginPath();
  ctx.arc(rimX, rimY, rimR, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  // Add light stand structure (simulated)
  ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(rimX, rimY + rimR);
  ctx.lineTo(rimX, h);
  ctx.stroke();

  // Draw a top Overhead ceiling panel light
  const topX = w * 0.5;
  const topY = h * 0.08;
  const topW = 400;
  const topH = 40;

  const glow3 = ctx.createRadialGradient(topX, topY, 10, topX, topY, 150);
  glow3.addColorStop(0, "rgba(200, 220, 255, 0.3)");
  glow3.addColorStop(1, "rgba(200, 220, 255, 0)");
  ctx.fillStyle = glow3;
  ctx.fillRect(topX - topW / 2 - 100, topY - 50, topW + 200, topH + 100);

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(topX - topW / 2, topY - topH / 2, topW, topH);

  // Draw a gold bounce card or warm panel on the left ground
  const bounceX = w * 0.12;
  const bounceY = h * 0.65;
  const bounceW = 100;
  const bounceH = 150;

  const goldGrad = ctx.createLinearGradient(bounceX, bounceY, bounceX, bounceY + bounceH);
  goldGrad.addColorStop(0, "#ffd700");
  goldGrad.addColorStop(1, "#b8860b");
  ctx.fillStyle = goldGrad;
  ctx.fillRect(bounceX, bounceY, bounceW, bounceH);

  // Subtle studio logo watermark "BRUXOS" in the background
  ctx.fillStyle = "rgba(115, 32, 130, 0.15)";
  ctx.font = "bold 48px monospace";
  ctx.textAlign = "center";
  ctx.fillText("BRUXOS DO VFX - ESTÚDIO DE TESTE", w / 2, h * 0.4);
}

function renderSunset(ctx: CanvasRenderingContext2D, w: number, h: number) {
  // Rich atmospheric sunset gradient
  const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
  skyGrad.addColorStop(0, "#0a0c1a"); // Zenith: Deep night blue
  skyGrad.addColorStop(0.3, "#251845"); // Mid-sky: Dark purple
  skyGrad.addColorStop(0.5, "#802543"); // Upper Horizon: Crimson red
  skyGrad.addColorStop(0.55, "#f16125"); // Horizon glow: Vibrant orange
  skyGrad.addColorStop(0.6, "#fcd25d"); // Lower horizon: Warm yellow
  skyGrad.addColorStop(0.61, "#121a0f"); // Ground limit: Dark green/brown
  skyGrad.addColorStop(1, "#030504"); // Nadir: Pitch black ground
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, w, h);

  // The glowing Sun (extremely bright core to bloom exposure)
  const sunX = w * 0.5;
  const sunY = h * 0.55;
  const sunRadius = 45;

  // Wide solar halo
  const sunHalo = ctx.createRadialGradient(sunX, sunY, 5, sunX, sunY, 400);
  sunHalo.addColorStop(0, "rgba(255, 230, 180, 0.6)");
  sunHalo.addColorStop(0.1, "rgba(255, 120, 50, 0.3)");
  sunHalo.addColorStop(0.4, "rgba(255, 70, 20, 0.08)");
  sunHalo.addColorStop(1, "rgba(255, 70, 20, 0)");
  ctx.fillStyle = sunHalo;
  ctx.beginPath();
  ctx.arc(sunX, sunY, 400, 0, Math.PI * 2);
  ctx.fill();

  // Hot Sun Core
  ctx.fillStyle = "#ffffff";
  ctx.shadowColor = "#ffeedd";
  ctx.shadowBlur = 60;
  ctx.beginPath();
  ctx.arc(sunX, sunY, sunRadius, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  // Add some distant silhouettes of magic VFX towers or mountains on the horizon
  ctx.fillStyle = "#090d07";
  ctx.beginPath();
  ctx.moveTo(0, h * 0.61);
  ctx.lineTo(w * 0.1, h * 0.59);
  ctx.lineTo(w * 0.2, h * 0.61);
  ctx.lineTo(w * 0.25, h * 0.6);
  ctx.lineTo(w * 0.35, h * 0.61);
  // Wizard tower
  ctx.lineTo(w * 0.48, h * 0.61);
  ctx.lineTo(w * 0.49, h * 0.52);
  ctx.lineTo(w * 0.51, h * 0.52);
  ctx.lineTo(w * 0.52, h * 0.61);
  // Continue mountains
  ctx.lineTo(w * 0.6, h * 0.61);
  ctx.lineTo(w * 0.7, h * 0.58);
  ctx.lineTo(w * 0.8, h * 0.61);
  ctx.lineTo(w, h * 0.61);
  ctx.lineTo(w, h);
  ctx.lineTo(0, h);
  ctx.closePath();
  ctx.fill();

  // Subtle clouds in the sunset
  ctx.fillStyle = "rgba(241, 97, 37, 0.15)";
  for (let i = 0; i < 6; i++) {
    const cloudX = w * (0.15 + i * 0.14);
    const cloudY = h * (0.42 + Math.sin(i) * 0.08);
    const cloudW = 240 + Math.cos(i) * 60;
    const cloudH = 15;

    ctx.beginPath();
    ctx.ellipse(cloudX, cloudY, cloudW, cloudH, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

function renderCalibrationGrid(ctx: CanvasRenderingContext2D, w: number, h: number) {
  // Middle gray baseline (VFX 18% gray is roughly #777777 or RGB 119)
  ctx.fillStyle = "#777777";
  ctx.fillRect(0, 0, w, h);

  // Draw 360° Spherical Grid Lines (every 15 degrees)
  ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
  ctx.lineWidth = 1;

  // Latitudes (Horizontal lines)
  const latSteps = 12; // every 15 degrees
  for (let i = 1; i < latSteps; i++) {
    const y = (h / latSteps) * i;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();

    // Text label
    const latDeg = 90 - (180 / latSteps) * i;
    ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
    ctx.font = "12px monospace";
    ctx.fillText(`${latDeg}°`, 10, y - 4);
    ctx.fillText(`${latDeg}°`, w - 30, y - 4);
  }

  // Longitudes (Vertical lines)
  const lonSteps = 24; // every 15 degrees
  for (let i = 0; i < lonSteps; i++) {
    const x = (w / lonSteps) * i;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();

    // Text label
    const lonDeg = Math.round((360 / lonSteps) * i);
    ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
    ctx.font = "12px monospace";
    ctx.fillText(`${lonDeg}°`, x + 4, h - 10);
  }

  // Draw Macbeth-like color chart blocks in the equator center (front of the camera)
  // Equator is at y = h/2, Center is at x = w/2 (180 degrees)
  const chartW = 360;
  const chartH = 180;
  const chartX = w / 2 - chartW / 2;
  const chartY = h / 2 - chartH / 2;

  // Background panel for chart
  ctx.fillStyle = "#1e1e1e";
  ctx.fillRect(chartX - 10, chartY - 10, chartW + 20, chartH + 20);
  ctx.strokeStyle = "#444";
  ctx.lineWidth = 2;
  ctx.strokeRect(chartX - 10, chartY - 10, chartW + 20, chartH + 20);

  // Classic Macbeth ColorChecker Colors
  const colors = [
    ["#732629", "#c07a59", "#506d8a", "#627b37", "#8580b1", "#61bda5"], // row 1
    ["#d37c22", "#4254a4", "#b04153", "#582b5d", "#ebd538", "#c83c7d"], // row 2
    ["#102c6c", "#47882d", "#8c1f20", "#fbef1c", "#942571", "#128292"], // row 3
    ["#ffffff", "#d5d5d5", "#aaaaaa", "#777777", "#444444", "#111111"], // row 4 (Grayscale)
  ];

  const cellW = chartW / 6;
  const cellH = chartH / 4;

  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 6; c++) {
      const cellX = chartX + c * cellW;
      const cellY = chartY + r * cellH;
      ctx.fillStyle = colors[r][c];
      ctx.fillRect(cellX + 2, cellY + 2, cellW - 4, cellH - 4);
    }
  }

  // Draw two extremely high-intensity glowing source boxes right above the grid
  // to act as HDR exposure references (e.g., +4 EV and +8 EV indicators)
  const box1X = w * 0.3;
  const box1Y = h * 0.2;
  const boxW = 80;

  // White box (+4 EV simulator)
  ctx.fillStyle = "#ffffff";
  ctx.shadowColor = "#ffffff";
  ctx.shadowBlur = 20;
  ctx.fillRect(box1X, box1Y, boxW, boxW);
  ctx.shadowBlur = 0;

  ctx.fillStyle = "#000000";
  ctx.font = "bold 14px monospace";
  ctx.textAlign = "center";
  ctx.fillText("+4 EV", box1X + boxW / 2, box1Y + boxW / 2 + 5);

  // Gold box (+6 EV simulator)
  const box2X = w * 0.7;
  const box2Y = h * 0.2;
  ctx.fillStyle = "#ffe680";
  ctx.shadowColor = "#ffcc00";
  ctx.shadowBlur = 30;
  ctx.fillRect(box2X, box2Y, boxW, boxW);
  ctx.shadowBlur = 0;

  ctx.fillStyle = "#000000";
  ctx.fillText("+6 EV", box2X + boxW / 2, box2Y + boxW / 2 + 5);

  // Compass directions overlay
  ctx.fillStyle = "#e0e0e0";
  ctx.font = "bold 32px sans-serif";
  ctx.textAlign = "center";

  // North (at x = 0 and x = w)
  ctx.fillText("N (0°)", 50, h * 0.5 + 10);
  ctx.fillText("N (360°)", w - 60, h * 0.5 + 10);

  // East (at x = w * 0.25)
  ctx.fillText("E (90°)", w * 0.25, h * 0.5 + 10);

  // South (at x = w * 0.5)
  ctx.fillText("S (180° / CAMERA)", w * 0.5, h * 0.5 + 10);

  // West (at x = w * 0.75)
  ctx.fillText("W (270°)", w * 0.75, h * 0.5 + 10);
}

function renderNeonCyber(ctx: CanvasRenderingContext2D, w: number, h: number) {
  // Deep dark indigo background
  ctx.fillStyle = "#04020a";
  ctx.fillRect(0, 0, w, h);

  // Neon Grid flooring
  const floorY = h * 0.55;
  ctx.strokeStyle = "rgba(138, 43, 226, 0.4)"; // Purple grid lines
  ctx.lineWidth = 1;

  for (let x = 0; x < w; x += 64) {
    ctx.beginPath();
    ctx.moveTo(x, floorY);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  for (let y = floorY; y < h; y += 32) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }

  // Glowing Pink Laser Horizontal Horizon Bar
  ctx.strokeStyle = "#ff007f";
  ctx.lineWidth = 4;
  ctx.shadowColor = "#ff007f";
  ctx.shadowBlur = 15;
  ctx.beginPath();
  ctx.moveTo(0, floorY);
  ctx.lineTo(w, floorY);
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Top Neon geometric structures (glowing pink / purple circles and lines)
  const geoX = w * 0.5;
  const geoY = h * 0.25;

  const radialNeon = ctx.createRadialGradient(geoX, geoY, 10, geoX, geoY, 200);
  radialNeon.addColorStop(0, "rgba(255, 0, 128, 0.4)");
  radialNeon.addColorStop(0.5, "rgba(138, 43, 226, 0.1)");
  radialNeon.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = radialNeon;
  ctx.beginPath();
  ctx.arc(geoX, geoY, 200, 0, Math.PI * 2);
  ctx.fill();

  // Draw some solid high-energy neon vertical light bars
  const bars = [
    { x: w * 0.15, color: "#00ffff", glow: "#00ffff" }, // Cyan
    { x: w * 0.35, color: "#ff00ff", glow: "#ff00ff" }, // Magenta
    { x: w * 0.65, color: "#7928ca", glow: "#7928ca" }, // Purple
    { x: w * 0.85, color: "#39ff14", glow: "#39ff14" }, // Lime Neon
  ];

  bars.forEach((bar) => {
    // Light tube shadow
    ctx.shadowColor = bar.glow;
    ctx.shadowBlur = 25;
    ctx.fillStyle = "#ffffff"; // Tube core
    ctx.fillRect(bar.x - 12, h * 0.1, 24, h * 0.4);

    ctx.shadowBlur = 0;
    ctx.strokeStyle = bar.color;
    ctx.lineWidth = 4;
    ctx.strokeRect(bar.x - 12, h * 0.1, 24, h * 0.4);
  });

  // Cyber symbol
  ctx.fillStyle = "rgba(0, 255, 255, 0.1)";
  ctx.font = "bold 120px monospace";
  ctx.textAlign = "center";
  ctx.fillText("V FX", w / 2, h * 0.32);
}
