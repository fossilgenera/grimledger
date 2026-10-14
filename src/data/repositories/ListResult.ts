export interface SkippedNote {
    path: string;
    reason: string;
}

/** Valid items plus notes that claimed to be this type but failed validation. */
export interface ListResult<T> {
    items: T[];
    skipped: SkippedNote[];
}

/**
 * New arrays with the same contents. The index snapshot is shared, so callers get copies and cannot
 * change what other readers see. Shallow: the objects inside are still shared and must be treated
 * as read-only.
 */
export function copyListResult<T>(list: ListResult<T>): ListResult<T> {
    return { items: [...list.items], skipped: [...list.skipped] };
}