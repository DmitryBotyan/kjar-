// Русское согласование с числом: 1 кьяр, 2 кьяра, 5 кьяров, 11 кьяров, 21 кьяр
export function plural(count: number, [one, few, many]: [string, string, string]) {
  const tail = Math.abs(count) % 100;
  if (tail >= 11 && tail <= 14) return many;
  if (tail % 10 === 1) return one;
  if (tail % 10 >= 2 && tail % 10 <= 4) return few;
  return many;
}
