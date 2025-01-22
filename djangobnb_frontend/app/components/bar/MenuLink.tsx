'use client'

interface MenuLinkProps {
    label: string;
    onClick: () => void;
}

const MenuLink: React.FC<MenuLinkProps> = ({ label, onClick }) => {
    return (
        <div
            className="px-4 py-2 hover:bg-gray-100 block cursor-pointer"
            onClick={onClick}
        >
            {label}
        </div>
    )
}

export default MenuLink;