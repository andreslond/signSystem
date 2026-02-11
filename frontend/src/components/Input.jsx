export default function Input({
    label,
    id,
    type = 'text',
    placeholder,
    value,
    onChange,
    error,
    icon: Icon,
    rightIcon: RightIcon,
    onClickRightIcon,
    className = '',
    ...props
}) {
    const inputId = id || (label ? `input-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

    return (
        <div className="w-full">
            {label && (
                <label
                    htmlFor={inputId}
                    className="block text-sm text-text-secondary mb-1.5 ml-1"
                >
                    {label}
                </label>
            )}
            <div className="relative">
                {Icon && (
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
                        <Icon size={20} strokeWidth={1.5} />
                    </div>
                )}
                <input
                    id={inputId}
                    type={type}
                    placeholder={placeholder}
                    value={value}
                    onChange={onChange}
                    className={`
            w-full ${Icon ? 'pl-10' : 'px-3'} ${RightIcon ? 'pr-10' : 'px-3'} py-3 
            bg-surface-alt border rounded-xl
            text-text-primary placeholder:text-text-muted
            focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary
            transition-all duration-200
            ${error ? 'border-primary' : 'border-border dark:border-border-light'}
            ${className}
          `}
                    {...props}
                />
                {RightIcon && (
                    <div
                        data-testid="input-right-icon"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted cursor-pointer hover:text-text-secondary transition-colors"
                        onClick={onClickRightIcon}
                    >
                        <RightIcon size={20} strokeWidth={1.5} />
                    </div>
                )}
            </div>
            {error && (
                <p className="mt-1 text-sm text-primary ml-1">{error}</p>
            )}
        </div>
    );
}
