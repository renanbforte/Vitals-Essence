// ============================================================================
// EditExamDialog — Janela (diálogo) para EDITAR um exame já enviado.
// Permite ao usuário mudar o mês/ano do exame, marcar um ou mais tipos de
// exame (sangue, hormônios, imagem etc.) e, quando for exame de imagem,
// descrever o que foi feito. Ao salvar, envia as alterações para quem chamou.
// ============================================================================
import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2 } from 'lucide-react';
import { ExamUpload } from '@/hooks/useExamResults';

interface EditExamDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  exam: ExamUpload | null;
  onSave: (id: string, data: { exam_date: string; exam_type: string; image_description: string | null }) => Promise<boolean>;
}

// Lista fixa de todos os tipos de exame que o usuário pode marcar.
// 'value' é o código guardado no sistema; 'label' é o texto exibido na tela.
const examTypeOptions = [
  { value: 'bioquimica', label: 'Bioquímica Sanguínea' },
  { value: 'hemograma', label: 'Hemograma' },
  { value: 'hormonios', label: 'Hormônios' },
  { value: 'vitaminas', label: 'Vitaminas e Nutrientes' },
  { value: 'cardiacos', label: 'Marcadores Cardíacos' },
  { value: 'tumorais', label: 'Marcadores Tumorais' },
  { value: 'sorologia', label: 'Sorologia e Imunologia' },
  { value: 'coagulacao', label: 'Coagulação' },
  { value: 'urina', label: 'Exames de Urina' },
  { value: 'fezes', label: 'Exames de Fezes' },
  { value: 'tipagem', label: 'Tipagem Sanguínea' },
  { value: 'outros', label: 'Outros Exames Importantes' },
  { value: 'geneticos', label: 'Exames Genéticos' },
  { value: 'imagem', label: 'Exames de Imagem' },
];

// Converte o tipo de exame guardado (que pode vir como uma lista em texto)
// de volta para uma lista de códigos. Se não conseguir ler, tenta usar o
// próprio texto como um único tipo; se estiver vazio, devolve lista vazia.
const parseExamTypes = (examType: string | null): string[] => {
  if (!examType) return [];
  try {
    return JSON.parse(examType);
  } catch {
    return examType ? [examType] : [];
  }
};

export function EditExamDialog({ open, onOpenChange, exam, onSave }: EditExamDialogProps) {
  // Tipos de exame marcados no momento (lista de códigos).
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  // Mês do exame (0 = Janeiro, 11 = Dezembro).
  const [examMonth, setExamMonth] = useState(0);
  // Ano do exame (começa no ano atual).
  const [examYear, setExamYear] = useState(new Date().getFullYear());
  // Texto de descrição usado somente quando o exame é de imagem.
  const [imageDescription, setImageDescription] = useState('');
  // Indica se está salvando (para mostrar o carregando e travar o botão).
  const [saving, setSaving] = useState(false);

  // Quando um exame é aberto para edição, preenche os campos da tela com os
  // dados atuais desse exame (tipos marcados, mês, ano e descrição de imagem).
  useEffect(() => {
    if (exam) {
      setSelectedTypes(parseExamTypes(exam.exam_type));
      const d = new Date(exam.exam_date + 'T12:00:00');
      setExamMonth(d.getMonth());
      setExamYear(d.getFullYear());
      setImageDescription((exam as any).image_description || '');
    }
  }, [exam]);

  // Marca ou desmarca um tipo de exame na lista de selecionados.
  const toggleExamType = (value: string) => {
    setSelectedTypes(prev =>
      prev.includes(value) ? prev.filter(t => t !== value) : [...prev, value]
    );
  };

  // Salva as alterações: monta a data a partir do mês/ano escolhidos, envia
  // os tipos marcados e a descrição (só se for exame de imagem). Fecha a
  // janela se der certo.
  const handleSave = async () => {
    if (!exam) return;
    setSaving(true);
    const date = new Date(examYear, examMonth, 1);
    const dateStr = date.toISOString().split('T')[0];
    const success = await onSave(exam.id, {
      exam_date: dateStr,
      exam_type: JSON.stringify(selectedTypes),
      image_description: selectedTypes.includes('imagem') ? imageDescription || null : null,
    });
    setSaving(false);
    if (success) onOpenChange(false);
  };

  // Só mostra o campo de descrição de imagem quando "Exames de Imagem" está marcado.
  const showImageDescription = selectedTypes.includes('imagem');

  // Monta a janela: cabeçalho, seletores de data, lista de tipos de exame,
  // campo opcional de descrição de imagem e botões de Cancelar/Salvar.
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Exame</DialogTitle>
        </DialogHeader>

        {exam && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground truncate">{exam.file_name}</p>

            {/* Seletores de Mês e Ano do exame */}
            <div className="space-y-2">
              <Label>Data do Exame (Mês/Ano)</Label>
              <div className="flex gap-2">
                <select
                  value={examMonth}
                  onChange={(e) => setExamMonth(parseInt(e.target.value))}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'].map((m, i) => (
                    <option key={i} value={i}>{m}</option>
                  ))}
                </select>
                <select
                  value={examYear}
                  onChange={(e) => setExamYear(parseInt(e.target.value))}
                  className="flex h-10 w-24 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 5 + i).map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Lista de tipos de exame com caixas de seleção (pode marcar vários) */}
            <div className="space-y-2">
              <Label>Tipo de Exame</Label>
              <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto p-1">
                {examTypeOptions.map((type) => (
                  <div
                    key={type.value}
                    className="flex items-center space-x-2 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <Checkbox
                      id={`edit-${type.value}`}
                      checked={selectedTypes.includes(type.value)}
                      onCheckedChange={() => toggleExamType(type.value)}
                    />
                    <label
                      htmlFor={`edit-${type.value}`}
                      className="text-sm font-medium leading-none cursor-pointer flex-1"
                    >
                      {type.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {showImageDescription && (
              <div className="space-y-2">
                <Label htmlFor="image-desc">Descrição do Exame de Imagem</Label>
                <Input
                  id="image-desc"
                  placeholder="Ex: Ressonância do joelho, Raio-X do tórax..."
                  value={imageDescription}
                  onChange={(e) => setImageDescription(e.target.value)}
                />
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
