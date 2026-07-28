// ============================================================================
// Terms  —  TELA DE TERMOS DE USO E POLÍTICA DE PRIVACIDADE
// ----------------------------------------------------------------------------
// Página estática (rota /termos) que apenas exibe o texto legal do app:
// termos de uso, LGPD, dados coletados, direitos do usuário, etc.
// O usuário só lê e pode voltar para a tela anterior pelo botão de seta.
// ============================================================================

// Ícone da seta de "voltar" e ferramenta de navegação entre telas.
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function Terms() {
  // Permite voltar para a tela anterior ao clicar na seta.
  const navigate = useNavigate();

  return (
    // Container geral que ocupa a tela inteira com o fundo padrão do app.
    <div className="min-h-screen bg-background">
      {/* Cabeçalho fixo no topo: seta de voltar + título da página */}
      <div className="sticky top-0 z-10 bg-card/80 backdrop-blur-md border-b border-border px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          {/* Botão de voltar: navigate(-1) retorna à tela anterior */}
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-xl">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-bold text-foreground">Termos de Uso e Política de Privacidade</h1>
        </div>
      </div>

      {/* Corpo do documento legal: apenas texto (títulos, parágrafos e listas).
          As classes "prose" cuidam da tipografia/leitura. Todo o conteúdo abaixo
          é fixo — não há lógica, botões ou dados dinâmicos. */}
      <div className="max-w-3xl mx-auto px-4 py-8 prose prose-sm dark:prose-invert prose-headings:text-foreground prose-p:text-muted-foreground prose-li:text-muted-foreground prose-strong:text-foreground">
        <p className="text-xs text-muted-foreground">Última atualização: 21 de fevereiro de 2026</p>

        {/* Seções 1 a 4: aceitação, descrição do serviço, cadastro e conteúdo do usuário */}
        <h2>1. Aceitação dos Termos</h2>
        <p>
          Ao criar uma conta e utilizar o aplicativo <strong>Vitalis Essence</strong> ("Aplicativo"), você ("Usuário") concorda integralmente com os presentes Termos de Uso e Política de Privacidade ("Termos"). O uso do Aplicativo está condicionado à aceitação destes Termos. Caso não concorde, não utilize o Aplicativo.
        </p>

        <h2>2. Descrição do Serviço</h2>
        <p>
          O Vitalis Essence é uma plataforma digital de gestão pessoal que oferece funcionalidades de acompanhamento de saúde, finanças, vida pessoal, astrologia, viagens e outros módulos de organização pessoal. O Aplicativo não substitui aconselhamento médico, financeiro, jurídico ou profissional de qualquer natureza.
        </p>

        <h2>3. Cadastro e Conta</h2>
        <p>
          O Usuário compromete-se a fornecer informações verdadeiras, completas e atualizadas no momento do cadastro. O Usuário é integralmente responsável pela confidencialidade de suas credenciais de acesso (e-mail e senha) e por todas as atividades realizadas em sua conta.
        </p>

        <h2>4. Direitos de Imagem e Conteúdo do Usuário</h2>
        <p>
          Ao fazer upload de fotos, imagens ou qualquer conteúdo audiovisual no Aplicativo ("Conteúdo do Usuário"), o Usuário declara e garante que:
        </p>
        <ul>
          <li>Possui todos os direitos de imagem, autorais e de propriedade intelectual necessários sobre o Conteúdo do Usuário;</li>
          <li>Obteve autorização expressa de terceiros que eventualmente apareçam nas imagens, conforme exigido pela <strong>Lei nº 10.406/2002 (Código Civil Brasileiro, art. 20)</strong> e pela <strong>Constituição Federal (art. 5º, X)</strong>;</li>
          <li>O Conteúdo do Usuário não viola direitos de propriedade intelectual, privacidade, honra ou imagem de terceiros;</li>
          <li>O Conteúdo do Usuário não contém material ilegal, ofensivo, discriminatório, difamatório ou que viole quaisquer leis aplicáveis.</li>
        </ul>
        <p>
          O Usuário concede ao Vitalis Essence uma <strong>licença limitada, não exclusiva, revogável e intransferível</strong> para armazenar, processar e exibir o Conteúdo do Usuário exclusivamente para fins de prestação do serviço contratado. O Vitalis Essence <strong>não utilizará</strong> o Conteúdo do Usuário para fins publicitários, comerciais ou de marketing sem autorização expressa e prévia do Usuário.
        </p>

        {/* Seção 5 e 6: bloco central da LGPD — quais dados são coletados,
            para quê, base legal, compartilhamento, direitos e dados sensíveis */}
        <h2>5. Proteção de Dados Pessoais (LGPD)</h2>
        <p>
          Em conformidade com a <strong>Lei Geral de Proteção de Dados (Lei nº 13.709/2018 — LGPD)</strong>, informamos:
        </p>
        <h3>5.1. Dados Coletados</h3>
        <ul>
          <li><strong>Dados de identificação:</strong> nome, e-mail, data de nascimento e CPF;</li>
          <li><strong>Dados de saúde:</strong> peso, registros alimentares, hidratação, treinos, ciclo menstrual, medicamentos e exames;</li>
          <li><strong>Dados financeiros:</strong> registros de transações, investimentos e metas financeiras;</li>
          <li><strong>Dados de localização:</strong> apenas quando explicitamente autorizado pelo Usuário (ex.: rastreamento de rotas de treino);</li>
          <li><strong>Dados astrológicos:</strong> data, hora e local de nascimento;</li>
          <li><strong>Imagens:</strong> fotos de perfil, fotos de progresso, fotos de refeições e documentos de exames;</li>
          <li><strong>Dados de uso:</strong> interações com o Aplicativo, preferências e configurações.</li>
        </ul>

        <h3>5.2. Finalidade do Tratamento</h3>
        <p>Os dados são tratados exclusivamente para:</p>
        <ul>
          <li>Prestação e melhoria dos serviços do Aplicativo;</li>
          <li>Personalização da experiência do Usuário;</li>
          <li>Geração de relatórios e análises pessoais para o próprio Usuário;</li>
          <li>Comunicações relacionadas ao serviço (atualizações, alertas de segurança);</li>
          <li>Cumprimento de obrigações legais e regulatórias.</li>
        </ul>

        <h3>5.3. Base Legal</h3>
        <p>
          O tratamento de dados pessoais é realizado com base no <strong>consentimento do titular</strong> (art. 7º, I da LGPD), na <strong>execução de contrato</strong> (art. 7º, V) e no <strong>legítimo interesse</strong> do controlador (art. 7º, IX), quando aplicável.
        </p>

        <h3>5.4. Compartilhamento de Dados</h3>
        <p>
          Os dados pessoais <strong>não serão vendidos, alugados ou cedidos</strong> a terceiros para fins comerciais. O compartilhamento ocorrerá apenas:
        </p>
        <ul>
          <li>Com prestadores de serviço essenciais à operação (hospedagem, processamento de pagamentos), mediante contratos de proteção de dados;</li>
          <li>Por determinação judicial ou requisição de autoridade competente;</li>
          <li>Com outros Usuários, exclusivamente quando o próprio Usuário ativar funcionalidades sociais (amizades, grupos).</li>
        </ul>

        <h3>5.5. Direitos do Titular</h3>
        <p>Conforme a LGPD, o Usuário tem direito a:</p>
        <ul>
          <li>Confirmar a existência de tratamento de seus dados;</li>
          <li>Acessar, corrigir e atualizar seus dados pessoais;</li>
          <li>Solicitar a anonimização, bloqueio ou eliminação de dados;</li>
          <li>Revogar o consentimento a qualquer momento;</li>
          <li>Solicitar a portabilidade dos dados;</li>
          <li>Obter informações sobre compartilhamento de dados.</li>
        </ul>
        <p>
          Para exercer qualquer desses direitos, o Usuário deve enviar solicitação através das configurações da conta ou pelo e-mail de contato disponibilizado no Aplicativo.
        </p>

        <h3>5.6. Retenção e Exclusão</h3>
        <p>
          Os dados serão mantidos enquanto a conta estiver ativa. Após a exclusão da conta, os dados serão removidos no prazo de até <strong>30 (trinta) dias</strong>, exceto quando houver obrigação legal de retenção.
        </p>

        <h2>6. Dados Sensíveis</h2>
        <p>
          Reconhecemos que o Aplicativo pode tratar <strong>dados pessoais sensíveis</strong> (dados de saúde, vida sexual), conforme definido no art. 5º, II da LGPD. O tratamento desses dados ocorre <strong>exclusivamente com o consentimento específico e destacado do titular</strong> (art. 11, I da LGPD), mediante a aceitação destes Termos.
        </p>

        {/* Seções 7 a 10: segurança, propriedade intelectual, isenção de
            responsabilidade e indenização */}
        <h2>7. Segurança dos Dados</h2>
        <p>
          Empregamos medidas técnicas e administrativas adequadas para proteger os dados pessoais contra acessos não autorizados, destruição, perda, alteração ou vazamento, incluindo:
        </p>
        <ul>
          <li>Criptografia de dados em trânsito (TLS/SSL) e em repouso;</li>
          <li>Controles de acesso baseados em função (RLS — Row Level Security);</li>
          <li>Autenticação segura com hash de senhas;</li>
          <li>Monitoramento contínuo de segurança.</li>
        </ul>

        <h2>8. Propriedade Intelectual</h2>
        <p>
          Todo o conteúdo do Aplicativo — incluindo, mas não se limitando a, código-fonte, design, textos, gráficos, logotipos, ícones, imagens, interfaces e funcionalidades — é de propriedade exclusiva do Vitalis Essence, protegido pela <strong>Lei nº 9.610/1998 (Lei de Direitos Autorais)</strong> e pela <strong>Lei nº 9.279/1996 (Lei de Propriedade Industrial)</strong>.
        </p>
        <p>
          É expressamente proibido reproduzir, copiar, modificar, distribuir, transmitir, exibir, vender, licenciar ou explorar qualquer conteúdo do Aplicativo sem autorização prévia e por escrito.
        </p>

        <h2>9. Isenção de Responsabilidade</h2>
        <ul>
          <li>O Aplicativo é fornecido "como está" (<em>as is</em>), sem garantias de qualquer natureza, expressas ou implícitas;</li>
          <li>As informações de saúde, financeiras e astrológicas apresentadas têm <strong>caráter meramente informativo e não constituem aconselhamento profissional</strong>;</li>
          <li>O Vitalis Essence <strong>não se responsabiliza</strong> por decisões tomadas pelo Usuário com base nas informações do Aplicativo;</li>
          <li>O Vitalis Essence <strong>não se responsabiliza</strong> por perdas ou danos decorrentes de interrupções, falhas técnicas, vírus ou ataques cibernéticos, desde que não tenha agido com dolo ou culpa grave;</li>
          <li>O Vitalis Essence <strong>não se responsabiliza</strong> pelo Conteúdo do Usuário publicado ou compartilhado pelo próprio Usuário.</li>
        </ul>

        <h2>10. Indenização</h2>
        <p>
          O Usuário concorda em indenizar, defender e isentar o Vitalis Essence, seus diretores, funcionários, parceiros e prestadores de serviço de quaisquer reclamações, perdas, danos, custos e despesas (incluindo honorários advocatícios) decorrentes de:
        </p>
        <ul>
          <li>Violação destes Termos pelo Usuário;</li>
          <li>Conteúdo do Usuário que viole direitos de terceiros;</li>
          <li>Uso indevido do Aplicativo.</li>
        </ul>

        {/* Seções 11 a 19: planos e pagamentos, conduta, menores, alterações,
            rescisão, cookies, foro, disposições gerais e contato */}
        <h2>11. Planos e Pagamentos</h2>
        <p>
          O Aplicativo pode oferecer planos gratuitos e pagos. Para planos pagos:
        </p>
        <ul>
          <li>Os valores e condições serão informados antes da contratação;</li>
          <li>O Usuário pode cancelar a assinatura a qualquer momento, conforme o <strong>Código de Defesa do Consumidor (Lei nº 8.078/1990)</strong>;</li>
          <li>O direito de arrependimento de 7 dias é garantido para compras realizadas fora do estabelecimento comercial (art. 49 do CDC);</li>
          <li>A renovação automática será previamente informada ao Usuário.</li>
        </ul>

        <h2>12. Conduta do Usuário</h2>
        <p>O Usuário compromete-se a não:</p>
        <ul>
          <li>Utilizar o Aplicativo para fins ilegais ou não autorizados;</li>
          <li>Fazer upload de conteúdo que viole direitos de terceiros;</li>
          <li>Tentar acessar dados de outros Usuários de forma não autorizada;</li>
          <li>Utilizar bots, scrapers ou ferramentas automatizadas não autorizadas;</li>
          <li>Interferir na segurança ou funcionamento do Aplicativo.</li>
        </ul>

        <h2>13. Menores de Idade</h2>
        <p>
          O Aplicativo é destinado a maiores de <strong>18 (dezoito) anos</strong>. Menores entre 16 e 18 anos podem utilizar o Aplicativo com consentimento expresso dos pais ou responsáveis legais, conforme o <strong>Estatuto da Criança e do Adolescente (Lei nº 8.069/1990)</strong> e a LGPD (art. 14).
        </p>

        <h2>14. Modificações dos Termos</h2>
        <p>
          O Vitalis Essence reserva-se o direito de modificar estes Termos a qualquer momento. As alterações serão comunicadas ao Usuário por meio do Aplicativo ou por e-mail. O uso continuado após a notificação constitui aceitação das modificações.
        </p>

        <h2>15. Rescisão</h2>
        <p>
          O Vitalis Essence pode suspender ou encerrar a conta do Usuário, a qualquer tempo, em caso de violação destes Termos, sem prejuízo de outras medidas cabíveis. O Usuário pode excluir sua conta a qualquer momento através das configurações do Aplicativo.
        </p>

        <h2>16. Cookies e Tecnologias de Rastreamento</h2>
        <p>
          O Aplicativo pode utilizar cookies e tecnologias similares para melhorar a experiência do Usuário, manter a sessão ativa e coletar dados analíticos agregados. O Usuário pode gerenciar as preferências de cookies nas configurações do seu dispositivo.
        </p>

        <h2>17. Legislação Aplicável e Foro</h2>
        <p>
          Estes Termos são regidos pelas leis da <strong>República Federativa do Brasil</strong>. Fica eleito o foro da comarca do domicílio do Usuário para dirimir quaisquer controvérsias, conforme o <strong>art. 101, I do Código de Defesa do Consumidor</strong>.
        </p>

        <h2>18. Disposições Gerais</h2>
        <ul>
          <li>Se qualquer cláusula destes Termos for considerada inválida ou inexequível, as demais cláusulas permanecerão em pleno vigor;</li>
          <li>A tolerância quanto ao descumprimento de qualquer disposição não implica renúncia ao direito de exigi-la;</li>
          <li>Estes Termos constituem o acordo integral entre as partes em relação ao uso do Aplicativo.</li>
        </ul>

        <h2>19. Contato</h2>
        <p>
          Para dúvidas, sugestões ou exercício de direitos relativos aos seus dados pessoais, entre em contato através das configurações do Aplicativo ou pelo canal de atendimento disponibilizado.
        </p>

        {/* Aviso final destacado: reforça que criar conta = aceitar os termos */}
        <div className="mt-8 p-4 rounded-xl bg-muted/50 border border-border">
          <p className="text-xs text-muted-foreground text-center">
            Ao criar uma conta no Vitalis Essence, você declara ter lido, compreendido e aceitado integralmente estes Termos de Uso e Política de Privacidade.
          </p>
        </div>
      </div>
    </div>
  );
}
