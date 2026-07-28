// ============================================================================
// Privacy  —  TELA DA POLÍTICA DE PRIVACIDADE (rota /privacidade)
// ----------------------------------------------------------------------------
// Página só de leitura: mostra o texto completo da Política de Privacidade
// do app (conforme a LGPD). O usuário apenas lê e pode voltar pela seta.
// Não salva nada e não fala com o banco de dados — é conteúdo fixo.
// ============================================================================

// Ícone de seta (voltar), ferramenta de troca de tela e o botão padrão do app.
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function Privacy() {
  // "navigate" permite mudar de tela (aqui, usado para voltar à tela anterior).
  const navigate = useNavigate();

  return (
    // Caixa que ocupa a tela inteira com a cor de fundo padrão do app
    <div className="min-h-screen bg-background">
      {/* Cabeçalho fixo no topo: fica grudado ao rolar a página */}
      <div className="sticky top-0 z-10 bg-card/80 backdrop-blur-md border-b border-border px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          {/* Botão de seta que leva o usuário de volta à tela anterior */}
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-xl">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-bold text-foreground">Política de Privacidade</h1>
        </div>
      </div>

      {/* Corpo do texto: todo o conteúdo da política, formatado para leitura */}
      <div className="max-w-3xl mx-auto px-4 py-8 prose prose-sm dark:prose-invert prose-headings:text-foreground prose-p:text-muted-foreground prose-li:text-muted-foreground prose-strong:text-foreground">
        {/* Data da última revisão do documento */}
        <p className="text-xs text-muted-foreground">Última atualização: 21 de fevereiro de 2026</p>

        {/* Seção 1 — Introdução: quem é a empresa e a que lei ela se submete */}
        <h2>1. Introdução</h2>
        <p>
          A <strong>Vitalis Essence</strong> ("nós", "nosso") está comprometida com a proteção da privacidade dos nossos usuários ("você", "Usuário"). Esta Política de Privacidade descreve como coletamos, usamos, armazenamos e protegemos suas informações pessoais ao utilizar nosso aplicativo.
        </p>
        <p>
          Esta política está em conformidade com a <strong>Lei Geral de Proteção de Dados (Lei nº 13.709/2018 — LGPD)</strong> e demais legislações aplicáveis.
        </p>

        {/* Seção 2 — Que dados o app coleta (divide em: o que você digita e o que é automático) */}
        <h2>2. Dados que Coletamos</h2>
        <h3>2.1. Dados fornecidos por você</h3>
        <ul>
          <li><strong>Dados de cadastro:</strong> nome, e-mail, data de nascimento;</li>
          <li><strong>Dados de saúde:</strong> peso, registros alimentares, hidratação, treinos, medicamentos, exames laboratoriais e ciclo menstrual;</li>
          <li><strong>Dados financeiros:</strong> registros de transações, investimentos e metas financeiras;</li>
          <li><strong>Dados astrológicos:</strong> data, hora e local de nascimento;</li>
          <li><strong>Imagens:</strong> fotos de perfil, progresso, refeições e documentos de exames;</li>
          <li><strong>Dados de viagens:</strong> destinos, itinerários e despesas.</li>
        </ul>

        {/* Dados captados sozinhos pelo sistema (uso, aparelho e localização quando permitida) */}
        <h3>2.2. Dados coletados automaticamente</h3>
        <ul>
          <li><strong>Dados de uso:</strong> interações com o aplicativo, páginas visitadas e funcionalidades utilizadas;</li>
          <li><strong>Dados do dispositivo:</strong> tipo de dispositivo, sistema operacional e navegador;</li>
          <li><strong>Dados de localização:</strong> apenas quando explicitamente autorizado (ex.: rotas de treino).</li>
        </ul>

        {/* Seção 3 — Para que os dados são usados (melhorar o app, personalizar, avisar, etc.) */}
        <h2>3. Como Usamos seus Dados</h2>
        <p>Utilizamos seus dados exclusivamente para:</p>
        <ul>
          <li>Fornecer e melhorar os serviços do aplicativo;</li>
          <li>Personalizar sua experiência;</li>
          <li>Gerar relatórios e análises pessoais para você;</li>
          <li>Enviar notificações relacionadas ao serviço (lembretes de medicação, hidratação, etc.);</li>
          <li>Garantir a segurança da sua conta;</li>
          <li>Cumprir obrigações legais e regulatórias.</li>
        </ul>

        {/* Seção 4 — Dados sensíveis (saúde/vida sexual): só tratados com consentimento específico */}
        <h2>4. Dados Sensíveis</h2>
        <p>
          Reconhecemos que tratamos <strong>dados pessoais sensíveis</strong> (dados de saúde e vida sexual), conforme definido no art. 5º, II da LGPD. O tratamento ocorre <strong>exclusivamente com seu consentimento específico</strong> (art. 11, I da LGPD) e para fins de prestação do serviço.
        </p>

        {/* Seção 5 — Compartilhamento: nada é vendido; só em casos essenciais/legais/sociais */}
        <h2>5. Compartilhamento de Dados</h2>
        <p>Seus dados pessoais <strong>não são vendidos, alugados ou cedidos</strong> a terceiros. O compartilhamento ocorre apenas:</p>
        <ul>
          <li>Com prestadores de serviço essenciais (hospedagem em nuvem, processamento de pagamentos), sob contratos de proteção de dados;</li>
          <li>Por determinação judicial ou requisição de autoridade competente;</li>
          <li>Com outros usuários, apenas quando você ativar funcionalidades sociais (amizades, grupos da Arena).</li>
        </ul>

        {/* Seção 6 — Segurança: como os dados são protegidos (criptografia, backups, etc.) */}
        <h2>6. Armazenamento e Segurança</h2>
        <p>Empregamos medidas técnicas e administrativas para proteger seus dados:</p>
        <ul>
          <li>Criptografia de dados em trânsito (TLS/SSL) e em repouso;</li>
          <li>Controles de acesso baseados em função (Row Level Security);</li>
          <li>Autenticação segura com hash de senhas;</li>
          <li>Monitoramento contínuo de segurança;</li>
          <li>Backups regulares com redundância geográfica.</li>
        </ul>

        {/* Seção 7 — Direitos do usuário pela LGPD (acessar, corrigir, apagar, revogar, etc.) */}
        <h2>7. Seus Direitos (LGPD)</h2>
        <p>Você tem direito a:</p>
        <ul>
          <li>Confirmar a existência de tratamento dos seus dados;</li>
          <li>Acessar, corrigir e atualizar seus dados pessoais;</li>
          <li>Solicitar a anonimização, bloqueio ou eliminação de dados;</li>
          <li>Revogar o consentimento a qualquer momento;</li>
          <li>Solicitar a portabilidade dos dados;</li>
          <li>Obter informações sobre compartilhamento de dados;</li>
          <li>Excluir sua conta e todos os dados associados.</li>
        </ul>
        <p>
          Para exercer seus direitos, acesse as configurações da sua conta no aplicativo ou entre em contato pelo nosso canal de suporte.
        </p>

        {/* Seção 8 — Por quanto tempo os dados ficam guardados (apagados em até 30 dias após excluir a conta) */}
        <h2>8. Retenção de Dados</h2>
        <p>
          Seus dados são mantidos enquanto sua conta estiver ativa. Após a exclusão da conta, os dados serão removidos em até <strong>30 (trinta) dias</strong>, exceto quando houver obrigação legal de retenção.
        </p>

        {/* Seção 9 — Uso de cookies para manter a sessão e melhorar a experiência */}
        <h2>9. Cookies e Tecnologias Similares</h2>
        <p>
          Utilizamos cookies e tecnologias similares para manter sua sessão ativa e melhorar a experiência de uso. Você pode gerenciar as preferências de cookies nas configurações do seu dispositivo.
        </p>

        {/* Seção 10 — Idade mínima: app para maiores de 18; entre 16 e 18 só com autorização dos pais */}
        <h2>10. Menores de Idade</h2>
        <p>
          O aplicativo é destinado a maiores de <strong>18 anos</strong>. Menores entre 16 e 18 anos podem usar o aplicativo com consentimento dos pais ou responsáveis legais.
        </p>

        {/* Seção 11 — Aviso de que a política pode mudar e que o uso continuado significa aceite */}
        <h2>11. Alterações nesta Política</h2>
        <p>
          Podemos atualizar esta Política de Privacidade periodicamente. As alterações serão comunicadas por meio do aplicativo. O uso continuado após a notificação constitui aceitação das modificações.
        </p>

        {/* Seção 12 — Como falar com a empresa em caso de dúvidas sobre privacidade */}
        <h2>12. Contato</h2>
        <p>
          Para dúvidas sobre esta Política de Privacidade ou sobre o tratamento dos seus dados pessoais, entre em contato através do canal de suporte no aplicativo.
        </p>

        {/* Rodapé com a marca e o aviso de direitos autorais */}
        <div className="mt-8 p-4 rounded-xl bg-muted/50 border border-border">
          <p className="text-xs text-muted-foreground text-center">
            © 2026 Vitalis Essence — Vida em Funcionamento. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </div>
  );
}
