import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Trash2, 
  Download, 
  FolderOpen,
  Calendar,
  Filter,
  Copy,
  Pencil
} from 'lucide-react';
import { EditExamDialog } from '@/components/EditExamDialog';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ExamUpload } from '@/hooks/useExamResults';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ExamDocumentsCardProps {
  uploads: ExamUpload[];
  onDelete: (uploadId: string) => void;
  onUpdate: (id: string, data: { exam_date: string; exam_type: string; image_description: string | null }) => Promise<boolean>;
}

const examTypeLabels: Record<string, string> = {
  'bioquimica': 'Bioquímica Sanguínea',
  'hemograma': 'Hemograma',
  'hormonios': 'Hormônios',
  'vitaminas': 'Vitaminas e Nutrientes',
  'cardiacos': 'Marcadores Cardíacos',
  'tumorais': 'Marcadores Tumorais',
  'sorologia': 'Sorologia e Imunologia',
  'coagulacao': 'Coagulação',
  'urina': 'Exames de Urina',
  'fezes': 'Exames de Fezes',
  'tipagem': 'Tipagem Sanguínea',
  'outros': 'Outros Exames Importantes',
  'geneticos': 'Exames Genéticos',
  'imagem': 'Exames de Imagem',
};

export function ExamDocumentsCard({ uploads, onDelete, onUpdate }: ExamDocumentsCardProps) {
  const [filterType, setFilterType] = useState<string>('all');
  const [editingExam, setEditingExam] = useState<ExamUpload | null>(null);

  const downloadDocument = async (upload: ExamUpload) => {
    try {
      toast.info('Baixando documento...');
      
      const { data, error } = await supabase.storage
        .from('exams')
        .download(upload.file_path);

      if (error) throw error;

      // Create a blob URL and trigger download
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = upload.file_name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success('Documento baixado com sucesso!');
    } catch (error) {
      console.error('Error downloading document:', error);
      toast.error('Erro ao baixar documento');
    }
  };

  const copyLink = async (upload: ExamUpload) => {
    try {
      const { data, error } = await supabase.storage
        .from('exams')
        .createSignedUrl(upload.file_path, 86400); // 24 hours

      if (error) throw error;

      await navigator.clipboard.writeText(data.signedUrl);
      toast.success('Link copiado! Válido por 24 horas.');
    } catch (error) {
      console.error('Error copying link:', error);
      toast.error('Erro ao copiar link');
    }
  };

  // Parse exam types from the stored string
  const parseExamTypes = (examType: string | null): string[] => {
    if (!examType) return [];
    try {
      // Try parsing as JSON array first
      return JSON.parse(examType);
    } catch {
      // If not JSON, return as single item
      return examType ? [examType] : [];
    }
  };

  // Get all unique exam types for filter
  const allTypes = new Set<string>();
  uploads.forEach(u => {
    parseExamTypes(u.exam_type).forEach(t => allTypes.add(t));
  });

  // Filter uploads
  const filteredUploads = filterType === 'all' 
    ? uploads 
    : uploads.filter(u => parseExamTypes(u.exam_type).includes(filterType));

  // Group by date
  const groupedByDate: Record<string, ExamUpload[]> = {};
  filteredUploads.forEach(upload => {
    const dateKey = upload.exam_date;
    if (!groupedByDate[dateKey]) {
      groupedByDate[dateKey] = [];
    }
    groupedByDate[dateKey].push(upload);
  });

  const sortedDates = Object.keys(groupedByDate).sort((a, b) => 
    new Date(b).getTime() - new Date(a).getTime()
  );

  return (
    <Card className="border-0 shadow-lg bg-card/80 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500">
              <FolderOpen className="w-5 h-5 text-white" />
            </div>
            Meus Exames
          </CardTitle>
          
          {allTypes.size > 0 && (
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filtrar por tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                {Array.from(allTypes).map(type => (
                  <SelectItem key={type} value={type}>
                    {examTypeLabels[type] || type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {filteredUploads.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="font-medium">Nenhum exame encontrado</p>
            <p className="text-sm">
              {filterType !== 'all' 
                ? 'Tente remover o filtro ou envie novos exames'
                : 'Envie seus exames para manter um histórico organizado'}
            </p>
          </div>
        ) : (
          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1 sm:pr-2">
            {sortedDates.map(dateKey => (
              <div key={dateKey}>
                <div className="flex items-center gap-2 mb-2 sticky top-0 bg-card/95 backdrop-blur-sm py-1 z-10">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground capitalize">
                    {format(new Date(dateKey), "MMMM 'de' yyyy", { locale: ptBR })}
                  </span>
                </div>
                
                <div className="space-y-2">
                  {groupedByDate[dateKey].map((upload) => {
                    const types = parseExamTypes(upload.exam_type);
                    
                    return (
                      <div 
                        key={upload.id} 
                        className="p-3 bg-muted/50 rounded-lg hover:bg-muted/70 transition-colors"
                      >
                        {/* Header: File icon + name + actions */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2 min-w-0 flex-1">
                            <div className="p-1.5 rounded-lg bg-primary/10 flex-shrink-0">
                              <FileText className="w-4 h-4 text-primary" />
                            </div>
                            <p className="text-sm font-medium break-words leading-tight pt-0.5">{upload.file_name}</p>
                          </div>
                          
                          {/* Actions - always in row */}
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingExam(upload);
                              }}
                              className="h-8 w-8 p-0"
                              title="Editar exame"
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                downloadDocument(upload);
                              }}
                              className="h-8 w-8 p-0"
                              title="Baixar documento"
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                copyLink(upload);
                              }}
                              className="h-8 w-8 p-0"
                              title="Copiar link"
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDelete(upload.id);
                              }}
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                              title="Excluir"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        
                        {/* Badges - separate row */}
                        {types.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2 pl-8">
                            {types.slice(0, 3).map(type => (
                              <Badge 
                                key={type} 
                                variant="secondary" 
                                className="text-xs py-0.5"
                              >
                                {examTypeLabels[type] || type}
                              </Badge>
                            ))}
                            {types.length > 3 && (
                              <Badge variant="outline" className="text-xs py-0.5">
                                +{types.length - 3}
                              </Badge>
                            )}
                            {(upload as any).image_description && (
                              <Badge variant="default" className="text-xs py-0.5">
                                {(upload as any).image_description}
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <EditExamDialog
        open={!!editingExam}
        onOpenChange={(open) => !open && setEditingExam(null)}
        exam={editingExam}
        onSave={onUpdate}
      />
    </Card>
  );
}
