import { Badge } from '@/components/ui/badge';
import type { SheetPermission } from '@/types/sheet';

const VARIANT: Record<SheetPermission, 'default' | 'secondary' | 'outline'> = {
  owner: 'default',
  edit: 'secondary',
  read: 'outline',
};

const LABEL: Record<SheetPermission, string> = {
  owner: 'Propietario',
  edit: 'Editar',
  read: 'Solo lectura',
};

interface SharePermissionBadgeProps {
  permission: SheetPermission;
}

export default function SharePermissionBadge({ permission }: SharePermissionBadgeProps) {
  return <Badge variant={VARIANT[permission]}>{LABEL[permission]}</Badge>;
}
