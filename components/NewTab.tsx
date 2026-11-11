// Screen-reader note after a link that opens another website in a new tab: " (opens in a new tab)".
export function NewTabNote({ text }: { text: string }) {
  return <span className="sr-only"> {text}</span>;
}
