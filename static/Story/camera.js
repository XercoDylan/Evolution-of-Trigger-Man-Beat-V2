const MAX_ZOOM =  30
const MIN_ZOOM = 0.1
const ZOOM_SENSITIVITIY = 0.1
const NODE_ZOOM_AMOUNT = 3
const NODE_ZOOM_SPEED = 0.09


export class Camera {
    constructor(canvas_element, context, main) {

        this.canvas_element = canvas_element

        this.main = main
        this.context = context

        this.zoom = 1
        this.cameraX = 0
        this.cameraY = 0
        this.dragging = false
        this.zoomTarget = null

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

        this.animate_node_zoom()
        this.draw()

    }

    zoomToNode(name, zoomLevel = NODE_ZOOM_AMOUNT) {
        const node = this.main.canvas.nodes[name];
        if (!node) return;

        this.zoomTarget = {
            zoom: zoomLevel,
            cx: window.innerWidth  / 2 - node.x * zoomLevel,
            cy: window.innerHeight / 2 - node.y * zoomLevel,
        }

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

        this.main.canvas.draw()
        
    }



    resize() {

        this.canvas_element.width = window.innerWidth * devicePixelRatio
        this.canvas_element.height = window.innerHeight * devicePixelRatio

        if (this.main.canvas.resize) this.main.canvas.resize()
        this.draw()
    }

    animate_node_zoom() {
        if (this.zoomTarget) {
            this.zoom   += (this.zoomTarget.zoom - this.zoom)   * NODE_ZOOM_SPEED
            this.cameraX += (this.zoomTarget.cx   - this.cameraX) * NODE_ZOOM_SPEED
            this.cameraY += (this.zoomTarget.cy   - this.cameraY) * NODE_ZOOM_SPEED

            if (
                Math.abs(this.zoom   - this.zoomTarget.zoom) < 0.005 &&
                Math.abs(this.cameraX - this.zoomTarget.cx)  < 0.5   &&
                Math.abs(this.cameraY - this.zoomTarget.cy)  < 0.5
            ) {
                this.zoom    = this.zoomTarget.zoom
                this.cameraX = this.zoomTarget.cx
                this.cameraY = this.zoomTarget.cy
                this.zoomTarget = null
            }
        }
        this.draw()
        requestAnimationFrame(() => this.animate_node_zoom())
    }
} 