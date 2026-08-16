'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { DemoRole, NavigationItem } from '@/lib/navigation';
import { getNavigationForRole, getUtilityNavigationForRole } from '@/lib/navigation';

interface AppNavProps {
  role: DemoRole;
}

function isCurrent(pathname: string, href: string): boolean {
  return href === '/' ? pathname === '/' : pathname.startsWith(href);
}

function NavList({
  items,
  label,
  pathname,
  variant,
}: {
  items: NavigationItem[];
  label: string;
  pathname: string;
  variant: 'primary' | 'utility';
}) {
  if (items.length === 0) return null;

  return (
    <nav aria-label={label} className={variant === 'primary' ? 'primary-nav' : 'utility-nav'}>
      {variant === 'utility' && <span className="nav-group-label">Workspace settings</span>}
      <ul>
        {items.map((item) => (
          <li key={item.href}>
            <Link
              aria-current={isCurrent(pathname, item.href) ? 'page' : undefined}
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
        ))}
      </ul>
    </nav>
  );
}

export function AppNav({ role }: AppNavProps) {
  const pathname = usePathname();

  return (
    <>
      <NavList
        items={getNavigationForRole(role)}
        label="Primary navigation"
        pathname={pathname}
        variant="primary"
      />
      <NavList
        items={getUtilityNavigationForRole(role)}
        label="Workspace settings"
        pathname={pathname}
        variant="utility"
      />
    </>
  );
}
