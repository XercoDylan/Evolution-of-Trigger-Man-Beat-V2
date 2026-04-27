import { Camera } from "./camera.js"
import { Canvas } from "./canvas.js"
const canvas_element = document.getElementById("canvas")
const context = canvas_element.getContext('2d')


const canvas = new Canvas(canvas_element, context)
const camera = new Camera(canvas_element, context, canvas)

