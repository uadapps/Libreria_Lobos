// components/ui/FormModal.tsx
import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FormModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
  enableScroll?: boolean;
}

export function FormModal({ 
  isOpen, 
  onClose, 
  title, 
  subtitle,
  children, 
  actions,
  maxWidth = 'lg',
  enableScroll = true
}: FormModalProps) {
  
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

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md', 
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl'
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Modal */}
      <div 
        className={`
          relative bg-white dark:bg-zinc-900 rounded-xl shadow-2xl 
          ${maxWidthClasses[maxWidth]} w-full 
          max-h-[95vh] flex flex-col
          transform transition-all duration-200 ease-out
          animate-in zoom-in-95 fade-in-0
          border border-gray-200 dark:border-zinc-700
        `}
        role="dialog"
        aria-modal="true"
        aria-labelledby="form-modal-title"
      >
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-gray-200 dark:border-zinc-700 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-zinc-800 dark:to-zinc-700 rounded-t-xl">
          <div className="flex-1">
            <h2 
              id="form-modal-title"
              className="text-xl font-bold text-gray-900 dark:text-white"
            >
              {title}
            </h2>
            {subtitle && (
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                {subtitle}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 ml-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 
                     hover:bg-white/80 dark:hover:bg-zinc-800 rounded-lg transition-all duration-200 
                     focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Cerrar modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        {/* Content */}
        <div className={`
          flex-1 p-6 
          ${enableScroll ? 'overflow-y-auto' : ''} 
          ${enableScroll ? 'max-h-[calc(95vh-140px)]' : ''}
        `}>
          {children}
        </div>

        {/* Actions Footer */}
        {actions && (
          <div className="flex-shrink-0 px-6 py-4 border-t border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800/50 rounded-b-xl">
            <div className="flex justify-end gap-3">
              {actions}
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

// Componente FormField para campos más organizados
interface FormFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export function FormField({ 
  label, 
  required = false, 
  error, 
  description, 
  children, 
  className = "" 
}: FormFieldProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center gap-1">
        <label className="text-sm font-medium text-gray-900 dark:text-white">
          {label}
        </label>
        {required && (
          <span className="text-red-500 text-sm">*</span>
        )}
      </div>
      
      {description && (
        <p className="text-xs text-gray-600 dark:text-gray-400">
          {description}
        </p>
      )}
      
      <div className="relative">
        {children}
      </div>
      
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
          <span className="text-xs">⚠️</span>
          {error}
        </p>
      )}
    </div>
  );
}

// Componente FormSection para agrupar campos
interface FormSectionProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export function FormSection({ 
  title, 
  description, 
  children, 
  className = "" 
}: FormSectionProps) {
  return (
    <div className={`space-y-4 ${className}`}>
      {(title || description) && (
        <div className="pb-3 border-b border-gray-200 dark:border-zinc-700">
          {title && (
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {title}
            </h3>
          )}
          {description && (
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              {description}
            </p>
          )}
        </div>
      )}
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );
}

// Componente FormActions para botones
interface FormActionsProps {
  onCancel?: () => void;
  onSubmit?: () => void;
  submitText?: string;
  cancelText?: string;
  isLoading?: boolean;
  submitVariant?: 'default' | 'destructive' | 'success';
  children?: React.ReactNode;
}

export function FormActions({ 
  onCancel,
  onSubmit,
  submitText = 'Guardar',
  cancelText = 'Cancelar',
  isLoading = false,
  submitVariant = 'default',
  children
}: FormActionsProps) {
  const getSubmitClasses = () => {
    switch (submitVariant) {
      case 'destructive':
        return 'bg-red-600 hover:bg-red-700 focus:ring-red-500 text-white';
      case 'success':
        return 'bg-green-600 hover:bg-green-700 focus:ring-green-500 text-white';
      default:
        return 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500 text-white';
    }
  };

  return (
    <>
      {children ? (
        children
      ) : (
        <>
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
              className="px-4 py-2"
            >
              {cancelText}
            </Button>
          )}
          {onSubmit && (
            <Button
              type="button"
              onClick={onSubmit}
              disabled={isLoading}
              className={`px-6 py-2 ${getSubmitClasses()}`}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Guardando...
                </div>
              ) : (
                submitText
              )}
            </Button>
          )}
        </>
      )}
    </>
  );
}