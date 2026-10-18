import axios from 'axios';

export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    if (!error.response) {
      return 'Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.';
    }
    const { status, data } = error.response;
    if (status === 401) return 'Sua sessão expirou. Faça login novamente.';
    if (status === 403) return 'Você não tem permissão para realizar esta ação.';
    if (status === 404) return 'Pedido não encontrado.';
    const fromApi =
      (typeof data === 'object' && data && (data.message || data.error || data.detail)) ||
      (Array.isArray(data?.errors) &&
        data.errors
          .map((e: { defaultMessage?: string; message?: string }) => e.defaultMessage ?? e.message)
          .filter(Boolean)
          .join(' '));
    if (fromApi && typeof fromApi === 'string') return fromApi;
    if (status >= 500) return 'O servidor encontrou um problema. Tente novamente em instantes.';
    return 'Não foi possível concluir a solicitação.';
  }
  return error instanceof Error ? error.message : 'Ocorreu um erro inesperado.';
}
