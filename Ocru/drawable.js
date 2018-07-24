'use strict'

import { Drawable, View, Group } from './core.js'

export { 
    Drawable,
    Rectangle,
    TextLine,
    SpriteSheet,
    Sprite,
    View,
    Group,
    LoadGroup,
    Scene
}

function * intercalate(...iterables) {
	let iterators = iterables.map(iterable => iterable[Symbol.iterator]());

	while (iterators.length > 0) {
		const newIterators = [];
		for (const iterator of iterators) {
			const { value, done } = iterator.next();
			
			if (!done) {
				newIterators.push(iterator);
				yield value;
            }
        }
		iterators = newIterators;
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
            this.width = ctx.measureText(this.text).width
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
            console.log(blob.type);
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