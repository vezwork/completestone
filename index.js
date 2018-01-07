'use strict'

import { Rectangle, Drawable, TextLine } from './Ocru/src/drawable.js'
import { Ocru, LoadEventScene, Scene } from './Ocru/src/lib.js'

const ocru = new Ocru(document.getElementById('canvas'), 60)
document.getElementById('canvas').focus()
const input = ocru.input

const gravity = 0.3
class Guy extends Rectangle.Events() {
    onCreate({ dog }) {
        console.log('guy created', dog)
        this.height = 64
        this.width = 64

        this.yspeed = 0
        this.xspeed = 0

        this.xspeedBase = 0
        this.yspeedBase = 0

    }

    onDraw() {
        if (input.keyDown('arrowright')) {
            this.xspeed += (4 - this.xspeed) * 0.2
        }
        else if (input.keyDown('arrowleft')) {
            this.xspeed += (-4 - this.xspeed) * 0.2
        }
        else {
            this.xspeed = 0
        }

        const prev = {
            x: this.x,
            y: this.y
        }

        //TODO: support for vertically moving platforms, need pre collision checking
        //we assume there is no collisions before modifying the y
        this.y += this.yspeed + this.yspeedBase

        let onGround = false

        if (this.yspeedBase > 0) { //riding a platform moving down
            let good = !this.isTouching(Platform)
            this.y += 1
            let platformCollision = this.isTouching(Platform)
            good = good && platformCollision
            if (good) {
                this.xspeedBase = platformCollision[0].xspeed
                this.yspeedBase = platformCollision[0].yspeed
                onGround = true
            } else {
                this.xspeedBase = 0
                this.yspeedBase = 0
            }
            this.y -= 1
        } else if (this.yspeedBase < 0) { //riding a platform moving up
            let good = !this.isTouching(Platform)
            this.y += 1
            let platformCollision = this.isTouching(Platform)
            good = good && platformCollision
            if (good) {
                this.xspeedBase = platformCollision[0].xspeed
                this.yspeedBase = platformCollision[0].yspeed
                onGround = true
            } else {
                this.xspeedBase = 0
                this.yspeedBase = 0
            }
            this.y -= 1
        } else {
            let platformCollision = this.isTouching(Platform)
            if (platformCollision && platformCollision[0].y - platformCollision[0].yspeed + 1 >= prev.y + this.height) {
                console.log('on platform')
                for (; this.y >= prev.y; this.y--) 
                    if (!this.isTouching(Platform)) break

                this.xspeedBase = platformCollision[0].xspeed
                this.yspeedBase = platformCollision[0].yspeed
                onGround = true
            } else {
                this.xspeedBase = 0
                this.yspeedBase = 0
            }
        }

        if (this.isTouching(CollisionGrid)) {
            if (this.y - prev.y > 0) {
                for (; this.y >= prev.y; this.y--)
                    if (!this.isTouching(CollisionGrid)) break
                
                onGround = true

            } else if (this.y - prev.y < 0) {
                for (; this.y <= prev.y; this.y++)
                    if (!this.isTouching(CollisionGrid)) break
                
                this.yspeed = 0
            }
        }

        if (onGround) {
            if (input.keyDown('arrowUp')) {
                this.yspeed = -10
            } else {
                this.yspeed = 0
            }
        } else {
            this.yspeed += gravity
        }


        //we assume there is no collisions before modifying the x

        this.x += this.xspeed + this.xspeedBase

        //you can walk thru moving platforms so there is no x collisions with them

        if (this.isTouching(CollisionGrid)) {
            if (this.xspeed + this.xspeedBase > 0) {
                for (; this.x >= prev.x; this.x--)
                    if (!this.isTouching(CollisionGrid)) break
            
            } else if (this.xspeed + this.xspeedBase < 0) {
                for (; this.x <= prev.x; this.x++)
                    if (!this.isTouching(CollisionGrid)) break
            }
            
            this.xspeed = 0
        }
    }
}

class Platform extends Rectangle.Events() {
    onCreate({ xspeed = 1, yspeed = -5, range = {} } = {}) {
        this.xspeed = xspeed
        this.yspeed = yspeed
        this.range = range

        this.height = 64
        this.width = 64
        this.color = 'purple'
    }

    onDraw() {
        this.x += this.xspeed
        this.y += this.yspeed

        this.yspeed += 0.03
    }
}

const gridArray = [
    [0,0,0,0,0,0,0,0],
    [1],
    [0,0,0,0,0,0],
    [0,0,0,0,0],
    [1,1,1,0,0,0,0,1]
]

class CollisionGrid extends Drawable {
    constructor(grid, gridSize) {
        super()
        this.grid = grid
        this.gridSize = gridSize
    }

    draw(ctx) {
        ctx.fillStyle = 'red'
        for (let x = 0; x < this.grid[0].length; x++) {
            for (let y = 0; y < this.grid.length; y++) {
                if (this.grid[y][x]) ctx.fillRect(x*this.gridSize,y*this.gridSize,this.gridSize,this.gridSize)
            }
        }
    }

    isTouching(touchee, shouldBe) {
        if (shouldBe !== CollisionGrid) return false
        const start = {
            x: Math.floor((touchee.x) / this.gridSize),
            y: Math.floor((touchee.y) / this.gridSize)
        }
        const end = {
            x: Math.floor((touchee.x + touchee.height - 1) / this.gridSize),
            y: Math.floor((touchee.y + touchee.width - 1) / this.gridSize)
        }
        for (let x = start.x; x <= end.x && x < this.grid[0].length; x++) {
            for (let y = start.y; y <= end.y && y < this.grid.length; y++) {

                if (this.grid[y] && this.grid[y][x]) return [touchee]
            }
        }
        return false
    }
}

class MainScene extends LoadEventScene(Scene) {
    onCreate() {
        console.log('created')
        
        this.grid = this.addDrawable(new CollisionGrid(gridArray, 64))
        this.guy = this.addDrawable(new Guy({ create: { dog: 1 }, x: 100, y: 140 }))
        this.text = this.addDrawable(new TextLine({ text: 'hello', height: 40 }))
        this.text.depth = 100

        this.platform = this.addDrawable(new Platform({ x: 200, y: 428 }))
    }
    
    onLoadDrawStart() {
        console.log('load draw')
    }
    
    onReady() {
        console.log('ready')
    }
    
    onDrawStart() {
    }
    
    onDrawEnd() {
    }
}

const scene = new MainScene()

ocru.play(scene)

document.addEventListener('keydown', e => {
    if (e.key === 'z')
        ocru.step(scene)

    if (e.key === 'x')
        ocru.stop()

    if (e.key === 'c')
        ocru.play(scene)

    if (e.key === 'v')
        scene.addDrawable(new Platform({ x: 200, y: 428 }))
})