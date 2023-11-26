import fs from 'fs'

export async function writeStream(path, callback) {
  return new Promise((resolve, reject) => {
    const stream = fs.createWriteStream(path)

    callback(stream)

    stream.end()
    stream.on('finish', () => { resolve(true) })
    stream.on('error', reject)
  })
}
