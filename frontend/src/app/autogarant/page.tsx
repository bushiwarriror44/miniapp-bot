"use client";

import { useEffect, useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faShieldHalved, faCoins, faChartColumn } from "@fortawesome/free-solid-svg-icons";
import { fetchGuarantConfig, type GuarantConfig } from "@/shared/api/guarant-config";

const DEFAULT_CONFIG: GuarantConfig = {
  guarantor: {
    username: "autogarant_example",
    displayName: "Гарант miniapp-bot",
    profileLink: "https://t.me/autogarant_example",
  },
  commissionTiers: [
    "До 100 000 ₽ — 5% от суммы сделки",
    "От 100 000 ₽ до 500 000 ₽ — 4% от суммы сделки",
    "Свыше 500 000 ₽ — 3% от суммы сделки (обсуждается индивидуально)",
  ],
  aboutText: "Автогарант сейчас находится в разработке, сейчас гарант доступен в ручном режиме.",
};

export default function AutogarantPage() {
  const [config, setConfig] = useState<GuarantConfig>(DEFAULT_CONFIG);

  useEffect(() => {
    fetchGuarantConfig().then(setConfig).catch(() => undefined);
  }, []);

  const tgUsername = config.guarantor?.username || DEFAULT_CONFIG.guarantor.username;
  const tgDisplayName = config.guarantor?.displayName || DEFAULT_CONFIG.guarantor.displayName;
  const tgProfileLink = config.guarantor?.profileLink || `https://t.me/${tgUsername}`;
  const tgAvatarUrl = useMemo(
    () => `https://t.me/i/userpic/320/${tgUsername}.jpg`,
    [tgUsername],
  );
  const commissionTiers = config.commissionTiers?.length
    ? config.commissionTiers
    : DEFAULT_CONFIG.commissionTiers;

  return (
		<main className="px-4 py-6">
			<h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--color-text)' }}>
				Автогарант
			</h1>
			<p className="text-sm mb-6" style={{ color: 'var(--color-text-muted)' }}>
				Защита сделок и гарант исполнения.
			</p>

			{/* Блок профиля гаранта */}
			<section
				className="rounded-xl p-4 mb-4"
				style={{
					backgroundColor: 'var(--color-bg-elevated)',
					border: '1px solid var(--color-border)',
				}}>
				<a
					href={tgProfileLink}
					target="_blank"
					rel="noopener noreferrer"
					className="flex items-center gap-3 mb-3 no-underline">
					<span className="relative w-12 h-12 shrink-0 rounded-full overflow-hidden">
						<img
							src={tgAvatarUrl}
							alt={tgDisplayName}
							className="w-full h-full object-cover"
							onError={(e) => {
								const target = e.currentTarget;
								// Fallback на локальную иконку Telegram, если аватар недоступен
								target.onerror = null;
								target.src = '/assets/telegram-ico.svg';
							}}
						/>
					</span>
					<div className="min-w-0">
						<p className="font-semibold text-sm" style={{ color: 'var(--color-text)' }}>
							{tgDisplayName}
						</p>
						<p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
							@{tgUsername}
						</p>
					</div>
					<span
						className="ml-auto flex items-center justify-center w-8 h-8 rounded-full shrink-0"
						style={{ backgroundColor: 'var(--color-accent)', color: 'white' }}>
						<FontAwesomeIcon icon={faShieldHalved} className="w-4 h-4" />
					</span>
				</a>

				<p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
					{config.aboutText || DEFAULT_CONFIG.aboutText}
				</p>
			</section>

			{/* Блок с текущей ставкой комиссии */}
			<section
				className="rounded-xl p-4 mb-4"
				style={{
					backgroundColor: 'var(--color-bg-elevated)',
					border: '1px solid var(--color-border)',
				}}>
				<h2
					className="font-semibold mb-2 flex items-center gap-2"
					style={{ color: 'var(--color-text)' }}>
					<FontAwesomeIcon
						icon={faCoins}
						className="w-4 h-4 shrink-0"
						style={{ color: 'var(--color-accent)' }}
					/>
					Текущая ставка комиссии по сделкам
				</h2>
				<ul className="space-y-2 text-sm">
					{commissionTiers.map((item, index) => (
						<li
							key={item}
							className="flex items-start gap-3 rounded-lg py-2.5 px-3"
							style={{
								backgroundColor: 'var(--color-surface)',
								borderLeft: '3px solid var(--color-accent)',
							}}>
							<span
								className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 mt-0.5"
								style={{ backgroundColor: 'var(--color-accent)', color: 'white' }}>
								{index + 1}
							</span>
							<span style={{ color: 'var(--color-text-muted)' }}>
								{item.replace(/^\d\)\s*/, '')}
							</span>
						</li>
					))}
				</ul>
			</section>

			{/* Наша статистика */}
			<section
				className="rounded-xl p-4"
				style={{
					backgroundColor: 'var(--color-bg-elevated)',
					border: '1px solid var(--color-border)',
				}}>
				<h2
					className="font-semibold mb-4 flex items-center gap-2"
					style={{ color: 'var(--color-text)' }}>
					<FontAwesomeIcon
						icon={faChartColumn}
						className="w-4 h-4 shrink-0"
						style={{ color: 'var(--color-accent)' }}
					/>
					Наша статистика
				</h2>
				<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
					<div className="flex flex-col">
						<span className="text-xl font-bold mb-1" style={{ color: 'var(--color-accent)' }}>
							2023
						</span>
						<span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
							гарантируем сделки уже на протяжении длительного времени
						</span>
					</div>
					<div className="flex flex-col">
						<span className="text-xl font-bold mb-1" style={{ color: 'var(--color-accent)' }}>
							50+ сделок
						</span>
						<span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
							количество сделок, которое было проведено через гаранта
						</span>
					</div>
					<div className="flex flex-col">
						<span className="text-xl font-bold mb-1" style={{ color: 'var(--color-accent)' }}>
							10 000 USD
						</span>
						<span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
							максимальная сумма сделки, которая проходила через нашу площадку
						</span>
					</div>
				</div>
			</section>
		</main>
	);
}
