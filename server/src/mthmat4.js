const { r2d, d2r } = require("./mth.js");

class _mat4 {
  constructor(x) {
    if (typeof x === "object") {
      if (typeof x[0] === "object") {
        this.a = [];
        for (let i = 0; i < 4; i++) {
          const mas = [];
          if (x[i] !== undefined)
            for (let j = 0; j < 4; j++)
              mas[j] = typeof x[i][j] === "undefined" ? 0 : x[i][j];
          else for (let j = 0; j < 4; j++) mas[j] = 0;
          this.a[i] = mas;
        }
      } else {
        this.a = [];
        for (let i = 0; i < 4; i++) {
          const mas = [];
          for (let j = 0; j < 4; j++)
            mas[j] = typeof x[i * 4 + j] === "undefined" ? 0 : x[i * 4 + j];
          this.a[i] = mas;
        }
      }
    } else {
      this.a = [];
      for (let i = 0; i < 4; i++) {
        const mas = [];
        for (let j = 0; j < 4; j++)
          mas[j] =
            typeof arguments[i * 4 + j] === "undefined"
              ? 0
              : arguments[i * 4 + j];
        this.a[i] = mas;
      }
    }
  }

  mulMatr = (m) => {
    let r = mat4();

    for (let i = 0; i < 4; i++)
      for (let j = 0; j < 4; j++)
        for (let k = 0; k < 4; k++) r.a[i][j] += this.a[i][k] * m.a[k][j];

    return r;
  };

  transpose = () => {
    let r = mat4();

    for (let i = 0; i < 4; i++)
      for (let j = 0; j < 4; j++) r.a[i][j] = this.a[j][i];

    return r;
  };

  determ = () => {
    return (
      this.a[0][0] *
        matrDeterm3x3(
          this.a[1][1],
          this.a[1][2],
          this.a[1][3],
          this.a[2][1],
          this.a[2][2],
          this.a[2][3],
          this.a[3][1],
          this.a[3][2],
          this.a[3][3]
        ) -
      this.a[0][1] *
        matrDeterm3x3(
          this.a[1][0],
          this.a[1][2],
          this.a[1][3],
          this.a[2][0],
          this.a[2][2],
          this.a[2][3],
          this.a[3][0],
          this.a[3][2],
          this.a[3][3]
        ) +
      this.a[0][2] *
        matrDeterm3x3(
          this.a[1][0],
          this.a[1][1],
          this.a[1][3],
          this.a[2][0],
          this.a[2][1],
          this.a[2][3],
          this.a[3][0],
          this.a[3][1],
          this.a[3][3]
        ) -
      this.a[0][3] *
        matrDeterm3x3(
          this.a[1][0],
          this.a[1][1],
          this.a[1][2],
          this.a[2][0],
          this.a[2][1],
          this.a[2][2],
          this.a[3][0],
          this.a[3][1],
          this.a[3][2]
        )
    );
  };

  inverse = () => {
    let det = this.determ();
    if (det === 0) return matrIdentity();

    let r = mat4();

    // build adjoint matrix
    r.a[0][0] =
      matrDeterm3x3(
        this.a[1][1],
        this.a[1][2],
        this.a[1][3],
        this.a[2][1],
        this.a[2][2],
        this.a[2][3],
        this.a[3][1],
        this.a[3][2],
        this.a[3][3]
      ) / det;

    r.a[1][0] =
      -matrDeterm3x3(
        this.a[1][0],
        this.a[1][2],
        this.a[1][3],
        this.a[2][0],
        this.a[2][2],
        this.a[2][3],
        this.a[3][0],
        this.a[3][2],
        this.a[3][3]
      ) / det;

    r.a[2][0] =
      matrDeterm3x3(
        this.a[1][0],
        this.a[1][1],
        this.a[1][3],
        this.a[2][0],
        this.a[2][1],
        this.a[2][3],
        this.a[3][0],
        this.a[3][1],
        this.a[3][3]
      ) / det;

    r.a[3][0] =
      -matrDeterm3x3(
        this.a[1][0],
        this.a[1][1],
        this.a[1][2],
        this.a[2][0],
        this.a[2][1],
        this.a[2][2],
        this.a[3][0],
        this.a[3][1],
        this.a[3][2]
      ) / det;

    r.a[0][1] =
      -matrDeterm3x3(
        this.a[0][1],
        this.a[0][2],
        this.a[0][3],
        this.a[2][1],
        this.a[2][2],
        this.a[2][3],
        this.a[3][1],
        this.a[3][2],
        this.a[3][3]
      ) / det;

    r.a[1][1] =
      +matrDeterm3x3(
        this.a[0][0],
        this.a[0][2],
        this.a[0][3],
        this.a[2][0],
        this.a[2][2],
        this.a[2][3],
        this.a[3][0],
        this.a[3][2],
        this.a[3][3]
      ) / det;

    r.a[2][1] =
      -matrDeterm3x3(
        this.a[0][0],
        this.a[0][1],
        this.a[0][3],
        this.a[2][0],
        this.a[2][1],
        this.a[2][3],
        this.a[3][0],
        this.a[3][1],
        this.a[3][3]
      ) / det;

    r.a[3][1] =
      +matrDeterm3x3(
        this.a[0][0],
        this.a[0][1],
        this.a[0][2],
        this.a[2][0],
        this.a[2][1],
        this.a[2][2],
        this.a[3][0],
        this.a[3][1],
        this.a[3][2]
      ) / det;

    r.a[0][2] =
      +matrDeterm3x3(
        this.a[0][1],
        this.a[0][2],
        this.a[0][3],
        this.a[1][1],
        this.a[1][2],
        this.a[1][3],
        this.a[3][1],
        this.a[3][2],
        this.a[3][3]
      ) / det;

    r.a[1][2] =
      -matrDeterm3x3(
        this.a[0][0],
        this.a[0][2],
        this.a[0][3],
        this.a[1][0],
        this.a[1][2],
        this.a[1][3],
        this.a[3][0],
        this.a[3][2],
        this.a[3][3]
      ) / det;

    r.a[2][2] =
      +matrDeterm3x3(
        this.a[0][0],
        this.a[0][1],
        this.a[0][3],
        this.a[1][0],
        this.a[1][1],
        this.a[1][3],
        this.a[3][0],
        this.a[3][1],
        this.a[3][3]
      ) / det;

    r.a[3][2] =
      -matrDeterm3x3(
        this.a[0][0],
        this.a[0][1],
        this.a[0][2],
        this.a[1][0],
        this.a[1][1],
        this.a[1][2],
        this.a[3][0],
        this.a[3][1],
        this.a[3][2]
      ) / det;

    r.a[0][3] =
      -matrDeterm3x3(
        this.a[0][1],
        this.a[0][2],
        this.a[0][3],
        this.a[1][1],
        this.a[1][2],
        this.a[1][3],
        this.a[2][1],
        this.a[2][2],
        this.a[2][3]
      ) / det;

    r.a[1][3] =
      +matrDeterm3x3(
        this.a[0][0],
        this.a[0][2],
        this.a[0][3],
        this.a[1][0],
        this.a[1][2],
        this.a[1][3],
        this.a[2][0],
        this.a[2][2],
        this.a[2][3]
      ) / det;

    r.a[2][3] =
      -matrDeterm3x3(
        this.a[0][0],
        this.a[0][1],
        this.a[0][3],
        this.a[1][0],
        this.a[1][1],
        this.a[1][3],
        this.a[2][0],
        this.a[2][1],
        this.a[2][3]
      ) / det;

    r.a[3][3] =
      +matrDeterm3x3(
        this.a[0][0],
        this.a[0][1],
        this.a[0][2],
        this.a[1][0],
        this.a[1][1],
        this.a[1][2],
        this.a[2][0],
        this.a[2][1],
        this.a[2][2]
      ) / det;

    return r;
  };
}

function mat4(...args) {
  return new _mat4(...args);
}

function matrIdentity() {
  return mat4([
    [1, 0, 0, 0],
    [0, 1, 0, 0],
    [0, 0, 1, 0],
    [0, 0, 0, 1],
  ]);
}

function matrDeterm3x3(a11, a12, a13, a21, a22, a23, a31, a32, a33) {
  return (
    a11 * a22 * a33 +
    a12 * a23 * a31 +
    a13 * a21 * a32 -
    a11 * a23 * a32 -
    a12 * a21 * a33 -
    a13 * a22 * a31
  );
}

function matrTranslate(t) {
  return mat4([
    [1, 0, 0, 0],
    [0, 1, 0, 0],
    [0, 0, 1, 0],
    [t.x, t.y, t.z, 1],
  ]);
}

function matrScale(s) {
  return mat4([
    [s.x, 0, 0, 0],
    [0, s.y, 0, 0],
    [0, 0, s.z, 0],
    [0, 0, 0, 1],
  ]);
}

function matrRotateX(angleInDegree) {
  const a = d2r(angleInDegree);
  return mat4([
    [1, 0, 0, 0],
    [0, Math.cos(a), Math.sin(a), 0],
    [0, -Math.sin(a), Math.cos(a), 0],
    [0, 0, 0, 1],
  ]);
}

function matrRotateY(angleInDegree) {
  const a = d2r(angleInDegree);
  return mat4([
    [Math.cos(a), 0, -Math.sin(a), 0],
    [0, 1, 0, 0],
    [Math.sin(a), 0, Math.cos(a), 0],
    [0, 0, 0, 1],
  ]);
}

function matrRotateZ(angleInDegree) {
  const a = d2r(angleInDegree);
  return mat4([
    [Math.cos(a), Math.sin(a), 0, 0],
    [-Math.sin(a), Math.cos(a), 0, 0],
    [0, 0, 1, 0],
    [0, 0, 0, 1],
  ]);
}

module.exports._mat4 = _mat4;
module.exports.mat4 = mat4;
module.exports.matrIdentity = matrIdentity;
module.exports.matrDeterm3x3 = matrDeterm3x3;
module.exports.matrTranslate = matrTranslate;
module.exports.matrRotateX = matrRotateX;
module.exports.matrRotateY = matrRotateY;
module.exports.matrRotateZ = matrRotateZ;
module.exports.matrScale = matrScale;
