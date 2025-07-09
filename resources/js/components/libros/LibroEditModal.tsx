// ============================================
// 📁 src/components/libros/LibroEditModal.tsx - MODAL CORREGIDO
// ============================================

import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react';
import { router } from '@inertiajs/react';
import axios from 'axios';
import {
    AlertCircle,
    Book,
    Building,
    Check,
    Database,
    DollarSign,
    FileText,
    Hash,
    Image as ImageIcon,
    Info,
    Loader,
    Plus,
    Save,
    Upload,
    User,
    X,
} from 'lucide-react';
import React, { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { LibroCompleto } from '../../types/LibroCompleto';

// Tipos para datos de BD - adaptados a tu esquema
interface Editorial {
    id: number;
    nombre: string;
    contacto?: string;
}

interface Categoria {
    id: number;
    nombre: string;
    descripción?: string;
}

interface Autor {
    id: number;
    nombre: string;
    seudónimo?: string;
    nacionalidad?: string;
    biografía?: string;
    nombre_completo?: string;
}

// ============================================
// COMPONENTE SELECTCONBUSQUEDA - FUERA DEL COMPONENTE PRINCIPAL
// ============================================
const SelectConBusqueda = React.memo<{
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
}>(
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
    }) => {
        const [isOpen, setIsOpen] = useState(false);
        const [searchTerm, setSearchTerm] = useState('');
        const [filteredOptions, setFilteredOptions] = useState(options);
        const [isSearching, setIsSearching] = useState(false);
        const localDropdownRef = useRef<HTMLDivElement>(null);

        // Inicializar opciones filtradas
        useEffect(() => {
            setFilteredOptions(options);
        }, [options]);

        // Memoizar las opciones filtradas para evitar recálculos
        const memoizedFilteredOptions = useMemo(() => {
            if (!searchTerm.trim()) {
                return options.slice(0, 20);
            }

            const filtered = options.filter(
                (option) =>
                    option.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    (option.nombre_completo && option.nombre_completo.toLowerCase().includes(searchTerm.toLowerCase())),
            );
            return filtered.slice(0, 20);
        }, [searchTerm, options]);

        // Actualizar opciones filtradas
        useEffect(() => {
            if (!apiEndpoint) {
                setFilteredOptions(memoizedFilteredOptions);
            }
        }, [memoizedFilteredOptions, apiEndpoint]);

        // Búsqueda en servidor con debounce
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
                    const results = data.autores || data.editoriales || data.etiquetas || data.categorias || [];
                    setFilteredOptions(results);
                } catch (error) {
                    console.error('Error en búsqueda:', error);
                    setFilteredOptions(memoizedFilteredOptions);
                } finally {
                    setIsSearching(false);
                }
            }, 300);

            return () => clearTimeout(timeoutId);
        }, [searchTerm, apiEndpoint, memoizedFilteredOptions]);

        // Verificar si debe mostrar la opción "Crear nuevo"
        const shouldShowCreateNew = useMemo(() => {
            if (!allowNew || !searchTerm.trim()) return false;

            // No mostrar si ya existe exactamente
            const exactMatch = filteredOptions.some((option) => option.nombre.toLowerCase() === searchTerm.toLowerCase());

            return !exactMatch;
        }, [allowNew, searchTerm, filteredOptions]);

        // Cerrar dropdown al hacer click fuera
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

        // Memoizar el valor mostrado
        const displayValue = useMemo(() => {
            const selectedOption = options.find((opt) => opt.nombre === value);
            return selectedOption
                ? displayField === 'nombre_completo' && selectedOption.nombre_completo
                    ? selectedOption.nombre_completo
                    : selectedOption.nombre
                : value;
        }, [value, options, displayField]);

        // Handlers memoizados
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
            console.log('Creando nuevo:', searchTerm); // Debug
            onChange(searchTerm);
            setIsOpen(false);
            setSearchTerm('');
        }, [onChange, searchTerm]);

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

        return (
            <div className="relative" ref={localDropdownRef}>
                {/* Input principal */}
                <div className="relative">
                    <input
                        type="text"
                        value={isOpen ? searchTerm : displayValue}
                        onChange={handleInputChange}
                        onFocus={handleInputFocus}
                        className={`w-full rounded-lg border px-3 py-2 pr-10 text-sm focus:ring-2 focus:ring-gray-500 dark:border-gray-500 dark:bg-gray-600 dark:text-white ${
                            isError ? 'border-red-500' : 'border-gray-300 dark:border-gray-500'
                        } ${className}`}
                        placeholder={isOpen ? 'Buscar...' : placeholder}
                    />

                    {/* Indicador de búsqueda/dropdown */}
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

                    {/* Botón X para limpiar */}
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

                {/* Dropdown de opciones */}
                {isOpen && (
                    <div className="absolute z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-lg border border-gray-300 bg-white shadow-lg dark:border-gray-600 dark:bg-gray-700">
                        {/* Opciones filtradas */}
                        {filteredOptions.length > 0 &&
                            filteredOptions.map((option) => (
                                <button
                                    key={option.id}
                                    type="button"
                                    onClick={() => handleOptionClick(option.nombre)}
                                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:text-white dark:hover:bg-gray-600"
                                >
                                    {displayField === 'nombre_completo' && option.nombre_completo ? option.nombre_completo : option.nombre}
                                </button>
                            ))}

                        {/* Mensaje cuando no hay resultados Y no se puede crear nuevo */}
                        {filteredOptions.length === 0 && !shouldShowCreateNew && (
                            <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                                {searchTerm ? 'No se encontraron resultados' : 'Escribe para buscar...'}
                            </div>
                        )}

                        {/* Opción de crear nuevo */}
                        {shouldShowCreateNew && (
                            <>
                                {filteredOptions.length > 0 && <div className="border-t border-gray-200 dark:border-gray-600"></div>}
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

// ============================================
// COMPONENTE PRINCIPAL
// ============================================
interface LibroEditModalProps {
    libro: LibroCompleto | null;
    isOpen: boolean;
    onClose: () => void;
    onSave: (id: string, libroEditado: Partial<LibroCompleto>) => void;
    onBuscarISBN?: (isbn: string) => Promise<LibroCompleto | null>;
    readonly?: boolean;
    editoriales?: Editorial[];
    categorias?: Categoria[];
    autores?: Autor[];
}

const LibroEditModal: React.FC<LibroEditModalProps> = ({
    libro,
    isOpen,
    onClose,
    onSave,
    onBuscarISBN,
    readonly = false,
    editoriales: editorialesProp = [],
    categorias: categoriasProp = [],
    autores: autoresProp = [],
}) => {
    // Estados del formulario
    const [formData, setFormData] = useState<Partial<LibroCompleto>>({});
    const [guardando, setGuardando] = useState(false);
    const [buscandoISBN, setBuscandoISBN] = useState(false);
    const [errores, setErrores] = useState<Record<string, string>>({});
    const [cambiosRealizados, setCambiosRealizados] = useState(false);

    // Estados para datos de BD - CON VALIDACIÓN
    const [editoriales, setEditoriales] = useState<Editorial[]>(() => {
        // Validar que editorialesProp sea un array
        return Array.isArray(editorialesProp) ? editorialesProp : [];
    });
    const [categorias, setCategorias] = useState<Categoria[]>(() => {
        return Array.isArray(categoriasProp) ? categoriasProp : [];
    });
    const [autores, setAutores] = useState<Autor[]>(() => {
        return Array.isArray(autoresProp) ? autoresProp : [];
    });
    const [categoriasSeleccionadas, setCategoriasSeleccionadas] = useState<string[]>([]);

    // Estados para upload de imagen
    const [subiendoImagen, setSubiendoImagen] = useState(false);
    const [previewImagen, setPreviewImagen] = useState<string>('');

    // Cargar datos de BD al abrir modal
    useEffect(() => {
        if (isOpen && (editoriales.length === 0 || categorias.length === 0 || autores.length === 0)) {
            cargarDatosBD();
        }
    }, [isOpen]);

    // Inicializar formulario cuando se abre el modal
    useEffect(() => {
        if (libro && isOpen) {
            setFormData({
                isbn: libro.isbn,
                titulo: libro.titulo,
                cantidad: libro.cantidad,
                valorUnitario: libro.valorUnitario,
                descuento: libro.descuento || 0,
                autor: {
                    nombre: libro.autor?.nombre || '',
                    apellidos: libro.autor?.seudónimo || '',
                    nacionalidad: libro.autor?.nacionalidad || '',
                    biografia: libro.autor?.biografía || '',
                },
                editorial: {
                    nombre: libro.editorial?.nombre || '',
                    contacto: libro.editorial?.contacto || '',
                },
                genero: {
                    nombre: libro.genero?.nombre || '',
                },
                descripcion: libro.descripcion || '',
                imagenUrl: libro.imagenUrl || libro.imagen_url || '',
                añoPublicacion: libro.añoPublicacion || libro.año || undefined,
                paginas: libro.paginas || undefined,
                idioma: libro.idioma || '',
                edicion: libro.edicion || '',
                folio: libro.folio || '',
                fechaFactura: libro.fechaFactura || '',
                proveedor: libro.proveedor || '',
            });

            const categoriasIniciales = libro.genero?.nombre ? libro.genero.nombre.split(',').map((c) => c.trim()) : [];
            setCategoriasSeleccionadas(categoriasIniciales);

            setPreviewImagen(libro.imagenUrl || libro.imagen_url || '');
            setErrores({});
            setCambiosRealizados(false);
        }
    }, [libro, isOpen]);

    // Actualizar campo del formulario
    const actualizarCampo = useCallback((campo: string, valor: any) => {
        setFormData((prev) => {
            if (campo.includes('.')) {
                const [padre, hijo] = campo.split('.');
                const padreActual = prev[padre as keyof typeof prev] as any;

                if (padreActual && padreActual[hijo] === valor) {
                    return prev;
                }

                return {
                    ...prev,
                    [padre]: {
                        ...padreActual,
                        [hijo]: valor,
                    },
                };
            }

            if (prev[campo as keyof typeof prev] === valor) {
                return prev;
            }

            return { ...prev, [campo]: valor };
        });
    }, []);

    // Calcular total automáticamente
    const totalCalculado = useMemo(() => {
        const cantidad = formData.cantidad || 0;
        const valorUnitario = formData.valorUnitario || 0;
        const descuento = formData.descuento || 0;
        return cantidad * valorUnitario - descuento;
    }, [formData.cantidad, formData.valorUnitario, formData.descuento]);

    // Detectar cambios en el formulario
    const detectarCambios = useCallback(() => {
        if (!libro || !formData.isbn) return false;

        const categoriasOriginales = libro.genero?.nombre ? libro.genero.nombre.split(',').map((c) => c.trim()) : [];
        const categoriasActuales = categoriasSeleccionadas;

        return (
            formData.isbn !== libro.isbn ||
            formData.titulo !== libro.titulo ||
            formData.cantidad !== libro.cantidad ||
            formData.valorUnitario !== libro.valorUnitario ||
            formData.descuento !== (libro.descuento || 0) ||
            formData.autor?.nombre !== (libro.autor?.nombre || '') ||
            formData.autor?.apellidos !== (libro.autor?.seudónimo || '') ||
            formData.editorial?.nombre !== (libro.editorial?.nombre || '') ||
            JSON.stringify(categoriasActuales.sort()) !== JSON.stringify(categoriasOriginales.sort()) ||
            formData.descripcion !== (libro.descripcion || '') ||
            formData.imagenUrl !== (libro.imagenUrl || libro.imagen_url || '') ||
            formData.añoPublicacion !== (libro.añoPublicacion || libro.año) ||
            formData.paginas !== libro.paginas ||
            formData.idioma !== (libro.idioma || '') ||
            formData.edicion !== (libro.edicion || '') ||
            formData.proveedor !== (libro.proveedor || '')
        );
    }, [libro, formData, categoriasSeleccionadas]);

    // Effect para detectar cambios
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            const hayCambios = detectarCambios();
            setCambiosRealizados(hayCambios);
        }, 100);

        return () => clearTimeout(timeoutId);
    }, [detectarCambios]);

    // Cargar datos de BD
    const cargarDatosBD = async () => {
        try {
            if (editoriales.length === 0) {
                try {
                    const response = await axios.get('/admin/api/editoriales');
                    const editorialesData = response.data.editoriales || response.data || [];

                    // Asegurar que sea un array
                    if (Array.isArray(editorialesData)) {
                        setEditoriales(editorialesData);
                    } else {
                        console.warn('Editoriales no es un array:', editorialesData);
                        setEditoriales([]);
                    }
                } catch (error) {
                    /*  setEditoriales([
                        { id: 1, nombre: 'Penguin Random House', contacto: 'contacto@penguin.com' },
                        { id: 2, nombre: 'Planeta', contacto: 'info@planeta.com' },
                        { id: 3, nombre: 'Santillana', contacto: 'ventas@santillana.com' },
                        { id: 4, nombre: 'Editorial Patria', contacto: 'contacto@patria.com' },
                    ]); */
                }
            }

            if (categorias.length === 0) {
                try {
                    const response = await axios.get('/admin/api/etiquetas');
                    console.log('Respuesta categorías:', response.data); // Debug

                    const categoriasData = response.data.categorias || response.data.etiquetas || response.data || [];

                    if (Array.isArray(categoriasData)) {
                        setCategorias(categoriasData);
                    } else {
                        console.warn('Categorías no es un array:', categoriasData);
                        setCategorias([]);
                    }
                } catch (error) {
                    console.error('Error cargando categorías:', error);
                    setCategorias([
                        { id: 1, nombre: 'Ficción' },
                        { id: 2, nombre: 'No Ficción' },
                        { id: 3, nombre: 'Académico' },
                        { id: 4, nombre: 'Infantil' },
                        { id: 5, nombre: 'Ciencia' },
                        { id: 6, nombre: 'Historia' },
                        { id: 7, nombre: 'Biografía' },
                        { id: 8, nombre: 'Autoayuda' },
                    ]);
                }
            }

            if (autores.length === 0) {
                try {
                    const response = await axios.get('/admin/api/autores');
                    console.log('Respuesta autores:', response.data); // Debug

                    const autoresData = response.data.autores || response.data || [];

                    if (Array.isArray(autoresData)) {
                        setAutores(autoresData);
                    } else {
                        console.warn('Autores no es un array:', autoresData);
                        setAutores([]);
                    }
                } catch (error) {
                    console.error('Error cargando autores:', error);
                    setAutores([
                        {
                            id: 1,
                            nombre: 'Gabriel García Márquez',
                            seudónimo: 'Gabo',
                            nacionalidad: 'Colombiano',
                            nombre_completo: 'Gabriel García Márquez (Gabo)',
                        },
                        { id: 2, nombre: 'Isabel Allende', seudónimo: '', nacionalidad: 'Chilena', nombre_completo: 'Isabel Allende' },
                        { id: 3, nombre: 'Mario Vargas Llosa', seudónimo: '', nacionalidad: 'Peruano', nombre_completo: 'Mario Vargas Llosa' },
                        { id: 4, nombre: 'Octavio Paz', seudónimo: '', nacionalidad: 'Mexicano', nombre_completo: 'Octavio Paz' },
                    ]);
                }
            }
        } catch (error) {
            console.error('Error cargando datos de BD:', error);
        }
    };

const subirImagen = async (file: File) => {
    if (!file) return;

    console.log('🚀 Subiendo imagen:', file.name);
    setSubiendoImagen(true);
    
    try {
        const formData = new FormData();
        formData.append('imagen', file);
        formData.append('tipo', 'libro');

        // ✅ USAR FETCH DIRECTO ya que el controlador devuelve JSON
        const response = await fetch('/admin/api/upload/imagen', {
            method: 'POST',
            body: formData,
            headers: {
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                'Accept': 'application/json',
            }
        });

        console.log('📊 Response status:', response.status);
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ Respuesta exitosa:', data);
            
            if (data.success && data.upload && data.upload.success) {
                const uploadData = data.upload;
                
                console.log('🖼️ Datos de imagen:', {
                    path: uploadData.path,
                    url: uploadData.url,
                    filename: uploadData.filename
                });
                
                // ✅ ACTUALIZAR IMAGEN
                actualizarCampo('imagenUrl', uploadData.path);
                setPreviewImagen(uploadData.url);
                
                console.log('✅ ¡Imagen subida y configurada!');
                
                // Opcional: toast de éxito
                // toast.success('Imagen subida exitosamente');
                
            } else {
                console.error('❌ Respuesta no válida:', data);
                // toast.error('Error en la respuesta del servidor');
            }
        } else {
            const errorData = await response.json();
            console.error('❌ Error del servidor:', errorData);
            // toast.error(errorData.message || 'Error subiendo imagen');
        }

    } catch (error) {
        console.error('💥 Error:', error);
        // toast.error('Error procesando imagen');
    } finally {
        setSubiendoImagen(false);
    }
};
// ============================================
// 🔧 FUNCIÓN AUXILIAR: Verificar acceso a imagen
// ============================================

const verificarAccesoImagen = (url: string) => {
    console.log('🔍 Verificando acceso a imagen:', url);
    
    const img = new Image();
    img.onload = () => {
        console.log('✅ Imagen accesible correctamente');
       // toast.success('Imagen cargada correctamente');
    };
    img.onerror = () => {
        console.error('❌ Imagen NO accesible');
        
        // ✅ Intentar URLs alternativas
        const alternativeUrls = [
            url.replace('/storage/', '/storage/app/public/'),
            url.replace('/storage/', '/'),
            '/storage/' + url.replace(/^\/+storage\/+/, ''),
            window.location.origin + url
        ];
        
        console.log('🔄 Intentando URLs alternativas:', alternativeUrls);
        
        alternativeUrls.forEach((altUrl, index) => {
            const testImg = new Image();
            testImg.onload = () => {
                console.log(`✅ URL alternativa ${index + 1} funciona:`, altUrl);
                // Actualizar con la URL que funciona
                setPreviewImagen(altUrl);
                actualizarCampo('imagenUrl', altUrl);
            };
            testImg.onerror = () => {
                console.log(`❌ URL alternativa ${index + 1} falla:`, altUrl);
            };
            testImg.src = altUrl;
        });
        
     //   toast.warning('Imagen subida pero hay problemas de acceso. Revisa la consola.');
    };
    img.src = url;
};


    const agregarCategoria = useCallback(
        (categoria: string) => {
            if (!categoriasSeleccionadas.includes(categoria)) {
                const nuevasCategorias = [...categoriasSeleccionadas, categoria];
                setCategoriasSeleccionadas(nuevasCategorias);
                actualizarCampo('genero.nombre', nuevasCategorias.join(', '));
            }
        },
        [categoriasSeleccionadas, actualizarCampo],
    );

    const quitarCategoria = useCallback(
        (categoria: string) => {
            const nuevasCategorias = categoriasSeleccionadas.filter((c) => c !== categoria);
            setCategoriasSeleccionadas(nuevasCategorias);
            actualizarCampo('genero.nombre', nuevasCategorias.join(', '));
        },
        [categoriasSeleccionadas, actualizarCampo],
    );

    // Validar formulario
    const validarFormulario = (): boolean => {
        const nuevosErrores: Record<string, string> = {};

        if (!formData.isbn?.trim()) {
            nuevosErrores.isbn = 'ISBN es requerido';
        }
        if (!formData.titulo?.trim()) {
            nuevosErrores.titulo = 'Título es requerido';
        }
        if (!formData.cantidad || formData.cantidad < 1) {
            nuevosErrores.cantidad = 'Cantidad debe ser mayor a 0';
        }
        if (!formData.valorUnitario || formData.valorUnitario < 0) {
            nuevosErrores.valorUnitario = 'Precio unitario no puede ser negativo';
        }
        if (!formData.autor?.nombre?.trim()) {
            nuevosErrores.autorNombre = 'Nombre del autor es requerido';
        }
        if (!formData.editorial?.nombre?.trim()) {
            nuevosErrores.editorialNombre = 'Editorial es requerida';
        }

        setErrores(nuevosErrores);
        return Object.keys(nuevosErrores).length === 0;
    };

    // Buscar información por ISBN
    const buscarPorISBN = async () => {
        if (!formData.isbn || !onBuscarISBN) return;

        setBuscandoISBN(true);
        try {
            const libroEncontrado = await onBuscarISBN(formData.isbn);

            if (libroEncontrado) {
                setFormData((prev) => ({
                    ...prev,
                    titulo: libroEncontrado.titulo,
                    autor: {
                        nombre: libroEncontrado.autor?.nombre || prev.autor?.nombre || '',
                        apellidos: libroEncontrado.autor?.seudónimo || prev.autor?.apellidos || '',
                        nacionalidad: libroEncontrado.autor?.nacionalidad || prev.autor?.nacionalidad || '',
                        biografia: libroEncontrado.autor?.biografía || prev.autor?.biografia || '',
                    },
                    editorial: {
                        nombre: libroEncontrado.editorial?.nombre || prev.editorial?.nombre || '',
                        contacto: libroEncontrado.editorial?.contacto || prev.editorial?.contacto || '',
                    },
                    descripcion: libroEncontrado.descripcion || prev.descripcion || '',
                    imagenUrl: libroEncontrado.imagenUrl || libroEncontrado.imagen_url || prev.imagenUrl || '',
                    añoPublicacion: libroEncontrado.añoPublicacion || libroEncontrado.año || prev.añoPublicacion,
                    paginas: libroEncontrado.paginas || prev.paginas,
                    idioma: libroEncontrado.idioma || prev.idioma || '',
                    edicion: libroEncontrado.edicion || prev.edicion || '',
                }));

                if (libroEncontrado.genero?.nombre) {
                    const categorias = libroEncontrado.genero.nombre.split(',').map((c) => c.trim());
                    setCategoriasSeleccionadas(categorias);
                }

                setPreviewImagen(libroEncontrado.imagenUrl || libroEncontrado.imagen_url || '');
            }
        } catch (error) {
            console.error('Error buscando ISBN:', error);
        } finally {
            setBuscandoISBN(false);
        }
    };

    // Guardar cambios
    const handleGuardar = async () => {
        if (!validarFormulario()) return;

        setGuardando(true);
        try {
            const datosParaGuardar = {
                ...formData,
                total: totalCalculado,
                genero: {
                    nombre: categoriasSeleccionadas.join(', '),
                },
            };

            await onSave(libro.id, datosParaGuardar);
            onClose();
        } catch (error) {
            console.error('Error guardando:', error);
        } finally {
            setGuardando(false);
        }
    };

    if (!libro) return null;

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <TransitionChild
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
                </TransitionChild>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4">
                        <TransitionChild
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <DialogPanel className="w-full max-w-5xl transform overflow-hidden rounded-xl bg-white text-left align-middle shadow-xl transition-all will-change-auto dark:bg-gray-800">
                                {/* Header */}
                                <div className="bg-gray-700 text-white dark:bg-gray-900">
                                    <div className="flex items-center justify-between p-6">
                                        <div className="flex items-center gap-4">
                                            <div className="rounded-lg bg-white/10 p-3">
                                                <Book className="h-6 w-6" />
                                            </div>
                                            <div>
                                                <DialogTitle className="text-xl font-semibold">
                                                    {readonly ? 'Ver Información' : 'Editar Libro'}
                                                </DialogTitle>
                                                <p className="text-sm text-gray-300">ISBN: {formData.isbn || libro.isbn}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {cambiosRealizados && !readonly && (
                                                <div className="flex items-center gap-2 text-sm text-amber-300">
                                                    <AlertCircle className="h-4 w-4" />
                                                    Cambios sin guardar
                                                </div>
                                            )}

                                            <button
                                                onClick={onClose}
                                                className="rounded-lg p-2 text-gray-300 transition-all hover:bg-white/10 hover:text-white"
                                            >
                                                <X className="h-5 w-5" />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Contenido del formulario */}
                                <div className="space-y-6 p-6" style={{ maxHeight: '70vh', overflowY: 'auto', scrollBehavior: 'smooth' }}>
                                    {/* Información básica */}
                                    <div className="rounded-lg bg-gray-50 p-6 dark:bg-gray-700">
                                        <h3 className="mb-4 flex items-center gap-2 text-lg font-medium text-gray-900 dark:text-white">
                                            <Info className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                                            Información Básica
                                        </h3>
                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                            {/* ISBN */}
                                            <div>
                                                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">ISBN *</label>
                                                <div className="flex gap-2">
                                                    <input
                                                        type="text"
                                                        value={formData.isbn || ''}
                                                        onChange={(e) => actualizarCampo('isbn', e.target.value)}
                                                        className={`flex-1 rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:ring-gray-500 dark:border-gray-500 dark:bg-gray-600 dark:text-white ${
                                                            errores.isbn ? 'border-red-500' : 'border-gray-300 dark:border-gray-500'
                                                        }`}
                                                        disabled={readonly}
                                                    />
                                                    {onBuscarISBN && !readonly && (
                                                        <button
                                                            onClick={buscarPorISBN}
                                                            disabled={buscandoISBN || !formData.isbn}
                                                            className="flex items-center gap-1 rounded-lg bg-gray-600 px-3 py-2 text-white hover:bg-gray-700 disabled:opacity-50"
                                                            title="Buscar información por ISBN"
                                                        >
                                                            {buscandoISBN ? (
                                                                <Loader className="h-4 w-4 animate-spin" />
                                                            ) : (
                                                                <Database className="h-4 w-4" />
                                                            )}
                                                        </button>
                                                    )}
                                                </div>
                                                {errores.isbn && <p className="mt-1 text-xs text-red-600">{errores.isbn}</p>}
                                            </div>

                                            {/* Título */}
                                            <div>
                                                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Título *</label>
                                                <input
                                                    type="text"
                                                    value={formData.titulo || ''}
                                                    onChange={(e) => actualizarCampo('titulo', e.target.value)}
                                                    className={`w-full rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:ring-gray-500 dark:border-gray-500 dark:bg-gray-600 dark:text-white ${
                                                        errores.titulo ? 'border-red-500' : 'border-gray-300 dark:border-gray-500'
                                                    }`}
                                                    disabled={readonly}
                                                />
                                                {errores.titulo && <p className="mt-1 text-xs text-red-600">{errores.titulo}</p>}
                                            </div>

                                            {/* Año */}
                                            <div>
                                                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                    Año de Publicación
                                                </label>
                                                <input
                                                    type="number"
                                                    value={formData.añoPublicacion || ''}
                                                    onChange={(e) => actualizarCampo('añoPublicacion', parseInt(e.target.value) || undefined)}
                                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-gray-500 dark:border-gray-500 dark:bg-gray-600 dark:text-white"
                                                    min="1800"
                                                    max={new Date().getFullYear() + 1}
                                                    disabled={readonly}
                                                />
                                            </div>

                                            {/* Páginas */}
                                            <div>
                                                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Páginas</label>
                                                <input
                                                    type="number"
                                                    value={formData.paginas || ''}
                                                    onChange={(e) => actualizarCampo('paginas', parseInt(e.target.value) || undefined)}
                                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-gray-500 dark:border-gray-500 dark:bg-gray-600 dark:text-white"
                                                    min="1"
                                                    disabled={readonly}
                                                />
                                            </div>

                                            {/* Edición */}
                                            <div>
                                                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Edición</label>
                                                <input
                                                    type="text"
                                                    value={formData.edicion || ''}
                                                    onChange={(e) => actualizarCampo('edicion', e.target.value)}
                                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-gray-500 dark:border-gray-500 dark:bg-gray-600 dark:text-white"
                                                    placeholder="Primera, Segunda, etc."
                                                    disabled={readonly}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Editorial y Autor en columnas */}
                                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                        {/* Editorial */}
                                        <div className="rounded-lg bg-amber-50 p-6 dark:bg-amber-900/10">
                                            <h3 className="mb-4 flex items-center gap-2 text-lg font-medium text-gray-900 dark:text-white">
                                                <Building className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                                                Editorial
                                            </h3>

                                            <div className="space-y-4">
                                                <div>
                                                    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                        Editorial *
                                                    </label>
                                                    <SelectConBusqueda
                                                        value={formData.editorial?.nombre || ''}
                                                        onChange={(value) => {
                                                            console.log('Editorial seleccionada:', value); // Debug
                                                            console.log('Editoriales disponibles:', editoriales); // Debug

                                                            // Validar que editoriales sea un array
                                                            if (!Array.isArray(editoriales)) {
                                                                console.error('Editoriales no es un array:', editoriales);
                                                                actualizarCampo('editorial.nombre', value);
                                                                return;
                                                            }

                                                            const editorial = editoriales.find((ed) => ed.nombre === value);
                                                            actualizarCampo('editorial.nombre', value);
                                                            if (editorial) {
                                                                actualizarCampo('editorial.contacto', editorial.contacto || '');
                                                            }
                                                        }}
                                                        options={Array.isArray(editoriales) ? editoriales : []}
                                                        placeholder="Seleccionar editorial"
                                                        disabled={readonly}
                                                        isError={!!errores.editorialNombre}
                                                        apiEndpoint="/admin/api/editoriales"
                                                    />
                                                    {errores.editorialNombre && (
                                                        <p className="mt-1 text-xs text-red-600">{errores.editorialNombre}</p>
                                                    )}

                                                    {/* Indicador de valor personalizado para Editorial */}
                                                    {formData.editorial?.nombre &&
                                                        Array.isArray(editoriales) &&
                                                        !editoriales.find((ed) => ed.nombre === formData.editorial?.nombre) && (
                                                            <div className="mt-1 flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400">
                                                                <Plus className="h-3 w-3" />
                                                                Nuevo: {formData.editorial?.nombre}
                                                            </div>
                                                        )}
                                                </div>

                                                <div>
                                                    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                        Contacto
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={formData.editorial?.contacto || ''}
                                                        onChange={(e) => actualizarCampo('editorial.contacto', e.target.value)}
                                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-gray-500 dark:border-gray-500 dark:bg-gray-600 dark:text-white"
                                                        disabled={readonly}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Autor */}
                                        <div className="rounded-lg bg-blue-50 p-6 dark:bg-blue-900/10">
                                            <h3 className="mb-4 flex items-center gap-2 text-lg font-medium text-gray-900 dark:text-white">
                                                <User className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                                                Autor
                                            </h3>

                                            <div className="space-y-4">
                                                <div>
                                                    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Autor *</label>
                                                    <SelectConBusqueda
                                                        value={formData.autor?.nombre || ''}
                                                        onChange={(value) => {
                                                            const autor = autores.find((a) => a.nombre === value);
                                                            actualizarCampo('autor.nombre', value);
                                                            if (autor) {
                                                                actualizarCampo('autor.apellidos', autor.seudónimo || '');
                                                                actualizarCampo('autor.nacionalidad', autor.nacionalidad || '');
                                                                actualizarCampo('autor.biografia', autor.biografía || '');
                                                            }
                                                        }}
                                                        options={autores}
                                                        placeholder="Seleccionar autor"
                                                        disabled={readonly}
                                                        isError={!!errores.autorNombre}
                                                        displayField="nombre_completo"
                                                        apiEndpoint="/admin/api/autores"
                                                    />
                                                    {errores.autorNombre && <p className="mt-1 text-xs text-red-600">{errores.autorNombre}</p>}

                                                    {/* Indicador de valor personalizado para Autor */}
                                                    {formData.autor?.nombre && !autores.find((a) => a.nombre === formData.autor?.nombre) && (
                                                        <div className="mt-1 flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400">
                                                            <Plus className="h-3 w-3" />
                                                            Nuevo: {formData.autor?.nombre}
                                                        </div>
                                                    )}
                                                </div>

                                                <div>
                                                    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                        Apellidos/Seudónimo
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={formData.autor?.apellidos || ''}
                                                        onChange={(e) => actualizarCampo('autor.apellidos', e.target.value)}
                                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-gray-500 dark:border-gray-500 dark:bg-gray-600 dark:text-white"
                                                        disabled={readonly}
                                                        placeholder="Apellidos o nombre artístico"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                        Nacionalidad
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={formData.autor?.nacionalidad || ''}
                                                        onChange={(e) => actualizarCampo('autor.nacionalidad', e.target.value)}
                                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-gray-500 dark:border-gray-500 dark:bg-gray-600 dark:text-white"
                                                        disabled={readonly}
                                                        placeholder="País de origen"
                                                    />
                                                </div>
                                            </div>

                                            <div className="mt-4">
                                                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Biografía</label>
                                                <textarea
                                                    value={formData.autor?.biografia || ''}
                                                    onChange={(e) => actualizarCampo('autor.biografia', e.target.value)}
                                                    rows={3}
                                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-gray-500 dark:border-gray-500 dark:bg-gray-600 dark:text-white"
                                                    disabled={readonly}
                                                    placeholder="Breve biografía del autor..."
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Categorías */}
                                    <div className="rounded-lg bg-green-50 p-6 dark:bg-green-900/10">
                                        <h3 className="mb-4 flex items-center gap-2 text-lg font-medium text-gray-900 dark:text-white">
                                            <Hash className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                                            Etiquetas/Categorías
                                        </h3>

                                        {!readonly && (
                                            <div className="mb-4">
                                                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                    Agregar etiqueta
                                                </label>
                                                <SelectConBusqueda
                                                    value=""
                                                    onChange={(value) => {
                                                        if (value) {
                                                            agregarCategoria(value);
                                                        }
                                                    }}
                                                    options={categorias}
                                                    placeholder="Seleccionar etiqueta"
                                                    disabled={readonly}
                                                    apiEndpoint="/admin/api/etiquetas"
                                                />
                                            </div>
                                        )}

                                        <div className="flex flex-wrap gap-2">
                                            {categoriasSeleccionadas.map((categoria, index) => (
                                                <span
                                                    key={index}
                                                    className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                                                >
                                                    {categoria}
                                                    {!readonly && (
                                                        <button
                                                            onClick={() => quitarCategoria(categoria)}
                                                            className="ml-1 text-gray-500 hover:text-red-600"
                                                        >
                                                            <X className="h-3 w-3" />
                                                        </button>
                                                    )}
                                                </span>
                                            ))}
                                            {categoriasSeleccionadas.length === 0 && (
                                                <span className="text-sm text-gray-500 italic dark:text-gray-400">
                                                    No hay etiquetas seleccionadas
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Imagen */}
                                    <div className="rounded-lg bg-indigo-50 p-6 dark:bg-indigo-900/10">
                                        <h3 className="mb-4 flex items-center gap-2 text-lg font-medium text-gray-900 dark:text-white">
                                            <ImageIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                                            Imagen del Libro
                                        </h3>

                                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                            {/* Preview de imagen */}
                                            <div>
                                                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                    Vista previa
                                                </label>
                                                <div className="rounded-lg border-2 border-dashed border-gray-300 p-4 text-center dark:border-gray-600">
                                                    {previewImagen ? (
                                                        <div className="relative">
                                                            <img
                                                                src={previewImagen}
                                                                alt="Preview"
                                                                className="h-48 w-full rounded-lg object-cover"
                                                                onError={(e) => {
                                                                    (e.target as HTMLImageElement).src = '/placeholder-book.png';
                                                                }}
                                                            />
                                                            {!readonly && (
                                                                <button
                                                                    onClick={() => {
                                                                        setPreviewImagen('');
                                                                        actualizarCampo('imagenUrl', '');
                                                                    }}
                                                                    className="absolute top-2 right-2 rounded-full bg-red-600 p-1 text-white hover:bg-red-700"
                                                                >
                                                                    <X className="h-4 w-4" />
                                                                </button>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <div className="py-8">
                                                            <ImageIcon className="mx-auto mb-2 h-12 w-12 text-gray-400" />
                                                            <p className="text-sm text-gray-500 dark:text-gray-400">No hay imagen</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Upload y URL manual */}
                                            <div className="space-y-4">
                                                {!readonly && (
                                                    <>
                                                        <div>
                                                            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                                Subir nueva imagen
                                                            </label>
                                                            <div className="relative">
                                                                <input
                                                                    type="file"
                                                                    accept="image/*"
                                                                    onChange={(e) => {
                                                                        const file = e.target.files?.[0];
                                                                        if (file) subirImagen(file);
                                                                    }}
                                                                    className="hidden"
                                                                    id="upload-imagen"
                                                                    disabled={subiendoImagen}
                                                                />
                                                                <label
                                                                    htmlFor="upload-imagen"
                                                                    className={`flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-3 transition-colors ${
                                                                        subiendoImagen
                                                                            ? 'cursor-not-allowed border-gray-300 bg-gray-100'
                                                                            : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-700'
                                                                    }`}
                                                                >
                                                                    {subiendoImagen ? (
                                                                        <>
                                                                            <Loader className="h-5 w-5 animate-spin text-gray-500" />
                                                                            <span className="text-gray-500">Subiendo...</span>
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <Upload className="h-5 w-5 text-gray-500" />
                                                                            <span className="text-gray-700 dark:text-gray-300">
                                                                                Seleccionar archivo
                                                                            </span>
                                                                        </>
                                                                    )}
                                                                </label>
                                                            </div>
                                                            <p className="mt-1 text-xs text-gray-500">JPG, PNG hasta 5MB</p>
                                                        </div>

                                                        <div className="relative">
                                                            <div className="absolute inset-0 flex items-center">
                                                                <div className="w-full border-t border-gray-300 dark:border-gray-600" />
                                                            </div>
                                                            <div className="relative flex justify-center text-sm">
                                                                <span className="bg-indigo-50 px-2 text-gray-500 dark:bg-indigo-900/10">o</span>
                                                            </div>
                                                        </div>
                                                    </>
                                                )}

                                                <div>
                                                    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                        URL de imagen
                                                    </label>
                                                    <input
                                                        type="url"
                                                        value={formData.imagenUrl || ''}
                                                        onChange={(e) => {
                                                            actualizarCampo('imagenUrl', e.target.value);
                                                            setPreviewImagen(e.target.value);
                                                        }}
                                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-gray-500 dark:border-gray-500 dark:bg-gray-600 dark:text-white"
                                                        placeholder="https://..."
                                                        disabled={readonly}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Descripción */}
                                    <div className="rounded-lg bg-gray-50 p-6 dark:bg-gray-700">
                                        <h3 className="mb-4 flex items-center gap-2 text-lg font-medium text-gray-900 dark:text-white">
                                            <FileText className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                                            Descripción
                                        </h3>

                                        <textarea
                                            value={formData.descripcion || ''}
                                            onChange={(e) => actualizarCampo('descripcion', e.target.value)}
                                            rows={4}
                                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-gray-500 dark:border-gray-500 dark:bg-gray-600 dark:text-white"
                                            placeholder="Descripción del libro..."
                                            disabled={readonly}
                                        />
                                    </div>

                                    {/* Información comercial */}
                                    <div className="rounded-lg bg-emerald-50 p-6 dark:bg-emerald-900/10">
                                        <h3 className="mb-4 flex items-center gap-2 text-lg font-medium text-gray-900 dark:text-white">
                                            <DollarSign className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                                            Información Comercial
                                        </h3>

                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                                            <div>
                                                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Cantidad *</label>
                                                <input
                                                    type="number"
                                                    value={formData.cantidad || ''}
                                                    onChange={(e) => actualizarCampo('cantidad', parseInt(e.target.value) || 1)}
                                                    className={`w-full rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:ring-gray-500 dark:border-gray-500 dark:bg-gray-600 dark:text-white ${
                                                        errores.cantidad ? 'border-red-500' : 'border-gray-300 dark:border-gray-500'
                                                    }`}
                                                    min="1"
                                                    disabled={readonly}
                                                />
                                                {errores.cantidad && <p className="mt-1 text-xs text-red-600">{errores.cantidad}</p>}
                                            </div>

                                            <div>
                                                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                    Precio Unitario *
                                                </label>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    value={formData.valorUnitario || ''}
                                                    onChange={(e) => actualizarCampo('valorUnitario', parseFloat(e.target.value) || 0)}
                                                    className={`w-full rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:ring-gray-500 dark:border-gray-500 dark:bg-gray-600 dark:text-white ${
                                                        errores.valorUnitario ? 'border-red-500' : 'border-gray-300 dark:border-gray-500'
                                                    }`}
                                                    min="0"
                                                    disabled={readonly}
                                                />
                                                {errores.valorUnitario && <p className="mt-1 text-xs text-red-600">{errores.valorUnitario}</p>}
                                            </div>

                                            <div>
                                                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Descuento</label>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    value={formData.descuento || ''}
                                                    onChange={(e) => actualizarCampo('descuento', parseFloat(e.target.value) || 0)}
                                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-gray-500 dark:border-gray-500 dark:bg-gray-600 dark:text-white"
                                                    min="0"
                                                    disabled={readonly}
                                                />
                                            </div>

                                            <div>
                                                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Total</label>
                                                <div className="rounded-lg border border-gray-300 bg-gray-100 px-3 py-2 text-sm font-semibold text-emerald-700 dark:border-gray-500 dark:bg-gray-600 dark:text-emerald-400">
                                                    ${totalCalculado.toFixed(2)}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Información de factura */}
                                    {(formData.folio || formData.fechaFactura || formData.proveedor || readonly) && (
                                        <div className="rounded-lg bg-purple-50 p-6 dark:bg-purple-900/10">
                                            <h3 className="mb-4 flex items-center gap-2 text-lg font-medium text-gray-900 dark:text-white">
                                                <FileText className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                                                Información de Compra
                                            </h3>

                                            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                                <div>
                                                    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Folio</label>
                                                    <input
                                                        type="text"
                                                        value={formData.folio || ''}
                                                        onChange={(e) => actualizarCampo('folio', e.target.value)}
                                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-gray-500 dark:border-gray-500 dark:bg-gray-600 dark:text-white"
                                                        disabled={readonly}
                                                    />
                                                </div>

                                                <div>
                                                    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                        Fecha de Factura
                                                    </label>
                                                    <input
                                                        type="date"
                                                        value={formData.fechaFactura ? formData.fechaFactura.split('T')[0] : ''}
                                                        onChange={(e) => actualizarCampo('fechaFactura', e.target.value)}
                                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-gray-500 dark:border-gray-500 dark:bg-gray-600 dark:text-white"
                                                        disabled={readonly}
                                                    />
                                                </div>

                                                <div>
                                                    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                        Proveedor
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={formData.proveedor || ''}
                                                        onChange={(e) => actualizarCampo('proveedor', e.target.value)}
                                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-gray-500 dark:border-gray-500 dark:bg-gray-600 dark:text-white"
                                                        disabled={readonly}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Footer con botones */}
                                <div className="border-t border-gray-200 bg-gray-50 px-6 py-4 dark:border-gray-600 dark:bg-gray-700">
                                    <div className="flex items-center justify-between">
                                        <div className="text-sm text-gray-600 dark:text-gray-400">
                                            {readonly ? (
                                                <span className="flex items-center gap-2">
                                                    <Info className="h-4 w-4" />
                                                    Modo solo lectura
                                                </span>
                                            ) : cambiosRealizados ? (
                                                <span className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                                                    <AlertCircle className="h-4 w-4" />
                                                    Hay cambios sin guardar
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                                                    <Check className="h-4 w-4" />
                                                    Sin cambios
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex gap-3">
                                            <button
                                                onClick={onClose}
                                                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-500 dark:bg-gray-600 dark:text-gray-300 dark:hover:bg-gray-500"
                                            >
                                                {cambiosRealizados && !readonly ? 'Cancelar' : 'Cerrar'}
                                            </button>

                                            {!readonly && (
                                                <button
                                                    onClick={handleGuardar}
                                                    disabled={guardando || !cambiosRealizados}
                                                    className="flex items-center gap-2 rounded-lg bg-gray-700 px-6 py-2 text-white transition-colors hover:bg-gray-800 disabled:opacity-50 dark:bg-gray-600 dark:hover:bg-gray-500"
                                                >
                                                    {guardando ? (
                                                        <>
                                                            <Loader className="h-4 w-4 animate-spin" />
                                                            Guardando...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Save className="h-4 w-4" />
                                                            Guardar Cambios
                                                        </>
                                                    )}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </DialogPanel>
                        </TransitionChild>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
};

export default LibroEditModal;
