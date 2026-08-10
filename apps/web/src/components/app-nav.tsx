'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { DemoRole } from '@/lib/navigation';
import { getNavigationForRole } from '@/lib/navigation';

interface AppNavProps {
  role: DemoRole;
}

export function AppNav({ role }: AppNavProps) {
  const pathname = usePathname();
  const navigation = getNavigationForRole(role);

  return (
    <nav aria-label="Primary navigation" className="primary-nav">
      <ul>
        {navigation.map((item) => {
          const isCurrent = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);

          return (
            <li key={item.href}>
              <Link
                aria-current={isCurrent ? 'page' : undefined}
                className="nav-link"
                href={item.href}
              >
                <span aria-hidden="true" className="nav-index">
                  {item.shortLabel}
                </span>
                <span className="nav-copy">
                  <span>{item.label}</span>
                  <small>{item.description}</small>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
