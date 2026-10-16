export function MultiLinePlaceholder({ lines = 50 }: { lines?: number }) {
    return (
        <div>
            {Array.from({ length: lines }).map((_, i) => (
                <p key={i}>
                    line {i + 1}
                </p>
            ))}
        </div>
    );
}