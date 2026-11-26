// 주소 표. 화면에서 누른 것은 언제나 손님이 한 일이다. 길잡이가 닿는 주소는 ask 하나뿐이다.
import * as cases from './case';
import * as monitor from './monitor';
import * as agent from './agent';
import { fresh, s, say, set } from './store';

export { view } from './view';
export { dump, restore } from './store';
export type { View } from './view';
export type { Block, Choice, Msg, Outcome, Plan, Proposal, Run, Channel, RuleId } from './store';
export type { ReasonId, Row } from './tax';
export type { Doc } from './docs';

export function reset() {
  set(fresh());
  say([{ t: 'text', text: '퇴직금을 받기 전과 깨기 전에 정할 것을 함께 살펴 드려요. 상황을 편하게 한 문장으로 말씀해 주세요.' }]);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Body = any;
const actions: Record<string, (b: Body) => void> = {
  // 사건
  start: (b) => cases.start(b),
  update: (b) => cases.update(b),
  choose: (b) => cases.choose(b.choice),
  account: () => cases.openAccount(),
  papers: () => cases.sendPapers(),
  cashin: () => cases.cashIn(),
  need: (b) => cases.setNeed(b),
  decide: (b) => cases.decide(b.outcome),
  handoff: () => cases.handoff(),
  task: (b) => cases.toggleTask(String(b.id)),
  link: (b) => cases.link(!!b.on),
  sim: (b) => cases.setSim(b),
  // 길잡이
  ask: (b) => agent.ask(String(b.text ?? '').slice(0, 200)),
  approve: (b) => agent.approve(Number(b.id)),
  dismiss: (b) => agent.dismiss(Number(b.id)),
  // 알림
  later: (b) => monitor.later(Number(b.id)),
  alert: (b) => monitor.setAlert(b),
  // 시연 도구: 회사가 입금한 일과 날짜가 지난 일을 흉내 낸다
  deposit: () => {
    cases.deposit();
    monitor.arrived(s.case!);
  },
  advance: (b) => monitor.advance(Number(b.days) || 0),
  reset,
};
export const has = (name: string) => name in actions;
export function run(name: string, body: Body) {
  actions[name](body ?? {});
  if (name !== 'reset' && name !== 'advance') monitor.check(); // 손님이 무엇을 할 때마다 조건을 다시 훑는다
}

reset();
