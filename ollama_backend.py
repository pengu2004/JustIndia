from flask import Flask, request, jsonify
from flask_cors import CORS
from transformers import AutoModelForCausalLM, AutoTokenizer, AutoModelForSequenceClassification
from sentence_transformers import SentenceTransformer, util
import torch
import torch.nn.functional as F

app = Flask(__name__)
CORS(app)

# Model names
LAW_LLM_NAME = "nlpaueb/legal-bert-base-uncased"
INLEGAL_BERT_NAME = "law-ai/InLegalBERT"
INLEGAL_SBERT_NAME = "bhavyagiri/InLegal-Sbert"

print("Loading models...")
device = "cuda" if torch.cuda.is_available() else "cpu"

# Load models
law_llm_tokenizer = AutoTokenizer.from_pretrained(LAW_LLM_NAME)
law_llm_model = AutoModelForCausalLM.from_pretrained(LAW_LLM_NAME, trust_remote_code=True).to(device)
inlegal_bert_tokenizer = AutoTokenizer.from_pretrained(INLEGAL_BERT_NAME)
inlegal_bert_model = AutoModelForSequenceClassification.from_pretrained(INLEGAL_BERT_NAME).to(device)
sbert_model = SentenceTransformer(INLEGAL_SBERT_NAME).to(device)

print("Models loaded successfully.")

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
category_texts = list(LEGAL_CATEGORIES.values())
category_embeddings = sbert_model.encode(category_texts, convert_to_tensor=True)

def get_best_legal_category(query):
    """Finds the most relevant legal category based on SBERT similarity"""
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

@app.route('/api/chat', methods=['POST'])
def chat():
    data = request.json
    user_message = data.get("message")
    
    if not user_message:
        return jsonify({"error": "No message provided"}), 400

    try:
        # Enhance query with SBERT-based legal category detection
        processed_query = get_best_legal_category(user_message)

        # Few-shot prompting (improves response quality)
        

        # Tokenize input

        # Generate response
    except Exception as e:
        return jsonify({"error": f"Error processing request: {str(e)}"}), 500

if __name__ == '__main__':
    print("Starting Flask server on port 5000...")
    app.run(debug=True, port=5000)