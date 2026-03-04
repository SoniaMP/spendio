import { Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/sonner';
import { queryClient } from '@/lib/queryClient';
import AppLayout from '@/components/layout/AppLayout';
import ExpensesPage from '@/components/expenses/ExpensesPage';
import CategoriesPage from '@/components/categories/CategoriesPage';

export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" disableTransitionOnChange>
      <QueryClientProvider client={queryClient}>
        <Routes>
          <Route element={<AppLayout />}>
            <Route index element={<Navigate to="/expenses" replace />} />
            <Route path="expenses" element={<ExpensesPage />} />
            <Route path="categories" element={<CategoriesPage />} />
          </Route>
        </Routes>
        <Toaster />
      </QueryClientProvider>
    </ThemeProvider>
  );
}
