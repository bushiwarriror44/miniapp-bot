'use client';

import { useEffect, useLayoutEffect } from 'react';
import { getTelegramWebApp } from '@/shared/api/client';
import { PromoBlock } from './components/PromoBlock';
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

	useLayoutEffect(() => {
		logRender('MOUNT', 'Home component render');
		// eslint-disable-next-line react-hooks/exhaustive-deps
	});

	useEffect(() => {
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

		logEvent(
			'telegram user',
			JSON.stringify({
				id: user.id,
				username: user.username ?? null,
				first_name: user.first_name ?? null,
				last_name: user.last_name ?? null,
			}),
		);

		const payload = {
			telegramId: user.id,
			username: user.username || null,
			firstName: user.first_name || null,
			lastName: user.last_name || null,
			languageCode: user.language_code || null,
			isPremium: Boolean(user.is_premium),
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
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	return (
		<RenderLoggerProvider onLog={appendLog}>
			<main className="px-4 py-6">
				<RenderLogger logs={logs} onClear={clearLogs} title="Home render log" />

				<SearchField />
				<PromoBlock />

				<CryptoPrices />
				<HotOffersBlock />
				<TopUsersBlock />
				<PublicationsBlock />
				<NewsBlock />
			</main>
		</RenderLoggerProvider>
	);
}

