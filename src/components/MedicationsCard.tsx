// ============================================================================
// COMPONENTE: MedicationsCard (Cartão de Medicamentos)
// Cartão onde o usuário cadastra, edita, ativa/desativa e remove seus remédios,
// definindo os horários de cada um. Mostra a lista de medicamentos ativos e uma
// seção recolhível com os inativos. O cadastro/edição acontece num diálogo (modal).
// ============================================================================
import { useState, useEffect } from 'react';
import { Pill, Plus, Clock, Trash2, Edit2, X, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { useUserMedications, type Medication, type MedicationInput } from '@/hooks/useUserMedications';
import { toast } from 'sonner';

// Lista de horários "atalho" que aparecem como botões rápidos ao cadastrar um remédio
const COMMON_TIMES = ['06:00', '08:00', '12:00', '14:00', '18:00', '20:00', '22:00'];

export function MedicationsCard() {
  // Hook de dados: traz a lista de medicamentos do banco e as funções para
  // buscar, adicionar, atualizar e remover, além do indicador de carregamento.
  const { medications, loading, fetchMedications, addMedication, updateMedication, deleteMedication } = useUserMedications();
  // Controla se o diálogo (modal) de cadastro/edição está aberto
  const [isAddOpen, setIsAddOpen] = useState(false);
  // Guarda o ID do medicamento em edição (null = estamos cadastrando um novo)
  const [editingId, setEditingId] = useState<string | null>(null);
  // Guarda o ID do medicamento cujo detalhe está expandido na lista
  const [expandedId, setExpandedId] = useState<string | null>(null);
  // Dados digitados no formulário do diálogo (nome, dosagem, horários, etc.)
  const [formData, setFormData] = useState<MedicationInput>({
    name: '',
    composition: '',
    dosage: '',
    schedule_times: [],
    notes: '',
    active: true,
  });
  // Texto do campo de horário personalizado (antes de ser adicionado à lista)
  const [customTime, setCustomTime] = useState('');
  // Indica que o formulário está sendo salvo (para desabilitar o botão)
  const [submitting, setSubmitting] = useState(false);

  // Ao montar o componente, busca os medicamentos já cadastrados
  useEffect(() => {
    fetchMedications();
  }, [fetchMedications]);

  // Limpa o formulário e volta ao modo "novo cadastro"
  const resetForm = () => {
    setFormData({
      name: '',
      composition: '',
      dosage: '',
      schedule_times: [],
      notes: '',
      active: true,
    });
    setCustomTime('');
    setEditingId(null);
  };

  // Adiciona um horário à lista do medicamento (evita repetir e mantém ordenado)
  const handleAddTime = (time: string) => {
    if (!formData.schedule_times?.includes(time)) {
      setFormData(prev => ({
        ...prev,
        schedule_times: [...(prev.schedule_times || []), time].sort(),
      }));
    }
  };

  // Remove um horário da lista do medicamento
  const handleRemoveTime = (time: string) => {
    setFormData(prev => ({
      ...prev,
      schedule_times: prev.schedule_times?.filter(t => t !== time) || [],
    }));
  };

  // Adiciona o horário personalizado digitado e limpa o campo
  const handleAddCustomTime = () => {
    if (customTime && !formData.schedule_times?.includes(customTime)) {
      handleAddTime(customTime);
      setCustomTime('');
    }
  };

  // Salva o formulário: valida o nome, decide entre atualizar ou criar,
  // mostra mensagens de sucesso/erro e fecha o diálogo quando dá certo.
  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error('Nome do medicamento é obrigatório');
      return;
    }

    setSubmitting(true);
    
    if (editingId) {
      const { error } = await updateMedication(editingId, formData);
      if (error) {
        toast.error('Erro ao atualizar medicamento');
      } else {
        toast.success('Medicamento atualizado!');
        setIsAddOpen(false);
        resetForm();
      }
    } else {
      const { error } = await addMedication(formData);
      if (error) {
        toast.error('Erro ao adicionar medicamento');
      } else {
        toast.success('Medicamento adicionado!');
        setIsAddOpen(false);
        resetForm();
      }
    }

    setSubmitting(false);
  };

  // Abre o diálogo já preenchido com os dados do medicamento escolhido para editar
  const handleEdit = (medication: Medication) => {
    setFormData({
      name: medication.name,
      composition: medication.composition || '',
      dosage: medication.dosage || '',
      schedule_times: medication.schedule_times || [],
      notes: medication.notes || '',
      active: medication.active,
    });
    setEditingId(medication.id);
    setIsAddOpen(true);
  };

  // Remove um medicamento pelo ID e avisa o resultado ao usuário
  const handleDelete = async (id: string) => {
    const { error } = await deleteMedication(id);
    if (error) {
      toast.error('Erro ao remover medicamento');
    } else {
      toast.success('Medicamento removido');
    }
  };

  // Liga/desliga o status "ativo" de um medicamento (sem abrir o diálogo)
  const handleToggleActive = async (medication: Medication) => {
    const { error } = await updateMedication(medication.id, { active: !medication.active });
    if (error) {
      toast.error('Erro ao atualizar status');
    }
  };

  // Separa os medicamentos em duas listas: os ativos e os inativos
  const activeMedications = medications.filter(m => m.active);
  const inactiveMedications = medications.filter(m => !m.active);

  return (
    <Card className="border-0 shadow-lg overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50 border-b border-emerald-100/50">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg">
              <Pill className="w-5 h-5 text-white" />
            </div>
            <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent font-bold">
              Medicamentos
            </span>
          </CardTitle>
          
          <Dialog open={isAddOpen} onOpenChange={(open) => {
            setIsAddOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-md">
                <Plus className="w-4 h-4" />
                Adicionar
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingId ? 'Editar Medicamento' : 'Novo Medicamento'}</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="med-name">Nome do Medicamento *</Label>
                  <Input
                    id="med-name"
                    placeholder="Ex: Vitamina D"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="med-dosage">Dosagem</Label>
                  <Input
                    id="med-dosage"
                    placeholder="Ex: 1000 UI, 500mg"
                    value={formData.dosage}
                    onChange={(e) => setFormData(prev => ({ ...prev, dosage: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="med-composition">Composição</Label>
                  <Textarea
                    id="med-composition"
                    placeholder="Ex: Colecalciferol (Vitamina D3)"
                    value={formData.composition}
                    onChange={(e) => setFormData(prev => ({ ...prev, composition: e.target.value }))}
                    className="min-h-[80px]"
                  />
                </div>

                <div className="space-y-3">
                  <Label>Horários</Label>
                  
                  {/* Selected times */}
                  {formData.schedule_times && formData.schedule_times.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {formData.schedule_times.map(time => (
                        <Badge
                          key={time}
                          variant="secondary"
                          className="gap-1 px-3 py-1.5 bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                        >
                          <Clock className="w-3 h-3" />
                          {time}
                          <button
                            type="button"
                            onClick={() => handleRemoveTime(time)}
                            className="ml-1 hover:text-red-500"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Quick time buttons */}
                  <div className="flex flex-wrap gap-2">
                    {COMMON_TIMES.filter(t => !formData.schedule_times?.includes(t)).map(time => (
                      <Button
                        key={time}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleAddTime(time)}
                        className="text-xs"
                      >
                        {time}
                      </Button>
                    ))}
                  </div>

                  {/* Custom time input */}
                  <div className="flex gap-2">
                    <Input
                      type="time"
                      value={customTime}
                      onChange={(e) => setCustomTime(e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAddCustomTime}
                      disabled={!customTime}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="med-notes">Observações</Label>
                  <Textarea
                    id="med-notes"
                    placeholder="Ex: Tomar em jejum, com água"
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    className="min-h-[60px]"
                  />
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <Switch
                    id="med-active"
                    checked={formData.active}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, active: checked }))}
                  />
                  <Label htmlFor="med-active" className="text-sm">
                    Medicamento ativo
                  </Label>
                </div>
              </div>

              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancelar</Button>
                </DialogClose>
                <Button 
                  onClick={handleSubmit} 
                  disabled={submitting}
                  className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
                >
                  {submitting ? 'Salvando...' : editingId ? 'Atualizar' : 'Adicionar'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>

      <CardContent className="pt-4">
        {/* Enquanto carrega mostra "esqueletos"; se vazio, um aviso; senão, as listas */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2].map(i => (
              <div key={i} className="h-20 rounded-xl bg-muted/30 animate-pulse" />
            ))}
          </div>
        ) : medications.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Pill className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">Nenhum medicamento cadastrado</p>
            <p className="text-sm">Adicione seus medicamentos para acompanhar os horários</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Active medications */}
            {activeMedications.length > 0 && (
              <div className="space-y-2">
                {activeMedications.map(med => (
                  <MedicationItem
                    key={med.id}
                    medication={med}
                    isExpanded={expandedId === med.id}
                    onToggleExpand={() => setExpandedId(expandedId === med.id ? null : med.id)}
                    onEdit={() => handleEdit(med)}
                    onDelete={() => handleDelete(med.id)}
                    onToggleActive={() => handleToggleActive(med)}
                  />
                ))}
              </div>
            )}

            {/* Inactive medications */}
            {inactiveMedications.length > 0 && (
              <Collapsible>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="w-full text-muted-foreground">
                    <span>Inativos ({inactiveMedications.length})</span>
                    <ChevronDown className="w-4 h-4 ml-2" />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-2 mt-2">
                  {inactiveMedications.map(med => (
                    <MedicationItem
                      key={med.id}
                      medication={med}
                      isExpanded={expandedId === med.id}
                      onToggleExpand={() => setExpandedId(expandedId === med.id ? null : med.id)}
                      onEdit={() => handleEdit(med)}
                      onDelete={() => handleDelete(med.id)}
                      onToggleActive={() => handleToggleActive(med)}
                    />
                  ))}
                </CollapsibleContent>
              </Collapsible>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface MedicationItemProps {
  medication: Medication;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onToggleActive: () => void;
}

// Sub-componente que desenha UM item da lista de medicamentos: nome, dosagem,
// horários e, ao expandir, a composição/observações com os botões Editar e Remover.
function MedicationItem({ medication, isExpanded, onToggleExpand, onEdit, onDelete, onToggleActive }: MedicationItemProps) {
  return (
    <div 
      className={`rounded-xl border-2 transition-all ${
        medication.active 
          ? 'bg-card border-emerald-200 hover:border-emerald-300' 
          : 'bg-muted/30 border-border/50 opacity-60'
      }`}
    >
      <div 
        className="flex items-center gap-3 p-3 cursor-pointer"
        onClick={onToggleExpand}
      >
        <div className={`p-2 rounded-lg ${medication.active ? 'bg-emerald-100' : 'bg-muted'}`}>
          <Pill className={`w-4 h-4 ${medication.active ? 'text-emerald-600' : 'text-muted-foreground'}`} />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-semibold truncate">{medication.name}</p>
            {medication.dosage && (
              <Badge variant="secondary" className="text-xs shrink-0">
                {medication.dosage}
              </Badge>
            )}
          </div>
          
          {medication.schedule_times && medication.schedule_times.length > 0 && (
            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
              {medication.schedule_times.map((time, idx) => (
                <Badge key={idx} variant="outline" className="text-xs gap-1 bg-muted/50">
                  <Clock className="w-2.5 h-2.5" />
                  {time}
                </Badge>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1">
          <Switch
            checked={medication.active}
            onCheckedChange={() => onToggleActive()}
            onClick={(e) => e.stopPropagation()}
            className="data-[state=checked]:bg-primary"
          />
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          )}
        </div>
      </div>

      {isExpanded && (
        <div className="px-3 pb-3 pt-0 border-t border-border/50">
          <div className="pt-3 space-y-2">
            {medication.composition && (
              <div>
                <p className="text-xs font-medium text-muted-foreground">Composição</p>
                <p className="text-sm">{medication.composition}</p>
              </div>
            )}
            
            {medication.notes && (
              <div>
                <p className="text-xs font-medium text-muted-foreground">Observações</p>
                <p className="text-sm">{medication.notes}</p>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={onEdit} className="flex-1 gap-1">
                <Edit2 className="w-3 h-3" />
                Editar
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1 text-red-600 hover:text-red-700 hover:bg-red-50">
                    <Trash2 className="w-3 h-3" />
                    Remover
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Remover medicamento?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Tem certeza que deseja remover "{medication.name}"? Esta ação não pode ser desfeita.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={onDelete} className="bg-red-600 hover:bg-red-700">
                      Remover
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
