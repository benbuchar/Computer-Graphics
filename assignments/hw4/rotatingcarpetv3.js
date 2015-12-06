"use strict";

var canvas;
var gl;

var points = [];
var pointsLocation;
var numOfPoints;
var numOfPointsLoc;

var numTimesToSubdivide = 0;
var numOfSquares = 1;
var numOfSquaresLoc;
var centers = [];

var colors = [];
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
var tUColor;


var theta = 0.0;
var thetaLoc;
var delay = 50;
var spinning = false;
var direction = true;
var divided = false;
var redbutton = false;
var blendRandom = false;
var blendSmooth = true;
var uniform = false;
var totalUniform = false;
var changedColor = false;

var initialized = false;

//var near = -1.5;
//var far = 1.0;
//var radius = .05;
var near = .01;
var far = 10.0;
var radius = 4.0;
var theta2 = 0.0;
var phi = 0.0;
var dr = 5.0 * Math.PI/180.0;

var left = -1.0;
var right = 1.0;
var ytop = 1.0;
var bottom = -1.0;

var fovy = 45.0;
var aspect = 1.0;

var projectionMatrix, modelViewMatrix;
var projectionMatrixLoc, modelViewMatrixLoc;
var eye;
var atx = 0.0;
var aty = 0.0;
var at = vec3(0.0,0.0,0.0);
var upz = 0.0;
var up = vec3(0.0,1.0,0.0);
var upx = 0.0;
var upy = 1.0;

var moveY = 0.0;
var moveX = 0.0;
var moveZ = 0.0;



function init()
{
    canvas = document.getElementById( "gl-canvas" );

    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) {
		alert( "WebGL isn't available" ); 
	}
	var corners = [
	vec3(-.7,-.7,.7), //a
	vec3(-.7,.7,.7), //b 
	vec3(.7,.7,.7),  //c
	vec3(.7,-.7,.7),  //d
	
	vec3(-.7,-.7,-.7), //e
    vec3(-.7,.7,-.7), //f
	vec3(.7,.7,-.7), //g
	vec3(.7,-.7,-.7) //h
	];

	
	divideCarpet(corners[0], corners[1], corners[2], corners[3],
		corners[4],corners[5],corners[6],corners[7],numTimesToSubdivide);


    //
    //  Configure WebGL
    //
    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 0.0, 0.0, 0.0, 1.0 );
	
	gl.enable(gl.DEPTH_TEST);

    //  Load shaders and initialize attribute buffers

    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

    // Load the data into the GPU

    var positionBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, positionBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW );
    
    // Associate out shader variables with our data buffer

    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 3, gl.FLOAT, false, 0, 0 );
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
    
	projectionMatrixLoc = gl.getUniformLocation(program,"projectionMatrix");
	modelViewMatrixLoc = gl.getUniformLocation(program,"modelViewMatrix");
	
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
        blendRandom = false;
        uniform = false;
		totalUniform = false;
    };
    
    document.getElementById("blendRandom").onclick = function(){
        colors = [];
        changedColor = true;
        blendRandom = true;
        blendSmooth = false;
        uniform = false;
		totalUniform = false;
    };
    
    document.getElementById("uniform").onclick = function(){
        colors = [];
        changedColor = true;
        uniform = true;
        blendSmooth = false;
        blendRandom = false;
		totalUniform = false;
    };
	
	document.getElementById("totalUniform").onclick = function(){
		colors = [];
		var rn = Math.floor(Math.random()*6);
		tUColor = vertexColors[rn];
		changedColor = true;
		uniform = false;
		blendSmooth = false;
		blendRandom = false;
		totalUniform = true;
	}
	
	document.getElementById("left").onclick = function(){
		atx = atx - .05;
		at = vec3(atx,aty,0.0);
	};
	
	document.getElementById("right").onclick = function(){
		atx = atx + .05;
		at = vec3(atx,aty,0.0);
	};
	
	document.getElementById("up").onclick = function(){
		aty = aty + .05;
		at = vec3(atx,aty,0.0);
	};
	
	document.getElementById("down").onclick = function(){
		aty = aty - .05;
		at = vec3(atx,aty,0.0);
	}
	
	document.getElementById("forward").onclick = function(){
		--fovy;
	};
	
	document.getElementById("back").onclick = function(){
		++fovy;
	};
	
	document.getElementById("xSlider").oninput = function(){
		theta2 = event.target.value*Math.PI/180.0;
	};
	
	document.getElementById("ySlider").oninput = function(){
		phi = event.target.value*Math.PI/180.0;
	};
	
	document.getElementById("zSlider").oninput = function(){
		var degree = event.target.value;
		upx = Math.cos(degree);
		upy = Math.sin(degree);
		up = vec3(upx, upy, upz);
	};
	
	



	if(!initialized){
		render();
		initialized = true;
	}
    
};

function carpet(a,b,c,d,e,f,g,h)
{	
    points.push(a,b,c);//front
	points.push(a,d,c);
	points.push(e,f,b);//left
	points.push(e,a,b);
	points.push(d,c,g);//right
	points.push(d,h,g);
	points.push(h,g,f);//back
	points.push(h,e,f);
	points.push(b,f,g);//top
	points.push(b,c,g);
	points.push(d,h,e);//bottom
	points.push(d,a,e);
    numOfPoints = points.length;
    
    var frontCenter = mix(a, c, 0.5);
	var backCenter = mix(g, e, 0.5);
	var center = mix(a,g,0.5);
	for(var i = 0; i<36; ++i){
		centers.push(center);
	}
    //var color = (1.0,1.0,1.0,1.0);
    //colors.push(color);


    if(uniform){
        var rn = Math.floor(Math.random() *6);
        for(var i = 0; i< 36; ++i){
         colors.push(vertexColors[rn]);
        }
    } else if(totalUniform){
		for(var i = 0; i<36; ++i){
			colors.push(tUColor);
		}
		
	}else if(blendRandom){
        for ( var i = 0; i < 36; ++i ) {
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
		
		var backBottomLeft = Math.floor(Math.random() * 6);
		var backTopLeft = Math.floor(Math.random() * 6);
		var backTopRight = Math.floor(Math.random() * 6);
		var backBottomRight = Math.floor(Math.random() * 6);
		
        colors.push(vertexColors[bottomLeft]); //front
        colors.push(vertexColors[topLeft]);
        colors.push(vertexColors[topRight]);
        colors.push(vertexColors[bottomLeft]);
        colors.push(vertexColors[bottomRight]);
        colors.push(vertexColors[topRight]);

		colors.push(vertexColors[backBottomLeft]); //left
		colors.push(vertexColors[backTopLeft]);
		colors.push(vertexColors[topLeft]);
		colors.push(vertexColors[backBottomLeft]);
		colors.push(vertexColors[bottomLeft]);
		colors.push(vertexColors[topLeft]);
		
		colors.push(vertexColors[bottomRight]); //right
		colors.push(vertexColors[topRight]);
		colors.push(vertexColors[backTopRight]);
		colors.push(vertexColors[bottomRight]);
		colors.push(vertexColors[backBottomRight]);
		colors.push(vertexColors[backTopRight]);
		
		colors.push(vertexColors[backBottomRight]); //back
		colors.push(vertexColors[backTopRight]);
		colors.push(vertexColors[backTopLeft]);
		colors.push(vertexColors[backBottomRight]);
		colors.push(vertexColors[backBottomLeft]);
		colors.push(vertexColors[backTopLeft]);
		
		colors.push(vertexColors[topLeft]); //top
		colors.push(vertexColors[backTopLeft]);
		colors.push(vertexColors[backTopRight]);
		colors.push(vertexColors[topLeft]);
		colors.push(vertexColors[topRight]);
		colors.push(vertexColors[backTopRight]);
		
		colors.push(vertexColors[bottomRight]); //bottom
		colors.push(vertexColors[backBottomRight]);
		colors.push(vertexColors[backBottomLeft]);
		colors.push(vertexColors[bottomRight]);
		colors.push(vertexColors[bottomLeft]);
		colors.push(vertexColors[backBottomLeft]);
    } 
    
}

function divideCarpet(a,b,c,d,e,f,g,h,count)
{

    // check for end of recursion

    if ( count === 0 ) {
        carpet(a, b, c, d, e, f, g, h);
    }
    else {
		count = count-1;
        //bisect the sides
        
//-----------------------------------------------------
//front
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
        
	   
//---------------------------------------------------------------
//left
		var third9 = mix(e,f,0.33);
		var third10 = mix(f,e,0.33);
		var third11 = mix(f,b,0.33);
		var third12 = mix(b,f,0.33);
		var third13 = mix(b,a,0.33);
		var third14 = mix(a,b,0.33);
		var third15 = mix(a,e,0.33);
		var third16 = mix(e,a,0.33);
		
		var quarter5 = mix(e,b,0.33);
		var quarter6 = mix(f,a,0.33);
		var quarter7 = mix(b,e,0.33);
		var quarter8 = mix(a,f,0.33);
		//note they're also thirds not quarters.
		
		var q56 = mix(quarter5, quarter6, 0.5);
		var q67 = mix(quarter6, quarter7, 0.5);
		var q78 = mix(quarter7, quarter8, 0.5);
		var q85 = mix(quarter8, quarter5, 0.5);

	   
//-----------------------------------------------------------------
//right
		
		var third17 = mix(d,c,0.33);
		var third18 = mix(c,d,0.33);
		var third19 = mix(c,g,0.33);
		var third20 = mix(g,c,0.33);
		var third21 = mix(g,h,0.33);
		var third22 = mix(h,g,0.33);
		var third23 = mix(h,d,0.33);
		var third24 = mix(d,h,0.33);
		
		var quarter9 = mix(d, g, 0.33);
		var quarter10 = mix(c,h, 0.33);
		var quarter11 = mix(g,d, 0.33);
		var quarter12 = mix(h,c, 0.33);
		//note they're also thirds not quarters.
		
		var q910 = mix(quarter9, quarter10, 0.5);
		var q1011 = mix(quarter10, quarter11, 0.5);
		var q1112 = mix(quarter11, quarter12, 0.5);
		var q129 = mix(quarter12, quarter9, 0.5);

//-------------------------------------------------------------------------
//back

		var third25 = mix(h,g,0.33);
		var third26 = mix(g,h,0.33);
		var third27 = mix(g,f,0.33);
		var third28 = mix(f,g,0.33);
		var third29 = mix(f,e,0.33);
		var third30 = mix(e,f,0.33);
		var third31 = mix(e,h,0.33);
		var third32 = mix(h,e,0.33);
		
		var quarter13 = mix(h, f, 0.33);
		var quarter14 = mix(g,e, 0.33);
		var quarter15 = mix(f,h, 0.33);
		var quarter16 = mix(e,g, 0.33);
		//note they're also thirds not quarters.
		
		var q1314 = mix(quarter13, quarter14, 0.5);
		var q1415 = mix(quarter14, quarter15, 0.5);
		var q1516 = mix(quarter15, quarter16, 0.5);
		var q1613 = mix(quarter16, quarter13, 0.5);
	   
//-------------------------------------------------------------------------
//top

		var third33 = mix(b,f,0.33);
		var third34 = mix(f,b,0.33);
		var third35 = mix(f,g,0.33);
		var third36 = mix(g,f,0.33);
		var third37 = mix(g,c,0.33);
		var third38 = mix(c,g,0.33);
		var third39 = mix(c,b,0.33);
		var third40 = mix(b,c,0.33);
		
		var quarter17 = mix(b, g, 0.33);
		var quarter18 = mix(f,c, 0.33);
		var quarter19 = mix(g,b, 0.33);
		var quarter20 = mix(c,f, 0.33);
		//note they're also thirds not quarters.
		
		var q1718 = mix(quarter17, quarter18, 0.5);
		var q1819 = mix(quarter18, quarter19, 0.5);
		var q1920 = mix(quarter19, quarter20, 0.5);
		var q2017 = mix(quarter20, quarter17, 0.5);
        
	   
//-----------------------------------------------------------------------
//bottom

		var third41 = mix(d,h,0.33);
		var third42 = mix(h,d,0.33);
		var third43 = mix(h,e,0.33);
		var third44 = mix(e,h,0.33);
		var third45 = mix(e,a,0.33);
		var third46 = mix(a,e,0.33);
		var third47 = mix(a,d,0.33);
		var third48 = mix(d,a,0.33);
		
		var quarter21 = mix(d, e, 0.33);
		var quarter22 = mix(h,a, 0.33);
		var quarter23 = mix(e,d, 0.33);
		var quarter24 = mix(a,h, 0.33);
		//note they're also thirds not quarters.
		
		var q2122 = mix(quarter21, quarter22, 0.5);
		var q2223 = mix(quarter22, quarter23, 0.5);
		var q2324 = mix(quarter23, quarter24, 0.5);
		var q2421 = mix(quarter24, quarter21, 0.5);
        

//------------------------------------------------------------------------------
//Inner verticies 

		var inQuarter1 = mix(quarter1, quarter16, 0.33);//nearest front *
		var inQuarter2 = mix(quarter2, quarter15, 0.33);//*
		var inQuarter3 = mix(quarter3, quarter14, 0.33);//*
		var inQuarter4 = mix(quarter4, quarter13, 0.33);
		
		var inQuarter5 = mix(quarter16, quarter1, 0.33);//nearest back
		var inQuarter6 = mix(quarter15, quarter2, 0.33);
		var inQuarter7 = mix(quarter14, quarter3, 0.33);
		var inQuarter8 = mix(quarter13, quarter4, 0.33);
		
//---------------------------------------------------------------------------
//Draw all cubes with 4 faces each		



		//front cubes
	   divideCarpet(a,third1,quarter1,third8,third15,quarter8,inQuarter1,quarter24,count);
	   divideCarpet(third1,third2, quarter2,quarter1,quarter8,quarter7,inQuarter2,inQuarter1, count);
	   divideCarpet(third2, b, third3, quarter2,quarter7,third12,quarter17,inQuarter2, count);
	   divideCarpet(quarter2, third3, third4, quarter3, inQuarter2, quarter17, quarter20, inQuarter3,count);
	   divideCarpet(quarter3,third4,c,third5,inQuarter3,quarter20,third38,quarter10,count);
	   divideCarpet(quarter4,quarter3,third5,third6,inQuarter4,inQuarter3,quarter10,quarter9,count);
	   divideCarpet(third7,quarter4,third6,d,quarter21,inQuarter4,quarter9,third24,count);
	   divideCarpet(third8,quarter1,quarter4,third7,quarter24,inQuarter1,inQuarter4,quarter21,count);
	   
	   //middle cubes
	   divideCarpet(third15,quarter8,inQuarter1,quarter24,third16,quarter5,inQuarter5,quarter23,count);
	   //divideCarpet(quarter8,quarter7,inQuarter2,inQuarter1,quarter5,quarter6,inQuarter6,inQuarter5,count);
	   divideCarpet(quarter7,third12,quarter17,inQuarter2,quarter6,third11,quarter18,inQuarter6,count);
	   //divideCarpet(inQuarter2,quarter17,quarter20,inQuarter3,inQuarter6,quarter18,quarter19,inQuarter7,count);
	   divideCarpet(inQuarter3,quarter20,third38,quarter10,inQuarter7,quarter19,third37,quarter11,count);
	   //divideCarpet(inQuarter4,inQuarter3,quarter10,quarter9,inQuarter8,inQuarter7,quarter11,quarter12,count);
	   divideCarpet(quarter21,inQuarter4,quarter9,third24,quarter22,inQuarter8,quarter12,third23,count);
	   //divideCarpet(quarter24,inQuarter1,inQuarter4,quarter21,quarter23,inQuarter5,inQuarter8,quarter22,count);
	   
	   //back cubes
	   divideCarpet(third16,quarter5,inQuarter5,quarter23,e,third9,quarter16,third44,count);
	   divideCarpet(quarter5,quarter6,inQuarter6,inQuarter5,third9,third10,quarter15,quarter16,count);
	   divideCarpet(quarter6,third11,quarter18,inQuarter6,third10,f,third35,quarter15,count);
	   divideCarpet(inQuarter6,quarter18,quarter19,inQuarter7,quarter15,third35,third36,quarter14,count);
	   divideCarpet(inQuarter7,quarter19,third37,quarter11,quarter14,third36,g,third26,count);
	   divideCarpet(inQuarter8,inQuarter7,quarter11,quarter12,quarter13,quarter14,third26,third22,count);
	   divideCarpet(quarter22,inQuarter8,quarter12,third23,third43,quarter13,third22,h,count);
	   divideCarpet(quarter23, inQuarter5,inQuarter8,quarter22,third44,quarter16,quarter13,third43,count);
	   
    }
}

window.onload = init;

function render() {
	gl.clear( gl.COLOR_BUFFER_BIT |gl.DEPTH_BUFFER_BIT );
	
	eye = vec3(radius*Math.sin(phi)+atx, radius*Math.sin(theta2)+aty,
             radius*Math.cos(phi));
	
		
		modelViewMatrix = lookAt(eye,at,up);
		projectionMatrix= perspective(fovy, aspect, near, far);
		//projectionMatrix = ortho(left,right,bottom,ytop,near,far);
		
		
		gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
		gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix));
		gl.uniform1f(thetaLoc, theta);

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