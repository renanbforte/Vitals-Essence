// ============================================================================
// coupleDateShare — IMAGEM ROMÂNTICA DO ENCONTRO (para compartilhar)
// ----------------------------------------------------------------------------
// Desenha, num canvas, um cartão elegante do encontro: título, a ideia, o
// cronograma, o que levar e — opcionalmente — os custos. Cada seção é um cartão
// fosco com uma ilustração temática de fundo (ex.: um calendário no cronograma)
// e a lista na frente. Sem emojis: os ícones são desenhados à mão (vetor), para
// um visual mais caprichado. Funciona também dentro do app Android.
// ============================================================================
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { totalDateCost, type CoupleDate } from '@/hooks/useCoupleDates';
import { categoryOf } from '@/components/encontros/coupleDateCategories';

type Ctx = CanvasRenderingContext2D;

function brl(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
}

function roundRect(ctx: Ctx, x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

// Quebra texto em linhas que cabem em maxW (respeita quebras explícitas).
function wrapLines(ctx: Ctx, text: string, maxW: number): string[] {
  const out: string[] = [];
  for (const paragraph of text.split('\n')) {
    const words = paragraph.split(' ');
    let line = '';
    for (const w of words) {
      const test = line ? `${line} ${w}` : w;
      if (ctx.measureText(test).width > maxW && line) { out.push(line); line = w; }
      else line = test;
    }
    out.push(line);
  }
  return out;
}

// --- Ícones vetoriais (desenhados à mão) -----------------------------------
function heart(ctx: Ctx, cx: number, cy: number, s: number, color: string) {
  ctx.save(); ctx.fillStyle = color; ctx.beginPath();
  ctx.moveTo(cx, cy + s * 0.32);
  ctx.bezierCurveTo(cx + s * 0.62, cy - s * 0.08, cx + s * 0.38, cy - s * 0.62, cx, cy - s * 0.24);
  ctx.bezierCurveTo(cx - s * 0.38, cy - s * 0.62, cx - s * 0.62, cy - s * 0.08, cx, cy + s * 0.32);
  ctx.closePath(); ctx.fill(); ctx.restore();
}

function pin(ctx: Ctx, cx: number, cy: number, s: number, color: string, lw = s * 0.12) {
  ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.arc(cx, cy - s * 0.15, s * 0.42, Math.PI * 0.15, Math.PI * 0.85, true);
  ctx.lineTo(cx, cy + s * 0.55);
  ctx.closePath(); ctx.stroke();
  ctx.beginPath(); ctx.arc(cx, cy - s * 0.15, s * 0.16, 0, Math.PI * 2); ctx.stroke();
  ctx.restore();
}

function calendar(ctx: Ctx, x: number, y: number, w: number, h: number, color: string, filled = false) {
  ctx.save();
  ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineJoin = 'round';
  const lw = Math.max(2, w * 0.045); ctx.lineWidth = lw;
  roundRect(ctx, x, y + h * 0.1, w, h * 0.9, w * 0.1); ctx.stroke();
  // barra do topo
  ctx.beginPath(); ctx.moveTo(x, y + h * 0.34); ctx.lineTo(x + w, y + h * 0.34); ctx.stroke();
  // argolas
  ctx.lineWidth = Math.max(2, w * 0.04);
  ctx.beginPath(); ctx.moveTo(x + w * 0.28, y); ctx.lineTo(x + w * 0.28, y + h * 0.18); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x + w * 0.72, y); ctx.lineTo(x + w * 0.72, y + h * 0.18); ctx.stroke();
  // dias (grade de pontos 3x3)
  if (filled) {
    for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) {
      const gx = x + w * 0.24 + c * w * 0.26, gy = y + h * 0.5 + r * h * 0.17;
      ctx.beginPath(); ctx.arc(gx, gy, w * 0.035, 0, Math.PI * 2); ctx.fill();
    }
  }
  ctx.restore();
}

function bulb(ctx: Ctx, cx: number, cy: number, s: number, color: string) {
  ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = s * 0.09; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.arc(cx, cy - s * 0.1, s * 0.44, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx - s * 0.22, cy + s * 0.42); ctx.lineTo(cx + s * 0.22, cy + s * 0.42); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx - s * 0.16, cy + s * 0.6); ctx.lineTo(cx + s * 0.16, cy + s * 0.6); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx - s * 0.12, cy - s * 0.22); ctx.lineTo(cx, cy); ctx.lineTo(cx + s * 0.12, cy - s * 0.22); ctx.stroke();
  ctx.restore();
}

function clipboard(ctx: Ctx, x: number, y: number, w: number, h: number, color: string) {
  ctx.save(); ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineJoin = 'round';
  ctx.lineWidth = Math.max(2, w * 0.045);
  roundRect(ctx, x, y + h * 0.08, w, h * 0.92, w * 0.1); ctx.stroke();
  roundRect(ctx, x + w * 0.3, y, w * 0.4, h * 0.16, w * 0.04); ctx.fill();
  for (let i = 0; i < 3; i++) {
    const ly = y + h * 0.34 + i * h * 0.22;
    ctx.lineWidth = Math.max(2, w * 0.035);
    roundRect(ctx, x + w * 0.16, ly, w * 0.14, w * 0.14, w * 0.03); ctx.stroke();
    ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x + w * 0.185, ly + w * 0.075); ctx.lineTo(x + w * 0.225, ly + w * 0.115); ctx.lineTo(x + w * 0.285, ly + w * 0.035); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x + w * 0.4, ly + w * 0.07); ctx.lineTo(x + w * 0.82, ly + w * 0.07); ctx.stroke();
  }
  ctx.restore();
}

function coin(ctx: Ctx, cx: number, cy: number, s: number, color: string) {
  ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = s * 0.09; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.arc(cx, cy, s * 0.5, 0, Math.PI * 2); ctx.stroke();
  ctx.font = `bold ${s * 0.7}px sans-serif`; ctx.fillStyle = color; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('$', cx, cy + s * 0.03);
  ctx.textBaseline = 'top'; ctx.restore();
}

function checkbox(ctx: Ctx, x: number, y: number, s: number, color: string, checked: boolean) {
  ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = s * 0.1; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  roundRect(ctx, x, y, s, s, s * 0.22);
  if (checked) { ctx.fillStyle = color; ctx.fill(); ctx.strokeStyle = '#fff';
    ctx.beginPath(); ctx.moveTo(x + s * 0.24, y + s * 0.52); ctx.lineTo(x + s * 0.42, y + s * 0.7); ctx.lineTo(x + s * 0.76, y + s * 0.28); ctx.stroke();
  } else { ctx.stroke(); }
  ctx.restore();
}

// --- Ilustrações "realistas" (coloridas, com profundidade) para a marca d'água -
// Desenhadas num box (x,y,w,h). Usadas ao fundo dos cartões, de forma sutil.
function imgCalendar(ctx: Ctx, x: number, y: number, w: number, h: number) {
  const r = w * 0.07;
  ctx.save();
  // sombra
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  roundRect(ctx, x + w * 0.04, y + h * 0.05, w, h, r); ctx.fill();
  // corpo (página)
  ctx.fillStyle = '#ffffff';
  roundRect(ctx, x, y, w, h, r); ctx.fill();
  // cabeçalho vermelho
  const hb = h * 0.3;
  ctx.save(); roundRect(ctx, x, y, w, h, r); ctx.clip();
  const g = ctx.createLinearGradient(x, y, x, y + hb);
  g.addColorStop(0, '#ff6a93'); g.addColorStop(1, '#e03b6b');
  ctx.fillStyle = g; ctx.fillRect(x, y, w, hb);
  // dia da semana no topo
  ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.textAlign = 'center';
  ctx.font = `bold ${h * 0.1}px sans-serif`; ctx.fillText('SÁB', x + w / 2, y + hb * 0.26);
  ctx.restore();
  // argolas metálicas
  ctx.fillStyle = '#cfd4dc';
  const rw = w * 0.055, rh = h * 0.16;
  for (const rx of [x + w * 0.27, x + w * 0.73]) { roundRect(ctx, rx - rw / 2, y - rh * 0.45, rw, rh, rw / 2); ctx.fill(); }
  // número do dia
  ctx.fillStyle = '#2b2b2b'; ctx.textAlign = 'center';
  ctx.font = `bold ${h * 0.34}px sans-serif`; ctx.fillText('14', x + w / 2, y + hb + h * 0.06);
  // grade de dias
  ctx.fillStyle = '#dde1e8';
  for (let r1 = 0; r1 < 2; r1++) for (let c = 0; c < 6; c++) { const gx = x + w * 0.1 + c * w * 0.14, gy = y + h * 0.78 + r1 * h * 0.1; roundRect(ctx, gx, gy, w * 0.1, h * 0.06, 3); ctx.fill(); }
  ctx.textAlign = 'left'; ctx.restore();
}

function imgBulb(ctx: Ctx, cx: number, cy: number, s: number) {
  ctx.save();
  // brilho
  const glow = ctx.createRadialGradient(cx, cy - s * 0.1, s * 0.1, cx, cy - s * 0.1, s * 1.1);
  glow.addColorStop(0, 'rgba(255,214,120,0.85)'); glow.addColorStop(1, 'rgba(255,214,120,0)');
  ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(cx, cy - s * 0.1, s * 1.1, 0, Math.PI * 2); ctx.fill();
  // base metálica
  ctx.fillStyle = '#b4b9c2'; roundRect(ctx, cx - s * 0.2, cy + s * 0.32, s * 0.4, s * 0.26, s * 0.04); ctx.fill();
  ctx.strokeStyle = '#8d939d'; ctx.lineWidth = s * 0.03;
  for (let i = 0; i < 3; i++) { const ly = cy + s * 0.38 + i * s * 0.07; ctx.beginPath(); ctx.moveTo(cx - s * 0.2, ly); ctx.lineTo(cx + s * 0.2, ly); ctx.stroke(); }
  ctx.fillStyle = '#6b7079'; roundRect(ctx, cx - s * 0.08, cy + s * 0.58, s * 0.16, s * 0.1, s * 0.03); ctx.fill();
  // vidro
  const gg = ctx.createRadialGradient(cx - s * 0.16, cy - s * 0.28, s * 0.04, cx, cy - s * 0.08, s * 0.58);
  gg.addColorStop(0, '#fff3cf'); gg.addColorStop(0.6, '#ffe18c'); gg.addColorStop(1, '#f7c23e');
  ctx.fillStyle = gg; ctx.beginPath(); ctx.arc(cx, cy - s * 0.1, s * 0.5, 0, Math.PI * 2); ctx.fill();
  // filamento
  ctx.strokeStyle = '#d98a1f'; ctx.lineWidth = s * 0.045; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(cx - s * 0.13, cy + s * 0.18); ctx.lineTo(cx - s * 0.1, cy - s * 0.05); ctx.lineTo(cx, cy + s * 0.08); ctx.lineTo(cx + s * 0.1, cy - s * 0.05); ctx.lineTo(cx + s * 0.13, cy + s * 0.18); ctx.stroke();
  ctx.restore();
}

function imgClipboard(ctx: Ctx, x: number, y: number, w: number, h: number) {
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.16)'; roundRect(ctx, x + w * 0.04, y + h * 0.04, w, h, w * 0.06); ctx.fill();
  // prancheta de madeira
  const wood = ctx.createLinearGradient(x, y, x + w, y + h);
  wood.addColorStop(0, '#d79a5b'); wood.addColorStop(1, '#bf7f3f');
  ctx.fillStyle = wood; roundRect(ctx, x, y, w, h, w * 0.06); ctx.fill();
  // papel
  ctx.fillStyle = '#ffffff'; roundRect(ctx, x + w * 0.1, y + h * 0.12, w * 0.8, h * 0.82, w * 0.03); ctx.fill();
  // clipe metálico
  ctx.fillStyle = '#aeb3bd'; roundRect(ctx, x + w * 0.35, y - h * 0.03, w * 0.3, h * 0.12, w * 0.03); ctx.fill();
  ctx.fillStyle = '#cfd4dc'; roundRect(ctx, x + w * 0.41, y - h * 0.01, w * 0.18, h * 0.06, w * 0.02); ctx.fill();
  // linhas + checks verdes
  for (let i = 0; i < 4; i++) {
    const ly = y + h * 0.3 + i * h * 0.16;
    ctx.fillStyle = '#34c759'; roundRect(ctx, x + w * 0.17, ly, w * 0.11, w * 0.11, w * 0.025); ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = w * 0.022; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(x + w * 0.195, ly + w * 0.06); ctx.lineTo(x + w * 0.225, ly + w * 0.09); ctx.lineTo(x + w * 0.265, ly + w * 0.03); ctx.stroke();
    ctx.strokeStyle = '#d2d6dd'; ctx.lineWidth = w * 0.02;
    ctx.beginPath(); ctx.moveTo(x + w * 0.34, ly + w * 0.055); ctx.lineTo(x + w * 0.8, ly + w * 0.055); ctx.stroke();
  }
  ctx.restore();
}

function imgCoins(ctx: Ctx, cx: number, cy: number, s: number) {
  ctx.save();
  const coinFace = (y: number) => {
    const g = ctx.createLinearGradient(cx - s * 0.5, y, cx + s * 0.5, y);
    g.addColorStop(0, '#f7c948'); g.addColorStop(0.5, '#ffe27a'); g.addColorStop(1, '#e0a92b');
    // lateral
    ctx.fillStyle = '#d99b22';
    ctx.beginPath(); ctx.ellipse(cx, y + s * 0.14, s * 0.5, s * 0.2, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillRect(cx - s * 0.5, y, s, s * 0.14);
    // topo
    ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(cx, y, s * 0.5, s * 0.2, 0, 0, Math.PI * 2); ctx.fill();
  };
  coinFace(cy + s * 0.34); coinFace(cy + s * 0.08); coinFace(cy - s * 0.18);
  // R$ na moeda de cima
  ctx.fillStyle = '#b9811c'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = `bold ${s * 0.28}px sans-serif`; ctx.fillText('R$', cx, cy - s * 0.18);
  ctx.textBaseline = 'top'; ctx.restore();
}

export interface ShareImageOptions { includeCosts: boolean }

// Desenha o encontro e devolve o PNG (Blob) + a URL de dados (para a prévia).
export async function renderCoupleDateImage(date: CoupleDate, opts: ShareImageOptions): Promise<{ blob: Blob; dataUrl: string }> {
  const W = 1080, P = 64;
  const CW = W - 2 * P;
  const cardPadX = 48, cardInnerW = CW - cardPadX * 2;
  const cat = categoryOf(date.category);
  const accent = '#be1558';

  // Contexto de medição (independe do tamanho do canvas).
  const m = document.createElement('canvas').getContext('2d')!;

  // --- Monta os cartões (cada um sabe medir e desenhar o próprio conteúdo) ---
  interface Section {
    heading: string;
    icon: (ctx: Ctx, cx: number, cy: number) => void;        // ícone do título (centro em cx,cy, ~40px)
    bg: (ctx: Ctx, cx: number, cy: number, cw: number, ch: number) => void; // marca d'água
    measure: () => number;                                    // altura do conteúdo
    draw: (ctx: Ctx, ix: number, iy: number, iw: number) => void; // desenha o conteúdo
  }
  const sections: Section[] = [];

  // A ideia
  if (date.how_to && date.how_to.trim()) {
    const lineH = 44;
    sections.push({
      heading: 'A ideia',
      icon: (ctx, cx, cy) => bulb(ctx, cx, cy, 34, accent),
      bg: (ctx, cx, cy, cw, ch) => imgBulb(ctx, cx + cw - 150, cy + ch - 120, 150),
      measure: () => { m.font = '30px sans-serif'; return wrapLines(m, date.how_to!, cardInnerW).length * lineH; },
      draw: (ctx, ix, iy, iw) => {
        ctx.font = '30px sans-serif'; ctx.fillStyle = '#3f3f46'; ctx.textAlign = 'left';
        let cy = iy; for (const line of wrapLines(ctx, date.how_to!, iw)) { ctx.fillText(line, ix, cy); cy += lineH; }
      },
    });
  }

  // Cronograma
  if (date.schedule && date.schedule.length) {
    const rowGap = 22, lineH = 40;
    const measureRow = (activity: string, iw: number) => {
      m.font = '29px sans-serif';
      const actW = iw - 150;
      const lines = Math.max(1, wrapLines(m, activity || '', actW).length);
      return Math.max(50, lines * lineH) + rowGap;
    };
    sections.push({
      heading: 'Cronograma',
      icon: (ctx, cx, cy) => calendar(ctx, cx - 20, cy - 20, 40, 42, accent),
      bg: (ctx, cx, cy, cw, ch) => imgCalendar(ctx, cx + cw - 300, cy + ch - 300, 270, 285),
      measure: () => date.schedule.reduce((h, s) => h + measureRow(s.activity, cardInnerW), 0) - rowGap,
      draw: (ctx, ix, iy, iw) => {
        let cy = iy;
        for (const step of date.schedule) {
          const time = step.time || '·';
          ctx.font = 'bold 26px sans-serif';
          const tW = 118;
          ctx.fillStyle = 'rgba(190,21,88,0.12)';
          roundRect(ctx, ix, cy, tW, 48, 14); ctx.fill();
          ctx.fillStyle = accent; ctx.textAlign = 'center'; ctx.fillText(time, ix + tW / 2, cy + 11);
          ctx.font = '29px sans-serif'; ctx.fillStyle = '#27272a'; ctx.textAlign = 'left';
          const actX = ix + tW + 24, actW = iw - tW - 24;
          let ly = cy + 9;
          for (const line of wrapLines(ctx, step.activity || '', actW)) { ctx.fillText(line, actX, ly); ly += lineH; }
          cy += Math.max(50, (ly - cy)) + rowGap;
        }
      },
    });
  }

  // O que levar
  if (date.items && date.items.length) {
    const lineH = 46;
    sections.push({
      heading: 'O que levar',
      icon: (ctx, cx, cy) => clipboard(ctx, cx - 17, cy - 20, 34, 42, accent),
      bg: (ctx, cx, cy, cw, ch) => imgClipboard(ctx, cx + cw - 270, cy + ch - 300, 230, 275),
      measure: () => date.items.reduce((h, it) => { m.font = '29px sans-serif'; return h + Math.max(1, wrapLines(m, it.text, cardInnerW - 56).length) * lineH; }, 0),
      draw: (ctx, ix, iy, iw) => {
        let cy = iy;
        for (const it of date.items) {
          checkbox(ctx, ix, cy, 30, accent, it.packed);
          ctx.font = '29px sans-serif'; ctx.fillStyle = it.packed ? '#9ca3af' : '#27272a'; ctx.textAlign = 'left';
          const lines = wrapLines(ctx, it.text, iw - 56);
          let ly = cy + 1;
          for (const line of lines) { ctx.fillText(line, ix + 56, ly); ly += lineH; }
          cy += Math.max(1, lines.length) * lineH;
        }
      },
    });
  }

  // Custos (opcional)
  const total = totalDateCost(date.costs || []);
  if (opts.includeCosts && (date.costs?.length || total > 0)) {
    const validCosts = (date.costs || []).filter(c => c.label || c.amount);
    const lineH = 46;
    sections.push({
      heading: 'Custos',
      icon: (ctx, cx, cy) => coin(ctx, cx, cy, 36, accent),
      bg: (ctx, cx, cy, cw, ch) => imgCoins(ctx, cx + cw - 150, cy + ch - 150, 150),
      measure: () => (validCosts.length + 1) * lineH + 14,
      draw: (ctx, ix, iy, iw) => {
        let cy = iy;
        const row = (label: string, amount: number, bold = false) => {
          ctx.font = `${bold ? 'bold ' : ''}29px sans-serif`;
          ctx.fillStyle = bold ? accent : '#3f3f46'; ctx.textAlign = 'left'; ctx.fillText(label, ix, cy);
          ctx.textAlign = 'right'; ctx.fillText(brl(amount), ix + iw, cy); cy += lineH;
        };
        for (const c of validCosts) row(c.label || (c.kind === 'travel' ? 'Caminho' : 'Local'), Number(c.amount) || 0);
        cy += 14; row('Total', total, true);
      },
    });
  }

  // --- Mede a altura total ---------------------------------------------------
  const topPad = 92;
  let y = topPad;
  y += 42;                       // rótulo "NOSSO ENCONTRO"
  m.font = 'bold 76px sans-serif';
  const titleLines = wrapLines(m, date.title, CW - 40);
  const titleLH = 86;
  y += titleLines.length * titleLH + 10;
  y += 76;                        // pílula de categoria
  const hasMeta = !!(date.location || date.planned_date || date.distance_km != null);
  if (hasMeta) y += 60;
  y += 24;

  const cardTop = 36, cardHeadH = 46, cardHeadGap = 16, cardBottom = 44, cardGap = 26;
  const cardLayout = sections.map(s => {
    const contentH = s.measure();
    const boxH = cardTop + cardHeadH + cardHeadGap + contentH + cardBottom;
    const topY = y; y += boxH + cardGap;
    return { s, topY, boxH, contentH };
  });
  y += 10 + 54;                   // rodapé
  const H = y + 40;

  // --- Desenha ---------------------------------------------------------------
  const cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  const ctx = cv.getContext('2d')!;
  ctx.textBaseline = 'top';

  // Fundo em degradê romântico
  const grad = ctx.createLinearGradient(0, 0, W * 0.3, H);
  grad.addColorStop(0, '#ff9dbb');
  grad.addColorStop(0.55, '#f784b4');
  grad.addColorStop(1, '#b98cff');
  ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);
  // corações decorativos (desenhados, bem sutis)
  let seed = 11; const rnd = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
  for (let i = 0; i < 22; i++) heart(ctx, rnd() * W, rnd() * H, 26 + rnd() * 46, 'rgba(255,255,255,0.10)');

  // Cabeçalho
  ctx.textAlign = 'center';
  ctx.font = 'bold 30px sans-serif'; ctx.fillStyle = 'rgba(255,255,255,0.92)';
  // letter-spacing manual não é trivial; texto simples com coraçõezinhos nas pontas
  const label = 'N O S S O   E N C O N T R O';
  ctx.fillText(label, W / 2, topPad);
  const lw2 = ctx.measureText(label).width;
  heart(ctx, W / 2 - lw2 / 2 - 34, topPad + 16, 26, 'rgba(255,255,255,0.92)');
  heart(ctx, W / 2 + lw2 / 2 + 34, topPad + 16, 26, 'rgba(255,255,255,0.92)');

  let hy = topPad + 42;
  ctx.font = 'bold 76px sans-serif'; ctx.fillStyle = '#ffffff';
  for (const line of titleLines) { ctx.fillText(line, W / 2, hy); hy += titleLH; }
  hy += 10;

  // Pílula de categoria
  ctx.font = 'bold 32px sans-serif';
  const chipLabelW = ctx.measureText(cat.label).width;
  const chipW = chipLabelW + 96;
  const chipX = (W - chipW) / 2;
  ctx.fillStyle = 'rgba(255,255,255,0.95)';
  roundRect(ctx, chipX, hy, chipW, 60, 30); ctx.fill();
  heart(ctx, chipX + 36, hy + 30, 26, accent);
  ctx.fillStyle = accent; ctx.textAlign = 'left'; ctx.fillText(cat.label, chipX + 58, hy + 14);
  hy += 76;

  // Meta (ícones desenhados + texto), centralizada
  if (hasMeta) {
    const items: { icon: 'pin' | 'cal' | 'route'; text: string }[] = [];
    if (date.location) items.push({ icon: 'pin', text: date.location });
    if (date.planned_date) items.push({ icon: 'cal', text: format(parseISO(date.planned_date), "dd 'de' MMMM", { locale: ptBR }) });
    if (date.distance_km != null) items.push({ icon: 'route', text: `${date.distance_km} km` });
    ctx.font = '28px sans-serif';
    const gap = 40, iconW = 42;
    const widths = items.map(it => iconW + ctx.measureText(it.text).width);
    const totalW = widths.reduce((a, b) => a + b, 0) + gap * (items.length - 1);
    let mx = (W - totalW) / 2;
    const my = hy + 8;
    items.forEach((it, i) => {
      const col = 'rgba(255,255,255,0.95)';
      if (it.icon === 'pin') pin(ctx, mx + 14, my + 12, 30, col, 3);
      else if (it.icon === 'cal') calendar(ctx, mx, my - 2, 30, 32, col);
      else { ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(mx + 6, my + 20, 6, 0, Math.PI * 2); ctx.arc(mx + 28, my + 6, 6, 0, Math.PI * 2); ctx.moveTo(mx + 12, my + 20); ctx.lineTo(mx + 22, my + 6); ctx.stroke(); }
      ctx.fillStyle = col; ctx.textAlign = 'left'; ctx.fillText(it.text, mx + iconW, my);
      mx += widths[i] + gap;
    });
    hy += 60;
  }

  // Cartões
  for (const { s, topY, boxH, contentH } of cardLayout) {
    // fundo fosco
    ctx.fillStyle = 'rgba(255,255,255,0.93)';
    roundRect(ctx, P, topY, CW, boxH, 36); ctx.fill();
    // marca d'água temática (recortada no cartão, bem suave)
    ctx.save();
    roundRect(ctx, P, topY, CW, boxH, 36); ctx.clip();
    ctx.globalAlpha = 0.32;
    s.bg(ctx, P, topY, CW, boxH);
    ctx.globalAlpha = 1;
    ctx.restore();
    // título do cartão (ícone + texto)
    const ix = P + cardPadX;
    s.icon(ctx, ix + 18, topY + cardTop + 20);
    ctx.font = 'bold 36px sans-serif'; ctx.fillStyle = accent; ctx.textAlign = 'left';
    ctx.fillText(s.heading, ix + 50, topY + cardTop + 2);
    // conteúdo
    s.draw(ctx, ix, topY + cardTop + cardHeadH + cardHeadGap, cardInnerW);
    void contentH;
  }

  // Rodapé
  ctx.textAlign = 'center'; ctx.font = '26px sans-serif'; ctx.fillStyle = 'rgba(255,255,255,0.92)';
  const foot = 'feito com       no Vitalis Essence';
  ctx.fillText(foot, W / 2, H - 70);
  // coração no lugar do espaço
  heart(ctx, W / 2 - 42, H - 56, 24, 'rgba(255,255,255,0.95)');

  const dataUrl = cv.toDataURL('image/png');
  const blob: Blob = await new Promise((res) => cv.toBlob((b) => res(b!), 'image/png'));
  return { blob, dataUrl };
}

// Tenta compartilhar a imagem (menu nativo). Se não der, baixa o arquivo.
export async function shareOrDownloadImage(blob: Blob, fileName: string, title: string, text: string): Promise<'shared' | 'downloaded'> {
  const file = new File([blob], fileName, { type: 'image/png' });
  const nav = navigator as Navigator & { canShare?: (d: unknown) => boolean };
  if (nav.share && nav.canShare && nav.canShare({ files: [file] })) {
    try { await nav.share({ files: [file], title, text }); return 'shared'; } catch { /* cancelou/falhou */ }
  }
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url; link.download = fileName;
  document.body.appendChild(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
  return 'downloaded';
}
