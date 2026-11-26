// 화면이 그릴 값 한 벌. 화면은 이 값만 그리고, 금액을 셈하지 않는다.
import { REASONS, retireTax, simulate } from './tax';
import { s, seen, total, type Actor, type Case } from './store';
import { compare, deadlines, nextStep, options, partial, timeline } from './quote';
import { docs } from './docs';
import { watch } from './monitor';
import { DENIED, toolList } from './agent/tools';

// 길잡이가 하는 일과 손님이 하는 일을 한 줄씩
function whoDoesWhat(c: Case | null) {
  if (!c) return [];
  const st = ['account', 'papers', 'waiting', 'arrived', 'closed'].indexOf(c.stage === 'cash' ? 'waiting' : c.stage);
  const row = (who: Actor, text: string, done: boolean, now = false) => ({ who, text, state: done ? 'done' : now ? 'now' : 'todo' });
  if (c.received === 'cash')
    return [
      row('비서', '말씀에서 날짜·기간·금액을 뽑고 60일 기한을 셈했어요', true),
      row('비서', '과세이연계좌신고서를 채워 뒀어요', true),
      row('손님', 'IRP에 넣고 신고서 내기', st > 2, st === 2),
      row('비서', '남은 날을 따라가며 알려요', st > 2),
      row('손님', '그대로 둘지, 다른 돈으로 메울지, 해지할지 정하기', st > 3, st === 3),
    ];
  return [
    row('비서', '말씀에서 날짜·기간·금액을 뽑고 세금을 미리 셈했어요', true),
    row('손님', '받을 계좌 고르기', st > 0, st === 0),
    ...(c.choice === 'separate' ? [row('손님', '휴대폰에서 본인 확인을 하고 하나증권 IRP 열기', !!c.openedAt, st === 1 && !c.openedAt)] : []),
    row('비서', '계좌 확인 서류와 회사에 보낼 글 채워 두기', st > 1 || (st === 1 && (c.choice === 'merge' || !!c.openedAt))),
    row('손님', '회사에 서류 내기', st > 1, st === 1 && (c.choice === 'merge' || !!c.openedAt)),
    row('비서', '지급 기한을 따라가고 입금을 확인해요', st > 2),
    row('비서', '돈이 필요해지면 세 가지 경우를 손님 금액으로 보여 줘요', st > 3),
    row('손님', '그대로 둘지, 다른 돈으로 메울지, 해지할지 정하기', st > 3, st === 3),
  ];
}

export function view() {
  const c = s.case;
  const d = c ? deadlines(c) : null;
  return {
    now: s.now,
    linked: s.linked,
    accounts: seen().map((a) => ({ ...a, total: total(a) })),
    case: c,
    est: c ? retireTax(c.pay, c.years) : null,
    options: c ? options(c) : null,
    compare: c?.choice ? compare(c) : null,
    partial: c?.choice ? partial(c) : null,
    reason: c?.need ? REASONS[c.need.reason] : null,
    timeline: c ? timeline(c) : [],
    payDue: d?.payDue ?? null,
    deferLeft: d?.deferLeft ?? null,
    next: nextStep(c),
    plan: whoDoesWhat(c),
    docs: c ? docs(c) : [],
    watch: watch(),
    sim: simulate(s.sim.pay, s.sim.years),
    notices: [...s.notices].reverse(),
    proposals: s.proposals,
    msgs: s.msgs,
    runs: [...s.runs].reverse().slice(0, 30),
    tools: toolList(),
    denied: DENIED,
    log: [...s.log].reverse(),
  };
}
export type View = ReturnType<typeof view>;
