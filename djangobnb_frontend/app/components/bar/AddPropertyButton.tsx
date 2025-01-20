'use client'

import { useAddPropertyModal } from '../hooks/useAddPropertyModal'
const AddPropertyButton = () => {
    const addPropertyModal = useAddPropertyModal();

    return (
        <div
            onClick={addPropertyModal.onOpen}
            className="p-2 cursor-pointer text-sm font-semibold rounded-full hover:bg-gray-200"
        >
            Djangobnb your home
        </div>
    )
}

export default AddPropertyButton;