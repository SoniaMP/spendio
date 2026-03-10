import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wallet } from 'lucide-react';
import { useEmailLogin, useRegister } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

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
  const loginMutation = useEmailLogin();
  const registerMutation = useRegister();

  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const isPending = loginMutation.isPending || registerMutation.isPending;
  const error = loginMutation.error ?? registerMutation.error;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isRegister) {
      registerMutation.mutate(
        { email, password, name },
        { onSuccess: () => navigate('/expenses') },
      );
    } else {
      loginMutation.mutate(
        { email, password },
        { onSuccess: () => navigate('/expenses') },
      );
    }
  };

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

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            {isRegister && (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="name">Nombre</Label>
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            )}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? 'Entrando...' : isRegister ? 'Crear cuenta' : 'Iniciar sesion'}
            </Button>
          </form>

          {error && (
            <p className="text-destructive text-center text-sm">{error.message}</p>
          )}

          <button
            type="button"
            className="text-muted-foreground hover:text-foreground text-center text-sm underline-offset-4 hover:underline"
            onClick={() => {
              setIsRegister((v) => !v);
              loginMutation.reset();
              registerMutation.reset();
            }}
          >
            {isRegister ? 'Ya tengo cuenta' : 'Crear cuenta nueva'}
          </button>
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
