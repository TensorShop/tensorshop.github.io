const HISTORY_LENGTH = 250;

// var tensor = new Tensor([
// 	[ 2, 0, 1],
// 	[ 1, 2, 0],
// 	[ 0, 1, 2]
// ]);

// var tensor = new Tensor([
// 	[-1,-1, 0],
// 	[-1, 0,-1],
// 	[ 0, 1,-1]
// ]);

var localTensor = localStorage.getItem("mm_currenttensor");
var tensor = new Tensor([
	[ 0,-1,-1,-1,-1,-1,-1],
	[ 5,-1,-1,-1,-1, 0,-1],
	[ 4,-1,-1,-1, 0,-1,-1],
	[ 3,-1,-1, 0,-1,-1,-1],
	[ 2,-1, 0,-1,-1,-1,-1],
	[ 1, 0,-1,-1,-1,-1,-1],
	[ 6, 1, 2, 3, 4, 5, 0]
]);
// console.log(shouldReset)
if (!shouldReset && !(localTensor == null || localTensor == '[object Object]')) {
	localTensor = JSON.parse(localTensor);
	tensor.matrix = localTensor.matrix;
	tensor.removalMatrix = localTensor.removalMatrix;
	tensor.kroneckerLabels = localTensor.kroneckerLabels;
	updateKroneckerToggle()
}


var tensorHistory = [{}];
var tensorHistoryIndex = 0;
var showKroneckerLabels = false;


function updatePolyRep() {
	var span = document.getElementById('poly-rep');
	span.innerHTML = tensor.getHTMLPolyRep();
}



function drawColors() {
	if (!showColoring) return;
	
	var prevAlpha = ctx.globalAlpha;


	function drawRect(rect) {
		var c1 = ind2coord(rect[0], rect[1]);
		var c2 = ind2coord(rect[2], rect[3]);
		var area = (rect[2]-rect[0] + 1) * (rect[3]-rect[1] + 1)
		ctx.fillRect(c1[0], c1[1], c2[0]-c1[0]+squareSize, c2[1]-c1[1]+squareSize);
	}

	
	for (var j in matMultDiagonals) {
		var diagonal = matMultDiagonals[j];

		var percentSize = (diagonal.width*diagonal.height)/tensor.length/tensor.length;

		var hsv = computeSpotColor(percentSize,diagonal,tensor)
		var hex = rgb2hex(hsv2rgb(hsv));


		ctx.fillStyle = hex;
		// ctx.fillStyle = rgb2hex(hsv2rgb([160-Math.floor(160*Math.pow((diagonal.len-1)/(tensor.length-1),.3)),1,.8]));
		ctx.globalAlpha = 0.5 * Math.pow((diagonal.len-1)/(tensor.length-1),persistentData.diagonalOpacityBias);
		ctx.globalAlpha += 0.5 * percentSize * persistentData.sizeOpacityBias;

		for (var i = 0; i < diagonal.len; i++) {
			
			drawRect([diagonal.start[0]+diagonal.height*i,diagonal.start[1]+diagonal.width*i,diagonal.start[2]+diagonal.height*i,diagonal.start[3]+diagonal.width*i]);
		}
	}

	if ('partitionConflicts' in persistentData && editMode == "PARTITION") {
		
		for (var conflictSet of persistentData.partitionConflicts) {
			var first = true;
			// console.log(conflictSet)
			for (var [x,y] of conflictSet) {
				ctx.globalAlpha = first ? .7 : .2;
				ctx.fillStyle = 'red';
				drawRect([y,x,y,x]);
				first = false;
			}
		}
	}

	if (diagonalViewIndex >= matMultDiagonals.length)
		diagonalViewIndex = 0;
	ctx.fillStyle = '#61b5ff';
	ctx.globalAlpha = 1;
	var diagonal = matMultDiagonals[diagonalViewIndex];
	if (diagonal)
		for (var i = 0; i < diagonal.len; i++)
			drawRect([diagonal.start[0]+diagonal.height*i,diagonal.start[1]+diagonal.width*i,diagonal.start[2]+diagonal.height*i,diagonal.start[3]+diagonal.width*i]);
	ctx.globalAlpha = prevAlpha;
}




let canvas = document.getElementById('tensor-canvas'); 
let ctx = canvas.getContext('2d');

var width = window.innerWidth;
var height = window.innerHeight;
var size = window.innerHeight;
var matrixSize = height*.8;
var border_x = (width-matrixSize)/2;
var border_y = (height-matrixSize)/2;
var squareSize = matrixSize/tensor.length;

colors = {
	background : "#ffffff",
	foreground : "#F5F6F7",
	outer_border : "#323232",
	inner_border : "#B8BFC1",
	labels : "#565656"
}

var firstLoad = true;

setCanvasDims = () => {
	editState.data.locations = [];

	if (!(firstLoad && persistentData.zeroingRemovals.length > 0))
		persistentData.zeroingRemovals = [[],[],[]].map(arr => tensor.matrix.map(el => false));
	
	firstLoad = false;


	ctx.canvas.width = window.innerWidth;
	ctx.canvas.height = window.innerHeight*(tutorialState.name != 'Not Started' ? .85 : 1);

	size = Math.min(ctx.canvas.width,ctx.canvas.height)

	width = ctx.canvas.width;
	height = ctx.canvas.height;

	matrixSize = ((width > 1150 || height < 400) ? size-150 : 3*size/5-150);
	squareSize = matrixSize/tensor.length;
	border_x = (width-matrixSize)/2-(width > 1000 ? 150 : (width > 600 ? 50 : 0)); // the -150 might break things
	border_y = (height-matrixSize)/2;
	ctx.fillStyle = colors.background;
	ctx.fillRect(0, 0, width,height);
	canvas.style = `width: ${width}px; height: ${height}px;`
}
setCanvasDims();

window.onresize = setCanvasDims;


var indexPermutations = ['xyz','xzy','yxz','yzx','zxy','zyx']

var matMultDiagonals;
var diagonalViewIndex = -1;

var showAuxillaryMarks = true;
var showAnnotations = true;
var showColoring = true;

var t = 0;

var shouldSave = false;


var canvasData = {
	scale : 1,
	x : 0,
	y : 0,
}



function computeMatMultDiagonals() {
	document.getElementById('loading-wheel').classList.remove("hidden");
	
	matMultDiagonals = [];

	if (tensor.countTerms() <= 250)
		matMultDiagonals = tensor.computeDiagonals(); 

	document.getElementById('loading-wheel').classList.add("hidden");
}

function update(dt) {
	// console.log(tensorHistoryIndex,tensorHistory.length-1-tensorHistoryIndex,!deepArrEquals(tensorHistory[tensorHistory.length-1-tensorHistoryIndex].matrix, tensor.matrix))
	if (shouldSave || !deepArrEquals(tensorHistory[tensorHistory.length-1-tensorHistoryIndex].matrix, tensor.matrix)) {
		// console.log('cleared')
		tensorHistory = tensorHistory.slice(0,tensorHistory.length-tensorHistoryIndex)

		tensorHistory.push({matrix : tensor.matrix.map(arr => arr.slice()), removalMatrix : tensor.removalMatrix.map(arr => arr.slice()), kroneckerLabels : tensor.kroneckerLabels.map(arr => arr.slice())})
		// only need to recompute diagonals on change
		computeMatMultDiagonals();
		
		if (tensorHistory.length > HISTORY_LENGTH) {
			tensorHistory = tensorHistory.slice(tensorHistory.length-HISTORY_LENGTH)
		}
		persistentData.partitions = persistentData.partitions.map(arr => arr.filter((el,i) => i < tensor.length-1))
		updatePartitionTable();

		var pv = tensor.isValidPartition(persistentData.partitions);

		persistentData.isValidPartition = pv == true;
		persistentData.partitionConflicts = !persistentData.isValidPartition ? pv : [];
		tensor.catchOverflow();
		localStorage.setItem("mm_currenttensor",JSON.stringify(tensor));
		localStorage.setItem("mm_persistentdata",JSON.stringify(persistentData));
		shouldSave = false;

		tensorHistoryIndex = 0;
	}




	t += dt/20;
	ctx.restore();
	ctx.save();

    ctx.translate(-canvasData.x, -canvasData.y);
    
	// // ctx.translate(-canvasData.x, -canvasData.y);
	ctx.scale(canvasData.scale, canvasData.scale);

	updatePolyRep();
	ctx.fillStyle = colors.foreground;
	ctx.strokeStyle = colors.outer_border;
	ctx.lineWidth = 1;
	if (tutorialState.name == "Intro") {
		ctx.strokeStyle = "red";
		ctx.lineWidth = 4;
	}
	ctx.setLineDash([]);
	ctx.fillRect(border_x,border_y, matrixSize,matrixSize);
	ctx.strokeRect(border_x,border_y, matrixSize,matrixSize);
	ctx.strokeStyle = colors.inner_border;
	var square = {
		x1 : -1,
		y1 : -1,
		x2 : -1,
		y2 : -1
	}
	ctx.font = '30px Lato';
	ctx.fontWeight = "300"
	ctx.textAlign = "center";
	ctx.textBaseline = "middle";

	const showDegenerationLabels = persistentData.degenerationLabels.some(axis => axis.some(label => label != 0));

	drawColors()

	for (var i = 0; i < tensor.length; i++) {
		square.x1 = border_x+squareSize*i;
		square.x2 = border_x+squareSize*(i+1);

		
		if (mouse.x > square.x1 && mouse.x < square.x2 ) {
			mouse.col = i;
		}
		var minSize = 3;
		var labelFontSize = (tensor.length <= 15 ? 20 : (20-minSize)*15/tensor.length+minSize)
		ctx.font = labelFontSize+'px Lato';

		var baseLabelDistance = Math.min(squareSize/3, 30);

		if (editMode === 'SELECTING-SWAPPING' && showAuxillaryMarks) {
			ctx.fillStyle = "#eaeaea";
			ctx.beginPath();
			if (tutorialState.tasks["Do Swap"] == false || tutorialState.tasks["Do Multiple Swap"] == false)
				ctx.fillStyle = "red";
			var size = labelFontSize-4;
			ctx.ellipse(square.x1+squareSize/2+1, height-border_y+baseLabelDistance-2,size,size,0, 0, 2 * Math.PI);
			ctx.fill();
		}
		ctx.fillStyle = persistentData.zeroingRemovals[0][i] ? colors.inner_border : colors.labels;
		if (tutorialState.tasks["Do Swap"] == false || tutorialState.tasks["Do Multiple Swap"] == false)
			ctx.fillStyle = "white";
		var label = i;
		if (showKroneckerLabels && tensor.kroneckerLabels.length > 0)
			label = tensor.kroneckerLabels[0][i+1];
		ctx.fillText(label, square.x1+squareSize/2, height-border_y+baseLabelDistance);

		if (showAnnotations && (showDegenerationLabels || (editMode === 'REMOVAL-DEGENERATION' || editMode === 'REMOVAL-SOLVE-DEGENERATION'))) {
			ctx.fillStyle = (editMode === 'REMOVAL-DEGENERATION' && editState.type === 'EDITING-DEGENERATION' && editState.data.type === 'col' && editState.data.ind === i) ? "cornflowerblue" : colors.inner_border ;
			var degenerationLabel = (i < persistentData.degenerationLabels[0].length) ? persistentData.degenerationLabels[0][i] : 0;
			
			ctx.fillText(degenerationLabel, square.x1+squareSize/2, height-border_y+Math.max(baseLabelDistance*2,baseLabelDistance+15));
		}

		for (var j = 0; j < tensor.length; j++) {
			square.y1 = height-border_y-squareSize*(j+1);
			square.y2 = height-border_y-squareSize*(j);


			if (i == 0) {
				// only need to do this once
				if (mouse.y > square.y1 && mouse.y < square.y2) {
					mouse.row = j;
				}


				ctx.font = labelFontSize+'px Lato';
				if (editMode == 'SELECTING-SWAPPING' && showAuxillaryMarks) {
					ctx.fillStyle = "#eaeaea";
					if (tutorialState.tasks["Do Swap"] == false || tutorialState.tasks["Do Multiple Swap"] == false)
						ctx.fillStyle = "red";
					ctx.beginPath();
					var size = labelFontSize-4;
					ctx.ellipse(border_x-baseLabelDistance+1, square.y1+squareSize/2-2,size,size,0, 0, 2 * Math.PI);
					ctx.fill();
				}
				ctx.fillStyle = persistentData.zeroingRemovals[1][j] ? colors.inner_border : colors.labels;
				if (tutorialState.tasks["Do Swap"] == false || tutorialState.tasks["Do Multiple Swap"] == false)
					ctx.fillStyle = "white";
				var label = j;
				if (showKroneckerLabels && tensor.kroneckerLabels.length > 0)
					label = tensor.kroneckerLabels[j+1][0];
				ctx.fillText(label, border_x-baseLabelDistance, square.y1+squareSize/2);

				if (showAnnotations && (showDegenerationLabels || (editMode === 'REMOVAL-DEGENERATION' || editMode === 'REMOVAL-SOLVE-DEGENERATION'))) {
					ctx.fillStyle = (editMode === 'REMOVAL-DEGENERATION' && editState.type === 'EDITING-DEGENERATION' && editState.data.type === 'row' && editState.data.ind === j) ? "cornflowerblue" : colors.inner_border ;
					var degenerationLabel = (j < persistentData.degenerationLabels[1].length) ? persistentData.degenerationLabels[1][j] : 0;
					
					ctx.fillText(degenerationLabel, border_x-Math.max(baseLabelDistance*2,baseLabelDistance+15), square.y1+squareSize/2);
				}
			}


			var z = tensor.matrix[j][i];
			var rZ = tensor.removalMatrix[j][i];
				
			if (z != -1 || rZ != -1) {
				var label = Math.max(z,rZ);

				ctx.fillStyle = (z == -1 && rZ != -1) ? colors.inner_border : colors.outer_border;

				var _label = (label.toString().length < 10 ? label : label.toString().slice(0,8)+'...');
				if (showKroneckerLabels && tensor.kroneckerLabels.length > 0)
					_label = tensor.kroneckerLabels[j+1][i+1];

				var l = _label.toString().length;
				var fontFactor = (l < 3 ? 30 : (l < 10 ? Math.round(80/l + 4) : 11))/30;
				ctx.font = labelFontSize*fontFactor+'px Lato';

  				ctx.fillText(_label, square.x1+squareSize/2,square.y1+squareSize/2);

  				// monomial degeneration z labels
				if (showAnnotations && (editMode === 'REMOVAL-DEGENERATION' || editMode === 'REMOVAL-SOLVE-DEGENERATION')) {
					ctx.fillStyle = "black";
					var degenerationLabel = ((i < persistentData.degenerationLabels[0].length) ? persistentData.degenerationLabels[0][i] : 0) + ((j < persistentData.degenerationLabels[1].length) ? persistentData.degenerationLabels[1][j] : 0);
					ctx.font = labelFontSize*fontFactor/2+'px Lato';
					ctx.fillText(degenerationLabel, square.x1+squareSize-10,square.y1+10);
				}
			}




			ctx.beginPath();
			ctx.setLineDash([squareSize/6,squareSize/6 * (1-1/3)]);
			if (i > 0) {
				if (persistentData.partitions[1][i-1]) {
					ctx.strokeStyle = (('isValidPartition' in persistentData) ? (persistentData.isValidPartition ? 'green' : 'red') : 'blue');
					ctx.lineWidth = 4;
					ctx.setLineDash([]);
				}
				ctx.moveTo(square.x1, square.y1);
				ctx.lineTo(square.x1, square.y2);
			}
			ctx.stroke();
			ctx.lineWidth = 1;
			ctx.strokeStyle = colors.inner_border;
			ctx.beginPath();
			ctx.setLineDash([squareSize/6,squareSize/6 * (1-1/3)]);
			if (j < tensor.length-1) {
				if (persistentData.partitions[0][j]) {
					ctx.strokeStyle = (('isValidPartition' in persistentData) ? (persistentData.isValidPartition ? 'green' : 'red') : 'blue');;
					ctx.lineWidth = 4;
					ctx.setLineDash([]);
				}
				ctx.moveTo(square.x1, square.y1);
				ctx.lineTo(square.x2, square.y1);
			}
			ctx.stroke();
			ctx.lineWidth = 1;
			ctx.strokeStyle = colors.inner_border;

			if (showAnnotations && editMode == "EDITING-SINGLE" && editState.type == 'EDITING' && editState.data.row == j && editState.data.col == i) {
				var prevAlpha = ctx.globalAlpha;
				ctx.globalAlpha = 0.1;
				ctx.fillStyle = 'blue';
				ctx.fillRect(square.x1, square.y1, squareSize, squareSize);
				ctx.globalAlpha = prevAlpha;
			}
		}
	}


	// give some nice visuals for mouse actions
	switch (editState.type) {
		case "SWAPPING": 
			if (!showAnnotations) break;

			var prevAlpha = ctx.globalAlpha;
			ctx.globalAlpha = 0.85;
			switch (editState.data.type) {
				case "row":
					if (!heldKeys[16]) {
						ctx.fillStyle = colors.foreground;
						ctx.setLineDash([])



						ctx.fillRect(mouse.x+squareSize/2,mouse.y-squareSize/2, matrixSize,squareSize);
						ctx.globalAlpha = 1;


						ctx.fillRect(border_x,border_y+matrixSize-(squareSize*(editState.data.ind+1)), matrixSize,squareSize);
						ctx.globalAlpha = 0.85;
						ctx.strokeStyle = colors.foreground;
						ctx.strokeRect(mouse.x-squareSize/2,mouse.y-squareSize/2, squareSize,squareSize);

						ctx.strokeStyle = colors.inner_border;
						ctx.strokeRect(mouse.x+squareSize/2-squareSize,mouse.y-squareSize/2, matrixSize+squareSize,squareSize);

						for (var j = 0; j < tensor.length; j++) {
							var z = tensor.matrix[editState.data.ind][j];
							var l = z.toString().length;

							var fontFactor = (l < 3 ? 30 : (l < 10 ? Math.round(80/l + 4) : 11))/30;
							ctx.font = labelFontSize*fontFactor+'px Lato';
							ctx.fillStyle = colors.outer_border;
							
							if (z != -1)
				  				ctx.fillText(z, squareSize*(j+1)+mouse.x,mouse.y);

							ctx.beginPath();
							ctx.setLineDash([squareSize/6,squareSize/6 * (1-1/3)]);
							
							ctx.moveTo(mouse.x+squareSize/2+squareSize*(j+1), mouse.y-squareSize/2);
							ctx.lineTo(mouse.x+squareSize/2+squareSize*(j+1), mouse.y+squareSize/2);
							
							ctx.stroke();
						}

						if (editState.data.insertion !== undefined) {
							ctx.globalAlpha = 0.4;
							ctx.beginPath();
							ctx.strokeStyle = "blue";
							ctx.lineWidth = 5;
							ctx.setLineDash([]);
							var y = ind2coord(editState.data.insertion,0)[1];
							ctx.moveTo(border_x-squareSize, y);
							ctx.lineTo(width-border_x, y);
							
							ctx.stroke();
						} else {
							ctx.globalAlpha = 0.1;
							ctx.fillStyle = "blue";
							var y = ind2coord(mouse.row,0)[1];
							ctx.fillRect(border_x,y,matrixSize,squareSize);
						}
					}
					for (var ind of editState.data.selection) {
						ctx.globalAlpha = 0.2;
						ctx.fillStyle = "cornflowerblue";
						var y = ind2coord(ind,0)[1];
						ctx.fillRect(border_x,y,matrixSize,squareSize);
					}


				break;
				case "col":
					if (!heldKeys[16]) {

						ctx.fillStyle = colors.foreground;
						ctx.setLineDash([])

						ctx.fillRect(mouse.x-squareSize/2,mouse.y-squareSize/2-matrixSize, squareSize, matrixSize);
						ctx.globalAlpha = 1;
						ctx.fillRect(border_x+squareSize*editState.data.ind,border_y, squareSize,matrixSize);
						ctx.globalAlpha = 0.85;
						ctx.strokeStyle = colors.foreground;
						ctx.strokeRect(mouse.x-squareSize/2,mouse.y-squareSize/2, squareSize,squareSize);

						ctx.strokeStyle = colors.inner_border;
						ctx.strokeRect(mouse.x-squareSize/2,mouse.y-squareSize/2-matrixSize, squareSize, matrixSize+squareSize);

						for (var j = 0; j < tensor.length; j++) {
							var z = tensor.matrix[j][editState.data.ind];
							var l = z.toString().length;

							var fontFactor = (l < 3 ? 30 : (l < 10 ? Math.round(80/l + 4) : 11))/30;
							ctx.font = labelFontSize*fontFactor+'px Lato';
							ctx.fillStyle = colors.outer_border;
							
							if (z != -1)
				  				ctx.fillText(z, mouse.x-squareSize/2+squareSize/2,matrixSize+mouse.y-squareSize/2-matrixSize+squareSize/2-squareSize*(j+1));

							ctx.beginPath();
							ctx.setLineDash([squareSize/6,squareSize/6 * (1-1/3)]);

							ctx.moveTo(mouse.x-squareSize/2,matrixSize+mouse.y-squareSize/2-matrixSize-squareSize*(j+1));
							ctx.lineTo(mouse.x-squareSize/2+squareSize,matrixSize+mouse.y-squareSize/2-matrixSize-squareSize*(j+1));

							ctx.stroke();
						}

						if (editState.data.insertion !== undefined) {
							ctx.globalAlpha = 0.4;
							ctx.beginPath();
							ctx.strokeStyle = "blue";
							ctx.lineWidth = 5;
							ctx.setLineDash([]);
							var x = ind2coord(0,editState.data.insertion)[0];
							ctx.moveTo(x, border_y);
							ctx.lineTo(x, height-border_y+squareSize);
							
							ctx.stroke();
						} else {
							ctx.globalAlpha = 0.1;
							ctx.fillStyle = "blue";
							var x = ind2coord(0,mouse.col)[0];
							ctx.fillRect(x,border_y,squareSize,matrixSize);
						}
					}
					for (var ind of editState.data.selection) {
						ctx.globalAlpha = 0.2;
						ctx.fillStyle = "cornflowerblue";
						var x = ind2coord(0,ind)[0];
						ctx.fillRect(x,border_y,squareSize,matrixSize);
					}
				break;
				default: break;
			}
			ctx.globalAlpha = prevAlpha;
			break;
		case "PAINTING": 
			if (!showAnnotations) break;
			var prevAlpha = ctx.globalAlpha;
			for (var i = 0; i < editState.data.path.length-1; i++) {
				var pos1 = ind2coord(editState.data.path[i][0],editState.data.path[i][1]);
				var pos2 = ind2coord(editState.data.path[i+1][0],editState.data.path[i+1][1]);

				ctx.globalAlpha = .5;
				ctx.beginPath();
				ctx.strokeStyle = "green";
				ctx.lineWidth = 5;
				ctx.lineCap = "round";
				ctx.setLineDash([]);
				
				ctx.moveTo(pos1[0]+squareSize/2, pos1[1]+squareSize/2);
				ctx.lineTo(pos2[0]+squareSize/2, pos2[1]+squareSize/2);
				
				ctx.stroke();
			}
			ctx.globalAlpha = prevAlpha;
			break;
		case "SOLVE-DEGENERATION":
			if (editMode !== "REMOVAL-SOLVE-DEGENERATION" || !showAuxillaryMarks) break;

			var prevAlpha = ctx.globalAlpha;
			ctx.fillStyle = "red";
			for (var i = 0; i < editState.data.locations.length; i++) {
				var pos = editState.data.locations[i];
				pos = ind2coord(pos.r,pos.c);

				ctx.globalAlpha = .3;
				
				var rSize = labelFontSize*1.5;

				ctx.fillRect(pos[0]+squareSize/2-rSize/2,pos[1]+squareSize/2-rSize/2,rSize,rSize);
			}
			ctx.globalAlpha = prevAlpha;
			break;
		default: break;
	}

	// show table for z labels for degeneration
	if (showAnnotations && (showDegenerationLabels || (editMode === 'REMOVAL-DEGENERATION' || editMode === 'REMOVAL-SOLVE-DEGENERATION'))) {
		ctx.font = labelFontSize+'px Lato';
		var scaleFactor = labelFontSize/20;
		const START_X = 90;
		const START_Y = 40;
		const HORIZONTAL_GAP = 50;
		const VERTICAL_GAP = 20*scaleFactor+4;

		ctx.fillStyle = "#000000";
		ctx.fillText('Z', START_X, START_Y);
		ctx.fillText('Label', START_X+HORIZONTAL_GAP, START_Y);
		for (var i = 0; i < tensor.length; i++) {
			ctx.fillStyle = colors.inner_border;
			var degenerationLabel = (i < persistentData.degenerationLabels[2].length) ? persistentData.degenerationLabels[2][i] : 0;
			
			ctx.fillText(i, START_X, START_Y+VERTICAL_GAP*(i+1));
			ctx.fillText(degenerationLabel, START_X+HORIZONTAL_GAP, START_Y+VERTICAL_GAP*(i+1));
		}
	}

	if (persistentData.partitionZoomStack.length >= 1) {
		ctx.fillStyle = "#000000";
		var maxSize = persistentData.partitionZoomStack[0][1].length;
		for (var i = 0; i < persistentData.partitionZoomStack.length; i++) {
			var ratio = persistentData.partitionZoomStack[i][1].length/maxSize;
			ctx.fillRect(border_x+matrixSize+20+50*(1-ratio),25+i*15,100*ratio,5);
		}
	}
		

	

	// var newWidth = width / canvasData.scale;
	// var newHeight = height / canvasData.scale;
	// var mx = 50;
	// var my = 100;
	// //-((newWidth - width) / 2) -((newHeight - height) / 2)
	// //-403x -482y 339y
	// // console.log((mouse.x-canvasData.x),(mouse.y-canvasData.y));
	// ctx.fillStyle = 'blue';
	// ctx.fillRect(mx,my,50,50);
	// ctx.fillStyle = 'red';
	// ctx.fillRect(canvasData.x,mouse.y,50,50);
}


let lastTime = 0;
function gameLoop(timestamp) {
	ctx.fillStyle = colors.background;
	ctx.fillRect(0, 0, width,height);

	let dt = timestamp - lastTime;
	lastTime = timestamp;

	update(dt);
	animate3D(dt);

	requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);


