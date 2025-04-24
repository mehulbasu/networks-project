import socket
import os
import threading

# TODO: Add acknowledgement system for commands

HOST = "0.0.0.0"  # Listen on all available interfaces
PORT = 2121
UPLOAD_FOLDER = "server_files/"

if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)


def is_safe_path(basedir, path):
    """Check if the path is safe (doesn't escape from basedir using ../)"""
    # Resolve to absolute path
    abs_path = os.path.abspath(os.path.join(basedir, path))
    # Check if it's within the basedir
    return abs_path.startswith(os.path.abspath(basedir))


def handle_client(client_socket, addr):
    print(f"Connection from {addr}")
    client_socket.send(b"Welcome to the FTP server!\n")

    while True:
        try:
            command = client_socket.recv(1024).decode().strip()
            if not command:
                break

            print(f"Received command: {command}")

            if command.startswith("LIST"):
                parts = command.split(" ", 1)
                if len(parts) > 1:
                    # List specific directory
                    directory = parts[1]
                    # Security check
                    if not is_safe_path(UPLOAD_FOLDER, directory):
                        client_socket.send(b"Invalid directory path\n")
                        continue

                    list_path = os.path.join(UPLOAD_FOLDER, directory)
                else:
                    list_path = UPLOAD_FOLDER

                if os.path.exists(list_path) and os.path.isdir(list_path):
                    files = os.listdir(list_path)
                    client_socket.send("\n".join(files).encode() + b"\n")
                else:
                    client_socket.send(b"Directory not found\n")

            elif command.startswith("UPLOAD_TO"):
                # Format: UPLOAD_TO directory filename
                parts = command.split(" ", 2)
                if len(parts) < 3:
                    client_socket.send(b"Invalid command format\n")
                    continue

                directory = parts[1]
                filename = parts[2]

                # Security check
                if not is_safe_path(UPLOAD_FOLDER, directory):
                    client_socket.send(b"Invalid directory path\n")
                    continue

                # Create directory if it doesn't exist
                server_dir = os.path.join(UPLOAD_FOLDER, directory)
                if not os.path.exists(server_dir):
                    os.makedirs(server_dir)

                filepath = os.path.join(server_dir, filename)

                # Get file size from client
                file_size = int(client_socket.recv(1024).decode())
                client_socket.send(b"READY")

                # Read exact number of bytes
                bytes_received = 0
                with open(filepath, "wb") as f:
                    while bytes_received < file_size:
                        bytes_to_read = min(4096, file_size - bytes_received)
                        data = client_socket.recv(bytes_to_read)
                        if not data:
                            break
                        f.write(data)
                        bytes_received += len(data)

                client_socket.send(
                    f"File uploaded successfully to {directory}!\n".encode())

            # Add after the UPLOAD command handler
            elif command.startswith("UPLOAD_ALL_TO"):
                # Format: UPLOAD_ALL_TO directory
                parts = command.split(" ")
                if len(parts) < 3:
                    client_socket.send(b"Invalid command format\n")
                    continue

                directory = parts[1]
                try:
                    num_files = int(parts[2])
                except ValueError:
                    client_socket.send(b"Invalid number of files\n")
                    continue

                # Security check
                if not is_safe_path(UPLOAD_FOLDER, directory):
                    client_socket.send(b"Invalid directory path\n")
                    continue

                # Create directory if it doesn't exist
                server_dir = os.path.join(UPLOAD_FOLDER, directory)
                if not os.path.exists(server_dir):
                    os.makedirs(server_dir)

                # Get number of files from client
                # num_files = int(client_socket.recv(1024).decode())
                client_socket.send(b"READY")

                for _ in range(num_files):
                    # Get filename and size
                    file_info = client_socket.recv(1024).decode().split(":")
                    filename, file_size = file_info[0], int(file_info[1])

                    filepath = os.path.join(server_dir, filename)
                    client_socket.send(b"READY")

                    # Read exact number of bytes
                    bytes_received = 0
                    with open(filepath, "wb") as f:
                        while bytes_received < file_size:
                            bytes_to_read = min(
                                4096, file_size - bytes_received)
                            data = client_socket.recv(bytes_to_read)
                            if not data:
                                break
                            f.write(data)
                            bytes_received += len(data)

                    client_socket.send(b"NEXT")

                client_socket.send(
                    f"All files uploaded successfully to {directory}!\n".encode())

            elif command.startswith("UPLOAD"):
                # Regular upload to root directory
                filename = command.split(" ")[1]
                filepath = os.path.join(UPLOAD_FOLDER, filename)

                # Get file size from client
                file_size = int(client_socket.recv(1024).decode())
                client_socket.send(b"READY")

                # Read exact number of bytes
                bytes_received = 0
                with open(filepath, "wb") as f:
                    while bytes_received < file_size:
                        bytes_to_read = min(4096, file_size - bytes_received)
                        data = client_socket.recv(bytes_to_read)
                        if not data:
                            break
                        f.write(data)
                        bytes_received += len(data)

                client_socket.send(b"File uploaded successfully!\n")

            elif command.startswith("DOWNLOAD_FROM"):
                # Format: DOWNLOAD_FROM directory filename
                parts = command.split(" ", 2)
                if len(parts) < 3:
                    client_socket.send(b"Invalid command format\n")
                    continue

                directory = parts[1]
                filename = parts[2]

                # Security check
                if not is_safe_path(UPLOAD_FOLDER, directory):
                    client_socket.send(b"Invalid directory path\n")
                    continue

                filepath = os.path.join(UPLOAD_FOLDER, directory, filename)

                if os.path.exists(filepath):
                    # Send file size first
                    file_size = os.path.getsize(filepath)
                    client_socket.send(str(file_size).encode())
                    response = client_socket.recv(
                        1024)  # Wait for client ready

                    with open(filepath, "rb") as f:
                        while chunk := f.read(4096):
                            client_socket.send(chunk)
                else:
                    client_socket.send(b"-1")  # Indicate file not found

            elif command.startswith("DOWNLOAD_ALL_FROM"):
                # Format: DOWNLOAD_ALL_FROM directory
                parts = command.split(" ", 1)
                if len(parts) < 2:
                    client_socket.send(b"Invalid command format\n")
                    continue

                directory = parts[1]

                # Security check
                if not is_safe_path(UPLOAD_FOLDER, directory):
                    client_socket.send(b"Invalid directory path\n")
                    continue

                server_dir = os.path.join(UPLOAD_FOLDER, directory)
                if not os.path.exists(server_dir):
                    client_socket.send(b"0")  # No files to send
                    continue

                files = [f for f in os.listdir(server_dir) if os.path.isfile(
                    os.path.join(server_dir, f))]
                client_socket.send(str(len(files)).encode())
                response = client_socket.recv(1024)  # Wait for client ready

                for filename in files:
                    filepath = os.path.join(server_dir, filename)
                    file_size = os.path.getsize(filepath)

                    # Send filename and size
                    client_socket.send(f"{filename}:{file_size}".encode())
                    response = client_socket.recv(
                        1024)  # Wait for client ready

                    # Send file data
                    with open(filepath, "rb") as f:
                        while chunk := f.read(4096):
                            client_socket.send(chunk)

                    # Wait for next file signal
                    response = client_socket.recv(1024)

                client_socket.send(b"All files downloaded successfully!\n")

            elif command.startswith("DOWNLOAD"):
                # Regular download from root directory
                filename = command.split(" ")[1]
                filepath = os.path.join(UPLOAD_FOLDER, filename)
                if os.path.exists(filepath):
                    # Send file size first
                    file_size = os.path.getsize(filepath)
                    client_socket.send(str(file_size).encode())
                    response = client_socket.recv(
                        1024)  # Wait for client ready

                    with open(filepath, "rb") as f:
                        while chunk := f.read(4096):
                            client_socket.send(chunk)
                else:
                    client_socket.send(b"-1")  # Indicate file not found

            elif command.startswith("DELETE_FROM"):
                # Format: DELETE_FROM directory filename
                parts = command.split(" ", 2)
                if len(parts) < 3:
                    client_socket.send(b"Invalid command format\n")
                    continue

                directory = parts[1]
                filename = parts[2]

                # Security check
                if not is_safe_path(UPLOAD_FOLDER, directory):
                    client_socket.send(b"Invalid directory path\n")
                    continue

                filepath = os.path.join(UPLOAD_FOLDER, directory, filename)

                if os.path.exists(filepath) and os.path.isfile(filepath):
                    try:
                        os.remove(filepath)
                        client_socket.send(
                            f"File {filename} deleted successfully from {directory}!\n".encode())
                    except Exception as e:
                        client_socket.send(
                            f"Error deleting file: {str(e)}\n".encode())
                else:
                    client_socket.send(b"File not found\n")

            elif command.startswith("QUIT"):
                client_socket.send(b"Goodbye!\n")
                break

            else:
                client_socket.send(b"Invalid command!\n")

        except ConnectionResetError:
            break

    client_socket.close()
    print(f"Connection with {addr} closed")


def start_server():
    server_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    server_socket.bind((HOST, PORT))
    server_socket.listen(5)
    print(f"Server started on {HOST}:{PORT}")

    while True:
        client_socket, addr = server_socket.accept()
        threading.Thread(target=handle_client, args=(
            client_socket, addr)).start()


if __name__ == "__main__":
    start_server()
