'use strict'

import { Rectangle, Sprite, Drawable, TextLine, Group, Scene } from './Ocru/drawable.js'
import { Ocru } from './Ocru/lib.js'

const c = document.getElementById('canvas')
const ocru = new Ocru(document.getElementById('canvas'), 60)
const ctx = c.getContext('2d')
document.getElementById('canvas').focus()
const input = ocru.input

let time = 0;

//https://gist.github.com/hendriklammers/5231994
function splitString(string, size) {
	var re = new RegExp('.{1,' + size + '}', 'g');
	return string.match(re);
}

class WavySprite extends Sprite {
    constructor({ waviness = 1, waveSpeed = 1 } = {}) {
        const opts = arguments[0] || {}

        super(opts)

        this.waviness = waviness
        this.waveSpeed = waveSpeed
    }

    onDraw(ctx) {
        for(let i = 0; i > -this.crop.height; i -= 10) {
            let a = Math.sin((i+time)/50) * i/50;
            let b = Math.sin((i+time)/60) * i/100;

            ctx.drawImage(this.image,
                        this.crop.x|0 + a, this.crop.y|0 + i + b,
                        this.crop.width,this.crop.height,
                        0,i,
                        this.width,this.height);
        }
    }
}

class MessageBox extends Group.Events {
    onCreate({ side = 'right', messageImage, leftImage, rightImage, text } = {}) {
        this.scale.x = this.scale.y = 0;

        this.bubble = this.add(new Sprite({ image: messageImage }));
        if (side === 'left') {
            this.leftArrow = this.add(new Sprite({ image: leftImage, x: 40, y: -50 }));
        } else {
            this.rightArrow = this.add(new Sprite({ image: rightImage, x: 500, y: -50 }));
        }

        this.origin.x = this.bubble.width/2;
        this.origin.y = this.bubble.height/2;


        const newText = splitString(text, 70);

        newText.forEach((t, i) => {
            console.log(i, t)
            this.add(new TextLine({ text: t, font: 'love', x: 50, y: i * 15 + 40, autoWidth: false, width: 500, height: 14 }));
        });

        this.closing = false;
    }

    onFrame() {
        if (this.closing) {
            if (1 - this.scale.x > 0.9) {
                this.remove();
            } else {
                this.scale.x += (0 - this.scale.x) * 0.2;
                this.scale.y += (0 - this.scale.y) * 0.2;
            }
        } else {
            if (1 - this.scale.x < 0.005) {
                this.scale.x = this.scale.y = 1;
            } else {
                this.scale.x += (1 - this.scale.x) * 0.2;
                this.scale.y += (1 - this.scale.y) * 0.2;
            }
        }
        
    }

    close() {
        this.closing = true;
    }
}

class Head extends Group.Events {
    onCreate({ loading } = {}) {
        this.head = this.add(new Sprite({ image: loading.head.img }));

        this.origin = {
            x: this.head.width / 2,
            y: this.head.height / 2
        };

        this.status = 'idle';
    }

    onFrame() {
        this[this.status + 'Animation']();
    }

    idleAnimation() {
        this.rot = Math.sin(time/24) / 8

        this.scale.x = this.head.scale.y = 1.3 + Math.sin(time/16)/30
    }
}

class Crab extends Group.Events {
    onCreate({ loading } = {}) {
        this.legleft1 = this.add(new Sprite({ image: loading.legleft1.img, x: -60, y: 70, origin: { x: 76, y: 12 } }));
        this.legleft2 = this.add(new Sprite({ image: loading.legleft2.img, x: -40, y: 92, origin: { x: 76, y: 12 }  }));
        this.legleft3 = this.add(new Sprite({ image: loading.legleft3.img, x: -10, y: 112, origin: { x: 50, y: 14 }  }));
        this.legright1 = this.add(new Sprite({ image: loading.legright1.img, x: 145, y: 52, origin: { x: 12, y: 28 }  }));
        this.legright2 = this.add(new Sprite({ image: loading.legright2.img, x: 140, y: 70, origin: { x: 12, y: 28 } }));
        this.legright3 = this.add(new Sprite({ image: loading.legright3.img, x: 125, y: 92, origin: { x: 12, y: 28 } }));

        this.leftarmgroup = this.add(new Group({ x: -22, y: -30 }));
        this.rightarmgroup = this.add(new Group({ x: 135, y: -45 }));
        this.leftarmgroup.origin = { x: 42, y: 72 };
        this.rightarmgroup.origin = { x: 22, y: 86 };

        this.armleft = this.leftarmgroup.add(new Sprite({ image: loading.armleft.img }));
        this.armright = this.rightarmgroup.add(new Sprite({ image: loading.armright.img }));

        this.clawleft = this.leftarmgroup.add(new Sprite({ image: loading.clawleft.img, x: 10, y: -50, origin: { x: 18, y: 66 } }));
        this.clawright = this.rightarmgroup.add(new Sprite({ image: loading.clawright.img, x: -55, y: -45, origin: { x: 92, y: 52 } }));

        this.body = this.add(new Sprite({ image: loading.crab.img }));

        this.twitch = 0;

        this.status = 'idle';
    }

    onFrame() {
        this[this.status + 'Animation']();

    }

    idleAnimation() {
        this.leftarmgroup.rot = Math.sin(time/34) / 8
        this.rightarmgroup.rot = Math.cos(time/34) / 8

        this.clawleft.rot = Math.cos(time/34) / 8
        this.clawright.rot = Math.sin(time/34) / 8

        this.body.x = Math.sin(time/8) * 2
        this.body.y = Math.cos(time/8) * 2

        if (time % 10 === 0) {
            this.twitch = Math.random() - 0.5;
        }

        if (time % 200 < 20) {
            this.legleft1.rot += (this.twitch - this.legleft1.rot) * 0.2;
        }
        else if (time % 200 < 50) {
            this.legright2.rot += (this.twitch - this.legright2.rot) * 0.2;
        }
        else if (time % 200 < 100) {
            this.legleft3.rot += (this.twitch - this.legleft3.rot) * 0.2;
        }

        else if (time % 200 < 110) {
            this.legright1.rot += (this.twitch - this.legright1.rot) * 0.2;
        }
        else if (time % 200 < 160) {
            this.legleft2.rot += (this.twitch - this.legleft2.rot) * 0.2;
        }
        else if (time % 200 < 180) {
            this.legright3.rot += (this.twitch - this.legright3.rot) * 0.2;
        }

        this.y = 100 + Math.cos(time/16) * 3
    }
}

class MainScene extends Scene.Events {
    onCreate() {
        this.loading = {
            head: this.load('./loveAssets/head.png'),
            crab: this.load('./loveAssets/crab.png'),
            armleft: this.load('./loveAssets/armleft.png'),
            armright: this.load('./loveAssets/armright.png'),
            background: this.load('./loveAssets/background.png'),
            foreground: this.load('./loveAssets/foreground.png'),
            blush: this.load('./loveAssets/blush.png'),
            bubblelarge: this.load('./loveAssets/bubblelarge.png'),
            bubblesmall: this.load('./loveAssets/bubblesmall.png'),
            clawleft: this.load('./loveAssets/clawleft.png'),
            clawright: this.load('./loveAssets/clawright.png'),
            closedhand: this.load('./loveAssets/closedhand.png'),
            exclamation: this.load('./loveAssets/exclamation.png'),
            message: this.load('./loveAssets/message.png'),
            hearts: this.load('./loveAssets/hearts.png'),
            legleft1: this.load('./loveAssets/legleft1.png'),
            legleft2: this.load('./loveAssets/legleft2.png'),
            legleft3: this.load('./loveAssets/legleft3.png'),
            legright1: this.load('./loveAssets/legright1.png'),
            legright2: this.load('./loveAssets/legright2.png'),
            legright3: this.load('./loveAssets/legright3.png'),
            messageleft: this.load('./loveAssets/messageleft.png'),
            messageright: this.load('./loveAssets/messageright.png'),
            nausea: this.load('./loveAssets/nausea.png'),
            openhand: this.load('./loveAssets/openhand.png'),
            tear: this.load('./loveAssets/tear.png'),
            vein: this.load('./loveAssets/vein.png')
        };
        this._promises.push(new Promise(resolve => this.finishInto = resolve))

        this.loadingCount = 0;
        this.loadingTotal = 0;

        for (const value in this.loading) {
            this.loading[value].then(() => this.loadingCount++)
            this.loadingTotal ++;
        }

        this.add(new Rectangle({ color: 'black', height: this.height, width: this.width }))
        
        this.loadingText = this.add(new TextLine({ text: 'loading!', color: 'white', font: 'love', height: 120, x: 100, y: 100 }));

        this.inputText = this.add(new TextLine({ text: '', color: 'white', font: 'love', height: 120, x: 100, y: 200 }));

        this.step = 0;

        this.stepResults = [];
    }
    
    introInput() {
        // if (input.buttonPressed('left'))
        //    this.finishInto();

        let pressedKey;
        for (const key of Object.keys(input.keysPressed)) {
            pressedKey = key;
            
            break;
        }

        if (input.keyPressed('enter')) {
            pressedKey = undefined;
            this.stepResults[this.step] = this.inputText.text;
            this.inputText.text = '';
            this.step++;
        }

        if (this.step === 0) {
            this.loadingText.text = 'Enter player 1\'s name:';
            if (pressedKey)
                this.inputText.text += pressedKey;
        }
        else if (this.step === 1) {
            this.loadingText.text = 'Enter player 2\'s name:';
            if (pressedKey)
                this.inputText.text += pressedKey;
        }
    }

    onLoadingDraw() {
        if (this.loadingCount < this.loadingTotal) {
            this.loadingText.text = 'loading ' + this.loadingCount + ' of ' + this.loadingTotal
        } else {
            this.introInput();
        }
    }
    
    onLoad() {
        console.log('hi')
        this.scale.x = this.scale.y = 2

        this.background = this.add(new WavySprite({ image: this.loading.background.img }));
        this.blush = this.add(new Sprite({ image: this.loading.blush.img }));
        this.bubblelarge = this.add(new Sprite({ image: this.loading.bubblelarge.img }));
        this.bubblesmall = this.add(new Sprite({ image: this.loading.bubblesmall.img }));
        
        this.closedhand = this.add(new Sprite({ image: this.loading.closedhand.img }));
        this.exclamation = this.add(new Sprite({ image: this.loading.exclamation.img }));
        this.hearts = this.add(new Sprite({ image: this.loading.hearts.img }));
        
        this.messageleft = this.add(new Sprite({ image: this.loading.messageleft.img }));
        this.messageright = this.add(new Sprite({ image: this.loading.messageright.img }));
        this.nausea = this.add(new Sprite({ image: this.loading.nausea.img }));
        this.openhand = this.add(new Sprite({ image: this.loading.openhand.img }));
        this.tear = this.add(new Sprite({ image: this.loading.tear.img }));
        this.vein = this.add(new Sprite({ image: this.loading.vein.img }));
        
        this.crab = this.add(new Crab({ create: { loading: this.loading }, x: 400, y: 100 }))

        this.head = this.add(new Head({ create: { loading: this.loading }, x: 60, y: 70 }))
        
        this.message = this.add(new MessageBox({
                create: { 
                    side: 'right',
                    messageImage: this.loading.message.img, 
                    leftImage: this.loading.messageleft.img, 
                    rightImage: this.loading.messageright.img,
                    text: 'Anger and loathing course through your veins. Your blood runs hot, I recommend you close the game and cut off all contact with Player 2 at this point. Continue playing to experience the lowest low a relationship can go; prepare to bend underneath the metaphorical limbo stick of interpersonal disconnection.'
                },
                y: 250
            }));

        
    }
    
    onLoadedDraw() {
        if (input.buttonPressed('left')) {
            this.message.close();
        }

        time++;
    }
}

const scene = new MainScene({
    height: c.height,
    width: c.width
})


ocru.play(scene.group)

document.addEventListener('keydown', e => {
    if (e.key === 'z')
        ocru.step(scene.group)

    if (e.key === 'x')
        ocru.stop()

    if (e.key === 'c')
        ocru.play(scene.group)

    if (e.key === 'b')
        console.log(scene)
})