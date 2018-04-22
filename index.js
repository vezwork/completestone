'use strict'

import { Rectangle, Sprite, Drawable, TextLine, Scene } from './Ocru/drawable.js'
import { Ocru } from './Ocru/lib.js'

const c = document.getElementById('canvas')
const ocru = new Ocru(document.getElementById('canvas'), 60)
document.getElementById('canvas').focus()
const input = ocru.input

let gravity = 0.54
let timeScale = 1

class Guy extends Rectangle.Events {
    onCreate({ dog }) {
        console.log('guy created', dog)
        this.height = 64
        this.width = 64

        this.yspeed = 0
        this.xspeed = 0

        this.ridingPlatform = null
    }

    onFrame() {
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

            let platformCollisions = this.isTouching(Platform)
            if (platformCollisions) {
                platformCollisions.forEach(platform => {
                    if (platform.y - platform.yspeed + 1 >= prev.y + this.height) {
                        this.ridingPlatform = platform
        
                        for (; this.y >= prev.y; this.y--) 
                            if (!this.isTouching(this.ridingPlatform)) break
        
                        onGround = true
                    }
                })
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
            if (input.keyPressed('arrowUp')) {
                this.yspeed = -9
                if (this.ridingPlatform) {
                    this.yspeed += this.ridingPlatform.yspeed
                    this.xspeed += this.ridingPlatform.xspeed
                }
                this.ridingPlatform = null
            } else {
                this.yspeed = 0
            }
        } else {
            if (input.keyDown('arrowUp') && this.yspeed < 0) {
                this.yspeed += gravity * timeScale * 0.5
            } else if (input.keyDown('arrowDown') && this.yspeed > 0) {
                this.yspeed += gravity * timeScale * 1.4
            } else {
                this.yspeed += gravity * timeScale
            }
        }

        //X
        
        if (onGround) { //controls behave differently on the ground
            if (input.keyDown('arrowright')) {
                this.xspeed += (6 - this.xspeed) * 0.2 * timeScale
            }
            else if (input.keyDown('arrowleft')) {
                this.xspeed += (-6 - this.xspeed) * 0.2 * timeScale
            } else {
                this.xspeed += -this.xspeed * 0.4 * timeScale//slow down faster on ground
            }
        } else {
            if (input.keyDown('arrowright')) {
                this.xspeed += (6 - this.xspeed) * 0.06 * timeScale
            }
            else if (input.keyDown('arrowleft')) {
                this.xspeed += (-6 - this.xspeed) * 0.06 * timeScale
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

class Platform extends Rectangle.Events {
    onCreate({ xspeed = 0, yspeed = 0, range = {} } = {}) {
        this.xspeed = xspeed
        this.yspeed = yspeed
        this.range = range

        this.height = 64
        this.width = 64
        this.color = 'purple'
    }

    onFrame() {
        this.x += this.xspeed * timeScale
        this.y += this.yspeed * timeScale
    }
}

class Backpack extends Platform.Events {
    onCreate({ carrier } = {}) {
        super.onCreate(arguments[0])

        this.ridingPlatform = null

        this._state = this.backbackState
        this.carrier = carrier

        this.xmomentum = this.ymomentum = 0
    }

    onFrame() {
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

        if (input.keyPressed('arrowDown')) {
            this.xspeed = this.carrier.xspeed
            this.yspeed = this.carrier.yspeed - 10
            this._state = this.platformCollisionState
        }
    }

    launchState() {

    }

    platformCollisionState() {

        if (this.carrier.ridingPlatform === this && input.keyPressed('arrowDown')) {
            this._state = this.backbackState
            this.carrier.ridingPlatform = null
        } 

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
            this.yspeed = 0
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
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [1],
    [0,0,0,0,0,1],
    [0,0,0,0,0,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,1,1,1,1,1],
    [],
    [],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,0,0,0,0,0],
]

const gridColors = {
    '1': 'gray',
    '2': 'YellowGreen'
}

class CollisionGrid extends Drawable {
    constructor(grid, gridSize) {
        super()
        this.grid = grid
        this.gridSize = gridSize
    }

    onDraw(ctx) {
        
        for (let x = 0; x < this.grid[0].length; x++) {
            for (let y = 0; y < this.grid.length; y++) {
                if (this.grid[y][x]) {
                    ctx.fillStyle = gridColors[this.grid[y][x]]
                    ctx.fillRect(x*this.gridSize-1,y*this.gridSize-1,this.gridSize+2,this.gridSize+2)
                }
            }
        }
    }

    isTouching(touchee, shouldBe) {
        if (shouldBe !== CollisionGrid) return false

        const start = {
            x: Math.floor(touchee.x / this.gridSize),
            y: Math.floor(touchee.y / this.gridSize)
        }
        const end = {
            x: Math.floor((touchee.x + touchee.width) / this.gridSize),
            y: Math.floor((touchee.y + touchee.height) / this.gridSize)
        }
        for (let x = start.x; x <= end.x && x < this.grid[0].length; x++) {
            for (let y = start.y; y <= end.y && y < this.grid.length; y++) {

                if (this.grid[y] && this.grid[y][x]) return [touchee]
            }
        }
        return false
    }
}

class MainScene extends Scene.Events {
    onCreate() {
        this.imageLoader = this.load('../level.PNG');
        //console.log(this.imageLoader);
    }
    
    onLoadingDraw() {
    }
    
    onLoad() {
        
        //this.sprite = this.add(new Sprite({ 
        //    image: this.imageLoader.img, 
        //    depth: 11, 
        //    scale: { x: 0.6, y: 0.6}, 
        //    x: -550, y: -170 
        //}))
        console.log(this.sprite)
        this.grid = this.add(new CollisionGrid(gridArray, 64))
        this.grid.depth = 12
        this.guy = this.add(new Guy({ create: { dog: 1 }, x: 100, y: 140}))
        this.text = this.add(new TextLine({ text: 'hello', height: 40 }))
        this.text.depth = 100

        this.platform = this.add(new Platform({ x: -200, y: 228 }))

        this.backpack = this.add(new Backpack({ depth: 10, create: { carrier: this.guy }}))

        this.staticGroup.add(new TextLine({ text: 'helloooo', height: 40, x: 20, y: 20 }))

        this.debugSquare = this.add(new Rectangle({ color: 'crimson', height: 20, width: 20}))

        this.view.scale.x = 0.5
        this.view.scale.y = 0.5
        this.view.rot = 1
        this.scale.x = 2
    }
    
    onLoadedDraw() {
        const { x, y } = this.getInverseRelativePoint(this.view.getInverseRelativePoint(input.mouse))

        this.debugSquare.x = x
        this.debugSquare.y = y

        //this.view.source.x += (this.viewPlayerX - this.view.source.x) * 0.05 * timeScale

        const viewPortWidth = 728 * 2
        const viewPortHeight = 528 * 2

        const x1 = Math.min(this.guy.x - viewPortWidth/2 + this.guy.width, this.backpack.x - 20)
        const y1 = Math.min(this.guy.y - viewPortHeight/2 + this.guy.height, this.backpack.y - 20)

        const x2 = (Math.max(this.guy.x + viewPortWidth/2, this.backpack.x + 84) - x1) / viewPortWidth
        const y2 = (Math.max(this.guy.y + viewPortHeight/2, this.backpack.y + 84) - y1) / viewPortHeight
        const zoom = Math.max(x2, y2)

        //this.view.source.x += (x1 - this.view.source.x) * 0.1
        //this.view.source.y += (y1 - this.view.source.y) * 0.1

        //this.view.source.width += (((viewPortWidth * zoom) | 0) - this.view.source.width) * 0.1
        //this.view.source.height += (((viewPortHeight * zoom) | 0) - this.view.source.height) * 0.1

        this.view.rot+=0.001
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

    if (e.key === 's')
        timeScale += (0 - timeScale) * 0.5
    if (e.key === 'w')
        timeScale += (4 - timeScale) * 0.5
})