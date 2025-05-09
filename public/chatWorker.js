// Store data associated with each request
const requestDataStore = {};

// Function to perform the save operation
async function saveInteraction(saveUrl, userText, botResponse, botMessageId) {
  try {
    const saveResponse = await fetch(saveUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Add any necessary auth headers if using token-based auth
        // e.g., 'Authorization': `Bearer ${authToken}` (authToken would need to be passed to worker)
        // If using cookies, 'credentials: include' might be needed, but can be complex with workers.
      },
      body: JSON.stringify({
        question: userText,
        answer: botResponse,
      }),
      credentials: "include", // Include if relying on session cookies for auth on the save endpoint
    });

    if (!saveResponse.ok) {
      const errorText = await saveResponse
        .text()
        .catch(() => `Save HTTP error ${saveResponse.status}`);
      throw new Error(`Save failed: ${saveResponse.status} ${errorText}`);
    }
    console.log(
      `Worker: Interaction saved successfully for bot ID ${botMessageId}`
    );
  } catch (error) {
    console.error(
      `Worker: Error saving interaction for bot ID ${botMessageId}:`,
      error
    );
    // Inform main thread about the save failure
    self.postMessage({
      type: "SAVE_FAILED",
      payload: { botMessageId, error: error.message },
    });
  }
}

self.onmessage = async (event) => {
  const { type, payload } = event.data;

  if (type === "SEND_MESSAGE") {
    const { text, apiUrl, botMessageId, isAuthenticated, userText, saveUrl } =
      payload;

    // Store data needed later for saving
    requestDataStore[botMessageId] = { isAuthenticated, userText, saveUrl };

    try {
      self.postMessage({ type: "STREAM_STARTING", payload: { botMessageId } });

      const response = await fetch(apiUrl, {
        /* ... fetch options ... */
      });

      // ... check response.ok ...

      const reader = response.body
        .pipeThrough(new TextDecoderStream())
        .getReader();
      let buffer = "";
      let receivedText = "";

      while (true) {
        const { value, done } = await reader.read();

        if (done) {
          const finalResponse = receivedText;
          // Send final result to main thread
          self.postMessage({
            type: "STREAM_DONE",
            payload: { botMessageId, full_response: finalResponse },
          });

          // --- Attempt to save from worker ---
          const requestData = requestDataStore[botMessageId];
          if (requestData?.isAuthenticated && requestData.saveUrl) {
            await saveInteraction(
              requestData.saveUrl,
              requestData.userText,
              finalResponse,
              botMessageId
            );
          }
          // Clean up stored data for this request
          delete requestDataStore[botMessageId];
          break; // Exit loop
        }

        buffer += value;
        let boundary = buffer.indexOf("\n\n");
        while (boundary !== -1) {
          const messageLine = buffer.substring(0, boundary);
          buffer = buffer.substring(boundary + 2);

          if (messageLine.startsWith("data: ")) {
            const jsonData = messageLine.substring(6);
            try {
              const parsedData = JSON.parse(jsonData);

              if (parsedData.status === "streaming" && parsedData.chunk) {
                receivedText += parsedData.chunk;
                self.postMessage({
                  /* ... STREAM_DATA ... */
                });
              } else if (parsedData.status === "success") {
                const finalResponse = parsedData.full_response || receivedText;
                // Send success signal to main thread
                self.postMessage({
                  type: "STREAM_SUCCESS",
                  payload: { botMessageId, full_response: finalResponse },
                });

                // --- Attempt to save from worker ---
                const requestData = requestDataStore[botMessageId];
                if (requestData?.isAuthenticated && requestData.saveUrl) {
                  await saveInteraction(
                    requestData.saveUrl,
                    requestData.userText,
                    finalResponse,
                    botMessageId
                  );
                }
                // Clean up stored data for this request
                delete requestDataStore[botMessageId];
                // Note: Don't break here necessarily, stream might technically continue
              }
              // ... handle error/aborted status ...
            } catch (e) {
              /* ... handle parse error ... */
            }
          }
          boundary = buffer.indexOf("\n\n");
        }
      }
    } catch (error) {
      // ... handle fetch/stream error ...
      // Clean up stored data on error too
      delete requestDataStore[botMessageId];
    }
  }
};

// Optional: Signal that the worker is ready
self.postMessage({ type: "WORKER_READY" });
