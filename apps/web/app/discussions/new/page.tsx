import Link from "next/link";
import { getTags } from "@/lib/api";
import { getDictionary } from "@/lib/dictionaries";
import { NewThreadForm } from "./NewThreadForm";

export default async function NewDiscussionPage() {
  // Разделы — из справочника админки, теги — из базы тегов
  const [categories, tagsResponse] = await Promise.all([
    getDictionary("thread_category").catch(() => []),
    getTags().catch(() => ({ data: [] as any[] }))
  ]);

  const knownTags = (((tagsResponse.data as any[]) || []).map((tag) => tag.name) as string[]).sort();

  return (
    <div className="kjar-thread kjar-thread--new">
      <section className="kjar-thread__hero">
        <div className="kjar-thread__inner">
          <Link className="kjar-thread__back" href="/discussions">
            К списку тем
          </Link>
          <h1 className="kjar-thread__title">Новая тема</h1>
          <p className="kjar-thread__lead">
            Опишите суть обсуждения, выберите раздел и добавьте теги. Чем точнее
            формулировка, тем быстрее к столу подойдут нужные участники.
          </p>
        </div>
      </section>

      <section className="kjar-thread__body">
        <div className="kjar-thread__inner kjar-thread__layout">
          <div className="kjar-thread__main">
            <NewThreadForm categories={categories} knownTags={knownTags} />
          </div>

          <aside className="kjar-thread__aside" aria-label="Подсказки для темы">
            <div className="kjar-thread__card">
              <h2 className="kjar-thread__card-title">Рекомендации</h2>
              <ul className="kjar-thread__rules">
                <li>Добавьте 2–4 тега для быстрой навигации.</li>
                <li>Укажите участников, которых ждёте в обсуждении.</li>
                <li>Скрытые детали сюжета отмечайте отдельно.</li>
              </ul>
            </div>

            <div className="kjar-thread__card">
              <h2 className="kjar-thread__card-title">Справка</h2>
              <p className="kjar-thread__note">
                Для архивных тем используйте раздел «Редактура» и указывайте дату
                события в тексте, так запись проще найти в хрониках.
              </p>
              <Link className="kjar-thread__rule-link" href="/lore">
                Подробнее о правилах
              </Link>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}
