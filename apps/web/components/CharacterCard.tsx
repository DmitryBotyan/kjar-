import Link from "next/link";
import { characterGender, characterNumber } from "@/lib/character";

type CharacterCardProps = {
  character: any;
};

export default function CharacterCard({ character }: CharacterCardProps) {
  const gender = characterGender(character);
  const number = characterNumber(character);

  return (
    <Link
      className="kjar-deck-card"
      href={`/characters/${character.slug || character.id}`}
    >
      <span className="kjar-deck-card__frame">
        {character.image ? (
          <img src={character.image} alt={`Портрет ${character.name}`} loading="lazy" />
        ) : (
          <span />
        )}
      </span>

      {/* Плашка всегда в одну строку: длинное имя или род обрезается многоточием */}
      <span className="kjar-deck-card__plate">
        <span className="kjar-deck-card__cell">{character.name}</span>
        {gender && (
          <>
            <span className="kjar-deck-card__sep" aria-hidden="true">
              |
            </span>
            <span className="kjar-deck-card__cell">{gender}</span>
          </>
        )}
        {number && (
          <>
            <span className="kjar-deck-card__sep" aria-hidden="true">
              |
            </span>
            <span className="kjar-deck-card__num">{number}</span>
          </>
        )}
      </span>
    </Link>
  );
}
