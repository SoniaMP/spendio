import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import type { SheetPermission } from '@/types/sheet';

const VARIANT: Record<SheetPermission, 'default' | 'secondary' | 'outline'> = {
  owner: 'default',
  edit: 'secondary',
  read: 'outline',
};

interface SharePermissionBadgeProps {
  permission: SheetPermission;
}

export default function SharePermissionBadge({ permission }: SharePermissionBadgeProps) {
  const { t } = useTranslation();

  return (
    <Badge variant={VARIANT[permission]}>{t(`sheets.permission.${permission}`)}</Badge>
  );
}
