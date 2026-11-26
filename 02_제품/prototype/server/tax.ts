// 세금 셈과 법에서 정한 값. 상태를 모르고, 같은 값을 넣으면 같은 값이 나온다.
// 금액은 모두 이 파일의 식에서 나온다. 화면과 길잡이는 금액을 만들지 않는다.

export interface Row {
  label: string;
  values: string[];
  strong?: boolean;
}
export type ReasonId = 'living' | 'debt' | 'house' | 'lease' | 'care' | 'rehab' | 'disaster';

export const PAY_DAYS = 14; // 퇴직 후 지급 기한
export const DEFER_DAYS = 60; // 현금으로 받은 뒤 연금계좌에 넣을 수 있는 기한
export const MIX_RATE = 0.165; // 세액공제 받은 납입분과 운용수익의 연금외수령 (지방소득세 포함)
export const CREDIT_RATES = [0.132, 0.165]; // 납입할 때 받은 세액공제율 (소득에 따라 둘 중 하나)
export const PENSION_AGE = 55;
export const PENSION_CUTS = [
  { label: '실제 수령 10년 차까지', pct: 70 },
  { label: '11년 차부터', pct: 60 },
  { label: '21년 차부터', pct: 50 },
];

// 답과 표에 붙이는 근거 이름
export const LAW = {
  retireTax: '소득세법 제48조·제55조 (퇴직소득세)',
  defer: '소득세법 제146조 제2항 (60일 안에 넣으면 과세이연)',
  payDue: '근로자퇴직급여 보장법 제9조 (퇴직 후 14일 안에 지급)',
  mix: '소득세법 제21조·제129조 (연금외수령 16.5%, 지방소득세 포함)',
  pension: '소득세법 제129조 제1항 제5호의3 (연금 수령 시 감면)',
  partial: '근로자퇴직급여 보장법 시행령 제18조 (IRP 중도인출 사유)',
  lowTax: '소득세법 시행령 제20조의2 (부득이한 사유)',
  onePer: '금융사마다 한 사람에 IRP 한 계좌 (고용노동부 행정해석, 금융감독원 안내)',
} as const;

export const won = (n: number) => `${Math.floor(n).toLocaleString('ko-KR')}원`;
export const man = (n: number) => `${Math.round(n / 10000).toLocaleString('ko-KR')}만 원`;

// 인출 사유. "꺼낼 수 있는가"와 "세금이 낮은가"는 서로 다른 법이 정한다.
export const REASONS: Record<ReasonId, { label: string; can: boolean; low: boolean; note: string; papers: string[] }> = {
  living: { label: '생활비', can: false, low: false, note: '법에서 정한 사유가 아니라서 일부만 꺼낼 수 없어요. 계좌를 전부 해지해야 해요.', papers: [] },
  debt: { label: '대출 갚기', can: false, low: false, note: '법에서 정한 사유가 아니라서 일부만 꺼낼 수 없어요. 계좌를 전부 해지해야 해요.', papers: [] },
  house: { label: '집 사기 (무주택)', can: true, low: false, note: '일부만 꺼낼 수 있어요. 다만 세금은 해지할 때와 같은 방식으로 떼요.', papers: ['매매계약서', '무주택 확인 서류'] },
  lease: { label: '전세·임차 보증금 (무주택)', can: true, low: false, note: '일부만 꺼낼 수 있어요. 다만 세금은 해지할 때와 같은 방식으로 떼요.', papers: ['임대차계약서', '무주택 확인 서류'] },
  care: { label: '오래 걸리는 요양', can: true, low: true, note: '일부만 꺼낼 수 있고 세금도 낮아요. 요양 기간 기준이 두 법에서 달라 서류 확인이 필요해요.', papers: ['진단서', '의료비 영수증'] },
  rehab: { label: '파산·개인회생', can: true, low: true, note: '일부만 꺼낼 수 있고 세금도 낮아요.', papers: ['법원의 파산선고 또는 회생절차 개시 결정문'] },
  disaster: { label: '재난 피해', can: true, low: true, note: '일부만 꺼낼 수 있고 세금도 낮아요.', papers: ['피해사실확인서'] },
};

function serviceDeduction(years: number) {
  if (years <= 5) return 1000000 * years;
  if (years <= 10) return 5000000 + 2000000 * (years - 5);
  if (years <= 20) return 15000000 + 2500000 * (years - 10);
  return 40000000 + 3000000 * (years - 20);
}
function convertedDeduction(x: number) {
  if (x <= 8000000) return x;
  if (x <= 70000000) return 8000000 + (x - 8000000) * 0.6;
  if (x <= 100000000) return 45200000 + (x - 70000000) * 0.55;
  if (x <= 300000000) return 61700000 + (x - 100000000) * 0.45;
  return 151700000 + (x - 300000000) * 0.35;
}
const BRACKETS: [number, number, number][] = [
  [14000000, 0.06, 0],
  [50000000, 0.15, 1260000],
  [88000000, 0.24, 5760000],
  [150000000, 0.35, 15440000],
  [300000000, 0.38, 19940000],
  [500000000, 0.4, 25940000],
  [1000000000, 0.42, 35940000],
  [Infinity, 0.45, 65940000],
];
const basicTax = (base: number) => {
  const [, rate, minus] = BRACKETS.find(([top]) => base <= top)!;
  return Math.max(0, base * rate - minus);
};

// 퇴직소득세: 근속연수공제 → 환산급여 → 환산급여공제 → 세율 → × 근속 ÷ 12, 지방소득세 10%
export function retireTax(pay: number, years: number) {
  const ded1 = Math.min(pay, serviceDeduction(years));
  const converted = Math.floor(((pay - ded1) * 12) / years);
  const ded2 = Math.floor(convertedDeduction(converted));
  const base = Math.max(0, converted - ded2);
  const income = Math.floor((basicTax(base) * years) / 12);
  const local = Math.floor(income * 0.1);
  return {
    tax: income + local,
    rows: [
      { label: '퇴직금', values: [won(pay)] },
      { label: `근속연수공제 (${years}년)`, values: [`- ${won(ded1)}`] },
      { label: '환산급여 (× 12 ÷ 근속연수)', values: [won(converted)] },
      { label: '환산급여공제', values: [`- ${won(ded2)}`] },
      { label: '과세표준', values: [won(base)] },
      { label: '퇴직소득세 (세율 적용 뒤 × 근속연수 ÷ 12)', values: [won(income)] },
      { label: '지방소득세 10%', values: [won(local)] },
      { label: '합계', values: [won(income + local)], strong: true },
    ] as Row[],
  };
}

// 55세 뒤 연금으로 받으면 퇴직소득세를 줄여서 나눠 낸다
export function pensionTax(pay: number, years: number) {
  const tax = retireTax(pay, years).tax;
  return {
    tax,
    first: Math.floor((tax * PENSION_CUTS[0].pct) / 100),
    rows: PENSION_CUTS.map((c) => ({ label: c.label, values: [`퇴직소득세의 ${c.pct}%`, won(Math.floor((tax * c.pct) / 100))] })) as Row[],
  };
}

// 법에서 정한 사유로 퇴직금 일부만 꺼낼 때. 꺼내는 만큼의 퇴직소득세만 뗀다. 부득이한 사유면 70%.
export function partialTax(pay: number, years: number, amount: number, low: boolean) {
  const take = Math.min(amount, pay);
  const tax = Math.floor((retireTax(pay, years).tax * take * (low ? PENSION_CUTS[0].pct : 100)) / pay / 100);
  return { take, tax, receive: take - tax, left: pay - take };
}

// 계산기: 받는 방식 세 가지와 근속에 따른 세금
export function simulate(pay: number, years: number) {
  const est = retireTax(pay, years);
  const pen = pensionTax(pay, years);
  return {
    pay,
    years,
    tax: est.tax,
    steps: est.rows,
    head: ['지금 통장으로 받기', 'IRP로 받은 뒤 해지하기', `${PENSION_AGE}세 뒤 연금으로 받기`],
    ways: [
      { label: '퇴직금에서 떼는 세금', values: [won(est.tax), won(est.tax), `${won(pen.first)} (10년 차까지 받을 때)`], strong: true },
      { label: '언제 떼나요', values: ['받을 때 바로', '해지할 때', '받을 때마다 나눠서'] },
      { label: '세금을 뗀 퇴직금', values: [won(pay - est.tax), won(pay - est.tax), won(pay - pen.first)] },
      { label: '지금 받을 때와의 세금 차이', values: ['-', won(0), won(est.tax - pen.first)] },
    ] as Row[],
    byYears: [1, 3, 5, 10, 20].map((y) => ({ label: `근속 ${y}년`, values: [won(retireTax(pay, y).tax)], strong: y === years })) as Row[],
    pension: pen.rows,
  };
}
