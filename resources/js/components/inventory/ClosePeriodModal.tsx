import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { InventoryPeriod } from '@/types/inventory';
interface Props {
    isOpen: boolean;
    period: InventoryPeriod | null;
    onClose: () => void;
    onConfirm: (period: InventoryPeriod) => void;
    isLoading?: boolean;
}
export const ClosePeriodModal: React.FC<Props> = ({
    isOpen,
    period,
    onClose,
    onConfirm,
    isLoading = false
}) => {
    if (!isOpen || !period) return null;
    const handleConfirm = () => {
        onConfirm(period);
    };
    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
              
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-full">
                            <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                        </div>
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                            Cerrar Período
                        </h2>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onClose}
                        disabled={isLoading}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>
                <div className="p-6">
                    <div className="space-y-4">
                        <p className="text-gray-700 dark:text-gray-300">
                            ¿Estás seguro de que deseas cerrar el período <strong>"{period.name}"</strong>?
                        </p>
                        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                                <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                                <div className="text-sm">
                                    <p className="font-medium text-amber-800 dark:text-amber-200 mb-1">
                                        ⚠️ Esta acción no se puede deshacer
                                    </p>
                                    <ul className="text-amber-700 dark:text-amber-300 space-y-1">
                                        <li>• No podrás agregar más movimientos</li>
                                        <li>• Los datos quedarán bloqueados</li>
                                        <li>• Se generará el reporte final</li>
                                    </ul>
                                </div>
                            </div>
                        </div>        
                        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                            <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                                Resumen del período:
                            </h4>
                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <div>
                                    <span className="text-gray-500 dark:text-gray-400">Movimientos:</span>
                                    <p className="font-semibold text-gray-900 dark:text-gray-100">
                                        {period.total_movements}
                                    </p>
                                </div>
                                <div>
                                    <span className="text-gray-500 dark:text-gray-400">Libros:</span>
                                    <p className="font-semibold text-gray-900 dark:text-gray-100">
                                        {period.total_books.toLocaleString()}
                                    </p>
                                </div>
                                <div>
                                    <span className="text-gray-500 dark:text-gray-400">Creado por:</span>
                                    <p className="font-semibold text-gray-900 dark:text-gray-100">
                                        {period.created_by}
                                    </p>
                                </div>
                                <div>
                                    <span className="text-gray-500 dark:text-gray-400">Inicio:</span>
                                    <p className="font-semibold text-gray-900 dark:text-gray-100">
                                        {new Date(period.created_at).toLocaleDateString('es-MX')}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                    <Button
                        variant="outline"
                        onClick={onClose}
                        disabled={isLoading}
                        className="flex-1"
                    >
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleConfirm}
                        disabled={isLoading}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                    >
                        {isLoading ? 'Cerrando...' : 'Cerrar Período'}
                    </Button>
                </div>
            </div>
        </div>
    );
};