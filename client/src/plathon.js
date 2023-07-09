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
} from "./mthmat4.js";
import { vec2, _vec2 } from "./mthvec2.js";
import { vec3, _vec3 } from "./mthvec3.js";
import { vec4, _vec4 } from "./mthvec4.js";
import { dsVert, _dsVert, dsPrim, countNormals } from "./rnd.js";

export function makeV(v, ind) {
  let res = [];
  if (ind !== null)
    for (let i = 0; i < ind.length; i++) {
      res[i] = dsVert(v[ind[i]], vec2(0), vec3(0), vec4(0));
    }
  else
    for (let i = 0; i < v.length; i++) {
      res[i] = dsVert(v[i], vec2(0), vec3(0), vec4(0));
    }
  return res;
}

function makeV2(v, ind) {
  let res = [];
  if (ind !== null)
    for (let i = 0; i < ind.length; i++) {
      res[i] = dsVert(
        v[ind[i]].add(vec3(((i - (i % 6)) / 6) * 2)),
        vec2(0),
        vec3(0),
        vec4(0)
      );
    }
  else
    for (let i = 0; i < v.length; i++) {
      res[i] = dsVert(v[i].add(vec3(i / 4)), vec2(0), vec3(0), vec4(0));
    }
  return res;
}

export function makeVecs(v, ind) {
  let res = [];
  for (let i = 0; i < ind.length; i++) {
    res[i] = vec3(v[ind[i]].x, v[ind[i]].y, v[ind[i]].z);
  }
  return res;
}

export function createHexahedron(matr) {
  // let vecs = [
  //   vec3(0, 1, 0),
  //   vec3(1, 1, 0),
  //   vec3(1, 0, 0),
  //   vec3(0, 0, 0),
  //   vec3(0, 1, 1),
  //   vec3(1, 1, 1),
  //   vec3(1, 0, 1),
  //   vec3(0, 0, 1),
  // ];

  // // 3, 2, 6, 3, 6, 7,
  // let i = [
  //   0, 1, 2, 0, 2, 3, 2, 1, 5, 2, 5, 6, 0, 3, 7, 0, 7, 4, 1, 0, 4, 1, 4, 5, 6,
  //   5, 4, 6, 4, 7,
  // ];

  let vecs = [
    vec3(0, 0, 0),
    vec3(0, 0, 1),
    vec3(1, 0, 1),
    vec3(1, 0, 0),
    vec3(0, 1, 0),
    vec3(0, 1, 1),
    vec3(1, 1, 1),
    vec3(1, 1, 0),
  ];

  // 3, 2, 6, 3, 6, 7,
  let i = [
    0, 1, 4, 1, 4, 5, 1, 2, 5, 2, 5, 6, 2, 3, 6, 3, 6, 7, 3, 0, 7, 0, 7, 4,

    4, 5, 6, 4, 6, 7,
  ];

  let v = makeV2(vecs, i);

  for (let j = 0; j + 2 < v.length; j += 3) {
    if (j % 2 === 0) {
      v[j].t = vec2(0, 0);
      v[j + 1].t = vec2(1, 0);
      v[j + 2].t = vec2(0, 1);
    } else {
      v[j].t = vec2(1, 0);
      v[j + 1].t = vec2(0, 1);
      v[j + 2].t = vec2(1, 1);
    }
  }

  countNormals(v, null);

  let pr = new dsPrim(window.gl.TRIANGLES, v, null);
  pr.trans = matr;
  return pr;
}
