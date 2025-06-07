// ========================================
// 🪝 hooks/useInventory.ts - ACTUALIZACIÓN
// ========================================

import { useState, useCallback, useMemo } from 'react';
import { router } from '@inertiajs/react';
import { toast } from 'react-toastify';
import { InventoryPeriod } from '@/types/inventory';

export const useInventoryLogic = (periods: InventoryPeriod[]) => {
    // ========================================
    // 📊 ESTADOS EXISTENTES
    // ========================================
    
    // Estados para búsqueda y filtros
    const [searchTerm, setSearchTerm] = useState('');
    
    // Estados para modal de crear
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newPeriodName, setNewPeriodName] = useState('');
    
    // Estados para modal de ver detalles
    const [showViewModal, setShowViewModal] = useState(false);
    const [selectedPeriod, setSelectedPeriod] = useState<InventoryPeriod | null>(null);

    // ========================================
    // ✅ NUEVOS ESTADOS PARA MODAL DE CERRAR
    // ========================================
    
    const [showCloseModal, setShowCloseModal] = useState(false);
    const [periodToClose, setPeriodToClose] = useState<InventoryPeriod | null>(null);
    const [isClosing, setIsClosing] = useState(false);

    // ========================================
    // 🔍 LÓGICA DE DATOS (SIN CAMBIOS)
    // ========================================
    
    // Filtrar períodos por búsqueda
    const filteredPeriods = useMemo(() => {
        if (!searchTerm.trim()) return periods;
        
        const term = searchTerm.toLowerCase();
        return periods.filter(period =>
            period.name.toLowerCase().includes(term) ||
            period.created_by.toLowerCase().includes(term) ||
            period.status.toLowerCase().includes(term)
        );
    }, [periods, searchTerm]);

    // Período activo (status = 'abierto')
    const activePeriod = periods.find(p => p.status === 'abierto');

    // Validar nombres duplicados
    const isNameDuplicate = useMemo(() => {
        if (!newPeriodName.trim()) return false;
        return periods.some(p => 
            p.name.toLowerCase() === newPeriodName.trim().toLowerCase()
        );
    }, [newPeriodName, periods]);

    // ========================================
    // 🔍 FUNCIONES DE BÚSQUEDA (SIN CAMBIOS)
    // ========================================
    
    const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
    }, []);

    // ========================================
    // 📝 FUNCIONES DE MODAL CREAR (SIN CAMBIOS)
    // ========================================
    
    const openCreateModal = useCallback(() => {
        setNewPeriodName('');
        setShowCreateModal(true);
    }, []);

    const closeCreateModal = useCallback(() => {
        setShowCreateModal(false);
        setNewPeriodName('');
    }, []);

    const createPeriod = useCallback(() => {
        if (!newPeriodName.trim() || isNameDuplicate) {
            toast.error('Nombre inválido o duplicado');
            return;
        }

        router.post('/inventario/periodos', { name: newPeriodName.trim() }, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('¡Período creado exitosamente!');
                closeCreateModal();
            },
            onError: (errors) => {
                console.error('Error:', errors);
                toast.error('Error al crear el período');
            }
        });
    }, [newPeriodName, isNameDuplicate, closeCreateModal]);

    // ========================================
    // 👁️ FUNCIONES DE MODAL VER (SIN CAMBIOS)
    // ========================================
    
    const openViewModal = useCallback((period: InventoryPeriod) => {
        setSelectedPeriod(period);
        setShowViewModal(true);
    }, []);

    const closeViewModal = useCallback(() => {
        setShowViewModal(false);
        setSelectedPeriod(null);
    }, []);

    // ========================================
    // ✅ NUEVAS FUNCIONES PARA MODAL DE CERRAR
    // ========================================
    
    const openCloseModal = useCallback((period: InventoryPeriod) => {
        setPeriodToClose(period);
        setShowCloseModal(true);
    }, []);

    const closeCloseModal = useCallback(() => {
        if (isClosing) return; // No cerrar si está procesando
        setShowCloseModal(false);
        setPeriodToClose(null);
    }, [isClosing]);

    // ========================================
    // ✅ FUNCIÓN ACTUALIZADA: Cerrar período
    // ========================================
    
    const closePeriod = useCallback((period: InventoryPeriod) => {
        setIsClosing(true);
        
        router.patch(`/inventario/periodos/${period.id}/cerrar`, {}, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success(`¡Período "${period.name}" cerrado exitosamente!`);
                closeCloseModal();
            },
            onError: (errors) => {
                console.error('Error:', errors);
                toast.error('Error al cerrar el período');
            },
            onFinish: () => {
                setIsClosing(false);
            }
        });
    }, [closeCloseModal]);

    // ========================================
    // 📋 FUNCIONES UTILITARIAS (SIN CAMBIOS)
    // ========================================
    
    const copyPeriodData = useCallback((period: InventoryPeriod) => {
        const data = `Período: ${period.name}
Estado: ${period.status}
Creado por: ${period.created_by}
Fecha: ${new Date(period.created_at).toLocaleDateString('es-MX')}
Movimientos: ${period.total_movements}
Libros: ${period.total_books.toLocaleString()}`;

        navigator.clipboard.writeText(data).then(() => {
            toast.success('Datos copiados al portapapeles');
        }).catch(() => {
            toast.error('Error al copiar los datos');
        });
    }, []);

    // ========================================
    // 📤 RETURN CON NUEVOS VALORES
    // ========================================
    
    return {
        // Estados de búsqueda y datos
        searchTerm,
        filteredPeriods,
        activePeriod,
        
        // Modal de crear
        showCreateModal,
        newPeriodName,
        isNameDuplicate,
        
        // Modal de ver
        showViewModal,
        selectedPeriod,
        
        // ✅ NUEVOS: Modal de cerrar
        showCloseModal,
        periodToClose,
        isClosing,
        
        // Funciones de búsqueda
        handleSearch,
        
        // Funciones de crear
        setNewPeriodName,
        openCreateModal,
        closeCreateModal,
        createPeriod,
        
        // Funciones de ver
        openViewModal,
        closeViewModal,
        
        // ✅ NUEVAS: Funciones de cerrar
        openCloseModal,
        closeCloseModal,
        closePeriod,
        
        // Funciones utilitarias
        copyPeriodData
    };
};