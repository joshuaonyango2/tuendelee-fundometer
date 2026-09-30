import { useLanguage } from "@/contexts/LanguageContext";

/** Renders free text in the donor's chosen language (automatic translation). */
export function T({ children }: { children?: string | string[] | number | null }) {
  const { tr } = useLanguage();
  const text = Array.isArray(children) ? children.join("") : children == null ? "" : String(children);
  const lead = text.match(/^\s*/)?.[0] ?? "";
  const tail = text.match(/\s*$/)?.[0] ?? "";
  const core = text.trim();
  if (!core) return <>{text}</>;
  return <>{lead}{tr(core)}{tail}</>;
}
