import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { Wallet } from 'lucide-react';
import { useLogin, useDevLogin } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

const isAuthBypassed = import.meta.env.VITE_AUTH_BYPASS === 'true';

function FeatureItem({ label }: { label: string }) {
  return (
    <li className="flex items-center gap-2 text-sm">
      <span className="bg-primary/10 text-primary flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs">
        ✓
      </span>
      {label}
    </li>
  );
}

export default function LoginPage() {
  const navigate = useNavigate();
  const login = useLogin();
  const devLoginMutation = useDevLogin();

  const handleDevLogin = (devUser: 'dev1' | 'dev2') => {
    devLoginMutation.mutate(devUser, {
      onSuccess: () => navigate('/expenses'),
    });
  };

  const isError = login.isError || devLoginMutation.isError;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-muted/50 px-4">
      <Card className="w-full max-w-sm shadow-lg">
        <CardHeader className="flex flex-col items-center gap-2 pb-2">
          <div className="bg-primary flex h-12 w-12 items-center justify-center rounded-xl">
            <Wallet className="text-primary-foreground h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Spendio</h1>
          <p className="text-muted-foreground text-center text-sm">
            Controla tus gastos, visualiza tu dinero
          </p>
        </CardHeader>

        <CardContent className="flex flex-col gap-4">
          <ul className="space-y-2">
            <FeatureItem label="Organiza gastos por categorias" />
            <FeatureItem label="Graficos y comparativas mensuales" />
            <FeatureItem label="Exporta tus datos a Excel" />
          </ul>

          <Separator />

          <div className="flex justify-center">
            {isAuthBypassed ? (
              <div className="flex w-full gap-2">
                <Button
                  className="flex-1"
                  onClick={() => handleDevLogin('dev1')}
                  disabled={devLoginMutation.isPending}
                >
                  {devLoginMutation.isPending ? 'Entrando...' : 'Dev 1'}
                </Button>
                <Button
                  className="flex-1"
                  variant="secondary"
                  onClick={() => handleDevLogin('dev2')}
                  disabled={devLoginMutation.isPending}
                >
                  {devLoginMutation.isPending ? 'Entrando...' : 'Dev 2'}
                </Button>
              </div>
            ) : (
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
            )}
          </div>

          {isError && (
            <p className="text-destructive text-center text-sm">
              Error al iniciar sesion. Intentalo de nuevo.
            </p>
          )}
        </CardContent>

        <CardFooter className="justify-center pb-6">
          <p className="text-muted-foreground text-xs">
            Tus datos son privados y seguros
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
