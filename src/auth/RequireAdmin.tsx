import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthProvider';

const RequireAdmin = ({ children }: { children: React.ReactNode }) => {
  const { user, profile, isConfigured, isLoading } = useAuth();
  const location = useLocation();

  if (!isConfigured) return <div className="flex min-h-screen items-center justify-center px-6 text-center"><div className="max-w-lg border border-theme-ink/10 bg-theme-surface p-8"><h1 className="font-display text-3xl">Administration à configurer.</h1><p className="mt-3 text-sm font-light text-theme-ink/60">Ajoutez vos variables Supabase puis créez le premier administrateur pour ouvrir ce panneau.</p></div></div>;
  if (isLoading) return <div className="min-h-screen" />;
  if (!user) return <Navigate to={`/compte?next=${encodeURIComponent(location.pathname)}`} replace />;
  if (profile?.role !== 'admin') return <div className="flex min-h-screen items-center justify-center px-6 text-center"><div className="max-w-lg border border-struktur-orange/30 bg-struktur-orange/5 p-8"><h1 className="font-display text-3xl">Accès non autorisé.</h1><p className="mt-3 text-sm font-light text-theme-ink/60">Ce panneau est réservé aux administrateurs Struktur.</p></div></div>;
  return <>{children}</>;
};

export default RequireAdmin;
