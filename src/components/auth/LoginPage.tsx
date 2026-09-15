import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useEmailLogin, useRegister } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CardContent, CardFooter } from '@/components/ui/card';
import AuthHeader from '@/components/auth/AuthHeader';
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
  const { t } = useTranslation();
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
    <>
      <AuthHeader title="Spendio" description={t('auth.tagline')} />
      <CardContent className="flex flex-col gap-4">
          <ul className="space-y-2">
            <FeatureItem label={t('auth.features.categories')} />
            <FeatureItem label={t('auth.features.charts')} />
            <FeatureItem label={t('auth.features.export')} />
          </ul>

          <Separator />

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            {isRegister && (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="name">{t('auth.fields.name')}</Label>
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
              <Label htmlFor="email">{t('auth.fields.email')}</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password">{t('auth.fields.password')}</Label>
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
              {isPending
                ? t('auth.signingIn')
                : isRegister
                  ? t('auth.createAccount')
                  : t('auth.signIn')}
            </Button>
            {!isRegister && (
              <Link
                to="/forgot-password"
                className="text-muted-foreground hover:text-foreground text-right text-sm underline-offset-4 hover:underline"
              >
                {t('auth.forgotPasswordLink')}
              </Link>
            )}
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
            {isRegister ? t('auth.haveAccount') : t('auth.createNewAccount')}
          </button>
      </CardContent>

      <CardFooter className="justify-center pb-6">
        <p className="text-muted-foreground text-xs">{t('auth.privacyNote')}</p>
      </CardFooter>
    </>
  );
}
