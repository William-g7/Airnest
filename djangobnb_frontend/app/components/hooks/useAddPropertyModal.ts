'use client';

import { create } from 'zustand';
import { PropertyType } from '@/app/constants/propertyType';

interface AddPropertyModalState {
  isOpen: boolean;
  isEditMode: boolean;
  propertyToEdit: PropertyType | null;
  onOpen: () => void;
  onOpenForEdit: (property: PropertyType) => void;
  onClose: () => void;
}

export const useAddPropertyModal = create<AddPropertyModalState>()(set => ({
  isOpen: false,
  isEditMode: false,
  propertyToEdit: null,
  onOpen: () => set({ isOpen: true, isEditMode: false, propertyToEdit: null }),
  onOpenForEdit: property => set({ isOpen: true, isEditMode: true, propertyToEdit: property }),
  onClose: () => set({ isOpen: false }),
}));
