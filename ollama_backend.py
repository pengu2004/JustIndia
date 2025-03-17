from flask import Flask, request, jsonify
from flask_cors import CORS
from transformers import AutoModelForCausalLM, AutoTokenizer, AutoModelForSequenceClassification
import torch

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend communication

# Load the Hugging Face models
LAW_LLM_NAME = "Update0936/Law_llm"
INLEGAL_BERT_NAME = "law-ai/InLegalBERT"  # Replace with the correct model name for InLegal-BERT

# Load tokenizers and models
law_llm_tokenizer = AutoTokenizer.from_pretrained(LAW_LLM_NAME)
law_llm_model = AutoModelForCausalLM.from_pretrained(LAW_LLM_NAME)

inlegal_bert_tokenizer = AutoTokenizer.from_pretrained(INLEGAL_BERT_NAME)
inlegal_bert_model = AutoModelForSequenceClassification.from_pretrained(INLEGAL_BERT_NAME)

def preprocess_query_with_inlegal_bert(query):
    """
    Preprocess the user query using InLegal-BERT.
    For example, classify the query or extract legal entities.
    """
    # Tokenize the input query
    inputs = inlegal_bert_tokenizer(query, return_tensors="pt", truncation=True, max_length=512)

    # Perform inference with InLegal-BERT
    with torch.no_grad():
        outputs = inlegal_bert_model(**inputs)

    # Example: Get the predicted class (assuming it's a classification model)
    predicted_class = torch.argmax(outputs.logits, dim=1).item()

    # Map the predicted class to a legal category (example)
    legal_categories = ["Contract Law", "Criminal Law", "Family Law", "Property Law"]
    legal_category = legal_categories[predicted_class]

    # Return the processed query (you can modify this based on your use case)
    processed_query = f"{query} [Legal Category: {legal_category}]"
    return processed_query

@app.route('/api/chat', methods=['POST'])
def chat():
    data = request.json
    user_message = data.get("message")

    if not user_message:
        return jsonify({"error": "No message provided"}), 400

    # Preprocess the query using InLegal-BERT
    processed_query = preprocess_query_with_inlegal_bert(user_message)

    # Tokenize the processed query for the LLM
    inputs = law_llm_tokenizer(processed_query, return_tensors="pt", truncation=True, max_length=512)

    # Generate response using the LLM
    with torch.no_grad():
        output = law_llm_model.generate(**inputs, max_length=1024)

    bot_response = law_llm_tokenizer.decode(output[0], skip_special_tokens=True)

    return jsonify({"response": bot_response})

if __name__ == '__main__':
    app.run(debug=True, port=5000)