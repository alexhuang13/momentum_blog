"""Check the rendered blog and save desktop/mobile review screenshots."""
from pathlib import Path
import json
import sys
from playwright.sync_api import sync_playwright

root = Path(__file__).resolve().parents[1]
out = root.parent / "tmp" / "blog-review"
out.mkdir(parents=True, exist_ok=True)
base = sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:4173/"
errors, failed = [], []
def check_chart(page):
    geometry = page.evaluate("""() => {
      const position = (axis, value) => {
        const el = document.querySelector('[data-axis="' + axis + '"][data-value="' + value + '"]');
        const point = document.querySelector('#phase-chart').createSVGPoint();
        point.x = +el.getAttribute('x'); point.y = +el.getAttribute('y');
        return point.matrixTransform(el.getScreenCTM());
      };
      return {
        width: position('x', 1).x - position('x', 0).x,
        half: position('y', 0).y - position('y', 0.5).y,
        solid: [...document.querySelectorAll('#phase-chart path, #phase-chart line')]
          .every(el => getComputedStyle(el).strokeDasharray === 'none'),
        legend: [...document.querySelectorAll('.chart-legend i')]
          .every(el => getComputedStyle(el).borderTopStyle === 'solid')
      };
    }""")
    assert abs(0.6 * geometry["width"] - geometry["half"]) < 0.1, geometry
    assert geometry["solid"] and geometry["legend"], geometry

with sync_playwright() as p:
    browser = p.chromium.launch(channel="chrome", headless=True, timeout=45000)
    context = browser.new_context(viewport={"width":1200,"height":750}, device_scale_factor=1, color_scheme="light", reduced_motion="reduce")
    page = context.new_page()
    page.on("pageerror", lambda error: errors.append(str(error)))
    page.on("response", lambda response: failed.append(f"{response.status} {response.url}") if response.status >= 400 else None)
    page.goto(base, wait_until="networkidle")
    page.screenshot(path=str(out/"desktop.png"))
    page.screenshot(path=str(root/"public"/"screenshot.jpeg"), type="jpeg", quality=88)
    assert page.locator("#rate-sgd").inner_text() == "0.180"
    assert page.locator("#rate-polyak").inner_text() == "0.231"
    assert page.locator("#rate-nesterov").inner_text() == "0.300"
    check_chart(page)
    for value, expected in [("0.1",["0.231","0.231","0.231"]),("0.8",["0.060","0.120","0.120"])]:
        page.locator("#batch-slider").fill(value)
        assert [page.locator("#rate-"+name).inner_text() for name in ["sgd","polyak","nesterov"]] == expected
    page.locator("#reset-chart").click()
    page.locator(".phase-lab").screenshot(path=str(out/"phase-diagram.png"))
    page.locator("#source-slider").fill("2")
    page.locator("#capacity-slider").fill("1.2")
    assert "NaN" not in page.locator("#phase-chart").inner_html()
    check_chart(page)
    page.locator("#reset-chart").click()
    page.locator("#theme-toggle").click()
    assert page.locator("html").get_attribute("class") == "dark"
    page.locator(".phase-lab").screenshot(path=str(out/"phase-dark.png"))
    page.reload(wait_until="networkidle")
    assert page.locator("#theme-toggle").get_attribute("aria-pressed") == "true"
    page.locator("#theme-toggle").click()
    assert page.locator(".article-footer a").count() == 1
    assert page.locator(".article-footer").inner_text().strip() == "Read the full paper ↗"
    links = page.locator("a[href]").evaluate_all("(els)=>els.map(e=>e.getAttribute('href'))")
    for link in set(links):
        if link.startswith("#"):
            assert page.locator(link).count() == 1, link
        elif not link.startswith(("http:", "https:")):
            response = context.request.get(base + link)
            assert response.status == 200, link
            if link.endswith(".pdf"): assert response.body().startswith(b"%PDF"), link
    page.locator(".lang-switch a[lang='zh-CN']").click()
    page.wait_for_load_state("networkidle")
    assert page.locator("html").get_attribute("lang") == "zh-CN"
    page.screenshot(path=str(out/"chinese-desktop.png"))
    for lang in ["index.html","zh.html"]:
        for width in [390,768,1200]:
            page.set_viewport_size({"width":width,"height":844 if width == 390 else 900})
            page.goto(base+lang,wait_until="networkidle")
            assert page.evaluate("document.documentElement.scrollWidth <= innerWidth"), (lang,width,"horizontal overflow")
            check_chart(page)
            footer_text = "Read the full paper ↗" if lang == "index.html" else "阅读完整论文 ↗"
            assert page.locator(".article-footer").inner_text().strip() == footer_text
            assert page.locator(".article-footer a").count() == 1
            page.locator("img").evaluate_all("(els)=>Promise.all(els.map(i=>{i.loading='eager';return i.decode()}))")
            assert page.locator("img").evaluate_all("(els)=>els.every(i=>i.complete && i.naturalWidth>0)")
            if width == 390:
                page.screenshot(path=str(out/("mobile-"+lang+".png")))
                page.locator(".phase-lab").screenshot(path=str(out/("mobile-phase-"+lang+".png")))
            if width == 1200: page.screenshot(path=str(out/("full-"+lang+".png")),full_page=True)
    browser.close()
assert not errors, errors
assert not failed, failed
print(json.dumps({"status":"passed","checks":["rendered exponents in three regimes","all sliders and reset","dark mode persistence","language switching","anchors and PDF links","images","no horizontal overflow at 390/768/1200px","no browser errors"],"screenshots":str(out)},ensure_ascii=False))
