import type { View } from '../server/api';
export type { Block, Channel, Choice, Doc, Msg, Outcome, Plan, Proposal, ReasonId, Row, RuleId, Run, View } from '../server/api';

export type Data = View & { error?: string };
export type Page = 'home' | 'account' | 'papers' | 'timeline' | 'withdraw' | 'calc' | 'alerts' | 'agent' | 'log';

export async function call(name: string, body?: unknown): Promise<Data> {
  const res = await fetch(`/api/${name}`, body === undefined ? undefined : { method: 'POST', body: JSON.stringify(body) });
  return res.json();
}

export const won = (n: number) => `${Math.floor(n).toLocaleString('ko-KR')}원`;
export const day = (iso: string) => iso.slice(0, 10).replace(/-/g, '.');
export const stamp = (iso: string) => `${day(iso)} ${iso.slice(11, 16)}`;

export interface Ctx {
  v: Data;
  act: (name: string, body?: unknown, done?: string) => Promise<void>;
  go: (page: Page) => void;
  openAgent: (question?: string) => void;
  confirmClose: () => void;
}
