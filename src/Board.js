export default class Board {
  constructor(outline) {
    this.outline = [
      { type: 'polyline', points: outline.points, stroke: 1 }
    ]
    this.components = []
    this.nets = []
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
      this.#renderLayer(['silkscreen', 'top'], component)
      this.#renderLayer(['silkscreen', 'bottom'], component)
      this.#renderLayer(['paste', 'top'], component)
      this.#renderLayer(['paste', 'bottom'], component)
      this.#renderLayer(['mask', 'top'], component)
      this.#renderLayer(['mask', 'bottom'], component)
      this.#renderLayer(['copper', 'top'], component)
      this.#renderLayer(['copper', 'bottom'], component)
      this.#renderHoles('plated', component)
      this.#renderHoles('unplated', component)
    })
  }

  #renderLayer(layerName, component) {
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

  #renderHoles(layerName, component) {
    const functionName = camelize(['holes', layerName])
    const func = component[functionName]

    if (!func) return

    const shapes = func.apply(component)
    const layer = this.holes[layerName]

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
