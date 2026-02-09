'use client';

import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronRight, faUserTie, faXmark } from '@fortawesome/free-solid-svg-icons';

const STORAGE_KEY = 'miniapp-promo-closed';

export function PromoBlock() {
	const [visible, setVisible] = useState(true);

	useEffect(() => {
		if (typeof window === 'undefined') return;
		if (sessionStorage.getItem(STORAGE_KEY) === '1') setVisible(false);
	}, []);

	const handleClose = () => {
		sessionStorage.setItem(STORAGE_KEY, '1');
		setVisible(false);
	};

	if (!visible) return null;

	return (
		<section className="mb-6 overflow-x-auto overflow-y-hidden scrollbar-none">
			<div className="flex gap-3 min-h-px">
				<article
					className="relative flex w-full min-w-0 items-center gap-4 rounded-xl px-4 py-3 pr-12 shrink-0"
					style={{ backgroundColor: 'var(--color-accent)' }}>
					{/* Крестик — закрыть до следующего запуска */}
					<button
						type="button"
						onClick={handleClose}
						className="absolute top-1.5 right-1.5 w-8 h-8 flex items-center justify-center rounded-full text-white/80 hover:text-white hover:bg-white/15 transition-colors"
						aria-label="Закрыть">
						<FontAwesomeIcon icon={faXmark} className="w-4 h-4" />
					</button>

					{/* Круглая иконка слева */}
					<div
						className="w-12 h-12 shrink-0 rounded-full flex items-center justify-center"
						style={{ backgroundColor: 'rgba(0,0,0,0.35)' }}>
						<FontAwesomeIcon icon={faUserTie} className="w-6 h-6 text-white" />
					</div>

					{/* Текст */}
					<div className="min-w-0 flex-1">
						<p className="font-bold text-white text-sm leading-tight">
							Хочешь разместить свою услугу?
						</p>
						<p className="text-white/90 text-xs mt-0.5 leading-tight">
							Нажми в нашу форму для связи
						</p>
					</div>

					
				</article>
			</div>
		</section>
	);
}
