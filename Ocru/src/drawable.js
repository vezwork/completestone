export { Drawable, Rectangle, TextLine, SpriteSheet, Sprite, DrawableCollectionMixin, Layer, Group }

//Drawable interface
class Drawable {
    constructor({
                x = 0, 
                y = 0, 
                width = 0, 
                height = 0, 
                rot = 0, 
                opacity = 1, 
                blendmode = 'source-over', 
                scale = { x: 1, y: 1 }, 
                origin = { x: undefined, y: undefined },
                create = {}
            } = {}) {

        if (this.onCreate) this.onCreate(create)

        this.x = (this.x || x)|0
        this.y = (this.y || y)|0
        this.width = (this.width || width)|0
        this.height = (this.height || height)|0
        
        this.rot = +(this.rot || rot)
        this.opacity = +(this.opacity || opacity)
        
        this.blendmode = (this.blendmode || blendmode)+''
        
        this.scale = this.scale || scale
        this.origin = this.origin || origin
    }

    draw(ctx) {
        if (this.onDraw) this.onDraw()

        ctx.save()
        //handle opacity
        ctx.globalAlpha = this.opacity
        ctx.globalCompositeOperation = this.blendmode
        
        const centerOffsetWidth  = (this.origin.x !== undefined)? this.origin.x : this.width/2
        const centerOffsetHeight = (this.origin.y !== undefined)? this.origin.y : this.height/2
        
        //scaling
        ctx.translate(centerOffsetWidth, centerOffsetHeight)
        //rotation
        ctx.rotate(this.rot)
        ctx.scale(this.scale.x,this.scale.y)
        ctx.translate(-centerOffsetWidth + this.x|0, -centerOffsetHeight + this.y|0)
        //the subclass must handle using draw something within height, width, at 0,0
        //DEBUG BLUE BOX
        //ctx.fillStyle='blue'
        //ctx.fillRect(this.x,this.y,this.width,this.height)

        this._draw(ctx)

        ctx.restore()
    }

    static touching(drawable1, drawable2) {
        const myDimensions = drawable1.getRealDimensions()
        const coDimensions = drawable2.getRealDimensions()

        const averageCenter = { x: coDimensions.center.x - myDimensions.center.x, 
                                y: coDimensions.center.y - myDimensions.center.y }

        const myRotNormal = { x: Math.cos(myDimensions.rot), y: Math.sin(myDimensions.rot) },
              myHWidth = myDimensions.width/2,
              myHHeight = myDimensions.height/2

        const coRotNormal = { x: Math.cos(coDimensions.rot), y: Math.sin(coDimensions.rot) },
              coHWidth = coDimensions.width/2 - 1, //kind of hack, not sure why I have to subtract 1
              coHHeight = coDimensions.height/2 - 1

        const seperation1 = Math.abs(averageCenter.x * myRotNormal.x + averageCenter.y * myRotNormal.y) > myHWidth +
                 Math.abs(coHWidth * (coRotNormal.x * myRotNormal.x + coRotNormal.y * myRotNormal.y)) +
                 Math.abs(coHHeight * (-coRotNormal.y * myRotNormal.x + coRotNormal.x * myRotNormal.y))
        
        const seperation2 = Math.abs(averageCenter.x * -myRotNormal.y + averageCenter.y * myRotNormal.x) > myHHeight +
                 Math.abs(coHWidth * (coRotNormal.x * -myRotNormal.y + coRotNormal.y * myRotNormal.x)) +
                 Math.abs(coHHeight * (-coRotNormal.y * -myRotNormal.y + coRotNormal.x * myRotNormal.x))    

        if (myDimensions.rot % 90 !== coDimensions.rot % 90) { //experimental optimization
            const seperation3 = Math.abs(averageCenter.x * coRotNormal.x + averageCenter.y * coRotNormal.y) > coHWidth +
                    Math.abs(myHWidth * (myRotNormal.x * coRotNormal.x + myRotNormal.y * coRotNormal.y)) +
                    Math.abs(myHHeight * (-myRotNormal.y * coRotNormal.x + myRotNormal.x * coRotNormal.y))  

            const seperation4 = Math.abs(averageCenter.x * -coRotNormal.y + averageCenter.y * coRotNormal.x) > coHHeight +
                    Math.abs(myHWidth * (myRotNormal.x * -coRotNormal.y + myRotNormal.y * coRotNormal.x)) +
                    Math.abs(myHHeight * (-myRotNormal.y * -coRotNormal.y + myRotNormal.x * coRotNormal.x))  

            return !(seperation1 || seperation2 || seperation3 || seperation4)
        }

        return !(seperation1 || seperation2)
    }

    //(touchee: Drawable, shouldBe?: T extends Drawable) => false | Drawable[]
    //(touchee: T extends Drawable)                     => false | Drawable[]
    isTouching(touchee, shouldBe) {
        if (touchee instanceof Drawable) {
            let isCollided
            if (shouldBe) {
                isCollided = this instanceof shouldBe && Drawable.touching(this, touchee) 
            } else {
                isCollided = Drawable.touching(this, touchee) 
            }
            return (isCollided)? [this] : false
            
        } else if (touchee.prototype instanceof Drawable){
            let cur = this.parent
            while(cur.parent !== undefined)
                cur = cur.parent

            return cur !== undefined && cur.isTouching(this, touchee)
        }
        throw new TypeError("ParameterError: touchee is not a valid collision object")
    }

    getRealDimensions() {
        let centerOffsetWidth  = this.x + ((this.origin.x !== undefined)? this.origin.x : this.width/2)|0
        let centerOffsetHeight = this.y + ((this.origin.y !== undefined)? this.origin.y : this.height/2)|0

        let cosa = Math.cos(this.rot)
        let sina = Math.sin(this.rot)
        const centerX = (this.x + this.width/2 - centerOffsetWidth) * this.scale.x
        const centerY = (this.y + this.height/2 - centerOffsetHeight) * this.scale.y

        const dimensions = {
            rot: this.rot,
            center: { 
                x: (centerX * cosa) - (centerY * sina) + centerOffsetWidth, 
                y: (centerX * sina) + (centerY * cosa) + centerOffsetHeight
            },
            height: this.height * this.scale.y,
            width: this.width * this.scale.x
        }        

        let cur = this.parent

        while (cur instanceof Drawable) {
            centerOffsetWidth  = cur.x + ((cur.origin.x !== undefined)? cur.origin.x : cur.width/2)|0
            centerOffsetHeight = cur.y + ((cur.origin.y !== undefined)? cur.origin.y : cur.height/2)|0

            const relX = dimensions.center.x - centerOffsetWidth
            const relY = dimensions.center.y - centerOffsetHeight

            cosa = Math.cos(cur.rot)
            sina = Math.sin(cur.rot)
            
            dimensions.rot = dimensions.rot + cur.rot,
            dimensions.center = { 
                    x: ((relX * cosa) - (relY * sina) + centerOffsetWidth) * cur.scale.x + cur.x, 
                    y: ((relX * sina) + (relY * cosa) + centerOffsetHeight) * cur.scale.y + cur.y
                },
            dimensions.height = dimensions.height * cur.scale.x,
            dimensions.width =  dimensions.width * cur.scale.y
 
            cur = cur.parent
        }

        return dimensions
    }
}

class Rectangle extends Drawable {
    constructor({ color = 'black' } = {}) {
        super(arguments[0])
        this.color = (this.color || color)+''
    }
    
    _draw(ctx) {
        ctx.fillStyle = this.color
        ctx.fillRect(0,0,this.width|0,this.height|0)
    }
}

class TextLine extends Drawable {
    constructor({text='', color='#000', font='arial'} = {}) {
        const opts = arguments[0] || {}
        if (opts.width === undefined) opts.width = 100000
        if (opts.height === undefined) opts.height = 14
        super(opts)
        
        this.text = this.text || text+''
        this.font = this.font || font+''
        this.color = this.color || color+''
    }
    
    _draw(ctx) {
        ctx.font = this.height + "px " + this.font
        ctx.fillStyle = this.color
        
        ctx.textBaseline = "top"
        ctx.fillText(this.text, 0, 0, this.width)
    }
} 

//only supports spritesheets with subimages right next to eachother as of now
//unless you use crop to cut off spaces in the sheet

//doesn't support sheets with less than the expected amount
class SpriteSheet extends Drawable {
    constructor({ 
        sheet: {image, frameWidth, frameHeight, subimageCount} = {}, 
        crop = { x: 0, y: 0, height: frameHeight, width: frameWidth }
    } = {}) {
        const opts = arguments[0] || {}

        if (image.naturalHeight === 0)
            throw new TypeError("ParameterError: image has no source or hasn't loaded yet!")

        if (opts.width === undefined) opts.width = frameWidth
        if (opts.height === undefined) opts.height = frameHeight
        super(opts)
        
        this.image = this.image ||image
        this.crop = this.crop || crop
        this.subimage = this.subimage || 0

        this._imagesPerRow = (image.naturalWidth / frameWidth|0)
        this._imagesPerColumn = (image.naturalHeight / frameHeight|0)
        //this.subimageCount = subimageCount|0 || this._imagesPerColumn * this._imagesPerRow
    }

    _draw(ctx) {
        ctx.drawImage(this.image, 
                      this._getFrameX(this.subimage)+this.crop.x|0, 
                      this._getFrameY(this.subimage)+this.crop.y|0, 
                      this.crop.width|0,
                      this.crop.height|0,
                      0, 
                      0, 
                      this.width|0,
                      this.height|0
                     )
    }

    _getFrameX(frameIndex) {
        return ((frameIndex % this._imagesPerRow) % this._imagesPerRow) * this.width
    }
    
    _getFrameY(frameIndex) {
        return ((frameIndex / this._imagesPerRow |0) % this._imagesPerColumn) * this.height
    } 
}

class Sprite extends Drawable {
    constructor({ 
        image, 
        crop = { x: 0, y: 0, height: image.naturalHeight, width: image.naturalWidth }, 
        width = image.naturalWidth, 
        height = image.naturalHeight
    } = {}) {
        const opts = arguments[0] || {}
        
        if (image.naturalHeight === 0)
            throw new TypeError("ParameterError: image has no source or hasn't loaded yet!")
        
        if (opts.width === undefined) opts.width = image.naturalWidth
        if (opts.height === undefined) opts.height = image.naturalHeight

        super(opts)
        
        this.image = this.image || image
        this.crop = this.crop || crop
    }
    
    _draw(ctx) {
        ctx.drawImage(this.image, 
                      this.crop.x|0,
                      this.crop.y|0,
                      this.crop.width|0,
                      this.crop.height|0,
                      0,
                      0, 
                      this.width|0, 
                      this.height|0
                     )
    }
}

const DrawableCollectionMixin = Base => class extends Base {
    constructor() {
        super(...arguments)
     
        this._drawableArr = []
        this._resolutionQueue = []
    }
    
    addDrawable(drawable, depth=0) {
        if (!drawable)
            throw new TypeError("Parametererror: drawable required!")
        if (!(drawable instanceof Drawable))
            throw new TypeError("Parametererror: drawable must be an instance of Drawable!")
        if (drawable._rl_depth != undefined)
            throw new Error("drawable is already registered to a scene!")
        
        drawable.parent = this
        
        drawable._rl_depth = depth
        //insert into array at proper position
        this._resolutionQueue.push(()=>{
            this._rlindexInsert(drawable, this._drawableArr)
        })
        
        //add the ability to delete this drawable
        drawable.remove = (function() {
            this.removeDrawable(drawable)
        }).bind(this)
        
        //add depth setter and getter to drawable for ease of use
        Object.defineProperty(drawable, 'depth', {
            get: function() { 
                return this._rl_depth
            },
            set: (function(newValue) {
                this.setDrawableDepth(drawable, newValue)
            }).bind(this),
            enumerable: true,
            configurable: true
        })

        return drawable
    }
    
    removeDrawable(drawable) {
        //clean and remove from hash
        delete drawable.depth
        delete drawable.remove
        delete drawable._rl_depth
        
        
        //schedule removal from array
        this._resolutionQueue.push(()=>{
            this._drawableArr.splice(drawable._rl_index, 1)
            for(let i = drawable._rl_index; i < this._drawableArr.length; i++) 
                this._drawableArr[i]._rl_index--
            
            delete drawable._rl_index
            delete drawable.parent
        })
    }
    
    setDrawableDepth(drawable, depth=0) {
        //schedule removal from array
        this._resolutionQueue.push(()=>{
            this._drawableArr.splice(drawable._rl_index, 1)
            for(let i = drawable._rl_index; i < this._drawableArr.length; i++) 
                this._drawableArr[i]._rl_index--
        })
        drawable._rl_depth = depth
        
        //schedule subsequest reinsert
        this._resolutionQueue.push(()=>{
            this._rlindexInsert(drawable, this._drawableArr)
        })
    }
    
    //the class that extends this must call this in draw
    _resolve() { 
        this._resolutionQueue.forEach(f => f())
        this._resolutionQueue = []
    }
    
    //inserts an object into an sorted array, sorted based upon an object's _rl_index property
    _rlindexInsert(object, arr) {
        var low = 0,
            high = arr.length

        while (low < high) {
            var mid = (low + high) >>> 1
            if (arr[mid]._rl_depth < object._rl_depth) low = mid + 1
            else high = mid
        }
        
        object._rl_index = low
        arr.splice(low, 0, object)
        //update index counter of sprites being pushed up by insertion
        for (let i = low+1; i < arr.length; i++) {
            arr[i]._rl_index++
        }
    }

    onFrame() {
        this._drawableArr.forEach(drawable=>{
            if (drawable.onFrame) drawable.onFrame()
        })
    }

    //(touchee: Drawable, shouldBe?: T extends Drawable) => false | Drawable[]
    isTouching(drawable, shouldBe) {
        const touches = this._drawableArr.reduce((acc, otherDrawable) => {
            const result = otherDrawable.isTouching(drawable, shouldBe)
            if (!result) {
                return acc
            } else {
                return acc.concat(result)
            }
        }, [])
        return (touches.length > 0)? touches : false
    }
}

//could be extended to support rotation, smoothing, background color
class Layer extends DrawableCollectionMixin(Drawable) {
    constructor({ width, height }) {
        super(arguments[0])
        
        const c = document.createElement("canvas")
        if (width)
            c.width = width
        if (height)
            c.height = height
        this._osCtx = c.getContext("2d")
    }

    _draw(ctx) {
        this._osCtx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
        
        this._resolve()
        
        for (let i = 0; i < this._drawableArr.length; i++)
            this._drawableArr[i].draw(this._osCtx)
        
        ctx.drawImage(this._osCtx.canvas,0,0)
    }
}

class Group extends DrawableCollectionMixin(Drawable) {
    constructor(opts) {
        super(opts)
    }
    
    draw(ctx) {
        this._resolve()
        
        for (let i = 0; i < this._drawableArr.length; i++)
            this._drawableArr[i].draw(ctx)
    }
}