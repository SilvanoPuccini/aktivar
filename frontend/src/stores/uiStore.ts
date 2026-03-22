import { create } from 'zustand';

interface UIState {
  activeTab: string;
  searchQuery: string;
  selectedCategory: string | null;
  isSearchOpen: boolean;
  setActiveTab: (tab: string) => void;
  setSearchQuery: (query: string) => void;
  setSelectedCategory: (category: string | null) => void;
  toggleSearch: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  activeTab: 'home',
  searchQuery: '',
  selectedCategory: null,
  isSearchOpen: false,

  setActiveTab: (activeTab) => set({ activeTab }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setSelectedCategory: (selectedCategory) => set({ selectedCategory }),
  toggleSearch: () => set((state) => ({ isSearchOpen: !state.isSearchOpen })),
}));
