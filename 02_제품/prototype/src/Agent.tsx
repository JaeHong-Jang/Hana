import { useEffect, useRef, useState } from 'react';
import { MessageSquareText, Send, X } from 'lucide-react';
import type { Block, Ctx, Page, Proposal, Run } from './api';

const ASKS = ['다음 달에 퇴사하는데 전세 잔금 300만 원이 걸려 있어요', 'IRP 있는데 거기로 받아도 돼요?', '깨면 얼마 떼요?', '나중에 연금으로 받으면요?', '300만 원만 빼고 싶어요', '깨는 게 나을까요?', '계좌 대신 열어 줘'];
const YES: Record<Proposal['kind'], { label: string; done: string; to?: Page }> = {
  open: { label: '이 내용으로 시작하기', done: '말씀하신 내용으로 시작했어요.', to: 'home' },
  update: { label: '이렇게 고치기', done: '고쳤어요. 세금과 일정을 다시 셈했어요.' },
  need: { label: '적어 두기', done: '꺼내기 전 화면에 적어 뒀어요.', to: 'withdraw' },
  link: { label: '읽기에 동의하기', done: '다른 금융사 연금 계좌를 읽었어요.' },
  handoff: { label: '상담 직원에게 넘기기', done: '연금 상담 직원에게 넘겼어요.' },
};
const STATE: Record<Proposal['state'], string> = { pending: '', approved: '받아들였어요', dismissed: '받아들이지 않았어요', replaced: '새 내용으로 바뀌었어요' };

// 길잡이가 이 답을 만들 때 실제로 거친 순서. 뒷단의 실행 기록을 그대로 보여 준다.
export function Steps({ run }: { run: Run }) {
  return (
    <ol>
      <li>들어온 말 검사: {run.gate}</li>
      {run.intents.length > 0 && <li>알아들은 뜻: {run.intents.join(', ')}</li>}
      {run.slots.length > 0 && <li>말에서 뽑은 값: {run.slots.join(', ')}</li>}
      {run.calls.map((c, i) => (
        <li key={i}>
          <span className="chip">{c.kind}</span> {c.title}
          {c.input !== '-' && <> ({c.input})</>} → {c.output}
        </li>
      ))}
      <li>
        나가는 답 검사:{' '}
        {run.check.ok ? (run.check.amounts ? `금액 ${run.check.amounts}개가 모두 도구가 셈한 값이에요` : '금액 없음, 권하는 말 없음') : `보내지 않음 (${[...run.check.unknown, ...run.check.banned].join(', ')})`}
      </li>
    </ol>
  );
}

// 화면 오른쪽에 붙는 길잡이 칸. 화면을 가리지 않고 옆에서 함께 쓴다.
export function Agent({ v, act, go, close }: Ctx & { close: () => void }) {
  const [text, setText] = useState('');
  const end = useRef<HTMLDivElement>(null);
  // 새 브라우저에서는 scrollIntoView가 값을 돌려주므로 중괄호로 감싼다
  useEffect(() => {
    end.current?.scrollIntoView({ block: 'end' });
  }, [v.msgs.length]);

  const send = (q: string) => {
    if (!q.trim()) return;
    void act('ask', { text: q.trim() });
    setText('');
  };
  const block = (b: Block, i: number) => {
    if (b.t === 'text') return <p key={i}>{b.text}</p>;
    if (b.t === 'link')
      return (
        <button key={i} type="button" className="lk" onClick={() => go(b.to as Page)}>
          {b.label}
        </button>
      );
    if (b.t === 'proposal') {
      const p = v.proposals.find((x) => x.id === b.id);
      if (!p) return null;
      const yes = YES[p.kind];
      return (
        <div key={i} className="draft">
          <small>{p.title}</small>
          <dl>
            {p.rows.map((r) => (
              <div key={r.label} className={r.missing ? 'miss' : undefined}>
                <dt>{r.label}</dt>
                <dd>{r.value}</dd>
              </div>
            ))}
          </dl>
          {p.state !== 'pending' ? (
            <em>{STATE[p.state]}</em>
          ) : (
            p.ready && (
              <div className="btns">
                <button type="button" className="btn pri" onClick={() => act('approve', { id: p.id }, yes.done).then(() => yes.to && go(yes.to))}>
                  {yes.label}
                </button>
                <button type="button" className="btn" onClick={() => act('dismiss', { id: p.id })}>
                  아니요
                </button>
              </div>
            )
          )}
        </div>
      );
    }
    if (b.t === 'points')
      return (
        <ol key={i} className="pts">
          {b.items.map((x) => (
            <li key={x.name}>
              <b>{x.name}</b>
              <span>{x.why}</span>
            </li>
          ))}
        </ol>
      );
    return (
      <div key={i} className="mini">
        <small>{b.title}</small>
        <table className="num">
          {b.head.length > 1 && (
            <thead>
              <tr>
                <th />
                {b.head.map((h) => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
          )}
          <tbody>
            {b.rows.map((r) => (
              <tr key={r.label} className={r.strong ? 'tot' : undefined}>
                <td>{r.label}</td>
                {r.values.map((x, k) => (
                  <td key={k}>{x}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {b.note && <em>{b.note}</em>}
      </div>
    );
  };

  return (
    <aside className="agent" aria-label="퇴직금 길잡이">
      <header>
        <MessageSquareText size={20} aria-hidden="true" />
        <div>
          <b>퇴직금 길잡이</b>
          <small>AI 길잡이 · 금액은 도구가 셈하고, 바꾸는 일은 손님이 받아들여야 돼요</small>
        </div>
        <button type="button" aria-label="길잡이 닫기" onClick={close}>
          <X size={20} />
        </button>
      </header>
      <div className="talk">
        {v.msgs.map((m) => {
          const run = v.runs.find((r) => r.id === m.run);
          return (
            <div key={m.id} className={m.role === 'me' ? 'me' : 'say'}>
              {m.blocks.map(block)}
              {run && (
                <details className="trace">
                  <summary>어떻게 답했나요 (도구 {run.calls.length}개)</summary>
                  <Steps run={run} />
                </details>
              )}
            </div>
          );
        })}
        <div ref={end} />
      </div>
      <div className="asks">
        {ASKS.map((q) => (
          <button type="button" key={q} onClick={() => send(q)}>
            {q}
          </button>
        ))}
      </div>
      <form onSubmit={(e) => { e.preventDefault(); send(text); }}>
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="퇴직금에 대해 물어보세요" aria-label="길잡이에게 물어볼 말" maxLength={200} />
        <button type="submit" aria-label="보내기" disabled={!text.trim()}>
          <Send size={18} />
        </button>
      </form>
      <p className="limit">
        어느 쪽이 낫다고 권하지 않아요. 계좌 개설과 해지, 이체, 서류 제출은 하지 않아요. <a href="#agent">할 수 있는 일 보기</a>
      </p>
    </aside>
  );
}
