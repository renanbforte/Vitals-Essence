// ============================================================================
// NavLink — Link de navegação entre páginas do app.
// É um "atalho" para o link de menu do React Router, mas com um detalhe útil:
// permite passar uma classe de estilo extra para quando o link está ATIVO
// (página atual) ou PENDENTE (carregando), deixando o menu destacar sozinho.
// ============================================================================
import { NavLink as RouterNavLink, NavLinkProps } from "react-router-dom";
import { forwardRef } from "react";
import { cn } from "@/lib/utils";

// Formato das informações (props) que este link aceita receber:
// - className: estilo padrão do link
// - activeClassName: estilo aplicado quando é a página atual
// - pendingClassName: estilo aplicado enquanto a página está carregando
interface NavLinkCompatProps extends Omit<NavLinkProps, "className"> {
  className?: string;
  activeClassName?: string;
  pendingClassName?: string;
}

// Componente do link. O "forwardRef" permite que outros componentes
// consigam apontar diretamente para o elemento do link, se precisarem.
const NavLink = forwardRef<HTMLAnchorElement, NavLinkCompatProps>(
  ({ className, activeClassName, pendingClassName, to, ...props }, ref) => {
    // Desenha o link do React Router apontando para o destino "to".
    return (
      <RouterNavLink
        ref={ref}
        to={to}
        // Monta a lista de estilos: sempre o estilo padrão, mais o estilo de
        // "ativo" se for a página atual, mais o de "pendente" se estiver carregando.
        className={({ isActive, isPending }) =>
          cn(className, isActive && activeClassName, isPending && pendingClassName)
        }
        {...props}
      />
    );
  },
);

NavLink.displayName = "NavLink";

export { NavLink };
