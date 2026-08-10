export type DemoRole = 'MANAGER' | 'CONTRIBUTOR' | 'EXECUTIVE_VIEWER';

export interface NavigationItem {
  href: string;
  label: string;
  shortLabel: string;
  description: string;
}

const primaryNavigation: Array<NavigationItem & { roles?: DemoRole[] }> = [
  {
    href: '/',
    label: 'Overview',
    shortLabel: '01',
    description: 'Executive health and current priorities',
  },
  {
    href: '/weekly-review',
    label: 'Weekly Review',
    shortLabel: '02',
    description: 'Observations, evidence, and recommendations',
  },
  {
    href: '/actions',
    label: 'Actions',
    shortLabel: '03',
    description: 'Human-owned follow-through',
  },
  {
    href: '/connections',
    label: 'Connections',
    shortLabel: '04',
    description: 'Source scope, freshness, and health',
  },
  {
    href: '/activity',
    label: 'Activity',
    shortLabel: '05',
    description: 'Authorized decision and system history',
    roles: ['MANAGER', 'EXECUTIVE_VIEWER'],
  },
];

export function getNavigationForRole(role: DemoRole): NavigationItem[] {
  return primaryNavigation
    .filter(({ roles }) => roles === undefined || roles.includes(role))
    .map(({ href, label, shortLabel, description }) => ({
      href,
      label,
      shortLabel,
      description,
    }));
}
