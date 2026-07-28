// ============================================================================
// NotFound  —  TELA DE ERRO 404 (PÁGINA NÃO ENCONTRADA)
// ----------------------------------------------------------------------------
// Tela mostrada quando o usuário digita ou acessa um endereço que não existe
// no app. Exibe o aviso "404 / Page not found" e um link para voltar ao início.
// ============================================================================

// Ferramentas do React para saber qual endereço o usuário tentou abrir e para
// rodar código quando a tela aparece.
import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  // Descobre qual foi o endereço (rota) que o usuário tentou acessar.
  const location = useLocation();

  // Quando a tela abre, registra no console do navegador qual endereço
  // inexistente foi acessado — útil para o desenvolvedor investigar depois.
  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  // Parte visual da tela.
  return (
    // Caixa que centraliza o conteúdo no meio da tela, ocupando a altura toda.
    <div className="flex min-h-screen items-center justify-center bg-muted">
      {/* Bloco central com o texto do erro e o link de retorno */}
      <div className="text-center">
        {/* Número grande "404" */}
        <h1 className="mb-4 text-4xl font-bold">404</h1>
        {/* Mensagem explicando que a página não foi encontrada */}
        <p className="mb-4 text-xl text-muted-foreground">Oops! Page not found</p>
        {/* Link que leva o usuário de volta para a página inicial */}
        <a href="/" className="text-primary underline hover:text-primary/90">
          Return to Home
        </a>
      </div>
    </div>
  );
};

export default NotFound;
