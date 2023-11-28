#!/usr/bin/env node
import sade from 'sade'
import path from 'path'
import fs from 'fs'
import { read } from './src/OutlineReader.js'
import BoardWriter from './src/BoardWriter.js'

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
        { type: 'rect', x: 100, y: 20, width: 40, height: 80, draw: 'stroke', stroke: 4, radius: 8 },
        { type: 'rect', x: 120, y: 50, width: 40, height: 80, draw: 'stroke', stroke: 4, radius: 2 },
        { type: 'rect', x: 80, y: 20, width: 40, height: 80, draw: 'stroke', stroke: 4 },
        { type: 'polyline', points: [{ x: 0, y: 20 }, { x: 2, y: 55 }, { x: 2, y: 60 }, { x: 30, y: 20 }, { x: 50, y: 100 }], stroke: 1 }
      ],
      bottom: []
    }
  }

  const board = {
    layers,
    holes: {
      plated: [
        { cx: 10, cy: 20, d: 5 },
        { cx: 50, cy: 20, d: 15 }
      ],
      unplated: [
        { cx: 40, cy: 20, d: 5 }
      ]
    },
    outline: [
      { type: 'polyline', points: outline.points, stroke: 10 }
    ],
    width: outline.width,
    height: outline.height
  }

  await createDirs(outputFolder)

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
