// ============================================
// 📁 components/common/SelectConBusqueda.tsx - COMPONENTE REUTILIZABLE
// ============================================
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Loader, X } from 'lucide-react';

interface SelectConBusquedaProps {
  value: string;
  onChange: (value: string) => void;
  options: { id: number; nombre: string; nombre_completo?: string }[];
  placeholder: string;
  className?: string;
  disabled?: boolean;
  isError?: boolean;
  allowNew?: boolean;
  displayField?: string;
  apiEndpoint?: string;
  onNewIndicator?: (isNew: boolean) => void;
  maxOptions?: number;
}

export const SelectConBusqueda = React.memo<SelectConBusquedaProps>(
  ({
    value,
    onChange,
    options,
    placeholder,
    className = '',
    disabled = false,
    isError = false,
    allowNew = true,
    displayField = 'nombre',
    apiEndpoint = '',
    onNewIndicator,
    maxOptions = 20,
  }) => {
    // =============================================
    // 🏗️ ESTADOS
    // =============================================
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredOptions, setFilteredOptions] = useState(options);
    const [isSearching, setIsSearching] = useState(false);
    const [allKnownOptions, setAllKnownOptions] = useState(options);
    const localDropdownRef = useRef<HTMLDivElement>(null);

    // =============================================
    // 🔄 EFECTOS
    // =============================================
    useEffect(() => {
      const validOptions = Array.isArray(options) ? options : [];
      setFilteredOptions(validOptions);

      // Actualizar opciones conocidas
      setAllKnownOptions((prev) => {
        const combined = [...prev];
        validOptions.forEach((newOption) => {
          if (!combined.find((existing) => existing.id === newOption.id)) {
            combined.push(newOption);
          }
        });
        return combined;
      });
    }, [options]);

    // Opciones filtradas memoizadas
    const memoizedFilteredOptions = useMemo(() => {
      const validOptions = Array.isArray(allKnownOptions) ? allKnownOptions : [];

      // Diferentes límites según el tipo de endpoint
      let limit = 20;
      if (apiEndpoint.includes('autores')) limit = 15;
      if (apiEndpoint.includes('editoriales')) limit = 10;
      if (apiEndpoint.includes('etiquetas')) limit = 25;

      if (!searchTerm.trim()) {
        return validOptions.slice(0, limit);
      }

      const filtered = validOptions.filter(
        (option) =>
          option.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (option.nombre_completo && option.nombre_completo.toLowerCase().includes(searchTerm.toLowerCase())),
      );

      return filtered.slice(0, limit);
    }, [searchTerm, allKnownOptions, apiEndpoint]);

    // Indicador de nuevo valor
    useEffect(() => {
      if (onNewIndicator && value) {
        const isNewValue = !allKnownOptions.find((option) => option.nombre === value);
        onNewIndicator(isNewValue);
      }
    }, [value, allKnownOptions, onNewIndicator]);

    // Búsqueda en API
    useEffect(() => {
      if (!searchTerm.trim() || !apiEndpoint) {
        if (!apiEndpoint) {
          setFilteredOptions(memoizedFilteredOptions);
        }
        return;
      }

      const timeoutId = setTimeout(async () => {
        setIsSearching(true);
        try {
          const response = await fetch(`${apiEndpoint}?search=${encodeURIComponent(searchTerm)}`);
          const data = await response.json();

          let results = data.autores || data.editoriales || data.etiquetas || data.categorias || data || [];

          if (!Array.isArray(results)) {
            console.warn('API response is not an array:', results);
            results = [];
          }

          setFilteredOptions(results);

          // Actualizar opciones conocidas con resultados de API
          setAllKnownOptions((prev) => {
            const combined = [...prev];
            results.forEach((newOption) => {
              if (newOption && typeof newOption === 'object' && newOption.nombre) {
                if (!combined.find((existing) => existing.id === newOption.id || existing.nombre === newOption.nombre)) {
                  combined.push(newOption);
                }
              }
            });
            return combined;
          });
        } catch (error) {
          console.error('Error en búsqueda:', error);
          setFilteredOptions(memoizedFilteredOptions);
        } finally {
          setIsSearching(false);
        }
      }, 300);

      return () => clearTimeout(timeoutId);
    }, [searchTerm, apiEndpoint, memoizedFilteredOptions]);

    // Mostrar opción "crear nuevo"
    const shouldShowCreateNew = useMemo(() => {
      if (!allowNew || !searchTerm.trim()) return false;

      const validFilteredOptions = Array.isArray(filteredOptions) ? filteredOptions : [];
      const exactMatch = validFilteredOptions.some((option) => option.nombre?.toLowerCase() === searchTerm.toLowerCase());
      return !exactMatch;
    }, [allowNew, searchTerm, filteredOptions]);

    // Click fuera del dropdown
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (localDropdownRef.current && !localDropdownRef.current.contains(event.target as Node)) {
          setIsOpen(false);
          setSearchTerm('');
        }
      };

      if (isOpen) {
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
      }
    }, [isOpen]);

    // =============================================
    // 📊 VALORES CALCULADOS
    // =============================================
    const displayValue = useMemo(() => {
      const validOptions = Array.isArray(options) ? options : [];
      const selectedOption = validOptions.find((opt) => opt.nombre === value);
      return selectedOption
        ? displayField === 'nombre_completo' && selectedOption.nombre_completo
          ? selectedOption.nombre_completo
          : selectedOption.nombre
        : value;
    }, [value, options, displayField]);

    // =============================================
    // 🎯 HANDLERS
    // =============================================
    const handleInputChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
        if (!isOpen) setIsOpen(true);
      },
      [isOpen],
    );

    const handleInputFocus = useCallback(() => {
      setIsOpen(true);
      setSearchTerm('');
    }, []);

    const handleOptionClick = useCallback(
      (optionNombre: string) => {
        onChange(optionNombre);
        setIsOpen(false);
        setSearchTerm('');
      },
      [onChange],
    );

    const handleClearClick = useCallback(() => {
      onChange('');
      setSearchTerm('');
      setIsOpen(false);
    }, [onChange]);

    const handleToggleDropdown = useCallback(() => {
      setIsOpen(!isOpen);
    }, [isOpen]);

    const handleCreateNew = useCallback(() => {
      onChange(searchTerm);
      setIsOpen(false);
      setSearchTerm('');
    }, [onChange, searchTerm]);

    // =============================================
    // 🎨 RENDER
    // =============================================
    if (disabled) {
      return (
        <input
          type="text"
          value={displayValue}
          className={`w-full rounded-lg border bg-gray-100 px-3 py-2 text-sm dark:border-gray-500 dark:bg-gray-600 dark:text-white ${
            isError ? 'border-red-500' : 'border-gray-300 dark:border-gray-500'
          } ${className}`}
          disabled
        />
      );
    }

    const validFilteredOptions = Array.isArray(filteredOptions) ? filteredOptions : [];

    return (
      <div className="relative" ref={localDropdownRef}>
        <div className="relative">
          <input
            type="text"
            value={isOpen ? searchTerm : displayValue}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            className={`w-full rounded-lg border px-3 py-2 pr-10 text-sm focus:ring-2 focus:ring-blue-500 dark:border-gray-500 dark:bg-gray-600 dark:text-white ${
              isError ? 'border-red-500' : 'border-gray-300 dark:border-gray-500'
            } ${className}`}
            placeholder={isOpen ? 'Buscar...' : placeholder}
          />

          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            {isSearching ? (
              <Loader className="h-4 w-4 animate-spin text-gray-400" />
            ) : (
              <button type="button" onClick={handleToggleDropdown} className="text-gray-400 hover:text-gray-600">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            )}
          </div>

          {value && (
            <button
              type="button"
              onClick={handleClearClick}
              className="absolute inset-y-0 right-8 flex items-center pr-1 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {isOpen && (
          <div className="absolute z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-lg border border-gray-300 bg-white shadow-lg dark:border-gray-600 dark:bg-gray-700">
            {validFilteredOptions.length > 0 &&
              validFilteredOptions.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => handleOptionClick(option.nombre)}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:text-white dark:hover:bg-gray-600"
                >
                  {displayField === 'nombre_completo' && option.nombre_completo ? option.nombre_completo : option.nombre}
                </button>
              ))}

            {validFilteredOptions.length === 0 && !shouldShowCreateNew && (
              <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                {searchTerm ? 'No se encontraron resultados' : 'Escribe para buscar...'}
              </div>
            )}

            {shouldShowCreateNew && (
              <>
                {validFilteredOptions.length > 0 && <div className="border-t border-gray-200 dark:border-gray-600"></div>}
                <button
                  type="button"
                  onClick={handleCreateNew}
                  className="w-full px-3 py-2 text-left text-sm font-medium text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20"
                >
                  ➕ Crear "{searchTerm}"
                </button>
              </>
            )}
          </div>
        )}
      </div>
    );
  },
);

SelectConBusqueda.displayName = 'SelectConBusqueda';