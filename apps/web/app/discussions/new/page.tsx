import Link from "next/link";

export default function NewDiscussionPage() {
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
            <form className="kjar-form-card" method="post">
              <div className="kjar-field">
                <label className="kjar-label" htmlFor="thread-title">
                  Название темы
                </label>
                <input
                  className="kjar-input"
                  id="thread-title"
                  name="title"
                  type="text"
                  placeholder="Коротко обозначьте вопрос или задачу"
                  required
                />
              </div>

              <div className="kjar-field">
                <label className="kjar-label" htmlFor="thread-category">
                  Раздел
                </label>
                <select
                  className="kjar-select"
                  id="thread-category"
                  name="category"
                  required
                  defaultValue=""
                >
                  <option value="">Выберите раздел</option>
                  <option value="Лор">Лор</option>
                  <option value="Ивенты">Ивенты</option>
                  <option value="Исследования">Исследования</option>
                  <option value="Сообщество">Сообщество</option>
                  <option value="Ритуалы">Ритуалы</option>
                  <option value="Редактура">Редактура</option>
                </select>
              </div>

              <div className="kjar-field">
                <label className="kjar-label" htmlFor="thread-author">
                  Имя или персонаж
                </label>
                <input
                  className="kjar-input"
                  id="thread-author"
                  name="authorName"
                  type="text"
                  placeholder="От чьего лица открываете тему"
                />
              </div>

              <div className="kjar-field">
                <label className="kjar-label" htmlFor="thread-tags">
                  Теги
                </label>
                <input
                  className="kjar-input"
                  id="thread-tags"
                  name="tags"
                  type="text"
                  placeholder="Например: руны, экспедиции, хроники"
                />
              </div>

              <div className="kjar-field">
                <label className="kjar-label" htmlFor="thread-message">
                  Описание
                </label>
                <textarea
                  className="kjar-textarea"
                  id="thread-message"
                  name="message"
                  rows={8}
                  placeholder="Раскройте контекст, приложите ссылки и вопросы."
                  required
                />
              </div>

              <div className="kjar-form-actions">
                <button className="kjar-button kjar-button--primary" type="submit">
                  Создать тему
                </button>
                <button className="kjar-button kjar-button--ghost" type="reset">
                  Очистить
                </button>
              </div>
              <p className="kjar-form-note">
                После отправки тема появится в списке обсуждений и попадёт на модерацию.
              </p>
            </form>
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
