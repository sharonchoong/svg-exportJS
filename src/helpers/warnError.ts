/**
 * If console.warn is available, shows the warning message on the console
 * @param message 
 */
export function warnError(message: string) {
    if (typeof console !== undefined && typeof console.warn === "function") {
        console.warn(message);
    }
}
