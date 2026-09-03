'use client';

/**
 * Execute a DOM state update with Modern Web View Transitions API
 * If the browser supports View Transitions, it animates smoothly.
 * Fallback to direct callback execution if unsupported.
 */
export function startViewTransition(callback: () => void) {
  if (typeof document !== 'undefined' && 'startViewTransition' in document) {
    (document as any).startViewTransition(() => {
      callback();
    });
  } else {
    callback();
  }
}
