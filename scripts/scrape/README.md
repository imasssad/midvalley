# Phase 1 scrape scripts

How `content/` and `public/images/` were made from the live WordPress site (midvalleystorage.com).
Python 3 with BeautifulSoup; `curl` for fetching.

1. `crawl.py OUT_DIR URL...` saves each page's HTML (`OUT_DIR/html/`) and a summary (`OUT_DIR/pages/`).
   It never submits forms; the Employee page's password form is only recorded.
2. `images.py REPO_DIR` downloads every image the site uses at full size into `public/images/` and writes
   `content/image-map.json` (original URL to local path).
3. `content.py REPO_DIR` (run from `OUT_DIR`'s parent, which holds `crawl/`) writes `content/pages/*.json`.

`content/site.json`, `content/inventory.json`, `content/pages/employee.json` and `content/pages/404.json` were written by hand from the crawl.
