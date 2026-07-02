import { loadTextToSpeech, loadVoiceStyle, writeWavFile } from "./helper.js";

// Configuration
const DEFAULT_VOICE_STYLE_PATH = "/voice_styles/F1.json";

// Helper function to extract filename from path
function getFilenameFromPath(path) {
  return path.split("/").pop();
}

// Global state
let textToSpeech = null;
let cfgs = null;

// Pre-computed style
let currentStyle = null;
let currentStylePath = DEFAULT_VOICE_STYLE_PATH;

// UI Elements

const resultsContainer = document.getElementById("results");
const errorBox = document.getElementById("error");

function showStatus(message, type = "info") {
  console.log(type + ': ' + message) ;

}

function showError(message) {
console.log('ERROR::: ' + message)
}

function hideError() {
}

function showBackendBadge() {
}

// Load voice style from JSON
async function loadStyleFromJSON(stylePath) {
  try {
    const style = await loadVoiceStyle([stylePath], true);
    return style;
  } catch (error) {
    console.error("Error loading voice style:", error);
    throw error;
  }
}

// Load models on page load
export  async function initializeModels() {
  try {
    showStatus("Loading configuration...")

    const basePath = "/onnx";

    // Try WebGPU first, fallback to WASM
    let executionProvider = "wasm";
    try {
      const result = await loadTextToSpeech(
        basePath,
        {
          executionProviders: ["webgpu"],
          graphOptimizationLevel: "all",
        },
        (modelName, current, total) => {
          showStatus(
            `Loading ONNX models (${current}/${total}): ${modelName}...`,
          );
        },
      );

      textToSpeech = result.textToSpeech;
      cfgs = result.cfgs;

      executionProvider = "webgpu";
      backendBadge.textContent = "WebGPU";
      backendBadge.style.background = "#4caf50";
    } catch (webgpuError) {
      console.log("WebGPU not available, falling back to WebAssembly");

      const result = await loadTextToSpeech(
        basePath,
        {
          executionProviders: ["wasm"],
          graphOptimizationLevel: "all",
        },
        (modelName, current, total) => {
          showStatus(
            `Loading ONNX models (${current}/${total}): ${modelName}...`,
          );
        },
      );

      textToSpeech = result.textToSpeech;
      cfgs = result.cfgs;
    }

    showStatus("Loading default voice style... path:" + currentStylePath);

    // Load default voice style
    currentStyle = await loadStyleFromJSON(currentStylePath);
    showStatus("voiceStyleInfo... :" + getFilenameFromPath(currentStylePath));
   
    showStatus(
      `Models loaded! Using ${executionProvider.toUpperCase()}. You can now generate speech.`,
      "success",
    );
    showBackendBadge();

  } catch (error) {
    console.error("Error loading models:", error);

  }
}


// Main synthesis function
export async function generateSpeech(txt) {
  const text = txt;
  if (!text) {
    showError("Please enter some text to synthesize.");
    return;
  }

  if (!textToSpeech || !cfgs) {
    showError("Models are still loading. Please wait.");
    return;
  }

  if (!currentStyle) {
    showError("Voice style is not ready. Please wait.");
    return;
  }

  const startTime = Date.now();

  try {
  //  generateBtn.disabled = true;
    hideError();

    // Clear results and show placeholder
    document.getElementById("results").innerHTML = `
            <div class="results-placeholder generating">
                <div class="results-placeholder-icon">⏳</div>
                <p>Generating speech...</p>
            </div>
        `;

    let totalStep = parseInt(5);
    let speed = parseFloat(1.05);

    showStatus("Generating speech from text...");
    const tic = Date.now();

    const { wav, duration } = await textToSpeech.call(
      text,
      currentStyle,
      totalStep,
      speed,
      0.3,
      (step, total) => {
        showStatus(`Denoising (${step}/${total})...`);
      },
    );

    const toc = Date.now();
    console.log(
      `Text-to-speech synthesis: ${((toc - tic) / 1000).toFixed(2)}s`,
    );

    showStatus("Creating audio file...");
    const wavLen = Math.floor(textToSpeech.sampleRate * duration[0]);
    const wavOut = wav.slice(0, wavLen);

    // Create WAV file
    const wavBuffer = writeWavFile(wavOut, textToSpeech.sampleRate);
    const blob = new Blob([wavBuffer], { type: "audio/wav" });
    const url = URL.createObjectURL(blob);

    // Calculate total time and audio duration
    let endTime = Date.now();
    let totalTimeSec = ((endTime - startTime) / 1000).toFixed(2);
    let audioDurationSec = duration[0].toFixed(2);

    // Display result with full text
    document.getElementById("results").innerHTML = `
            <div class="result-item">
                <div class="result-text-container">
                    <div class="result-text-label">Input Text</div>
                    <div class="result-text">${text}</div>
                </div>
                <div class="result-info">
                    <div class="info-item">
                        <span>📊 Audio Length</span>
                        <strong>${audioDurationSec}s</strong>
                    </div>
                    <div class="info-item">
                        <span>⏱️ Generation Time</span>
                        <strong>${totalTimeSec}s</strong>
                    </div>
                </div>
                <div class="result-player">
                    <audio controls autoplay>
                        <source src="${url}" type="audio/wav">
                    </audio>
                </div>
                <div class="result-actions">
                    <button onclick="downloadAudio('${url}', 'synthesized_speech.wav')">
                        <span>⬇️</span>
                        <span>Download WAV</span>
                    </button>
                </div>
            </div>
        `;

    showStatus(
      "Speech synthesis completed successfully!",
      "success",
    );
  } catch (error) {
    console.error("Error during synthesis:", error);
    showStatus(
      `Error during synthesis: ${error.message}`,
      "error",
    );
    showError(`Error during synthesis: ${error.message}`);

    // Restore placeholder
    document.getElementById("results").innerHTML = `
            <div class="results-placeholder">
                <div class="results-placeholder-icon">🎤</div>
                <p>Generated speech will appear here</p>
            </div>
        `;
  } finally {
  //  generateBtn.disabled = false;
  }
}

// Download handler (make it global so it can be called from onclick)
window.downloadAudio = function (url, filename) {
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
};

// Attach generate function to button
//generateBtn.addEventListener("click", generateSpeech);

// Initialize on load
window.addEventListener("load", async () => {
  //generateBtn.disabled = true;
  await initializeModels();
});
