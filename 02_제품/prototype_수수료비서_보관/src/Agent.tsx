import { useEffect, useRef, useState } from 'react';
import { MessageSquareText, Send, X } from 'lucide-react';
import { pct, won, type Block, type Ctx, type Page } from './api';

const ASKS = ['가입한 서비스 보여줘', '어떻게 셈했나요', '쉬면 얼마나 줄어요?', '안 쓰는 서비스 쉬게 해줘'];

// 화면 오른쪽에 붙는 비서 칸. 화면을 가리지 않고 옆에서 함께 쓴다.
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
    if (b.t === 'undo') {
      const done = v.log.find((l) => l.id === b.logId)?.undone;
      return (
        <button key={i} type="button" className="lk" disabled={done} onClick={() => act('undo', { id: b.logId })}>
          {done ? '되돌렸어요' : b.label}
        </button>
      );
    }
    if (b.t === 'calc')
      return (
        <div key={i} className="mini">
          <small>
            {b.name} · 거래 금액 × {pct(b.rate)}
          </small>
          <table className="num">
            <tbody>
              {b.rows.map((r) => (
                <tr key={r.label}>
                  <td>{r.label}</td>
                  <td>{won(r.traded)}</td>
                  <td>{won(r.fee)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td>합계</td>
                <td>{won(b.traded)}</td>
                <td>{won(b.fee)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      );
    const verb = b.action === 'pause' ? '쉬게 하기' : '해지하기';
    return (
      <div key={i} className="prop">
        <small>손님 확인이 필요한 일</small>
        <b>
          {b.name} {b.action === 'pause' ? '쉬기' : '해지'}
        </b>
        <ul>
          <li>멈추는 것: 정보 보기, 거래할 때 붙던 서비스 값</li>
          <li>그대로인 것: 매매수수료, 다른 서비스, 보유 주식</li>
          <li>지난 석 달 기준 {won(b.saving)}이 줄어요</li>
          <li>{b.action === 'pause' ? '다시 켜는 일은 손님이 직접 눌러요' : '해지는 되돌릴 수 없어요'}</li>
        </ul>
        {b.state === 'open' ? (
          <div className="btns">
            <button type="button" className="btn" onClick={() => act('dismiss', { id: b.id })}>
              그만두기
            </button>
            <button type="button" className={b.action === 'pause' ? 'btn pri' : 'btn danger'} onClick={() => act('approve', { id: b.id })}>
              {verb}
            </button>
          </div>
        ) : (
          <em>{b.state === 'approved' ? '손님이 승인했어요' : '그만뒀어요'}</em>
        )}
      </div>
    );
  };

  return (
    <aside className="agent" aria-label="수수료 비서">
      <header>
        <MessageSquareText size={20} aria-hidden="true" />
        <div>
          <b>수수료 비서</b>
          <small>AI 비서 · 금액은 수수료 계산 기록에서 가져와요</small>
        </div>
        <button type="button" aria-label="비서 닫기" onClick={close}>
          <X size={20} />
        </button>
      </header>
      <div className="talk">
        {v.msgs.map((m) => (
          <div key={m.id} className={m.role === 'me' ? 'me' : 'say'}>
            {m.blocks.map(block)}
            {m.trace && (
              <details className="trace">
                <summary>어떻게 답했나요</summary>
                <ol>
                  {m.trace.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ol>
              </details>
            )}
          </div>
        ))}
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
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="서비스 값에 대해 물어보세요" aria-label="비서에게 물어볼 말" maxLength={200} />
        <button type="submit" aria-label="보내기" disabled={!text.trim()}>
          <Send size={18} />
        </button>
      </form>
      <p className="limit">가입, 다시 켜기, 종목 추천, 주문, 이체는 하지 않아요.</p>
    </aside>
  );
}
