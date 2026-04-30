export class Sound {

    constructor(main) {
        this.current_audio = null
        this.playing = false
        this.document = document

        document.getElementById("progress-bar").addEventListener("click", (e) => {
            if (!this.current_audio || !this.current_audio.duration) return;
            const rect = e.currentTarget.getBoundingClientRect();
            this.current_audio.currentTime = ((e.clientX - rect.left) / rect.width) * this.current_audio.duration;
        });

       
    }


    playTrack(audio_element) {
        console.log("GG")
        console.log(audio_element)

        this.current_audio = audio_element
        this.current_audio.play()
        this.current_audio.addEventListener("timeupdate", () => this.updateProgress())
        this.current_audio.addEventListener("ended", () => this.onTrackEnd())
        return this.current_audio
    }

    stopTrack() {
        if (this.current_audio) { 
            this.current_audio.pause()
            this.current_audio.removeEventListener("timeupdate", () => this.updateProgress())
            this.current_audio.removeEventListener("ended", () => this.onTrackEnd())
            this.current_audio = null
        }

        this.updatePlayBtn(false)
    }

    onTrackEnd() {
        this.updatePlayBtn(false)
    }


    updatePlayBtn(playing) {
        this.document.getElementById("play-btn").textContent = playing ? "⏹ Stop" : "▶ Play";
    }



    updateProgress() {
        if (!this.current_audio || !this.current_audio.duration) return

        const percentage_done = (this.current_audio.currentTime / this.current_audio.duration) * 100

        document.getElementById("progress-fill").style.width = percentage_done + "%";
        document.getElementById("time-display").textContent =`${this.format_time(this.current_audio.currentTime)} / ${this.format_time(this.current_audio.duration)}`;
    }

    format_time(second) {
        const minute = Math.floor(second / 60);
        return `${minute}:${Math.floor(second % 60).toString().padStart(2, "0")}`
    }

// audioEl = new Audio(`/sounds/${song.audio}`)
// audioEl.crossOrigin = "anonymous";
}