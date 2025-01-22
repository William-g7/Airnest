interface CustomButtonProps {
    label: string;
    className?: string;
    onClick: () => void;
    disabled?: boolean;
    type?: "button" | "submit" | "reset";
}

const CustomButton: React.FC<CustomButtonProps> = ({
    label,
    className,
    onClick,
    disabled,
    type = "button"
}) => {
    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={`bg-airbnb hover:bg-airbnb-dark text-white text-center rounded-xl transition cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
        >
            {label}
        </button>
    )
}

export default CustomButton;