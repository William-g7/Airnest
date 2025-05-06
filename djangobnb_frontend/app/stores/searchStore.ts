import { create } from 'zustand';

interface SearchFilters {
    location: string;
    checkIn: string | null;
    checkOut: string | null;
    guests: number;
    category: string;
}

interface SearchStore extends SearchFilters {
    setLocation: (location: string) => void;
    setDates: (checkIn: string | null, checkOut: string | null) => void;
    setGuests: (guests: number) => void;
    setCategory: (category: string) => void;
    resetFilters: () => void;
    setFilters: (filters: Partial<SearchFilters>) => void;
}

export const useSearchStore = create<SearchStore>((set) => ({
    location: '',
    checkIn: null,
    checkOut: null,
    guests: 1,
    category: '',

    setLocation: (location) => set({ location }),
    setDates: (checkIn, checkOut) => set({ checkIn, checkOut }),
    setGuests: (guests) => set({ guests }),
    setCategory: (category) => set({ category }),
    resetFilters: () => set({ location: '', checkIn: null, checkOut: null, guests: 1, category: '' }),
    setFilters: (filters) => set((state) => ({ ...state, ...filters })),
})); 