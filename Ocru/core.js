export { Drawable, View, Group }

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
                smooth = false,
                scale = { x: 1, y: 1 }, 
                shear = { x: 0, y: 0 },
                origin = { x: undefined, y: undefined },
                depth = 0,
                shadow = {
                    x: 0,
                    y: 0,
                    color: undefined,
                    blur: 0
                },
                filter = 'none'
            } = {}) {
        this.x = x|0
        this.y = y|0
        this.width = width|0
        this.height = height|0

        this.rot = +rot

        this.opacity = +opacity
        this.blendmode = blendmode+''
        this.smooth = !!smooth
        this.filter = filter+''

        this.shadow = shadow

        this.scale = scale
        this.shear = shear
        this.origin = origin

        this.depth = +depth
    }

    onFrame() {}

    draw(ctx) {
        this.onFrame()

        ctx.save()

        ctx.globalAlpha = this.opacity
        ctx.globalCompositeOperation = this.blendmode
        ctx.imageSmoothingEnabled = this.smooth;
        ctx.filter = this.filter;
        
        const centerOffsetWidth  = (this.origin.x !== undefined)? this.origin.x : this.width/2
        const centerOffsetHeight = (this.origin.y !== undefined)? this.origin.y : this.height/2
        
        ctx.translate(centerOffsetWidth, centerOffsetHeight)
        
        ctx.translate(this.x|0, this.y|0)
        ctx.rotate(this.rot)
        ctx.scale(this.scale.x,this.scale.y)
        ctx.transform(1,this.shear.x,this.shear.y,1,0,0)
        ctx.translate(-centerOffsetWidth, -centerOffsetHeight)

        if (this.shadow.color !== undefined) {
            ctx.shadowColor = this.shadow.color
            ctx.shadowBlur = this.shadow.blur
            ctx.shadowOffsetX = this.shadow.x
            ctx.shadowOffsetY = this.shadow.y
        }
        //the subclass must handle using draw something within height, width, at 0,0

        //DEBUG BLUE BOX
        //ctx.globalAlpha = 0.2
        //ctx.fillStyle = 'blue'
        //ctx.fillRect(0,0,this.width,this.height)
        //ctx.globalAlpha = this.opacity

        this.onDraw(ctx)

        ctx.restore()
    }

    * ancestorChains() {
        yield [this]

        if (this.parent) {
            for (const ancestor of this.parent.ancestorChains()) {
                yield [this, ...ancestor]
            }
        }
        
        if (this.parentViews) {
            for (const parentView of this.parentViews) {
                for (const ancestor of parentView.ancestorChains()) {
                    yield [this, ...ancestor]
                }
            }
        }
    }

    static touching(drawable1, drawable2) {

        let drawable1Bounds;
        let drawable2Bounds;

        //finding nearest common ancestor of drawable1 and drawable2
        const drawable1AncestorChains = drawable1.ancestorChains()
        const drawable2AncestorChains = drawable2.ancestorChains()

        const drawable1ShortestPaths = new Map()
        const drawable2ShortestPaths = new Map()

        while (true) {
            const { value: value1, done: done1 } = drawable1AncestorChains.next()
            //[drawable1Ancestor, ...drawable1Rest]
            const { value: value2, done: done2 } = drawable2AncestorChains.next()

            if (done1 && done2) break
            
            if (!done1) {
                drawable1ShortestPaths.set(value1[value1.length-1], value1) //TODO do not overwrite if not shorter path
            }
            if (!done2) {
                drawable2ShortestPaths.set(value2[value2.length-1], value2)
            }
            
            if (!done1) {
                const res = drawable2ShortestPaths.get(value1[value1.length-1])
                if (res) {
                    drawable2Bounds = Drawable.transformPoints(res) //should .slice(0,-1) to not include the nearest common ancestor, breaking for some reason
                    drawable1Bounds = Drawable.transformPoints(value1)
                    break
                }
                
            }
            if (!done2) {
                const res = drawable1ShortestPaths.get(value2[value2.length-1])
                if (res) {
                    drawable1Bounds = Drawable.transformPoints(res)
                    drawable2Bounds = Drawable.transformPoints(value2)
                    break
                }
            }
        }

        return !(
            drawable1Bounds.some(isSideSeperating) || 
            drawable2Bounds.some(isSideSeperating)
        )
        
        function isSideSeperating(p1, i, arr) {
            const p2 = arr[(i + 1) % arr.length];
            const axis = { y: p1.x - p2.x, x: -(p1.y - p2.y) }; //axis orthogonal to line p1 p2
            
            const aprojs = drawable1Bounds.map(p => sproj(p, axis));
            const amin = Math.min(...aprojs);
            const amax = Math.max(...aprojs);
            
            const bprojs = drawable2Bounds.map(p => sproj(p, axis));
            const bmin = Math.min(...bprojs);
            const bmax = Math.max(...bprojs);
            
            return amax < bmin || bmax < amin;
        }

        function sproj(a, b) {
            return (a.x*b.x + a.y*b.y) / Math.sqrt(b.x*b.x + b.y*b.y);
        }
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

    static transformPoints(drawableArray) {
        const firstDrawable = drawableArray[0]
        let bounds = [{x: 0, y: 0}, {x: firstDrawable.width-1, y: 0}, {x:firstDrawable.width-1, y: firstDrawable.height-1}, {x: 0, y: firstDrawable.height-1}]

        drawableArray.forEach(drawable => 
            bounds = bounds.map(point => drawable.getRelativePoint(point))
        );

        return bounds
    }

    getBoundsRelativeFrom(
        referenceDrawable, 
        bounds = [{x: 0, y: 0}, {x: this.width, y: 0}, {x: 0, y: this.height}, {x:this.width, y: this.height}]
    ) {
        //recursive depth first search, searching parents before parentViews

        if (referenceDrawable === undefined)
            return bounds

        const boundsRelativeToThis = bounds.map(this.getTransformedPoint)

        if (this === referenceDrawable) 
            return boundsRelativeToThis

        if (this.parent) {
            const searchResult = this.parent.getBoundsRelativeTo(referenceDrawable, boundsRelativeToThis)
            if (searchResult !== undefined)
                return searchResult
        }
        
        if (this.parentViews) {
            for (const parentView of parentViews) {
                const searchResult = parentView.getBoundsRelativeTo(referenceDrawable, boundsRelativeToThis)
                if (searchResult !== undefined)
                    return searchResult
            }
        }
    }

    getInverseRelativePoint({ x, y } = {}) {
        const sin = Math.sin(-this.rot)
        const cos = Math.cos(this.rot)
        const _0 = this.scale.x * this.shear.x * sin - this.scale.y * cos
        const _1 = this.scale.y * sin + this.scale.x * this.shear.x * cos
        
        const _2 = this.scale.x * this.scale.y * (this.shear.x * this.shear.y - 1)
        
        const _3 = this.shear.y * this.scale.y * cos - this.scale.x * sin
        const _4 = -this.scale.x * cos - this.shear.y * this.scale.y * sin
        
        const centerOffsetWidth  = (this.origin.x !== undefined)? this.origin.x : this.width/2
        const centerOffsetHeight = (this.origin.y !== undefined)? this.origin.y : this.height/2

        return {
            x: (_0 * (x - centerOffsetWidth - this.x) + _1 * (y - centerOffsetHeight - this.y) + centerOffsetWidth * _2) / _2,
            y: (_3 * (x - centerOffsetWidth - this.x) + _4 * (y - centerOffsetHeight - this.y) + centerOffsetHeight * _2) / _2
        }
    }

    getRelativePoint({ x, y } = {}) {
        const sin = Math.sin(this.rot)
        const cos = Math.cos(this.rot)
        
        const _0 = this.scale.x * cos
        const _1 = this.scale.y * sin
        
        const _a = _0 - this.shear.x * _1
        const _b = this.shear.y * _0 - _1
        
        const _2 = this.scale.x * sin
        const _3 = this.scale.y * cos
        
        const _c = _2 + this.shear.x * _3
        const _d = this.shear.y * _2 + _3
        
        const centerOffsetWidth  = (this.origin.x !== undefined)? this.origin.x : this.width/2
        const centerOffsetHeight = (this.origin.y !== undefined)? this.origin.y : this.height/2

        const _4 = x - centerOffsetWidth
        const _5 = y - centerOffsetHeight
        
        return {
            x: _a*_4 + _b*_5 + this.x + centerOffsetWidth,
            y: _c*_4 + _d*_5 + this.y + centerOffsetHeight
        }
    }
}

//could be extended to support rotation, smoothing, background color
class View extends Drawable {
    constructor({
        subject = null
    } = {}) {
        super(arguments[0])
        
        this.subject = subject

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
        this._osCtx.clearRect(0, 0, this.width, this.height)

        this.subject.draw(this._osCtx)
        
        ctx.drawImage(this._osCtx.canvas,0,0)
    }
}

class Group extends Drawable {
    constructor(opts) {
        super(opts)

        this._depthCounter = 0

        this._drawables = []
    }

    add(drawable) {
        drawable.parent = this
        drawable.remove = (_ =>this.remove(drawable)).bind(this)

        drawable._depthOrder = this._depthCounter++

        this._drawables.push(drawable)
        return drawable
    }

    remove(drawable) {
        delete drawable.remove
        drawable.parent = undefined
        this._drawables = this._drawables.filter(listedDrawable => listedDrawable !== drawable)
    }

    onDraw(ctx) {
        this._drawables.sort((d1, d2) => {
            if (d1.depth < d2.depth)
                return 1
            else if (d1.depth > d2.depth)
                return -1
            else {
                if (d1._depthOrder > d2._depthOrder)
                    return 1
                else
                    return -1
            }
        })

        this._drawables.forEach(d => d.draw(ctx))
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