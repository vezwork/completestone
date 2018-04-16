import { Rectangle, Sprite, Drawable, TextLine, Scene, Group, View } from './Ocru/drawable.js'
import { Ocru } from './Ocru/lib.js'

const v1 = new View({ x: 1 });
const v2 = new View({ x: 2 });
const v3 = new View({ x: 3 });
const v4 = new View({ x: 4 });
const v5 = new View({ x: 5 });
const v6 = new View({ x: 6 });


const g1 = new Group({ x: 1 });
const g2 = new Group({ x: 2 });
const g3 = new Group({ x: 3 });
const g4 = new Group({ x: 4 });
const g5 = new Group({ x: 5 });
const g6 = new Group({ x: 6 });

const d1 = new Drawable({ x: 1 });
const d2 = new Drawable({ x: 2 });
const d3 = new Drawable({ x: 3 });
const d4 = new Drawable({ x: 4 });
const d5 = new Drawable({ x: 5 });
const d6 = new Drawable({ x: 6 });
const d7 = new Drawable({ x: 7 });

v1.subject = g1
v2.subject = g2
v3.subject = g2
v4.subject = g4
v5.subject = g4
v6.subject = g5

g1.add(v2)
g1.add(v5)
g2.add(g3)
//g2.add(v4) //
g3.add(v6)
g3.add(d1)
g4.add(g6)
g4.add(d7)
g5.add(d2)
g5.add(d3)
g6.add(d4)
g6.add(d5)
g6.add(d6)

Drawable.touching(d3, d6)