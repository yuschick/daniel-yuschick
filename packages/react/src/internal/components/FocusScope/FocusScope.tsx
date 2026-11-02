import { useReturnFocus } from '@package-internal/hooks';
import type { WithChildren } from '@package-internal/types/type-helpers';

interface FocusScopeProps extends WithChildren {
  enabled: boolean;
}

export function FocusScope({ children, enabled }: FocusScopeProps) {
  useReturnFocus(enabled);

  return <>{children}</>;
}
