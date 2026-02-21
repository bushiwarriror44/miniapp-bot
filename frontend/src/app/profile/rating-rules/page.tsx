"use client";

import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronLeft,
  faStar,
  faHandshake,
  faCalendarDays,
  faBullhorn,
  faRectangleList,
  faChartLine,
  faEye,
  faGaugeHigh,
  faSquareCheck,
  faCrown,
  faPenToSquare,
} from "@fortawesome/free-solid-svg-icons";

const RULES: { icon: typeof faStar; action: string; description: string; points: string }[] = [
  {
    icon: faHandshake,
    action: "Успешная сделка",
    description: "За каждую успешно завершённую сделку",
    points: "+2.2",
  },
  {
    icon: faCalendarDays,
    action: "Время в проекте",
    description: "За каждые 30 дней нахождения в проекте",
    points: "до +12 (макс. 12 баллов)",
  },
  {
    icon: faBullhorn,
    action: "Активные объявления",
    description: "Учитываются в блоке активности",
    points: "вклад в активность",
  },
  {
    icon: faRectangleList,
    action: "Завершённые объявления",
    description: "Учитываются с коэффициентом 0.7",
    points: "вклад в активность",
  },
  {
    icon: faChartLine,
    action: "Сделки (всего)",
    description: "Учитываются с коэффициентом 1.2",
    points: "вклад в активность",
  },
  {
    icon: faEye,
    action: "Просмотры профиля",
    description: "Просмотры за месяц, делённые на 30",
    points: "вклад в активность",
  },
  {
    icon: faGaugeHigh,
    action: "Балл активности",
    description: "Сумма вкладов выше, ограничена сверху",
    points: "макс. +20",
  },
  {
    icon: faSquareCheck,
    action: "Верификация",
    description: "Подтверждённый аккаунт",
    points: "+5",
  },
  {
    icon: faCrown,
    action: "Premium",
    description: "Подписка Telegram Premium",
    points: "+1",
  },
  {
    icon: faPenToSquare,
    action: "Ручная корректировка",
    description: "Изменение администратором",
    points: "по решению администрации",
  },
];

export default function ProfileRatingRulesPage() {
  return (
    <main className="px-4 py-6">
      <Link
        href="/profile"
        className="inline-flex items-center gap-2 text-sm font-medium mb-4"
        style={{ color: "var(--color-accent)", textDecoration: "none" }}
      >
        <FontAwesomeIcon icon={faChevronLeft} className="w-4 h-4" />
        Назад в профиль
      </Link>

      <section
        className="rounded-xl p-4"
        style={{ backgroundColor: "var(--color-bg-elevated)", border: "1px solid var(--color-border)" }}
      >
        <h1
          className="font-semibold mb-4 flex items-center gap-2 text-lg"
          style={{ color: "var(--color-text)" }}
        >
          <FontAwesomeIcon icon={faStar} className="w-4 h-4 shrink-0" style={{ color: "var(--color-text)" }} />
          Правила рассчета рейтинга
        </h1>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                <th
                  className="py-2 pr-2 text-xs font-semibold w-8"
                  style={{ color: "var(--color-text-muted)" }}
                  scope="col"
                />
                <th
                  className="py-2 pr-2 text-xs font-semibold"
                  style={{ color: "var(--color-text-muted)" }}
                  scope="col"
                >
                  Действие
                </th>
                <th
                  className="py-2 pr-2 text-xs font-semibold hidden sm:table-cell"
                  style={{ color: "var(--color-text-muted)" }}
                  scope="col"
                >
                  Описание
                </th>
                <th
                  className="py-2 pl-2 text-xs font-semibold whitespace-nowrap"
                  style={{ color: "var(--color-text-muted)" }}
                  scope="col"
                >
                  Баллы
                </th>
              </tr>
            </thead>
            <tbody>
              {RULES.map((row, idx) => (
                <tr
                  key={idx}
                  className="border-b last:border-b-0"
                  style={{ borderColor: "var(--color-border)" }}
                >
                  <td className="py-2.5 pr-2 align-top w-8">
                    <FontAwesomeIcon
                      icon={row.icon}
                      className="w-4 h-4 shrink-0"
                      style={{ color: "var(--color-accent)" }}
                    />
                  </td>
                  <td className="py-2.5 pr-2 text-sm font-medium" style={{ color: "var(--color-text)" }}>
                    {row.action}
                  </td>
                  <td className="py-2.5 pr-2 text-xs hidden sm:table-cell" style={{ color: "var(--color-text-muted)" }}>
                    {row.description}
                  </td>
                  <td className="py-2.5 pl-2 text-xs whitespace-nowrap" style={{ color: "var(--color-text)" }}>
                    {row.points}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs" style={{ color: "var(--color-text-muted)" }}>
          Итоговый рейтинг = авто-рейтинг (сумма баллов по правилам выше, округление до 1 знака) + ручная
          корректировка.
        </p>
      </section>
    </main>
  );
}
