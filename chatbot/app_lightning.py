import lightning as L
import os
import subprocess

class ChatbotServer(L.LightningWork):
    def __init__(self, cloud_compute: L.CloudCompute):
        super().__init__(cloud_compute=cloud_compute, parallel=True)
        # Define any state needed across restarts if applicable
        self.host = "0.0.0.0"
        self.port = 7860 # Default port Lightning AI might expose

    def run(self):
        # Set environment variables (replace with actual secrets management in Lightning AI)
        os.environ["HF_TOKEN"] = "YOUR_HF_TOKEN_FROM_LIGHTNING_SECRETS"
        os.environ["FLASK_SECRET_KEY"] = "YOUR_FLASK_SECRET_FROM_LIGHTNING_SECRETS"
        os.environ["PORT"] = str(self.port) # Make port available to gunicorn

        # Command to run the Flask app using gunicorn
        # Adjust workers based on CPU/needs
        cmd = f"gunicorn api:app --bind {self.host}:{self.port} --workers 1 --timeout 120"
        try:
            print(f"Launching server: {cmd}")
            subprocess.run(cmd, shell=True, check=True)
        except subprocess.CalledProcessError as e:
            print(f"Server launch failed: {e}")
            raise e

# Define the cloud compute resource
compute = L.CloudCompute(gpu="T4", requirements_file="requirements.txt") # Specify GPU and requirements

# Create the Lightning App
app = L.LightningApp(ChatbotServer(cloud_compute=compute))