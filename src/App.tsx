import { Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/sonner';
import { queryClient } from '@/lib/queryClient';
import AppLayout from '@/components/layout/AppLayout';
import LoginPage from '@/components/auth/LoginPage';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import ExpensesPage from '@/components/expenses/ExpensesPage';
import SummaryPage from '@/components/summary/SummaryPage';

export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" disableTransitionOnChange>
      <QueryClientProvider client={queryClient}>
        <Routes>
          <Route path="login" element={<LoginPage />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route index element={<Navigate to="/expenses" replace />} />
              <Route path="expenses" element={<ExpensesPage />} />
              <Route path="summary" element={<SummaryPage />} />
            </Route>
          </Route>
        </Routes>
        <Toaster />
      </QueryClientProvider>
    </ThemeProvider>
  );
}
