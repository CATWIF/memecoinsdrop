// const Matter = require('matter-js');

function mulberry32(a) {
    return function() {
        let t = a += 0x6D2B79F5;
        t = Math.imul(t ^ t >>> 15, t | 1);
        t ^= t + Math.imul(t ^ t >>> 7, t | 61);
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }
}

const rand = mulberry32(Date.now());

const {
    Engine, Render, Runner, Composites, Common, MouseConstraint, Mouse,
    Composite, Bodies, Events,
} = Matter;

const wallPad = 64;
const loseHeight = 254;
const statusBarHeight = 40;
const previewBallHeight = 64;
const friction = {
    friction: 0.9,
    frictionStatic: 0.8,
    frictionAir: 0.008,
    restitution: 0.1
};


const GameStates = {
    MENU: 0,
    READY: 1,
    DROP: 2,
    LOSE: 3,
};

const Game = {
    width: 640,
    height: 960,
    elements: {
        canvas: document.getElementById('game-canvas'),
        ui: document.getElementById('game-ui'),
        score: document.getElementById('game-score'),
        end: document.getElementById('game-end-container'),
        endTitle: document.getElementById('game-end-title'),
        statusValue: document.getElementById('game-highscore-value'),
        nextFruitImg: document.getElementById('game-next-fruit'),
        previewBall: null,
    },
    cache: { highscore: 0 },
    sounds: {
        click: new Audio('./assets/click.mp3'),
        pop0: new Audio('./assets/pop0.mp3'),
        pop1: new Audio('./assets/pop1.mp3'),
        pop2: new Audio('./assets/pop2.mp3'),
        pop3: new Audio('./assets/pop3.mp3'),
        pop4: new Audio('./assets/pop4.mp3'),
        pop5: new Audio('./assets/pop5.mp3'),
        pop6: new Audio('./assets/pop6.mp3'),
        pop7: new Audio('./assets/pop7.mp3'),
        pop8: new Audio('./assets/pop8.mp3'),
        pop9: new Audio('./assets/pop9.mp3'),
        pop10: new Audio('./assets/pop10.mp3'),
    },

    stateIndex: GameStates.MENU,

    score: 0,
    fruitsMerged: [],
    calculateScore: function () {
        const score = Game.fruitsMerged.reduce((total, count, sizeIndex) => {
            const value = Game.fruitSizes[sizeIndex].scoreValue * count;
            return total + value;
        }, 0);

        Game.score = score;
        Game.elements.score.innerText = Game.score;
    },

    fruitSizes: [
        { radius: 24,  scoreValue: 1,  img: './assets/img/circle0.png'  },
        { radius: 32,  scoreValue: 3,  img: './assets/img/circle1.png'  },
        { radius: 40,  scoreValue: 6,  img: './assets/img/circle2.png'  },
        { radius: 56,  scoreValue: 10, img: './assets/img/circle3.png'  },
        { radius: 64,  scoreValue: 15, img: './assets/img/circle4.png'  },
        { radius: 72,  scoreValue: 21, img: './assets/img/circle5.png'  },
        { radius: 84,  scoreValue: 28, img: './assets/img/circle6.png'  },
        { radius: 96,  scoreValue: 36, img: './assets/img/circle7.png'  },
        { radius: 128, scoreValue: 45, img: './assets/img/circle8.png'  },
        { radius: 160, scoreValue: 55, img: './assets/img/circle9.png'  },
        { radius: 192, scoreValue: 66, img: './assets/img/circle10.png' },
    ],
    currentFruitSize: 0,
    nextFruitSize: 0,
    setNextFruitSize: function () {
        Game.nextFruitSize = Math.floor(rand() * 5);
        Game.elements.nextFruitImg.src = `./assets/img/circle${Game.nextFruitSize}.png`;
    },

    showHighscore: function () {
        Game.elements.statusValue.innerText = Game.cache.highscore;
    },
    loadHighscore: function () {
        const gameCache = localStorage.getItem('suika-game-cache');
        if (gameCache === null) {
            Game.saveHighscore();
            return;
        }

        Game.cache = JSON.parse(gameCache);
        Game.showHighscore();
    },
    saveHighscore: function () {
        Game.calculateScore();
        if (Game.score < Game.cache.highscore) return;

        Game.cache.highscore = Game.score;
        Game.showHighscore();
        Game.elements.endTitle.innerText = 'New Highscore!';

        localStorage.setItem('suika-game-cache', JSON.stringify(Game.cache));
    },

    initGame: function () {
        Render.run(render);
        Runner.run(runner, engine);

        Composite.add(engine.world, menuStatics);

        Game.loadHighscore();
        Game.elements.ui.style.display = 'none';
        Game.fruitsMerged = Array.apply(null, Array(Game.fruitSizes.length)).map(() => 0);

        const menuMouseDown = function () {
            if (mouseConstraint.body === null || mouseConstraint.body?.label !== 'btn-start') {
                return;
            }

            Events.off(mouseConstraint, 'mousedown', menuMouseDown);
            Game.startGame();

        }

        Events.on(mouseConstraint, 'mousedown', menuMouseDown);
    },

	startGame: function () {
		Game.sounds.click.play();
	
		Composite.remove(engine.world, menuStatics);
		Composite.add(engine.world, gameStatics);
	
		Game.calculateScore();
		Game.elements.endTitle.innerText = 'Game Over!';
		Game.elements.ui.style.display = 'block';
		Game.elements.end.style.display = 'none';
	
		// Assignar valor aleatori a Game.currentFruitSize i Game.nextFruitSize
		Game.currentFruitSize = Math.floor(rand() * 5); // Aleatori entre 0 i 4
		Game.setNextFruitSize(); // També establir el següent fruit aleatòriament
	
		Game.elements.previewBall = Game.generateFruitBody(Game.width / 2, previewBallHeight, Game.currentFruitSize, { isStatic: true });
		Composite.add(engine.world, Game.elements.previewBall);
	
		// Afegir una línia horitzontal dins del joc amb un collisionFilter per evitar col·lisions
		const horizontalLine = Bodies.rectangle(Game.width / 2, Game.height/4.6, Game.width, 5, {
			isStatic: true,
			render: {
				fillStyle: 'rgba(0, 178, 255, 1)' // Color de la línia horitzontal
			},
			collisionFilter: {
				group: -1, // Utilitza un grup de col·lisió negatiu per evitar col·lisions
				category: 0x0002,
				mask: 0x0000
			}
		});
		Composite.add(engine.world, horizontalLine);
	
		setTimeout(() => {
			Game.stateIndex = GameStates.READY;
		}, 250);
	
		Events.on(mouseConstraint, 'mouseup', function (e) {
			Game.addFruit(e.mouse.position.x);
		});
	
		Events.on(mouseConstraint, 'mousemove', function (e) {
			if (Game.stateIndex !== GameStates.READY) return;
			if (Game.elements.previewBall === null) return;
	
			Game.elements.previewBall.position.x = e.mouse.position.x;
		});
	
		document.addEventListener('keydown', function (e) {
			if (Game.stateIndex !== GameStates.READY) return;
			if (Game.elements.previewBall === null) return;
		
			switch (e.key) {
				case 'ArrowLeft':
					Game.elements.previewBall.position.x -= 20; // Moure a l'esquerra
					if (Game.elements.previewBall.position.x < 0) {
						Game.elements.previewBall.position.x = 0;
					}
					break;
				case 'ArrowRight':
					Game.elements.previewBall.position.x += 20; // Moure a la dreta
					if (Game.elements.previewBall.position.x > Game.width) {
						Game.elements.previewBall.position.x = Game.width;
					}
					break;
				case 'ArrowDown':
					Game.addFruit(Game.elements.previewBall.position.x); // Deixar caure la fruita
					break;
			}
		});
		

		Events.on(engine, 'collisionStart', function (e) {
			for (let i = 0; i < e.pairs.length; i++) {
				const { bodyA, bodyB } = e.pairs[i];
		
				// Skip if collision is wall
				if (bodyA.isStatic || bodyB.isStatic) continue;
		
				const aY = bodyA.position.y + bodyA.circleRadius;
				const bY = bodyB.position.y + bodyB.circleRadius;
		
				// Uh oh, too high!
				if (aY < loseHeight || bY < loseHeight) {
					Game.loseGame();
					return;
				}
		
				// Skip different sizes
				if (bodyA.sizeIndex !== bodyB.sizeIndex) continue;
		
				// Skip if already popped
				if (bodyA.popped || bodyB.popped) continue;
		
				let newSize = bodyA.sizeIndex + 1;
		
				// Go back to smallest size
				if (bodyA.circleRadius >= Game.fruitSizes[Game.fruitSizes.length - 1].radius) {
					newSize = 0;
				}
		
				Game.fruitsMerged[bodyA.sizeIndex] += 1;
		
				// Therefore, circles are same size, so merge them.
				const midPosX = (bodyA.position.x + bodyB.position.x) / 2;
				const midPosY = (bodyA.position.y + bodyB.position.y) / 2;
		
				bodyA.popped = true;
				bodyB.popped = true;
		
				Game.sounds[`pop${bodyA.sizeIndex}`].play();
				Composite.remove(engine.world, [bodyA, bodyB]);
				Composite.add(engine.world, Game.generateFruitBody(midPosX, midPosY, newSize));
				Game.addPop(midPosX, midPosY, bodyA.circleRadius);
				Game.calculateScore();
			}
		});
		
	},

	
    addPop: function (x, y, r) {
        const circle = Bodies.circle(x, y, r, {
            isStatic: true,
            collisionFilter: { mask: 0x0040 },
            angle: rand() * (Math.PI * 2),
            render: {
                sprite: {
                    texture: './assets/img/pop.png',
                    xScale: r / 384,
                    yScale: r / 384,
                }
            },
        });

        Composite.add(engine.world, circle);
        setTimeout(() => {
            Composite.remove(engine.world, circle);
        }, 100);
    },

    loseGame: function () {
        Game.stateIndex = GameStates.LOSE;
        Game.elements.end.style.display = 'flex';
        runner.enabled = false;
        Game.saveHighscore();
    },

    // Returns an index, or null
    lookupFruitIndex: function (radius) {
        const sizeIndex = Game.fruitSizes.findIndex(size => size.radius == radius);
        if (sizeIndex === undefined) return null;
        if (sizeIndex === Game.fruitSizes.length - 1) return null;

        return sizeIndex;
    },

    generateFruitBody: function (x, y, sizeIndex, extraConfig = {}) {
        const size = Game.fruitSizes[sizeIndex];
        const circle = Bodies.circle(x, y, size.radius, {
            ...friction,
            ...extraConfig,
            render: { sprite: { texture: size.img, xScale: size.radius / 512, yScale: size.radius / 512 } },
        });
        circle.sizeIndex = sizeIndex;
        circle.popped = false;

        return circle;
    },

    addFruit: function (x) {
        if (Game.stateIndex !== GameStates.READY) return;

        Game.sounds.click.play();

        Game.stateIndex = GameStates.DROP;
        const latestFruit = Game.generateFruitBody(x, previewBallHeight, Game.currentFruitSize);
        Composite.add(engine.world, latestFruit);

        Game.currentFruitSize = Game.nextFruitSize;
        Game.setNextFruitSize();
        Game.calculateScore();

        Composite.remove(engine.world, Game.elements.previewBall);
        Game.elements.previewBall = Game.generateFruitBody(render.mouse.position.x, previewBallHeight, Game.currentFruitSize, {
            isStatic: true,
            collisionFilter: { mask: 0x0040 }
        });

        setTimeout(() => {
            if (Game.stateIndex === GameStates.DROP) {
                Composite.add(engine.world, Game.elements.previewBall);
                Game.stateIndex = GameStates.READY;
            }
        }, 500);
    }
}

const engine = Engine.create();
const runner = Runner.create();
const render = Render.create({
    element: Game.elements.canvas,
    engine,
    options: {
        width: Game.width,
        height: Game.height,
        wireframes: false,
        background: '#fff',
    }
});



const ballDropLine = Bodies.rectangle(Game.width / 2, Game.height - 25, Game.width, 2, {
    isStatic: true,
    render: { fillStyle: 'rgb(255, 192, 203)' }
});

Composite.add(engine.world, ballDropLine);

const menuStatics = [
    // Full screen background
    Bodies.rectangle(Game.width / 2, Game.height / 2, Game.width, Game.height, {
        isStatic: true,
        render: { sprite: { texture: './assets/img/bg-menu.png', xScale: Game.width / 640, yScale: Game.height / 960 } },
    }),

    // Start button in the center
    Bodies.rectangle(Game.width / 2, Game.height / 2, 512, 96, {
        isStatic: true,
        label: 'btn-start',
        render: { sprite: { texture: './assets/img/btn-start.png' } },
    }),
];

const wallProps = {
    isStatic: true,
    render: { fillStyle: 'rgba(0, 178, 255, 1)' },
    height: 20,
    ...friction,
};

const gameStatics = [
    // Left
    Bodies.rectangle(-(wallPad / 2), Game.height / 2, wallPad, Game.height, wallProps),

    // Right
    Bodies.rectangle(Game.width + (wallPad / 2), Game.height / 2, wallPad, Game.height, wallProps),

    // Bottom
    Bodies.rectangle(Game.width / 2, Game.height + (wallPad / 2) - statusBarHeight, Game.width, wallPad, wallProps),

    // Lose line
   
];

// add mouse control
const mouse = Mouse.create(render.canvas);
const mouseConstraint = MouseConstraint.create(engine, {
    mouse: mouse,
    constraint: {
        stiffness: 0.2,
        render: {
            visible: false,
        },
    },
});
render.mouse = mouse;

Game.initGame();

// Show the overlay
const overlay = document.getElementById('overlay');
overlay.style.display = 'block';

const screenWidth = document.body.clientWidth;
const screenHeight = document.body.clientHeight;
const resizeCanvas = () => {
    const topBarHeight = document.getElementById('top-bar').offsetHeight;
    const bottomBarHeight = document.getElementById('bottom-bar').offsetHeight;

    const newContainerHeight = screenHeight - topBarHeight - bottomBarHeight;

    const canvasTop = topBarHeight + (newContainerHeight - Game.height) / 2;

    let newWidth = Game.width;
    let newHeight = Game.height;
    let scaleUI = 1;

    if (screenWidth * 1.5 > screenHeight) {
        newHeight = Math.min(Game.height, newContainerHeight);
        newWidth = newHeight / 1.5;
        scaleUI = newHeight / Game.height;
    } else {
        newWidth = Math.min(Game.width, screenWidth);
        newHeight = newWidth * 1.5;
        scaleUI = newWidth / Game.width;
    }

    render.canvas.style.width = `${newWidth}px`;
    render.canvas.style.height = `${newHeight}px`;
    render.canvas.style.top = `${canvasTop}px`;
    render.canvas.style.left = `${(screenWidth - newWidth) / 2}px`;

    Game.elements.ui.style.width = `${Game.width}px`;
    Game.elements.ui.style.height = `${Game.height}px`;
    Game.elements.ui.style.transform = `scale(${scaleUI})`;

    document.querySelector('.container').style.height = `${newContainerHeight}px`;

    setTimeout(() => {
        overlay.style.display = 'none';
    }, 0);
};

document.body.onload = resizeCanvas;
window.onresize = resizeCanvas;
