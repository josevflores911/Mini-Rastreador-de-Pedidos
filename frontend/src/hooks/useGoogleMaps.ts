import { useEffect, useState } from 'react';

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;
export const MAPS_CONFIGURED = Boolean(API_KEY && API_KEY.trim());
export const MAP_ID = (import.meta.env.VITE_GOOGLE_MAPS_MAP_ID as string | undefined) || 'DEMO_MAP_ID';

export type MapsStatus = 'disabled' | 'loading' | 'ready' | 'error';

let loader: Promise<void> | null = null;

/** Carrega o script do Google Maps uma única vez (bootstrap oficial com importLibrary). */
function loadGoogleMaps(): Promise<void> {
  if (loader) return loader;
  loader = new Promise<void>((resolve, reject) => {
    if (typeof window.google?.maps?.importLibrary === 'function') return resolve();
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(API_KEY ?? '')}&v=weekly&loading=async&language=pt-BR&region=BR`;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      loader = null;
      reject(new Error('Falha ao carregar o Google Maps.'));
    };
    document.head.appendChild(script);
  });
  return loader;
}

/** Fica 'disabled' sem chave: o app continua funcionando com endereço digitado. */
export function useGoogleMaps(): MapsStatus {
  const [status, setStatus] = useState<MapsStatus>(MAPS_CONFIGURED ? 'loading' : 'disabled');

  useEffect(() => {
    if (!MAPS_CONFIGURED) return;
    let active = true;
    loadGoogleMaps()
      .then(() => Promise.all([google.maps.importLibrary('maps'), google.maps.importLibrary('marker')]))
      .then(() => active && setStatus('ready'))
      .catch(() => active && setStatus('error'));
    return () => {
      active = false;
    };
  }, []);

  // Chave inválida/restrita: o Google chama esta função global.
  useEffect(() => {
    if (!MAPS_CONFIGURED) return;
    const w = window as unknown as { gm_authFailure?: () => void };
    w.gm_authFailure = () => setStatus('error');
    return () => {
      delete w.gm_authFailure;
    };
  }, []);

  return status;
}
