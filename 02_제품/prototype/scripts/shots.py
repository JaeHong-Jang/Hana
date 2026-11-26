"""화면 그림 뽑기와 동작 점검. 먼저 `npm run dev`로 서버를 띄운 뒤 실행한다: python3 scripts/shots.py"""
import asyncio, base64, pathlib, sys
from playwright.async_api import async_playwright

BASE = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:5173/"
OUT = pathlib.Path(__file__).resolve().parent.parent / "shots"
CAPS = [
    ("받을 계좌 정하기", "기존 IRP로 받을 때와 따로 받을 때 달라지는 것을 입금 전에 나란히 보여 줘요."),
    ("회사에 낼 것", "서류는 준비해 드리고, 내는 일과 본인 확인은 손님이 직접 해요."),
    ("일정", "서류를 낸 날부터 지급 기한, 입금 확인까지 날짜를 따라가요."),
    ("꺼내기 전 비교", "필요한 금액과 깨야 하는 금액을 나란히 놓고, 어느 쪽을 고를지는 손님이 정해요."),
]

async def main():
    OUT.mkdir(exist_ok=True)
    for old in OUT.glob("*.png"):
        old.unlink()
    async with async_playwright() as p:
        b = await p.chromium.launch()
        errs = []
        f = await b.new_page(viewport={"width": 1440, "height": 900}, device_scale_factor=2)
        f.on("console", lambda m: errs.append(m.text) if m.type == "error" else None)
        f.on("pageerror", lambda e: errs.append(str(e)))
        await f.goto(BASE); await f.wait_for_selector(".app")
        await f.click(".demo >> text=처음 상태로")
        await f.add_style_tag(content=".demo,.toast{opacity:0}")  # 그림에는 시연 도구와 토스트를 넣지 않는다
        n = 0
        async def shot(name=None, full=False):
            nonlocal n
            if not name:
                n += 1; name = f"0{n}_화면"
            await f.wait_for_timeout(600); await f.evaluate("scrollTo(0,0)")
            await f.screenshot(path=str(OUT / f"{name}.png"), full_page=full)
        text = lambda sel: f.inner_text(sel)
        one = lambda s: " ".join(s.split())
        async def ask(q):
            await f.fill(".agent input", q); await f.press(".agent input", "Enter"); await f.wait_for_timeout(400)
            return one(await text(".say >> nth=-1"))
        async def row(label):
            return one(await text(f".tbl.text tr:has(td:text-is('{label}'))"))

        await shot("home_처음")
        # 300만 원 이하는 대상이 아니다 (직접 넣기)
        await f.click(".manual summary"); await f.fill(".form input[type=number] >> nth=1", "250"); await f.click(".form >> text=상황 알리기"); await f.wait_for_timeout(400)
        print("300만 원 이하로 넣으면:", one(await text(".toast")))
        await f.fill(".form input[type=number] >> nth=1", "1500"); await f.click(".manual summary")
        # 길잡이가 말에서 내용을 뽑고 빠진 것만 되묻는다
        await f.click(".eg button >> nth=0"); await f.wait_for_selector(".agent .draft")
        print("한 문장으로 말하면:", one(await text(".say >> nth=-1")))
        print("근속을 답하면:", await ask("5년 다녔어요"))
        print("퇴직금을 답하면:", await ask("퇴직금은 1500만 원쯤이에요"))
        await shot("05_말로_시작하기")
        await f.click(".agent >> text=이 내용으로 시작하기"); await f.wait_for_selector(".steps")
        await f.click(".agent >> [aria-label=길잡이\\ 닫기]")
        print("사건을 연 뒤 할 일:", one(await text(".note p")), "/ 떼는 세금 타일:", one(await text(".over > div >> nth=1")))
        print("누가 무엇을:", one(await text(".roles")))
        await shot("home_사건")

        # 1. 받을 계좌
        await f.click(".note >> text=받을 계좌 정하기"); await f.wait_for_selector(".opts.two")
        print("꺼내게 되는 돈 줄:", await row("그때 꺼내게 되는 돈"))
        print("세액공제를 빼면 줄:", await row("받았던 세액공제를 빼면"))
        print("일부만 필요할 때 줄:", await row("나중에 일부만 필요할 때"))
        await f.click(".top >> text=길잡이"); await f.wait_for_selector(".agent")
        print("연결 전 꺼내게 되는 돈 줄:", await row("그때 꺼내게 되는 돈"))
        print("받을 계좌를 물으면(연결 전):", await ask("IRP 있는데 거기로 받아도 돼요?"))
        await f.click(".agent >> text=읽기에 동의하기"); await f.wait_for_timeout(400)
        print("동의한 뒤 세액공제를 빼면 줄:", await row("받았던 세액공제를 빼면"))
        print("받을 계좌를 물으면:", await ask("IRP 있는데 거기로 받아도 돼요?"))
        await f.click(".agent .trace summary >> nth=-1")
        print("어떻게 답했나요:", one(await text(".agent .trace >> nth=-1")))
        await shot()  # 그림에서는 아무것도 골라 두지 않는다
        print("대신 해 달라고 하면:", await ask("계좌 대신 열어 줘"))
        print("연금으로 받으면:", await ask("나중에 연금으로 받으면요?"))
        await f.click(".opts.two button >> nth=1")
        print("상품을 청하면:", await ask("ETF 추천해줘"))
        print("세금을 물으면:", await ask("깨면 얼마 떼요?"))
        await f.click(".agent >> [aria-label=길잡이\\ 닫기]")

        # 2. 회사에 낼 것
        await f.click("text=이 계좌로 받기"); await f.wait_for_selector(".doc")
        print("계좌를 열기 전 서류:", one(await text(".card.span7 h2")), "/ 냈어요 단추 잠김:", await f.is_disabled("text=회사에 냈어요"))
        await f.click("text=계좌를 열었어요"); await f.wait_for_timeout(400); await shot()
        print("보낼 글:", one(await text(".mail"))[:80])
        print("서류의 계좌번호:", one(await text(".doc div >> nth=2")))
        # 3. 일정
        await f.click("text=회사에 냈어요"); await f.wait_for_selector(".tl")
        for _ in range(5):
            await f.click(".demo >> text=7일 지나게 하기"); await f.wait_for_timeout(200)
        await f.click(".demo >> text=퇴직금 입금시키기"); await f.wait_for_selector(".tl li.done >> nth=5"); await shot()
        print("지켜보는 것:", one(await text(".set")))
        print("입금 뒤 할 일:", one(await text(".state b")))

        # 4. 꺼내기 전
        await f.click(".side nav >> text=꺼내기 전"); await f.wait_for_selector(".form.inline")
        print("말에서 뽑아 둔 필요한 돈:", await f.input_value(".form.inline input"), await f.input_value(".form.inline select"))
        await f.select_option(".form.inline select", "living"); await f.click(".form.inline >> text=비교하기"); await f.wait_for_selector(".verdict >> text=일부만 꺼낼 수 없음")
        print("사유 판정(생활비):", one(await text(".verdict")))
        print("요약 타일:", one(await text(".over")))
        print("차이 줄:", await row("필요한 금액과의 차이"))
        await f.select_option(".form.inline select", "lease"); await f.click(".form.inline >> text=비교하기"); await f.wait_for_timeout(400)
        print("사유 판정(전세):", one(await text(".verdict")))
        print("일부만 꺼낼 때:", one(await text(".card >> nth=0")))
        await f.select_option(".form.inline select", "living"); await f.click(".form.inline >> text=비교하기"); await f.wait_for_timeout(400)
        await f.click(".top >> text=길잡이"); await f.wait_for_selector(".agent")
        print("어느 쪽이 나은지 물으면:", await ask("깨는 게 나을까요?"))
        await shot()
        await f.click(".agent >> [aria-label=길잡이\\ 닫기]")
        await f.click(".opts button >> nth=2"); await f.click(".box >> text=해지하기 >> nth=-1"); await f.wait_for_selector(".dialog")
        print("해지 확인 창:", one(await text(".dialog p"))); await f.click(".dialog >> text=그만두기")
        await f.click(".box >> text=사람과 상담하기"); await f.wait_for_timeout(300)
        await f.click(".opts button >> nth=1"); await f.click(".box >> text=이렇게 정하기"); await f.wait_for_timeout(400)
        await f.click(".side nav >> text=기록 >> nth=-1"); await f.wait_for_selector(".vh >> text=기록")
        print("기록 맨 위:", one(await text(".tbl tbody tr >> nth=0")))
        await shot("기록")
        over = await f.evaluate("document.documentElement.scrollWidth > innerWidth")
        # 계산기, 알림, 길잡이가 한 일
        await f.click(".side nav >> text=세금 계산기"); await f.wait_for_selector(".form.inline")
        await f.fill(".form.inline input >> nth=0", "5000"); await f.fill(".form.inline input >> nth=1", "10"); await f.click("text=셈하기"); await f.wait_for_timeout(400)
        print("계산기 5,000만 원·10년:", one(await text(".over")), "/", await row("퇴직금에서 떼는 세금"))
        await shot("06_세금_계산기", True)
        await f.click(".side nav >> text=알림"); await f.wait_for_selector(".set")
        await f.click("[role=switch][aria-label=문자]"); await f.wait_for_timeout(300)
        print("문자를 켜면:", await f.get_attribute("[role=switch][aria-label=문자]", "aria-checked"), "/ 받은 알림:", one(await text(".tbl tbody tr >> nth=0")))
        await shot("07_알림", True)
        await f.click(".side nav >> text=길잡이가 한 일"); await f.wait_for_selector(".runs")
        print("도구 수:", one(await text(".card.span7 h2")), "/ 실행 기록 맨 위:", one(await text(".runs details >> nth=0")))
        await shot("08_길잡이가_한_일", True)
        over = over or await f.evaluate("document.documentElement.scrollWidth > innerWidth")

        # 기존 IRP로 받고 해지하는 길
        await f.click(".demo >> text=처음 상태로"); await f.click(".side nav >> text=내 퇴직금")
        await f.click(".manual summary"); await f.click(".form >> text=상황 알리기"); await f.wait_for_selector(".steps")
        await f.click(".side nav >> text=받을 계좌"); await f.click(".opts.two button >> nth=0"); await f.click("text=이 계좌로 받기"); await f.wait_for_selector(".doc")
        print("연결 없이 기존 IRP를 고르면 서류:", one(await text(".card.span7 h2")))
        await f.click("text=회사에 냈어요"); await f.wait_for_selector(".tl")
        for _ in range(5):
            await f.click(".demo >> text=7일 지나게 하기"); await f.wait_for_timeout(200)
        print("기한이 지나면:", one(await text(".state b")))
        await f.click(".demo >> text=퇴직금 입금시키기"); await f.wait_for_timeout(400)
        await f.click(".side nav >> text=꺼내기 전"); await f.wait_for_selector(".box.row")
        print("연결 없이 꺼내기 전:", one(await text(".box.row h2")))
        await f.click("text=다른 금융사 연금 계좌 불러오기"); await f.wait_for_selector(".form.inline")
        await f.click(".form.inline >> text=비교하기"); await f.wait_for_selector(".verdict")
        print("섞어 받은 경우 요약:", one(await text(".over")))
        await f.click(".opts button >> nth=2"); await f.click(".box >> text=해지하기로 정하기"); await f.wait_for_timeout(400)
        await f.click(".side nav >> text=기록 >> nth=-1"); await f.wait_for_selector(".vh >> text=기록")
        print("해지 기록:", one(await text(".tbl tbody tr >> nth=0")))

        # 통장으로 이미 받은 길
        await f.click(".demo >> text=처음 상태로"); await f.click(".side nav >> text=내 퇴직금")
        await f.click(".manual summary"); await f.select_option(".form select >> nth=1", "cash"); await f.click(".form >> text=상황 알리기"); await f.wait_for_selector(".steps")
        await f.click(".side nav >> text=일정"); await f.wait_for_selector(".box.row")
        print("통장으로 받은 경우:", one(await text(".box.row")))
        for _ in range(7):
            await f.click(".demo >> text=7일 지나게 하기"); await f.wait_for_timeout(200)
        print("49일 뒤 알림:", one(await text(".state b")))
        await shot("통장으로_받은_경우")
        await f.click("text=IRP에 넣고 신고서 내기"); await f.wait_for_timeout(400)
        print("넣은 뒤 일정 마지막 줄:", one(await text(".tl li >> nth=-1")))
        print("가로 넘침:", over, "/ 오류:", errs)
        await f.click(".demo >> text=처음 상태로")

        # 휴대폰 폭에서도 같은 화면이 나온다
        m = await b.new_page(viewport={"width": 390, "height": 844}, device_scale_factor=3)
        m.on("pageerror", lambda e: errs.append(str(e)))
        await m.goto(BASE); await m.wait_for_selector(".app")
        await m.add_style_tag(content=".demo,.toast{display:none!important}")
        await m.click(".manual summary"); await m.click(".form >> text=상황 알리기"); await m.wait_for_selector(".steps")
        await m.click(".side nav >> text=받을 계좌"); await m.wait_for_selector(".opts.two"); await m.wait_for_timeout(500)
        await m.screenshot(path=str(OUT / "m_01_받을계좌.png"))
        await m.click(".opts.two button >> nth=1"); await m.click("text=이 계좌로 받기"); await m.wait_for_selector(".doc")
        await m.click("text=계좌를 열었어요"); await m.wait_for_timeout(300); await m.click("text=회사에 냈어요"); await m.wait_for_selector(".tl")
        await m.evaluate("fetch('/api/deposit',{method:'POST',body:'{}'})"); await m.wait_for_timeout(400)
        await m.goto(BASE + "#withdraw"); await m.reload(); await m.wait_for_selector(".form.inline")
        await m.add_style_tag(content=".demo,.toast{display:none!important}")
        await m.click(".form.inline >> text=비교하기"); await m.wait_for_selector(".verdict"); await m.wait_for_timeout(500)
        await m.screenshot(path=str(OUT / "m_02_꺼내기전.png"))
        print("휴대폰 폭 가로 넘침:", await m.evaluate("document.documentElement.scrollWidth > innerWidth"))
        await m.evaluate("fetch('/api/reset',{method:'POST',body:'{}'})")

        # 네 화면을 한 장으로
        cells = ""
        for i, (t, d) in enumerate(CAPS, 1):
            img = base64.b64encode((OUT / f"0{i}_화면.png").read_bytes()).decode()
            cells += f'<figure><figcaption><b><i>{i}</i>{t}</b><span>{d}</span></figcaption><img src="data:image/png;base64,{img}"></figure>'
        html = f"""<meta charset="utf-8"><link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css">
<style>body{{margin:0;padding:40px;width:1520px;box-sizing:border-box;font-family:'Pretendard Variable',sans-serif;color:#111;word-break:keep-all;letter-spacing:-.01em}}
h1{{margin:0 0 6px;font-size:32px;letter-spacing:-.04em}}p{{margin:0 0 30px;color:#555}}main{{display:grid;grid-template-columns:1fr 1fr;gap:30px 24px}}
figure{{margin:0;display:grid;gap:10px}}figcaption{{display:grid;gap:2px}}b{{font-size:18px;display:flex;gap:8px;align-items:center}}i{{font-style:normal;width:26px;height:26px;border-radius:50%;background:#008485;color:#fff;font-size:14px;display:grid;place-items:center}}
span{{color:#555;font-size:14px}}img{{width:100%;border:1px solid #d5d9dd;border-radius:10px;display:block}}footer{{margin-top:26px;color:#555;font-size:13px}}</style>
<h1>퇴직금 길잡이 화면 흐름</h1><p>받을 계좌를 정하고, 회사에 서류를 내고, 입금을 확인하고, 깨기 전에 비교하기까지.</p><main>{cells}</main>
<footer>점선 테두리는 길잡이가 건네는 안내예요. 길잡이는 어느 쪽이 낫다고 권하지 않고, 고르는 일과 본인 확인은 손님이 해요. 설명용 시안이며 계좌·금액·날짜는 지어낸 값이에요.</footer>"""
        s = await b.new_page(viewport={"width": 1520, "height": 900}, device_scale_factor=1.5)
        await s.set_content(html); await s.wait_for_timeout(1500)
        await s.screenshot(path=str(OUT / "00_화면흐름_한장.png"), full_page=True)
        await b.close()

asyncio.run(main())
