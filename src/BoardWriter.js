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
    await this.svg.write(folder)
    await this.gerber.write(folder)
    await this.excellon.write(folder)
  }
}
