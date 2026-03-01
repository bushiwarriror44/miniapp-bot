'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { getTelegramWebApp } from '@/shared/api/client';
import { PromoBlock } from './components/PromoBlock';
import { BannersBlock } from './components/BannersBlock';
import { CryptoPrices } from './components/CryptoPrices';
import { HotOffersBlock } from './components/HotOffersBlock';
import { TopUsersBlock } from './components/TopUsersBlock';
import { NewsBlock } from './components/NewsBlock';
import { PublicationsBlock } from './components/PublicationsBlock';
import { SearchField } from './components/SearchField';
import { trackTelegramUser } from '@/shared/api/users';
import { RenderLogger } from './components/RenderLogger';
import { useRenderLogger } from './hooks/useRenderLogger';
import { RenderLoggerProvider } from './contexts/RenderLoggerContext';

export default function Home() {
	const { logs, logRender, logEvent, clearLogs, appendLog } = useRenderLogger('Home');
	const hasLoggedMount = useRef(false);
	const [isMounted, setIsMounted] = useState(false);

	useLayoutEffect(() => {
		if (!hasLoggedMount.current) {
			hasLoggedMount.current = true;
			logRender('MOUNT', 'Home component render');
		}
		if (typeof window === 'undefined') return;
		const id = requestAnimationFrame(() => setIsMounted(true));
		return () => cancelAnimationFrame(id);
	}, [logRender]);

	useEffect(() => {
		if (typeof window === 'undefined') return;
		logEvent('useEffect triggered', 'Home mounted');

		const telegram = getTelegramWebApp();
		if (!telegram) {
			logEvent('getTelegramWebApp', 'telegram instance is null or undefined');
			return;
		}

		logEvent('getTelegramWebApp', 'telegram instance acquired');

		try {
			if (typeof telegram.ready === 'function') {
				logEvent('telegram.ready', 'calling telegram.ready()');
				telegram.ready();
			} else {
				logEvent('telegram.ready', 'no ready() function on telegram');
			}
		} catch (err) {
			logEvent(
				'telegram.ready error',
				err instanceof Error ? err.message : String(err),
			);
		}

		const user = telegram.initDataUnsafe?.user;
		if (!user) {
			logEvent('telegram user', 'initDataUnsafe.user is missing');
			return;
		}
		const userId = "id" in user ? (user as { id: number }).id : undefined;
		if (userId == null) {
			logEvent('telegram user', 'user id is missing');
			return;
		}

		logEvent(
			'telegram user',
			JSON.stringify({
				id: userId,
				username: "username" in user ? user.username ?? null : null,
				first_name: "first_name" in user ? user.first_name ?? null : null,
				last_name: "last_name" in user ? user.last_name ?? null : null,
			}),
		);

		const payload = {
			telegramId: userId,
			username: "username" in user ? user.username || null : null,
			firstName: "first_name" in user ? user.first_name || null : null,
			lastName: "last_name" in user ? user.last_name || null : null,
			languageCode: "language_code" in user ? user.language_code || null : null,
			isPremium: "is_premium" in user ? Boolean(user.is_premium) : false,
		};

		logEvent('trackTelegramUser start', JSON.stringify(payload));

		trackTelegramUser(payload)
			.then(() => {
				logEvent('trackTelegramUser success');
			})
			.catch((err) => {
				logEvent(
					'trackTelegramUser error',
					err instanceof Error ? err.message : String(err),
				);
			});
	}, []);

	return (
		<main className="px-4 py-6">
			{isMounted ? (
				<RenderLoggerProvider onLog={appendLog}>
					<RenderLogger logs={logs} onClear={clearLogs} title="Home render log" />

					<SearchField />
					<PromoBlock />

					<BannersBlock />
					<CryptoPrices />
					<HotOffersBlock />
					<TopUsersBlock />
					<PublicationsBlock />
					<NewsBlock />
				</RenderLoggerProvider>
			) : null}
		</main>
	);
}

