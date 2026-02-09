import type { AdItem } from "@/shared/api/ads";

export const USER_ACTIVITY = {
  ads: { active: 2, completed: 5, hidden: 1 },
  deals: { total: 3, successful: 2, disputed: 0 },
  profileViews: { week: 24, month: 89 },
};

export const FAVORITE_ADS: AdItem[] = [
  {
    id: "fav-1",
    adType: "post_in_channel",
    channelOrChatLink: "https://t.me/crypto_news",
    imageUrl: null,
    verified: true,
    username: "crypto_seller",
    price: 1500,
    pinned: true,
    underGuarantee: true,
    publishTime: "вечер",
    postDuration: "1 час топа и 24 часа в ленте",
    paymentMethod: "crypto",
    theme: "криптовалюты, трейдинг",
    description: "Крипто-канал, аудитория 15k. Готов к долгосрочному сотрудничеству.",
    publishedAt: "2025-02-01",
  },
  {
    id: "fav-2",
    adType: "post_in_channel",
    channelOrChatLink: "https://t.me/design_channel",
    imageUrl: null,
    verified: true,
    username: "design_ch",
    price: 2200,
    pinned: true,
    underGuarantee: true,
    publishTime: "день",
    postDuration: "2 часа топа, 48 часов в ленте",
    paymentMethod: "crypto",
    theme: "дизайн, креатив",
    description: "Канал про дизайн. Верифицированный продавец. Залив под гарант.",
    publishedAt: "2025-02-02",
  },
];

export const FAQ_ITEMS: { id: string; title: string; text: string }[] = [
  {
    id: "what-is-miniapp",
    title: "Что такое miniapp-bot?",
    text: "Это мини‑приложение в Telegram для размещения объявлений, поиска рекламы, работы и услуг, а также безопасных сделок через гаранта.",
  },
  {
    id: "how-guarant-works",
    title: "Как работает гарант?",
    text: "Средства блокируются до тех пор, пока обе стороны не подтвердят выполнение условий сделки. Сейчас гарант работает в ручном режиме, автогарант в разработке.",
  },
  {
    id: "how-to-contact-support",
    title: "Как связаться с поддержкой?",
    text: "Вы можете написать администратору в Telegram или отправить обращение через форму на этой странице — мы постараемся ответить как можно быстрее.",
  },
];
