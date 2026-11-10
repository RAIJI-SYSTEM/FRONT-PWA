import AuthCallback from '@/features/auth/components/AuthCallback';

/** Retorno do login na web (redirect_uri do Keycloak): /auth/callback?code=...&state=... */
export default function AuthCallbackPage() {
  return <AuthCallback />;
}
