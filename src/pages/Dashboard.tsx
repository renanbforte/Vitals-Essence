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

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 260, damping: 20 } },
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [activeTab, setActiveTab] = useState('daily');
  const { profile } = useAuth();
  const { friends } = useFriendships();
  const { tracking, loading: trackingLoading, addWater, setWater, toggleHydrationScheduleEntry, toggleMeal, updateWorkout } = useDailyTracking(selectedDate);
  const { weights, loading: weightsLoading, addWeight, latestWeight } = useWeightHistory();
  
  const { trackingHistory, loading: historyLoading } = useTrackingHistory(90);
  const { mealPlans, saveMealPlan } = useUserMealPlans();
  const { workoutPlans, saveWorkoutPlan, deleteWorkoutPlan, addWorkoutPlan } = useUserWorkoutPlans();
  const { uploads, loading: examsLoading, uploading, uploadExam, updateUpload, deleteUpload } = useExamResults();
  const { schedule: hydrationSchedule, totalScheduledMl, loading: hydrationLoading } = useHydrationSchedule();
  const { photos: mealPhotos, uploadPhoto: uploadMealPhoto, deletePhoto: deleteMealPhoto, uploading: uploadingMealPhoto } = useMealPhotos(selectedDate);
  const { uploadPhoto: uploadProgressPhoto, deletePhoto: deleteProgressPhoto, uploading: uploadingProgressPhoto, getPhotoForDate } = useProgressPhotos(selectedDate);
  const { photo: workoutPhoto, uploadPhoto: uploadWorkoutPhoto, deletePhoto: deleteWorkoutPhoto, uploading: uploadingWorkoutPhoto } = useWorkoutPhotos(selectedDate);

  const isLoading = trackingLoading || weightsLoading || hydrationLoading;
  const currentProgressPhoto = getPhotoForDate(selectedDate.toISOString().split('T')[0]);

  // Auto-sync daily tracking to Arena groups silently
  useArenaAutoSync(tracking, selectedDate);

  return (
    <div className="min-h-screen bg-background">
      <Header title="Saúde" showBack gradientClass="gradient-health" />
      
      <main className="container mx-auto px-4 py-6 space-y-6 max-w-3xl">
        <DateSelector selectedDate={selectedDate} onDateChange={setSelectedDate} />


        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 h-14 rounded-2xl bg-card border border-border p-1.5 shadow-sm">
            <TabsTrigger 
              value="daily" 
              className="gap-1.5 rounded-xl font-bold text-xs data-[state=active]:gradient-health data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300"
            >
              <Calendar className="w-4 h-4" />
              Diário
            </TabsTrigger>
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

          <button
            onClick={() => navigate('/onboarding')}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mt-3 mx-auto"
          >
            <Settings2 className="w-3.5 h-3.5" />
            Configurar perfil
          </button>

          <AnimatePresence mode="wait">
            <TabsContent value="daily" className="mt-6" key="daily">
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
                  <motion.div variants={fadeUp}>
                    <DailyMedicationsCard selectedDate={selectedDate} />
                  </motion.div>
                  <motion.div variants={fadeUp}>
                    <FriendsRanking friends={friends} selectedDate={selectedDate} />
                  </motion.div>
                </motion.div>
              )}
            </TabsContent>

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
                  <motion.div variants={fadeUp}>
                    <PerformanceCalendar trackingHistory={trackingHistory} />
                  </motion.div>
                  <motion.div variants={fadeUp}>
                    <SummaryCards tracking={tracking} latestWeight={latestWeight} />
                  </motion.div>
                  <motion.div variants={fadeUp}>
                    <ProgressCharts
                      weights={weights}
                      trackingHistory={trackingHistory}
                      targetWeight={profile?.target_weight || 80}
                    />
                  </motion.div>
                  <motion.div variants={fadeUp}>
                    <ExportDataCard />
                  </motion.div>
                </motion.div>
              )}
            </TabsContent>

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
                  <motion.div variants={fadeUp}>
                    <ExamUploadCard uploads={uploads} uploading={uploading} onUpload={uploadExam} />
                  </motion.div>
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
