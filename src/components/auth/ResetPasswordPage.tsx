import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Wallet } from 'lucide-react';
import { useResetPassword } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export default function ResetPasswordPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const mutation = useResetPassword();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [validationError, setValidationError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    if (password.length < 6) {
      setValidationError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (password !== confirmPassword) {
      setValidationError('Las contraseñas no coinciden');
      return;
    }

    mutation.mutate(
      { token: token!, password },
      { onSuccess: () => setTimeout(() => navigate('/login'), 2000) },
    );
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-muted/50 px-4">
      <Card className="w-full max-w-sm shadow-lg">
        <CardHeader className="flex flex-col items-center gap-2 pb-2">
          <div className="bg-primary flex h-12 w-12 items-center justify-center rounded-xl">
            <Wallet className="text-primary-foreground h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Nueva contraseña</h1>
        </CardHeader>

        <CardContent className="flex flex-col gap-4">
          {mutation.isSuccess ? (
            <div className="flex flex-col gap-3 text-center">
              <p className="text-sm">
                Tu contraseña se restableció correctamente. Redirigiendo al inicio de sesión...
              </p>
              <Link
                to="/login"
                className="text-primary text-sm font-medium underline-offset-4 hover:underline"
              >
                Ir al inicio de sesión
              </Link>
            </div>
          ) : (
            <>
              <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="password">Nueva contraseña</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={mutation.isPending}>
                  {mutation.isPending ? 'Restableciendo...' : 'Restablecer contraseña'}
                </Button>
              </form>

              {(validationError || mutation.error) && (
                <p className="text-destructive text-center text-sm">
                  {validationError || mutation.error?.message}
                </p>
              )}

              <Link
                to="/login"
                className="text-muted-foreground hover:text-foreground text-center text-sm underline-offset-4 hover:underline"
              >
                Volver al inicio de sesión
              </Link>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
