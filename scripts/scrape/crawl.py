# Crawl midvalleystorage.com: every page in the sitemap plus every internal link found, saving raw HTML and a
# structured summary per page. Never submits forms (the Employee page's password gate is only recorded).
import json, re, subprocess, sys, html
from urllib.parse import urljoin, urlparse, urldefrag
from bs4 import BeautifulSoup, Comment

OUT = sys.argv[1]
HOST = "midvalleystorage.com"
seeds = sys.argv[2:]

def fetch(url):
    r = subprocess.run(["curl", "-sS", "-L", "-m", "40", "-w", "\n__META__%{http_code} %{url_effective}", url], capture_output=True, text=True)
    body, _, meta = r.stdout.rpartition("\n__META__")
    code, _, final = meta.partition(" ")
    return int(code or 0), final, body

def is_page(u):
    p = urlparse(u)
    if p.netloc.replace("www.", "") != HOST: return False
    if re.search(r"\.(jpe?g|png|gif|webp|svg|pdf|mp4|webm|css|js|xml|ico)$", p.path, re.I): return False
    if p.path.startswith(("/wp-admin", "/wp-content", "/wp-includes", "/wp-json", "/feed", "/comments/feed", "/xmlrpc")): return False
    if "/feed" in p.path: return False
    return True

def norm(u):
    u = urldefrag(u)[0]
    p = urlparse(u)
    path = p.path or "/"
    return f"https://{HOST}{path}" + (f"?{p.query}" if p.query and not p.query.startswith("replytocom") else "")

def text_of(el):
    return re.sub(r"\s+", " ", el.get_text(" ", strip=True)).strip()

def biggest_from_srcset(s):
    best, bw = None, -1
    for part in s.split(","):
        bits = part.strip().split()
        if not bits: continue
        w = int(bits[1][:-1]) if len(bits) > 1 and bits[1].endswith("w") and bits[1][:-1].isdigit() else 0
        if w > bw: best, bw = bits[0], w
    return best

def parse(url, final, code, body):
    soup = BeautifulSoup(body, "html.parser")
    for c in soup.find_all(string=lambda s: isinstance(s, Comment)): c.extract()
    meta = {m.get("name") or m.get("property"): m.get("content") for m in soup.find_all("meta") if (m.get("name") or m.get("property"))}
    page = {
        "url": url, "final_url": final, "status": code,
        "title": text_of(soup.title) if soup.title else "",
        "meta_description": meta.get("description", ""),
        "og": {k: v for k, v in meta.items() if k and k.startswith("og:")},
        "headings": [{"level": h.name, "text": text_of(h)} for h in soup.find_all(re.compile("^h[1-6]$")) if text_of(h)],
    }
    links, images, embeds, backgrounds, videos, settings = [], [], [], [], [], []
    for a in soup.find_all("a", href=True):
        links.append({"text": text_of(a), "aria_label": a.get("aria-label", ""), "href": html.unescape(a["href"]), "target": a.get("target", "")})
    for img in soup.find_all("img"):
        src = img.get("data-src") or img.get("src") or ""
        srcset = img.get("data-srcset") or img.get("srcset") or ""
        images.append({"src": src, "largest_in_srcset": biggest_from_srcset(srcset) if srcset else "", "alt": img.get("alt"), "width": img.get("width"), "height": img.get("height"), "class": " ".join(img.get("class", []))})
    for f in soup.find_all(["iframe", "embed", "object"]):
        embeds.append({"tag": f.name, "src": f.get("src") or f.get("data-src") or f.get("data") or "", "title": f.get("title", "")})
    for v in soup.find_all(["video", "source"]):
        if v.get("src"): videos.append(v.get("src"))
    for el in soup.find_all(style=True):
        for m in re.findall(r"url\(['\"]?([^'\")]+)", el["style"]): backgrounds.append(m)
    for el in soup.find_all(attrs={"data-settings": True}):
        try:
            d = json.loads(html.unescape(el["data-settings"]))
        except Exception:
            continue
        settings.append({"element": el.get("data-id") or el.get("class"), "settings": d})
        for k, v in d.items():
            if isinstance(v, dict) and v.get("url") and re.search(r"\.(jpe?g|png|gif|webp|svg)", v["url"], re.I): backgrounds.append(v["url"])
            if "video" in k and isinstance(v, str) and v: videos.append(v)
            if k.endswith("gallery") and isinstance(v, list):
                backgrounds.extend(x.get("url") for x in v if isinstance(x, dict) and x.get("url"))
    # Visible text in reading order (scripts, styles and hidden templates removed).
    main = soup.body or soup
    for t in main.find_all(["script", "style", "noscript", "template", "svg"]): t.decompose()
    blocks, last = [], None
    for el in main.find_all(["h1", "h2", "h3", "h4", "h5", "h6", "p", "li", "a", "button", "span", "figcaption", "blockquote", "label", "td", "th", "div"]):
        if el.find(["h1", "h2", "h3", "h4", "h5", "h6", "p", "li", "div", "figcaption", "blockquote", "td"]): continue
        t = text_of(el)
        if t and t != last:
            blocks.append(t); last = t
    page.update({"text_blocks": blocks, "links": links, "images": images, "backgrounds": sorted(set(backgrounds)), "videos": sorted(set(videos)), "embeds": embeds, "elementor_settings": settings,
                 "password_form": bool(soup.find("form", class_=re.compile("post-password-form")) or soup.find("input", attrs={"type": "password"})),
                 "stylesheets": [l.get("href") for l in soup.find_all("link", rel="stylesheet") if l.get("href")]})
    return page

seen, queue, pages = set(), [norm(s) for s in seeds], []
while queue and len(seen) < 80:
    u = queue.pop(0)
    if u in seen: continue
    seen.add(u)
    code, final, body = fetch(u)
    slug = (urlparse(u).path.strip("/").replace("/", "__") or "home") + (("__" + re.sub(r"\W", "_", urlparse(u).query)) if urlparse(u).query else "")
    open(f"{OUT}/html/{slug}.html", "w").write(body)
    page = parse(u, final, code, body)
    page["slug"] = slug
    if "/employee" in u:
        # Record only that the gate exists; the protected content is not scraped.
        page["text_blocks"] = [t for t in page["text_blocks"] if len(t) < 300]
    pages.append(page)
    json.dump(page, open(f"{OUT}/pages/{slug}.json", "w"), indent=2)
    print(code, u, "->", final, "| links", len(page["links"]), "imgs", len(page["images"]), "bgs", len(page["backgrounds"]), "pw-form" if page["password_form"] else "")
    for l in page["links"]:
        h = urljoin(final or u, l["href"])
        if h.startswith("http") and is_page(h):
            n = norm(h)
            if n not in seen and n not in queue: queue.append(n)
json.dump(sorted(seen), open(f"{OUT}/crawled.json", "w"), indent=2)
