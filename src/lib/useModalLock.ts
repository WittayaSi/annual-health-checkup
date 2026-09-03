'use client';

import { useEffect, useRef } from 'react';

let activeModalCount = 0;

export function useModalLock(isOpen: boolean = true) {
  const isLockedRef = useRef(false);

  useEffect(() => {
    if (typeof document === 'undefined') return;

    if (isOpen && !isLockedRef.current) {
      activeModalCount++;
      isLockedRef.current = true;
      if (activeModalCount === 1) {
        document.documentElement.classList.add('modal-open');
        document.body.classList.add('modal-open');
      }
    } else if (!isOpen && isLockedRef.current) {
      activeModalCount = Math.max(0, activeModalCount - 1);
      isLockedRef.current = false;
      if (activeModalCount === 0) {
        document.documentElement.classList.remove('modal-open');
        document.body.classList.remove('modal-open');
      }
    }

    return () => {
      if (isLockedRef.current) {
        activeModalCount = Math.max(0, activeModalCount - 1);
        isLockedRef.current = false;
        if (activeModalCount === 0) {
          document.documentElement.classList.remove('modal-open');
          document.body.classList.remove('modal-open');
        }
      }
    };
  }, [isOpen]);
}
