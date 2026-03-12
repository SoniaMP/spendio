import { useState } from 'react';
import { Outlet, NavLink, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { LogOut, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useSheets } from '@/hooks/useSheets';
import { useAuth, useLogout } from '@/hooks/useAuth';
import SheetTabs from '@/components/sheets/SheetTabs';
import CategoriesPage from '@/components/categories/CategoriesPage';

import type { SheetPermission } from '@/types/sheet';

export interface OutletContext {
  activeSheetId: number;
  activeSheetPermission: SheetPermission;
}

export default function AppLayout() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: sheets } = useSheets();
  const { data: user } = useAuth();
  const logoutMutation = useLogout();
  const location = useLocation();
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);
  const isExpensesRoute = location.pathname.startsWith('/expenses');

  const sheetParam = Number(searchParams.get('sheet'));
  const firstSheetId = sheets?.[0]?.id ?? 1;
  const isValidSheet = sheets?.some((s) => s.id === sheetParam);
  const activeSheetId = isValidSheet ? sheetParam : firstSheetId;

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
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsCategoriesOpen(true)}
                title="Categorías"
              >
                <Settings className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={handleLogout} title="Logout">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </header>
      <nav className="mb-4 flex gap-4 border-b">
        <NavLink
          to="/expenses"
          className={({ isActive }) =>
            `pb-2 text-sm font-medium transition-colors ${isActive ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground hover:text-foreground'}`
          }
        >
          Gastos
        </NavLink>
        <NavLink
          to="/summary"
          className={({ isActive }) =>
            `pb-2 text-sm font-medium transition-colors ${isActive ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground hover:text-foreground'}`
          }
        >
          Resumen
        </NavLink>
      </nav>
      {isExpensesRoute && (
        <div className="mb-4">
          <SheetTabs
            activeSheetId={activeSheetId}
            onSheetChange={handleSheetChange}
          />
        </div>
      )}
      <main className="min-w-0">
        <Outlet context={context} />
      </main>

      <Dialog open={isCategoriesOpen} onOpenChange={setIsCategoriesOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Categorías</DialogTitle>
          </DialogHeader>
          <CategoriesPage />
        </DialogContent>
      </Dialog>
    </div>
  );
}
