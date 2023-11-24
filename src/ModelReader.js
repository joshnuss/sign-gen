import sharp from 'sharp'
import potrace from 'potrace'
import { createSVGDocument } from 'svgdom'
import { temporaryFile } from 'tempy'
import util from 'util'
import Model from './Model.js'

const trace = util.promisify(potrace.trace)

export async function read(path, segments) {
  const bitmapPath = await convertToBmp(path)
  const svg = await trace(bitmapPath)
  const shape = extractPath(svg)
  const points = flatten(shape, segments)
  const model = new Model(points)

  model.translate(-model.min.x, -model.min.y)

  return model
}

async function convertToBmp(path) {
  const outputPath = temporaryFile()

  await sharp(path).toFile(outputPath)

  return outputPath
}

function extractPath(svg) {
  const doc = createSVGDocument()

  doc.documentElement.innerHTML = svg

  return doc.querySelector('path')
}

function flatten(path, segments) {
  const points = []
  const length = path.getTotalLength()

  let point = path.getPointAtLength(0)
  points.push(point)

  for (let i = (length/segments); i<=length; i+=(length/segments)){
    point = path.getPointAtLength(i)
    points.push(point)
  }

  return points
}
