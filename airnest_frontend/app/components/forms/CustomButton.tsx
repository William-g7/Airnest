interface CustomButtonProps {
  label: string;
  className?: string;
  onClick: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
}

const CustomButton: React.FC<CustomButtonProps> = ({
  label,
  className,
  onClick,
  disabled,
  type = 'button',
}) => {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (type === 'submit') {
      return;
    }
    e.preventDefault();
    onClick();
  };

  return (
    <button
      type={type}
      onClick={handleClick}
      disabled={disabled}
      className={`bg-airbnb hover:bg-airbnb-dark text-white text-center rounded-xl transition cursor-pointer py-3 h-12 ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
    >
      {label}
    </button>
  );
};

export default CustomButton;
