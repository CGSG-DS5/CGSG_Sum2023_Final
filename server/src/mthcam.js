const {
  mat4,
  _mat4,
  matrDeterm3x3,
  matrIdentity,
  matrRotateX,
  matrRotateY,
  matrRotateZ,
  matrScale,
  matrTranslate,
} = require("../src/mthmat4.js");
const { vec3, _vec3 } = require("./mthvec3.js");

function matrView(loc, at, up1) {
  const dir = at.sub(loc).norm();
  const right = dir.cross(up1).norm();
  const up = right.cross(dir);
  return mat4([
    [right.x, up.x, -dir.x, 0],
    [right.y, up.y, -dir.y, 0],
    [right.z, up.z, -dir.z, 0],
    [-loc.dot(right), -loc.dot(up), loc.dot(dir), 1],
  ]);
}

function matrOrtho(l, r, b, t, n, f) {
  return mat4([
    [2 / (r - l), 0, 0, 0],
    [0, 2 / (t - b), 0, 0],
    [0, 0, 2 / (n - f), 0],
    [(r + l) / (l - r), (t + b) / (b - t), (f + n) / (n - f), 1],
  ]);
}

function matrFrustum(l, r, b, t, n, f) {
  return mat4([
    [(2 * n) / (r - l), 0, 0, 0],
    [0, (2 * n) / (t - b), 0, 0],
    [(r + l) / (r - l), (t + b) / (t - b), (f + n) / (n - f), -1],
    [0, 0, (2 * n * f) / (n - f), 0],
  ]);
}

function createBuf(cam) {
  return [
    cam.loc.x,
    cam.loc.y,
    cam.loc.z,
    cam.dir.x,

    cam.up.x,
    cam.up.y,
    cam.up.z,
    cam.dir.y,

    cam.right.x,
    cam.right.y,
    cam.right.z,
    cam.dir.z,

    cam.at.x,
    cam.at.y,
    cam.at.z,
    0,

    cam.frameW,
    cam.frameH,
    cam.projDist,
    cam.projSize,
  ];
}

class dsCamera {
  constructor() {
    this.setDefault();
    this.ubo = createBuf(this);
  }

  setDefault = () => {
    this.loc = vec3(1);
    this.at = vec3(0);
    this.dir = vec3(0, 0, -1);
    this.up = vec3(0, 1, 0);
    this.right = vec3(1, 0, 0);

    this.projDist = 0.1;
    this.projSize = 0.1;
    this.projFarClip = 1000;

    this.frameW = this.frameH = 30;

    this.camSet(this.loc, this.at, this.up);
    this.setProj(this.projSize, this.projDist, this.projFarClip);
  };

  camSet = (loc, at, up) => {
    this.matrView = matrView(loc, at, up);

    this.loc = loc;
    this.at = at;

    this.dir = vec3(
      -this.matrView.a[0][2],
      -this.matrView.a[1][2],
      -this.matrView.a[2][2]
    );

    this.up = vec3(
      this.matrView.a[0][1],
      this.matrView.a[1][1],
      this.matrView.a[2][1]
    );

    this.right = vec3(
      this.matrView.a[0][0],
      this.matrView.a[1][0],
      this.matrView.a[2][0]
    );

    this.ubo = createBuf(this);

    if (typeof this.matrProj !== "undefined")
      this.matrVP = this.matrView.mulMatr(this.matrProj);
  };

  setProj = (projSize, projDist, projFarClip) => {
    let rx, ry;
    rx = ry = projSize;
    this.projDist = projDist;
    this.projSize = projSize;
    this.projFarClip = projFarClip;

    if (this.frameW > this.frameH) rx *= this.frameW / this.frameH;
    else ry *= this.frameH / this.frameW;

    this.matrProj = matrFrustum(
      -rx / 2,
      rx / 2,
      -ry / 2,
      ry / 2,
      this.projDist,
      this.projFarClip
    );

    this.matrVP = this.matrView.mulMatr(this.matrProj);

    this.ubo = createBuf(this);
  };

  setSize = (frameW, frameH) => {
    this.frameW = frameW;
    this.frameH = frameH;
    this.setProj(this.projSize, this.projDist, this.projFarClip);
  };
}

exports.dsCamera = dsCamera;
exports.createBuf = createBuf;
