export default class UniqueSet {
  constructor() {
    this.set = new Set()
    this.map = new Map()
  }

  add(item) {
    const string = JSON.stringify(item)

    if (this.set.has(string)) {
      return this.map.get(string)
    }

    const index = this.set.size

    this.set.add(string)
    this.map.set(string, index)

    return index
  }

  index(key) {
    const string = JSON.stringify(key)
    return this.map.get(string)
  }

  has(key) {
    const string = JSON.stringify(key)
    return this.set.has(string)
  }

  forEach(callback) {
    this.set.forEach((item) => {
      const index = this.map.get(item)
      const decoded = JSON.parse(item)
      callback(decoded, index)
    })
  }
}
