#!/usr/bin/env node
import pkg from './package.json' with { type: "json" }
import sade from 'sade'
import { read } from './src/ModelReader.js'

const prog = sade(pkg.name)

prog.version(pkg.version)

prog
  .command('<file>')
  .describe('generate pcb files in shape of input file')
  .option('--scale', 'Scale factor', 1)
  .option('--segments', 'Number of segments in outline', 100)
  .example('logo.svg --scale 2 --segments 200')

const command = prog.parse(process.argv, { lazy: true })

if (command) {
  const [ file, options ] = command.args

  const model = await read(file, options.segments)

  console.log(model)

  model.scale(options.scale)

  console.log(model)
}

