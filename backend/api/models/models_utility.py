from io import BytesIO
from random import randint
from PIL import Image, ImageDraw, ImageFont

def generate_icon(initial1: str, initial2: str) -> BytesIO:
    """Generates an basic default icon"""
    # Generates a random RGB value
    colour = (randint(0, 255), randint(0, 255), randint(0,255))
    initials = initial1.upper() + initial2.upper()
    size = (100, 100)
    image = Image.new('RGB', size=size, color=colour)
    draw = ImageDraw.Draw(image)
    try:
        font = ImageFont.truetype("DejaVuSans.ttf", 50)
    except IOError:
        font = ImageFont.load_default()
    bbox = draw.textbbox((0, 0), initials, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    text_position = ((size[0] - text_width) // 2, (size[1] - text_height) // 2)
    draw.text(
        text_position,
        initials,
        fill=(255 - colour[0], 255 - colour[1], 255 - colour[2]),
        font=font
    )

    buffer = BytesIO()
    image.save(buffer, format='JPEG')
    buffer.seek(0)

    return buffer
