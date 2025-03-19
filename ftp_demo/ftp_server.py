import socket
import os
import threading

HOST = "0.0.0.0"  # Listen on all available interfaces
PORT = 2121  # FTP runs on a non-default port to avoid conflicts
UPLOAD_FOLDER = "server_files/"

if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

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
                files = os.listdir(UPLOAD_FOLDER)
                client_socket.send("\n".join(files).encode() + b"\n")

            elif command.startswith("UPLOAD"):
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

            elif command.startswith("DOWNLOAD"):
                filename = command.split(" ")[1]
                filepath = os.path.join(UPLOAD_FOLDER, filename)
                if os.path.exists(filepath):
                    # Send file size first
                    file_size = os.path.getsize(filepath)
                    client_socket.send(str(file_size).encode())
                    response = client_socket.recv(1024)  # Wait for client ready
                    
                    with open(filepath, "rb") as f:
                        while chunk := f.read(4096):
                            client_socket.send(chunk)
                else:
                    client_socket.send(b"-1")  # Indicate file not found
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
        threading.Thread(target=handle_client, args=(client_socket, addr)).start()

if __name__ == "__main__":
    start_server()