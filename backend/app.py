import os
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS

frontend_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '../frontend')

app = Flask(__name__, static_folder=frontend_path)
CORS(app)

@app.route('/')
def index():
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/<path:path>')
def static_proxy(path):
    return send_from_directory(app.static_folder, path)

@app.route('/chat', methods=['POST'])
def chat():
    data = request.get_json()
    question = data.get('question', '').lower()

    if "gpu" in question:
        answer = "GPUs are great for parallel computing. They accelerate deep learning models by processing many operations simultaneously."
    elif "python" in question:
        answer = "Python is widely used in data science because of its readability and powerful libraries like NumPy and Pandas."
    elif "overfitting" in question:
        answer = ("Overfitting occurs when a machine learning model learns the training data too well, "
                  "including noise and outliers, which harms its performance on new, unseen data.")
    elif "neural network" in question:
        answer = ("A neural network is a set of algorithms modeled loosely after the human brain that "
                  "are designed to recognize patterns and interpret data.")
    elif "reinforcement learning" in question:
        answer = ("Reinforcement learning is a type of machine learning where an agent learns to make decisions "
                  "by taking actions that maximize cumulative rewards.")
    else:
        answer = "I can help with GPU-accelerated machine learning, Python, and data science topics."

    return jsonify({"answer": answer})

if __name__ == '__main__':
    app.run(debug=True)
