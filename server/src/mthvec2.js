class _vec2 {
  constructor(x, y) {
    this.x = x;
    this.y = y === undefined ? x : y;
  }
}

function vec2(...args) {
  return new _vec2(...args);
}

exports._vec2 = _vec2;
exports.vec2 = vec2;
