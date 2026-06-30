import { Fragment, type ReactNode } from 'react';

import { normalizeMarkup } from '../data/markup';

// Renders lightweight markup found in question banks and knowledge points:
//   **text**   -> bold
//   *text*     -> italic (not inside words)
//   X^+^       -> superscript  (Na^+^, Ca^2+^)
//   X~2~       -> subscript    (O~2~, HCO~3~)
//   ==text==   -> highlight    (fluorescent mark for key terms)
//   - item     -> bullet list (line-start)
//   · item     -> bullet list (line-start)
//   \n         -> line break / paragraph
// Everything else is plain text. No HTML is injected — XSS-safe.

const INLINE_TOKEN =
  /(\*\*[^*]+\*\*|\*[^*\s][^*]*[^*\s]\*|\*[^*\s]\*|==[^=]+==|\^[^\^\s]+\^|~[^~\s]+~)/g;

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const parts = text.split(INLINE_TOKEN);
  const nodes: ReactNode[] = [];
  let i = 0;
  for (const part of parts) {
    if (!part) continue;
    const key = `${keyPrefix}-${i++}`;
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      nodes.push(<strong key={key}>{part.slice(2, -2)}</strong>);
    } else if (
      part.startsWith('*') &&
      part.endsWith('*') &&
      part.length > 2 &&
      !part.startsWith('**')
    ) {
      nodes.push(<em key={key}>{part.slice(1, -1)}</em>);
    } else if (part.startsWith('==') && part.endsWith('==') && part.length > 4) {
      nodes.push(
        <mark key={key} className="hl">
          {part.slice(2, -2)}
        </mark>,
      );
    } else if (part.length > 2 && part.startsWith('^') && part.endsWith('^')) {
      nodes.push(<sup key={key}>{part.slice(1, -1)}</sup>);
    } else if (part.length > 2 && part.startsWith('~') && part.endsWith('~')) {
      nodes.push(<sub key={key}>{part.slice(1, -1)}</sub>);
    } else {
      nodes.push(<Fragment key={key}>{part}</Fragment>);
    }
  }
  return nodes;
}

export function RichText({ text }: { text: string }): ReactNode {
  if (!text) return null;

  const normalized = normalizeMarkup(text);
  const lines = normalized.split('\n');
  const blocks: ReactNode[] = [];
  let listItems: ReactNode[] = [];
  let blockIdx = 0;

  const flushList = () => {
    if (!listItems.length) return;
    blocks.push(
      <ul key={`ul-${blockIdx++}`} className="rt-ul">
        {listItems}
      </ul>,
    );
    listItems = [];
  };

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) {
      flushList();
      continue;
    }
    const bullet = line.match(/^[-·•]\s+(.*)$/);
    if (bullet) {
      listItems.push(
        <li key={`li-${blockIdx}-${listItems.length}`} className="rt-li">
          {renderInline(bullet[1], `li-${blockIdx}-${listItems.length}`)}
        </li>,
      );
    } else {
      flushList();
      blocks.push(
        <p key={`p-${blockIdx++}`} className="rt-p">
          {renderInline(line, `p-${blockIdx}`)}
        </p>,
      );
    }
  }
  flushList();

  if (blocks.length === 1) return blocks[0];
  return <div className="rt-root">{blocks}</div>;
}
