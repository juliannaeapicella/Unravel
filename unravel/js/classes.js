//standard gravitational force
let gravity = {x:0, y:500};

//ball class
class Circle extends PIXI.Sprite
{
	constructor(radius, x = app.view.width / 2, y = app.view.height / 2) 
	{
		super(PIXI.loader.resources["media/yarn.png"].texture);
		this.anchor.set(0.5, 0.5);
		this.scale.set(0.8);
		this.x = x;
		this.y = y;
		this.velocity = {x:0, y:0};
		this.acceleration = {x:0, y:0};
		this.direction = {x:0, y:1};
		this.radius = radius;
	}
	
	//moves ball
	move(dt = 1/60)
	{
		this.acceleration.y += gravity.y;
		this.velocity = addVectors(this.velocity, scale(this.acceleration, dt));
		this.x += this.velocity.x * dt;
		this.y += this.velocity.y * dt;	
		this.direction = normalize(this.velocity);
		this.acceleration = {x:0, y:0};
		this.rotation += this.direction.x * dt;
	}
	
	//reflects ball when it hits horizontal edges
	bounceX(dt = 1/60)
	{
		if(this.velocity.x != 0)
			this.velocity.x *= -0.7;
	}
	//reflects ball when it hits vertical edges
	bounceY(dt = 1/60)
	{
		if(this.velocity.y != 0)
			this.velocity.y *= -0.7;
	}
}

//segment class
class Segment extends PIXI.Graphics 
{
	constructor(width = 32, height = 18, color = 0xffb6ec, x = app.view.width / 2, y = app.view.height / 2) 
	{
		super();
		this.beginFill(color);
		this.drawRect(0, 0, width, height);
		this.endFill();
		this.x = x;
		this.y = y;
		this.velocity = {x:0, y:0};
		this.acceleration = {x:0, y:0};
		this.direction = {x:0, y:1};
	}
}



//unsticks object when it goes out of bounds
function unstick(object) 
{
	if (object.y > 500 - object.radius)
		object.y = 500 - object.radius;
	if (object.y < object.radius)
		object.y = object.radius;
	if (object.x > sceneWidth - object.radius)
		object.x = sceneWidth - object.radius;
	if (object.x < object.radius)
		object.x = object.radius;
}