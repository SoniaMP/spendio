import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForgotPassword } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CardContent } from '@/components/ui/card';
import AuthHeader from '@/components/auth/AuthHeader';
import { getErrorMessage } from '@/lib/errorMessage';

export default function ForgotPasswordPage() {
  const { t } = useTranslation();
  const mutation = useForgotPassword();
  const [email, setEmail] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({ email });
  };

  return (
    <>
      <AuthHeader
        title={t('auth.forgotPassword.title')}
        description={t('auth.forgotPassword.description')}
      />
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
                <p className="text-destructive text-center text-sm">
                    {getErrorMessage(mutation.error)}
                  </p>
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
    </>
  );
}
