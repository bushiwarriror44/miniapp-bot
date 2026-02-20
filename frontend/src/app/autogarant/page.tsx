"use client";

import { useEffect, useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faShieldHalved, faCoins, faChartColumn } from "@fortawesome/free-solid-svg-icons";
import { fetchGuarantConfig, type GuarantConfig } from "@/shared/api/guarant-config";

export default function AutogarantPage() {
  const [config, setConfig] = useState<GuarantConfig | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    fetchGuarantConfig()
      .then((data) => {
        setConfig(data);
        setLoadError(null);
      })
      .catch((error) => {
        console.error("[ui] Failed to load guarantConfig", error);
        setLoadError(error instanceof Error ? error.message : "Ошибка загрузки guarantConfig");
      });
  }, []);

  const tgUsername = (config?.guarantor?.username || "").replace(/^@/, "");
  const tgDisplayName = config?.guarantor?.displayName || "";
  const tgProfileLink = config?.guarantor?.profileLink || "#";
  const tgAvatarUrl = useMemo(
    () => (tgUsername ? `https://t.me/i/userpic/320/${tgUsername}.jpg` : ""),
    [tgUsername],
  );
  const commissionTiers = config?.commissionTiers || [];

  return (
		<main className="px-4 py-6">
			<h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--color-text)' }}>
				Автогарант
			</h1>
			<p className="text-sm mb-6" style={{ color: 'var(--color-text-muted)' }}>
				Защита сделок и гарант исполнения.
			</p>
      {loadError && (
        <p className="text-xs mb-6" style={{ color: "#ef4444" }}>
          Ошибка загрузки: {loadError}
        </p>
      )}

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
					<span className="relative w-12 h-12 shrink-0 rounded-full overflow-hidden bg-[var(--color-surface)]" aria-hidden>
						{tgAvatarUrl ? (
							<img
								src={tgAvatarUrl}
								alt={tgDisplayName ? `Аватар ${tgDisplayName}` : "Аватар гаранта"}
								className="w-full h-full object-cover"
								onError={(e) => {
									const target = e.currentTarget;
									target.onerror = null;
									target.src = "/assets/telegram-ico.svg";
								}}
							/>
						) : (
							<span className="w-full h-full flex items-center justify-center">
								<img src="/assets/telegram-ico.svg" alt="" className="w-6 h-6 opacity-60" />
							</span>
						)}
					</span>
					<div className="min-w-0">
						<p className="font-semibold text-sm" style={{ color: 'var(--color-text)' }}>
							{tgDisplayName || "—"}
						</p>
						<p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
							{tgUsername ? `@${tgUsername}` : "Профиль не загружен"}
						</p>
					</div>
					<span
						className="ml-auto flex items-center justify-center w-8 h-8 rounded-full shrink-0"
						style={{ backgroundColor: 'var(--color-accent)', color: 'white' }}>
						<FontAwesomeIcon icon={faShieldHalved} className="w-4 h-4" />
					</span>
				</a>

				<p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
					{config?.aboutText || "Нет данных конфигурации гаранта."}
				</p>
			</section>

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
        {commissionTiers.length === 0 && (
          <p className="text-sm mt-2" style={{ color: "var(--color-text-muted)" }}>
            Условия не загружены.
          </p>
        )}
			</section>

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
