// ============================================================================
// ExamEvolutionCard — ANALISADOR DE EVOLUÇÃO DOS EXAMES
// ----------------------------------------------------------------------------
// Botão que dispara a análise de todos os exames do usuário e mostra o relatório:
// resumo da situação, destaques (melhorou/piorou/atenção), evolução de cada
// marcador na linha do tempo, achados de imagem e exames pendentes de laudo.
// É apoio informativo — não substitui avaliação médica.
// ============================================================================
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Activity, Sparkles, TrendingUp, TrendingDown, Minus, Waves, Circle,
  ArrowUp, ArrowDown, Image as ImageIcon, Clock, AlertTriangle, Stethoscope, RefreshCw,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useExamAnalysis, type BiomarkerEvolution, type ExamReport } from '@/hooks/useExamAnalysis';

// Formata 'YYYY-MM-DD' como 'ago/25' (curto) ou 'ago de 2025' (longo).
function fmtDate(date: string, long = false) {
  try {
    return format(new Date(date + 'T00:00:00'), long ? "MMM 'de' yyyy" : 'MMM/yy', { locale: ptBR });
  } catch {
    return date;
  }
}

// Visual da tendência de um marcador (ícone + cor + rótulo).
const TREND: Record<string, { icon: typeof TrendingUp; label: string; cls: string }> = {
  melhora: { icon: TrendingUp, label: 'Melhora', cls: 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20' },
  piora: { icon: TrendingDown, label: 'Piora', cls: 'text-red-600 bg-red-500/10 border-red-500/20' },
  estavel: { icon: Minus, label: 'Estável', cls: 'text-slate-500 bg-slate-500/10 border-slate-500/20' },
  oscilando: { icon: Waves, label: 'Oscilando', cls: 'text-amber-600 bg-amber-500/10 border-amber-500/20' },
  dado_unico: { icon: Circle, label: 'Única medição', cls: 'text-slate-400 bg-slate-500/10 border-slate-500/20' },
};

// Cor de um valor conforme o status (dentro/fora da referência).
function statusColor(status: string) {
  switch (status) {
    case 'normal': return 'text-emerald-600 bg-emerald-500/10';
    case 'alto': return 'text-red-600 bg-red-500/10';
    case 'baixo': return 'text-blue-600 bg-blue-500/10';
    default: return 'text-muted-foreground bg-muted';
  }
}

function StatusArrow({ status }: { status: string }) {
  if (status === 'alto') return <ArrowUp className="w-3 h-3" />;
  if (status === 'baixo') return <ArrowDown className="w-3 h-3" />;
  return null;
}

// Linha de um marcador: nome, tendência e os pontos (datas → valores) coloridos.
function BiomarkerRow({ b }: { b: BiomarkerEvolution }) {
  const t = TREND[b.trend] || TREND.dado_unico;
  const TIcon = t.icon;
  return (
    <div className="p-3 rounded-xl bg-muted/40 border border-border/60">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <span className="text-sm font-semibold">{b.name}{b.unit ? <span className="text-muted-foreground font-normal"> ({b.unit})</span> : null}</span>
        <Badge variant="outline" className={`text-[11px] gap-1 ${t.cls}`}>
          <TIcon className="w-3 h-3" /> {t.label}
        </Badge>
      </div>
      <div className="flex items-center gap-1.5 mt-2 overflow-x-auto pb-1">
        {b.points.map((p, i) => (
          <div key={i} className="flex items-center gap-1.5 shrink-0">
            {i > 0 && <span className="text-muted-foreground/40 text-xs">→</span>}
            <div className="flex flex-col items-center">
              <span className={`text-xs font-bold tabular-nums px-1.5 py-0.5 rounded-md flex items-center gap-0.5 ${statusColor(p.status)}`}>
                <StatusArrow status={p.status} />
                {p.value ?? '—'}
              </span>
              <span className="text-[9px] text-muted-foreground mt-0.5">{fmtDate(p.date)}</span>
            </div>
          </div>
        ))}
      </div>
      {b.note && <p className="text-[11px] text-muted-foreground mt-1.5">{b.note}</p>}
    </div>
  );
}

// Lista de destaques (ex.: o que melhorou) com cor e ícone próprios.
function Highlights({ title, items, cls, Icon }: { title: string; items: string[]; cls: string; Icon: typeof TrendingUp }) {
  if (!items || items.length === 0) return null;
  return (
    <div className={`p-3 rounded-xl border ${cls}`}>
      <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide mb-1.5">
        <Icon className="w-3.5 h-3.5" /> {title}
      </div>
      <ul className="space-y-1">
        {items.map((it, i) => <li key={i} className="text-sm leading-snug">• {it}</li>)}
      </ul>
    </div>
  );
}

function Report({ report }: { report: ExamReport }) {
  return (
    <div className="space-y-4">
      {/* Resumo da situação */}
      {report.summary && (
        <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20">
          <p className="text-sm leading-relaxed">{report.summary}</p>
        </div>
      )}

      {/* Destaques */}
      <div className="grid gap-2 sm:grid-cols-3">
        <Highlights title="Melhorou" items={report.improved} Icon={TrendingUp} cls="border-emerald-500/20 bg-emerald-500/5 text-emerald-700" />
        <Highlights title="Piorou" items={report.worsened} Icon={TrendingDown} cls="border-red-500/20 bg-red-500/5 text-red-700" />
        <Highlights title="Atenção" items={report.attention} Icon={AlertTriangle} cls="border-amber-500/20 bg-amber-500/5 text-amber-700" />
      </div>

      {/* Evolução por marcador */}
      {report.biomarkers?.length > 0 && (
        <div>
          <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5" /> Evolução dos marcadores
          </h4>
          <div className="space-y-2">
            {report.biomarkers.map((b, i) => <BiomarkerRow key={i} b={b} />)}
          </div>
        </div>
      )}

      {/* Achados de imagem */}
      {report.imaging?.length > 0 && (
        <div>
          <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1.5">
            <ImageIcon className="w-3.5 h-3.5" /> Exames de imagem / laudos
          </h4>
          <div className="space-y-2">
            {report.imaging.map((im, i) => (
              <div key={i} className="p-3 rounded-xl bg-muted/40 border border-border/60">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="secondary" className="text-[11px]">{fmtDate(im.date, true)}</Badge>
                  <span className="text-sm font-semibold">{im.exam}</span>
                </div>
                <p className="text-sm text-muted-foreground leading-snug">{im.findings}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pendentes de laudo */}
      {report.pending?.length > 0 && (
        <div>
          <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" /> Pendentes de laudo
          </h4>
          <div className="space-y-1.5">
            {report.pending.map((p, i) => (
              <div key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                <Badge variant="outline" className="text-[11px] shrink-0">{fmtDate(p.date, true)}</Badge>
                <span><span className="font-medium text-foreground">{p.exam}</span> — {p.reason}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Aviso médico */}
      {report.disclaimer && (
        <div className="flex items-start gap-2 p-3 rounded-xl bg-muted/50 border border-border/60">
          <Stethoscope className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
          <p className="text-[11px] text-muted-foreground leading-snug">{report.disclaimer}</p>
        </div>
      )}
    </div>
  );
}

export function ExamEvolutionCard({ uploadsCount }: { uploadsCount: number }) {
  const { analysis, loading, running, runAnalysis } = useExamAnalysis();

  const hasExams = uploadsCount > 0;

  return (
    <Card className="border-0 shadow-lg bg-card/80 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500">
              <Activity className="w-5 h-5 text-white" />
            </div>
            Analisador de Evolução
          </CardTitle>
          {analysis && !running && (
            <Button size="sm" variant="outline" onClick={runAnalysis} disabled={running} className="gap-1.5">
              <RefreshCw className="w-4 h-4" /> Reanalisar
            </Button>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          Lê todos os seus exames e avalia como os resultados evoluíram ao longo do tempo.
        </p>
      </CardHeader>

      <CardContent>
        {running ? (
          <div className="text-center py-10">
            <div className="relative inline-flex">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 animate-pulse">
                <Sparkles className="w-7 h-7 text-white" />
              </div>
            </div>
            <p className="font-semibold mt-4">Lendo e cruzando seus exames…</p>
            <p className="text-sm text-muted-foreground mt-1">Isso pode levar de 30 segundos a 1 minuto.</p>
          </div>
        ) : loading ? (
          <p className="text-sm text-muted-foreground text-center py-6">Carregando…</p>
        ) : !analysis ? (
          <div className="text-center py-8">
            <TrendingUp className="w-12 h-12 mx-auto mb-3 text-emerald-500/40" />
            <p className="font-medium">Nenhuma análise ainda</p>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-1">
              {hasExams
                ? 'Gere um relatório sobre a evolução dos seus resultados a partir dos exames enviados.'
                : 'Envie seus exames acima para poder analisar a evolução.'}
            </p>
            <Button
              onClick={runAnalysis}
              disabled={!hasExams || running}
              className="mt-4 gap-1.5 bg-gradient-to-br from-emerald-500 to-teal-500 text-white hover:opacity-90"
            >
              <Sparkles className="w-4 h-4" /> Analisar meus exames
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <Report report={analysis.report} />
            <p className="text-[11px] text-muted-foreground text-center pt-1">
              Última análise em {format(new Date(analysis.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              {' · '}{analysis.files_analyzed}/{analysis.exams_count} arquivo(s) lido(s)
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
