import { render as rtlRender } from '@testing-library/react';
import type { ReactElement, ReactNode } from 'react';
import { EvidenceProvider } from '@/components/evidence-drawer';
import { DemoSessionProvider } from '@/lib/demo/session';

function Providers({ children }: { children: ReactNode }) {
  return (
    <DemoSessionProvider>
      <EvidenceProvider>{children}</EvidenceProvider>
    </DemoSessionProvider>
  );
}

/** Renders a workspace surface inside the same providers the application shell supplies. */
export function render(ui: ReactElement) {
  return rtlRender(ui, { wrapper: Providers });
}
