import { Outlet, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSheets } from '@/hooks/useSheets';
import SheetTabs from '@/components/sheets/SheetTabs';

export interface OutletContext {
  activeSheetId: number;
}

export default function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: sheets } = useSheets();

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

  const context: OutletContext = { activeSheetId };

  return (
    <div className="mx-auto min-h-screen max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <header className="mb-6">
        <h1 className="mb-4 text-xl font-bold sm:text-2xl">Spendio</h1>
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
