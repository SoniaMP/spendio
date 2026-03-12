import { useState, useCallback } from 'react';

const STORAGE_KEY = 'spendio-summary-config';

interface SummaryConfig {
  selectedSheetIds: number[];
  selectedCategoryIds: number[];
}

function loadConfig(): SummaryConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as SummaryConfig;
  } catch { /* ignore */ }
  return { selectedSheetIds: [], selectedCategoryIds: [] };
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
      const ids = prev.selectedCategoryIds.includes(id)
        ? prev.selectedCategoryIds.filter((c) => c !== id)
        : [...prev.selectedCategoryIds, id];
      const next = { ...prev, selectedCategoryIds: ids };
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

  return { config, toggleSheet, toggleCategory, selectAllSheets, clearSheets };
}
