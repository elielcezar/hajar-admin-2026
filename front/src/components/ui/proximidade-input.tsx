import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { proximidadesService } from '@/services/proximidades.service';
import { Proximidade } from '@/types/admin';
import { X, Plus, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProximidadeInputProps {
  value: number[];
  onChange: (ids: number[]) => void;
  disabled?: boolean;
}

export function ProximidadeInput({ value, onChange, disabled }: ProximidadeInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const { data: allProximidades = [] } = useQuery({
    queryKey: ['proximidades'],
    queryFn: () => proximidadesService.getAll(),
  });

  const createMutation = useMutation({
    mutationFn: (nome: string) => proximidadesService.create(nome),
    onSuccess: (nova) => {
      queryClient.invalidateQueries({ queryKey: ['proximidades'] });
      onChange([...value, nova.id]);
      setInputValue('');
      setIsOpen(false);
    },
  });

  const selectedItems = allProximidades.filter((p) => value.includes(p.id));

  const suggestions = allProximidades.filter(
    (p) =>
      !value.includes(p.id) &&
      p.nome.toLowerCase().includes(inputValue.toLowerCase())
  );

  const trimmed = inputValue.trim();
  const exactMatch = allProximidades.some(
    (p) => p.nome.toLowerCase() === trimmed.toLowerCase()
  );
  const showCreate = trimmed.length >= 2 && !exactMatch;

  const handleSelect = (proximidade: Proximidade) => {
    onChange([...value, proximidade.id]);
    setInputValue('');
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const handleRemove = (id: number) => {
    onChange(value.filter((v) => v !== id));
  };

  const handleCreate = () => {
    if (trimmed.length >= 2) {
      createMutation.mutate(trimmed);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (suggestions.length === 1) {
        handleSelect(suggestions[0]);
      } else if (showCreate) {
        handleCreate();
      }
    }
    if (e.key === 'Escape') {
      setIsOpen(false);
    }
    if (e.key === 'Backspace' && inputValue === '' && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  };

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const showDropdown = isOpen && (suggestions.length > 0 || showCreate);

  return (
    <div ref={containerRef} className="relative">
      <div
        className={cn(
          'flex min-h-10 w-full flex-wrap gap-1.5 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background',
          'focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2',
          disabled && 'cursor-not-allowed opacity-50'
        )}
        onClick={() => !disabled && inputRef.current?.focus()}
      >
        {selectedItems.map((item) => (
          <span
            key={item.id}
            className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary border border-primary/20"
          >
            {item.nome}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleRemove(item.id);
              }}
              disabled={disabled}
              className="ml-0.5 rounded-full hover:bg-primary/20 p-0.5 transition-colors disabled:cursor-not-allowed"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}

        <input
          ref={inputRef}
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={selectedItems.length === 0 ? 'Digite para buscar ou criar...' : ''}
          className="flex-1 min-w-32 bg-transparent outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed"
        />
      </div>

      {showDropdown && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md">
          <ul className="max-h-52 overflow-auto py-1">
            {suggestions.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleSelect(item)}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  {item.nome}
                </button>
              </li>
            ))}

            {showCreate && (
              <li>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={handleCreate}
                  disabled={createMutation.isPending}
                  className="w-full px-3 py-2 text-left text-sm flex items-center gap-2 text-primary hover:bg-accent transition-colors disabled:opacity-50"
                >
                  {createMutation.isPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Plus className="h-3.5 w-3.5" />
                  )}
                  Criar "{trimmed}"
                </button>
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
