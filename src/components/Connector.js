import BaseComponent from './Base.js'

export default class Connector extends BaseComponent {
  hole = 1

  width = 1.7

  height = 1.7

  copperTop() {
    return this.#rect()
  }

  copperBottom() {
    return this.#rect()
  }

  maskTop() {
    return this.#rect()
  }

  maskBottom() {
    return this.#rect()
  }

  pasteTop() {
    return this.#rect()
  }

  pasteBottom() {
    return this.#rect()
  }

  holesPlated() {
    return { ...this.point, d: this.hole }
  }

  #rect() {
    return { type: 'rect', ...this.point, width: this.width, height: this.height, draw: 'fill' }
  }
}
