
-- Remover a política permissiva genérica e substituir por políticas específicas por operação
DROP POLICY IF EXISTS "Service role can manage subscriptions" ON public.user_subscriptions;

-- Apenas o service role (via edge functions) pode inserir/atualizar/deletar assinaturas
-- Bloqueamos acesso direto de clientes para INSERT/UPDATE/DELETE
-- (As edge functions usam service role key que bypassa RLS)
-- Adicionar política para que o sistema possa inserir via RPC ou função sem expor ao cliente
