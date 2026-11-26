# 금융 AI 비서·AI 에이전트의 수익모델 유형과 실제 사례 (2023~2026)

- 조사일: 2026-11-26. 모든 수치 옆에 기준 시점을 적었다.
- 확인 방식 표기
  - **[원문-회사]** 회사·기관이 낸 발표문이나 자사 페이지를 직접 열어 확인
  - **[원문-기사]** 뉴스 기사 본문을 직접 열어 확인 (회사 원문은 미확인)
  - **[검색 요약]** 검색 결과 요약으로만 확인. 프로젝트 규칙상 원문을 열기 전에는 기획서에 쓸 수 없다
  - **(벤더/컨설팅 주장)** 판매자·컨설팅사·당사자 주장으로, 독립 검증 없음
- 사기·이상거래 분야는 제외했다. 국내 API/MCP 주문 연결, 하나증권 2027 MTS 에이전트 개발 보도 등 이미 확인된 내용은 다시 조사하지 않았다.

---

## 1. 수익모델 유형별 실제 사례와 수치

### Takeaway
AI 기능 자체에 값을 매겨 돈을 번 사례는 거의 없고, 확인되는 것은 (1) AI를 유료 멤버십 묶음에 넣어 구독자를 늘린 Robinhood Gold, (2) 자산 기반 보수와 예치금 이자로 버는 로보어드바이저, (3) 직원용 AI로 영업 생산성을 높였다는 대형사 주장(인과 미검증)이다. 리테일 앱 내 AI가 거래·전환·유지를 얼마나 늘렸는지 분리해 공개한 수치는 국내외 모두 찾지 못했다.

### Cited Findings

#### (a) 구독·멤버십

- Robinhood Gold 구독자 520만 명(2026-09-30 기준, 전년 대비 +34%, +130만 명). 전체 손님 대비 가입률 18%, 신규 손님 가입률 약 40%. 발표일 2026-10-27. **[원문-회사: 실적 발표문 전재본]** — [Robinhood Q3 2026 실적 발표문(Finviz 전재)](https://finviz.com/news/409270/robinhood-reports-third-quarter-2026-results)
- 같은 분기 총 순매출 14.2억 달러(+12%), 거래 기반 매출 8.67억 달러(+19%), 순이자 매출 4.15억 달러(-9%), 기타 매출 1.42억 달러(+61%). 기타 매출 증가는 Gold 구독과 Trump Account 서비스 때문이라고 설명하지만 **Gold 구독 매출만 따로 공개하지 않는다**. ARPU 연환산 200달러(+5%), 자금 입금 손님 2,870만 명, 순입금 157억 달러, 플랫폼 자산 3,960억 달러. **[원문-회사: 전재본]** — [같은 발표문](https://finviz.com/news/409270/robinhood-reports-third-quarter-2026-results)
- AI 비서 Cortex는 Gold 회원(월 5달러)만 쓸 수 있다. 주문서를 만들어 주지만 제출은 손님이 직접 검토하고 눌러야 한다("It can create the order, but you will need to review and submit it"). 투자자문이 아니며 매수·매도 추천은 하지 않는다고 명시. 확인일 2026-11-26(페이지 게시일 표기 없음). **[원문-회사]** — [Robinhood 고객지원: Cortex](https://robinhood.com/us/en/support/articles/cortex/)
- Gold 가격: 첫 30일 무료, 이후 월 5달러. **[검색 요약]** — [Robinhood Gold 페이지](https://robinhood.com/gold)
- Robinhood 에이전트 거래 계좌(Agentic Trading Account) 약 20만 명 개설, 명목 거래액 16억 달러 이상(2026년 3분기 발표 기준). **[원문-회사: 전재본]** — [같은 발표문](https://finviz.com/news/409270/robinhood-reports-third-quarter-2026-results)
- 에이전트 거래·에이전트 결제 베타 공개는 2026-05-27. 기사에는 **에이전트 거래의 가격·수수료, Gold 필수 여부, 수익화 방식이 나오지 않는다**. 에이전트 결제는 Gold 카드로만 가능. **[원문-기사]** — [Fortune, 2026-05-27](https://fortune.com/2026/05/27/robinhood-ai-agents/)
  - 충돌: 이 기사는 "Gold customers 약 70만"이라고 적는데, 회사 발표(2026-09 기준 520만)와 맞지 않는다. Gold 카드 보유자 수일 가능성이 있으나 확인하지 못했다.
- Robinhood Strategies(자산관리) 자금 입금 손님 35만 명, 운용자산 20억 달러 이상. Robinhood Banking 예금 약 50억 달러, 손님 35만 명 이상(2026년 3분기). **[원문-회사: 전재본]** — [같은 발표문](https://finviz.com/news/409270/robinhood-reports-third-quarter-2026-results)
- Webull Premium 월 3.99달러 또는 연 40달러. Moomoo 유료 등급 월 3.99달러(계좌 잔고 1,000달러 이상이면 월 0.99달러). Public Premium 월 10달러 또는 연 96달러. 한 비교 사이트는 Public의 에이전트 기능이 Premium 가입을 요구하지 않는다고 적는다. 모두 제3자 비교 사이트 기준이며 날짜가 제각각이다. **[검색 요약]** — [Finder: agentic trading platforms](https://www.finder.com/stock-trading/best-agentic-trading-platforms), [NerdWallet: Public 리뷰](https://www.nerdwallet.com/investing/reviews/public), [Webull 보도자료](https://www.webull.com/news/12445592663884800)
- 국내 증권사 유료 주식정보 서비스: 12개 증권사, 이용자 10만 3,000명(전체 손님의 0.23%), 2025년 수수료 수익 671억 원. 요율은 거래금액의 약 0.05~0.25%(정률) 또는 서비스별 월 1만 원 안팎(정액). 금감원 발표 2026-11-11. **[원문-기사 2건]** — [아시아경제 영문판, 2026-11-10/11](https://view.asiae.co.kr/en/article/2026111015274130512), [토요경제, 2026-11-11](https://sateconomy.co.kr/news/view/1065571853427432)

#### (b) 자산 기반 보수 (로보어드바이저·AI 일임)

- Wealthfront: 2026 회계연도(2026-01-31 종료) 매출 3.65억 달러(+18%), 플랫폼 자산 941억 달러(+17%) 중 투자자문 자산 487억 달러(+29%), 현금관리 자산 454억 달러(+7%). 조정 EBITDA 약 1.707억 달러(마진 47%). IPO 관련 주식보상 2.39억 달러로 순손실 4,320만 달러. 2027 회계연도 1분기 매출 9,050만 달러(+7%), 플랫폼 자산 966억 달러. **[검색 요약: 출처는 SEC 8-K·IR]** — [Wealthfront IR](https://ir.wealthfront.com/news-releases/news-release-details/wealthfront-reports-fiscal-fourth-quarter-and-full-year-2026), [SEC 8-K](https://www.sec.gov/Archives/edgar/data/1524566/000162828026016823/q426fy2026earningsrelease.htm)
- Wealthfront 자문 보수: 자동투자 계좌 연 0.25%, S&P 500 Direct 0.09%, Nasdaq-100 Direct 0.12%, 채권 사다리 0.15%. **[검색 요약]** — [Wealthfront 고객지원](https://support.wealthfront.com/hc/en-us/articles/13992378758676-Understanding-Wealthfront-fees)
- Betterment: 운용자산 700억 달러 이상, 손님 100만 명 이상(2026-08 기준, 제3자 사이트). SEC 신고 기준 630억 달러(2025-10). 보수는 월 5달러 또는 연 0.25%, Premium 0.65%(가구당 10만 달러 이상). **[검색 요약]** — [Betterment 가격 페이지](https://www.betterment.com/pricing), [Betterment 통계(제3자)](https://investingintheweb.com/brokers/betterment-statistics/)
- 미국 로보어드바이저 보수는 연 0.2~0.5% 수준이고 별도 상한 규제는 없다. 글로벌 로보어드바이저 운용 규모는 2020년 975억 달러에서 2024-10 1.8조 달러로 늘었고 미국이 80% 이상. (박상연, 자본시장포커스 2025-07호, 2025-03-31) **[원문-기관]** — [자본시장연구원](https://www.kcmi.re.kr/publications/pub_detail_view?cno=6513&syear=2025)
- 국내 퇴직연금 로보어드바이저 일임: 2024-12 금융위가 혁신금융서비스로 지정. 17개사(증권 9, 운용 3, 자문일임 5). 대상 계좌는 IRP로 한정, DC형 제외. **[원문-기관]** — [자본시장연구원](https://www.kcmi.re.kr/publications/pub_detail_view?cno=6513&syear=2025)
- 같은 보고서의 수익성 지적: "대형사는 계열 운용사 상품 편입으로 간접 수익을 얻지만 소형 기술 업체는 성과보수 외 뚜렷한 수익원이 없다", 보수를 자율에 맡기면 대형사 중심 인하 경쟁 우려. 2023-06 사후 운용심사 도입 뒤 일부 업체가 서비스를 중단해 운용 금액이 크게 줄었다. **[원문-기관]** — [자본시장연구원](https://www.kcmi.re.kr/publications/pub_detail_view?cno=6513&syear=2025)
- KB국민은행 퇴직연금 AI투자일임: 한도는 모든 일임 운용사 합산 연 900만 원(매년 누적), 1인 1계좌, 퇴직연금 수수료와 **별도로 일임보수 발생**, 기본수수료·혼합수수료 중 선택. 제휴사는 디셈버앤컴퍼니(핀트), 미래에셋자산운용(M-ROBO), 한국투자신탁운용(KimRobo). 운영 기한이 있다(핀트 2027-04-04, M-ROBO 2027-04-17, KimRobo 2027-07-17). 연장·제도화가 안 되면 계약 자동 해지. 보수율 숫자는 페이지에 없다. 확인일 2026-11-26. **[원문-회사]** — [KB국민은행 안내 페이지](https://kbthink.com/retirement-pension/pension-ai-invest.html)
- 핀트: 투자일임 운용자산 3,000억 원 돌파(2025-07 기준). **[검색 요약]** — [이코노미스트, 2025-08-05](https://economist.co.kr/article/view/ecn202508050064)
- 핀트: 운용자산 5,200억 원(2026-04 말, 2022년 1,306억 원의 약 4배), 코스콤 테스트베드 기준 투자일임 계약자의 72%(2026-03 말). **[검색 요약]** — [쿠키뉴스, 2026-04-30](https://www.kukinews.com/article/view/kuk202604300022)
- 핀트 투자자문 기본수수료: ETF 전략 연 0.768%(월 0.064%), 주식 전략 연 1.176%(월 0.098%), 매월 후취. 일임 보수는 미확인. **[검색 요약]** — [앱스토어 핀트 소개](https://apps.apple.com/kr/app/id1434650965)
- 콴텍: 일임 상품은 계좌 개설 증권사 정책에 따른 매매수수료 + 합의된 성과수수료. 고정 보수율 미확인. **[검색 요약]** — [앱스토어 콴텍 소개](https://apps.apple.com/kr/app/id1622337971)
- 파운트: 2025년 상반기 현금 190억 원, 누적 적자로 투자금 700억 원의 과반 소실이라는 기사 제목·요약(본문 유료). 2026-09 다른 회사 편입 소식. **[검색 요약]** — [딜사이트, 2025-11](https://dealsite.co.kr/articles/151686), [딜사이트, 2026-09](https://dealsite.co.kr/articles/168741)

#### (c) 거래·전환·자산 유입 증가

- Morgan Stanley: 2024년 3분기 순신규자산 약 640억 달러(전분기 대비 +76%), 연초 이후 "성공한 소개(referral)" 10만 건 이상(이전의 2배, CFO Sharon Yeshaya 발언). 경영진은 자산관리 부문 성장을 "상당 부분" AI 덕으로 돌렸으나 **AI 기여분을 분리한 자료는 없다**. Debrief는 회의 1건당 약 30분 절약(직원 1명 발언). **[원문-기사]** (경영진 주장) — [The Daily Upside, 2024-10-22](https://www.thedailyupside.com/technology/artificial-intelligence/how-morgan-stanleys-ai-helped-close-100k-new-clients-this-year/)
- Morgan Stanley 자문역 팀의 AI 도구 사용률 98% 이상. **[검색 요약]** (벤더 주장: OpenAI 사례 페이지) — [OpenAI](https://openai.com/index/morgan-stanley/)
- Morgan Stanley 2026년 3분기 순신규자산 2,324억 달러, 수수료 기반 자산 유입 805억 달러라는 Zacks 보도가 있으나 같은 기사도 "AI의 직접 이익 기여는 수치화되지 않았다"고 적는다. 수치의 기간·범위가 불분명해 회사 실적 자료로 확인해야 한다. **[검색 요약]** — [Zacks](https://www.zacks.com/stock/news/3016203/can-ai-adoption-sustain-morgan-stanley-s-wealth-management-growth)
- JPMorgan 자산·자산관리 부문: 2023→2024 총판매 +20%(생성형 AI 도구가 일부 기여했다는 회사 설명). Coach AI로 자문역이 정보를 "최대 95% 빨리" 찾는다(CIO Mike Urciuoli). 자문역 손님 명부를 3~5년간 50% 늘릴 것으로 **기대**(전망). AI 전체로 약 15억 달러 절감(사기 방지·개인화·트레이딩·운영 효율·여신 심사 합산이라 리테일 AI 비서만의 숫자가 아님). **[원문-기사: Reuters 전재]** (회사 주장) — [Reuters via AOL, 2025-05-05](https://www.aol.com/news/jpmorgan-says-ai-helped-boost-170825172.html)
- BofA Erica: 2018년 출시 이후 누적 상호작용 32억 건 돌파, 2025년 한 해 이용자 2,060만 명이 약 7억 건 이용. 은행 전체 디지털 접점 약 300억 건(+14%). 발표 2026-03-10. **[검색 요약: 출처는 BofA 보도자료, 원문 페이지는 본문 로딩 실패]** — [BofA Newsroom, 2026-03-10](https://newsroom.bankofamerica.com/content/newsroom/press-releases/2026/03/bofa-ai-and-digital-innovations-fuel-30-billion-client-interacti.html)
  - 충돌: BofA "Fast Facts" 페이지(날짜 없음)는 누적 38억 건, 이용 손님 2,420만 명이라고 적는다. 더 최근 수치일 가능성이 있으나 날짜를 확인하지 못했다. **[검색 요약]** — [BofA Fast Facts](https://newsroom.bankofamerica.com/content/newsroom/company-overview/bank-of-america-fast-facts)
- Erica가 먼저 보낸 개인화 알림(proactive insights) 17억 건 이상 수신·상호작용(2025-08-20 발표). **[검색 요약]** — [BofA Newsroom, 2025-08-20](https://newsroom.bankofamerica.com/content/newsroom/press-releases/2025/08/a-decade-of-ai-innovation--bofa-s-virtual-assistant-erica-surpas.html)
- 토스증권 AI 어닝콜 누적 이용자 약 270만 명(2026-07 기준). 누적 가입자 1,000만 명 돌파, 월 접속자 650만 명(2026-08 보도). **[검색 요약]** — [아시아경제, 2026-10-27](https://core.asiae.co.kr/article/2026102708591903295), [머니투데이, 2026-08-06](https://www.mt.co.kr/stock/2026/08/06/2026080609444670123)
- 토스증권 2026년 3분기 매출 5,151억 원(+134%), 영업이익 1,287억 원(-3%), 1~9월 누적 영업이익 4,482억 원(+48.4%). 검색 결과의 기사 날짜 표기가 일부 어긋나 있어 공시 확인 필요. **[검색 요약]** — [더밸류뉴스](https://www.thevaluenews.co.kr/news/203301), [비즈워치, 2026-11-19](https://news.bizwatch.co.kr/article/market/2026/11/19/0004)
- 한국투자증권 AI 시황 서비스가 출시 한 달여 만에 조회수 1,000만 회. 조회수일 뿐 전환·거래 지표가 아니다. **[검색 요약]** — [머니투데이, 2026-10-05](https://www.mt.co.kr/stock/2026/10/05/2026100215291155153)

#### (d) 비용 절감 (상담 자동화)

- Klarna: 출시 직후 AI 비서가 상담 요청의 3분의 2를 처리, 상담원 700명 분량, 이익 개선 4,000만 달러 추정(2024년 회사 발표). **[검색 요약]** (회사 주장) — [CBS News](https://www.cbsnews.com/news/klarna-ceo-ai-chatbot-replacing-workers-sebastian-siemiatkowski/)
- Klarna 이후: 2025-05 사람 상담원 채용으로 방향 전환("Uber형" 인력). CEO는 비용이 "지나치게 지배적인 평가 기준"이었고 품질이 떨어졌다고 인정. 2025-11 기준 AI가 853명 분량, 절감액 6,000만 달러라고 주장하지만 **같은 3분기 고객서비스·운영 비용은 5,000만 달러로 전년 동기 4,200만 달러보다 늘었다**. **[원문-기사]** (절감액은 회사 주장) — [Customer Experience Dive, 2025-11-20](https://www.customerexperiencedive.com/news/klarna-says-ai-agent-work-853-employees/805987/), [같은 매체, 2025-05](https://www.customerexperiencedive.com/news/klarna-reinvests-human-talent-customer-service-AI/747586/)
- 국내 금융 AI 상담 만족도(아시아경제 의뢰, 엠브레인, 2024-08, 성인 500명): 만족 21.6%, 불만족 39.4%. 불만 이유(복수): 요구를 이해 못함 73.6%, 사람 상담원 연결 과정 불편 56.9%. **[원문-기관: KB경영연구소 글이 인용]** — [KB경영연구소, 2025-10-13](https://kbthink.com/investment/deepdive/research/251013-2.html)
- 쿠키뉴스(2026-06-19): 금융권 AI 상담 만족 20%, 불만족 54.2%, 사람 상담사 선호 87.5%. 조사 주체·표본은 본문 추출에서 확인하지 못했다(위 엠브레인 조사와 불만족 수치가 다르므로 별개 조사일 수 있음). 가트너 전망: 2030년 생성형 AI 상담 1건 비용이 3달러를 넘을 수 있고, 2028년까지 사람이 개입하는 상담량이 30% 늘 수 있다. **[원문-기사]** — [쿠키뉴스(다음), 2026-06-19](https://v.daum.net/v/20260619060303805)
- 타 업종 참고: KT는 평일 상담 10건 중 4건을 AI 보이스봇·LLM 챗봇으로 처리, LG유플러스는 2025년 챗봇·콜봇으로 약 800만 건 즉시 해결(회사 주장, 통신업). **[원문-기사]** — [쿠키뉴스(다음), 2026-06-19](https://v.daum.net/v/20260619060303805)
- 키움증권은 생성형 AI 24시간 응대를 운영하고 답이 부족하면 상담원 채팅으로 넘긴다(2026-03). 하나증권 손님용 AI 챗봇 '하나Q' 출시 보도. 두 건 모두 처리율·절감액 수치는 없다. **[검색 요약]** — [헤럴드경제, 2026-03-25](https://www.heraldk.com/article/2026032518131839111), [스마트투데이](https://www.smarttoday.co.kr/ko-kr/articles/107758)
- McKinsey: 손님이 AI 에이전트를 새 채널로 쓰는 "중간 수준 도입" 시나리오에서 은행이 비용을 15~20% 줄일 수 있다. 반대로 사업 모델을 바꾸지 못하면 세계 은행 이익 풀(약 1.2조 달러)이 5~10년 사이 최대 10% 줄 수 있다. **[검색 요약]** (컨설팅 주장, 추정치) — [McKinsey 차트](https://www.mckinsey.com/featured-insights/week-in-charts/bankings-agentic-ai-opportunity), [McKinsey: profit pools](https://www.mckinsey.com/industries/financial-services/our-insights/banking-matters/agentic-ai-will-shake-up-banking-shrinking-global-profit-pools)

#### (e) 이탈 방지·유지

- 정량 수치는 찾지 못했다(Gaps 참조). 확인된 것은 정성 진술뿐이다: 토스증권의 AI·커뮤니티 기능은 위탁매매 손님을 오래 머물게 하는 락인 효과를 노린 것이라는 **기자 해석**. **[검색 요약]** — [이코노미스트, 2026-11-10](https://economist.co.kr/article/view/ecn202611100073)
- Robinhood의 신규 손님 Gold 가입률 약 40%, 순입금 연환산 성장률 17%(2026년 3분기)는 유료 묶음과 자산 유입이 함께 움직인다는 정황이지만 회사가 인과를 밝힌 것은 아니다. **[원문-회사: 전재본]** — [Robinhood Q3 2026 발표문](https://finviz.com/news/409270/robinhood-reports-third-quarter-2026-results)

#### (f) B2B·데이터·제휴

- 퇴직연금 로보 일임은 사실상 B2B2C 구조다: 일임사(핀트·미래에셋운용·한투운용)가 은행·증권사 앱 안에서 서비스를 제공하고 일임보수를 받는다. 삼성증권·한국투자증권이 핀트와 제휴, 파운트는 하나은행과 최초 개시. **[원문-회사]** + **[검색 요약]** — [KB국민은행 안내](https://kbthink.com/retirement-pension/pension-ai-invest.html), [이코노미스트, 2025-08-05](https://economist.co.kr/article/view/ecn202508050064)
- 미래에셋자산운용 로보어드바이저를 증권 앱에서 이용(2026-08). **[검색 요약]** — [MTN, 2026-08-21](https://news.mtn.co.kr/news-detail/2026082109134412099)
- Robinhood·Webull·Moomoo는 외부 AI 에이전트(Claude, ChatGPT 등)를 계좌에 연결하게 하고, Public은 앱 안에서 에이전트를 만들게 한다. 접속 자체에 대한 과금은 확인되지 않았다. **[검색 요약]** — [Finder](https://www.finder.com/stock-trading/best-agentic-trading-platforms)

### Inferences (추론)
- Robinhood Gold 구독 매출 상한 추정: 520만 명 × 월 5달러 × 12 = 연 약 3.1억 달러. 연간 결제 할인과 무료 체험을 감안하면 실제는 이보다 낮다. 분기 총매출 14.2억 달러와 비교하면 구독료 자체는 매출의 5% 안팎이고, Gold의 실제 가치는 구독료보다 예치금·카드·거래 등 연계 수익에 있다고 보는 것이 합리적이다(회사가 분리 공개하지 않아 검증 불가).
- 에이전트 계좌 1개당 명목 거래액은 약 8,000달러(16억 달러 ÷ 20만). 출시 후 약 4개월 누적이므로 아직 작다. "에이전트 → 거래량 증가"의 근거로 쓰기에는 약하고, "초기 수요가 있다"는 근거 정도다.
- 국내 유료 주식정보 서비스는 이용자 1인당 연 약 65만 원(671억 원 ÷ 10.3만 명)을 낸 셈이다. 소수(0.23%)가 큰 금액을 내는 구조이며, 금감원이 문제 삼은 것은 바로 이 "모르고 내는" 구조다. 같은 방식(거래수수료에 얹기)을 AI 서비스에 쓰면 규제 위험이 크다.
- Wealthfront는 자문 자산 487억 달러 × 0.25% ≈ 1.2억 달러로, 총매출 3.65억 달러의 3분의 1 수준이다. 나머지는 현금관리(예치금 이자 차익) 등에서 나온다고 추정된다. 즉 로보어드바이저도 보수만으로 버는 것이 아니라 예치 자산에서 번다. (매출 구성은 10-K로 확인 필요)
- 대형사(Morgan Stanley, JPMorgan)의 수익 근거는 모두 **직원(자문역)용 AI**다. 리테일 손님이 직접 쓰는 AI 비서로 매출이 늘었다고 수치를 낸 곳은 없다. 손님용 AI(Erica, 토스, 한투)는 이용량 지표만 공개한다.
- 따라서 증권사 앱 내 에이전트의 수익 논리는 "직접 과금"보다 "예탁자산·상품 가입·유지에 대한 간접 기여 + 상담 비용 절감"으로 세우고, 직접 과금은 멤버십 묶음(Gold형)이나 일임보수(로보형)처럼 이미 허용된 틀에 얹는 편이 선례와 맞는다.

### Gaps (찾지 못함)
- Robinhood Gold 구독 매출 단독 수치, Cortex 이용자 수, Cortex가 Gold 가입에 기여한 정도.
- BofA Erica의 비용 절감액·매출 기여액. 보도자료 원문 페이지가 로딩되지 않아 Erica 수치는 전부 검색 요약 상태다.
- 토스증권 AI 시그널의 이용자 수(AI 어닝콜 270만 명만 확인), KB증권 AI 브리핑 이용 수치.
- 국내 증권사·은행 AI 상담의 처리율·절감액 공개 수치.
- 휴면 손님 활성화, 타사 이전 방지에 AI가 기여했다는 정량 수치(국내외 모두).
- 핀트·파운트·콴텍의 일임 보수율과 손익(금감원 전자공시·금융투자협회 공시로 확인 필요), 토스 프라임 등 국내 유료 멤버십 가입자·매출.
- B2B 데이터 판매·API 과금으로 수익을 낸 금융 AI 에이전트 사례.

---

## 2. 손님이 AI 금융 서비스에 돈을 낼 의향이 있는가

### Takeaway
"쓸 의향"과 "기대"를 묻는 설문은 있지만 **유료 지불 의향을 직접 물은 국내 설문은 찾지 못했다**. 실제 결제 행태로는 미국에서 신규 손님의 약 40%가 월 5달러 묶음 멤버십에 가입한다는 것과, 국내 유료 주식정보 서비스 이용자가 전체 손님의 0.23%라는 것이 양 끝의 기준점이다.

### Cited Findings
- 한국 소비자의 65%가 AI에 "개인 금융 코치 역할"을 기대, 82%는 AI가 금융 거래 속도를 높일 것으로 기대. 조사 주체는 Salesforce "금융 서비스 트렌드 보고서". 표본·조사 시기는 기사에 없다. **[원문-기사]** (벤더 조사) — [헤럴드경제, 2026-05-25](https://www.heraldk.com/article/2026052522164466980)
- 금융상품 가입 경험자의 67%가 복잡한 금융 업무에 AI 에이전트를 쓸 의향(CJ메조미디어 2026 업종 분석 리포트). 이용 의향이지 지불 의향이 아니다. **[검색 요약]** (광고대행사 조사) — [파이낸셜뉴스, 2026-10-01](https://www.fnnews.com/news/202610011112457473)
- 생성형 AI 구독은 2030세대 중심으로 확산, 2개 이상 구독 손님 비중이 2024년 4.9% → 2025년 6.5%(KB국민카드 결제 데이터 분석). 금융 AI가 아니라 범용 AI 구독이다. **[검색 요약]** — [스마트투데이](https://www.smarttoday.co.kr/ko-kr/articles/102966)
- 국내 금융 AI 상담 만족 21.6%, 불만족 39.4%(2024-08, 엠브레인 500명). **[원문-기관]** — [KB경영연구소, 2025-10-13](https://kbthink.com/investment/deepdive/research/251013-2.html)
- 실제 결제 기준점: Robinhood Gold 전체 가입률 18%, 신규 손님 약 40%(2026-09). **[원문-회사: 전재본]** — [Robinhood Q3 2026 발표문](https://finviz.com/news/409270/robinhood-reports-third-quarter-2026-results)
- 실제 결제 기준점: 국내 증권사 유료 주식정보 서비스 이용자 10.3만 명, 전체 손님의 0.23%(2025년). **[원문-기사]** — [아시아경제 영문판](https://view.asiae.co.kr/en/article/2026111015274130512)

### Inferences (추론)
- 이용 의향(65~67%)과 상담 만족도(20%대) 사이의 간극이 크다. 설문상 의향을 지불 의향으로 옮겨 쓰면 과장이 된다.
- Robinhood Gold의 높은 가입률은 AI 때문이라기보다 예치금 금리 우대·입금 보너스·카드 등 금전 혜택 묶음 때문일 가능성이 크다(회사가 요인을 분리하지 않음). "AI 단독 유료"의 선례로 쓰면 안 되고 "AI를 멤버십 가치의 일부로 넣은" 선례로 써야 한다.
- 20~30대가 범용 AI에는 돈을 내기 시작했다는 사실(KB국민카드)은 "AI에 지불하는 습관"의 정황일 뿐, 증권 앱 AI에 내겠다는 근거는 아니다.

### Gaps (찾지 못함)
- 20~30대 대상 "증권사 AI 비서에 월 얼마까지 내겠는가" 유형의 국내 설문. 응모자가 소규모 자체 설문으로 메울 수 있는 빈칸이다.
- EY 2026 AI 인식 조사 한국 표본(약 1,000명)의 신뢰도 수치는 검색에 걸렸으나 값을 확인하지 못했다 — [EY 한국](https://www.ey.com/ko_kr/insights/ai/how-far-do-korean-consumers-trust-ai)
- 해외 설문(지불 의향, AI 투자 조언 신뢰도)은 이번 조사에서 확보하지 못했다.

---

## 3. 실패·역효과 사례

### Takeaway
가장 뚜렷한 반례는 비용 절감을 앞세웠다가 사람 상담으로 되돌아간 Klarna와, 보수 경쟁·심사 강화로 중소 로보어드바이저가 서비스를 접거나 적자를 낸 국내 사례다. AI 정보 기능은 경쟁사들이 무료로 풀고 있어 단독 과금 여지가 좁다.

### Cited Findings
- Klarna는 2025-05 사람 상담원 채용으로 돌아섰고, AI 절감액 6,000만 달러 주장과 달리 2025년 3분기 고객서비스·운영 비용은 5,000만 달러로 전년 동기(4,200만 달러)보다 늘었다. **[원문-기사]** — [Customer Experience Dive, 2025-11-20](https://www.customerexperiencedive.com/news/klarna-says-ai-agent-work-853-employees/805987/)
- 가트너는 2030년 생성형 AI 상담 1건 비용이 3달러를 넘을 수 있다고 전망. 오응대·검증·이관 비용이 원인으로 거론된다. **[원문-기사]** (전망) — [쿠키뉴스(다음), 2026-06-19](https://v.daum.net/v/20260619060303805)
- AICC 도입 사업장 상담사의 60.8%가 노동 조건 악화, 하루 평균 민원 약 17% 증가(한국노총 중앙연구원 조사). **[원문-기사]** — [쿠키뉴스(다음), 2026-06-19](https://v.daum.net/v/20260619060303805)
- "AI 답변 못 믿어… 챗봇 상담 되레 줄었다"는 제목의 기획 기사(2026-04-26). 본문 수치는 확인하지 못했다. **[검색 요약]** — [세계일보(다음), 2026-04-26](https://v.daum.net/v/20260426210237574)
- 국내 로보어드바이저: 2023-06 사후 운용심사 도입 뒤 일부 업체 서비스 중단, 소형사는 성과보수 외 수익원이 없다는 지적. **[원문-기관]** — [자본시장연구원, 2025-03-31](https://www.kcmi.re.kr/publications/pub_detail_view?cno=6513&syear=2025)
- 파운트 누적 적자·현금 감소 보도(2025-11). **[검색 요약]** — [딜사이트](https://dealsite.co.kr/articles/151686)
- 퇴직연금 AI 일임은 혁신금융서비스 지정 기한이 2027년 4~7월에 끝나며, 연장·제도화가 없으면 계약이 자동 해지된다. **[원문-회사]** — [KB국민은행 안내](https://kbthink.com/retirement-pension/pension-ai-invest.html)
- 무료화 경쟁 정황: Robinhood Legend는 추가 비용 없음, Public 에이전트는 Premium 불필요(제3자 사이트), 국내 6개 증권사가 2026-10 한 달 사이 MTS를 개편해 AI 브리핑 등을 기본 탑재. **[검색 요약]** — [Robinhood Legend](https://robinhood.com/us/en/about/trading), [머니투데이, 2026-10-05](https://www.mt.co.kr/stock/2026/10/05/2026100215291155153)
- 규제로 막힌 과금: 금감원이 2026-11-11 정보 이용료를 매매수수료에 섞어 받는 방식과 무료체험 뒤 자동 유료 전환을 문제 삼았다(4절 참조). **[원문-기사]** — [토요경제, 2026-11-11](https://sateconomy.co.kr/news/view/1065571853427432)

### Inferences (추론)
- 비용 절감을 주된 수익 논리로 세우면 Klarna 반례에 바로 걸린다. 절감은 "사람 상담을 없앤다"가 아니라 "단순 문의를 덜어 사람 상담의 질을 유지한다"는 식으로 한정해야 방어가 된다.
- AI 요약·브리핑 같은 정보형 기능은 이미 무료 기본 기능이 됐으므로 여기에 값을 매기는 안은 설득력이 낮다. 과금 여지는 실행·관리형(일임, 자동 리밸런싱, 조건 실행)이나 멤버십 혜택 묶음에 남아 있다.

### Gaps (찾지 못함)
- 증권사가 AI 유료 서비스를 출시했다가 철회·무료 전환한 구체 사례(국내외).
- 국내 은행의 AI 상담 도입 후 상담 인력 재충원 사례의 수치.

---

## 4. 한국 규제상 과금 제약

### Takeaway
2026-11-11 금감원 발표로 "정보 서비스 이용료를 거래수수료에 얹어 받는 방식"은 분리 표시·정기 고지·명시 동의 없이는 쓸 수 없게 된다(2027년 1분기까지 개선). AI가 개별 손님에게 맞춘 조언이나 운용을 하고 대가를 받으면 투자자문·일임 규율 대상이 되며, 퇴직연금 로보 일임은 한도와 기한이 있는 샌드박스다.

### Cited Findings
- 금감원 보도자료 「증권사의 〈주식정보 제공서비스〉 이용시 숨어있는 이용료를 미리 확인하고 이용하세요」, 자본시장감독국 자본시장제도팀, 2026-11-11, 7쪽. 이용료를 매매수수료에 포함해 부과한 사례 확인, 가입 전후·정기·수시 안내 의무화, 무료체험 뒤 동의 없는 자동 유료 전환 금지. (등록 페이지에는 수치가 없고 수치는 붙임 PDF에 있음) **[원문-기관: KDI 경제정책자료 등록 페이지]** — [KDI 경제교육·정보센터](https://eiec.kdi.re.kr/policy/materialView.do?num=289355)
- 세부 수치: 12개 증권사, 이용자 10.3만 명(0.23%), 2025년 수익 671억 원, 정률 0.05~0.25% 또는 정액 월 1만 원 안팎. 가입 직전·직후에만 안내하고 이후 안내 절차가 없었다. 이용료가 기본 위탁수수료를 대체해 수수료율로 부과되어 손님이 유료 사실을 모를 수 있었다. **[원문-기사 2건]** — [아시아경제 영문판](https://view.asiae.co.kr/en/article/2026111015274130512), [토요경제, 2026-11-11](https://sateconomy.co.kr/news/view/1065571853427432)
- 금감원 가상 사례: 기본 위탁수수료율 0.015% 손님이 서비스 가입 후 0.1%를 적용받으면 월 5,000만 원 거래 시 기본 7,500원에 더해 월 4만 2,500원 추가 부담. **[원문-기사]** — [토요경제, 2026-11-11](https://sateconomy.co.kr/news/view/1065571853427432)
  - 검산: 5,000만 원 × (0.1% − 0.015%) = 42,500원으로 맞는다. 0.1%는 이용료만이 아니라 가입 후 총 적용 요율로 읽어야 한다.
- 개선 내용: 가입 전 총비용 전후 비교 예시 안내, 가입 후 앱 알림·문자로 정기 고지, MTS·HTS 수수료 화면에서 위탁수수료와 정보 이용료 구분 표시, 무료체험 종료 시 명시 동의가 있어야 유료 전환. 금융투자협회와 세부안을 만들어 2027년 1분기까지 완료. **[원문-기사 2건]** — [아시아경제 영문판](https://view.asiae.co.kr/en/article/2026111015274130512), [토요경제](https://sateconomy.co.kr/news/view/1065571853427432)
- 유사투자자문업 규율(2024-08-14 시행): 단방향 채널로 불특정 다수에게 개별성 없는 조언만 가능. 양방향·개별 상담형 유료 영업은 투자자문업 등록 대상이며 위반 시 미등록 투자자문업으로 3년 이하 징역 또는 1억 원 이하 벌금. 손실 보전·이익 보장 약정, 수익률 좋은 기간만 제시하는 광고 금지. **[검색 요약: 출처는 금융위 보도자료]** — [금융위원회](https://www.fsc.go.kr/no010101/82887?curPage=5)
- 퇴직연금 로보 일임: 2024-12 혁신금융서비스 지정, IRP 한정, 연 900만 원 한도(누적), 퇴직연금 수수료와 별도로 일임보수 부과, 지정 기한 2027년 4~7월. 부가조건으로 동일 상품 쏠림 방지 장치, 서비스 중단 시 위험 사전 고지. **[원문-기관]** + **[원문-회사]** — [자본시장연구원](https://www.kcmi.re.kr/publications/pub_detail_view?cno=6513&syear=2025), [KB국민은행 안내](https://kbthink.com/retirement-pension/pension-ai-invest.html)
- 성과보수는 자본시장법 제98조의2와 시행령 제99조의2가 정한 요건 아래에서만 받을 수 있다는 금융사 문서 기재. 요건의 구체 내용은 확인하지 못했다. **[검색 요약]** — [하나은행 공시 문서](https://image.kebhana.com/cont/download/documents/provide/c000005080476_20220301.pdf)
- 시행령 제99조의 일임업자 금지행위에 "일임재산으로 금융투자상품을 지나치게 자주 매매하는 행위"가 포함. **[검색 요약]** — [법령 해설 사이트](https://korea.legal/wiki/%ec%9e%90%eb%b3%b8%ec%8b%9c%ec%9e%a5%ea%b3%bc-%ea%b8%88%ec%9c%b5%ed%88%ac%ec%9e%90%ec%97%85%ec%97%90-%ea%b4%80%ed%95%9c-%eb%b2%95%eb%a5%a0-%ec%8b%9c%ed%96%89%eb%a0%b9-%ec%a0%9c99/)
- 해외 대비: Robinhood는 Cortex에 "투자자문이 아니며 추천을 하지 않는다"고 명시하고 주문 제출은 손님에게 남긴다. **[원문-회사]** — [Robinhood 고객지원](https://robinhood.com/us/en/support/articles/cortex/)
- 금융분야 AI 가이드라인(안)이 2026년 1분기 시행 예정으로 소개됨. 실제 시행 여부와 과금 관련 조항은 확인하지 못했다. **[검색 요약]** — [삼일PwC 보고서](https://www.pwc.com/kr/ko/insights/samil-insight/samilpwc_ai-agent-in-financial-industry.pdf)

### Inferences (추론)
- 에이전트 이용료를 거래수수료율 인상 형태로 받는 설계는 금감원 2026-11 지적의 정면 대상이다. 과금한다면 (1) 별도 항목으로 금액을 표시하고 (2) 정기 고지하며 (3) 무료 체험 뒤 명시 동의로만 전환하는 구조여야 한다. 이 세 가지를 설계에 넣으면 오히려 "규제 대응이 끝난 과금"으로 내세울 수 있다.
- 거래 건수에 비례해 버는 구조는 과당매매 금지(일임)와 이해상충 문제를 건드린다. 에이전트가 거래를 부추길 유인이 없다는 점을 보이려면 자산 기반 보수나 정액 멤버십이 더 안전하다.
- 에이전트가 손님별 상황에 맞춘 종목·비중을 제시하면 투자자문, 대신 운용하면 투자일임에 해당할 가능성이 높다. 증권사는 해당 인가를 갖고 있으므로 불가능한 것은 아니지만, 적합성 확인·설명의무가 따라붙는다. (법률 해석이므로 법령 원문과 금융위 유권해석 확인 필요)

### Gaps (찾지 못함)
- 금감원 보도자료 붙임 PDF 원문(수치·예시가 실린 부분). 기획서에 쓰려면 fss.or.kr 보도자료에서 직접 내려받아 확인해야 한다.
- 자본시장법 제98조의2 성과보수 요건의 구체 내용, 일임보수와 위탁매매수수료 이중 수취에 대한 규정, 금융투자협회 수수료 부과체계 공시 기준의 세부.
- 생성형 AI 에이전트의 주문 대행이 투자일임에 해당하는지에 대한 금융당국 공식 해석.

---

## 5. 증권사 내부에서 AI 에이전트의 투자 대비 효과(ROI)를 설명하는 방식

### Takeaway
공개된 ROI 설명은 대부분 "절약 시간", "처리 건수", "총판매 증가율" 같은 간접 지표이고, 손님 1인당 AI 운영비를 밝힌 금융사는 찾지 못했다. LLM 호출 단가는 벤더 자료 기준 상호작용당 1센트 미만에서 세션당 0.35달러까지 폭이 넓고, 토큰 비용은 전체 비용의 일부라는 지적이 있다.

### Cited Findings
- 효과 지표 선례(회사 주장): JPMorgan 총판매 +20%(2023→2024), 정보 검색 최대 95% 단축, AI 전체 절감 약 15억 달러, 기술 예산 170억 달러(2024). **[원문-기사: Reuters 전재]** — [Reuters via AOL, 2025-05-05](https://www.aol.com/news/jpmorgan-says-ai-helped-boost-170825172.html)
- 효과 지표 선례(회사 주장): Morgan Stanley 회의당 약 30분 절약, 소개 성사 10만 건. **[원문-기사]** — [The Daily Upside, 2024-10-22](https://www.thedailyupside.com/technology/artificial-intelligence/how-morgan-stanleys-ai-helped-close-100k-new-clients-this-year/)
- 효과 지표 선례(국내, 내부 업무): 메리츠증권 반복 업무 시간 30% 감소, KB증권 IPO 수요예측 작업 7~8시간 → 30분~1시간. **[검색 요약]** — [바이라인네트워크, 2026-11](https://byline.network/2026/11/1109-10/), [바이라인네트워크, 2026-10](https://byline.network/2026/10/1021-10/)
- 비용: 소규모 웹사이트 챗봇 실측 사례에서 390건 문답에 API 비용 3.25달러, 건당 약 0.0083달러. 은행이 아니라 저용량 사이트이므로 하한 참고치. **[검색 요약]** (벤더 주장) — [dev.to 게시글](https://dev.to/fabio-plugins/real-gpt-54-chatbot-costs-in-production-wordpress-woocommerce-forums-4agk)
- 비용: 은행용 패키지 가상 비서 가격이 월 350달러(1,000세션)~월 1만 7,500달러(5만 세션), 즉 세션당 0.35달러. **[검색 요약]** (벤더 가격표) — [AWS Marketplace](https://aws.amazon.com/marketplace/pp/prodview-h6kpiufk7lpt4)
- 비용: 기업용 LLM 도구 좌석 단가 월 25~30달러, 1,000명이면 연 30만~36만 달러. 직원용 기준. **[검색 요약]** (컨설팅 주장) — [Neurons Lab](https://neurons-lab.com/article/the-cost-of-ai-for-financial-services/)
- 비용: 주택담보대출 업무 사례에서 토큰 비용은 거래당 전체 AI 비용의 22%에 그쳤다. 토큰 단가만으로 계산하면 총비용을 과소 추정한다. **[검색 요약]** (벤더 주장) — [Backbase](https://www.backbase.com/blog/cheaper-ai-tokens-does-necessarily-mean-cheaper-ai)
- 비용: 가트너는 2030년 생성형 AI 상담 1건 처리 비용이 3달러를 넘을 수 있다고 전망. **[원문-기사]** (전망) — [쿠키뉴스(다음), 2026-06-19](https://v.daum.net/v/20260619060303805)
- 가치 배분: 에이전트 기술 자체는 전체 가치의 20~25%를 넘지 않는다는 McKinsey 설명(나머지는 업무 재설계 등). **[검색 요약]** (컨설팅 주장) — [McKinsey 설명 영상 글](https://www.mckinsey.com/featured-insights/mckinsey-explainers/banking-and-ai-when-the-tech-starts-doing-the-work-not-just-assisting-it)
- 규모 감각용 분모: 토스증권 월 접속자 650만 명(2026-08), Robinhood ARPU 연 200달러(2026년 3분기). **[검색 요약]** / **[원문-회사: 전재본]** — [머니투데이](https://www.mt.co.kr/stock/2026/08/06/2026080609444670123), [Robinhood 발표문](https://finviz.com/news/409270/robinhood-reports-third-quarter-2026-results)

### Inferences (추론)
- 선례에서 뽑을 수 있는 ROI 설명 틀은 네 줄이다. 수치는 응모자가 가정으로 넣고 "가정"이라고 밝혀야 한다.
  1. 수익 증가 = 이용 손님 수 × (예탁자산 증가분 × 자산 수익률 + 상품 가입 전환 증가분 × 건당 수익)
  2. 직접 과금 = 유료 전환 손님 수 × 월 정액 (또는 일임 자산 × 보수율)
  3. 비용 절감 = AI가 끝낸 문의 건수 × (사람 상담 건당 비용 − AI 건당 비용)
  4. 운영비 = 이용 손님 수 × 1인당 월 호출 수 × 호출당 총비용(토큰 비용 ÷ 0.22 식으로 주변 비용 반영 가능)
- 1인당 운영비 감 잡기(가정 계산, 근거 약함): 세션당 0.0083달러(하한)~0.35달러(패키지 가격) 범위에서 손님이 월 20회 쓰면 월 0.17~7달러. 상단이면 Robinhood Gold 월 5달러를 넘으므로, 무료로 풀 경우 호출 수 제한이나 등급별 차등이 필요하다는 논리가 나온다.
- 대형사들은 ROI를 "기술 예산 대비 절감·판매 증가" 같은 전사 숫자로만 말하고 기능 단위 손익을 공개하지 않는다. 기획서에서 기능 단위 손익을 추정으로라도 제시하면 선례보다 구체적인 셈이지만, 추정임을 분명히 해야 한다.

### Gaps (찾지 못함)
- 금융사가 공개한 "손님 1인당 AI 운영비" 또는 "AI 기능 단위 손익".
- 국내 증권사의 상담 건당 비용(사람·AI), 예탁자산 1원당 수익률 등 ROI 계산에 필요한 내부 단가. 증권사 사업보고서의 수수료 수익·판관비로 근사할 수는 있으나 이번 조사에서 하지 않았다.
- McKinsey Global Banking Annual Review 2026("The AI disruption dividend", 2026-11) 본문 수치 — PDF는 확인됐으나 열지 못했다: [McKinsey PDF](https://www.mckinsey.com/~/media/mckinsey/industries/financial%20services/our%20insights/global%20banking%20annual%20review%202026%20part%202/global-banking-annual-review-2026-the-ai-disruption-dividend.pdf)
