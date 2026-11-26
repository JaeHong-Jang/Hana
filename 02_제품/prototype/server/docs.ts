// 서류 준비. 길잡이는 채워 두기만 하고, 내는 일은 손님이 한다.
import { DEFER_DAYS, REASONS, retireTax, won } from './tax';
import { addDays, type Case } from './store';

export interface Doc {
  id: 'mail' | 'cert' | 'defer' | 'brief';
  title: string;
  to: string; // 누구에게 내는가
  state: 'ready' | 'wait';
  why?: string; // 아직 준비되지 않은 까닭
  fields: { k: string; v: string }[];
  body?: string; // 그대로 복사해 쓸 글
}
const ymd = (d: string) => d.replace(/-/g, '.');

export function docs(c: Case): Doc[] {
  const out: Doc[] = [];
  const hana = c.choice === 'separate';
  const firm = hana ? '하나증권' : '세액공제용 IRP가 있는 금융사';
  const no = hana ? (c.openedAt ? '새로 연 계좌의 번호' : '계좌를 열면 채워져요') : '그 금융사에서 확인해요';
  if (c.received === 'irp') {
    const wait = !c.choice ? '받을 계좌를 정하면 준비돼요' : hana && !c.openedAt ? '하나증권 IRP를 열면 채워져요' : undefined;
    out.push({
      id: 'cert',
      title: '계좌 확인 서류',
      to: '회사 담당자',
      state: wait || !hana ? 'wait' : 'ready',
      why: wait ?? (!hana ? '다른 금융사 계좌라서 그 금융사에서 받아요' : undefined),
      fields: [
        { k: '금융회사', v: firm },
        { k: '계좌 종류', v: '개인형 퇴직연금 (IRP)' },
        { k: '계좌번호', v: no },
        { k: '쓰임', v: '퇴직급여 입금용' },
      ],
    });
    out.push({
      id: 'mail',
      title: '회사 담당자에게 보내는 글',
      to: '회사 담당자',
      state: wait ? 'wait' : 'ready',
      why: wait,
      fields: [],
      body: [
        '안녕하세요.',
        `${ymd(c.quitDate)}에 퇴사하는 (이름)입니다.`,
        '퇴직금을 아래 IRP 계좌로 받으려고 합니다.',
        '',
        `· 금융회사: ${firm}`,
        '· 계좌 종류: 개인형 퇴직연금 (IRP)',
        `· 계좌번호: ${no}`,
        '',
        '계좌 확인 서류를 함께 보냅니다.',
        '퇴직금 지급 예정일과 예상 금액을 알려 주시면 감사하겠습니다.',
      ].join('\n'),
    });
  } else {
    const tax = retireTax(c.pay, c.years).tax;
    out.push({
      id: 'defer',
      title: '과세이연계좌신고서',
      to: 'IRP를 둔 금융사 (전 직장으로 전달)',
      state: c.arrivedAt ? 'wait' : 'ready',
      why: c.arrivedAt ? '이미 내셨어요' : undefined,
      fields: [
        { k: '퇴사일', v: ymd(c.quitDate) },
        { k: '퇴직금을 받은 날', v: ymd(c.cashPaidAt!) },
        { k: '퇴직급여', v: won(c.pay) },
        { k: '뗀 퇴직소득세', v: won(tax) },
        { k: '넣을 계좌', v: '하나증권 IRP' },
        { k: `넣을 수 있는 마지막 날 (${DEFER_DAYS}일)`, v: ymd(addDays(c.cashPaidAt!, DEFER_DAYS)) },
      ],
    });
  }
  out.push({
    id: 'brief',
    title: '상담 직원에게 넘기는 요약',
    to: '연금 상담 직원',
    state: 'ready',
    fields: [
      { k: '퇴사일', v: ymd(c.quitDate) },
      { k: '근속', v: `${c.years}년` },
      { k: c.arrivedAt ? '들어온 퇴직금' : '예상 퇴직금', v: won(c.pay) },
      { k: '받는 방식', v: c.received === 'cash' ? '통장으로 받음' : !c.choice ? '아직 정하지 않음' : hana ? '하나증권에 새로 열어 받기' : '기존 IRP로 받기' },
      { k: '필요한 돈', v: c.need ? `${won(c.need.amount)} (${REASONS[c.need.reason].label})` : '말씀 없었어요' },
    ],
  });
  return out;
}
