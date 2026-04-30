import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import * as topojson from "https://cdn.jsdelivr.net/npm/topojson-client@3/+esm";
import { data, cityCoords, nodeOffsets } from "./data.js";

const NODE_RADIUS = 25
const TIME_MIN = 1
const TIME_MAX = 39

export class Canvas {
    constructor(canvas, context, main) {
        this.canvas = canvas
        this.context = context
        this.worldData = null
        this.projection = null
        this.nodes = {}
        this.images = {}
        this.connections = this.build_connections()
        this.main = main
        this.storyRevealedNodes = null
        this.storyPlaying = false
        this.storyCurrentNode = null
        this.waveformCache = {}
        this._storyStopResolve = null
        this._wfState = null
    }

    build_connections() {
        const seen = new Set()
        const out = []
        for (const [name, song] of Object.entries(data)) {
            for (const child of song.children) {
                const key = `${name}->${child}`
                if (!seen.has(key)) { 
                    seen.add(key)
                    out.push({ from: name, to: child })
                }
            }
        }
        return out
    }

    get_time_opacity(time) {
        return (time/37)
    }

    setup_map_projection() {
        this.projection = d3.geoNaturalEarth1()
            .rotate([85, -35])
            .scale(3000)
            .translate([window.innerWidth / 2, window.innerHeight / 2])
    }

    create_nodes() {
        for (const [name, song] of Object.entries(data)) {
            const coords = cityCoords[song.city];
            const [px, py] = this.projection(coords)
            const [ox, oy] = nodeOffsets[name] || [0, 0]
            const audio_element = new Audio(`/sounds/${song.audio}`)
            audio_element.crossOrigin = "anonymous"
            this.nodes[name] = { x: px + ox, y: py + oy, song, name, audio_element}
        }
    }

    async preload_images() {
        await Promise.all(Object.keys(data).map(name => new Promise(resolve => {
            const img = new Image();
            img.src = data[name].image;
            img.onload = () => { this.images[name] = img; resolve(); };
            img.onerror = () => resolve();
        })))
    }

    async init_map() {
        this.setup_map_projection();
        this.create_nodes();
        this.worldData = await d3.json("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json")
        await this.preload_images()
    }

    resize() {
        this.projection.translate([window.innerWidth / 2, window.innerHeight / 2])
        this.create_nodes()
    }

    click(wx, wy) {
        const hitR = NODE_RADIUS + 8;
        for (const [name, node] of Object.entries(this.nodes)) {
            const dx = wx - node.x, dy = wy - node.y
            if (dx * dx + dy * dy <= hitR * hitR) return name
        }
        return null
    }

    // ── bezier helpers ───────────────────────────────────────────────────────

    bazier_helper(a, b) {
        const dist = Math.hypot(b.x - a.x, b.y - a.y);
        return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 - dist * 0.22 };
    }

    // ── draw phases ──────────────────────────────────────────────────────────

    draw_map() {
        if (!this.worldData || !this.projection) return
        const path = d3.geoPath().projection(this.projection).context(this.context);
        const countries = topojson.feature(this.worldData, this.worldData.objects.countries)
        this.context.beginPath()
        path(countries)
        this.context.fillStyle = "rgba(255,255,255,0.03)"
        this.context.fill()
        this.context.strokeStyle = "rgba(255,255,255,0.18)"
        this.context.lineWidth = 0.5
        this.context.stroke()
    }

    draw_connections() {
        const ctx = this.context;

        for (const { from, to } of this.connections) {
            const a = this.nodes[from], b = this.nodes[to]
            if (!a || !b) continue
            if (this.storyRevealedNodes && (!this.storyRevealedNodes.has(from) || !this.storyRevealedNodes.has(to))) continue
            const c = this.bazier_helper(a, b)
            const selected = this.storyPlaying ? this.storyCurrentNode : this.main.popup?.current_node;
            const isActive = selected === from || selected === to;

            ctx.save();
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.quadraticCurveTo(c.x, c.y, b.x, b.y);
            ctx.strokeStyle = isActive ? "rgba(255,153,1,0.45)" : "rgba(255,153,1,0.18)"
            ctx.lineWidth = isActive ? 1.5 : 1
            ctx.stroke()
            ctx.restore()
        }
    }

    draw_nodes() {
        for (const [name, node] of Object.entries(this.nodes)) {
            this.draw_node(name, node)
        }
    }

    draw_node(name, node) {
        if (this.storyRevealedNodes && !this.storyRevealedNodes.has(name)) return
        const ctx = this.context;
        const { x, y, song } = node;
        const isPlaying = this.storyPlaying
            ? this.storyCurrentNode === name
            : this.main.popup?.current_node === name
        const opacity = this.get_time_opacity(song.time)

        ctx.save()
        ctx.beginPath()
        ctx.arc(x, y, NODE_RADIUS, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255,255,255,${opacity})`
        ctx.fill()
        ctx.restore()

        ctx.save()
        ctx.beginPath()
        ctx.arc(x, y, NODE_RADIUS, 0, Math.PI * 2)
        ctx.clip()


        ctx.globalAlpha = 1
    
        if (this.images[name]) {
            ctx.drawImage(this.images[name], x - NODE_RADIUS, y - NODE_RADIUS, NODE_RADIUS * 2, NODE_RADIUS * 2)
        } else {
            ctx.fillStyle = "#1a1a1a";
            ctx.fill();
            ctx.font = `bold ${NODE_RADIUS}px 'DM Sans', sans-serif`;
            ctx.fillStyle = "rgba(255,153,1,0.85)";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(name[0], x, y)
        }
        ctx.restore()

        // 3. Border ring — fades with age, glows when playing
        ctx.save()
        ctx.beginPath()
        ctx.arc(x, y, NODE_RADIUS, 0, Math.PI * 2)

        if (isPlaying) {
            ctx.strokeStyle = "rgba(255,153,1,1)"
            ctx.lineWidth = 2.5
            ctx.shadowColor = "rgba(255,153,1,0.9)"
            ctx.shadowBlur = 14
        } else {
            ctx.strokeStyle = `rgba(255,153,1,${opacity})`
            ctx.lineWidth = 1.5
        }

        ctx.stroke()
        ctx.restore()


        ctx.save();
        ctx.globalAlpha = Math.max(opacity, 0.45)
        ctx.textAlign = "center"
        ctx.textBaseline = "top"

        ctx.font = "bold 8px 'DM Sans', sans-serif"
        ctx.fillStyle = "rgba(255,153,1,0.95)"
        ctx.shadowColor = "rgba(0,0,0,0.9)"
        ctx.shadowBlur = 3
        ctx.fillText(song.year, x, y + NODE_RADIUS + 4)

        const label = name.length > 18 ? name.slice(0, 17) + "…" : name
        ctx.font = "8px 'DM Sans', sans-serif"
        ctx.fillStyle = "#fff"
        ctx.fillText(label, x, y + NODE_RADIUS + 14)
        ctx.restore()
    }

    draw() {
        this.draw_map()
        this.draw_connections()
        this.draw_nodes()
    }

    // ── Waveform helpers ─────────────────────────────────────────────────────

    _paintWave(ctx, cssH, smoothed, numPts, scaleY, fillStops, strokeColor, glowColor) {
        const cy = cssH / 2
        ctx.beginPath()
        ctx.moveTo(0, cy - smoothed[0] * scaleY)
        for (let i = 1; i < numPts; i++) ctx.lineTo(i, cy - smoothed[i] * scaleY)
        for (let i = numPts - 1; i >= 0; i--) ctx.lineTo(i, cy + smoothed[i] * scaleY)
        ctx.closePath()
        const grad = ctx.createLinearGradient(0, 0, 0, cssH)
        fillStops.forEach(([p, c]) => grad.addColorStop(p, c))
        ctx.fillStyle = grad
        ctx.fill()
        ctx.strokeStyle = strokeColor
        ctx.lineWidth = 1.5
        ctx.shadowColor = glowColor
        ctx.shadowBlur = 5
        ctx.beginPath()
        ctx.moveTo(0, cy - smoothed[0] * scaleY)
        for (let i = 1; i < numPts; i++) ctx.lineTo(i, cy - smoothed[i] * scaleY)
        ctx.stroke()
        ctx.beginPath()
        ctx.moveTo(0, cy + smoothed[0] * scaleY)
        for (let i = 1; i < numPts; i++) ctx.lineTo(i, cy + smoothed[i] * scaleY)
        ctx.stroke()
        ctx.shadowBlur = 0
    }

    redrawWaveformProgress(progress) {
        if (!this._wfState) return
        const { ctx, cssW, cssH, dpr, currentSmoothed, parentSmoothed, scaleY, numPts } = this._wfState

        ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
        ctx.clearRect(0, 0, cssW, cssH)

        // Parent always drawn at full opacity (blue)
        if (parentSmoothed) {
            this._paintWave(ctx, cssH, parentSmoothed, numPts, scaleY,
                [[0,'rgba(100,180,255,0)'],[0.25,'rgba(100,180,255,0.12)'],[0.5,'rgba(100,180,255,0.28)'],[0.75,'rgba(100,180,255,0.12)'],[1,'rgba(100,180,255,0)']],
                'rgba(100,180,255,0.65)', 'rgba(100,180,255,0.35)')
        }

        if (progress === null) {
            // Static view (not playing) — full orange at full brightness
            this._paintWave(ctx, cssH, currentSmoothed, numPts, scaleY,
                [[0,'rgba(255,153,1,0)'],[0.25,'rgba(255,153,1,0.2)'],[0.5,'rgba(255,153,1,0.45)'],[0.75,'rgba(255,153,1,0.2)'],[1,'rgba(255,153,1,0)']],
                'rgba(255,153,1,0.9)', 'rgba(255,153,1,0.45)')
        } else {
            // Unplayed portion — dim
            ctx.save()
            ctx.globalAlpha = 0.25
            this._paintWave(ctx, cssH, currentSmoothed, numPts, scaleY,
                [[0,'rgba(255,153,1,0)'],[0.25,'rgba(255,153,1,0.2)'],[0.5,'rgba(255,153,1,0.45)'],[0.75,'rgba(255,153,1,0.2)'],[1,'rgba(255,153,1,0)']],
                'rgba(255,153,1,0.9)', 'rgba(255,153,1,0.45)')
            ctx.restore()

            // Played portion — bright, clipped to left of playhead
            const playX = progress * cssW
            if (playX > 0) {
                ctx.save()
                ctx.beginPath()
                ctx.rect(0, 0, playX, cssH)
                ctx.clip()
                this._paintWave(ctx, cssH, currentSmoothed, numPts, scaleY,
                    [[0,'rgba(255,153,1,0)'],[0.25,'rgba(255,153,1,0.2)'],[0.5,'rgba(255,153,1,0.45)'],[0.75,'rgba(255,153,1,0.2)'],[1,'rgba(255,153,1,0)']],
                    'rgba(255,153,1,0.9)', 'rgba(255,153,1,0.45)')
                ctx.restore()
            }

            // Playhead line
            if (progress > 0 && progress < 1) {
                const playX = progress * cssW
                ctx.save()
                ctx.strokeStyle = 'rgba(255,255,255,0.85)'
                ctx.lineWidth = 1.5
                ctx.shadowColor = 'rgba(255,255,255,0.5)'
                ctx.shadowBlur = 4
                ctx.beginPath()
                ctx.moveTo(playX, 2)
                ctx.lineTo(playX, cssH - 2)
                ctx.stroke()
                ctx.restore()
            }
        }
    }

    async drawWireframe(wfCanvas, songName) {
        const dpr = window.devicePixelRatio || 1
        const cssW = wfCanvas.offsetWidth || 640
        const cssH = wfCanvas.offsetHeight || 100
        wfCanvas.width  = cssW * dpr
        wfCanvas.height = cssH * dpr
        const ctx = wfCanvas.getContext('2d')
        ctx.scale(dpr, dpr)
        ctx.clearRect(0, 0, cssW, cssH)

        ctx.fillStyle = 'rgba(255,255,255,0.15)'
        ctx.font = "11px 'DM Sans', sans-serif"
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText('Loading waveform…', cssW / 2, cssH / 2)

        // Find the most recently revealed parent if story is active
        let parentName = null
        if (this.storyPlaying && this.storyRevealedNodes) {
            let bestYear = -1
            for (const [name, song] of Object.entries(data)) {
                if (song.children.includes(songName) && this.storyRevealedNodes.has(name)) {
                    if (song.year > bestYear) { bestYear = song.year; parentName = name }
                }
            }
        }

        const loadWaveform = async (name) => {
            if (!this.waveformCache[name]) {
                const src = this.nodes[name].audio_element.src
                const audioCtx = new AudioContext()
                const buf = await audioCtx.decodeAudioData(await fetch(src).then(r => r.arrayBuffer()))
                audioCtx.close()
                this.waveformCache[name] = new Float32Array(buf.getChannelData(0))
            }
            return this.waveformCache[name]
        }

        const computeSmoothed = (channelData, numPts) => {
            const blockSize = Math.max(1, Math.floor(channelData.length / numPts))
            const rms = new Float32Array(numPts)
            for (let i = 0; i < numPts; i++) {
                const start = i * blockSize
                let sum = 0
                for (let j = 0; j < blockSize && (start + j) < channelData.length; j++) sum += channelData[start + j] ** 2
                rms[i] = Math.sqrt(sum / blockSize)
            }
            const win = 12
            const smoothed = new Float32Array(numPts)
            for (let i = 0; i < numPts; i++) {
                let s = 0, c = 0
                for (let j = Math.max(0, i - win); j <= Math.min(numPts - 1, i + win); j++) { s += rms[j]; c++ }
                smoothed[i] = s / c
            }
            return smoothed
        }

        try {
            const numPts = cssW
            const [currentData, parentData] = await Promise.all([
                loadWaveform(songName),
                parentName ? loadWaveform(parentName) : Promise.resolve(null)
            ])

            const currentSmoothed = computeSmoothed(currentData, numPts)
            const parentSmoothed  = parentData ? computeSmoothed(parentData, numPts) : null
            const allVals = parentSmoothed ? [...currentSmoothed, ...parentSmoothed] : [...currentSmoothed]
            const scaleY = (cssH * 0.44) / Math.max(...allVals, 0.001)

            this._wfState = { ctx, cssW, cssH, dpr, currentSmoothed, parentSmoothed, scaleY, numPts }
            this.redrawWaveformProgress(null)

        } catch {
            ctx.clearRect(0, 0, cssW, cssH)
            ctx.fillStyle = 'rgba(255,255,255,0.2)'
            ctx.fillText('Waveform unavailable', cssW / 2, cssH / 2)
        }
    }

    async playStory() {
        if (this.storyPlaying) {
            this.storyPlaying = false
            if (this._storyStopResolve) { this._storyStopResolve(); this._storyStopResolve = null }
            this.storyRevealedNodes = null
            this.storyCurrentNode = null
            if (this.main.sound.current_audio) {
                this.main.sound.current_audio.pause()
                this.main.sound.current_audio.currentTime = 0
            }
            this.main.sound.updatePlayBtn(false)
            if (this.main.popup) this.main.popup.closePopup()
            document.getElementById('story-btn').textContent = '▶ Play Story'
            return
        }

        this.storyPlaying = true
        this.storyRevealedNodes = new Set()
        document.getElementById('story-btn').textContent = '⏹ Stop'

        const sorted = Object.entries(data).sort((a, b) => a[1].year - b[1].year)

        for (const [name] of sorted) {
            if (!this.storyPlaying) break

            this.storyRevealedNodes.add(name)
            this.storyCurrentNode = name

            this.main.popup.showPopup(name)

            const audio = this.nodes[name].audio_element
            audio.currentTime = 0
            this.main.sound.current_audio = audio
            this.main.sound.updatePlayBtn(true)

            const onTimeUpdate = () => {
                this.main.sound.updateProgress()
                if (audio.duration) this.redrawWaveformProgress(audio.currentTime / audio.duration)
            }
            audio.addEventListener('timeupdate', onTimeUpdate)

            await new Promise(resolve => {
                this._storyStopResolve = resolve
                audio.addEventListener('ended', resolve, { once: true })
                audio.play().catch(resolve)
            })

            audio.removeEventListener('timeupdate', onTimeUpdate)
            this.redrawWaveformProgress(null)
            this._storyStopResolve = null
        }

        this.storyRevealedNodes = null
        this.storyCurrentNode = null
        this.storyPlaying = false
        this.main.sound.stopTrack()
        document.getElementById('story-btn').textContent = '▶ Play Story'
    }
}
