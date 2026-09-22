import { useState } from "react";

export function CopyButton({
  value,
  label = "Copy",
  className = "copy-button",
}: {
  value: string;
  label?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  }

  return (
    <button className={className} type="button" onClick={copy}>
      {copied ? "COPIED" : label}
    </button>
  );
}
