import SVGWriter from './SVGWriter.js'

export default class BoardWriter {
  constructor (board) {
    this.board = board
    this.writer = new SVGWriter(board)
  }

  async write (folder) {
    await this.writer.write(folder)
  }
}
