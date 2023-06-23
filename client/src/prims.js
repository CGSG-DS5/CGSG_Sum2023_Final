import { dsRnd } from "../main";
import { matrIdentity } from "./mthmat4";
import { vec3 } from "./mthvec3";
import { dsMtl } from "./mtl";
import { dsPrim, dsRndShdAddnonI } from "./rnd";

export class dsPrims {
  constructor(numOfPrims) {
    this.numOfPrims = numOfPrims;
    this.trans = matrIdentity();
    this.minBB = this.maxBB = vec3(0);
    this.prims = [];
  }

  draw = (world, vp) => {
    const m = this.trans.mulMatr(world);

    dsRndShdAddnonI[0] = this.numOfPrims;
    for (let i = 0; i < this.numOfPrims; i++)
      if (dsRnd.mtl.get(this.prims[i].mtlNo).trans === 1) {
        dsRndShdAddnonI[1] = i;
        this.prims[i].draw(m, vp);
      }

    window.gl.enable(window.gl.CULL_FACE);

    window.gl.cullFace(window.gl.FRONT);
    for (let i = 0; i < this.numOfPrims; i++)
      if (dsRnd.mtl.get(this.prims[i].mtlNo).trans !== 1) {
        dsRndShdAddnonI[1] = i;
        this.prims[i].draw(m, vp);
      }

    window.gl.cullFace(window.gl.BACK);
    for (let i = 0; i < this.numOfPrims; i++)
      if (dsRnd.mtl.get(this.prims[i].mtlNo).trans !== 1) {
        dsRndShdAddnonI[1] = i;
        this.prims[i].draw(m, vp);
      }

    window.gl.disable(window.gl.CULL_FACE);
  };
}

export async function primsLoad(fileName) {
  const response = await fetch(fileName);
  let dataBuf = await response.arrayBuffer();
  let buf = new Uint8Array(dataBuf);

  let ptr = 0;

  const sign = buf
    .slice(ptr, (ptr += 4))
    .reduce((resStr, ch) => (resStr += String.fromCharCode(ch)), "");
  if (sign !== "G3DM") return null;

  let [numOfPrims, numOfMaterials, numOfTextures] = new Uint32Array(
    dataBuf.slice(ptr, (ptr += 4 * 3))
  );

  let prs = new dsPrims(numOfPrims);

  for (let i = 0; i < numOfPrims; i++) {
    let [numOfV, numOfI, mtlNo] = new Uint32Array(
      dataBuf.slice(ptr, (ptr += 4 * 3))
    );

    let v = new Float32Array(
      dataBuf.slice(ptr, (ptr += 4 * (3 + 2 + 3 + 4) * numOfV))
    );
    let ind = new Uint32Array(dataBuf.slice(ptr, (ptr += 4 * numOfI)));

    prs.prims.push(new dsPrim(window.gl.TRIANGLES, v, ind));
    prs.prims[i].mtlNo = dsRnd.mtl.mtlSize + mtlNo;
    if (i === 0)
      (prs.minBB = prs.prims[0].minBB), (prs.maxBB = prs.prims[0].maxBB);
    else {
      if (prs.minBB.x > prs.prims[i].minBB.x)
        prs.minBB.x = prs.prims[i].minBB.x;
      if (prs.maxBB.x < prs.prims[i].maxBB.x)
        prs.maxBB.x = prs.prims[i].maxBB.x;

      if (prs.minBB.y > prs.prims[i].minBB.y)
        prs.minBB.y = prs.prims[i].minBB.y;
      if (prs.maxBB.y < prs.prims[i].maxBB.y)
        prs.maxBB.y = prs.prims[i].maxBB.y;

      if (prs.minBB.z > prs.prims[i].minBB.z)
        prs.minBB.z = prs.prims[i].minBB.z;
      if (prs.maxBB.z < prs.prims[i].maxBB.z)
        prs.maxBB.z = prs.prims[i].maxBB.z;
    }
  }

  for (let m = 0; m < numOfMaterials; m++) {
    const mtlName = buf
      .slice(ptr, (ptr += 300))
      .reduce(
        (res_str, ch) => (res_str += ch == 0 ? "" : String.fromCharCode(ch)),
        ""
      );
    let s = new Float32Array(dataBuf.slice(ptr, (ptr += 4 * 11)));
    let txtarr = new Int32Array(dataBuf.slice(ptr, (ptr += 4 * 8)));
    let mtl = new dsMtl(
      mtlName,
      vec3(s[0], s[1], s[2]),
      vec3(s[3], s[4], s[5]),
      vec3(s[6], s[7], s[8]),
      s[9],
      s[10],
      0
    );
    for (let i = 0; i < 8; i++)
      mtl.tex[i] = txtarr[i] == -1 ? -1 : txtarr[i] + dsRnd.tex.texSize;
    dsRnd.mtl.add(mtl);

    ptr += 300 + 4;
  }

  for (let t = 0; t < numOfTextures; t++) {
    const texName = buf
      .slice(ptr, (ptr += 300))
      .reduce(
        (res_str, ch) => (res_str += ch == 0 ? "" : String.fromCharCode(ch)),
        ""
      );

    let [w, h, c] = new Uint32Array(dataBuf.slice(ptr, (ptr += 4 * 3)));
    let bits = buf.slice(ptr, (ptr += w * h * c));

    for (let i = 0; i < bits.length; i += 4) {
      const t = bits[i];
      bits[i] = bits[i + 2];
      bits[i + 2] = t;
    }

    dsRnd.tex.addImg(texName, bits, w, h);
  }

  return prs;
}
