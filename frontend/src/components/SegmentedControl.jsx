
export default function SegmentedControl({
    options,
    value,
    onChange
}) {
    return (
        <div className="bg-border dark:bg-surface-alt p-1 rounded-2xl flex w-full transition-colors">
            {options.map((option) => {
                const isActive = value === option.id;
                const Icon = option.icon;

                return (
                    <button
                        key={option.id}
                        onClick={() => onChange(option.id)}
                        className={`
                            flex-1 flex items-center justify-center gap-2 py-3 rounded-[14px] text-sm font-semibold transition-all duration-200
                            ${isActive
                                ? 'bg-background dark:bg-surface text-text-primary shadow-card'
                                : 'text-text-secondary hover:text-text-primary'}
                        `}
                    >
                        {Icon && (
                            <Icon
                                size={18}
                                strokeWidth={2.5}
                                className={isActive ? 'text-primary' : 'text-text-secondary'}
                            />
                        )}
                        {option.label}
                    </button>
                );
            })}
        </div>
    );
}
