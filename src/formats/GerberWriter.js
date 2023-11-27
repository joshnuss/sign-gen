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

const apertureTypes = {
  circle: 'C',
  rect: 'R'
}

export default class GerberWriter {
  constructor(board, options) {
    this.board = board
    this.project = options.project
    this.unit = options.unit.key
  }

  async write(folder) {
    const { outline, layers } = this.board

    await this.#writeFile(folder, 'F_Silkscreen.gbr', 'Legend,Bot', layers.silkscreen.top)
    await this.#writeFile(folder, 'B_Silkscreen.gbr', 'Legend,Top', layers.silkscreen.bottom)
    await this.#writeFile(folder, 'F_Mask.gbr', 'Soldermask,Top', layers.mask.top)
    await this.#writeFile(folder, 'B_Mask.gbr', 'Soldermask,Bot', layers.mask.bottom)
    await this.#writeFile(folder, 'F_Paste.gbr', 'Paste,Top', layers.paste.top)
    await this.#writeFile(folder, 'B_Paste.gbr', 'Paste,Bot', layers.paste.bottom)
    await this.#writeFile(folder, 'F_Cu.gbr', 'Copper,L1,Top', layers.copper.top)
    await this.#writeFile(folder, 'B_Cu.gbr', 'Copper,L2,Bot', layers.copper.bottom)
    await this.#writeFile(folder, 'Edge_Cuts.gbr', 'Profile', outline)
  }

  #coordinate({ x, y }) {
    return { x, y: this.board.height - y }
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

      g.comment('Aperture list')
      g.comment('Aperture macro list')

      g.comment('Aperture macro list end')

      layer.forEach((shape, index) => {
        if (shape.type === 'rect') {
          const size = `${shape.width}X${shape.height}`

          g.apertureDefinition(index + 10, shape.type, size)
        } else if (shape.type === 'circle') {
          g.apertureDefinition(index + 10, shape.type, shape.r * 2)
        } else if (shape.type === 'polyline') {
          g.apertureDefinition(index + 10, 'circle', shape.stroke)
        }
      })

      g.comment('Aperture list end')
      g.blankLine()

      layer.forEach((shape, index) => {
        const designator = `X${index + 1}`
        g.comment(`Starting ${shape.type} ${designator}`)
        g.selectAperture(index + 10)
        g.objectAttribute('C', designator)

        if (shape.type === 'rect') {
          g.flash(this.#coordinate(shape))
        } else if (shape.type === 'circle' ) {
          g.flash(this.#coordinate({ x: shape.cx, y: shape.cy }))
        } else if (shape.type === 'polyline') {
          const [first, ...rest] = shape.points

          g.moveTo(this.#coordinate(first))

          rest.forEach((point) => g.lineTo(this.#coordinate(point)))
        }

        g.deleteAllAttributes()
        g.comment(`Ending ${shape.type} ${designator}`)
        g.blankLine()
      })

      g.endOfFile()
    })
  }
}

function gerberStream(stream) {
  let macro = false

  return {
    attribute(key, ...values) {
      stream.write(`%TF.${key},${values.join(',')}*%\n`)
    },

    comment(text) {
      if (macro) {
        stream.write(`0 ${text}*\n`)
      } else {
        stream.write(`G04 ${text}*\n`)
      }
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

    startMacro(name) {
      macro = true

      stream.write(`%AM${name}*\n`)
    },

    apertureAttribute(key, ...values) {
      stream.write(`%TA.${key},${values.join(',')}*%\n`)
    },

    apertureDefinition(number, type, size) {
      stream.write(`%ADD${number}${apertureTypes[type]},${size}*%\n`)
    },

    deleteAllAttributes() {
      stream.write('%TD*%\n')
    },

    selectAperture(number) {
      stream.write(`D${number}*\n`)
    },

    objectAttribute(type, value) {
      stream.write(`%TO.${type},${value}*%\n`)
    },

    flash({ x, y }) {
      stream.write(`X${formatNumber(x)}Y${formatNumber(y)}D03*\n`)
    },

    moveTo({ x, y }) {
      stream.write(`X${formatNumber(x)}Y${formatNumber(y)}D02*\n`)
    },

    lineTo({ x, y }) {
      stream.write(`X${formatNumber(x)}Y${formatNumber(y)}D01*\n`)
    },

    blankLine() {
      stream.write('\n')
    },

    endOfFile() {
      stream.write('M02*\n')
    }
  }
}

function formatNumber(number, format = numberFormat) {
  return number.toLocaleString(undefined, {
    useGrouping: false,
    minimumSignificantDigitsDigits: format.integer,
    maximumSignificantDigitsDigits: format.integer,
    minimumFractionDigits: format.decimal,
    maximumFractionDigits: format.decimal
  }).replace('.', '')
}
