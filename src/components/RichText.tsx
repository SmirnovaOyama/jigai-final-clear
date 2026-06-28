import { Fragment, type ReactNode } from 'react';

// Renders the lightweight Pandoc-style markup found in the question banks:
//   X^+^   -> superscript (Na^+^, Ca^2+^)
//   X~2~   -> subscript   (O~2~, HCO~3~)
// Everything else is plain text. No HTML is injected, so this is XSS-safe.

const TOKEN = /(\^[^\^\s]+\^|~[^~\s]+~)/g;

export function RichText({ text }: { text: string }): ReactNode {
  if (!text) return null;

  const parts = text.split(TOKEN);
  return (
    <>
      {parts.map((part, i) => {
        if (!part) return null;
        if (part.length > 2 && part.startsWith('^') && part.endsWith('^')) {
          return <sup key={i}>{part.slice(1, -1)}</sup>;
        }
        if (part.length > 2 && part.startsWith('~') && part.endsWith('~')) {
          return <sub key={i}>{part.slice(1, -1)}</sub>;
        }
        return <Fragment key={i}>{part}</Fragment>;
      })}
    </>
  );
}
