import path from 'path'
import fs from 'fs'
import { writeStream } from './stream.js'

const pkg = JSON.parse(await fs.promises.readFile('./package.json'))
const program = `${pkg.name} v${pkg.version}`
const date = new Date()

export default class GerberWriter {
  constructor(board, { project }) {
    this.board = board
    this.project = project
  }

  async write(folder) {
  }
}
