/**
 * faceApi.js — Lazy loader for @vladmandic/face-api models
 * Models are served from /models/face/ (public directory).
 */
import * as faceapi from '@vladmandic/face-api';

const MODEL_URL = '/models/face';
let loaded = false;

export const loadFaceModels = async () => {
  if (loaded) return;
  await Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
    faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
    faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
  ]);
  loaded = true;
};

export { faceapi };
