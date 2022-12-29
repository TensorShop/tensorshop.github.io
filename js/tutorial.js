const tutorialFlow = [
	{
		name: "Intro", 
		text: "Welcome to TensorShop! Let's get you introduced to the interface. <br>To start off, a CW-5 tensor has been preloaded. You can see it in matrix form in the workspace highlighted above.<br>As a first task, try <b>toggling the polynomial representation</b> of the tensor.",
		tasks: {
			"Show PolyRep" : false
		}
	},
	{
		name: "Editing-1", 
		text: "As you can see, the polynomial above corresponds to the matrix representation of the tensor.<br>To demonstrate this, <b>select the Single Cell Edit tool</b>.",
		tasks: {
			"Select Single Edit" : false
		}
	},
	{
		name: "Editing-2", 
		text: "Now click on a cell in the matrix and <b>type</b> in a new value. See the correspondence in the polynomial representation? Then, <b>delete</b> the new value.",
		tasks: {
			"Edit Cell" : false,
			"Clear Cell" : false,
		}
	},
	{
		name: "Undoing", 
		text: "Now try to undo that edit by pressing the z key.",
		tasks: {
			"Undo" : false,
		}
	},
	{
		name: "Redoing", 
		text: "You can also redo an undone edit by pressing the x key. Try it!",
		tasks: {
			"Redo" : false,
		}
	},
	{
		name: "PolyRep Off", 
		text: "Now, <b>toggle the polynomial representation off</b>.",
		tasks: {
			"Hide PolyRep" : false
		}
	},
	{
		name: "MatMult-1", 
		text: "The coloring of the matrix is based on the matrix multiplication tensors found. To see these tensors, <b>click the \"Start Viewing MatMult\" button</b>.",
		tasks: {
			"Show MatMult" : false
		}
	},
	{
		name: "MatMult-2", 
		text: "Great! Now <b>cycle through some found matmult tensors.</b>",
		tasks: {
			"Use MatMult" : false
		}
	},
	{
		name: "MatMult-3", 
		text: "Ok! Now turn it off, <b>by clicking the \"Stop Viewing MatMult\" button</b>.",
		tasks: {
			"Hide MatMult" : false
		}
	},
	{
		name: "Swaps-1", 
		text: "Now if you just want to move around rows and columns, try <b>selecting the swapping and inserting tool</b>.",
		tasks: {
			"Select Swap" : false
		}
	},
	{
		name: "Swaps-2", 
		text: "Now, try clicking on a row or column index and dragging and <b>swapping or inserting rows</b>.",
		tasks: {
			"Do Swap" : false,
		}
	},
	{
		name: "Swaps-3", 
		text: "Great! Hold <b>shift</b> and click on <b>two</b> indices to select an interval of indices. Now try <b>inserting multiple rows</b>.",
		tasks: {
			"Do Multiple Swap" : false,
		}
	},
	{
		name: "Import-1", 
		text: "The workspace is getting pretty messy. Import a new tensor by <b>clicking the \"Import\" button</b>, selecting <b>\"Import from Library,\"</b> and <b>choosing a cyclic tensor</b>.",
		tasks: {
			"Import from Library" : false,
			"Import Cyclic" : false
		}
	},
	{
		name: "Kronecker-1", 
		text: "Wonderful! Now take the kronecker product of the current tensor and itself by click the \"Self-Kronecker\" button.",
		tasks: {
			"Take Self-Kronecker" : false
		}
	},
	{
		name: "Save Import", 
		text: "Now, may want to load this tensor in later. Save the current tensor to the library by clicking the \"Add Current Tensor To Library\" button.",
		tasks: {
			"Add to Library" : false
		}
	},
	{
		name: "Open Library", 
		text: "Great, now the tensor is in the library! <b>Open the library</b> to check it out.",
		tasks: {
			"Import from Library" : false,
			"Import Library Close" : false
		}
	},
	{
		name: "Permutation-1", 
		text: "To shuffle the indices of the tensor, <b>use the \"Index Permutation\" section</b>. This will help with finding forms of matrix multiplication.",
		tasks: {
			"Index Permutation" : false
		}
	},
	{
		name: "Zoom-1", 
		text: "If the tensor gets too big, you can zoom in. To get started, select the \"Zoom In\" tool and zoom in.",
		tasks: {
			"Zoom In" : false,
		}
	},
	{
		name: "Zoom-2", 
		text: "To move around when zoomed, select the \"Pan\" tool and pan around.",
		tasks: {
			"Pan Around" : false
		}
	},
	{
		name: "Zoom-3", 
		text: "Now, select the \"Zoom Out\" tool and <b>click on the workspace</b> to zoom out.",
		tasks: {
			"Zoom Out" : false
		}
	},
	{
		name: "Removal-1", 
		text: "If you want to zero out rows, columns, or z-indices, <b>select the zeroing out tool</b>.",
		tasks: {
			"Select Zeroing Out" : false
		}
	},
	{
		name: "Removal-2", 
		text: "Great! With the tool selected, <b>click on an x, y, or z index</b> to zero it out. Click again to bring it back.",
		tasks: {
			"Zero Out" : false
		}
	},
	{
		name: "Removal-3", 
		text: "For more complex removals, you can use monomial degeneration by selecting the \"Monomial Degeneration\" tool.",
		tasks: {
			"Select Edit Degeneration" : false
		}
	},
	{
		name: "Removal-4", 
		text: "Now try clicking on an x- or y-label to edit it, the z-labels and the removals will automatically be calculated.",
		tasks: {
			"Edit Degeneration" : false
		}
	},
	{
		name: "Removal-5", 
		text: "If you have specific spots you wish to remove and you want tensor shop to compute labels to remove them, <b>click on the \"Solve Monomial Degeneration\" tool.</b>",
		tasks: {
			"Select Solve Degeneration" : false
		}
	},
	{
		name: "Removal-6", 
		text: "Now, <b>click on the spots you wish to remove</b>. Then, labels to remove those spots will be computed if an optimal solution is possible, otherwise an approximation will be shown. It is easy to see on <b>an Add Mod 3 tensor</b>.",
		tasks: {
			"Solve Degeneration" : false
		}
	},
	{
		name: "Export-1", 
		text: "If you want to get the current tensor as an image, click the \"Export\" button and select one of the options.",
		tasks: {
			"Export" : false
		}
	},
	{
		name: "End", 
		text: "Great! Now you're ready to use TensorShop!",
		tasks: {
		}
	},
]
const tutorialText = document.getElementById("tutorial-text");

var tutorialFlowIndex = 0;


var tutorialState = {
	name: "Not Started",
	tasks: {'IMPOSSIBLE' : false}
};

function startTutorial() {
	tutorialState = JSON.parse(JSON.stringify(tutorialFlow[0]));
	tutorialFlowIndex = 0;
	updateTutorialPrompts()
	tutorialText.classList.remove("slidehide");
	/// set tensor to CW6
	tensor = new Tensor(tensors[2].matrixGenerator(6));
	tensor.matrix = tensor.matrix.reverse();
	// resize canvas height for tutorial and new tensor
	setCanvasDims();
}


setInterval(() => {
	// if ready to proceed to next tutorial step
	if (Object.values(tutorialState.tasks).every(x => x) && tutorialFlowIndex < tutorialFlow.length-1) {
		tutorialFlowIndex++;
		tutorialState = JSON.parse(JSON.stringify(tutorialFlow[tutorialFlowIndex]));
		updateTutorialPrompts();
	}
},100);

function endTutorial() {
	document.getElementById("end-tutorial-button").classList.add("slidehide");
	tutorialText.classList.add("slidehide");
	tutorialState = {
		name: "Not Started",
		tasks: {'IMPOSSIBLE' : false}
	};
}


function updateTutorialPrompts() {
	tutorialText.innerHTML = tutorialState.text;


	if (tutorialState.name == "End") {
		document.getElementById("end-tutorial-button").classList.remove("slidehide");
	}

	if (("Show PolyRep" in tutorialState.tasks && !tutorialState.tasks["Show PolyRep"]) || ("Hide PolyRep" in tutorialState.tasks && !tutorialState.tasks["Hide PolyRep"]))
		document.getElementById("toggle-polyrep").classList.add("highlighted-border");
	else
		document.getElementById("toggle-polyrep").classList.remove("highlighted-border");

	if ("Select Single Edit" in tutorialState.tasks && !tutorialState.tasks["Select Single Edit"])
		document.getElementById('single-editing-tool').classList.add("highlighted-border");
	else
		document.getElementById('single-editing-tool').classList.remove("highlighted-border");

	if (("Show MatMult" in tutorialState.tasks && !tutorialState.tasks["Show MatMult"]) || "Hide MatMult" in tutorialState.tasks && !tutorialState.tasks["Hide MatMult"])
		document.getElementById('diagonal-toggle').classList.add("highlighted-border");
	else
		document.getElementById('diagonal-toggle').classList.remove("highlighted-border");

	if ("Use MatMult" in tutorialState.tasks && !tutorialState.tasks["Use MatMult"]) {
		document.getElementById("diagonal-shift-left").classList.add("highlighted-border");
		document.getElementById("diagonal-shift-right").classList.add("highlighted-border");
	} else {
		document.getElementById("diagonal-shift-left").classList.remove("highlighted-border");
		document.getElementById("diagonal-shift-right").classList.remove("highlighted-border");
	}

	if ("Select Swap" in tutorialState.tasks && !tutorialState.tasks["Select Swap"])
		document.getElementById('swap-tool').classList.add("highlighted-border");
	else
		document.getElementById('swap-tool').classList.remove("highlighted-border");

	if ("Import from Library" in tutorialState.tasks && !tutorialState.tasks["Import from Library"]) {
		document.getElementById("import-button").classList.add("highlighted-border");
		document.getElementById("import-from-library-button").classList.add("highlighted-border");
	} else {
		document.getElementById("import-button").classList.remove("highlighted-border");
		document.getElementById("import-from-library-button").classList.remove("highlighted-border");
	}

	if ("Import Cyclic" in tutorialState.tasks && !tutorialState.tasks["Import Cyclic"])
		document.getElementById("import-library").children[1].classList.add("highlighted-border");
	else
		document.getElementById("import-library").children[1].classList.remove("highlighted-border");

	if ("Take Self-Kronecker" in tutorialState.tasks && !tutorialState.tasks["Take Self-Kronecker"])
		document.getElementById('self-kronecker-button').classList.add("highlighted-border");
	else
		document.getElementById('self-kronecker-button').classList.remove("highlighted-border");

	if ("Take Kronecker" in tutorialState.tasks && !tutorialState.tasks["Take Kronecker"])
		document.getElementById('kronecker-button').classList.add("highlighted-border");
	else
		document.getElementById('kronecker-button').classList.remove("highlighted-border");

	if ("Add to Library" in tutorialState.tasks && !tutorialState.tasks["Add to Library"])
		document.getElementById('add-to-library-button').classList.add("highlighted-border");
	else
		document.getElementById('add-to-library-button').classList.remove("highlighted-border");


	if ("Zoom In" in tutorialState.tasks && !tutorialState.tasks["Zoom In"])
		document.getElementById('zoom-in-button').classList.add("highlighted-border");
	else
		document.getElementById('zoom-in-button').classList.remove("highlighted-border");

	if ("Pan Around" in tutorialState.tasks && !tutorialState.tasks["Pan Around"])
		document.getElementById('pan-button').classList.add("highlighted-border");
	else
		document.getElementById('pan-button').classList.remove("highlighted-border");

	if ("Zoom Out" in tutorialState.tasks && !tutorialState.tasks["Zoom Out"])
		document.getElementById('zoom-out-button').classList.add("highlighted-border");
	else
		document.getElementById('zoom-out-button').classList.remove("highlighted-border");

	if ("Index Permutation" in tutorialState.tasks && !tutorialState.tasks["Index Permutation"]) {
		document.getElementById("index-permutation-left").classList.add("highlighted-border");
		document.getElementById("index-permutation-right").classList.add("highlighted-border");
	} else {
		document.getElementById("index-permutation-left").classList.remove("highlighted-border");
		document.getElementById("index-permutation-right").classList.remove("highlighted-border");
	}

	if ("Select Zeroing Out" in tutorialState.tasks && !tutorialState.tasks["Select Zeroing Out"])
		document.getElementById('zeroing-out-button').classList.add("highlighted-border");
	else
		document.getElementById('zeroing-out-button').classList.remove("highlighted-border");

	if ("Select Solve Degeneration" in tutorialState.tasks && !tutorialState.tasks["Select Solve Degeneration"])
		document.getElementById('solve-degeneration-button').classList.add("highlighted-border");
	else
		document.getElementById('solve-degeneration-button').classList.remove("highlighted-border");

	if ("Select Edit Degeneration" in tutorialState.tasks && !tutorialState.tasks["Select Edit Degeneration"])
		document.getElementById('degeneration-button').classList.add("highlighted-border");
	else
		document.getElementById('degeneration-button').classList.remove("highlighted-border");

	if ("Export" in tutorialState.tasks && !tutorialState.tasks["Export"])
		document.getElementById('export-button').classList.add("highlighted-border");
	else
		document.getElementById('export-button').classList.remove("highlighted-border");

	if ("Import Library Close" in tutorialState.tasks && !tutorialState.tasks["Import Library Close"])
		document.getElementById('import-close-button').classList.add("highlighted-border");
	else
		document.getElementById('import-close-button').classList.remove("highlighted-border");
}



