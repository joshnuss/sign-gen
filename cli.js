#!/usr/bin/env node
import sade from 'sade'
import path from 'path'
import fs from 'fs'
import { read } from './src/OutlineReader.js'
import BoardWriter from './src/BoardWriter.js'
import Board from './src/Board.js'
import Led from './src/components/Led.js'
import Connector from './src/components/Connector.js'
import Net from './src/Net.js'

const pkg = JSON.parse(await fs.promises.readFile('./package.json'))
const prog = sade(pkg.name)
const unit = {
  key: 'mm',
  name: 'metric'
}

prog.version(pkg.version)

prog
  .command('<input-file> <output-folder>')
  .describe('Generate PCBs (printed circuit boards) based on SVG file')
  .option('--scale', 'Scale factor', 1)
  .option('--segments', 'Number of segments in outline', 100)
  .option('--mounting-holes', 'Location on mounting holes. Comma seperated x1,y1,x2,y2....')
  .example('logo.svg --scale 2 --segments 200 --mounting-holes 10,10,20,20')

const command = prog.parse(process.argv, { lazy: true })

if (command) {
  const [inputFile, outputFolder, options] = command.args
  const project = path.parse(inputFile).name

  const outline = await read(inputFile, options.segments)

  outline.scale(options.scale)

  await createDirs(outputFolder)

  const board = new Board(outline)

  const gridSize = 16
  const grid = {
    x: gridSize,
    y: gridSize
  }

  const dimensions = {
    columns: board.width / grid.x,
    rows: board.height / grid.y
  }

  for (let y = 0; y < dimensions.rows; y++) {
    const net = new Net('top')

    net.moveTo(grid.x, grid.y * y)

    for (let x = 0; x < dimensions.columns; x++) {
      board.components.push(new Led({ cx: x * grid.x, cy: y * grid.y }, 'L2'))

      net.lineTo(x * grid.x, y * grid.y)
    }

    board.nets.push(net)
  }

  for (let x = 0; x < dimensions.columns; x++) {
    const net = new Net('top')

    net.moveTo(grid.x * x, 2)

    for (let y = 0; y < dimensions.rows; y++) {
      net.lineTo(x * grid.x, (y * grid.y) + 5, { via: true })
      net.lineTo(x * grid.x, (y * grid.y) + 7)
    }

    board.nets.push(net)
  }

  board.layout()

  const writer = new BoardWriter(board, { project, unit })

  await writer.write(outputFolder)
}

async function createDirs(output) {
  const gerbers = path.join(output, 'gerbers')
  const svg = path.join(output, 'svg')

  await fs.promises.mkdir(output, { recursive: true })
  await fs.promises.mkdir(gerbers, { recursive: true })
  await fs.promises.mkdir(svg, { recursive: true })
}
