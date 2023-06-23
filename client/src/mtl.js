import { dsRnd } from "../main.js";
import { uniform_buffer } from "./buffer.js";
import { vec3, _vec3 } from "./mthvec3.js";

export class dsMtl {
  constructor(name, ka, kd, ks, ph, trans, shdNo) {
    this.name = name;
    this.ka = ka;
    this.kd = kd;
    this.ks = ks;
    this.ph = ph;
    this.trans = trans;
    this.shdNo = shdNo;

    let buf = [
      this.ka.x,
      this.ka.y,
      this.ka.z,
      this.ph,

      this.kd.x,
      this.kd.y,
      this.kd.z,
      this.trans,

      this.ks.x,
      this.ks.y,
      this.ks.z,
      0.0,
    ];

    this.uboBuf = new uniform_buffer("MtlUBO", buf.length * 4, 1);
    this.uboBuf.update(buf);

    this.tex = [-1, -1, -1, -1, -1, -1, -1, -1];
  }

  free() {
    this.uboBuf.free();
  }
}

export function dsRndMtl(gl) {
  this.getDef = () => {
    return new dsMtl("Default", vec3(0.1), vec3(0.9), vec3(0.3), 30.0, 1, 0);
  };

  this.add = (mtl) => {
    for (let i = 0; i < this.mtlSize; i++) {
      if (mtl.name === this.mtls[i]) return i;
    }
    this.mtls[this.mtlSize] = mtl;
    return this.mtlSize++;
  };

  this.get = (mtlNo) => {
    if (mtlNo < 0 || mtlNo >= this.mtlSize) return this.mtls[0];
    return this.mtls[mtlNo];
  };

  this.apply = (mtlNo) => {
    let mtl = this.get(mtlNo);

    let prg = dsRnd.shd.shdGet(mtl.shdNo).progId;

    if (prg === undefined) return 0;
    window.gl.useProgram(prg);

    mtl.uboBuf.apply(prg);

    let loc;

    for (let i = 0; i < mtl.tex.length; i++) {
      if (mtl.tex[i] !== -1) {
        if (!dsRnd.tex.textures[mtl.tex[i]].isCube) {
          window.gl.activeTexture(window.gl.TEXTURE0 + i);
          window.gl.bindTexture(
            window.gl.TEXTURE_2D,
            dsRnd.tex.textures[mtl.tex[i]].id
          );
          if ((loc = window.gl.getUniformLocation(prg, "Texture" + i)) !== -1)
            window.gl.uniform1i(loc, i);
          if ((loc = window.gl.getUniformLocation(prg, "IsTexture" + i)) !== -1)
            window.gl.uniform1i(loc, 1);
        } else {
          window.gl.activeTexture(window.gl.TEXTURE0 + 9);
          window.gl.bindTexture(
            window.gl.TEXTURE_CUBE_MAP,
            dsRnd.tex.textures[mtl.tex[i]].id
          );
          if ((loc = window.gl.getUniformLocation(prg, "Cubemap" + i)) !== -1)
            window.gl.uniform1i(loc, i);
          if ((loc = window.gl.getUniformLocation(prg, "IsTexture" + i)) !== -1)
            window.gl.uniform1i(loc, 1);
        }
      } else {
        if ((loc = window.gl.getUniformLocation(prg, "IsTexture" + i)) !== -1)
          window.gl.uniform1i(loc, 0);
      }
    }

    return prg;
  };

  this.free = () => {
    for (let i = 0; i < this.mtlSize; i++) this.mtls[i].free();
  };

  this.mtlSize = 0;
  this.mtls = [];
  this.add(this.getDef());

  return this;
}
