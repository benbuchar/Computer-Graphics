"use strict";

var canvas;
var gl;

var points = [];
var pointsLocation;
var numOfPoints;
var numOfPointsLoc;

var theta;

var numTimesToSubdivide = 0;
var numOfSquares = 1;
var numOfSquaresLoc;
var centers = [];

var colors = [];

var thetaLoc;
var theta = 0.0;
var delay = 50;
var spinning = false;
var direction = true;
var divided = false;
var redbutton = false;
var blendRandom = false;
var blendSmooth = true;
var uniform = false;
var random = false;
var changedColor = false;

var initialized = false;


function init()
{
    canvas = document.getElementById( "gl-canvas" );

    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) {
		alert( "WebGL isn't available" ); 
	}
	var corners = [
	vec2(-.7,-.7),
	vec2(-.7,.7),
	vec2(.7,.7),
	vec2(.7,-.7)
	];

	
	divideCarpet(corners[0], corners[1], corners[2], corners[3], numTimesToSubdivide);


    //
    //  Configure WebGL
    //
    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 0.0, 0.0, 0.0, 1.0 );

    //  Load shaders and initialize attribute buffers

    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

    // Load the data into the GPU

    var bufferId = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, bufferId );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW );
    
    // Associate out shader variables with our data buffer

    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );
    
    
    var centerBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, centerBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(centers), gl.DYNAMIC_DRAW);
    
    var vCenter = gl.getAttribLocation(program,"vCenter");
    gl.vertexAttribPointer(vCenter, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vCenter);
    
    
    var colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW);
    
    var vColor = gl.getAttribLocation(program,"vColor");
    gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vColor);
    

	
	thetaLoc = gl.getUniformLocation(program,"theta");   
	
	document.getElementById("rotate").onclick = function(){
		spinning = !spinning;
	};
	
	document.getElementById("gl-canvas").onclick = function(){
		direction = !direction;
	};
	
    document.getElementById("slider").oninput = function(event) {
        numTimesToSubdivide = parseInt(event.target.value);
        numOfSquares = Math.pow(8,numTimesToSubdivide);
		divided = true;
    };
    
    document.getElementById("redbutton").onclick = function(){
        redbutton = !redbutton;
    };
    
    document.getElementById("blendSmooth").onclick = function(){
        colors = [];
        changedColor = true;
        blendSmooth = true;
        random = false;
        blendRandom = false;
        uniform = false;
    };
    
    document.getElementById("blendRandom").onclick = function(){
        colors = [];
        changedColor = true;
        blendRandom = true;
        random = false;
        blendSmooth = false;
        uniform = false;
    };
    
    document.getElementById("uniform").onclick = function(){
        colors = [];
        changedColor = true;
        uniform = true;
        random = false;
        blendSmooth = false;
        blendRandom = false;
    };
    
    document.getElementById("random").onclick = function(){
        colors = [];
        random = true;
        changedColor = true;
        uniform = false;
        blendSmooth = false;
        blendRandom = false;
    };

    
	if(!initialized){
		render();
		initialized = true;
	}
    
};

function carpet( a, b, c,d )
{
    points.push( a, b, c);
	points.push(a,d,c);
    numOfPoints = points.length;
    
    var center = mix(a, c, 0.5);
    centers.push(center,center,center,center,center,center);
    //var color = (1.0,1.0,1.0,1.0);
    //colors.push(color);
      var vertexColors = [
        //[ 0.0, 0.0, 0.0, 1.0 ],  // black
        [ 1.0, 0.0, 0.0, 1.0 ],  // red
        [ 1.0, 1.0, 0.0, 1.0 ],  // yellow
        [ 0.0, 1.0, 0.0, 1.0 ],  // green
        [ 0.0, 0.0, 1.0, 1.0 ],  // blue
        [ 1.0, 0.0, 1.0, 1.0 ],  // magenta
        [ 0.0, 1.0, 1.0, 1.0 ],  // cyan
        [ 1.0, 1.0, 1.0, 1.0 ]   // white
    ];


    var indices = [ a, b, c, a, c, d ];
    var savedLeft;
    var savedRight;
    if(uniform){
        var rn = Math.floor(Math.random() *6);
        for(var i = 0; i< indices.length; ++i){
         colors.push(vertexColors[rn]);
        }
    } else if(blendRandom){
        for ( var i = 0; i < indices.length; ++i ) {
        var rn = Math.floor(Math.random() *6);
        colors.push( vertexColors[rn] );

        // for solid colored faces use
        //colors.push(vertexColors[a]);

        }
    } else if(blendSmooth){
        var bottomLeft = Math.floor(Math.random() * 6);
        var topLeft = Math.floor(Math.random()*6);
        var topRight = Math.floor(Math.random()*6);
        var bottomRight = Math.floor(Math.random()*6);
        colors.push(vertexColors[bottomLeft]);
        colors.push(vertexColors[topLeft]);
        colors.push(vertexColors[topRight]);
        colors.push(vertexColors[bottomLeft]);
        colors.push(vertexColors[bottomRight]);
        colors.push(vertexColors[topRight]);       
    } else if(random){
        var rc = [Math.random().toFixed(2), Math.random().toFixed(2),
                  Math.random().toFixed(2), 1.0];
        colors.push(rc,rc,rc,rc,rc,rc);
    }
    
}

function divideCarpet(a,b,c,d,count)
{

    // check for end of recursion

    if ( count === 0 ) {
        carpet(a, b, c, d);
    }
    else {

        //bisect the sides

       // var ab = mix( a, b, 0.33 );
        
		
		var ab = mix(a,b,0.5);
		var bc = mix(b,c,0.5);
		var cd = mix(c,d,0.5);
		var da = mix(d,a,0.5);
		
		var third1 = mix(a,b,0.33);
		var third2 = mix(b,a,0.33);
		var third3 = mix(b,c,0.33);
		var third4 = mix(c,b,0.33);
		var third5 = mix(c,d,0.33);
		var third6 = mix(d,c,0.33);
		var third7 = mix(d,a,0.33);
		var third8 = mix(a,d,0.33);
		
		var quarter1 = mix(a, c, 0.33);
		var quarter2 = mix(b,d, 0.33);
		var quarter3 = mix(c,a, 0.33);
		var quarter4 = mix(d,b, 0.33);
		//note they're also thirds not quarters.
		
		var q12 = mix(quarter1, quarter2, 0.5);
		var q23 = mix(quarter2, quarter3, 0.5);
		var q34 = mix(quarter3, quarter4, 0.5);
		var q41 = mix(quarter4, quarter1, 0.5);
        count = count-1;

	   divideCarpet(a,third1,quarter1,third8,count);
	   divideCarpet(third1, third2, quarter2, quarter1, count);
	   divideCarpet(third2, b, third3, quarter2, count);
	   divideCarpet(third3, third4, quarter3, quarter2,count);
	   divideCarpet(third4, c, third5, quarter3, count);
	   divideCarpet(third5, third6, quarter4, quarter3, count);
	   divideCarpet(third6, d, third7, quarter4, count);
	   divideCarpet(third7, third8, quarter1, quarter4, count);
    }
}

window.onload = init;

function render() {
	gl.clear( gl.COLOR_BUFFER_BIT );
	gl.uniform1f(thetaLoc, theta);
    //my attempt at passing points in as a uniform3fv to the vertex shader
    gl.drawArrays( gl.TRIANGLES, 0, points.length );
	setTimeout(
			function(){
				requestAnimFrame(render);
				if(spinning){
					theta +=(direction ? -0.05 : 0.05);
				}
                if(changedColor){
                    points = [];
                    changedColor = false;
                    requestAnimFrame(init);
                }
                if(redbutton){
                    if(divided){
                        points = [];
                        requestAnimFrame(init);
                        divided = false;
                    }
                }else {
                    if(divided){
					points = [];
                    centers = [];
					requestAnimFrame(init);
					divided = false;
                    }
				}
			}, delay
	);
}