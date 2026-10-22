// ============================================================================
// coupleDateShare — IMAGEM ELEGANTE DO ENCONTRO (para compartilhar)
// ----------------------------------------------------------------------------
// Gera, num canvas, um cartão com estética de convite premium: fundo claro e
// sofisticado, tipografia serifada, detalhes em dourado, cronograma em linha do
// tempo e cartões com sombra suave. Sem ilustrações "de IA" — o capricho vem da
// composição. Opcionalmente inclui os custos. Funciona também no app Android.
// ============================================================================
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { totalDateCost, type CoupleDate } from '@/hooks/useCoupleDates';
import { categoryOf } from '@/components/encontros/coupleDateCategories';

type Ctx = CanvasRenderingContext2D;

// Paleta "convite elegante"
const INK = '#58293b';      // vinho profundo (títulos)
const BODY = '#4b4b52';     // texto
const GOLD = '#b08d57';     // dourado
const GOLD_SOFT = 'rgba(176,141,87,0.45)';
const MUTED = '#8f7079';
const SERIF = 'Georgia, "Times New Roman", serif';
const SANS = 'system-ui, -apple-system, "Segoe UI", sans-serif';

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

// Espaça as letras de um texto (para os rótulos em caixa alta, estilo convite).
function spaced(text: string, gap = ' ') { return text.split('').join(gap); }

// Losango (detalhe dourado).
function diamond(ctx: Ctx, cx: number, cy: number, r: number, color: string, filled: boolean) {
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(Math.PI / 4);
  if (filled) { ctx.fillStyle = color; ctx.fillRect(-r, -r, r * 2, r * 2); }
  else { ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.strokeRect(-r, -r, r * 2, r * 2); }
  ctx.restore();
}

// Ornamento: linha fina com um losango no meio.
function ornament(ctx: Ctx, cx: number, cy: number, halfW: number) {
  ctx.strokeStyle = GOLD; ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(cx - halfW, cy); ctx.lineTo(cx - 16, cy);
  ctx.moveTo(cx + 16, cy); ctx.lineTo(cx + halfW, cy);
  ctx.stroke();
  diamond(ctx, cx, cy, 6, GOLD, true);
}

export interface ShareImageOptions { includeCosts: boolean }

export async function renderCoupleDateImage(date: CoupleDate, opts: ShareImageOptions): Promise<{ blob: Blob; dataUrl: string }> {
  const W = 1080, P = 84;
  const CW = W - 2 * P;
  const cardPadX = 54, cardInnerW = CW - cardPadX * 2;
  const cat = categoryOf(date.category);

  const m = document.createElement('canvas').getContext('2d')!;

  // --- Seções ---------------------------------------------------------------
  interface Section { heading: string; measure: () => number; draw: (ctx: Ctx, ix: number, iy: number, iw: number) => void }
  const sections: Section[] = [];

  if (date.how_to && date.how_to.trim()) {
    const lineH = 46;
    sections.push({
      heading: 'A ideia',
      measure: () => { m.font = `30px ${SANS}`; return wrapLines(m, date.how_to!, cardInnerW).length * lineH; },
      draw: (ctx, ix, iy, iw) => {
        ctx.font = `30px ${SANS}`; ctx.fillStyle = BODY; ctx.textAlign = 'left';
        let cy = iy; for (const line of wrapLines(ctx, date.how_to!, iw)) { ctx.fillText(line, ix, cy); cy += lineH; }
      },
    });
  }

  if (date.schedule && date.schedule.length) {
    const timeH = 34, actLH = 40, rowGap = 30;
    const rowH = (activity: string, iw: number) => {
      m.font = `29px ${SANS}`;
      const lines = Math.max(1, wrapLines(m, activity || '', iw - 56).length);
      return timeH + lines * actLH + rowGap;
    };
    sections.push({
      heading: 'Cronograma',
      measure: () => date.schedule.reduce((h, s) => h + rowH(s.activity, cardInnerW), 0) - rowGap,
      draw: (ctx, ix, iy, iw) => {
        const lineX = ix + 9;
        const rowTops: number[] = [];
        let cy = iy;
        // calcula tops para desenhar a linha vertical
        for (const step of date.schedule) { rowTops.push(cy); cy += rowH(step.activity, iw); }
        // linha vertical da timeline
        if (date.schedule.length > 1) {
          ctx.strokeStyle = GOLD_SOFT; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(lineX, rowTops[0] + 12); ctx.lineTo(lineX, rowTops[rowTops.length - 1] + 12); ctx.stroke();
        }
        date.schedule.forEach((step, i) => {
          const top = rowTops[i];
          // ponto
          ctx.fillStyle = GOLD; ctx.beginPath(); ctx.arc(lineX, top + 12, 8, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(lineX, top + 12, 3.5, 0, Math.PI * 2); ctx.fill();
          const tx = lineX + 42;
          // horário (dourado, caixa alta)
          ctx.font = `bold 25px ${SANS}`; ctx.fillStyle = GOLD; ctx.textAlign = 'left';
          ctx.fillText(step.time ? step.time + 'H' : '—', tx, top);
          // atividade
          ctx.font = `29px ${SANS}`; ctx.fillStyle = '#2b2b31';
          let ay = top + timeH;
          for (const line of wrapLines(ctx, step.activity || '', iw - (tx - ix))) { ctx.fillText(line, tx, ay); ay += actLH; }
        });
      },
    });
  }

  if (date.items && date.items.length) {
    const lineH = 48;
    sections.push({
      heading: 'O que levar',
      measure: () => date.items.reduce((h, it) => { m.font = `29px ${SANS}`; return h + Math.max(1, wrapLines(m, it.text, cardInnerW - 52).length) * lineH; }, 0),
      draw: (ctx, ix, iy, iw) => {
        let cy = iy;
        for (const it of date.items) {
          diamond(ctx, ix + 10, cy + 15, 9, GOLD, it.packed);
          ctx.font = `29px ${SANS}`; ctx.fillStyle = it.packed ? MUTED : '#2b2b31'; ctx.textAlign = 'left';
          const lines = wrapLines(ctx, it.text, iw - 52);
          let ly = cy; for (const line of lines) { ctx.fillText(line, ix + 52, ly); ly += lineH; }
          cy += Math.max(1, lines.length) * lineH;
        }
      },
    });
  }

  const total = totalDateCost(date.costs || []);
  if (opts.includeCosts && (date.costs?.length || total > 0)) {
    const valid = (date.costs || []).filter(c => c.label || c.amount);
    const lineH = 48;
    sections.push({
      heading: 'Custos',
      measure: () => valid.length * lineH + 28 + lineH,
      draw: (ctx, ix, iy, iw) => {
        let cy = iy;
        ctx.textAlign = 'left';
        for (const c of valid) {
          ctx.font = `29px ${SANS}`; ctx.fillStyle = BODY;
          ctx.textAlign = 'left'; ctx.fillText(c.label || (c.kind === 'travel' ? 'Caminho' : 'Local'), ix, cy);
          ctx.textAlign = 'right'; ctx.fillText(brl(Number(c.amount) || 0), ix + iw, cy);
          cy += lineH;
        }
        cy += 12;
        ctx.strokeStyle = GOLD_SOFT; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(ix, cy); ctx.lineTo(ix + iw, cy); ctx.stroke();
        cy += 16;
        ctx.font = `bold 31px ${SERIF}`; ctx.fillStyle = INK;
        ctx.textAlign = 'left'; ctx.fillText('Total', ix, cy);
        ctx.fillStyle = GOLD; ctx.textAlign = 'right'; ctx.fillText(brl(total), ix + iw, cy);
      },
    });
  }

  // --- Mede a altura total ---------------------------------------------------
  const topPad = 150;
  let y = topPad;
  y += 48;                      // rótulo superior
  m.font = `bold 80px ${SERIF}`;
  const titleLines = wrapLines(m, date.title, CW - 40);
  const titleLH = 92;
  y += titleLines.length * titleLH + 18;
  y += 54;                       // ornamento + categoria
  const hasMeta = !!(date.location || date.planned_date || date.distance_km != null);
  if (hasMeta) y += 52;
  y += 40;

  const cardTop = 44, cardHeadH = 52, cardHeadGap = 26, cardBottom = 50, cardGap = 30;
  const layout = sections.map(s => {
    const contentH = s.measure();
    const boxH = cardTop + cardHeadH + cardHeadGap + contentH + cardBottom;
    const topY = y; y += boxH + cardGap;
    return { s, topY, boxH };
  });
  y += 20 + 64;                  // rodapé
  const H = y + 60;

  // --- Desenha ---------------------------------------------------------------
  const cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  const ctx = cv.getContext('2d')!;
  ctx.textBaseline = 'top';

  // Fundo claro luxuoso
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, '#fdf7f2');
  grad.addColorStop(0.5, '#f8e9ec');
  grad.addColorStop(1, '#f1dae1');
  ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);
  // brilhos suaves (rosa/dourado) para dar profundidade
  const glow = (cx: number, cy: number, r: number, color: string) => {
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    g.addColorStop(0, color); g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
  };
  glow(W * 0.2, H * 0.08, 420, 'rgba(255,214,224,0.5)');
  glow(W * 0.85, H * 0.3, 460, 'rgba(234,214,245,0.45)');
  glow(W * 0.5, H, 520, 'rgba(255,224,196,0.35)');
  // moldura dourada fina
  ctx.strokeStyle = GOLD_SOFT; ctx.lineWidth = 2;
  roundRect(ctx, 34, 34, W - 68, H - 68, 20); ctx.stroke();

  // Cabeçalho
  ctx.textAlign = 'center';
  ctx.font = `bold 26px ${SERIF}`; ctx.fillStyle = GOLD;
  const label = spaced('NOSSO ENCONTRO');
  ctx.fillText(label, W / 2, topPad);
  const lw = ctx.measureText(label).width;
  ctx.strokeStyle = GOLD; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(W / 2 - lw / 2 - 44, topPad + 16); ctx.lineTo(W / 2 - lw / 2 - 20, topPad + 16);
  ctx.moveTo(W / 2 + lw / 2 + 20, topPad + 16); ctx.lineTo(W / 2 + lw / 2 + 44, topPad + 16); ctx.stroke();

  let hy = topPad + 48;
  ctx.font = `bold 80px ${SERIF}`; ctx.fillStyle = INK;
  for (const line of titleLines) { ctx.fillText(line, W / 2, hy); hy += titleLH; }
  hy += 10;

  // ornamento
  ornament(ctx, W / 2, hy + 14, 150);
  // categoria (texto pequeno caixa alta dourado)
  ctx.font = `600 24px ${SANS}`; ctx.fillStyle = GOLD; ctx.textAlign = 'center';
  ctx.fillText(spaced(cat.label.toUpperCase(), ' '), W / 2, hy + 30);
  hy += 64;

  // meta
  if (hasMeta) {
    const bits: string[] = [];
    if (date.location) bits.push(date.location);
    if (date.planned_date) bits.push(format(parseISO(date.planned_date), "dd 'de' MMMM", { locale: ptBR }));
    if (date.distance_km != null) bits.push(`${date.distance_km} km`);
    ctx.font = `25px ${SANS}`; ctx.fillStyle = MUTED; ctx.textAlign = 'center';
    ctx.fillText(bits.join('   •   '), W / 2, hy + 8);
    hy += 52;
  }

  // Cartões
  for (const { s, topY, boxH } of layout) {
    ctx.save();
    ctx.shadowColor = 'rgba(88,41,59,0.14)'; ctx.shadowBlur = 26; ctx.shadowOffsetY = 12;
    ctx.fillStyle = '#ffffff'; roundRect(ctx, P, topY, CW, boxH, 22); ctx.fill();
    ctx.restore();
    ctx.strokeStyle = GOLD_SOFT; ctx.lineWidth = 1.5; roundRect(ctx, P, topY, CW, boxH, 22); ctx.stroke();

    const ix = P + cardPadX;
    // título do cartão: losango + serifado + fio dourado
    diamond(ctx, ix + 7, topY + cardTop + 18, 7, GOLD, true);
    ctx.font = `bold 38px ${SERIF}`; ctx.fillStyle = INK; ctx.textAlign = 'left';
    ctx.fillText(s.heading, ix + 30, topY + cardTop);
    const hw2 = ctx.measureText(s.heading).width;
    ctx.strokeStyle = GOLD_SOFT; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(ix + 30, topY + cardTop + 48); ctx.lineTo(ix + 30 + Math.min(hw2, 150), topY + cardTop + 48); ctx.stroke();

    s.draw(ctx, ix, topY + cardTop + cardHeadH + cardHeadGap, cardInnerW);
  }

  // Rodapé
  ctx.textAlign = 'center';
  diamond(ctx, W / 2, H - 92, 5, GOLD, true);
  ctx.font = `600 24px ${SANS}`; ctx.fillStyle = GOLD;
  ctx.fillText(spaced('VITALIS ESSENCE', '  '), W / 2, H - 72);

  const dataUrl = cv.toDataURL('image/png');
  const blob: Blob = await new Promise((res) => cv.toBlob((b) => res(b!), 'image/png'));
  return { blob, dataUrl };
}

// Converte um Blob em base64 puro (sem o prefixo data:...).
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onloadend = () => resolve((r.result as string).split(',')[1] || '');
    r.onerror = reject;
    r.readAsDataURL(blob);
  });
}

// No app (Android): grava a imagem no armazenamento e abre o menu nativo de
// compartilhar (onde dá para mandar no WhatsApp, salvar na galeria/Arquivos...).
async function nativeWriteAndShare(blob: Blob, fileName: string, title: string, text: string): Promise<boolean> {
  const data = await blobToBase64(blob);
  const written = await Filesystem.writeFile({ path: fileName, data, directory: Directory.Cache });
  await Share.share({ title, text, url: written.uri, dialogTitle: 'Compartilhar encontro' });
  return true;
}

// Baixa a imagem via link (navegador) — fallback para web.
function webDownload(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url; link.download = fileName;
  document.body.appendChild(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

// Compartilhar: no app usa o menu nativo; na web usa o share do navegador (ou baixa).
export async function shareOrDownloadImage(blob: Blob, fileName: string, title: string, text: string): Promise<'shared' | 'downloaded'> {
  if (Capacitor.isNativePlatform()) {
    try { await nativeWriteAndShare(blob, fileName, title, text); return 'shared'; }
    catch { return 'downloaded'; } // usuário cancelou ou falhou — segue sem erro
  }
  const file = new File([blob], fileName, { type: 'image/png' });
  const nav = navigator as Navigator & { canShare?: (d: unknown) => boolean };
  if (nav.share && nav.canShare && nav.canShare({ files: [file] })) {
    try { await nav.share({ files: [file], title, text }); return 'shared'; } catch { /* cancelou */ }
  }
  webDownload(blob, fileName);
  return 'downloaded';
}

// Baixar/salvar: no app abre o menu nativo (que tem "Salvar imagem"/"Arquivos");
// na web baixa o arquivo direto.
export async function downloadImage(blob: Blob, fileName: string): Promise<'shared' | 'downloaded'> {
  if (Capacitor.isNativePlatform()) {
    try { await nativeWriteAndShare(blob, fileName, 'Salvar encontro', ''); return 'shared'; }
    catch { return 'downloaded'; }
  }
  webDownload(blob, fileName);
  return 'downloaded';
}
