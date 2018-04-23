'use strict'

import { Rectangle, Sprite, Drawable, TextLine, Group, Scene } from './Ocru/drawable.js'
import { Ocru } from './Ocru/lib.js'

const c = document.getElementById('canvas')
const ocru = new Ocru(document.getElementById('canvas'), 60)
const ctx = c.getContext('2d')
document.getElementById('canvas').focus()
const input = ocru.input

let time = 0;
let player1Name;
let player2Name;

let player1Left = 'a';
let player1Right = 's';

let player2Left = 'k';
let player2Right = 'l';

let foodGoodScore = 0;
let foodBadScore = 0;

let umbrellaGood = true;
let kissingTime = 0;

//https://gist.github.com/hendriklammers/5231994
function splitString(string = '', size) {
	var re = new RegExp('.{1,' + size + '}', 'g');
	return string.match(re);
}

class Food extends Sprite.Events {
    onCreate() {
        this.yacc = -7;
        this.xacc = (Math.random() - 0.5) * 10

        this.scale.x = this.scale.y = 0.5
    }

    onFrame() {
        this.depth = -145
        this.x += this.xacc;
        this.y += this.yacc;

        this.yacc += 0.1;
        this.xacc += (0 - this.xacc) * 0.01;

        if (this.yacc > 0 && (this.isTouching(this.parent.crab.body) || this.isTouching(this.parent.head.head))) {
            foodGoodScore ++;
            this.remove();
        }

        if (this.y > 500) {
            foodBadScore ++;
            this.remove();
        }
    }
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
    onCreate({ side = 'none', messageImage, leftImage, rightImage, text } = {}) {
        this.scale.x = this.scale.y = 0;

        this.bubble = this.add(new Sprite({ image: messageImage }));
        if (side === 'left') {
            this.leftArrow = this.add(new Sprite({ image: leftImage, x: 40, y: -50 }));
        } else if (side === 'right') {
            this.rightArrow = this.add(new Sprite({ image: rightImage, x: 500, y: -50 }));
        }

        this.origin.x = this.bubble.width/2;
        this.origin.y = this.bubble.height/2;


        const newText = splitString(text, 70);

        if (newText)
            newText.forEach((t, i) => {
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

        this.umbrella = this.add(new Sprite({ image: loading.umbrella.img, opacity: 0, origin: { x: 100, y: 240 }, x: -30, y: -240 }));
    }

    onFrame() {
        this[this.status + 'Animation']();
    }

    idleAnimation() {
        this.rot = Math.sin(time/24) / 8

        this.scale.x = this.scale.y = 1.3 + Math.sin(time/16)/30

        this.x += (60 - this.x) * 0.2; 
        this.y += (70 - this.y) * 0.2; 

        this.umbrella.opacity += (0 - this.umbrella.opacity) * 0.02;
    }

    moveAnimation() {
        this.scale.x = this.scale.y += (0.5 - this.scale.y) * 0.2;

        if (input.keyDown(player1Left)) {
            this.x -= 2;
        }
        if (input.keyDown(player1Right)) {
            this.x += 2;
        }
    }

    umbrellaAnimation() {
        this.umbrella.opacity = 1;

        this.scale.x = this.scale.y += (0.5 - this.scale.y) * 0.2;

        if (input.keyDown(player1Left)) {
            this.x -= 2;
            this.umbrella.rot += 0.02;
        }
        if (input.keyDown(player1Right)) {
            this.x += 2;
            this.umbrella.rot -= 0.02;
        }

        if (this.umbrella.rot > Math.PI/2 || this.umbrella.rot < -Math.PI/2) {
            this.umbrella.y+= 5;
            umbrellaGood = false;
        } else {
            this.umbrella.rot += this.umbrella.rot / 80;
        }

        if (this.head.isTouching(this.parent.crab.body)) {
            kissingTime++;
        }
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

        this.umbrella = this.leftarmgroup.add(new Sprite({ image: loading.umbrella.img, opacity: 0, origin: { x: 100, y: 240 }, x: 30, y: -250 }));
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

        this.y = 100 + Math.cos(time/16) * 3;

        if (this.status === 'idle') {
            this.scale.x = this.scale.y += (1 - this.scale.y) * 0.2;

            this.x += (380 - this.x) * 0.2; 
            this.y += (100 - this.y) * 0.2; 

            this.umbrella.opacity += (0 - this.umbrella.opacity) * 0.02;
        }
    }

    moveAnimation() {
        this.idleAnimation();

        this.scale.x = this.scale.y += (0.5 - this.scale.y) * 0.2;

        if (input.keyDown(player2Left)) {
            this.x -= 2;
        }
        if (input.keyDown(player2Right)) {
            this.x += 2;
        }
    }

    umbrellaAnimation() {
        this.umbrella.opacity = 1;

        this.idleAnimation();

        this.scale.x = this.scale.y += (0.5 - this.scale.y) * 0.2;

        if (input.keyDown(player2Left)) {
            this.x -= 2;
            this.umbrella.rot += 0.02;
        }
        if (input.keyDown(player2Right)) {
            this.x += 2;
            this.umbrella.rot -= 0.02;
        }

        if (this.umbrella.rot > Math.PI/2 || this.umbrella.rot < -Math.PI/2) {
            this.umbrella.y+= 5;
            umbrellaGood = false;
        } else {
            this.umbrella.rot += this.umbrella.rot / 80;
        }
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
            clawleft: this.load('./loveAssets/clawleft.png'),
            clawright: this.load('./loveAssets/clawright.png'),
            closedhand: this.load('./loveAssets/closedhand.png'),
            message: this.load('./loveAssets/message.png'),
            legleft1: this.load('./loveAssets/legleft1.png'),
            legleft2: this.load('./loveAssets/legleft2.png'),
            legleft3: this.load('./loveAssets/legleft3.png'),
            legright1: this.load('./loveAssets/legright1.png'),
            legright2: this.load('./loveAssets/legright2.png'),
            legright3: this.load('./loveAssets/legright3.png'),
            messageleft: this.load('./loveAssets/messageleft.png'),
            messageright: this.load('./loveAssets/messageright.png'),

            sparkle: this.load('./loveAssets/sparkle.png'),

            dinnerbackground: this.load('./loveAssets/dinnerbackground.png'),
            apple: this.load('./loveAssets/apple.png'),
            carrot: this.load('./loveAssets/carrot.png'),

            waiter: this.load('./loveAssets/waiter.png'),
            table: this.load('./loveAssets/table.png'),
            tablecloth: this.load('./loveAssets/tablecloth.png'),
            foodcover: this.load('./loveAssets/foodcover.png'),

            rainbackground: this.load('./loveAssets/rainbackground.png'),
            rain1: this.load('./loveAssets/rain1.png'),
            rain2: this.load('./loveAssets/rain2.png'),

            umbrella: this.load('./loveAssets/umbrella.png')
        };
        this._promises.push(new Promise(resolve => this.finishInto = resolve))

        this.loadingCount = 0;
        this.loadingTotal = 0;

        for (const value in this.loading) {
            this.loading[value].then(() => this.loadingCount++)
            this.loadingTotal ++;
        }

        this.add(new Rectangle({ color: 'black', height: this.height, width: this.width }));
        
        this.loadingText = this.add(new TextLine({ text: 'loading!', color: 'white', font: 'love', height: 40, x: 100, y: 100 }));
        this.inputText = this.add(new TextLine({ text: '', color: 'white', font: 'love', height: 40, x: 100, y: 200 }));

        this.realLoadingText = this.add(new TextLine({ text: 'loading!', color: 'gray', font: 'love', height: 30, x: 100, y: 680 }));

        this.add(new TextLine({ text: 'Please fill out important dating information:', color: 'crimson', font: 'love', height: 30, x: 20, y: 10 }));

        this.step = 0;
        
        this.jokeStartTime = undefined;

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
            if (this.inputText.text.length > 0) {
                this.stepResults[this.step] = this.inputText.text;
                this.inputText.text = '';
                this.step++;
            }

            if (this.stepResults[0]) {
                player1Name = this.stepResults[0];
                this.stepResults[this.step] = undefined;
            }
            if (this.stepResults[4]) {
                player2Name = this.stepResults[4];
                this.stepResults[this.step] = undefined;
            }
        }

        if (pressedKey)
            if (input.keyPressed('backspace')) {
                this.inputText.text = this.inputText.text.slice(0, -1); 
            } else {
                this.inputText.text += pressedKey;
            }

        if (this.step === 0) {
            this.loadingText.text = 'Enter player 1\'s name:';
        }
        else if (this.step === 1) {
            this.loadingText.text = 'Enter ' + player1Name + '\'s favourite color:';
        }
        else if (this.step === 2) {
            this.loadingText.height = 30
            this.loadingText.text = 'Enter ' + player1Name + '\'s most attractive trait:';
        }
        else if (this.step === 3) {
            this.loadingText.height = 16
            this.loadingText.text = 'Enter ' + player1Name + '\'s favourite 1992 Winter Olympics Women\'s Figure Skating medalist:';
            if (this.jokeStartTime === undefined) {
                this.jokeStartTime = time;
            }
            if (Math.random() < 0.2) { //make typing more random
                this.jokeStartTime -= 10;
            }

            this.inputText.text =  'Kristi Yamaguchi'.substring(0, ((time - this.jokeStartTime)/40) |0);

            if ((((time - this.jokeStartTime)/30) |0) > 'Kristi Yamaguchi'.length + 21) {
                this.inputText.text = '';
                this.step++;
            }
            
        }
        else if (this.step === 4) {
            this.loadingText.height = 40
            this.loadingText.text = 'Enter player 2\'s name:';
        }
        else if (this.step === 5) {
            this.loadingText.text = 'Enter ' + player2Name + '\'s favourite color:';
        }
        else if (this.step === 6) {
            this.loadingText.height = 30
            this.loadingText.text = 'Enter ' + player2Name + '\'s most attractive trait:';
        } else {
            this.finishInto();
        }
    }

    onLoadingDraw() {
        if (this.loadingCount < this.loadingTotal) {
            this.realLoadingText.text = 'loading ' + this.loadingCount + ' of ' + this.loadingTotal + ' assets';
        } else {
            this.realLoadingText.text = 'done loading!'
        }
            
        this.introInput();

        time++;
    }
    
    onLoad() {
        console.log('hi')
        this.scale.x = this.scale.y = 2

        this.background = this.add(new WavySprite({ image: this.loading.background.img }));
        /*
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
        this.vein = this.add(new Sprite({ image: this.loading.vein.img }));*/
        
        this.crab = this.add(new Crab({ create: { loading: this.loading }, x: 380, y: 100 }))

        this.head = this.add(new Head({ create: { loading: this.loading }, x: 60, y: 70 }))


        this.state = 'intro';

        this.black = this.add(new Rectangle({ color: 'black', height: this.height, width: this.width }));
        this.sparkle = this.add(new Sprite({ image: this.loading.sparkle.img, x: 85, y: 55 }));
        this.introStartTime = time;

        this.dialogue = [
            { side: 'none', text: () => 'press a, s, k, or l to advance text.'},
            { text: () => 'hey there ' +  player2Name + ', you\'re looking good', side: 'left' },
            { text: () => 'hey ' + player1Name + ' you don\'t look so bad yourself', side: 'right' },
            { text: () => 'Things are going well so far, don\'t mess this up. Remember: smiling or laughing in the presence of a romantic prospect is unattractive, remain serious at all costs', side: 'none', action: () => {
                this.state = 'restaurantIntro';
                this.dinnerbackground = this.add(new Sprite({ image: this.loading.dinnerbackground.img, x: this.width }));
                this.dinnerbackground.depth = -61;
                this.table = this.add(new Sprite({ image: this.loading.table.img, x: -200, y: 200 }));
                this.tablecloth = this.add(new Sprite({ image: this.loading.tablecloth.img, x: -300, y: 190, shear: { x: 0.5, y: 0} }));
            }},
            { text: () => 'The DINNER DATE!', side: 'none', action: () => {
                this.head.status = 'move';
                this.crab.status = 'move';
                this.spewFruit = time;
            }},
            { 
                text: () => player1Name + ' move with "a" and "s" keys, ' + player2Name + ' move with "k" and "l".', 
                condition: () => foodGoodScore > 5 || foodBadScore > 5,
                action: () => {
                    player1Left = 'k';
                    player2Left = 'a';
                }
            },
            {
                text: () => 'NEW MOVES!!!!' + player1Name + ' move with "k" and "s" keys, ' + player2Name + ' move with "a" and "l".', 
                condition: () => foodGoodScore > 10 || foodBadScore > 6,
                action: () => {
                    player1Left = 'a';
                    this.crab.status = 'idle';
                    this.head.status = 'idle';
                    player2Left = 'k';

                    this.doneFood = time;
                    this.spewFruit = undefined;
                }
            },
            {   
                text: () => foodBadScore < 6 ? 
                "The chemistry you feel is real. It's not just the game. Prepare a pick up line in your head while you continue to play." :
                "The disgust you feel for eachother in the game begins to seep in to real life, causing you to discretely scooch your chair away from eachother. Try again.",
                condition: () => time - this.doneFood > 50 && foodBadScore < 10  && (input.keyPressed('a') || input.keyPressed('s') || input.keyPressed('k') || input.keyPressed('l')),
                action: () => { 
                    this.state = 'rainIntro';
                    this.rainbackground = this.add(new Sprite({ image: this.loading.rainbackground.img, x: this.width }));
                    this.rain1 = this.add(new Sprite({ image: this.loading.rain1.img}));
                    this.rain2 = this.add(new Sprite({ image: this.loading.rain2.img}));

                    this.rainbackground.depth = -62;
                    this.rain1.depth = -63;
                    this.rain2.depth = -64;
                }
            },
            { text: () => 'The KISS IN THE RAIN!' },
            { 
                text: () => "The romance has escalated. You begin to picture" + player2Name + "'s face in place of the crab. Spend as much time kissing as possible without losing your umrellas.", 
                action: () => {
                    this.head.status = 'umbrella';
                    this.crab.status = 'umbrella';
                    this.rainStart = time;
                }},
            { 
                text: () => player1Name + ' move with "a" and "s" keys, ' + player2Name + ' move with "k" and "l".', 
                condition: () => kissingTime > 60 * 5 || !umbrellaGood,
                action: () => {
                    player1Right = 'l';
                    player2Right = 's';
                }
            },
            { 
                text: () => 'NEW MOVES!!!!' + player1Name + ' move with "a" and "l" keys, ' + player2Name + ' move with "k" and "s".', 
                condition: () => kissingTime > 60 * 10 || !umbrellaGood,
                action: () => {
                    this.crab.status = 'idle';
                    this.head.status = 'idle';

                    this.doneRain = time
                }
            },
            {
                text: () => umbrellaGood ? "A magical moment between " + player1Name + " and " + player2Name + " the crab.":
                player1Name + " has acquired a complete distaste for " + player1Name + "'s personality. " + player2Name + "'s detestable actions as the crab have caused a fundamental fracture in your relationship.",
                condition: () => time - this.doneRain > 50 && (input.keyPressed('a') || input.keyPressed('s') || input.keyPressed('k') || input.keyPressed('l'))
            },
            {
                text: () => umbrellaGood ? 
                "Your relationship with " + player2Name + " as the crab entices to think of how a real life romance with " + player2Name + " would be. Make eye contact with " + player2Name + ", hold it as long as you can.": 
                "Anger and loathing course through your veins. Your blood runs hot, I recommend you close the game and cut off all contact with " + player1Name + " at this point. Continue in your friendship to experience the lowest low a relationship can go; prepare to bend underneath the metaphorical limbo stick of interpersonal disconnection",
                condition: () => umbrellaGood && (input.keyPressed('a') || input.keyPressed('s') || input.keyPressed('k') || input.keyPressed('l'))
            },
            {
                text: () => 'I had a really fun time',
                side: 'left',
                action: () => { 
                    this.state = 'fade';
                    this.add(this.black);
                    this.black.opacity = 0;
                }
            },
            { text: () => 'me too', side: 'right'},
            { text: () => 'THE END', side: 'none', condition: () => false }
        ];
        this.dialogueBoxes = [];
        this.dialogueStep = 0;
    }
    
    onLoadedDraw() {
        this[this.state + 'State']();

        time++;
    }

    fadeState() {
        this.runDialogue();
        this.black.opacity += 0.01;
    }

    introState() {
        this.sparkle.rot += 0.1;
        
        this.sparkle.scale.x = this.sparkle.scale.y = Math.sin((time-this.introStartTime)/20) * 5;

        if (time-this.introStartTime > 63) {
            this.sparkle.remove();
            this.state = 'undersea1';
        }
    }

    undersea1State() {
        this.black.opacity -= 0.01;
        if (this.black.opacity < 0.02 && this.black.remove) {
            this.black.remove();
        }
        this.runDialogue();
    }

    rainIntroState() {
        this.rainbackground.x += (0 - this.rainbackground.x) * 0.2;

        this.table.x += (770 - this.table.x) * 0.2;
        this.tablecloth.x += (752 - this.tablecloth.x) * 0.15;

        if (time % 20 < 10) {
            this.rain1.opacity = 0;
            this.rain2.opacity = 1;
        } else {
            this.rain1.opacity = 1;
            this.rain2.opacity = 0;
        }

        if (this.tablecloth.x > 751) {
            this.state = 'rain';
        }
    }

    rainState() {
        this.runDialogue();

        if (time % 20 < 10) {
            this.rain1.opacity = 0;
            this.rain2.opacity = 1;
        } else {
            this.rain1.opacity = 1;
            this.rain2.opacity = 0;
        }
    }

    restaurantIntroState() {
        this.dinnerbackground.x += (0 - this.dinnerbackground.x) * 0.2;
        this.table.x += (170 - this.table.x) * 0.2;
        this.tablecloth.x += (152 - this.tablecloth.x) * 0.15;
        this.tablecloth.shear.x += (0 - this.tablecloth.shear.x) * 0.1;

        if (this.tablecloth.x > 151.5) {
            this.state = 'restaurant';
        }
    }

    restaurantState() {
        this.runDialogue();

        if (this.spewFruit !== undefined) {
            if ((time - this.spewFruit) % 100 < 1) {
                let a = this.add(new Food({ image: this.loading.apple.img, x: 260, y: 200 }));
                a.depth = -145;
            }
        }
    }

    runDialogue() {
        if (this.dialogueBoxes[this.dialogueStep] === undefined) {
            this.dialogueBoxes[this.dialogueStep] = this.add(new MessageBox({
                create: { 
                    side: this.dialogue[this.dialogueStep].side,
                    messageImage: this.loading.message.img, 
                    leftImage: this.loading.messageleft.img, 
                    rightImage: this.loading.messageright.img,
                    text: this.dialogue[this.dialogueStep].text()
                },
                y: 245 + Math.random() * 10
            }));
        }
        if (this.dialogueBoxes[this.dialogueStep-1] !== undefined) {
            this.dialogueBoxes[this.dialogueStep-1].close();
        }

        if (this.dialogue[this.dialogueStep].condition) {
            if (this.dialogue[this.dialogueStep].condition()) {
                if (this.dialogue[this.dialogueStep].action) {
                    this.dialogue[this.dialogueStep].action();
                    this.dialogueBoxes[this.dialogueStep].close();
                }
                this.dialogueStep++;
            }
        } else {
            if (input.keyPressed('a') || input.keyPressed('s') || input.keyPressed('k') || input.keyPressed('l')) {
                if (this.dialogue[this.dialogueStep].action) {
                    this.dialogue[this.dialogueStep].action();
                    this.dialogueBoxes[this.dialogueStep].close();
                }
                this.dialogueStep++;
            }
        }
    }
}

const scene = new MainScene({
    height: c.height,
    width: c.width
});


ocru.play(scene.group);