import sharp from 'sharp'
import potrace from 'potrace'
import { createSVGDocument } from 'svgdom'
import { temporaryFile } from 'tempy'
import util from 'util'
import Outline from './Outline.js'

const trace = util.promisify(potrace.trace)

export async function read(path, segments) {
  const bitmapPath = await convertToBmp(path)
  const svg = await trace(bitmapPath)
  const shape = extractPath(svg)
  const points = flatten(shape, segments)
  const outline = new Outline(points)

  outline.translate(-outline.min.x, -outline.min.y)

  return outline
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

  const first = path.getPointAtLength(0)
  points.push(first)

  for (let i = (length / segments); i <= length; i += (length / segments)) {
    const point = path.getPointAtLength(i)
    points.push(point)
  }

  points.push(first)

  return points
}
