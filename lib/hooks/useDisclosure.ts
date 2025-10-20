import { useState, useCallback } from 'react';

/**
 * useDisclosure Hook
 *
 * Manages boolean state with open/close/toggle handlers.
 * Common pattern for modals, dropdowns, collapsible sections.
 *
 * @param initialState - Initial open/closed state (default: false)
 * @returns Object with isOpen state and handler functions
 *
 * @example
 * ```tsx
 * const { isOpen, onOpen, onClose, onToggle } = useDisclosure();
 *
 * return (
 *   <>
 *     <Button onClick={onOpen}>Open Modal</Button>
 *     <Modal isOpen={isOpen} onClose={onClose}>...</Modal>
 *   </>
 * );
 * ```
 */
export function useDisclosure(initialState = false) {
  const [isOpen, setIsOpen] = useState(initialState);

  const onOpen = useCallback(() => setIsOpen(true), []);
  const onClose = useCallback(() => setIsOpen(false), []);
  const onToggle = useCallback(() => setIsOpen((prev) => !prev), []);

  return {
    isOpen,
    onOpen,
    onClose,
    onToggle,
    setIsOpen, // For advanced use cases
  };
}
