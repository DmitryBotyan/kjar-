// Заказчица требует, чтобы теги и значения справочников всегда начинались
// с заглавной. Приводим при сохранении, а не при выводе: так подпись одинакова
// в фильтрах, чипах, выпадающих списках и админке.
export function capitalizeFirst(text: string): string {
  const trimmed = text.trim();
  return trimmed.charAt(0).toLocaleUpperCase("ru") + trimmed.slice(1);
}
