"use strict";
//create view
const app = new PIXI.Application(600,600);
project.appendChild(app.view);

// constants for scene
const sceneWidth = app.view.width;
const sceneHeight = app.view.height;

//holds stage
let stage;

//standard button style
let buttonStyle = new PIXI.TextStyle({
	fill: 0x7E7660,
	fontSize: 48,
	fontFamily: "Garamond"
});

//scene variables
let startScene;
let gameScene;

//ball and ball movement
let bg;
let ball;
let ballRect;
let floor;
let mouse;
let dragging;

//segments and score
let segment;
let segments = [];
let maxCount = 0;
let ballScale = 0.8;
let score = 0;
let totalScore = 0;

//labels
let newGame;
let scoreLabel;
let totalScoreLabel;

//consts for data storage
const prefix = "jea3348-";
const scoreKey = prefix + "score";
const storedScore = localStorage.getItem(scoreKey);

//sounds
let thumpSound;
let music;

//loads in texture
PIXI.loader.
add(["media/yarn.png"]).
on("progress",e=>{console.log(`progress=${e.progress}`)}).
load(setup);

//set up game
function setup() 
{	
	//set stage
	stage = app.stage;
	
	//draw background
	bg = new PIXI.Graphics();
	bg.beginFill(0xfcf3de);
	bg.drawRect(0, 0, 600, 600);
	stage.addChild(bg);

	//draw floor
	floor = new PIXI.Graphics();
	floor.beginFill(0xc7fcb6);
	floor.drawRect(0, sceneHeight - 100, 600, 100);
	stage.addChild(floor);
	
	//create start scene
	startScene = new PIXI.Container();
	stage.addChild(startScene);
	
	//create the main game scene and make it invisible
	gameScene = new PIXI.Container();
	gameScene.visible = false;
	stage.addChild(gameScene);
	
	//create labels for all scenes
	createLabelsAndButtons();
		
	//start update loop
	app.ticker.add(gameLoop);
	
	//load sounds
	thumpSound = new Howl({
		src: ['sounds/thump.wav']
	});
	
	music = new Howl({
		src: ['sounds/chopin.mp3'], 
		loop: true
	});
}

//makes labels for game
function createLabelsAndButtons() 
{	
	//standard text style
	let textStyle = new PIXI.TextStyle({
		fill: 0x7E7660,
		fontSize: 18,
		fontFamily: "Garamond",
		stroke: 0x7E7660,
		strokeThickness: 1
	})

	//make the top start labels
	let startLabel = new PIXI.Text("Unravel");
	startLabel.style = new PIXI.TextStyle({
		fill: 0x7E7660,
		fontSize: 96,
		fontFamily: "Garamond",
		stroke: 0x7E7660,
		strokeThickness: 6
	})
	startLabel.x = 150;
	startLabel.y = 120;
	startScene.addChild(startLabel);
	
	//make the start game button
	let startButton = new PIXI.Text("Begin Unraveling");
	startButton.style = buttonStyle;
	startButton.x = 142;
	startButton.y = sceneHeight - 300;
	startButton.interactive = true;
	startButton.buttonMode = true;
	startButton.on("pointerup", startGame);
	startButton.on("pointerover", e=>e.target.alpha = 0.7);
	startButton.on("pointerout", e=>e.currentTarget.alpha = 1.0)
	startScene.addChild(startButton);
	
	//make game score labels
	totalScoreLabel = new PIXI.Text();
	totalScoreLabel.style = textStyle;
	totalScoreLabel.x = 5;
	totalScoreLabel.y = 5;
	gameScene.addChild(totalScoreLabel);
	if(storedScore) 
		increaseTotalScoreBy(parseInt(storedScore, 10)); //if a previous score exists, start there
	else
		increaseTotalScoreBy(0);
	
	scoreLabel = new PIXI.Text();
	scoreLabel.style = textStyle;
	scoreLabel.x = 5;
	scoreLabel.y = 25;
	gameScene.addChild(scoreLabel);
	increaseScoreBy(0);
}

//begins game
function startGame()
{
	music.play();
	startScene.visible = false;
	gameScene.visible = true;
	loadLevel();
}

//loads level
function loadLevel()
{	
	//create ball and properties of ball
	ball = new Circle(50);
	ball.interactive = true;
    ball.buttonMode = true;
	
	ball
		// events for drag start
		.on('mousedown', onDragStart)
		.on('touchstart', onDragStart)
        // events for drag end
        .on('mouseup', onDragEnd)
        .on('mouseupoutside', onDragEnd)
        .on('touchend', onDragEnd)
        .on('touchendoutside', onDragEnd)
        // events for drag move
        .on('mousemove', onDragMove)
        .on('touchmove', onDragMove);
	stage.addChild(ball);
}

//restart game
function resetGame() 
{
	//delete segments
	for(let i = segments.length; i > 0; i--)
	{
		stage.removeChild(segments[i - 1]);
		segments.pop(segments[i - 1]);
	}
	
	//remove button
	stage.removeChild(newGame);
	
	//reset ball
	ballScale = 0.8;
	loadLevel();
}

//main game loop
function gameLoop()
{
	//find deltaTime
	let dt = 1/app.ticker.FPS;
	if (dt > 1/12) 
		dt=1/12;
	
	//find mouse
	mouse = app.renderer.plugins.interaction.mouse.global;
	
	//behavior for the ball while in a neutral state
	if (ball != null && !dragging)
	{
		ball.move(dt);
		//bounces off walls
		if (ball.y >= 500 - ball.radius|| ball.y <= ball.radius)
		{
			ball.bounceY(dt);
			if(ball.velocity.y < -25)
				thumpSound.play();
		}
		if (ball.x >= sceneWidth - ball.radius || ball.x <= ball.radius)
		{
			ball.bounceX(dt);
			thumpSound.play();
		}
		unstick(ball); //ball may get caught between corners or on edges when it moves too far; this pushes it back into the correct space
		
		//controls the spawning of segments
		if(ball.velocity.x > 0 && maxCount < 3) //caps max amount of length at 3 per toss
		{
			//spawns segment at the end of the line
			if(segments.length == 0)
				segment = new Segment(32, 18, 0xffb6ec, ball.x, ball.y);
			else
				segment = new Segment(32, 18, 0xffb6ec, segments[segments.length - 1].x, segments[segments.length - 1].y);
			stage.addChild(segment);
			segments.push(segment);
			
			//count total number of segments
			maxCount++;
			
			//increase scores
			increaseScoreBy(2);
			increaseTotalScoreBy(2);
			
			//adjust ball size
			ball.radius--;
			ballScale -= 0.01;
			ball.scale.set(ballScale);
		}
		else if(ball.velocity.x <= 0) 
		{
			maxCount = 0; //resets count if ball turns
		}
		
		//if the ball gets too small,
		if(segments.length > 30)
		{
			//delete ball
			stage.removeChild(ball);
			ball = null;
			
			//create reset button
			newGame = new PIXI.Text("Unravel More?");
			newGame.style = buttonStyle;
			newGame.x = 170;
			newGame.y = sceneHeight - 300;
			newGame.interactive = true;
			newGame.buttonMode = true;
			newGame.on("pointerup", resetGame); 
			newGame.on("pointerover", e=>e.target.alpha = 0.7); 
			newGame.on("pointerout", e=>e.currentTarget.alpha = 1.0) 
			stage.addChild(newGame);
		}
	}
	
	//controls behavior for segments
	if(segments.length > 0) 
	{
		//if ball is going to the right
		if(ball != null && ball.velocity.x >= 0) 
		{
			//moves segment to each other in a chain
			for(let i = 0; i < segments.length - 1; i++) 
				{
					segments[i + 1].x = lerp(segments[i + 1].x, segments[i].x - segments[i].width, 15 * dt);
					segments[i + 1].y = lerp(segments[i + 1].y, segments[i].y, 15 * dt);
				}
			//attaches segment chain to ball
			segments[0].y = lerp(segments[0].y, ball.y + (ball.radius - 15), 15 * dt);
			segments[0].x = lerp(segments[0].x, ball.x - segments[0].width, 15 * dt);
		}
		//if ball is going to the left
		else if(ball != null && ball.velocity.x < 0) 
		{
			for(let i = 0; i < segments.length - 1; i++) 
				{
					segments[i + 1].x = lerp(segments[i + 1].x, segments[i].x + segments[i].width, 15 * dt);
					segments[i + 1].y = lerp(segments[i + 1].y, segments[i].y, 15 * dt);
				}
			segments[0].y = lerp(segments[0].y, ball.y + (ball.radius - 15), 15 * dt);
			segments[0].x = lerp(segments[0].x, ball.x, 15 * dt);
		}
		//if ball doesnt exist
		else if(ball == null) 
		{
			//moves segments to rest on floor
			for(let i = 0; i < segments.length - 1; i++)
			{
				segments[i + 1].x = lerp(segments[i + 1].x, segments[i].x - segments[i].width, 5 * dt);
				segments[i + 1].y = lerp(segments[i + 1].y, segments[i].y, 5 * dt);
			}
			segments[0].y = lerp(segments[0].y, 500, 5 * dt);
			segments[0].x = lerp(segments[0].x, 600, 5 * dt);
		}
	}
}

//calculate ball behavoir as it is picked up
function onDragStart(event)
{
    // store a reference to the data
    this.data = event.data;
	
	//set velocity to 0
	this.velocity.x = 0;
	this.velocity.y = 0;
	
	//mark that this object is being dragged
    dragging = true;
}

//keeps track of positions
let newPosition;
let oldPosition;

//ball behavior when mouse is released
function onDragEnd()
{
	//calculates acceleration from change in position
	let dragAccel = subVectors(newPosition, oldPosition);
	this.acceleration = addVectors(this.acceleration, scale(dragAccel, 1000))
	
	dragging = false;
    // set the interaction data to null
    this.data = null;
}

//ball behavior when ball is being dragged
function onDragMove()
{
	//keeps ball in range of scene
    if (dragging && (mouse.x < sceneWidth - 50 && mouse.x > 50 && mouse.y < sceneHeight - 150 && mouse.y > 50))
    {
		//calculate positions
		oldPosition = {x:this.x, y:this.y}
		newPosition = this.data.getLocalPosition(this.parent);
		//set ball to mouse positions
        this.x = newPosition.x;
		this.y = newPosition.y
    }
}

//increases score by designated amount
function increaseScoreBy(value) 
{
	score += value;
	
	//updates display
	scoreLabel.text = `Unraveled: ${score} yards`;
}
//increases total score by designated amount
function increaseTotalScoreBy(value) 
{
	totalScore += value;
	
	//save to local storage
	localStorage.setItem(scoreKey, totalScore);
	
	//updates display
	totalScoreLabel.text = `Total Unraveled: ${totalScore} yards`;
}