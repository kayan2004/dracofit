import json
import logging

# Import necessary components from model.py and config.py
try:
    import config
    from model import (
        get_chatbot_response,
        get_health_check,
        GemmaModelSingleton,
        logger, # Use the logger configured in model.py
        TRANSFORMERS_AVAILABLE, # Check if dependencies are met
        torch # Needed for device check in health status fallback
    )
except ImportError as e:
    print(f"Error importing required modules: {e}")
    print("Ensure model.py and config.py are in the same directory and all dependencies are installed.")
    exit(1)

# --- Interactive Chatbot Test ---

def run_chat():
    """Runs the interactive command-line chat session."""
    print("--- Interactive Chatbot Test ---")
    print("Type 'quit' or 'exit' to end the chat.")

    if not TRANSFORMERS_AVAILABLE:
        print("\nError: Required libraries (transformers, torch, bitsandbytes) not found or login failed.")
        print("Please install them: pip install transformers torch bitsandbytes huggingface_hub")
        return

    print("Loading model... (this might take a moment)")

    # Initialize conversation history
    conversation_history = []

    try:
        # Pre-load the model by getting the instance
        model_instance = GemmaModelSingleton.get_instance()
        if not model_instance.load_model():
             print("\nError: Failed to load the model. Check logs for details.")
             return # Exit if model fails to load

        print("Model ready.")

        while True:
            user_input = input("You: ")
            if user_input.lower() in ["quit", "exit"]:
                print("Exiting chat.")
                break

            # Add user message to history
            conversation_history.append({"role": "user", "content": user_input})

            # Get response from the model
            print("Bot: Thinking...")
            result = get_chatbot_response(conversation_history) # Pass the history

            if result['status'] == 'success':
                bot_response = result['response']
                print(f"Bot: {bot_response}")
                # Add bot response to history
                conversation_history.append({"role": "model", "content": bot_response})
            else:
                print(f"Error: {result['message']}")
                # Optionally remove the last user message if the bot failed
                conversation_history.pop()

            # Optional: Limit history length
            if len(conversation_history) > 8:
                 conversation_history = conversation_history[-8:]
                 logger.debug("Trimmed conversation history to last 8 messages.")


    except RuntimeError as e:
        print(f"\nRuntime Error: {e}")
        print("Ensure PyTorch, Transformers, and bitsandbytes are installed and CUDA is available if required.")
    except KeyboardInterrupt:
        print("\nExiting chat due to interrupt.")
    except Exception as e:
        print(f"\nAn unexpected error occurred: {e}")
        logger.exception("Error during interactive chat session:")

    finally:
        # Optional: Clean up resources when exiting
        instance = GemmaModelSingleton._instance
        if instance and instance.is_loaded:
            print("\nUnloading model...")
            instance.clear_gpu_memory()
            print("Model resources released.")

if __name__ == "__main__":
    # Set up basic logging if the logger wasn't fully configured by model.py import
    if not logger.hasHandlers():
        log_level = getattr(logging, config.LOG_LEVEL.upper(), logging.INFO)
        logging.basicConfig(level=log_level)

    run_chat()