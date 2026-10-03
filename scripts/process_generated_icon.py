import os
import subprocess
from PIL import Image

def main():
    src_image_path = "/Users/omsinpt/.gemini/antigravity/brain/72701a40-fc07-4bcd-b2bb-794e209ed72f/better_yt_logo_1791006598913.jpg"
    icons_dir = os.path.abspath("src-tauri/icons")
    os.makedirs(icons_dir, exist_ok=True)

    img = Image.open(src_image_path).convert("RGBA")
    
    # Save 1024x1024 base
    base_1024 = img.resize((1024, 1024), Image.Resampling.LANCZOS)
    
    # 1. icon.png (512x512)
    icon_512 = base_1024.resize((512, 512), Image.Resampling.LANCZOS)
    icon_512.save(os.path.join(icons_dir, "icon.png"), "PNG")

    # 2. 32x32.png
    icon_32 = base_1024.resize((32, 32), Image.Resampling.LANCZOS)
    icon_32.save(os.path.join(icons_dir, "32x32.png"), "PNG")

    # 3. 128x128.png
    icon_128 = base_1024.resize((128, 128), Image.Resampling.LANCZOS)
    icon_128.save(os.path.join(icons_dir, "128x128.png"), "PNG")

    # 4. 128x128@2x.png (256x256)
    icon_256 = base_1024.resize((256, 256), Image.Resampling.LANCZOS)
    icon_256.save(os.path.join(icons_dir, "128x128@2x.png"), "PNG")

    # 5. icon.ico
    ico_sizes = [(16, 16), (24, 24), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)]
    base_1024.save(os.path.join(icons_dir, "icon.ico"), format="ICO", sizes=ico_sizes)

    # 6. icon.icns (via iconutil)
    iconset_dir = os.path.join(icons_dir, "icon.iconset")
    os.makedirs(iconset_dir, exist_ok=True)

    icns_sizes = [
        (16, "icon_16x16.png"),
        (32, "icon_16x16@2x.png"),
        (32, "icon_32x32.png"),
        (64, "icon_32x32@2x.png"),
        (128, "icon_128x128.png"),
        (256, "icon_128x128@2x.png"),
        (256, "icon_256x256.png"),
        (512, "icon_256x256@2x.png"),
        (512, "icon_512x512.png"),
        (1024, "icon_512x512@2x.png"),
    ]

    for s, name in icns_sizes:
        resized = base_1024.resize((s, s), Image.Resampling.LANCZOS)
        resized.save(os.path.join(iconset_dir, name))

    subprocess.run(["iconutil", "-c", "icns", iconset_dir, "-o", os.path.join(icons_dir, "icon.icns")], check=True)
    
    import shutil
    shutil.rmtree(iconset_dir)
    print("Successfully processed and saved Better YT icons from generated vector logo!")

if __name__ == "__main__":
    main()
