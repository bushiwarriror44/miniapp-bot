'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHouse, faChartLine, faShieldHalved, faUser } from '@fortawesome/free-solid-svg-icons';

const navItems = [
	{ href: '/', label: 'Главная', icon: faHouse },
	{ href: '/exchange', label: 'Биржа', icon: faChartLine },
	{ href: '/autogarant', label: 'Автогарант', icon: faShieldHalved },
	{ href: '/profile', label: 'Профиль', icon: faUser },
] as const;

export function BottomNav() {
	const pathname = usePathname();

	return (
		<nav
			className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around py-2 safe-area-pb"
			style={{
				backgroundColor: 'var(--color-nav-bg)',
				borderTopWidth: '1px',
				borderTopColor: 'var(--color-nav-border-top)',
			}}>
			{navItems.map(({ href, label, icon }) => {
				const active = pathname === href || (href !== '/' && pathname.startsWith(href));
				return (
					<Link
						key={href}
						href={href}
						className="flex flex-col items-center gap-1 px-4 py-1 rounded-lg transition-colors min-w-[64px]"
						style={{
							color: active ? 'var(--color-nav-active)' : 'var(--color-nav-inactive)',
						}}>
						<FontAwesomeIcon icon={icon} className="w-6 h-6" />
						<span className="text-xs font-medium">{label}</span>
					</Link>
				);
			})}
		</nav>
	);
}
