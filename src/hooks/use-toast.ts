// ============================================================================
// use-toast.ts  —  CENTRAL DAS NOTIFICAÇÕES "TOAST" (avisos que aparecem na tela)
// ----------------------------------------------------------------------------
// Controla as pequenas mensagens temporárias ("toasts") que surgem no canto da
// tela — ex.: "Salvo com sucesso" ou "Erro ao entrar". Guarda a lista de avisos
// ativos e oferece as funções para exibir e dispensar esses avisos.
// ============================================================================

import * as React from "react";

import type { ToastActionElement, ToastProps } from "@/components/ui/toast";

// Quantos avisos podem aparecer ao mesmo tempo (aqui, apenas 1 por vez).
const TOAST_LIMIT = 1;
// Tempo (ms) até remover o aviso da memória após ser dispensado (valor bem alto = fica visível).
const TOAST_REMOVE_DELAY = 1000000;

// Formato de um aviso: identificador, título, descrição e um botão de ação opcional.
type ToasterToast = ToastProps & {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: ToastActionElement;
};

// Nomes das operações possíveis sobre os avisos: adicionar, atualizar, dispensar e remover.
const actionTypes = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
} as const;

// Contador usado para gerar um número único para cada aviso.
let count = 0;

// Gera um identificador único (crescente) para cada novo aviso.
function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER;
  return count.toString();
}

type ActionType = typeof actionTypes;

type Action =
  | {
      type: ActionType["ADD_TOAST"];
      toast: ToasterToast;
    }
  | {
      type: ActionType["UPDATE_TOAST"];
      toast: Partial<ToasterToast>;
    }
  | {
      type: ActionType["DISMISS_TOAST"];
      toastId?: ToasterToast["id"];
    }
  | {
      type: ActionType["REMOVE_TOAST"];
      toastId?: ToasterToast["id"];
    };

// A "situação atual": a lista de avisos que estão na tela neste momento.
interface State {
  toasts: ToasterToast[];
}

// Guarda os cronômetros de remoção de cada aviso (para não criar dois para o mesmo).
const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

// Agenda a remoção de um aviso após o tempo definido, depois que ele é dispensado.
const addToRemoveQueue = (toastId: string) => {
  if (toastTimeouts.has(toastId)) {
    return;
  }

  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId);
    dispatch({
      type: "REMOVE_TOAST",
      toastId: toastId,
    });
  }, TOAST_REMOVE_DELAY);

  toastTimeouts.set(toastId, timeout);
};

// "Cérebro" que decide como a lista de avisos muda a cada operação solicitada.
// Recebe a situação atual e uma ação, e devolve a nova situação (sem alterar a antiga).
export const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    // Adiciona um novo aviso no topo da lista, respeitando o limite máximo.
    case "ADD_TOAST":
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      };

    // Atualiza um aviso existente (ex.: trocar o texto) localizando-o pelo identificador.
    case "UPDATE_TOAST":
      return {
        ...state,
        toasts: state.toasts.map((t) => (t.id === action.toast.id ? { ...t, ...action.toast } : t)),
      };

    // Dispensa um aviso: começa a fechá-lo na tela e agenda sua remoção da memória.
    case "DISMISS_TOAST": {
      const { toastId } = action;

      // ! Side effects ! - This could be extracted into a dismissToast() action,
      // but I'll keep it here for simplicity
      // Se veio um id, agenda a remoção só daquele; senão, de todos os avisos.
      if (toastId) {
        addToRemoveQueue(toastId);
      } else {
        state.toasts.forEach((toast) => {
          addToRemoveQueue(toast.id);
        });
      }

      // Marca o(s) aviso(s) como "fechando" (open: false) para a animação de saída.
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === toastId || toastId === undefined
            ? {
                ...t,
                open: false,
              }
            : t,
        ),
      };
    }
    // Remove definitivamente da lista: um aviso específico, ou todos se nenhum id vier.
    case "REMOVE_TOAST":
      if (action.toastId === undefined) {
        return {
          ...state,
          toasts: [],
        };
      }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      };
  }
};

// Lista de "ouvintes": componentes que querem ser avisados quando a lista mudar.
const listeners: Array<(state: State) => void> = [];

// A situação dos avisos guardada fora do React, compartilhada por todo o app.
let memoryState: State = { toasts: [] };

// Aplica uma operação: recalcula a situação e avisa todos os ouvintes para atualizarem.
function dispatch(action: Action) {
  memoryState = reducer(memoryState, action);
  listeners.forEach((listener) => {
    listener(memoryState);
  });
}

// Dados de um aviso, mas sem o id (o id é gerado automaticamente ao criar).
type Toast = Omit<ToasterToast, "id">;

// Função principal chamada pelo app para EXIBIR um aviso. Ex.: toast({ title: "Salvo!" }).
// Devolve atalhos para atualizar ou dispensar esse aviso específico depois.
function toast({ ...props }: Toast) {
  // Cria um id único e prepara as ações de atualizar/dispensar ligadas a esse aviso.
  const id = genId();

  const update = (props: ToasterToast) =>
    dispatch({
      type: "UPDATE_TOAST",
      toast: { ...props, id },
    });
  const dismiss = () => dispatch({ type: "DISMISS_TOAST", toastId: id });

  // Efetivamente coloca o aviso na tela; fecha sozinho quando o usuário o descarta.
  dispatch({
    type: "ADD_TOAST",
    toast: {
      ...props,
      id,
      open: true,
      onOpenChange: (open) => {
        if (!open) dismiss();
      },
    },
  });

  return {
    id: id,
    dismiss,
    update,
  };
}

// Hook que as telas usam para LER a lista de avisos e reagir quando ela muda.
// Devolve os avisos atuais e as funções toast() (exibir) e dismiss() (dispensar).
function useToast() {
  const [state, setState] = React.useState<State>(memoryState);

  // Inscreve-se para receber atualizações; ao sair, cancela a inscrição (evita vazamentos).
  React.useEffect(() => {
    listeners.push(setState);
    return () => {
      const index = listeners.indexOf(setState);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }, [state]);

  return {
    ...state,
    toast,
    dismiss: (toastId?: string) => dispatch({ type: "DISMISS_TOAST", toastId }),
  };
}

export { useToast, toast };
