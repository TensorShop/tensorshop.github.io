/*<div class="tensor-choice">
		<span class="tensor-name">Coppersmith-Winograd</span>
	</div>*/



var localLibrary = localStorage.getItem("mm_tensorlibrary");

if (localLibrary == null || localLibrary == '[object Object]')
	localLibrary = [];
else
	localLibrary = JSON.parse(localLibrary);


var tensors = [{
	"name" : "Blank Tensor Generator",
	"params" : [
		{"name" : "N", "type" : "int", "default" : 3, "min" : 1, "max" : 100}
	],
	"matrixGenerator" : (n) => {
		var newN = parseInt(n + ""); // idk


		var matrix = generateEmptyMatrix(newN,newN);
		return matrix;
	}
},{
	"name" : "Cyclic Group Generator",
	"params" : [
		{"name" : "Operation", "type" : "selection", "default" : "Addition", "options" : ["Addition", "Multiplication"]},
		{"name" : "N", "type" : "int", "default" : 3, "min" : 1, "max" : 20}
	],
	"matrixGenerator" : (operation, n) => {
		tutorialState.tasks["Import Cyclic"] = true;
		var op_func;
		switch (operation) {
			case "Addition": op_func = (a,b) => a + b; break;
			case "Multiplication": op_func = (a,b) => a * b; break;
			default: op_func = (a,b) => NaN; break;
		}

		// this is the only thing that worked, I have no good reason as to why
		// my best guess is some weird stuff is happening with the integer references in the function scope
		var newN = parseInt(n + ""); 


		var matrix = generateEmptyMatrix(newN,newN);
		for (var r = 0; r < n; r++) {
			for (var c = 0; c < n; c++) {
				matrix[r][c] = op_func(r,c) % n;
			}
		}
		return matrix;
	}
}, {
	"name" : "Coppersmith-Winograd Generator",
	"params" : [
		{"name" : "q", "type" : "int", "default" : 5, "min" : 1, "max" : 50}
	],
	"matrixGenerator" : (q) => {
		var n = parseInt(q + "")+1;
		var matrix = generateEmptyMatrix(n+1,n+1);
		for (var r = 0; r <= n; r++) {
			for (var c = 0; c <= n; c++) {
				var v = -1;
				if (r == 0 || c == 0) {
					var sum = r+c;
					v = sum == 0 ? n : (sum == n ? 0 : sum);
				}
				else if (r == c && r < n) {
					v = 0;
				}
				matrix[r][c] = v;
			}
		}
		return matrix;
	}
}, {
	"name" : "Matrix Multiplication Generator",
	"params" : [
		{"name" : "n", "type" : "int", "default" : 2, "min" : 1, "max" : 20},
		{"name" : "m", "type" : "int", "default" : 3, "min" : 1, "max" : 20},
		{"name" : "p", "type" : "int", "default" : 2, "min" : 1, "max" : 20}
	],
	"matrixGenerator" : (n,m,p) => {
		var diagonalLength = Math.max(n*m,p*m);
		var size = Math.max(diagonalLength,n*p);

		var matrix = generateEmptyMatrix(size,size);
		for (var r = 0; r < diagonalLength; r++) {
			for (var c = 0; c < diagonalLength; c++) {
				var v = -1;
				if (Math.floor(c/n) == Math.floor(r/p))
					v = c%n + r%p*n;
				
				matrix[r][c] = v;
			}
		}
		return matrix;
	}
}, {
	"name" : "Coppersmith-Winograd 5",
	"matrix" : [
		[ 0,-1,-1,-1,-1,-1,-1],
		[ 5,-1,-1,-1,-1, 0,-1],
		[ 4,-1,-1,-1, 0,-1,-1],
		[ 3,-1,-1, 0,-1,-1,-1],
		[ 2,-1, 0,-1,-1,-1,-1],
		[ 1, 0,-1,-1,-1,-1,-1],
		[ 6, 1, 2, 3, 4, 5, 0]
	]
}, {
	"name" : "Add Mod 3",
	"matrix" : [
		[ 2, 0, 1],
		[ 1, 2, 0],
		[ 0, 1, 2]
	]
}, {
	"name" : "Test Diagonal",
	"matrix" : [
	[-1,-1, 0],
	[-1, 0,-1],
	[ 0, -1,-1]
	]
},]
tensors.push(...localLibrary.map(obj => {
	obj.matrix = obj.matrix.reverse(); return obj
}));

function addToLibrary(name,T) {
	tutorialState.tasks["Add to Library"] = true;
	var obj = {
		"name" : name == "" ? "Untitled Tensor" : name,
		"userAdded" : true,
		"matrix" : T.matrix.reverse()
	};
	tensors.push(obj);
	addTensorToLibrary(obj,tensors.length-1);
	localLibrary.push(obj);
	localStorage.setItem("mm_tensorlibrary",JSON.stringify(localLibrary));
}







var doingKroneckerSelection = false;


const library = document.getElementById("import-library");

var builderParams = tensors.map(data => (data.matrix === undefined) ? data.params.map(p => p.default) : null);

function addTensorToLibrary(tensorEl,index) {
	var choiceDiv = document.createElement("button");
	choiceDiv.className="tensor-choice"+(tensorEl.userAdded ? ' user-added' : '');

	if (tensorEl.userAdded) {
		var closeButton = document.createElement("button");
		closeButton.className = 'tensor-choice-user-close';
		closeButton.innerHTML = '&times';
		closeButton.onclick = (e) => {
			e.preventDefault();
			choiceDiv.remove();
			for (var i = 0; i < localLibrary.length; i++) {
				var o = localLibrary[i];
				if (o.name == tensorEl.name && deepArrEquals(o.matrix, tensorEl.matrix)) {
					localLibrary.splice(i,1);
					localStorage.setItem("mm_tensorlibrary",JSON.stringify(localLibrary));
					break;
				}
			}
		}
		tensorEl.closeButton = closeButton;
		choiceDiv.appendChild(closeButton);
	}

	var getNewTensor = event => {
		var matrix = tensorEl.matrix !== undefined ? tensorEl.matrix.map(arr=> arr.slice()) : tensorEl.matrixGenerator(...builderParams[index]);
		return new Tensor(matrix.reverse());
	}
	var replaceMatrix = event => {
		tensor = getNewTensor();
		toggleImportLibrary();
		setCanvasDims();
		persistentData.partitionZoomStack = [];
	}


	var title = document.createElement("span");
	title.className="tensor-name";
	title.innerHTML = tensorEl.name;

	choiceDiv.appendChild(title);

	if (tensorEl.matrix !== undefined) { // if it is not a builder
		choiceDiv.onclick = (event) => {
			if (doingKroneckerSelection) {
				doingKroneckerSelection = false;

				tensor = new Tensor(tensor.doSimpleKroneckerProduct(getNewTensor(event)));
				toggleImportLibrary();
				setCanvasDims();
				persistentData.partitionZoomStack = [];
			} else {
				if (!event.target.classList.contains("tensor-choice-user-close")) {
					replaceMatrix(event);
					updateKroneckerToggle()
				}
			}
		};

		var matrixDiv = document.createElement("div");
		matrixDiv.className="tensor-choice-matrix";


		var T = new Tensor(tensorEl.matrix);

		matrixDiv.style = `grid-template-columns: repeat(${T.length}, 1fr);`

		var colors = tensorEl.matrix.map(arr => arr.map(el => {return {color : null, opacity : 0}}));

		var mmDiagonals = T.computeDiagonals();

		// console.log(Ts,mmDiagonals);

		for (var j in mmDiagonals) {
			var diagonal = mmDiagonals[j];

			var percentSize = (diagonal.width*diagonal.height)/T.length/T.length;
			var hsv = computeSpotColor(percentSize, diagonal, T);

			ctx.fillStyle = rgb2hex(hsv2rgb(hsv));

			// ctx.fillStyle = rgb2hex(hsv2rgb([160-Math.floor(160*Math.pow((diagonal.len-1)/(tensor.length-1),.3)),1,.8]));
			// console.log(tensor.length,percentSize,diagonalOpacityBias,sizeOpacityBias)
			var alpha = 0.5 * Math.pow((diagonal.len-1)/(T.length-1),persistentData.diagonalOpacityBias);
			alpha += 0.5 * percentSize * persistentData.sizeOpacityBias;
			// console.log(diagonal,percentSize,alpha)


			for (var i = 0; i < diagonal.len; i++) {
				var y1 = diagonal.start[0]+diagonal.height*i;
				var x1 = diagonal.start[1]+diagonal.width*i;
				var y2 = diagonal.start[2]+diagonal.height*i;
				var x2 = diagonal.start[3]+diagonal.width*i;
				// console.log(y1,x1,y2,x2);
				for (var r = y1; r <= y2; r++) {
					for (var c = x1; c <= x2; c++) {
						// console.log(T.length,colors.length,r,c);
						if (colors[r][c].color == null) {
							colors[r][c].color = hsv;
							colors[r][c].opacity = alpha;
						} else {
							var oldOpacity = colors[r][c].opacity;
							var sum = alpha+oldOpacity;
							colors[r][c].color = [(hsv[0]*alpha+colors[r][c].color[0]*oldOpacity)/sum,(hsv[1]*alpha+colors[r][c].color[1]*oldOpacity)/sum,(hsv[2]*alpha+colors[r][c].color[2]*oldOpacity)/sum];
							colors[r][c].opacity = 1 - (1-oldOpacity)*(alpha);
						}
					}
				}
			}
		}


		for (var r = 0; r < tensorEl.matrix.length; r ++) {
			for (var c = 0; c < tensorEl.matrix[r].length; c ++) {
				var z = tensorEl.matrix[tensorEl.matrix.length-1-r][c];


				var spot = document.createElement('div');
				spot.className = "tensor-choice-matrix-spot";
				var col = colors[colors.length-1-r][c].color;
				var rgb = hsv2rgb(col == null ? [0,0,1] : col);
				var opacity = 1; //colors[colors.length-1-r][c].opacity;
				if (z == -1) {
					opacity = 1;
				}
				var newRGB = colorLerp([255,255,255],rgb,opacity);
				// console.log(z, opacity, rgb, newRGB)
				spot.style.background = rgb2hex(newRGB);
				var minSize = 5;
				var fontSize = (tensor.length <= 15 ? 20 : (20-minSize)*15/tensor.length+minSize)
				spot.style.fontSize = fontSize*.75+"px";

				var squareWidth = 125/tensorEl.matrix.length;
				spot.style.width = squareWidth+"px";
				spot.style.height = spot.style.width;
				spot.innerHTML = z;

				if (z == -1) {
					spot.style.color = spot.style.background;
				}

				matrixDiv.appendChild(spot);
			}
			// matrixDiv.appendChild(document.createElement("br"));
		}

		choiceDiv.appendChild(matrixDiv);
	} else { // if it is a builder
		var paramsDiv = document.createElement("div");
		paramsDiv.className="tensor-choice-params-parent";

		for (var i = 0; i < tensorEl.params.length; i++) {
			var parameterSpecs = tensorEl.params[i];

			var pId = `${tensorEl.name.toLowerCase().replace(' ','-')}-${parameterSpecs.name.toLowerCase().replace(' ','-')}`;

			var parameterSpan = document.createElement("span");
			var label = document.createElement("label");
			label.innerHTML = parameterSpecs.name;
			label.for = pId;

			var input;

			switch (parameterSpecs.type) {
				case "int":
					input = document.createElement("input");
					input.type = "number";
					input.min = parameterSpecs.min;
					input.max = parameterSpecs.max;
					input.value = builderParams[index][i];

					break;
				case "selection":
					input = document.createElement("select");
					for (var option of parameterSpecs.options) {
						var optionEl = document.createElement("option");
						optionEl.value = option;
						optionEl.innerHTML = option;
						optionEl.selected = option === builderParams[index][i];

						input.appendChild(optionEl);
					}
					break;

			}

			input.id = pId;
			input.name = pId;

			input.onchange = ((obj,cI) => (event) => {
				builderParams[index][cI] = obj.value;
			})(input,i);

			parameterSpan.appendChild(label);
			parameterSpan.appendChild(input);

			paramsDiv.appendChild(parameterSpan);
		}


		choiceDiv.appendChild(paramsDiv);

		choiceDiv.onclick = (event) => {
			if (event.target.id) return;

			if (doingKroneckerSelection) {
				doingKroneckerSelection = false;
				console.log("Hi");

				tensor = new Tensor(tensor.doSimpleKroneckerProduct(getNewTensor(event)));
				toggleImportLibrary();
				setCanvasDims();
			} else {
				replaceMatrix(event);
			}
		};
	}

	library.appendChild(choiceDiv);
}
tensors.forEach(addTensorToLibrary);