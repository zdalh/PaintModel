function circleJoin(x1, y1,r1, x2, y2,r2){
  return (x1-x2)*(x1-x2)+(y1-y2)*(y1-y2) < (r1+r2)*(r1+r2) 
   && (x1-x2)*(x1-x2)+(y1-y2)*(y1-y2) > (r1-r2)*(r1-r2);
};


function changeShapeState(ctx, shape) {
	switch(shape.state) {
		case ShapeState.DRAWING:
			changeStyle(ctx, shape.isStroke, shape.isFill, 
				shape.drawingStrokeStyle, shape.drawingStrokeWidth,
				shape.drawingFillStyle, shape.drawingFillAlpha);
			break;
		case ShapeState.FOCUSED:
			changeStyle(ctx, shape.isStroke, shape.isFill, 
				shape.focusedStrokeStyle, shape.focusedStrokeWidth,
				shape.focusedFillStyle, shape.focusedFillAlpha);
			break;
		default:
			changeStyle(ctx, shape.isStroke, shape.isFill, 
				shape.strokeStyle, shape.strokeWidth,
				shape.fillStyle, shape.fillAlpha);
			break;
	}
};

function changeStyle(ctx, isStroke, isFill, strokeStyle, strokeWidth, fillStyle, fillAlpha) {
	if(isStroke) {
		if(strokeStyle) {
			ctx.strokeStyle = strokeStyle;
		}
		if(strokeWidth) {
			ctx.strokeWidth = strokeWidth;
		}
	}
	
	if(isFill) {
		if(fillStyle) {
			ctx.fillStyle = fillStyle;
			ctx.globalAlpha = fillAlpha;
		}
	}
};

function ShapeState() {
	
};

ShapeState.DRAWING = "DRAWING"; //锁定
ShapeState.NORMAL = "NORMAL"; //锁定
ShapeState.FOCUSED = "FOCUSED"; //锁定

//Point
function Point(x, y) {
    this.X = x;
    this.Y = y;
	this.type = 'Point';
	
	this.toString = function(){
		return JSON.stringify(this);
	};
}

//Shape
function Shape() {
    this.type = "unknow";
}



Shape.prototype = {
    id: undefined,
    type: 'unknow',
	isPoint: false,
	
    isStroke: true,
    isFill: false,
	
	state: ShapeState.DRAWING,
	
	strokeStyle: '#333',
    strokeWidth: 1,
    fillStyle: '#ccc',
	fillAlpha: 0.4,
	
	focusedStrokeStyle: '#f00',
	focusedStrokeWidth: 1,
	focusedFillStyle: '#fff',
	focusedFillAlpha: 0.8,
	
	drawingStrokeStyle: '#000',
	drawingStrokeWidth: 1,
	drawingFillStyle: '#000',
	drawingFillAlpha: 0.1,
	
    tag: undefined,
	data: undefined,
	relateds: undefined,
	
	isLocked: false,
	
	changeState: function(state) {
		this.state = state;
	},
	
	addRelated: function(item) {
		this.relateds.push(item.id);
	},
	
	removeRelatedBy: function(compareFunc) {
		for(var i = 0; i < this.relateds.length; i++){
			if(compareFunc(this.relateds[i])) {
				this.relateds.splice(i, 1);
				i--;
			}
		}
	},
	
	getRelatedBy: function(compareFunc) {
		var result = new Array();
		for(var i = 0; i < this.relateds.length; i++){
			if(compareFunc(this.relateds[i])) {
				result.push(this.relateds[i]);
			}
		}
		return result;
	},

    getType: function () {
        return this.type;
    },

    draw: function (ctx) {

    },
	
	isHit: function(point, tolerance) {
		return false;
	},
	
	toString: function() {
		var json = "{";
		var isFirst = true;
		for(var index in this){
			if(!(this[index] instanceof Function)) {
				if(isFirst) {
					isFirst = false;
				}else{
					json += ',';
				}
				
				if(this[index] && this[index] instanceof Object) {
					if(this[index] instanceof Array) {
						if(this[index].length > 0){
							json += '"' + index + '": ' + JSON.stringify(this[index]); 
						}else{
							json += '"' + index + '": []'; 
						}
					}else{
						json += '"' + index + '": ' + JSON.stringify(this[index]) + ''; 	
					}
				}else{
					json += '"' + index + '": "' + this[index] + '"'; 
				}
			}
		}
		
		json += "}";
		
		return json;
		//return JSON.stringify(this);
	},
	
	move: function(moveOffset) {
		
	},
	
	isLegal: function() {
		return true;
	}
}

//Circle
function Circle() {
    //Shape.call(this);
	this.relateds = new Array();
}

Circle.prototype = new Shape();
Circle.prototype.type = 'Circle';
Circle.prototype.beginPoint = undefined;
Circle.prototype.endPoint = undefined;
Circle.prototype.isLegal = function() {
	return this.beginPoint && this.endPoint;
};
Circle.prototype.getCenterPoint = function () {
    if (this.beginPoint && this.endPoint) {
        return new Point((this.beginPoint.X + this.endPoint.X) / 2, (this.beginPoint.Y + this.endPoint.Y) / 2);
    }
};

Circle.prototype.getRadius = function () {
    if (this.beginPoint && this.endPoint) {
        return Math.min(Math.abs(this.beginPoint.X - this.endPoint.X) / 2, Math.abs(this.beginPoint.Y - this.endPoint.Y) / 2);
    }
};

Circle.prototype.isHit = function(point, tolerance) {
	var cPoint = this.getCenterPoint();
	var r = this.getRadius();
	return circleJoin(cPoint.X, cPoint.Y, r, point.X, point.Y, tolerance);
};

Circle.prototype.move = function(moveOffset) {
	
	if(moveOffset.X == 0 && moveOffset.Y == 0){
		return;
	}
	this.beginPoint.X += moveOffset.X;
	this.beginPoint.Y += moveOffset.Y;
	this.endPoint.X += moveOffset.X;
	this.endPoint.Y += moveOffset.Y;
};


Circle.prototype.draw = function (ctx) {
    if (!this.beginPoint || !this.endPoint) {
        return;
    }

    ctx.save();
    ctx.beginPath();
    var centerX = (this.beginPoint.X + this.endPoint.X) / 2;
    var centerY = (this.beginPoint.Y + this.endPoint.Y) / 2;
    var radius = Math.min(Math.abs(this.beginPoint.X - this.endPoint.X) / 2, Math.abs(this.beginPoint.Y - this.endPoint.Y) / 2);
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2, true);

	changeShapeState(ctx, this);
	
    if (this.isStroke) {
        ctx.stroke();
    }

    if (this.isFill) {
        ctx.fill();
    }
    ctx.closePath();
    ctx.restore();
};

//CirclePoint
function CirclePoint() {
    this.relateds = new Array();
}

CirclePoint.prototype = new Shape();
CirclePoint.prototype.type = 'CirclePoint';
CirclePoint.prototype.centerPoint = undefined;
CirclePoint.prototype.radius = 5;
CirclePoint.prototype.isPoint = true;
CirclePoint.prototype.isHit = function(point, tolerance) {
	return circleJoin(this.centerPoint.X, this.centerPoint.Y, this.radius, point.X, point.Y, tolerance);
};
CirclePoint.prototype.isLegal = function() {
	return this.centerPoint;
};
CirclePoint.prototype.move = function(moveOffset) {
	
	if(moveOffset.X == 0 && moveOffset.Y == 0){
		return;
	}
	this.centerPoint.X += moveOffset.X;
	this.centerPoint.Y += moveOffset.Y;
};
CirclePoint.prototype.draw = function (ctx) {

    if (!this.centerPoint || !this.radius) {
        return;
    }
    ctx.save();
    ctx.beginPath();
    ctx.arc(this.centerPoint.X, this.centerPoint.Y, this.radius, 0, Math.PI * 2, true);
    ctx.fillStyle = this.drawingFillStyle;
    changeShapeState(ctx, this);
    ctx.fill();
	
    ctx.closePath();
    ctx.restore();
};

//CurvesLine
function CurvesLine() {
    this.points = new Array();
	this.relateds = new Array();
}

CurvesLine.prototype = new Shape();
CurvesLine.prototype.type = 'CurvesLine';
CurvesLine.prototype.lastPoint = undefined;
CurvesLine.prototype.points = undefined;
CurvesLine.prototype.isLegal = function() {
	return this.points && this.points.length > 1;
};
CurvesLine.prototype.isHit = function(point, tolerance) {
	for(var index in this.points) {
		var p = this.points[index];
		if(Math.sqrt(Math.pow(p.X - point.X, 2) + Math.pow(p.Y - point.Y, 2)) <= tolerance) {
			return true;
		}
	}
	return false;
};
CurvesLine.prototype.addPoint = function (point) {
    if (!point) {
        return;
    }
    this.points.push(point);
};
CurvesLine.prototype.move = function(moveOffset) {
	if(moveOffset.X == 0 && moveOffset.Y == 0){
		return;
	}
	for(var index in this.points){
		this.points[index].X += moveOffset.X;
		this.points[index].Y += moveOffset.Y;
	}
};
CurvesLine.prototype.draw = function (ctx) {
    if (!this.points || this.points.length == 0) {
        return;
    }

    ctx.beginPath();
    ctx.save();
	changeShapeState(ctx, this);
	if (this.isStroke) {
		/*if(this.isFocused) {
			if (this.focusedStrokeStyle) {
				ctx.strokeStyle = this.focusedStrokeStyle;
			}
			if (this.focusedStrokeWidth) {
				ctx.strokeWidth = this.focusedStrokeWidth;
			}
		}else{
			if (this.strokeStyle) {
				ctx.strokeStyle = this.strokeStyle;
			}
			if (this.strokeWidth) {
				ctx.strokeWidth = this.strokeWidth;
			}
		}*/
        ctx.stroke();
    }

    var isFirst = true;
    this.points.forEach(function (point) {
        if (isFirst) {
            ctx.moveTo(point.X, point.Y);
            isFirst = false;
        }
        ctx.lineTo(point.X, point.Y);
    });

    if (this.isStroke) {
        ctx.stroke();
    }
    ctx.restore();
    ctx.closePath();
};

//Ellipse
function Ellipse() {
	this.relateds = new Array();
};

Ellipse.prototype = new Shape();
Ellipse.prototype.type = 'Ellipse';
Ellipse.prototype.beginPoint = undefined;
Ellipse.prototype.endPoint = undefined;
Ellipse.prototype.isLegal = function() {
	return this.beginPoint && this.endPoint;
};
Ellipse.prototype.isHit = function(point, tolerance) {
	var pointB = new Point(this.beginPoint.X, this.endPoint.Y);
	var pointC = new Point(this.endPoint.X, this.beginPoint.Y);
	
	return lineJoinCircle(this.beginPoint, pointB, point, tolerance) ||
		lineJoinCircle(pointB, this.endPoint, point, tolerance) ||
		lineJoinCircle(this.endPoint, pointC, point, tolerance) ||
		lineJoinCircle(pointC, this.beginPoint, point, tolerance);
};
Ellipse.prototype.move = function(moveOffset) {
	if(moveOffset.X == 0 && moveOffset.Y == 0){
		return;
	}
	this.beginPoint.X += moveOffset.X;
	this.beginPoint.Y += moveOffset.Y;
	this.endPoint.X += moveOffset.X;
	this.endPoint.Y += moveOffset.Y;
};
Ellipse.prototype.draw = function (ctx) {
    if (!this.beginPoint || !this.endPoint) {
        return;
    }

    var centerX = (this.beginPoint.X + this.endPoint.X) / 2;
    var centerY = (this.beginPoint.Y + this.endPoint.Y) / 2;
    var radius = Math.min(Math.abs(this.beginPoint.X - this.endPoint.X) / 2, Math.abs(this.beginPoint.Y - this.endPoint.Y) / 2);

    var width = Math.abs(this.beginPoint.X - this.endPoint.X);
    var height = Math.abs(this.beginPoint.Y - this.endPoint.Y);

    var point = new Point();
	
    if (width > height) {
        if (height > 0) {
            point.X = width / height;
        }
        point.Y = 1;
    } else {
        point.X = 1;
        if (width > 0) {
            point.Y = height / width;
        }
    }

    ctx.save();
    
	if (point.X && point.Y) {
        ctx.scale(point.X, point.Y);
    }
	
	ctx.beginPath();
    ctx.arc(centerX / point.X , centerY /point.Y , radius, 0, Math.PI * 2, true);
    ctx.restore();
    ctx.save();
	changeShapeState(ctx, this);
	if (this.isStroke) {
		/*if(this.isFocused) {
			if (this.focusedStrokeStyle) {
				ctx.strokeStyle = this.focusedStrokeStyle;
			}
			if (this.focusedStrokeWidth) {
				ctx.strokeWidth = this.focusedStrokeWidth;
			}
		}else{
			if (this.strokeStyle) {
				ctx.strokeStyle = this.strokeStyle;
			}
			if (this.strokeWidth) {
				ctx.strokeWidth = this.strokeWidth;
			}
		}*/
        ctx.stroke();
    }

    if (this.isFill) {
		/*if(this.isFocused) {
			if(this.focusedFillStyle) {
				ctx.fillStyle = this.focusedFillStyle;
				ctx.globalAlpha = this.focusedFillAlpha;
			}
		}else{
			if (this.fillStyle) {
				ctx.fillStyle = this.fillStyle;
				ctx.globalAlpha = this.fillAlpha;
			}
		}*/
        ctx.fill();
    }
    ctx.closePath();
    ctx.restore();
};

//PImage
function PImage(src, width, height) {
    this.width = width;
    this.height = height;
    this.image = new Image(width, height);
	this.beginPoint = new Point(0,0);
    this.image.src = src;
    this.toString = function () {
        return JSON.stringify(this);
    };
};
PImage.prototype.type = "PImage";
PImage.prototype.getType = function() {
	return this.type;
};

PImage.prototype.draw = function (ctx) {
    ctx.beginPath();
    ctx.drawImage(this.image, (this.beginPoint ? this.beginPoint.X : 0), (this.beginPoint ? this.beginPoint.Y : 0), this.width, this.height);
    ctx.closePath();
};

//Polygon
function Polygon() {
    this.points = new Array();
	this.relateds = new Array();
};

Polygon.prototype = new Shape();
Polygon.prototype.type = 'Polygon';
Polygon.prototype.lastPoint = undefined;
Polygon.prototype.points = undefined;
Polygon.prototype.isLegal = function() {
	return this.points && this.points.length > 2;
};
Polygon.prototype.addPoint = function (point) {
    if (!point) {
        return;
    }
    this.points.push(point);
};
Polygon.prototype.isHit = function(point, tolerance) {
	for(var i = 0; i < this.points.length - 1; i++){
		if(lineJoinCircle(this.points[i], this.points[i+1], point, tolerance)) {
			return true;
		}
	}
	
	if(lineJoinCircle(this.points[this.points.length - 1], this.points[0], point, tolerance)) {
		return true;
	}
	
	return false;
};
Polygon.prototype.move = function(moveOffset) {
	if(moveOffset.X == 0 && moveOffset.Y == 0){
		return;
	}
	for(var index in this.points){
		this.points[index].X += moveOffset.X;
		this.points[index].Y += moveOffset.Y;
	}
};
Polygon.prototype.draw = function (ctx) {
    if (!this.points || this.points.length == 0) {
        return;
    }

    ctx.beginPath();
    ctx.save();
    changeShapeState(ctx, this);
	/*if (this.isStroke) {
		if(this.isFocused) {
			if (this.focusedStrokeStyle) {
				ctx.strokeStyle = this.focusedStrokeStyle;
			}
			if (this.focusedStrokeWidth) {
				ctx.strokeWidth = this.focusedStrokeWidth;
			}
		}else{
			if (this.strokeStyle) {
				ctx.strokeStyle = this.strokeStyle;
			}
			if (this.strokeWidth) {
				ctx.strokeWidth = this.strokeWidth;
			}
		}
    }

    if (this.isFill) {
		if(this.isFocused) {
			if(this.focusedFillStyle) {
				ctx.fillStyle = this.focusedFillStyle;
				ctx.globalAlpha = this.focusedFillAlpha;
			}
		}else{
			if (this.fillStyle) {
				ctx.fillStyle = this.fillStyle;
				ctx.globalAlpha = this.fillAlpha;
			}
		}
        ctx.fill();
    }
	*/

    var isFirst = true;
    this.points.forEach(function (point) {
        if (isFirst) {
            ctx.moveTo(point.X, point.Y);
            isFirst = false;
        }
        ctx.lineTo(point.X, point.Y);
    });

    ctx.lineTo(this.points[0].X, this.points[0].Y);

    if (this.isStroke) {
        ctx.stroke();
    }
	if(this.isFill) {
		ctx.fill();
	}
    ctx.restore();
    ctx.closePath();
};

//Polyline
function Polyline() {
    this.points = new Array();
	this.relateds = new Array();
};

Polyline.prototype = new Shape();
Polyline.prototype.type = 'Polyline';
Polyline.prototype.lastPoint = undefined;
Polyline.prototype.points = undefined;
Polyline.prototype.addPoint = function (point) {
    if (!point) {
        return;
    }
    this.points.push(point);
};
Polyline.prototype.isLegal = function() {
	return this.points && this.points.length > 1;
};
Polyline.prototype.isHit = function(point, tolerance) {
	for(var i = 0; i < this.points.length - 1; i++){
		if(lineJoinCircle(this.points[i], this.points[i+1], point, tolerance)) {
			return true;
		}
	}

	return false;
};
Polyline.prototype.move = function(moveOffset) {
	if(moveOffset.X == 0 && moveOffset.Y == 0){
		return;
	}
	for(var index in this.points){
		this.points[index].X += moveOffset.X;
		this.points[index].Y += moveOffset.Y;
	}
};
Polyline.prototype.draw = function (ctx) {
    if (!this.points || this.points.length == 0) {
        return;
    }

    ctx.beginPath();
    ctx.save();
	changeShapeState(ctx, this);
    var isFirst = true;
    this.points.forEach(function (point) {
        if (isFirst) {
            ctx.moveTo(point.X, point.Y);
            isFirst = false;
        }
        ctx.lineTo(point.X, point.Y);
    });

    if (this.isStroke) {
		/*if(this.isFocused) {
			if (this.focusedStrokeStyle) {
				ctx.strokeStyle = this.focusedStrokeStyle;
			}
			if (this.focusedStrokeWidth) {
				ctx.strokeWidth = this.focusedStrokeWidth;
			}
		}else{
			if (this.strokeStyle) {
				ctx.strokeStyle = this.strokeStyle;
			}
			if (this.strokeWidth) {
				ctx.strokeWidth = this.strokeWidth;
			}
		}*/
		ctx.stroke();
    }

    ctx.restore();
    ctx.closePath();
};

//Rect
function Rect() {
    this.beginPoint = undefined;
    this.endPoint = undefined;
	this.relateds = new Array();
}

Rect.prototype = new Shape();
Rect.prototype.type = 'Rect';

Rect.prototype.isLegal = function() {
	return this.beginPoint && this.endPoint;
};
Rect.prototype.isHit = function (point, tolerance) {
    if (this.isFill) {
        var minX = Math.min(this.beginPoint.X, this.endPoint.X);
        var maxX = Math.max(this.beginPoint.X, this.endPoint.X);
        var minY = Math.min(this.beginPoint.Y, this.endPoint.Y);
        var maxY = Math.max(this.beginPoint.Y, this.endPoint.Y);
        return point.X >= minX && point.X <= maxX && point.Y >= minY && point.Y <= maxY;
    }else{
		var pointB = new Point(this.beginPoint.X, this.endPoint.Y);
		var pointC = new Point(this.endPoint.X, this.beginPoint.Y);

		return lineJoinCircle(this.beginPoint, pointB, point, tolerance) ||
			lineJoinCircle(pointB, this.endPoint, point, tolerance) ||
			lineJoinCircle(this.endPoint, pointC, point, tolerance) ||
			lineJoinCircle(pointC, this.beginPoint, point, tolerance);
	}
};
Rect.prototype.move = function(moveOffset) {
	if(moveOffset.X == 0 && moveOffset.Y == 0){
		return;
	}
	this.beginPoint.X += moveOffset.X;
	this.beginPoint.Y += moveOffset.Y;
	this.endPoint.X += moveOffset.X;
	this.endPoint.Y += moveOffset.Y;
};
Rect.prototype.draw = function (ctx) {
    if (!this.beginPoint || !this.endPoint) {
        return;
    }
    var startX = Math.min(this.beginPoint.X, this.endPoint.X);
    var startY = Math.min(this.beginPoint.Y, this.endPoint.Y);
    var width = Math.abs(this.beginPoint.X - this.endPoint.X);
    var height = Math.abs(this.beginPoint.Y - this.endPoint.Y);
    ctx.save();
    ctx.beginPath();
	changeShapeState(ctx, this);
	if (this.isStroke) {
		/*if(this.isFocused) {
			if (this.focusedStrokeStyle) {
				ctx.strokeStyle = this.focusedStrokeStyle;
			}
			if (this.focusedStrokeWidth) {
				ctx.strokeWidth = this.focusedStrokeWidth;
			}
		}else{
			if (this.strokeStyle) {
				ctx.strokeStyle = this.strokeStyle;
			}
			if (this.strokeWidth) {
				ctx.strokeWidth = this.strokeWidth;
			}
		}*/
        ctx.strokeRect(startX, startY, width, height);
    }

    if (this.isFill) {
		/*if(this.isFocused) {
			if(this.focusedFillStyle) {
				ctx.fillStyle = this.focusedFillStyle;
				ctx.globalAlpha = this.focusedFillAlpha;
			}
		}else{
			if (this.fillStyle) {
				ctx.fillStyle = this.fillStyle;
				ctx.globalAlpha = this.fillAlpha;
			}
		}*/
        ctx.fillRect(startX, startY, width, height);
    }
	
	/*
    if (this.isStroke && this.strokeWidth) {
        if (this.strokeStyle) {
            ctx.strokeStyle = this.strokeStyle;
        }

        if (this.isFocused) {
            ctx.strokeWidth = this.strokeWidth * 5;
            console.log(this.id + ': focused');
        }

        ctx.strokeRect(startX, startY, width, height);
    } else {
        if (this.isFocused) {
            if (this.strokeStyle) {
                ctx.strokeStyle = this.strokeStyle;
            }

            if (this.strokeWidth) {
                ctx.strokeWidth = this.strokeWidth * 2;
            } else {
                ctx.strokeWidth = 2;
            }

            ctx.strokeRect(startX, startY, width, height);
        }
    }

    if (this.isFill) {
        if (this.fillStyle) {
            ctx.fillStyle = this.fillStyle;
        }
        ctx.fillRect(startX, startY, width, height);
    } */
    ctx.closePath();
    ctx.restore();
};

function lineJoinCircle(lineBeginPoint, lineEndPoint, circleCenterPoint, circleRadius) {
	var a = Math.sqrt(Math.pow(lineBeginPoint.X - lineEndPoint.X, 2) + Math.pow(lineBeginPoint.Y - lineEndPoint.Y, 2));
	var b = Math.sqrt(Math.pow(lineBeginPoint.X - circleCenterPoint.X, 2) + Math.pow(lineBeginPoint.Y - circleCenterPoint.Y, 2));
	var c = Math.sqrt(Math.pow(lineEndPoint.X - circleCenterPoint.X, 2) + Math.pow(lineEndPoint.Y - circleCenterPoint.Y, 2));
	var harfC = (a + b + c) / 2;
	var s = Math.sqrt(harfC * (harfC - a) * (harfC - b) * (harfC - c));
	var h = s * 2 / a;
	
	var result = h <= circleRadius && h >= 0;
	
	if(!result) {
		return false;
	}
	
	if(b>0 && c > 0){
		var cosA = (Math.pow(b, 2) + Math.pow(c, 2) - Math.pow(a, 2)) / (2 * b * c);
		return cosA < 0;
	}else{
		return true;
	}
	console.log("hit: " + lineBeginPoint + "," + lineEndPoint + "; " + circleCenterPoint + "," + circleRadius);
	return result;
};

//StraightLine
function StraightLine() {
    this.beginPoint = undefined;
    this.endPoint = undefined;
	this.dash = undefined; //like new Array(10,5);
	this.relateds = new Array();
}
StraightLine.prototype = new Shape();
StraightLine.prototype.type = 'StraightLine';
StraightLine.prototype.isLegal = function() {
	return this.beginPoint && this.endPoint;
};
StraightLine.prototype.isHit = function(point, tolerance) {
	if(!this.beginPoint || !this.endPoint) {
		return false;
	}
	return lineJoinCircle(this.beginPoint, this.endPoint, point, tolerance);
};
StraightLine.prototype.move = function(moveOffset) {
	if(moveOffset.X == 0 && moveOffset.Y == 0){
		return;
	}
	this.beginPoint.X += moveOffset.X;
	this.beginPoint.Y += moveOffset.Y;
	this.endPoint.X += moveOffset.X;
	this.endPoint.Y += moveOffset.Y;
};
StraightLine.prototype.draw = function (ctx) {
    if (!this.beginPoint || !this.endPoint) {
        return;
    }
    ctx.save();
	changeShapeState(ctx, this);
    ctx.beginPath();
	drawLine(ctx, this.beginPoint, this.endPoint, this.dash);
	
	if (this.isStroke) {
		/*if(this.isFocused) {
			if (this.focusedStrokeStyle) {
				ctx.strokeStyle = this.focusedStrokeStyle;
			}
			if (this.focusedStrokeWidth) {
				ctx.strokeWidth = this.focusedStrokeWidth;
			}
		}else{
			if (this.strokeStyle) {
				ctx.strokeStyle = this.strokeStyle;
			}
			if (this.strokeWidth) {
				ctx.strokeWidth = this.strokeWidth;
			}
		}*/
        ctx.stroke();
    }

    ctx.closePath();
    ctx.restore();
};

function drawLine(ctx, beginPoint, endPoint, dashArray) {
	if(!ctx || !beginPoint || !endPoint) {
		return;
	}
	
	if(!dashArray || !dashArray.length || dashArray.length < 2) {
		ctx.moveTo(beginPoint.X, beginPoint.Y);
		ctx.lineTo(endPoint.X, endPoint.Y);
		return;
	}
	
	/*
	if(beginPoint.X > endPoint.X) {
		var tempPoint = beginPoint;
		beginPoint = endPoint;
		endPoint = tempPoint;
	}
	
	var currentX = beginPoint.X;
	var currentY = beginPoint.Y;
	
	
	var newAngle;
	var isNinetyAngle = true;
	if(endPoint.Y != beginPoint.Y) {
		newAngle = Math.atan((endPoint.X - beginPoint.X) / Math.abs(endPoint.Y - beginPoint.Y));
		isNinetyAngle = false;
	}
	
	var angle = 0;
	if(endPoint.Y == beginPoint.Y){
		angle = 0;
	}else if(endPoint.Y != beginPoint.Y) {
		angle = (endPoint.X - beginPoint.X) / Math.abs(endPoint.Y - beginPoint.Y);
	}else if(endPoint.X == beginPoint.X) {
		angle = 1;
	}
	
	var currentDrawEmpty = false;
	if(isNinetyAngle){
		while(currentX < endPoint.X) {
			for(var dashIndex in dashArray) {
			ctx.moveTo(currentX, currentY);
			var length = dashArray[dashIndex];
			currentX += Math.sin(newAngle) * length;
			if(beginPoint.Y  < endPoint.Y) {
				currentY += Math.cos(newAngle) * length;
			}else{
				currentY -= Math.cos(newAngle) * length;
			}
			if(currentDrawEmpty) {
				ctx.moveTo(currentX, currentY);
			}else{
				ctx.lineTo(currentX, currentY);
			}
			currentDrawEmpty = !currentDrawEmpty;
		}
	}else{
		while(currentX < endPoint.X) {
			for(var dashIndex in dashArray) {
			ctx.moveTo(currentX, currentY);
			var length = dashArray[dashIndex];
			currentX += Math.sin(newAngle) * length;
			if(beginPoint.Y  < endPoint.Y) {
				currentY += Math.cos(newAngle) * length;
			}else{
				currentY -= Math.cos(newAngle) * length;
			}
			if(currentDrawEmpty) {
				ctx.moveTo(currentX, currentY);
			}else{
				ctx.lineTo(currentX, currentY);
			}
			currentDrawEmpty = !currentDrawEmpty;
		}
	}
	
	while(currentX < endPoint.X || 
		(beginPoint.Y < endPoint.Y ? currentY < endPoint.Y : currentY > endPoint.Y)){
		for(var dashIndex in dashArray) {
			ctx.moveTo(currentX, currentY);
			var length = dashArray[dashIndex];
			currentX += angle * length;
			//if(angle > 0){
				if(beginPoint.Y  < endPoint.Y) {
					currentY += angle * length;
				}else{
					currentY -= angle * length;
				}
			//}
			if(currentDrawEmpty) {
				ctx.moveTo(currentX, currentY);
			}else{
				ctx.lineTo(currentX, currentY);
			}
			currentDrawEmpty = !currentDrawEmpty;
		}
	}*/
};

//Text
function Text() {
    this.value = '';
    this.width = '60px';
    this.height = '30px';
    this.beginPoint = undefined;
    this.endPoint = undefined;
    this.font = undefined;
    this.withBorder = true;
	this.relateds = new Array();
}

Text.prototype = new Shape();
Text.prototype.type = 'Text';
Text.prototype.isLegal = function() {
	return this.beginPoint && this.endPoint && this.value;
};
Text.prototype.isHit = function(point, tolerance) {
	if(!this.beginPoint || !this.endPoint) {
		return false;
	}
	var widthNum = this.width.substr(0, this.width.length - 2) * 1;
	var heightNum = this.height.substr(0, this.height.length - 2) * 1;
	var endPointValue = new Point(this.beginPoint.X + widthNum, this.beginPoint.Y + heightNum);
	return lineJoinCircle(this.beginPoint, this.endPoint, point, tolerance);
};
Text.prototype.move = function(moveOffset) {
	if(moveOffset.X == 0 && moveOffset.Y == 0){
		return;
	}
	this.beginPoint.X += moveOffset.X;
	this.beginPoint.Y += moveOffset.Y;
	this.endPoint.X += moveOffset.X;
	this.endPoint.Y += moveOffset.Y;
};
Text.prototype.draw = function (ctx) {

    if (!this.beginPoint || !this.value) {
        return;
    }

    ctx.save();
    if (this.font) {
        ctx.font = this.font;
    }

    this.width = ctx.measureText(this.value) + "px";
    ctx.textBaseline = 'top';
    if (this.isStroke) {
        if (this.strokeStyle) {
            ctx.strokeStyle = this.strokeStyle;
        }
        ctx.strokeText(this.value, this.beginPoint.X, this.beginPoint.Y);
    }

    if (this.isFill) {
        if (this.fillStyle) {
            ctx.strokeStyle = this.strokeStyle;
        }
        ctx.fillText(this.value, this.beginPoint.X, this.beginPoint.Y);
    }

    ctx.restore();
};

//PaintModel
function PaintModel() {
    this.shapes = new Array();
};

PaintModel.prototype = {

    shapes: undefined,

    draw: function (ctx) {
        if (!this.shapes || this.shapes.length == 0) {
            return;
        }
        this.shapes.forEach(function (shape) {
            shape.draw(ctx);
        });
    },

    addShape: function (shape) {
        this.shapes.push(shape);
    },

    removeLastShape: function() {
        this.shapes.pop();
    },

    clearShapes: function () {
        this.shapes.clear();
    },
	
	onShapeRemoved: function(shape){
		
	},
	
	removeShape: function(compareFunc){
		for(var i = 0; i < this.shapes.length; i++){
			if(compareFunc(this.shapes[i])) {
				if(this.onShapeRemoved) {
					this.onShapeRemoved(this.shapes[i]);
				}
				this.shapes.splice(i, 1);
				i--;
			}
		}
	},
	
	getShape: function(compareFunc){
		var findedShapes = new Array();
		for(var i = 0; i < this.shapes.length; i++){
			//console.log(this.shapes[i].tag);
			if(compareFunc(this.shapes[i])) {
				//console.log("finded1 " + i);
				findedShapes.push(this.shapes[i]);
				//console.log("finded2 " + i);
			}else{
				//console.log("not equal");
			}
		}
		return findedShapes;
	},

	setJsonString: function(shapesJsonString, clear) {
		if(clear) {
			this.clearShapes();
		}
	    var shapesArr = JSON.parse(shapesJsonString);
	    if (shapesArr && shapesArr.length > 0) {
	        for (var i = 0; i < shapesArr.length; i++) {
	            var index = i;
	            var shape = eval("new " + shapesArr[index].type + "()");
	            for (var j = 0; j < Object.keys(shapesArr[index]).length; j++) {
	                var item = Object.keys(shapesArr[index])[j];
					if(shapesArr[index][item] && shapesArr[index][item].type == "Point") {
					    var point = new Point();
					    for (var k = 0; k < Object.keys(shapesArr[index][item]).length; k++) {
					        var pi = Object.keys(shapesArr[index][item])[k];
					        point[pi] = shapesArr[index][item][pi];
					    }
						shape[item] = point;
					}else if(shapesArr[index][item] == "undefined") {
						shape[item] = undefined;
					}else if(shapesArr[index][item] == "true"){
						shape[item] = true;
					}else if(shapesArr[index][item] == "false"){
						shape[item] = false;
					}else {
						shape[item] = shapesArr[index][item];
					}
				}
	            this.addShape(shape);
	        }
	    }
	},
	
	toString: function (includePaintModel) {
	    if (includePaintModel) {
	        return JSON.stringify(this);
	    } else {
	        var shapeArr = new Array();
	        for (var index in this.shapes) {
	            shapeArr.push(this.shapes[index]);
	        }
	        return JSON.stringify(shapeArr);
	    }
	},
	
    toSvg: function () {
        
        var svg = '<?xml version="1.0" standalone="no">';
        svg += '<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">';
        svg += '<svg width="100%" height="100%" version="1.1" xmlns="http://www.w3.org/2000/svg">';

        for (var shape in this.shapes) {
            if (shape.type == Circle.type) {
                var centerPoint = shape.getCenterPoint();
                var source = '<circle cx="{0}" cy="{1}" r="{2}"{3}{4}></circle>';
                
                var strokeAttr = '';
                if(shape.isStroke) {
                    strokeAttr = ' stroke="{0}" stroke-width="{1}"'.format(shape.strokeStyle, shape.strokeWidth);
                }
                
                var fillAttr = '';
                if (shape.isFill) {
                    fillAttr = ' fill="{0}"'.format(shape.fillStyle);
                }

                svg += source.format(centerPoint.X, centerPoint.Y, shape.getRadius(), strokeAttr, fillAttr);
                   
            }
        }

        svg += '</svg>';
    }
};

