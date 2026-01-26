import { useCallback, useEffect, useRef } from 'react';

interface UseKeyboardNavigationOptions {
  containerRef: React.RefObject<HTMLElement>;
  enabled?: boolean;
  onEnter?: (element: HTMLElement) => void;
  onEscape?: () => void;
  selector?: string;
}

/**
 * Hook for keyboard navigation within a container
 * Supports Enter to move to next input, Arrow keys for navigation
 */
export const useKeyboardNavigation = ({
  containerRef,
  enabled = true,
  onEnter,
  onEscape,
  selector = 'input:not([disabled]), select:not([disabled]), textarea:not([disabled])',
}: UseKeyboardNavigationOptions) => {
  const currentIndexRef = useRef<number>(-1);

  const getFocusableElements = useCallback((): HTMLElement[] => {
    if (!containerRef.current) return [];
    return Array.from(containerRef.current.querySelectorAll<HTMLElement>(selector));
  }, [containerRef, selector]);

  const focusElement = useCallback((index: number) => {
    const elements = getFocusableElements();
    if (index >= 0 && index < elements.length) {
      elements[index].focus();
      currentIndexRef.current = index;
      return true;
    }
    return false;
  }, [getFocusableElements]);

  const focusNext = useCallback(() => {
    const elements = getFocusableElements();
    const currentIndex = elements.findIndex(el => el === document.activeElement);
    const nextIndex = currentIndex + 1;
    
    if (nextIndex < elements.length) {
      focusElement(nextIndex);
      return true;
    }
    return false;
  }, [getFocusableElements, focusElement]);

  const focusPrevious = useCallback(() => {
    const elements = getFocusableElements();
    const currentIndex = elements.findIndex(el => el === document.activeElement);
    const prevIndex = currentIndex - 1;
    
    if (prevIndex >= 0) {
      focusElement(prevIndex);
      return true;
    }
    return false;
  }, [getFocusableElements, focusElement]);

  const focusFirst = useCallback(() => {
    return focusElement(0);
  }, [focusElement]);

  const focusLast = useCallback(() => {
    const elements = getFocusableElements();
    return focusElement(elements.length - 1);
  }, [getFocusableElements, focusElement]);

  useEffect(() => {
    if (!enabled || !containerRef.current) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';
      const isSelect = target.tagName === 'SELECT';

      switch (event.key) {
        case 'Enter':
          // Don't interfere with textarea Enter behavior
          if (target.tagName === 'TEXTAREA') return;
          
          event.preventDefault();
          
          if (onEnter) {
            onEnter(target);
          }
          
          focusNext();
          break;

        case 'Tab':
          // Let default tab behavior work, but track the index
          setTimeout(() => {
            const elements = getFocusableElements();
            currentIndexRef.current = elements.findIndex(el => el === document.activeElement);
          }, 0);
          break;

        case 'ArrowDown':
          // Only handle if in a form context, not in select
          if (isSelect) return;
          if (isInput && event.altKey) {
            event.preventDefault();
            focusNext();
          }
          break;

        case 'ArrowUp':
          // Only handle if in a form context, not in select
          if (isSelect) return;
          if (isInput && event.altKey) {
            event.preventDefault();
            focusPrevious();
          }
          break;

        case 'Escape':
          if (onEscape) {
            onEscape();
          }
          break;

        case 'Home':
          if (event.ctrlKey && isInput) {
            event.preventDefault();
            focusFirst();
          }
          break;

        case 'End':
          if (event.ctrlKey && isInput) {
            event.preventDefault();
            focusLast();
          }
          break;
      }
    };

    const container = containerRef.current;
    container.addEventListener('keydown', handleKeyDown);

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    enabled,
    containerRef,
    focusNext,
    focusPrevious,
    focusFirst,
    focusLast,
    getFocusableElements,
    onEnter,
    onEscape,
  ]);

  return {
    focusNext,
    focusPrevious,
    focusFirst,
    focusLast,
    focusElement,
    getFocusableElements,
  };
};

/**
 * Shortcut helper for common keyboard shortcuts
 */
export const useKeyboardShortcut = (
  key: string,
  callback: () => void,
  options: {
    ctrl?: boolean;
    shift?: boolean;
    alt?: boolean;
    meta?: boolean;
    enabled?: boolean;
  } = {}
) => {
  const { ctrl = false, shift = false, alt = false, meta = false, enabled = true } = options;

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const matchesKey = event.key.toLowerCase() === key.toLowerCase();
      const matchesModifiers =
        event.ctrlKey === ctrl &&
        event.shiftKey === shift &&
        event.altKey === alt &&
        event.metaKey === meta;

      if (matchesKey && matchesModifiers) {
        event.preventDefault();
        callback();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [key, callback, ctrl, shift, alt, meta, enabled]);
};
