import { Fragment, ReactNode } from "react";

/**
 * Renders admin-authored text and turns any web address, email or phone number
 * into a clickable link, so admins can simply type a YouTube channel or Zoom
 * link into their text and donors can click it.
 */
const PATTERN =
  /((?:https?:\/\/|www\.)[^\s<]+[^\s<.,;:!?)"']|[\w.+-]+@[\w-]+\.[\w.]{2,}|(?:\+\d[\d\s-]{7,}\d)|\b(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+(?:com|org|net|io|co|ke|app|dev|ly|me|info|edu|gov|ai)(?:\/[^\s<]*)?)/gi;

export function Linkify({
  text,
  className,
}: {
  text?: string | null;
  className?: string;
}) {
  if (!text) return null;

  const parts = text.split(PATTERN);
  const nodes: ReactNode[] = parts.map((part, index) => {
    if (!part) return null;

    const isEmail = /^[\w.+-]+@[\w-]+\.[\w.]{2,}$/.test(part);
    const isUrl =
      !isEmail &&
      (/^(https?:\/\/|www\.)/i.test(part) ||
        /^(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}(?:\/|$)/i.test(part));
    const isPhone = !isUrl && !isEmail && /^\+\d[\d\s-]{7,}\d$/.test(part);

    if (isUrl || isEmail || isPhone) {
      const href = isUrl
        ? part.startsWith("http")
          ? part
          : `https://${part}`
        : isEmail
          ? `mailto:${part}`
          : `tel:${part.replace(/[\s-]/g, "")}`;

      return (
        <a
          key={index}
          href={href}
          target={isUrl ? "_blank" : undefined}
          rel={isUrl ? "noopener noreferrer" : undefined}
          className="text-primary font-medium underline underline-offset-2 hover:text-primary/80 break-words"
        >
          {part}
        </a>
      );
    }

    return <Fragment key={index}>{part}</Fragment>;
  });

  return <span className={className}>{nodes}</span>;
}
