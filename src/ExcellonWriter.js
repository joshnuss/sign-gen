import path from 'path'
import fs from 'fs'

export default class ExcellonWriter {
  constructor(board, unit = 'metric') {
    this.holes = board.holes
    this.unit = unit
  }

  async write(folder) {
    await this.#writeFile(folder, 'PTH.drl', this.holes.plated)
    await this.#writeFile(folder, 'NPTH.drl', this.holes.unplated)
  }

  async #writeFile(folder, file, holes) {
    const filePath = path.join(folder, file)
    const indexes = mapTools(holes)
    const io = fs.createWriteStream(filePath)

    // start header
    io.write('M48\n')
    // use format 2 commands
    io.write('FMAT,2\n')

    // specify measurement unit
    io.write(`${this.unit.toUpperCase()}\n`)

    // specify tools
    indexes.forEach((index, diameter) => {
      io.write(`T${index}C${diameter}\n`)
    })

    // end header
    io.write('%\n')

    // absolute mode
    io.write('G90\n')

    // drill mode
    io.write('G05\n')

    // specify holes
    holes.forEach((hole) => {
      const index = indexes.get(hole.d)
      const radius = hole.d / 2

      // choose tool
      io.write(`T${index}\n`)

      // specify drill position
      io.write(`X${hole.cx - radius}Y${hole.cy - radius}\n`)
    })

    // select no tool
    io.write('T0\n')

    // end file
    io.write('M30\n')

    io.close()
  }
}

function mapTools(holes) {
  const tools = new Set()
  const indexes = new Map()

  let count = 0

  holes.forEach(({ d: diameter }) => {
    if (!tools.has(diameter)) {
      tools.add(diameter)
      indexes.set(diameter, ++count)
    }
  })

  return indexes
}
