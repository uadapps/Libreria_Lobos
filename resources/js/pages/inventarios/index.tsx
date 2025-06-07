
import { Head, usePage } from '@inertiajs/react';
import { Copy, Eye, MoreVertical, Plus, Search } from 'lucide-react';
import { useEffect } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';

import { ActivePeriodAlert } from '@/components/inventory/ActivePeriodAlert';
import { ClosePeriodModal } from '@/components/inventory/ClosePeriodModal'; 
import { PeriodStatusBadge } from '@/components/inventory/PeriodStatusBadge';
import { CreatePeriodModal, ViewPeriodModal } from '@/components/inventory/SimpleModals';
import { useInventoryLogic } from '@/hooks/useInventory';
import { InventoryPeriodsPageProps } from '@/types/inventory';

interface PageProps {
    auth?: {
        permissions?: string[];
    };
    [key: string]: unknown;
}

export default function InventoryPeriodsIndex({ periods = [], error }: InventoryPeriodsPageProps) {
    const { props } = usePage<PageProps>();
    const userPermissions: string[] = props.auth?.permissions || [];
    const canCreate = userPermissions.includes('inventario.periodos-crear');
    const canView = userPermissions.includes('inventario.periodos-ver');
    const canClose = userPermissions.includes('inventario.periodos-cerrar');
    const {
        searchTerm,
        filteredPeriods,
        showCreateModal,
        newPeriodName,
        isNameDuplicate,
        selectedPeriod,
        showViewModal,
        activePeriod,
        setNewPeriodName,
        handleSearch,
        openCreateModal,
        closeCreateModal,
        createPeriod,
        openViewModal,
        closeViewModal,
        copyPeriodData,
        showCloseModal,
        periodToClose,
        isClosing,
        openCloseModal,
        closeCloseModal,
        closePeriod,
    } = useInventoryLogic(periods);
    useEffect(() => {
        if (error) {
            toast.warning(error, { position: 'top-center', autoClose: 5000, theme: 'colored' });
        }
    }, [error]);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('es-MX', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Inventario', href: '/inventario' },
                { title: 'Períodos', href: '/inventarios' },
            ]}
        >
            <Head title="Períodos de Inventario" />
            <div className="flex items-center justify-between px-6 py-4">
                <h1 className="text-foreground text-3xl font-bold">Períodos de Inventario</h1>
                <div className="flex gap-2">
                    <div className="relative">
                        <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform" />
                        <Input placeholder="Buscar período..." value={searchTerm} onChange={handleSearch} className="w-64 pl-10" />
                    </div>
                    {canCreate && (
                        <Button onClick={openCreateModal} className="flex items-center gap-2 bg-emerald-600 text-white hover:bg-emerald-700">
                            <Plus className="h-4 w-4" />
                            Nuevo Período
                        </Button>
                    )}
                </div>
            </div>
            {activePeriod && <ActivePeriodAlert activePeriod={activePeriod} onClose={openCloseModal} canClose={canClose} />}
            <div className="border-border bg-card mx-6 overflow-x-auto rounded-lg border shadow-sm">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Estado</TableHead>
                            <TableHead>Nombre del Período</TableHead>
                            <TableHead>Creado por</TableHead>
                            <TableHead>Fecha Inicio</TableHead>
                            <TableHead>Movimientos</TableHead>
                            <TableHead>Libros</TableHead>
                            {canView && <TableHead className="text-right">Acciones</TableHead>}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredPeriods.length > 0 ? (
                            filteredPeriods.map((period) => (
                                <TableRow key={period.id} className="hover:bg-muted/30">
                                    <TableCell>
                                        <PeriodStatusBadge status={period.status} />
                                    </TableCell>
                                    <TableCell className="font-medium">{period.name}</TableCell>
                                    <TableCell className="text-muted-foreground">{period.created_by}</TableCell>
                                    <TableCell className="text-muted-foreground">{formatDate(period.created_at)}</TableCell>
                                    <TableCell>
                                        <span className="font-semibold">{period.total_movements}</span>
                                    </TableCell>
                                    <TableCell>
                                        <span className="font-semibold">{period.total_books.toLocaleString()}</span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {canView && (
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                           
                                                    {canView && (
                                                        <DropdownMenuItem onClick={() => openViewModal(period)}>
                                                            <Eye className="mr-2 h-4 w-4" /> Ver detalles
                                                        </DropdownMenuItem>
                                                    )}
                                                    <DropdownMenuItem onClick={() => copyPeriodData(period)}>
                                                        <Copy className="mr-2 h-4 w-4" /> Copiar datos
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        )}

                                     
                                        {!canView &&  <span className="text-muted-foreground text-xs italic"></span>}
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={7} className="py-12 text-center">
                                    <div className="flex flex-col items-center gap-4">
                                        <div className="text-muted-foreground">
                                            {searchTerm ? 'No se encontraron períodos con ese criterio' : 'No hay períodos de inventario registrados'}
                                        </div>

                                        {!searchTerm && canCreate && (
                                            <Button onClick={openCreateModal} size="sm" className="bg-emerald-600 text-white hover:bg-emerald-700">
                                                <Plus className="mr-2 h-4 w-4" />
                                                Crear primer período
                                            </Button>
                                        )}
                                    </div>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
            {canCreate && (
                <CreatePeriodModal
                    isOpen={showCreateModal}
                    periodName={newPeriodName}
                    setPeriodName={setNewPeriodName}
                    isNameDuplicate={Boolean(isNameDuplicate)}
                    activePeriod={activePeriod}
                    onClose={closeCreateModal}
                    onCreate={createPeriod}
                />
            )}
            {canView && <ViewPeriodModal isOpen={showViewModal} period={selectedPeriod} onClose={closeViewModal} />}
            <ClosePeriodModal
                isOpen={showCloseModal}
                period={periodToClose}
                onClose={closeCloseModal}
                onConfirm={closePeriod}
                isLoading={isClosing}
            />
            <ToastContainer position="top-center" autoClose={3000} theme="colored" />
        </AppLayout>
    );
}
