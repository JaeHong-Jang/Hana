// 알아듣기. 손님 말에서 뜻(여러 개일 수 있다)과 값(날짜·기간·금액·사유)을 뽑는다.
// 실제 서비스에서는 언어 모델이 맡는 자리다. 시안은 낱말 맞추기로 대신했고, 돌려주는 모양은 같다.
// 이 파일은 상태를 모르고 금액을 셈하지 않는다.
import { REASONS, type ReasonId } from '../tax';

export type Intent = 'which' | 'cash' | 'partial' | 'tax' | 'pension' | 'account' | 'papers' | 'late' | 'arrived' | 'link' | 'human' | 'alerts' | 'status' | 'help';
export const INTENT_NAME: Record<Intent, string> = {
  which: '어느 쪽이 나은지 (권하지 않는 일)',
  cash: '통장으로 이미 받음',
  partial: '일부만 필요함',
  tax: '떼는 세금',
  pension: '연금으로 받을 때',
  account: '받을 계좌',
  papers: '회사에 낼 것',
  late: '입금이 늦음',
  arrived: '입금 확인',
  link: '다른 금융사 계좌 연결',
  human: '사람과 상담',
  alerts: '알림',
  status: '상황 알림, 지금 할 일',
  help: '할 수 있는 일 안내',
};
export interface Slots {
  quitDate?: string;
  years?: number;
  pay?: number;
  amount?: number; // 필요한 돈
  reason?: ReasonId;
  cash?: boolean;
}
export interface Understood {
  intents: Intent[];
  slots: Slots;
  points: { name: string; why: string }[]; // 말 속에서 골라낸 "미리 정할 것"
}

const TABLE: [Intent, RegExp][] = [
  ['which', /나아|나을|좋을까|둘까|깰까|어떻게 해야|뭐가 좋/],
  ['cash', /통장으로|이미 받|현금으로/],
  ['partial', /만 빼|일부|꺼내|빼고|잔금/],
  ['tax', /깨면|해지하면|떼|세금|얼마/],
  ['pension', /연금으로|55세|나중에 받|연금 수령/],
  ['account', /어느 계좌|받을 계좌|거기로|받아도|irp ?있|따로 받/i],
  ['papers', /회사에|서류|뭘 내|메일/],
  ['late', /안 들어|늦|지연/],
  ['arrived', /들어왔|입금/],
  ['link', /연결|마이데이터|불러/],
  ['human', /상담|사람이랑|직원|전화/],
  ['alerts', /알림|문자/],
  ['status', /퇴사|이직|그만|뭐 해야|어디까지|다음에/],
];
const REASON_WORDS: [ReasonId, RegExp][] = [
  ['lease', /전세|보증금|월세/],
  ['house', /집 ?사|주택|분양/],
  ['care', /요양|수술|병원/],
  ['rehab', /회생|파산/],
  ['disaster', /재난|수해|화재/],
  ['debt', /대출|빚/],
  ['living', /생활비|카드값/],
];

// "1500만 원", "2천만 원", "1억" 같은 금액을 원 단위로
function amounts(text: string) {
  const out: { at: number; won: number }[] = [];
  const rest = text
    .replace(/(\d+)\s*억/g, (m, n, at) => (out.push({ at, won: Number(n) * 100000000 }), ' '.repeat(m.length)))
    .replace(/(\d+)\s*천\s*만/g, (m, n, at) => (out.push({ at, won: Number(n) * 10000000 }), ' '.repeat(m.length)));
  for (const m of rest.matchAll(/(\d[\d,]*)\s*만/g)) out.push({ at: m.index, won: Number(m[1].replace(/,/g, '')) * 10000 });
  return out.sort((a, b) => a.at - b.at);
}

export function understand(text: string, today: string, asking?: 'quitDate' | 'years' | 'pay'): Understood {
  const slots: Slots = {};
  // 날짜
  const day = text.match(/(\d{1,2})\s*월\s*(\d{1,2})\s*일/);
  const plus = (n: number) => new Date(Date.parse(`${today}T00:00:00Z`) + n * 86400000).toISOString().slice(0, 10);
  if (day) {
    const y = Number(today.slice(0, 4));
    const md = `${day[1].padStart(2, '0')}-${day[2].padStart(2, '0')}`;
    slots.quitDate = `${y}-${md}` >= today ? `${y}-${md}` : `${y + 1}-${md}`;
  } else if (/다음 ?달/.test(text)) slots.quitDate = plus(30);
  else if (/이번 ?달|다음 ?주/.test(text)) slots.quitDate = plus(14);
  // 근속
  const bare = asking && /^\D*(\d[\d,]*)\D*$/.test(text) ? Number(text.replace(/[^\d]/g, '')) : undefined;
  const yr = text.match(/(\d{1,2})\s*년/);
  if (yr && (/근속|다녔|다닌|일했|년 ?차/.test(text) || asking === 'years')) slots.years = Number(yr[1]);
  else if (bare && asking === 'years') slots.years = bare;
  // 금액: "퇴직금 …만 원"은 퇴직금, 나머지는 필요한 돈
  const all = amounts(text);
  const at = text.search(/퇴직금/);
  const payHit = at >= 0 ? all.find((a) => a.at > at && a.at - at <= 16) : asking === 'pay' ? all[0] : undefined;
  if (payHit) slots.pay = payHit.won;
  else if (bare && asking === 'pay' && !all.length) slots.pay = bare * 10000;
  const other = all.find((a) => a !== payHit);
  if (other && asking !== 'pay') slots.amount = other.won;
  slots.reason = REASON_WORDS.find(([, re]) => re.test(text))?.[0];
  if (/통장으로|이미 받|현금으로/.test(text)) slots.cash = true;

  let intents = TABLE.filter(([, re]) => re.test(text)).map(([id]) => id);
  if ((slots.amount || slots.reason) && !intents.includes('partial')) intents.unshift('partial');
  if (intents.includes('late')) intents = intents.filter((x) => x !== 'arrived');
  if (intents.includes('which')) intents = ['which']; // 권유를 청하는 말에는 다른 답을 섞지 않는다
  if (intents.length > 1) intents = intents.filter((x) => x !== 'status');
  if (!intents.length) intents = [slots.quitDate || slots.years || slots.pay ? 'status' : 'help'];

  const points: Understood['points'] = [];
  if (/퇴사|이직|그만/.test(text)) points.push({ name: '어느 계좌로 받을지', why: '입금 전에만 고를 수 있어요.' });
  if (/irp ?있|세액공제|연말정산/i.test(text)) points.push({ name: '걸어 둔 운용지시', why: '기존 IRP로 받으면 퇴직금이 한꺼번에 그 비율대로 들어가요.' });
  if (slots.reason || slots.amount || /필요|빼|꺼내/.test(text)) points.push({ name: '일부만 필요할 때', why: 'IRP는 법에서 정한 사유가 아니면 일부만 꺼낼 수 없어요.' });
  if (slots.reason) points.push({ name: `꺼내는 사유: ${REASONS[slots.reason].label}`, why: REASONS[slots.reason].note });
  if (slots.cash) points.push({ name: '통장으로 받은 뒤 60일', why: '그 안에 IRP에 넣으면 뗀 세금을 돌려받아요.' });
  return { intents: intents.slice(0, 3), slots, points };
}
