import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchCurrentUser, login, register, logout, forgotPassword, resetPassword } from '@/api/auth';

export function useAuth() {
  return useQuery({
    queryKey: ['auth'],
    queryFn: fetchCurrentUser,
    retry: false,
    staleTime: 1000 * 60 * 5,
  });
}

export function useEmailLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      login(email, password),
    onSuccess: (user) => {
      queryClient.setQueryData(['auth'], user);
    },
  });
}

export function useRegister() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ email, password, name }: { email: string; password: string; name: string }) =>
      register(email, password, name),
    onSuccess: (user) => {
      queryClient.setQueryData(['auth'], user);
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: logout,
    onSuccess: () => {
      queryClient.clear();
    },
  });
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: ({ email }: { email: string }) => forgotPassword(email),
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: ({ token, password }: { token: string; password: string }) =>
      resetPassword(token, password),
  });
}
