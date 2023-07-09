// Server imports
const http = require("http");
const express = require("express");
const fs = require("fs");
const morgan = require("morgan");
const { Server } = require("socket.io");

//
const { matrScale, matrIdentity } = require("./src/mthmat4.js");
const { vec3 } = require("./src/mthvec3.js");
const { dsCamera, createBuf } = require("./src/mthcam.js");
const { dsTimer, timer } = require("./src/timer.js");
const { r2d } = require("./src/mth.js");
const { matrRotateY, matrTranslate, matrRotateX } = require("./src/mthmat4.js");
const { dsShells, pointInCube } = require("./src/shells.js");
const { obbIntersection } = require("./src/collisions.js");
const { mapLoad, walls, resps } = require("./src/map.js");

const app = express();
app.use(morgan("combined"));
app.use(express.static("."));

const clients = [];
const clientsData = [];

mapLoad("bin/map.g32");

// Server initialization
const server = http.createServer(app);
const io = new Server(server);

// const tankHitbox = [
//   vec3(-1.25, 0, -2.8),
//   vec3(1.25, 0, -2.8),
//   vec3(-1.25, 0, 2.4),
//   vec3(1.25, 0, 2.4),
// ];

const tankHitbox = [
  vec3(-1.25, 0, -2.8),
  vec3(1.25, 0, -2.8),
  vec3(-1.25, 1.5, -2.8),
  vec3(-1.25, 0, 2.4),
];

const tankTowerHitbox = [
  vec3(-1, 1.85, -1.25),
  vec3(1, 1.85, -1.25),
  vec3(-1, 2.5, -1.25),
  vec3(-1, 1.85, 0.9),
];

let prevResp = 0;

io.on("connection", (socket) => {
  clients.push(socket);

  // console.log(`Client connected with id: ${socket.id}`);
  let pos;
  if (resps.length === 0) pos = vec3(0);
  else {
    const t = resps[(prevResp = (prevResp + 1) % resps.length)];
    pos = vec3(t.x / 2, 0, t.y / 2);
  }
  const anglY = 0;
  const trans = matrTankSc
    .mulMatr(matrRotateY(anglY))
    .mulMatr(matrTranslate(pos));
  const htbx = [];
  for (let i = 0; i < tankHitbox.length; i++)
    htbx[i] = tankHitbox[i].pointTransform(trans);
  const htbxTw = [];
  for (let i = 0; i < tankTowerHitbox.length; i++)
    htbxTw[i] = tankTowerHitbox[i].pointTransform(trans);
  clientsData.push({
    // Camera
    cam: new dsCamera(),
    // Tank
    pos: pos,
    anglWheels: 0,
    anglTower: 0,
    anglGun: 0,
    anglY: anglY,
    trans: trans,
    matrtower: matrIdentity(),
    matrgun: matrIdentity(),
    matrdisk: matrIdentity(),
    hitPoints: 100,
    maxHitPoints: 100,
    reloading: 0,
    reloadTime: 1, // <---- 3
    hitbox: htbx,
    hitboxTw: htbxTw,
    veloc: vec3(0),
    maxVeloc: 14,
    accel: 10,
    // Input
    input: {
      keys: [],
      keysClick: [],
      keysOld: [],
      mdx: 0,
      mdy: 0,
      mdz: 0,
      isLB: 0,
      isRB: 0,
    },
  });
  for (let i = 0; i < 256; i++)
    clientsData[clientsData.length - 1].input.keys[i] =
      clientsData[clientsData.length - 1].input.keysClick[i] =
      clientsData[clientsData.length - 1].input.keysOld[i] =
        0;

  socket.on("Resize", (w, h) => {
    // console.log(`Resize client: ${socket.id} (${w}:${h})`);
    clientsData[clients.indexOf(socket)].cam.setSize(w, h);
  });

  socket.on("Controls", (ctrl) => {
    const n = clients.indexOf(socket);
    for (let i = 0; i < ctrl.keys.length; i++) {
      clientsData[n].input.keysOld[ctrl.keys[i].code] =
        clientsData[n].input.keys[ctrl.keys[i].code];
      clientsData[n].input.keys[ctrl.keys[i].code] = ctrl.keys[i].status;
      clientsData[n].input.keysClick[ctrl.keys[i].code] =
        clientsData[n].input.keysOld[ctrl.keys[i].code] === 0
          ? clientsData[n].input.keys[ctrl.keys[i].code]
          : 0;
    }
    clientsData[n].input.mdx += ctrl.mdx;
    clientsData[n].input.mdy += ctrl.mdy;
    clientsData[n].input.mdz += ctrl.mdz;
    clientsData[n].input.isLB = ctrl.mouseLB;
    clientsData[n].input.isRB = ctrl.mouseRB;
  });

  socket.on("Keys", (keyCode, t) => {
    // console.log(`Client ${socket.id} ${t === 1 ? "down" : "up"} (${keyCode})`);
    // if (t === 0) debugger;
    const n = clients.indexOf(socket);
    clientsData[n].input.keysOld[keyCode] = clientsData[n].input.keys[keyCode];
    clientsData[n].input.keys[keyCode] = t;
    clientsData[n].input.keysClick[keyCode] =
      clientsData[n].input.keysOld[keyCode] === 0 ? t : 0;
  });

  socket.on("MouseMove", (movementX, movementY) => {
    // console.log(`Client ${socket.id} mouse (${movementX}, ${movementY})`);
    const n = clients.indexOf(socket);
    clientsData[n].input.mdx += movementX;
    clientsData[n].input.mdy += movementY;
  });

  socket.on("MouseWheel", (mdz) => {
    // console.log(`Client ${socket.id} mousewheel (${mdz})`);
    clientsData[clients.indexOf(socket)].input.mdz += mdz;
  });

  socket.on("MouseButton", (isLeft, isPressed) => {
    const n = clients.indexOf(socket);
    if (isLeft) clientsData[n].input.isLB = isPressed;
    else clientsData[n].input.isRB = isPressed;
  });

  socket.on("disconnect", () => {
    // console.log(`Client disconnected with id: ${socket.id}`);
    const index = clients.indexOf(socket);
    if (index > -1) {
      clients.splice(index, 1);
      clientsData.splice(index, 1);
    }
  });
});

server.listen(process.env.PORT || 5000, () => {
  //console.log(`Server started on port ${server.address().port} :)`);
});

const minBB14 = vec3(
  -1.0807340145111084,
  1.7068489789962769,
  -1.3057019710540771
);
const maxBB14 = vec3(1.0184940099716187, 3.145488977432251, 1.1283119916915894);

const minBB15 = vec3(
  -0.4896160066127777,
  1.941601037979126,
  0.8981029987335205
);
const maxBB15 = vec3(
  0.40872299671173096,
  2.4194679260253906,
  2.9164390563964844
);

const minBB16 = vec3(
  -1.3424769639968872,
  0.3764039874076843,
  2.090193033218384
);
const maxBB16 = vec3(
  1.2618680000305176,
  1.0724389553070068,
  2.7980010509490967
);

const matrTankSc = matrScale(vec3(2.743 / 3.151151977479458));
const tankR =
  (tankHitbox[0]
    .pointTransform(matrTankSc)
    .sub(
      tankHitbox[1]
        .pointTransform(matrTankSc)
        .add(
          tankHitbox[2]
            .pointTransform(matrTankSc)
            .sub(tankHitbox[0].pointTransform(matrTankSc))
        )
        .add(
          tankHitbox[3]
            .pointTransform(matrTankSc)
            .sub(tankHitbox[0].pointTransform(matrTankSc))
        )
    )
    .len() /
    2) *
  1.4;
const tankR2 = tankR * tankR;
const shells = new dsShells();

function updateClientData(data, ind) {
  if (data.input.keys[82] === 1 && data.hitPoints <= 0) {
    let pos;
    if (resps.length === 0) pos = vec3(0);
    else {
      const t = resps[(prevResp = (prevResp + 1) % resps.length)];
      pos = vec3(t.x / 2, 0, t.y / 2);
    }
    const anglY = 0;
    const trans = matrTankSc
      .mulMatr(matrRotateY(anglY))
      .mulMatr(matrTranslate(pos));
    const htbx = [];
    for (let i = 0; i < tankHitbox.length; i++)
      htbx[i] = tankHitbox[i].pointTransform(trans);
    const htbxTw = [];
    for (let i = 0; i < tankTowerHitbox.length; i++)
      htbxTw[i] = tankTowerHitbox[i].pointTransform(trans);
    clientsData[ind] = {
      // Camera
      cam: clientsData[ind].cam,
      // Tank
      pos: pos,
      anglWheels: 0,
      anglTower: 0,
      anglGun: 0,
      anglY: anglY,
      trans: trans,
      matrtower: matrIdentity(),
      matrgun: matrIdentity(),
      matrdisk: matrIdentity(),
      hitPoints: 100,
      maxHitPoints: 100,
      reloading: 0,
      reloadTime: 1, // <---- 3
      hitbox: htbx,
      hitboxTw: htbxTw,
      veloc: vec3(0),
      maxVeloc: 14,
      accel: 10,
      // Input
      input: {
        keys: [],
        keysClick: [],
        keysOld: [],
        mdx: 0,
        mdy: 0,
        mdz: 0,
        isLB: 0,
        isRB: 0,
      },
    };
    for (let i = 0; i < 256; i++)
      clientsData[ind].input.keys[i] =
        clientsData[ind].input.keysClick[i] =
        clientsData[ind].input.keysOld[i] =
          0;
  }

  /* Movement */
  let v = vec3(maxBB14.x, maxBB14.y, minBB14.z);
  let newPos = false;

  let vec = maxBB14
    .pointTransform(data.trans)
    .sub(v.pointTransform(data.trans))
    .norm();
  let vec1 = vec3(0, 1, 0).cross(vec).norm();

  if (data.hitPoints > 0) {
    if (data.veloc.len2() !== 0) {
      newPos = true;
      data.pos = data.pos.add(data.veloc.mulNum(timer.localDeltaTime)).add(
        data.veloc
          .norm()
          .mulNum(data.accel * (data.maxVeloc - data.veloc.len()))
          .mulNum(timer.localDeltaTime * timer.localDeltaTime)
      );
    }
    const velN = data.veloc.dot(vec1);
    data.veloc = data.veloc.add(
      vec
        .mulNum(
          data.accel *
            (data.input.keys[87] - data.input.keys[83]) *
            timer.localDeltaTime -
            (data.input.keys[87] - data.input.keys[83] === 0 ? 5 : 1) *
              data.veloc.dot(vec) *
              timer.localDeltaTime
        )
        .sub(vec1.mulNum(data.veloc.dot(vec1) * timer.localDeltaTime * 100))
    );
    if (data.veloc.dot(vec1) * velN < 0) {
      data.veloc = data.veloc.sub(vec1.mulNum(data.veloc.dot(vec1)));
    }
    // const velN1 = data.veloc.dot(vec1);
    // if (
    //   (velN1 < 0.001 && velN1 < 0.001) ||
    //   (velN1 > -0.001 && velN1 > -0.001)
    // ) {
    //   data.veloc = vec3(0);
    // }
    if (
      data.veloc.len2() <= 0.25 &&
      data.input.keys[87] - data.input.keys[83] === 0
    )
      data.veloc = vec3(0);
    else if (data.veloc.len2() >= data.maxVeloc * data.maxVeloc)
      data.veloc = data.veloc.norm().mulNum(data.maxVeloc);

    data.trans = matrTankSc
      .mulMatr(matrRotateY(data.anglY))
      .mulMatr(matrTranslate(data.pos));

    /* Collisions */
    // if (true) {
    //   for (let i = 0; i < tankHitbox.length; i++)
    //     data.hitbox[i] = tankHitbox[i].pointTransform(data.trans);
    //   for (let tks = 0; tks < clientsData.length; tks++) {
    //     if (ind === tks) continue;
    //     let pushVec = obbIntersection(data.hitbox, clientsData[tks].hitbox);
    //     if (pushVec !== null) {
    //       data.pos = data.pos.add(pushVec);
    //       data.trans = matrTankSc
    //         .mulMatr(matrRotateY(data.anglY))
    //         .mulMatr(matrTranslate(data.pos));
    //       for (let i = 0; i < tankHitbox.length; i++)
    //         data.hitbox[i] = tankHitbox[i].pointTransform(data.trans);
    //     }
    //   }
    // }
    // data.pos = data.pos.add(
    //   maxBB14
    //     .pointTransform(data.trans)
    //     .sub(v.pointTransform(data.trans))
    //     .mulNum(
    //       (data.input.keys[87] - data.input.keys[83]) * 5 * timer.localDeltaTime
    //     )
    // );

    // data.anglY +=
    //   (data.input.keys[87] - data.input.keys[83] !== 0
    //     ? 0.5 * (data.input.keys[87] - data.input.keys[83])
    //     : 1) *
    //   (data.input.keys[65] - data.input.keys[68]) *
    //   80 *
    //   timer.localDeltaTime;
    const l = data.veloc.len();
    data.anglY +=
      ((data.input.keys[65] - data.input.keys[68]) / (l / 4 < 1 ? 1 : l / 4)) *
      80 *
      timer.localDeltaTime;

    let dt =
      (data.input.keys[87] - data.input.keys[83]) * timer.localDeltaTime * 1000;
    if (dt === 0)
      dt =
        (data.input.keys[68] - data.input.keys[65]) *
        timer.localDeltaTime *
        1000;
    data.anglWheels += dt;
  } else {
    data.veloc = data.veloc.sub(
      vec1.mulNum(data.veloc.dot(vec1) * timer.localDeltaTime * 100)
    );
  }

  data.trans = matrTankSc
    .mulMatr(matrRotateY(data.anglY))
    .mulMatr(matrTranslate(data.pos));

  let dist = data.cam.at.sub(data.cam.loc).len();
  let cosT = (data.cam.loc.y - data.cam.at.y) / dist;
  let sinT = Math.sqrt(1 - cosT * cosT);
  let plen = dist * sinT;
  let cosP = (data.cam.loc.z - data.cam.at.z) / plen;
  let sinP = (data.cam.loc.x - data.cam.at.x) / plen;

  let azimuth = r2d(Math.atan2(sinP, cosP));
  let elevator = r2d(Math.atan2(sinT, cosT));

  azimuth -= timer.globalDeltaTime * data.input.mdx * 10;
  elevator -= timer.globalDeltaTime * data.input.mdy * 10;
  dist +=
    ((timer.globalDeltaTime *
      (data.input.mdz + 20 * (data.input.keys[34] - data.input.keys[33]))) /
      20) *
    dist;

  if (elevator < 0.1) elevator = 0.1;
  else if (elevator > 178.9) elevator = 178.9;
  if (dist < 0.1) dist = 0.1;

  let at = maxBB14
    .add(minBB14)
    .divNum(2)
    .add(vec3(0, 0.75, 0))
    .pointTransform(data.trans);

  let loc = vec3(0, dist, 0).pointTransform(
    matrRotateX(elevator)
      .mulMatr(matrRotateY(azimuth))
      .mulMatr(matrTranslate(at))
  );

  data.cam.camSet(loc, at, vec3(0, 1, 0));

  /* */
  let avrg = maxBB15.add(minBB15).divNum(2);

  /* Firing */
  if (data.reloading > 0) data.reloading -= timer.localDeltaTime;
  if (data.hitPoints > 0) {
    if (data.input.isLB && data.reloading <= 0) {
      let speed = avrg
        .pointTransform(
          data.matrgun.mulMatr(data.matrtower).mulMatr(data.trans)
        )
        .sub(
          vec3(avrg.x, avrg.y, minBB15.z).pointTransform(
            data.matrgun.mulMatr(data.matrtower).mulMatr(data.trans)
          )
        )
        .norm()
        .mulNum(100)
        .add(data.veloc); // Speed of shell (meters per second)
      let v = avrg;
      v.z = maxBB15.z + 0.5;
      v.y -= 0.06;
      let pos = v.pointTransform(
        data.matrgun.mulMatr(data.matrtower).mulMatr(data.trans)
      );
      shells.add(pos, speed, 27); // 27 --- damage
      data.reloading = data.reloadTime;
    }

    /* Rotating tower */
    let org = avrg.pointTransform(data.matrtower.mulMatr(data.trans));
    let t = data.cam.loc.sub(org).dot(data.cam.up) / data.cam.up.len2();
    let intrsc = data.cam.up.mulNum(t).add(org);
    let cosA =
      intrsc.sub(data.cam.at).dot(data.cam.dir) /
      (intrsc.sub(data.cam.at).len() * data.cam.dir.len());
    let angle = Math.acos(Math.max(Math.min(cosA, 1), -1));
    angle = r2d(angle);

    if (Math.abs(angle) > timer.localDeltaTime * 30) {
      let cosB =
        intrsc.sub(data.cam.at).dot(data.cam.right) /
        (intrsc.sub(data.cam.at).len() * data.cam.right.len());

      data.anglTower += (cosB > 0 ? 1 : -1) * timer.localDeltaTime * 30;
    } else {
      let cosB =
        intrsc.sub(data.cam.at).dot(data.cam.right) /
        (intrsc.sub(data.cam.at).len() * data.cam.right.len());

      data.anglTower += (cosB > 0 ? 1 : -1) * angle;
    }

    /* Rotating gun */
    org = avrg.pointTransform(
      data.matrgun.mulMatr(data.matrtower).mulMatr(data.trans)
    );
    t = data.cam.loc.sub(org).dot(data.cam.right) / data.cam.right.len2();
    intrsc = org.add(data.cam.right.mulNum(t));

    org = vec3(avrg.x, avrg.y, minBB15.z).pointTransform(
      data.matrgun.mulMatr(data.trans)
    );
    t = data.cam.loc.sub(org).dot(data.cam.right) / data.cam.right.len2();
    let intrsc1 = data.cam.right.mulNum(t).add(org);

    cosA =
      intrsc.sub(intrsc1).dot(data.cam.dir) /
      (intrsc.sub(intrsc1).len() * data.cam.dir.len());
    angle = Math.acos(Math.max(Math.min(cosA, 1), -1));
    angle = r2d(angle);

    if (Math.abs(angle) > timer.localDeltaTime * 10) {
      let cosB =
        intrsc.sub(intrsc1).dot(data.cam.up) /
        (intrsc.sub(intrsc1).len() * data.cam.up.len());

      data.anglGun += (cosB > 0 ? -1 : 1) * timer.localDeltaTime * 10;
      if (data.anglGun > 30) data.anglGun = 30;
      else if (data.anglGun < -10) data.anglGun = -10;
    }
  }

  const vtower = maxBB14.add(minBB14).divNum(2);
  let vgun = maxBB15.add(minBB15).divNum(2);
  vgun.z = minBB15.z;
  const vdisk = maxBB16.add(minBB16).divNum(2);

  data.matrtower = matrTranslate(vtower.neg())
    .mulMatr(matrRotateY(data.anglTower))
    .mulMatr(matrTranslate(vtower));
  data.matrgun = matrTranslate(vgun.neg())
    .mulMatr(matrRotateX(-data.anglGun))
    .mulMatr(matrTranslate(vgun));
  data.matrdisk = matrTranslate(vdisk.neg())
    .mulMatr(matrRotateX(data.anglWheels))
    .mulMatr(matrTranslate(vdisk));

  data.input.mdz = 0;
  data.input.mdy = data.input.mdx = 0;
}

let isRendering = false;

setInterval(() => {
  if (isRendering) {
    return;
  }
  isRendering = true;
  timer.response();
  const data = [];
  for (let i = 0; i < clients.length; i++) {
    updateClientData(clientsData[i], i);

    /* Collisions */
    for (let tks0 = 0; tks0 < clientsData.length; tks0++) {
      for (let i = 0; i < tankTowerHitbox.length; i++)
        clientsData[tks0].hitboxTw[i] = tankTowerHitbox[i].pointTransform(
          clientsData[tks0].matrtower.mulMatr(clientsData[tks0].trans)
        );
      for (let i = 0; i < tankHitbox.length; i++)
        clientsData[tks0].hitbox[i] = tankHitbox[i].pointTransform(
          clientsData[tks0].trans
        );
      for (let tks = 0; tks < clientsData.length; tks++) {
        if (tks0 === tks) continue;
        if (clientsData[tks0].pos.sub(clientsData[tks].pos).len2() > 4 * tankR2)
          continue;
        let pushVec = obbIntersection(
          clientsData[tks0].hitbox,
          clientsData[tks].hitbox
        );
        if (pushVec !== null) {
          clientsData[tks0].pos = clientsData[tks0].pos.add(
            pushVec.divNum(2).neg()
          );
          clientsData[tks].pos = clientsData[tks].pos.add(pushVec.divNum(2));
          // clientsData[tks0].veloc = pushVec.neg();
          // clientsData[tks].veloc = pushVec;
          clientsData[tks0].trans = matrTankSc
            .mulMatr(matrRotateY(clientsData[tks0].anglY))
            .mulMatr(matrTranslate(clientsData[tks0].pos));
          for (let j = 0; j < tankHitbox.length; j++)
            clientsData[tks0].hitbox[j] = tankHitbox[j].pointTransform(
              clientsData[tks0].trans
            );
        }
      }
    }
    /* With walls */
    for (let tks = 0; tks < clientsData.length; tks++) {
      for (let w = 0; w < walls.length; w++) {
        if (
          walls[w].pos.sub(clientsData[tks].pos).len2() >
          (tankR + walls[w].r) * (tankR + walls[w].r)
        )
          continue;
        let pushVec = obbIntersection(clientsData[tks].hitbox, walls[w].hitbox);
        if (pushVec !== null) {
          clientsData[tks].pos = clientsData[tks].pos.add(pushVec.neg());
          // clientsData[tks0].veloc = pushVec.neg();
          // clientsData[tks].veloc = pushVec;
          clientsData[tks].trans = matrTankSc
            .mulMatr(matrRotateY(clientsData[tks].anglY))
            .mulMatr(matrTranslate(clientsData[tks].pos));
          for (let j = 0; j < tankHitbox.length; j++)
            clientsData[tks].hitbox[j] = tankHitbox[j].pointTransform(
              clientsData[tks].trans
            );
        }
      }
    }

    data.push({
      trans: clientsData[i].trans,
      matrtower: clientsData[i].matrtower,
      matrgun: clientsData[i].matrgun,
      matrdisk: clientsData[i].matrdisk,
      f0: clientsData[i].anglWheels,
      i2: clientsData[i].input.keys[87] - clientsData[i].input.keys[83],
      i3: clientsData[i].input.keys[65] - clientsData[i].input.keys[68],
      hp: clientsData[i].hitPoints,
      maxHp: clientsData[i].maxHitPoints,
      matrPos: matrTranslate(clientsData[i].pos.add(vec3(0, 2.5, 0))),
    });
  }
  shells.update(clientsData, tankR);
  for (let i = 0; i < clients.length; i++) {
    let dist = clientsData[i].cam.at.sub(clientsData[i].cam.loc).len();
    let cosT = (clientsData[i].cam.loc.y - clientsData[i].cam.at.y) / dist;
    let sinT = Math.sqrt(1 - cosT * cosT);
    let plen = dist * sinT;
    let cosP = (clientsData[i].cam.loc.z - clientsData[i].cam.at.z) / plen;
    let sinP = (clientsData[i].cam.loc.x - clientsData[i].cam.at.x) / plen;

    let azimuth = r2d(Math.atan2(sinP, cosP));
    let elevator = r2d(Math.atan2(sinT, cosT));

    azimuth -= timer.globalDeltaTime * clientsData[i].input.mdx * 10;
    elevator -= timer.globalDeltaTime * clientsData[i].input.mdy * 10;
    dist +=
      ((timer.globalDeltaTime *
        (clientsData[i].input.mdz +
          20 *
            (clientsData[i].input.keys[34] - clientsData[i].input.keys[33]))) /
        20) *
      dist;

    if (elevator < 0.1) elevator = 0.1;
    else if (elevator > 178.9) elevator = 178.9;
    if (dist < 0.1) dist = 0.1;

    let at = maxBB14
      .add(minBB14)
      .divNum(2)
      .add(vec3(0, 0.75, 0))
      .pointTransform(clientsData[i].trans);

    let loc = vec3(0, dist, 0).pointTransform(
      matrRotateX(elevator)
        .mulMatr(matrRotateY(azimuth))
        .mulMatr(matrTranslate(at))
    );

    clientsData[i].cam.camSet(loc, at, vec3(0, 1, 0));
    clients[i].emit("ClientRender", {
      time: timer.localTime,
      clients: data,
      vp: clientsData[i].cam.matrVP,
      camBuf: clientsData[i].cam.ubo,
      reloadTime: clientsData[i].reloadTime,
      reloading: clientsData[i].reloading,
      shells: shells.shells,
      reloading: clientsData[i].reloading,
      reloadTime: clientsData[i].reloadTime,
      numOfClient: i,
      hp: clientsData[i].hitPoints,
      maxHp: clientsData[i].maxHitPoints,
      walls: walls,
      wallsSc: 0.5,
    });
  }
  isRendering = false;
}, 40);
