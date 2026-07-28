import { useState, useMemo } from 'react';
import { ArenaDailyScore, ArenaGroup, ArenaMember, ArenaMemberDayPhotos } from '@/hooks/useArena';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, X, Camera, Dumbbell, Image } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';

interface ArenaCalendarProps {
  group: ArenaGroup;
  members: ArenaMember[];
  scores: ArenaDailyScore[];
  onFetchDayPhotos?: (date: string) => Promise<ArenaMemberDayPhotos[]>;
}

function getScoreColor(score: number): string {
  if (score >= 80) return 'bg-green-500';
  if (score >= 50) return 'bg-yellow-500';
  if (score > 0) return 'bg-orange-500';
  return 'bg-muted';
}

export function ArenaCalendar({ group, members, scores, onFetchDayPhotos }: ArenaCalendarProps) {
  const [month, setMonth] = useState(new Date());
  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [dayPhotos, setDayPhotos] = useState<ArenaMemberDayPhotos[]>([]);
  const [loadingPhotos, setLoadingPhotos] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  const days = useMemo(() => {
    const start = startOfMonth(month);
    const end = endOfMonth(month);
    return eachDayOfInterval({ start, end });
  }, [month]);

  const startPad = getDay(startOfMonth(month));

  const filteredScores = useMemo(() => {
    if (selectedMember) return scores.filter(s => s.user_id === selectedMember);
    return scores;
  }, [scores, selectedMember]);

  const scoreMap = useMemo(() => {
    const map: Record<string, ArenaDailyScore[]> = {};
    filteredScores.forEach(s => {
      if (!map[s.date]) map[s.date] = [];
      map[s.date].push(s);
    });
    return map;
  }, [filteredScores]);

  // dates that have any photo in scores
  const datesWithPhotos = useMemo(() => {
    const set = new Set<string>();
    scores.forEach(s => { if (s.photo_url) set.add(s.date); });
    return set;
  }, [scores]);

  const handleDayClick = async (dateStr: string) => {
    if (!onFetchDayPhotos) return;
    setSelectedDay(dateStr);
    setLoadingPhotos(true);
    setDayPhotos([]);
    const photos = await onFetchDayPhotos(dateStr);
    setDayPhotos(photos);
    setLoadingPhotos(false);
  };

  return (
    <div className="space-y-4">
      {/* Member filter */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setSelectedMember(null)}
          className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${!selectedMember ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
        >
          Todos
        </button>
        {members.map(m => (
          <button
            key={m.id}
            onClick={() => setSelectedMember(m.user_id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${selectedMember === m.user_id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
          >
            <Avatar className="w-4 h-4">
              <AvatarImage src={m.profile?.avatar_url || ''} />
              <AvatarFallback className="text-[8px]">{(m.profile?.name || '?')[0]}</AvatarFallback>
            </Avatar>
            {m.profile?.name?.split(' ')[0]}
          </button>
        ))}
      </div>

      {/* Month nav */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={() => setMonth(m => subMonths(m, 1))}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <span className="font-bold text-sm capitalize">
          {format(month, 'MMMM yyyy', { locale: ptBR })}
        </span>
        <Button variant="ghost" size="icon" onClick={() => setMonth(m => addMonths(m, 1))}>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Calendar grid */}
      <Card className="p-3 rounded-2xl border-border">
        <div className="grid grid-cols-7 gap-1 text-center">
          {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, i) => (
            <span key={i} className="text-[10px] font-bold text-muted-foreground py-1">{d}</span>
          ))}
          {Array.from({ length: startPad }).map((_, i) => <div key={`pad-${i}`} />)}
          {days.map(day => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const dayScores = scoreMap[dateStr] || [];
            const avgScore = dayScores.length > 0
              ? Math.round(dayScores.reduce((s, sc) => s + (sc.total_score || 0), 0) / dayScores.length)
              : 0;
            const hasData = dayScores.length > 0;
            const hasPhotos = datesWithPhotos.has(dateStr);
            const isSelected = selectedDay === dateStr;

            return (
              <div
                key={dateStr}
                className="aspect-square flex items-center justify-center relative cursor-pointer"
                onClick={() => handleDayClick(dateStr)}
              >
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ring-2 transition-all ${
                  isSelected ? 'ring-primary' : 'ring-transparent'
                } ${hasData ? `${getScoreColor(avgScore)} text-white` : 'text-muted-foreground hover:bg-muted/50'}`}>
                  {day.getDate()}
                </div>
                {group.calendar_show_daily_score && hasData && (
                  <span className="absolute -bottom-0.5 text-[7px] font-bold text-muted-foreground">{avgScore}</span>
                )}
                {hasPhotos && (
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-blue-400 rounded-full border border-background" />
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Day photo gallery */}
      <AnimatePresence>
        {selectedDay && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
          >
            <Card className="p-4 rounded-2xl border-border space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-sm">
                    {format(new Date(selectedDay + 'T12:00:00'), "d 'de' MMMM", { locale: ptBR })}
                  </p>
                  <p className="text-xs text-muted-foreground">Fotos dos membros</p>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedDay(null)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {loadingPhotos ? (
                <div className="flex gap-2">
                  {[1, 2].map(i => (
                    <div key={i} className="flex-1 h-24 rounded-xl bg-muted animate-pulse" />
                  ))}
                </div>
              ) : dayPhotos.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <Image className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-xs">Nenhuma foto registrada neste dia</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {dayPhotos.map(member => (
                    <div key={member.user_id} className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Avatar className="w-6 h-6">
                          <AvatarImage src={member.avatar_url || ''} />
                          <AvatarFallback className="text-[9px]">{member.name[0]}</AvatarFallback>
                        </Avatar>
                        <span className="text-xs font-semibold">{member.name}</span>
                      </div>
                      <div className="flex gap-2 overflow-x-auto pb-1">
                        {member.progress_photos.map((url, i) => (
                          <div key={`p-${i}`} className="relative flex-shrink-0">
                            <img
                              src={url}
                              alt="Progresso"
                              className="w-24 h-24 rounded-xl object-cover cursor-pointer hover:opacity-90 transition-opacity"
                              onClick={() => setSelectedPhoto(url)}
                            />
                            <span className="absolute bottom-1 left-1 bg-black/50 text-white text-[9px] rounded px-1 flex items-center gap-0.5">
                              <Camera className="w-2.5 h-2.5" /> Progresso
                            </span>
                          </div>
                        ))}
                        {member.workout_photos.map((url, i) => (
                          <div key={`w-${i}`} className="relative flex-shrink-0">
                            <img
                              src={url}
                              alt="Treino"
                              className="w-24 h-24 rounded-xl object-cover cursor-pointer hover:opacity-90 transition-opacity"
                              onClick={() => setSelectedPhoto(url)}
                            />
                            <span className="absolute bottom-1 left-1 bg-black/50 text-white text-[9px] rounded px-1 flex items-center gap-0.5">
                              <Dumbbell className="w-2.5 h-2.5" /> Treino
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fullscreen photo viewer */}
      <AnimatePresence>
        {selectedPhoto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
            onClick={() => setSelectedPhoto(null)}
          >
            <button className="absolute top-4 right-4 text-white bg-white/20 rounded-full p-2">
              <X className="w-5 h-5" />
            </button>
            <img
              src={selectedPhoto}
              alt="Foto"
              className="max-w-full max-h-full rounded-2xl object-contain"
              onClick={e => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
