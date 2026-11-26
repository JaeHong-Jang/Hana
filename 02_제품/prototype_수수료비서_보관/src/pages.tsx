import { Fragment, useState, type ReactNode } from 'react';
import { ChevronDown, MessageSquareText } from 'lucide-react';
import { day, pct, stamp, won, type Ctx, type Status } from './api';

const STATUS: Record<Status, string> = { active: '쓰는 중', paused: '쉬는 중', cancelled: '해지함' };

function Chip({ status, unused }: { status: Status; unused?: boolean }) {
  if (status === 'active' && unused) return <span className="chip warn">안 쓰는 중</span>;
  return <span className={status === 'active' ? 'chip ok' : status === 'paused' ? 'chip calm' : 'chip'}>{STATUS[status]}</span>;
}

// 비서가 화면 안에서 건네는 한 줄. 점선 테두리와 이름표로 AI가 한 말임을 밝힌다.
function AgentNote({ children, actions }: { children: ReactNode; actions: ReactNode }) {
  return (
    <div className="note">
      <span className="who">
        <MessageSquareText size={16} aria-hidden="true" />
        수수료 비서
      </span>
      <p>{children}</p>
      <div className="btns">{actions}</div>
    </div>
  );
}

function Overview({ items }: { items: { label: string; value: string; out?: boolean }[] }) {
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

// ---------- 한눈에 보기 ----------
export function Home({ v, act, go, openAgent }: Ctx) {
  const n = v.notices.find((x) => x.state === 'new');
  const name = n && v.services.find((x) => x.id === n.serviceId)?.name;
  const idle = v.services.find((x) => x.unused);
  const months = [...new Set(v.services.flatMap((x) => x.calc.rows.map((r) => r.label)))];
  const feeIn = (x: (typeof v.services)[number], m: string) => x.calc.rows.find((r) => r.label === m)?.fee ?? 0;
  const top = Math.max(1, ...v.services.flatMap((x) => x.calc.rows.map((r) => r.fee)));
  return (
    <>
      {n?.kind === 'trade' && (
        <AgentNote
          actions={
            <>
              <button type="button" className="btn" onClick={() => act('later', { id: n.id }, '석 달 동안 같은 알림을 보내지 않아요.')}>
                나중에
              </button>
              <button type="button" className="btn pri" onClick={() => go('fees')}>
                내역 보기
              </button>
            </>
          }
        >
          방금 거래에서 <b>{name}</b> 값 <b className="num">{won(n.amount ?? 0)}</b>이 함께 나갔어요. 이 서비스를{' '}
          <b className="num">{n.days}일째</b> 열지 않으셨어요.
        </AgentNote>
      )}
      {n?.kind === 'pre' && (
        <AgentNote
          actions={
            <button type="button" className="btn pri" onClick={() => go('services')}>
              계속 쓸지 정하기
            </button>
          }
        >
          <b>{name}</b>를 <b className="num">{day(n.dueAt ?? '')}</b>에 쉬게 할 예정이에요. 맡기신 규칙에 따른 미리 알림이에요.
        </AgentNote>
      )}
      {n?.kind === 'auto' && (
        <AgentNote
          actions={
            <button type="button" className="btn pri" onClick={() => go('log')}>
              기록과 되돌리기 보기
            </button>
          }
        >
          <b>{name}</b>를 쉬게 했어요. 다음 거래부터 서비스 값이 붙지 않아요.
        </AgentNote>
      )}
      {!n && idle && (
        <AgentNote
          actions={
            <>
              <button type="button" className="btn" onClick={() => openAgent('쉬면 얼마나 줄어요?')}>
                비서에게 묻기
              </button>
              <button type="button" className="btn pri" onClick={() => go('services')}>
                정리하기
              </button>
            </>
          }
        >
          <b>{idle.name}</b>는 <b className="num">{idle.daysSince}일째</b> 열지 않으셨어요. 그동안 석 달에{' '}
          <b className="num">{won(idle.periodFee)}</b>을 내셨어요.
        </AgentNote>
      )}
      <Overview
        items={[
          { label: '석 달 서비스 값', value: won(v.totals.fee), out: true },
          { label: '안 쓰는 서비스', value: `${v.totals.unused}개` },
          { label: '쉬는 서비스', value: `${v.totals.paused}개` },
          { label: '석 달 매매수수료', value: won(v.totals.commission) },
        ]}
      />
      <div className="grid">
        <section className="card span8">
          <h2>
            내 서비스 영수증
            <a href="#fees">셈 내역 보기</a>
          </h2>
          <table className="plain num">
            <thead>
              <tr>
                <th>서비스</th>
                <th>열어 본 날</th>
                <th>마지막으로 연 날</th>
                <th>석 달 낸 값</th>
                <th>상태</th>
              </tr>
            </thead>
            <tbody>
              {v.services.map((x) => (
                <tr key={x.id}>
                  <td>
                    <b>{x.name}</b>
                  </td>
                  <td>{x.openedDays}일</td>
                  <td>{x.daysSince}일 전</td>
                  <td>
                    <b>{won(x.periodFee)}</b>
                  </td>
                  <td>
                    <Chip status={x.status} unused={x.unused} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
        <section className="card span4">
          <h2>
            알림 규칙
            <a href="#rules">바꾸기</a>
          </h2>
          <p className="lead">
            <span className={v.rule.on ? 'chip ok' : 'chip'}>{v.rule.on ? '켜짐' : '꺼짐'}</span> 석 달 안 보면 쉬게 하기
          </p>
          <p className="muted">
            {v.rule.on
              ? `오래 열지 않은 서비스는 ${v.rule.noticeDays}일 전에 미리 알리고 쉬게 해요.`
              : '켜 두면 오래 열지 않은 서비스를 비서가 미리 알리고 쉬게 해요.'}
          </p>
        </section>
        <section className="card span7">
          <h2>달마다 나간 서비스 값</h2>
          <p className="legend">
            {v.services.map((x, i) => (
              <span key={x.id}>
                <i className={i === 0 ? 'a' : 'b'} />
                {x.name}
              </span>
            ))}
          </p>
          <div className="bars">
            {months.map((m) => (
              <div key={m}>
                <span>{m}</span>
                <div>
                  {v.services.map((x, i) => (
                    <p key={x.id}>
                      <i className={i === 0 ? 'a' : 'b'} style={{ width: `${(feeIn(x, m) / top) * 100}%` }} />
                      <small className="num">
                        {x.name} {won(feeIn(x, m))}
                      </small>
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
        <section className="card span5">
          <h2>
            최근 활동
            <a href="#log">모두 보기</a>
          </h2>
          {v.log.length === 0 && <p className="muted">아직 남은 기록이 없어요.</p>}
          <ul className="acts">
            {v.log.slice(0, 4).map((l) => (
              <li key={l.id}>
                <span className={l.actor === '손님' ? 'chip' : l.actor === '비서' ? 'chip ai' : 'chip rule'}>{l.actor}</span>
                <span>{l.text}</span>
                <time className="num">{day(l.at).slice(5)}</time>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}

// ---------- 주문·체결 ----------
export function Trades({ v, act, go }: Ctx) {
  const n = v.notices.find((x) => x.kind === 'trade' && x.state === 'new');
  const name = n && v.services.find((x) => x.id === n.serviceId)?.name;
  return (
    <>
      {n && (
        <AgentNote
          actions={
            <>
              <button type="button" className="btn" onClick={() => act('later', { id: n.id }, '석 달 동안 같은 알림을 보내지 않아요.')}>
                나중에
              </button>
              <button type="button" className="btn pri" onClick={() => go('fees')}>
                내역 보기
              </button>
            </>
          }
        >
          방금 거래에서 <b>{name}</b> 값 <b className="num">{won(n.amount ?? 0)}</b>이 함께 나갔어요. 이 서비스를{' '}
          <b className="num">{n.days}일째</b> 열지 않으셨어요.
        </AgentNote>
      )}
      <Overview
        items={[
          { label: '석 달 거래 금액', value: won(v.totals.traded) },
          { label: '매매수수료', value: won(v.totals.commission) },
          { label: '정보 서비스 값', value: won(v.totals.fee), out: true },
        ]}
      />
      <table className="tbl num">
        <thead>
          <tr>
            <th>체결 일시</th>
            <th>종목</th>
            <th>구분</th>
            <th>수량</th>
            <th>체결 금액</th>
            <th>매매수수료</th>
            <th>정보 서비스 값</th>
          </tr>
        </thead>
        <tbody>
          {v.trades.map((tr) => (
            <tr key={tr.id}>
              <td>{stamp(tr.at)}</td>
              <td>
                <b>{tr.stock}</b>
              </td>
              <td>{tr.side}</td>
              <td>{tr.qty}주</td>
              <td>{won(tr.amount)}</td>
              <td>{won(tr.commission)}</td>
              <td>
                <b className="out">{won(tr.fees.reduce((a, f) => a + f.amount, 0))}</b>
                <small>{tr.fees.map((f) => `${f.name} ${won(f.amount)}`).join(' · ') || '붙은 서비스 없음'}</small>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

// ---------- 수수료·서비스 값 ----------
export function Fees({ v, go, openAgent }: Ctx) {
  const [open, setOpen] = useState<string | null>(null);
  const idle = v.services.find((x) => x.unused);
  return (
    <>
      <Overview
        items={[
          { label: '서비스 값 합계', value: won(v.totals.fee), out: true },
          { label: '안 쓰는 서비스', value: `${v.totals.unused}개` },
          { label: '매매수수료 (따로)', value: won(v.totals.commission) },
        ]}
      />
      <table className="tbl num">
        <thead>
          <tr>
            <th>서비스</th>
            <th>가입한 날</th>
            <th>열어 본 날</th>
            <th>마지막으로 연 날</th>
            <th>석 달 낸 값</th>
            <th>상태</th>
            <th>
              <span className="sr">셈 내역</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {v.services.map((x) => (
            <Fragment key={x.id}>
              <tr>
                <td>
                  <b>{x.name}</b>
                  <small>거래 금액의 {pct(x.rate)}</small>
                </td>
                <td>{x.joined}</td>
                <td>{x.openedDays}일</td>
                <td>
                  {day(x.lastOpened)}
                  <small>{x.daysSince}일 전</small>
                </td>
                <td>
                  <b>{won(x.periodFee)}</b>
                </td>
                <td>
                  <Chip status={x.status} unused={x.unused} />
                </td>
                <td>
                  <button type="button" className="more" aria-expanded={open === x.id} onClick={() => setOpen(open === x.id ? null : x.id)}>
                    셈 내역
                    <ChevronDown size={16} aria-hidden="true" />
                  </button>
                </td>
              </tr>
              {open === x.id && (
                <tr className="calc">
                  <td colSpan={7}>
                    <table className="num">
                      <thead>
                        <tr>
                          <th>달</th>
                          <th>거래 금액</th>
                          <th>× {pct(x.rate)}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {x.calc.rows.map((r) => (
                          <tr key={r.label}>
                            <td>{r.label}</td>
                            <td>{won(r.traded)}</td>
                            <td>{won(r.fee)}</td>
                          </tr>
                        ))}
                        <tr className="tot">
                          <td>합계</td>
                          <td>{won(x.calc.traded)}</td>
                          <td>{won(x.calc.fee)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </td>
                </tr>
              )}
            </Fragment>
          ))}
        </tbody>
      </table>
      {idle && (
        <AgentNote
          actions={
            <>
              <button type="button" className="btn" onClick={() => openAgent('쉬면 얼마나 줄어요?')}>
                비서에게 묻기
              </button>
              <button type="button" className="btn pri" onClick={() => go('services')}>
                정리하기
              </button>
            </>
          }
        >
          <b>{idle.name}</b>는 <b className="num">{idle.daysSince}일째</b> 열지 않으셨어요. 그동안 석 달에{' '}
          <b className="num">{won(idle.periodFee)}</b>을 내셨어요.
        </AgentNote>
      )}
    </>
  );
}

// ---------- 가입 서비스 관리 ----------
const CHOICES = [
  { id: 'keep', name: '계속 쓰기', note: '지금처럼 거래할 때마다 값이 붙어요.', verb: '계속 쓰기' },
  { id: 'pause', name: '쉬기', note: '서비스와 값이 함께 멈춰요. 다시 켤 수 있어요.', verb: '쉬게 하기' },
  { id: 'cancel', name: '해지', note: '가입을 끝내요. 다시 쓰려면 새로 가입해요.', verb: '해지하기' },
] as const;

export function Services({ v, act, confirmCancel }: Ctx) {
  const [pick, setPick] = useState<Record<string, (typeof CHOICES)[number]['id']>>({});
  return (
    <div className="svcs">
      {v.services.map((x) => {
        const choice = pick[x.id] ?? (x.unused ? 'pause' : 'keep');
        const c = CHOICES.find((o) => o.id === choice)!;
        const run = () => {
          if (choice === 'cancel') return confirmCancel(x.id);
          if (choice === 'pause') return act('status', { id: x.id, to: 'paused' }, `${x.name}를 쉬게 했어요.`);
          return act('keep', { id: x.id }, `${x.name}를 계속 써요. 다음 알림은 석 달 뒤예요.`);
        };
        return (
          <section className="svc" key={x.id}>
            <header>
              <h2>{x.name}</h2>
              <Chip status={x.status} unused={x.unused} />
              <dl>
                <div>
                  <dt>요율</dt>
                  <dd className="num">{pct(x.rate)}</dd>
                </div>
                <div>
                  <dt>석 달 낸 값</dt>
                  <dd className="num">{won(x.periodFee)}</dd>
                </div>
                <div>
                  <dt>마지막으로 연 날</dt>
                  <dd className="num">{x.daysSince}일 전</dd>
                </div>
              </dl>
            </header>
            {x.status === 'active' && (
              <>
                <div className="opts" role="radiogroup" aria-label={`${x.name} 어떻게 할지`}>
                  {CHOICES.map((o) => (
                    <button type="button" role="radio" key={o.id} aria-checked={choice === o.id} onClick={() => setPick({ ...pick, [x.id]: o.id })}>
                      <i />
                      <b>{o.name}</b>
                      <small>{o.note}</small>
                    </button>
                  ))}
                </div>
                <div className="effect">
                  {choice === 'keep' ? (
                    <div>
                      <h3>그대로인 것</h3>
                      <p>
                        정보 보기와 서비스 값 {pct(x.rate)}. 같은 알림은 석 달 뒤에 한 번만 드려요.
                      </p>
                    </div>
                  ) : (
                    <>
                      <div>
                        <h3>{choice === 'pause' ? '쉬면 멈추는 것' : '해지하면 끝나는 것'}</h3>
                        <p>정보 보기, 거래할 때 붙던 값 {pct(x.rate)}</p>
                      </div>
                      <div>
                        <h3>그대로인 것</h3>
                        <p>매매수수료, 다른 서비스, 보유 주식</p>
                      </div>
                      <div>
                        <h3>{choice === 'pause' ? '다시 켜려면' : '다시 쓰려면'}</h3>
                        <p>{choice === 'pause' ? '이 화면에서 손님이 직접 눌러요.' : '손님이 직접 새로 가입해요.'}</p>
                      </div>
                    </>
                  )}
                </div>
                <div className="btns end">
                  <button type="button" className="btn" onClick={() => act('open', { id: x.id }, `${x.name}를 열어 봤어요.`)}>
                    서비스 열어 보기
                  </button>
                  <button type="button" className={choice === 'cancel' ? 'btn danger' : 'btn pri'} onClick={run}>
                    {c.verb}
                  </button>
                </div>
              </>
            )}
            {x.status === 'paused' && (
              <div className="rest">
                <p>쉬는 중이에요. 거래해도 서비스 값이 붙지 않아요. 다시 켜는 일은 손님만 할 수 있어요.</p>
                <div className="btns">
                  <button type="button" className="btn" onClick={() => confirmCancel(x.id)}>
                    해지하기
                  </button>
                  <button type="button" className="btn pri" onClick={() => act('status', { id: x.id, to: 'active' }, `${x.name}를 다시 켰어요.`)}>
                    다시 켜기
                  </button>
                </div>
              </div>
            )}
            {x.status === 'cancelled' && (
              <div className="rest">
                <p>해지했어요. 다시 쓰려면 새로 가입해야 해요.</p>
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}

// ---------- 알림 규칙 ----------
function Switch({ on, label, onChange }: { on: boolean; label: string; onChange: (v: boolean) => void }) {
  return <button type="button" role="switch" aria-checked={on} aria-label={label} className="sw" onClick={() => onChange(!on)} />;
}

export function Rules({ v, act }: Ctx) {
  const { rule } = v;
  const exempt = (id: string, on: boolean) => act('rule', { exempt: on ? [...rule.exempt, id] : rule.exempt.filter((e) => e !== id) });
  return (
    <>
      <section className="box row">
        <div>
          <h2>석 달 안 보면 쉬게 하기</h2>
          <p>켜 두면 오래 열지 않은 서비스를 비서가 미리 알리고 쉬게 해요. 언제든 끌 수 있어요.</p>
        </div>
        <Switch on={rule.on} label="석 달 안 보면 쉬게 하기" onChange={(on) => act('rule', { on }, on ? '규칙을 켰어요.' : '규칙을 껐어요.')} />
      </section>
      <section className="box">
        <h2>이렇게 진행돼요</h2>
        <ol className="flow">
          <li>석 달 동안 열지 않으면 쉬게 하기 {rule.noticeDays}일 전에 미리 알려요.</li>
          <li>그 사이 답이 없으면 그 서비스를 쉬게 해요.</li>
          <li>쉬게 한 날 다시 알리고 되돌리기를 남겨요.</li>
        </ol>
      </section>
      <section className="box">
        <h2>서비스마다 정하기</h2>
        <table className="tbl num">
          <thead>
            <tr>
              <th>서비스</th>
              <th>마지막으로 연 날</th>
              <th>규칙에 따른 상태</th>
              <th>묻지 않고 계속 쓰기</th>
            </tr>
          </thead>
          <tbody>
            {v.services.map((x) => {
              const pre = v.notices.find((n) => n.serviceId === x.id && n.kind === 'pre' && n.state !== 'done');
              const off = rule.exempt.includes(x.id);
              return (
                <tr key={x.id}>
                  <td>
                    <b>{x.name}</b>
                  </td>
                  <td>{x.daysSince}일 전</td>
                  <td>
                    {x.status !== 'active'
                      ? STATUS[x.status]
                      : off
                        ? '규칙에서 뺌'
                        : !rule.on
                          ? '규칙이 꺼져 있음'
                          : pre?.dueAt
                            ? `${day(pre.dueAt)}에 쉬게 할 예정`
                            : '살피는 중'}
                  </td>
                  <td>
                    <Switch on={off} label={`${x.name}는 묻지 않고 계속 쓰기`} onChange={(on) => exempt(x.id, on)} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
      <section className="box">
        <h2>비서가 하지 않는 일</h2>
        <ul className="dots">
          <li>서비스 가입, 쉬던 서비스 다시 켜기, 해지</li>
          <li>종목이나 상품 추천, 주문, 이체</li>
        </ul>
      </section>
    </>
  );
}

// ---------- 활동 기록 ----------
export function History({ v, act }: Ctx) {
  if (v.log.length === 0) return <p className="empty">아직 남은 기록이 없어요.</p>;
  return (
    <table className="tbl num">
      <thead>
        <tr>
          <th>때</th>
          <th className="left">누가</th>
          <th className="left">한 일</th>
          <th>
            <span className="sr">되돌리기</span>
          </th>
        </tr>
      </thead>
      <tbody>
        {v.log.map((l) => (
          <tr key={l.id}>
            <td>{stamp(l.at)}</td>
            <td className="left">
              <span className={l.actor === '손님' ? 'chip' : l.actor === '비서' ? 'chip ai' : 'chip rule'}>{l.actor}</span>
            </td>
            <td className="left">{l.text}</td>
            <td>
              {l.undo && (
                <button type="button" className="more" disabled={l.undone} onClick={() => act('undo', { id: l.id }, '되돌렸어요.')}>
                  {l.undone ? '되돌림' : '되돌리기'}
                </button>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
