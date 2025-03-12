from flask import Flask, request, jsonify
import os

app = Flask(__name__)
IMAGE_STORAGE_PATH = '/usr/src/app/images'

### TODO:
# create the users' directory if it does not exist
# commands to create specific directory in the file System
# label images coming in
# connect web backend request to which folder to save the images
# add a payload to the upload and download image endpoints which includes the user_id
###

@app.route('/upload', methods=['POST'])
def upload_image():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    if file:
        file_path = os.path.join(IMAGE_STORAGE_PATH, file.filename)
        file.save(file_path)
        return jsonify({'message': 'File uploaded successfully', 'file_path': file_path}), 200

@app.route('/images', methods=['GET'])
def list_images():
    files = os.listdir(IMAGE_STORAGE_PATH)
    return jsonify({'images': files}), 200

@app.route('/images/<filename>', methods=['GET'])
def get_image(filename):
    file_path = os.path.join(IMAGE_STORAGE_PATH, filename)
    if os.path.exists(file_path):
        return jsonify({'file_path': file_path}), 200
    else:
        return jsonify({'error': 'File not found'}), 404

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)