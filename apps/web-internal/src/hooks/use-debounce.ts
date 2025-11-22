// @/hooks/use-debounce.tsx

import * as React from "react";

/**
 * Custom React hook to debounce a value.
 *
 * The debounced value will only reflect the latest value after the specified
 * delay has passed since the last update. This is useful for optimizing
 * expensive operations like fetching data based on user input (e.g., search).
 *
 * @param value The value to debounce.
 * @param delay The delay in milliseconds after which the value will be updated.
 * @returns The debounced value.
 */
export function useDebounce<T>(value: T, delay: number): T {
    // State to store the debounced value
    const [debouncedValue, setDebouncedValue] = React.useState<T>(value);

    React.useEffect(() => {
        // Set up a timer to update the debounced value after the delay
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        // Cleanup function: cancel the timer if value changes or the component unmounts
        // This is crucial: if the 'value' changes again before 'delay' milliseconds have passed,
        // the previous timer is cleared, and a new timer is set up.
        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]); // Re-run effect only if value or delay changes

    // Return the debounced value
    return debouncedValue;
}