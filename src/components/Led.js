import BaseComponent from './Base.js'

export default class Led extends BaseComponent {
  pad = { width: 1.2, height: 1.2 }

  spacing = 0.9

  radius = 0.25

  copperTop() {
    return this.#pads()
  }

  maskTop() {
    return this.#pads()
  }

  pasteTop() {
    return this.#pads()
  }

  #pads() {
    return [
      { type: 'rect', ...this.point, ...this.pad, draw: 'fill', radius: this.radius },
      { type: 'rect', ...this.point, cy: this.point.cy + this.pad.height + this.spacing, ...this.pad, draw: 'fill', radius: this.radius }
    ]
  }

  silkscreenTop() {
    const { point: center, pad } = this
    const padding = 0.2
    const length = pad.height * 2.5
    const origin = {
      x: center.cx - pad.width / 2,
      y: center.cy - pad.height / 2
    }

    const points = [
      { x: origin.x - padding, y: origin.y - padding + length },
      { x: origin.x - padding, y: origin.y - padding },
      { x: origin.x + pad.width + padding, y: origin.y - padding },
      { x: origin.x + pad.width + padding, y: origin.y - padding + length }
    ]

    return { type: 'polyline', points, stroke: 0.1 }
  }
}
