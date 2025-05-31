import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AnimatePresence, motion } from 'framer-motion';

export default function ConfirmDialog({
    open,
    onConfirm,
    onCancel,
    title = '¿Estás seguro?',
    message = 'Esta acción no se puede deshacer.',
}: {
    open: boolean;
    onConfirm: () => void;
    onCancel: () => void;
    title?: string;
    message?: string;
}) {
    return (
        <Dialog open={open} onOpenChange={onCancel}>
            <AnimatePresence mode="wait">
                {open && (
                    <DialogContent className="sm:max-w-md">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                        >
                            <DialogHeader>
                                <DialogTitle>{title}</DialogTitle>
                            </DialogHeader>
                            <div className="py-4 text-sm text-muted-foreground">{message}</div>
                            <DialogFooter className="gap-2">
                                <Button variant="outline" onClick={onCancel}>Cancelar</Button>
                                <Button variant="destructive" onClick={onConfirm}>Sí, continuar</Button>
                            </DialogFooter>
                        </motion.div>
                    </DialogContent>
                )}
            </AnimatePresence>
        </Dialog>
    );
}
