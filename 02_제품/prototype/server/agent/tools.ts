// 길잡이가 쓸 수 있는 도구의 전부. 읽기·셈·준비·제안뿐이고, 상태를 바꾸는 도구는 없다.
// 도구마다 결과(out)와 한 줄 요약(note)을 돌려준다. 요약은 실행 기록에 남는다.
import { LAW, REASONS, pensionTax, retireTax, won, type ReasonId } from '../tax';
import { next, s, seen, total, type Case, type Facts, type Need, type Proposal, type ProposalKind } from '../store';
import { compare, deadlines, nextStep, options, partial } from '../quote';
import { docs } from '../docs';

const ymd = (d?: string) => (d ? d.replace(/-/g, '.') : '아직 몰라요');
const needText = (n?: Need) => (n ? `${n.amount ? won(n.amount) : '금액 모름'} (${REASONS[n.reason].label})` : '말씀 없었어요');

function proposalRows(kind: ProposalKind, f: Facts, c: Case | null): Proposal['rows'] {
  if (kind === 'open')
    return [
      { label: '퇴사일', value: ymd(f.quitDate), missing: !f.quitDate },
      { label: '근속 기간', value: f.years ? `${f.years}년` : '아직 몰라요', missing: !f.years },
      { label: '예상 퇴직금', value: f.pay ? won(f.pay) : '아직 몰라요', missing: !f.pay },
      { label: '받는 방식', value: f.received === 'cash' ? '이미 통장으로 받음' : 'IRP로 받을 예정' },
      { label: '꺼낼 일', value: needText(f.need) },
    ];
  if (kind === 'update')
    return [
      ...(f.quitDate ? [{ label: '퇴사일', value: `${ymd(c?.quitDate)} → ${ymd(f.quitDate)}` }] : []),
      ...(f.years ? [{ label: '근속 기간', value: `${c?.years}년 → ${f.years}년` }] : []),
      ...(f.pay ? [{ label: '예상 퇴직금', value: `${won(c?.pay ?? 0)} → ${won(f.pay)}` }] : []),
    ];
  if (kind === 'need') return [{ label: '필요한 돈', value: needText(f.need) }];
  if (kind === 'link')
    return [
      { label: '읽는 것', value: '다른 금융사 연금 계좌의 잔액과 재원 구분' },
      { label: '하지 않는 것', value: '이체, 해지, 운용지시' },
      { label: '끊기', value: '내 퇴직금 화면에서 언제든' },
    ];
  return docs(c!)
    .find((d) => d.id === 'brief')!
    .fields.map((x) => ({ label: x.k, value: x.v }));
}
const TITLE: Record<ProposalKind, string> = {
  open: '이렇게 알아들었어요',
  update: '이렇게 고칠까요?',
  need: '꺼내기 전 화면에 적어 둘까요?',
  link: '다른 금융사 IRP를 읽어도 될까요?',
  handoff: '이 내용으로 상담 직원에게 넘길까요?',
};

export const TOOLS = {
  'accounts.read': {
    title: '연금 계좌 읽기',
    kind: '읽기',
    desc: '하나증권 계좌와, 손님이 동의한 경우 다른 금융사 연금 계좌의 잔액과 재원 구분을 읽어요.',
    run: () => {
      const list = seen().map((a) => ({ name: a.name, retire: a.retire, own: a.own, gain: a.gain, total: total(a) }));
      return { out: { linked: s.linked, list }, note: list.length ? list.map((a) => `${a.name} ${won(a.total)}`).join(', ') : s.linked ? '계좌 없음' : '다른 금융사 계좌는 동의 전이라 읽지 못함' };
    },
  },
  'case.read': {
    title: '열려 있는 사건 읽기',
    kind: '읽기',
    desc: '손님이 알려 준 퇴사일·근속·퇴직금과 지금 단계를 읽어요.',
    run: () => {
      const c = s.case;
      return { out: { case: c, step: nextStep(c) }, note: c ? `단계 ${c.stage}, 퇴직금 ${won(c.pay)}, 근속 ${c.years}년` : '열린 사건 없음' };
    },
  },
  'tax.retire': {
    title: '퇴직소득세 모의계산',
    kind: '셈',
    desc: `퇴직금과 근속으로 퇴직소득세를 셈해요. ${LAW.retireTax}`,
    run: (a: { pay: number; years: number }) => {
      const out = retireTax(a.pay, a.years);
      return { out, note: `${won(a.pay)}, ${a.years}년 → ${won(out.tax)}` };
    },
  },
  'tax.pension': {
    title: '연금으로 받을 때의 세금',
    kind: '셈',
    desc: `55세 뒤 연금으로 받을 때 줄어드는 퇴직소득세를 셈해요. ${LAW.pension}`,
    run: (a: { pay: number; years: number }) => {
      const out = pensionTax(a.pay, a.years);
      return { out, note: `${won(out.tax)} → 10년 차까지 ${won(out.first)}` };
    },
  },
  'account.options': {
    title: '받을 계좌 비교',
    kind: '셈',
    desc: `기존 IRP로 받을 때와 새로 열어 받을 때 달라지는 것을 셈해요. ${LAW.mix}`,
    run: (c: Case) => {
      const out = options(c);
      return { out, note: out.known ? `섞으면 깨는 돈 ${won(out.merge.breakAmount)}, 따로면 ${won(out.separate.breakAmount)}` : `따로면 깨는 돈 ${won(out.separate.breakAmount)}. 기존 IRP 금액은 읽지 못함` };
    },
  },
  'withdraw.reason': {
    title: '인출 사유 대조',
    kind: '읽기',
    desc: `쓰는 곳이 일부 인출 사유인지, 세금이 낮은 사유인지 법의 목록과 맞춰 봐요. ${LAW.partial}, ${LAW.lowTax}`,
    run: (a: { reason: ReasonId }) => {
      const out = REASONS[a.reason];
      return { out, note: `${out.label}: 일부 인출 ${out.can ? '가능' : '불가'}, 세금 ${out.low ? '낮음' : '혜택 없음'}` };
    },
  },
  'withdraw.compare': {
    title: '세 가지 경우 비교',
    kind: '셈',
    desc: '그대로 두기, 다른 돈으로 메우기, 해지하기를 손님 금액으로 나란히 셈해요.',
    run: (a: { c: Case; need?: Need }) => {
      const out = compare(a.c, a.need);
      return { out, note: `해지하면 ${won(out.breakAmount)}을 깨고 ${won(out.withheld)}을 뗌${out.amount ? `. 필요한 돈보다 ${won(out.gap)} 더 깸` : ''}` };
    },
  },
  'withdraw.partial': {
    title: '일부 인출 셈',
    kind: '셈',
    desc: '법에서 정한 사유일 때 퇴직금 일부만 꺼내면 떼는 세금을 셈해요.',
    run: (a: { c: Case; need?: Need }) => {
      const out = partial(a.c, a.need);
      return { out, note: out ? `${won(out.take)}을 꺼내면 ${won(out.tax)}을 떼고 ${won(out.receive)}을 받음` : '일부 인출 사유가 아님' };
    },
  },
  deadline: {
    title: '기한 셈',
    kind: '셈',
    desc: `회사의 지급 기한과 통장으로 받은 뒤 60일을 셈해요. ${LAW.payDue}, ${LAW.defer}`,
    run: (c: Case) => {
      const out = deadlines(c);
      return { out, note: out.deferDue ? `IRP에 넣을 수 있는 마지막 날 ${ymd(out.deferDue)}` : `지급 기한 ${ymd(out.payDue!)}${out.payLate ? `, ${out.payLate}일 지남` : ''}` };
    },
  },
  'docs.prepare': {
    title: '서류 준비',
    kind: '준비',
    desc: '회사에 낼 서류와 보낼 글, 과세이연계좌신고서를 손님 값으로 채워 둬요. 내는 일은 손님이 해요.',
    run: (c: Case) => {
      const out = docs(c);
      return { out, note: out.map((d) => `${d.title}: ${d.state === 'ready' ? '준비됨' : d.why}`).join(' / ') };
    },
  },
  propose: {
    title: '손님에게 제안하기',
    kind: '제안',
    desc: '사건 열기, 내용 고치기, 계좌 연결, 상담 넘기기를 제안해요. 손님이 받아들여야 실행돼요.',
    run: (a: { kind: ProposalKind; payload: Facts }) => {
      // 같은 종류의 앞선 제안은 새 제안으로 바뀐다
      s.proposals.filter((p) => p.kind === a.kind && p.state === 'pending').forEach((p) => (p.state = 'replaced'));
      const rows = proposalRows(a.kind, a.payload, s.case);
      const ready = a.kind !== 'open' || !!(a.payload.quitDate && a.payload.years && a.payload.pay);
      const p: Proposal = { id: next(), at: s.now, kind: a.kind, title: TITLE[a.kind], rows, ready, payload: a.payload, state: 'pending' };
      s.proposals.push(p);
      return { out: p, note: `${p.title} (${ready ? '손님 확인 기다림' : '빠진 내용 있음'})` };
    },
  },
} as const;
export type ToolName = keyof typeof TOOLS;

// 길잡이에게 없는 권한. 화면의 권한 표와 거절하는 답이 이 목록을 쓴다.
export const DENIED = [
  { what: '계좌 개설·해지 실행', who: '손님이 본인 확인을 거쳐 직접' },
  { what: '이체·입금·운용지시', who: '손님이 직접' },
  { what: '회사에 서류 제출', who: '손님이 직접' },
  { what: '상품 추천, 어느 쪽이 낫다는 권유', who: '하지 않음. 필요하면 상담 직원에게' },
  { what: '세무 상담', who: '하지 않음. 정해진 식의 모의계산만' },
  { what: '금액 만들기', who: '도구가 셈한 값만 말함. 답에 다른 금액이 섞이면 보내지 않음' },
];
export const toolList = () => (Object.keys(TOOLS) as ToolName[]).map((name) => ({ name, title: TOOLS[name].title, kind: TOOLS[name].kind, desc: TOOLS[name].desc }));
