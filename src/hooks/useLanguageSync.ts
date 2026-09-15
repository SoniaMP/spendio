import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { updateLanguage } from '@/api/auth';
import { useAuth } from '@/hooks/useAuth';

/**
 * Mirrors the language picked in the browser onto the signed-in user, so the
 * emails sent from the recurring cron — outside any request — use it too.
 * Failures are ignored on purpose: the UI language already works without this.
 */
export function useLanguageSync(): void {
  const { i18n } = useTranslation();
  const { data: user } = useAuth();
  const language = i18n.resolvedLanguage;

  useEffect(() => {
    if (!user || !language || user.language === language) return;
    void updateLanguage(language).catch(() => {});
  }, [user, language]);
}
