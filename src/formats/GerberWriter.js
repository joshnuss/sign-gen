import path from 'path'
import fs from 'fs'
import { writeStream } from './stream.js'
import UniqueSet from '../UniqueSet.js'

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

      const roundedRect = g.macro('RoundedRect')

      roundedRect.comment('Rectangle with rounded corners')
      roundedRect.comment('$1 Rounding radius')
      roundedRect.comment('$2 $3 $4 $5 $6 $7 $8 $9 X,Y pos of 4 corners')
      roundedRect.comment('Add a 4 corners polygon primitive as box body')

      roundedRect.outline([
        {x: 4, y: 5},
        {x: 6, y: 7},
        {x: 8, y: 9},
        {x: 2, y: 3},
      ])

      roundedRect.comment('Add four circle primitives for the rounded corners')

      roundedRect.circle('$1+$1', '$2', '$3')
      roundedRect.circle('$1+$1', '$4', '$5')
      roundedRect.circle('$1+$1', '$6', '$7')
      roundedRect.circle('$1+$1', '$8', '$9')

      roundedRect.comment('Add four rect primitives between the rounded corners')

      roundedRect.rect('$1+$1', '$2', '$3', '$4', '$5')
      roundedRect.rect('$1+$1', '$4', '$5', '$6', '$7')
      roundedRect.rect('$1+$1', '$6', '$7', '$8', '$9')
      roundedRect.rect('$1+$1', '$8', '$9', '$2', '$3')

      roundedRect.end()

      g.comment('Aperture macro list end')

      const tools = new UniqueSet()

      layer.forEach((shape) => {
        const tool = toolFromShape(shape)

        tools.add(tool)
      })

      tools.forEach((shape, index) => {
        if (shape.type === 'rect') {
          if (shape.radius) {
            g.apertureDefinition(index + 10, 'RoundedRect', [shape.radius, 0, 0, 0, shape.height, shape.width, shape.height, shape.width, 0])
          } else {
            g.apertureDefinition(index + 10, shape.type, [shape.width, shape.height])
          }
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
        const tool = toolFromShape(shape)
        const toolIndex = tools.index(tool)

        g.comment(`Starting ${shape.type} ${designator}`)
        g.selectAperture(toolIndex + 10)
        g.objectAttribute('C', designator)

        if (shape.type === 'rect') {
          g.flash(this.#coordinate({ x: shape.cx, y: shape.cy }))
        } else if (shape.type === 'circle') {
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

    startMacro(name) {
      macro = true

      stream.write(`%AM${name}*\n`)
    },

    apertureAttribute(key, ...values) {
      stream.write(`%TA.${key},${values.join(',')}*%\n`)
    },

    apertureDefinition(number, type, sizes) {
      const size = Array.isArray(sizes) ? sizes.join('X') : sizes

      stream.write(`%ADD${number}${apertureTypes[type] || type},${size}*%\n`)
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
    },

    macro(name) {
      const lines = []

      function writeComment({ text }) {
        stream.write(`0 ${text}*`)
      }

      function writeOutline({ points }) {
        const start = points[points.length - 1]
        const pointString = points.map(({ x, y }) => `$${x},$${y}`).join(',')

        stream.write(`4,1,${points.length},$${start.x},$${start.y},${pointString},0*`)
      }

      function writeCircle({ diameter, x, y, exposure }) {
        stream.write(`1,${exposure ? 1 : 0},${diameter},${x},${y}*`)
      }

      function writeRect({ width, startX, startY, endX, endY, exposure }) {
        stream.write(`20,${exposure ? 1 : 0},${width},${startX},${startY},${endX},${endY},0*`)
      }

      return {
        comment(text) {
          lines.push({ type: 'comment', text })
        },

        outline(points) {
          lines.push({ type: 'outline', points })
        },

        circle(diameter, x, y, { exposure = true } = {}) {
          lines.push({ type: 'circle', diameter, x, y, exposure })
        },

        rect(width, startX, startY, endX, endY, { exposure = true } = {}) {
          lines.push({ type: 'rect', width, startX, startY, endX, endY, exposure })
        },

        end() {
          stream.write(`%AM${name}*\n`)

          lines.forEach((line, index) => {
            switch (line.type) {
              case 'comment':
                writeComment(line)
                break

              case 'outline':
                writeOutline(line)
                break

              case 'circle':
                writeCircle(line)
                break

              case 'rect':
                writeRect(line)
                break

              default:
                throw Error(`Unexpected macro line type '${line.type}'`)
            }

            if (index === lines.length - 1) {
              stream.write('%')
            }

            stream.write('\n')
          })
        }
      }
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

function toolFromShape(shape) {
  const tool = { ...shape }

  delete tool.cx
  delete tool.cy

  return tool
}
