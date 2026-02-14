'use client';

import { useEffect } from 'react';
import { getTelegramWebApp } from '@/shared/api/client';
import { PromoBlock } from './components/PromoBlock';
import { CryptoPrices } from './components/CryptoPrices';
import { HotOffersBlock } from './components/HotOffersBlock';
import { TopUsersBlock } from './components/TopUsersBlock';
import { NewsBlock } from './components/NewsBlock';
import { PublicationsBlock } from './components/PublicationsBlock';
import { SearchField } from './components/SearchField';
import { trackTelegramUser } from '@/shared/api/users';

export default function Home() {
	useEffect(() => {
		const telegram = getTelegramWebApp();
		if (!telegram) return;
		if (typeof telegram.ready === 'function') telegram.ready();
		const user = telegram.initDataUnsafe?.user;
		if (user) {
			trackTelegramUser({
				telegramId: user.id,
				username: user.username || null,
				firstName: user.first_name || null,
				lastName: user.last_name || null,
				languageCode: user.language_code || null,
				isPremium: Boolean(user.is_premium),
			}).catch(() => undefined);
		}
	}, []);

	return (
		<main className="px-4 py-6">
			<SearchField />
			<PromoBlock />

			<CryptoPrices />
			<HotOffersBlock />
			<TopUsersBlock />
			<PublicationsBlock />
			<NewsBlock />
		</main>
	);
}
