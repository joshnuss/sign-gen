import path from 'path'
import fs from 'fs'
import UniqueSet from '../UniqueSet.js'

export default class ExcellonWriter {
  constructor(board, { project, unit }) {
    this.board = board
    this.holes = board.holes
    this.project = project
    this.unit = unit.name
  }

  async write(folder) {
    await this.#writeFile(folder, 'PTH.drl', this.holes.plated)
    await this.#writeFile(folder, 'NPTH.drl', this.holes.unplated)
  }

  async #writeFile(folder, file, holes) {
    const filePath = path.join(folder, `${this.project}-${file}`)
    const indexes = indexTools(holes)
    const io = fs.createWriteStream(filePath)

    // start header
    io.write('M48\n')
    // use format 2 commands
    io.write('FMAT,2\n')

    // specify measurement unit
    io.write(`${this.unit.toUpperCase()}\n`)

    // specify tools
    indexes.forEach((diameter, index) => {
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
      const index = indexes.index(hole.d)
      const radius = hole.d / 2

      // choose tool
      io.write(`T${index}\n`)

      const point = this.#coordinate(hole)

      // specify drill position
      io.write(`X${point.x - radius}Y${point.y - radius}\n`)
    })

    // select no tool
    io.write('T0\n')

    // end file
    io.write('M30\n')

    io.close()
  }

  #coordinate({ cx, cy }) {
    return { x: cx, y: this.board.height - cy }
  }
}

function indexTools(holes) {
  const set = new UniqueSet()

  holes.forEach(({ d: diameter }) => {
    set.add(diameter)
  })

  return set
}
