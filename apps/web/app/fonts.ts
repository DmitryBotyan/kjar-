import { Alegreya } from "next/font/google";
import localFont from "next/font/local";

// Шрифты раздаёт сам Next: файлы с хешем в имени, кеш навсегда, предзагрузка
// в <head>. Google-шрифты скачиваются при сборке, браузер в Google не ходит.

export const alegreya = Alegreya({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "700"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-alegreya"
});

// Crimson с кириллицей есть только в авторской сборке (в Google Fonts её нет),
// и только в прямом и курсиве. Строчные у него мельче, чем у соседних
// шрифтов, size-adjust выравнивает кегль. Файлы урезаны до латиницы и кириллицы.
export const crimson = localFont({
  src: [
    { path: "../assets/fonts/crimson-regular.woff2", weight: "400", style: "normal" },
    { path: "../assets/fonts/crimson-italic.woff2", weight: "400", style: "italic" }
  ],
  declarations: [{ prop: "size-adjust", value: "112%" }],
  display: "swap",
  variable: "--font-crimson"
});

// Машинописный шрифт для интерфейса: кнопки, подписи, поля, даты.
// Кавычек «» в нём нет, их подставляет следующий шрифт в --ui.
export const typewriter = localFont({
  src: [
    { path: "../assets/fonts/x-typewriter-regular.woff2", weight: "400", style: "normal" },
    { path: "../assets/fonts/x-typewriter-bold.woff2", weight: "700", style: "normal" }
  ],
  display: "swap",
  variable: "--font-typewriter"
});
