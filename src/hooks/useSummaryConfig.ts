import { useState, useCallback } from 'react';

const STORAGE_KEY = 'spendio-summary-config';

interface SummaryConfig {
  selectedSheetIds: number[];
  selectedCategoryIds: number[] | null;
}

function loadConfig(): SummaryConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as SummaryConfig;
  } catch { /* ignore */ }
  return { selectedSheetIds: [], selectedCategoryIds: null };
}

function saveConfig(config: SummaryConfig) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

export function useSummaryConfig() {
  const [config, setConfig] = useState<SummaryConfig>(loadConfig);

  const update = useCallback((next: SummaryConfig) => {
    setConfig(next);
    saveConfig(next);
  }, []);

  const initCategories = useCallback((allIds: number[]) => {
    setConfig((prev) => {
      if (prev.selectedCategoryIds !== null) return prev;
      const next = { ...prev, selectedCategoryIds: allIds };
      saveConfig(next);
      return next;
    });
  }, []);

  const toggleSheet = useCallback((id: number) => {
    setConfig((prev) => {
      const ids = prev.selectedSheetIds.includes(id)
        ? prev.selectedSheetIds.filter((s) => s !== id)
        : [...prev.selectedSheetIds, id];
      const next = { ...prev, selectedSheetIds: ids };
      saveConfig(next);
      return next;
    });
  }, []);

  const toggleCategory = useCallback((id: number) => {
    setConfig((prev) => {
      const current = prev.selectedCategoryIds ?? [];
      const ids = current.includes(id)
        ? current.filter((c) => c !== id)
        : [...current, id];
      const next = { ...prev, selectedCategoryIds: ids };
      saveConfig(next);
      return next;
    });
  }, []);

  const selectAllCategories = useCallback((ids: number[]) => {
    setConfig((prev) => {
      const next = { ...prev, selectedCategoryIds: ids };
      saveConfig(next);
      return next;
    });
  }, []);

  const clearCategories = useCallback(() => {
    setConfig((prev) => {
      const next = { ...prev, selectedCategoryIds: [] };
      saveConfig(next);
      return next;
    });
  }, []);

  const selectAllSheets = useCallback((ids: number[]) => {
    update({ ...config, selectedSheetIds: ids });
  }, [config, update]);

  const clearSheets = useCallback(() => {
    update({ ...config, selectedSheetIds: [] });
  }, [config, update]);

  return {
    config,
    toggleSheet,
    toggleCategory,
    initCategories,
    selectAllSheets,
    clearSheets,
    selectAllCategories,
    clearCategories,
  };
}
