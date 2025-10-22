export function warnError(message: string) {
    if (typeof console !== undefined && typeof console.warn === "function") {
        console.warn(message);
    }
}