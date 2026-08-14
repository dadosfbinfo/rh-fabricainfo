import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "ADMINISTRADOR" | "EDITOR" | "VISUALIZADOR";

type AuthState = {
  user: User | null;
  session: Session | null;
  role: AppRole | null;
  loading: boolean;
  isAdmin: boolean;
  canEdit: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState>({
  user: null,
  session: null,
  role: null,
  loading: true,
  isAdmin: false,
  canEdit: false,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const uid = session?.user.id;
    if (!uid) {
      setRole(null);
      return;
    }
    let active = true;
    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", uid)
      .then(({ data }) => {
        if (!active) return;
        const roles = (data ?? []).map((r) => r.role as AppRole);
        setRole(
          roles.includes("ADMINISTRADOR")
            ? "ADMINISTRADOR"
            : roles.includes("EDITOR")
              ? "EDITOR"
              : "VISUALIZADOR",
        );
      });
    return () => {
      active = false;
    };
  }, [session?.user.id]);

  const value: AuthState = {
    user: session?.user ?? null,
    session,
    role,
    loading,
    isAdmin: role === "ADMINISTRADOR",
    canEdit: role === "ADMINISTRADOR" || role === "EDITOR",
    signOut: async () => {
      await supabase.auth.signOut();
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
