"use strict";

var canvas;
var gl;

var points = [];

var NumTimesToSubdivide = 4;

window.onload = function init()
{
    canvas = document.getElementById( "gl-canvas" );

    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) {
		alert( "WebGL isn't available" ); 
	}

    //
    //  Initialize our data for the Sierpinski Carpet
    //

    // First, initialize the corners of our carpet with three points.

    var v = [
        vec2( -1, -1 ),
        vec2(  -1,  1 ),
        vec2(  1, 1 ),
		vec2(1,-1)
    ];
	
	//carpet(v[0],v[1],v[2],v[3]);

    divideCarpet(v[0], v[1], v[2], v[3], NumTimesToSubdivide);


    //
    //  Configure WebGL
    //
    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 1.0, 1.0, 1.0, 1.0 );

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

    render();
};

function carpet(a,b,c,d)
{
    points.push(a,b,c);
	points.push(a,d,c);
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
        var center = mix(a, c, 0.5);
		
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


		/*
        divideCarpet(a, third1, quarter1, third8, count);
		divideCarpet(third1, ab, q12, quarter1, count);
		divideCarpet(ab, third2, quarter2, q12, count);
		divideCarpet(third2, b, third3, quarter2, count);
		divideCarpet(third3, bc, q23, quarter2, count);
		divideCarpet(bc, third4, quarter3, q23, count);
		divideCarpet(third4, c, third5, quarter3,count);
		divideCarpet(third5, cd, q34, quarter3, count);
		divideCarpet(cd, third6, quarter4, q34, count);
		divideCarpet(third6, d, third7, quarter4, count);
		divideCarpet(third7, da, q41, quarter4, count);
		divideCarpet(da, third8, quarter1, q41, count);
       // divideCarpet( quarter1, quarter3, quarter4, count );
	   */
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

function render()
{
    gl.clear( gl.COLOR_BUFFER_BIT );
    gl.drawArrays( gl.TRIANGLES, 0, points.length );
}