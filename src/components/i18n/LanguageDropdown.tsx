import { Check, Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import resources from '@/i18n/resources';

const LANGUAGE_CODES = Object.keys(resources);

/**
 * Deliberately not flags: a flag names a country, not a language. The trigger
 * shows the language code and the options their own native name.
 */
function getNativeLanguageName(code: string): string {
  const name = new Intl.DisplayNames([code], { type: 'language' }).of(code) ?? code;
  return name.charAt(0).toUpperCase() + name.slice(1);
}

export default function LanguageDropdown() {
  const { t, i18n } = useTranslation();
  const activeCode = i18n.resolvedLanguage ?? LANGUAGE_CODES[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          aria-label={t('language.label')}
          className="gap-1.5"
        >
          <Globe className="h-4 w-4" />
          <span className="text-xs font-medium">{activeCode.toUpperCase()}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {LANGUAGE_CODES.map((code) => (
          <DropdownMenuItem
            key={code}
            onClick={() => void i18n.changeLanguage(code)}
            aria-current={code === activeCode}
          >
            <Check
              className={code === activeCode ? 'opacity-100' : 'opacity-0'}
            />
            {getNativeLanguageName(code)}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
