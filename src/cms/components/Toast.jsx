import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { FiCheckCircle, FiAlertCircle, FiInfo, FiX } from 'react-icons/fi';
import { cx } from './ui';

const ToastContext = createContext(null);

const tones = {
  success: { icon: FiCheckCircle, className: 'border-green-200 bg-green-50 text-green-900' },
  error: { icon: FiAlertCircle, className: 'border-red-200 bg-red-50 text-red-900' },
  info: { icon: FiInfo, className: 'border-blue-200 bg-blue-50 text-blue-900' }
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const counter = useRef(0);

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const push = useCallback((tone, message) => {
    const id = ++counter.current;
    setToasts((current) => [...current.slice(-3), { id, tone, message }]);
    setTimeout(() => dismiss(id), tone === 'error' ? 8000 : 4000);
  }, [dismiss]);

  const toast = useMemo(() => ({
    success: (message) => push('success', message),
    error: (message) => push('error', message),
    info: (message) => push('info', message)
  }), [push]);

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 w-80 max-w-[calc(100vw-2rem)]" aria-live="polite">
        {toasts.map(({ id, tone, message }) => {
          const { icon: Icon, className } = tones[tone];
          return (
            <div key={id} className={cx('flex items-start gap-3 rounded-lg border px-4 py-3 shadow-lg text-sm', className)}>
              <Icon className="mt-0.5 h-4 w-4 flex-shrink-0" aria-hidden="true" />
              <span className="flex-1">{message}</span>
              <button type="button" onClick={() => dismiss(id)} aria-label="Dismiss" className="opacity-60 hover:opacity-100">
                <FiX className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
}
