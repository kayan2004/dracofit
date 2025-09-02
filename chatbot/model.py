import os
import logging
import time
import gc
from typing import Dict, Any, List
from huggingface_hub import login

# Import configuration settings
import config  # Import the new config file

# --- Logging Setup ---
# Use log level from config
logging.basicConfig(level=getattr(logging, config.LOG_LEVEL.upper(), logging.INFO))
logger = logging.getLogger(__name__)

# --- Dependency Check & Login ---
try:
    import torch
    from transformers import AutoTokenizer, AutoModelForCausalLM
    from transformers import BitsAndBytesConfig
    TRANSFORMERS_AVAILABLE = True
except ImportError:
    logger.error("Required packages not installed. Please run: pip install transformers torch bitsandbytes")
    TRANSFORMERS_AVAILABLE = False

if TRANSFORMERS_AVAILABLE:
    try:
        login(token=config.HF_TOKEN)  # Use token from config
        logger.info("Hugging Face login successful.")
    except Exception as e:
        logger.error(f"Hugging Face login failed: {e}")
        TRANSFORMERS_AVAILABLE = False

# --- Helper Functions ---
def _format_conversation_prompt(system_prompt: str, conversation: List[Dict[str, str]]) -> str:
    """Formats the conversation history into a single prompt string for Gemma."""
    prompt = f"<start_of_turn>system\n{system_prompt}<end_of_turn>\n\n"
    for message in conversation[:-1]: # All but the latest message
        role = "user" if message["role"] == "user" else "model"
        prompt += f"<start_of_turn>{role}\n{message['content']}<end_of_turn>\n\n"
    # Add the latest user message
    latest_message = conversation[-1]
    prompt += f"<start_of_turn>user\n{latest_message['content']}<end_of_turn>\n\n"
    # Signal the start of the model's turn
    prompt += "<start_of_turn>model\n"
    logger.debug(f"Formatted prompt (first 100 chars): {prompt[:100]}...")
    return prompt

# --- Model Singleton ---
class GemmaModelSingleton:
    _instance = None

    @classmethod
    def get_instance(cls, model_name=config.DEFAULT_MODEL_NAME):  # Use constant from config
        if not TRANSFORMERS_AVAILABLE:
            raise RuntimeError("Transformers library not available or login failed. Cannot create model instance.")
        if cls._instance is None:
            logger.info(f"Creating new GemmaModel instance for {model_name}")
            cls._instance = GemmaModel(model_name)
        else:
            logger.info("Reusing existing GemmaModel instance")
        return cls._instance

# --- Core Model Class ---
class GemmaModel:
    """
    Enhanced implementation of a quantized Gemma model for fitness chatbot API.
    Handles loading, generation, and memory management.
    """
    def __init__(self, model_name=config.DEFAULT_MODEL_NAME):  # Use constant from config
        """
        Initialize the model parameters. Does not load the model yet.
        """
        if not TRANSFORMERS_AVAILABLE:
            raise RuntimeError("Transformers library not available or login failed.")

        self.model_name = model_name
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.tokenizer = None
        self.model = None
        self.system_prompt = config.SYSTEM_PROMPT  # Use constant from config
        self.last_used_time = time.time()
        self.is_loaded = False

        if self.device == "cpu":
            logger.warning("CUDA not available. Model will run on CPU, which is not recommended for performance.")

    def load_model(self):
        """
        Load the tokenizer and model, optimized for cloud GPU (e.g., T4).
        """
        if self.is_loaded:
            logger.info("Model already loaded.")
            return True
        # Ensure we are targeting CUDA
        if self.device != "cuda":
             logger.error("Cannot load model: CUDA device is required for cloud GPU setup.")
             return False

        logger.info(f"Attempting to load model: {self.model_name} onto device: {self.device} with dtype: {config.MODEL_DTYPE}")
        try:
            torch.cuda.empty_cache()
            logger.info("CUDA cache cleared before loading.")

            logger.info(f"Loading tokenizer for {self.model_name}...")
            self.tokenizer = AutoTokenizer.from_pretrained(self.model_name, token=config.HF_TOKEN)
            logger.info("Tokenizer loaded.")

            # --- Load model without quantization/offloading ---
            logger.info(f"Loading model {self.model_name} with dtype {config.MODEL_DTYPE}...")
            self.model = AutoModelForCausalLM.from_pretrained(
                self.model_name,
                torch_dtype=config.MODEL_DTYPE, # Use FP16
                trust_remote_code=True,
                token=config.HF_TOKEN
            ).to(self.device) # Ensure model is moved to the correct device

            logger.info("Model loaded successfully to GPU.")
            self.is_loaded = True
            self.last_used_time = time.time()
            return True

        except Exception as e:
            logger.exception(f"Failed to load model: {str(e)}")
            self.model = None
            self.tokenizer = None
            self.is_loaded = False
            self.clear_gpu_memory() # Attempt cleanup
            return False

    def generate_response(self, conversation: List[Dict[str, str]], max_length=config.MAX_OUTPUT_LENGTH, abort_event=None):
        """
        Generate a response from the model using conversation history.
        """
        # --- Use helper function to format the prompt ---
        try:
            prompt = _format_conversation_prompt(self.system_prompt, conversation)
        except IndexError:
             logger.error("Conversation list appears to be empty.")
             return {"status": "error", "message": "Cannot generate response from empty conversation."}
        except Exception as e:
             logger.exception(f"Error formatting prompt: {e}")
             return {"status": "error", "message": "Failed to format conversation prompt."}
        # --- End of prompt formatting ---

        # Update last used time
        self.last_used_time = time.time()

        # Check if already aborted
        if abort_event and abort_event.is_set():
            logger.info("Request aborted before model load check.")
            return {"status": "aborted", "message": "Request aborted"}

        # Ensure model is loaded
        if not self.is_loaded:
            logger.info("Model not loaded, attempting to load...")
            success = self.load_model()
            if not success:
                logger.error("Failed to load model for generation.")
                return {"status": "error", "message": "Failed to load the model"}
            logger.info("Model loaded successfully for generation.")

        try:
            # Check if aborted before tokenization
            if abort_event and abort_event.is_set():
                logger.info("Request aborted before tokenization.")
                return {"status": "aborted", "message": "Request aborted during processing"}

            # Tokenize the input
            logger.debug("Tokenizing prompt...")
            input_ids = self.tokenizer(prompt, return_tensors="pt", padding=True).to(self.device)
            logger.debug("Tokenization complete.")

            # Check if aborted before generation
            if abort_event and abort_event.is_set():
                logger.info("Request aborted before model generation.")
                return {"status": "aborted", "message": "Request aborted during processing"}

            # Generate the output
            logger.info(f"Generating response with max_new_tokens={max_length}...")
            with torch.no_grad():
                output = self.model.generate(
                    input_ids.input_ids,
                    attention_mask=input_ids.attention_mask,
                    max_new_tokens=max_length,
                    temperature=config.TEMPERATURE,
                    top_p=config.TOP_P,
                    top_k=config.TOP_K,
                    do_sample=config.DO_SAMPLE,
                    repetition_penalty=config.REPETITION_PENALTY,
                    no_repeat_ngram_size=config.NO_REPEAT_NGRAM_SIZE,
                    pad_token_id=self.tokenizer.eos_token_id,
                    early_stopping=config.EARLY_STOPPING
                )
            logger.info("Generation complete.")

            # Check if aborted before decoding
            if abort_event and abort_event.is_set():
                 logger.info("Request aborted before decoding.")
                 # Clear memory even if aborted here
                 self.clear_gpu_memory()
                 return {"status": "aborted", "message": "Request aborted during processing"}

            # Decode the output
            generated_text = self.tokenizer.decode(output[0], skip_special_tokens=True)
            logger.debug(f"Raw generated text (first 200 chars): {generated_text[:200]}...")

            # Extract the response
            response_text = None
            model_turn_marker = "<start_of_turn>model"
            if model_turn_marker in generated_text:
                last_marker_index = generated_text.rfind(model_turn_marker)
                response_part = generated_text[last_marker_index + len(model_turn_marker):].strip()
                end_turn_marker = "<end_of_turn>"
                if end_turn_marker in response_part:
                    response_text = response_part.split(end_turn_marker)[0].strip()
                else:
                    response_text = response_part
                logger.debug(f"Parsed response using markers: {response_text[:100]}...")
            else:
                logger.warning("Could not find '<start_of_turn>model' marker in generated text. Using raw output after prompt.")
                prompt_end_marker = "<start_of_turn>model\n"
                if prompt_end_marker in prompt:
                     response_text = generated_text
                else:
                     response_text = generated_text

            if response_text is None:
                 logger.warning("Response parsing resulted in None. Defaulting to empty string.")
                 response_text = ""

            return {"status": "success", "response": response_text}
        except Exception as e:
            logger.exception(f"Error during generation: {str(e)}")
            return {"status": "error", "message": f"Error during generation: {str(e)}"}
        finally:
            self.clear_gpu_memory()

    def get_health_status(self) -> Dict[str, Any]:
        """
        Check if the model is healthy and ready to generate responses.

        Returns:
            Dict with status information
        """
        status = {
            "is_loaded": self.is_loaded,
            "device": self.device,
            "model_name": self.model_name,
            "gpu_available": torch.cuda.is_available()
        }

        # Add GPU info if available
        if torch.cuda.is_available():
            allocated = torch.cuda.memory_allocated(0) / 1024**2
            reserved = torch.cuda.memory_reserved(0) / 1024**2
            status["gpu_memory"] = {
                "allocated_mb": round(allocated, 2),
                "reserved_mb": round(reserved, 2)
            }

        return status

    def unload_if_inactive(self, max_idle_time=config.MAX_IDLE_TIME_SECONDS):  # Use constant from config
        """
        Unload the model if it's been inactive for the specified time.

        Args:
            max_idle_time: Maximum idle time in seconds before unloading

        Returns:
            True if model was unloaded, False otherwise
        """
        if not self.is_loaded:
            return False

        current_time = time.time()
        if (current_time - self.last_used_time) > max_idle_time:
            logger.info(f"Model inactive for {max_idle_time} seconds, unloading...")
            self.model = None
            self.tokenizer = None
            self.is_loaded = False

            # Force garbage collection
            if torch.cuda.is_available():
                torch.cuda.empty_cache()

            return True
        return False

    def clear_gpu_memory(self):
        """Clear unused GPU memory"""
        if torch.cuda.is_available():
            # Force garbage collection
            gc.collect()

            # Clear PyTorch's CUDA cache
            torch.cuda.empty_cache()

            # Force CUDA synchronization
            torch.cuda.synchronize()

            logger.info("GPU memory cleared")

# --- API Interface Functions ---
def get_chatbot_response(conversation: List[Dict[str, str]], abort_event=None) -> Dict[str, Any]:
    """
    API-friendly function to get a response from the chatbot singleton.
    Handles potential model loading and generation errors.
    """
    try:
        # The singleton will use the default model name from config when first created
        model_instance = GemmaModelSingleton.get_instance()
        return model_instance.generate_response(conversation, abort_event=abort_event)
    except RuntimeError as e:
        logger.error(f"Runtime error in get_chatbot_response: {str(e)}")
        return {"status": "error", "message": str(e)}
    except Exception as e:
        logger.exception(f"Unexpected error in get_chatbot_response: {str(e)}")
        return {"status": "error", "message": f"An unexpected error occurred: {str(e)}"}

def get_health_check() -> Dict[str, Any]:
    """
    API-friendly function to check the health status of the model singleton.
    """
    try:
        model_instance = GemmaModelSingleton._instance
        if model_instance:
            status_data = model_instance.get_health_status()
        else:
            # Provide basic status if instance hasn't been created yet, using config
            status_data = {
                "model_name": config.DEFAULT_MODEL_NAME,
                "is_loaded": False,
                "device": "cuda" if torch.cuda.is_available() else "cpu",
                "transformers_available": TRANSFORMERS_AVAILABLE,
                "gpu_available": torch.cuda.is_available() if TRANSFORMERS_AVAILABLE else False,
                "status": "Instance not created yet."
            }
        return {"status": "success", "data": status_data}
    except Exception as e:
        logger.exception(f"Error during health check: {str(e)}")
        return {"status": "error", "message": f"Health check failed: {str(e)}"}

if __name__ == "__main__":
    # This block runs only when the script is executed directly (python model.py)
    print("--- Interactive Chatbot Test ---")
    print("Type 'quit' or 'exit' to end the chat.")
    print("Loading model... (this might take a moment)")

    # Initialize conversation history
    conversation_history = []

    try:
        # Pre-load the model by getting the instance (optional, but avoids delay on first message)
        GemmaModelSingleton.get_instance().load_model()
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
            result = get_chatbot_response(conversation_history)

            if result['status'] == 'success':
                bot_response = result['response']
                print(f"Bot: {bot_response}")
                # Add bot response to history
                conversation_history.append({"role": "model", "content": bot_response})
            else:
                print(f"Error: {result['message']}")
                # Optionally remove the last user message if the bot failed
                # conversation_history.pop()

            # Optional: Limit history length to prevent excessive memory usage/context window issues
            # For example, keep only the last 10 messages (5 user, 5 bot) + system prompt implicitly handled
            if len(conversation_history) > 10:
                 # Keep the last 10 items
                 conversation_history = conversation_history[-10:]
                 logger.debug("Trimmed conversation history to last 10 messages.")


    except RuntimeError as e:
        print(f"\nRuntime Error: {e}")
        print("Ensure PyTorch, Transformers, and bitsandbytes are installed and CUDA is available if required.")
    except KeyboardInterrupt:
        print("\nExiting chat due to interrupt.")
    except Exception as e:
        print(f"\nAn unexpected error occurred: {e}")
        logger.exception("Error during interactive chat session:") # Log the full traceback

    finally:
        # Optional: Clean up resources when exiting
        instance = GemmaModelSingleton._instance
        if instance and instance.is_loaded:
            print("\nUnloading model...")
            instance.clear_gpu_memory() # Clear memory before potential unload
            # instance.unload_if_inactive(max_idle_time=0) # Or force unload
            print("Model resources released.")