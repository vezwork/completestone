'use strict'

export { Drawable, Rectangle, TextLine, SpriteSheet, Sprite, View, Group, LoadGroup, Scene }

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
                depth = 0,
                create = {}
            } = {}) {
                
        this.x = x|0
        this.y = y|0
        this.width = width|0
        this.height = height|0
        
        this.rot = +rot
        this.opacity = +opacity
        
        this.blendmode = blendmode+''
        
        this.scale = scale
        this.origin = origin

        this.depth = depth
    }

    onFrame() {}

    draw(ctx) {
        this.onFrame()

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
        ctx.globalAlpha = 0.2
        ctx.fillStyle='blue'
        ctx.fillRect(0,0,this.width,this.height)
        ctx.globalAlpha = this.opacity

        this.onDraw(ctx)

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
        throw new TypeError('ParameterError: touchee is not a valid collision object')
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

    static get Events() {
        return class extends this {
            constructor(opts = {}) {
                super(...arguments)

                this.onCreate(opts.create)
            }
        }
    }
}

class Rectangle extends Drawable {
    constructor({ color = 'black' } = {}) {
        super(arguments[0])
        this.color = color+''
    }
    
    onDraw(ctx) {
        ctx.fillStyle = this.color
        ctx.fillRect(0,0,this.width|0,this.height|0)
    }
}

class TextLine extends Drawable {
    constructor({text='', color='#000', font='arial', autoWidth=true} = {}) {
        const opts = arguments[0] || {}
        if (opts.width === undefined) opts.width = Infinity
        if (opts.height === undefined) opts.height = 14
        super(opts)
        
        this.text = text+''
        this.font = font+''
        this.color = color+''
        this.autoWidth = !!autoWidth
    }
    
    onDraw(ctx) {
        ctx.font = this.height + 'px ' + this.font
        ctx.fillStyle = this.color
        
        ctx.textBaseline = 'top'
        if (this.autoWidth) {
            this.width = ctx.measureText('this.text').width
        }
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
            throw new TypeError('ParameterError: image has no source or hasn\'t loaded yet!')

        if (opts.width === undefined) opts.width = frameWidth
        if (opts.height === undefined) opts.height = frameHeight
        super(opts)
        
        this.image = image
        this.crop = crop
        this.subimage = 0

        this._imagesPerRow = (image.naturalWidth / frameWidth|0)
        this._imagesPerColumn = (image.naturalHeight / frameHeight|0)
        //this.subimageCount = subimageCount|0 || this._imagesPerColumn * this._imagesPerRow
    }

    onDraw(ctx) {
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
            throw new TypeError('ParameterError: image has no source or hasn\'t loaded yet!')
        
        if (opts.width === undefined) opts.width = image.naturalWidth
        if (opts.height === undefined) opts.height = image.naturalHeight

        super(opts)
        
        this.image = image
        this.crop = crop
    }
    
    onDraw(ctx) {
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

//could be extended to support rotation, smoothing, background color
class View extends Drawable {
    constructor({
        subject = null,
        source: {
            x = 0, 
            y = 0, 
            width, //when undefined use this.width
            height, //when undefined use this.height
            rot = 0,
            scale = { x: 1, y: 1 }, 
            origin = { x: undefined, y: undefined }
        } = {}
    } = {}) {
        super(arguments[0])
        
        this.subject = subject

        this.source = { x, y, width, height, rot, scale, origin }

        const c = document.createElement('canvas')
        c.width = this.width
        c.height = this.height
        this._osCtx = c.getContext('2d')
    }

    set height(height) {
        this._height = height
        if (this._osCtx) this._osCtx.canvas.height = height
    }
    get height() { return this._height }

    set width(width) {
        this._width = width
        if (this._osCtx) this._osCtx.canvas.width = width
    }
    get width() { return this._width }

    set subject(subject) {
        if (subject) {
            this._subject = subject
            if (this._subject.parentViews)
                this._subject.parentViews.push(this)
            else 
                this._subject.parentViews = [this]
        }
    }
    get subject() { return this._subject }

    onDraw(ctx) {
        const octx = this._osCtx
        const source = this.source

        octx.clearRect(0, 0, this.width, this.height)

        octx.save()
        octx.globalAlpha = source.opacity
        
        const centerOffsetWidth  = (source.origin.x !== undefined)? source.origin.x : this.width/2
        const centerOffsetHeight = (source.origin.y !== undefined)? source.origin.y : this.height/2

        const widthScale = (source.width)?(this.width / source.width):1
        const heightScale = (source.height)?(this.height / source.height):1
        octx.scale(widthScale, heightScale)
        //scaling
        octx.translate(centerOffsetWidth, centerOffsetHeight)
        //rotation
        octx.rotate(source.rot)
        octx.scale(source.scale.x, source.scale.y)
        octx.translate(-centerOffsetWidth - source.x|0, -centerOffsetHeight - source.y|0)

        this.subject.draw(octx)

        octx.restore()
        
        ctx.drawImage(octx.canvas,0,0)
    }
}

class Group extends Drawable {
    constructor(opts) {
        super(opts)

        this._drawables = []
    }

    onDraw(ctx) {
        this._drawables.forEach(d => d.draw(ctx))

        this._drawables.sort((d1, d2) => (d1.depth < d2.depth)?1:-1)
    }

    add(drawable) {
        drawable.parent = this
        drawable.remove = (_ =>this.remove(drawable)).bind(this)

        this._drawables.push(drawable)
        return drawable
    }
    
    remove(drawable) {
        delete drawable.remove
        delete drawable.parent
        this._drawables = this._drawables.filter(listedDrawable => listedDrawable !== drawable)
    }

    //(touchee: Drawable, shouldBe?: T extends Drawable) => false | Drawable[]
    isTouching(drawable, shouldBe) {
        const touches = this._drawables.reduce((acc, otherDrawable) => {
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

class LoadGroup extends Group {
    constructor(opts) {
        super(opts)

        this._resolved = false
        this._promises = []
        this._startedLoading = false
    }

    onLoad() {}
    onLoadingDraw() {}
    onLoadedDraw() {}

    onDraw(ctx) {
        if (this._resolved) {
            this.onLoadedDraw()
        } else if (this._promises.length === 0) {
            this._resolved = true
            this.onLoadedDraw()
        } else {
            if (!this._startedLoading) {
                this._startedLoading = true
                Promise.all(this._promises).then(_ => { 
                    this._resolved = true
                    this._drawables = []
                    this._drawablesToAdd = []
                    this.onLoad()
                })
            }
            this.onLoadingDraw()
        }
        super.onDraw(ctx)
    }

    load(url) {
        const promise = fetch(url).then(res => res.blob()).then(blob => { 
            if (blob.type.startsWith('image')) {
                promise.img = new Image()
                promise.img.src = URL.createObjectURL(blob)
                return new Promise((resolve, reject) => {
                    promise.img.addEventListener('load', _=> {
                        resolve(promise.img)
                    })
                })
            }
            //text
            //audio
            //video
        })
        this._promises.push(promise)
        return promise
    }
}

class Scene extends LoadGroup {
    constructor(opts) {
        super(opts)

        this.origin.x = 0
        this.origin.y = 0

        this.view = new View({
            subject: this,
            height: this.height,
            width: this.width
        })

        this.staticGroup = new Group()

        this.group = new Group()
        this.group.add(this.staticGroup)
        this.group.add(this.view)
    }
}