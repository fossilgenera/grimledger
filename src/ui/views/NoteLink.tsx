interface NoteLinkProps {
    path: string;
    text: string;
    onOpen: (path: string) => void;
}

/** A button that looks like a link and opens the note at `path`. */
export function NoteLink({ path, text, onOpen }: NoteLinkProps) {
    return (
        <button
            type="button"
            className="grimledger-link"
            onClick={() => onOpen(path)}
        >
            {text}
        </button>
    );
}