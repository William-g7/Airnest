import { create } from "zustand";

interface AddPropertyModalState {
    isOpen: boolean;
    onOpen: () => void;
    onClose: () => void;
}

export const useAddPropertyModal = create<AddPropertyModalState>()((set) => ({
    isOpen: false,
    onOpen: () => set({ isOpen: true }),
    onClose: () => set({ isOpen: false }),
}));