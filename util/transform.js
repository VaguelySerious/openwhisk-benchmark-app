function invertColors() {
  for (var y = 0; y < this.height; y++) {
    for (var x = 0; x < this.width; x++) {
      var idx = (this.width * y + x) * 4

      this.data[idx] = 255 - this.data[idx]
      this.data[idx + 1] = 255 - this.data[idx + 1]
      this.data[idx + 2] = 255 - this.data[idx + 2]
    }
  }
}

function colorByHeight() {
  let max = 0
  let min = 99999999999
  for (var y = 0; y < this.height; y++) {
    for (var x = 0; x < this.width; x++) {
      var idx = (this.width * y + x) * 4
      const height = this.data[idx]

      if (height < min) {
        min = height
      }
      if (height > max) {
        max = height
      }

      if (height >= 11 && height < 30) {
        this.data[idx] = 0
        this.data[idx + 1] = 60
        this.data[idx + 2] = 255
      }
      if (height >= 30 && height < 60) {
        this.data[idx] = 0
        this.data[idx + 1] = 255
        this.data[idx + 2] = 0
      }
      if (height >= 60 && height < 156) {
        this.data[idx] = 255
        this.data[idx + 1] = 255
        this.data[idx + 2] = 255
      }
    }
  }
  console.log(max, min)
}

module.exports = {
  colorByHeight,
  invertColors,
}
