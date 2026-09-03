import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import resources from '@/i18n/resources';

const LANGUAGE_CODES = Object.keys(resources);

function getNativeLanguageName(code: string): string {
  const name = new Intl.DisplayNames([code], { type: 'language' }).of(code) ?? code;
  return name.charAt(0).toUpperCase() + name.slice(1);
}

export default function LanguageSelector() {
  const { t, i18n } = useTranslation();

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <h3 className="text-sm font-medium">{t('settings.language.heading')}</h3>
        <p className="text-muted-foreground text-sm">
          {t('settings.language.description')}
        </p>
      </div>
      <div
        role="radiogroup"
        aria-label={t('settings.language.heading')}
        className="flex flex-wrap gap-2"
      >
        {LANGUAGE_CODES.map((code) => {
          const isActive = code === i18n.resolvedLanguage;

          return (
            <Button
              key={code}
              role="radio"
              aria-checked={isActive}
              size="sm"
              variant={isActive ? 'default' : 'outline'}
              onClick={() => void i18n.changeLanguage(code)}
            >
              {getNativeLanguageName(code)}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
