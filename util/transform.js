function invertColors() {
  for (var y = 0; y < this.height; y++) {
    for (var x = 0; x < this.width; x++) {
      var idx = (this.width * y + x) * 4;

      this.data[idx] = 255 - this.data[idx];
      this.data[idx + 1] = 255 - this.data[idx + 1];
      this.data[idx + 2] = 255 - this.data[idx + 2];
    }
  }
}

function colorByHeight() {
  for (var y = 0; y < this.height; y++) {
    for (var x = 0; x < this.width; x++) {
      var idx = (this.width * y + x) * 4;

      //   this.data[idx] = 255 - this.data[idx];
      //   this.data[idx + 1] = 255 - this.data[idx + 1];
      //   this.data[idx + 2] = 255 - this.data[idx + 2];
      //   if (x === 255 && y === 64) {
      //     return;
      //   }
    }
  }
}

module.exports = {
  colorByHeight,
  invertColors
};
