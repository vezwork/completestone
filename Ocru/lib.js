//TODO NEW: 
//- remove scenes / cameras, replace with virtual / non-possessive layers (maybe call them cameras)
//- allow attaching shaders to layers
//- make drawables event based by default

//GOALS:
    //extensible
    //modular
    //each piece is useful at it's place in the usage hierarchy
    //simple to use, but with all the functionality needed
    //minimally restrictive
    //distributed complexity

//TODO:
    //tiling sprite drawable (i.e. ctx pattern), multiline text
    //text autowidthing option
    //add e.disableNormalEvents or whatever its called to nontouch mode on touch devices in input  (i.e. cant scroll by moving finger across game)
    //smoothing on all drawables
    //sfx: sound.play multiple times concurrently
    //extend pressed/released input to touch
    //test touch and tilt on a real device
    //test Group and Layer more extensively
    //fix input when game is unfocused mid input
    //spritesheet animations
    //animation timelining

'use strict'

import { Input } from './input.js'
export { Turntable, Ocru }

class Turntable {
    constructor(canvas = document.createElement('canvas'), fpscap=60) {
        this.ctx = canvas.getContext('2d')
        
        this.fpscap = fpscap|0
        
        this.debug = {
            _lastSecond: window.performance.now(),
            _framesThisSecond: 0,
            fps: 0
        }
        this.playing = undefined
    }
    
    play(drawable = this.playing) {     
        this.playing = drawable
        
        if (!this._running) {
            this._running = true
            this._loop()
        } 
    }

    step(drawable) {
        drawable.draw(this.ctx)
    }
    
    stop() {      
        this._running = false
    }
    
    _loop() {
        if (this._running)
            window.requestAnimationFrame(this._loop.bind(this))
        
        //calculate fps
        if (window.performance.now() > this.debug._lastSecond + 1000) {
            this.debug._lastSecond = window.performance.now()
            this.debug.fps = this.debug._framesThisSecond
            this.debug._framesThisSecond = 0
        }
        //limit fps
        const drawCondition = this.debug._framesThisSecond - 1 < (window.performance.now() - this.debug._lastSecond) / 1000 * this.fpscap
        if (drawCondition) {
            this.ctx.clearRect(0,0,this.ctx.canvas.width,this.ctx.canvas.height)
            this.playing.draw(this.ctx)
            this.debug._framesThisSecond++
        }
        return drawCondition
    }
}

class Ocru extends Turntable {
    constructor(canvas, fpscap) {
        super(canvas, fpscap)
        
        this.input = new Input(canvas)
    }
    
    _loop() {
        if (super._loop())
            this.input.frameReset()
    }
}