export function LongTextPlaceholder({ repeat = 50 }: { repeat?: number }) {
    return (
        <div>
            {"This is a long text used to test the container's horizontal boundaries and automatic text wrapping mechanism.".repeat(repeat)}
        </div>
    );
}