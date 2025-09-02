import os

# --- Hugging Face ---
# Use environment variable for the token for better security, with a fallback
HF_TOKEN = os.environ.get("HF_TOKEN", "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")

# --- Model Configuration ---
DEFAULT_MODEL_NAME = "google/gemma-2-2b-it"
SYSTEM_PROMPT = (
    "You are DracoBot, a fitness assistant for the DracoFit application. "
    "You help users with workout recommendations, nutrition advice, and fitness goals. "
    "You should provide accurate information and support users in their fitness journey. "
    "Answer all questions directly, including questions about your identity as an AI assistant. "
    "Keep responses concise, informative, and focused on fitness."
)
OFFLOAD_FOLDER = "offload" # Folder for offloaded layers

# --- Generation Parameters ---
MAX_OUTPUT_LENGTH = 1024 # Max *new* tokens to generate
TEMPERATURE = 0.3       # Controls randomness (lower = more deterministic)
TOP_P = 0.85            # Nucleus sampling probability threshold
TOP_K = 40              # Consider only top_k tokens for sampling
DO_SAMPLE = True        # Whether to use sampling; False means greedy decoding
REPETITION_PENALTY = 1.2 # Penalize repeated tokens
NO_REPEAT_NGRAM_SIZE = 3 # Prevent repeating n-grams of this size
EARLY_STOPPING = True   # Stop generation when EOS token is reached

# --- Resource Management ---
MAX_IDLE_TIME_SECONDS = 3600 # 1 hour (time before unloading inactive model)
CUDA_ALLOC_CONF = 'max_split_size_mb:128' # Memory allocation setting

# --- Logging ---
LOG_LEVEL = "INFO" # e.g., DEBUG, INFO, WARNING, ERROR

# --- Quantization ---
# BitsAndBytesConfig settings
BNB_LOAD_IN_8BIT = True
BNB_LLM_INT8_ENABLE_FP32_CPU_OFFLOAD = True
BNB_LLM_INT8_SKIP_MODULES = ["lm_head"]
BNB_LLM_INT8_THRESHOLD = 6.0

# --- Flask App ---
SECRET_KEY = os.environ.get("FLASK_SECRET_KEY", "a-default-development-secret-key") # Add a default for dev