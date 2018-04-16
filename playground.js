'use strict'

import { Rectangle, Sprite, Drawable, TextLine, Scene } from './Ocru/drawable.js'
import { Ocru } from './Ocru/lib.js'

const c = document.getElementById('canvas')
const ocru = new Ocru(document.getElementById('canvas'), 60)
const ctx = c.getContext('2d')
document.getElementById('canvas').focus()
const input = ocru.input

class MainScene extends Scene.Events {
    onCreate() {
        this.b2 = this.add(new Rectangle({height: 32, width: 32, x: 100, y: 100, color: 'green', rot: 0.2}));

        this.b3 = this.add(new Rectangle({height: 62, width: 52, x: 400, y: 100, color: 'crimson'}));

        this.text = this.add(new TextLine({x: 50, y: 50, height: 50, text: 'hi'}));

    }
    
    onLoadingDraw() {
    }
    
    onLoad() {
        
    }
    
    onLoadedDraw() {

        this.b2.rot += 0.01
        this.b2.scale.x += 0.01
        this.b2.shear.x += 0.01
        this.b2.origin.x = 200

        //this.x++
        //this.rot -= 0.001
        //this.scale.y += 0.01

        this.b3.x = input.mouse.x
        this.b3.y = input.mouse.y

        if (Drawable.touching(this.b2, this.b3)) {
            ctx.fillStyle='blue'
        } else {
            ctx.fillStyle='yellow'
        }

        ctx.fillRect(0,0,20,20);

        ctx.globalCompositeOperation = 'source-over';
        ctx.beginPath();
        Drawable.transformPoints([this.b2, this]).forEach(coord => ctx.lineTo(coord.x,coord.y));
        ctx.stroke();

        ctx.beginPath();
        Drawable.transformPoints([this.b3, this]).forEach(coord => ctx.lineTo(coord.x,coord.y));
        ctx.stroke();
        ctx.globalCompositeOperation = 'destination-over';
    }
}

const scene = new MainScene({
    height: c.height,
    width: c.width
})


ocru.play(scene.group)

document.addEventListener('keydown', e => {
    if (e.key === 'z')
        ocru.step(scene.group)

    if (e.key === 'x')
        ocru.stop()

    if (e.key === 'c')
        ocru.play(scene.group)

    if (e.key === 'v')
        scene.addDrawable(new Platform({ x: -200, y: 228 }))

    if (e.key === 'b')
        console.log(scene)
})