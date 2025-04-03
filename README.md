# Legal LLM Chatbot

This is a Flask-based chatbot that leverages a legal-specific large language model (LLM) and sentence embeddings to enhance query processing. It uses Ollama for inference and provides relevant legal insights.

## Features
- Uses **InLegal-SBERT** for legal context identification.
- Queries the **Ollama LLM** for legal text generation.
- Exposes a simple API for chatbot interactions.
- Includes a frontend that can be served via `python -m http.server 5500`.

## Dependencies
Make sure you have the following dependencies installed:

```sh
pip install flask flask-cors sentence-transformers torch
```

Additionally, you need to have **Ollama** installed and the required model downloaded:

```sh
ollama pull hf.co/Update0936/Law_llm:Q5_K_M
```

## Running the Backend
To start the chatbot backend, run:

```sh
python ollama_backend.py
```

## Running the Frontend
You can serve the frontend using Python's built-in HTTP server:

```sh
cd frontend
python -m http.server 5500
```

## Notes
- Ensure Ollama is running and the required model is available.
- The chatbot enhances user queries with legal context before sending them to the LLM.
- The confidence threshold for category detection is set to 0.5.

