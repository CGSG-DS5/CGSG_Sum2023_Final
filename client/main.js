import { io } from "socket.io-client";
import { primsLoad } from "./src/prims";
import {
  _dsVert,
  dsPrim,
  dsRender,
  dsRndShdAddnonF,
  dsRndShdAddnonI,
  dsVert,
} from "./src/rnd";
import { uniform_buffer } from "./src/buffer";
import {
  matrIdentity,
  matrRotateX,
  matrRotateY,
  matrScale,
  matrTranslate,
} from "./src/mthmat4";
import { dsMtl } from "./src/mtl";
import { d2r, r2d } from "./src/mth";
import { vec3, vec3Fromvec3 } from "./src/mthvec3";
import { vec2 } from "./src/mthvec2";
import { vec4 } from "./src/mthvec4";
import { matrFromMatr } from "./src/mthmat4";
import { createHexahedron } from "./src/plathon";

let tankPrims = null;
let skyPrim = null;
let groundPrim = null;
let shellPrim = null;
let reloadPrim = null;
let hpPrim = null;
let wallPrim = null;
export let dsRnd;
export let camUBO;
export let timeFromServer = 0;

function renderInit() {
  // System
  dsRnd = new dsRender();
  camUBO = new uniform_buffer("CamUBO", 80, 2);

  // Shells
  primsLoad("../bin/models/bomb.g3dm").then((res) => {
    const mtl = new dsMtl(
      "Shell material",
      vec3(0.24725, 0.1995, 0.0745),
      vec3(0.75164, 0.60648, 0.22648),
      vec3(0.628281, 0.555802, 0.366065),
      51.2,
      1,
      0
    );
    shellPrim = res;
    for (let i = 0; i < shellPrim.numOfPrims; i++)
      shellPrim.prims[i].mtlNo = dsRnd.mtl.add(mtl);
  });

  // Tank
  primsLoad("../bin/models/Sherman.g3dm").then((res) => {
    tankPrims = res;
    const n = dsRnd.shd.add("tank");
    for (let i = 0; i < tankPrims.numOfPrims; i++)
      dsRnd.mtl.get(tankPrims.prims[i].mtlNo).shdNo = n;
  });

  // Sky
  let v = [
    dsVert(vec3(-1, 1, 0), vec2(0), vec3(0), vec4(0)),
    dsVert(vec3(-1, -1, 0), vec2(0), vec3(0), vec4(0)),
    dsVert(vec3(1, 1, 0), vec2(0), vec3(0), vec4(0)),
    dsVert(vec3(1, -1, 0), vec2(0), vec3(0), vec4(0)),
  ];
  skyPrim = new dsPrim(window.gl.TRIANGLE_STRIP, v, null);
  let mtl = new dsMtl(
    "Sky material",
    dsRnd.mtl.mtls[0].ka,
    dsRnd.mtl.mtls[0].kd,
    dsRnd.mtl.mtls[0].ks,
    dsRnd.mtl.mtls[0].ph,
    1,
    0
  );
  mtl.tex[0] = dsRnd.tex.add("starSkytex.png");
  mtl.shdNo = dsRnd.shd.add("sky");
  skyPrim.mtlNo = dsRnd.mtl.add(mtl);

  // Ground
  v = [
    dsVert(vec3(-200, 0, -200), vec2(-1, -1), vec3(0, 1, 0), vec4(0)),
    dsVert(vec3(-200, 0, 200), vec2(-1, 1), vec3(0, 1, 0), vec4(0)),
    dsVert(vec3(200, 0, -200), vec2(1, -1), vec3(0, 1, 0), vec4(0)),
    dsVert(vec3(200, 0, 200), vec2(1, 1), vec3(0, 1, 0), vec4(0)),
  ];

  // v = [
  //   dsVert(vec3(-1.25, 1.5, -2.8), vec2(0), vec3(0, 1, 0), vec4(0)),
  //   dsVert(vec3(1.25, 1.5, -2.8), vec2(0), vec3(0, 1, 0), vec4(0)),
  //   dsVert(vec3(-1.25, 1.5, 2.4), vec2(0), vec3(0, 1, 0), vec4(0)),
  //   dsVert(vec3(1.25, 1.5, 2.4), vec2(0), vec3(0, 1, 0), vec4(0)),
  // ];

  // v = [
  //   dsVert(vec3(-1, 1.85, -1.25), vec2(0), vec3(0, 1, 0), vec4(0)),
  //   dsVert(vec3(1, 1.85, -1.25), vec2(0), vec3(0, 1, 0), vec4(0)),
  //   dsVert(vec3(-1, 1.85, 0.9), vec2(0), vec3(0, 1, 0), vec4(0)),
  //   dsVert(vec3(1, 1.85, 0.9), vec2(0), vec3(0, 1, 0), vec4(0)),
  // ];

  // v = [
  //   dsVert(vec3(-1, 2.5, -1.25), vec2(0), vec3(0, 1, 0), vec4(0)),
  //   dsVert(vec3(1, 2.5, -1.25), vec2(0), vec3(0, 1, 0), vec4(0)),
  //   dsVert(vec3(-1, 2.5, 0.9), vec2(0), vec3(0, 1, 0), vec4(0)),
  //   dsVert(vec3(1, 2.5, 0.9), vec2(0), vec3(0, 1, 0), vec4(0)),
  // ];
  groundPrim = new dsPrim(window.gl.TRIANGLE_STRIP, v, null);
  mtl = new dsMtl(
    "Ground material",
    dsRnd.mtl.mtls[0].ka,
    dsRnd.mtl.mtls[0].kd,
    vec3(0.07, 0.05, 0.01),
    dsRnd.mtl.mtls[0].ph,
    1,
    0
  );
  mtl.tex[0] = dsRnd.tex.add("dirtTex.jpg");
  mtl.shdNo = dsRnd.shd.add("ground");
  groundPrim.mtlNo = dsRnd.mtl.add(mtl);

  // Wall
  wallPrim = createHexahedron(matrIdentity());
  mtl = new dsMtl(
    "Wall material",
    dsRnd.mtl.mtls[0].ka,
    dsRnd.mtl.mtls[0].kd,
    dsRnd.mtl.mtls[0].ks,
    dsRnd.mtl.mtls[0].ph,
    1,
    0
  );
  // mtl.tex[0] = dsRnd.tex.add("wallTex.jpg");
  mtl.shdNo = dsRnd.shd.add("wall");
  wallPrim.mtlNo = dsRnd.mtl.add(mtl);

  // Reload
  v = [
    dsVert(vec3(-1, 1, 0), vec2(0), vec3(0), vec4(0)),
    dsVert(vec3(-1, -1, 0), vec2(0), vec3(0), vec4(0)),
    dsVert(vec3(1, 1, 0), vec2(0), vec3(0), vec4(0)),
    dsVert(vec3(1, -1, 0), vec2(0), vec3(0), vec4(0)),
  ];
  reloadPrim = new dsPrim(window.gl.TRIANGLE_STRIP, v, null);
  mtl = new dsMtl(
    "Reload tank material",
    dsRnd.mtl.mtls[0].ka,
    dsRnd.mtl.mtls[0].kd,
    dsRnd.mtl.mtls[0].ks,
    dsRnd.mtl.mtls[0].ph,
    1,
    0
  );
  mtl.shdNo = dsRnd.shd.add("tankReload");
  reloadPrim.mtlNo = dsRnd.mtl.add(mtl);

  // Hp
  v = [
    dsVert(vec3(-1.5, 0, 0), vec2(0), vec3(0), vec4(0)),
    dsVert(vec3(1.5, 0, 0), vec2(0), vec3(0), vec4(0)),
    dsVert(vec3(-1.5, 0.25, 0), vec2(0), vec3(0), vec4(0)),
    dsVert(vec3(1.5, 0.25, 0), vec2(0), vec3(0), vec4(0)),
  ];
  hpPrim = new dsPrim(window.gl.TRIANGLE_STRIP, v, null);
  mtl = new dsMtl(
    "Hitpoints tank material",
    dsRnd.mtl.mtls[0].ka,
    dsRnd.mtl.mtls[0].kd,
    dsRnd.mtl.mtls[0].ks,
    dsRnd.mtl.mtls[0].ph,
    1,
    0
  );
  mtl.shdNo = dsRnd.shd.add("tankHP");
  hpPrim.mtlNo = dsRnd.mtl.add(mtl);
}

function renderAll(data) {
  camUBO.update(data.camBuf);
  dsRnd.start();
  timeFromServer = data.time;

  const vp = matrFromMatr(data.vp);

  // Sky
  window.gl.depthMask(false);
  skyPrim.draw(matrIdentity(), vp);
  window.gl.depthMask(true);

  // Ground
  groundPrim.draw(matrIdentity(), vp);

  // Tanks
  if (tankPrims !== null)
    for (let i = 0; i < data.clients.length; i++) {
      tankPrims.trans = matrFromMatr(data.clients[i].trans);
      for (let j = 0; j <= 3; j++)
        tankPrims.prims[j].trans = matrFromMatr(data.clients[i].matrtower);
      for (let j = 5; j <= 6; j++)
        tankPrims.prims[j].trans = matrFromMatr(data.clients[i].matrtower);
      tankPrims.prims[14].trans = matrFromMatr(data.clients[i].matrtower);
      tankPrims.prims[15].trans = matrFromMatr(data.clients[i].matrgun).mulMatr(
        matrFromMatr(data.clients[i].matrtower)
      );
      tankPrims.prims[16].trans = matrFromMatr(data.clients[i].matrdisk);

      // Tank model
      dsRndShdAddnonF[0] = d2r(data.clients[i].f0);
      dsRndShdAddnonF[1] = Math.cos(dsRndShdAddnonF[0]);
      dsRndShdAddnonF[2] = Math.sin(dsRndShdAddnonF[0]);

      dsRndShdAddnonI[2] = data.clients[i].i2;
      dsRndShdAddnonI[3] = data.clients[i].i3;

      tankPrims.draw(matrIdentity(), vp);

      // HitPoints bar
      if (data.numOfClient !== i) {
        dsRndShdAddnonF[0] = data.clients[i].hp;
        dsRndShdAddnonF[1] = data.clients[i].maxHp;
        hpPrim.draw(data.clients[i].matrPos, vp);
      }
    }

  // Shells
  if (shellPrim !== null)
    for (let i = 0; i < data.shells.length; i++) {
      shellPrim.draw(data.shells[i].matr, vp);
    }

  // Reload circle (+ hp)
  if (tankPrims !== null) {
    dsRndShdAddnonF[0] = 1 - Math.max(data.reloading, 0) / data.reloadTime;
    dsRndShdAddnonF[1] = data.hp / data.maxHp;
    reloadPrim.draw(matrIdentity(), vp);
  }

  // Walls
  for (let i = 0; i < data.walls.length; i++) {
    const scX = data.walls[i].maxBB.x - data.walls[i].minBB.x;
    const scY = data.walls[i].maxBB.y - data.walls[i].minBB.y;
    const scZ = data.walls[i].maxBB.z - data.walls[i].minBB.z;
    // dsRndShdAddnonF[0] = (Math.max(scX, scZ) * data.wallsSc) / 5;
    // dsRndShdAddnonF[1] = (scY * data.wallsSc) / 5;
    wallPrim.draw(
      matrScale(vec3(scX * data.wallsSc, scY, scZ * data.wallsSc)).mulMatr(
        matrTranslate(vec3Fromvec3(data.walls[i].minBB).mulNum(data.wallsSc))
      ),
      vp
    );
  }

  const can = document.getElementById("dsCan2D");
  const ctx = can.getContext("2d");
  ctx.clearRect(0, 0, can.width, can.height);
  if (data.hp <= 0) {
    ctx.fillStyle = "black";
    ctx.globalAlpha = 0.5;
    ctx.fillRect(0, 0, can.width, can.height);
    ctx.globalAlpha = 1;
    ctx.fillStyle = "white";
    ctx.font = "30px sans-serif";
    ctx.fillText("Tank is destroyed", can.width / 2 - 30 * 4, can.height / 2);
    ctx.fillText(
      "Press 'R' to restart",
      can.width / 2 - 30 * 4,
      can.height / 2 + 30
    );
  }
}

function resize(socket) {
  let tagW = document.getElementById("windowW");
  let tagWT = document.getElementById("windowWText");
  window.gl.canvas.width = parseInt(tagW.value);
  tagWT.innerHTML = "FrameW:" + tagW.value;

  let tagH = document.getElementById("windowH");
  let tagHT = document.getElementById("windowHText");
  window.gl.canvas.height = parseInt(tagH.value);
  tagHT.innerHTML = "FrameH:" + tagH.value;

  const can2D = document.getElementById("dsCan2D");
  can2D.width = window.gl.canvas.width;
  can2D.height = window.gl.canvas.height;

  socket.emit("Resize", window.gl.canvas.width, window.gl.canvas.height);
  window.gl.viewport(0, 0, window.gl.canvas.width, window.gl.canvas.height);
  sessionStorage.setItem(
    "screen",
    JSON.stringify({ w: tagW.value, h: tagH.value })
  );
}

const controls = {
  keys: [],
  mouseLB: false,
  mouseRB: false,
  mdx: 0,
  mdy: 0,
  mdz: 0,
};

let isPressedF4 = false;
let isFullScreen = false;
let inputSend = () => {};

async function main() {
  const socket = io();

  // client-side
  socket.on("connect", () => {
    renderInit();
    console.log(socket.id); // x8WIv7-mJelg7on_ALbx
    resize(socket);

    // Resize by sliders
    document.getElementById("windowW").addEventListener("input", () => {
      resize(socket);
    });
    document.getElementById("windowH").addEventListener("input", () => {
      resize(socket);
    });

    // Hiding cursor
    document.getElementById("hide").addEventListener("click", async () => {
      await document
        .getElementById("dsCan")
        .requestPointerLock({ unadjustedMovement: true });
    });
    document.getElementById("dsCan2D").onclick = async () => {
      await document
        .getElementById("dsCan")
        .requestPointerLock({ unadjustedMovement: true });
    };

    // Controls
    window.addEventListener("mousemove", (e) => {
      controls.mdx += e.movementX;
      controls.mdy += e.movementY;
    });
    window.addEventListener("mousedown", (e) => {
      if (e.button === 0) controls.mouseLB = true;
      else if (e.button === 2) controls.mouseRB = true;
    });
    window.addEventListener("mouseup", (e) => {
      if (e.button === 0) controls.mouseLB = false;
      else if (e.button === 2) controls.mouseRB = false;
    });
    window.addEventListener("mousewheel", (e) => {
      controls.mdz += e.deltaY;
    });
    window.addEventListener("keydown", (e) => {
      if (e.code === "F4" && !isPressedF4) {
        isPressedF4 = true;
        isFullScreen = !isFullScreen;
        const wrapper = document.getElementById("wrapper");
        if (isFullScreen) wrapper.style.position = "absolute";
        else wrapper.style.position = "relative";
      }
      controls.keys.push({ code: e.keyCode, status: 1 });
    });
    window.addEventListener("keyup", (e) => {
      if (`${e.code}` === "F4") isPressedF4 = false;
      controls.keys.push({ code: e.keyCode, status: 0 });
    });
    inputSend = () => {
      socket.emit("Controls", controls);
      controls.mdx = controls.mdy = controls.mdz = 0;
      controls.keys = [];
    };

    socket.on("ClientRender", (data) => {
      inputSend();
      renderAll(data);
    });
  });

  socket.on("disconnect", () => {
    console.log(socket.id); // undefined
  });
}

window.addEventListener("load", (event) => {
  main();
});
