const VK_COMMUNITY = "https://vk.ru/kjarss";
const TELEGRAM = "https://t.me/IoannaSaint";

export default function ContactsPage() {
  return (
    <div className="kjar-contacts">
      <section className="kjar-contacts__hero">
        <div className="kjar-contacts__inner">
          <header className="kjar-contacts__header">
            <h1 className="kjar-contacts__title">Связь с Большим Домом</h1>
            <p className="kjar-contacts__lead">
              Все вопросы задаются в личных сообщениях сообщества или в Telegram.
            </p>
          </header>
        </div>
      </section>

      <section className="kjar-contacts__body">
        <div className="kjar-contacts__inner kjar-contacts__layout kjar-contacts__layout--single">
          <div className="kjar-form-card kjar-contacts__card--wide">
            <p className="kjar-contacts__big">
              Все вопросы задаются в ЛС сообщества или в Telegram.
            </p>
            <p className="kjar-contacts__text">
              Форм и сбора данных на сайте нет. Напишите туда, где вам удобнее.
            </p>

            <div className="kjar-contacts__links">
              <a
                className="kjar-contacts__link-card"
                href={VK_COMMUNITY}
                target="_blank"
                rel="noreferrer"
              >
                <span className="kjar-contacts__link-label">Сообщество ВКонтакте</span>
                <span className="kjar-contacts__link-value">vk.ru/kjarss</span>
              </a>
              <a
                className="kjar-contacts__link-card"
                href={TELEGRAM}
                target="_blank"
                rel="noreferrer"
              >
                <span className="kjar-contacts__link-label">Telegram</span>
                <span className="kjar-contacts__link-value">IoannaSaint</span>
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
