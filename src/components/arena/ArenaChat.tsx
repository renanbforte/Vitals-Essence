// ============================================================================
// ArenaChat — Chat do grupo da Arena
// ----------------------------------------------------------------------------
// Conversa em grupo do desafio: mostra as mensagens (as minhas alinhadas à
// direita, as dos outros à esquerda, com avatar e nome) e um campo para enviar.
// As novas mensagens chegam em tempo real para todos os membros.
// ============================================================================
import { useEffect, useRef, useState } from 'react';
import { useArenaChat } from '@/hooks/useArenaChat';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, MessagesSquare } from 'lucide-react';
import { format } from 'date-fns';

export function ArenaChat({ groupId }: { groupId: string }) {
  const { messages, sendMessage, currentUserId } = useArenaChat(groupId);
  const [text, setText] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  // Rola para a última mensagem quando chegam novas.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const submit = () => {
    const t = text.trim();
    if (!t) return;
    sendMessage.mutate(t);
    setText('');
  };

  return (
    <div className="flex flex-col h-[55vh] rounded-2xl border border-border bg-card overflow-hidden">
      {/* Mensagens */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
            <MessagesSquare className="w-10 h-10 mb-2 opacity-30" />
            <p className="text-sm">Nenhuma mensagem ainda</p>
            <p className="text-xs">Dê o primeiro oi para o grupo!</p>
          </div>
        )}
        {messages.map(m => {
          const mine = m.user_id === currentUserId;
          return (
            <div key={m.id} className={`flex items-end gap-2 ${mine ? 'flex-row-reverse' : ''}`}>
              {!mine && (
                <Avatar className="w-7 h-7 shrink-0">
                  <AvatarImage src={m.profile?.avatar_url || ''} />
                  <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-bold">
                    {(m.profile?.name || '?')[0]}
                  </AvatarFallback>
                </Avatar>
              )}
              <div className={`max-w-[75%] ${mine ? 'items-end' : 'items-start'} flex flex-col`}>
                {!mine && <span className="text-[10px] text-muted-foreground font-semibold px-1">{m.profile?.name || 'Usuário'}</span>}
                <div className={`rounded-2xl px-3 py-2 text-sm ${mine ? 'gradient-health text-white rounded-br-sm' : 'bg-muted rounded-bl-sm'}`}>
                  {m.text}
                </div>
                <span className="text-[9px] text-muted-foreground/60 px-1 mt-0.5">
                  {format(new Date(m.created_at), 'HH:mm')}
                </span>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Campo de envio */}
      <div className="flex items-center gap-2 p-2 border-t border-border bg-background">
        <Input
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') submit(); }}
          placeholder="Mensagem para o grupo..."
          className="h-10 rounded-xl border-0 bg-muted/50"
        />
        <Button size="icon" onClick={submit} disabled={!text.trim()} className="h-10 w-10 rounded-xl shrink-0 gradient-health text-white border-0">
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
