from PIL import Image
import os

def is_image_file(filepath):
    """Check if the file is a recognized image format based on extension."""
    image_extensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.webp']
    ext = os.path.splitext(filepath)[1].lower()
    return ext in image_extensions

def create_thumbnail(input_path, output_path, size=(128, 128),
                     jpeg_quality=85, png_compress_level=6):
    """
    Create a thumbnail of the image at input_path and save it to output_path,
    applying format-specific compression settings.
    
    Args:
        input_path (str): Path to the input image
        output_path (str): Path where the thumbnail will be saved
        size (tuple): Maximum width and height of the thumbnail
        jpeg_quality (int): Quality for JPEG output (1-100, higher is better quality)
        png_compress_level (int): Compression level for PNG output (0-9, higher is more compression)
    
    Returns:
        bool: True if successful, False otherwise
    """
    if not is_image_file(input_path):
        print(f"File {input_path} is not a recognized image file")
        return False

    try:
        with Image.open(input_path) as img:
            # Resize in-place, preserving aspect ratio with better quality
            img.thumbnail(size, Image.Resampling.LANCZOS)

            # Ensure the output directory exists
            os.makedirs(os.path.dirname(output_path), exist_ok=True)

            # Determine format from output extension
            ext = os.path.splitext(output_path)[1].lower()
            save_kwargs = {}
            if ext in ('.jpg', '.jpeg'):
                save_kwargs = {
                    'quality': jpeg_quality,
                    'optimize': True,
                    'progressive': True
                }
            elif ext == '.png':
                save_kwargs = {
                    'compress_level': png_compress_level,
                    'optimize': True
                }

            img.save(output_path, **save_kwargs)
            print(f"Created thumbnail: {output_path}")
            return True

    except Exception as e:
        print(f"Error creating thumbnail: {e}")
        return False
