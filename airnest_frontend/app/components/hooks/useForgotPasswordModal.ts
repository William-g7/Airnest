import { create } from 'zustand';

interface ForgotPasswordModalStore {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
}

export const useForgotPasswordModal = create<ForgotPasswordModalStore>((set) => ({
  isOpen: false,
  onOpen: () => set({ isOpen: true }),
  onClose: () => set({ isOpen: false }),
}));