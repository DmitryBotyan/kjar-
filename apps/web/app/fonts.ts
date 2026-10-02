import { Alegreya, Golos_Text } from "next/font/google";

// Шрифты раздаёт сам Next: файлы с хешем в имени, кеш навсегда, предзагрузка
// в <head>. Google-шрифты скачиваются при сборке, браузер в Google не ходит.

export const alegreya = Alegreya({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "700"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-alegreya"
});

export const golos = Golos_Text({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600"],
  display: "swap",
  variable: "--font-golos"
});
