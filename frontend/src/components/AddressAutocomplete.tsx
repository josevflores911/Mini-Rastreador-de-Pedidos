import { useEffect, useId, useRef, useState } from 'react';
import { Loader2, MapPin, Search } from 'lucide-react';
import { useGoogleMaps } from '../hooks/useGoogleMaps';

export interface SelectedAddress { address: string; lat: number; lng: number }

interface Suggestion { id: string; text: string; prediction: google.maps.places.PlacePrediction }

interface Props {
  value: string;
  onChange: (text: string) => void;
  onSelect: (a: SelectedAddress) => void;
  error?: string;
  inputId: string;
}

/**
 * Campo de endereço. Com Maps configurado usa Places API (New) para sugerir endereços;
 * sem chave, é um campo de texto comum (endereço manual).
 */
export function AddressAutocomplete({ value, onChange, onSelect, error, inputId }: Props) {
  const status = useGoogleMaps();
  const listId = useId();
  const [items, setItems] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [loading, setLoading] = useState(false);
  const [placesError, setPlacesError] = useState(false);
  const token = useRef<google.maps.places.AutocompleteSessionToken | null>(null);
  const timer = useRef<number>();
  const skipNext = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const enabled = status === 'ready' && !placesError;

  useEffect(() => {
    if (!enabled) return;
    if (skipNext.current) {
      skipNext.current = false;
      return;
    }
    const input = value.trim();
    if (input.length < 3) {
      setItems([]);
      return;
    }
    if (document.activeElement !== inputRef.current) return;
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(async () => {
      setLoading(true);
      try {
        const { AutocompleteSessionToken, AutocompleteSuggestion } = (await google.maps.importLibrary('places')) as google.maps.PlacesLibrary;
        token.current ??= new AutocompleteSessionToken();
        const { suggestions } = await AutocompleteSuggestion.fetchAutocompleteSuggestions({
          input,
          sessionToken: token.current,
          language: 'pt-BR',
          region: 'br',
        });
        const list = suggestions
          .filter((s) => s.placePrediction)
          .map((s, i) => ({ id: `${i}-${s.placePrediction!.placeId}`, text: s.placePrediction!.text.text, prediction: s.placePrediction! }));
        setItems(list);
        setOpen(list.length > 0);
        setActive(-1);
      } catch {
        // Places API (New) não habilitada ou chave sem permissão: cai para endereço manual.
        setPlacesError(true);
        setItems([]);
      } finally {
        setLoading(false);
      }
    }, 280);
    return () => window.clearTimeout(timer.current);
  }, [value, enabled]);

  async function choose(s: Suggestion) {
    setOpen(false);
    setLoading(true);
    try {
      const place = s.prediction.toPlace();
      await place.fetchFields({ fields: ['formattedAddress', 'location'] });
      token.current = null; // encerra a sessão de cobrança
      const address = place.formattedAddress ?? s.text;
      skipNext.current = true;
      onChange(address);
      if (place.location) onSelect({ address, lat: place.location.lat(), lng: place.location.lng() });
    } catch {
      skipNext.current = true;
      onChange(s.text);
    } finally {
      setLoading(false);
    }
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (!open || items.length === 0) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => (a + 1) % items.length); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => (a <= 0 ? items.length - 1 : a - 1)); }
    else if (e.key === 'Enter' && active >= 0) { e.preventDefault(); void choose(items[active]); }
    else if (e.key === 'Escape') setOpen(false);
  }

  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500" aria-hidden />
      <input
        ref={inputRef}
        id={inputId}
        type="text"
        autoComplete="off"
        className={`input pl-10 pr-10 ${error ? 'input-error' : ''}`}
        placeholder={enabled ? 'Busque rua, número, bairro ou estabelecimento' : 'Digite o endereço completo'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => items.length > 0 && setOpen(true)}
        onBlur={() => window.setTimeout(() => setOpen(false), 150)}
        onKeyDown={onKeyDown}
        role={enabled ? 'combobox' : undefined}
        aria-expanded={enabled ? open : undefined}
        aria-controls={enabled ? listId : undefined}
        aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
        aria-autocomplete={enabled ? 'list' : undefined}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${inputId}-error` : undefined}
      />
      {loading && <Loader2 className="absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-ink-500" aria-hidden />}

      {open && items.length > 0 && (
        <ul id={listId} role="listbox" className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-xl border border-paper-300 bg-white py-1 shadow-lift">
          {items.map((s, i) => (
            <li
              key={s.id}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === active}
              onMouseDown={(e) => { e.preventDefault(); void choose(s); }}
              onMouseEnter={() => setActive(i)}
              className={`flex cursor-pointer items-start gap-2 px-3.5 py-2.5 text-sm ${i === active ? 'bg-brand-50' : ''}`}
            >
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" aria-hidden />
              <span>{s.text}</span>
            </li>
          ))}
        </ul>
      )}
      {placesError && (
        <p className="mt-1.5 text-xs text-ink-500">Sugestões indisponíveis (verifique a Places API). Digite o endereço manualmente.</p>
      )}
    </div>
  );
}
