import path from 'path'
import SVGWriter from './SVGWriter.js'
import GerberWriter from './GerberWriter.js'
import ExcellonWriter from './ExcellonWriter.js'

export default class BoardWriter {
  constructor(board) {
    this.svg = new SVGWriter(board)
    this.gerber = new GerberWriter(board)
    this.excellon = new ExcellonWriter(board)
  }

  async write(folder) {
    const svgPath = path.join(folder, 'svg')
    const gerbersPath = path.join(folder, 'gerbers')

    await this.svg.write(svgPath)
    await this.gerber.write(gerbersPath)
    await this.excellon.write(gerbersPath)
  }
}
