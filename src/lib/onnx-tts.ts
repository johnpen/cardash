
'use client';
import * as ort from 'onnxruntime-web';

// --- Configuration ---
const VITS_MODEL_URL = 'https://huggingface.co/datasets/SY/vits-f1/resolve/main/f1.onnx';
const VITS_CONFIG_URL = 'https://huggingface.co/datasets/SY/vits-f1/resolve/main/f1.onnx.json';
const HIFIGAN_MODEL_URL = 'https://huggingface.co/datasets/SY/hifigan/resolve/main/hifigan.onnx';
const HIFIGAN_CONFIG_URL = 'https://huggingface.co/datasets/SY/hifigan/resolve/main/hifigan.onnx.json';

const DB_NAME = 'onnx-tts-models';
const DB_VERSION = 1;
const STORE_NAME = 'models';

// --- Type Definitions ---
interface VitsModelConfig {
  espeak: {
    voice: string;
  };
  phoneme_id_map: Record<string, number[]>;
}

// --- State Variables ---
let vitsSession: ort.InferenceSession | null = null;
let hifiGanSession: ort.InferenceSession | null = null;
let vitsConfig: VitsModelConfig | null = null;
let isInitializing = false;

// --- IndexedDB Management ---
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });
}

async function getFromDB<T>(key: string): Promise<T | undefined> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(key);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

async function setToDB(key: string, value: any): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(value, key);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

// --- Model Loading ---
async function fetchAndCache(url: string, key: string, asJson = false) {
  console.log(`Fetching ${key} from ${url}`);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${key}: ${response.statusText}`);
  }
  const data = asJson ? await response.json() : await response.arrayBuffer();
  await setToDB(key, data);
  return data;
}

async function getModelData(url: string, key: string, asJson = false) {
  let data = await getFromDB<any>(key);
  if (!data) {
    data = await fetchAndCache(url, key, asJson);
  } else {
    console.log(`Loaded ${key} from cache.`);
  }
  return data;
}

// --- TTS Initialization ---
async function initializeTTS(): Promise<void> {
  if (vitsSession && hifiGanSession && vitsConfig) {
    return;
  }
  if (isInitializing) {
     await new Promise(resolve => setTimeout(resolve, 100));
     return initializeTTS();
  }
  isInitializing = true;

  try {
    console.log('Initializing ONNX TTS engine...');
    const [vitsModelBuffer, localVitsConfig, hifiGanModelBuffer] = await Promise.all([
      getModelData(VITS_MODEL_URL, 'vits-model', false) as Promise<ArrayBuffer>,
      getModelData(VITS_CONFIG_URL, 'vits-config', true) as Promise<VitsModelConfig>,
      getModelData(HIFIGAN_MODEL_URL, 'hifigan-model', false) as Promise<ArrayBuffer>,
      getModelData(HIFIGAN_CONFIG_URL, 'hifigan-config', true), // Also cache hifigan config
    ]);

    vitsConfig = localVitsConfig;
    
    [vitsSession, hifiGanSession] = await Promise.all([
        ort.InferenceSession.create(vitsModelBuffer, { executionProviders: ['wasm'] }),
        ort.InferenceSession.create(hifiGanModelBuffer, { executionProviders: ['wasm'] })
    ]);

    console.log('ONNX TTS engine initialized successfully.');
  } catch (error) {
    console.error('Failed to initialize ONNX TTS models:', error);
    throw new Error('Failed to initialize local TTS models.');
  } finally {
    isInitializing = false;
  }
}

// --- Core Synthesis Logic ---
function textToPhonemeIds(text: string, config: VitsModelConfig): number[] {
  const phonemeIds: number[] = [];
  const { phoneme_id_map } = config;
  text = text.toLowerCase().trim();

  for (const char of text) {
    if (phoneme_id_map[char]) {
      phonemeIds.push(...phoneme_id_map[char]);
    } else if (phoneme_id_map['_']) {
      phonemeIds.push(...phoneme_id_map['_']);
    }
  }

  const processedPhonemeIds: number[] = [];
  if (phoneme_id_map['^']) processedPhonemeIds.push(phoneme_id_map['^'][0]);
  for (const id of phonemeIds) {
    processedPhonemeIds.push(id);
    if (phoneme_id_map['_']) processedPhonemeIds.push(phoneme_id_map['_'][0]);
  }
  if (phoneme_id_map['$']) processedPhonemeIds.push(phoneme_id_map['$'][0]);

  return processedPhonemeIds;
}

function createWav(audioData: Float32Array): string {
    const sampleRate = 22050; // common for these models
    const channels = 1;
    const bitDepth = 16;
    const buffer = new ArrayBuffer(44 + audioData.length * 2);
    const view = new DataView(buffer);

    const writeString = (view: DataView, offset: number, str: string) => {
        for (let i = 0; i < str.length; i++) {
            view.setUint8(offset + i, str.charCodeAt(i));
        }
    };

    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + audioData.length * 2, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, channels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * channels * (bitDepth / 8), true);
    view.setUint16(32, channels * (bitDepth / 8), true);
    view.setUint16(34, bitDepth, true);
    writeString(view, 36, 'data');
    view.setUint32(40, audioData.length * 2, true);

    let offset = 44;
    for (let i = 0; i < audioData.length; i++, offset += 2) {
        const s = Math.max(-1, Math.min(1, audioData[i]));
        view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    }
    
    const blob = new Blob([view], { type: 'audio/wav' });
    return URL.createObjectURL(blob);
}


// --- Public API ---
export async function synthesizeText(text: string): Promise<string> {
  await initializeTTS();
  
  if (!vitsSession || !hifiGanSession || !vitsConfig) {
    throw new Error('TTS is not properly initialized.');
  }

  const phonemeIds = textToPhonemeIds(text, vitsConfig);
  const inputTensor = new ort.Tensor('int64', BigInt64Array.from(phonemeIds.map(BigInt)), [1, phonemeIds.length]);
  const inputLengthTensor = new ort.Tensor('int64', BigInt64Array.from([BigInt(phonemeIds.length)]), [1]);
  const scalesTensor = new ort.Tensor('float32', Float32Array.from([0.667, 1.0, 0.8]), [3]);
  const sidTensor = new ort.Tensor('int64', BigInt64Array.from([BigInt(0)]), [1]);

  const vitsFeeds = {
    'input': inputTensor,
    'input_lengths': inputLengthTensor,
    'scales': scalesTensor,
    'sid': sidTensor
  };
  
  const vitsResults = await vitsSession.run(vitsFeeds);
  const spectrogram = vitsResults.output;

  const hifiGanFeeds = { 'spectrogram': spectrogram };
  const hifiGanResults = await hifiGanSession.run(hifiGanFeeds);
  const audio = hifiGanResults.audio.data as Float32Array;

  return createWav(audio);
}
