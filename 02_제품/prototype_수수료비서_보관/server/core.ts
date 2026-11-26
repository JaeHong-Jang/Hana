// 뒷단의 본체. 수수료 계산, 알림 조건, 비서, 규칙을 모두 여기서 처리한다.
// 화면은 이 파일이 돌려주는 값만 그린다. 금액은 화면이나 비서가 만들지 않는다.

export type Status = 'active' | 'paused' | 'cancelled';
export type Actor = '손님' | '비서' | '규칙';

export interface Service {
  id: string;
  name: string;
  rate: number;
  joined: string;
  lastOpened: string;
  openedDays: number; // 최근 석 달 동안 열어 본 날 수
  status: Status;
  keepUntil?: string; // 손님이 "계속 쓰기"를 고른 뒤 다시 묻지 않는 기한
}
export interface Trade {
  id: number;
  at: string;
  stock: string;
  side: '매수' | '매도';
  qty: number;
  amount: number;
  commission: number;
  fees: { serviceId: string; name: string; amount: number }[];
}
export interface Notice {
  id: number;
  at: string;
  kind: 'trade' | 'pre' | 'auto'; // 체결 직후 한 줄 | 쉬기 전 미리 알림 | 쉬게 한 뒤 알림
  serviceId: string;
  amount?: number;
  days: number;
  dueAt?: string;
  state: 'new' | 'later' | 'done';
}
export type Block =
  | { t: 'text'; text: string }
  | { t: 'calc'; name: string; rate: number; rows: { label: string; traded: number; fee: number }[]; traded: number; fee: number }
  | { t: 'proposal'; id: number; serviceId: string; name: string; action: 'pause' | 'cancel'; saving: number; state: 'open' | 'approved' | 'dismissed' }
  | { t: 'link'; to: string; label: string }
  | { t: 'undo'; logId: number; label: string };
export interface Msg {
  id: number;
  role: 'me' | 'agent';
  at: string;
  blocks: Block[];
  trace?: string[]; // 비서가 이 답을 만든 순서. 화면에서 펼쳐 볼 수 있다
}
export interface Log {
  id: number;
  at: string;
  actor: Actor;
  text: string;
  undo?: { serviceId: string; to: Status };
  undone?: boolean;
}
export interface Rule {
  on: boolean;
  months: number;
  noticeDays: number;
  exempt: string[];
}
interface State {
  now: string;
  seq: number;
  services: Service[];
  trades: Trade[];
  notices: Notice[];
  msgs: Msg[];
  log: Log[];
  rule: Rule;
}

export const COMMISSION_RATE = 0.000141639;
const DAY = 86400000;
const UNUSED_DAYS = 90;

let s: State;

const t = (iso: string) => Date.parse(iso + 'Z');
const iso = (ms: number) => new Date(ms).toISOString().slice(0, 19);
const next = () => ++s.seq;
const svc = (id: string) => {
  const found = s.services.find((x) => x.id === id);
  if (!found) throw new Error('없는 서비스예요.');
  return found;
};
const daysSince = (x: Service) => Math.floor((t(s.now) - t(x.lastOpened)) / DAY);
const won = (n: number) => `${Math.floor(n).toLocaleString('ko-KR')}원`;

function fill(at: string, stock: string, side: '매수' | '매도', qty: number, amount: number): Trade {
  return {
    id: next(),
    at,
    stock,
    side,
    qty,
    amount,
    commission: Math.floor(amount * COMMISSION_RATE),
    fees: s.services
      .filter((x) => x.status === 'active')
      .map((x) => ({ serviceId: x.id, name: x.name, amount: Math.floor(amount * x.rate) })),
  };
}

export function reset() {
  s = {
    now: '2026-11-25T14:30:00',
    seq: 0,
    services: [
      { id: 'hint', name: 'HINT 플러스', rate: 0.0009, joined: '2019.05.20', lastOpened: '2026-03-12T09:00:00', openedDays: 0, status: 'active' },
      { id: 'etf', name: 'ETF NOW', rate: 0.0003, joined: '2024.02.06', lastOpened: '2026-11-24T08:50:00', openedDays: 21, status: 'active' },
    ],
    trades: [],
    notices: [],
    msgs: [],
    log: [],
    rule: { on: false, months: 3, noticeDays: 7, exempt: ['etf'] },
  };
  s.trades.push(fill('2026-09-14T10:12:00', '한빛전자', '매수', 80, 12000000));
  s.trades.push(fill('2026-10-21T13:40:00', '새봄바이오', '매도', 100, 8000000));
  s.trades.push(fill('2026-11-06T09:31:00', '한빛전자', '매수', 40, 6000000));
  say([{ t: 'text', text: '가입한 유료 정보 서비스의 값을 살펴 드려요. 아래에서 골라 묻거나 글로 물어보세요.' }]);
}

// ---- 계산 (수수료 계산 기록에서 읽는 값) ----
function periodTrades() {
  const from = new Date(t(s.now));
  from.setUTCMonth(from.getUTCMonth() - 3);
  return s.trades.filter((x) => t(x.at) >= from.getTime());
}
const feeOf = (tr: Trade, id: string) => tr.fees.find((f) => f.serviceId === id)?.amount ?? 0;
const periodFee = (id: string) => periodTrades().reduce((sum, tr) => sum + feeOf(tr, id), 0);
function calc(x: Service): Extract<Block, { t: 'calc' }> {
  const rows: { label: string; traded: number; fee: number }[] = [];
  for (const tr of periodTrades()) {
    if (!tr.fees.some((f) => f.serviceId === x.id)) continue;
    const label = `${Number(tr.at.slice(5, 7))}월`;
    const row = rows.find((r) => r.label === label) ?? rows[rows.push({ label, traded: 0, fee: 0 }) - 1];
    row.traded += tr.amount;
    row.fee += feeOf(tr, x.id);
  }
  return { t: 'calc', name: x.name, rate: x.rate, rows, traded: rows.reduce((a, r) => a + r.traded, 0), fee: rows.reduce((a, r) => a + r.fee, 0) };
}

export function view() {
  const period = periodTrades();
  const services = s.services.map((x) => ({
    ...x,
    daysSince: daysSince(x),
    periodFee: periodFee(x.id),
    unused: x.status === 'active' && daysSince(x) >= UNUSED_DAYS,
    calc: calc(x),
  }));
  return {
    now: s.now,
    services,
    trades: [...s.trades].reverse(),
    notices: s.notices,
    msgs: s.msgs,
    log: [...s.log].reverse(),
    rule: s.rule,
    totals: {
      fee: services.reduce((a, x) => a + x.periodFee, 0),
      commission: period.reduce((a, x) => a + x.commission, 0),
      traded: period.reduce((a, x) => a + x.amount, 0),
      unused: services.filter((x) => x.unused).length,
      paused: services.filter((x) => x.status === 'paused').length,
    },
  };
}
export type View = ReturnType<typeof view>;

// ---- 기록과 말하기 ----
function say(blocks: Block[], role: 'me' | 'agent' = 'agent', trace?: string[]) {
  s.msgs.push({ id: next(), role, at: s.now, blocks, trace });
}
function record(actor: Actor, text: string, undo?: Log['undo']) {
  const entry: Log = { id: next(), at: s.now, actor, text, undo };
  s.log.push(entry);
  return entry;
}

// ---- 상태 바꾸기. 한 방향 원칙을 여기서 막는다 ----
export function setStatus(id: string, to: Status, actor: Actor, how = '') {
  const x = svc(id);
  // 비서와 규칙은 손님 돈이 덜 나가는 쪽(쉬기)으로만 스스로 움직인다. 해지와 다시 켜기는 손님만 한다.
  if (actor !== '손님' && to !== 'paused') throw new Error('비서와 규칙은 쉬기만 할 수 있어요.');
  if (x.status === to) throw new Error('이미 그 상태예요.');
  if (x.status === 'cancelled') throw new Error('해지한 서비스예요. 다시 쓰려면 새로 가입해야 해요.');
  const from = x.status;
  x.status = to;
  if (to === 'active') x.lastOpened = s.now;
  s.notices.forEach((n) => n.serviceId === id && n.kind !== 'auto' && (n.state = 'done'));
  const word = to === 'paused' ? '쉬게 했어요' : to === 'cancelled' ? '해지했어요' : '다시 켰어요';
  return record(actor, `${x.name}를 ${word}${how ? ` (${how})` : ''}`, to === 'cancelled' ? undefined : { serviceId: id, to: from });
}
export function undo(logId: number) {
  const entry = s.log.find((l) => l.id === logId);
  if (!entry?.undo || entry.undone) throw new Error('되돌릴 수 없는 기록이에요.');
  const x = svc(entry.undo.serviceId);
  x.status = entry.undo.to;
  entry.undone = true;
  record('손님', `되돌렸어요: ${entry.text}`);
  say([{ t: 'text', text: `${x.name}를 ${x.status === 'active' ? '다시 쓰는 중' : '쉬는 중'}으로 되돌렸어요.` }]);
}
export function keep(id: string) {
  const x = svc(id);
  x.keepUntil = iso(t(s.now) + UNUSED_DAYS * DAY);
  s.notices.forEach((n) => n.serviceId === id && (n.state = 'done'));
  record('손님', `${x.name}를 계속 쓰기로 했어요. 다음 알림은 석 달 뒤예요`);
}
export function openService(id: string) {
  const x = svc(id);
  if (x.status !== 'active') throw new Error('쓰는 중인 서비스만 열 수 있어요.');
  if (x.lastOpened.slice(0, 10) !== s.now.slice(0, 10)) x.openedDays += 1;
  x.lastOpened = s.now;
  s.notices.forEach((n) => n.serviceId === id && n.kind !== 'auto' && (n.state = 'done'));
  record('손님', `${x.name}를 열어 봤어요`);
}

// ---- 체결과 체결 직후 알림 ----
export function trade() {
  const tr = fill(s.now, '한빛전자', '매수', 20, 3000000);
  s.trades.push(tr);
  for (const f of tr.fees) {
    const x = svc(f.serviceId);
    // 조건 셋: 이 거래에서 값이 나갔고, 오래 열지 않았고, 최근 석 달 안에 같은 알림을 보낸 적이 없다
    const recent = s.notices.some((n) => n.serviceId === x.id && n.kind === 'trade' && t(s.now) - t(n.at) < UNUSED_DAYS * DAY);
    const kept = x.keepUntil && t(x.keepUntil) > t(s.now);
    if (f.amount > 0 && daysSince(x) >= UNUSED_DAYS && !recent && !kept) {
      s.notices.push({ id: next(), at: s.now, kind: 'trade', serviceId: x.id, amount: f.amount, days: daysSince(x), state: 'new' });
      say([
        { t: 'text', text: `방금 거래에서 ${x.name} 값 ${won(f.amount)}이 함께 나갔어요. 이 서비스를 ${daysSince(x)}일째 열지 않으셨어요.` },
        { t: 'link', to: 'fees', label: '낸 값과 쓴 만큼 보기' },
      ]);
      record('비서', `체결 알림에 ${x.name} 값 한 줄을 붙였어요`);
    }
  }
}
export function later(noticeId: number) {
  const n = s.notices.find((x) => x.id === noticeId);
  if (n) n.state = 'later';
}

// ---- 규칙: 안 보면 미리 알리고 쉬게 한다 ----
function runRule() {
  if (!s.rule.on) return;
  for (const x of s.services) {
    if (x.status !== 'active' || s.rule.exempt.includes(x.id)) continue;
    if (x.keepUntil && t(x.keepUntil) > t(s.now)) continue;
    if (daysSince(x) < s.rule.months * 30) continue;
    const pre = s.notices.find((n) => n.serviceId === x.id && n.kind === 'pre' && n.state !== 'done');
    if (!pre) {
      const dueAt = iso(t(s.now) + s.rule.noticeDays * DAY);
      s.notices.push({ id: next(), at: s.now, kind: 'pre', serviceId: x.id, days: daysSince(x), dueAt, state: 'new' });
      say([
        { t: 'text', text: `${x.name}를 ${daysSince(x)}일째 열지 않으셨어요. 맡기신 규칙대로 ${s.rule.noticeDays}일 뒤(${dueAt.slice(5, 10).replace('-', '.')})에 쉬게 할게요. 계속 쓰시려면 알려 주세요.` },
        { t: 'link', to: 'services', label: '계속 쓰기 고르기' },
      ]);
      record('규칙', `${x.name}를 ${s.rule.noticeDays}일 뒤 쉬게 한다고 미리 알렸어요`);
    } else if (pre.dueAt && t(s.now) >= t(pre.dueAt)) {
      const entry = setStatus(x.id, 'paused', '규칙', '미리 알린 뒤 답이 없어서');
      s.notices.push({ id: next(), at: s.now, kind: 'auto', serviceId: x.id, days: daysSince(x), state: 'new' });
      say([
        { t: 'text', text: `${x.name}를 쉬게 했어요. 다음 거래부터 서비스 값이 붙지 않아요. 마음이 바뀌면 되돌릴 수 있어요.` },
        { t: 'undo', logId: entry.id, label: '되돌리기' },
      ]);
    }
  }
}
export function setRule(patch: Partial<Rule>) {
  s.rule = { ...s.rule, ...patch };
  record('손님', s.rule.on ? `규칙을 켰어요: ${s.rule.months}달 안 보면 쉬게 하기` : '규칙을 껐어요');
  runRule();
}
export function advance(days: number) {
  s.now = iso(t(s.now) + days * DAY);
  runRule();
}

// ---- 비서 ----
// 세 부분으로 나눈다. (1) 알아듣기 (2) 도구 (3) 답하기.
// 실제 서비스에서 언어 모델이 맡는 것은 (1)과 (3)의 말 다듬기뿐이다. 금액은 (2)의 도구에서만 나온다.

export type Intent = 'recommend' | 'resume' | 'saving' | 'pause' | 'cancel' | 'how' | 'list' | 'help';
const INTENT_NAME: Record<Intent, string> = {
  recommend: '종목·주문 부탁 (하지 않는 일)',
  resume: '켜기·가입 부탁 (하지 않는 일)',
  saving: '쉬면 줄어드는 금액',
  pause: '쉬게 해 달라는 부탁',
  cancel: '해지해 달라는 부탁',
  how: '셈 내역',
  list: '가입한 서비스',
  help: '할 수 있는 일 안내',
};

// (1) 알아듣기. 시안에서는 낱말 맞추기로 대신했다.
function understand(text: string): { intent: Intent; service?: Service } {
  const named = /hint|힌트/i.test(text) ? svc('hint') : /etf/i.test(text) ? svc('etf') : undefined;
  const service = named ?? s.services.find((x) => x.status === 'active' && daysSince(x) >= UNUSED_DAYS) ?? s.services.find((x) => x.status === 'active');
  const intent: Intent = /추천|살까|사도|팔까|오를|종목 ?골라|주문해|이체/.test(text)
    ? 'recommend'
    : /다시 ?켜|재개|가입해|가입시켜|켜 ?줘/.test(text)
      ? 'resume'
      : /쉬면|줄어|아낄|절약/.test(text)
        ? 'saving'
        : /해지/.test(text)
          ? 'cancel'
          : /쉬게|쉬기|쉬어|멈춰|멈추|중지|정지/.test(text)
            ? 'pause'
            : /어떻게|셈|계산|왜|근거|내역/.test(text)
              ? 'how'
              : /뭐|무슨|어떤|가입|서비스|목록|얼마/.test(text)
                ? 'list'
                : 'help';
  return { intent, service };
}

// (2) 도구. 읽기 셋과 제안 하나뿐이다. 상태를 바꾸는 도구는 비서에게 없다.
const tools = {
  listServices: () => s.services.map((v) => ({ name: v.name, fee: periodFee(v.id), status: v.status, days: daysSince(v) })),
  feeBreakdown: (x: Service) => calc(x),
  estimateSaving: (x: Service) => periodFee(x.id),
  proposeChange: (x: Service, action: 'pause' | 'cancel'): Block => ({ t: 'proposal', id: next(), serviceId: x.id, name: x.name, action, saving: periodFee(x.id), state: 'open' }),
};

// (3) 답하기
export function ask(text: string) {
  say([{ t: 'text', text }], 'me');
  const { intent, service: x } = understand(text);
  const step1 = `물음 알아듣기: ${INTENT_NAME[intent]}`;
  const reply = (blocks: Block[], used: string[]) => say(blocks, 'agent', [step1, ...used, '답 만들기: 위에서 받은 값만 사용']);

  if (intent === 'recommend') {
    return reply([{ t: 'text', text: '종목이나 상품 추천, 주문, 이체는 하지 않아요. 가입한 정보 서비스의 값만 살펴 드려요.' }], ['권한 확인: 비서가 하지 않는 일이라 거절']);
  }
  if (intent === 'resume') {
    return reply(
      [
        { t: 'text', text: '서비스를 켜거나 가입하는 일은 대신 하지 않아요. 돈이 더 나가는 쪽은 손님이 직접 누르셔야 해요.' },
        { t: 'link', to: 'services', label: '가입 서비스 관리로 가기' },
      ],
      ['권한 확인: 돈이 더 나가는 쪽이라 거절', '화면 안내: 가입 서비스 관리'],
    );
  }
  if (intent === 'help' || !x) {
    return reply(
      [{ t: 'text', text: x ? '가입한 서비스, 낸 값의 셈 내역, 쉬면 줄어드는 금액을 물어보실 수 있어요. 서비스를 쉬게 해 달라고 하셔도 돼요.' : '지금 쓰는 중인 유료 정보 서비스가 없어요.' }],
      [],
    );
  }
  if (intent === 'saving') {
    return reply(
      [{ t: 'text', text: `지난 석 달처럼 거래하시면 석 달에 ${won(tools.estimateSaving(x))}이 줄어요. 매매수수료와 다른 서비스는 그대로예요.` }],
      [`도구: 줄어드는 금액 셈하기 (${x.name}, 수수료 계산 기록)`],
    );
  }
  if (intent === 'pause' || intent === 'cancel') {
    if (x.status !== 'active') return reply([{ t: 'text', text: `${x.name}는 이미 ${x.status === 'paused' ? '쉬는 중' : '해지한 상태'}예요.` }], ['도구: 가입 서비스 읽기']);
    return reply(
      [
        { t: 'text', text: intent === 'pause' ? `${x.name}를 쉬게 할까요? 누르시기 전에는 아무것도 바꾸지 않아요.` : `${x.name}를 해지할까요? 해지는 되돌릴 수 없고, 다시 쓰려면 새로 가입해야 해요.` },
        tools.proposeChange(x, intent),
      ],
      [`도구: 줄어드는 금액 셈하기 (${x.name})`, '도구: 제안 만들기 (상태는 바꾸지 않음)', '손님 확인 기다리기'],
    );
  }
  if (intent === 'how') {
    return reply(
      [{ t: 'text', text: `${x.name} 값은 거래 금액에 ${(x.rate * 100).toFixed(2)}%를 곱한 금액이에요. 수수료 계산 기록에서 가져왔어요.` }, tools.feeBreakdown(x)],
      [`도구: 셈 내역 읽기 (${x.name}, 최근 석 달)`],
    );
  }
  const lines = tools.listServices().map((v) => `${v.name}: 석 달 ${won(v.fee)}, ${v.status === 'active' ? `${v.days}일 전에 열어 봄` : v.status === 'paused' ? '쉬는 중' : '해지함'}`);
  reply([{ t: 'text', text: lines.join('\n') }, { t: 'link', to: 'fees', label: '수수료·서비스 값 보기' }], ['도구: 가입 서비스 읽기']);
}
function proposal(id: number) {
  for (const m of s.msgs) for (const b of m.blocks) if (b.t === 'proposal' && b.id === id) return b;
  throw new Error('없는 제안이에요.');
}
export function approve(id: number) {
  const p = proposal(id);
  if (p.state !== 'open') throw new Error('이미 끝난 제안이에요.');
  // 누른 사람은 손님이다. 비서는 제안만 했다.
  const entry = setStatus(p.serviceId, p.action === 'pause' ? 'paused' : 'cancelled', '손님', '비서 제안을 승인');
  p.state = 'approved';
  say(
    p.action === 'pause'
      ? [{ t: 'text', text: `${p.name}를 쉬게 했어요. 다음 거래부터 서비스 값이 붙지 않아요.` }, { t: 'undo', logId: entry.id, label: '되돌리기' }]
      : [{ t: 'text', text: `${p.name}를 해지했어요. 다음 거래부터 서비스 값이 붙지 않아요.` }],
    'agent',
    ['손님이 제안을 승인', '실행: 상태 바꾸기 (손님 이름으로 기록)', p.action === 'pause' ? '되돌리기 남기기' : '해지는 되돌릴 수 없어 되돌리기 없음'],
  );
}
export function dismiss(id: number) {
  proposal(id).state = 'dismissed';
  say([{ t: 'text', text: '그대로 뒀어요. 바뀐 것은 없어요.' }]);
}

reset();
