export default class Outline {
  constructor(points) {
    this.points = points
    this.compute()
  }

  translate(x, y) {
    this.points = this.points.map((point) => ({
      x: point.x + x,
      y: point.y + y
    }))

    this.compute()
  }

  scale(ratio) {
    this.points = this.points.map((point) => ({
      x: point.x * ratio,
      y: point.y * ratio
    }))

    this.compute()
  }

  compute() {
    const min = {}
    const max = {}

    this.points.forEach(({ x, y }) => {
      if (min.x === undefined || x < min.x) { min.x = x }

      if (min.y === undefined || y < min.y) { min.y = y }

      if (max.x === undefined || x > max.x) { max.x = x }

      if (max.y === undefined || y > max.y) { max.y = y }
    })

    this.width = max.x
    this.height = max.y
    this.min = min
  }
}
