import { create } from 'zustand';
import { supabase } from '../lib/supabase';

interface AuthState {
  user: any | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  sendOTP: (contact: string, isSouthIndia: boolean) => Promise<void>;
  verifyOTP: (otp: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => {
  const fetchUser = async () => {
    const { data, error } = await supabase.auth.getUser();
    console.log("Authenticated user:", data?.user); // 🔥 Debugging

    if (error) {
      console.error("Error fetching user:", error);
      set({ user: null, isLoading: false });
    } else {
      set({ user: data?.user || null, isLoading: false });
    }
  };

  fetchUser(); // Fetch user when store initializes

  return {
    user: null,
    isLoading: true,
    signIn: async (email, password) => {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      console.log("User signed in:", data?.user); // 🔥 Debugging
      if (data?.user) set({ user: data.user });
    },
    signUp: async (email, password) => {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      console.log("User signed up:", data?.user); // 🔥 Debugging
      if (data?.user) set({ user: data.user });
    },
    signOut: async () => {
      await supabase.auth.signOut();
      set({ user: null });
      console.log("User signed out"); // 🔥 Debugging
    },
  };
});


