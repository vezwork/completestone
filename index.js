'use strict'

import { Rectangle, Drawable, TextLine } from './Ocru/src/drawable.js'
import { Ocru, LoadEventScene, Scene } from './Ocru/src/lib.js'

const ocru = new Ocru(document.getElementById('canvas'), 60)
const input = ocru.input

const gravity = 0.3
class Guy extends Rectangle.Events() {
    onCreate({ grid }) {
        console.log('guy created')
        this.height = 64
        this.width = 64
        this.y = 140

        this.yspeed = 0
        this.xspeed = 0

        this._grid = grid
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

        if (!this._grid.isTouching(this, { plusX: this.xspeed })) {
            this.x += this.xspeed
        } else {
            if (this.xspeed > 0) {
                for (let i = this.xspeed; i > 0; i--) {
                    if (!this._grid.isTouching(this, { plusX: i })) {
                        this.x += i
                        break
                    }
                }
            } else if (this.xspeed < 0) {
                for (let i = this.xspeed; i < 0; i++) {
                    if (!this._grid.isTouching(this, { plusX: i })) {
                        this.x += i
                        break
                    }
                }
            }
        }
        
        if (!this._grid.isTouching(this, { plusY: this.yspeed += gravity })) {
            this.y += this.yspeed
        } else {
            if (this.yspeed > 0) {
                for (let i = this.yspeed; i > 0; i--) {
                    if (!this._grid.isTouching(this, { plusY: i })) {
                        this.y += i
                        break
                    }
                }
            } else if (this.yspeed < 0) {
                for (let i = this.yspeed; i < 0; i++) {
                    if (!this._grid.isTouching(this, { plusY: i })) {
                        this.y += i
                        break
                    }
                }
            }

            if (this.yspeed > 0 && input.keyDown('arrowUp')) {
                this.yspeed = -10
            } else {
                this.yspeed = 0
            }
        }

        if (this.touching().filter(d => d instanceof MovingPlatform)[0]) {
            this.parent.text.text = "wa"
        }
    }
}

class MovingPlatform extends Rectangle.Events() {
    onCreate({ xSpeed = 1, ySpeed = 0, range = {} } = {}) {
        this.xSpeed = xSpeed
        this.ySpeed = ySpeed
        this.range = range

        this.height = 64
        this.width = 64
        this.color = 'purple'
    }

    onDraw() {
        this.x += this.xSpeed
        this.y += this.ySpeed
    }
}

const gridArray = [
    [0,0,0,0,0,0,0,1],
    [1],
    [0,0,0,0,0,0],
    [0,0,0,1,1],
    [1,1,1,1,1,1,1,1]
]

class MainScene extends LoadEventScene(Scene) {
    onCreate() {
        console.log('created')
        
        this.grid = this.addDrawable(new CollisionGrid(gridArray, 64))
        this.guy = this.addDrawable(new Guy({ create: { grid: this.grid }}))
        this.text = this.addDrawable(new TextLine({ text: 'hello', height: 40 }))
        this.text.depth = 100

        this.platform = this.addDrawable(new MovingPlatform({ x: 400, y: 200 }))
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

    isTouching(drawable, { plusX = 0, plusY = 0 } = {}) {
        const start = {
            x: Math.floor((drawable.x + plusX) / this.gridSize),
            y: Math.floor((drawable.y + plusY) / this.gridSize)
        }
        const end = {
            x: Math.floor((drawable.x + plusX + drawable.height - 1) / this.gridSize),
            y: Math.floor((drawable.y + plusY + drawable.width - 1) / this.gridSize)
        }
        for (let x = start.x; x <= end.x && x < this.grid[0].length; x++) {
            for (let y = start.y; y <= end.y && y < this.grid.length; y++) {

                if (this.grid[y] && this.grid[y][x]) return true
            }
        }
        return false
    }
}

const scene = new MainScene()

ocru.play(scene)