var THREE_FONT;

const loader = new FontLoader();
loader.load('fonts/helvetiker_regular.typeface.json', function ( response ) {
	THREE_FONT = response;
} );

function resizeTensor(expand) {
	if (expand)
		tensor.expand()
	else
		tensor.shrink()
	setCanvasDims()
}

function toggleExportChoice() {
	document.getElementById("export-choice").classList.toggle("hidden");
	tutorialState.tasks["Export"] = true;
}

function toggleSettings() {
	document.getElementById("settings-parent").classList.toggle("hidden");
}


function togglePartitionSection() {
	var button = document.getElementById("settings-toggle-partition-section-button");
	var section = document.getElementById("partition-controls");
	persistentData.partitionSectionToggled = section.classList.contains("hidden");

	if (section.classList.contains("hidden"))
		button.innerHTML = "Toggle Off";
	else
		button.innerHTML = "Toggle On";

	section.classList.toggle("hidden");
	shouldSave = true;
}


function doSelfKronecker() {
	if (tensor.length > 20) {
		displayKroneckerError()
		return
	}
	tutorialState.tasks["Take Self-Kronecker"] = true;
	var m = tensor.doSimpleKroneckerProduct(tensor);
	var s = tensor.kroneckerLabels;
	tensor = new Tensor(m);
	tensor.kroneckerLabels = s;
	setCanvasDims();
}

function doKronecker() {
	toggleImportLibrary()
	tutorialState.tasks["Take Kronecker"] = true;
	doingKroneckerSelection = true;
}

var possiblePartitions = []
var possiblePartitionsIndex = 0;

function bruteForcePartitions() {
	return new Promise(resolve => {
		var partitions = [Array(tensor.length-1).fill(false),Array(tensor.length-1).fill(false)]
		var validPartitions = [];
		var i = 0;
		// partitions = [[false,false,false],[false,false,false]]
		while (i < partitions[0].length+partitions[1].length) {
			var k = i >= partitions[0].length ? 1 : 0;

			var j = i-partitions[0].length*k;
			
			if (!partitions[k][j]) {
				partitions[k][j] = true;
				i = 0;
				if (tensor.isValidPartition(partitions) == true) {
					validPartitions.push(partitions.map(el => el.slice()))
					// console.log(partitions.map(arr => arr.slice().join(',')).join(','))
				}
			} else {
				partitions[k][j] = false;
				i ++;
			}
		}
		resolve(validPartitions);
	});
}

function displayCurrentPossiblePartition() {
	persistentData.partitions = possiblePartitions[possiblePartitionsIndex];
	updatePartitionTable();
	persistentData.isValidPartition = tensor.isValidPartition(persistentData.partitions);
	shouldSave = true;
}

async function computePossiblePartitions() {
	document.getElementById('loading-wheel').classList.remove("hidden");
	
	possiblePartitions = await bruteForcePartitions();
	possiblePartitionsIndex = 0;
	document.getElementById("partitions-shift-parent").classList.add("hidden")
	if (possiblePartitions.length >= 1) {
		if (possiblePartitions.length > 1)
			document.getElementById("partitions-shift-parent").classList.remove("hidden");
		displayCurrentPossiblePartition();
	}
	document.getElementById('loading-wheel').classList.add("hidden");
}

function resetMapleCodeButton() {
	var button = document.getElementById("generate-maple-code");
	button.innerHTML = "<b>Generate</b> Maple Optimization Code";
	button.onclick = getMapleCode;
}

function getMapleCode() {
	var button = document.getElementById("generate-maple-code");
	var s = tensor.generateMapleCode()

	navigator.clipboard.writeText(s);


	button.innerHTML = "Copied to Clipboard";
	button.onclick = () => {};
	setTimeout(resetMapleCodeButton,1000)

}

function shiftPartitionViewIndex(delta) {
	possiblePartitionsIndex += delta;
	if (possiblePartitionsIndex < 0) possiblePartitionsIndex = possiblePartitions.length-1;
	if (possiblePartitionsIndex >= possiblePartitions.length) possiblePartitionsIndex = 0;

	displayCurrentPossiblePartition();
}

function toggleHardResetPrompt() {
	document.getElementById("hard-reset-modal-parent").classList.toggle("hidden");
}


function exportCanvas2D(annotations, coloring) {
	showAuxillaryMarks = false;
	showAnnotations = annotations;
	showColoring = coloring;
	update(20);
	setTimeout(() => {
		const canvas = document.getElementById('tensor-canvas');
		var image = canvas.toDataURL('image/png');
		var img = document.createElement('img');
		img.src = image;
		// document.getElementById('body').appendChild(img);
		// document.getElementById('body').innerHTML += ('<img src="'+image+'"/>');
		var w = window.open("");
        w.document.write("<title>Generated Image</title>"+img.outerHTML);
		showAuxillaryMarks = true;
		showAnnotations = true;
		showColoring = true;
	},10);
}

// keep track of most recent update to the monomial degeneration solving problem
var lastMDLPUpdate = [0,[]];

function resetMDLPCodeButton() {
	var button = document.getElementById("generate-mdlp-code");
	button.innerHTML = "<b>Generate</b> Monomial Degeneration Linear Programming Code";
	button.onclick = getMDLPCode;

	document.getElementById('mdlp-controls').classList.add("hidden");
	document.getElementById('md-select-indicator').classList.add("hidden");
}

function getMDLPCode() {
	var button = document.getElementById("generate-mdlp-code");
	// console.log(editState.data.locations)
	// console.log(tensor)
	var system = lastMDLPUpdate[1];//tensor.solveMonomialDegeneration(editState.data.locations);
	// console.log(system)
	var s = generateMapleMDLP(system)

	navigator.clipboard.writeText(s);


	button.innerHTML = "Copied to Clipboard";
	button.onclick = () => {};
	setTimeout(resetMDLPCodeButton,1000)


}

function generateMapleMDLP(system) {
	var matrixStr = '';
	console.log(system)

	var [objective,constraints,rhs] = extractMatricesFromLPSystem(system);
	console.log(constraints)
	for (var row of constraints) {
		matrixStr += `[${row}],`;
	}
	
	// codeOutput = `LPSolve(Vector([${system[system.length-1].slice(0,-1)}],datatype=float),[Matrix([${matrixStr.slice(0,-1)}],datatype=float),Vector([${system.slice(0,-1).map(arr => arr[arr.length-1])}],datatype=float)])`
	codeOutput = `with(Optimization);LPSolve(Vector([${objective}],datatype=float),[Matrix([${matrixStr.slice(0,-1)}],datatype=float),Vector([${rhs}],datatype=float)],assume=nonnegative)`

	return codeOutput
}

function extractMatricesFromLPSystem(system) {
	var objective = system[system.length-1].slice(0,-1).map(a => 1);
	var constraints = system.slice(0,-1).map(arr => arr.slice(0,-1).map(a => -a));
	var rhs = system.slice(0,-1).map(arr => -arr[arr.length-1]+(arr[arr.length-1] != 0 ? .000001 : .000001));
	for (var i = 0; i < objective.length; i++) {
		var row = objective.slice().fill(0);
		row[i] = -1;
		constraints.push(row)
		rhs.push(0)
	}
	return [objective,constraints,rhs]
}



// function to call the server to solve monomial degeneration with linear programing
function callMDLP(system) {
	// make a call to the server to get the solution
	document.getElementById('loading-wheel').classList.remove("hidden");
	document.getElementById('mdlp-controls').classList.add("hidden");
	document.getElementById('md-select-indicator').classList.add("hidden");

	var [objective,constraints,rhs] = extractMatricesFromLPSystem(system);

	var lp = numeric.solveLP(objective,
        constraints,
        rhs
       );
	// console.log(lp.solution);
	var solution = lp.solution;

	// add the popup if there is no optimal solution
	if (Number.isNaN(solution)) {
		document.getElementById("no-solution-popup").classList.remove("hidden");
	} else {
		document.getElementById("no-solution-popup").classList.add("hidden");

		solution = numeric.trunc(solution,1e-8);
		var lowest = Infinity;
		// find lowest nonzero solution
		for (var i = 0; i < solution.length; i++) {
			if (solution[i] > 0.005 && lowest > solution[i])
				lowest = solution[i];
		}

		solution = numeric.trunc(solution.map(n => n/lowest),1e-0);
		

		// get the new labels
		var newLabels = solution.map(n => Math.round(n*10)/10);

		
		// split the labels by axes
		persistentData.degenerationLabels[1] = newLabels.slice(tensor.length);
		persistentData.degenerationLabels[0] = newLabels.slice(0,tensor.length);

		resetDegeneration();
		// perform degeneration using those labels
		tensor.doMonomialDegeneration(persistentData.degenerationLabels, true);
	}
	tutorialState.tasks["Solve Degeneration"] = true;

	document.getElementById('loading-wheel').classList.add("hidden");

	// $.post(
	// 	"./get_mdlp",
	// 	{matrix : JSON.stringify(system)},
	// 	// on response
	// 	(data) => {
	// 		// add the popup if there is no optimal solution
	// 		if (data[0] != 'Optimal') {
	// 			document.getElementById("no-solution-popup").classList.remove("hidden");
	// 		} else {
	// 			document.getElementById("no-solution-popup").classList.add("hidden");
	// 		}

	// 		// get the new labels
	// 		var newLabels = data[1];
	// 		// split the labels by axes
	// 		persistentData.degenerationLabels[1] = newLabels.slice(tensor.length);
	// 		persistentData.degenerationLabels[0] = newLabels.slice(0,tensor.length);

	// 		resetDegeneration();
	// 		// perform degeneration using those labels
	// 		tensor.doMonomialDegeneration(persistentData.degenerationLabels, true);
	// 		tutorialState.tasks["Solve Degeneration"] = true;

	// 		document.getElementById('loading-wheel').classList.add("hidden");
	// 	}
	// );
}


var scene = null;
var camera = null;
var controls = null;
var renderer = null;

var objectsToFaceCamera = [];

function init3D(showRemovals = false) {
	objectsToFaceCamera = [];


	document.getElementById("export-3D-button").classList.toggle("hidden");
	document.getElementById("close-3D-button").classList.toggle("hidden");
	scene = new THREE.Scene();
	scene.background = new THREE.Color( 0xffffff );

	const light = new THREE.PointLight(0xffffff, 1)
light.position.set(20, 100, 20)
scene.add(light)

	camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
	camera.position.set( 20, 30, 40 );
	camera.lookAt( 0, 0, 0 );


	renderer = new THREE.WebGLRenderer({
	    preserveDrawingBuffer: true 
	});
	renderer.setSize( window.innerWidth, window.innerHeight );
	renderer.domElement.id = "tensor-canvas-3D";
	document.body.appendChild( renderer.domElement );

	controls = new THREE.OrbitControls( camera, renderer.domElement );
	controls.listenToKeyEvents( window );
	controls.target.set( 0, 0, 0 )

	controls.screenSpacePanning = false;

	controls.minDistance = 100;
	controls.maxDistance = 500;



	// controls.maxPolarAngle = Math.PI / 2;

	//create a blue LineBasicMaterial
	const material = new THREE.LineBasicMaterial( { 
		color: 0x000000,
		linewidth: 10,
	} );	

	var graphSize = 40;

	const points = [];
	points.push( new THREE.Vector3( graphSize, 0, 0 ) );
	points.push( new THREE.Vector3( 0, 0, 0 ) );
	points.push( new THREE.Vector3( 0, graphSize, 0 ) );
	points.push( new THREE.Vector3( 0, 0, 0 ) );
	points.push( new THREE.Vector3( 0, 0, graphSize ) );

	const geometry = new THREE.BufferGeometry().setFromPoints( points );

	const line = new THREE.Line( geometry, material );
	scene.add( line );

	const BOXSIZE = graphSize/tensor.length-.2;

	const cubeGeometry = new THREE.BoxGeometry( BOXSIZE, BOXSIZE, BOXSIZE );
	const cubeMaterial = new THREE.MeshToonMaterial( { color: 0x528ef7, transparent:true, opacity:.8 } );

	function drawGraph(sGeometry, sMaterial, matrix) {
		for (var y = 0; y < matrix.length; y++) {
			for (var x = 0; x < matrix.length; x++) {
				var z = matrix[y][x];

				if (z == -1) continue;

				
				const cube = new THREE.Mesh( sGeometry, sMaterial );
				scene.add(cube);
				var newX = graphSize*x/matrix.length;
				var newY = graphSize*y/matrix.length;
				var newZ = graphSize*matrix[y][x]/matrix.length;
				cube.position.set( newX + BOXSIZE/2, newY + BOXSIZE/2, newZ + BOXSIZE/2);
			}
		}
	}
	var text_materials = [
		new THREE.MeshPhongMaterial( { color: 0x000000, flatShading: true } ), // front
		new THREE.MeshPhongMaterial( { color: 0x000000 } ) // side
	];

	var axisLength = tensor.matrix.length;

	for (var i = 0; i < axisLength; i++) {
		const textGeo = new TextGeometry(i.toString(), {
			font: THREE_FONT,
			size: (axisLength > 6 ? .2+1.8/(0.286*axisLength+1) : 2),
			height: 1,
			curveSegments: 12,
		} );

		for (var axis = 0; axis < 3; axis++) {
			var _textMesh = new THREE.Mesh( textGeo, text_materials );
			var newX = graphSize*i*(axis == 0 ? 1 : 0)/axisLength;
			var newY = graphSize*i*(axis == 1 ? 1 : 0)/axisLength;
			var newZ = graphSize*i*(axis == 2 ? 1 : 0)/axisLength;
			_textMesh.position.set( newX + (axis == 0 ? BOXSIZE/2 : -BOXSIZE/3), newY + (axis == 1 ? BOXSIZE/2 : -BOXSIZE/3), newZ + (axis == 2 ? BOXSIZE/2 : -BOXSIZE/3));
			_textMesh.lookAt( camera.position );
			scene.add(_textMesh);
			objectsToFaceCamera.push(_textMesh);
		}
	}

	drawGraph(cubeGeometry,cubeMaterial,tensor.matrix);
	const removalCubeMaterial = new THREE.MeshToonMaterial( { color: 0x242424, transparent:true, opacity:.4 } );
	if (showRemovals) {
		drawGraph(cubeGeometry,removalCubeMaterial,tensor.removalMatrix);
	}

}

function animate3D(dt) {
	if (controls !== null)
		controls.update(); // only required if controls.enableDamping = true, or if controls.autoRotate = true

	if (renderer !== null && scene !== null && camera !== null)
		render3D();

}

function render3D() {
	for (var o of objectsToFaceCamera) {
		o.lookAt( camera.position );
	}
	renderer.render( scene, camera );
}

function close3D(doExport = false) {
	document.getElementById("export-3D-button").classList.toggle("hidden");
	document.getElementById("close-3D-button").classList.toggle("hidden");
	const canvas = document.getElementById('tensor-canvas-3D');
	if (doExport) {
		var image = canvas.toDataURL('image/png');
		var img = document.createElement('img');
		img.src = image;
		var w = window.open("");
	    w.document.write("<title>Generated Image</title>"+img.outerHTML);
	}
    canvas.remove();
}


function importToggle() {
	document.getElementById("import-choice").classList.toggle("hidden");
}

function toggleImportLibrary() {
	tutorialState.tasks["Import from Library"] = true;
	document.getElementById("import-library-parent").classList.toggle("hidden");
	if (document.getElementById("import-library-parent").classList.contains("hidden"))
		tutorialState.tasks["Import Library Close"] = true;
}

function togglePolyRep() {
	document.getElementById("poly-rep").classList.toggle("hidden");
	tutorialState.tasks[(!document.getElementById("poly-rep").classList.contains("hidden") ? 'Show PolyRep' : 'Hide PolyRep')] = true;
}

function openImportRep() {
	importToggle();
	toggleImportRep();
}

function toggleImportRep() {
	document.getElementById("import-representation-parent").classList.toggle("hidden");
}

function importPolyRep() {
	toggleImportRep();
	var input = document.getElementById("import-representation-parent-text");
	var rep = input.value;
	input.value = "";
	var newMatrix = [];
	var oldMaxDim = 0;
	for (var term of rep.replaceAll(" ",'').split('+')) {
		var coords = [0,0,0];
		var v;
		var currentNum = "";
		for (var char of term) {
			if ('0' <= char && char <= '9') {
				currentNum += char;
			} else if (currentNum.length > 0) {
				coords['xyz'.indexOf(v)] = parseInt(currentNum);
				currentNum = "";
			}
			if (char == 'x' || char == 'y' || char == 'z')
				v = char;
		}
		if (currentNum.length > 0)
			coords['xyz'.indexOf(v)] = parseInt(currentNum);

		// get the maximum dimenension to ensure square matrix
		// add one to make it the length required
		var maxDim = Math.max(...coords)+1;
		if (maxDim > oldMaxDim) {
			for (var row of newMatrix) {
				while (row.length < maxDim)
					row.push(-1);
			}
			while (newMatrix.length < maxDim) {
				newMatrix.push(Array.apply(null, Array(maxDim)).map(() => -1))
			}
			oldMaxDim = maxDim;
		}
		newMatrix[coords[1]][coords[0]] = coords[2];
	}
	tensor = new Tensor(newMatrix.reverse());
	setCanvasDims();
}

function copyPolyRep(el) {
	var polyRep = document.getElementById("poly-rep");
	var polyStr = polyRep.innerHTML.replaceAll("<sub>","_{").replaceAll("</sub> ","} ").replaceAll("</sub>","}*");

	navigator.clipboard.writeText(polyStr.slice(0,polyStr.length-1));


	el.innerHTML = "Copied";
	el.onclick = () => {};
	setTimeout(() => resetCopyPolyRep(el),1000)
}
function resetCopyPolyRep(el) {
	el.innerHTML = "Copy to Clipboard";
	el.onclick = () => copyPolyRep(el);
}


var toggle = document.getElementById("diagonal-toggle");
toggle.onclick = () => {
	if (diagonalViewIndex == -1) {
		tutorialState.tasks["Show MatMult"] = true;
		toggle.innerHTML = "<b>Stop</b> Viewing MatMult";
		diagonalViewIndex = 0;
	} else {
		tutorialState.tasks["Hide MatMult"] = true;
		toggle.innerHTML = "<b>Start</b> Viewing MatMult";
		diagonalViewIndex = -1;
	}
}

function shiftViewIndex(delta) {
	tutorialState.tasks["Use MatMult"] = true;
	toggle.innerHTML = "<b>Stop</b> Viewing MatMult";
	diagonalViewIndex += delta;
	if (diagonalViewIndex < 0) diagonalViewIndex = matMultDiagonals.length-1;
}

function permuteIndices(delta) {
	tutorialState.tasks["Index Permutation"] = true;
	persistentData.indexPermutationsIndex += delta;
	if (persistentData.indexPermutationsIndex > 5) persistentData.indexPermutationsIndex = 0;
	if (persistentData.indexPermutationsIndex < 0) persistentData.indexPermutationsIndex = 5;
	var d = indexPermutations[persistentData.indexPermutationsIndex];
	tensor.changeAxes(d);
	document.getElementById("dimension-label").innerHTML = `${d[0]}&nbsp  ${d[1]}&nbsp   ${d[2]}`
}

Array.from(document.getElementsByClassName("settings-persistent-field")).forEach(el => {
	var fieldName = el.children[0].innerHTML.replaceAll(' ','');
	fieldName = fieldName[0].toLowerCase()+fieldName.slice(1,fieldName.length-1);
	var slider = el.children[1];
	var stepper = el.children[2];
	slider.onchange = () => {
		stepper.value = parseFloat(slider.value);
		persistentData[fieldName] = parseFloat(slider.value);
		shouldSave = true;
	}
	stepper.onchange = () => {
		slider.value = parseFloat(stepper.value);
		persistentData[fieldName] = parseFloat(stepper.value);
		shouldSave = true;
	}
});
function setupSettingField(element, value) {
	element.children[1].value = parseFloat(value);
	element.children[2].value = parseFloat(value);
}

setupSettingField(document.getElementById("settings-diagonal-color-bias"),persistentData.diagonalColorBias);
setupSettingField(document.getElementById("settings-size-color-bias"),persistentData.sizeColorBias);
setupSettingField(document.getElementById("settings-diagonal-opacity-bias"),persistentData.diagonalOpacityBias);
setupSettingField(document.getElementById("settings-size-opacity-bias"),persistentData.sizeOpacityBias);






var mouse = {
	x : 0,
	y : 0,
	col : 0,
	row : 0
}

var editMode = 'SELECTING-SWAPPING';

var editState = {
	type : 'NONE',
	data : {}
};

function setEditMode(newMode, el) {
	if (newMode == 'EDITING-SINGLE')
		tutorialState.tasks["Select Single Edit"] = true;
	else if (newMode == 'EDITING-MULTIPLE')
		tutorialState.tasks["Select Paint"] = true;
	else if (newMode == 'SELECTING-SWAPPING')
		tutorialState.tasks["Select Swap"] = true;
	else if (newMode == 'REMOVAL-ZEROING')
		tutorialState.tasks["Select Zeroing Out"] = true;
	else if (newMode == 'REMOVAL-DEGENERATION')
		tutorialState.tasks["Select Edit Degeneration"] = true;
	else if (newMode == 'REMOVAL-SOLVE-DEGENERATION')
		tutorialState.tasks["Select Solve Degeneration"] = true;


	if (newMode == 'EDITING-MULTIPLE') {
		document.getElementById('painting-controls').classList.add("enabled");
	} else if (editMode == 'EDITING-MULTIPLE') {
		document.getElementById('painting-controls').classList.remove("enabled");
	}
	// if (newMode == 'REMOVAL-SOLVE-DEGENERATION') {
	// 	document.getElementById('mdlp-controls').classList.remove("hidden");
	// }
	if (editMode == 'REMOVAL-SOLVE-DEGENERATION') {
		document.getElementById('mdlp-controls').classList.add("hidden");
		document.getElementById('md-select-indicator').classList.add("hidden");
	}

	if (editMode === 'REMOVAL-SOLVE-DEGENERATION') {
		document.getElementById("no-solution-popup").classList.add("hidden");
	}
	editMode = newMode;
	Array.from(document.getElementById("edit-toolbar").children).forEach(el => el.classList.remove("active"))
	el.classList.add("active");

}


function parseFillExpression(expression, value, variable) {
	expression = expression.replaceAll('s',`${tensor.length}`).replaceAll('^','**');
	var s = 'return ';
	var prev = '';
	for (var i = 0; i < expression.length; i++) {
		if (expression[i] == ' ') {
			s += ' ';
			continue;
		} else if (expression[i] == variable) {
			if (prev >= '0' && prev <= '9')
				prev = `* ${value} `;
			else
				prev = ` ${value} `;
		} else if ((expression[i] >= '0' && expression[i] <= '9') || '+-*/%'.includes(expression[i])) {
			prev = expression[i];
		} else {
			prev = '';
		}
		s += prev;
	}
	var cellValue = parseInt(new Function(s)().toString())
	return (isNaN(cellValue)) ?  -1 : cellValue;
}

function detectSwapHandleOver(isSelectingRow=false,isSelectingColumn=false,insertionMargin=10) {
	var y1 = ind2coord(mouse.row-1,0)[1];
	var y2 = ind2coord(mouse.row,0)[1];
	var x1 = ind2coord(0,mouse.col)[0];
	var x2 = ind2coord(0,mouse.col+1)[0];

	var insertionHitboxSizeLeft = (editState.data.selection && editState.data.selection.length > 1) ? 0 : insertionMargin;
	var insertionHitboxSizeRight = (editState.data.selection && editState.data.selection.length > 1) ? squareSize : insertionMargin;

	if (mouse.x > border_x-squareSize && mouse.x < border_x && mouse.y < height-border_y && mouse.y > border_y) {
		return {type : 'row', ind : mouse.row, between : (isSelectingRow ?
						((mouse.y < y1+insertionHitboxSizeRight && mouse.y > y1-insertionHitboxSizeLeft) ? 
							(mouse.row-1) 
							: ((mouse.y < y2+insertionHitboxSizeRight && mouse.y > y2-insertionHitboxSizeLeft) ? 
								(mouse.row)
								: false))
						: false)}
	}
	if (mouse.y < height-border_y+squareSize && mouse.y > height-border_y && mouse.x < width-border_x && mouse.x > border_x) {
		return {type : 'col', ind : mouse.col, between : (isSelectingColumn ? 
						((mouse.x < x1+insertionHitboxSizeLeft && mouse.x > x1-insertionHitboxSizeRight) ? 
							(mouse.col) 
							: ((mouse.x < x2+insertionHitboxSizeLeft && mouse.x > x2-insertionHitboxSizeRight) ? 
								(mouse.col+1)
								: false))
						: false)}
	}
	if (mouse.y < height-border_y && mouse.y > border_y && mouse.x < width-border_x && mouse.x > border_x) {
		return {type : 'spot', ind : {r : mouse.row, c : mouse.col}, between : (isSelectingRow ?
			(((mouse.y < y1+insertionHitboxSizeRight && mouse.y > y1-insertionHitboxSizeLeft) ? 
				(mouse.row-1) 
				: ((mouse.y < y2+insertionHitboxSizeRight && mouse.y > y2-insertionHitboxSizeLeft) ? 
					(mouse.row)
					: false))) :
			((isSelectingColumn ? 
				((mouse.x < x1+insertionHitboxSizeLeft && mouse.x > x1-insertionHitboxSizeRight) ? 
					(mouse.col) 
					: ((mouse.x < x2+insertionHitboxSizeLeft && mouse.x > x2-insertionHitboxSizeRight) ? 
						(mouse.col+1)
						: false))
				: false)))

		}
	}
	return {type : undefined, ind : -1, between : false}
}


window.addEventListener('mousemove', e => {
	var xDelta = (e.offsetX-mouse.x)/squareSize;
	var yDelta = (e.offsetY-mouse.y)/squareSize;
	var moveDistance = Math.sqrt(Math.pow(xDelta,2)+Math.pow(yDelta,2));

	var transform = ctx.getTransform();
  	const invMat = transform.invertSelf();

  	if (e.target.id == 'tensor-canvas' || e.target.id == 'body') {
		mouse.x = e.offsetX * invMat.a + e.offsetY * invMat.c + invMat.e;
		mouse.y = e.offsetX * invMat.b + e.offsetY * invMat.d + invMat.f;
	} else {
		mouse.x = 0;
		mouse.y = 0;
	}
	var partitionDetectionBorderMargin = squareSize/8;
	var [partitionIsOverRow,partitionIsOverColumn] = computeIfOverLines(partitionDetectionBorderMargin);

	var {type, ind, between} = detectSwapHandleOver(editState.data.type == 'row',editState.data.type == 'col');
	// change cursor depending on state
	if (editState.type === "SWAPPING") {
		document.body.style.cursor = "grabbing";
	} else if (editMode == 'PARTITION' && partitionIsOverRow && partitionIsOverColumn) {
		document.body.style.cursor = "alias";
	} else if ((type === "row" || type === "col") && editMode == 'SELECTING-SWAPPING')
		document.body.style.cursor = "grab";
	else if (type === "spot" && editMode == 'EDITING-SINGLE')
		document.body.style.cursor = "cell";
	else if ((type === "row" || type === "col") && editMode == 'REMOVAL-DEGENERATION')
		document.body.style.cursor = "cell";
	else if (editMode == 'VIEWING-PAN') {
		document.body.style.cursor = "grab";
	} else if (editMode == 'VIEWING-ZOOM-IN') {
		document.body.style.cursor = "zoom-in";
	} else if (editMode == 'VIEWING-ZOOM-OUT') {
		document.body.style.cursor = "zoom-out";
	} else {
		document.body.style.cursor = "auto";
	}

	if (editMode == 'SELECTING-SWAPPING') {
		if (between !== false) {
			document.body.style.cursor = "pointer";
			editState.data.insertion = between;
		} else {
			editState.data.insertion = undefined;
		}
	} else if (editMode === 'EDITING-MULTIPLE') {
		if (editState.type === 'PAINTING') {
			if (type === "spot") {
				const addToPath = (newPos) => {
					for (var i = 0; i < editState.data.path.length-2; i++) {
						var pos = editState.data.path[i];
						if (pos[0] == newPos.r && pos[1] == newPos.c) {
							editState.data.skipOver = true;
							return
						}
					}

					var x1 = border_x + squareSize*newPos.c;
					var y1 = border_y + squareSize*(tensor.length-1-newPos.r);
					var x2 = x1+squareSize;
					var y2 = y1+squareSize;

					if (mouse.x < x1+squareSize/6 || mouse.x > x2-squareSize/6 || mouse.y < y1+squareSize/6 || mouse.y > y2-squareSize/6)
						return

					var last = editState.data.path[editState.data.path.length-1];
					var secondLast = (editState.data.path.length > 1) ? editState.data.path[editState.data.path.length-2] : [-1,-1]; 
					if (secondLast[0] == newPos.r && secondLast[1] == newPos.c) {
						editState.data.path.pop();
					}

					else if (last[0] != newPos.r || last[1] != newPos.c) {
						//try to interpolate
						var prevPos = editState.data.path[editState.data.path.length-1];


						var cX = newPos.c-prevPos[1];
						var cY = newPos.r-prevPos[0];

						// interpolate if there is a jump
						if (Math.abs(cX) >= 2 || Math.abs(cY) >= 2) {
							var distOver = Math.abs(cX)-1;
							var distUp = Math.abs(cY)-1;

							// calculate if largest dimension is x or y
							var largestDimension = distOver > distUp ? 'x' : 'y';
							var maxDimension;
							var xDelta;
							var yDelta;
							// set up deltas in terms of largest dimension, so we only have to iterate in that dimension 
							if (largestDimension == 'x') {
								maxDimension = distOver;
								xDelta = Math.sign(cX);
								yDelta = distUp*Math.sign(cY)/distOver;
							} else {
								maxDimension = distUp;
								xDelta = distOver*Math.sign(cX)/distUp;
								yDelta = Math.sign(cY);
							}

							// iterate over largest dimension
							for (var i = 0; i < maxDimension; i++) {
								var px = prevPos[1]+Math.sign(cX)+Math.floor(xDelta*i);
								var py = prevPos[0]+Math.sign(cY)+Math.floor(yDelta*i);

								// add each interpolated position to path
								editState.data.path.push([py, px]);
							}
						}
						editState.data.path.push([newPos.r, newPos.c]);
					}
					editState.data.skipOver = false;
					
				}

				addToPath(ind);

				document.getElementById("painting-length").innerHTML = editState.data.path.length;
			}
		}
	}

	// for panning
	if (editState.type == 'PANNING' && canvasData.scale > 1) {
		document.body.style.cursor = "grabbing";
		var panSpeed = 2;
		canvasData.x -= panSpeed*(mouse.x-editState.data.x);
		editState.data.x = mouse.x;
		canvasData.y -= panSpeed*(mouse.y-editState.data.y);
		editState.data.y =  mouse.y;
		tutorialState.tasks["Pan Around"] = true;
	}
});


var heldKeys = {}

window.addEventListener('keydown', e => {
	// console.log(e.key,(e.key === 'Z' || e.key === 'z'), (tensorHistory.length - tensorHistoryIndex > 2))
	if (editState.type == 'EDITING' && editState.data.row < tensor.length && editState.data.col < tensor.length) {
		var n = tensor.matrix[editState.data.row][editState.data.col].toString();
		if (e.key == 'Backspace') {
			if (n.length === 1 || n === '-1') {
				n = '-1';
				tutorialState.tasks['Clear Cell'] = true;
			}
			else
				n = n.slice(0,n.length-1);
		} else if (48 <= e.keyCode && e.keyCode <= 57) {
			if (n === '-1' || !editState.data.hasClicked)
				n = e.key;
			else
				n += e.key;

			// tell the tutorial that the edit cell action has been completed
			tutorialState.tasks['Edit Cell'] = true;
		}
		editState.data.hasClicked = true;
		tensor.matrix[editState.data.row][editState.data.col] = parseInt(n);
	} else if (editState.type == 'EDITING-DEGENERATION' && editState.data.ind < tensor.length) {
		var n;
		var labels = persistentData.degenerationLabels[editState.data.type === "row" ? 1 : 0];
		var index = (editState.data.type === "row") ? editState.data.ind : editState.data.ind;
		if (index >= labels.length) {
			for (var i = 0; i <= index; i++) {
				labels.push(0);
			}
		}
		n = labels[index].toString();

		if (e.key === 'Backspace') {
			if (n.length === 1)
				n = '0';
			else if (n.length === 2 && n[0] === '-')
				n = '-';
			else
				n = n.slice(0,n.length-1);
		} else if (48 <= e.keyCode && e.keyCode <= 57) {
			n += e.key; // 0 is accounted for by parseInt stripping leading zeroes
		} else if (e.key === '-' && n === '0') {
			n = e.key;
		}
		tutorialState.tasks["Edit Degeneration"] = true;

		if (n === '-')
			labels[index] = n;
		else
			labels[index] = parseInt(n);


		resetDegeneration();

		tensor.doMonomialDegeneration(persistentData.degenerationLabels, true);

	}

	var updateMatrix = () => {
		var prevLength = tensor.length;
		var matrices = tensorHistory[tensorHistory.length-1-tensorHistoryIndex];
		tensor.matrix = matrices.matrix.map(arr => arr.slice());
		tensor.removalMatrix = matrices.removalMatrix;
		tensor.kroneckerLabels = matrices.kroneckerLabels;
		if (prevLength != tensor.length)
			setCanvasDims() // need to recalculate the grid size if we are changing dimensions
		computeMatMultDiagonals();
	}

	if ((e.key === 'Z' || e.key === 'z') && (tensorHistory.length - tensorHistoryIndex > 2)) {
		tensorHistoryIndex = Math.min(tensorHistoryIndex+1, tensorHistory.length-1);
		updateMatrix()
		tutorialState.tasks["Undo"] = true;
	}
	if ((e.key === 'X' || e.key === 'x') && tensorHistoryIndex > 0) {
		tensorHistoryIndex = Math.max(tensorHistoryIndex-1, 0);
		updateMatrix()
		tutorialState.tasks["Redo"] = true;
	}

	heldKeys[e.keyCode] = true;
});
window.addEventListener('keyup', e => {
	heldKeys[e.keyCode] = false;
});
window.addEventListener("contextmenu", e => e.preventDefault());
window.addEventListener('mousedown', e => {

	var partitionDetectionBorderMargin = squareSize/8;
	var [partitionIsOverRow,partitionIsOverColumn] = computeIfOverLines(partitionDetectionBorderMargin);
	

	// get if the click is on a row or column index, or on a cell spot, the index, and in the case of partitions, if it is on a line.
	var {type, ind, between} = detectSwapHandleOver(partitionIsOverColumn,partitionIsOverRow,partitionDetectionBorderMargin);


	switch (editMode) {
		case 'SELECTING-SWAPPING':
			if (type === 'row' || type === 'col') {
				if (editState.type !== 'SWAPPING')
					editState = {
						type : 'SWAPPING',
						data : {
							type : type, 
							ind : ind,
							selection : [ind]
						}
					};
				else {
					editState.data.type = type;
				}

					

				if (heldKeys[16]) { // shift
					if (editState.data.selection.includes(ind)) {
						editState.data.selection = [ind];
					} else {
						var i1 = editState.data.selection[editState.data.selection.length-1];
						var i2 = ind;
						var delta = (i1 > i2) ? -1 : 1;
						i2 += delta;
						for (var i = i1; (i1 < i2) ? (i < i2) : (i > i2); i += delta) {
							if (!editState.data.selection.includes(i))
								editState.data.selection.push(i);
						}
					}
					
				}
				editState.data.ind = Math.max(...editState.data.selection);	
			}
			break;
		case 'EDITING-SINGLE':
			if (type === undefined) {
				editState = {
					type : 'NONE',
					data : {}
				};
			}
			if (type === 'spot') {
				editState = {
					type : 'EDITING',
					data : {
						row : ind.r,
						col : ind.c,
						hasClicked : false
					}
				};
			}
			break;
		case 'EDITING-MULTIPLE':
			if (type === 'spot') {
				editState = {
					type : 'PAINTING',
					data : {
						path : [[ind.r, ind.c]],
						skipOver : false
					}
				};
			}
			break;
		case 'REMOVAL-ZEROING':
			if (type) {
				var index;
				if (type == 'spot'){
					index = tensor.matrix[ind.r][ind.c];
					if (index === -1) {
						index = tensor.removalMatrix[ind.r][ind.c];
						if (index === -1)
							return;
					}
				} else
					index = ind;

				tutorialState.tasks["Zero Out"] = true;

				var axis = (type === 'col' ? 0 : (type === 'row' ? 1 : 2));
				if (persistentData.zeroingRemovals[axis][index]) {
					tensor.undoZeroing(type,index);
					persistentData.zeroingRemovals[axis][index] = false;
				} else {
					persistentData.zeroingRemovals[axis][index] = true;
					tensor.doZeroing(type,index);
				}
			}

			break;
		case 'REMOVAL-DEGENERATION':
			if (type === undefined) {
				editState = {
					type : 'NONE',
					data : {}
				};
			}
			if (type === 'row' || type == 'col') {
				editState = {
					type : 'EDITING-DEGENERATION',
					data : {
						type : type,
						ind : ind
					}
				};
			}
			break;
		case 'REMOVAL-SOLVE-DEGENERATION':
			if (type === 'spot') {
				if (editState.type !== 'SOLVE-DEGENERATION')
					editState = {
						type : 'SOLVE-DEGENERATION',
						data : {
							locations : []
						}
					};
				if (tensor.matrix[ind.r][ind.c] === -1 && tensor.removalMatrix[ind.r][ind.c] === -1)
					break;


				for (var i = 0; i < editState.data.locations.length; i++) {
					var pos = editState.data.locations[i];
					if (pos.r == ind.r && pos.c == ind.c)
						break;
				}

				if (i == editState.data.locations.length) // if the location is not in list, add it
					editState.data.locations.push({r : ind.r, c : ind.c});
				else { // else, remove location
					editState.data.locations.splice(i,1);
					if (editState.data.locations.length == 0) { // if there's nothing in the list, we don't need to compute
						// set all labels to 0
						persistentData.degenerationLabels[1] = Array(tensor.length).fill(0);
						persistentData.degenerationLabels[0] = Array(tensor.length).fill(0);

						resetDegeneration();
						// perform degeneration using those labels
						tensor.doMonomialDegeneration(persistentData.degenerationLabels, true);
						break;
					}
				}


				for (var {r,c} of persistentData.degenerationSpots) {
					if (r >= tensor.length || c >= tensor.length ||
					 tensor.removalMatrix[r][c] == -1 || 
					 persistentData.zeroingRemovals[0][c] || 
					 persistentData.zeroingRemovals[1][r] || 
					 persistentData.zeroingRemovals[2][tensor.removalMatrix[r][c]]) continue;

					tensor.matrix[r][c] = tensor.removalMatrix[r][c];
					tensor.removalMatrix[r][c] = -1;
				}
				persistentData.degenerationSpots = [];

				// get the system of equations in matrix form
				var system = tensor.solveMonomialDegeneration(editState.data.locations);
				// console.log(system,editState.data.locations)
				lastMDLPUpdate = [Date.now(),system];
				if (tensor.matrix.length > 20)
					document.getElementById('md-select-indicator').classList.remove("hidden");
				else
					document.getElementById('loading-wheel').classList.remove("hidden");
				setTimeout(() => {
					if (Date.now()-lastMDLPUpdate[0] >= 500) {
						if (tensor.matrix.length > 20) {
							document.getElementById('mdlp-controls').classList.remove("hidden");
						} else
							callMDLP(lastMDLPUpdate[1]);
					}
				},500);

			}
			break;
		case 'VIEWING-ZOOM-IN':
			// if not clicking on canvas, don't zoom
			if (e.target.id !== 'tensor-canvas' && e.target.id !== 'body') break;

			if (canvasData.scale < 4) {
				tutorialState.tasks["Zoom In"] = true;
				// compute the new position based on current viewframe
				canvasData.x += mouse.x;
				canvasData.y += mouse.y;
				canvasData.scale++;
			}
			break;

		case 'VIEWING-PAN':
			// if not clicking on canvas, don't pan
			if (e.target.id !== 'tensor-canvas' && e.target.id !== 'body') break;

			editState = {
				type : 'PANNING',
				data : {
					x : mouse.x,
					y : mouse.y,
				}
			};
			break;
		case 'VIEWING-ZOOM-OUT':
			// if not clicking on canvas, don't zoom
			if (e.target.id !== 'tensor-canvas' && e.target.id !== 'body') break;


			if (canvasData.scale > 1) {
				tutorialState.tasks["Zoom Out"] = true;
				canvasData.x -= mouse.x;
				canvasData.y -= mouse.y;
				canvasData.scale--;
			} 
			if (canvasData.scale == 1) {
				canvasData.x = 0;
				canvasData.y = 0;
			}
			break;
		case 'PARTITION':
			if (mouse.x < border_x || mouse.x > border_x+matrixSize || mouse.y < border_y || mouse.y > border_y+matrixSize)
				break;
			// should never be 2
			var partitionAxis = partitionIsOverColumn ? 0 : (partitionIsOverRow ? 1 : 2)
			if (between !== false) {
				// between-partitionAxis to account for off by one on y-axis for between
				persistentData.partitions[partitionAxis][between-partitionAxis] = !persistentData['partitions'][partitionAxis][between-partitionAxis];

				updatePartitionTable();
				persistentData.isValidPartition = tensor.isValidPartition(persistentData.partitions);
				shouldSave = true;
			} else if (e.button === 2) {
				e.preventDefault();
				// going into a partitioned section

				if (!persistentData.partitions.some(arr => arr.some(x => x)))
					break;


				// set up default partition bounds and necessary getters and setters
				var xPartitionStart = 0;
				var setXPartitionStart = (x) => {xPartitionStart = x;}
				var xPartitionEnd = tensor.length-1;
				var setXPartitionEnd = (x) => xPartitionEnd = x;
				var getXPartitionEnd = () => xPartitionEnd;

				var yPartitionStart = 0;
				var setYPartitionStart = (y) => yPartitionStart = y;
				var yPartitionEnd = tensor.length-1;
				var setYPartitionEnd = (y) => yPartitionEnd = y;
				var getYPartitionEnd = () => yPartitionEnd;
					
				// check the partition bounds in a loop on a particular axis
				const checkPartition = (axis, i, mouseIndex, startSetter, endSetter, endGetter, indexIncrementer) => {
					// find the lower bound
					if (i < mouseIndex) {
					 	if (persistentData.partitions[axis][i]) {
					 		indexIncrementer();
							startSetter(i+1);
					 	}
					// find the upper bound
					} else {
						// find the upper bound if you don't already have it
						if (i < endGetter() && persistentData.partitions[axis][i]) {
							endSetter(i);
						}
					}
				}

				var partitionMatrixRow = 0;
				var incrementRowIndex = () => partitionMatrixRow++;
				var partitionMatrixColumn = 0;
				var incrementColumnIndex = () => partitionMatrixColumn++;

				for (var i = 0; i < tensor.length; i++) {
					checkPartition(1, i, mouse.col, setXPartitionStart, setXPartitionEnd, getXPartitionEnd, incrementColumnIndex)
					checkPartition(0, i, mouse.row, setYPartitionStart, setYPartitionEnd, getYPartitionEnd, incrementRowIndex)
				}
				// console.log(xPartitionStart,yPartitionStart,xPartitionEnd,yPartitionEnd)
				// console.log(partitionMatrixColumn,partitionMatrixRow)
				var newSize = Math.max(yPartitionEnd-yPartitionStart+1,xPartitionEnd-xPartitionStart+1);
				for (var x = xPartitionStart; x <= xPartitionEnd; x++) {
					for (var y = yPartitionStart; y <= yPartitionEnd; y++) {
						// console.log(tensor.matrix[y][x]+1)
						newSize = Math.max(newSize,tensor.matrix[y][x]+1);
					}
				}
				

				var newMatrix = tensor.matrix.filter((row,r) => r < newSize).map((row,r) => row.filter((spot,c) => c < newSize).map((spot,c) => (r < yPartitionEnd-yPartitionStart+1 && c < xPartitionEnd-xPartitionStart+1) ? tensor.matrix[r+yPartitionStart][c+xPartitionStart] : -1))

				var newRemovalMatrix = tensor.removalMatrix.filter((row,r) => r < newSize).map((row,r) => row.filter((spot,c) => c < newSize).map((spot,c) => (r < yPartitionEnd-yPartitionStart+1 && c < xPartitionEnd-xPartitionStart+1) ? tensor.removalMatrix[r+yPartitionStart][c+xPartitionStart] : -1))


				persistentData.partitionZoomStack.push([persistentData.indexPermutationsIndex,[partitionMatrixRow,partitionMatrixColumn],tensor.matrix,tensor.removalMatrix,persistentData.partitions.map(arr => arr.slice()),persistentData.partitionValues.map(arr => arr.slice()),persistentData.partitionTotalValue])
				
				// reset index permutations
				persistentData.indexPermutationsIndex = 0
				var d = indexPermutations[persistentData.indexPermutationsIndex];
				document.getElementById("dimension-label").innerHTML = `${d[0]}&nbsp  ${d[1]}&nbsp   ${d[2]}`
				
				tensor.matrix = newMatrix;
				tensor.removalMatrix = newRemovalMatrix;
				persistentData.partitions = [[],[],[]]

				persistentData.partitionTotalValue = persistentData.partitionValues[partitionMatrixRow][partitionMatrixColumn];
				if (persistentData.partitionTotalValue == undefined)
					persistentData.partitionTotalValue = ''
				persistentData.partitionValues = [[]];
				setCanvasDims();
			}
			break; 
		case 'ZOOM-OUT-PARTITION':
			if (persistentData.partitionZoomStack.length < 1 || mouse.x < border_x || mouse.x > border_x+matrixSize || mouse.y < border_y || mouse.y > border_y+matrixSize)
				break;
			
			[indexPermutationsIndex,indices, oldMat, oldRemovalMatrix, oldPartitions, oldPartitionValues, oldPartitionTotalValue] = persistentData.partitionZoomStack.pop();
			
			// set index permutations back
			persistentData.indexPermutationsIndex = indexPermutationsIndex
			var d = indexPermutations[persistentData.indexPermutationsIndex];
			document.getElementById("dimension-label").innerHTML = `${d[0]}&nbsp  ${d[1]}&nbsp   ${d[2]}`

			tensor.matrix = oldMat;
			tensor.removalMatrix = oldRemovalMatrix;
			persistentData.partitions = oldPartitions;
			persistentData.partitionValues = oldPartitionValues;
			if (persistentData.partitionTotalValue !== "") {
				// console.log(indices,persistentData.partitionTotalValue)
				persistentData.partitionValues[indices[0]][indices[1]] = persistentData.partitionTotalValue;
			}
			persistentData.partitionTotalValue = oldPartitionTotalValue;
			setCanvasDims();
			break;
		default: break;
	}
});
window.addEventListener('mouseup', e => {
	switch (editState.type) {
		case 'SWAPPING':
			var ind = -9;
			if (editState.data.type == 'row' && mouse.y < height-border_y && mouse.y > border_y) {
				ind = mouse.row;
			}
			if (editState.data.type == 'col' &&  mouse.x < width-border_x && mouse.x > border_x) {
				ind = mouse.col;
			}




			if (heldKeys[16])// and not holding down shift
				return;

			if (ind == -9 && mouse.y > height-border_y)
				ind = -1;

			if (ind !== -9) {
				switch (editState.data.type) {
					case "row":
						if (editState.data.selection.length == 1) {
							if (editState.data.insertion !== undefined) {
								tensor.reinsertRow(editState.data.ind,editState.data.insertion);
							} else {
								tensor.swapRows(editState.data.ind,ind);
							}
							tutorialState.tasks["Do Swap"] = true;
						} else {
							tensor.reinsertRows(ind,editState.data.selection);
							tutorialState.tasks["Do Multiple Swap"] = true;
						}
					break;
					case "col":
						if (editState.data.selection.length == 1) {
							if (editState.data.insertion !== undefined) {
								tensor.reinsertColumn(editState.data.ind,editState.data.insertion);
							} else {
								tensor.swapColumns(editState.data.ind,ind);
							}
							tutorialState.tasks["Do Swap"] = true;
						} else {
							tensor.reinsertColumns(ind,editState.data.selection);
							tutorialState.tasks["Do Multiple Swap"] = true;
						}
					break;
					default: break;
				}
			}
			document.body.style.cursor = "grab";

			editState = {
				type : 'NONE',
				data : {}
			};
			break;
		case 'PAINTING': 
			var increment = document.getElementById("painting-start").value;
			for (var pos of editState.data.path) {
				var r = pos[0];
				var c = pos[1];

				tensor.matrix[r][c] = Math.floor(parseFillExpression(document.getElementById("painting-expression").value,increment,'i'));
				increment++;
			}
			document.getElementById("painting-length").innerHTML = 'n';

			editState = {
				type : 'NONE',
				data : {}
			};
			break;
		case 'PANNING': 
			editState = {
				type : 'NONE',
				data : {}
			};
			break;
		default:
			break;
	}
});

function updateKroneckerToggle() {
	if (tensor.kroneckerLabels && tensor.kroneckerLabels.length > 0) {
		document.getElementById("kronecker-labels-button").classList.remove("hidden")
	} else {
		document.getElementById("kronecker-labels-button").classList.add("hidden")
	}
}

function displayKroneckerError() {
	document.getElementById("kronecker-error").classList.remove('hidden');
	setTimeout(() => {
		document.getElementById("kronecker-error").classList.add('hidden');
	},1000);
}