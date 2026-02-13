'use client';

import { create } from 'zustand';
import type { EditableProperty } from '@addProperty/types';

interface AddPropertyModalState {
  isOpen: boolean;
  isEditMode: boolean;
  propertyToEdit: EditableProperty | null;
  onOpen: () => void;
  onOpenForEdit: (property: EditableProperty) => void;
  onClose: () => void;
  reset: () => void;
}

export const useAddPropertyModal = create<AddPropertyModalState>()((set) => ({
  isOpen: false,
  isEditMode: false,
  propertyToEdit: null,

  onOpen: () =>
    set({
      isOpen: true,
      isEditMode: false,
      propertyToEdit: null,
    }),

  onOpenForEdit: (property) =>
    set({
      isOpen: true,
      isEditMode: true,
      propertyToEdit: property,
    }),

  onClose: () =>
    set({
      isOpen: false,
      isEditMode: false,
      propertyToEdit: null,
    }),

  reset: () =>
    set({
      isOpen: false,
      isEditMode: false,
      propertyToEdit: null,
    }),
}));
