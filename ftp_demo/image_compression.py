from PIL import Image
import os

def create_thumbnail(input_path, output_path, size=(128, 128)):
    """
    Create a thumbnail of the image at input_path and save it to output_path.
    
    Args:
        input_path (str): Path to the input image
        output_path (str): Path where the thumbnail will be saved
        size (tuple): Maximum width and height of the thumbnail
    
    Returns:
        bool: True if successful, False otherwise
    """
    try:
        # Check if the input file is an image
        if not is_image_file(input_path):
            print(f"File {input_path} is not a recognized image file")
            return False
            
        with Image.open(input_path) as img:
            # Create a thumbnail (preserves aspect ratio)
            img.thumbnail(size)
            
            # Ensure the output directory exists
            os.makedirs(os.path.dirname(output_path), exist_ok=True)
            
            # Save the thumbnail
            img.save(output_path)
            
            print(f"Created thumbnail: {output_path}")
            return True
    except Exception as e:
        print(f"Error creating thumbnail: {e}")
        return False

def is_image_file(filepath):
    """Check if the file is a recognized image format based on extension."""
    image_extensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.webp']
    ext = os.path.splitext(filepath)[1].lower()
    return ext in image_extensions

def compress_image(input_path, output_path, quality=50):
    """
    Compress an image file.
    
    Args:
        input_path (str): Path to the input image
        output_path (str): Path where the compressed image will be saved
        quality (int): Quality factor (1-100, higher is better quality but larger file)
    
    Returns:
        bool: True if successful, False otherwise
    """
    try:
        if not is_image_file(input_path):
            print(f"File {input_path} is not a recognized image file")
            return False
            
        # Get the file extension
        ext = os.path.splitext(input_path)[1].lower()
        
        with Image.open(input_path) as img:
            # For JPEG files, we can directly control compression
            if ext in ['.jpg', '.jpeg']:
                img.save(output_path, quality=quality, optimize=True)
            # For PNG, we can use optimize
            elif ext == '.png':
                img.save(output_path, optimize=True)
            # For other formats, just save normally
            else:
                img.save(output_path)
                
            print(f"Compressed image saved to: {output_path}")
            return True
    except Exception as e:
        print(f"Error compressing image: {e}")
        return False
