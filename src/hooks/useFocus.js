import { useState, useEffect, useCallback } from 'react';

export const useFocus = (size, columns = 1) => {
    const [focusIndex, setFocusIndex] = useState(0);

    const handleKeyDown = useCallback((e) => {
        if (size === 0) return;

        switch (e.key) {
            case 'ArrowRight':
                setFocusIndex(prev => (prev + 1) % size);
                break;
            case 'ArrowLeft':
                setFocusIndex(prev => (prev - 1 + size) % size);
                break;
            case 'ArrowDown':
                setFocusIndex(prev => {
                    const next = prev + columns;
                    return next < size ? next : prev;
                });
                break;
            case 'ArrowUp':
                setFocusIndex(prev => {
                    const next = prev - columns;
                    return next >= 0 ? next : prev;
                });
                break;
            default:
                break;
        }
    }, [size, columns]);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    return { focusIndex, setFocusIndex };
};
