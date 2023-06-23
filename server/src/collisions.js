const { vec3 } = require("./mthvec3");

function getAxis(a, b) {
  // potential separating axes
  const axis = [];
  // edges
  let A, B;

  // 1st cube normals
  for (let i = 1; i < 4; i++) {
    A = a[i].sub(a[0]);
    B = a[((i + 1) % 3) + 1].sub(a[0]);
    axis.push(A.cross(B).norm());
  }

  // 2nd cube normals
  for (let i = 1; i < 4; i++) {
    A = b[i].sub(b[0]);
    B = b[((i + 1) % 3) + 1].sub(b[0]);
    axis.push(A.cross(B).norm());
  }

  // cross products (normals)
  // for (let i = 1; i < 4; i++) {
  //   A = a[i].sub(a[0]);
  //   for (let j = 1; j < 4; j++) {
  //     B = b[j].sub(b[0]);
  //     let t = A.cross(B);
  //     if (t.len2() !== 0) axis.push(t.norm());
  //   }
  // }

  return axis;
}

function projVec3(v, a) {
  a.norm();
  return v.dot(a);
}

function projAxis(points, axis) {
  let min = (max = projVec3(points[0], axis));
  for (let i = 1; i < points.length; i++) {
    const t = projVec3(points[i], axis);
    if (t > max) max = t;
    else if (t < min) min = t;
  }
  return [min, max];
}

function intersectionOfProj(a, b, axis) {
  let minVec = null;
  for (let j = 0; j < axis.length; j++) {
    const [minA, maxA] = projAxis(a, axis[j]);
    const [minB, maxB] = projAxis(b, axis[j]);

    const sum = maxA - minA + maxB - minB;
    const len = Math.max(maxA, maxB) - Math.min(minA, minB);

    // projections aren't intersected
    if (sum <= len) return null; // vec3(0)

    const dl = Math.min(maxA, maxB) - Math.max(minA, minB);
    if (minVec === null || dl * dl < minVec.len2()) {
      minVec = axis[j].mulNum(dl);
      if (minA > minB) minVec = minVec.neg();
    }
  }
  return minVec;
}

function obbIntersection(a, b) {
  let a1 = [];
  a1.push(a[0], a[1], a[2], a[3]);
  a1.push(a1[2].add(a1[1].sub(a1[0])));
  a1.push(a1[3].add(a1[1].sub(a1[0])));
  a1.push(a1[3].add(a1[2].sub(a1[0])));
  a1.push(a1[5].add(a1[2].sub(a1[0])));

  let b1 = [];
  b1.push(b[0], b[1], b[2], b[3]);
  b1.push(b1[2].add(b1[1].sub(b1[0])));
  b1.push(b1[3].add(b1[1].sub(b1[0])));
  b1.push(b1[3].add(b1[2].sub(b1[0])));
  b1.push(b1[5].add(b1[2].sub(b1[0])));

  return intersectionOfProj(a1, b1, getAxis(a, b));
}

module.exports.obbIntersection = obbIntersection;
