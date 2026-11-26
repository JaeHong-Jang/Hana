// 손님이 누르는 일. 사건의 상태는 여기서만 바뀐다. 길잡이는 이 파일의 함수를 부르지 못한다.
import { DEFER_DAYS, REASONS, retireTax, won } from './tax';
import { acct, daysBetween, dot, record, s, say, today, type Case, type Choice, type Facts, type Outcome, type Plan, type Stage, type Task } from './store';
import { compare } from './quote';
import type { ReasonId } from './tax';

// 단계가 넘어갈 수 있는 길. 여기에 없는 전환은 막는다.
const FLOW: Record<Stage, Stage[]> = {
  account: ['papers'],
  papers: ['papers', 'waiting'],
  waiting: ['arrived'],
  cash: ['arrived'],
  arrived: ['closed'],
  closed: [],
};
const WHY: Record<Stage, string> = {
  account: '먼저 받을 계좌를 정해 주세요.',
  papers: '받을 계좌는 입금 전에만 바꿀 수 있어요.',
  waiting: '먼저 회사에 서류를 내 주세요.',
  cash: '통장으로 받으신 경우예요. 일정에서 IRP에 넣어 주세요.',
  arrived: '퇴직금이 들어온 뒤에 할 수 있어요.',
  closed: '이미 마친 사건이에요.',
};
export function open() {
  if (!s.case) throw new Error('먼저 퇴사 상황을 알려 주세요.');
  return s.case;
}
function move(c: Case, to: Stage) {
  if (!FLOW[c.stage].includes(to)) throw new Error(WHY[c.stage]);
  c.stage = to;
}

// 손님이 직접 챙길 일. 계좌와 단계에 따라 달라지고, 이미 끝낸 표시는 그대로 둔다.
function retask(c: Case) {
  const want: Omit<Task, 'done'>[] = [];
  if (c.received === 'irp') {
    want.push({ id: 'hr', text: '회사 담당자에게 퇴직금 지급 예정일과 금액 물어보기', due: c.quitDate });
    if (c.choice === 'merge') {
      want.push({ id: 'order', text: '기존 IRP에 걸어 둔 운용지시 확인하기 (그 금융사에서)', due: c.quitDate });
      want.push({ id: 'cert', text: '그 금융사에서 계좌 확인 서류 받기', due: c.quitDate });
    }
  }
  if (c.arrivedAt || c.received === 'cash') want.push({ id: 'receipt', text: '퇴직소득 원천징수영수증 받아 두기' });
  if (c.arrivedAt && c.choice === 'separate') want.push({ id: 'idle', text: '입금된 돈이 운용지시 전까지 현금으로 있는 것 확인하기' });
  c.tasks = want.map((w) => ({ ...w, done: c.tasks.find((x) => x.id === w.id)?.done ?? false }));
}

function checkFacts(b: Facts) {
  const years = Math.floor(Number(b.years));
  const pay = Math.floor(Number(b.pay));
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(b.quitDate))) throw new Error('퇴사일을 넣어 주세요.');
  if (!(years >= 1)) throw new Error('근속이 1년이 안 되면 퇴직급여가 없어요.');
  if (!(pay > 3000000)) throw new Error('퇴직급여가 300만 원 이하이면 IRP를 거치지 않고 받을 수 있어요.');
  return { quitDate: b.quitDate!, years, pay };
}

export function start(b: Facts) {
  const f = checkFacts(b);
  const cash = b.received === 'cash';
  const plan: Plan = b.plan ?? 'unsure';
  s.case = { stage: cash ? 'cash' : 'account', ...f, plan, received: cash ? 'cash' : 'irp', cashPaidAt: cash ? today() : undefined, choice: cash ? 'separate' : undefined, need: b.need, tasks: [] };
  retask(s.case);
  s.notices = [];
  record('손님', `퇴사 상황을 알렸어요: 퇴사일 ${dot(f.quitDate)}, 근속 ${f.years}년, 예상 퇴직금 ${won(f.pay)}`);
  say(
    cash
      ? [
          { t: 'text', text: `이미 통장으로 받으셨군요. 받은 날부터 ${DEFER_DAYS}일 안에 IRP에 넣으면 뗀 퇴직소득세 ${won(retireTax(f.pay, f.years).tax)}을 돌려받아요.` },
          { t: 'link', to: 'timeline', label: '남은 날 보기' },
        ]
      : [
          { t: 'text', text: '알려 주신 내용으로 사건을 열었어요. 입금 전 금액은 제가 조회할 수 없어서 넣어 주신 값으로 셈해요. 먼저 받을 계좌를 정해 볼까요?' },
          { t: 'link', to: 'account', label: '받을 계좌 정하기' },
        ],
  );
}
// 입금 전에는 퇴사일·근속·금액을 고칠 수 있다
export function update(b: Facts) {
  const c = open();
  if (c.arrivedAt || c.stage === 'closed' || c.received === 'cash') throw new Error('입금 뒤에는 계좌 기록의 금액을 써요. 고칠 수 없어요.');
  const f = checkFacts({ quitDate: b.quitDate ?? c.quitDate, years: b.years ?? c.years, pay: b.pay ?? c.pay });
  Object.assign(c, f);
  retask(c);
  record('손님', `퇴사 상황을 고쳤어요: 퇴사일 ${dot(f.quitDate)}, 근속 ${f.years}년, 예상 퇴직금 ${won(f.pay)}`);
}
export function choose(choice: Choice) {
  const c = open();
  if (choice !== 'merge' && choice !== 'separate') throw new Error('받을 계좌를 골라 주세요.');
  if (c.stage !== 'account' && c.stage !== 'papers') throw new Error('받을 계좌는 회사에 서류를 내기 전에만 바꿀 수 있어요.');
  if (c.openedAt && choice === 'merge') throw new Error('이미 하나증권 IRP를 여셨어요.');
  move(c, 'papers');
  c.choice = choice;
  retask(c);
  record('손님', choice === 'merge' ? '기존 IRP(다른 금융사)로 받기로 했어요' : '하나증권에 새 IRP를 열어 따로 받기로 했어요');
}
// 계좌를 여는 일은 휴대폰에서 손님이 한다. 시안에서는 "열었어요"를 누르면 연 것으로 친다.
export function openAccount() {
  const c = open();
  if (c.stage !== 'papers' || c.choice !== 'separate') throw new Error('하나증권에 새로 열어 받기로 한 경우에만 필요해요.');
  if (c.openedAt) throw new Error('이미 여셨어요.');
  c.openedAt = today();
  s.accounts.push({ id: 'retire', name: '하나증권 IRP (퇴직금)', no: '새로 연 계좌', own: 0, gain: 0, retire: 0 });
  record('손님', '휴대폰에서 본인 확인을 하고 하나증권 IRP를 열었어요');
}
export function sendPapers() {
  const c = open();
  if (c.stage !== 'papers') throw new Error(WHY[c.stage === 'account' ? 'account' : 'papers']);
  if (c.choice === 'separate' && !c.openedAt) throw new Error('먼저 하나증권 IRP를 열어 주세요. 계좌가 있어야 서류가 나와요.');
  move(c, 'waiting');
  c.papersAt = today();
  record('손님', '계좌 확인 서류를 회사에 냈어요');
}
function land(c: Case) {
  if (c.choice === 'merge') acct('main')!.retire += c.pay;
  else if (acct('retire')) acct('retire')!.retire = c.pay;
  else s.accounts.push({ id: 'retire', name: '하나증권 IRP (퇴직금)', no: '새로 연 계좌', own: 0, gain: 0, retire: c.pay });
  move(c, 'arrived');
  c.arrivedAt = today();
  retask(c);
}
// 회사가 퇴직금을 넣은 일 (시연 도구)
export function deposit() {
  const c = open();
  if (c.stage !== 'waiting') throw new Error(c.stage === 'cash' ? WHY.cash : '회사에 서류를 낸 뒤에 입금돼요.');
  land(c);
}
export function cashIn() {
  const c = open();
  if (c.stage !== 'cash') throw new Error('통장으로 받은 경우에만 쓰는 단추예요.');
  if (daysBetween(c.cashPaidAt!, today()) > DEFER_DAYS) throw new Error(`받은 날부터 ${DEFER_DAYS}일이 지나서 넣을 수 없어요.`);
  land(c);
  record('손님', `퇴직금 ${won(c.pay)}을 IRP에 넣고 과세이연계좌신고서를 냈어요`);
  say([{ t: 'text', text: `IRP에 넣으셨어요. 뗀 퇴직소득세 ${won(retireTax(c.pay, c.years).tax)}은 전 직장을 거쳐 돌려받아요.` }]);
}
export function setNeed(b: { amount: number; reason: ReasonId }) {
  const c = open();
  if (!(b.reason in REASONS)) throw new Error('사유를 골라 주세요.');
  c.need = { amount: Math.max(0, Math.floor(Number(b.amount) || 0)), reason: b.reason };
}
export function decide(outcome: Outcome) {
  const c = open();
  if (c.stage !== 'arrived') throw new Error(WHY.arrived);
  const cmp = compare(c);
  if (outcome === 'close' && c.choice === 'merge') {
    // 다른 금융사 계좌는 여기서 해지할 수 없다. 정한 것만 남긴다.
    record('손님', `해지하기로 정했어요. 실행은 계좌가 있는 금융사에서 해요.${cmp.known ? ` 예상으로 받는 돈 ${won(cmp.receive)}, 떼는 금액 ${won(cmp.withheld)}.` : ''} 해지 전에 비교표를 봤어요`);
  } else if (outcome === 'close') {
    const target = acct('retire')!;
    target.own = target.gain = target.retire = 0;
    target.closed = true;
    record('손님', `본인 인증 뒤 해지했어요. 받은 돈 ${won(cmp.receive)}, 뗀 금액 ${won(cmp.withheld)}. 해지 전에 비교표를 봤어요`);
  } else if (outcome === 'keep' || outcome === 'other') {
    record('손님', outcome === 'keep' ? '그대로 두기로 했어요. 비교표를 봤어요' : '다른 돈으로 메우기로 했어요. IRP는 그대로예요. 비교표를 봤어요');
  } else throw new Error('어떻게 할지 골라 주세요.');
  move(c, 'closed');
  c.outcome = outcome;
  s.notices.forEach((n) => (n.state = 'done'));
}
export function handoff() {
  const c = open();
  if (c.handoff) return;
  c.handoff = true;
  record('손님', `연금 상담 직원에게 넘겨 달라고 했어요: 근속 ${c.years}년, 퇴직금 ${won(c.pay)}${c.need ? `, 필요한 금액 ${won(c.need.amount)} (${REASONS[c.need.reason].label})` : ''}`);
  say([{ t: 'text', text: '지금까지 본 내용을 요약해 연금 상담 직원에게 넘겼어요. 처음부터 다시 설명하지 않으셔도 돼요. 상담은 평일 8시부터 17시까지예요.' }]);
}
export function toggleTask(id: string) {
  const task = open().tasks.find((x) => x.id === id);
  if (!task) throw new Error('없는 할 일이에요.');
  task.done = !task.done;
  if (task.done) record('손님', `할 일을 마쳤다고 표시했어요: ${task.text}`);
}
// 다른 금융사 연금 계좌 읽기. 손님이 동의해야 하고 언제든 끊을 수 있다.
export function link(on: boolean) {
  if (s.linked === on) return;
  s.linked = on;
  record('손님', on ? '다른 금융사 연금 계좌를 읽는 데 동의했어요 (읽기만, 마이데이터)' : '다른 금융사 연금 계좌 연결을 끊었어요');
}
export function setSim(b: { pay: number; years: number }) {
  const pay = Math.floor(Number(b.pay));
  const years = Math.floor(Number(b.years));
  if (!(pay > 0) || !(years >= 1) || years > 50) throw new Error('퇴직금과 근속 기간을 넣어 주세요.');
  s.sim = { pay, years };
}
