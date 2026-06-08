#!/usr/bin/env python3
"""Generate icon-192.png and icon-512.png for the Abbott Water Filters PWA."""
import os, sys, math

BASE = r"C:\Users\USER\Desktop\Abbott Water filter"

# ── SVG template: navy background + shield mark only (no text) ──
SVG_TMPL = '''\
<svg xmlns="http://www.w3.org/2000/svg" width="{sz}" height="{sz}">
  <rect width="{sz}" height="{sz}" fill="#0d1e42" rx="{rx}"/>
  <svg x="{ox}" y="{oy}" width="{sw}" height="{sh}" viewBox="32 8 136 168">
    <defs>
      <linearGradient id="ilt" x1="1" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#38d8f0"/>
        <stop offset="50%" stop-color="#1892b8"/>
        <stop offset="100%" stop-color="#0b5c7a"/>
      </linearGradient>
      <linearGradient id="irs" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#e0eef6"/>
        <stop offset="50%" stop-color="#a8c6d4"/>
        <stop offset="100%" stop-color="#6a8898"/>
      </linearGradient>
      <linearGradient id="ibg" x1="0" y1="0" x2="0.3" y2="1">
        <stop offset="0%" stop-color="#f0f8fc"/>
        <stop offset="100%" stop-color="#d0e6f0"/>
      </linearGradient>
      <linearGradient id="iam" x1="0.1" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#28d2ec"/>
        <stop offset="100%" stop-color="#094860"/>
      </linearGradient>
      <linearGradient id="idr" x1="0.2" y1="0" x2="0.8" y2="1">
        <stop offset="0%" stop-color="#60def8"/>
        <stop offset="100%" stop-color="#073050"/>
      </linearGradient>
      <clipPath id="icl"><rect x="0" y="0" width="100" height="268"/></clipPath>
      <clipPath id="icr"><rect x="100" y="0" width="100" height="268"/></clipPath>
    </defs>
    <path clip-path="url(#icl)" d="M60,8 L140,8 L168,46 L164,128 L128,162 L100,176 L72,162 L36,128 L32,46 Z" fill="url(#ilt)"/>
    <path clip-path="url(#icr)" d="M60,8 L140,8 L168,46 L164,128 L128,162 L100,176 L72,162 L36,128 L32,46 Z" fill="url(#irs)"/>
    <path d="M67,20 L133,20 L155,52 L151,124 L121,154 L100,165 L79,154 L49,124 L45,52 Z" fill="url(#ibg)"/>
    <rect x="49" y="91" width="102" height="4.5" rx="2.2" fill="#16a0be" opacity="0.9"/>
    <rect x="49" y="99" width="102" height="4.5" rx="2.2" fill="#16a0be" opacity="0.85"/>
    <rect x="49" y="107" width="102" height="4.5" rx="2.2" fill="#16a0be" opacity="0.75"/>
    <path d="M96,28 L104,28 L134,148 L117,148 L100,52 L83,148 L66,148 Z" fill="url(#iam)"/>
    <path d="M100,108 C96,116 87,126 87,136 A13,13 0 0 0 113,136 C113,126 104,116 100,108 Z" fill="url(#idr)"/>
    <ellipse cx="93" cy="122" rx="4" ry="6.5" fill="rgba(255,255,255,0.42)" transform="rotate(-22,93,122)"/>
  </svg>
</svg>'''

def make_svg(size):
    pad = max(int(size * 0.09), 8)
    avail = size - 2 * pad
    scale = min(avail / 136.0, avail / 168.0)
    sw = int(136 * scale)
    sh = int(168 * scale)
    ox = (size - sw) // 2
    oy = (size - sh) // 2
    rx = int(size * 0.18)
    return SVG_TMPL.format(sz=size, rx=rx, ox=ox, oy=oy, sw=sw, sh=sh)


def try_cairosvg():
    import cairosvg
    for size, name in [(192, "icon-192.png"), (512, "icon-512.png")]:
        svg = make_svg(size)
        cairosvg.svg2png(bytestring=svg.encode("utf-8"),
                         write_to=os.path.join(BASE, name))
        print(f"  cairosvg -> {name} ({size}px)")
    return True


# ── PIL fallback: approximate the design with solid colours + alpha compositing ──
def pil_pt(x_svg, y_svg, scale, ox, oy):
    return (ox + int((x_svg - 32) * scale), oy + int((y_svg - 8) * scale))


def pil_poly(pts_svg, scale, ox, oy):
    return [pil_pt(x, y, scale, ox, oy) for x, y in pts_svg]


def draw_gradient_rect_v(draw, x0, y0, x1, y1, col_top, col_bot):
    """Vertical gradient by drawing 1-pixel horizontal bands."""
    for row in range(y0, y1 + 1):
        t = (row - y0) / max(y1 - y0, 1)
        r = int(col_top[0] + t * (col_bot[0] - col_top[0]))
        g = int(col_top[1] + t * (col_bot[1] - col_top[1]))
        b = int(col_top[2] + t * (col_bot[2] - col_top[2]))
        draw.line([(x0, row), (x1, row)], fill=(r, g, b))


def hex2rgb(h):
    h = h.lstrip("#")
    return tuple(int(h[i:i+2], 16) for i in (0, 2, 4))


def try_pil(size):
    from PIL import Image, ImageDraw, ImageFilter

    pad = max(int(size * 0.09), 8)
    avail = size - 2 * pad
    scale = min(avail / 136.0, avail / 168.0)
    ox = (size - int(136 * scale)) // 2
    oy = (size - int(168 * scale)) // 2
    cx_screen = ox + int((100 - 32) * scale)  # x=100 in SVG → screen

    def pt(x, y):
        return pil_pt(x, y, scale, ox, oy)

    def poly(pts):
        return pil_poly(pts, scale, ox, oy)

    img = Image.new("RGBA", (size, size), (13, 30, 66, 255))
    draw = ImageDraw.Draw(img)

    # Outer shield — left half teal, right half silver
    outer = [(60,8),(140,8),(168,46),(164,128),(128,162),(100,176),(72,162),(36,128),(32,46)]
    # Draw full shield in teal, then overwrite right half in silver
    draw.polygon(poly(outer), fill=hex2rgb("#1892b8"))

    # Right half (clip at x=100): redraw clipped with silver using a mask
    silver_img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    silver_draw = ImageDraw.Draw(silver_img)
    silver_draw.polygon(poly(outer), fill=hex2rgb("#a8c6d4"))
    # Clip to right side
    mask = Image.new("L", (size, size), 0)
    mask_draw = ImageDraw.Draw(mask)
    mask_draw.rectangle([(cx_screen, 0), (size, size)], fill=255)
    img.paste(silver_img, mask=mask)

    # Inner shield
    inner = [(67,20),(133,20),(155,52),(151,124),(121,154),(100,165),(79,154),(49,124),(45,52)]
    draw = ImageDraw.Draw(img)
    draw.polygon(poly(inner), fill=hex2rgb("#e0eef8"))

    # Three horizontal stripes (approximate with filled rects)
    for y_svg in [91, 99, 107]:
        x0, y0 = pt(49, y_svg)
        x1, y1 = pt(151, y_svg + 4)
        draw.rectangle([x0, y0, x1, y1], fill=(22, 160, 190, int(255 * 0.88)))

    # A letterform: inverted V with thick legs
    a_mark = [(96,28),(104,28),(134,148),(117,148),(100,52),(83,148),(66,148)]
    draw.polygon(poly(a_mark), fill=hex2rgb("#1ab0d0"))

    # Water drop: approximate as teardrop (circle + triangle pointing up)
    cx, cy_top = pt(100, 108)
    _, cy_bot = pt(100, 136)
    radius = int(13 * scale)
    # Triangle top
    tri = [pt(96, 108), pt(104, 108), pt(100, 118)]
    draw.polygon(tri, fill=hex2rgb("#3cd8f0"))
    # Circle at bottom
    draw.ellipse([(cx - radius, cy_bot - radius), (cx + radius, cy_bot + radius)],
                 fill=hex2rgb("#3cd8f0"))
    # Fill connecting rectangle
    draw.rectangle([(cx - radius, cy_top), (cx + radius, cy_bot)],
                   fill=hex2rgb("#3cd8f0"))

    # White highlight on drop
    hx, hy = pt(93, 120)
    hr = int(4 * scale)
    draw.ellipse([(hx - hr, hy - int(1.6 * hr)), (hx + hr, hy + int(1.6 * hr))],
                 fill=(255, 255, 255, 100))

    # Save PNG
    out = img.convert("RGB")
    name = f"icon-{size}.png"
    out.save(os.path.join(BASE, name), "PNG")
    print(f"  PIL fallback -> {name} ({size}px)")


print("Generating PWA icons...")
try:
    try_cairosvg()
except Exception as e:
    print(f"cairosvg failed ({e}), trying PIL...")
    try:
        for size in (192, 512):
            try_pil(size)
    except Exception as e2:
        print(f"PIL also failed: {e2}", file=sys.stderr)
        sys.exit(1)

print("Done.")
