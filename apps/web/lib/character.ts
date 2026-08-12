// Карта персонажа читает игровые данные из statsJson: там же лежат пол и номер,
// поэтому служебные ключи отделяются от характеристик один раз и здесь.

const GENDER_KEYS = ["пол", "gender", "sex"];
const NUMBER_KEYS = ["номер", "number", "no", "№"];

export type Meter = {
  label: string;
  value: number;
  max: number;
};

function stats(character: any): Record<string, unknown> {
  const raw = character?.statsJson;
  return raw && typeof raw === "object" && !Array.isArray(raw)
    ? (raw as Record<string, unknown>)
    : {};
}

function pick(character: any, keys: string[]): unknown {
  const source = stats(character);
  for (const [key, value] of Object.entries(source)) {
    if (keys.includes(key.trim().toLowerCase())) return value;
  }
  return undefined;
}

// Ключи приходят из базы как есть: «знание_рун» читается человеком плохо
export function humanize(key: string): string {
  const clean = key.replace(/[_-]+/g, " ").trim();
  return clean.charAt(0).toUpperCase() + clean.slice(1);
}

export function characterGender(character: any): string | null {
  const value = pick(character, GENDER_KEYS);
  if (value === undefined || value === null || value === "") {
    return character?.species || null;
  }
  return String(value);
}

export function characterNumber(character: any): string | null {
  const value = pick(character, NUMBER_KEYS);
  const source =
    value === undefined || value === null || value === "" ? character?.id : value;
  return source === undefined || source === null ? null : `№ ${source}`;
}

function isServiceKey(key: string): boolean {
  const low = key.trim().toLowerCase();
  return GENDER_KEYS.includes(low) || NUMBER_KEYS.includes(low);
}

function asNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "" && !Number.isNaN(Number(value))) {
    return Number(value);
  }
  return null;
}

// Числовые характеристики рисуются шкалами, всё остальное — парами ключ-значение
export function characterMeters(character: any): Meter[] {
  const entries = Object.entries(stats(character)).filter(
    ([key, value]) => !isServiceKey(key) && asNumber(value) !== null
  );

  const values = entries.map(([, value]) => asNumber(value) as number);
  const max = Math.max(100, ...values, 1);

  return entries.map(([key, value]) => ({
    label: humanize(key),
    value: asNumber(value) as number,
    max
  }));
}

export function characterFacts(character: any): Array<[string, string]> {
  return Object.entries(stats(character))
    .filter(([key, value]) => !isServiceKey(key) && asNumber(value) === null)
    .map(([key, value]) => [humanize(key), String(value)]);
}
