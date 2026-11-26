import { useEffect, useState } from 'react';
import { Bell, Bot, Calculator, CalendarClock, FileText, HandCoins, History as HistoryIcon, Landmark, LayoutDashboard, MessageSquareText, X } from 'lucide-react';
import { call, day, won, type Ctx, type Data, type Page } from './api';
import { Agent } from './Agent';
import { Account, Home, Papers, Timeline, Withdraw } from './pages';
import { AgentPage, Alerts, Calc, History } from './system';

// 왼쪽 메뉴. 받기 전 → 기다리기와 꺼내기 → 기록 순서로 묶는다.
const NAV: { group: string; items: { id: Page; label: string; Icon: typeof Landmark }[] }[] = [
  {
    group: '받기 전',
    items: [
      { id: 'home', label: '내 퇴직금', Icon: LayoutDashboard },
      { id: 'account', label: '받을 계좌', Icon: Landmark },
      { id: 'papers', label: '회사에 낼 것', Icon: FileText },
    ],
  },
  {
    group: '기다리기와 꺼내기',
    items: [
      { id: 'timeline', label: '일정', Icon: CalendarClock },
      { id: 'withdraw', label: '꺼내기 전', Icon: HandCoins },
    ],
  },
  {
    group: '살펴보기와 기록',
    items: [
      { id: 'calc', label: '세금 계산기', Icon: Calculator },
      { id: 'alerts', label: '알림', Icon: Bell },
      { id: 'agent', label: '길잡이가 한 일', Icon: Bot },
      { id: 'log', label: '기록', Icon: HistoryIcon },
    ],
  },
];
const PAGES: Record<Page, { title: string; lead: string; View: (c: Ctx) => React.ReactNode }> = {
  home: { title: '내 퇴직금', lead: '퇴직금을 받기 전과 깨기 전에 정할 것을 한 화면에 모았어요.', View: Home },
  account: { title: '받을 계좌', lead: '어느 계좌로 받느냐는 입금 전에만 고를 수 있어요. 달라지는 것을 나란히 놓았어요.', View: Account },
  papers: { title: '회사에 낼 것', lead: '서류는 준비해 드리고, 내는 일은 손님이 직접 해요.', View: Papers },
  timeline: { title: '일정', lead: '서류를 낸 날부터 입금까지, 날짜를 따라가요.', View: Timeline },
  withdraw: { title: '꺼내기 전', lead: '돈이 필요할 때 깨기 전에 먼저 보는 화면이에요. 필요한 금액과 깨야 하는 금액을 나란히 놓았어요.', View: Withdraw },
  calc: { title: '세금 계산기', lead: '사건을 열지 않아도 퇴직금과 근속만 넣으면 세금을 미리 볼 수 있어요. 받는 방식 세 가지를 나란히 놓았어요.', View: Calc },
  alerts: { title: '알림', lead: '길잡이가 무엇을 지켜보다가 어디로 알릴지 손님이 정해요.', View: Alerts },
  agent: { title: '길잡이가 한 일', lead: '길잡이가 쓸 수 있는 도구와 할 수 없는 일, 그리고 답할 때마다 실제로 거친 순서예요.', View: AgentPage },
  log: { title: '기록', lead: '누가 언제 무엇을 했는지, 손님이 무엇을 보고 정했는지 남겨요.', View: History },
};
const readPage = (): Page => {
  const h = window.location.hash.slice(1) as Page;
  return h in PAGES ? h : 'home';
};

export default function App() {
  const [v, setV] = useState<Data | null>(null);
  const [page, setPage] = useState<Page>(readPage);
  const [agent, setAgent] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    call('state').then(setV);
    const onHash = () => { setPage(readPage()); window.scrollTo(0, 0); };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 6000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  if (!v) return null;

  const go = (p: Page) => { window.location.hash = p; };
  const act: Ctx['act'] = async (name, body, done) => {
    const next = await call(name, body ?? {});
    setV(next);
    if (next.error) return setToast(next.error);
    if (done) setToast(done);
  };
  const openAgent: Ctx['openAgent'] = (question) => {
    setAgent(true);
    if (question) void act('ask', { text: question });
  };
  const ctx: Ctx = { v, act, go, openAgent, confirmClose: () => setClosing(true) };

  const fresh = v.notices.find((n) => n.state === 'new');
  const { title, lead, View } = PAGES[page];

  return (
    <>
      <div className={agent ? 'app with-agent' : 'app'}>
        <aside className="side">
          <a className="brand" href="#home">
            <span className="mark" aria-hidden="true">
              <HandCoins size={18} />
            </span>
            <span>
              <strong>퇴직금 길잡이</strong>
              <small>받기 전·깨기 전에 정할 것</small>
            </span>
          </a>
          <div className="state">
            <small>지금 할 일</small>
            <b>{fresh ? fresh.text : v.next.text}</b>
            <button type="button" className="btn pri" onClick={() => openAgent()}>
              <MessageSquareText size={18} aria-hidden="true" />
              길잡이에게 묻기
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
                    {id === v.next.to && id !== page && <em>!</em>}
                    {id === 'alerts' && fresh && page !== 'alerts' && <em>1</em>}
                  </a>
                ))}
              </div>
            ))}
          </nav>
          <p className="foot">공모전 응모용 화면 시안이에요. 실제 서비스가 아니고 계좌·금액·날짜는 지어낸 값이에요.</p>
        </aside>
        <div className="shell">
          <header className="top">
            <div className="frame">
              <p>
                연금 <span>/</span> <b>{title}</b>
              </p>
              <div className="demo" aria-label="시연 도구">
                <b>시연 도구</b>
                <button type="button" onClick={() => act('deposit', {}, '퇴직금이 들어왔어요.')}>퇴직금 입금시키기</button>
                <button type="button" onClick={() => act('advance', { days: 7 }, '7일이 지났어요.')}>7일 지나게 하기</button>
                <button type="button" onClick={() => act('reset', {}, '처음 상태로 돌렸어요.')}>처음 상태로</button>
              </div>
              <span className="date">기준일 {day(v.now)}</span>
              <button type="button" className="askbtn" aria-expanded={agent} onClick={() => (agent ? setAgent(false) : openAgent())}>
                <MessageSquareText size={18} aria-hidden="true" />
                길잡이
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
            <p className="mfoot">공모전 응모용 화면 시안이에요. 실제 서비스가 아니고 계좌·금액·날짜는 지어낸 값이에요.</p>
          </main>
        </div>
      </div>

      {agent && <Agent {...ctx} close={() => setAgent(false)} />}

      {toast && (
        <div className="toast" role="status">
          {toast}
          <button type="button" aria-label="알림 닫기" onClick={() => setToast(null)}>
            <X size={16} />
          </button>
        </div>
      )}

      {closing && v.compare && (
        <div className="veil">
          <div className="dialog" role="alertdialog" aria-labelledby="dlg-t" aria-describedby="dlg-d">
            <h2 id="dlg-t">본인 인증 뒤 해지해요</h2>
            <p id="dlg-d">
              {won(v.compare.breakAmount)}을 해지하고 {won(v.compare.withheld)}을 뗀 {won(v.compare.receive)}을 받아요. 해지는 되돌릴 수 없어요.
            </p>
            <div className="btns">
              <button type="button" className="btn" onClick={() => setClosing(false)}>
                그만두기
              </button>
              <button type="button" className="btn danger" onClick={() => { void act('decide', { outcome: 'close' }, '해지를 마쳤어요.'); setClosing(false); }}>
                인증하고 해지하기
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
