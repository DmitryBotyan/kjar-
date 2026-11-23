// Карта кьяра читает игровые данные из statsJson: там же лежат пол и номер,
// поэтому служебные ключи отделяются от характеристик один раз и здесь.

const GENDER_KEYS = ["пол", "gender", "sex"];
const NUMBER_KEYS = ["номер", "number", "no", "№"];

// Карточку рисуют и для полного кьяра, и для родни: у родни нет id и рода
export type CardSource = {
  id?: number;
  species?: string | null;
  statsJson: unknown;
};

export type Meter = {
  label: string;
  value: number;
  max: number;
};

export type SpeciesMeter = {
  label: string;
  max: number;
};

/**
 * У Древних своя шкала власти, не десятки. Пределы взяты из статьи:
 * Первородная Власть и Господство до 500, Накопленная Власть до 300.
 */
export const SPECIES_METERS: Record<string, SpeciesMeter[]> = {
  Древние: [
    { label: "Первородная Власть", max: 500 },
    { label: "Господство", max: 500 },
    { label: "Накопленная Власть", max: 300 }
  ]
};

export function speciesMeters(species?: string | null): SpeciesMeter[] {
  return species ? SPECIES_METERS[species] || [] : [];
}

export function statsObject(raw: unknown): Record<string, unknown> | null {
  return raw && typeof raw === "object" && !Array.isArray(raw)
    ? (raw as Record<string, unknown>)
    : null;
}

function stats(character: CardSource): Record<string, unknown> {
  return statsObject(character.statsJson) ?? {};
}

function pick(character: CardSource, keys: string[]): unknown {
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

export function characterGender(character: CardSource): string | null {
  const value = pick(character, GENDER_KEYS);
  return value === undefined || value === null || value === "" ? null : String(value);
}

export function characterNumber(character: CardSource): string | null {
  const value = pick(character, NUMBER_KEYS);
  const source =
    value === undefined || value === null || value === "" ? character.id : value;
  if (source === undefined || source === null || source === "") return null;
  // Номер в листе могли записать уже с решёткой или знаком номера
  return `#${String(source).replace(/^[#№\s]+/, "")}`;
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

// jsonb не хранит порядок ключей, поэтому базовый набор идёт первым и всегда
// в одном и том же виде, а всё остальное по алфавиту. Сам набор задаётся
// справочником character_meter в админке.
function meterRank(label: string, order: string[]): number {
  const index = order.indexOf(label.trim().toLowerCase());
  return index === -1 ? order.length : index;
}

// Числовые характеристики рисуются шкалами, всё остальное парами ключ-значение
export function characterMeters(
  character: CardSource,
  baseMeters?: Array<{ code: string }>,
  species?: string | null
): Meter[] {
  // Родовые шкалы не должны протекать на карты других родов
  const foreignRules = Object.entries(SPECIES_METERS)
    .filter(([code]) => code !== species)
    .flatMap(([, meters]) => meters.map((meter) => meter.label.toLowerCase()));

  const entries = Object.entries(stats(character)).filter(
    ([key, value]) =>
      !isServiceKey(key) &&
      asNumber(value) !== null &&
      !foreignRules.includes(key.trim().toLowerCase())
  );

  // У Древних показываем только три родовые шкалы с их пределами
  const rules = speciesMeters(species);
  if (rules.length > 0) {
    return rules
      .map((rule) => {
        const entry = entries.find(
          ([key]) => key.trim().toLowerCase() === rule.label.toLowerCase()
        );
        if (!entry) return null;
        return {
          label: rule.label,
          value: Math.min(asNumber(entry[1]) as number, rule.max),
          max: rule.max
        };
      })
      .filter((meter): meter is Meter => meter !== null);
  }

  const order = (baseMeters || []).map((meter) => meter.code.trim().toLowerCase());

  // Шкала сайта от 1 до 10. Старые карты хранили 0–100: такие числа
  // переводим в десятки, чтобы полоски не упирались в край.
  const max = 10;
  const toTen = (value: number) =>
    value > max ? Math.max(1, Math.min(max, Math.round(value / 10))) : value;

  return entries
    .map(([key, value]) => ({
      label: humanize(key),
      value: toTen(asNumber(value) as number),
      max
    }))
    .sort((a, b) => {
      const rank = meterRank(a.label, order) - meterRank(b.label, order);
      return rank !== 0 ? rank : a.label.localeCompare(b.label, "ru");
    });
}

export function characterFacts(character: CardSource): Array<[string, string]> {
  return Object.entries(stats(character))
    .filter(([key, value]) => !isServiceKey(key) && asNumber(value) === null)
    .map(([key, value]) => [humanize(key), String(value)]);
}
