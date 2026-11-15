import { ContactForm } from "./ContactForm";
import { getDictionary } from "@/lib/dictionaries";

// Адрес редакции задаётся в окружении: в разных установках он разный
const CONTACT_EMAIL = process.env.CONTACT_EMAIL || "kjarss1@mail.ru";

export default async function ContactsPage() {
  const requestTypes = await getDictionary("contact_request_type").catch(() => []);

  return (
    <div className="kjar-contacts">
      <section className="kjar-contacts__hero">
        <div className="kjar-contacts__inner">
          <header className="kjar-contacts__header">
            <h1 className="kjar-contacts__title">Связь с Большим Домом</h1>
            <p className="kjar-contacts__lead">
              Заявки на роли, правки в правила, вопросы по ивентам и доступам. Пишите
              коротко и по делу, так ответ придет быстрее.
            </p>
          </header>
        </div>
      </section>

      <section className="kjar-contacts__body">
        <div className="kjar-contacts__inner kjar-contacts__layout">
          <aside className="kjar-contacts__info" aria-label="Контактная информация">
            <div className="kjar-contacts__card">
              <h2 className="kjar-contacts__card-title">Большой Дом</h2>
              <dl className="kjar-contacts__list">
                <div>
                  <dt>Почта</dt>
                  <dd>
                    <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
                  </dd>
                </div>
                <div>
                  <dt>Время ответа</dt>
                  <dd>1–5 рабочих дней</dd>
                </div>
                <div>
                  <dt>Формат письма</dt>
                  <dd>Тема, изложение, приложения</dd>
                </div>
              </dl>
            </div>

            <div className="kjar-contacts__card">
              <h2 className="kjar-contacts__card-title">С чем приходят чаще всего</h2>
              <ul className="kjar-contacts__stack">
                <li>Заявка на вступление в Большой Дом</li>
                <li>Начисление Рунной Силы и других особенностей</li>
                <li>Пояснение за определенный пункт правил</li>
                <li>Какие особенности есть у кьяров?</li>
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
            <ContactForm requestTypes={requestTypes} />
          </section>
        </div>
      </section>
    </div>
  );
}
