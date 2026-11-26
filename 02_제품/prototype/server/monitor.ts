// 살피기. 손님이 묻지 않아도 정해진 조건을 지켜보다가 알린다. 조건은 여기 적힌 것이 전부다.
import { DEFER_DAYS, PAY_DAYS, won } from './tax';
import { addDays, daysBetween, dot, next, record, s, say, tick, today, type Case, type Channel, type Notice, type RuleId } from './store';
import { deadlines } from './quote';

const CHANNEL_NAME: Record<Channel, string> = { web: '웹 알림', sms: '문자', mail: '메일' };
const RULES: { id: RuleId; name: string; when: string }[] = [
  { id: 'papers', name: '퇴사 전에 서류를 냈는지', when: '퇴사 3일 전까지 서류를 내지 않았으면 알려요' },
  { id: 'late', name: '지급 기한이 지났는지', when: `퇴사 뒤 ${PAY_DAYS}일이 지났는데 들어오지 않았으면 알려요` },
  { id: 'arrived', name: '퇴직금이 들어왔는지', when: '들어오면 바로 알려요' },
  { id: 'd60', name: `통장으로 받은 뒤 ${DEFER_DAYS}일`, when: '남은 날이 14일, 3일일 때 알려요' },
];

function notify(kind: RuleId, text: string, to: string, label: string, mark?: number) {
  if (!s.alerts.rules[kind]) return; // 손님이 꺼 둔 알림은 보내지 않는다
  const via = (Object.keys(CHANNEL_NAME) as Channel[]).filter((k) => s.alerts.channels[k]);
  s.notices.forEach((n) => (n.state = 'done'));
  s.notices.push({ id: next(), at: s.now, kind, mark, text, to, label, via, state: 'new' });
  say([{ t: 'text', text }, { t: 'link', to, label }]);
  record('비서', `알림: ${text}${via.length ? ` (${via.map((k) => CHANNEL_NAME[k]).join(', ')})` : ''}`);
}
const sent = (kind: RuleId, mark?: number) => s.notices.some((n) => n.kind === kind && n.mark === mark);

// 조건을 한 번 훑는다. 날짜가 지나거나 입금이 생기면 부른다.
export function check() {
  const c = s.case;
  if (!c) return;
  const d = deadlines(c);
  if ((c.stage === 'account' || c.stage === 'papers') && daysBetween(today(), c.quitDate) <= 3 && !sent('papers')) {
    notify('papers', `퇴사일(${dot(c.quitDate)})이 가까운데 회사에 서류를 아직 내지 않으셨어요. 계좌가 정해지지 않으면 회사가 퇴직금을 넣을 곳이 없어요.`, c.choice ? 'papers' : 'account', c.choice ? '회사에 낼 것 보기' : '받을 계좌 정하기');
  }
  if (c.stage === 'waiting' && today() > d.payDue! && !sent('late')) {
    notify('late', `지급 기한(${dot(d.payDue!)})이 지났는데 퇴직금이 아직 들어오지 않았어요. 회사 담당자에게 지급일을 물어보세요. 회사와 기한을 늦추기로 정한 경우는 달라요.`, 'timeline', '일정 보기');
  }
  if (c.stage === 'cash' && d.deferLeft !== null) {
    const mark = d.deferLeft <= 3 ? 3 : d.deferLeft <= 14 ? 14 : 0;
    if (mark && today() <= d.deferDue! && !sent('d60', mark)) notify('d60', `IRP에 넣을 수 있는 날이 ${d.deferLeft}일 남았어요.`, 'timeline', '남은 날 보기', mark);
  }
}
export function arrived(c: Case) {
  notify('arrived', `퇴직금 ${won(c.pay)}이 들어왔어요. 세금은 떼지 않고 미뤄졌어요.${c.choice === 'merge' ? ' 다른 금융사 계좌예요.' : ' 운용지시 전까지 현금으로 있어요.'}`, 'withdraw', '꺼내기 전 비교');
}
export function advance(days: number) {
  tick(Math.max(0, Math.min(365, Math.floor(days))));
  check();
}
export function later(id: number) {
  const n = s.notices.find((x: Notice) => x.id === id);
  if (n) n.state = 'done';
}
export function setAlert(b: { channel?: Channel; rule?: RuleId; on: boolean }) {
  if (b.channel && b.channel in s.alerts.channels) {
    s.alerts.channels[b.channel] = !!b.on;
    record('손님', `${CHANNEL_NAME[b.channel]}을 ${b.on ? '켰어요' : '껐어요'}`);
  } else if (b.rule && b.rule in s.alerts.rules) {
    s.alerts.rules[b.rule] = !!b.on;
    record('손님', `알림 "${RULES.find((r) => r.id === b.rule)!.name}"을 ${b.on ? '켰어요' : '껐어요'}`);
  } else throw new Error('없는 알림이에요.');
}

// 화면에 보여 줄 "길잡이가 지켜보는 것"
export function watch() {
  const c = s.case;
  const d = c ? deadlines(c) : null;
  const status = (id: RuleId) => {
    if (!s.alerts.rules[id]) return '꺼 두셨어요';
    if (s.notices.some((n) => n.kind === id)) return '알렸어요';
    if (!c || !d) return '사건이 열리면 지켜봐요';
    if (id === 'papers') return c.received === 'cash' || c.papersAt ? '해당 없어요' : `${dot(addDays(c.quitDate, -3))}에 확인해요`;
    if (id === 'late') return c.received === 'cash' || c.arrivedAt ? '해당 없어요' : c.stage === 'waiting' ? `${dot(d.payDue!)}까지 지켜봐요` : '서류를 내면 지켜봐요';
    if (id === 'arrived') return c.arrivedAt ? '해당 없어요' : c.stage === 'waiting' ? '지켜보는 중이에요' : '서류를 내면 지켜봐요';
    return c.stage === 'cash' ? `${d.deferLeft}일 남았어요` : '해당 없어요';
  };
  return {
    channels: (Object.keys(CHANNEL_NAME) as Channel[]).map((id) => ({ id, name: CHANNEL_NAME[id], on: s.alerts.channels[id] })),
    rules: RULES.map((r) => ({ ...r, on: s.alerts.rules[r.id], status: status(r.id) })),
  };
}
