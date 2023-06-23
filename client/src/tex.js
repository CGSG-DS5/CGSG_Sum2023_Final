export class dsTexture {
  constructor(name, texId, isCube) {
    this.name = name;
    this.id = texId;
    if (isCube === undefined) this.isCube = false;
    else this.isCube = isCube;
  }
}

export function dsRndTexture() {
  this.textures = [];
  this.texSize = 0;

  this.add = (fileName) => {
    const n = this.texSize++;
    const gl = window.gl;

    this.textures[n] = new dsTexture(fileName, gl.createTexture());

    const img = new Image();
    img.src = "../bin/textures/" + fileName;
    img.onload = () => {
      gl.bindTexture(gl.TEXTURE_2D, this.textures[n].id);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
      gl.generateMipmap(gl.TEXTURE_2D);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
      gl.texParameteri(
        gl.TEXTURE_2D,
        gl.TEXTURE_MIN_FILTER,
        gl.LINEAR_MIPMAP_LINEAR
      );
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    };

    return n;
  };

  this.addImg = (name, bits, w, h) => {
    const n = this.texSize++;
    const gl = window.gl;

    this.textures[n] = new dsTexture(name, gl.createTexture());

    gl.bindTexture(gl.TEXTURE_2D, this.textures[n].id);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      w,
      h,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      new Uint8Array(bits)
    );
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    gl.texParameteri(
      gl.TEXTURE_2D,
      gl.TEXTURE_MIN_FILTER,
      gl.LINEAR_MIPMAP_LINEAR
    );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    return n;
  };

  this.addCubeMap = (dirName) => {
    const n = this.texSize++;
    const gl = window.gl;
    const names = ["PosX", "NegX", "PosY", "NegY", "PosZ", "NegZ"];

    this.textures[n] = new dsTexture(dirName, gl.createTexture(), true);
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, this.textures[n].id);

    gl.texParameteri(
      gl.TEXTURE_CUBE_MAP,
      gl.TEXTURE_MIN_FILTER,
      gl.LINEAR_MIPMAP_LINEAR
    );
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_R, gl.CLAMP_TO_EDGE);

    for (let i = 0; i < 6; i++) {
      const buf = dirName + "/" + names[i] + ".png";
      const img = new Image();
      img.src = "../bin/textures/skyboxes/" + buf;
      img.onload = () => {
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, this.textures[n].id);
        gl.texSubImage2D(
          gl.TEXTURE_CUBE_MAP_POSITIVE_X + i,
          0,
          0,
          0,
          gl.RGBA,
          gl.UNSIGNED_BYTE,
          img
        );
      };
    }

    // gl.generateMipmap(gl.TEXTURE_CUBE_MAP);

    return n;
  };

  return this;
}
