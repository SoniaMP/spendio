import { useState, useCallback, useMemo } from 'react';
import {
  DatePreset,
  getDateRangeForPreset,
  type DateRange,
} from '@/helpers/dateHelpers';

const STORAGE_KEY = 'spendio-summary-config';

interface SummaryConfig {
  selectedSheetIds: number[];
  selectedCategoryIds: number[] | null;
  datePreset: DatePreset;
  customFrom: string | null;
  customTo: string | null;
}

function loadConfig(): SummaryConfig {
  const defaults: SummaryConfig = {
    selectedSheetIds: [],
    selectedCategoryIds: null,
    datePreset: DatePreset.ThisMonth,
    customFrom: null,
    customTo: null,
  };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...defaults, ...(JSON.parse(raw) as Partial<SummaryConfig>) };
  } catch { /* ignore */ }
  return defaults;
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

  const setDatePreset = useCallback((preset: DatePreset) => {
    setConfig((prev) => {
      const next = { ...prev, datePreset: preset };
      saveConfig(next);
      return next;
    });
  }, []);

  const setCustomRange = useCallback((from: string, to: string) => {
    setConfig((prev) => {
      const next = {
        ...prev,
        datePreset: DatePreset.Custom,
        customFrom: from,
        customTo: to,
      };
      saveConfig(next);
      return next;
    });
  }, []);

  const dateRange = useMemo<DateRange>(() => {
    if (config.datePreset === DatePreset.Custom && config.customFrom && config.customTo) {
      return { from: config.customFrom, to: config.customTo };
    }
    return getDateRangeForPreset(config.datePreset);
  }, [config.datePreset, config.customFrom, config.customTo]);

  return {
    config,
    dateRange,
    toggleSheet,
    toggleCategory,
    initCategories,
    selectAllSheets,
    clearSheets,
    selectAllCategories,
    clearCategories,
    setDatePreset,
    setCustomRange,
  };
}
