import { useEffect, useState } from 'react';
import { BellRing, History as HistoryIcon, LayoutDashboard, ListChecks, MessageSquareText, ReceiptText, ScrollText, X } from 'lucide-react';
import { call, day, type Ctx, type Data, type Page } from './api';
import { Agent } from './Agent';
import { Fees, Home, History, Rules, Services, Trades } from './pages';

// 왼쪽 메뉴. 살펴보기 → 정하기 → 기록 순서로 묶는다.
const NAV: { group: string; items: { id: Page; label: string; Icon: typeof BellRing }[] }[] = [
  {
    group: '살펴보기',
    items: [
      { id: 'home', label: '한눈에 보기', Icon: LayoutDashboard },
      { id: 'trades', label: '주문·체결', Icon: ScrollText },
      { id: 'fees', label: '수수료·서비스 값', Icon: ReceiptText },
    ],
  },
  {
    group: '정하기',
    items: [
      { id: 'services', label: '가입 서비스 관리', Icon: ListChecks },
      { id: 'rules', label: '알림 규칙', Icon: BellRing },
    ],
  },
  { group: '기록', items: [{ id: 'log', label: '활동 기록', Icon: HistoryIcon }] },
];
const PAGES: Record<Page, { title: string; lead: string; View: (c: Ctx) => React.ReactNode }> = {
  home: { title: '한눈에 보기', lead: '가입한 유료 정보 서비스에 낸 값과 쓴 만큼을 한 화면에 모았어요.', View: Home },
  trades: { title: '주문·체결', lead: '체결된 주문과 함께 나간 값을 보여 줘요.', View: Trades },
  fees: { title: '수수료·서비스 값', lead: '최근 석 달 동안 낸 값과 쓴 만큼을 나란히 놓았어요.', View: Fees },
  services: { title: '가입 서비스 관리', lead: '계속 쓸지, 쉴지, 해지할지 손님이 직접 정해요.', View: Services },
  rules: { title: '알림 규칙', lead: '오래 열지 않은 서비스를 미리 알리고 쉬게 하는 규칙이에요.', View: Rules },
  log: { title: '활동 기록', lead: '누가 언제 무엇을 바꿨는지 남겨요. 되돌릴 수 있는 일은 여기서 되돌려요.', View: History },
};
const readPage = (): Page => {
  const h = window.location.hash.slice(1) as Page;
  return h in PAGES ? h : 'home';
};

export default function App() {
  const [v, setV] = useState<Data | null>(null);
  const [page, setPage] = useState<Page>(readPage);
  const [agent, setAgent] = useState(false);
  const [toast, setToast] = useState<{ text: string; undo?: number } | null>(null);
  const [cancelId, setCancelId] = useState<string | null>(null);

  useEffect(() => {
    call('state').then(setV);
    const onHash = () => { setPage(readPage()); window.scrollTo(0, 0); };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 7000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  if (!v) return null;

  const go = (p: Page) => { window.location.hash = p; };
  const act: Ctx['act'] = async (name, body, done) => {
    const next = await call(name, body ?? {});
    setV(next);
    if (next.error) return setToast({ text: next.error });
    if (done) {
      // 방금 한 일이 되돌릴 수 있는 일이면 되돌리기를 바로 옆에 둔다
      const last = next.log[0];
      setToast({ text: done, undo: name === 'status' && last?.undo && !last.undone ? last.id : undefined });
    }
  };
  const openAgent: Ctx['openAgent'] = (question) => {
    setAgent(true);
    if (question) void act('ask', { text: question });
  };
  const ctx: Ctx = { v, act, go, openAgent, confirmCancel: setCancelId };

  const fresh = v.notices.find((n) => n.state === 'new');
  const freshName = fresh && v.services.find((x) => x.id === fresh.serviceId)?.name;
  const stateText = !fresh
    ? v.totals.unused > 0
      ? `안 쓰는 서비스가 ${v.totals.unused}개 있어요`
      : '지금 살펴볼 것이 없어요'
    : fresh.kind === 'trade'
      ? `방금 거래에서 ${freshName} 값이 나갔어요`
      : fresh.kind === 'pre'
        ? `${freshName}를 곧 쉬게 할 예정이에요`
        : `${freshName}를 쉬게 했어요`;
  const { title, lead, View } = PAGES[page];
  const cancelTarget = v.services.find((x) => x.id === cancelId);

  return (
    <>
      <div className={agent ? 'app with-agent' : 'app'}>
        <aside className="side">
          <a className="brand" href="#home">
            <span className="mark" aria-hidden="true">
              <ReceiptText size={18} />
            </span>
            <span>
              <strong>수수료 비서</strong>
              <small>유료 정보 서비스 값 관리</small>
            </span>
          </a>
          <div className="state">
            <small>지금 상태</small>
            <b>{stateText}</b>
            <button type="button" className="btn pri" onClick={() => openAgent()}>
              <MessageSquareText size={18} aria-hidden="true" />
              비서에게 묻기
            </button>
          </div>
          <nav aria-label="주 메뉴">
            {NAV.map((g) => (
              <div key={g.group}>
                <p>{g.group}</p>
                {g.items.map(({ id, label, Icon }) => (
                  <a key={id} href={`#${id}`} className="nav" aria-current={id === page ? 'page' : undefined}>
                    <Icon size={20} strokeWidth={1.8} aria-hidden="true" />
                    {label}
                    {id === 'services' && v.totals.unused > 0 && <em>{v.totals.unused}</em>}
                  </a>
                ))}
              </div>
            ))}
          </nav>
          <p className="foot">공모전 응모용 화면 시안이에요. 실제 서비스가 아니고 금액·날짜·종목은 지어낸 값이에요.</p>
        </aside>
        <div className="shell">
          <header className="top">
            <div className="frame">
              <p>
                나의 자산 <span>/</span> <b>{title}</b>
              </p>
              <div className="demo" aria-label="시연 도구">
                <b>시연 도구</b>
                <button type="button" onClick={() => act('trade', {}, '주문 한 건이 체결됐어요.')}>주문 체결시키기</button>
                <button type="button" onClick={() => act('advance', { days: 7 }, '7일이 지났어요.')}>7일 지나게 하기</button>
                <button type="button" onClick={() => act('reset', {}, '처음 상태로 돌렸어요.')}>처음 상태로</button>
              </div>
              <span className="date">기준일 {day(v.now)}</span>
              <button type="button" className="askbtn" aria-expanded={agent} onClick={() => (agent ? setAgent(false) : openAgent())}>
                <MessageSquareText size={18} aria-hidden="true" />
                수수료 비서
                {fresh && <i aria-label="새 알림" />}
              </button>
            </div>
          </header>
          <main className="frame view">
            <header className="vh">
              <h1>{title}</h1>
              <p>{lead}</p>
            </header>
            <View {...ctx} />
          </main>
        </div>
      </div>

      {agent && <Agent {...ctx} close={() => setAgent(false)} />}

      {toast && (
        <div className="toast" role="status">
          {toast.text}
          {toast.undo && (
            <button type="button" onClick={() => { void act('undo', { id: toast.undo }); setToast({ text: '되돌렸어요.' }); }}>
              되돌리기
            </button>
          )}
          <button type="button" aria-label="알림 닫기" onClick={() => setToast(null)}>
            <X size={16} />
          </button>
        </div>
      )}

      {cancelTarget && (
        <div className="veil">
          <div className="dialog" role="alertdialog" aria-labelledby="dlg-t" aria-describedby="dlg-d">
            <h2 id="dlg-t">{cancelTarget.name}를 해지할까요?</h2>
            <p id="dlg-d">해지는 되돌릴 수 없어요. 다시 쓰려면 새로 가입해야 해요. 잠시 멈추려면 쉬기를 고르세요.</p>
            <div className="btns">
              <button type="button" className="btn" onClick={() => setCancelId(null)}>
                그만두기
              </button>
              <button
                type="button"
                className="btn danger"
                onClick={() => { void act('status', { id: cancelTarget.id, to: 'cancelled' }, `${cancelTarget.name}를 해지했어요.`); setCancelId(null); }}
              >
                해지하기
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
