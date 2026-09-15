import { Wallet } from 'lucide-react';
import { CardHeader } from '@/components/ui/card';

interface AuthHeaderProps {
  title: string;
  description?: string;
}

export default function AuthHeader({ title, description }: AuthHeaderProps) {
  return (
    <CardHeader className="flex flex-col items-center gap-2 pb-2">
      <div className="bg-primary flex h-12 w-12 items-center justify-center rounded-xl">
        <Wallet className="text-primary-foreground h-6 w-6" />
      </div>
      <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
      {description && (
        <p className="text-muted-foreground text-center text-sm">{description}</p>
      )}
    </CardHeader>
  );
}
