#!/usr/bin/env python3
"""Generate the source icon for AI 文档快看.

The generated PNG is intentionally deterministic so App Store builds can
recreate the exact icon asset before Tauri expands it into platform formats.
"""

from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "src-tauri" / "icons" / "app-icon-source.png"
SIZE = 1024
SCALE = 4
CANVAS = SIZE * SCALE


def s(value: int | float) -> int:
    return round(value * SCALE)


def rounded_mask(size: int, radius: int) -> Image.Image:
    mask = Image.new("L", (size, size), 0)
    draw = ImageDraw.Draw(mask)
    draw.rounded_rectangle((0, 0, size, size), radius=radius, fill=255)
    return mask


def vertical_gradient(top: tuple[int, int, int], bottom: tuple[int, int, int]) -> Image.Image:
    image = Image.new("RGB", (CANVAS, CANVAS), top)
    pixels = image.load()
    for y in range(CANVAS):
        t = y / (CANVAS - 1)
        color = tuple(round(top[i] * (1 - t) + bottom[i] * t) for i in range(3))
        for x in range(CANVAS):
            pixels[x, y] = color
    return image.convert("RGBA")


def star(draw: ImageDraw.ImageDraw, cx: int, cy: int, radius: int, color: tuple[int, int, int, int]) -> None:
    points = [
        (cx, cy - radius),
        (cx + radius * 0.22, cy - radius * 0.22),
        (cx + radius, cy),
        (cx + radius * 0.22, cy + radius * 0.22),
        (cx, cy + radius),
        (cx - radius * 0.22, cy + radius * 0.22),
        (cx - radius, cy),
        (cx - radius * 0.22, cy - radius * 0.22),
    ]
    draw.polygon([(round(x), round(y)) for x, y in points], fill=color)


def main() -> None:
    base = vertical_gradient((16, 93, 88), (37, 52, 103))
    mask = rounded_mask(CANVAS, s(220))

    # Soft internal light, giving the mark depth without looking like a template.
    light = Image.new("RGBA", (CANVAS, CANVAS), (0, 0, 0, 0))
    light_draw = ImageDraw.Draw(light)
    light_draw.ellipse((s(-160), s(-120), s(760), s(700)), fill=(64, 224, 208, 70))
    light_draw.ellipse((s(520), s(570), s(1240), s(1240)), fill=(246, 196, 72, 42))
    light = light.filter(ImageFilter.GaussianBlur(s(55)))
    base.alpha_composite(light)

    icon = Image.new("RGBA", (CANVAS, CANVAS), (0, 0, 0, 0))
    icon.alpha_composite(base)
    icon.putalpha(mask)

    shadow = Image.new("RGBA", (CANVAS, CANVAS), (0, 0, 0, 0))
    shadow_draw = ImageDraw.Draw(shadow)
    doc_box = (s(238), s(154), s(772), s(828))
    shadow_draw.rounded_rectangle(
        (doc_box[0] + s(18), doc_box[1] + s(24), doc_box[2] + s(18), doc_box[3] + s(24)),
        radius=s(72),
        fill=(0, 0, 0, 86),
    )
    shadow = shadow.filter(ImageFilter.GaussianBlur(s(26)))
    icon.alpha_composite(shadow)

    draw = ImageDraw.Draw(icon)

    # Document sheet with a folded corner.
    draw.rounded_rectangle(doc_box, radius=s(72), fill=(248, 251, 247, 255))
    fold = [(s(628), s(154)), (s(772), s(298)), (s(628), s(298))]
    draw.polygon(fold, fill=(216, 232, 225, 255))
    draw.line((s(628), s(154), s(628), s(298), s(772), s(298)), fill=(178, 205, 198, 220), width=s(8))

    # Markdown-inspired mark: two bars and a down chevron.
    ink = (20, 76, 84, 255)
    draw.rounded_rectangle((s(318), s(370), s(378), s(548)), radius=s(20), fill=ink)
    draw.rounded_rectangle((s(632), s(370), s(692), s(548)), radius=s(20), fill=ink)
    draw.polygon([(s(418), s(380)), (s(506), s(520)), (s(594), s(380))], fill=ink)
    draw.polygon([(s(456), s(390)), (s(506), s(470)), (s(556), s(390))], fill=(248, 251, 247, 255))

    # Quick-look lens reinforces the viewer/editor identity.
    draw.ellipse((s(540), s(586), s(718), s(764)), outline=(14, 165, 176, 255), width=s(30))
    draw.line((s(676), s(724), s(756), s(804)), fill=(14, 165, 176, 255), width=s(36))

    # AI spark marks, deliberately asymmetric to avoid stock-icon similarity.
    star(draw, s(760), s(242), s(52), (250, 203, 88, 255))
    star(draw, s(708), s(190), s(24), (255, 236, 166, 240))
    star(draw, s(288), s(268), s(28), (129, 230, 217, 235))

    # Bottom accent line gives the icon a distinctive "document quick scan" cue.
    draw.rounded_rectangle((s(318), s(646), s(502), s(682)), radius=s(18), fill=(241, 184, 66, 255))

    final = icon.resize((SIZE, SIZE), Image.Resampling.LANCZOS)
    OUT.parent.mkdir(parents=True, exist_ok=True)
    final.save(OUT)
    print(OUT)


if __name__ == "__main__":
    main()
