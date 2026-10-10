import { cookies } from "next/headers";
import { dicts, type Lang } from "@/content/dict";

export function getLang(): Lang {
  const v = cookies().get("lang")?.value;
  return v === "en" ? "en" : "pl";
}

export function getDict() {
  return dicts[getLang()];
}

/** Krótki zapis dwujęzycznego tekstu w podstronach. */
export function tr<T>(l: Lang, v: { pl: T; en: T }): T {
  return v[l];
}
