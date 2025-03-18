import { create } from 'zustand';
import { isInSouthIndia } from '../lib/location';

interface ThemeState {
  isDark: boolean;
  setTheme: () => Promise<void>;
}

export const useThemeStore = create<ThemeState>((set) => ({
  isDark: false,
  setTheme: async () => {
    const hour = new Date().getHours();
    const inSouthIndia = await isInSouthIndia();
    
    const isDark = !(
      (hour >= 10 && hour < 12) && 
      inSouthIndia
    );
    
    set({ isDark });
  },
}));