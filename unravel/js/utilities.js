//gradually moves a vector to another position
function lerp(start, end, amt)
{
  	return start * (1-amt) + amt * end;
}

//function to add vectors
function addVectors(v1, v2) 
{
	let v = {x:v1.x, y:v1.y};
	v.x += v2.x;
    v.y += v2.y;
    return v;
}

//function to subtract vectors
function subVectors(v1, v2) 
{
    return addVectors(v1, scale(v2, -1));
}

//function to scale vectors
function scale(v, scalar) 
{
	let newv = {x:v.x, y:v.y};
	newv.x *= scalar;
	newv.y *= scalar;
	return newv;
}

//function to divide-scale vectors
function divideScale(v, scalar) 
{
	if(scalar != 0)
		return scale(v, 1 / scalar);
	else
		return {x:0, y:0};
}

//function to find the length of vectors
function length(v) 
{
	return Math.sqrt((v.x * v.x) + (v.y * v.y));
}

//function to normalize vectors
function normalize(v) 
{
	return divideScale(v, length(v));
}