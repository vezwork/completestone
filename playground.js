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
        this.b2 = this.add(new Rectangle({height: 32, width: 32, x: 100, y: 100, color: 'green'}));

        this.text = this.add(new TextLine({x: 50, y: 50, height: 50, text: 'hi'}));

        this.scale.x = 3
    }
    
    onLoadingDraw() {
    }
    
    onLoad() {
        
    }
    
    onLoadedDraw() {

    }
}

const scene = new MainScene({
    height: c.height,
    width: c.width
})


ocru.play(scene.group)

document.addEventListener('keydown', e => {
    if (e.key === 'z')
        ocru.step(scene)

    if (e.key === 'x')
        ocru.stop()

    if (e.key === 'c')
        ocru.play(scene)

    if (e.key === 'v')
        scene.addDrawable(new Platform({ x: -200, y: 228 }))

    if (e.key === 'b')
        console.log(scene)
})