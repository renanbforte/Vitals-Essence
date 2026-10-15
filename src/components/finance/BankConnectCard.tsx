// ============================================================================
// BankConnectCard — Conectar banco (Open Finance)
// ----------------------------------------------------------------------------
// Ponto de entrada da conexão bancária automática (via Open Finance). A
// integração real (agregador Pluggy) ainda será ligada; por enquanto o card
// explica o que vem e oferece o caminho manual de cadastrar saldos, que já
// funciona. Assim o lugar na interface já existe e fica honesto sobre o status.
// ============================================================================
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Landmark, Sparkles, Plus, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface BankConnectCardProps {
  // Abre o fluxo atual de cadastrar banco/saldo manualmente (já existente).
  onAddManual: () => void;
}

export function BankConnectCard({ onAddManual }: BankConnectCardProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <motion.button
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        onClick={() => setOpen(true)}
        className="w-full text-left glass-card rounded-2xl p-4 flex items-center gap-3 hover:shadow-md transition-shadow"
      >
        <div className="w-11 h-11 rounded-2xl gradient-finance flex items-center justify-center shadow-md shrink-0">
          <Landmark className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-bold">Conectar banco</p>
            <span className="text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-[hsl(var(--finance))]/15 text-[hsl(var(--finance))]">
              Em breve
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground truncate">
            Importe entradas e saídas automaticamente via Open Finance
          </p>
        </div>
        <Sparkles className="w-4 h-4 text-[hsl(var(--finance))] shrink-0" />
      </motion.button>

      {/* Explica a conexão automática e oferece o cadastro manual por enquanto */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-2xl max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Landmark className="w-5 h-5 text-[hsl(var(--finance))]" />
              Conexão bancária
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Em breve você vai conectar seus bancos com segurança pelo Open Finance:
              as entradas e saídas entram sozinhas, sem digitar nada, e o saldo se
              atualiza automaticamente.
            </p>
            <div className="flex items-start gap-2 rounded-xl bg-[hsl(var(--finance-light))] p-3">
              <ShieldCheck className="w-4 h-4 text-[hsl(var(--finance))] mt-0.5 shrink-0" />
              <p className="text-[11px] text-muted-foreground">
                A conexão é só de leitura e autorizada por você no seu banco — o app
                nunca guarda sua senha.
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              Enquanto isso, você já pode cadastrar seus bancos e saldos manualmente:
            </p>
            <Button
              onClick={() => { setOpen(false); onAddManual(); }}
              className="w-full rounded-xl h-11 gradient-finance text-white font-bold gap-2"
            >
              <Plus className="w-4 h-4" />
              Adicionar banco manualmente
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
