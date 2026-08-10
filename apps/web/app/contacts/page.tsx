import { ContactForm } from "./ContactForm";

// Адрес редакции задаётся в окружении: в разных установках он разный
const CONTACT_EMAIL = process.env.CONTACT_EMAIL || "hello@kjar.ru";

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
                  <dd>{CONTACT_EMAIL}</dd>
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
            <ContactForm />
          </section>
        </div>
      </section>
    </div>
  );
}
