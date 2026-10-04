"""Render the social card. Requires Pillow; pass a licensed TTF font via --font."""
import argparse
import json
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
parser = argparse.ArgumentParser()
parser.add_argument('--font', required=True, help='Path to a licensed sans-serif TTF font')
args = parser.parse_args()
root = Path(__file__).resolve().parents[1]
config = json.loads((root / 'config.json').read_text())
card = config['site']['cardCopy']
scale = 2
im = Image.new('RGB', (1200 * scale, 630 * scale), config['site']['theme'])
d = ImageDraw.Draw(im)
def text(x, y, value, size, fill):
    d.text((x*scale, y*scale), value, font=ImageFont.truetype(args.font, size*scale), fill=fill)
d.line((72*scale, 94*scale, 1128*scale, 94*scale), fill='#6e605f', width=2)
text(72, 42, card['eyebrow'], 19, config['site']['paper'])
text(72, 136, config['site']['name'], 88, config['site']['paper'])
text(76, 262, card['headline'][0], 39, config['site']['paper'])
text(76, 313, card['headline'][1], 39, config['site']['paper'])
text(76, 426, config['hero']['eyebrow'], 18, '#c4b9b4')
d.rectangle((0, 510*scale, 1200*scale, 630*scale), fill=config['site']['paper'])
text(76, 549, config['hero']['cta']['label'], 26, config['site']['theme'])
text(841, 554, card['domain'], 22, config['site']['theme'])
im.resize((1200,630), Image.Resampling.LANCZOS).save(root/'assets/social/yashraj-nayak-card-2026.png', optimize=True)
