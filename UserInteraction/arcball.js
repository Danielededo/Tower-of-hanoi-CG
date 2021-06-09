// recreation of a simple arcball in Javascript

function ArcBall(canvas, callback) {

    "use strict";
    this.start = new Quaternion(1, 0, 0, 0);
    this.now = new Quaternion(1, 0, 0, 0);
    this.downX = 0;
    this.downY = 0;
    this.mode = 0;
    this.canvas = canvas;
    this.initZ = 10;
    this.callback = callback;

    // set up all the mouse events
    var that = this;
    canvas.addEventListener("mousedown",function(e) {
        var sx = canvas.width / 2;
        var sy = canvas.height / 2;
        var nx = -(e.pageX - sx) / sx;
        var ny = (e.pageY - sy) / sy;
        that.click(nx,ny)
    });
    canvas.addEventListener("mousemove",function(e) {
        var sx = canvas.width / 2;
        var sy = canvas.height / 2;
        var nx = -(e.pageX - sx) / sx;
        var ny = (e.pageY - sy) / sy;
        if (that.mode) {
            that.computeNow(nx, ny);
            if (that.callback) that.callback();
        }
    });
    document.addEventListener("mouseup",function(e) {
        that.mode = 0;
        if (that.callback) that.callback();
    });
    // support touch screen
    canvas.addEventListener("touchstart",function(e) {
        var sx = canvas.width / 2;
        var sy = canvas.height / 2;
        var nx = -(e.pageX - sx) / sx;
        var ny = (e.pageY - sy) / sy;
        that.click(nx,ny)
    });
    canvas.addEventListener("touchmove",function(e) {
        var sx = canvas.width / 2;
        var sy = canvas.height / 2;
        var nx = -(e.pageX - sx) / sx;
        var ny = (e.pageY - sy) / sy;
        if (that.mode) {
            that.computeNow(nx, ny);
            if (that.callback) that.callback();
        }
    });
    document.addEventListener("touchend",function(e) {
        that.mode = 0;
        if (that.callback) that.callback();
    });

}

ArcBall.prototype.reset = function() {

    "use strict";
    this.start = new Quaternion(1, 0, 0, 0);
    this.now = new Quaternion(1, 0, 0, 0);
    this.mode = 0;
};

ArcBall.prototype.getMatrix = function() {

    "use strict";
    var q = this.now.mul(this.start);
    return q.toMatrix4();
};

ArcBall.prototype.click = function(x,y) {

    "use strict";
    this.start = this.now.mul(this.start);
    this.downX = x;
    this.downY = y;
    this.panX = 0;
    this.panY = 0;
    this.mode = 1;
    this.now = new Quaternion(1,0,0,0);
};

ArcBall.prototype.spin = function(x,y,z) {
    
    "use strict";
    this.start = this.now.mul(this.start);
 	var iw = x*x + y*y + z*z;
	if (iw<1)
		iw = math.sqrt(1-iw);
	else
		iw = 0;
    this.now = new Quaternion(iw,x,y,z);
    this.norm.normalize();
    this.start = this.now.mul(this.start);

    this.now = new Quaternion(1,0,0,0);
};

ArcBall.prototype.onUnitSphere = function(mx,my){

    "use strict";
	var x = mx;	// should divide radius
	var y = my;
    var z;
	var mag = x*x + y*y;
	if (mag > 1.0) {
		var scale = 1.0 / Math.sqrt(mag);
		x *= scale;
		y *= scale;
		z = 0;
	} else {
		z = Math.sqrt(1 - mag);
	}
    return [x,y,z];
};

ArcBall.prototype.computeNow = function(mx,my){
    
    "use strict";
    var down = this.onUnitSphere(this.downX, this.downY);
    var mouse = this.onUnitSphere(mx, my);

    // here we compute the quaternion between these two points
    this.now.x = down[1]*mouse[2] - down[2]*mouse[1];
    this.now.y = down[2]*mouse[0] - down[0]*mouse[2];
    this.now.z = down[0]*mouse[1] - down[1]*mouse[0];
    this.now.w = down[0]*mouse[0] + down[1]*mouse[1] + down[2]*mouse[2];

    this.now.normalize();
};
