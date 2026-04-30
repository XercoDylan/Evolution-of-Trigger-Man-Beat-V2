import { Camera } from "./camera.js"
import { Canvas } from "./canvas.js"
import { Sound } from "./sound.js"
import { PopUp } from "./popup.js"

class Main {
    constructor() {
        this.canvasElement = document.getElementById("canvas")
        this.ctx = this.canvasElement.getContext("2d")
    }

    async init() {
        this.canvas = new Canvas(this.canvasElement, this.ctx, this)
        await this.canvas.init_map()

        this.sound  = new Sound(this)
        this.camera = new Camera(this.canvasElement, this.ctx, this)
        this.popup  = new PopUp(this.canvasElement, this)
        document.getElementById('story-btn').addEventListener('click', () => this.canvas.playStory())
    }
}

const main = new Main()
main.init()
