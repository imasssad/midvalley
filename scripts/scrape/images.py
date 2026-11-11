# Download every image the live site uses, at full size, into public/images with clean names,
# and write content/image-map.json (original URL(s) -> local path, where it is used).
import json, os, subprocess, sys
U = "https://midvalleystorage.com/wp-content/uploads/"
REPO = sys.argv[1]
# (clean name, upload path of the largest version WordPress serves, [other URLs seen on the site], used on)
items = [
 ("logo.svg", "2020/06/Midvalley-Logo.svg", [], ["header", "footer"]),
 ("site-icon.png", "2020/06/cropped-Midvalley-mark.png", ["2020/06/cropped-Midvalley-mark-32x32.png", "2020/06/cropped-Midvalley-mark-192x192.png", "2020/06/cropped-Midvalley-mark-180x180.png"], ["favicon / app icon"]),
 ("hero-promo-desktop.png", "2026/08/desktop.png", [], ["home hero background (desktop)"]),
 ("hero-promo-tablet.png", "2026/08/tablet.png", [], ["home hero background (tablet)"]),
 ("hero-promo-mobile.png", "2026/08/mobile.png", [], ["home hero background (mobile)"]),
 ("lobby.jpg", "2020/06/Lobby11.jpg", ["2020/06/Lobby11-1024x630.jpg"], ["home: About Mid Valley Storage"]),
 ("facility-7cc08763-hdr.jpg", "2020/06/7CC08763-HDR.jpg", ["2020/06/7CC08763-HDR-300x200.jpg"], ["home: Storage Options gallery", "facilityfeatures: section background", "contact: section background"]),
 ("facility-7cc08783.jpg", "2020/06/7CC08783.jpg", ["2020/06/7CC08783-300x200.jpg"], ["home: Storage Options gallery", "home: testimonials section background", "about-us: section background", "contact: section background"]),
 ("aerial-dji-0050.jpg", "2020/06/DJI_0050.jpg", ["2020/06/DJI_0050-300x200.jpg"], ["home: Storage Options gallery"]),
 ("facility-img-2020.jpg", "2020/06/IMG_2020.jpg", ["2020/06/IMG_2020-300x200.jpg"], ["home: Storage Options gallery"]),
 ("facility-features.jpg", "2019/12/A4D21FCC-AFB1-4D83-B047-FC26C98760DD.jpg", ["2019/12/A4D21FCC-AFB1-4D83-B047-FC26C98760DD-1024x944.jpg"], ["home: Facility Features"]),
 ("large-storage-units.jpg", "2020/04/dover-large-storage-units.jpg", [], ["footer gallery"]),
 ("friendly-staff.jpg", "2020/06/Service-Final-scaled.jpg", ["2020/06/Service-Final-2048x1287.jpg"], ["footer gallery", "facilityfeatures: Friendly Staff"]),
 ("temperature-controlled.jpg", "2020/06/Temperature-Controlled11.jpg", [], ["footer gallery", "facilityfeatures: Temperature Controlled Storage"]),
 ("facility-img-20200518.jpg", "2020/06/IMG_20200518_110511-scaled-e1591656308255.jpg", ["2020/06/IMG_20200518_110511-scaled-e1591656308255-150x150.jpg"], ["footer gallery", "about-us: slider"]),
 ("rv-storage-img-4031.jpg", "2020/06/IMG_4031-scaled.jpg", [], ["footer gallery", "facilityfeatures: Individual Enclosed RV Storage"]),
 ("free-truck.jpg", "2020/06/freetruck.jpg", [], ["footer gallery"]),
 ("office-elevation.jpg", "2020/06/Office-Elevation2.jpg", ["2020/06/Office-Elevation2-150x150.jpg"], ["about-us: slider"]),
 ("night-full-elevation.jpg", "2020/06/Night-Full-Elevation1-1.jpg", ["2020/06/Night-Full-Elevation1-1-150x150.jpg"], ["about-us: slider"]),
 ("rss.jpg", "2020/06/RSS.jpg", ["2020/06/RSS-150x150.jpg"], ["about-us: slider"]),
 ("keycode-access.jpg", "2022/07/MID-VALLEY-STORAGE-13-scaled.jpg", ["elementor/thumbs/MID-VALLEY-STORAGE-13-scaled-prbu2zsu9o9oorlvmbmic7kze024te42p49vipw134.jpg"], ["facilityfeatures: Individual Keycode Access"]),
 ("outside-storage.jpg", "2020/06/IMG_4258-scaled.jpg", ["elementor/thumbs/IMG_4258-scaled-orf10tr6jayu5v4mc60cvsg5scopjaxc6552sw2jcw.jpg"], ["facilityfeatures: Outside Storage"]),
 ("drive-aisles-7cc08785.jpg", "2020/06/7CC08785.jpg", [], ["facilityfeatures: Easy accessibility"]),
 ("gate-access.jpg", "2020/06/IMG_20200610_191322-scaled.jpg", ["2020/06/IMG_20200610_191322-2048x1536.jpg"], ["facilityfeatures: Convenient Access"]),
 ("security.jpg", "2020/06/Security-scaled.jpg", ["2020/06/Security-2048x1536.jpg"], ["facilityfeatures: Security"]),
]
def get(url, dest):
    r = subprocess.run(["curl", "-sS", "-f", "-m", "120", "-o", dest, "-w", "%{http_code} %{content_type}", url], capture_output=True, text=True)
    return r.returncode == 0, r.stdout + r.stderr
out = []
for name, path, seen, used in items:
    dest = f"{REPO}/public/images/{name}"
    tried = []
    # WordPress keeps the uploaded original next to the "-scaled" copy; prefer the original (full size).
    cands = [path.replace("-scaled", "")] if "-scaled" in path and "-e159" not in path else []
    cands.append(path)
    got = None
    for c in cands:
        ok, info = get(U + c, dest)
        tried.append(f"{c}: {info.strip()}")
        if ok and "image" in info: got = c; break
    if not got:
        print("FAILED", name, tried); continue
    out.append({"local": f"/images/{name}", "downloaded_from": U + got, "also_seen_as": [U + s for s in seen] + ([U + path] if got != path else []), "used_on": used})
    print("ok", name, got)
json.dump(out, open(f"{REPO}/content/image-map.json", "w"), indent=2)
