import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

export type UserRole = 'customer' | 'admin';

interface Profile {
  fullName: string | null;
  role: UserRole;
}

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isLoading: boolean;
  isConfigured: boolean;
  signIn: (email: string, password: string) => Promise<string | null>;
  signUp: (email: string, password: string, fullName: string) => Promise<string | null>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

async function loadProfile(user: User | null) {
  if (!supabase || !user) return null;
  const { data } = await supabase.from('profiles').select('full_name, role').eq('id', user.id).maybeSingle();
  if (!data) return { fullName: user.user_metadata.full_name ?? null, role: 'customer' as const };
  return { fullName: data.full_name as string | null, role: data.role as UserRole };
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(isSupabaseConfigured);

  useEffect(() => {
    if (!supabase) return undefined;
    let mounted = true;

    supabase.auth.getSession().then(async ({ data: { session: currentSession } }) => {
      if (!mounted) return;
      setSession(currentSession);
      setProfile(await loadProfile(currentSession?.user ?? null));
      if (mounted) setIsLoading(false);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      void loadProfile(nextSession?.user ?? null).then((nextProfile) => {
        if (mounted) setProfile(nextProfile);
      });
    });

    return () => {
      mounted = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user: session?.user ?? null,
    session,
    profile,
    isLoading,
    isConfigured: isSupabaseConfigured,
    async signIn(email, password) {
      if (!supabase) return 'Supabase n’est pas encore configuré.';
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return error?.message ?? null;
    },
    async signUp(email, password, fullName) {
      if (!supabase) return 'Supabase n’est pas encore configuré.';
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      });
      return error?.message ?? null;
    },
    async signOut() {
      if (supabase) await supabase.auth.signOut();
    },
  }), [isLoading, profile, session]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// oxlint-disable-next-line react/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider.');
  return context;
};
