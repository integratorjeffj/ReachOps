import Link from 'next/link';
import type { ReactNode } from 'react';
import { AppNav } from './app-nav';

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="app-frame">
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>
      <aside className="sidebar">
        <Link aria-label="ReachOps overview" className="product-mark" href="/">
          <span aria-hidden="true" className="product-symbol">
            R
          </span>
          <span>
            <strong>ReachOps</strong>
            <small>Weekly reach review</small>
          </span>
        </Link>

        <div className="workspace-card">
          <span className="eyebrow">Active workspace</span>
          <strong>Summit &amp; Sage</strong>
          <span>Home Services · Denver</span>
          <span className="mode-badge mode-badge--synthetic">Synthetic workspace</span>
        </div>

        <AppNav role="MANAGER" />

        <Link className="about-link" href="/about">
          <span aria-hidden="true">ⓘ</span>
          About this demonstration
        </Link>
      </aside>

      <div className="content-column">
        <header className="topbar">
          <div>
            <span className="eyebrow">Reporting window</span>
            <strong>Jul 27 – Aug 2, 2026</strong>
          </div>
          <div className="topbar-actions">
            <span className="data-state">
              <i aria-hidden="true" /> Fixture data ready
            </span>
            <button aria-label="Open demo user menu" className="avatar-button" type="button">
              <span aria-hidden="true">MC</span>
              <span className="avatar-copy">
                <strong>Maya Chen</strong>
                <small>Workspace manager</small>
              </span>
            </button>
          </div>
        </header>
        <main id="main-content">{children}</main>
      </div>
    </div>
  );
}
