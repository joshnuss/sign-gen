import path from 'path'
import fs from 'fs'

export default class SVGWriter {
  constructor(board) {
    this.board = board
  }

  async write(folder) {
    const { layers, holes, outline } = this.board

    await this.#writeLayer(folder, 'mask.top.svg', layers.mask.top)
    await this.#writeLayer(folder, 'mask.bottom.svg', layers.mask.bottom)
    await this.#writeLayer(folder, 'silkscreen.top.svg', layers.silkscreen.top)
    await this.#writeLayer(folder, 'silkscreen.bottom.svg', layers.silkscreen.bottom)
    await this.#writeLayer(folder, 'copper.top.svg', layers.copper.top)
    await this.#writeLayer(folder, 'copper.bottom.svg', layers.copper.bottom)
    await this.#writeLayer(folder, 'edge.svg', outline)
    await this.#writeHoles(folder, 'holes.plated.svg', holes.plated)
    await this.#writeHoles(folder, 'holes.unplated.svg', holes.unplated)

    await this.#writeBoard(folder, 'board.svg', [
      { file: 'silkscreen.top.svg', color: 'red' },
      { file: 'mask.top.svg', color: 'red' },
      { file: 'copper.top.svg', color: 'red' },
      { file: 'copper.bottom.svg', color: 'blue' },
      { file: 'mask.bottom.svg', color: 'red' },
      { file: 'silkscreen.bottom.svg', color: 'red' },
      { file: 'holes.plated.svg', color: 'yellow' },
      { file: 'holes.unplated.svg', color: 'brown' },
      { file: 'edge.svg', color: 'green' }
    ])
  }

  async #writeLayer(folder, file, layer) {
    await this.#writeFile(folder, file, (stream) => {
      layer.forEach((shape) => {
        switch (shape.type) {
          case 'polyline':
            stream.write(`<polyline points="${shape.points.map((point) => `${point.x}, ${point.y}`).join(' ')}"`)
            break

          case 'circle':
            stream.write(`<circle cx="${shape.cx}" cy="${shape.cy}" r="${shape.r}"`)
            break

          case 'rect':
            stream.write(`<rect x="${shape.x}" y="${shape.y}" width="${shape.width}" height="${shape.height}"`)

            if (shape.radius) {
              stream.write(` rx="${shape.radius}"`)
            }
            break

          default:
            throw Error(`Unknown shape type '${shape.type}'`)
        }

        const draw = shape.draw || 'stroke'
        const strokeWidth = shape.stroke || 1

        if (draw === 'stroke') {
          stream.write(' stroke="currentColor" fill="transparent"')
        } else if (draw === 'fill') {
          stream.write(' stroke="transparent" fill="currentColor"')
        } else if (draw === 'both') {
          stream.write(' stroke="currentColor" fill="currentColor"')
        }

        if (['stroke', 'both'].includes(draw)) {
          stream.write(` stroke-width="${strokeWidth}"`)
        }

        stream.write('/>\n')
      })
    })
  }

  async #writeHoles(folder, file, holes) {
    await this.#writeFile(folder, file, (stream) => {
      holes.forEach((hole) => {
        stream.write(`<circle cx="${hole.cx}" cy="${hole.cy}" r="${hole.r}" fill="currentColor"/>`)
      })
    })
  }

  async #writeFile(folder, file, callback) {
    const { board } = this
    const filePath = path.join(folder, file)

    return new Promise((resolve, reject) => {
      const stream = fs.createWriteStream(filePath)

      stream.write(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${board.width} ${board.height}" width="${board.width}" height="${board.height}">\n`)

      callback(stream)

      stream.write('</svg>\n')

      stream.end()
      stream.on('finish', () => { resolve(true) })
      stream.on('error', reject)
    })
  }

  async #writeBoard(folder, file, parts) {
    await this.#writeFile(folder, file, (stream) => {
      parts.forEach((part) => {
        const filePath = path.join(folder, part.file)

        stream.write(`<g style="color: ${part.color}">\n`)
        stream.write(fs.readFileSync(filePath))
        stream.write('</g>\n')
      })
    })
  }
}
