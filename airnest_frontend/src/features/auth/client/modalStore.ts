'use client';
import { create } from 'zustand';

type ModalStore<T = unknown> = {
  isOpen: boolean;
  payload: T | null;
  open: (payload?: T) => void;
  close: () => void;
  toggle: (payload?: T) => void;
};

export function createModalStore<T = unknown>() {
  return create<ModalStore<T>>((set) => ({
    isOpen: false,
    payload: null,
    open: (payload) => set({ isOpen: true, payload: (payload ?? null) as T | null }),
    close: () => set({ isOpen: false, payload: null }),
    toggle: (payload) => set((s) => ({ isOpen: !s.isOpen, payload: s.isOpen ? null : (payload ?? null) })),
  }));
}

export const useLoginModal = createModalStore();
export const useSignupModal = createModalStore<{ plan?: string }>();
export const useForgotPasswordModal = createModalStore<string>();
export const useChangePasswordModal = createModalStore();
