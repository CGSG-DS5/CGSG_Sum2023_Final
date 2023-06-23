class _vec4 {
  constructor(x, y, z, w) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.w = w;
  }
}

function vec4(...args) {
  return new _vec4(...args);
}

exports._vec4 = _vec4;
exports.vec4 = vec4;
