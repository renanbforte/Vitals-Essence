// ============================================================================
// client.ts  —  CONEXÃO COM O SUPABASE
// ----------------------------------------------------------------------------
// Cria UMA única conexão ("cliente") com o Supabase, usada por todo o app para:
//   - login/cadastro (auth)
//   - ler e gravar no banco de dados
//   - subir/baixar arquivos (storage)
//   - chamar as Edge Functions
//
// Como usar em qualquer arquivo:
//   import { supabase } from "@/integrations/supabase/client";
// ============================================================================

import { createClient } from '@supabase/supabase-js'; // função oficial que cria o cliente
import type { Database } from './types';               // tipos das tabelas (gerados do banco)

// Lê as variáveis do arquivo .env (só as que começam com VITE_ chegam ao navegador).
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;                       // URL do projeto Supabase
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY; // chave pública (anon)

// Cria e exporta o cliente. O <Database> dá ao TypeScript o "mapa" das tabelas,
// habilitando autocompletar e checagem de erros nas consultas.
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,   // guarda a sessão de login no navegador (continua logado ao voltar)
    persistSession: true,    // mantém a sessão salva entre visitas
    autoRefreshToken: true,  // renova o token de acesso automaticamente antes de expirar
  }
});
