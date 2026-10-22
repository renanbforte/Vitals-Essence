// ============================================================================
// HubCustomizeDialog — PERSONALIZAR O MENU PRINCIPAL
// ----------------------------------------------------------------------------
// Deixa o usuário escolher quais módulos aparecem no menu e em que ordem.
// As mudanças são aplicadas na hora (o menu atrás atualiza) e salvas no
// aparelho. Reordena com as setas ↑/↓ e mostra/esconde com o olho.
// ============================================================================
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ChevronUp, ChevronDown, Eye, EyeOff, RotateCcw } from 'lucide-react';

export interface HubModuleLite {
  id: string;
  title: string;
  icon: React.ElementType;
  color: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  modules: HubModuleLite[];   // todos os módulos (na ordem base)
  order: string[];            // ordem atual (ids)
  hidden: string[];           // ids ocultos
  onChange: (order: string[], hidden: string[]) => void;
  onReset: () => void;
}

export function HubCustomizeDialog({ open, onOpenChange, modules, order, hidden, onChange, onReset }: Props) {
  const byId = Object.fromEntries(modules.map(m => [m.id, m]));
  // Ordena os módulos pela ordem salva; novos (sem ordem) vão para o fim.
  const ordered = [
    ...order.map(id => byId[id]).filter(Boolean),
    ...modules.filter(m => !order.includes(m.id)),
  ];

  const move = (index: number, dir: -1 | 1) => {
    const ids = ordered.map(m => m.id);
    const j = index + dir;
    if (j < 0 || j >= ids.length) return;
    [ids[index], ids[j]] = [ids[j], ids[index]];
    onChange(ids, hidden);
  };

  const toggleHidden = (id: string) => {
    const next = hidden.includes(id) ? hidden.filter(h => h !== id) : [...hidden, id];
    onChange(ordered.map(m => m.id), next);
  };

  const visibleCount = ordered.filter(m => !hidden.includes(m.id)).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm max-h-[88vh] overflow-hidden flex flex-col rounded-2xl">
        <DialogHeader>
          <DialogTitle>Personalizar menu</DialogTitle>
          <DialogDescription>Escolha quais módulos aparecem e a ordem. As mudanças são salvas no aparelho.</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto -mx-1 px-1 space-y-2">
          {ordered.map((mod, index) => {
            const isHidden = hidden.includes(mod.id);
            const Icon = mod.icon;
            return (
              <div
                key={mod.id}
                className={`flex items-center gap-2 rounded-xl border p-2 transition-all ${isHidden ? 'border-border bg-muted/30 opacity-60' : 'border-border bg-card'}`}
              >
                {/* Setas de ordem */}
                <div className="flex flex-col">
                  <button onClick={() => move(index, -1)} disabled={index === 0} className="text-muted-foreground disabled:opacity-20 hover:text-foreground">
                    <ChevronUp className="w-4 h-4" />
                  </button>
                  <button onClick={() => move(index, 1)} disabled={index === ordered.length - 1} className="text-muted-foreground disabled:opacity-20 hover:text-foreground">
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>
                {/* Ícone colorido */}
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: isHidden ? 'hsl(var(--muted))' : mod.color }}>
                  <Icon className={`w-4.5 h-4.5 ${isHidden ? 'text-muted-foreground' : 'text-white'}`} style={{ width: 18, height: 18 }} />
                </div>
                <span className={`flex-1 text-sm font-semibold ${isHidden ? 'text-muted-foreground line-through' : ''}`}>{mod.title}</span>
                {/* Mostrar / ocultar */}
                <Button
                  size="icon"
                  variant="ghost"
                  className={`h-8 w-8 rounded-lg ${isHidden ? 'text-muted-foreground' : 'text-[hsl(var(--finance))]'}`}
                  onClick={() => toggleHidden(mod.id)}
                  title={isHidden ? 'Mostrar no menu' : 'Ocultar do menu'}
                  disabled={!isHidden && visibleCount <= 1}
                >
                  {isHidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between pt-1">
          <Button variant="ghost" size="sm" onClick={onReset} className="text-xs gap-1.5 text-muted-foreground">
            <RotateCcw className="w-3.5 h-3.5" /> Restaurar padrão
          </Button>
          <Button size="sm" onClick={() => onOpenChange(false)} className="rounded-xl">Concluir</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
