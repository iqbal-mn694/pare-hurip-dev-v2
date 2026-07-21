"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

type Profile = { id: string; name: string; email: string; role: string };

const AuthContext = createContext<{ profile: Profile | null; loading: boolean }>({
  profile: null,
  loading: true,
});

export function useAuth() {
  return useContext(AuthContext);
}

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async (userId: string) => {
      const { data } = await supabase
        .from("profiles")
        .select("id, name, email, role")
        .eq("id", userId)
        .single();
      setProfile(data);
    };

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) loadProfile(user.id);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) loadProfile(session.user.id);
      else setProfile(null);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ profile, loading }}>{children}</AuthContext.Provider>
  );
}