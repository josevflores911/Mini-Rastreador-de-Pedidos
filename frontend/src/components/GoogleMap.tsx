import { useEffect, useRef } from 'react';
import { MapPin } from 'lucide-react';
import { MAP_ID, useGoogleMaps } from '../hooks/useGoogleMaps';

export interface LatLng { lat: number; lng: number }

interface Props {
  position?: LatLng | null;
  draggable?: boolean;
  /** Chamado ao arrastar o marcador ou clicar no mapa (quando draggable). */
  onPositionChange?: (pos: LatLng) => void;
  className?: string;
  label: string;
}

const SAO_PAULO: LatLng = { lat: -23.55052, lng: -46.633308 };

/** Mapa real (Google Maps JavaScript API) com um marcador de entrega. */
export function GoogleMap({ position, draggable = false, onPositionChange, className = 'h-72', label }: Props) {
  const status = useGoogleMaps();
  const hostRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);
  const cbRef = useRef(onPositionChange);
  cbRef.current = onPositionChange;

  useEffect(() => {
    if (status !== 'ready' || !hostRef.current || mapRef.current) return;
    const map = new google.maps.Map(hostRef.current, {
      center: position ?? SAO_PAULO,
      zoom: position ? 16 : 11,
      mapId: MAP_ID,
      streetViewControl: false,
      mapTypeControl: false,
      fullscreenControl: false,
      gestureHandling: 'cooperative',
    });
    mapRef.current = map;

    const marker = new google.maps.marker.AdvancedMarkerElement({
      map: position ? map : null,
      position: position ?? SAO_PAULO,
      gmpDraggable: draggable,
      title: 'Local de entrega',
    });
    markerRef.current = marker;

    if (draggable) {
      marker.addListener('dragend', () => {
        const p = marker.position as google.maps.LatLngLiteral | google.maps.LatLng | null;
        if (!p) return;
        const lat = typeof p.lat === 'function' ? p.lat() : p.lat;
        const lng = typeof p.lng === 'function' ? p.lng() : p.lng;
        cbRef.current?.({ lat, lng });
      });
      map.addListener('click', (e: google.maps.MapMouseEvent) => {
        if (e.latLng) cbRef.current?.({ lat: e.latLng.lat(), lng: e.latLng.lng() });
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  useEffect(() => {
    const map = mapRef.current;
    const marker = markerRef.current;
    if (!map || !marker) return;
    if (position) {
      marker.position = position;
      marker.map = map;
      map.panTo(position);
      if ((map.getZoom() ?? 0) < 15) map.setZoom(16);
    } else {
      marker.map = null;
    }
  }, [position?.lat, position?.lng, status]);

  if (status === 'disabled' || status === 'error') {
    return (
      <div className={`flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-paper-300 bg-paper-100 p-6 text-center ${className}`} role="note">
        <MapPin className="h-6 w-6 text-ink-500" aria-hidden />
        <p className="text-sm font-semibold text-ink-700">
          {status === 'disabled' ? 'Mapa indisponível: Google Maps não configurado' : 'Não foi possível carregar o Google Maps'}
        </p>
        <p className="max-w-sm text-xs text-ink-500">
          {status === 'disabled'
            ? 'Defina VITE_GOOGLE_MAPS_API_KEY no arquivo .env.local. O endereço continua disponível em texto.'
            : 'Verifique a chave, as APIs habilitadas e as restrições de domínio no Google Cloud Console.'}
        </p>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden rounded-xl bg-paper-200 ${className}`}>
      <div ref={hostRef} className="h-full w-full" role="application" aria-label={label} />
      {status === 'loading' && <div className="absolute inset-0 animate-pulse bg-paper-200" aria-hidden />}
    </div>
  );
}
