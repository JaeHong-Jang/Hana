// 손님의 사건과 계좌로 셈하는 값. 읽기와 셈뿐이고 상태를 바꾸지 않는다.
// 화면의 표와 길잡이의 표가 모두 여기서 나온다.
import { CREDIT_RATES, DEFER_DAYS, MIX_RATE, PAY_DAYS, PENSION_AGE, REASONS, man, partialTax, retireTax, won, type Row } from './tax';
import { AGE, addDays, daysBetween, dot, seenMain, today, type Case, type Need } from './store';

// 받을 계좌 두 가지를 나란히. 다른 금융사 계좌를 읽지 못하면 그쪽 금액은 비워 둔다.
export function options(c: Case) {
  const main = seenMain();
  const known = !!main;
  const tax = retireTax(c.pay, c.years).tax;
  const saved = main ? main.own + main.gain : 0;
  const mix = Math.floor(saved * MIX_RATE);
  // 16.5%를 그대로 손해로 보면 과장이다. 납입할 때 받은 세액공제를 빼야 한다.
  const net = CREDIT_RATES.map((r) => mix - Math.floor((main?.own ?? 0) * r)).reverse();
  const ask = '계좌를 연결하면 손님 금액으로 보여요';
  return {
    known,
    merge: { breakAmount: saved + c.pay, withheld: tax + mix },
    separate: { breakAmount: c.pay, withheld: tax },
    tax,
    mix,
    saved,
    rows: [
      { label: '퇴직금이 들어가는 곳', values: [known ? `세액공제용으로 모은 ${won(saved)}과 같은 계좌` : '세액공제용으로 모으던 계좌', '하나증권의 새 IRP. 퇴직금만 들어 있어요'] },
      { label: '입금되면', values: ['그 금융사에 걸어 둔 운용지시가 있으면 한꺼번에 그 비율대로 들어가요. 입금 전에 확인하세요', '운용지시 전까지 현금으로 기다려요'] },
      { label: '나중에 일부만 필요할 때', values: [known ? `${won(saved + c.pay)}을 전부 해지해야 해요` : '세액공제용 돈까지 전부 해지해야 해요', `퇴직금 ${won(c.pay)}만 해지하면 돼요`] },
      { label: '그때 꺼내게 되는 돈', values: [known ? `퇴직금 ${won(c.pay)} + 세액공제용 ${won(saved)}` : `퇴직금 ${won(c.pay)} + 세액공제용 돈`, `퇴직금 ${won(c.pay)}`], strong: true },
      { label: '퇴직금에서 떼는 세금 (예상)', values: [won(tax), won(tax)] },
      { label: '세액공제용 돈에서 떼는 세금', values: [known ? `${won(mix)} (16.5%)` : `16.5%. ${ask}`, '없어요. 그대로 남아요'] },
      { label: '받았던 세액공제를 빼면', values: [known ? `더 내는 돈은 ${won(net[0])} ~ ${won(net[1])}` : ask, '해당 없어요'] },
    ] as Row[],
  };
}

// 그대로 두기 / 다른 돈으로 메우기 / 해지하기를 나란히. need를 주면 저장하지 않고 그 값으로만 셈한다.
export function compare(c: Case, need: Need | undefined = c.need) {
  const o = options(c);
  const pick = c.choice === 'merge' ? o.merge : o.separate;
  const amount = need?.amount ?? 0;
  const stay = c.choice === 'merge' ? 0 : o.saved;
  const years = PENSION_AGE - AGE;
  const range = `약 ${man(c.pay * 1.03 ** years)} ~ ${man(c.pay * 1.05 ** years)}`;
  const all = won(o.saved + c.pay);
  const gap = pick.breakAmount - amount;
  return {
    exact: c.stage === 'arrived' || c.stage === 'closed',
    known: o.known || c.choice !== 'merge',
    amount,
    breakAmount: pick.breakAmount,
    withheld: pick.withheld,
    receive: pick.breakAmount - pick.withheld,
    gap,
    years,
    rows: [
      { label: '깨는 금액', values: ['0원', '0원', won(pick.breakAmount)] },
      { label: '필요한 금액과의 차이', values: ['-', '-', amount ? `${won(gap)}을 더 깨요` : '필요한 금액을 넣어 주세요'], strong: true },
      { label: '지금 떼는 금액', values: ['0원', '0원', won(pick.withheld)] },
      { label: '손에 쥐는 돈', values: ['0원', amount ? `${won(amount)} (다른 돈)` : '-', won(pick.breakAmount - pick.withheld)] },
      { label: 'IRP에 남는 돈', values: [all, all, won(stay)] },
      { label: `퇴직금을 ${PENSION_AGE}세까지 둘 때 (${years}년, 연 3~5% 가정)`, values: [range, range, '0원'] },
    ] as Row[],
  };
}

// 법에서 정한 사유면 퇴직금 일부만 꺼내는 길이 있다
export function partial(c: Case, need: Need | undefined = c.need) {
  if (!need?.amount) return null;
  const r = REASONS[need.reason];
  if (!r.can) return null;
  const p = partialTax(c.pay, c.years, need.amount, r.low);
  return {
    ...p,
    capped: need.amount > c.pay,
    papers: r.papers,
    rows: [
      { label: '꺼내는 금액', values: [won(p.take)] },
      { label: r.low ? '떼는 세금 (퇴직소득세의 70%)' : '떼는 세금 (꺼내는 만큼의 퇴직소득세)', values: [won(p.tax)] },
      { label: '손에 쥐는 돈', values: [won(p.receive)], strong: true },
      { label: 'IRP에 남는 퇴직금', values: [won(p.left)] },
    ] as Row[],
  };
}

export function deadlines(c: Case) {
  const payDue = c.received === 'irp' ? addDays(c.quitDate, PAY_DAYS) : null;
  const deferDue = c.cashPaidAt ? addDays(c.cashPaidAt, DEFER_DAYS) : null;
  return {
    payDue,
    payLate: payDue && !c.arrivedAt ? Math.max(0, daysBetween(payDue, today())) : 0,
    deferDue,
    deferLeft: deferDue && c.stage === 'cash' ? Math.max(0, daysBetween(today(), deferDue)) : null,
  };
}

export function timeline(c: Case) {
  const day = today();
  const d = deadlines(c);
  const item = (label: string, date: string | undefined, done: boolean, note: string) => ({ label, date: date ?? '', done, note });
  if (c.received === 'cash') {
    return [
      item('퇴사', c.quitDate, true, ''),
      item('퇴직금을 통장으로 받음', c.cashPaidAt, true, `퇴직소득세 ${won(retireTax(c.pay, c.years).tax)}을 떼고 받았어요.`),
      item('IRP에 넣을 수 있는 마지막 날', d.deferDue!, c.stage !== 'cash', `받은 날부터 ${DEFER_DAYS}일이에요. 이날까지 넣으면 뗀 세금을 돌려받아요.`),
      item('IRP 입금 확인', c.arrivedAt, !!c.arrivedAt, c.arrivedAt ? '과세이연 처리를 확인했어요.' : `오늘 기준 ${d.deferLeft}일 남았어요.`),
    ];
  }
  return [
    item('받을 계좌 정하기', undefined, !!c.choice, c.choice ? (c.choice === 'merge' ? '기존 IRP로 받기로 했어요.' : '하나증권에 새 IRP를 열어 따로 받기로 했어요.') : '입금 전에만 고를 수 있어요.'),
    ...(c.choice === 'separate' ? [item('하나증권 IRP 열기', c.openedAt, !!c.openedAt, c.openedAt ? '휴대폰에서 본인 확인을 하고 열었어요.' : '휴대폰에서 손님이 직접 열어요.')] : []),
    item('회사에 서류 내기', c.papersAt, !!c.papersAt, c.papersAt ? '계좌 확인 서류를 회사에 냈어요.' : '손님이 직접 내요.'),
    item('퇴사', c.quitDate, day >= c.quitDate, ''),
    item('회사의 지급 기한', d.payDue!, !!c.arrivedAt || day > d.payDue!, `퇴사 뒤 ${PAY_DAYS}일 안에 지급해야 해요.`),
    item('입금 확인', c.arrivedAt, !!c.arrivedAt, c.arrivedAt ? '퇴직금과 과세이연 처리를 확인했어요.' : '들어오면 알려 드려요.'),
  ];
}

export function nextStep(c: Case | null) {
  if (!c) return { text: '퇴사가 정해졌으면 상황을 알려 주세요.', to: 'home', label: '상황 알리기' };
  if (c.stage === 'account') return { text: '퇴직금을 받을 계좌를 정할 차례예요. 입금 전에만 고를 수 있어요.', to: 'account', label: '받을 계좌 정하기' };
  if (c.stage === 'papers' && c.choice === 'separate' && !c.openedAt) return { text: '하나증권 IRP를 휴대폰에서 열 차례예요. 열고 나면 회사에 낼 서류가 채워져요.', to: 'papers', label: '계좌 열기 안내 보기' };
  if (c.stage === 'papers') return { text: '회사에 낼 서류가 준비됐어요. 내는 일은 손님이 직접 해요.', to: 'papers', label: '회사에 낼 것 보기' };
  if (c.stage === 'waiting') return { text: `회사의 지급 기한은 ${dot(addDays(c.quitDate, PAY_DAYS))}이에요. 들어오면 알려 드려요.`, to: 'timeline', label: '일정 보기' };
  if (c.stage === 'cash') return { text: `${dot(addDays(c.cashPaidAt!, DEFER_DAYS))}까지 IRP에 넣으면 뗀 세금을 돌려받아요.`, to: 'timeline', label: '남은 날 보기' };
  if (c.stage === 'arrived') return { text: '퇴직금이 들어왔어요. 돈이 필요해지면 깨기 전에 먼저 비교해 보세요.', to: 'withdraw', label: '꺼내기 전 비교' };
  return { text: c.outcome !== 'close' ? '정한 대로 마쳤어요. IRP는 그대로예요.' : c.choice === 'merge' ? '해지하기로 정하셨어요. 실행은 계좌가 있는 금융사에서 해요.' : '해지를 마쳤어요.', to: 'log', label: '기록 보기' };
}
