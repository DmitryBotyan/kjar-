"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { X } from "lucide-react";

type CharacterHeroProps = {
  name: string;
  image: string | null;
  plate: ReactNode;
  children: ReactNode;
};

// Карта в шапке открывает полный референс прямо над характеристиками:
// в карте он обрезан под пропорцию 3:4
export default function CharacterHero({ name, image, plate, children }: CharacterHeroProps) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) panelRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [open]);

  return (
    <>
      <div className="kjar-character__hero-grid">
        <figure className="kjar-character__card">
          <button
            type="button"
            className="kjar-character__reference"
            onClick={() => image && setOpen((value) => !value)}
            aria-expanded={open}
            aria-controls="kjar-reference-full"
            disabled={!image}
          >
            {image ? <img src={image} alt={`Референс ${name}`} loading="eager" /> : <span />}
            {image && (
              <span className="kjar-character__reference-hint">
                {open ? "Свернуть референс" : "Полный референс"}
              </span>
            )}
          </button>
          <figcaption className="kjar-deck-card__plate">{plate}</figcaption>
        </figure>

        <div className="kjar-character__intro">{children}</div>
      </div>

      {open && image && (
        <div className="kjar-reference" id="kjar-reference-full" ref={panelRef}>
          <div className="kjar-reference__head">
            <h2 className="kjar-section__title">Полный референс</h2>
            <button
              type="button"
              className="kjar-reference__close"
              onClick={() => setOpen(false)}
              aria-label="Закрыть референс"
            >
              <X aria-hidden="true" />
            </button>
          </div>
          <a href={image} target="_blank" rel="noreferrer" className="kjar-reference__image">
            <img src={image} alt={`Полный референс ${name}`} />
          </a>
        </div>
      )}
    </>
  );
}
