'use client'

interface MenuLinkProps {
    label: string;
    onClick: () => void;
}

const MenuLink = ({ label, onClick }: MenuLinkProps) => {
    return (
        <div
            className="px-3 py-1.5 hover:bg-gray-100 hover:text-airbnb block cursor-pointer transition-colors duration-200 relative"
            onClick={onClick}
        >
            <span className="relative z-10">{label}</span>
        </div>
    )
}

export default MenuLink;