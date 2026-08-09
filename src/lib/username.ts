import { prisma } from "./prisma";

const AR_TO_EN: Record<string, string> = {
  ا: "a", أ: "a", إ: "e", آ: "a", ء: "", ب: "b", ت: "t", ث: "th",
  ج: "g", ح: "h", خ: "kh", د: "d", ذ: "z", ر: "r", ز: "z", س: "s",
  ش: "sh", ص: "s", ض: "d", ط: "t", ظ: "z", ع: "a", غ: "gh", ف: "f",
  ق: "q", ك: "k", ل: "l", م: "m", ن: "n", ه: "h", و: "w", ي: "y",
  ى: "a", ة: "a", ؤ: "o", ئ: "e", " ": "_",
};

export function transliterate(input: string): string {
  return input
    .trim()
    .split("")
    .map((c) => AR_TO_EN[c] ?? c.toLowerCase())
    .join("")
    .replace(/[^a-z0-9_]/g, "")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");
}

export function suggestUsername(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  const first = transliterate(parts[0] ?? "");
  const base = first || "user";
  const suffix = String(Math.floor(10 + Math.random() * 90));
  return `sana_${base}${suffix}`;
}

export async function ensureUniqueUsername(candidate: string): Promise<string> {
  const cleaned = candidate.toLowerCase().replace(/[^a-z0-9_]/g, "");
  const base = cleaned || "user";
  let username = base;
  let n = 1;
  while (await prisma.user.findUnique({ where: { username } })) {
    n += 1;
    username = `${base}${n}`;
    if (n > 999) throw new Error("Could not generate a unique username");
  }
  return username;
}
