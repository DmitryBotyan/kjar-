import localFont from "next/font/local";
import { Alegreya, Golos_Text } from "next/font/google";

// Шрифты раздаёт сам Next: файлы с хешем в имени, кеш навсегда, предзагрузка
// в <head>. Google-шрифты скачиваются при сборке, браузер в Google не ходит.

// Рунический гротеск. Без него заголовки и меню выглядят совсем иначе,
// поэтому текст ждёт шрифт, а не показывается запасным и потом не прыгает
export const norse = localFont({
  src: [
    { path: "./fonts/Norse-Regular.woff2", weight: "400", style: "normal" },
    { path: "./fonts/Norse-Bold.woff2", weight: "700", style: "normal" }
  ],
  display: "block",
  variable: "--font-norse"
});

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
