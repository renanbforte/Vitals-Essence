// ============================================================================
// use-mobile.tsx  —  DETECTA SE A TELA É DE CELULAR
// ----------------------------------------------------------------------------
// Hook que informa às telas se o app está sendo visto em um aparelho pequeno
// (celular) ou grande (tablet/computador), para ajustar o layout conforme o caso.
// ============================================================================

import * as React from "react";

// Largura (em pixels) que separa "celular" de "tela grande": abaixo de 768 é celular.
const MOBILE_BREAKPOINT = 768;

// Retorna verdadeiro/falso indicando se a tela atual é de celular.
export function useIsMobile() {
  // Guarda o resultado; começa "indefinido" até medir a tela pela primeira vez.
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined);

  // Ao montar, mede a tela e passa a observar mudanças de tamanho (girar, redimensionar).
  React.useEffect(() => {
    // "Sensor" que dispara quando a largura cruza o limite de celular.
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    // Sempre que o tamanho muda, recalcula se é celular.
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    mql.addEventListener("change", onChange);
    // Mede uma vez logo de cara, para já ter o valor correto.
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    // Ao desmontar, remove o observador para não deixar "sensores" pendurados.
    return () => mql.removeEventListener("change", onChange);
  }, []);

  // Converte para verdadeiro/falso garantido (o "!!" transforma indefinido em falso).
  return !!isMobile;
}
