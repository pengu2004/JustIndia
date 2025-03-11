from flask import Flask, request, jsonify
from flask_cors import CORS
from transformers import AutoModelForCausalLM, AutoTokenizer
import torch

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend communication

# Load the Hugging Face model
MODEL_NAME = "Update0936/Law_llm"
tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
model = AutoModelForCausalLM.from_pretrained(MODEL_NAME)

@app.route('/api/chat', methods=['POST'])
def chat():
    data = request.json
    user_message = data.get("message")

    if not user_message:
        return jsonify({"error": "No message provided"}), 400

    # Tokenize input
    inputs = tokenizer(user_message, return_tensors="pt", truncation=True, max_length=512)

    # Generate response
    with torch.no_grad():
        output = model.generate(**inputs, max_length=1024)

    bot_response = tokenizer.decode(output[0], skip_special_tokens=True)

    return jsonify({"response": bot_response})

if __name__ == '__main__':
    app.run(debug=True, port=5000)