import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { confirmationRedirectUrl } from './authRedirect';

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
  signUp: (email: string, password: string, fullName: string, nextPath?: string) => Promise<{ error: string | null; needsEmailConfirmation: boolean }>;
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
    let version = 0;
    const timers = new Set<number>();
    const updateSession = (nextSession: Session | null) => {
      if (!mounted) return;
      const request = ++version;
      timers.forEach((timer) => window.clearTimeout(timer));
      timers.clear();
      setSession(nextSession);
      setProfile(null);
      setIsLoading(Boolean(nextSession));
      if (!nextSession) return;
      // Fetch the profile after leaving the Auth callback, so its session lock can be released.
      const timer = window.setTimeout(() => {
        timers.delete(timer);
        void loadProfile(nextSession.user).then((nextProfile) => {
          if (!mounted || request !== version) return;
          setProfile(nextProfile);
          setIsLoading(false);
        }).catch(() => {
          if (!mounted || request !== version) return;
          setProfile(null);
          setIsLoading(false);
        });
      }, 0);
      timers.add(timer);
    };

    const initialVersion = version;
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      if (mounted && version === initialVersion) updateSession(currentSession);
    }).catch(() => {
      if (mounted && version === initialVersion) updateSession(null);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, nextSession) => { updateSession(nextSession); });

    return () => {
      mounted = false;
      ++version;
      timers.forEach((timer) => window.clearTimeout(timer));
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
    async signUp(email, password, fullName, nextPath = '/compte') {
      if (!supabase) return { error: 'Supabase n’est pas encore configuré.', needsEmailConfirmation: false };
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
          emailRedirectTo: confirmationRedirectUrl(window.location.origin, nextPath),
        },
      });
      if (error) return { error: error.message, needsEmailConfirmation: false };
      if (data.session) setSession(data.session);
      return { error: null, needsEmailConfirmation: !data.session };
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
