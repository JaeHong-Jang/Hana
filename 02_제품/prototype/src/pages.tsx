import { useState, type ReactNode } from 'react';
import { Copy, MessageSquareText, Smartphone } from 'lucide-react';
import { day, won, type Choice, type Ctx, type Outcome, type Page, type Plan, type ReasonId, type Row } from './api';

const REASON_LABEL: Record<ReasonId, string> = {
  living: '생활비',
  debt: '대출 갚기',
  house: '집 사기 (무주택)',
  lease: '전세·임차 보증금 (무주택)',
  care: '오래 걸리는 요양',
  rehab: '파산·개인회생',
  disaster: '재난 피해',
};
const STEPS = ['받을 계좌', '회사에 서류', '입금 기다리기', '입금 확인', '마침'];
const STEP_OF = { account: 0, papers: 1, waiting: 2, cash: 2, arrived: 3, closed: 4 } as const;

// 길잡이가 화면 안에서 건네는 한 줄. 점선 테두리와 이름표로 AI가 한 말임을 밝힌다.
export function AgentNote({ children, actions }: { children: ReactNode; actions?: ReactNode }) {
  return (
    <div className="note">
      <span className="who">
        <MessageSquareText size={16} aria-hidden="true" />
        퇴직금 길잡이
      </span>
      <p>{children}</p>
      <div className="btns">{actions}</div>
    </div>
  );
}

export function Overview({ items }: { items: { label: string; value: string; out?: boolean }[] }) {
  return (
    <div className="over">
      {items.map((it) => (
        <div key={it.label}>
          <span>{it.label}</span>
          <strong className={it.out ? 'num out' : 'num'}>{it.value}</strong>
        </div>
      ))}
    </div>
  );
}

// 줄마다 이름과 값이 있는 표. 뒷단이 만든 줄을 그대로 그린다.
export function Rows({ head, rows, picked }: { head: string[]; rows: Row[]; picked?: number }) {
  return (
    <table className="tbl text num">
      <thead>
        <tr>
          <th />
          {head.map((h, i) => (
            <th key={h} className={i === picked ? 'on' : undefined}>
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.label} className={r.strong ? 'strong' : undefined}>
            <td>{r.label}</td>
            {r.values.map((x, i) => (
              <td key={i} className={i === picked ? 'on' : undefined}>
                {x}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Empty({ text, to, label, go }: { text: string; to: Page; label: string; go: Ctx['go'] }) {
  return (
    <div className="empty">
      <p>{text}</p>
      <button type="button" className="btn pri" onClick={() => go(to)}>
        {label}
      </button>
    </div>
  );
}

// ---------- 내 퇴직금 ----------
const EXAMPLES = ['다음 달에 퇴사하는데 전세 잔금 300만 원이 걸려 있어요', '5년 다닌 회사를 12월 11일에 그만둬요. 퇴직금은 1500만 원쯤이에요', '퇴직금을 이미 통장으로 받았어요'];

export function Home({ v, act, go, openAgent }: Ctx) {
  const [line, setLine] = useState('');
  const [f, setF] = useState({ quitDate: '2026-12-11', years: 5, pay: 1500, plan: 'unsure' as Plan, received: 'irp' as 'irp' | 'cash' });
  const c = v.case;
  const main = v.accounts.find((a) => a.id === 'main');
  const fresh = v.notices.find((n) => n.state === 'new');

  const accounts = (
    <section className={c ? 'card span7' : 'card span12'}>
      <h2>내 IRP 계좌</h2>
      <table className="plain num">
        <thead>
          <tr>
            <th>계좌</th>
            <th>퇴직금</th>
            <th>본인 납입 (세액공제)</th>
            <th>운용수익</th>
            <th>합계</th>
          </tr>
        </thead>
        <tbody>
          {v.accounts.length === 0 && (
            <tr>
              <td colSpan={5}>하나증권에는 아직 IRP가 없어요.</td>
            </tr>
          )}
          {v.accounts.map((a) => (
            <tr key={a.id}>
              <td>
                <b>{a.name}</b>
                <small>{a.closed ? '해지함' : a.outside ? '손님이 켠 마이데이터로 읽었어요' : '하나증권 계좌'}</small>
              </td>
              <td>{won(a.retire)}</td>
              <td>{won(a.own)}</td>
              <td>{won(a.gain)}</td>
              <td>
                <b>{won(a.total)}</b>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="btns end">
        <span className="hint">{v.linked ? '다른 금융사 연금 계좌를 읽고 있어요. 읽기만 하고 그 계좌에서 아무것도 바꾸지 못해요.' : '다른 금융사에 있는 연금 계좌는 손님이 동의하셔야 읽어요. 읽기만 해요.'}</span>
        <button type="button" className="btn" onClick={() => act('link', { on: !v.linked }, v.linked ? '연결을 끊었어요.' : '다른 금융사 연금 계좌를 읽었어요.')}>
          {v.linked ? '연결 끊기' : '다른 금융사 연금 계좌 불러오기'}
        </button>
      </div>
    </section>
  );

  if (!c)
    return (
      <div className="grid">
        <section className="card span7">
          <h2>상황을 한 문장으로 말해 주세요</h2>
          <p className="muted">길잡이가 말씀에서 날짜, 기간, 금액을 뽑고 빠진 것만 되물어요. 입금 전 금액은 조회할 수 없어서 여쭤봐요.</p>
          <form className="say-form" onSubmit={(e) => { e.preventDefault(); if (line.trim()) { openAgent(line.trim()); setLine(''); } }}>
            <input value={line} onChange={(e) => setLine(e.target.value)} placeholder="예: 다음 달에 퇴사하는데 전세 잔금 300만 원이 걸려 있어요" aria-label="상황을 한 문장으로" maxLength={200} />
            <button type="submit" className="btn pri">
              길잡이에게 말하기
            </button>
          </form>
          <div className="eg">
            {EXAMPLES.map((q) => (
              <button type="button" key={q} onClick={() => openAgent(q)}>
                {q}
              </button>
            ))}
          </div>
          <details className="manual">
            <summary>말로 하지 않고 직접 넣기</summary>
            <form className="form" onSubmit={(e) => { e.preventDefault(); void act('start', { ...f, pay: f.pay * 10000 }, '상황을 알려 주셨어요.'); }}>
            <label>
              퇴사일
              <input type="date" value={f.quitDate} onChange={(e) => setF({ ...f, quitDate: e.target.value })} />
            </label>
            <label>
              근속 기간 (년)
              <input type="number" min={1} max={40} value={f.years} onChange={(e) => setF({ ...f, years: Number(e.target.value) })} />
            </label>
            <label>
              예상 퇴직금 (만 원)
              <input type="number" min={0} step={10} value={f.pay} onChange={(e) => setF({ ...f, pay: Number(e.target.value) })} />
            </label>
            <label>
              나중에 꺼낼 일이 있을까요?
              <select value={f.plan} onChange={(e) => setF({ ...f, plan: e.target.value as Plan })}>
                <option value="yes">있어요</option>
                <option value="no">없어요</option>
                <option value="unsure">모르겠어요</option>
              </select>
            </label>
            <label>
              어떻게 받나요?
              <select value={f.received} onChange={(e) => setF({ ...f, received: e.target.value as 'irp' | 'cash' })}>
                <option value="irp">IRP로 받을 예정이에요</option>
                <option value="cash">이미 통장으로 받았어요</option>
              </select>
            </label>
            <button type="submit" className="btn pri">
              상황 알리기
            </button>
          </form>
          </details>
        </section>
        <section className="card span5">
          <h2>미리 정할 것 다섯 가지</h2>
          <ol className="five">
            <li>
              <b>어느 계좌로 받을지</b>
              <span>입금 전에만 고를 수 있어요.</span>
            </li>
            <li>
              <b>걸어 둔 운용지시</b>
              <span>있으면 퇴직금이 한꺼번에 들어가요.</span>
            </li>
            <li>
              <b>일부만 필요할 때</b>
              <span>IRP는 일부만 꺼낼 수 없어요.</span>
            </li>
            <li>
              <b>꺼내는 사유</b>
              <span>꺼낼 수 있는 사유와 세금이 낮은 사유가 달라요.</span>
            </li>
            <li>
              <b>통장으로 받은 뒤 60일</b>
              <span>그 안에 넣으면 뗀 세금을 돌려받아요.</span>
            </li>
          </ol>
        </section>
        {accounts}
      </div>
    );

  const step = STEP_OF[c.stage];
  return (
    <>
      {fresh ? (
        <AgentNote
          actions={
            <>
              <button type="button" className="btn" onClick={() => act('later', { id: fresh.id })}>
                확인했어요
              </button>
              <button type="button" className="btn pri" onClick={() => go(fresh.to as Page)}>
                {fresh.label}
              </button>
            </>
          }
        >
          {fresh.text}
        </AgentNote>
      ) : (
        <AgentNote
          actions={
            <button type="button" className="btn pri" onClick={() => go(v.next.to as Page)}>
              {v.next.label}
            </button>
          }
        >
          {v.next.text}
        </AgentNote>
      )}
      <Overview
        items={[
          { label: c.arrivedAt ? '들어온 퇴직금' : '예상 퇴직금', value: won(c.pay) },
          { label: '지금 받으면 떼는 세금', value: won(v.est?.tax ?? 0), out: true },
          v.deferLeft !== null ? { label: 'IRP에 넣을 수 있는 날', value: `${v.deferLeft}일 남음` } : { label: '회사의 지급 기한', value: v.payDue ? day(v.payDue) : '-' },
          { label: '세액공제용으로 모은 돈', value: main ? won(main.own + main.gain) : '연결 전이에요' },
        ]}
      />
      <ol className="steps" aria-label="진행 단계">
        {STEPS.map((s, i) => (
          <li key={s} className={i < step ? 'done' : i === step ? 'now' : undefined}>
            <i>{i + 1}</i>
            {s}
          </li>
        ))}
      </ol>
      <div className="grid">
        {accounts}
        <section className="card span5">
          <h2>
            누가 무엇을 하나요
            <a href="#log">기록 보기</a>
          </h2>
          <ol className="roles">
            {v.plan.map((x) => (
              <li key={x.text} className={x.state}>
                <span className={x.who === '손님' ? 'chip' : 'chip ai'}>{x.who === '손님' ? '손님' : '길잡이'}</span>
                <span>{x.text}</span>
                <em>{x.state === 'done' ? '끝남' : x.state === 'now' ? '지금' : ''}</em>
              </li>
            ))}
          </ol>
        </section>
        {c.tasks.length > 0 && (
          <section className="card span12">
            <h2>
              손님이 챙길 일
              <a href="#alerts">알림 설정</a>
            </h2>
            <ul className="tasks">
              {c.tasks.map((x) => (
                <li key={x.id} className={x.done ? 'done' : undefined}>
                  <label>
                    <input type="checkbox" checked={x.done} onChange={() => act('task', { id: x.id })} />
                    {x.text}
                  </label>
                  {x.due && <time className="num">{day(x.due)}까지</time>}
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </>
  );
}

// ---------- 받을 계좌 ----------
const ACCOUNT_OPTS: { id: Choice; name: string; note: string }[] = [
  { id: 'merge', name: '기존 IRP로 받기', note: '다른 금융사에 세액공제용으로 모으던 계좌에 퇴직금을 함께 넣어요.' },
  { id: 'separate', name: '하나증권에 새로 열어 받기', note: '하나증권에 IRP를 새로 열고 퇴직금만 따로 받아요.' },
];
const PLAN_TEXT: Record<Plan, string> = {
  yes: '나중에 꺼낼 일이 있다고 하셨어요.',
  no: '나중에 꺼낼 일이 없다고 하셨어요.',
  unsure: '나중에 꺼낼 일이 있을지 모르겠다고 하셨어요.',
};

export function Account({ v, act, go, openAgent }: Ctx) {
  const c = v.case;
  const [pick, setPick] = useState<Choice | null>(null);
  if (!c || !v.options) return <Empty text="퇴사 상황을 먼저 알려 주세요." to="home" label="상황 알리기" go={go} />;
  if (c.received === 'cash') return <Empty text="통장으로 받으신 경우예요. 60일 안에 IRP에 넣을지는 일정에서 정해요." to="timeline" label="일정 보기" go={go} />;
  const locked = c.stage !== 'account' && c.stage !== 'papers';
  const choice = pick ?? c.choice ?? null;
  const picked = choice === 'merge' ? 0 : choice === 'separate' ? 1 : undefined;
  return (
    <>
      {!v.linked && (
        <section className="box row">
          <div>
            <h2>기존 IRP에 든 돈을 아직 읽지 못했어요</h2>
            <p>다른 금융사 계좌는 손님이 동의하셔야 읽어요. 읽으면 아래 표의 빈칸이 손님 금액으로 채워져요.</p>
          </div>
          <button type="button" className="btn" onClick={() => act('link', { on: true }, '다른 금융사 연금 계좌를 읽었어요.')}>
            다른 금융사 연금 계좌 불러오기
          </button>
        </section>
      )}
      <AgentNote
        actions={
          <button type="button" className="btn" onClick={() => openAgent('깨면 얼마 떼요?')}>
            세금 셈 보기
          </button>
        }
      >
        {PLAN_TEXT[c.plan]} 그 경우 달라지는 줄은 <b>나중에 일부만 필요할 때</b>와 <b>그때 꺼내게 되는 돈</b>이에요. 어느 쪽이 낫다고 말씀드리지는 않아요.
      </AgentNote>
      <div className="opts two" role="radiogroup" aria-label="퇴직금을 받을 계좌">
        {ACCOUNT_OPTS.map((o) => (
          <button type="button" role="radio" key={o.id} aria-checked={choice === o.id} disabled={locked} onClick={() => setPick(o.id)}>
            <i />
            <b>{o.name}</b>
            <small>{o.note}</small>
          </button>
        ))}
      </div>
      <Rows head={ACCOUNT_OPTS.map((o) => o.name)} rows={v.options.rows} picked={picked} />
      <div className="btns end">
        <span className="hint">
          {locked ? '입금 뒤에는 받을 계좌를 바꿀 수 없어요.' : '금액은 넣어 주신 값으로 셈한 예상이에요. IRP는 금융사마다 한 계좌라서, 따로 받으려면 세액공제용 IRP가 없는 금융사에 열어야 해요.'}
        </span>
        <button
          type="button"
          className="btn pri"
          disabled={locked || !choice}
          onClick={() => void act('choose', { choice }, '받을 계좌를 정했어요.').then(() => go('papers'))}
        >
          이 계좌로 받기
        </button>
      </div>
    </>
  );
}

// ---------- 회사에 낼 것 ----------
export function Papers({ v, act, go }: Ctx) {
  const c = v.case;
  const [copied, setCopied] = useState(false);
  if (!c?.choice || c.received === 'cash') return <Empty text="받을 계좌를 정하면 회사에 낼 서류를 준비해 드려요." to="account" label="받을 계좌 정하기" go={go} />;
  const fresh = c.choice === 'separate';
  const cert = v.docs.find((d) => d.id === 'cert')!;
  const mail = v.docs.find((d) => d.id === 'mail')!;
  const canSend = c.stage === 'papers' && (!fresh || !!c.openedAt);
  return (
    <>
      {fresh && !c.openedAt && (
        <section className="box row">
          <div>
            <h2>먼저 휴대폰에서 하나증권 IRP를 열어요</h2>
            <p>신분증 촬영, 본인 인증, 약관과 설명 확인은 손님이 직접 해요. 길잡이는 넣어 주신 내용을 미리 채워 휴대폰으로 넘겨 드려요. 계좌가 열려야 아래 서류가 채워져요.</p>
            <div className="btns">
              <button type="button" className="btn pri" disabled={c.stage !== 'papers'} onClick={() => act('account', {}, '계좌를 열었다고 표시했어요. 서류를 채웠어요.')}>
                계좌를 열었어요
              </button>
            </div>
          </div>
          <div className="qr" aria-label="휴대폰으로 이어 가기">
            <Smartphone size={28} aria-hidden="true" />
            휴대폰으로 이어 가기
          </div>
        </section>
      )}
      <div className="grid">
        <section className="card span7">
          <h2>
            {cert.title}
            <span className={cert.state === 'ready' ? 'chip ok' : 'chip warn'}>{cert.state === 'ready' ? '준비됐어요' : cert.why}</span>
          </h2>
          <dl className="doc">
            {cert.fields.map((x) => (
              <div key={x.k}>
                <dt>{x.k}</dt>
                <dd className="num">{x.v}</dd>
              </div>
            ))}
          </dl>
          <p className="muted">{fresh ? '이 서류를 회사 담당자에게 내면 돼요. 길잡이가 회사에 대신 내지는 않아요.' : '계좌 확인 서류는 그 금융사에서 받아 회사 담당자에게 내요.'}</p>
        </section>
        <section className="card span5">
          <h2>회사가 하는 일</h2>
          <ul className="dots">
            <li>퇴직금을 셈하고 퇴직소득 원천징수영수증을 만들어요.</li>
            <li>
              퇴사 뒤 14일 안에 이 계좌로 넣어요. 기한은 <b className="num">{v.payDue ? day(v.payDue) : '-'}</b>이에요.
            </li>
            <li>IRP로 받으면 세금은 떼지 않고 미뤄져요.</li>
          </ul>
        </section>
        <section className="card span12">
          <h2>
            {mail.title}
            <button type="button" className="more" disabled={mail.state !== 'ready'} onClick={() => void navigator.clipboard?.writeText(mail.body ?? '').then(() => setCopied(true))}>
              <Copy size={14} aria-hidden="true" />
              {copied ? '복사했어요' : '복사하기'}
            </button>
          </h2>
          <pre className="mail">{mail.body}</pre>
          <p className="muted">{mail.state === 'ready' ? '길잡이가 손님 값으로 채운 글이에요. 고쳐서 손님이 직접 보내요.' : mail.why}</p>
        </section>
      </div>
      <div className="btns end">
        <span className="hint">{c.papersAt ? `${day(c.papersAt)}에 냈다고 표시하셨어요.` : canSend ? '내고 나면 알려 주세요. 그때부터 지급 기한을 따라가요.' : '계좌를 연 뒤에 낼 수 있어요.'}</span>
        <button type="button" className="btn pri" disabled={!canSend} onClick={() => void act('papers', {}, '회사에 냈다고 표시했어요.').then(() => go('timeline'))}>
          회사에 냈어요
        </button>
      </div>
    </>
  );
}

// ---------- 일정 ----------
export function Timeline({ v, act, go }: Ctx) {
  const c = v.case;
  if (!c) return <Empty text="퇴사 상황을 먼저 알려 주세요." to="home" label="상황 알리기" go={go} />;
  const at = v.timeline.findIndex((x) => !x.done);
  const defer = v.docs.find((d) => d.id === 'defer');
  return (
    <>
      {c.stage === 'cash' && (
        <section className="box row">
          <div>
            <h2>
              IRP에 넣을 수 있는 날이 <span className="num">{v.deferLeft}일</span> 남았어요
            </h2>
            <p>
              이 안에 넣으면 뗀 퇴직소득세 <b className="num">{won(v.est?.tax ?? 0)}</b>을 돌려받아요. 과세이연계좌신고서는 길잡이가 채워 두었고, 내는 일은 손님이 해요.
            </p>
          </div>
          <button type="button" className="btn pri" onClick={() => act('cashin', {}, 'IRP에 넣고 신고서를 냈어요.')}>
            IRP에 넣고 신고서 내기
          </button>
        </section>
      )}
      {defer && c.stage === 'cash' && (
        <section className="card">
          <h2>
            {defer.title}
            <span className="chip ok">채워 뒀어요</span>
          </h2>
          <dl className="doc">
            {defer.fields.map((x) => (
              <div key={x.k}>
                <dt>{x.k}</dt>
                <dd className="num">{x.v}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}
      <section className="box">
        <ol className="tl">
          {v.timeline.map((x, i) => (
            <li key={x.label} className={x.done ? 'done' : i === at ? 'now' : undefined}>
              <time className="num">{x.date ? day(x.date) : '정하면 끝'}</time>
              <div>
                <b>{x.label}</b>
                <span>{x.note}</span>
              </div>
              <span className={x.done ? 'chip ok' : i === at ? 'chip warn' : 'chip'}>{x.done ? '끝남' : i === at ? '지금' : '앞으로'}</span>
            </li>
          ))}
        </ol>
      </section>
      <section className="card">
        <h2>
          길잡이가 지켜보는 것
          <a href="#alerts">알림 설정</a>
        </h2>
        <ul className="set">
          {v.watch.rules.map((r) => (
            <li key={r.id}>
              <div>
                <b>{r.name}</b>
                <span>{r.when}</span>
              </div>
              <span className="chip">{r.status}</span>
            </li>
          ))}
        </ul>
      </section>
      {c.stage === 'arrived' && (
        <AgentNote
          actions={
            <button type="button" className="btn pri" onClick={() => go('withdraw')}>
              꺼내기 전 비교
            </button>
          }
        >
          퇴직금이 들어왔어요. 돈이 필요해지면 깨기 전에 먼저 비교해 보세요.
        </AgentNote>
      )}
    </>
  );
}

// ---------- 꺼내기 전 ----------
const OUTCOMES: { id: Outcome; name: string; note: string; verb: string }[] = [
  { id: 'keep', name: '그대로 두기', note: '아무것도 바꾸지 않아요.', verb: '그대로 두기' },
  { id: 'other', name: '다른 돈으로 메우기', note: '필요한 돈은 다른 곳에서 마련하고 IRP는 그대로 둬요.', verb: '이렇게 정하기' },
  { id: 'close', name: '해지하기', note: '계좌를 전부 해지하고 세금을 뗀 돈을 받아요.', verb: '해지하기' },
];

export function Withdraw({ v, act, go, confirmClose }: Ctx) {
  const c = v.case;
  const [amount, setAmount] = useState(() => (c?.need?.amount ?? 3000000) / 10000);
  const [reason, setReason] = useState<ReasonId>(c?.need?.reason ?? 'living');
  const [pick, setPick] = useState<Outcome | null>(null); // 처음에는 아무것도 골라 두지 않는다. 골라 두면 권하는 것처럼 보인다
  if (!c?.choice || !v.compare) return <Empty text="받을 계좌를 정한 뒤에 볼 수 있어요." to={c ? 'account' : 'home'} label={c ? '받을 계좌 정하기' : '상황 알리기'} go={go} />;
  const cmp = v.compare;
  if (!cmp.known)
    return (
      <section className="box row">
        <div>
          <h2>기존 IRP에 든 돈을 읽어야 셈할 수 있어요</h2>
          <p>기존 IRP로 받기로 하셔서, 해지하면 그 계좌의 세액공제용 돈까지 함께 깨져요. 그 금액을 읽으려면 손님의 동의가 필요해요.</p>
        </div>
        <button type="button" className="btn pri" onClick={() => act('link', { on: true }, '다른 금융사 연금 계좌를 읽었어요.')}>
          다른 금융사 연금 계좌 불러오기
        </button>
      </section>
    );
  const o = OUTCOMES.find((x) => x.id === pick);
  const open = c.stage === 'arrived';
  const run = () => {
    if (!pick) return;
    if (pick === 'close' && c.choice === 'separate') return confirmClose();
    if (pick === 'close') return void act('decide', { outcome: pick }, '해지하기로 정했어요. 실행은 계좌가 있는 금융사에서 해요.');
    void act('decide', { outcome: pick }, pick === 'keep' ? '그대로 두기로 했어요.' : '다른 돈으로 메우기로 했어요.');
  };
  return (
    <>
      <section className="box">
        <h2>얼마가, 어디에 필요한가요?</h2>
        <form className="form inline" onSubmit={(e) => { e.preventDefault(); void act('need', { amount: amount * 10000, reason }); }}>
          <label>
            필요한 금액 (만 원)
            <input type="number" min={0} step={10} value={amount} onChange={(e) => setAmount(Number(e.target.value))} />
          </label>
          <label>
            쓰는 곳
            <select value={reason} onChange={(e) => setReason(e.target.value as ReasonId)}>
              {(Object.keys(REASON_LABEL) as ReasonId[]).map((r) => (
                <option key={r} value={r}>
                  {REASON_LABEL[r]}
                </option>
              ))}
            </select>
          </label>
          <button type="submit" className="btn">
            비교하기
          </button>
        </form>
        {v.reason && (
          <p className="verdict">
            <span className={v.reason.can ? 'chip ok' : 'chip warn'}>{v.reason.can ? '일부만 꺼낼 수 있음' : '일부만 꺼낼 수 없음'}</span>
            <span className={v.reason.low ? 'chip ok' : 'chip'}>{v.reason.low ? '세금이 낮은 사유' : '세금 혜택 없음'}</span>
            {v.reason.note}
          </p>
        )}
      </section>

      {v.partial && (
        <section className="card">
          <h2>
            이 사유로 일부만 꺼낼 때
            <span className="chip ok">해지하지 않는 길</span>
          </h2>
          <Rows head={['금액']} rows={v.partial.rows} />
          <p className="muted">
            필요한 서류: {v.partial.papers.join(', ')}. 서류 확인과 신청은 금융사에서 해요. 아래 "사람과 상담하기"로 이어 드릴 수 있어요.
            {v.partial.capped && ' 필요한 돈이 퇴직금보다 커서 퇴직금까지만 셈했어요.'}
            {c.choice === 'merge' && ' 섞인 계좌에서는 퇴직금부터 꺼낸 것으로 보고 셈했어요.'}
          </p>
        </section>
      )}

      {cmp.amount > 0 && (
        <Overview
          items={[
            { label: '필요한 금액', value: won(cmp.amount) },
            { label: '해지하면 깨는 금액', value: won(cmp.breakAmount), out: true },
            { label: '필요한 것보다 더 깨는 금액', value: won(cmp.gap), out: true },
          ]}
        />
      )}

      <h2 className="sub">
        세 가지 경우 <span className={cmp.exact ? 'chip ok' : 'chip'}>{cmp.exact ? '계좌 기록의 확정 금액' : '입금 전 예상 금액'}</span>
      </h2>
      <Rows head={OUTCOMES.map((x) => x.name)} rows={cmp.rows} picked={open && pick ? OUTCOMES.findIndex((x) => x.id === pick) : undefined} />
      <p className="hint">55세까지 둘 때의 금액은 지금 쓰는 값과 맞바꾼 것이에요. 물가와 수수료는 넣지 않았고, 수익률은 가정이에요.</p>

      {open ? (
        <section className="box">
          <h2>어떻게 할지 정하기</h2>
          <div className="opts" role="radiogroup" aria-label="어떻게 할지">
            {OUTCOMES.map((x) => (
              <button type="button" role="radio" key={x.id} aria-checked={pick === x.id} onClick={() => setPick(x.id)}>
                <i />
                <b>{x.name}</b>
                <small>{x.note}</small>
              </button>
            ))}
          </div>
          <div className="btns end">
            <button type="button" className="btn" disabled={c.handoff} onClick={() => act('handoff', {}, '연금 상담 직원에게 넘겼어요.')}>
              {c.handoff ? '상담 직원에게 넘겼어요' : '사람과 상담하기'}
            </button>
            <button type="button" className={pick === 'close' ? 'btn danger' : 'btn pri'} disabled={!o} onClick={run}>
              {!o ? '하나를 골라 주세요' : o.id === 'close' && c.choice === 'merge' ? '해지하기로 정하기' : o.verb}
            </button>
          </div>
        </section>
      ) : (
        <p className="hint">{c.stage === 'closed' ? '이미 정하셨어요. 기록에서 볼 수 있어요.' : '퇴직금이 들어온 뒤에 정할 수 있어요. 지금은 미리 보는 예상이에요.'}</p>
      )}
    </>
  );
}
