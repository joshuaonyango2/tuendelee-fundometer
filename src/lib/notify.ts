import { toast } from "sonner";
import { getStoredLanguage } from "@/contexts/LanguageContext";
import { translateAsync } from "./autoTranslate";

type Kind = "success" | "error" | "info" | "warning";

function show(kind: Kind, message: string, opts?: Parameters<typeof toast.success>[1]) {
  const lang = getStoredLanguage();
  if (lang === "en" || typeof message !== "string") {
    toast[kind](message, opts);
    return;
  }
  void translateAsync(lang, message).then((m) => toast[kind](m, opts));
}

/** Toasts translated into the visitor's chosen language. */
export const notify = {
  success: (m: string, o?: Parameters<typeof toast.success>[1]) => show("success", m, o),
  error: (m: string, o?: Parameters<typeof toast.success>[1]) => show("error", m, o),
  info: (m: string, o?: Parameters<typeof toast.success>[1]) => show("info", m, o),
  warning: (m: string, o?: Parameters<typeof toast.success>[1]) => show("warning", m, o),
};
