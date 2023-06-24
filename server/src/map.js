const fs = require("fs");
const path = require("path");

const { vec2 } = require("./mthvec2");
const { vec3 } = require("./mthvec3");

class wall {
  constructor(point, h) {
    if (h === undefined) {
      this.h = point.h;
      this.maxBB = point.maxBB;
      this.minBB = point.minBB;
    } else {
      this.h = h;
      this.maxBB = vec3(point.x, h, point.y);
      this.minBB = vec3(point.x, 0, point.y);
    }
    this.pos = vec3(0);
    this.r = 0;
    this.r2 = 0;
    this.hitbox = [];
  }

  add() {
    for (let i = 0; i < arguments.length; i++) {
      if (arguments[i].x < this.minBB.x) this.minBB.x = arguments[i].x;
      else if (arguments[i].x > this.maxBB.x) this.maxBB.x = arguments[i].x;

      if (arguments[i].y < this.minBB.z) this.minBB.z = arguments[i].y;
      else if (arguments[i].y > this.maxBB.z) this.maxBB.z = arguments[i].y;
    }
  }

  // return [
  //     this.minBB,
  //     vec3(this.maxBB.x, this.minBB.y, this.minBB.z),
  //     vec3(this.minBB.x, this.maxBB.y, this.minBB.z),
  //     vec3(this.minBB.x, this.minBB.y, this.maxBB.z),
  //   ];
}

let walls = [];
let resps = [];

async function mapLoad(fileName) {
  const str = path.resolve(__dirname, "../" + fileName);
  // const response = await fetch(str);
  // let dataBuf = await response.arrayBuffer();
  // let ptr = 0;

  // const [w, h] = new Uint16Array(dataBuf.slice(ptr, (ptr += 2 * 2)));
  // const bits = new Uint8Array(dataBuf.slice(ptr, (ptr += 4 * w * h)));
  fs.readFile(str, (err, data) => {
    if (err) return console.log(err);

    let ptr = 0;
    const [w, h] = new Uint16Array(data.buffer.slice(ptr, (ptr += 2 * 2)));
    const bits = new Uint8Array(data.buffer.slice(ptr, (ptr += 4 * w * h)));

    const prevWalls = [];
    const w4 = w * 4;
    const wallH = 10;

    for (let y = 0; y < h; y++) {
      let line = null;
      for (let x = 0; x < w; x++) {
        // if (y === 29 && x === 373) debugger;
        let color = bits[y * w4 + x * 4 + 2];
        if (
          bits[y * w4 + x * 4 + 1] >= 255 &&
          bits[y * w4 + x * 4 + 0] <= 0 &&
          bits[y * w4 + x * 4 + 2] <= 0
        ) {
          resps.push({ x: x - w / 2, y: y - h / 2 });
        }
        if (
          color > 100 &&
          bits[y * w4 + x * 4 + 0] < 100 &&
          bits[y * w4 + x * 4 + 1] < 100
        ) {
          if (line === null) line = { begin: x - w / 2, end: x - w / 2 };
          else line.end = x - w / 2;
        } else {
          if (line !== null) {
            if (prevWalls.length !== 0) {
              if (
                line.begin === prevWalls[0].minBB.x &&
                line.end === prevWalls[0].maxBB.x
              ) {
                prevWalls[0].add(
                  vec2(line.begin, y - h / 2),
                  vec2(line.end, y - h / 2)
                );
                const t = prevWalls[0];
                prevWalls.splice(0, 1);
                prevWalls.push(t);
              } else if (
                line.end > prevWalls[0].minBB.x &&
                y - h / 2 !== prevWalls[0].maxBB.z
              ) {
                prevWalls[0].maxBB.x++;
                prevWalls[0].maxBB.z++;

                walls.push(new wall(prevWalls[0]));
                prevWalls.splice(0, 1);

                prevWalls.push(new wall(vec2(line.begin, y - h / 2), wallH));
                prevWalls[prevWalls.length - 1].add(vec2(line.end, y - h / 2));
              } else {
                prevWalls.push(new wall(vec2(line.begin, y - h / 2), wallH));
                prevWalls[prevWalls.length - 1].add(vec2(line.end, y - h / 2));
              }
            } else {
              prevWalls.push(new wall(vec2(line.begin, y - h / 2), wallH));
              prevWalls[0].add(vec2(line.end, y - h / 2));
            }
            line = null;
          }
        }
      }
      if (line !== null) {
        if (prevWalls.length !== 0) {
          if (
            line.begin === prevWalls[0].minBB.x &&
            line.end === prevWalls[0].maxBB.x
          ) {
            prevWalls[0].add(
              vec2(line.begin, y - h / 2),
              vec2(line.end, y - h / 2)
            );
            const t = prevWalls[0];
            prevWalls.splice(0, 1);
            prevWalls.push(t);
          } else if (
            line.end > prevWalls[0].minBB.x &&
            y - h / 2 !== prevWalls[0].maxBB.z
          ) {
            prevWalls[0].maxBB.x++;
            prevWalls[0].maxBB.z++;

            walls.push(new wall(prevWalls[0]));
            prevWalls.splice(0, 1);

            prevWalls.push(new wall(vec2(line.begin, y - h / 2), wallH));
            prevWalls[prevWalls.length - 1].add(vec2(line.end, y - h / 2));
          } else {
            prevWalls.push(new wall(vec2(line.begin, y - h / 2), wallH));
            prevWalls[prevWalls.length - 1].add(vec2(line.end, y - h / 2));
          }
        } else {
          prevWalls.push(new wall(vec2(line.begin, y - h / 2), wallH));
          prevWalls[0].add(vec2(line.end, y - h / 2));
        }
        line = null;
      }
      for (let j = 0; j < prevWalls.length; j++) {
        if (prevWalls[j].maxBB.z !== y - h / 2) {
          prevWalls[j].maxBB.x++;
          prevWalls[j].maxBB.z++;

          walls.push(new wall(prevWalls[j]));
          prevWalls.splice(j, 1);
          j--;
        }
      }
    }
    for (let i = 0; i < prevWalls.length; i++) {
      prevWalls[i].maxBB.x++;
      prevWalls[i].maxBB.z++;

      walls.push(prevWalls[i]);
    }
    for (let i = 0; i < walls.length; i++) {
      const min = vec3(
        walls[i].minBB.x / 2,
        walls[i].minBB.y,
        walls[i].minBB.z / 2
      );
      const max = vec3(
        walls[i].maxBB.x / 2,
        walls[i].maxBB.y,
        walls[i].maxBB.z / 2
      );
      walls[i].pos = min.add(max).divNum(2);
      walls[i].r = max.sub(min).len() / 2;
      walls[i].r2 = walls[i].r * walls[i].r;
      walls[i].hitbox = [
        walls[i].minBB.divNum(2),
        vec3(walls[i].maxBB.x / 2, walls[i].minBB.y, walls[i].minBB.z / 2),
        vec3(walls[i].minBB.x / 2, walls[i].maxBB.y, walls[i].minBB.z / 2),
        vec3(walls[i].minBB.x / 2, walls[i].minBB.y, walls[i].maxBB.z / 2),
      ];
    }
    // debugger;
    // const wll = new wall(vec2(0, 0), 1);
    // wll.add(vec2(1, 1));
    // walls.length = 0;
    // walls.push(wll);
  });
}

module.exports.mapLoad = mapLoad;
module.exports.walls = walls;
module.exports.resps = resps;
