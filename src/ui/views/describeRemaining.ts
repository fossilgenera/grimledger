/** "No tasks remaining", "1 task remaining", "3 tasks remaining". */
export function describeRemaining(count: number): string {
    if (!Number.isInteger(count) || count < 0) {
        throw new Error(`Task count must be a whole number, zero or more: ${count}`);
    }
    if (count === 0) return "No tasks remaining";
    if (count === 1) return "1 task remaining";
    return `${count} tasks remaining`;
}