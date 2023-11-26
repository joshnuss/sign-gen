import path from 'path'
import SVGWriter from './SVGWriter.js'
import GerberWriter from './GerberWriter.js'
import ExcellonWriter from './ExcellonWriter.js'

export default class BoardWriter {
  constructor(board, options = {}) {
    this.svg = new SVGWriter(board, options)
    this.gerber = new GerberWriter(board, options)
    this.excellon = new ExcellonWriter(board, options)
  }

  async write(folder) {
    const svgPath = path.join(folder, 'svg')
    const gerbersPath = path.join(folder, 'gerbers')

    await this.svg.write(svgPath)
    await this.gerber.write(gerbersPath)
    await this.excellon.write(gerbersPath)
  }
}
