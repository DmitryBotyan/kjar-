export default function ContactsPage() {
  return (
    <div className="kjar-contacts">
      <section className="kjar-contacts__hero">
        <div className="kjar-contacts__inner">
          <header className="kjar-contacts__header">
            <h1 className="kjar-contacts__title">Связь с редакцией</h1>
            <p className="kjar-contacts__lead">
              Заявки на роли, правки в хроники, вопросы по ивентам и доступам. Пишите
              коротко и по делу, так ответ придёт быстрее.
            </p>
          </header>
        </div>
      </section>

      <section className="kjar-contacts__body">
        <div className="kjar-contacts__inner kjar-contacts__layout">
          <aside className="kjar-contacts__info" aria-label="Контактная информация">
            <div className="kjar-contacts__card">
              <h2 className="kjar-contacts__card-title">Редакция</h2>
              <dl className="kjar-contacts__list">
                <div>
                  <dt>Почта</dt>
                  <dd>редакция@kjar.example</dd>
                </div>
                <div>
                  <dt>Время ответа</dt>
                  <dd>1–3 рабочих дня</dd>
                </div>
                <div>
                  <dt>Формат письма</dt>
                  <dd>Тема, суть, ссылки</dd>
                </div>
              </dl>
            </div>

            <div className="kjar-contacts__card">
              <h2 className="kjar-contacts__card-title">С чем приходят чаще всего</h2>
              <ul className="kjar-contacts__stack">
                <li>Заявка на роль и новая карта в колоде</li>
                <li>Предложения по лору и дополнения к статьям</li>
                <li>Ошибки в хрониках и уточнения по датам</li>
                <li>Организация ивента с мастером</li>
              </ul>
            </div>

            <div className="kjar-contacts__card">
              <h2 className="kjar-contacts__card-title">Техподдержка</h2>
              <p className="kjar-contacts__text">
                Если не работает вход или потерялся доступ, укажите ник, роль и ссылку
                на профиль. Так восстановим быстрее.
              </p>
            </div>
          </aside>

          <section className="kjar-contacts__form" aria-label="Форма обращения">
            <form className="kjar-form-card" method="post">
              <h2 className="kjar-contacts__form-title">Форма обращения</h2>

              <div className="kjar-form-grid">
                <div className="kjar-field">
                  <label className="kjar-label" htmlFor="contact-name">
                    Имя
                  </label>
                  <input
                    className="kjar-input"
                    id="contact-name"
                    name="name"
                    type="text"
                    placeholder="Как к вам обращаться"
                    required
                  />
                </div>

                <div className="kjar-field">
                  <label className="kjar-label" htmlFor="contact-email">
                    Почта
                  </label>
                  <input
                    className="kjar-input"
                    id="contact-email"
                    name="email"
                    type="email"
                    placeholder="name@example.com"
                    required
                  />
                </div>
              </div>

              <div className="kjar-form-grid">
                <div className="kjar-field">
                  <label className="kjar-label" htmlFor="contact-topic">
                    Тема
                  </label>
                  <input
                    className="kjar-input"
                    id="contact-topic"
                    name="topic"
                    type="text"
                    placeholder="Коротко о сути"
                    required
                  />
                </div>

                <div className="kjar-field">
                  <label className="kjar-label" htmlFor="contact-type">
                    Тип обращения
                  </label>
                  <select
                    className="kjar-select"
                    id="contact-type"
                    name="type"
                    defaultValue="question"
                  >
                    <option value="question">Вопрос</option>
                    <option value="role">Заявка на роль</option>
                    <option value="proposal">Предложение по лору</option>
                    <option value="support">Поддержка</option>
                  </select>
                </div>
              </div>

              <div className="kjar-field">
                <label className="kjar-label" htmlFor="contact-message">
                  Сообщение
                </label>
                <textarea
                  className="kjar-textarea"
                  id="contact-message"
                  name="message"
                  rows={7}
                  placeholder="Опишите детали, приложите ссылки или контекст."
                  required
                />
              </div>

              <div className="kjar-form-actions">
                <button className="kjar-button kjar-button--primary" type="submit">
                  Отправить письмо
                </button>
                <button className="kjar-button kjar-button--ghost" type="reset">
                  Очистить
                </button>
              </div>

              <p className="kjar-form-note">
                Ответим на почту в течение 1–3 рабочих дней.
              </p>
            </form>
          </section>
        </div>
      </section>
    </div>
  );
}
