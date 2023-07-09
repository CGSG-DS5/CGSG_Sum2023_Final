import {
  mat4,
  _mat4,
  matrDeterm3x3,
  matrIdentity,
  matrRotateX,
  matrRotateY,
  matrRotateZ,
  matrScale,
  matrTranslate,
} from "../src/mthmat4.js";
import {
  buffer,
  index_buffer,
  vertex_buffer,
  uniform_buffer,
} from "./buffer.js";
import { vec2, _vec2 } from "./mthvec2.js";
import { vec3, _vec3 } from "./mthvec3.js";
import { vec4, _vec4 } from "./mthvec4.js";
import { dsRndShader } from "./shd.js";
import { camUBO, dsRnd, timeFromServer } from "../main.js";
import { dsMtl, dsRndMtl } from "./mtl.js";
import { dsRndTexture } from "./tex.js";

export let dsRndShdAddonI = [0, 0, 0, 0];
export let dsRndShdAddonF = [0, 0, 0];

export function countNormals(v, ind) {
  for (let i = 0; i < v.length; i++) v[i].n = vec3(0);

  if (ind !== null)
    for (let i = 0; i + 2 < ind.length; i += 3) {
      let n = v[ind[i + 1]].p
        .sub(v[ind[i]].p)
        .cross(v[ind[i + 2]].p.sub(v[ind[i]].p))
        .norm();
      v[ind[i]].n = v[ind[i]].n.add(n).norm();
      v[ind[i + 1]].n = v[ind[i + 1]].n.add(n).norm();
      v[ind[i + 2]].n = v[ind[i + 2]].n.add(n).norm();
    }
  else
    for (let i = 0; i + 2 < v.length; i += 3) {
      let n = v[i + 1].p
        .sub(v[i].p)
        .cross(v[i + 2].p.sub(v[i].p))
        .norm();
      v[i].n = v[i].n.add(n).norm();
      v[i + 1].n = v[i + 1].n.add(n).norm();
      v[i + 2].n = v[i + 2].n.add(n).norm();
    }
}

export function countBB(v) {
  let min, max;
  if (typeof v[0] === "object") {
    (min = vec3(v[0].p)), (max = vec3(v[0].p));
    for (let i = 1; i < v.length; i++) {
      if (v[i].p.x < min.x) min.x = v[i].p.x;
      else if (v[i].p.x > max.x) max.x = v[i].p.x;

      if (v[i].p.y < min.y) min.y = v[i].p.y;
      else if (v[i].p.y > max.y) max.y = v[i].p.y;

      if (v[i].p.z < min.z) min.z = v[i].p.z;
      else if (v[i].p.z > max.z) max.z = v[i].p.z;
    }
  } else {
    (min = vec3(v[0], v[1], v[2])), (max = vec3(v[0], v[1], v[2]));
    for (let i = 12; i + 2 < v.length; i += 3 + 2 + 3 + 4) {
      if (v[i] < min.x) min.x = v[i];
      else if (v[i] > max.x) max.x = v[i];

      if (v[i + 1] < min.y) min.y = v[i + 1];
      else if (v[i + 1] > max.y) max.y = v[i + 1];

      if (v[i + 2] < min.z) min.z = v[i + 2];
      else if (v[i + 2] > max.z) max.z = v[i + 2];
    }
  }

  return [min, max];
}

export class _dsVert {
  constructor(p, t, n, c) {
    if (p === undefined) {
      this.p = vec3(0);
      this.t = vec2(0);
      this.n = vec3(0);
      this.c = vec4(0);
    } else if (typeof p === "object" && t === undefined) {
      this.p = p.p;
      this.t = p.t;
      this.n = p.n;
      this.c = p.c;
    } else {
      this.p = p;
      this.t = t;
      this.n = n;
      this.c = c;
    }
  }
}

export function dsVert(...args) {
  return new _dsVert(...args);
}

export function vertArr2floatArr(vertices) {
  if (typeof vertices[0] !== "object") return vertices;
  let arr = [];
  for (let i = 0; i < vertices.length; i++) {
    arr.push(vertices[i].p.x);
    arr.push(vertices[i].p.y);
    arr.push(vertices[i].p.z);

    arr.push(vertices[i].t.x);
    arr.push(vertices[i].t.y);

    arr.push(vertices[i].n.x);
    arr.push(vertices[i].n.y);
    arr.push(vertices[i].n.z);

    arr.push(vertices[i].c.x);
    arr.push(vertices[i].c.y);
    arr.push(vertices[i].c.z);
    arr.push(vertices[i].c.w);
  }
  return arr;
}

export function mat2floatArr(arr, mat) {
  for (let i = 0; i < 16; i++) arr.push(mat.a[(i - (i % 4)) / 4][i % 4]);
  return arr;
}

// Primitive class
export class dsPrim {
  constructor(type, v, ind) {
    this.vBuf = this.vA = this.iBuf = 0;
    if (v !== null) {
      let primVertexArray = window.gl.createVertexArray();
      window.gl.bindVertexArray(primVertexArray);

      const pos = vertArr2floatArr(v);

      this.vBuf = new vertex_buffer(pos);
      this.vA = primVertexArray;
    }
    if (ind !== null) {
      let primIndexBuffer = window.gl.createBuffer();
      window.gl.bindBuffer(window.gl.ELEMENT_ARRAY_BUFFER, primIndexBuffer);
      window.gl.bufferData(
        window.gl.ELEMENT_ARRAY_BUFFER,
        ind.length * 2,
        window.gl.STATIC_DRAW
      );
      window.gl.bufferData(
        window.gl.ELEMENT_ARRAY_BUFFER,
        new Uint32Array(ind),
        window.gl.STATIC_DRAW
      );

      this.iBuf = new index_buffer(ind);
      this.numOfElements = ind.length;
    } else this.numOfElements = v.length;

    this.trans = matrIdentity();
    this.type = type;
    this.mtlNo = 0;
    [this.minBB, this.maxBB] = countBB(v);
  }

  // Primitive free function
  free = () => {
    this.vBuf.free();
    this.iBuf.free();
  };

  // Primitive draw function
  draw = (world, vp) => {
    let w = this.trans.mulMatr(world),
      wInv = w.inverse().transpose(),
      wvp = w.mulMatr(vp);

    let prg = dsRnd.mtl.apply(this.mtlNo);
    if (prg === 0) return;

    let arr = [];
    mat2floatArr(arr, w);
    mat2floatArr(arr, wInv);
    mat2floatArr(arr, wvp);
    mat2floatArr(arr, vp);

    dsRnd.matrixUBO.update(arr);
    dsRnd.matrixUBO.apply(prg);

    // ds_cam.ubo.apply(prg);
    camUBO.apply(prg);

    let loc;

    if ((loc = window.gl.getUniformLocation(prg, "Time")) !== -1) {
      window.gl.uniform1f(loc, timeFromServer);
    }

    if ((loc = window.gl.getUniformLocation(prg, "AddonI0")) !== -1) {
      window.gl.uniform1i(loc, dsRndShdAddonI[0]);
    }
    if ((loc = window.gl.getUniformLocation(prg, "AddonI1")) !== -1) {
      window.gl.uniform1i(loc, dsRndShdAddonI[1]);
    }
    if ((loc = window.gl.getUniformLocation(prg, "AddonI2")) !== -1) {
      window.gl.uniform1i(loc, dsRndShdAddonI[2]);
    }
    if ((loc = window.gl.getUniformLocation(prg, "AddonI3")) !== -1) {
      window.gl.uniform1i(loc, dsRndShdAddonI[3]);
    }

    if ((loc = window.gl.getUniformLocation(prg, "AddonF0")) !== -1) {
      window.gl.uniform1f(loc, dsRndShdAddonF[0]);
    }
    if ((loc = window.gl.getUniformLocation(prg, "AddonF1")) !== -1) {
      window.gl.uniform1f(loc, dsRndShdAddonF[1]);
    }
    if ((loc = window.gl.getUniformLocation(prg, "AddonF2")) !== -1) {
      window.gl.uniform1f(loc, dsRndShdAddonF[2]);
    }

    window.gl.bindVertexArray(this.vA);
    this.vBuf.apply();
    if (this.iBuf === 0) {
      window.gl.drawArrays(this.type, 0, this.numOfElements);
    } else {
      this.iBuf.apply();
      window.gl.drawElements(
        this.type,
        this.numOfElements,
        window.gl.UNSIGNED_INT,
        0
      );
    }

    if ((loc = window.gl.getAttribLocation(prg, "InPos")) !== -1) {
      window.gl.vertexAttribPointer(
        loc,
        3,
        window.gl.FLOAT,
        false,
        (3 + 2 + 3 + 4) * 4,
        0
      );
      window.gl.enableVertexAttribArray(loc);
    }

    if ((loc = window.gl.getAttribLocation(prg, "InTexCoord")) !== -1) {
      window.gl.vertexAttribPointer(
        loc,
        2,
        window.gl.FLOAT,
        false,
        (3 + 2 + 3 + 4) * 4,
        3 * 4
      );
      window.gl.enableVertexAttribArray(loc);
    }

    if ((loc = window.gl.getAttribLocation(prg, "InNormal")) !== -1) {
      window.gl.vertexAttribPointer(
        loc,
        3,
        window.gl.FLOAT,
        false,
        (3 + 2 + 3 + 4) * 4,
        (3 + 2) * 4
      );
      window.gl.enableVertexAttribArray(loc);
    }

    if ((loc = window.gl.getAttribLocation(prg, "InColor")) !== -1) {
      window.gl.vertexAttribPointer(
        loc,
        4,
        window.gl.FLOAT,
        false,
        (3 + 2 + 3 + 4) * 4,
        (3 + 2 + 3) * 4
      );
      window.gl.enableVertexAttribArray(loc);
    }
  };
}

// Render class constructor function
export function dsRender() {
  // Render init
  this.can = document.getElementById("dsCan");
  this.gl = this.can.getContext("webgl2");

  Object.defineProperty(window, "gl", {
    get: () => {
      if (this._gl == null || this._gl == undefined) {
        this.canvas = document.getElementById("dsCan");
        this._gl = this.canvas.getContext("webgl2");
      }
      return this._gl;
    },
    set: (val) => {
      this._gl = val;
    },
  });

  this.shd = new dsRndShader(this.gl);
  this.mtl = new dsRndMtl(this.gl);
  this.tex = new dsRndTexture();

  this.matrixUBO = new uniform_buffer("MatrixUBO", 16 * 4 * 4, 0);

  this.gl.clearColor(0.28, 0.47, 0.8, 1);
  this.gl.enable(this.gl.DEPTH_TEST);

  // Render start method
  this.start = () => {
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    this.gl.clear(this.gl.DEPTH_BUFFER_BIT);
    this.gl.enable(this.gl.DEPTH_TEST);
  };

  // Render close method
  this.close = () => {
    this.mtl.free();
  };

  this.primLoad = (fileName) => {
    return new Promise((resolve, reject) => {
      let v = [],
        ind = [],
        nv,
        c1,
        c0,
        c;

      fetch(fileName)
        .then((res) => res.text())
        .then((data) => {
          const lines = data.split("\n");
          for (let i = 0; i < lines.length; i++) {
            const buf = lines[i].split(" ");
            if (buf[0] === "v") nv++;
          }

          for (let i = 0; i < lines.length; i++) {
            const buf = lines[i].split(" ");
            if (buf[0] === "v") {
              let x = parseFloat(buf[1]),
                y = parseFloat(buf[2]),
                z = parseFloat(buf[3]);

              v.push(dsVert(vec3(x, y, z), vec2(0), vec3(0), vec3(0)));
            } else if (buf[0] == "f") {
              let n = 0,
                c0 = 0,
                c1 = 0;
              for (let j = 1; j < buf.length; j++) {
                c = parseInt(buf[j]);
                if (c < 0) c += nv;
                else c--;

                if (n === 0) c0 = c;
                else if (n === 1) c1 = c;
                else {
                  ind.push(c0);
                  ind.push(c1);
                  ind.push(c);
                  c1 = c;
                }
                n++;
              }
            }
          }
          countNormals(v, ind);

          resolve(new dsPrim(gl.TRIANGLES, v, ind));
        });
    });
  };

  return this;
} // End of 'dsRender' function
