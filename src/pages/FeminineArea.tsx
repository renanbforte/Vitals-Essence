import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Settings2, Plus, Flower2, Shield, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useMenstrualCycle } from '@/hooks/useMenstrualCycle';
import { useIntimacyLogs } from '@/hooks/useIntimacyLogs';
import { CycleCalendar } from '@/components/feminine/CycleCalendar';
import { FlowLogger } from '@/components/feminine/FlowLogger';
import { CycleHistory } from '@/components/feminine/CycleHistory';
import { CycleSettings } from '@/components/feminine/CycleSettings';
import { StartCycleDialog } from '@/components/feminine/StartCycleDialog';
import { ContraceptiveTracker } from '@/components/feminine/ContraceptiveTracker';
import { MaleWellbeingTracker } from '@/components/masculine/MaleWellbeingTracker';
import { IntimacyCalendar } from '@/components/feminine/IntimacyCalendar';
import { IntimacyLogDialog } from '@/components/feminine/IntimacyLogDialog';
import { IntimacyInsights } from '@/components/feminine/IntimacyInsights';

export default function FeminineArea() {
  const navigate = useNavigate();
  const cycle = useMenstrualCycle();
  const intimacy = useIntimacyLogs();
  const [showSettings, setShowSettings] = useState(false);
  const [showStartCycle, setShowStartCycle] = useState(false);
  const [mainTab, setMainTab] = useState<'ciclo' | 'vitalidade' | 'intimidade'>('ciclo');
  const [intimacyDate, setIntimacyDate] = useState<Date | null>(null);
  const [showIntimacyDialog, setShowIntimacyDialog] = useState(false);

  return (
    <div className="min-h-screen bg-background relative">
      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <motion.div
          key={mainTab}
          animate={{ opacity: 1 }}
          initial={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
          className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full blur-[120px]"
            style={{
            background: mainTab === 'ciclo'
              ? 'hsl(340, 70%, 60%)'
              : mainTab === 'intimidade'
              ? 'hsl(320, 65%, 55%)'
              : 'hsl(210, 80%, 50%)',
            opacity: 0.04,
          }}
        />
        <motion.div
          key={mainTab + '-2'}
          animate={{ opacity: 1 }}
          initial={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
          className="absolute -bottom-40 -left-40 w-[400px] h-[400px] rounded-full blur-[100px]"
          style={{
            background: mainTab === 'ciclo'
              ? 'hsl(320, 60%, 50%)'
              : mainTab === 'intimidade'
              ? 'hsl(300, 55%, 45%)'
              : 'hsl(220, 70%, 40%)',
            opacity: 0.03,
          }}
        />
      </div>

      {/* Hero */}
      <div className="relative overflow-hidden">
        <div
          className="transition-all duration-500"
          style={{
            background: mainTab === 'ciclo'
              ? 'linear-gradient(135deg, hsl(340,60%,55%), hsl(330,55%,48%), hsl(320,50%,42%))'
              : mainTab === 'intimidade'
              ? 'linear-gradient(135deg, hsl(320,55%,50%), hsl(300,50%,42%), hsl(280,45%,38%))'
              : 'linear-gradient(135deg, hsl(210,80%,40%), hsl(220,75%,33%), hsl(230,70%,28%))',
          }}
        >
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-24 -right-24 w-80 h-80 bg-white/[0.06] rounded-full blur-2xl" />
            <div className="absolute top-10 left-10 w-40 h-40 bg-white/[0.04] rounded-full blur-3xl" />
          </div>

          <div className="relative container mx-auto px-4 pt-6 pb-6">
            <div className="flex items-center gap-3 mb-2">
              <Button
                variant="ghost"
                size="icon"
                className="text-white/80 hover:text-white hover:bg-white/10 rounded-xl backdrop-blur-sm"
                onClick={() => navigate('/')}
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="flex-1">
                <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center shadow-inner">
                    <Shield className="w-4 h-4 text-white" />
                  </div>
                  Saúde Reprodutiva
                </h1>
                <p className="text-white/50 text-xs mt-0.5 ml-[46px]">
                  {mainTab === 'ciclo' ? 'Ciclo, fluxo & anticoncepcional' : mainTab === 'intimidade' ? 'Registro privado & insights' : 'Energia, vitalidade & hormônios'}
                </p>
              </div>
              {mainTab === 'ciclo' && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white/70 hover:text-white hover:bg-white/10 rounded-xl"
                  onClick={() => setShowSettings(true)}
                >
                  <Settings2 className="w-5 h-5" />
                </Button>
              )}
            </div>

            {/* Main tabs inside header */}
            <div className="mt-4 bg-white/10 backdrop-blur-md rounded-2xl p-1 flex gap-1">
              {(['ciclo', 'intimidade', 'vitalidade'] as const).map(tab => {
                const icons = { ciclo: <Flower2 className="w-3.5 h-3.5" />, intimidade: <Heart className="w-3.5 h-3.5" />, vitalidade: <Shield className="w-3.5 h-3.5" /> };
                const labels = { ciclo: 'Ciclo', intimidade: 'Intimidade', vitalidade: 'Vitalidade' };
                return (
                  <button
                    key={tab}
                    onClick={() => setMainTab(tab)}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${mainTab === tab ? 'bg-white/20 text-white shadow-sm' : 'text-white/60 hover:text-white/80'}`}
                  >
                    {icons[tab]}
                    {labels[tab]}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 pb-10 max-w-lg -mt-5 pt-6 bg-background rounded-t-3xl">
        <AnimatePresence mode="wait">
          {mainTab === 'ciclo' ? (
            <motion.div
              key="ciclo"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
              className="space-y-5"
            >
              {/* Deviation message */}
              <AnimatePresence>
                {cycle.lastCycleDeviation && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className={`rounded-2xl p-4 border backdrop-blur-xl text-sm ${
                      cycle.lastCycleDeviation.level === 'small'
                        ? 'bg-[hsl(340_60%_90%/0.3)] border-[hsl(340_60%_70%/0.3)] text-foreground'
                        : cycle.lastCycleDeviation.level === 'moderate'
                        ? 'bg-[hsl(30_80%_90%/0.3)] border-[hsl(30_70%_60%/0.3)] text-foreground'
                        : 'bg-[hsl(0_60%_90%/0.3)] border-[hsl(0_60%_60%/0.3)] text-foreground'
                    }`}
                  >
                    {cycle.lastCycleDeviation.message}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Start new cycle button */}
              <Button
                onClick={() => setShowStartCycle(true)}
                className="w-full rounded-2xl h-12 bg-gradient-to-r from-[hsl(340_60%_55%)] to-[hsl(320_50%_50%)] text-white font-semibold shadow-lg hover:shadow-xl transition-all"
              >
                <Plus className="w-4 h-4 mr-2" />
                Menstruação começou
              </Button>

              <Tabs defaultValue="calendario" className="w-full">
                <TabsList className="w-full rounded-2xl bg-muted/50 border border-border/30 p-1 h-auto grid grid-cols-2 gap-1">
                  <TabsTrigger value="calendario" className="rounded-xl text-xs py-2.5">Calendário</TabsTrigger>
                  <TabsTrigger value="registrar" className="rounded-xl text-xs py-2.5">Registrar</TabsTrigger>
                  <TabsTrigger value="historico" className="rounded-xl text-xs py-2.5">Histórico</TabsTrigger>
                  <TabsTrigger value="anticoncepcional" className="rounded-xl text-xs py-2.5">Anticoncepcional</TabsTrigger>
                </TabsList>

                <TabsContent value="calendario" className="mt-4">
                  <CycleCalendar
                    cycles={cycle.cycles}
                    dailyLogs={cycle.dailyLogs}
                    prediction={cycle.prediction}
                    settings={cycle.settings}
                  />
                </TabsContent>

                <TabsContent value="registrar" className="mt-4">
                  <FlowLogger
                    dailyLogs={cycle.dailyLogs}
                    onLog={cycle.logDay}
                  />
                </TabsContent>

                <TabsContent value="historico" className="mt-4">
                  <CycleHistory
                    cycles={cycle.cycles}
                    settings={cycle.settings}
                    onDeleteCycle={cycle.deleteCycle}
                  />
                </TabsContent>

                <TabsContent value="anticoncepcional" className="mt-4">
                  <ContraceptiveTracker />
                </TabsContent>
              </Tabs>
            </motion.div>
          ) : mainTab === 'intimidade' ? (
            <motion.div
              key="intimidade"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.25 }}
              className="space-y-5"
            >
              <IntimacyCalendar
                logs={intimacy.logs}
                onDayPress={date => { setIntimacyDate(date); setShowIntimacyDialog(true); }}
              />
              <IntimacyInsights
                logs={intimacy.logs}
                insights={intimacy.insights}
                onDelete={intimacy.deleteLog}
              />
            </motion.div>
          ) : (
            <motion.div
              key="vitalidade"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.25 }}
            >
              <MaleWellbeingTracker />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Dialogs */}
      <StartCycleDialog
        open={showStartCycle}
        onOpenChange={setShowStartCycle}
        onConfirm={async (date) => {
          await cycle.startNewCycle(date);
          setShowStartCycle(false);
        }}
      />

      <CycleSettings
        open={showSettings}
        onOpenChange={setShowSettings}
        settings={cycle.settings}
        onSave={cycle.saveSettings}
      />

      <IntimacyLogDialog
        open={showIntimacyDialog}
        date={intimacyDate}
        onClose={() => setShowIntimacyDialog(false)}
        onSave={intimacy.addLog}
        isSaving={intimacy.isAdding}
      />
    </div>
  );
}

