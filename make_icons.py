"""Generate raster images that the SVG favicon can't cover.

Produces:
  * ``apple-touch-icon.png`` (180x180) -- iOS home screen icon
  * ``og-image.png`` (1200x630)        -- social share preview banner

The SVG favicon (favicon.svg) handles every other icon size on its own.

Run after changing the brand color, letter, or tagline::

    C:\\anaconda\\python.exe make_icons.py
"""

import os

from PIL import Image, ImageDraw, ImageFont

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Brand: light-mode favicon colors (iOS uses one static image).
BG_COLOR = (3, 102, 214)  # #0366d6
FG_COLOR = (255, 255, 255)  # #ffffff
LETTER = "T"
SIZE = 180
CORNER_RADIUS = 34  # 12/64 of the SVG viewBox, scaled to 180

# Social share banner.
STORE_NAME = "TomCo"
TAGLINE = "Handmade goods and original work."
OG_SIZE = (1200, 630)


def load_bold_font(pixels):
    """Return a bold TrueType font, trying common Windows fonts."""
    candidates = [
        r"C:\Windows\Fonts\segoeuib.ttf",
        r"C:\Windows\Fonts\arialbd.ttf",
    ]
    for path in candidates:
        if os.path.exists(path):
            return ImageFont.truetype(path, pixels)
    return ImageFont.load_default()


def make_apple_touch_icon():
    """Render and save the 180x180 apple-touch-icon.png."""
    img = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    draw.rounded_rectangle(
        [(0, 0), (SIZE - 1, SIZE - 1)], radius=CORNER_RADIUS, fill=BG_COLOR
    )

    font = load_bold_font(int(SIZE * 0.56))
    bbox = draw.textbbox((0, 0), LETTER, font=font)
    text_w = bbox[2] - bbox[0]
    text_h = bbox[3] - bbox[1]
    x = (SIZE - text_w) / 2 - bbox[0]
    y = (SIZE - text_h) / 2 - bbox[1]
    draw.text((x, y), LETTER, font=font, fill=FG_COLOR)

    out_path = os.path.join(BASE_DIR, "apple-touch-icon.png")
    img.save(out_path)
    print("wrote apple-touch-icon.png (%dx%d)" % (SIZE, SIZE))


def make_og_image():
    """Render and save the 1200x630 og-image.png share banner.

    A simple, cheap placeholder: brand-colored background, the favicon
    badge, the store name, and the tagline. Replace with real artwork
    when one is available.
    """
    width, height = OG_SIZE
    img = Image.new("RGB", OG_SIZE, BG_COLOR)
    draw = ImageDraw.Draw(img)

    # Favicon-style rounded badge with the brand letter, top-left of center.
    badge = 150
    badge_x = (width - badge) // 2
    badge_y = 150
    draw.rounded_rectangle(
        [(badge_x, badge_y), (badge_x + badge, badge_y + badge)],
        radius=28,
        fill=FG_COLOR,
    )
    letter_font = load_bold_font(int(badge * 0.56))
    bbox = draw.textbbox((0, 0), LETTER, font=letter_font)
    lx = badge_x + (badge - (bbox[2] - bbox[0])) / 2 - bbox[0]
    ly = badge_y + (badge - (bbox[3] - bbox[1])) / 2 - bbox[1]
    draw.text((lx, ly), LETTER, font=letter_font, fill=BG_COLOR)

    # Store name, centered below the badge.
    name_font = load_bold_font(96)
    nbox = draw.textbbox((0, 0), STORE_NAME, font=name_font)
    nx = (width - (nbox[2] - nbox[0])) / 2 - nbox[0]
    draw.text((nx, 340), STORE_NAME, font=name_font, fill=FG_COLOR)

    # Tagline, centered below the name.
    tag_font = load_bold_font(40)
    tbox = draw.textbbox((0, 0), TAGLINE, font=tag_font)
    tx = (width - (tbox[2] - tbox[0])) / 2 - tbox[0]
    draw.text((tx, 470), TAGLINE, font=tag_font, fill=(220, 232, 255))

    out_path = os.path.join(BASE_DIR, "og-image.png")
    img.save(out_path)
    print("wrote og-image.png (%dx%d)" % OG_SIZE)


if __name__ == "__main__":
    make_apple_touch_icon()
    make_og_image()
