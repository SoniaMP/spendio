import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  const currentTab = location.pathname.startsWith('/categories')
    ? 'categories'
    : 'expenses';

  function handleTabChange(value: string) {
    navigate(`/${value}`);
  }

  return (
    <div className="mx-auto min-h-screen max-w-4xl px-4 py-6">
      <header className="mb-6">
        <h1 className="mb-4 text-2xl font-bold">Finanzas Personales</h1>
        <Tabs value={currentTab} onValueChange={handleTabChange}>
          <TabsList>
            <TabsTrigger value="expenses">Gastos</TabsTrigger>
            <TabsTrigger value="categories">Categorias</TabsTrigger>
          </TabsList>
        </Tabs>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  );
}
