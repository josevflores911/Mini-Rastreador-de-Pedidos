import axios from 'axios';
import { getToken, onSessionExpired } from '../auth/authAdapter';

const defaultBaseUrl = import.meta.env.DEV ? 'http://localhost:8080/' : '/';
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || defaultBaseUrl,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // 401: token ausente/expirado/inválido → encerra a sessão local; ProtectedRoute leva ao login.
    // 403: sem permissão → o erro segue para a tela, que mostra a mensagem.
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      onSessionExpired();
    }
    return Promise.reject(error);
  },
);
