'use client';

import React, { forwardRef } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label?: string;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  variant?: Variant;
  size?: Size;
}

const classesBy: Record<Variant, string> = {
  primary: 'bg-airbnb hover:bg-airbnb-dark text-white',
  secondary: 'bg-gray-900 hover:bg-black text-white',
  ghost: 'bg-transparent hover:bg-gray-100 text-gray-900 border',
};

const sizeBy: Record<Size, string> = {
  sm: 'h-9 px-3 text-sm rounded-lg',
  md: 'h-12 px-4 text-base rounded-xl',
  lg: 'h-14 px-6 text-lg rounded-2xl',
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ label, className = '', loading, leftIcon, rightIcon, variant = 'primary', size = 'md', disabled, children, ...rest }, ref) => {
    const content = label ?? children;

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={[
          'inline-flex items-center justify-center transition whitespace-nowrap',
          classesBy[variant],
          sizeBy[size],
          (disabled || loading) ? 'opacity-50 cursor-not-allowed' : '',
          className,
        ].join(' ')}
        {...rest}
      >
        {loading ? (
          <span className="inline-block w-4 h-4 mr-2 border-2 border-white/50 border-t-white rounded-full animate-spin" />
        ) : leftIcon ? <span className="mr-2">{leftIcon}</span> : null}
        {content}
        {rightIcon ? <span className="ml-2">{rightIcon}</span> : null}
      </button>
    );
  }
);

Button.displayName = 'Button';
export default Button;
