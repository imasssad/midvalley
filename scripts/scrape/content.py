# Build content/pages/*.json from the saved live HTML: ordered blocks of the page body (header and footer
# templates excluded; those go to site.json), text exactly as written (line breaks kept), links, images.
import json, re, sys
from bs4 import BeautifulSoup
REPO = sys.argv[1]
imap = json.load(open(f"{REPO}/content/image-map.json"))
local = {}
for i in imap:
    for u in [i["downloaded_from"], *i["also_seen_as"]]: local[u] = i["local"]
def loc(u): return local.get(u)
def text(el):
    for br in el.find_all("br"): br.replace_with("\n")
    t = el.get_text("")
    lines = [re.sub(r"[ \t\r\f\v\xa0]+", " ", l).strip() for l in t.split("\n")]
    return "\n".join(l for l in lines if l)
def blocks(root):
    out = []
    for w in root.select("[data-widget_type]"):
        if w.find_parent(attrs={"data-widget_type": True}): continue
        kind = w["data-widget_type"].split(".")[0]
        b = {"widget": kind}
        if kind == "jet-horizontal-timeline":
            b["items"] = []
            for it in w.select(".jet-hor-timeline-item"):
                parts = [p for p in it.get_text("|", strip=True).split("|") if p.strip()]
                if len(parts) >= 2: b["items"].append({"year": parts[0].strip(), "text": " ".join(p.strip() for p in parts[1:])})
            out.append(b); continue
        if kind == "form":
            b["fields"] = []
            for g in w.select(".elementor-field-group"):
                lab = g.find("label"); inp = g.find(["input", "textarea", "select"])
                if not inp or inp.get("type") == "hidden": continue
                f = {"label": text(lab) if lab else None, "type": inp.get("type") or inp.name, "name": inp.get("name"), "required": inp.has_attr("required")}
                if inp.name == "select": f["options"] = [o.get_text(strip=True) for o in inp.find_all("option")]
                if not f["label"]: f["note"] = "unlabelled field (likely spam honeypot)"
                b["fields"].append(f)
            btn = w.find("button"); b["submit_label"] = text(btn) if btn else None
            out.append(b); continue
        hs = [{"level": h.name, "text": text(h)} for h in w.find_all(re.compile("^h[1-6]$"))]
        if hs: b["headings"] = hs
        ps = [text(p) for p in w.find_all("p") if text(p)]
        if ps: b["paragraphs"] = ps
        lis = [text(li) for li in w.find_all("li") if text(li)]
        if lis: b["list"] = lis
        if not (hs or ps or lis):
            t = text(w)
            if t: b["text"] = t
        ls = []
        for a in w.find_all("a"):
            if not a.get("href"): continue
            l = {"text": text(a), "href": a["href"]}
            if a.get("target"): l["target"] = a["target"]
            if l not in ls: ls.append(l)
        if ls: b["links"] = ls
        ims = []
        for i in w.find_all("img"):
            src = i.get("data-src") or i.get("src")
            if re.search(r"-150x150\.", src or ""): continue  # slider thumbnails of the same photos
            ims.append({"src": src, "alt": i.get("alt", ""), "local": loc(src)})
        if ims: b["images"] = ims
        fr = [f.get("src") for f in w.find_all("iframe")]
        if fr: b["iframes"] = fr
        out.append(b)
    return out
def page(slug, file, extra=None):
    crawl = json.load(open(f"crawl/pages/{file}.json"))
    s = BeautifulSoup(open(f"crawl/html/{file}.html").read(), "html.parser")
    root = s.select_one('[data-elementor-type="wp-page"]')
    bl = blocks(root) if root else []
    heads = [h for b in bl for h in b.get("headings", [])]
    links = []; imgs = []
    for b in bl:
        for l in b.get("links", []):
            if l not in links: links.append(l)
        for i in b.get("images", []):
            if i not in imgs: imgs.append(i)
    d = {"url": crawl["final_url"], "title": crawl["title"], "meta_description": crawl["meta_description"] or None,
         "headings": heads, "blocks": bl, "links": links, "images": imgs}
    if extra: d.update(extra)
    json.dump(d, open(f"{REPO}/content/pages/{slug}.json", "w"), indent=2, ensure_ascii=False)
    print(slug, len(bl), "blocks", len(links), "links", len(imgs), "images")
import os; os.makedirs(f"{REPO}/content/pages", exist_ok=True)
page("home", "home", {"background_images": [
    {"section": "hero (Elementor section ed0ac0d, no text or widgets inside)", "desktop": "/images/hero-promo-desktop.png", "tablet": "/images/hero-promo-tablet.png", "mobile": "/images/hero-promo-mobile.png"},
    {"section": "What Our Customers Says", "image": "/images/facility-7cc08783.jpg"}]})
page("about-us", "about-us", {"background_images": [{"section": "page title", "image": "/images/facility-7cc08783.jpg"}]})
page("facilityfeatures", "facilityfeatures", {"background_images": [{"section": "page title", "image": "/images/facility-7cc08763-hdr.jpg"}]})
page("contact", "contact", {"background_images": [{"section": "unknown section 5e3b666", "image": "/images/facility-7cc08763-hdr.jpg"}, {"section": "unknown section d33fb4d", "image": "/images/facility-7cc08783.jpg"}]})
