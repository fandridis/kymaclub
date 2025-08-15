import { useCallback, useRef } from 'react';

interface UseDoubleClickOptions {
    delay?: number;
}

/**
 * Hook to detect double clicks on items with a unique identifier
 * 
 * @param onDoubleClick - Callback function that receives the id when double-click is detected
 * @param options - Optional configuration (delay between clicks)
 * @returns Click handler function that should be called with the item's id
 * 
 * @example
 * const handleClick = useDoubleClick((id) => {
 *   console.log(`Double clicked on item ${id}`);
 * });
 * 
 * // In your component
 * <div onClick={() => handleClick(item.id)}>Click me twice</div>
 * 
 * // For calendar slots
 * const handleSelectTimeSlot = useDoubleClick((slotId) => {
 *   setCreateDialog({ open: true, selectedDateTime: slotId });
 * });
 * 
 * <FullCalendar select={(info) => handleSelectTimeSlot(info.startStr)} />
 */
export function useDoubleClick<T = string>(
    onDoubleClick: (id: T) => void,
    options: UseDoubleClickOptions = {}
) {
    const { delay = 600 } = options;

    const lastClickRef = useRef<{
        id: T;
        timestamp: number;
    } | null>(null);

    const handleClick = useCallback((id: T) => {
        const currentTime = Date.now();
        const lastClick = lastClickRef.current;

        if (
            lastClick &&
            lastClick.id === id &&
            currentTime - lastClick.timestamp < delay
        ) {
            onDoubleClick(id);
            lastClickRef.current = null;
        } else {
            lastClickRef.current = {
                id,
                timestamp: currentTime
            };
        }
    }, [onDoubleClick, delay]);

    return handleClick;
}