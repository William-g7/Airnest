'use client'

interface WishlistButtonProps {
    isFavorited: boolean;
    onToggle: (e: React.MouseEvent) => void;
    isInline?: boolean;
}

const WishlistButton = ({ isFavorited, onToggle, isInline = false }: WishlistButtonProps) => {
    return (
        <button
            onClick={onToggle}
            className={`
                ${isInline
                    ? "p-1.5 hover:scale-105"
                    : "absolute top-3 right-3 z-10 p-2 hover:scale-110"
                } 
                bg-white rounded-full shadow-md transition opacity-90 hover:opacity-100
            `}
        >
            <svg
                viewBox="0 0 24 24"
                fill={isFavorited ? "#FF385C" : "none"}
                stroke="currentColor"
                className={`${isInline ? "w-5 h-5" : "w-6 h-6"}`}
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
            </svg>
        </button>
    );
};

export default WishlistButton;