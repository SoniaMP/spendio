import { Outlet } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import LanguageDropdown from '@/components/i18n/LanguageDropdown';

/**
 * Shared shell for the screens reachable before signing in. The language
 * dropdown lives here so a new user can switch language without an account.
 */
export default function AuthLayout() {
  return (
    <div className="from-background via-background to-muted/50 relative flex min-h-screen items-center justify-center bg-gradient-to-br px-4">
      <div className="absolute top-4 right-4">
        <LanguageDropdown />
      </div>
      <Card className="w-full max-w-sm shadow-lg">
        <Outlet />
      </Card>
    </div>
  );
}
