import { useState } from 'react';
import { Download } from 'lucide-react';
import { day, stamp, won, type Ctx, type Page } from './api';
import { Steps } from './Agent';
import { Overview, Rows } from './pages';

// ---------- 세금 계산기 ----------
export function Calc({ v, act }: Ctx) {
  const sim = v.sim;
  const [pay, setPay] = useState(sim.pay / 10000);
  const [years, setYears] = useState(sim.years);
  const c = v.case;
  return (
    <>
      <section className="box">
        <h2>퇴직금과 근속 기간을 넣어 보세요</h2>
        <form className="form inline" onSubmit={(e) => { e.preventDefault(); void act('sim', { pay: pay * 10000, years }); }}>
          <label>
            퇴직금 (만 원)
            <input type="number" min={10} step={10} value={pay} onChange={(e) => setPay(Number(e.target.value))} />
          </label>
          <label>
            근속 기간 (년)
            <input type="number" min={1} max={50} value={years} onChange={(e) => setYears(Number(e.target.value))} />
          </label>
          <button type="submit" className="btn pri">
            셈하기
          </button>
        </form>
        {c && (c.pay !== sim.pay || c.years !== sim.years) && (
          <div className="btns">
            <button type="button" className="btn" onClick={() => { setPay(c.pay / 10000); setYears(c.years); void act('sim', { pay: c.pay, years: c.years }); }}>
              내 사건 값으로 보기
            </button>
          </div>
        )}
      </section>
      <Overview
        items={[
          { label: '퇴직금', value: won(sim.pay) },
          { label: '지금 받으면 떼는 세금', value: won(sim.tax), out: true },
          { label: '세금을 뗀 퇴직금', value: won(sim.pay - sim.tax) },
        ]}
      />
      <h2 className="sub">받는 방식 세 가지</h2>
      <Rows head={sim.head} rows={sim.ways} />
      <p className="hint">연금으로 받을 때의 값은 실제 수령 10년 차까지 받는 경우예요. 운용수익, 물가, 수수료는 넣지 않았어요. 정해진 식의 모의계산이고 세무 상담이 아니에요.</p>
      <div className="grid">
        <section className="card span7">
          <h2>어떻게 셈했나요</h2>
          <Rows head={['금액']} rows={sim.steps} />
          <p className="muted">소득세법 제48조·제55조의 식이에요.</p>
        </section>
        <section className="card span5">
          <h2>같은 퇴직금, 근속이 다르면</h2>
          <Rows head={['떼는 세금']} rows={sim.byYears} />
          <h2>연금으로 받는 해에 따라</h2>
          <Rows head={['비율', '세금']} rows={sim.pension} />
        </section>
      </div>
    </>
  );
}

// ---------- 알림 ----------
function Switch({ on, label, onChange }: { on: boolean; label: string; onChange: (on: boolean) => void }) {
  return <button type="button" role="switch" className="sw" aria-checked={on} aria-label={label} onClick={() => onChange(!on)} />;
}
export function Alerts({ v, act, go }: Ctx) {
  return (
    <>
      <div className="grid">
        <section className="card span7">
          <h2>무엇을 지켜볼까요</h2>
          <ul className="set">
            {v.watch.rules.map((r) => (
              <li key={r.id}>
                <div>
                  <b>{r.name}</b>
                  <span>{r.when}</span>
                </div>
                <span className="chip">{r.status}</span>
                <Switch on={r.on} label={r.name} onChange={(on) => act('alert', { rule: r.id, on })} />
              </li>
            ))}
          </ul>
          <p className="muted">지켜보는 조건은 여기 적힌 것이 전부예요. 길잡이가 스스로 조건을 만들지 않아요.</p>
        </section>
        <section className="card span5">
          <h2>어디로 알릴까요</h2>
          <ul className="set">
            {v.watch.channels.map((ch) => (
              <li key={ch.id}>
                <div>
                  <b>{ch.name}</b>
                </div>
                <Switch on={ch.on} label={ch.name} onChange={(on) => act('alert', { channel: ch.id, on })} />
              </li>
            ))}
          </ul>
          <p className="muted">시안에서는 문자와 메일을 실제로 보내지 않고, 보낸 것으로 기록만 해요.</p>
        </section>
      </div>
      <h2 className="sub">받은 알림</h2>
      {v.notices.length === 0 ? (
        <p className="empty">아직 받은 알림이 없어요.</p>
      ) : (
        <table className="tbl num">
          <thead>
            <tr>
              <th>때</th>
              <th className="left">내용</th>
              <th className="left">보낸 곳</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {v.notices.map((n) => (
              <tr key={n.id}>
                <td>{stamp(n.at)}</td>
                <td className="left">
                  {n.state === 'new' && <span className="chip warn">새 알림</span>} {n.text}
                </td>
                <td className="left">{v.watch.channels.filter((ch) => n.via.includes(ch.id)).map((ch) => ch.name).join(', ') || '보내지 않음'}</td>
                <td>
                  <button type="button" className="more" onClick={() => { void act('later', { id: n.id }); go(n.to as Page); }}>
                    {n.label}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}

// ---------- 길잡이가 한 일 ----------
const LOOP = [
  { name: '들어온 말 검사', text: '상품 추천이나 대신 실행해 달라는 부탁이면 여기서 거절해요.' },
  { name: '알아듣기', text: '말에서 뜻과 날짜·기간·금액·사유를 뽑아요. 언어 모델이 맡는 자리예요.' },
  { name: '도구 실행', text: '읽기·셈·준비 도구를 불러요. 금액은 도구만 만들어요.' },
  { name: '제안', text: '바꿀 일은 제안으로 내요. 손님이 받아들여야 실행돼요.' },
  { name: '나가는 답 검사', text: '도구가 셈하지 않은 금액이나 권하는 말이 섞이면 보내지 않아요.' },
];
export function AgentPage({ v, openAgent }: Ctx) {
  return (
    <>
      <section className="box">
        <h2>한 번 답할 때 거치는 순서</h2>
        <ol className="flow five5">
          {LOOP.map((x) => (
            <li key={x.name}>
              <b>{x.name}</b>
              <span>{x.text}</span>
            </li>
          ))}
        </ol>
      </section>
      <div className="grid">
        <section className="card span7">
          <h2>쓸 수 있는 도구 {v.tools.length}개</h2>
          <table className="plain tools">
            <tbody>
              {v.tools.map((t) => (
                <tr key={t.name}>
                  <td>
                    <span className={t.kind === '제안' ? 'chip ai' : t.kind === '셈' ? 'chip rule' : 'chip'}>{t.kind}</span>
                  </td>
                  <td>
                    <b>{t.title}</b>
                    <small>{t.desc}</small>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="muted">상태를 바꾸는 도구는 없어요. 받을 계좌 고르기, 서류 냈다고 표시하기, 해지는 손님이 화면에서 눌러요.</p>
        </section>
        <section className="card span5">
          <h2>할 수 없는 일</h2>
          <ul className="set">
            {v.denied.map((d) => (
              <li key={d.what}>
                <div>
                  <b>{d.what}</b>
                  <span>{d.who}</span>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
      <h2 className="sub">
        실행 기록 <span className="chip">{v.runs.length}건</span>
      </h2>
      {v.runs.length === 0 ? (
        <div className="empty">
          <p>아직 길잡이에게 물은 적이 없어요.</p>
          <button type="button" className="btn pri" onClick={() => openAgent()}>
            길잡이에게 묻기
          </button>
        </div>
      ) : (
        <div className="runs">
          {v.runs.map((r, i) => (
            <details key={r.id} open={i === 0}>
              <summary>
                <time className="num">{stamp(r.at)}</time>
                <b>{r.text}</b>
                <span className="chip">도구 {r.calls.length}개</span>
                <span className={r.check.ok ? 'chip ok' : 'chip warn'}>{r.check.ok ? '검사 통과' : '보내지 않음'}</span>
              </summary>
              <Steps run={r} />
            </details>
          ))}
        </div>
      )}
    </>
  );
}

// ---------- 기록 ----------
const WHO = [
  { id: '', name: '전체' },
  { id: '손님', name: '손님' },
  { id: '비서', name: '길잡이' },
];
export function History({ v }: Ctx) {
  const [who, setWho] = useState('');
  if (v.log.length === 0) return <p className="empty">아직 남은 기록이 없어요.</p>;
  const list = v.log.filter((l) => !who || l.actor === who);
  const save = () => {
    const url = URL.createObjectURL(new Blob([JSON.stringify(v.log, null, 2)], { type: 'application/json' }));
    Object.assign(document.createElement('a'), { href: url, download: `퇴직금_길잡이_기록_${day(v.now)}.json` }).click();
    URL.revokeObjectURL(url);
  };
  return (
    <>
      <div className="btns end">
        <div className="filter" role="radiogroup" aria-label="누가 한 일">
          {WHO.map((w) => (
            <button type="button" role="radio" key={w.name} aria-checked={who === w.id} onClick={() => setWho(w.id)}>
              {w.name}
            </button>
          ))}
        </div>
        <span className="hint">{list.length}건</span>
        <button type="button" className="more" onClick={save}>
          <Download size={14} aria-hidden="true" />
          내려받기
        </button>
      </div>
      <table className="tbl num">
        <thead>
          <tr>
            <th>때</th>
            <th className="left">누가</th>
            <th className="left">한 일</th>
          </tr>
        </thead>
        <tbody>
          {list.map((l) => (
            <tr key={l.id}>
              <td>{stamp(l.at)}</td>
              <td className="left">
                <span className={l.actor === '손님' ? 'chip' : 'chip ai'}>{l.actor === '손님' ? '손님' : '길잡이'}</span>
              </td>
              <td className="left">{l.text}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
