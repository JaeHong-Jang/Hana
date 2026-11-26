// 상태 한 벌과 그 모양. 다른 파일은 여기서 상태를 꺼내 쓰고, 바꾸는 일은 case.ts·monitor.ts·agent가 맡는다.
// 계좌 구성, 금액, 날짜는 모두 지어낸 값이다.
import type { ReasonId, Row } from './tax';

export type Actor = '손님' | '비서';
export type Stage = 'account' | 'papers' | 'waiting' | 'cash' | 'arrived' | 'closed';
export type Choice = 'merge' | 'separate';
export type Outcome = 'keep' | 'other' | 'close';
export type Plan = 'yes' | 'no' | 'unsure';
export type RuleId = 'papers' | 'late' | 'arrived' | 'd60';
export type Channel = 'web' | 'sms' | 'mail';

export interface Account {
  id: 'main' | 'retire';
  name: string;
  no: string;
  own: number; // 세액공제 받은 본인 납입
  gain: number; // 운용수익
  retire: number; // 퇴직금
  outside?: boolean; // 다른 금융사 계좌. 손님이 동의해야 읽는다
  closed?: boolean;
}
export interface Need {
  amount: number;
  reason: ReasonId;
}
export interface Task {
  id: string;
  text: string;
  due?: string;
  done: boolean;
}
export interface Case {
  stage: Stage;
  quitDate: string;
  years: number;
  pay: number;
  plan: Plan;
  received: 'irp' | 'cash';
  choice?: Choice;
  openedAt?: string; // 하나증권에 새 IRP를 연 날
  papersAt?: string;
  arrivedAt?: string;
  cashPaidAt?: string;
  need?: Need;
  outcome?: Outcome;
  handoff?: boolean;
  tasks: Task[];
}
export interface Notice {
  id: number;
  at: string;
  kind: RuleId;
  mark?: number; // 같은 알림을 두 번 보내지 않으려고 적어 둔다
  text: string;
  to: string;
  label: string;
  via: Channel[];
  state: 'new' | 'done';
}
// 길잡이는 상태를 바꾸지 못한다. 바꾸고 싶은 것은 제안으로 내고 손님이 받아들여야 실행된다.
export type ProposalKind = 'open' | 'update' | 'need' | 'link' | 'handoff';
export interface Facts {
  quitDate?: string;
  years?: number;
  pay?: number;
  plan?: Plan;
  received?: 'irp' | 'cash';
  need?: Need;
  asking?: 'quitDate' | 'years' | 'pay';
}
export interface Proposal {
  id: number;
  at: string;
  kind: ProposalKind;
  title: string;
  rows: { label: string; value: string; missing?: boolean }[];
  ready: boolean;
  payload: Facts;
  state: 'pending' | 'approved' | 'dismissed' | 'replaced';
}
export type Block =
  | { t: 'text'; text: string }
  | { t: 'link'; to: string; label: string }
  | { t: 'points'; items: { name: string; why: string }[] }
  | { t: 'proposal'; id: number }
  | { t: 'table'; title: string; head: string[]; rows: Row[]; note?: string };
export interface Msg {
  id: number;
  role: 'me' | 'agent';
  at: string;
  blocks: Block[];
  run?: number; // 이 답을 만든 실행 기록
}
// 길잡이가 한 번 답할 때 실제로 거친 일
export interface Call {
  tool: string;
  title: string;
  kind: string;
  input: string;
  output: string;
}
export interface Run {
  id: number;
  at: string;
  text: string;
  intents: string[];
  slots: string[];
  calls: Call[];
  gate: string; // 들어온 말 검사
  check: { amounts: number; unknown: string[]; banned: string[]; ok: boolean }; // 나가는 답 검사
}
export interface Log {
  id: number;
  at: string;
  actor: Actor;
  text: string;
}
export interface State {
  v: number;
  now: string;
  seq: number;
  linked: boolean; // 다른 금융사 연금 계좌 읽기에 동의했는가
  accounts: Account[];
  case: Case | null;
  proposals: Proposal[];
  notices: Notice[];
  alerts: { channels: Record<Channel, boolean>; rules: Record<RuleId, boolean> };
  sim: { pay: number; years: number };
  msgs: Msg[];
  runs: Run[];
  log: Log[];
}

const VERSION = 2;
export const AGE = 31; // 시안 손님의 나이
const DAY = 86400000;

export let s: State;

export function fresh(): State {
  return {
    v: VERSION,
    now: '2026-11-25T14:30:00',
    seq: 0,
    linked: false,
    accounts: [{ id: 'main', name: '다른 금융사 IRP (세액공제용)', no: '다른 금융사 계좌', own: 9000000, gain: 900000, retire: 0, outside: true }],
    case: null,
    proposals: [],
    notices: [],
    alerts: { channels: { web: true, sms: false, mail: false }, rules: { papers: true, late: true, arrived: true, d60: true } },
    sim: { pay: 15000000, years: 5 },
    msgs: [],
    runs: [],
    log: [],
  };
}
export const set = (next: State) => void (s = next);
// 서버가 다시 떠도 이어지도록 파일에 적어 두고 다시 읽는다 (읽고 쓰는 일은 vite.config.ts)
export const dump = () => JSON.stringify(s);
export function restore(json: string) {
  const x = JSON.parse(json) as State;
  if (x.v !== VERSION) return false;
  s = x;
  return true;
}

const t = (iso: string) => Date.parse(iso.length === 10 ? `${iso}T00:00:00Z` : `${iso}Z`);
const iso = (ms: number) => new Date(ms).toISOString().slice(0, 19);
export const today = () => s.now.slice(0, 10);
export const addDays = (date: string, n: number) => iso(t(date) + n * DAY).slice(0, 10);
export const daysBetween = (from: string, to: string) => Math.round((t(to) - t(from)) / DAY);
export const tick = (days: number) => void (s.now = iso(t(s.now) + days * DAY));
export const next = () => ++s.seq;
export const dot = (date: string) => date.slice(5).replace('-', '.');
export const total = (a: Account) => a.own + a.gain + a.retire;
export const acct = (id: Account['id']) => s.accounts.find((a) => a.id === id);
// 길잡이와 화면이 볼 수 있는 계좌. 동의하지 않은 다른 금융사 계좌는 보이지 않는다.
export const seen = () => s.accounts.filter((a) => !a.outside || s.linked);
export const seenMain = () => (s.linked ? acct('main') : undefined);

export function record(actor: Actor, text: string) {
  s.log.push({ id: next(), at: s.now, actor, text });
}
export function say(blocks: Block[], role: 'me' | 'agent' = 'agent', run?: number) {
  s.msgs.push({ id: next(), role, at: s.now, blocks, run });
}
