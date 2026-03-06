import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { useLogin } from '@/hooks/useAuth';

export default function LoginPage() {
  const navigate = useNavigate();
  const login = useLogin();

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-6">
        <h1 className="text-3xl font-bold">Spendio</h1>
        <p className="text-muted-foreground text-sm">Sign in to manage your expenses</p>
        <GoogleLogin
          onSuccess={(response) => {
            if (response.credential) {
              login.mutate(response.credential, {
                onSuccess: () => navigate('/expenses'),
              });
            }
          }}
          onError={() => {
            console.error('Google login failed');
          }}
        />
        {login.isError && (
          <p className="text-destructive text-sm">
            Login failed. Please try again.
          </p>
        )}
      </div>
    </div>
  );
}
