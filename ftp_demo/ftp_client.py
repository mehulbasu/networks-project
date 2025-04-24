import socket
import os

SERVER_IP = ""  # Replace with the server's IP address
SERVER_IP = "24.240.36.203"  # Replace with the server's IP address
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
        files = [f for f in os.listdir(directory) if os.path.isfile(
            os.path.join(directory, f))]
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


def upload_file_to_server_dir(sock, server_directory, filename, local_directory=None):
    """Upload a file to a specific directory on the server"""
    try:
        # If local directory is provided, create the full path
        if local_directory:
            filepath = os.path.join(
                local_directory, os.path.basename(filename))
        else:
            filepath = filename

        with open(filepath, "rb") as f:
            # Get file size
            file_size = os.path.getsize(filepath)

            # Send upload command with directory and filename
            sock.send(
                f"UPLOAD_TO {server_directory} {os.path.basename(filepath)}".encode())

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


def download_file_from_server_dir(sock, server_directory, filename, local_directory=CLIENT_FILES_DIR):
    """Download a file from a specific directory on the server"""
    sock.send(f"DOWNLOAD_FROM {server_directory} {filename}".encode())

    # Receive file size
    file_size = int(sock.recv(1024).decode())

    if file_size >= 0:
        sock.send(b"READY")

        # Create destination path
        dest_path = os.path.join(local_directory, os.path.basename(filename))

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
        print(f"File not found on server in directory '{server_directory}'!")


def upload_all_files_to_server_dir(sock, server_directory, local_directory=CLIENT_FILES_DIR):
    """Upload all files from a local directory to a specific server directory"""
    try:
        files = [f for f in os.listdir(local_directory) if os.path.isfile(
            os.path.join(local_directory, f))]
        if not files:
            print(f"No files found in '{local_directory}'")
            return

        print(
            f"Found {len(files)} files to upload to server directory '{server_directory}'")
        for filename in files:
            print(f"Uploading {filename}...")
            upload_file_to_server_dir(
                sock, server_directory, filename, local_directory)
    except FileNotFoundError:
        print(f"Directory '{local_directory}' not found!")
    except PermissionError:
        print(f"Permission denied for directory '{local_directory}'")


def download_all_files_from_server_dir(sock, server_directory, local_directory=CLIENT_FILES_DIR):
    """Download all files from a specific server directory"""
    # Create local directory if it doesn't exist
    if not os.path.exists(local_directory):
        os.makedirs(local_directory)
        print(f"Created directory: {local_directory}")

    # Get list of files from server directory
    send_command(sock, f"LIST {server_directory}")
    response = sock.recv(4096).decode().strip()

    if response == "Directory not found":
        print(f"Server directory '{server_directory}' not found")
        return

    file_list = response.split("\n")

    if not file_list or file_list[0] == '':
        print(f"No files in server directory '{server_directory}' to download")
        return

    print(f"Found {len(file_list)} files to download from '{server_directory}'")

    # Download each file
    for filename in file_list:
        if not filename:  # Skip empty filenames
            continue
        print(f"Downloading {filename}...")
        download_file_from_server_dir(
            sock, server_directory, filename, local_directory)


def main():
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    try:
        sock.connect((SERVER_IP, PORT))
        print(sock.recv(1024).decode())

        while True:
            command = input("ftp> ").strip()

            # Process most specific commands first, then more general ones
            if command.startswith("DOWNLOAD_ALL_FROM"):
                # Format: DOWNLOAD_ALL_FROM server_dir [local_dir]
                parts = command.split(" ", 2)
                if len(parts) >= 2:
                    server_dir = parts[1]
                    local_dir = parts[2] if len(parts) > 2 else CLIENT_FILES_DIR

                    if not os.path.exists(local_dir):
                        os.makedirs(local_dir)

                    send_command(sock, f"DOWNLOAD_ALL_FROM {server_dir}")

                    # Get number of files
                    num_files = int(sock.recv(1024).decode())
                    if num_files == 0:
                        print(f"No files found in server directory '{server_dir}'")
                        continue

                    print(f"Found {num_files} files to download")
                    sock.send(b"READY")

                    for _ in range(num_files):
                        # Get filename and size
                        file_info = sock.recv(1024).decode().split(":")
                        filename, file_size = file_info[0], int(file_info[1])

                        print(f"Downloading {filename}...")
                        sock.send(b"READY")

                        filepath = os.path.join(local_dir, filename)
                        bytes_received = 0
                        with open(filepath, "wb") as f:
                            while bytes_received < file_size:
                                bytes_to_read = min(
                                    4096, file_size - bytes_received)
                                data = sock.recv(bytes_to_read)
                                if not data:
                                    break
                                f.write(data)
                                bytes_received += len(data)

                        sock.send(b"NEXT")

                    print(sock.recv(1024).decode())
                else:
                    print("Usage: DOWNLOAD_ALL_FROM <server_dir> [local_dir]")

            elif command.startswith("DOWNLOAD_FROM"):
                # Format: DOWNLOAD_FROM server_dir filename [-d local_dir]
                parts = command.split()
                if len(parts) >= 3:
                    server_dir = parts[1]
                    if "-d" in parts:
                        d_index = parts.index("-d")
                        if d_index + 1 < len(parts):
                            local_dir = parts[d_index + 1]
                            filename = " ".join(parts[2:d_index])
                            download_file_from_server_dir(
                                sock, server_dir, filename, local_dir)
                        else:
                            print("Missing directory after -d flag")
                    else:
                        filename = " ".join(parts[2:])
                        download_file_from_server_dir(sock, server_dir, filename)
                else:
                    print(
                        "Usage: DOWNLOAD_FROM <server_dir> <filename> [-d <local_dir>]")

            elif command.startswith("DOWNLOAD_ALL"):
                parts = command.split(" ", 1)
                directory = parts[1] if len(parts) > 1 else CLIENT_FILES_DIR
                download_all_files(sock, directory)

            elif command.startswith("UPLOAD_ALL_TO"):
                # Format: UPLOAD_ALL_TO server_dir [local_dir]
                parts = command.split(" ", 2)
                if len(parts) >= 2:
                    server_dir = parts[1]
                    local_dir = parts[2] if len(parts) > 2 else CLIENT_FILES_DIR

                    try:
                        # Get list of files
                        files = [f for f in os.listdir(local_dir) if os.path.isfile(
                            os.path.join(local_dir, f))]
                        if not files:
                            print(f"No files found in '{local_dir}'")
                            continue

                        send_command(sock, f"UPLOAD_ALL_TO {server_dir}")

                        # Send number of files
                        sock.send(str(len(files)).encode())
                        # Wait for server ready
                        response = sock.recv(1024).decode()

                        for filename in files:
                            filepath = os.path.join(local_dir, filename)
                            file_size = os.path.getsize(filepath)

                            # Send filename and size
                            sock.send(f"{filename}:{file_size}".encode())
                            # Wait for server ready
                            response = sock.recv(1024).decode()

                            print(f"Uploading {filename}...")
                            with open(filepath, "rb") as f:
                                while chunk := f.read(4096):
                                    sock.send(chunk)

                            # Wait for next file signal
                            response = sock.recv(1024).decode()

                        print(sock.recv(1024).decode())
                    except FileNotFoundError:
                        print(f"Directory '{local_dir}' not found!")
                    except PermissionError:
                        print(f"Permission denied for directory '{local_dir}'")
                else:
                    print("Usage: UPLOAD_ALL_TO <server_dir> [local_dir]")

            elif command.startswith("UPLOAD_TO"):
                # Format: UPLOAD_TO server_dir filename [-d local_dir]
                parts = command.split()
                if len(parts) >= 3:
                    server_dir = parts[1]
                    if "-d" in parts:
                        d_index = parts.index("-d")
                        if d_index + 1 < len(parts):
                            local_dir = parts[d_index + 1]
                            filename = " ".join(parts[2:d_index])
                            upload_file_to_server_dir(
                                sock, server_dir, filename, local_dir)
                        else:
                            print("Missing directory after -d flag")
                    else:
                        filename = " ".join(parts[2:])
                        upload_file_to_server_dir(sock, server_dir, filename)
                else:
                    print(
                        "Usage: UPLOAD_TO <server_dir> <filename> [-d <local_dir>]")

            elif command.startswith("UPLOAD_ALL"):
                parts = command.split(" ", 1)
                directory = parts[1] if len(parts) > 1 else CLIENT_FILES_DIR
                upload_all_files(sock, directory)

            elif command.startswith("LIST"):
                parts = command.split(" ", 1)
                if len(parts) > 1:
                    server_dir = parts[1]
                    send_command(sock, f"LIST {server_dir}")
                else:
                    send_command(sock, "LIST")
                print(sock.recv(4096).decode())
                
            elif command.startswith("DELETE_FROM"):
                # Format: DELETE_FROM server_dir filename
                parts = command.split(" ", 2)
                if len(parts) >= 3:
                    server_dir = parts[1]
                    filename = parts[2]
                    delete_file_from_server_dir(sock, server_dir, filename)
                else:
                    print("Usage: DELETE_FROM <server_dir> <filename>")

            elif command == "QUIT":
                send_command(sock, "QUIT")
                print(sock.recv(1024).decode())
                break

            elif command == "HELP":
                print("Available commands:")
                print(
                    "  LIST [server_dir] - List files on server (optionally in specific directory)")
                print(
                    "  UPLOAD_TO <server_dir> <filename> - Upload to specified server directory")
                print(
                    "  UPLOAD_TO <server_dir> <filename> -d <local_dir> - Upload from local dir to server dir")
                print(
                    "  DOWNLOAD_FROM <server_dir> <filename> - Download from specified server directory")
                print(
                    "  DOWNLOAD_FROM <server_dir> <filename> -d <local_dir> - Download from server to local dir")
                print(
                    "  UPLOAD_ALL [local_dir] - Upload all files from local directory (default: client_files)")
                print(
                    "  DOWNLOAD_ALL [local_dir] - Download all files to local directory (default: client_files)")
                print(
                    "  UPLOAD_ALL_TO <server_dir> [local_dir] - Upload all files to server directory")
                print(
                    "  DOWNLOAD_ALL_FROM <server_dir> [local_dir] - Download all files from server directory")
                print(
                    "  DELETE_FROM <server_dir> <filename> - Delete a file from specified server directory")
                print("  HELP - Show this help message")
                print("  QUIT - Exit the FTP client")

            else:
                print("Invalid command! Type HELP for available commands.")

    except ConnectionRefusedError:
        print("Connection to the server failed. Make sure the server is running and the address is correct.")
    except ConnectionResetError:
        print("Connection was reset by the server. The server may have closed the connection.")
    except Exception as e:
        print(f"An error occurred: {e}")
    finally:
        sock.close()


if __name__ == "__main__":
    main()
