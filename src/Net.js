export default class Net {
  viaRadius = 0.5
  viaHoleRadius = 0.25

  constructor(layer, stroke = 0.2) {
    this.layer = layer
    this.steps = []
    this.stroke = stroke
  }

  moveTo(x, y) {
    this.steps.push({ type: 'move', x, y, layer: this.layer })
  }

  lineTo(x, y, { via = false } = {}) {
    this.steps.push({ type: 'point', x, y, layer: this.layer })

    if (via) {
      this.steps.push({ type: 'via', x, y })
      this.#toggleLayer()
      this.steps.push({ type: 'point', x, y, layer: this.layer })
    }
  }

  copperTop() {
    const points = this.steps
      .filter((step) => step.layer === 'top' && ['move', 'point'].includes(step.type))
      .map(({ type, x, y }) => ({ type: type === 'point' ? 'line' : type, x, y }))

    const circles = this.#vias().map(via => {
      return { type: 'circle', r: this.viaRadius, cx: via.x, cy: via.y }
    })

    return [
      { type: 'path', points, stroke: this.stroke },
      ...circles
    ]
  }

  copperBottom() {
    const points = this.steps
      .filter((step) => step.layer === 'bottom' && ['move', 'point'].includes(step.type))
      .map(({ type, x, y }) => ({ type: type === 'point' ? 'line' : type, x, y }))

    const circles = this.#vias().map(via => {
      return { type: 'circle', r: this.viaRadius, cx: via.x, cy: via.y }
    })

    return [
      { type: 'path', points, stroke: this.stroke },
      ...circles
    ]
  }

  holesPlated() {
    return this.#vias().map((via) => {
      return { type: 'circle', d: this.viaHoleRadius*2, cx: via.x, cy: via.y }
    })
  }

  #vias() {
    return this.steps.filter((point) => point.type === 'via')
  }

  #toggleLayer() {
    if (this.layer === 'top') {
      this.layer = 'bottom'
    } else {
      this.layer = 'top'
    }
  }
}
