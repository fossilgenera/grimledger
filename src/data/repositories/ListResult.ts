export interface SkippedNote {
    path: string;
    reason: string;
}

/** Valid items plus notes that claimed to be this type but failed validation. */
export interface ListResult<T> {
    items: T[];
    skipped: SkippedNote[];
}