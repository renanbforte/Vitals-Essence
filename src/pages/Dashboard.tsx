// ============================================================================
// Dashboard  —  TELA DE SAÚDE / ACOMPANHAMENTO DIÁRIO (rota /saude)
// ----------------------------------------------------------------------------
// Painel central de bem-estar do usuário. Ele escolhe uma data e registra
// o dia: água, refeições, energia, treino, peso e remédios. Tem 4 abas —
// Diário, Arena (atalho), Progresso (gráficos) e Exames (upload de documentos).
// ============================================================================

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, TrendingUp, FileText, Swords, Settings2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Header } from '@/components/Header';
import { DateSelector } from '@/components/DateSelector';
import { WaterCard } from '@/components/WaterCard';
import { MealsCard } from '@/components/MealsCard';
import { EnergyCard } from '@/components/EnergyCard';
import { WorkoutCard } from '@/components/WorkoutCard';
import { DailyWeightCard } from '@/components/DailyWeightCard';
import { DailyMedicationsCard } from '@/components/DailyMedicationsCard';

import { ProgressCharts } from '@/components/ProgressCharts';
import { PerformanceCalendar } from '@/components/PerformanceCalendar';
import { ExportDataCard } from '@/components/ExportDataCard';
import { SummaryCards } from '@/components/SummaryCards';
import { ExamUploadCard } from '@/components/ExamUploadCard';
import { ExamDocumentsCard } from '@/components/ExamDocumentsCard';
import { ExamEvolutionCard } from '@/components/ExamEvolutionCard';
import { useDailyTracking } from '@/hooks/useDailyTracking';
import { useWeightHistory } from '@/hooks/useWeightHistory';

import { useTrackingHistory } from '@/hooks/useTrackingHistory';
import { useUserMealPlans } from '@/hooks/useUserMealPlans';
import { useUserWorkoutPlans } from '@/hooks/useUserWorkoutPlans';
import { useExamResults } from '@/hooks/useExamResults';
import { useHydrationSchedule } from '@/hooks/useHydrationSchedule';
import { useMealPhotos } from '@/hooks/useMealPhotos';
import { useProgressPhotos } from '@/hooks/useProgressPhotos';
import { useWorkoutPhotos } from '@/hooks/useWorkoutPhotos';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import { FriendsRanking } from '@/components/FriendsRanking';
import { useFriendships } from '@/hooks/useFriendships';
import { useArenaAutoSync } from '@/hooks/useArenaAutoSync';

// Configurações de animação (framer-motion) usadas nos cartões:
// "stagger" faz os filhos aparecerem um após o outro, em cascata.
const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

// "fadeUp" faz cada cartão surgir subindo suavemente e ganhando opacidade.
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 260, damping: 20 } },
};

// Componente principal da tela de Saúde.
export default function Dashboard() {
  const navigate = useNavigate();
  // Data que o usuário está visualizando/editando (começa em hoje).
  const [selectedDate, setSelectedDate] = useState(new Date());
  // Aba selecionada (começa em "Diário").
  const [activeTab, setActiveTab] = useState('daily');
  // Perfil do usuário logado e sua lista de amigos.
  const { profile } = useAuth();
  const { friends } = useFriendships();
  // Dados e ações do registro diário (água, refeições, treino) para a data escolhida.
  const { tracking, loading: trackingLoading, addWater, setWater, toggleHydrationScheduleEntry, toggleMeal, updateWorkout } = useDailyTracking(selectedDate);
  // Histórico de peso e ação para registrar um novo peso.
  const { weights, loading: weightsLoading, addWeight, latestWeight } = useWeightHistory();

  // Histórico dos últimos 90 dias de registros (usado nos gráficos de progresso).
  const { trackingHistory, loading: historyLoading } = useTrackingHistory(90);
  // Planos de refeição do usuário (e função para salvar).
  const { mealPlans, saveMealPlan } = useUserMealPlans();
  // Planos de treino do usuário (salvar, apagar, adicionar).
  const { workoutPlans, saveWorkoutPlan, deleteWorkoutPlan, addWorkoutPlan } = useUserWorkoutPlans();
  // Documentos de exames enviados (upload, editar, apagar).
  const { uploads, loading: examsLoading, uploading, uploadExam, updateUpload, deleteUpload } = useExamResults();
  // Cronograma de hidratação e a meta total de água do dia (em ml).
  const { schedule: hydrationSchedule, totalScheduledMl, loading: hydrationLoading } = useHydrationSchedule();
  // Fotos das refeições da data escolhida (enviar/apagar).
  const { photos: mealPhotos, uploadPhoto: uploadMealPhoto, deletePhoto: deleteMealPhoto, uploading: uploadingMealPhoto } = useMealPhotos(selectedDate);
  // Fotos de progresso corporal da data escolhida.
  const { uploadPhoto: uploadProgressPhoto, deletePhoto: deleteProgressPhoto, uploading: uploadingProgressPhoto, getPhotoForDate } = useProgressPhotos(selectedDate);
  // Foto do treino da data escolhida.
  const { photo: workoutPhoto, uploadPhoto: uploadWorkoutPhoto, deletePhoto: deleteWorkoutPhoto, uploading: uploadingWorkoutPhoto } = useWorkoutPhotos(selectedDate);

  // Estado geral de carregamento da aba Diário (verdadeiro se qualquer parte ainda carrega).
  const isLoading = trackingLoading || weightsLoading || hydrationLoading;
  // Foto de progresso correspondente exatamente ao dia selecionado.
  const currentProgressPhoto = getPhotoForDate(selectedDate.toISOString().split('T')[0]);

  // Sincroniza o registro do dia com os grupos da "Arena" automaticamente, em segundo plano.
  useArenaAutoSync(tracking, selectedDate);

  // Estrutura visual da tela.
  return (
    <div className="min-h-screen bg-background">
      {/* Cabeçalho do app com título "Saúde" e botão de voltar */}
      <Header title="Saúde" showBack gradientClass="gradient-health" />

      <main className="container mx-auto px-4 py-6 space-y-6 max-w-3xl">
        {/* Seletor de data: define qual dia está sendo visto/editado */}
        <DateSelector selectedDate={selectedDate} onDateChange={setSelectedDate} />


        {/* Sistema de abas: Diário, Arena, Progresso e Exames */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {/* Barra com os 4 botões de aba */}
          <TabsList className="grid w-full grid-cols-4 h-14 rounded-2xl bg-card border border-border p-1.5 shadow-sm">
            <TabsTrigger 
              value="daily" 
              className="gap-1.5 rounded-xl font-bold text-xs data-[state=active]:gradient-health data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300"
            >
              <Calendar className="w-4 h-4" />
              Diário
            </TabsTrigger>
            {/* Aba "Arena" na verdade não abre conteúdo aqui: leva para a rota /arena */}
            <TabsTrigger
              value="arena"
              className="gap-1.5 rounded-xl font-bold text-xs data-[state=active]:gradient-health data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300"
              onClick={(e) => { e.preventDefault(); navigate('/arena'); }}
            >
              <Swords className="w-4 h-4" />
              Arena
            </TabsTrigger>
            <TabsTrigger 
              value="progress" 
              className="gap-1.5 rounded-xl font-bold text-xs data-[state=active]:gradient-health data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300"
            >
              <TrendingUp className="w-4 h-4" />
              Progresso
            </TabsTrigger>
            <TabsTrigger 
              value="exams" 
              className="gap-1.5 rounded-xl font-bold text-xs data-[state=active]:gradient-health data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300"
            >
              <FileText className="w-4 h-4" />
              Exames
            </TabsTrigger>
          </TabsList>

          {/* Atalho para reconfigurar o perfil (leva para a tela de onboarding) */}
          <button
            onClick={() => navigate('/onboarding')}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mt-3 mx-auto"
          >
            <Settings2 className="w-3.5 h-3.5" />
            Configurar perfil
          </button>

          <AnimatePresence mode="wait">
            {/* ABA DIÁRIO: os cartões de registro do dia (água, refeições, treino...) */}
            <TabsContent value="daily" className="mt-6" key="daily">
              {/* Enquanto carrega, mostra retângulos cinza (esqueleto) no lugar dos cartões */}
              {isLoading ? (
                <div className="space-y-5">
                  <Skeleton className="h-72 rounded-3xl" />
                  <Skeleton className="h-72 rounded-3xl" />
                  <Skeleton className="h-72 rounded-3xl" />
                </div>
              ) : (
                <motion.div
                  variants={stagger}
                  initial="hidden"
                  animate="show"
                  className="space-y-5"
                >
                  {/* Cartão de energia/resumo calórico do dia */}
                  <motion.div variants={fadeUp}>
                    <EnergyCard
                      selectedDate={selectedDate}
                      tracking={tracking}
                      mealPlans={mealPlans}
                      workoutPlans={workoutPlans}
                      waterMl={tracking?.water_ml || 0}
                      hydrationGoalMl={totalScheduledMl || 3000}
                    />
                  </motion.div>
                  {/* Cartão de hidratação: água consumida e metas de horário */}
                  <motion.div variants={fadeUp}>
                    <WaterCard
                      waterMl={tracking?.water_ml || 0} 
                      onAddWater={addWater} 
                      onSetWater={setWater}
                      schedule={hydrationSchedule}
                      completedScheduleIds={tracking?.hydration_schedule_completed || []}
                      onToggleScheduleEntry={toggleHydrationScheduleEntry}
                      totalScheduledMl={totalScheduledMl}
                    />
                  </motion.div>
                  {/* Cartão de refeições: marcar refeições feitas e ver/anexar fotos */}
                  <motion.div variants={fadeUp}>
                    <MealsCard
                      tracking={tracking} 
                      onToggleMeal={toggleMeal} 
                      mealPlans={mealPlans}
                      onSaveMealPlan={saveMealPlan}
                      mealPhotos={mealPhotos}
                      onUploadMealPhoto={uploadMealPhoto}
                      onDeleteMealPhoto={deleteMealPhoto}
                      uploadingPhoto={uploadingMealPhoto}
                    />
                  </motion.div>
                  {/* Cartão de treino: registrar o treino do dia e sua foto */}
                  <motion.div variants={fadeUp}>
                    <WorkoutCard
                      selectedDate={selectedDate}
                      tracking={tracking}
                      onUpdateWorkout={updateWorkout}
                      workoutPlans={workoutPlans}
                      onSaveWorkoutPlan={saveWorkoutPlan}
                      onDeleteWorkoutPlan={deleteWorkoutPlan}
                      onAddWorkoutPlan={addWorkoutPlan}
                      workoutPhoto={workoutPhoto}
                      onUploadWorkoutPhoto={uploadWorkoutPhoto}
                      onDeleteWorkoutPhoto={deleteWorkoutPhoto}
                      uploadingWorkoutPhoto={uploadingWorkoutPhoto}
                    />
                  </motion.div>
                  {/* Cartão de peso do dia: registrar peso e foto de progresso, ver meta */}
                  <motion.div variants={fadeUp}>
                    <DailyWeightCard
                      selectedDate={selectedDate}
                      weights={weights}
                      onAddWeight={addWeight}
                      targetWeight={profile?.target_weight || 80}
                      progressPhoto={currentProgressPhoto}
                      onUploadProgressPhoto={uploadProgressPhoto}
                      onDeleteProgressPhoto={deleteProgressPhoto}
                      uploadingPhoto={uploadingProgressPhoto}
                    />
                  </motion.div>
                  {/* Cartão de medicamentos do dia */}
                  <motion.div variants={fadeUp}>
                    <DailyMedicationsCard selectedDate={selectedDate} />
                  </motion.div>
                  {/* Ranking de amigos: comparação de desempenho entre amigos no dia */}
                  <motion.div variants={fadeUp}>
                    <FriendsRanking friends={friends} selectedDate={selectedDate} />
                  </motion.div>
                </motion.div>
              )}
            </TabsContent>

            {/* ABA PROGRESSO: calendário de desempenho, resumos e gráficos */}
            <TabsContent value="progress" className="mt-6" key="progress">
              {historyLoading || weightsLoading ? (
                <div className="space-y-5">
                  <Skeleton className="h-72 rounded-3xl" />
                  <Skeleton className="h-72 rounded-3xl" />
                </div>
              ) : (
                <motion.div
                  variants={stagger}
                  initial="hidden"
                  animate="show"
                  className="space-y-5"
                >
                  {/* Calendário que mostra os dias com bom desempenho */}
                  <motion.div variants={fadeUp}>
                    <PerformanceCalendar trackingHistory={trackingHistory} />
                  </motion.div>
                  {/* Cartões de resumo com os números principais */}
                  <motion.div variants={fadeUp}>
                    <SummaryCards tracking={tracking} latestWeight={latestWeight} />
                  </motion.div>
                  {/* Gráficos de evolução (peso ao longo do tempo vs. meta) */}
                  <motion.div variants={fadeUp}>
                    <ProgressCharts
                      weights={weights}
                      trackingHistory={trackingHistory}
                      targetWeight={profile?.target_weight || 80}
                    />
                  </motion.div>
                  {/* Cartão para exportar os dados do usuário */}
                  <motion.div variants={fadeUp}>
                    <ExportDataCard />
                  </motion.div>
                </motion.div>
              )}
            </TabsContent>

            {/* ABA EXAMES: enviar documentos de exames e listar os já enviados */}
            <TabsContent value="exams" className="mt-6" key="exams">
              {examsLoading ? (
                <div className="space-y-5">
                  <Skeleton className="h-96 rounded-3xl" />
                  <Skeleton className="h-96 rounded-3xl" />
                </div>
              ) : (
                <motion.div
                  variants={stagger}
                  initial="hidden"
                  animate="show"
                  className="space-y-5"
                >
                  {/* Cartão para enviar um novo exame */}
                  <motion.div variants={fadeUp}>
                    <ExamUploadCard uploads={uploads} uploading={uploading} onUpload={uploadExam} />
                  </motion.div>
                  {/* Analisador de evolução: lê todos os exames e avalia os resultados */}
                  <motion.div variants={fadeUp}>
                    <ExamEvolutionCard uploadsCount={uploads.length} />
                  </motion.div>
                  {/* Lista dos exames já enviados (com opção de editar/apagar) */}
                  <motion.div variants={fadeUp}>
                    <ExamDocumentsCard uploads={uploads} onDelete={deleteUpload} onUpdate={updateUpload} />
                  </motion.div>
                </motion.div>
              )}
            </TabsContent>
          </AnimatePresence>
        </Tabs>
      </main>
    </div>
  );
}
