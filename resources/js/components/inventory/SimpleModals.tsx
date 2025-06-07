import React from 'react';
import { X, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { InventoryPeriod } from '@/types/inventory';
import { PeriodStatusBadge } from './PeriodStatusBadge';

interface CreateModalProps {
    isOpen: boolean;
    periodName: string;
    setPeriodName: (name: string) => void;
    isNameDuplicate: boolean;
    activePeriod?: InventoryPeriod | null;
    onClose: () => void;
    onCreate: () => void;
}
export const CreatePeriodModal: React.FC<CreateModalProps> = ({
    isOpen, periodName, setPeriodName, isNameDuplicate, activePeriod, onClose, onCreate
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="fixed inset-0 bg-black/50" onClick={onClose}></div>
            <div className="relative bg-card border rounded-lg shadow-lg max-w-md w-full mx-4 p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Crear Nuevo Período</h3>
                    <Button variant="ghost" size="icon" onClick={onClose}>
                        <X className="h-4 w-4" />
                    </Button>
                </div>

                {activePeriod && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
                        <div className="flex items-start gap-2">
                            <AlertCircle className="text-amber-600 flex-shrink-0 mt-0.5" size={16} />
                            <p className="text-amber-800 text-sm">
                                El período <strong>"{activePeriod.name}"</strong> se cerrará automáticamente.
                            </p>
                        </div>
                    </div>
                )}
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-2">Nombre del Período</label>
                        <Input
                            value={periodName}
                            onChange={(e) => setPeriodName(e.target.value)}
                            placeholder="Ej: Inventario Jun2025"
                            className={isNameDuplicate ? 'border-red-500' : ''}
                        />
                        {isNameDuplicate && (
                            <p className="text-sm text-red-600 mt-1">Ya existe un período con este nombre</p>
                        )}
                    </div>

                    <div className="flex gap-3">
                        <Button onClick={onClose} variant="outline" className="flex-1">
                            Cancelar
                        </Button>
                        <Button
                            onClick={onCreate}
                            disabled={!periodName.trim() || isNameDuplicate}
                            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                            Crear Período
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};
interface ViewModalProps {
    isOpen: boolean;
    period: InventoryPeriod | null;
    onClose: () => void;
}

export const ViewPeriodModal: React.FC<ViewModalProps> = ({ isOpen, period, onClose }) => {
    if (!isOpen || !period) return null;
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('es-MX', {
            year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    };
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="fixed inset-0 bg-black/50" onClick={onClose}></div>
            <div className="relative bg-card border rounded-lg shadow-lg max-w-lg w-full mx-4 p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Detalles del Período</h3>
                    <Button variant="ghost" size="icon" onClick={onClose}>
                        <X className="h-4 w-4" />
                    </Button>
                </div>
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-muted-foreground mb-1">Nombre</label>
                            <p className="font-medium">{period.name}</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-muted-foreground mb-1">Estado</label>
                            <PeriodStatusBadge status={period.status} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-muted-foreground mb-1">Creado por</label>
                            <p>{period.created_by}</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-muted-foreground mb-1">Fecha inicio</label>
                            <p>{formatDate(period.created_at)}</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                        <div className="text-center p-4 bg-muted/30 rounded-lg">
                            <p className="text-2xl font-bold text-emerald-600">{period.total_movements}</p>
                            <p className="text-sm text-muted-foreground">Movimientos</p>
                        </div>
                        <div className="text-center p-4 bg-muted/30 rounded-lg">
                            <p className="text-2xl font-bold text-emerald-600">{period.total_books.toLocaleString()}</p>
                            <p className="text-sm text-muted-foreground">Libros</p>
                        </div>
                    </div>
                    <Button onClick={onClose} className="w-full">Cerrar</Button>
                </div>
            </div>
        </div>
    );
};