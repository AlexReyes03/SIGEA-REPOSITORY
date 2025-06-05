import { useEffect } from 'react';

export default function useBootstrapModalFocus(modalRef, buttonRef) {
  useEffect(() => {
    const handleHide = () => {
      if (buttonRef.current) buttonRef.current.focus();
    };
    const modalEl = modalRef.current;
    if (modalEl) {
      modalEl.addEventListener('hidden.bs.modal', handleHide);
      return () => modalEl.removeEventListener('hidden.bs.modal', handleHide);
    }
  }, [modalRef, buttonRef]);
}
