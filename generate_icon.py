from PIL import Image, ImageDraw, ImageFont
import os

def create_icon():
    print("Generating icon.ico...")
    size = (256, 256)
    image = Image.new('RGB', size, color='black')
    draw = ImageDraw.Draw(image)
    
    # Draw simple "F" text manually since we might not have fonts
    # Draw white F
    # Vertical line
    draw.rectangle([50, 50, 90, 200], fill="white")
    # Top horizontal
    draw.rectangle([90, 50, 180, 90], fill="white")
    # Middle horizontal
    draw.rectangle([90, 120, 160, 160], fill="white")
    
    # Save as .ico
    image.save('icon.ico', format='ICO', sizes=[(256, 256), (128, 128), (64, 64), (48, 48), (32, 32), (16, 16)])
    print("icon.ico created successfully.")

if __name__ == "__main__":
    create_icon()
