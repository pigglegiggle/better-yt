import os
import subprocess
from PIL import Image, ImageDraw

def create_base_icon(size=512):
    # Create RGBA canvas
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Rounded rectangle coordinates
    padding = size * 0.05
    radius = size * 0.22
    rect = [padding, padding, size - padding, size - padding]

    # Background dark rounded rect
    draw.rounded_rectangle(rect, radius=radius, fill=(24, 24, 27, 255), outline=(39, 39, 42, 255), width=int(size * 0.025))

    # Abstract modern play symbol (layered chevron)
    # Right-pointing triangle/chevron
    center_x = size * 0.52
    center_y = size * 0.50
    half_h = size * 0.22
    half_w = size * 0.18

    # Red base chevron
    p1 = (center_x - half_w * 0.7, center_y - half_h)
    p2 = (center_x + half_w * 0.9, center_y)
    p3 = (center_x - half_w * 0.7, center_y + half_h)
    draw.polygon([p1, p2, p3], fill=(239, 68, 68, 255))

    # Left white overlay chevron
    p1_w = (center_x - half_w * 0.7, center_y - half_h)
    p2_w = (center_x + half_w * 0.1, center_y)
    p3_w = (center_x - half_w * 0.7, center_y + half_h)
    draw.polygon([p1_w, p2_w, p3_w], fill=(255, 255, 255, 230))

    return img

def main():
    icons_dir = os.path.abspath('src-tauri/icons')
    os.makedirs(icons_dir, exist_ok=True)

    base_icon = create_base_icon(1024)

    # 1. icon.png (512x512)
    icon_512 = base_icon.resize((512, 512), Image.Resampling.LANCZOS)
    icon_512.save(os.path.join(icons_dir, 'icon.png'))

    # 2. 32x32.png
    icon_32 = base_icon.resize((32, 32), Image.Resampling.LANCZOS)
    icon_32.save(os.path.join(icons_dir, '32x32.png'))

    # 3. 128x128.png
    icon_128 = base_icon.resize((128, 128), Image.Resampling.LANCZOS)
    icon_128.save(os.path.join(icons_dir, '128x128.png'))

    # 4. 128x128@2x.png (256x256)
    icon_256 = base_icon.resize((256, 256), Image.Resampling.LANCZOS)
    icon_256.save(os.path.join(icons_dir, '128x128@2x.png'))

    # 5. icon.ico
    ico_sizes = [(16, 16), (24, 24), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)]
    base_icon.save(os.path.join(icons_dir, 'icon.ico'), format='ICO', sizes=ico_sizes)

    # 6. icon.icns (via iconutil on macOS)
    iconset_dir = os.path.join(icons_dir, 'icon.iconset')
    os.makedirs(iconset_dir, exist_ok=True)

    icns_sizes = [
        (16, 'icon_16x16.png'),
        (32, 'icon_16x16@2x.png'),
        (32, 'icon_32x32.png'),
        (64, 'icon_32x32@2x.png'),
        (128, 'icon_128x128.png'),
        (256, 'icon_128x128@2x.png'),
        (256, 'icon_256x256.png'),
        (512, 'icon_256x256@2x.png'),
        (512, 'icon_512x512.png'),
        (1024, 'icon_512x512@2x.png'),
    ]

    for s, name in icns_sizes:
        resized = base_icon.resize((s, s), Image.Resampling.LANCZOS)
        resized.save(os.path.join(iconset_dir, name))

    subprocess.run(['iconutil', '-c', 'icns', iconset_dir, '-o', os.path.join(icons_dir, 'icon.icns')], check=True)
    # Clean up iconset
    import shutil
    shutil.rmtree(iconset_dir)

    print("Successfully generated all required icons in src-tauri/icons/")

if __name__ == '__main__':
    main()
