var localPersistentData = localStorage.getItem("mm_persistentdata");

var persistentData = {
	indexPermutationsIndex : 0,
	zeroingRemovals : [[],[],[]],
	degenerationLabels : [[],[],[]],
	degenerationSpots : [],

	partitions : [[],[],[]],
	partitionValues : [[]],
	partitionTotalValue : 0,
	partitionZoomStack : [],

	diagonalColorBias : .3,
	diagonalOpacityBias : .3,
	sizeColorBias : 0,
	sizeOpacityBias : .8,
}

// check if there is a reset url parameter
const params = new URLSearchParams(location.search);
var shouldReset = params.get('reset') == 'true';
params.delete('reset');
var paramsStr = params.toString();
window.history.replaceState({}, '', `${location.pathname}${paramsStr.length == 0 ? '' : '?'}${paramsStr}`);

// if there is a not reset parameter and there is local data, load it in
if (!shouldReset && !(localPersistentData == null || localPersistentData == '[object Object]')) {
	var parsedData = JSON.parse(localPersistentData);
	Object.keys(persistentData).forEach(k => {
		if (!(k in parsedData)) parsedData[k] = persistentData[k];
	});
	persistentData = parsedData;
}

// if the partition section should be toggled on, wait for the function to be loaded in toggle it on
if (persistentData.partitionSectionToggled) {
	setTimeout(() => {togglePartitionSection();}, 1000);
}

// function to fully reset TensorShop
function fullReset() {
	// remove any added tensors
	tensors.forEach(el => {
		if (el.userAdded) {
			el.closeButton.onclick({preventDefault : () => {}})
		}
	});
	

	persistentData = {
		indexPermutationsIndex : 0,
		zeroingRemovals : [[],[],[]],
		degenerationLabels : [[],[],[]],
		degenerationSpots : [],

		partitions : [[],[],[]],
		partitionValues : [[]],
		partitionTotalValue : 0,
		partitionZoomStack : [],

		diagonalColorBias : .3,
		diagonalOpacityBias : .3,
		sizeColorBias : 0,
		sizeOpacityBias : .8,
	}
	tensor = new Tensor(tensors[2].matrixGenerator(6).reverse());
	setCanvasDims()
	
	shouldSave = true;
	toggleHardResetPrompt();
}










// simple shallow array equality function
function arrEquals(a1,a2) {
	return Array.isArray(a1) && Array.isArray(a2) && a1.length === a2.length && a1.every((el, i) => a2[i] === el);
}
// expensive deep array equality function
function deepArrEquals(a1,a2) {
	return JSON.stringify(a1) === JSON.stringify(a2);
}

// check if an array of positions contains a position
function arrContainsPos(arr, r, c) {
	return arr.some(p => p.r == r && p.c == c);
}

// helper function to convert from HSV (Hue, Saturation, Value) to RGB (Red, Green, Blue)
function hsv2rgb(hsv) {
	var [h,s,v] = hsv;

	var c = v*s;
	var x = c*(1-Math.abs((h/60)%2 - 1));
	var m = v-c;

	var rp,gp,bp;

	if (h < 60)
		[rp,gp,bp] = [c,x,0];
	else if (h < 120)
		[rp,gp,bp] = [x,c,0];
	else if (h < 180)
		[rp,gp,bp] = [0,c,x];
	else if (h < 240)
		[rp,gp,bp] = [0,x,c];
	else if (h < 300)
		[rp,gp,bp] = [x,0,c];
	else if (h < 360)
		[rp,gp,bp] = [c,0,x];

	return [Math.floor((rp+m)*255),Math.floor((gp+m)*255),Math.floor((bp+m)*255)];
}

// simple helper function to convert from an integer to a string hexidecimal representation
function int2hex(n) {
    var hex = Math.floor(n).toString(16);

    while (hex.length < 2) {
        hex = "0" + hex;
    }

    return hex;
}

// simple helper function to convert from rgb values to hex string
function rgb2hex(rgb) {
	var [r,g,b] = rgb;
	return `#${int2hex(r)}${int2hex(g)}${int2hex(b)}`;
}

// simple helper function to convert from hsv values to hex string
function hsv2hex(hsv) {
	return rgb2hex(hsv2rgb(hsv));
}


// simple helper function to convert from row and column indices to x,y coordinates
function ind2coord(r,c) {
	var x = border_x+squareSize*c;
	var y = height-border_y-squareSize*((r)+1); // invert the index because of array indexing
	return [x,y]
}

// number linear interpolation function
function lerp(a, b, p) {
	return a + (b - a)*p
}

// color linear interpolation function
function colorLerp(c1, c2, p) {
	return [lerp(c1[0], c2[0], p),lerp(c1[1], c2[1], p),lerp(c1[2], c2[2], p)];
}

// calculate the color of a point on a gradient
function computePointOnGradient(percent, gradient) {
	if (gradient[0].percent !== 0 || gradient.length < 2)  // check that gradient starts at 0%
		return null;

	var c1, c2; // colors in HSV
	var p1, p2; // percentage of first color
	for (var i = 0; i < gradient.length; i++) {
		if (percent < gradient[i].percent || i == gradient.length-1) {
			c1 = gradient[i-1].color;
			c2 = gradient[i].color;
			p1 = gradient[i-1].percent;
			p2 = gradient[i].percent
		}
	}

	return colorLerp(c1,c2,(percent-p1)/(p2-p1));
}

// function to transpose a matrix
var transpose = (matrix) => matrix[0].map((el, c) => matrix.map(row => row[c]));


// helper function to reset monomial degeneration
function resetDegeneration() {
	for (var {r,c} of persistentData.degenerationSpots) {
		if (r >= tensor.length || c >= tensor.length || tensor.removalMatrix[r][c] == -1 || persistentData.zeroingRemovals[0][c] || persistentData.zeroingRemovals[1][r] || persistentData.zeroingRemovals[2][tensor.removalMatrix[r][c]]) continue;

		tensor.matrix[r][c] = tensor.removalMatrix[r][c];
		tensor.removalMatrix[r][c] = -1;
	}
	persistentData.degenerationSpots = [];
}


// helper function to calculate the color of a spot on the 2D rep
function computeSpotColor(percentSize, diagonal, tensor) {
	var p = Math.pow((diagonal.len-1)/(tensor.length-1),persistentData.diagonalColorBias) * persistentData.diagonalColorBias/(persistentData.diagonalColorBias+persistentData.sizeColorBias) + (persistentData.sizeOpacityBias * percentSize)  * persistentData.sizeColorBias/(persistentData.diagonalColorBias+persistentData.sizeColorBias);

	var hsv = computePointOnGradient(p, [{percent : 0, color : [159, 64/100, 100/100]}, {percent : 1, color : [3, 87/100, 93/100]}]);

	return hsv;
}

// function to generate empty matrix
function generateEmptyMatrix(matWidth,matHeight) {
	return Array(matHeight).fill(0).map(el => Array(matWidth).fill(-1));
}
var _xPartitions = 1;
var _yPartitions = 1;

function updatePartitionTable() {
	const grid = document.getElementById("partition-grid-parent");
	const partitions = persistentData.partitions;
	const MAX_X_SIZE = 240;
	const MAX_Y_SIZE = 120;

	document.getElementById("partition-matrix-total-value").value = persistentData.partitionTotalValue;
	document.getElementById("partition-matrix-total-value").onchange = e => {
		persistentData.partitionTotalValue = document.getElementById("partition-matrix-total-value").value;
		shouldSave = true;
	}
	grid.innerHTML = "";

	// calculate the number of x partitions
	_xPartitions = 1;
	for (var x = 0; x < partitions[0].length; x++)
		if (partitions[0][x])
			_xPartitions++;

	// calculate the number of y partitions
	_yPartitions = 1;
	for (var y = 0; y < partitions[1].length; y++)
		if (partitions[1][y])
			_yPartitions++;
	
	const X_SIZE = MAX_X_SIZE/_yPartitions;
	const Y_SIZE = MAX_Y_SIZE/_xPartitions;

	// for each y partition
	for (var r = 0; r < _xPartitions; r++) {
		var row = document.createElement('div');
		row.className = "partition-grid-row";
		for (var c = 0; c < _yPartitions; c++) {
			// create the value input
			var input = document.createElement('input');
			input.value = (r in persistentData.partitionValues && c in persistentData.partitionValues[r]) ? persistentData.partitionValues[r][c] : '';
			// size it properly
			input.style.width = X_SIZE+'px';
			input.style.height = Y_SIZE+'px';

			if (!persistentData.partitionValues[r] || !persistentData.partitionValues[r][c]) {
				if (persistentData.partitionValues.length <= r)
					persistentData.partitionValues[r] = [];
				persistentData.partitionValues[r][c] = "";
			}

			// when the input is updated, update the stored values
			input.onchange = ((ri,ci) => (event => {
				// lazily fill in the indices for the value
				if (!(ri in persistentData.partitionValues))
					persistentData.partitionValues[ri] = [];
				persistentData.partitionValues[ri][ci] = event.target.value;
				shouldSave = true;
			}))(r,c)
			row.appendChild(input)
		}
		grid.prepend(row);
	}
}

function computeIfOverLines(partitionDetectionBorderMargin) {
	var [partitionIsOverRow,partitionIsOverColumn] = [false, false];

	// if we need to detect the line of partitioning
	if (editMode == 'PARTITION') {
		// calcualte the bounding box positions
		var y2 = ind2coord(mouse.row-1,0)[1];
		var y1 = ind2coord(mouse.row,0)[1];
		var x1 = ind2coord(0,mouse.col)[0];
		var x2 = ind2coord(0,mouse.col+1)[0];

		// calculate if the mouse is not within the detection border
		partitionIsOverColumn = mouse.x > x1+partitionDetectionBorderMargin && mouse.x < x2-partitionDetectionBorderMargin;
		partitionIsOverRow = mouse.y > y1+partitionDetectionBorderMargin && mouse.y < y2-partitionDetectionBorderMargin;
	}
	return [partitionIsOverRow,partitionIsOverColumn];
}

function isPrime(p) {
	for (var i = 2; i <= p**.5; i++) {
		if (p % i == 0)
			return false
	}
	return true
}

function isPrimeMemo(p,foundPrimes) {
	for (var i = 0; i < foundPrimes.length; i++) {
		if (p%foundPrimes[i] == 0)
			return false
	}
	return true
}



