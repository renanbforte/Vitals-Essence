// ============================================================================
// recurrence — RECORRÊNCIA CONTÍNUA SEM LIMITE
// ----------------------------------------------------------------------------
// Uma recorrência "contínua" (mensal sem prazo) não tem número fixo de parcelas.
// Em vez de criar 60 de uma vez, o app materializa as ocorrências sob demanda:
// quando você olha um mês mais à frente, estas funções garantem que as
// ocorrências existam até aquela data. Assim dá para ver sem limites.
//
// IMPORTANTE (correção de duplicação): as ocorrências são agrupadas por SÉRIE
// LÓGICA (tipo + descrição + categoria + ritmo), NÃO pelo vínculo de pai. Assim,
// se o "pai" de uma série for apagado (o banco zera o parent_transaction_id dos
// filhos, deixando-os órfãos), eles continuam sendo UMA série só — e não viram
// várias séries novas que se multiplicam a cada navegação. Além disso:
//   • nunca reinsere uma data que já existe na série (idempotente);
//   • lê TODAS as linhas paginando (o Supabase devolve só 1000 por consulta);
//   • serializa as chamadas, para duas telas não materializarem em paralelo.
// ============================================================================
import { supabase } from '@/integrations/supabase/client';
import { addDays, addWeeks, addMonths, addYears, parseISO, format } from 'date-fns';

// Próxima data conforme a unidade e o intervalo da recorrência.
export function stepDate(d: Date, type: string | null, interval: number): Date {
  const i = interval || 1;
  switch (type) {
    case 'days': return addDays(d, i);
    case 'weeks': return addWeeks(d, i);
    case 'years': return addYears(d, i);
    case 'months':
    default: return addMonths(d, i);
  }
}

// Linha mínima que buscamos para materializar.
interface Row {
  id: string;
  type: string;
  description: string;
  amount: number;
  date: string;
  cost_center_id: string | null;
  recurrence_type: string | null;
  recurrence_interval: number | null;
  recurrence_end_date: string | null;
  is_planned: boolean | null;
  payment_method: string | null;
  card_bank: string | null;
  notes: string | null;
  parent_transaction_id: string | null;
}

// Identidade da SÉRIE lógica (o que faz dois lançamentos serem "a mesma recorrência").
// Não inclui o valor de propósito: parcelas editadas com valor diferente continuam
// na mesma série.
function chaveSerie(r: Pick<Row, 'type' | 'description' | 'cost_center_id' | 'recurrence_type' | 'recurrence_interval'>): string {
  return [r.type, r.description, r.cost_center_id ?? '', r.recurrence_type ?? 'months', r.recurrence_interval ?? 1].join('§');
}

// Busca todas as ocorrências contínuas do usuário, paginando (limite de 1000/consulta).
async function buscarContinuas(userId: string): Promise<Row[]> {
  const pageSize = 1000;
  const all: Row[] = [];
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await supabase
      .from('financial_transactions')
      .select('id, type, description, amount, date, cost_center_id, recurrence_type, recurrence_interval, recurrence_end_date, is_planned, payment_method, card_bank, notes, parent_transaction_id')
      .eq('user_id', userId)
      .eq('is_recurring', true)
      .eq('recurrence_mode', 'continuous')
      .order('date', { ascending: true })
      .range(from, from + pageSize - 1);
    if (error || !data || data.length === 0) break;
    all.push(...(data as Row[]));
    if (data.length < pageSize) break;
  }
  return all;
}

async function materializar(userId: string, uptoISO: string): Promise<boolean> {
  const target = parseISO(uptoISO + 'T00:00:00');
  const rows = await buscarContinuas(userId);
  if (!rows.length) return false;

  // Agrupa por série lógica (não por parent_transaction_id).
  const grupos = new Map<string, Row[]>();
  for (const r of rows) {
    const k = chaveSerie(r);
    const g = grupos.get(k);
    if (g) g.push(r);
    else grupos.set(k, [r]);
  }

  const inserts: Record<string, unknown>[] = [];
  for (const [, g] of grupos) {
    // A "cabeça" da série: a ocorrência de pai nulo, se existir; senão a mais antiga.
    // (As duplicatas antigas podem ter várias cabeças; aqui escolhemos UMA e tratamos
    // o grupo como uma série só, parando a multiplicação.)
    const head = g.find((r) => !r.parent_transaction_id) ?? [...g].sort((a, b) => a.date.localeCompare(b.date))[0];
    // Respeita a data de término, se a série tiver uma.
    const fim = g.map((r) => r.recurrence_end_date).filter(Boolean).sort().pop() ?? null;
    const end = fim ? parseISO(fim + 'T00:00:00') : null;
    const limit = end && end < target ? end : target;

    // Datas que já existem nesta série — nunca criamos uma data repetida.
    const existentes = new Set(g.map((r) => r.date));
    const maxData = g.reduce((m, r) => (r.date > m ? r.date : m), g[0].date);

    let d = parseISO(maxData + 'T00:00:00');
    const interval = head.recurrence_interval || 1;
    const type = head.recurrence_type || 'months';
    for (let guard = 0; guard < 600; guard++) {
      const next = stepDate(d, type, interval);
      if (next > limit) break;
      d = next;
      const iso = format(next, 'yyyy-MM-dd');
      if (existentes.has(iso)) continue; // idempotente: não duplica data já existente
      existentes.add(iso);
      inserts.push({
        user_id: userId,
        type: head.type,
        description: head.description,
        amount: head.amount,
        date: iso,
        cost_center_id: head.cost_center_id,
        is_recurring: true,
        recurrence_type: type,
        recurrence_interval: interval,
        recurrence_mode: 'continuous',
        is_planned: head.is_planned,
        payment_method: head.payment_method,
        card_bank: head.card_bank,
        notes: head.notes,
        parent_transaction_id: head.id,
      });
    }
  }

  if (inserts.length) {
    await supabase.from('financial_transactions').insert(inserts);
    return true;
  }
  return false;
}

// Serializa as chamadas: se duas telas (Fluxo e Desempenho) pedirem ao mesmo tempo,
// a segunda espera a primeira terminar e já enxerga o que foi criado — não duplica.
let fila: Promise<unknown> = Promise.resolve();

// Garante que as recorrências CONTÍNUAS do usuário tenham ocorrências até a data
// informada (uptoISO, 'yyyy-MM-dd'). Cria as que faltam. Retorna true se criou
// alguma (para a tela recarregar).
export async function extendContinuousRecurrences(userId: string, uptoISO: string): Promise<boolean> {
  const run = fila.then(
    () => materializar(userId, uptoISO),
    () => materializar(userId, uptoISO),
  );
  fila = run.catch(() => {});
  return run;
}
