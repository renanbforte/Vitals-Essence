// ============================================================================
// Feed da Arena (mural do grupo de bem-estar)
// Mostra o mural do grupo: um campo para escrever e postar uma mensagem, seguido
// da lista de posts dos membros com avatar, tempo, pontuação total, texto, foto,
// selos de pontos por pilar (respeitando o nível de transparência do grupo) e
// botões de reação por emoji. Se não houver posts, exibe um estado vazio.
// ============================================================================
import { useState } from 'react';
import { ArenaFeedPost, ArenaFeedComment, ArenaGroup } from '@/hooks/useArena';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Droplets, Utensils, Dumbbell, Send, Flame, MessageCircle, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';

interface ArenaFeedProps {
  posts: ArenaFeedPost[];
  group: ArenaGroup;
  onPost: (data: { post_type: string; content?: string; photo_url?: string }) => void;
  onReact: (postId: string, emoji: string) => void;
  onComment: (postId: string, text: string) => void;
  onDeleteComment: (commentId: string) => void;
}

// Emojis disponíveis para reagir aos posts
const EMOJIS = ['🔥', '💪', '👏', '🎯', '⭐'];

export function ArenaFeed({ posts, group, onPost, onReact, onComment, onDeleteComment }: ArenaFeedProps) {
  // Usuário logado (usado para destacar as reações que ele mesmo deu)
  const { user } = useAuth();
  // Texto que o usuário está digitando no campo de novo post
  const [content, setContent] = useState('');

  // Publica o texto digitado como um novo post e limpa o campo
  const handlePost = () => {
    if (!content.trim()) return;
    onPost({ post_type: 'check_in', content: content.trim() });
    setContent('');
  };

  // Tela: campo para compor um post, a lista de posts e o estado vazio
  return (
    <div className="space-y-4">
      {/* Compose */}
      <Card className="p-4 rounded-2xl border-border">
        <Textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder="Compartilhe seu progresso..."
          rows={2}
          className="resize-none border-0 p-0 focus-visible:ring-0 text-sm"
        />
        <div className="flex justify-end mt-2">
          <Button size="sm" onClick={handlePost} disabled={!content.trim()} className="gap-1 rounded-xl">
            <Send className="w-3.5 h-3.5" />
            Postar
          </Button>
        </div>
      </Card>

      {/* Posts */}
      {posts.map((post, i) => (
        <motion.div
          key={post.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
        >
          <Card className="p-4 rounded-2xl border-border space-y-3">
            <div className="flex items-center gap-3">
              <Avatar className="w-9 h-9">
                <AvatarImage src={post.profile?.avatar_url || ''} />
                <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                  {(post.profile?.name || '?')[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm truncate">{post.profile?.name || 'Usuário'}</p>
                <p className="text-[10px] text-muted-foreground">
                  {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: ptBR })}
                </p>
              </div>
              {post.total_score !== null && post.total_score !== undefined && (
                <div className="text-right">
                  <p className="text-lg font-extrabold text-primary">{post.total_score}</p>
                  <p className="text-[10px] text-muted-foreground">pts</p>
                </div>
              )}
            </div>

            {post.content && <p className="text-sm">{post.content}</p>}

            {post.photo_url && (
              <img src={post.photo_url} alt="Post" className="rounded-xl w-full max-h-64 object-cover" />
            )}

            {/* Score badges */}
            {(post.hydration_score !== null || post.nutrition_score !== null || post.workout_score !== null) && group.transparency_level !== 'discreet' && (
              <div className="flex gap-2">
                {group.pillar_hydration && post.hydration_score !== null && (
                  <span className="inline-flex items-center gap-1 text-xs bg-blue-500/10 text-blue-600 px-2 py-1 rounded-lg">
                    <Droplets className="w-3 h-3" /> {post.hydration_score}
                  </span>
                )}
                {group.pillar_nutrition && post.nutrition_score !== null && (
                  <span className="inline-flex items-center gap-1 text-xs bg-green-500/10 text-green-600 px-2 py-1 rounded-lg">
                    <Utensils className="w-3 h-3" /> {post.nutrition_score}
                  </span>
                )}
                {group.pillar_workout && post.workout_score !== null && (
                  <span className="inline-flex items-center gap-1 text-xs bg-orange-500/10 text-orange-600 px-2 py-1 rounded-lg">
                    <Dumbbell className="w-3 h-3" /> {post.workout_score}
                  </span>
                )}
              </div>
            )}

            {/* Reactions */}
            <div className="flex items-center gap-1 flex-wrap">
              {EMOJIS.map(emoji => {
                const count = post.reactions?.filter(r => r.emoji === emoji).length || 0;
                const myReaction = post.reactions?.some(r => r.emoji === emoji && r.user_id === user?.id);
                return (
                  <button
                    key={emoji}
                    onClick={() => onReact(post.id, emoji)}
                    className={`px-2 py-0.5 rounded-full text-xs transition-all ${myReaction ? 'bg-primary/15 border border-primary/30' : 'bg-muted hover:bg-muted/80 border border-transparent'}`}
                  >
                    {emoji} {count > 0 && <span className="font-semibold">{count}</span>}
                  </button>
                );
              })}
            </div>

            {/* Comentários */}
            <CommentSection
              comments={post.comments || []}
              currentUserId={user?.id}
              onComment={(text) => onComment(post.id, text)}
              onDelete={onDeleteComment}
            />
          </Card>
        </motion.div>
      ))}

      {posts.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Flame className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p className="text-sm">Nenhum post ainda</p>
          <p className="text-xs">Seja o primeiro a compartilhar!</p>
        </div>
      )}
    </div>
  );
}

// Lista de comentários de um post + campo para comentar. Cada comentário mostra
// autor, texto e tempo; o próprio autor pode apagar o seu.
function CommentSection({ comments, currentUserId, onComment, onDelete }: {
  comments: ArenaFeedComment[];
  currentUserId?: string;
  onComment: (text: string) => void;
  onDelete: (commentId: string) => void;
}) {
  const [text, setText] = useState('');

  const submit = () => {
    const t = text.trim();
    if (!t) return;
    onComment(t);
    setText('');
  };

  return (
    <div className="pt-1 border-t border-border/50 space-y-2">
      {comments.map(c => (
        <div key={c.id} className="flex items-start gap-2 group">
          <Avatar className="w-6 h-6 mt-0.5 shrink-0">
            <AvatarImage src={c.profile?.avatar_url || ''} />
            <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-bold">
              {(c.profile?.name || '?')[0]}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-xs">
              <span className="font-bold">{c.profile?.name || 'Usuário'}</span>{' '}
              <span className="text-muted-foreground">{c.text}</span>
            </p>
            <p className="text-[9px] text-muted-foreground/70">
              {formatDistanceToNow(new Date(c.created_at), { addSuffix: true, locale: ptBR })}
            </p>
          </div>
          {c.user_id === currentUserId && (
            <button
              onClick={() => onDelete(c.id)}
              className="text-muted-foreground/40 hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
              aria-label="Apagar comentário"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>
      ))}

      <div className="flex items-center gap-2">
        <MessageCircle className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
        <Input
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') submit(); }}
          placeholder="Comentar..."
          className="h-8 text-xs border-0 bg-muted/50 rounded-lg focus-visible:ring-1"
        />
        {text.trim() && (
          <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0 text-primary" onClick={submit}>
            <Send className="w-3.5 h-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
}
