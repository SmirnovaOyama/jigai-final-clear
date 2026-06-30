/** Fix common typos in question-bank markup (e.g. Ca^2\ +^ → Ca^2+^). */
export function normalizeMarkup(text: string): string {
  return text.replace(/\\ +\^/g, '+^');
}
