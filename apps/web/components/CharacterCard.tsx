import Link from "next/link";
import { characterNumber, type CardSource } from "@/lib/character";

type CardCharacter = CardSource & {
  slug: string;
  name: string;
  image: string | null;
  portrait?: string | null;
};

// Плашка карты: крупное имя, под ним номер мельче. Та же плашка стоит
// на странице кьяра, поэтому вынесена отдельно
export function DeckPlate({ character }: { character: CardSource & { name: string } }) {
  const number = characterNumber(character);
  return (
    <>
      <span className="kjar-deck-card__name">{character.name}</span>
      {number && <span className="kjar-deck-card__num">{number}</span>}
    </>
  );
}

export default function CharacterCard({ character }: { character: CardCharacter }) {
  // В колоде нужна вертикальная картинка, её нет у старых карт
  const image = character.portrait || character.image;

  return (
    <Link className="kjar-deck-card" href={`/characters/${character.slug}`}>
      <span className="kjar-deck-card__frame">
        {image ? (
          <img src={image} alt={`Портрет ${character.name}`} loading="lazy" />
        ) : (
          <span />
        )}
      </span>

      <span className="kjar-deck-card__plate">
        <DeckPlate character={character} />
      </span>
    </Link>
  );
}
