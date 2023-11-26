import path from 'path'
import fs from 'fs'
import { writeStream } from './stream.js'

const pkg = JSON.parse(await fs.promises.readFile('./package.json'))
const program = `${pkg.name} v${pkg.version}`
const date = new Date()
const numberFormat = { integer: 4, decimal: 6 }

const polarities = {
  dark: 'D',
  clear: 'C'
}

const plotStates = {
  linear: '01',
  circular_clockwise: '02',
  circular_counter_clockwise: '03'
}

export default class GerberWriter {
  constructor(board, options) {
    this.board = board
    this.project = options.project
    this.unit = options.unit.key
  }

  async write(folder) {
    const { layers } = this.board

    await this.#writeFile(folder, 'F_Silkscreen.gbr', 'Legend,Bot', layers.silkscreen.top)
    await this.#writeFile(folder, 'B_Silkscreen.gbr', 'Legend,Top', layers.silkscreen.bottom)
    await this.#writeFile(folder, 'F_Mask.gbr', 'Soldermask,Top', layers.mask.top)
    await this.#writeFile(folder, 'B_Mask.gbr', 'Soldermask,Bot', layers.mask.bottom)
    await this.#writeFile(folder, 'F_Paste.gbr', 'Paste,Top', layers.paste.top)
    await this.#writeFile(folder, 'B_Paste.gbr', 'Paste,Bot', layers.paste.bottom)
    await this.#writeFile(folder, 'F_Cu.gbr', 'Copper,L1,Top', layers.copper.top)
    await this.#writeFile(folder, 'B_Cu.gbr', 'Copper,L2,Bot', layers.copper.bottom)
  }

  async #writeFile(folder, file, functions, layer) {
    const filePath = path.join(folder, `${this.project}-${file}`)

    await writeStream(filePath, (io) => {
      const g = gerberStream(io)

      g.attribute('GenerationSoftware', program)
      g.attribute('CreationDate', date.toISOString())
      g.attribute('ProjectId', this.project)
      g.attribute('FileFunction', functions.split(','))
      g.attribute('FilePolarity', 'Positive')
      g.attribute('SameCoordinates', 'Original')

      g.specification('LA', numberFormat)

      g.comment(`Gerber format 4.6, Unit ${this.unit}`)
      g.comment(`Created by ${program} at ${date.toISOString()}`)

      g.unit(this.unit)
      g.polarity('dark')
      g.plotState('linear')

      g.endOfFile()
    })
  }
}

function gerberStream(stream) {
  return {
    attribute(key, ...values) {
      stream.write(`%TF.${key},${values.join(',')}*%\n`)
    },

    comment(text) {
      stream.write(`G04 ${text}*\n`)
    },

    specification(option, format) {
      stream.write(`%FS${option}X${format.integer}${format.decimal}Y${format.integer}${format.decimal}*%\n`)
    },

    unit(value) {
      stream.write(`%MO${value.toUpperCase()}*%\n`)
    },

    polarity(polarity) {
      stream.write(`%LP${polarities[polarity]}*%\n`)
    },

    plotState(plotState) {
      stream.write(`G${plotStates[plotState]}*\n`)
    },

    endOfFile() {
      stream.write(`M02*\n`)
    }
  }
}
