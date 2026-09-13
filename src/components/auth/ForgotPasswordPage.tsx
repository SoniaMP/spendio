import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Wallet } from 'lucide-react';
import { useForgotPassword } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export default function ForgotPasswordPage() {
  const { t } = useTranslation();
  const mutation = useForgotPassword();
  const [email, setEmail] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({ email });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-muted/50 px-4">
      <Card className="w-full max-w-sm shadow-lg">
        <CardHeader className="flex flex-col items-center gap-2 pb-2">
          <div className="bg-primary flex h-12 w-12 items-center justify-center rounded-xl">
            <Wallet className="text-primary-foreground h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">{t('auth.forgotPassword.title')}</h1>
          <p className="text-muted-foreground text-center text-sm">
            {t('auth.forgotPassword.description')}
          </p>
        </CardHeader>

        <CardContent className="flex flex-col gap-4">
          {mutation.isSuccess ? (
            <div className="flex flex-col gap-3 text-center">
              <p className="text-sm">
                {t('auth.forgotPassword.success')}
              </p>
              <Link
                to="/login"
                className="text-primary text-sm font-medium underline-offset-4 hover:underline"
              >
                {t('auth.backToLogin')}
              </Link>
            </div>
          ) : (
            <>
              <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="email">{t('auth.fields.emailAddress')}</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={mutation.isPending}>
                  {mutation.isPending
                    ? t('auth.forgotPassword.submitting')
                    : t('auth.forgotPassword.submit')}
                </Button>
              </form>

              {mutation.error && (
                <p className="text-destructive text-center text-sm">{mutation.error.message}</p>
              )}

              <Link
                to="/login"
                className="text-muted-foreground hover:text-foreground text-center text-sm underline-offset-4 hover:underline"
              >
                {t('auth.backToLogin')}
              </Link>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
