import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import * as topojson from "https://cdn.jsdelivr.net/npm/topojson-client@3/+esm";
import { data, cityCoords, nodeOffsets } from "./data.js";

const NODE_RADIUS = 50;
const TIME_MIN = 1;
const TIME_MAX = 39;
const WAVE_SEGMENTS = 55;

export class Canvas {
    constructor(canvas, context) {
        this.canvas = canvas;
        this.context = context;
        this.worldData = null;
        this.projection = null;
        this.nodes = {};
        this.images = {};
        this.connections = this._build_connections();

        // audio state
        this.analyser = null;
        this.timeData = null;
        this.freqData = null;
        this.playingNodeName = null;

        // waveform animation
        this.wavePhase = 0;

        // ripple rings
        this.ripples = [];
        this.lastRippleTime = 0;

        this.init_map();
    }

    _build_connections() {
        const seen = new Set();
        const out = [];
        for (const [name, song] of Object.entries(data)) {
            for (const child of song.children) {
                const key = `${name}->${child}`;
                if (!seen.has(key)) { seen.add(key); out.push({ from: name, to: child }); }
            }
        }
        return out;
    }

    // ── time → white-bg opacity (oldest = most transparent) ──────────────────
    _bgOpacity(time) {
        return 0.18 + ((time - TIME_MIN) / (TIME_MAX - TIME_MIN)) * 0.82;
    }

    // ── audio helpers ────────────────────────────────────────────────────────

    set_audio(analyser) {
        this.analyser = analyser;
        this.timeData = new Uint8Array(analyser.frequencyBinCount);
        this.freqData = new Uint8Array(analyser.frequencyBinCount);
    }

    clear_audio() {
        this.analyser = null;
        this.timeData = null;
        this.freqData = null;
        this.playingNodeName = null;
        this.ripples = [];
    }

    set_playing(name) {
        this.playingNodeName = name;
        this.ripples = [];
    }

    _readAudio() {
        if (!this.analyser) return { amp: 0, bass: 0 };
        this.analyser.getByteTimeDomainData(this.timeData);
        this.analyser.getByteFrequencyData(this.freqData);
        let sum = 0;
        for (let v of this.timeData) sum += Math.abs(v - 128);
        const amp = Math.min(1, sum / this.timeData.length / 35);
        const bass = (this.freqData[0] + this.freqData[1] + this.freqData[2]) / (3 * 255);
        return { amp, bass };
    }

    // ── projection / node layout ─────────────────────────────────────────────

    _setup_projection() {
        // scale 3000 → ~52 px per degree, so New Orleans–Baton Rouge ≈ 58 px apart
        // rotate([85,-35]) centres the view on the eastern US at lat≈35, lon≈-85
        this.projection = d3.geoNaturalEarth1()
            .rotate([85, -35])
            .scale(3000)
            .translate([window.innerWidth / 2, window.innerHeight / 2]);
    }

    _build_nodes() {
        if (!this.projection) return;
        for (const [name, song] of Object.entries(data)) {
            const coords = cityCoords[song.city];
            if (!coords) continue;
            const [px, py] = this.projection(coords);
            const [ox, oy] = nodeOffsets[name] || [0, 0];
            this.nodes[name] = { x: px + ox, y: py + oy, song, name };
        }
    }

    async _preload_images() {
        await Promise.all(Object.keys(data).map(name => new Promise(resolve => {
            const img = new Image();
            img.src = data[name].image;
            img.onload = () => { this.images[name] = img; resolve(); };
            img.onerror = () => resolve();
        })));
    }

    async init_map() {
        this._setup_projection();
        this._build_nodes();
        this.worldData = await d3.json("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json");
        await this._preload_images();
    }

    resize() {
        if (!this.projection) return;
        this.projection.translate([window.innerWidth / 2, window.innerHeight / 2]);
        this._build_nodes();
    }

    hit_test(wx, wy) {
        const hitR = NODE_RADIUS + 8; // slightly larger click target
        for (const [name, node] of Object.entries(this.nodes)) {
            const dx = wx - node.x, dy = wy - node.y;
            if (dx * dx + dy * dy <= hitR * hitR) return name;
        }
        return null;
    }

    // ── bezier helpers ───────────────────────────────────────────────────────

    _ctrl(a, b) {
        const dist = Math.hypot(b.x - a.x, b.y - a.y);
        return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 - dist * 0.22 };
    }

    // ── draw phases ──────────────────────────────────────────────────────────

    draw_map() {
        if (!this.worldData || !this.projection) return;
        const path = d3.geoPath().projection(this.projection).context(this.context);
        const countries = topojson.feature(this.worldData, this.worldData.objects.countries);
        this.context.beginPath();
        path(countries);
        this.context.fillStyle = "rgba(255,255,255,0.03)";
        this.context.fill();
        this.context.strokeStyle = "rgba(255,255,255,0.18)";
        this.context.lineWidth = 0.5;
        this.context.stroke();
    }

    draw_connections() {
        const ctx = this.context;
        const { amp, bass } = this._readAudio();
        this.wavePhase += 0.07;

        for (const { from, to } of this.connections) {
            const a = this.nodes[from], b = this.nodes[to];
            if (!a || !b) continue;
            const c = this._ctrl(a, b);
            const isActive = this.playingNodeName === from || this.playingNodeName === to;

            if (isActive && this.freqData && amp > 0.01) {
                this._draw_waveform(ctx, a, b, c, amp);
            } else {
                // subtle static bezier
                ctx.save();
                ctx.beginPath();
                ctx.moveTo(a.x, a.y);
                ctx.quadraticCurveTo(c.x, c.y, b.x, b.y);
                ctx.strokeStyle = isActive
                    ? "rgba(255,153,1,0.45)"
                    : "rgba(255,153,1,0.18)";
                ctx.lineWidth = isActive ? 1.5 : 1;
                ctx.stroke();
                ctx.restore();
            }
        }

        this._draw_ripples(ctx, amp, bass);
    }

    _draw_waveform(ctx, a, b, c, amp) {
        // Dim base line underneath for context
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.quadraticCurveTo(c.x, c.y, b.x, b.y);
        ctx.strokeStyle = "rgba(255,153,1,0.25)";
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();

        // Animated waveform drawn along the bezier path
        ctx.save();
        ctx.strokeStyle = "rgba(255,180,40,0.95)";
        ctx.lineWidth = 1.5;
        ctx.shadowColor = "rgba(255,153,1,0.85)";
        ctx.shadowBlur = 5 + amp * 10;
        ctx.beginPath();

        for (let i = 0; i <= WAVE_SEGMENTS; i++) {
            const t = i / WAVE_SEGMENTS;
            const mt = 1 - t;

            // Point on quadratic bezier
            const bx = mt * mt * a.x + 2 * mt * t * c.x + t * t * b.x;
            const by = mt * mt * a.y + 2 * mt * t * c.y + t * t * b.y;

            // Tangent → perpendicular normal
            const tx_ = 2 * mt * (c.x - a.x) + 2 * t * (b.x - c.x);
            const ty_ = 2 * mt * (c.y - a.y) + 2 * t * (b.y - c.y);
            const len = Math.hypot(tx_, ty_) || 1;
            const nx = -ty_ / len;
            const ny = tx_ / len;

            // Frequency amplitude at this segment (use lower half of spectrum)
            const fi = Math.floor(t * this.freqData.length * 0.45);
            const fAmp = this.freqData[fi] / 255;

            // Traveling sine wave modulated by frequency
            const wave = Math.sin(t * 9 + this.wavePhase) * fAmp * amp * 14;

            const px = bx + nx * wave;
            const py = by + ny * wave;

            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }

        ctx.stroke();
        ctx.restore();
    }

    _draw_ripples(ctx, _amp, bass) {
        // Spawn a ripple on a beat (bass spike) with cooldown
        const now = performance.now();
        if (this.playingNodeName && bass > 0.45 && now - this.lastRippleTime > 280) {
            const n = this.nodes[this.playingNodeName];
            if (n) {
                this.ripples.push({ x: n.x, y: n.y, r: NODE_RADIUS + 2, opacity: 0.75 });
                this.lastRippleTime = now;
            }
        }

        this.ripples = this.ripples.filter(rip => {
            rip.r += 1.8;
            rip.opacity -= 0.014;
            if (rip.opacity <= 0) return false;

            ctx.save();
            ctx.beginPath();
            ctx.arc(rip.x, rip.y, rip.r, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(255,153,1,${rip.opacity})`;
            ctx.lineWidth = 1.2;
            ctx.stroke();
            ctx.restore();

            return true;
        });
    }

    draw_nodes() {
        const { bass } = this._readAudio();
        for (const [name, node] of Object.entries(this.nodes)) {
            this._draw_node(name, node, bass);
        }
    }

    _draw_node(name, node, bass) {
        const ctx = this.context;
        const { x, y, song } = node;
        const isPlaying = name === this.playingNodeName;
        const bgOp = this._bgOpacity(song.time);   // white-bg opacity (oldest=dim, newest=solid)

        // Playing node pulses slightly with bass
        const r = isPlaying ? NODE_RADIUS + bass * 5 : NODE_RADIUS;

        // 1. White background circle — opacity encodes age
        ctx.save();
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${bgOp})`;
        ctx.fill();
        ctx.restore();

        // 2. Album art at full opacity (always crisp)
        ctx.save();
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.clip();
        ctx.globalAlpha = 1;
        if (this.images[name]) {
            ctx.drawImage(this.images[name], x - r, y - r, r * 2, r * 2);
        } else {
            // fallback: dark fill + first initial
            ctx.fillStyle = "#1a1a1a";
            ctx.fill();
            ctx.font = `bold ${r}px 'DM Sans', sans-serif`;
            ctx.fillStyle = "rgba(255,153,1,0.85)";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(name[0], x, y);
        }
        ctx.restore();

        // 3. Border ring — fades with age, glows when playing
        ctx.save();
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        if (isPlaying) {
            ctx.strokeStyle = "rgba(255,153,1,1)";
            ctx.lineWidth = 2.5;
            ctx.shadowColor = "rgba(255,153,1,0.9)";
            ctx.shadowBlur = 14;
        } else {
            ctx.strokeStyle = `rgba(255,153,1,${bgOp})`;
            ctx.lineWidth = 1.5;
        }
        ctx.stroke();
        ctx.restore();

        // 4. Year + title label
        ctx.save();
        ctx.globalAlpha = Math.max(bgOp, 0.45);
        ctx.textAlign = "center";
        ctx.textBaseline = "top";

        ctx.font = "bold 8px 'DM Sans', sans-serif";
        ctx.fillStyle = "rgba(255,153,1,0.95)";
        ctx.shadowColor = "rgba(0,0,0,0.9)";
        ctx.shadowBlur = 3;
        ctx.fillText(song.year, x, y + r + 4);

        const label = name.length > 18 ? name.slice(0, 17) + "…" : name;
        ctx.font = "8px 'DM Sans', sans-serif";
        ctx.fillStyle = "#fff";
        ctx.fillText(label, x, y + r + 14);
        ctx.restore();
    }

    draw() {
        this.draw_map();
        this.draw_connections();
        this.draw_nodes();
    }
}
