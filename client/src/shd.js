class dsShader {
  constructor(name, progId) {
    this.progId = progId;
    this.name = name;
  }
}

// Shader class constructor function
export function dsRndShader(gl) {
  // Shader program load function
  this.load = (fileNamePrefix) => {
    const shds = [
      ["vert", gl.VERTEX_SHADER],
      ["frag", gl.FRAGMENT_SHADER],
    ];
    let proms = [];
    for (let i = 0; i < shds.length; i++) {
      const buf =
        "../bin/shaders/" + fileNamePrefix + "/" + shds[i][0] + ".glsl";

      proms[i] = fetch(buf)
        .then((res) => res.text())
        .then((data) => {
          shds[i][2] = gl.createShader(shds[i][1]);

          gl.shaderSource(shds[i][2], data);
          gl.compileShader(shds[i][2]);

          if (!gl.getShaderParameter(shds[i][2], gl.COMPILE_STATUS)) {
            const buf1 = gl.getShaderInfoLog(shds[i][2]);
            console.log(buf + ":" + "\n" + buf1);
          }
        });
    }
    const n = this.shaderSize;
    this.shaders[n] = new dsShader(fileNamePrefix, undefined);
    Promise.all(proms).then(() => {
      const program = gl.createProgram();
      for (let i = 0; i < shds.length; i++)
        gl.attachShader(program, shds[i][2]);
      gl.linkProgram(program);

      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        const Buf = gl.getProgramInfoLog(program);
        console.log(Buf);
      }
      this.shaders[n] = new dsShader(fileNamePrefix, program);
    });
  };

  // Add shader function
  this.add = (shaderFileNamePrefix) => {
    for (let i = 0; i < this.shaderSize; i++)
      if (this.shaders[i].name === shaderFileNamePrefix) return i;

    this.load(shaderFileNamePrefix);
    return this.shaderSize++;
  };

  this.shdGet = (shdNo) => {
    if (shdNo < 0 || shdNo >= this.shaderSize) return this.shaders[0];
    return this.shaders[shdNo];
  };

  this.shaderSize = 0;
  this.shaders = [];
  this.add("default");

  return this;
}
