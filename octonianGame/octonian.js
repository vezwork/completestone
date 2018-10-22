import { Rectangle, Sprite, Drawable, TextLine, Group, Scene, View } from '../Ocru/drawable.js';
import { Ocru } from '../Ocru/lib.js';

const c = document.getElementById('canvas');
const ocru = new Ocru(c, 60);
const ctx = c.getContext('2d');
c.focus();
const input = ocru.input;

ctx.setTransform(0.1,0,0,0.1,200,200)

class cloudTrail extends Drawable {
    constructor({ _x=0, _y=0, _z=0 }) {
        super(...arguments);

        this._z = _z;
        this._x = _x;
        this._y = _y;
        this.speed = {
            x: (Math.random() - 0.5) * 50,
            y: (Math.random() - 0.5) * 50,
            z: (Math.random() - 0.5) * 50
        };

        this.focus = {
            x: 810,
            y: 444,
            z: 10
        };

        this.frameCount = 0;
        this.trail = [];
    }

    onDraw(ctx) {
        ctx.lineCap = 'round';
        this.trail.forEach((coord, i) => {
            if (i !== 0) {
                const prev_coord = this.trail[i-1];
                //blur

                ctx.lineWidth = (30 + coord.z) * 0.01;
                ctx.beginPath();
                ctx.moveTo(prev_coord.x, prev_coord.y);
                ctx.lineTo(coord.x, coord.y);
                ctx.stroke();
            }
        });
    }

    onFrame() {
        this._x += this.speed.x*5;
        this._y += this.speed.y*5;
        this._z += this.speed.z*5;

        const force = {
            x: 0.4 / (1+Math.abs(this.focus.x - this._x)),
            y: 0.4 / (1+Math.abs(this.focus.y - this._y)),
            z: 0.4 / (1+Math.abs(this.focus.z - this._z))
        }

        this.speed = {
            x: (this.focus.x - this._x) * force.x + this.speed.x * (1 - force.x),
            y: (this.focus.y - this._y) * force.y + this.speed.y * (1 - force.y),
            z: (this.focus.z - this._z) * force.z + this.speed.z * (1 - force.z)
        };

        if (this.frameCount % 1 === 0) {
            this.trail.push({ x: this._x, y: this._y, z:this._z });
        }
        this.frameCount++;
    }
}

const group = new Group();
group.add(new cloudTrail({ _x: 300, _y:200, _z: 10 }));
group.add(new cloudTrail({ _x: 300, _y:200, _z: 10 }));
group.add(new cloudTrail({ _x: 300, _y:200, _z: 10 }));
group.add(new cloudTrail({ _x: 300, _y:200, _z: 10 }));
group.add(new cloudTrail({ _x: 300, _y:200, _z: 10 }));
group.add(new cloudTrail({ _x: 300, _y:200, _z: 10 }));
group.add(new cloudTrail({ _x: 300, _y:200, _z: 10 }));
group.add(new cloudTrail({ _x: 300, _y:200, _z: 10 }));
group.add(new cloudTrail({ _x: 300, _y:200, _z: 10 }));
group.add(new cloudTrail({ _x: 300, _y:200, _z: 10 }));

ocru.play(group);