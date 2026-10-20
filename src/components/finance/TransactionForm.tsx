// ============================================================================
// TransactionForm — Formulário para criar ou editar um lançamento financeiro
// (uma entrada ou saída de dinheiro). Permite definir valor, data, centro de
// custo, forma de pagamento, banco, recorrência/parcelamento e anexos. Também
// trata a edição de lançamentos recorrentes (aplicar só a este ou a partir de
// uma data).
// ============================================================================
import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import { ArrowDownLeft, ArrowUpRight, Repeat, Plus, Paperclip, X, FileText, Image } from 'lucide-react';
import type { CostCenter, TransactionInput, FinancialTransaction } from '@/hooks/useFinancialFlow';

interface TransactionFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  costCenters: CostCenter[];
  onSubmit: (input: TransactionInput, files?: File[]) => void;
  onAddCostCenter: (name: string, icon?: string) => void;
  initialType?: 'income' | 'expense';
  editTransaction?: FinancialTransaction | null;
  onUpdate?: (id: string, input: Partial<TransactionInput>, scope: 'single' | 'from_date', fromDate?: string) => void;
  savedBanks?: string[];
}

export function TransactionForm({ open, onOpenChange, costCenters, onSubmit, onAddCostCenter, initialType = 'expense', editTransaction, onUpdate, savedBanks = [] }: TransactionFormProps) {
  // Tipo do lançamento: entrada (income) ou saída (expense).
  const [type, setType] = useState<'income' | 'expense'>(initialType);
  // Descrição/nome do lançamento (ex: "Salário", "Aluguel").
  const [description, setDescription] = useState('');
  // Valor digitado (mantido como texto para o campo de entrada).
  const [amount, setAmount] = useState('');
  // Data do lançamento; começa com a data de hoje.
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  // Centro de custo selecionado ("none" = sem centro de custo).
  const [costCenterId, setCostCenterId] = useState<string>('none');
  // Se o lançamento é planejado (hipótese) em vez de real.
  const [isPlanned, setIsPlanned] = useState(false);
  // Se o lançamento se repete no tempo (recorrente).
  const [isRecurring, setIsRecurring] = useState(false);
  // Modo da recorrência: parcelado (nº fixo) ou contínuo (mensal indefinido).
  const [recurrenceMode, setRecurrenceMode] = useState<'installments' | 'continuous'>('installments');
  // Unidade de tempo da recorrência: dias, semanas, meses ou anos.
  const [recurrenceType, setRecurrenceType] = useState<string>('months');
  // A cada quantas unidades ele se repete (ex: a cada 2 meses).
  const [recurrenceInterval, setRecurrenceInterval] = useState('1');
  // Número de parcelas quando é parcelado (2 a 12).
  const [installments, setInstallments] = useState('2');
  // Se o valor informado deve ser dividido entre as parcelas.
  const [splitTotal, setSplitTotal] = useState(false);
  // Observações adicionais (opcional).
  const [notes, setNotes] = useState('');
  // Forma de pagamento (pix, boleto, dinheiro, cartão) ou "none".
  const [paymentMethod, setPaymentMethod] = useState<string>('none');
  // Nome do banco/cartão associado ao lançamento.
  const [cardBank, setCardBank] = useState('');
  // Se o usuário está digitando um banco novo em vez de escolher um salvo.
  const [isAddingNewBank, setIsAddingNewBank] = useState(false);
  // Se o campo para criar um novo centro de custo está visível.
  const [showNewCostCenter, setShowNewCostCenter] = useState(false);
  // Nome do novo centro de custo sendo digitado.
  const [newCostCenterName, setNewCostCenterName] = useState('');
  // Lista de arquivos anexados ao lançamento.
  const [files, setFiles] = useState<File[]>([]);
  // Referência ao campo de arquivo escondido (para abrir o seletor via botão).
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Estados do diálogo de confirmação ao editar um lançamento recorrente.
  const [showRecurringDialog, setShowRecurringDialog] = useState(false);
  // Data a partir da qual aplicar a alteração da recorrência.
  const [recurringFromDate, setRecurringFromDate] = useState('');
  // Guarda temporariamente os dados a salvar enquanto o usuário confirma o escopo.
  const [pendingInput, setPendingInput] = useState<TransactionInput | null>(null);

  // Verdadeiro quando estamos editando um lançamento existente (e não criando).
  const isEditing = !!editTransaction;
  // Verdadeiro quando o lançamento editado faz parte de uma recorrência.
  const isRecurringEdit = isEditing && (editTransaction?.is_recurring || !!editTransaction?.parent_transaction_id);

  // Ao abrir o formulário: preenche os campos com o lançamento (se estiver
  // editando) ou zera tudo para um novo lançamento em branco.
  useEffect(() => {
    if (open && editTransaction) {
      setType(editTransaction.type);
      setDescription(editTransaction.description);
      setAmount(String(editTransaction.amount));
      setDate(editTransaction.date);
      setIsPlanned(editTransaction.is_planned || false);
      setCostCenterId(editTransaction.cost_center_id || 'none');
      setIsRecurring(editTransaction.is_recurring);
      setRecurrenceType(editTransaction.recurrence_type || 'months');
      setRecurrenceInterval(String(editTransaction.recurrence_interval || 1));
      setInstallments('2');
      setSplitTotal(false);
      setNotes(editTransaction.notes || '');
      setPaymentMethod(editTransaction.payment_method || 'none');
      setCardBank(editTransaction.card_bank || '');
      setIsAddingNewBank(false);
      setFiles([]);

      // Use saved recurrence_mode, fallback to installments
      setRecurrenceMode(editTransaction.recurrence_mode === 'continuous' ? 'continuous' : 'installments');
    } else if (open && !editTransaction) {
      setType(initialType);
      setDescription('');
      setAmount('');
      setDate(new Date().toISOString().split('T')[0]);
      setIsPlanned(false);
      setCostCenterId('none');
      setIsRecurring(false);
      setRecurrenceMode('installments');
      setRecurrenceType('months');
      setRecurrenceInterval('1');
      setInstallments('2');
      setSplitTotal(false);
      setNotes('');
      setPaymentMethod('none');
      setCardBank('');
      setIsAddingNewBank(false);
      setFiles([]);
    }
  }, [open, editTransaction, initialType]);

  // Calcula o valor de cada parcela: se o usuário optou por dividir o total,
  // divide o valor pelo número de parcelas; senão usa o valor cheio.
  const computedAmount = (() => {
    if (isRecurring && recurrenceMode === 'installments' && splitTotal && amount) {
      const total = parseFloat(amount);
      const count = parseInt(installments) || 2;
      return Math.round((total / count) * 100) / 100;
    }
    return parseFloat(amount);
  })();

  const buildInput = (): TransactionInput => ({
    type,
    description: description.trim(),
    amount: computedAmount,
    date,
    cost_center_id: costCenterId === 'none' ? null : costCenterId,
    is_recurring: isRecurring,
    recurrence_type: isRecurring ? recurrenceType : null,
    recurrence_interval: isRecurring ? parseInt(recurrenceInterval) || 1 : null,
    installments: isRecurring && recurrenceMode === 'installments' ? parseInt(installments) || 2 : null,
    recurrence_mode: isRecurring ? recurrenceMode : null,
    notes: notes.trim() || null,
    payment_method: paymentMethod === 'none' ? null : paymentMethod,
    card_bank: cardBank.trim() || null,
    is_planned: isPlanned,
  });

  const handleSubmit = () => {
    if (!description.trim() || !amount) return;
    const input = buildInput();

    if (isEditing && onUpdate && editTransaction) {
      if (isRecurringEdit) {
        setPendingInput(input);
        setRecurringFromDate(editTransaction.date);
        setShowRecurringDialog(true);
        return;
      }
      onUpdate(editTransaction.id, input, 'single');
    } else {
      onSubmit(input, files.length > 0 ? files : undefined);
    }
    onOpenChange(false);
  };

  const handleRecurringConfirm = (scope: 'single' | 'from_date') => {
    if (!pendingInput || !editTransaction || !onUpdate) return;
    if (scope === 'from_date') {
      onUpdate(editTransaction.id, pendingInput, 'from_date', recurringFromDate);
    } else {
      onUpdate(editTransaction.id, pendingInput, 'single');
    }
    setShowRecurringDialog(false);
    setPendingInput(null);
    onOpenChange(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(prev => [...prev, ...Array.from(e.target.files!)]);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return <Image className="w-3.5 h-3.5" />;
    return <FileText className="w-3.5 h-3.5" />;
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Editar Lançamento' : 'Novo Lançamento'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            {/* Type toggle */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setType('income')}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl font-semibold text-sm transition-all ${
                  type === 'income'
                    ? 'bg-emerald-500/15 text-emerald-600 ring-2 ring-emerald-500/30'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                <ArrowDownLeft className="w-4 h-4" />
                Entrada
              </button>
              <button
                type="button"
                onClick={() => setType('expense')}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl font-semibold text-sm transition-all ${
                  type === 'expense'
                    ? 'bg-red-500/15 text-red-600 ring-2 ring-red-500/30'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                <ArrowUpRight className="w-4 h-4" />
                Saída
              </button>
            </div>

            {/* Real x Planejado */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setIsPlanned(false)}
                className={`flex items-center justify-center gap-2 p-2.5 rounded-xl font-semibold text-xs transition-all ${
                  !isPlanned ? 'bg-[hsl(var(--finance))]/15 text-[hsl(var(--finance))] ring-2 ring-[hsl(var(--finance))]/30' : 'bg-muted text-muted-foreground'
                }`}
              >
                💰 Real
              </button>
              <button
                type="button"
                onClick={() => setIsPlanned(true)}
                className={`flex items-center justify-center gap-2 p-2.5 rounded-xl font-semibold text-xs transition-all ${
                  isPlanned ? 'bg-amber-500/15 text-amber-600 ring-2 ring-amber-500/30' : 'bg-muted text-muted-foreground'
                }`}
              >
                🔮 Planejado
              </button>
            </div>
            {isPlanned && (
              <p className="text-[10px] text-amber-600 -mt-2">
                Planejado: só para organizar o planejamento. Não entra no saldo real nem conta como pago.
              </p>
            )}

            <div>
              <Label>Descrição</Label>
              <Input
                placeholder="Ex: Salário, Aluguel..."
                value={description}
                onChange={e => setDescription(e.target.value.toUpperCase())}
                className="rounded-xl mt-1 uppercase"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Valor (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0,00"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  className="rounded-xl mt-1"
                />
              </div>
              <div>
                <Label>Data</Label>
                <Input
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="rounded-xl mt-1"
                />
              </div>
            </div>

            <div>
              <Label>Centro de Custo</Label>
              {!showNewCostCenter ? (
                <div className="flex gap-2 mt-1">
                  <Select value={costCenterId} onValueChange={setCostCenterId}>
                    <SelectTrigger className="rounded-xl flex-1">
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sem centro de custo</SelectItem>
                      {costCenters.map(cc => (
                        <SelectItem key={cc.id} value={cc.id}>
                          {cc.icon} {cc.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="rounded-xl shrink-0"
                    onClick={() => setShowNewCostCenter(true)}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex gap-2 mt-1">
                  <Input
                    placeholder="Nome do centro de custo"
                    value={newCostCenterName}
                    onChange={e => setNewCostCenterName(e.target.value)}
                    className="rounded-xl flex-1"
                    autoFocus
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="rounded-xl shrink-0"
                    disabled={!newCostCenterName.trim()}
                    onClick={() => {
                      onAddCostCenter(newCostCenterName.trim());
                      setNewCostCenterName('');
                      setShowNewCostCenter(false);
                    }}
                  >
                    Salvar
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="rounded-xl shrink-0"
                    onClick={() => {
                      setShowNewCostCenter(false);
                      setNewCostCenterName('');
                    }}
                  >
                    Cancelar
                  </Button>
                </div>
              )}
            </div>

            {/* Payment Method */}
            <div>
              <Label>Forma de Pagamento</Label>
              <div className="grid grid-cols-4 gap-2 mt-1">
                {[
                  { value: 'pix', label: 'PIX', icon: '⚡' },
                  { value: 'boleto', label: 'Boleto', icon: '📄' },
                  { value: 'dinheiro', label: 'Dinheiro', icon: '💵' },
                  { value: 'cartao', label: 'Cartão', icon: '💳' },
                ].map(pm => (
                  <button
                    key={pm.value}
                    type="button"
                    onClick={() => setPaymentMethod(paymentMethod === pm.value ? 'none' : pm.value)}
                    className={`flex flex-col items-center gap-1 p-2.5 rounded-xl text-xs font-semibold transition-all ${
                      paymentMethod === pm.value
                        ? 'bg-primary/15 text-primary ring-2 ring-primary/30'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    <span className="text-base">{pm.icon}</span>
                    {pm.label}
                  </button>
                ))}
              </div>

            </div>

            {/* Bank field — always visible */}
            <div>
              <Label>Banco</Label>
              {savedBanks.length > 0 && !cardBank && !isAddingNewBank ? (
                <div className="flex gap-2 mt-1">
                  <Select value="" onValueChange={(v) => { if (v === '__new__') { setIsAddingNewBank(true); } else { setCardBank(v); } }}>
                    <SelectTrigger className="rounded-xl flex-1">
                      <SelectValue placeholder="Selecione o banco..." />
                    </SelectTrigger>
                    <SelectContent>
                      {savedBanks.map(b => (
                        <SelectItem key={b} value={b}>{b}</SelectItem>
                      ))}
                      <SelectItem value="__new__">+ Novo banco</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="flex gap-2 mt-1">
                  <Input
                    placeholder="Ex: Nubank, Itaú, Inter..."
                    value={cardBank}
                    onChange={e => setCardBank(e.target.value)}
                    className="rounded-xl flex-1"
                    autoFocus={isAddingNewBank}
                  />
                  {savedBanks.length > 0 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="rounded-xl shrink-0 text-xs"
                      onClick={() => { setCardBank(''); setIsAddingNewBank(false); }}
                    >
                      Voltar
                    </Button>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
              <div className="flex items-center gap-2">
                <Repeat className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">Recorrente</span>
              </div>
              <Switch checked={isRecurring} onCheckedChange={setIsRecurring} />
            </div>

            {isRecurring && (
              <div className="space-y-3 p-3 rounded-xl bg-muted/30 border border-border/50">
                {/* Mode toggle */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRecurrenceMode('installments')}
                    className={`p-2 rounded-lg text-xs font-semibold transition-all ${
                      recurrenceMode === 'installments'
                        ? 'bg-primary/15 text-primary ring-2 ring-primary/30'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    Parcelado (2-12x)
                  </button>
                  <button
                    type="button"
                    onClick={() => setRecurrenceMode('continuous')}
                    className={`p-2 rounded-lg text-xs font-semibold transition-all ${
                      recurrenceMode === 'continuous'
                        ? 'bg-primary/15 text-primary ring-2 ring-primary/30'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    Contínuo (mensal)
                  </button>
                </div>

                {recurrenceMode === 'installments' && (
                  <>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <Label className="text-xs">Parcelas</Label>
                        <Select value={installments} onValueChange={setInstallments}>
                          <SelectTrigger className="rounded-xl mt-1 h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {[2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(n => (
                              <SelectItem key={n} value={String(n)}>{n}x</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs">A cada</Label>
                        <Input
                          type="number"
                          min="1"
                          value={recurrenceInterval}
                          onChange={e => setRecurrenceInterval(e.target.value)}
                          className="rounded-xl mt-1 h-9"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Período</Label>
                        <Select value={recurrenceType} onValueChange={setRecurrenceType}>
                          <SelectTrigger className="rounded-xl mt-1 h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="days">Dia(s)</SelectItem>
                            <SelectItem value="weeks">Semana(s)</SelectItem>
                            <SelectItem value="months">Mês(es)</SelectItem>
                            <SelectItem value="years">Ano(s)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Split total option */}
                    <div className="flex items-center justify-between p-2 rounded-lg bg-background/50">
                      <span className="text-xs font-medium">Parcelar valor total</span>
                      <Switch checked={splitTotal} onCheckedChange={setSplitTotal} />
                    </div>

                    {splitTotal && amount && parseFloat(amount) > 0 && (
                      <p className="text-[11px] text-emerald-600 font-medium">
                        Cada parcela: R$ {(parseFloat(amount) / (parseInt(installments) || 2)).toFixed(2)}
                      </p>
                    )}

                    <p className="text-[11px] text-muted-foreground">
                      {splitTotal
                        ? `${parseInt(installments)}x de R$ ${(computedAmount || 0).toFixed(2)} (total: R$ ${(parseFloat(amount) || 0).toFixed(2)})`
                        : `${parseInt(installments)}x de R$ ${(parseFloat(amount) || 0).toFixed(2)} (total: R$ ${((parseFloat(amount) || 0) * (parseInt(installments) || 2)).toFixed(2)})`
                      }
                    </p>
                  </>
                )}

                {recurrenceMode === 'continuous' && (
                  <p className="text-[11px] text-muted-foreground">
                    Será repetido mensalmente por tempo indeterminado (próximos 12 meses projetados).
                  </p>
                )}
              </div>
            )}

            <div>
              <Label>Observações (opcional)</Label>
              <Input
                placeholder="Notas adicionais..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="rounded-xl mt-1"
              />
            </div>

            {/* File Attachments */}
            <div>
              <Label>Anexos (opcional)</Label>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                onChange={handleFileSelect}
                className="hidden"
              />
              <div className="mt-1 space-y-2">
                {files.length > 0 && (
                  <div className="space-y-1.5">
                    {files.map((file, i) => (
                      <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 text-xs">
                        {getFileIcon(file)}
                        <span className="flex-1 truncate">{file.name}</span>
                        <button type="button" onClick={() => removeFile(i)} className="text-muted-foreground hover:text-destructive">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-xl w-full text-xs gap-1.5"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Paperclip className="w-3.5 h-3.5" />
                  Anexar arquivo ou imagem
                </Button>
              </div>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={!description.trim() || !amount}
              className="w-full rounded-xl h-12 font-bold gradient-finance text-white"
            >
              {isEditing ? 'Salvar Alterações' : 'Salvar Lançamento'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Recurring edit confirmation dialog */}
      <AlertDialog open={showRecurringDialog} onOpenChange={setShowRecurringDialog}>
        <AlertDialogContent className="rounded-2xl max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Editar recorrência</AlertDialogTitle>
            <AlertDialogDescription>
              Este lançamento faz parte de uma recorrência. Como deseja aplicar as alterações?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-3">
            <Button
              className="w-full rounded-xl gradient-finance text-white"
              onClick={() => handleRecurringConfirm('single')}
            >
              Apenas este lançamento
            </Button>
            <div className="space-y-2 p-3 rounded-xl bg-muted/30 border border-border/50">
              <p className="text-xs font-medium">A partir de uma data específica:</p>
              <Input
                type="date"
                value={recurringFromDate}
                onChange={e => setRecurringFromDate(e.target.value)}
                className="rounded-xl h-9"
              />
              <Button
                variant="outline"
                className="w-full rounded-xl"
                disabled={!recurringFromDate}
                onClick={() => handleRecurringConfirm('from_date')}
              >
                Alterar a partir desta data
              </Button>
            </div>
            <AlertDialogCancel className="w-full rounded-xl mt-0">Cancelar</AlertDialogCancel>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
