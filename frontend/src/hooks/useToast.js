// src/hooks/useToast.js
import { useState, useCallback } from 'react';

export function useToast() {
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = 'info') => {
    setToast({ message, type, id: Date.now() });
  }, []);

  const dismiss = useCallback(() => setToast(null), []);

  return { toast, showToast, dismiss };
}
