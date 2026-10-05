const WIKILINK = /^\[\[([^\]]*)\]\]$/;

/**
 * Extracts the target of a wikilink, if the value is a valid wikilink string.
 *  "[[ABC Bank]]" => "ABC Bank"
 *  "[[ABC Bank|Bank]]" => "ABC Bank"
 *  "[[ABC Bank#Section]]" => "ABC Bank"
 * Anything that is not a wikilink, or has an empty target, returns undefined.
 */
export function parseWikilinkTarget(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }
  const match = WIKILINK.exec(value.trim());
  const inner = match?.[1];
  if (inner === undefined) {
    return undefined;
  };
  const target = (inner.split("|")[0] ?? "").split("#")[0]?.trim() ?? "";
  return target.length > 0 ? target : undefined;
}