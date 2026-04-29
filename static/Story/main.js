import { Camera } from "./camera.js";
import { Canvas } from "./canvas.js";

const canvasEl = document.getElementById("canvas");
const ctx = canvasEl.getContext("2d");

const canvas = new Canvas(canvasEl, ctx);
const camera = new Camera(canvasEl, ctx, canvas);

// ── camera zoom animation ────────────────────────────────────────────────────

let zoomTarget = null; // { zoom, cx, cy }

function zoomToNode(name) {
    const node = canvas.nodes[name];
    if (!node) return;
    const z = 3.5;
    zoomTarget = {
        zoom: z,
        cx: window.innerWidth  / 2 - node.x * z,
        cy: window.innerHeight / 2 - node.y * z,
    };
}

// ── animation loop ───────────────────────────────────────────────────────────

function animate() {
    if (zoomTarget) {
        const spd = 0.09;
        camera.zoom   += (zoomTarget.zoom - camera.zoom)   * spd;
        camera.cameraX += (zoomTarget.cx   - camera.cameraX) * spd;
        camera.cameraY += (zoomTarget.cy   - camera.cameraY) * spd;

        // Snap when close enough
        if (
            Math.abs(camera.zoom   - zoomTarget.zoom) < 0.005 &&
            Math.abs(camera.cameraX - zoomTarget.cx)  < 0.5   &&
            Math.abs(camera.cameraY - zoomTarget.cy)  < 0.5
        ) {
            camera.zoom    = zoomTarget.zoom;
            camera.cameraX = zoomTarget.cx;
            camera.cameraY = zoomTarget.cy;
            zoomTarget = null;
        }
    }
    camera.draw();
    requestAnimationFrame(animate);
}
animate();

// ── audio state ──────────────────────────────────────────────────────────────

let audioCtx  = null;
let audioEl   = null;
let sourceNode = null;

function getAudioCtx() {
    if (!audioCtx) audioCtx = new AudioContext();
    if (audioCtx.state === "suspended") audioCtx.resume();
    return audioCtx;
}

function playTrack(song) {
    const ac = getAudioCtx();

    if (audioEl) { audioEl.pause(); audioEl.src = ""; }
    if (sourceNode) { try { sourceNode.disconnect(); } catch (_) {} }

    audioEl = new Audio(`/sounds/${song.audio}`);
    audioEl.crossOrigin = "anonymous";

    const analyser = ac.createAnalyser();
    analyser.fftSize = 256;
    sourceNode = ac.createMediaElementSource(audioEl);
    sourceNode.connect(analyser);
    analyser.connect(ac.destination);

    canvas.set_audio(analyser);
    audioEl.play().catch(() => {});
    audioEl.addEventListener("timeupdate", updateProgress);
    audioEl.addEventListener("ended", onTrackEnd);
    return audioEl;
}

function stopTrack() {
    if (audioEl) { audioEl.pause(); audioEl.src = ""; }
    canvas.clear_audio();
    updatePlayBtn(false);
}

function onTrackEnd() {
    updatePlayBtn(false);
    canvas.clear_audio();
}

function updateProgress() {
    if (!audioEl || !audioEl.duration) return;
    const pct = (audioEl.currentTime / audioEl.duration) * 100;
    document.getElementById("progress-fill").style.width = pct + "%";
    document.getElementById("time-display").textContent =
        `${fmt(audioEl.currentTime)} / ${fmt(audioEl.duration)}`;
}

function fmt(s) {
    const m = Math.floor(s / 60);
    return `${m}:${Math.floor(s % 60).toString().padStart(2, "0")}`;
}

function updatePlayBtn(playing) {
    document.getElementById("play-btn").textContent = playing ? "⏹ Stop" : "▶ Play";
}

// ── click → world coords → hit test ──────────────────────────────────────────

canvasEl.addEventListener("click", (e) => {
    const rect = canvasEl.getBoundingClientRect();
    const cssX = e.clientX - rect.left;
    const cssY = e.clientY - rect.top;
    const wx = (cssX - camera.cameraX) / camera.zoom;
    const wy = (cssY - camera.cameraY) / camera.zoom;

    const hit = canvas.hit_test(wx, wy);
    if (hit) showPopup(hit);
});

// ── popup ────────────────────────────────────────────────────────────────────

const popup = document.getElementById("popup");
let activeNode = null;
let isPlaying  = false;

function showPopup(name) {
    const node = canvas.nodes[name];
    if (!node) return;

    if (activeNode === name) { closePopup(); return; }

    stopTrack();
    isPlaying  = false;
    activeNode = name;

    const song = node.song;
    document.getElementById("popup-img").src        = song.image;
    document.getElementById("popup-title").textContent  = name;
    document.getElementById("popup-artist").textContent = song.artist;
    document.getElementById("popup-year").textContent   = song.year;
    document.getElementById("popup-city").textContent   = song.city;
    document.getElementById("popup-desc").textContent   = song.description;
    document.getElementById("progress-fill").style.width = "0%";
    document.getElementById("time-display").textContent  = "0:00 / 0:00";
    updatePlayBtn(false);

    popup.classList.remove("hidden");
    canvas.set_playing(name);
    zoomToNode(name);
}

function closePopup() {
    popup.classList.add("hidden");
    stopTrack();
    isPlaying  = false;
    activeNode = null;
}

document.getElementById("close-btn").addEventListener("click", closePopup);

document.getElementById("play-btn").addEventListener("click", () => {
    if (!activeNode) return;
    const node = canvas.nodes[activeNode];
    if (!node) return;

    if (isPlaying) {
        stopTrack();
        isPlaying = false;
    } else {
        audioEl = playTrack(node.song);
        isPlaying = true;
        updatePlayBtn(true);
        audioEl.addEventListener("ended", () => { isPlaying = false; });
    }
});

document.getElementById("progress-bar").addEventListener("click", (e) => {
    if (!audioEl || !audioEl.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    audioEl.currentTime = ((e.clientX - rect.left) / rect.width) * audioEl.duration;
});
