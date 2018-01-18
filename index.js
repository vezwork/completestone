'use strict'

import { Rectangle, Drawable, TextLine } from './Ocru/src/drawable.js'
import { Ocru, LoadEventScene, Scene } from './Ocru/src/lib.js'

const c = document.getElementById('canvas')
const ocru = new Ocru(document.getElementById('canvas'), 60)
document.getElementById('canvas').focus()
const input = ocru.input

let gravity = 0.3
let timeScale = 1

class Guy extends Rectangle {
    onCreate({ dog }) {
        console.log('guy created', dog)
        this.height = 64
        this.width = 64

        this.yspeed = 0
        this.xspeed = 0

        this.ridingPlatform = null
    }

    onDraw() {
        const prev = {
            x: this.x,
            y: this.y
        }
        
        //Y
        let onGround = false

        if (this.ridingPlatform) {
            if (this.x + this.width < this.ridingPlatform.x - this.ridingPlatform.xspeed || this.x > this.ridingPlatform.x + this.ridingPlatform.width - this.ridingPlatform.xspeed) {
                this.yspeed += this.ridingPlatform.yspeed
                this.xspeed += this.ridingPlatform.xspeed
                this.ridingPlatform = null
                this.y += this.yspeed * timeScale
            } else {
                this.y = this.ridingPlatform.y - this.height
                onGround = true
            }
        } else {
            this.y += this.yspeed * timeScale

            let platformCollision = this.isTouching(Platform)
            if (platformCollision && platformCollision[0].y - platformCollision[0].yspeed + 1 >= prev.y + this.height) {
                this.ridingPlatform = platformCollision[0]

                for (; this.y >= prev.y; this.y--) 
                    if (!this.isTouching(this.ridingPlatform)) break

                onGround = true
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
            this.ridingPlatform = null
        } else {
            this.y += 1
            if (this.isTouching(CollisionGrid)) {
                onGround = true
                this.yspeed = 0
                this.ridingPlatform = null
            }
            this.y -=1
        }

        if (onGround) {
            if (input.keyDown('arrowUp')) {
                this.yspeed = -10
                if (this.ridingPlatform) {
                    this.yspeed += this.ridingPlatform.yspeed
                    this.xspeed += this.ridingPlatform.xspeed
                }
                this.ridingPlatform = null
            } else {
                this.yspeed = 0
            }
        } else {
            this.yspeed += gravity * timeScale
        }

        //X
        
        if (onGround) { //controls behave differently on the ground
            if (input.keyDown('arrowright')) {
                this.xspeed += (5 - this.xspeed) * 0.2 * timeScale
            }
            else if (input.keyDown('arrowleft')) {
                this.xspeed += (-5 - this.xspeed) * 0.2 * timeScale
            } else {
                this.xspeed += -this.xspeed * 0.4 * timeScale//slow down faster on ground
            }
        } else {
            if (input.keyDown('arrowright')) {
                this.xspeed += (5 - this.xspeed) * 0.03 * timeScale
            }
            else if (input.keyDown('arrowleft')) {
                this.xspeed += (-5 - this.xspeed) * 0.03 * timeScale
            } else {
                this.xspeed += -this.xspeed * 0.01 * timeScale//slow down faster on ground
            }
        }

        this.x += (this.xspeed + ((this.ridingPlatform) ? this.ridingPlatform.xspeed : 0)) * timeScale

        //you can walk thru moving platforms so there is no x collisions with them

        if (this.isTouching(CollisionGrid)) {
            if (this.x - prev.x > 0) {
                for (; this.x >= prev.x; this.x--)
                    if (!this.isTouching(CollisionGrid)) break
            
            } else if (this.x - prev.x < 0) {
                for (; this.x <= prev.x; this.x++)
                    if (!this.isTouching(CollisionGrid)) break
            }
            
            this.xspeed = 0
        }
    }
}

class Platform extends Rectangle {
    onCreate({ xspeed = 0, yspeed = 0, range = {} } = {}) {
        this.xspeed = xspeed
        this.yspeed = yspeed
        this.range = range

        this.height = 64
        this.width = 64
        this.color = 'purple'
    }

    onDraw() {
        this.x += this.xspeed * timeScale
        this.y += this.yspeed * timeScale
    }
}

class Backpack extends Platform {
    onCreate({ carrier } = {}) {
        super.onCreate(arguments[0])

        this.ridingPlatform = null

        this._state = this.backbackState
        this.carrier = carrier
        this._failedLaunch = false
    }

    onDraw() {
        if (input.keyPressed('arrowDown')) {
            this.xspeed = this.carrier.xspeed
            this.yspeed = this.carrier.yspeed - 10
            this._state = this.platformCollisionState
            this._failedLaunch = this.yspeed > -1
        }
        if (this.carrier.ridingPlatform === this && input.keyPressed('arrowDown')) {
            this._state = this.backbackState
            this.carrier.ridingPlatform = null
        } 

        this._state()
    }

    backbackState() {
        if (this.carrier.xspeed > 0) {
            this.x += ((this.carrier.x - 10) - this.x) * 0.3 * timeScale
            this.y += ((this.carrier.y - 10) - this.y) * 0.3 * timeScale
        } else {
            this.x += ((this.carrier.x + 10) - this.x) * 0.3 * timeScale
            this.y += ((this.carrier.y - 10) - this.y) * 0.3 * timeScale
        }
    }

    launchState() {

    }

    platformCollisionState() {
        const prev = {
            x: this.x,
            y: this.y
        }
        if (!this._failedLaunch && this.yspeed > -1 && this.yspeed < 1) {
            timeScale += (0.05 - timeScale) * 0.3
        } else {
            timeScale += (1 - timeScale) * 0.3
        }

        //Y
        let onGround = false

        if (this.ridingPlatform) {
            if (this.x + this.width < this.ridingPlatform.x - this.ridingPlatform.xspeed || this.x > this.ridingPlatform.x + this.ridingPlatform.width - this.ridingPlatform.xspeed) {
                this.yspeed += this.ridingPlatform.yspeed
                this.xspeed += this.ridingPlatform.xspeed
                this.ridingPlatform = null
                this.y += this.yspeed * timeScale
            } else {
                this.y = this.ridingPlatform.y - this.height
                onGround = true
            }
        } else {
            this.y += this.yspeed * timeScale

            let platformCollision = this.isTouching(Platform)
            if (platformCollision && platformCollision[0].y - platformCollision[0].yspeed + 1 >= prev.y + this.height) {
                this.ridingPlatform = platformCollision[0]

                for (; this.y >= prev.y; this.y--) 
                    if (!this.isTouching(this.ridingPlatform)) break

                onGround = true
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
            this.ridingPlatform = null
        } else {
            this.y += 1
            if (this.isTouching(CollisionGrid)) {
                onGround = true
                this.yspeed = 0
                this.ridingPlatform = null
            }
            this.y -=1
        }

        if (onGround) {
            this.yspeed = 0
            this._failedLaunch = true
        } else {
            this.yspeed += gravity * timeScale
        }

        //X
        
        if (onGround) { 
            this.xspeed += -this.xspeed * 0.1 //slow down faster on ground
        } else {
            this.xspeed += -this.xspeed * 0.01 //slow down slower in air
        }

        this.x += (this.xspeed + ((this.ridingPlatform) ? this.ridingPlatform.xspeed : 0)) * timeScale

        //you can walk thru moving platforms so there is no x collisions with them

        if (this.isTouching(CollisionGrid)) {
            this._failedLaunch = true
            if (this.x - prev.x > 0) {
                for (; this.x >= prev.x; this.x--)
                    if (!this.isTouching(CollisionGrid)) break
            
            } else if (this.x - prev.x < 0) {
                for (; this.x <= prev.x; this.x++)
                    if (!this.isTouching(CollisionGrid)) break
            }
            
            this.xspeed = 0
        }
    }
}

const gridArray = [
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [1],
    [0,0,0,0,0,0],
    [0,0,0,0,0],
    [1,1,1,0,0,0,0,0,0,1,1,1,1,1],
    [0,0,0,1],
    [0,0,0,0,0,0,0,0,0,0,1],
    [0,0,1,1,1,1,1,1,1]
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
        console.log('created', this)
        
        this.grid = this.addDrawable(new CollisionGrid(gridArray, 64))
        this.guy = this.addDrawable(new Guy({ create: { dog: 1 }, x: 100, y: 140 }))
        this.text = this.addDrawable(new TextLine({ text: 'hello', height: 40 }))
        this.text.depth = 100

        this.platform = this.addDrawable(new Platform({ x: -200, y: 228 }))

        this.backpack = this.addDrawable(new Backpack({ create: { carrier: this.guy }}))

        this.viewPlayerX = 0
        this.viewPlayerY = 0
    }
    
    onLoadDrawStart() {
    }
    
    onReady() {
    }
    
    onDrawStart() {
        this.viewPlayerX
        this.viewPlayerY 

        this.viewPlayerX = this.guy.x - 300
        this.viewPlayerY = this.guy.y - 200 

        const viewWidth = (this.default_view.width)/2
        const viewHeight = (this.default_view.height)/2

        const viewCenterX = this.viewPlayerX + viewWidth
        const viewCenterY = this.viewPlayerY + viewHeight

        const backpackToCenterX = Math.abs(this.backpack.x - viewCenterX) 
        const backpackToCenterY = Math.abs(this.backpack.y - viewCenterY)
        if (backpackToCenterX > this.default_view.width/2 || backpackToCenterY > this.default_view.height/2) {
            this.default_view.zoomX += (0.6 - this.default_view.zoomX) * 0.03
            this.default_view.zoomY += (0.6 - this.default_view.zoomY) * 0.03
            if (this.backpack.y - viewCenterY < this.default_view.width/2) 
                this.default_view.sy += ((this.backpack.y - 25) - this.default_view.sy) * 0.3 * timeScale

            
        } else {
            this.default_view.zoomX += (1 - this.default_view.zoomX) * 0.03
            this.default_view.zoomY += (1 - this.default_view.zoomY) * 0.03
            this.default_view.sy += (this.viewPlayerY - this.default_view.sy) * 0.05 * timeScale
        }
        this.default_view.sx += (this.viewPlayerX - this.default_view.sx)* 0.05 * timeScale
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
        scene.addDrawable(new Platform({ x: -200, y: 228 }))

    if (e.key === 'b')
        console.log(scene)

    if (e.key === 's')
        timeScale += (0 - timeScale) * 0.5
    if (e.key === 'w')
        timeScale += (4 - timeScale) * 0.5
})