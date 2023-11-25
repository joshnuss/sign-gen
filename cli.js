#!/usr/bin/env node
import sade from 'sade'
import fs from 'fs'
import { read } from './src/ModelReader.js'
import BoardWriter from './src/BoardWriter.js'

const pkg = JSON.parse(await fs.promises.readFile('./package.json'))
const prog = sade(pkg.name)

prog.version(pkg.version)

prog
  .command('<input-file> <output-folder>')
  .describe('generate pcb files in shape of input file')
  .option('--scale', 'Scale factor', 1)
  .option('--segments', 'Number of segments in outline', 100)
  .option('--mounting-holes', 'Location on mounting holes. Comma seperated x1,y1,x2,y2....')
  .example('logo.svg --scale 2 --segments 200 --mounting-holes 10,10,20,20')

const command = prog.parse(process.argv, { lazy: true })

if (command) {
  const [inputFile, outputFolder, options] = command.args

  const model = await read(inputFile, options.segments)

  model.scale(options.scale)

  const layers = {
    paste: {
      top: [],
      bottom: []
    },

    mask: {
      top: [],
      bottom: []
    },

    silkscreen: {
      top: [],
      bottom: []
    },

    copper: {
      top: [
        { type: 'circle', cx: 4, cy: 10, r: 10, draw: 'fill' },
        { type: 'rect', x: 20, y: 20, width: 40, height: 80, draw: 'stroke', stroke: 4, radius: 8 }
      ],
      bottom: []
    }
  }

  const board = {
    layers,
    holes: {
      plated: [
        { cx: 10, cy: 20, r: 5 },
        { cx: 50, cy: 20, r: 15 }
      ],
      unplated: [
        { cx: 40, cy: 20, r: 5 }
      ]
    },
    outline: [
      { type: 'polyline', points: model.points, stroke: 10 }
    ],
    width: model.width,
    height: model.height
  }

  await fs.promises.mkdir(outputFolder, { recursive: true })

  const writer = new BoardWriter(board)

  await writer.write(outputFolder)
}
