// ============================================================================
// coupleDateShare — IMAGEM ROMÂNTICA DO ENCONTRO (para compartilhar)
// ----------------------------------------------------------------------------
// Desenha, num canvas, um cartão bonito com tudo que o encontro tem: título,
// a ideia, o cronograma (os passos), o que levar e — opcionalmente — os custos.
// Fundo em degradê romântico com corações. Devolve a imagem (PNG) para o app
// compartilhar ou baixar. É desenhado à mão (sem libs) para funcionar também
// dentro do app Android.
// ============================================================================
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { totalDateCost, type CoupleDate } from '@/hooks/useCoupleDates';
import { categoryOf } from '@/components/encontros/coupleDateCategories';

function brl(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
}

// Retângulo de cantos arredondados (com polyfill caso o navegador não tenha roundRect).
function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

// Quebra um texto em linhas que cabem em maxW, respeitando quebras explícitas.
function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const out: string[] = [];
  for (const paragraph of text.split('\n')) {
    const words = paragraph.split(' ');
    let line = '';
    for (const w of words) {
      const test = line ? `${line} ${w}` : w;
      if (ctx.measureText(test).width > maxW && line) {
        out.push(line);
        line = w;
      } else {
        line = test;
      }
    }
    out.push(line);
  }
  return out;
}

export interface ShareImageOptions {
  includeCosts: boolean;
}

// Desenha o encontro num canvas e devolve o PNG (Blob) + a URL de dados (preview).
export async function renderCoupleDateImage(
  date: CoupleDate,
  opts: ShareImageOptions,
): Promise<{ blob: Blob; dataUrl: string }> {
  const W = 1080;
  const P = 72;               // margem lateral
  const CW = W - 2 * P;       // largura útil
  const cat = categoryOf(date.category);

  // Desenha tudo primeiro num canvas alto e transparente; depois recorta na altura exata.
  const a = document.createElement('canvas');
  a.width = W;
  a.height = 4600;
  const ctx = a.getContext('2d')!;
  ctx.textBaseline = 'top';

  let y = 96;
  const centerText = (text: string, font: string, color: string) => {
    ctx.font = font; ctx.fillStyle = color; ctx.textAlign = 'center';
    ctx.fillText(text, W / 2, y);
  };

  // Cabeçalho
  centerText('♥ NOSSO ENCONTRO ♥', 'bold 30px sans-serif', 'rgba(255,255,255,0.9)');
  y += 56;

  // Título (quebra em linhas)
  ctx.textAlign = 'center';
  ctx.font = 'bold 76px sans-serif';
  const titleLines = wrapLines(ctx, `${cat.emoji} ${date.title}`, CW);
  ctx.fillStyle = '#ffffff';
  for (const line of titleLines) { ctx.fillText(line, W / 2, y); y += 86; }
  y += 6;

  // Categoria (pílula branca) + meta
  ctx.font = 'bold 32px sans-serif';
  const catLabel = `${cat.emoji} ${cat.label}`;
  const chipW = ctx.measureText(catLabel).width + 56;
  const chipX = (W - chipW) / 2;
  ctx.fillStyle = 'rgba(255,255,255,0.92)';
  roundRect(ctx, chipX, y, chipW, 58, 29); ctx.fill();
  ctx.fillStyle = '#be1558'; ctx.fillText(catLabel, W / 2, y + 12);
  y += 84;

  // Linha de meta (local / data)
  const metaBits: string[] = [];
  if (date.location) metaBits.push(`📍 ${date.location}`);
  if (date.planned_date) metaBits.push(`📅 ${format(parseISO(date.planned_date), "dd 'de' MMMM", { locale: ptBR })}`);
  if (date.distance_km != null) metaBits.push(`🚗 ${date.distance_km} km`);
  if (metaBits.length) {
    centerText(metaBits.join('   ·   '), '28px sans-serif', 'rgba(255,255,255,0.95)');
    y += 64;
  }
  y += 18;

  ctx.textAlign = 'left';

  // Desenha um cartão branco com um título e um "corpo" (callback que desenha e devolve a altura usada).
  const card = (
    heading: string,
    draw: (innerX: number, innerY: number, innerW: number) => number, // retorna y final do conteúdo
  ) => {
    const padX = 44, padTop = 36, padBottom = 40, headGap = 50;
    const innerX = P + padX;
    const innerW = CW - padX * 2;
    // Mede a altura do conteúdo desenhando "no escuro" (num y virtual alto) — mas como
    // nosso draw também desenha, fazemos assim: reservamos, desenhamos o conteúdo numa
    // posição e calculamos a caixa depois. Para simplificar, desenhamos o conteúdo numa
    // camada à frente e a caixa atrás, medindo pela diferença de y.
    const contentStartY = y + padTop + headGap;
    const contentEndY = draw(innerX, contentStartY, innerW);
    const boxH = (contentEndY - y) + padBottom;
    // Agora desenha o fundo do cartão ATRÁS (composição destination-over) e o título.
    ctx.save();
    ctx.globalCompositeOperation = 'destination-over';
    ctx.fillStyle = 'rgba(255,255,255,0.94)';
    roundRect(ctx, P, y, CW, boxH, 36); ctx.fill();
    ctx.restore();
    // título (por cima do fundo, mas o fundo foi desenhado atrás de tudo — então o título
    // precisa ser desenhado por cima agora)
    ctx.font = 'bold 36px sans-serif'; ctx.fillStyle = '#be1558'; ctx.textAlign = 'left';
    ctx.fillText(heading, innerX, y + padTop);
    y += boxH + 24;
  };

  // A ideia (how_to)
  if (date.how_to && date.how_to.trim()) {
    card('💡 A ideia', (ix, iy, iw) => {
      ctx.font = '30px sans-serif'; ctx.fillStyle = '#3f3f46'; ctx.textAlign = 'left';
      let cy = iy;
      for (const line of wrapLines(ctx, date.how_to!, iw)) { ctx.fillText(line, ix, cy); cy += 42; }
      return cy - 42 + 30;
    });
  }

  // Cronograma (schedule)
  if (date.schedule && date.schedule.length) {
    card('🗓️ Cronograma', (ix, iy, iw) => {
      let cy = iy;
      for (const step of date.schedule) {
        // badge de horário
        const time = step.time || '•';
        ctx.font = 'bold 26px sans-serif';
        const tW = Math.max(ctx.measureText(time).width + 34, 96);
        ctx.fillStyle = '#fbcfe8';
        roundRect(ctx, ix, cy, tW, 46, 14); ctx.fill();
        ctx.fillStyle = '#be1558'; ctx.textAlign = 'center';
        ctx.fillText(time, ix + tW / 2, cy + 9);
        // atividade (pode quebrar)
        ctx.font = '29px sans-serif'; ctx.fillStyle = '#27272a'; ctx.textAlign = 'left';
        const actX = ix + tW + 24;
        const actW = iw - tW - 24;
        const lines = wrapLines(ctx, step.activity || '', actW);
        let ly = cy + 7;
        for (const line of lines) { ctx.fillText(line, actX, ly); ly += 40; }
        cy = Math.max(cy + 46, ly) + 20;
      }
      return cy - 20;
    });
  }

  // O que levar (items)
  if (date.items && date.items.length) {
    card('🎒 O que levar', (ix, iy, iw) => {
      ctx.font = '29px sans-serif'; ctx.textAlign = 'left';
      let cy = iy;
      for (const item of date.items) {
        const mark = item.packed ? '✅' : '◻️';
        ctx.fillStyle = '#27272a';
        for (const line of wrapLines(ctx, `${mark}  ${item.text}`, iw)) { ctx.fillText(line, ix, cy); cy += 42; }
      }
      return cy - 42 + 30;
    });
  }

  // Custos (opcional)
  const total = totalDateCost(date.costs || []);
  if (opts.includeCosts && (date.costs?.length || total > 0)) {
    card('💰 Custos', (ix, iy, iw) => {
      let cy = iy;
      const row = (label: string, amount: number, bold = false) => {
        ctx.font = `${bold ? 'bold ' : ''}29px sans-serif`;
        ctx.fillStyle = bold ? '#be1558' : '#3f3f46'; ctx.textAlign = 'left';
        ctx.fillText(label, ix, cy);
        ctx.textAlign = 'right';
        ctx.fillText(brl(amount), ix + iw, cy);
        cy += 44;
      };
      for (const c of date.costs || []) {
        if (!c.label && !c.amount) continue;
        const icon = c.kind === 'travel' ? '🚗' : '📍';
        row(`${icon} ${c.label || (c.kind === 'travel' ? 'Caminho' : 'Local')}`, Number(c.amount) || 0);
      }
      cy += 6;
      row('Total', total, true);
      return cy - 44 + 29;
    });
  }

  // Rodapé
  y += 8;
  centerText('feito com 💕 no Vitalis Essence', '26px sans-serif', 'rgba(255,255,255,0.9)');
  y += 64;

  const finalH = y + 40;

  // Canvas final: degradê romântico + corações + o conteúdo por cima.
  const b = document.createElement('canvas');
  b.width = W; b.height = finalH;
  const bc = b.getContext('2d')!;
  const grad = bc.createLinearGradient(0, 0, W, finalH);
  grad.addColorStop(0, '#ff8fb1');
  grad.addColorStop(0.5, '#f67eae');
  grad.addColorStop(1, '#b983ff');
  bc.fillStyle = grad; bc.fillRect(0, 0, W, finalH);
  // corações decorativos de fundo
  bc.fillStyle = 'rgba(255,255,255,0.10)';
  bc.textAlign = 'center'; bc.textBaseline = 'middle';
  const hearts = ['❤', '♥', '💗'];
  let seed = 7;
  const rnd = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
  for (let i = 0; i < 26; i++) {
    const hx = rnd() * W, hy = rnd() * finalH, hs = 28 + rnd() * 54;
    bc.font = `${hs}px sans-serif`;
    bc.fillText(hearts[i % hearts.length], hx, hy);
  }
  bc.textBaseline = 'top';
  // conteúdo por cima
  bc.drawImage(a, 0, 0, W, finalH, 0, 0, W, finalH);

  const dataUrl = b.toDataURL('image/png');
  const blob: Blob = await new Promise((res) => b.toBlob((bl) => res(bl!), 'image/png'));
  return { blob, dataUrl };
}

// Tenta compartilhar a imagem (menu nativo). Se não der, baixa o arquivo.
export async function shareOrDownloadImage(blob: Blob, fileName: string, title: string, text: string): Promise<'shared' | 'downloaded'> {
  const file = new File([blob], fileName, { type: 'image/png' });
  const nav = navigator as Navigator & { canShare?: (d: unknown) => boolean };
  if (nav.share && nav.canShare && nav.canShare({ files: [file] })) {
    try {
      await nav.share({ files: [file], title, text });
      return 'shared';
    } catch {
      // usuário cancelou ou falhou — cai no download
    }
  }
  // Fallback: baixa a imagem.
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url; link.download = fileName;
  document.body.appendChild(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
  return 'downloaded';
}
