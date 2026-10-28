// ============================================================================
// recurrence — RECORRÊNCIA CONTÍNUA SEM LIMITE
// ----------------------------------------------------------------------------
// Uma recorrência "contínua" (mensal sem prazo) não tem número fixo de parcelas.
// Em vez de criar 60 de uma vez, o app materializa as ocorrências sob demanda:
// quando você olha um mês mais à frente, estas funções garantem que as
// ocorrências existam até aquela data. Assim dá para ver sem limites.
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

// Garante que as recorrências CONTÍNUAS do usuário tenham ocorrências até a data
// informada (uptoISO, 'yyyy-MM-dd'). Cria as que faltam. Retorna true se criou
// alguma (para a tela recarregar). Tem um teto de segurança por chamada.
export async function extendContinuousRecurrences(userId: string, uptoISO: string): Promise<boolean> {
  const target = parseISO(uptoISO + 'T00:00:00');
  // Pais das séries contínuas (sem parcela definida e sem data de término).
  const { data: parents, error } = await supabase
    .from('financial_transactions')
    .select('id, type, description, amount, cost_center_id, recurrence_type, recurrence_interval, recurrence_mode, recurrence_end_date, is_planned, payment_method, card_bank, notes')
    .eq('user_id', userId)
    .eq('is_recurring', true)
    .eq('recurrence_mode', 'continuous')
    .is('parent_transaction_id', null);
  if (error || !parents?.length) return false;

  let createdAny = false;
  for (const p of parents) {
    // Se a série tem data de término, respeita-a.
    const end = p.recurrence_end_date ? parseISO(p.recurrence_end_date + 'T00:00:00') : null;
    const limit = end && end < target ? end : target;

    // Última ocorrência já materializada desta série.
    const { data: last } = await supabase
      .from('financial_transactions')
      .select('date')
      .or(`id.eq.${p.id},parent_transaction_id.eq.${p.id}`)
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(1);
    if (!last?.length) continue;

    let d = parseISO(last[0].date + 'T00:00:00');
    const interval = p.recurrence_interval || 1;
    const type = p.recurrence_type || 'months';
    const inserts: Record<string, unknown>[] = [];
    for (let guard = 0; guard < 600; guard++) {
      const next = stepDate(d, type, interval);
      if (next > limit) break;
      inserts.push({
        user_id: userId,
        type: p.type,
        description: p.description,
        amount: p.amount,
        date: format(next, 'yyyy-MM-dd'),
        cost_center_id: p.cost_center_id,
        is_recurring: true,
        recurrence_type: type,
        recurrence_interval: interval,
        recurrence_mode: 'continuous',
        is_planned: p.is_planned,
        payment_method: p.payment_method,
        card_bank: p.card_bank,
        notes: p.notes,
        parent_transaction_id: p.id,
      });
      d = next;
    }
    if (inserts.length) {
      await supabase.from('financial_transactions').insert(inserts);
      createdAny = true;
    }
  }
  return createdAny;
}
