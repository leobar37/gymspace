import { useSession } from '@/contexts/SessionContext';

// Re-export sessionKeys for backward compatibility
export { sessionKeys } from '@/contexts/SessionContext';

export interface UseCurrentSessionOptions {
  enabled?: boolean;
  refetchOnMount?: boolean;
  refetchOnWindowFocus?: boolean;
  staleTime?: number;
  gcTime?: number;
}

export function useCurrentSession() {
  // Options are no longer used as they're now handled in SessionContext
  // But we keep the parameter for backward compatibility
  const session = useSession();

  return {
    session: session.session,
    organization: session.organization,
    gym: session.gym,
    user: session.user,
    isLoading: session.isSessionLoading || session.isLoading,
    isError: session.isSessionError,
    error: session.sessionError,
    isAuthenticated: session.isAuthenticated,
    hasSession: !!session.session,
    clearSession: session.clearAuth,
    refreshSession: session.refreshSession,
    refetchSession: session.refetchSession,
    refetch: session.refetchSession,
    subscription: session.subscription,
  };
}
