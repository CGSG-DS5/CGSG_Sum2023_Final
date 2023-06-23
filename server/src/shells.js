const { obbIntersection } = require("./collisions.js");
const { walls } = require("./map.js");
const { r2d } = require("./mth.js");
const {
  matrRotateX,
  matrRotateY,
  matrTranslate,
  matrScale,
} = require("./mthmat4.js");
const { vec3 } = require("./mthvec3.js");
const { timer } = require("./timer.js");

const gravA = 9.80665;
const vecGravA = vec3(0, -gravA, 0);

const shellMaxBB = vec3(
  18.71737289428711,
  128.31964111328125,
  16.417083740234375
);
const shellMinBB = vec3(
  -16.124454498291016,
  -0.26452600955963135,
  -16.224533081054688
);

const hitBox = [
  vec3(shellMinBB.x, shellMinBB.y, shellMinBB.z),
  vec3(shellMinBB.x, shellMinBB.y, shellMaxBB.z),
  vec3(shellMinBB.x, shellMaxBB.y, shellMinBB.z),
  vec3(shellMaxBB.x, shellMinBB.y, shellMinBB.z),
];

function pointInCube(point, pos, xVector, yVector, zVector) {
  const diff = point.sub(pos);
  const relPos = vec3(
    diff.dot(xVector.norm()),
    diff.dot(yVector.norm()),
    diff.dot(zVector.norm())
  );
  return (
    relPos.x >= 0 &&
    relPos.y >= 0 &&
    relPos.z >= 0 &&
    relPos.x * relPos.x <= xVector.len2() &&
    relPos.y * relPos.y <= yVector.len2() &&
    relPos.z * relPos.z <= zVector.len2()
  );
}

const baseShellMatr = matrScale(
  vec3(1 / (shellMaxBB.z - shellMinBB.z)).mulNum(0.2)
).mulMatr(matrRotateX(180));

function countShellMatr(pos, speed) {
  const dist = speed.len();
  const cosT = speed.y / dist;
  const sinT = Math.sqrt(1 - cosT * cosT);
  const plen = dist * sinT;
  const cosP = speed.z / plen;
  const sinP = speed.x / plen;

  const azimuth = r2d(Math.atan2(sinP, cosP));
  const elevator = r2d(Math.atan2(sinT, cosT));

  return baseShellMatr
    .mulMatr(matrRotateX(elevator))
    .mulMatr(matrRotateY(azimuth))
    .mulMatr(matrTranslate(pos));
}

const shellR =
  shellMaxBB
    .pointTransform(baseShellMatr)
    .sub(shellMinBB.pointTransform(baseShellMatr))
    .len() / 2;
const shellR2 = shellR * shellR;

class dsShells {
  constructor() {
    this.shells = [];
  }

  add = (pos, speed, damage) => {
    const m = countShellMatr(pos, speed);
    const hb = [];
    for (let i = 0; i < hitBox.length; i++) hb[i] = hitBox[i].pointTransform(m);
    this.shells.push({
      pos: pos,
      speed: speed,
      time: 0,
      damage: damage,
      matr: m,
      hitbox: hb,
    });
  };
  update = (tanks, r) => {
    for (let i = 0; i < this.shells.length; i++) {
      if (this.shells[i].pos.y < 0) this.shells.splice(i, 1);
      else {
        this.shells[i].pos = this.shells[i].pos
          .add(this.shells[i].speed.mulNum(timer.localDeltaTime))
          .add(
            vecGravA.mulNum((timer.localDeltaTime * timer.localDeltaTime) / 2)
          );
        this.shells[i].speed.y -= gravA * timer.localDeltaTime;
        this.shells[i].speed.time += timer.localDeltaTime;
        this.shells[i].matr = countShellMatr(
          this.shells[i].pos,
          this.shells[i].speed
        );
        const newhb = [];
        for (let j = 0; j < hitBox.length; j++)
          newhb[j] = hitBox[j].pointTransform(this.shells[i].matr);

        // this.shells[i].hitbox = newhb;
        const hboxMove = [this.shells[i].hitbox[0]];
        for (let j = 1; j < 4; j++)
          hboxMove[j] = hboxMove[0].add(newhb[j].sub(this.shells[i].hitbox[j]));
        // if (tanks[t].pos.sub(this.shells[i].pos).len2() < 10)
        let flag = true;
        for (let t = 0; t < tanks.length; t++) {
          if (
            tanks[t].pos.sub(this.shells[i].pos).len2() >
            (r + shellR) * (r + shellR)
          )
            continue;
          if (
            obbIntersection(newhb, tanks[t].hitbox) !== null ||
            obbIntersection(newhb, tanks[t].hitboxTw) !== null
          ) {
            tanks[t].hitPoints -= this.shells[i].damage;
            this.shells.splice(i, 1);
            i--;
            flag = false;
            break;
          }
        }
        if (flag) {
          for (let w = 0; w < walls.length; w++) {
            if (
              walls[w].pos.sub(this.shells[i].pos).len2() >
              (walls[w].r + shellR) * (walls[w].r + shellR)
            )
              continue;
            if (obbIntersection(newhb, walls[w].hitbox) !== null) {
              this.shells.splice(i, 1);
              i--;
              flag = false;
              break;
            }
          }
          if (flag) this.shells[i].hitbox = newhb;
        }
      }
    }
  };
}

module.exports.dsShells = dsShells;
