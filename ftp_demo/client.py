import socket
import os
import requests
import json
from typing import Optional


class ImageClient:
    def __init__(self, server_ip: str, ftp_port: int = 2121, api_port: int = 5000):
        self.server_ip = server_ip
        self.ftp_port = ftp_port
        self.api_port = api_port
        self.api_base_url = f"http://{server_ip}:{api_port}"

    def upload_file_ftp(self, filepath: str, user_id: str) -> bool:
        """Upload file using FTP protocol"""
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.connect((self.server_ip, self.ftp_port))

            # Read welcome message
            sock.recv(1024)

            filename = os.path.basename(filepath)
            file_size = os.path.getsize(filepath)

            # Send upload command with filename and user_id
            sock.send(f"UPLOAD {filename} {user_id}".encode())

            # Send file size
            sock.send(str(file_size).encode())

            # Wait for server ready
            response = sock.recv(1024).decode()
            if response == "READY":
                with open(filepath, "rb") as f:
                    while chunk := f.read(4096):
                        sock.send(chunk)

                result = sock.recv(1024).decode()
                print(result)
                sock.send(b"QUIT")
                sock.close()
                return "successfully" in result.lower()
            return False

        except Exception as e:
            print(f"FTP Upload error: {e}")
            return False

    def list_images(self, user_id: str) -> Optional[list]:
        """List all images for a user using Flask API"""
        try:
            response = requests.get(f"{self.api_base_url}/images/{user_id}")
            if response.status_code == 200:
                return response.json()['images']
            return None
        except Exception as e:
            print(f"List images error: {e}")
            return None

    def get_image_path(self, user_id: str, filename: str) -> Optional[str]:
        """Get image path using Flask API"""
        try:
            response = requests.get(
                f"{self.api_base_url}/images/{user_id}/{filename}")
            if response.status_code == 200:
                return response.json()['file_path']
            return None
        except Exception as e:
            print(f"Get image error: {e}")
            return None

    def upload_and_process_image(self, filepath: str, user_id: str) -> bool:
        """Complete workflow: Upload via FTP and process via Flask"""
        # First upload via FTP
        if not self.upload_file_ftp(filepath, user_id):
            return False

        # Then trigger processing via Flask
        try:
            with open(filepath, 'rb') as f:
                files = {'file': f}
                data = {'user_id': user_id}
                response = requests.post(
                    f"{self.api_base_url}/upload",
                    files=files,
                    data=data
                )
                return response.status_code == 200
        except Exception as e:
            print(f"Process image error: {e}")
            return False


# Usage example
if __name__ == "__main__":
    client = ImageClient("172.0.20.2")  # Replace with your server IP

    # Example operations
    def demo_operations():
        user_id = "test_user"
        test_file = "test.txt"  # Replace with actual image path

        # Upload and process image
        if client.upload_and_process_image(test_file, user_id):
            print("Image uploaded and processed successfully")

        # List images
        images = client.list_images(user_id)
        if images:
            print("User images:", images)

        # Get specific image path
        if images:
            image_path = client.get_image_path(user_id, images[0])
            if image_path:
                print("Image path:", image_path)

    demo_operations()
