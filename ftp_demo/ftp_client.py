import socket
import os

SERVER_IP = "192.168.0.104"  # Replace with the server's IP address
PORT = 2121


def send_command(sock, command):
    sock.send(command.encode())


def upload_file(sock, filename):
    try:
        with open(filename, "rb") as f:
            # Get file size
            file_size = os.path.getsize(filename)

            # Send upload command with filename
            sock.send(f"UPLOAD {filename}".encode())

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
        print("File not found!")


def download_file(sock, filename):
    sock.send(f"DOWNLOAD {filename}".encode())

    # Receive file size
    file_size = int(sock.recv(1024).decode())

    if file_size >= 0:
        sock.send(b"READY")
        bytes_received = 0
        with open(filename, "wb") as f:
            while bytes_received < file_size:
                bytes_to_read = min(4096, file_size - bytes_received)
                data = sock.recv(bytes_to_read)
                if not data:
                    break
                f.write(data)
                bytes_received += len(data)
        print("Download complete!")
    else:
        print("File not found on server!")


def main():
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sock.connect((SERVER_IP, PORT))
    print(sock.recv(1024).decode())

    while True:
        command = input("ftp> ").strip()
        if command.startswith("LIST"):
            send_command(sock, "LIST")
            print(sock.recv(4096).decode())

        elif command.startswith("UPLOAD"):
            filename = command.split(" ")[1]
            upload_file(sock, filename)

        elif command.startswith("DOWNLOAD"):
            filename = command.split(" ")[1]
            download_file(sock, filename)

        elif command == "QUIT":
            send_command(sock, "QUIT")
            print(sock.recv(1024).decode())
            break

        else:
            print("Invalid command!")

    sock.close()


if __name__ == "__main__":
    main()
