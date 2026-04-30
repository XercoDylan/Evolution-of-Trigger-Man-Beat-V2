export class PopUp {
    constructor(canvasElement, main) {

        this.current_node = null
        this.isPlaying  = false

        this.main = main


        canvasElement.addEventListener("click", (e) => {
            const rect = canvasElement.getBoundingClientRect();
            const cssX = e.clientX - rect.left
            const cssY = e.clientY - rect.top
            const wx = (cssX - this.main.camera.cameraX) / this.main.camera.zoom;
            const wy = (cssY - this.main.camera.cameraY) / this.main.camera.zoom;

            if (this.main.canvas.storyPlaying) return
            const hit = this.main.canvas.click(wx, wy)
            if (hit) this.showPopup(hit)
        })

        document.getElementById("play-btn").addEventListener("click", () => {
            if (!this.current_node || this.main.canvas.storyPlaying) return
            const node = this.main.canvas.nodes[this.current_node]
            if (!node) return;

            if (this.isPlaying) {
                this.main.sound.stopTrack()
                this.isPlaying = false
                this.main.canvas.redrawWaveformProgress(null)
            } else {
                const audioElement = node.audio_element;
                this.isPlaying = true
                this.main.sound.updatePlayBtn(true)
                this.main.sound.playTrack(audioElement)

                const onWaveUpdate = () => {
                    if (audioElement.duration)
                        this.main.canvas.redrawWaveformProgress(audioElement.currentTime / audioElement.duration)
                }
                audioElement.addEventListener('timeupdate', onWaveUpdate)
                audioElement.addEventListener('ended', () => {
                    audioElement.removeEventListener('timeupdate', onWaveUpdate)
                    this.isPlaying = false
                    this.main.canvas.redrawWaveformProgress(null)
                }, { once: true })
            }
        });

        document.getElementById("close-btn").addEventListener("click", () => this.closePopup());

    }




    showPopup(name) {
        const node = this.main.canvas.nodes[name]
        if (!node) return

        if (this.current_node === name) { 
            this.closePopup()
            return
        }

        this.main.sound.stopTrack()
        this.isPlaying  = false
        this.current_node = name
        const popup = document.getElementById("popup")
        const song = node.song;
        document.getElementById("popup-img").src     = song.image;
        document.getElementById("popup-title").textContent  = name;
        document.getElementById("popup-artist").textContent = song.artist;
        document.getElementById("popup-year").textContent   = song.year;
        document.getElementById("popup-city").textContent   = song.city;
        document.getElementById("popup-desc").textContent   = song.description;
        document.getElementById("progress-fill").style.width = "0%";
        document.getElementById("time-display").textContent  = "0:00 / 0:00";
        this.main.sound.updatePlayBtn(false);

        popup.classList.remove("hidden")
        this.main.canvas.drawWireframe(document.getElementById('popup-wireframe'), name)
        this.main.camera.zoomToNode(name)
    }

    closePopup() {
        const popup = document.getElementById("popup")
        popup.classList.add("hidden")
        this.main.sound.stopTrack()
        this.isPlaying  = false
        this.current_node = null
    }

}