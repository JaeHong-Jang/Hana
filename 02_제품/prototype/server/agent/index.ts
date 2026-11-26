// 길잡이가 한 번 답하는 순서: (1) 들어온 말 검사 → (2) 알아듣기 → (3) 도구 실행 → (4) 답 짓기 → (5) 나가는 답 검사.
// 거친 일은 실행 기록(Run)에 그대로 남고, 화면의 "어떻게 답했나요"가 그 기록을 보여 준다.
// 길잡이는 사건을 바꾸지 못한다. 바꿀 일은 제안으로 내고, 손님이 받아들이면 case.ts가 실행한다.
import { DEFER_DAYS, REASONS, won } from '../tax';
import { next, record, s, say, today, type Block, type Call, type Case, type Facts, type Need, type ProposalKind, type Run } from '../store';
import * as cases from '../case';
import { INTENT_NAME, understand, type Intent, type Slots } from './brain';
import { GATE_NAME, check, collect, gate } from './guard';
import { TOOLS, type ToolName } from './tools';

const SLOT_NAME: Record<keyof Slots, string> = { quitDate: '퇴사일', years: '근속', pay: '퇴직금', amount: '필요한 돈', reason: '사유', cash: '통장으로 받음' };
const QUESTION = { quitDate: '퇴사일은 언제인가요?', years: '근속 기간은 몇 년인가요?', pay: '예상 퇴직금은 얼마인가요? 입금 전 금액은 제가 조회할 수 없어서 여쭤봐요.' } as const;
const NEUTRAL = '어느 쪽이 낫다고 말씀드리지는 않아요.';

export function ask(text: string) {
  say([{ t: 'text', text }], 'me');
  const run: Run = { id: next(), at: s.now, text, intents: [], slots: [], calls: [], gate: '', check: { amounts: 0, unknown: [], banned: [], ok: true } };
  const facts = new Set<string>();
  collect(text, facts);
  // (3) 도구는 이 함수로만 부른다. 부른 것과 받은 것이 기록에 남고, 받은 수는 답 검사에 쓰인다.
  const use = <K extends ToolName>(name: K, arg?: Parameters<(typeof TOOLS)[K]['run']>[0]): ReturnType<(typeof TOOLS)[K]['run']>['out'] => {
    const tool = TOOLS[name];
    const res = (tool.run as (a: unknown) => { out: unknown; note: string })(arg);
    const call: Call = { tool: name, title: tool.title, kind: tool.kind, input: brief(arg), output: res.note };
    run.calls.push(call);
    collect(res.out, facts);
    return res.out as never;
  };
  const propose = (kind: ProposalKind, payload: Facts = {}): Block => ({ t: 'proposal', id: use('propose', { kind, payload }).id });

  // (1) 들어온 말 검사
  const g = gate(text);
  run.gate = GATE_NAME[g];
  let blocks: Block[];
  if (g === 'invest') blocks = [{ t: 'text', text: '입금 뒤 무엇을 살지와 대출 상품은 다루지 않아요. 운용은 AI 연금프로나 연금 상담에서 도와드려요.' }];
  else if (g === 'execute') blocks = [{ t: 'text', text: '계좌를 열거나 해지하는 일, 돈을 옮기는 일, 회사에 서류를 내는 일은 제가 대신할 수 없어요. 손님이 화면에서 직접 하시고, 저는 그 전에 볼 것을 준비해 드려요.' }, link(use('case.read').step)];
  else {
    // (2) 알아듣기
    const pending = s.proposals.find((p) => p.kind === 'open' && p.state === 'pending');
    const u = understand(text, today(), s.case ? undefined : pending?.payload.asking);
    run.intents = u.intents.map((i) => INTENT_NAME[i]);
    run.slots = (Object.keys(u.slots) as (keyof Slots)[]).filter((k) => u.slots[k] !== undefined).map((k) => `${SLOT_NAME[k]}: ${k === 'reason' ? REASONS[u.slots.reason!].label : k === 'pay' || k === 'amount' ? won(u.slots[k]!) : u.slots[k]}`);
    blocks = s.case ? withCase(s.case, text, u.intents, u.slots, use, propose) : withoutCase(u.intents, u.slots, u.points, pending?.payload, use, propose);
  }
  // (5) 나가는 답 검사. 도구가 셈하지 않은 금액이나 권하는 말이 섞였으면 보내지 않는다.
  run.check = check(blocks, facts);
  if (!run.check.ok) {
    record('비서', `답을 보내지 않았어요: ${[...run.check.unknown, ...run.check.banned].join(', ')}`);
    blocks = [{ t: 'text', text: '셈한 값과 맞지 않는 내용이 답에 섞여서 보내지 않았어요. 화면의 표를 봐 주세요.' }, link(use('case.read').step)];
  }
  s.runs.push(run);
  say(blocks, 'agent', run.id);
}

type Use = <K extends ToolName>(name: K, arg?: Parameters<(typeof TOOLS)[K]['run']>[0]) => ReturnType<(typeof TOOLS)[K]['run']>['out'];
type Propose = (kind: ProposalKind, payload?: Facts) => Block;
const link = (step: { to: string; label: string }): Block => ({ t: 'link', to: step.to, label: step.label });
const text = (x: string): Block => ({ t: 'text', text: x });
function brief(arg: unknown): string {
  if (!arg || typeof arg !== 'object') return '-';
  const a = arg as Record<string, unknown>;
  if ('stage' in a) return '열려 있는 사건';
  return (
    Object.entries(a)
      .map(([k, v]) => (k === 'c' ? '열려 있는 사건' : k === 'need' ? (v ? `필요한 돈 ${won((v as Need).amount)}, ${REASONS[(v as Need).reason].label}` : '') : k === 'payload' ? '' : `${k}=${typeof v === 'number' && v >= 10000 ? won(v) : v}`))
      .filter(Boolean)
      .join(', ') || '-'
  );
}

// 사건이 아직 없을 때: 말에서 뽑을 수 있는 것을 뽑고, 빠진 것만 하나씩 되묻는다
function withoutCase(intents: Intent[], sl: Slots, points: { name: string; why: string }[], prev: Facts | undefined, use: Use, propose: Propose): Block[] {
  if (intents[0] === 'which') return [text(`${NEUTRAL} 상황을 알려 주시면 달라지는 금액을 나란히 보여 드릴게요.`)];
  const got = sl.quitDate || sl.years || sl.pay || sl.amount || sl.reason || sl.cash;
  if (got || (!prev && intents.includes('status'))) {
    const d: Facts = { plan: 'unsure', received: 'irp', ...prev };
    if (sl.quitDate) d.quitDate = sl.quitDate;
    if (sl.years) d.years = sl.years;
    if (sl.pay) d.pay = sl.pay;
    if (sl.cash) d.received = 'cash';
    if (sl.amount || sl.reason) {
      d.need = { amount: sl.amount ?? d.need?.amount ?? 0, reason: sl.reason ?? d.need?.reason ?? 'living' };
      d.plan = 'yes';
    }
    d.asking = !d.quitDate ? 'quitDate' : !d.years ? 'years' : !d.pay ? 'pay' : undefined;
    const out: Block[] = [];
    if (!prev && points.length) out.push(text(`말씀에서 미리 정할 것 ${points.length}가지를 골랐어요.`), { t: 'points', items: points });
    if (sl.reason) use('withdraw.reason', { reason: sl.reason });
    out.push(propose('open', d));
    if (d.pay && d.years && !d.asking) {
      const est = use('tax.retire', { pay: d.pay, years: d.years });
      out.push(text(`지금 받으면 떼는 퇴직소득세는 ${won(est.tax)}으로 셈돼요. 맞으면 시작할게요. 틀린 곳은 다시 말씀해 주세요.`));
    } else out.push(text(d.asking ? QUESTION[d.asking] : '맞으면 시작할게요. 틀린 곳은 다시 말씀해 주세요.'));
    return out;
  }
  if (intents.includes('link')) return [linkBlock(use, propose)].flat();
  if (intents.includes('tax') && prev?.pay && prev.years) {
    const est = use('tax.retire', { pay: prev.pay, years: prev.years });
    return [text(`말씀하신 값으로 셈하면 떼는 퇴직소득세는 ${won(est.tax)}이에요.`), { t: 'table', title: '어떻게 셈했나요', head: ['금액'], rows: est.rows }];
  }
  use('case.read');
  return [text('퇴사일, 근속 기간, 예상 퇴직금을 알려 주시면 손님 금액으로 보여 드려요. 입금 전 금액은 제가 조회할 수 없어서 여쭤봐요. 세금만 먼저 보고 싶으면 계산기를 쓰셔도 돼요.'), { t: 'link', to: 'calc', label: '세금 계산기' }];
}

function linkBlock(use: Use, propose: Propose): Block[] {
  const a = use('accounts.read');
  return a.linked ? [text('다른 금융사 연금 계좌는 이미 읽고 있어요. 내 퇴직금 화면에서 언제든 끊을 수 있어요.')] : [text('다른 금융사에 있는 IRP는 손님이 동의하셔야 읽을 수 있어요. 읽기만 하고, 그 계좌에서 아무것도 바꾸지 못해요.'), propose('link')];
}

// 사건이 열려 있을 때: 알아들은 뜻마다 도구를 쓰고 답을 잇는다
function withCase(c: Case, raw: string, intents: Intent[], sl: Slots, use: Use, propose: Propose): Block[] {
  const out: Block[] = [];
  // 말 속에 사건과 다른 값이 있으면 고치자고 제안한다 (입금 전에만)
  const fix: Facts = {};
  if (sl.quitDate && sl.quitDate !== c.quitDate && /\d\s*월\s*\d+\s*일/.test(raw) && /퇴사|그만|바뀌|미뤄|당겨/.test(raw)) fix.quitDate = sl.quitDate;
  if (sl.years && sl.years !== c.years) fix.years = sl.years;
  if (sl.pay && sl.pay !== c.pay) fix.pay = sl.pay;
  if (Object.keys(fix).length && !c.arrivedAt && c.received === 'irp') {
    out.push(text('말씀하신 값이 적어 둔 것과 달라요. 고치면 세금과 일정을 다시 셈해요.'), propose('update', fix));
    intents = intents.filter((i) => i !== 'status' && i !== 'help');
  }
  const need: Need | undefined = sl.amount || sl.reason ? { amount: sl.amount ?? c.need?.amount ?? 0, reason: sl.reason ?? c.need?.reason ?? 'living' } : c.need;
  const cmpTable = (cmp = use('withdraw.compare', { c, need })): Block[] => {
    if (!cmp.known) return [text('기존 IRP로 받기로 하셨는데 그 계좌를 아직 읽지 못해서 깨는 금액을 셈하지 못했어요.'), propose('link')];
    return [{ t: 'table', title: cmp.exact ? '세 가지 경우 (확정 금액)' : '세 가지 경우 (입금 전 예상)', head: ['그대로 두기', '다른 돈으로', '해지하기'], rows: cmp.rows.slice(0, 4), note: '어느 쪽을 고를지는 손님이 정해요.' }];
  };

  for (const intent of intents) {
    if (intent === 'which') {
      if (!c.choice) out.push(text(`${NEUTRAL} 받을 계좌에 따라 달라지는 것을 나란히 보여 드릴게요.`), { t: 'link', to: 'account', label: '받을 계좌 정하기' });
      else out.push(text(`${NEUTRAL} 달라지는 금액을 나란히 보여 드릴게요.`), ...cmpTable(), { t: 'link', to: 'withdraw', label: '꺼내기 전 비교 보기' });
    } else if (intent === 'cash') {
      const d = use('deadline', c);
      out.push(
        text(c.received === 'cash' ? `받은 날부터 ${DEFER_DAYS}일 안에 IRP에 넣으면 뗀 퇴직소득세를 돌려받아요. 남은 날은 ${d.deferLeft ?? 0}일이에요. 과세이연계좌신고서는 채워 뒀어요.` : `통장으로 받으셨다면 받은 날부터 ${DEFER_DAYS}일 안에 IRP에 넣어 뗀 세금을 돌려받을 수 있어요. 지금 사건은 IRP로 받는 것으로 열려 있어요.`),
        { t: 'link', to: 'timeline', label: '일정 보기' },
      );
    } else if (intent === 'partial') {
      if (!c.choice) {
        use('accounts.read');
        out.push(text('IRP는 법에서 정한 사유가 아니면 일부만 꺼낼 수 없어요. 그래서 어느 계좌로 받느냐가 먼저예요.'), { t: 'link', to: 'account', label: '받을 계좌 정하기' });
        continue;
      }
      const r = need ? use('withdraw.reason', { reason: need.reason }) : null;
      const cmp = use('withdraw.compare', { c, need });
      const part = r?.can ? use('withdraw.partial', { c, need }) : null;
      if (r && part) {
        out.push(text(`쓰는 곳은 "${r.label}"로 알아들었어요. 법에서 정한 사유라서 퇴직금 일부만 꺼내는 길이 있어요. ${r.low ? '세금도 낮아요.' : '세금은 꺼내는 만큼의 퇴직소득세를 떼요.'}`));
        out.push({ t: 'table', title: '이 사유로 일부만 꺼낼 때', head: ['금액'], rows: part.rows, note: `필요한 서류: ${part.papers.join(', ')}. 금융사 안내를 따라요.` });
        out.push(text('계좌를 전부 해지하는 경우와 나란히 보면 이래요.'));
      } else out.push(text(`IRP는 법에서 정한 사유가 아니면 일부만 꺼낼 수 없어요.${cmp.known && cmp.amount ? ` ${won(cmp.amount)}이 필요해도 해지하면 ${won(cmp.breakAmount)}을 전부 깨야 해요.` : ''}${r ? ` 쓰는 곳은 "${r.label}"로 알아들었어요. ${r.note}` : ' 어디에 쓰실 돈인지에 따라 달라질 수 있어요.'}`));
      out.push(...cmpTable(cmp));
      if (need && (sl.amount || sl.reason) && (need.amount !== c.need?.amount || need.reason !== c.need?.reason)) out.push(propose('need', { need }));
      else out.push({ t: 'link', to: 'withdraw', label: '꺼내기 전 화면에서 보기' });
    } else if (intent === 'tax') {
      const est = use('tax.retire', { pay: c.pay, years: c.years });
      out.push(text(`퇴직금 ${won(c.pay)}을 지금 받으면 떼는 세금은 ${won(est.tax)}이에요.`), { t: 'table', title: '어떻게 셈했나요', head: ['금액'], rows: est.rows, note: '소득세법 제48조·제55조의 식이에요. 입금 뒤에는 계좌 기록의 확정 금액으로 바꿔 보여 드려요.' });
    } else if (intent === 'pension') {
      const pen = use('tax.pension', { pay: c.pay, years: c.years });
      out.push(text(`55세 뒤 연금으로 받으면 퇴직소득세 ${won(pen.tax)}을 줄여서 나눠 내요. 10년 차까지는 ${won(pen.first)}이에요.`), { t: 'table', title: '연금으로 받을 때', head: ['비율', '세금'], rows: pen.rows, note: '수익률과 물가는 넣지 않았어요.' });
    } else if (intent === 'account') {
      const a = use('accounts.read');
      const o = use('account.options', c);
      out.push(text('다른 금융사의 기존 IRP로 받을 때와 하나증권에 새로 열어 받을 때 달라지는 것이에요. 입금 전에만 고를 수 있어요.'));
      out.push({ t: 'table', title: '받을 계좌 두 가지', head: ['기존 IRP로', '하나증권에 새로'], rows: [o.rows[2], o.rows[3], o.rows[5], o.rows[6]], note: '고르는 일은 손님이 화면에서 직접 해요.' });
      if (!a.linked) out.push(text('기존 IRP에 든 돈은 아직 읽지 못했어요.'), propose('link'));
      out.push({ t: 'link', to: 'account', label: '받을 계좌 정하기' });
    } else if (intent === 'papers') {
      const list = use('docs.prepare', c);
      out.push(text(list.map((d) => `${d.title}: ${d.state === 'ready' ? '준비됐어요' : d.why}`).join('\n')), text('내는 일은 손님이 직접 해요.'), { t: 'link', to: c.choice ? 'papers' : 'account', label: c.choice ? '회사에 낼 것 보기' : '받을 계좌 정하기' });
    } else if (intent === 'late' || intent === 'arrived') {
      const d = use('deadline', c);
      use('accounts.read');
      const due = d.payDue ? d.payDue.slice(5).replace('-', '.') : '';
      out.push(
        text(c.arrivedAt ? `${c.arrivedAt.slice(5).replace('-', '.')}에 ${won(c.pay)}이 들어왔어요. 세금은 떼지 않고 미뤄졌어요.` : d.payLate ? `지급 기한(${due})에서 ${d.payLate}일이 지났는데 아직 들어오지 않았어요. 회사 담당자에게 지급일을 물어보세요.` : c.stage === 'waiting' ? `아직 들어오지 않았어요. 회사의 지급 기한은 ${due}이에요. 들어오면 바로 알려 드려요.` : '아직 회사에 서류를 내지 않으셨어요. 서류를 낸 뒤부터 입금을 지켜봐요.'),
        { t: 'link', to: 'timeline', label: '일정 보기' },
      );
    } else if (intent === 'link') out.push(...linkBlock(use, propose));
    else if (intent === 'human') out.push(c.handoff ? text('이미 상담 직원에게 넘겼어요. 상담은 평일 8시부터 17시까지예요.') : text('지금까지 본 내용을 요약해서 넘기면 처음부터 다시 설명하지 않으셔도 돼요.'), ...(c.handoff ? [] : [propose('handoff')]));
    else if (intent === 'alerts') out.push(text('무엇을 지켜보다가 어디로 알릴지는 알림 화면에서 정하실 수 있어요.'), { t: 'link', to: 'alerts', label: '알림 보기' });
    else {
      const step = use('case.read').step;
      out.push(text(intent === 'help' ? `받을 계좌, 회사에 낼 것, 입금 확인, 깨기 전 비교, 연금으로 받을 때의 세금을 물어보실 수 있어요. ${step.text}` : step.text), link(step));
    }
  }
  return out;
}

// 손님이 제안을 받아들이거나 물리친다. 받아들였을 때만 실행된다.
export function approve(id: number) {
  const p = s.proposals.find((x) => x.id === id);
  if (!p || p.state !== 'pending') throw new Error('이미 처리한 제안이에요.');
  if (!p.ready) throw new Error('아직 빠진 내용이 있어요.');
  if (p.kind === 'open') {
    if (s.case) throw new Error('이미 열려 있는 사건이 있어요.');
    cases.start(p.payload);
  } else if (p.kind === 'update') cases.update(p.payload);
  else if (p.kind === 'need') cases.setNeed(p.payload.need!);
  else if (p.kind === 'link') cases.link(true);
  else cases.handoff();
  p.state = 'approved';
  record('손님', `길잡이의 제안을 받아들였어요: ${p.title}`);
}
export function dismiss(id: number) {
  const p = s.proposals.find((x) => x.id === id);
  if (p?.state === 'pending') p.state = 'dismissed';
}
