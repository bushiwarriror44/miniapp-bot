'use client';

import { useEffect, useState } from 'react';
import { getTelegramWebApp } from '@/shared/api/client';
import { PromoBlock } from './components/PromoBlock';
import { CryptoPrices } from './components/CryptoPrices';
import { HotOffersBlock } from './components/HotOffersBlock';
import { TopUsersBlock } from './components/TopUsersBlock';
import { NewsBlock } from './components/NewsBlock';
import { PublicationsBlock } from './components/PublicationsBlock';
import { SearchField } from './components/SearchField';

export default function Home() {
	const [username, setUsername] = useState<string | null>(null);

	useEffect(() => {
		const telegram = getTelegramWebApp();
		if (!telegram) return;
		if (typeof telegram.ready === 'function') telegram.ready();
		const user = telegram.initDataUnsafe?.user;
		if (user) setUsername(user.first_name || user.username || null);
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
