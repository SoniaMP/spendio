import { Outlet, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useSheets } from '@/hooks/useSheets';
import { useAuth, useLogout } from '@/hooks/useAuth';
import SheetTabs from '@/components/sheets/SheetTabs';

import type { SheetPermission } from '@/types/sheet';

export interface OutletContext {
  activeSheetId: number;
  activeSheetPermission: SheetPermission;
}

export default function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: sheets } = useSheets();
  const { data: user } = useAuth();
  const logoutMutation = useLogout();

  const isExpensesRoute = !location.pathname.startsWith('/categories');
  const currentTab = isExpensesRoute ? 'expenses' : 'categories';

  const sheetParam = Number(searchParams.get('sheet'));
  const firstSheetId = sheets?.[0]?.id ?? 1;
  const isValidSheet = sheets?.some((s) => s.id === sheetParam);
  const activeSheetId = isValidSheet ? sheetParam : firstSheetId;

  function handleTabChange(value: string) {
    navigate(`/${value}`);
  }

  function handleSheetChange(id: number) {
    setSearchParams({ sheet: String(id) });
  }

  function handleLogout() {
    logoutMutation.mutate(undefined, {
      onSuccess: () => navigate('/login'),
    });
  }

  const activeSheet = sheets?.find((s) => s.id === activeSheetId);
  const activeSheetPermission: SheetPermission = activeSheet?.permission ?? 'owner';
  const context: OutletContext = { activeSheetId, activeSheetPermission };

  return (
    <div className="mx-auto min-h-screen max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <header className="mb-6">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-xl font-bold sm:text-2xl">Spendio</h1>
          {user && (
            <div className="flex items-center gap-3">
              {user.picture && (
                <img
                  src={user.picture}
                  alt={user.name}
                  className="h-8 w-8 rounded-full"
                  referrerPolicy="no-referrer"
                />
              )}
              <span className="text-muted-foreground hidden text-sm sm:inline">
                {user.name}
              </span>
              <Button variant="ghost" size="icon" onClick={handleLogout} title="Logout">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
        <Tabs value={currentTab} onValueChange={handleTabChange}>
          <TabsList>
            <TabsTrigger value="expenses">Gastos</TabsTrigger>
            <TabsTrigger value="categories">Categorias</TabsTrigger>
          </TabsList>
        </Tabs>
      </header>
      {isExpensesRoute && (
        <div className="mb-4">
          <SheetTabs
            activeSheetId={activeSheetId}
            onSheetChange={handleSheetChange}
          />
        </div>
      )}
      <main>
        <Outlet context={context} />
      </main>
    </div>
  );
}
