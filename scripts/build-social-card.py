"""Render the social card. Requires Pillow; pass a licensed TTF font via --font."""
import argparse
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
parser = argparse.ArgumentParser()
parser.add_argument('--font', required=True, help='Path to a licensed sans-serif TTF font')
args = parser.parse_args()
root = Path(__file__).resolve().parents[1]
scale = 2
im = Image.new('RGB', (1200 * scale, 630 * scale), '#28191e')
d = ImageDraw.Draw(im)
def text(x, y, value, size, fill):
    d.text((x*scale, y*scale), value, font=ImageFont.truetype(args.font, size*scale), fill=fill)
d.line((72*scale, 94*scale, 1128*scale, 94*scale), fill='#6e605f', width=2)
text(72, 42, 'YN / YASHRAJNAYAK.COM', 19, '#f2efeb')
text(72, 136, 'Yashraj Nayak', 88, '#f2efeb')
text(76, 262, 'Bringing developers together', 39, '#f2efeb')
text(76, 313, 'to learn, build and share.', 39, '#f2efeb')
text(76, 426, 'DEVELOPER PROGRAMS / COMMUNITIES / TOOLS', 18, '#c4b9b4')
d.rectangle((0, 510*scale, 1200*scale, 630*scale), fill='#f2efeb')
text(76, 549, 'Explore my work', 26, '#28191e')
text(841, 554, 'yashrajnayak.com', 22, '#28191e')
im.resize((1200,630), Image.Resampling.LANCZOS).save(root/'assets/social/yashraj-nayak-card-2026.png', optimize=True)
