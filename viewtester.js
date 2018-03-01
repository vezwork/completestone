'use strict'

import { Rectangle, Drawable, TextLine, View, Group } from './Ocru/src/drawable.js'

const c = document.getElementById('canvas')
const ctx = c.getContext('2d')

const rect1 = new Rectangle({ height: 32, width: 32, x: 0, y: 0, color: 'red' })
const rect2 = new Rectangle({ height: 32, width: 32, x: 100, y: 0, color: 'blue' })
const rect3 = new Rectangle({ height: 32, width: 32, x: 0, y: 100, color: 'green' })
const rect4 = new Rectangle({ height: 32, width: 32, x: 100, y: 100, color: 'yellow' })
const rect5 = new Rectangle({ height: 32, width: 32, x: 50, y: 50, color: 'purple' })

const group = new Group()
group.add(rect1)
group.add(rect2)
group.add(rect3)
group.add(rect4)
group.add(rect5)

const view = new View({
    viewing: group,
    height: 132,
    width: 132,
    origin: { x: 0, y: 0 },
    scale: { x: 3, y: 3 },
    source: {
        x: 20,
        y: 20,
        height: 10,
        width: 10,
        scale: { x: 1, y: 1 },
        //origin: { x: 32, y: 32 }
    }
})

function draw() {
    ctx.clearRect(0,0,c.width,c.height)

    //view.source.scale.x+=0.005
    //view.source.scale.y+=0.005
    //view.source.rot += 0.005
    view.source.height+=0.1
    view.source.width+=0.1

    view.draw(ctx)
    requestAnimationFrame(draw)
}
draw()

console.log(view)