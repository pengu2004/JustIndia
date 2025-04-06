from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os
from difflib import get_close_matches

app = Flask(__name__)
CORS(app) 

# Path to the directory where your legal documents are stored
DOCUMENTS_DIR = r'C:\Users\USER\Downloads\drive-download-20250406T143438Z-001'

document_files = os.listdir(DOCUMENTS_DIR)

def find_best_matching_document(query):
    """Find the closest matching document name from the folder."""
    matches = get_close_matches(query, document_files, n=1, cutoff=0.3)
    if matches:
        return matches[0]
    return None

@app.route('/api/chat', methods=['POST'])
def chat_api():
    data = request.get_json()
    user_input = data.get('message', '')

    if 'give the document' in user_input.lower():
        match = find_best_matching_document(user_input)
        if match:
            download_link = f"<a href='http://localhost:5000/download?document={match}' target='_blank'>{match}</a>"
            return jsonify({'response': f"Here is your document: {download_link}"})
        else:
            return jsonify({'response': "Sorry, I couldn't find a matching document."})

    return jsonify({'response': f"You said: {user_input}"})

@app.route('/download', methods=['GET'])
def download_document():
    document_name = request.args.get('document')
    if not document_name:
        return "Document name must be provided", 400
    
    document_path = os.path.join(DOCUMENTS_DIR, document_name)
    
    if not os.path.exists(document_path):
        return "Document not found", 404
    
    return send_from_directory(DOCUMENTS_DIR, document_name, as_attachment=True)

if __name__ == '__main__':
    app.run(debug=True)

