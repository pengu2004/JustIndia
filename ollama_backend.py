from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from sentence_transformers import SentenceTransformer, util
import torch
import subprocess
import os
from difflib import get_close_matches

app = Flask(__name__)
CORS(app)

# ==== Configuration ====
INLEGAL_SBERT_NAME = "bhavyagiri/InLegal-Sbert"
OLLAMA_MODEL_NAME = "hf.co/Update0936/Law_llm:Q5_K_M"
DOCUMENTS_DIR = r'C:\Users\thoma\Documents\MINI Project\Shone\JustIndia-bert-added\JustIndia-bert-added\Doc_'

# ==== Load Models ====
print("Loading models...")
device = "cpu"

try:
    sbert_model = SentenceTransformer(INLEGAL_SBERT_NAME).to(device)
    print("Models loaded successfully.")
except Exception as e:
    print(f"Error loading models: {str(e)}")
    exit(1)

# ==== Legal Categories ====
LEGAL_CATEGORIES = {
    "Contract Law": "Deals with agreements, contracts, and breach of contract.",
    "Criminal Law": "Covers crimes, penalties, and criminal proceedings.",
    "Family Law": "Related to marriage, divorce, child custody, and inheritance.",
    "Property Law": "Covers ownership rights, real estate, and land disputes.",
    "Intellectual Property": "Deals with patents, copyrights, trademarks.",
    "Employment Law": "Covers worker rights, discrimination, wages.",
    "Tax Law": "Related to income tax, corporate tax, and financial regulations.",
    "Corporate Law": "Deals with business regulations, mergers, acquisitions.",
    "Cyber Law": "Covers online fraud, data protection, and digital rights.",
    "Environmental Law": "Related to pollution, sustainability, and environmental policies."
}

# ==== Precompute Category Embeddings ====
try:
    category_texts = list(LEGAL_CATEGORIES.values())
    category_embeddings = sbert_model.encode(category_texts, convert_to_tensor=True)
except Exception as e:
    print(f"Error processing embeddings: {str(e)}")
    exit(1)

# ==== Helper: Best Legal Category ====
def get_best_legal_category(query):
    try:
        query_embedding = sbert_model.encode(query, convert_to_tensor=True)
        similarities = util.pytorch_cos_sim(query_embedding, category_embeddings)[0]
        best_index = torch.argmax(similarities).item()
        best_category = list(LEGAL_CATEGORIES.keys())[best_index]
        confidence = similarities[best_index].item()
        if confidence > 0.5:
            print(f"Best match: {best_category} (confidence {confidence:.2f})")
            return f"{query} [Legal Context: {best_category}]"
        else:
            return query
    except Exception as e:
        print(f"Error finding best legal category: {str(e)}")
        return query

# ==== Helper: Query Ollama ====
def query_ollama_model(prompt):
    try:
        result = subprocess.run(
            ["ollama", "run", OLLAMA_MODEL_NAME, prompt],
            capture_output=True, text=True
        )
        return result.stdout.strip()
    except Exception as e:
        return f"Error querying Ollama model: {str(e)}"

# ==== Helper: Match document ====
def find_best_matching_document(query):
    try:
        document_files = os.listdir(DOCUMENTS_DIR)
        matches = get_close_matches(query, document_files, n=1, cutoff=0.3)
        return matches[0] if matches else None
    except Exception as e:
        print(f"Error finding document: {str(e)}")
        return None

# ==== Chat Endpoint ====
@app.route('/api/chat', methods=['POST'])
def chat():
    data = request.get_json()
    user_input = data.get("message", "")

    if not user_input:
        return jsonify({"error": "No message provided"}), 400

    # If user wants a document
    if 'give the document' in user_input.lower():
        match = find_best_matching_document(user_input)
        if match:
            download_url = f"http://localhost:5000/download?document={match}"
            return jsonify({
                "response": f"Here is your document: <a href='{download_url}' target='_blank'>{match}</a>"
            })
        else:
            return jsonify({"response": "Sorry, I couldn't find a matching document."})

    # Otherwise process normally
    try:
        processed_query = get_best_legal_category(user_input)
        response = query_ollama_model(processed_query)

        if not response.strip():
            response = "I'm sorry, I couldn't generate a meaningful response. Can you try rephrasing your question?"

        return jsonify({"response": response})
    except Exception as e:
        return jsonify({"error": f"Error processing request: {str(e)}"}), 500

# ==== Download Endpoint ====
@app.route('/download', methods=['GET'])
def download_document():
    document_name = request.args.get('document')
    if not document_name:
        return "Document name must be provided", 400

    document_path = os.path.join(DOCUMENTS_DIR, document_name)
    if not os.path.exists(document_path):
        return "Document not found", 404

    return send_from_directory(DOCUMENTS_DIR, document_name, as_attachment=True)

# ==== Run App ====
if __name__ == '__main__':
    print("Starting Flask server on http://localhost:5000 ...")
    app.run(debug=True, port=5000)
