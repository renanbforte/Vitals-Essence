import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Upload, FileText, Loader2, Clock } from 'lucide-react';
import { ExamUpload } from '@/hooks/useExamResults';

interface ExamUploadCardProps {
  uploads: ExamUpload[];
  uploading: boolean;
  onUpload: (file: File, examDate: Date, examTypes: string[]) => Promise<ExamUpload | null>;
}

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

export function ExamUploadCard({ 
  uploads, 
  uploading, 
  onUpload, 
}: ExamUploadCardProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [examDate, setExamDate] = useState<Date>(new Date());
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setSelectedFiles(Array.from(files));
    }
  };

  const toggleExamType = (value: string) => {
    setSelectedTypes(prev => 
      prev.includes(value) 
        ? prev.filter(t => t !== value)
        : [...prev, value]
    );
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;
    
    // Upload each file
    let success = true;
    for (const file of selectedFiles) {
      const result = await onUpload(file, examDate, selectedTypes);
      if (!result) {
        success = false;
        break;
      }
    }
    
    if (success) {
      setSelectedFiles([]);
      setSelectedTypes([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <Card className="border-0 shadow-lg bg-card/80 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold">
          <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500">
            <FileText className="w-5 h-5 text-white" />
          </div>
          Enviar Exame
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Explanation Section */}
        <div className="p-4 rounded-xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20">
          <h3 className="font-medium text-foreground mb-2">📋 O que é esta área?</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Aqui você pode guardar seus exames médicos de forma organizada. 
            Envie PDFs ou fotos dos seus resultados para criar um histórico de saúde 
            acessível a qualquer momento. Isso facilita o acompanhamento da sua evolução 
            e o compartilhamento com profissionais de saúde quando necessário.
          </p>
        </div>

        {/* Upload Form */}
        <div className="p-4 border-2 border-dashed border-muted-foreground/25 rounded-xl space-y-4">
          <div className="space-y-2">
            <Label htmlFor="exam-file">Arquivos do Exame (PDF, Imagens ou ZIP)</Label>
            <Input
              ref={fileInputRef}
              id="exam-file"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.webp,.zip,.rar,.7z"
              onChange={handleFileChange}
              multiple
              className="cursor-pointer"
            />
            {selectedFiles.length > 0 && (
              <div className="text-sm text-muted-foreground space-y-1">
                <p className="font-medium">
                  {selectedFiles.length} arquivo{selectedFiles.length > 1 ? 's' : ''} selecionado{selectedFiles.length > 1 ? 's' : ''}:
                </p>
                <ul className="list-disc list-inside max-h-24 overflow-y-auto">
                  {selectedFiles.slice(0, 5).map((file, i) => (
                    <li key={i} className="truncate">{file.name}</li>
                  ))}
                  {selectedFiles.length > 5 && (
                    <li className="text-muted-foreground/70">... e mais {selectedFiles.length - 5} arquivo(s)</li>
                  )}
                </ul>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Data do Exame (Mês/Ano)</Label>
            <div className="flex gap-2">
              <select
                value={examDate.getMonth()}
                onChange={(e) => {
                  const newDate = new Date(examDate);
                  newDate.setMonth(parseInt(e.target.value));
                  setExamDate(newDate);
                }}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value={0}>Janeiro</option>
                <option value={1}>Fevereiro</option>
                <option value={2}>Março</option>
                <option value={3}>Abril</option>
                <option value={4}>Maio</option>
                <option value={5}>Junho</option>
                <option value={6}>Julho</option>
                <option value={7}>Agosto</option>
                <option value={8}>Setembro</option>
                <option value={9}>Outubro</option>
                <option value={10}>Novembro</option>
                <option value={11}>Dezembro</option>
              </select>
              <select
                value={examDate.getFullYear()}
                onChange={(e) => {
                  const newDate = new Date(examDate);
                  newDate.setFullYear(parseInt(e.target.value));
                  setExamDate(newDate);
                }}
                className="flex h-10 w-24 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 5 + i).map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Tipo de Exame (selecione um ou mais)</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1">
              {examTypeOptions.map((type) => (
                <div 
                  key={type.value} 
                  className="flex items-center space-x-2 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <Checkbox
                    id={type.value}
                    checked={selectedTypes.includes(type.value)}
                    onCheckedChange={() => toggleExamType(type.value)}
                  />
                  <label
                    htmlFor={type.value}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                  >
                    {type.label}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <Button 
            onClick={handleUpload} 
            disabled={selectedFiles.length === 0 || uploading}
            className="w-full gradient-weight text-white"
          >
            {uploading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Upload className="w-4 h-4 mr-2" />
            )}
            {uploading ? 'Enviando...' : `Salvar ${selectedFiles.length > 1 ? `${selectedFiles.length} Arquivos` : 'Exame'}`}
          </Button>
        </div>

        {uploads.length === 0 && (
          <div className="text-center py-6 text-muted-foreground">
            <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Nenhum exame salvo ainda</p>
            <p className="text-xs">Envie seus exames para manter um histórico</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
