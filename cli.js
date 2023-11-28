#!/usr/bin/env node
import sade from 'sade'
import path from 'path'
import fs from 'fs'
import { read } from './src/OutlineReader.js'
import BoardWriter from './src/BoardWriter.js'
import Board from './src/Board.js'
import Led from './src/components/Led.js'
import Connector from './src/components/Connector.js'

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

  board.components = [
    new Led({ cx: 10, cy: 10 }, 'L1'),
    new Led({ cx: 13, cy: 10 }, 'L2'),
    new Led({ cx: 16, cy: 10 }, 'L3'),
    new Connector({ cx: 20, cy: 20 }, 'J1')
  ]

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
