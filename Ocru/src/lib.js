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

"use strict"

import { Input } from '../../input/input.js'
import { Drawable, DrawableCollectionMixin } from './drawable.js'
export { SimpleView, Ocru, LoadEventScene, Scene }

class View {
    drawView(ctx, drawables) {}
}
//View
//  maintains viewport state, draws Drawable arrays based upon state, can pass viewContext to Drawables (i.e. 3d drawables need view context), interacts with ctx,
//  has viewStart and viewEnd callbacks
class SimpleView extends View {
    //TODO: A version of View with this signature: constructor(dwidth=100, dheight=100, dx=0, dy=0, drot=0, sx=0, sy=0, zoomX=1, zoomY=1, srot=0)
    constructor({width=100, height=100, dx=0, dy=0, sx=0, sy=0, zoomX=1, zoomY=1, backgroundColor, smooth=true}) {
        super()
        this.width=width|0
        this.height=height|0
        this.dx=dx|0
        this.dy=dy|0
        
        this.sx=sx|0
        this.sy=sy|0
        
        this.zoomX=+zoomX
        this.zoomY=+zoomY
        this.smooth = !!smooth
        
        this.backgroundColor = backgroundColor
    }
    
    drawView(ctx, drawables) {
        ctx.save()
        //background color
        if (this.backgroundColor) {
            ctx.fillStyle = this.backgroundColor
            ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height)
        } else {
            ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
        }
        //perform zoom and translation
        ctx.setTransform(this.zoomX,
                         0,
                         0,
                         this.zoomY,
                         (this.dx-this.sx)*this.zoomX-this.dx|0,
                         (this.dy-this.sy)*this.zoomY-this.dy|0
                        )

        ctx.imageSmoothingEnabled = this.smooth
        
        for (let i = 0; i < drawables.length; i++)
            drawables[i].draw(ctx)
        
        ctx.restore()
        
        ctx.clearRect(this.dx, 0, ctx.canvas.width, this.dy)
        ctx.clearRect(this.dx+this.width, this.dy, ctx.canvas.width, ctx.canvas.height)
        ctx.clearRect(0, this.dy+this.height, this.dx+this.width, ctx.canvas.height)
        ctx.clearRect(0, 0, this.dx, this.dy+this.height)
    }
}

class SceneManager {
    constructor(canvas, fpscap=60) {
        if (!canvas)
            throw new TypeError("Parametererror: canvas required!")
        
        this.canvas = canvas
        this.ctxt = canvas.getContext("2d")
        
        const c = document.createElement("canvas")
        c.width = canvas.width
        c.height = canvas.height
        this._osCtx = c.getContext("2d")
        
        this.fpscap = fpscap|0
        
        this.debug = {
            _lastSecond: window.performance.now(),
            _framesThisSecond: 0,
            fps: 0
        }
    }
    
    play(scene) {
        if (!scene)
            throw new TypeError("Parametererror: scene required!")
        
        this.scene = scene
        scene._setOffscreenContext(this._osCtx)
        scene._onPlay()
        
        if (!this._running) {
            this._running = true
            this._loop()
        } 
    }

    step(scene) {
        scene._setOffscreenContext(this._osCtx)
        scene.drawScene(this.ctxt)
    }
    
    stop() {
        this.scene._onStop()
        
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
            this.scene.drawScene(this.ctxt)
            this.debug._framesThisSecond++
        }
        return drawCondition
    }
}

class Ocru extends SceneManager {
    constructor(canvas, fpscap) {
        super(canvas, fpscap)
        
        this.input = new Input(canvas)
    }
    
    _loop() {
        if (super._loop())
            this.input.frameReset()
    }
}

function EventScene(Base) {
    if (!(Base.prototype instanceof Scene) && Base != Scene)
        throw new TypeError("Base must be a Scene")
    
    return class extends Base {
        constructor() {
            super(...arguments)
            if (this.onCreate) 
                this.onCreate()
        }
        
        drawScene() {
            if (this.onDrawStart) 
                this.onDrawStart()
            super.drawScene(...arguments)
            if (this.onDrawEnd) 
                this.onDrawEnd()
        }
    }
}

function LoadEventScene(Base) {
    if (!(Base.prototype instanceof Scene) && Base != Scene)
        throw new TypeError("Base must be a Scene")
    
    return class extends Base {
        constructor() {
            super(...arguments)
            
            this._activeDrawStart = this.onLoadDrawStart
            this._activeDrawEnd = this.onLoadDrawEnd
            
            this.load = new MediaLoader()
            this.load.onComplete(() => {
                this._activeDrawStart = this.onDrawStart
                this._activeDrawEnd = this.onDrawEnd
                this.onReady()
            })
            
            if (this.onCreate) 
                this.onCreate()
            this.load.start()
        }
        
        drawScene() {
            if (this._activeDrawStart) 
                this._activeDrawStart()
            super.drawScene(...arguments)
            if (this._activeDrawEnd) 
                this._activeDrawEnd()
        }
    }
}

//Scene
//  manages Drawables and Views, controls view activation order, virtual canvas layering, sprite depth, other sprite meta information, has one default view
class Scene extends DrawableCollectionMixin(Object) {
    constructor(width, height) {
        super()
        
        const c = document.createElement("canvas")
        c.width = width || 100
        c.height = height || 100
        this._osCtx = c.getContext("2d")
        
        this._viewArr = []
        
        this.default_view = new SimpleView(this._osCtx.canvas.width, this._osCtx.canvas.height)
        this.addView(this.default_view)
    }
    
    _setOffscreenContext(osCtx) {
        this._osCtx = osCtx
        if (this.default_view) {
            this.default_view.width = osCtx.canvas.width || 100
            this.default_view.height = osCtx.canvas.height || 100
        }  
    }
    
    drawScene(ctx) {
        ctx.clearRect(0, 0, this._osCtx.canvas.width, this._osCtx.canvas.height)
        
        for (let i = 0; i < this._drawableArr.length; i++) {
            if (this._drawableArr[i].onFrame)
                this._drawableArr[i].onFrame()
        }
        
        this._resolve()
        
        for (let i = 0; i < this._viewArr.length; i++) {
            this._osCtx.clearRect(0, 0, this._osCtx.canvas.width, this._osCtx.canvas.height)
            this._viewArr[i].drawView(this._osCtx, this._drawableArr)
            //potential optimization on this line:
            ctx.drawImage(this._osCtx.canvas, 0, 0)
        }
    }
    
    //view actions
    addView(view, depth=0) {
        if (!view)
            throw new TypeError("Parametererror: view required!")
        if (!(view instanceof View))
            throw new TypeError("Parametererror: view must be an instance of View!")
        if (view._rl_depth != undefined)
            throw new Error("view is already registered to a scene!")
        
        view._rl_depth = depth
        //insert into array at proper position
        this._rlindexInsert(view, this._viewArr)
        
        //add the ability to delete this view
        view.remove = (function() {
            this.removeView(view)
        }).bind(this)
        
        //add depth setter and getter to view for ease of use
        Object.defineProperty(view, 'depth', {
            get: function() { 
                return this._rl_depth
            },
            set: (function(newValue) {
                this.setViewDepth(view, newValue)
            }).bind(this),
            enumerable: true,
            configurable: true
        })

        return view
    }
    
    removeView(view) {
        //remove from array
        this._viewArr.splice(view._rl_index, 1)
        //clean and remove from hash
        delete view.depth
        delete view.remove
        delete view._rl_depth
        delete view._rl_index
    }
    
    setViewDepth(depth=0) {
        //remove from array
        this._viewArr.splice(view._rl_index, 1)
        view._rl_depth = depth
        //reinsert
        this._rlindexInsert(view, this._viewArr)
    }
    
    _onPlay() {
        if (this.onPlay)
            this.onPlay()
        for (let i = 0; i < this._drawableArr.length; i++) {
            if (this._drawableArr[i].onPlay)
                this._drawableArr[i].onPlay()
        }
    }
    
    _onStop() {
        if (this.onStop)
            this.onStop()
        for (let i = 0; i < this._drawableArr.length; i++) {
            if (this._drawableArr[i].onStop)
                this._drawableArr[i].onStop()
        }
    }
}

//IDEA: use es6 proxies to make a LazyRenderer class (useful for performance on things with a low change rate)
//IDEA: make a ControlledRenderer class that only renders when told to

class MediaLoader {
    
    constructor() {
        
        this.total = 0
        this.progress = 0

        this._loadArr = []
        
        this._progressEvents = []
        this._completeEvents = []
    }
    
    onProgress(func) {
        if (!func)
            throw new TypeError("ParameterError: func callback required!")
        this._progressEvents.push(func);
    }
    
    onComplete(func) {
        if (!func)
            throw new TypeError("ParameterError: func callback required!")
        this._completeEvents.push(func);
    }
    
    image(src) {
        this.total++
        const temp = new Image()
        this._loadArr.push({obj: temp, src: src})
        
        temp.onload = (function() {
            this.progress++
            if (this.progress == this.total)
                this._completeEvents.forEach(f=>f())
            else
                this._progressEvents.forEach(f=>f(this.progress, this.total))
        }).bind(this)
        
        temp.onerror = function() {
            throw new Error("Error loading image: " + src)
        }
        
        return temp
    }
    
    audio(src) {
        this.total++
        const temp = new Audio()
        temp.preload = 'auto'
        this._loadArr.push({obj: temp, src: src})
        
        temp.oncanplaythrough = (function() {
            this.progress++
            temp.oncanplaythrough = null
            if (this.progress == this.total)
                this._completeEvents.forEach(f=>f())
            else
                this._progressEvents.forEach(f=>f(this.progress, this.total))
        }).bind(this)
        
        temp.onerror = function() {
            throw new Error("Error loading audio: " + src)
        }
        
        return temp
    }
    
    start() {
        if (this.total==0)
            this._completeEvents.forEach(f=>f())
        
        this._loadArr.forEach(e=>{
            e.obj.src = e.src
        })
    }
}