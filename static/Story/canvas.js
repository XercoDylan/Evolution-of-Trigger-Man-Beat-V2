import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import * as topojson from "https://cdn.jsdelivr.net/npm/topojson-client@3/+esm"; // Add this line!

export class Canvas {
    constructor(canvas, context) {

        this.canvas = canvas
        this.context = context

        this.init_map()

    }


    draw_map() {
        if (!this.worldData) return
        const width = this.canvas.width || 960
        const height = this.canvas.height || 600

        const projection = d3.geoNaturalEarth1()
        projection.translate([width / 2, height / 2])

        const path = d3.geoPath()
        .projection(projection)
        .context(this.context)


        const countries = topojson.feature(this.worldData, this.worldData.objects.countries)
            
        this.context.beginPath()
        path(countries)
            
        this.context.fillStyle ="#ffffff00"
        this.context.fill()
            
        this.context.strokeStyle = "#ffffff"
        this.context.lineWidth = 0.5
        this.context.stroke()
    }


    async init_map() {

        const mapDataUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";
        this.worldData = await d3.json(mapDataUrl)

        this.draw()


    }

    draw() {

        this.draw_map()

    }
}
