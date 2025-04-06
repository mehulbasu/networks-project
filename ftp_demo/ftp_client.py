import socket
import os

SERVER_IP = "192.168.0.172"  # Replace with the server's IP address
PORT = 2121
CLIENT_FILES_DIR = "client_files"

# Create client_files directory if it doesn't exist
if not os.path.exists(CLIENT_FILES_DIR):
    os.makedirs(CLIENT_FILES_DIR)
    print(f"Created directory: {CLIENT_FILES_DIR}")

def send_command(sock, command):
    sock.send(command.encode())

def upload_file(sock, filename, directory=None):
    """Upload a file to the server
    
    If directory is provided, the file is read from that directory.
    Otherwise, the file is read from the path specified in filename.
    """
    try:
        # If directory is provided, create the full path
        if directory:
            filepath = os.path.join(directory, os.path.basename(filename))
        else:
            filepath = filename
            
        with open(filepath, "rb") as f:
            # Get file size
            file_size = os.path.getsize(filepath)
            
            # Send upload command with filename (use basename to strip directory)
            sock.send(f"UPLOAD {os.path.basename(filepath)}".encode())
            
            # Send file size
            sock.send(str(file_size).encode())
            
            # Wait for server ready
            response = sock.recv(1024).decode()
            if response == "READY":
                bytes_sent = 0
                while bytes_sent < file_size:
                    chunk = f.read(4096)
                    if not chunk:
                        break
                    sock.send(chunk)
                    bytes_sent += len(chunk)
                print(sock.recv(1024).decode())
            else:
                print("Server not ready")
    except FileNotFoundError:
        print(f"File not found: {filepath}")

def download_file(sock, filename, directory=CLIENT_FILES_DIR):
    """Download a file from the server to the specified directory"""
    sock.send(f"DOWNLOAD {filename}".encode())
    
    # Receive file size
    file_size = int(sock.recv(1024).decode())
    
    if file_size >= 0:
        sock.send(b"READY")
        
        # Create destination path
        dest_path = os.path.join(directory, os.path.basename(filename))
        
        bytes_received = 0
        with open(dest_path, "wb") as f:
            while bytes_received < file_size:
                bytes_to_read = min(4096, file_size - bytes_received)
                data = sock.recv(bytes_to_read)
                if not data:
                    break
                f.write(data)
                bytes_received += len(data)
        print(f"Download complete! Saved to {dest_path}")
    else:
        print("File not found on server!")

def upload_all_files(sock, directory="."):
    """Upload all files from the specified directory"""
    try:
        files = [f for f in os.listdir(directory) if os.path.isfile(os.path.join(directory, f))]
        if not files:
            print(f"No files found in '{directory}'")
            return
            
        print(f"Found {len(files)} files to upload")
        for filename in files:
            filepath = os.path.join(directory, filename)
            print(f"Uploading {filename}...")
            # Use the directory parameter to read from the correct location
            upload_file(sock, filename, directory)
    except FileNotFoundError:
        print(f"Directory '{directory}' not found!")
    except PermissionError:
        print(f"Permission denied for directory '{directory}'")

def download_all_files(sock, directory=CLIENT_FILES_DIR):
    """Download all files from the server to the specified directory"""
    # Create directory if it doesn't exist
    if not os.path.exists(directory):
        os.makedirs(directory)
        print(f"Created directory: {directory}")
        
    # Get list of files from server
    send_command(sock, "LIST")
    file_list = sock.recv(4096).decode().strip().split("\n")
    
    if not file_list or file_list[0] == '':
        print("No files on server to download")
        return
        
    print(f"Found {len(file_list)} files to download")
    
    # Download each file
    for filename in file_list:
        if not filename:  # Skip empty filenames
            continue
        print(f"Downloading {filename}...")
        download_file(sock, filename, directory)

def main():
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sock.connect((SERVER_IP, PORT))
    print(sock.recv(1024).decode())

    while True:
        command = input("ftp> ").strip()
        
        if command.startswith("LIST"):
            send_command(sock, "LIST")
            print(sock.recv(4096).decode())

        elif command.startswith("UPLOAD_ALL"):
            parts = command.split(" ", 1)
            directory = parts[1] if len(parts) > 1 else CLIENT_FILES_DIR
            upload_all_files(sock, directory)

        elif command.startswith("DOWNLOAD_ALL"):
            parts = command.split(" ", 1)
            directory = parts[1] if len(parts) > 1 else CLIENT_FILES_DIR
            download_all_files(sock, directory)

        elif command.startswith("UPLOAD"):
            parts = command.split()
            if len(parts) >= 2:
                if len(parts) >= 3 and parts[1] == "-d":
                    # Format: UPLOAD -d directory filename
                    directory = parts[2]
                    filename = " ".join(parts[3:])
                    upload_file(sock, filename, directory)
                else:
                    # Format: UPLOAD filename
                    filename = " ".join(parts[1:])
                    upload_file(sock, filename)
            else:
                print("Usage: UPLOAD <filename> or UPLOAD -d <directory> <filename>")

        elif command.startswith("DOWNLOAD"):
            parts = command.split()
            if len(parts) >= 2:
                if len(parts) >= 3 and parts[1] == "-d":
                    # Format: DOWNLOAD -d directory filename
                    directory = parts[2]
                    filename = " ".join(parts[3:])
                    download_file(sock, filename, directory)
                else:
                    # Format: DOWNLOAD filename
                    filename = " ".join(parts[1:])
                    download_file(sock, filename)
            else:
                print("Usage: DOWNLOAD <filename> or DOWNLOAD -d <directory> <filename>")

        elif command == "QUIT":
            send_command(sock, "QUIT")
            print(sock.recv(1024).decode())
            break

        elif command == "HELP":
            print("Available commands:")
            print("  LIST - List files on server")
            print("  UPLOAD <filename> - Upload a file to server")
            print("  UPLOAD -d <directory> <filename> - Upload from specified directory")
            print("  DOWNLOAD <filename> - Download a file to client_files directory")
            print("  DOWNLOAD -d <directory> <filename> - Download to specified directory")
            print("  UPLOAD_ALL [directory] - Upload all files from directory (default: client_files)")
            print("  DOWNLOAD_ALL [directory] - Download all files to directory (default: client_files)")
            print("  HELP - Show this help message")
            print("  QUIT - Exit the FTP client")

        else:
            print("Invalid command! Type HELP for available commands.")

    sock.close()

if __name__ == "__main__":
    main()