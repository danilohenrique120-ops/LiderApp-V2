
import { useState, useCallback } from 'react';

export const useTaskSelection = () => {
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isSelectionMode, setIsSelectionMode] = useState(false);

    const toggleMode = useCallback(() => {
        setIsSelectionMode(prev => {
            if (prev) setSelectedIds(new Set()); // Limpa ao sair
            return !prev;
        });
    }, []);

    const toggleSelection = useCallback((id: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }, []);

    const selectAll = useCallback((ids: string[]) => {
        setSelectedIds(new Set(ids));
    }, []);

    const clearSelection = useCallback(() => {
        setSelectedIds(new Set());
    }, []);

    return {
        selectedIds: Array.from(selectedIds),
        isSelectionMode,
        toggleMode,
        toggleSelection,
        selectAll,
        clearSelection,
        hasSelection: selectedIds.size > 0,
        count: selectedIds.size
    };
};
