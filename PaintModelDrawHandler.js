function PaintState() {

};

PaintState.LOCKED = "LOCKED"; //锁定
PaintState.MANUAL = "MANUAL"; //手动绘图
PaintState.SELECT = "SELECT"; //选择模式

function PaintModelDrawHandler() {

};

PaintModelDrawHandler.prototype = {
    defaultStrokeStyle: '#000',
    defaultStrokeWidth: 1,
    defaultFillStyle: '#ddd',

    highLightStrokeStyle: '#f00',
    highLightStrokeWidth: 2,
    highLightFillStyle: '#f00',

	isBeginInputText: false,
	
	drawWithAssistLine: false,
    interval: undefined,
    mouseDownPoint: undefined,
	lastMousePoint: undefined,
    isMouseDown: false,
    currentShape: undefined,
    paintModel: undefined,
    width: undefined,
    height: undefined,
    currentCanvas: undefined,
    currentDrawContext: undefined,

    //是否可以移动图形
    canUserMoveShape: true,

    //是否允许删除图形
	canUserDeleteShape: true,

    //当前状态
	currentState: undefined,

    //当前创建图形的构造函数，返回需要创建的图形
    currentCreateShapeFunc:undefined,

    //图形选中后执行的函数，默认设置选中图形的样式为高亮
	shapeSelectedFunc: function(shape){
		//shape.strokeWidth = this.highLightStrokeWidth;
		//shape.strokeStyle = this.highLightStrokeStyle;
	},

    //图形不选中时执行的函数，默认设置不选中的样式为默认样式
	shapeUnselectFunc: function(shape){
		//shape.strokeWidth = this.defaultStrokeWidth;
		//shape.strokeStyle = this.defaultStrokeStyle;
	},
	currentSelectedShape: undefined,
	
    //图形选中后触发的事件，是指在PaintState为SELECT状态下的选中
	onShapeSelected: function(shape) {
		
	},
	
    //图形添加后触发的事件，用于创建后关联到业务对象，每个图形手绘创建后都有唯一的uuid
	onShapeAdded: function(shape){
		
	},
	
    //图形删除后触发的事件，在SELECT状态下按键盘Delete键可以删除当前选中的图形
	onShapeRemoved: function(shape){
		
	},
	
    //图形移动的时候触发的事件，在SELECT状态下选中并拖动图形可以移动图形位置
	onShapeMoving: function(shape){
		
	},
	
	removeShape: function(shape) {
		this.paintModel.removeShape(function(item) {
			return item == shape;
		});
		if(this.onShapeRemoved) {
			this.paintModel.onShapeRemoved(this.onShapeRemoved);
		}
	},

    //设置默认绘图样式，defaultStrokeStyle：默认线条颜色，defaultStrokeWidth：默认线条宽度，defaultFillStyle：默认填充颜色（默认不填充）
    setDefaultCanvasDrawStyle: function (defaultStrokeStyle,
        defaultStrokeWidth, defaultFillStyle) {
        if (defaultStrokeStyle) {
            this.defaultStrokeStyle = defaultStrokeStyle;
        }

        if (defaultStrokeWidth) {
            this.defaultStrokeWidth = defaultStrokeWidth;
        }

        if (defaultFillStyle) {
            this.defaultFillStyle = defaultFillStyle;
        }

        if (this.currentDrawContext) {
            this.currentDrawContext.strokeStyle = this.defaultStrokeStyle;
            this.currentDrawContext.strokeWidth = this.defaultStrokeWidth;
            this.currentDrawContext.fillStyle = this.defaultFillStyle;
            this.currentDrawContext.save();
        }
    },

    //修改当前绘图状态，参数为PaintState枚举
    changeCanvasState: function (state) {
        if (!this.currentCanvas) {
            return;
        }

        if (state == PaintState.MANUAL) { //手动绘图模式
            this.changeToManualState();
        } else if (state == PaintState.SELECT) { //选择模式
            this.changeToSelectState();
        } else if (state == PaintState.LOCKED) { //锁定模式
            this.changeToLockedState();
        }

        this.currentState = state;
    },

    unbindAllCanvasEvent: function () {
        $(this.currentCanvas).unbind('mousedown');
        $(this.currentCanvas).unbind('mousemove');
        $(this.currentCanvas).unbind('mouseout');
        $(this.currentCanvas).unbind('mouseup');
        $(this.currentCanvas).unbind('mouseleave');
    },

    //设置当前绘图状态为锁定，锁定状态不可以绘图也不可以选中
    changeToLockedState: function () {
        this.unbindAllCanvasEvent();
    },

    //设置当前状态为选择状态，该状态下可以选择、移动和删除图形
    changeToSelectState: function () {
        this.unbindAllCanvasEvent();
		var _this = this;
		_this.currentSelectedShape = undefined;
        $(this.currentCanvas).mousedown(function (loc) {
			_this.isMouseDown = true;
			_this.mouseDownPoint = new Point(loc.offsetX, loc.offsetY);
			_this.currentSelectedShape = undefined;
			if (_this.paintModel.shapes && _this.paintModel.shapes.length > 1) {
			    for (var i = 0; i < _this.paintModel.shapes.length; i++) {
			        var index = i;
					if(!_this.currentSelectedShape && 
						_this.paintModel.shapes[index].isHit && 
						_this.paintModel.shapes[index].isHit(new Point(loc.offsetX, loc.offsetY), 5)) {
							_this.paintModel.shapes[index].changeState(ShapeState.FOCUSED);
							if(_this.shapeSelectedFunc) {
								_this.shapeSelectedFunc(_this.paintModel.shapes[index]);
							}
							_this.currentSelectedShape = _this.paintModel.shapes[index];
					}else{
						if(_this.paintModel.shapes[index].changeState) {
							_this.paintModel.shapes[index].changeState(ShapeState.NORMAL);
						}
						if(_this.shapeUnselectFunc) {
							_this.shapeUnselectFunc(_this.paintModel.shapes[index]);
						}
					}
                }
				
				if(_this.onShapeSelected) {
					_this.onShapeSelected(_this.currentSelectedShape);
				}
            }
        });
		
		$(this.currentCanvas).mousemove(function (loc) {
			if(_this.isMouseDown && _this.currentSelectedShape && 
				_this.canUserMoveShape && !_this.currentSelectedShape.isLocked) {
				if(!_this.lastMousePoint) {
					_this.lastMousePoint = _this.mouseDownPoint;
				}
				var offset = new Point(loc.offsetX - _this.lastMousePoint.X, loc.offsetY - _this.lastMousePoint.Y);
				_this.currentSelectedShape.move(offset);
				_this.lastMousePoint = new Point(loc.offsetX, loc.offsetY);
				if(_this.onShapeMoving){
					_this.onShapeMoving(_this.currentSelectedShape);
				}
			}
		});
		
		$(this.currentCanvas).mouseout(function (loc) {
            if (_this.isMouseDown) {
                _this.isMouseDown = false;
				_this.lastMousePoint = undefined;
				_this.lastMousePoint = undefined;
            }
        });

        $(this.currentCanvas).mouseup(function (loc) {
            if (_this.isMouseDown) {
				_this.isMouseDown = false;
				_this.lastMousePoint = undefined;
				_this.lastMousePoint = undefined;
            }
        });

        $(this.currentCanvas).mouseleave(function (loc) {
            if (_this.isMouseDown) {
                _this.isMouseDown = false;
				_this.lastMousePoint = undefined;
				_this.lastMousePoint = undefined;
            }
        });
		
		$(document).keydown(function(events){
			if(events.keyCode == 46) { //delete selected shape
				if(_this.currentState == PaintState.SELECT && _this.currentSelectedShape) {
					if(_this.canUserDeleteShape && !_this.currentSelectedShape.isLocked) {
						_this.removeShape(_this.currentSelectedShape);
					}
				}
			} else if(events.keyCode == 27) {
				if(_this.currentState == PaintState.SELECT && _this.currentSelectedShape) {
					
					_this.currentSelectedShape.changeState(ShapeState.NORMAL);
					_this.currentSelectedShape = null;
				}
			}
		});
    },

    //设置当前状态为手动绘图模式，该状态下可以画图形，但不能删除及移动
    changeToManualState: function () {

        this.unbindAllCanvasEvent();
		
        var _this = this;
        $(this.currentCanvas).mousedown(function (loc) {
            _this.reset();
            _this.isMouseDown = true;
            _this.mouseDownPoint = new Point(loc.offsetX, loc.offsetY);
			
			if(_this.drawWithAssistLine) {
				var hLine = new StraightLine();
				hLine.beginPoint = new Point(0, _this.mouseDownPoint.Y);
				hLine.endPoint = new Point(_this.mouseDownPoint.X, _this.mouseDownPoint.Y);
				hLine.tag = "assistBeginHLine";
				var vLine = new StraightLine();
				vLine.beginPoint = new Point(_this.mouseDownPoint.X, 0);
				vLine.endPoint = new Point(_this.mouseDownPoint.X, _this.mouseDownPoint.Y);
				vLine.tag = "assistBeginVLine";
				_this.paintModel.addShape(hLine);
				_this.paintModel.addShape(vLine);
			}
			
            if (_this.currentCreateShapeFunc) {
				var shape = _this.currentCreateShapeFunc();
				shape.id = uuid();
				if(_this.currentShape &&
					(shape.getType() == Polygon.prototype.type || shape.getType() == Polyline.prototype.type)){
						_this.currentShape.addPoint(new Point(loc.offsetX, loc.offsetY));
				} else {
					_this.currentShape = shape;	
					_this.currentShape.strokeStyle = _this.highLightStrokeStyle;
					_this.currentShape.strokeWidth = _this.highLightStrokeWidth;
					_this.paintModel.addShape(_this.currentShape);
					
					if(_this.currentShape.getType() == Polygon.prototype.type || 
						_this.currentShape.getType() == Polyline.prototype.type){
						_this.currentShape.addPoint(new Point(loc.offsetX, loc.offsetY));
					}else if(_this.currentShape.getType() == Text.prototype.type){
						_this.isBeginInputText = true;
						_this.currentShape.value="123"; //在canvas中添加一个输入框用来输入文本，输入完成后删除并把值填充到currentShape.value中, 目前添加输入框有BUG
						
						//var inputTextBox = "<input type='text' id='tempInputTextBox' style='position:absolute;left:" 
						//	+ loc.pageX + "px;top:" + loc.pageY + "px />";
						//$(inputTextBox).appendTo($("body"));
					}
				}
				
				if(_this.currentShape.isPoint){
					_this.currentShape.centerPoint = new Point(loc.offsetX, loc.offsetY);
				} else {
					_this.currentShape.beginPoint = new Point(loc.offsetX, loc.offsetY);
					_this.currentShape.endPoint = new Point(loc.offsetX, loc.offsetY);
				}
            }
        });

        $(this.currentCanvas).mousemove(function (loc) {
            if (_this.isMouseDown && _this.currentShape) {
				if(_this.currentShape.getType() == CurvesLine.prototype.type) {
					_this.currentShape.addPoint(new Point(loc.offsetX, loc.offsetY));
				} else if(_this.currentShape.getType() == CirclePoint.prototype.type){
					_this.currentShape.centerPoint = new Point(loc.offsetX, loc.offsetY);
				} else{
					_this.currentShape.endPoint = new Point(loc.offsetX, loc.offsetY);	
				}
                
				if(_this.drawWithAssistLine) {
					var hLines = _this.paintModel.getShape(function(item){
						return item.tag == "assistCurrentHLine";
					});
					
					var hLine;
					if(!hLines || hLines.length == 0) {
						hLine = new StraightLine();
						hLine.tag = "assistCurrentHLine";
						_this.paintModel.addShape(hLine);
					}else{
						hLine = hLines[0];
					}
					hLine.beginPoint = new Point(0, loc.offsetY);
					hLine.endPoint = new Point(loc.offsetX, loc.offsetY);
					
					var vLines = _this.paintModel.getShape(function(item){
						return item.tag == "assistCurrentVLine";
					});
					
					var vLine;
					if(!vLines || vLines.length == 0) {
						vLine = new StraightLine();
						vLine.tag = "assistCurrentVLine";
						_this.paintModel.addShape(vLine);
					}else{
						vLine = vLines[0];
					}
					
					vLine.beginPoint = new Point(loc.offsetX, 0);
					vLine.endPoint = new Point(loc.offsetX, loc.offsetY);
				}
            }
        });

        $(this.currentCanvas).mouseout(function (loc) {
            if (_this.isMouseDown) {
                _this.releaseMouse(_this);
            }
        });

        $(this.currentCanvas).mouseup(function (loc) {
            if (_this.isMouseDown) {
				if(_this.currentShape.getType() != Polygon.prototype.type && 
					_this.currentShape.getType() != Polyline.prototype.type){
					_this.releaseMouse(_this);
				}
            }
        });

        $(this.currentCanvas).mouseleave(function (loc) {
            if (_this.isMouseDown) {
                _this.releaseMouse(_this);
            }
        });
		
		$(document).keydown(function(events){
			if(_this.currentState == PaintState.MANUAL && events.keyCode == 27) {
				_this.releaseMouse(_this);
			}
		});
    },
	
	releaseMouse: function(_this) {
		_this.isMouseDown = false;
		_this.clean();
		if(_this.drawWithAssistLine) {
			_this.paintModel.removeShape(function(item){ 
				return item.tag == "assistBeginHLine" || 
				item.tag == "assistBeginVLine" || 
				item.tag == "assistCurrentHLine" || 
				item.tag == "assistCurrentVLine";
			});
		}
	},

    //开始绘图图形，canvasName：需要绘图的canvas名称，
    //backgroundPictureUrl：背景图地址，
    //defaultStrokeStyle：默认线条样式，
    //defaultStrokeWidth：默认线条宽度，
    //defaultFillStyle： 默认填充样式
    startDrawShape: function (canvasName, backgroundPictureUrl, defaultStrokeStyle, defaultStrokeWidth,
        defaultFillStyle) {

        var cvses = $(canvasName);
        if (cvses.length == 0) {
            return;
        }

        this.currentCanvas = cvses[0];
        this.currentDrawContext = this.currentCanvas.getContext("2d");
        this.setDefaultCanvasDrawStyle(defaultStrokeStyle,
            defaultStrokeWidth, defaultFillStyle);

        this.paintModel = new PaintModel();
		if(backgroundPictureUrl){
			var bgPicture = new PImage(backgroundPictureUrl, this.currentCanvas.width, this.currentCanvas.height);
			bgPicture.id = "bgPicture";
			this.paintModel.addShape(bgPicture);
		}
        this.width = this.currentCanvas.width;
        this.height = this.currentCanvas.height;
        this.interval = setInterval(this.draw, 20, this);
    },

    //添加图形，自己new一个Shape添加到当前绘图模型中
    addShape: function (shape) {
        this.paintModel.addShape(shape);
    },
	
    //加载图形，从另一个绘图模型总价在所有图形
	loadShapes: function(targetPaintModel) {
		clear(false);
		if(targetPaintModel && targetPaintModel.shapes && targetPaintModel.shapes.length > 0) {
			for(var index in targetPaintModel.shapes) {
				this.paintModel.addShape(targetPaintModel.shapes[index]);
			}
		}
	},
	
    //清除当前画面的图形，clearBgImage：是否删除背景图片
	clear: function(clearBgImage) {
		if(this.paintModel && this.paintModel.shapes && this.paintModel.shapes.length > 0) {
		    this.paintModel.removeShape(function (item) {
		        return clearBgImage ? true : (/*item.getType() != PImage.prototype.type &&*/ item.id != "bgPicture");
			});
		}
	},

    stop: function () {
        clearInterval(this.interval);
        this.currentShape = undefined;
        this.paintModel = undefined;
    },

    draw: function (thisObj) {
        if (thisObj.paintModel && thisObj.currentDrawContext) {
            thisObj.currentDrawContext.clearRect(0, 0, thisObj.width, thisObj.height);
            thisObj.paintModel.draw(thisObj.currentDrawContext);
        }
    },
	
	clearPaintArea:  function(width, height){
		if (this.paintModel && this.currentDrawContext) {
			if(!width){
				width = this.width;
			}
			
			if(!height){
				height = this.height;
			}
			
            this.currentDrawContext.clearRect(0, 0, width, height);
		}
	},

    clean: function () {
        if (this.currentShape) {
			if(!this.currentShape.isLegal()) {
				var _curentShape = this.currentShape;
				this.paintModel.removeShape(function(item){
					return item == _curentShape;
				});
			}
			this.currentShape.changeState(ShapeState.NORMAL);
			if(this.onShapeAdded) {
				this.onShapeAdded(this.currentShape);
			}
            //this.currentShape.strokeStyle = this.defaultStrokeStyle;
            //this.currentShape.strokeWidth = this.defaultStrokeWidth;
            //this.currentShape.fillStyle = this.defaultFillStyle;
            this.currentShape = undefined;
        }
    },

    reset: function () {
        for (var i = 0; i < this.paintModel.shapes.length; i++) {
            if(!this.paintModel.shapes[i].changeState) {
				continue;
			}
			var index = i;
			
			this.paintModel.shapes[index].changeState(ShapeState.NORMAL);
            //this.paintModel.shapes[index].strokeStyle = this.defaultStrokeStyle;
            //this.paintModel.shapes[index].strokeWidth = this.defaultStrokeWidth;
            //this.paintModel.shapes[index].fillStyle = this.defaultFillStyle;
        }
		
    },
	
    focusBy: function (compareFunc) {
        for (var i = 0; i < this.paintModel.shapes.length; i++) {
			if(!this.paintModel.shapes[i].changeState) {
				continue;
			}
			
            var index = i;
	        if (compareFunc(this.paintModel.shapes[index])) {
				this.paintModel.shapes[index].changeState(ShapeState.FOCUSED);
			}else{
				this.paintModel.shapes[index].changeState(ShapeState.NORMAL);
			}
		}
	},
	
    unFocusBy: function (compareFunc) {
        for (var i = 0; i < this.paintModel.shapes.length; i++) {
            var index = i;
			if(compareFunc(this.paintModel.shapes[index])) {
				if(!this.paintModel.shapes[index].changeState) {
					continue;
				}
				this.paintModel.shapes[index].changeState(ShapeState.NORMAL);
			}
		}
	},

    //根据id高亮指定图形，可以与html表格等交互，如选中表格某一行，高亮指定图形
    highLightShapeById: function (id) {
        for (var i = 0; i < this.paintModel.shapes.length; i++) {
            var index = i;
            if (this.paintModel.shapes[index].id == id) {
                if (this.setHighLightStyle) {
                    if (this.setHighLightStyle) {
                        this.setHighLightStyle(this.paintModel.shapes[index]);
                    } else {
                        this.paintModel.shapes[index].strokeStyle = this.highLightStrokeStyle;
                        this.paintModel.shapes[index].strokeWidth = this.highLightStrokeWidth;
                        this.paintModel.shapes[index].fillStyle = this.highLightFillStyle;
                    }
                } else {
                    this.paintModel.shapes[index].strokeStyle = this.defaultStrokeStyle;
                    this.paintModel.shapes[index].strokeWidth = this.defaultStrokeWidth;
                    this.paintModel.shapes[index].fillStyle = this.defaultFillStyle;
                }
            }
        }
    },

    //高亮指定图形但不改变颜色，只改变线条宽度
    highLightShapeNoColorById: function (id) {
        for (var i = 0; i < this.paintModel.shapes.length; i++) {
            var index = i;
            if (this.paintModel.shapes[index].id == id) {
                if (this.setHighLightStyle) {
                    if (this.setHighLightStyle) {
                        this.setHighLightStyle(this.paintModel.shapes[index]);
                    } else {
                        this.paintModel.shapes[index].strokeWidth = this.highLightStrokeWidth;
                    }
                } else {
                    this.paintModel.shapes[index].strokeWidth = this.defaultStrokeWidth;
                }
            }
        }
    },

    //高亮指定图形
    highLightShape: function (shape) {
        for (var i = 0; i < this.paintModel.shapes.length; i++) {
            var index = i;
            if (this.paintModel.shapes[index] == shape) {
                if (this.setHighLightStyle) {
                    if (this.setHighLightStyle) {
                        this.setHighLightStyle(this.paintModel.shapes[index]);
                    } else {
                        this.paintModel.shapes[index].strokeStyle = this.highLightStrokeStyle;
                        this.paintModel.shapes[index].strokeWidth = this.highLightStrokeWidth;
                        this.paintModel.shapes[index].fillStyle = this.highLightFillStyle;
                    }
                } else {
                    this.paintModel.shapes[index].strokeStyle = this.defaultStrokeStyle;
                    this.paintModel.shapes[index].strokeWidth = this.defaultStrokeWidth;
                    this.paintModel.shapes[index].fillStyle = this.defaultFillStyle;
                }
            }
        }
    },

    //获取当前绘图模型中的所有图形
	getAllDrawedShapes: function() {
		return this.getShapesByFunc(function(item) {
			return item.id;
		});
	},
	
    //根据选择器选择符合条件的第一个图形
	getShapeByFunc: function (shapeFunc) {
	    for (var i = 0; i < this.paintModel.shapes.length; i++) {
	        var index = i;
            if (shapeFunc(this.paintModel.shapes[index])) {
                return this.paintModel.shapes[index];
            }
        }
    },

    //根据选择器选择符合条件的图形
    getShapesByFunc: function (findShapeFunc) {
        var findedShapes = new Array();
        for (var i = 0; i < this.paintModel.shapes.length; i++) {
            var index = i;
            if (findShapeFunc(this.paintModel.shapes[index])) {
                findedShapes.push(this.paintModel.shapes[index]);
            }
        }
        return findedShapes;
    },

    setHighLightStyle: undefined,

    ShapesToJson: function (includePaintModel) {
        return this.paintModel.toString(includePaintModel);
    },

    SetShapesJson: function (jsonString) {
        this.paintModel.setJsonString(jsonString);
    }
};

function uuid() {
    var s = [];
    var hexDigits = "0123456789abcdef";
    for (var i = 0; i < 36; i++) {
        s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
    }
    s[14] = "4";  // bits 12-15 of the time_hi_and_version field to 0010
    s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1);  // bits 6-7 of the clock_seq_hi_and_reserved to 01
    s[8] = s[13] = s[18] = s[23] = "-";
 
    var uuid = s.join("");
    return uuid;
};

function arrayContains(array, item) {
	if(!array) {
		return false;
	}
	for(var index in array) {
		if(item == array[index]) {
			return true;
		}
	}
	
	return false;
};

/*
function deepCopy(source, target) {
	for(var item in source) {
		if(source[item] instanceof Object) {
			target[]
		}else{
			target[item] = source[item];
		}
	}
}*/
