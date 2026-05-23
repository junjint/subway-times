/**
 * Tiny clsx replacement so we don't pull in another dependency just to join
 * class names. Accepts strings, falsy values, and arrays.
 */
type ClassValue = string | number | false | null | undefined | ClassValue[];

export function clsx(...args: ClassValue[]): string {
  const out: string[] = [];
  for (const a of args) {
    if (!a) continue;
    if (Array.isArray(a)) {
      const inner = clsx(...a);
      if (inner) out.push(inner);
    } else if (typeof a === "string" || typeof a === "number") {
      out.push(String(a));
    }
  }
  return out.join(" ");
}
