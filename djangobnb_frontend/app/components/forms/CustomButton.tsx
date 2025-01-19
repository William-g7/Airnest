interface CustomButtonProps {
    label: string;
    className?: string;
    onClick: () => void;
    disabled?: boolean;
}

const CustomButton: React.FC<CustomButtonProps> = ({
    label,
    className,
    onClick,
    disabled
}) => {
    return (
        <div
            onClick={onClick}
            className={`w-full py-4 bg-airbnb hover:bg-airbnb-dark text-white text-center rounded-xl transition cursor-pointer ${className}`}>
            {label}
            {disabled && <div className="absolute inset-0 bg-gray-500 opacity-50"></div>}
        </div>
    )
}

export default CustomButton;