from flask import Flask, request, jsonify
import socket
import os
import threading
import shutil

app = Flask(__name__)
IMAGE_STORAGE_PATH = '/usr/src/app/images'
FTP_PORT = 2121
TEMP_UPLOAD_FOLDER = '/usr/src/app/temp_uploads'

# Ensure directories exist
for directory in [IMAGE_STORAGE_PATH, TEMP_UPLOAD_FOLDER]:
    if not os.path.exists(directory):
        os.makedirs(directory)


def handle_ftp_client(client_socket, addr):
    print(f"FTP Connection from {addr}")
    client_socket.send(b"Welcome to the FTP server!\n")

    while True:
        try:
            command = client_socket.recv(1024).decode().strip()
            if not command:
                break

            print(f"Received command: {command}")

            if command.startswith("UPLOAD"):
                # Modified to include user_id in command: "UPLOAD filename user_id"
                parts = command.split(" ")
                if len(parts) != 3:
                    client_socket.send(
                        b"Invalid command format. Use: UPLOAD filename user_id\n")
                    continue

                filename = parts[1]
                user_id = parts[2]
                temp_path = os.path.join(TEMP_UPLOAD_FOLDER, filename)

                # Get file size from client
                file_size = int(client_socket.recv(1024).decode())
                client_socket.send(b"READY")

                # Read file into temp location
                bytes_received = 0
                with open(temp_path, "wb") as f:
                    while bytes_received < file_size:
                        bytes_to_read = min(4096, file_size - bytes_received)
                        data = client_socket.recv(bytes_to_read)
                        if not data:
                            break
                        f.write(data)
                        bytes_received += len(data)

                # Move file to user's directory
                user_dir = os.path.join(IMAGE_STORAGE_PATH, user_id)
                if not os.path.exists(user_dir):
                    os.makedirs(user_dir)

                final_path = os.path.join(user_dir, filename)
                shutil.move(temp_path, final_path)

                client_socket.send(b"File uploaded successfully!\n")

            elif command == "QUIT":
                client_socket.send(b"Goodbye!\n")
                break

        except Exception as e:
            print(f"Error handling client: {e}")
            break

    client_socket.close()
    print(f"FTP Connection with {addr} closed")


def start_ftp_server():
    server_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    server_socket.bind(('0.0.0.0', FTP_PORT))
    server_socket.listen(5)
    print(f"FTP Server started on port {FTP_PORT}")

    while True:
        client_socket, addr = server_socket.accept()
        threading.Thread(target=handle_ftp_client,
                         args=(client_socket, addr)).start()


# Start FTP server in a separate thread
ftp_thread = threading.Thread(target=start_ftp_server)
ftp_thread.daemon = True
ftp_thread.start()

# Flask routes


@app.route('/upload', methods=['POST'])
def upload_image():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400

    file = request.files['file']
    user_id = request.form.get('user_id')

    if not user_id:
        return jsonify({'error': 'No user_id provided'}), 400

    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400

    if file:
        # Create user directory if it doesn't exist
        user_dir = os.path.join(IMAGE_STORAGE_PATH, user_id)
        if not os.path.exists(user_dir):
            os.makedirs(user_dir)

        file_path = os.path.join(user_dir, file.filename)
        file.save(file_path)
        return jsonify({
            'message': 'File uploaded successfully',
            'file_path': file_path
        }), 200


@app.route('/images/<user_id>', methods=['GET'])
def list_images(user_id):
    user_dir = os.path.join(IMAGE_STORAGE_PATH, user_id)
    if not os.path.exists(user_dir):
        return jsonify({'error': 'User directory not found'}), 404

    files = os.listdir(user_dir)
    return jsonify({'images': files}), 200


@app.route('/images/<user_id>/<filename>', methods=['GET'])
def get_image(user_id, filename):
    file_path = os.path.join(IMAGE_STORAGE_PATH, user_id, filename)
    if os.path.exists(file_path):
        return jsonify({'file_path': file_path}), 200
    else:
        return jsonify({'error': 'File not found'}), 404


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
