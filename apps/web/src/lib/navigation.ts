export type DemoRole = 'MANAGER' | 'CONTRIBUTOR' | 'EXECUTIVE_VIEWER';

export interface NavigationItem {
  href: string;
  label: string;
  shortLabel: string;
  description: string;
}

/**
 * Business-oriented information architecture.
 *
 * Navigation names the work a reach manager does, not the system's internals. Sections appear here
 * only once they are implemented; Search & Website, Social, Content, Competitors, and Reports join
 * this list as their workspaces land, so the shell never offers a route that cannot answer for
 * itself.
 */
const primaryNavigation: Array<NavigationItem & { roles?: DemoRole[] }> = [
  {
    href: '/',
    label: 'Command Center',
    shortLabel: '01',
    description: 'What changed, what matters, what to work on now',
  },
  {
    href: '/search',
    label: 'Search & Website',
    shortLabel: '02',
    description: 'Discoverability, pages, queries, and local presence',
  },
  {
    href: '/social',
    label: 'Social',
    shortLabel: '03',
    description: 'Reach, engagement, and what it sends onward',
  },
  {
    href: '/content',
    label: 'Content',
    shortLabel: '04',
    description: 'What is being made, by whom, and when it goes live',
  },
  {
    href: '/opportunities',
    label: 'Opportunities',
    shortLabel: '05',
    description: 'Evidence-backed findings awaiting a decision',
  },
  {
    href: '/actions',
    label: 'Work',
    shortLabel: '06',
    description: 'Owned follow-through and outcomes',
  },
  {
    href: '/reports',
    label: 'Reports',
    shortLabel: '07',
    description: 'What happened, what we did, what leadership should know',
  },
  {
    href: '/briefing',
    label: 'Briefing',
    shortLabel: '08',
    description: 'The week in writing, with everything it could not stand behind',
  },
];

/** Operational surfaces a reader consults occasionally rather than daily. */
const utilityNavigation: Array<NavigationItem & { roles?: DemoRole[] }> = [
  {
    href: '/connections',
    label: 'Connections',
    shortLabel: 'C',
    description: 'Source scope, freshness, and health',
  },
  {
    href: '/activity',
    label: 'Audit & Activity',
    shortLabel: 'A',
    description: 'Authorized decision and system history',
    roles: ['MANAGER', 'EXECUTIVE_VIEWER'],
  },
];

function forRole(
  items: Array<NavigationItem & { roles?: DemoRole[] }>,
  role: DemoRole,
): NavigationItem[] {
  return items
    .filter(({ roles }) => roles === undefined || roles.includes(role))
    .map(({ href, label, shortLabel, description }) => ({
      href,
      label,
      shortLabel,
      description,
    }));
}

export function getNavigationForRole(role: DemoRole): NavigationItem[] {
  return forRole(primaryNavigation, role);
}

export function getUtilityNavigationForRole(role: DemoRole): NavigationItem[] {
  return forRole(utilityNavigation, role);
}
