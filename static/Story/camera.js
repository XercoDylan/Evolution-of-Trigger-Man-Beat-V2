const MAX_ZOOM =  15
const MIN_ZOOM = 0.1
const ZOOM_SENSITIVITIY = 0.1


export class Camera {
    constructor(canvas_element, context, canvas) {

        this.canvas_element = canvas_element
        this.canvas = canvas
        this.context = context

        this.zoom = 1
        this.cameraX = 0
        this.cameraY = 0
        this.dragging = false

        this.resize()

        window.addEventListener('wheel', (e) => {
            this.scale(e)
        })

        window.addEventListener("mousedown", (e) => {
            this.dragging = true
            this.canvas_element.style.cursor = "grab"
        })

        window.addEventListener("mouseup", () => {
            this.dragging = false
            this.canvas_element.style.cursor = "default";
        })

        window.addEventListener("mousemove", (e) => {
            if (this.dragging) {
                this.translate(e.movementX, e.movementY)
            }
        })

        window.addEventListener('resize', () => {
            this.resize()
        })

        
        this.draw()

    }

    translate(x, y) {

        this.cameraX += x
        this.cameraY += y
        this.draw()
    }

    scale(e) {

        const zoomAmount = e.deltaY < 0 ? 1 + ZOOM_SENSITIVITIY : 1 - ZOOM_SENSITIVITIY
        let newZoom = this.zoom * zoomAmount
        newZoom = Math.min(Math.max(newZoom, MIN_ZOOM), MAX_ZOOM)

        const mouseWorldX = (e.clientX - this.cameraX) / this.zoom
        const mouseWorldY = (e.clientY - this.cameraY) / this.zoom

        this.zoom = newZoom;

        this.cameraX = e.clientX - (mouseWorldX * this.zoom)
        this.cameraY = e.clientY - (mouseWorldY * this.zoom)
        this.draw()
    }

    draw() {

        this.context.setTransform(1, 0, 0, 1, 0, 0)
        this.context.clearRect(0, 0, canvas.width, canvas.height)

        this.context.scale(devicePixelRatio, devicePixelRatio)
        this.context.scale(this.zoom, this.zoom)
        this.context.translate(this.cameraX/this.zoom, this.cameraY/this.zoom)

        this.canvas.draw()
        
    }



    resize() {

        this.canvas_element.width = window.innerWidth * devicePixelRatio
        this.canvas_element.height = window.innerHeight * devicePixelRatio

        this.draw()
    }
} 