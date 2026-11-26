"""화면 그림 뽑기와 동작 점검. 먼저 `npm run dev`로 서버를 띄운 뒤 실행한다: python3 scripts/shots.py"""
import asyncio, base64, pathlib, sys
from playwright.async_api import async_playwright

BASE = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:5173/"
OUT = pathlib.Path(__file__).resolve().parent.parent / "shots"
CAPS = [
    ("체결 직후 알림", "주문이 체결되면 한눈에 보기 맨 위와 비서 단추에 서비스 값 한 줄이 떠요."),
    ("낸 돈과 쓴 만큼", "서비스마다 낸 값과 열어 본 날을 나란히 놓고, 셈 내역을 펼쳐 보여 줘요."),
    ("내 숫자로 답하기", "오른쪽 비서 칸에서 물으면 손님 거래 금액으로 셈한 내역으로 답해요."),
    ("제안하고 확인 받기", "비서는 쉬기를 제안만 해요. 손님이 누르기 전에는 아무것도 바꾸지 않아요."),
    ("끝난 뒤와 되돌리기", "바뀐 내용을 알리고 되돌리기를 바로 옆에 남겨요. 다시 켜는 일은 손님만 해요."),
    ("규칙 맡기기", "석 달 안 보면 미리 알리고 쉬게 하는 규칙을 손님이 켜고, 뺄 서비스를 골라요."),
]

async def main():
    OUT.mkdir(exist_ok=True)
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
        async def shot():
            nonlocal n; n += 1
            await f.wait_for_timeout(600); await f.evaluate("scrollTo(0,0)")
            await f.screenshot(path=str(OUT / f"0{n}_화면.png"))
        text = lambda sel: f.inner_text(sel)

        await f.screenshot(path=str(OUT / "home_처음.png"))
        # 1. 체결 직후 알림
        await f.click(".demo >> text=주문 체결시키기"); await f.wait_for_selector(".note >> text=내역 보기")
        print("첫 화면 알림:", await text(".note p"), "/ 왼쪽 상태:", await text(".state b"))
        await shot()
        await f.click(".demo >> text=주문 체결시키기"); await f.wait_for_timeout(300)
        # 2. 낸 돈과 쓴 만큼
        await f.click(".note >> text=내역 보기"); await f.wait_for_selector(".tbl")
        await f.click(".more >> nth=0"); await shot()
        print("안 쓰는 서비스 안내:", (await text(".note p")))
        # 3. 내 숫자로 답하기
        await f.click(".note >> text=비서에게 묻기"); await f.wait_for_selector(".agent")
        await f.click(".asks >> text=어떻게 셈했나요"); await f.wait_for_selector(".mini"); await shot()
        # 4. 제안하고 확인 받기
        await f.fill(".agent input", "다시 켜줘"); await f.press(".agent input", "Enter"); await f.wait_for_timeout(300)
        print("다시 켜 달라고 하면:", await text(".say >> nth=-1"))
        await f.fill(".agent input", "종목 추천해줘"); await f.press(".agent input", "Enter"); await f.wait_for_timeout(300)
        print("종목 추천을 청하면:", await text(".say >> nth=-1"))
        await f.click(".side >> text=가입 서비스 관리")
        await f.fill(".agent input", "HINT 플러스 쉬게 해줘"); await f.press(".agent input", "Enter"); await f.wait_for_selector(".prop")
        print("제안 전 상태:", await text(".svc >> nth=0 >> .chip >> nth=0")); await shot()
        # 5. 끝난 뒤와 되돌리기
        await f.click(".prop >> text=쉬게 하기"); await f.wait_for_selector(".rest")
        print("승인 뒤 상태:", await text(".svc >> nth=0 >> .chip >> nth=0")); await shot()
        await f.click(".say >> nth=-1 >> text=되돌리기"); await f.wait_for_timeout(300)
        print("되돌린 뒤 상태:", await text(".svc >> nth=0 >> .chip >> nth=0"))
        await f.click(".svc >> nth=0 >> text=쉬게 하기"); await f.wait_for_selector(".rest")
        print("화면에서 직접 쉬기:", await text(".svc >> nth=0 >> .chip >> nth=0"), "/ 토스트:", (await text(".toast")).replace("\n", " "))
        await f.click(".toast >> text=되돌리기"); await f.wait_for_timeout(300)
        # 해지는 확인 창을 거친다
        await f.click(".svc >> nth=1 >> .opts button >> nth=2"); await f.click(".svc >> nth=1 >> text=해지하기"); await f.wait_for_selector(".dialog")
        print("해지 확인 창:", await text(".dialog h2")); await f.click(".dialog >> text=그만두기")
        # 6. 규칙 맡기기
        await f.click(".side nav >> text=알림 규칙"); await f.click(".sw >> nth=0"); await f.wait_for_timeout(300)
        print("규칙 켠 뒤:", await text(".tbl tbody tr >> nth=0 >> td >> nth=2")); await shot()
        await f.click(".demo >> text=7일 지나게 하기"); await f.wait_for_timeout(300)
        print("7일 뒤:", await text(".tbl tbody tr >> nth=0 >> td >> nth=2"))
        await f.click(".side >> text=활동 기록"); await f.wait_for_selector(".vh >> text=활동 기록")
        print("기록 맨 위:", (await text(".tbl tbody tr >> nth=0")).replace("\n", " ").replace("\t", " "))
        await f.screenshot(path=str(OUT / "활동기록.png"))
        over = await f.evaluate("document.documentElement.scrollWidth > innerWidth")
        print("가로 넘침:", over, "/ 오류:", errs)
        await f.click(".demo >> text=처음 상태로")

        # 여섯 화면을 한 장으로
        cells = ""
        for i, (t, d) in enumerate(CAPS, 1):
            img = base64.b64encode((OUT / f"0{i}_화면.png").read_bytes()).decode()
            cells += f'<figure><figcaption><b><i>{i}</i>{t}</b><span>{d}</span></figcaption><img src="data:image/png;base64,{img}"></figure>'
        html = f"""<meta charset="utf-8"><link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css">
<style>body{{margin:0;padding:40px;width:1520px;box-sizing:border-box;font-family:'Pretendard Variable',sans-serif;color:#111;word-break:keep-all;letter-spacing:-.01em}}
h1{{margin:0 0 6px;font-size:32px;letter-spacing:-.04em}}p{{margin:0 0 30px;color:#555}}main{{display:grid;grid-template-columns:1fr 1fr;gap:30px 24px}}
figure{{margin:0;display:grid;gap:10px}}figcaption{{display:grid;gap:2px}}b{{font-size:18px;display:flex;gap:8px;align-items:center}}i{{font-style:normal;width:26px;height:26px;border-radius:50%;background:#008485;color:#fff;font-size:14px;display:grid;place-items:center}}
span{{color:#555;font-size:14px}}img{{width:100%;border:1px solid #d5d9dd;border-radius:10px;display:block}}footer{{margin-top:26px;color:#555;font-size:13px}}</style>
<h1>수수료 비서 화면 흐름</h1><p>체결 직후 알림에서 시작해, 낸 돈과 쓴 만큼을 보고, 쉬기를 확인하고, 규칙을 맡기기까지.</p><main>{cells}</main>
<footer>점선 테두리는 비서가 건네는 안내예요. 비서는 손님 돈이 덜 나가는 쪽으로만 스스로 움직여요. 설명용 시안이며 금액·날짜·종목은 지어낸 값이에요.</footer>"""
        s = await b.new_page(viewport={"width": 1520, "height": 900}, device_scale_factor=1.5)
        await s.set_content(html); await s.wait_for_timeout(1500)
        await s.screenshot(path=str(OUT / "00_화면흐름_한장.png"), full_page=True)
        await b.close()

asyncio.run(main())
