'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type {
  DemoAction,
  DemoActivityEvent,
  DemoRecommendation,
  OpportunityStatus,
} from '@reachops/contracts';
import { demoSnapshot } from './snapshot';

/**
 * Demo session state.
 *
 * The committed snapshot stays the authority: this store holds only sparse overrides layered on
 * top of it. Resetting therefore means discarding overrides rather than rebuilding data, and the
 * deterministic baseline can never be edited away.
 *
 * Everything here is local to the visitor's browser. Nothing is sent anywhere, and no provider is
 * ever written to.
 */

const STORAGE_KEY = 'reachops.demo.session.v1';

export type DemoActionStatus = DemoAction['status'];

interface ActionOverride {
  status?: DemoActionStatus;
  owner?: string;
  dueOn?: string | null;
  reviewOn?: string | null;
}

interface OpportunityOverride {
  status?: OpportunityStatus;
  effort?: DemoRecommendation['effort'];
  linkedActionId?: string;
}

export interface SessionNote {
  id: string;
  entityId: string;
  body: string;
  author: string;
  createdAt: string;
}

export interface BaselineEntry {
  evidenceId: string;
  label: string;
  value: number;
  unit: string;
}

/**
 * The measurement an opportunity is judged against once work begins.
 *
 * Captured at the moment of acceptance and never rewritten. Whatever a reader later does to a
 * dashboard filter, the question "what did this look like before we acted?" keeps the same answer.
 */
export interface OpportunityBaseline {
  capturedAt: string;
  entries: BaselineEntry[];
}

interface SessionState {
  version: 1;
  opportunities: Record<string, OpportunityOverride>;
  actions: Record<string, ActionOverride>;
  createdActions: DemoAction[];
  notes: SessionNote[];
  events: DemoActivityEvent[];
  baselines: Record<string, OpportunityBaseline>;
}

const EMPTY_STATE: SessionState = {
  version: 1,
  opportunities: {},
  actions: {},
  createdActions: [],
  notes: [],
  events: [],
  baselines: {},
};

function isDirty(state: SessionState): boolean {
  return (
    Object.keys(state.opportunities).length > 0 ||
    Object.keys(state.actions).length > 0 ||
    state.createdActions.length > 0 ||
    state.notes.length > 0 ||
    state.events.length > 0 ||
    Object.keys(state.baselines).length > 0
  );
}

interface DemoSessionValue {
  /** Opportunities with session overrides applied, in snapshot order. */
  opportunities: DemoRecommendation[];
  /** Baseline actions plus any created this session, with overrides applied. */
  actions: DemoAction[];
  /** Snapshot activity plus session-appended events, oldest first. */
  activity: DemoActivityEvent[];
  notesFor: (entityId: string) => SessionNote[];
  /** The frozen measurement captured when an opportunity was accepted, if it has been. */
  baselineFor: (opportunityId: string) => OpportunityBaseline | undefined;
  /** True once session changes exist, so the UI can offer a meaningful reset. */
  dirty: boolean;
  /** False until localStorage has been read, so nothing flashes stale on hydration. */
  hydrated: boolean;
  setOpportunityStatus: (id: string, status: OpportunityStatus, actor?: string) => void;
  setOpportunityEffort: (id: string, effort: DemoRecommendation['effort']) => void;
  setActionStatus: (id: string, status: DemoActionStatus, actor?: string) => void;
  setActionOwner: (id: string, owner: string) => void;
  setActionDates: (id: string, dates: { dueOn?: string | null; reviewOn?: string | null }) => void;
  addNote: (entityId: string, body: string, author?: string) => void;
  createActionFromOpportunity: (
    opportunityId: string,
    input: { title: string; owner: string; dueOn: string; reviewOn: string },
  ) => string;
  reset: () => void;
}

const DemoSessionContext = createContext<DemoSessionValue | null>(null);

const DEFAULT_ACTOR = 'Maya Chen';

function readStoredState(): SessionState {
  if (typeof window === 'undefined') return EMPTY_STATE;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_STATE;
    const parsed = JSON.parse(raw) as SessionState;
    return parsed.version === 1 ? { ...EMPTY_STATE, ...parsed } : EMPTY_STATE;
  } catch {
    return EMPTY_STATE;
  }
}

export function DemoSessionProvider({ children }: { children: ReactNode }) {
  // Start from the baseline on both server and first client render so hydration matches, then
  // adopt any stored session in an effect.
  const [state, setState] = useState<SessionState>(EMPTY_STATE);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setState(readStoredState());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      if (isDirty(state)) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      else window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // A full or unavailable storage quota must never break the demonstration.
    }
  }, [state, hydrated]);

  const appendEvent = useCallback(
    (event: Omit<DemoActivityEvent, 'id' | 'occurredAt'>, previous: SessionState): SessionState => {
      const occurredAt = new Date().toISOString();
      return {
        ...previous,
        events: [
          ...previous.events,
          { ...event, id: `ACTV-SESSION-${previous.events.length + 1}`, occurredAt },
        ],
      };
    },
    [],
  );

  const setOpportunityStatus = useCallback(
    (id: string, status: OpportunityStatus, actor = DEFAULT_ACTOR) => {
      setState((previous) => {
        const next = {
          ...previous,
          opportunities: {
            ...previous.opportunities,
            [id]: { ...previous.opportunities[id], status },
          },
        };
        return appendEvent(
          {
            actorType: 'HUMAN',
            actorName: actor,
            eventType: `OPPORTUNITY_${status}`,
            entityType: 'Opportunity',
            entityId: id,
            summary: `Set ${id} to ${status.toLowerCase()} in this demo session.`,
            evidenceIds: [],
          },
          next,
        );
      });
    },
    [appendEvent],
  );

  const setOpportunityEffort = useCallback((id: string, effort: DemoRecommendation['effort']) => {
    setState((previous) => ({
      ...previous,
      opportunities: { ...previous.opportunities, [id]: { ...previous.opportunities[id], effort } },
    }));
  }, []);

  const setActionStatus = useCallback(
    (id: string, status: DemoActionStatus, actor = DEFAULT_ACTOR) => {
      setState((previous) => {
        const next = {
          ...previous,
          actions: { ...previous.actions, [id]: { ...previous.actions[id], status } },
        };
        return appendEvent(
          {
            actorType: 'HUMAN',
            actorName: actor,
            eventType: status === 'COMPLETED' ? 'ACTION_COMPLETED' : 'ACTION_STATUS_CHANGED',
            entityType: 'ActionItem',
            entityId: id,
            summary: `Moved ${id} to ${status.replace('_', ' ').toLowerCase()}.`,
            evidenceIds: [],
          },
          next,
        );
      });
    },
    [appendEvent],
  );

  const setActionOwner = useCallback((id: string, owner: string) => {
    setState((previous) => ({
      ...previous,
      actions: { ...previous.actions, [id]: { ...previous.actions[id], owner } },
    }));
  }, []);

  const setActionDates = useCallback(
    (id: string, dates: { dueOn?: string | null; reviewOn?: string | null }) => {
      setState((previous) => ({
        ...previous,
        actions: { ...previous.actions, [id]: { ...previous.actions[id], ...dates } },
      }));
    },
    [],
  );

  const addNote = useCallback((entityId: string, body: string, author = DEFAULT_ACTOR) => {
    setState((previous) => ({
      ...previous,
      notes: [
        ...previous.notes,
        {
          id: `NOTE-${previous.notes.length + 1}`,
          entityId,
          body,
          author,
          createdAt: new Date().toISOString(),
        },
      ],
    }));
  }, []);

  const createActionFromOpportunity = useCallback(
    (
      opportunityId: string,
      input: { title: string; owner: string; dueOn: string; reviewOn: string },
    ) => {
      const opportunity = demoSnapshot.weeklyReview.recommendations.find(
        ({ id }) => id === opportunityId,
      );
      const actionId = `ACT-S${Date.now().toString().slice(-4)}`;

      setState((previous) => {
        const created: DemoAction = {
          id: actionId,
          decidedOn: new Date().toISOString().slice(0, 10),
          trigger: opportunity?.evidenceIds.join(', ') ?? opportunityId,
          title: input.title,
          owner: input.owner,
          status: 'APPROVED',
          note: `Created from ${opportunityId} in this demo session.`,
          evidenceIds: opportunity?.evidenceIds ?? [],
          observationId: opportunity?.observationId ?? null,
          dueOn: input.dueOn,
          reviewOn: input.reviewOn,
          current: true,
        };
        // Freeze what the evidence said at the moment of acceptance. Later filter changes must not
        // be able to move the line this work will be judged against.
        const baseline: OpportunityBaseline = {
          capturedAt: new Date().toISOString(),
          entries: (opportunity?.evidenceIds ?? []).flatMap((evidenceId) => {
            const record = demoSnapshot.evidence.find(
              (candidate) => candidate.evidenceId === evidenceId,
            );
            return record
              ? [
                  {
                    evidenceId,
                    label: record.metricDisplayName,
                    value: record.value,
                    unit: record.unit,
                  },
                ]
              : [];
          }),
        };

        const next: SessionState = {
          ...previous,
          createdActions: [...previous.createdActions, created],
          baselines: { ...previous.baselines, [opportunityId]: baseline },
          opportunities: {
            ...previous.opportunities,
            [opportunityId]: { ...previous.opportunities[opportunityId], status: 'ACCEPTED' },
          },
        };
        return appendEvent(
          {
            actorType: 'HUMAN',
            actorName: input.owner,
            eventType: 'ACTION_ASSIGNED',
            entityType: 'ActionItem',
            entityId: actionId,
            summary: `Accepted ${opportunityId} and assigned "${input.title}" to ${input.owner}.`,
            evidenceIds: opportunity?.evidenceIds ?? [],
          },
          next,
        );
      });

      return actionId;
    },
    [appendEvent],
  );

  const reset = useCallback(() => {
    setState(EMPTY_STATE);
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore storage failures; clearing in-memory state already restores the baseline.
    }
  }, []);

  const value = useMemo<DemoSessionValue>(() => {
    const opportunities = demoSnapshot.weeklyReview.recommendations.map((recommendation) => {
      const override = state.opportunities[recommendation.id];
      return override ? { ...recommendation, ...override } : recommendation;
    });

    const actions = [...demoSnapshot.actions, ...state.createdActions].map((action) => {
      const override = state.actions[action.id];
      return override ? { ...action, ...override } : action;
    });

    const activity = [...demoSnapshot.activity, ...state.events].sort(
      (left, right) => Date.parse(left.occurredAt) - Date.parse(right.occurredAt),
    );

    return {
      opportunities,
      actions,
      activity,
      notesFor: (entityId: string) => state.notes.filter((note) => note.entityId === entityId),
      baselineFor: (opportunityId: string) => state.baselines[opportunityId],
      dirty: isDirty(state),
      hydrated,
      setOpportunityStatus,
      setOpportunityEffort,
      setActionStatus,
      setActionOwner,
      setActionDates,
      addNote,
      createActionFromOpportunity,
      reset,
    };
  }, [
    state,
    hydrated,
    setOpportunityStatus,
    setOpportunityEffort,
    setActionStatus,
    setActionOwner,
    setActionDates,
    addNote,
    createActionFromOpportunity,
    reset,
  ]);

  return <DemoSessionContext.Provider value={value}>{children}</DemoSessionContext.Provider>;
}

export function useDemoSession(): DemoSessionValue {
  const value = useContext(DemoSessionContext);
  if (!value) throw new Error('useDemoSession must be used inside DemoSessionProvider.');
  return value;
}
