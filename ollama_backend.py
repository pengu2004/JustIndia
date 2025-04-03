from flask import Flask, request, jsonify
from flask_cors import CORS
from sentence_transformers import SentenceTransformer, util
import torch
import subprocess
import json

app = Flask(__name__)
CORS(app)

# Model names
INLEGAL_SBERT_NAME = "bhavyagiri/InLegal-Sbert"
OLLAMA_MODEL_NAME = "hf.co/Update0936/Law_llm:Q5_K_M"

print("Loading models...")
device = "cpu"  # Force CPU usage

try:
    sbert_model = SentenceTransformer(INLEGAL_SBERT_NAME).to(device)
    print("Models loaded successfully.")
except Exception as e:
    print(f"Error loading models: {str(e)}")
    exit(1)

# Legal categories with sample descriptions for similarity matching
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

# Precompute embeddings for legal categories
try:
    category_texts = list(LEGAL_CATEGORIES.values())
    category_embeddings = sbert_model.encode(category_texts, convert_to_tensor=True)
except Exception as e:
    print(f"Error processing embeddings: {str(e)}")
    exit(1)

def get_best_legal_category(query):
    """Finds the most relevant legal category based on SBERT similarity"""
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

def query_ollama_model(prompt):
    """Queries the specified Ollama model using the command-line interface."""
    try:
        result = subprocess.run(
            ["ollama", "run", OLLAMA_MODEL_NAME, prompt],
            capture_output=True, text=True
        )
        return result.stdout.strip()
    except Exception as e:
        return f"Error querying Ollama model: {str(e)}"

@app.route('/api/chat', methods=['POST'])
def chat():
    data = request.json
    user_message = data.get("message")
    
    if not user_message:
        return jsonify({"error": "No message provided"}), 400

    try:
        # Enhance query with SBERT-based legal category detection
        processed_query = get_best_legal_category(user_message)
        
        # Query the specified Ollama model
        response = query_ollama_model(processed_query)
        
        if not response.strip():
            response = "I'm sorry, I couldn't generate a meaningful response. Can you try rephrasing your question?"
        
        return jsonify({"response": response})
    except Exception as e:
        return jsonify({"error": f"Error processing request: {str(e)}"}), 500

if __name__ == '__main__':
    print("Starting Flask server on port 5000...")
    app.run(debug=True, port=5000)
