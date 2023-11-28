export default class Board {
  constructor(outline) {
    this.outline = [
      { type: 'polyline', points: outline.points, stroke: 1 }
    ]
    this.components = []
    this.layers = {
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
        top: [],
        bottom: []
      }
    }

    this.holes = {
      plated: [],
      unplated: []
    }

    this.width = outline.width
    this.height = outline.height
  }

  layout() {
    this.components.forEach((component) => {
      this.#render(['silkscreen', 'top'], component)
      this.#render(['silkscreen', 'bottom'], component)
      this.#render(['paste', 'top'], component)
      this.#render(['paste', 'bottom'], component)
      this.#render(['mask', 'top'], component)
      this.#render(['mask', 'bottom'], component)
      this.#render(['copper', 'top'], component)
      this.#render(['copper', 'bottom'], component)
    })
  }

  #render(layerName, component) {
    const functionName = camelize(layerName)
    const func = component[functionName]

    if (!func) return

    const shapes = func.apply(component)
    const layer = layerName.reduce((last, value) => last[value], this.layers)

    if (Array.isArray(shapes)) {
      shapes.forEach((shape) => layer.push(shape))
    } else {
      layer.push(shapes)
    }
  }
}

function camelize(names) {
  return names.map((name, index) => {
    if (index === 0) return name

    return capitalize(name)
  }).join('')
}

function capitalize(name) {
  const [first, ...rest] = name

  return [first.toUpperCase(), ...rest].join('')
}
