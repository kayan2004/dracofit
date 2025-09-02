import os
import json
from flask import Flask, request, jsonify, g, session
from flask_cors import CORS
from werkzeug.exceptions import ClientDisconnected
import threading
import signal
# Import config
import config
from model import GemmaModelSingleton, get_chatbot_response, get_health_check, logger  # Import logger

# Initialize Flask app
app = Flask(__name__)
app.secret_key = config.SECRET_KEY  # Use key from config
CORS(app, supports_credentials=True)  # Enable credentials for sessions

# Track ongoing requests and their abort flags
active_requests = {}
request_lock = threading.Lock()

@app.route('/health', methods=['GET'])
def health():
    """
    Health check endpoint to verify if the API and model are working.
    """
    result = get_health_check()
    return jsonify(result)

@app.route('/chat', methods=['POST'])
def chat():
    """
    Main endpoint for chat interactions with abort handling.
    """
    # Get or initialize conversation history
    if 'conversation' not in session:
        session['conversation'] = []
    
    # Create a request ID and an event to signal abortion
    request_id = threading.get_ident()
    abort_event = threading.Event()
    
    # Track this request
    with request_lock:
        active_requests[request_id] = abort_event
    
    try:
        data = request.json
        if not data or 'message' not in data:
            return jsonify({
                'status': 'error',
                'message': 'No message provided'
            }), 400
            
        user_message = data['message']
        
        # Add user message to history
        session['conversation'].append({"role": "user", "content": user_message})
        
        # Get model response with conversation history
        result = get_chatbot_response(session['conversation'])
        
        # Add bot response to history (if successful)
        if result['status'] == 'success':
            session['conversation'].append({"role": "model", "content": result['response']}) # Use "model" role
        
        # Limit conversation length to prevent context overflow
        if len(session['conversation']) > 10:  # Keep last 10 messages
            session['conversation'] = session['conversation'][-10:]
        
        # Clean up
        with request_lock:
            if request_id in active_requests:
                del active_requests[request_id]
        
        return jsonify(result)
    
    except ClientDisconnected:
        logger.warning(f"Client disconnected from request {request_id}") # Use logger
        # Signal the model generation to abort if it's still running
        with request_lock:
            if request_id in active_requests:
                active_requests[request_id].set() # Signal abort
        return jsonify({"status": "aborted", "message": "Client disconnected"}), 499 # Use 499 or another appropriate code
    
    except Exception as e:
        logger.exception(f"Error processing request {request_id}: {e}") # Use logger.exception
        # Also signal abort here in case the error happened mid-generation
        with request_lock:
            if request_id in active_requests:
                active_requests[request_id].set()
        return jsonify({
            'status': 'error',
            'message': "An internal server error occurred." # Avoid exposing raw error details
        }), 500
    
    finally:
        # Ensure we clean up
        with request_lock:
            if request_id in active_requests:
                del active_requests[request_id]

# Handle SIGTERM to abort all requests when shutting down
def handle_shutdown(signum, frame):
    logger.info("Shutdown signal received, aborting active requests...") # Use logger
    with request_lock:
        for req_id, abort_event in active_requests.items():
            logger.info(f"Signalling abort for request {req_id}")
            abort_event.set()
    # Give threads a moment to potentially react before exiting (optional)
    # time.sleep(1)
    # exit(0) # Or let the server handle the exit

if __name__ == '__main__':
    # Register the SIGTERM handler earlier
    signal.signal(signal.SIGTERM, handle_shutdown)
    signal.signal(signal.SIGINT, handle_shutdown) # Also handle Ctrl+C

    port = int(os.environ.get('PORT', 5000))
    logger.info(f"Starting Flask server on port {port}...") # Use logger
    # For production, use Waitress: waitress-serve --host=0.0.0.0 --port=5000 api:app
    app.run(host='0.0.0.0', port=port, debug=False, threaded=True) # Keep for dev