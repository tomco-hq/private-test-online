"""Static store builder for the GitHub Pages + Snipcart site.

Reads ``products.json`` (the single source of truth) and regenerates:

  * ``shop.html``            -- a grid of every product
  * ``products/<slug>.html`` -- one detail page per product

It also rewrites the marked regions of hand-built pages in place:

  * ``index.html``   -- the featured-products grid
  * ``offer.html``   -- the Sunrise Print buy buttons and price text

Everything else on the hand-built pages (index, about, gallery,
contact, offer ...) is left untouched.

Usage (from the project folder)::

    C:\\anaconda\\python.exe build.py

Re-run this every time ``products.json`` changes, then commit and push.
"""

import json
import os
import re

# --- Paths ----------------------------------------------------------------

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PRODUCTS_FILE = os.path.join(BASE_DIR, "products.json")
PRODUCTS_DIR = os.path.join(BASE_DIR, "products")
SHOP_FILE = os.path.join(BASE_DIR, "shop.html")
INDEX_FILE = os.path.join(BASE_DIR, "index.html")
OFFER_FILE = os.path.join(BASE_DIR, "offer.html")
SITEMAP_FILE = os.path.join(BASE_DIR, "sitemap.xml")
ROBOTS_FILE = os.path.join(BASE_DIR, "robots.txt")
STATE_FILE = os.path.join(BASE_DIR, ".build_state.json")

# --- Deploy base path -----------------------------------------------------
#
# When the site is hosted under a subpath (e.g. GitHub Pages project site at
# https://tomco-hq.github.io/private-test-online/), every root-absolute path
# in the source (`/style.css`, `/shop.html`, `/#about`, ...) resolves against
# the host root and 404s or pulls stale files. BASE_PATH tells build.py to
# rewrite those paths in-place after the rest of the build runs.
#
#   BASE_PATH = ""                       -> local preview + user-site deploy
#   BASE_PATH = "/private-test-online"   -> project-site deploy
#
# Override per-run with the TOMCO_BASE_PATH env var. Rewriting is idempotent
# across BASE_PATH changes -- the previous value is stored in .build_state.json
# and stripped before the new value is applied, so flipping is safe.
BASE_PATH = os.environ.get("TOMCO_BASE_PATH", "/private-test-online").rstrip("/")
SITE_HOST = "https://tomco-hq.github.io"

# Crawlable static pages, as root-relative paths. The 404 page is
# intentionally excluded from the sitemap.
STATIC_PAGES = [
    "/",
    "/shop.html",
    "/gallery.html",
    "/learn-more.html",
    "/offer.html",
    "/privacy.html",
    "/terms.html",
    "/refund.html",
]

# Markers in index.html between which the featured grid is regenerated.
FEATURED_START = "<!-- BUILD:FEATURED"
FEATURED_END = "<!-- /BUILD:FEATURED -->"
FILMSTRIP_START = "<!-- BUILD:FILMSTRIP"
FILMSTRIP_END = "<!-- /BUILD:FILMSTRIP -->"
TICKER_START = "<!-- BUILD:TICKER"
TICKER_END = "<!-- /BUILD:TICKER -->"

# Hero filmstrip on the homepage shows the first N featured products.
FILMSTRIP_LIMIT = 4

# Max featured products shown on the homepage, in products.json order.
FEATURED_LIMIT = 6

# offer.html is a hand-built campaign landing page. build.py regenerates
# only its buy buttons and price text, kept in sync with this product.
OFFER_PRODUCT_ID = "print-001"

# Note: Snipcart is configured once in script.js (window.SnipcartSettings).
# No Snipcart markup or API key is emitted into pages here.


# --- Shared HTML fragments ------------------------------------------------


def nav(active):
    """Return the shared navigation bar, marking ``active`` as current."""
    links = [
        ("/", "Home"),
        ("/shop.html", "Shop"),
        ("/gallery.html", "Gallery"),
        ("/#about", "About"),
        ("/learn-more.html", "Learn More"),
        ("/#contact", "Contact"),
    ]
    items = []
    for href, label in links:
        current = ' aria-current="page"' if label == active else ""
        items.append('      <a href="%s"%s>%s</a>' % (href, current, label))
    cart = (
        '      <a href="#" class="snipcart-checkout cart-link">'
        'Cart (<span class="snipcart-items-count">0</span>)</a>'
    )
    return '    <nav class="nav">\n%s\n%s\n    </nav>' % (
        "\n".join(items),
        cart,
    )


def head(title, description, canonical):
    """Return the shared <head> block."""
    return """  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>{title}</title>
  <meta name="description" content="{description}" />
  <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
  <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
  <link rel="stylesheet" href="/style.css" />
  <meta property="og:title" content="{title}" />
  <meta property="og:description" content="{description}" />
  <meta property="og:url" content="{canonical}" />
  <meta property="og:type" content="website" />
  <meta name="twitter:card" content="summary_large_image" />""".format(
        title=title, description=description, canonical=canonical
    )


def snipcart_footer():
    """Return the site script include, placed before </body>.

    Snipcart itself is loaded by script.js (modern v3.4+ install), so no
    Snipcart-specific markup is needed on the page.
    """
    return '  <script src="/script.js"></script>'


def money(value):
    """Format a numeric price as a USD string, e.g. 25.0 -> '$25.00'."""
    return "${:,.2f}".format(value)


# --- Page builders --------------------------------------------------------


def buy_button(product, item_url):
    """Return a Snipcart 'Add to cart' button for one product.

    ``item_url`` must be the public URL of the product's own page so
    Snipcart can crawl it to validate the price at checkout.
    """
    return (
        '<button class="btn snipcart-add-item"\n'
        '        data-item-id="{id}"\n'
        '        data-item-name="{name}"\n'
        '        data-item-price="{price:.2f}"\n'
        '        data-item-url="{url}"\n'
        '        data-item-image="/{image}"\n'
        '        data-item-description="{desc}">\n'
        "        Add to cart\n"
        "      </button>"
    ).format(
        id=product["id"],
        name=product["name"],
        price=product["price"],
        url=item_url,
        image=product["image"],
        desc=product["description"].replace('"', "&quot;"),
    )


def product_card(product):
    """Return one product card (image, name, price, buy button).

    Used by both the shop grid and the homepage featured grid.
    """
    page = "/products/%s.html" % product["slug"]
    return """      <article class="product-card">
        <a href="{page}">
          <img src="/{image}" alt="{name}" />
          <h3>{name}</h3>
        </a>
        <p class="price">{price}</p>
        {button}
      </article>""".format(
        page=page,
        image=product["image"],
        name=product["name"],
        price=money(product["price"]),
        button=buy_button(product, page),
    )


def render_product_page(product, store):
    """Return the full HTML for a single product detail page."""
    canonical = "%s/products/%s.html" % (store["domain"], product["slug"])
    item_url = "/products/%s.html" % product["slug"]
    return """<!doctype html>
<html lang="en">
<head>
{head}
</head>
<body>
  <main class="container">
{nav}
    <header>
      <h1>{name}</h1>
      <p class="tagline">{price}</p>
    </header>
    <section class="product-detail">
      <img class="product-detail-img" src="/{image}" alt="{name}" />
      <p>{description}</p>
      {button}
    </section>
    <footer>
      <p class="footer-links">
        <a href="/privacy.html">Privacy</a> &middot;
        <a href="/terms.html">Terms</a> &middot;
        <a href="/refund.html">Refund Policy</a>
      </p>
      <p><a href="/shop.html">&larr; Back to shop</a></p>
      <p>&copy; <span id="year"></span> {store_name}</p>
    </footer>
  </main>
{footer}
</body>
</html>
""".format(
        head=head(
            "%s — %s" % (product["name"], store["name"]),
            product["description"],
            canonical,
        ),
        nav=nav("Shop"),
        name=product["name"],
        price=money(product["price"]),
        image=product["image"],
        description=product["description"],
        button=buy_button(product, item_url),
        store_name=store["name"],
        footer=snipcart_footer(),
    )


def render_shop_page(products, store):
    """Return the full HTML for the shop grid page."""
    canonical = "%s/shop.html" % store["domain"]
    cards = [product_card(product) for product in products]
    return """<!doctype html>
<html lang="en">
<head>
{head}
</head>
<body>
  <main class="container">
{nav}
    <header>
      <h1>Shop</h1>
      <p class="tagline">{tagline}</p>
    </header>
    <section class="product-grid">
{cards}
    </section>
    <footer>
      <p class="footer-links">
        <a href="/privacy.html">Privacy</a> &middot;
        <a href="/terms.html">Terms</a> &middot;
        <a href="/refund.html">Refund Policy</a>
      </p>
      <p>&copy; <span id="year"></span> {store_name}</p>
    </footer>
  </main>
{footer}
</body>
</html>
""".format(
        head=head(
            "Shop — %s" % store["name"],
            "Browse every product from %s." % store["name"],
            canonical,
        ),
        nav=nav("Shop"),
        tagline=store["tagline"],
        cards="\n".join(cards),
        store_name=store["name"],
        footer=snipcart_footer(),
    )


def render_filmstrip(products):
    """Return the hero filmstrip HTML (4 thumbs linking to product pages)."""
    featured = [p for p in products if p.get("featured")][:FILMSTRIP_LIMIT]
    if not featured:
        return '        <div class="hero-strip"></div>'
    items = []
    for p in featured:
        items.append(
            '          <div class="hero-strip-item" data-name="%s">\n'
            '            <a href="/products/%s.html"><img src="/%s" alt="%s" /></a>\n'
            "          </div>" % (p["name"], p["slug"], p["image"], p["name"])
        )
    return (
        '        <div class="hero-strip reveal rd3">\n'
        + "\n".join(items)
        + "\n        </div>"
    )


def render_ticker(products):
    """Return the product-name ticker HTML, doubled so the loop is seamless."""
    names = [p["name"] for p in products if p.get("featured")]
    if not names:
        names = [p["name"] for p in products[:6]]
    if not names:
        return '    <div class="ticker"><div class="ticker-track"></div></div>'
    # Double the list so the keyframe translateX(-50%) loops seamlessly.
    doubled = names + names
    items = []
    for n in doubled:
        items.append('        <span class="ticker-item">%s</span>' % n)
        items.append('        <span class="ticker-sep">·</span>')
    return (
        '    <div class="ticker">\n'
        '      <div class="ticker-track">\n' + "\n".join(items) + "\n      </div>\n"
        "    </div>"
    )


def render_featured(products):
    """Return the featured-products grid HTML for the homepage.

    Includes products with ``"featured": true``, capped at FEATURED_LIMIT
    in products.json order. Falls back to a short message (and a link to
    the shop) when none are flagged.
    """
    featured = [p for p in products if p.get("featured")][:FEATURED_LIMIT]
    if not featured:
        return (
            "      <p>No featured items yet. Browse the "
            '<a href="/shop.html">shop</a>.</p>'
        )
    cards = [product_card(product) for product in featured]
    return '      <div class="product-grid">\n%s\n      </div>' % "\n".join(cards)


# --- offer.html (hand-built campaign page) --------------------------------


def offer_buy_button(product, label, indent):
    """Return a Snipcart 'Add to cart' button styled for the offer page.

    Same data attributes as ``buy_button`` (so Snipcart validates the
    price identically) but with the ``btn-cta`` class and a custom
    ``label``. ``indent`` is the number of leading spaces for the tag.
    """
    pad = " " * indent
    item_url = "/products/%s.html" % product["slug"]
    return (
        '{pad}<button class="btn btn-cta snipcart-add-item"\n'
        '{pad}  data-item-id="{id}"\n'
        '{pad}  data-item-name="{name}"\n'
        '{pad}  data-item-price="{price:.2f}"\n'
        '{pad}  data-item-url="{url}"\n'
        '{pad}  data-item-image="/{image}"\n'
        '{pad}  data-item-description="{desc}">\n'
        "{pad}  {label}\n"
        "{pad}</button>"
    ).format(
        pad=pad,
        id=product["id"],
        name=product["name"],
        price=product["price"],
        url=item_url,
        image=product["image"],
        desc=product["description"].replace('"', "&quot;"),
        label=label,
    )


def _replace_offer_region(text, tag, make_inner):
    """Replace the content between a pair of BUILD markers in offer.html.

    Markers look like ``<!-- BUILD:<tag> -->`` ... ``<!-- /BUILD:<tag> -->``.
    ``make_inner`` is called with the indentation (a string of spaces) of
    the opening marker line and must return the replacement HTML.
    """
    start_marker = "<!-- BUILD:%s" % tag
    end_marker = "<!-- /BUILD:%s -->" % tag
    start = text.find(start_marker)
    end = text.find(end_marker)
    if start == -1 or end == -1:
        raise RuntimeError("BUILD:%s markers not found in offer.html" % tag)

    indent = text[text.rfind("\n", 0, start) + 1 : start]
    open_close = text.index("-->", start) + len("-->")
    return text[:open_close] + "\n" + make_inner(indent) + "\n" + indent + text[end:]


def update_offer(products):
    """Rewrite offer.html's buy buttons and price text in place.

    offer.html is a hand-built campaign landing page. Only the regions
    between BUILD markers are regenerated, keeping the buttons and the
    displayed price in sync with products.json for OFFER_PRODUCT_ID.
    Skipped silently if offer.html is absent.
    """
    if not os.path.exists(OFFER_FILE):
        return

    product = next((p for p in products if p["id"] == OFFER_PRODUCT_ID), None)
    if product is None:
        raise RuntimeError(
            "offer.html product id %r not found in products.json" % OFFER_PRODUCT_ID
        )

    with open(OFFER_FILE, encoding="utf-8") as handle:
        text = handle.read()

    name = product["name"]
    price = money(product["price"])

    # Four buy buttons -- same product, different call-to-action wording.
    labels = {
        "buy-hero": "Get the %s — %s" % (name, price),
        "buy-offer": "Add the %s to cart — %s" % (name, price),
        "buy-final": "Get the %s — %s" % (name, price),
        "buy-sticky": "Add to cart",
    }
    for tag, label in labels.items():
        text = _replace_offer_region(
            text,
            tag,
            lambda indent, lbl=label: offer_buy_button(product, lbl, len(indent)),
        )

    # Displayed price (offer card) and the sticky-bar label.
    text = _replace_offer_region(
        text,
        "price",
        lambda indent: (
            '%s<p class="price-line">'
            '<span class="price">%s</span> '
            '<span class="price-note">+ free shipping</span></p>' % (indent, price)
        ),
    )
    text = _replace_offer_region(
        text,
        "sticky-text",
        lambda indent: (
            '%s<span class="sticky-text">The %s — %s</span>' % (indent, name, price)
        ),
    )

    with open(OFFER_FILE, "w", encoding="utf-8") as handle:
        handle.write(text)
    print("updated offer.html (buy buttons + price for %s)" % product["id"])


def update_featured(path, products, required=True):
    """Rewrite the BUILD:FEATURED region of a hand-built page in place.

    Only the text between the BUILD:FEATURED markers is replaced; the
    rest of the hand-built page is left untouched.

    When ``required`` is False, the page is skipped silently if it is
    absent or has no markers.
    """
    if not os.path.exists(path):
        if required:
            raise RuntimeError("%s not found" % path)
        return

    with open(path, encoding="utf-8") as handle:
        text = handle.read()

    start = text.find(FEATURED_START)
    end = text.find(FEATURED_END)
    if start == -1 or end == -1:
        if required:
            raise RuntimeError(
                "BUILD:FEATURED markers not found in %s" % os.path.basename(path)
            )
        return

    # Keep the opening marker comment intact (it closes at the first '-->').
    open_close = text.index("-->", start) + len("-->")

    new_text = (
        text[:open_close] + "\n" + render_featured(products) + "\n      " + text[end:]
    )
    with open(path, "w", encoding="utf-8") as handle:
        handle.write(new_text)
    shown = min(len([p for p in products if p.get("featured")]), FEATURED_LIMIT)
    print("updated %s featured grid (%d item(s))" % (os.path.basename(path), shown))


def _update_region(
    path, start_marker, end_marker, rendered, label, trail_indent="    "
):
    """Generic in-place rewrite between two HTML-comment build markers."""
    if not os.path.exists(path):
        return
    with open(path, encoding="utf-8") as handle:
        text = handle.read()
    start = text.find(start_marker)
    end = text.find(end_marker)
    if start == -1 or end == -1:
        return
    open_close = text.index("-->", start) + len("-->")
    new_text = text[:open_close] + "\n" + rendered + "\n" + trail_indent + text[end:]
    with open(path, "w", encoding="utf-8") as handle:
        handle.write(new_text)
    print("updated %s %s" % (os.path.basename(path), label))


def update_filmstrip(path, products):
    """Rewrite the BUILD:FILMSTRIP region of the homepage in place."""
    _update_region(
        path,
        FILMSTRIP_START,
        FILMSTRIP_END,
        render_filmstrip(products),
        "filmstrip (%d item(s))"
        % min(
            len([p for p in products if p.get("featured")]),
            FILMSTRIP_LIMIT,
        ),
        trail_indent="        ",
    )


def update_ticker(path, products):
    """Rewrite the BUILD:TICKER region of the homepage in place."""
    _update_region(
        path,
        TICKER_START,
        TICKER_END,
        render_ticker(products),
        "ticker",
        trail_indent="    ",
    )


def write_sitemap(products, store):
    """Write sitemap.xml listing every static page and product page."""
    domain = store["domain"].rstrip("/")
    paths = list(STATIC_PAGES)
    paths += ["/products/%s.html" % p["slug"] for p in products]

    lines = ['<?xml version="1.0" encoding="UTF-8"?>']
    lines.append('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">')
    for path in paths:
        lines.append("  <url><loc>%s%s</loc></url>" % (domain, path))
    lines.append("</urlset>")

    with open(SITEMAP_FILE, "w", encoding="utf-8") as handle:
        handle.write("\n".join(lines) + "\n")
    print("wrote sitemap.xml (%d url(s))" % len(paths))


def write_robots(store):
    """Write robots.txt allowing all crawlers and pointing to the sitemap."""
    domain = store["domain"].rstrip("/")
    content = "User-agent: *\nAllow: /\n\nSitemap: %s/sitemap.xml\n" % domain
    with open(ROBOTS_FILE, "w", encoding="utf-8") as handle:
        handle.write(content)
    print("wrote robots.txt")


# --- Main -----------------------------------------------------------------


def main():
    """Read products.json and regenerate the shop and product pages."""
    with open(PRODUCTS_FILE, encoding="utf-8") as handle:
        data = json.load(handle)

    store = data["store"]
    products = data["products"]

    os.makedirs(PRODUCTS_DIR, exist_ok=True)

    for product in products:
        path = os.path.join(PRODUCTS_DIR, "%s.html" % product["slug"])
        with open(path, "w", encoding="utf-8") as handle:
            handle.write(render_product_page(product, store))
        print("wrote products/%s.html" % product["slug"])

    with open(SHOP_FILE, "w", encoding="utf-8") as handle:
        handle.write(render_shop_page(products, store))
    print("wrote shop.html")

    update_featured(INDEX_FILE, products)
    update_filmstrip(INDEX_FILE, products)
    update_ticker(INDEX_FILE, products)
    update_offer(products)
    write_sitemap(products, store)
    write_robots(store)

    print("done -- %d product(s)" % len(products))


# --- Base-path rewriting --------------------------------------------------


def _files_to_rewrite():
    """Yield absolute paths of every file that may contain site-internal URLs."""
    for name in sorted(os.listdir(BASE_DIR)):
        full = os.path.join(BASE_DIR, name)
        if os.path.isfile(full) and name.endswith(".html"):
            yield full
    if os.path.isdir(PRODUCTS_DIR):
        for name in sorted(os.listdir(PRODUCTS_DIR)):
            if name.endswith(".html"):
                yield os.path.join(PRODUCTS_DIR, name)
    for extra in (SITEMAP_FILE, ROBOTS_FILE):
        if os.path.exists(extra):
            yield extra


# Patterns of where a leading "/" path appears in our site's source. Each
# pattern has a capture group for the "carrier" (the chars right before the
# path, e.g. `href="`) and matches the path itself.
_PATH_CARRIERS = [
    # href / src / action / form attrs / snipcart data-item-* URLs.
    r'((?:href|src|action|data-item-url|data-item-image)=")',
    # meta http-equiv refresh: content="0; url=/foo"
    r'(content="\d+;\s*url=)',
    # JS: location.replace("/foo"), .href = "/foo", etc.
    r'(\.replace\(")',
]
_HOST_CARRIER = re.escape(SITE_HOST)


def _strip_prefix(text, prefix):
    """Remove ``prefix`` from any site-internal path that currently has it."""
    if not prefix:
        return text
    esc = re.escape(prefix)
    for carrier in _PATH_CARRIERS:
        text = re.sub(carrier + esc + r"(/|\"|#)", r"\1\2", text)
    text = re.sub(_HOST_CARRIER + esc + r"(/|\"|<|'|\s|$)", SITE_HOST + r"\1", text)
    return text


def _apply_prefix(text, prefix):
    """Insert ``prefix`` in front of every site-internal path."""
    if not prefix:
        return text
    esc = re.escape(prefix.lstrip("/"))
    # Lookahead skips paths already prefixed, so this stays idempotent.
    for carrier in _PATH_CARRIERS:
        text = re.sub(
            carrier + r"(/(?!" + esc + r"/)(?:#|[^\"]*))",
            r"\1" + prefix + r"\2",
            text,
        )
    text = re.sub(
        _HOST_CARRIER + r"(/(?!" + esc + r"/)(?:[^\"'<\s]*))",
        SITE_HOST + prefix + r"\1",
        text,
    )
    return text


def _read_state():
    if os.path.exists(STATE_FILE):
        with open(STATE_FILE, encoding="utf-8") as handle:
            try:
                return json.load(handle)
            except json.JSONDecodeError:
                return {}
    return {}


def _write_state(state):
    with open(STATE_FILE, "w", encoding="utf-8") as handle:
        json.dump(state, handle, indent=2)


def apply_base_path():
    """Rewrite every site-internal URL in the build output to match BASE_PATH.

    Strips any previously applied prefix (recorded in ``.build_state.json``)
    before re-applying the current one, so changing BASE_PATH and re-running
    is safe.
    """
    state = _read_state()
    previous = state.get("base_path", "")
    touched = 0
    for path in _files_to_rewrite():
        with open(path, encoding="utf-8") as handle:
            original = handle.read()
        rewritten = _strip_prefix(original, previous)
        rewritten = _apply_prefix(rewritten, BASE_PATH)
        if rewritten != original:
            with open(path, "w", encoding="utf-8") as handle:
                handle.write(rewritten)
            touched += 1

    state["base_path"] = BASE_PATH
    _write_state(state)
    print("base path %r -> %r (%d file(s) rewritten)" % (previous, BASE_PATH, touched))


if __name__ == "__main__":
    main()
    apply_base_path()
