// components/ui/SimpleConfirmDialog.tsx
import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, X } from 'lucide-react';

interface SimpleConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  children?: React.ReactNode;
  type?: 'danger' | 'warning' | 'info';
  confirmText?: string;
  cancelText?: string;
}

export function SimpleConfirmDialog({ 
  isOpen, 
  onClose, 
  onConfirm,
  title = '¿Estás seguro?',
  message,
  children,
  type = 'danger',
  confirmText = 'Confirmar',
  cancelText = 'Cancelar'
}: SimpleConfirmDialogProps) {
  
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };
      
      document.addEventListener('keydown', handleEscape);
      
      return () => {
        document.body.style.overflow = '';
        document.removeEventListener('keydown', handleEscape);
      };
    } else {
      document.body.style.overflow = '';
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const typeStyles = {
    danger: {
      icon: '🗑️',
      iconColor: 'text-red-600',
      confirmButton: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
      border: 'border-red-200',
      iconBg: 'bg-red-100 dark:bg-red-900/20'
    },
    warning: {
      icon: '⚠️',
      iconColor: 'text-yellow-600',
      confirmButton: 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500',
      border: 'border-yellow-200',
      iconBg: 'bg-yellow-100 dark:bg-yellow-900/20'
    },
    info: {
      icon: 'ℹ️',
      iconColor: 'text-blue-600',
      confirmButton: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
      border: 'border-blue-200',
      iconBg: 'bg-blue-100 dark:bg-blue-900/20'
    }
  };

  const currentStyle = typeStyles[type];

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Dialog */}
      <div 
        className="relative bg-white dark:bg-zinc-900 rounded-xl shadow-2xl max-w-md w-full transform transition-all duration-200 ease-out animate-in zoom-in-95 fade-in-0 border border-gray-200 dark:border-zinc-700"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-description"
      >
        {/* Header */}
        <div className="flex items-start p-6 pb-4">
          <div className={`flex-shrink-0 mx-auto flex items-center justify-center h-12 w-12 rounded-full ${currentStyle.iconBg} ${currentStyle.iconColor}`}>
            <AlertTriangle className="h-6 w-6" />
          </div>
        </div>

        {/* Content */}
        <div className="px-6 pb-6">
          <div className="text-center">
            <h3 
              id="confirm-dialog-title"
              className="text-lg font-semibold text-gray-900 dark:text-white mb-2"
            >
              {title}
            </h3>
            {(message || children) && (
              <div 
                id="confirm-dialog-description"
                className="text-sm text-gray-600 dark:text-gray-300 text-left"
              >
                {children || message}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-6 justify-center">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-600 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors min-w-[80px]"
            >
              {cancelText}
            </button>
            <button
              onClick={handleConfirm}
              className={`px-4 py-2 text-sm font-medium text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors min-w-[100px] ${currentStyle.confirmButton}`}
            >
              {confirmText}
            </button>
          </div>
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg p-2 transition-colors"
          aria-label="Cerrar diálogo"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>,
    document.body
  );
}