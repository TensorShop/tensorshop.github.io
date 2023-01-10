class Tensor {
	constructor(matrix) {
		this.matrix = matrix.reverse();
		this.removalMatrix = this.matrix.map(arr => arr.map(el => -1));
		this.currentAxes = "xyz";
	}
	computeDiagonals() { 
		// var termCount = this.countTerms();

		// copy the tensor so we can edit it
		var T = this.matrix.map(arr => arr.slice()).reverse()

		var rects = []

		for (var r = 0; r < T.length; r++) {
			for (var c = 0; c < T[r].length; c++) {
				if (T[r][c] != -1) {
					var maxDepth = -1;
					var zVals = [];
					for (var i = c; i < T[r].length; i++) {
						if (T[r][i] == -1) break

						for (var j = r; j < T.length; j++) {
							if (j > maxDepth && maxDepth != -1) {
								break
							}
							if (T[j][i] == -1 || zVals.includes(T[j][i])) {
								if (maxDepth != -1) {
									var keepCounter = 0;
									var removeCounter = 0;
									// console.log(j-r+1,maxDepth-j,'|',r,c,j,i,maxDepth,zVals)
									zVals = zVals.filter((el, ind) => {
										if (keepCounter < j-r+1) { // could be <= not <
											keepCounter++;
											return true;
										} else if (removeCounter < maxDepth-j) {
											removeCounter++;
											return false;
										} else {
											keepCounter = 1;
											removeCounter = 0;
											return true;
										}
									});
									// console.log(zVals)
									if (zVals.includes(T[j][i]) || T[j][i] == -1) {
										maxDepth = j-1;
										break
									}
								} else {
									maxDepth = j-1;
									break
								}
								
							}

							zVals.push(T[j][i]);

							rects.push([r,c,j,i,zVals.toString()]);

						}
						// should not be able to have holes
						if (maxDepth == -1) maxDepth = j-1
					}
				}
			}
		}


		var diagonals = []

		for (var rect of rects) {
			var height = rect[2] - rect[0] + 1;
			var width = rect[3] - rect[1] + 1;

			var target = [rect[0]-height,rect[1]+width,rect[2]-height,rect[3]+width]
			
			var l = -1;
			for (var i in diagonals) {
				var diagonal = diagonals[i];
				if (arrEquals(diagonal.start, target) && diagonal.values === rect[4]) {
					l = diagonal.len;
					break
				}
			}

			if (l == -1)
				diagonals.push({len : 1, start : rect.slice(0,rect.length-1), height : height, width : width, values : rect[4]})
			else
				diagonals.push({len : l+1, start : rect.slice(0,rect.length-1), height : height, width : width, values : rect[4]})
		}
		
		diagonals.forEach(d => {
			d.start[0] = T.length-1-d.start[0];
			d.start[2] = T.length-1-d.start[2];
		})

		return diagonals
	}

	getPolyRep() { // to get the polynomial representation of the tensor
		var rep = [];
		// iterate over each row
		for (var y = 0 ; y < this.matrix.length; y++) {
			var row = this.matrix[y];

			// iterate over each column
			for (var x = 0 ; x < row.length; x++) {
				var z = row[x];

				if (z != -1) // if the term is defined, append to final array 
					rep.push([x,this.matrix.length-y-1,z]) // need to invert y
			}
		}
		return rep;
	}
	isValidPartition(partitions) {
		// keep track of the z indices that are "claimed" by a diagonal group
		var claimedZIndices = {};
		var claimedDiagonals = {};

		var xPartitionIndex = 0;
		var yPartitionIndex = 0;
		// console.log(partitions)

		var conflicts = [];

		for (var x = 0; x < this.length; x++) {
			// if we pass a vertical partition, we are at a new section
			if (x-1 < partitions[0].length && partitions[0][x-1])
				xPartitionIndex++;
			yPartitionIndex = 0;
			for (var y = 0; y < this.length; y++) {
				// if we pass a horizontal partition, we are at a new section
				if (y-1 < partitions[1].length && partitions[1][y-1]) {
					yPartitionIndex++;
					// console.log(x,y,xPartitionIndex,yPartitionIndex)
				}

				// compute which diagonal we are on;
				var diagonalLabel = xPartitionIndex+yPartitionIndex;

				var z = this.matrix[y][x];
				if (z == -1)
					continue;

				if (!(z in claimedZIndices)) {
					claimedZIndices[z] = diagonalLabel
					
					if (!(z in claimedDiagonals)) {
						claimedDiagonals[z] = []
					}
					claimedDiagonals[z].push([x,y])
				} else if (claimedZIndices[z] !== diagonalLabel) {
					// console.log(x,y,z,xPartitionIndex,yPartitionIndex, claimedZIndices)
					var nConflicts = (z in claimedDiagonals) ? claimedDiagonals[z] : [];

					conflicts.push([[x,y],...nConflicts])
				}
			}
		}
		return (conflicts.length == 0) ? true : conflicts;
	}

	
	generateMapleCode() {
		var numerator = [];

		var sum = [];


		var aProduct = [];
		var bProduct = [];
		var cProduct = [];
		var x = -1;
		var y = -1;

		for (var c = 0; c < this.matrix.length; c++) {
			var a = [];
			var b = [];
			if (c == this.matrix.length-1 || persistentData.partitions[1][c]) {
				x++;
				y = -1;
				for (var r = 0; r < this.matrix.length; r++) {
					if (r == this.matrix.length-1 || persistentData.partitions[0][r]) {
						y++;
						if (persistentData.partitionValues[y][x] == "" || persistentData.partitionValues[y][x] == " ") {
							console.log(y + x*_xPartitions)
							continue
						}

						// generate label names based on position
						// (using the number of xPartitions and yPartitions calculated when we updated the partition table)
						console.log(`a_${x + y*_yPartitions}`,`a_${y + x*_xPartitions}`)
						a.push(`a_${y + x*_yPartitions}`);
						b.push(`a_${y + x*_xPartitions}`);


						var index = y + x*_xPartitions

						if (cProduct[x+y] == undefined)
							cProduct[x+y] = []
						cProduct[x+y].push(`a_${index}`);
						console.log(x,y)
						if (persistentData.partitionValues[y][x] != -1) {
							numerator.push(`${persistentData.partitionValues[y][x]}^(a_${index})`)
						}
						sum.push(`a_${index}`)
					}
				}
				a = a.join('+')
				if (a)
					aProduct.push(`((${a})^(${a}))`)
				else
					aProduct.push('1')

				b = b.join('+')
				if (b)
					bProduct.push(`((${b})^(${b}))`)
				else
					bProduct.push('1')
			}
		}

		cProduct = cProduct.map(arr => `((${arr.join('+')})^(${arr.join('+')}))`).filter(n => n)
		

		numerator = '('+numerator.join('*')+')';

		var denominator = `${aProduct.join('*')}*${bProduct.join('*')}*${cProduct.join('*')}`;

		var inequalities = sum.map(el => `${el} >= 0`).join(',');

		denominator = '('+denominator+')^(1/3)'
		return `Maximize(${numerator}/${denominator},{${inequalities},${sum.join('+')}==1})`
	}



	getHTMLPolyRep() { // should be able to shorten it using summation
		var rep = this.getPolyRep().sort((a,b) => {
			return Math.max(...b)-Math.max(...a);
		});
		var htmlRep = '';
		for (var term of rep) {
			htmlRep += `x<sub>${term[0]}</sub>y<sub>${this.matrix.length-1-term[1]}</sub>z<sub>${term[2]}</sub> + `
		}
		return htmlRep.slice(0,htmlRep.length-3);
	}

	get length() {
		return this.matrix.length;
	}

	_simpleSwap(arr,r1,r2) {
		var temp = arr[r1];
		arr[r1] = arr[r2];
		arr[r2] = temp;
	}

	swapRows(r1,r2) {
		if (r1 >= this.length || r2 >= this.length || r1 < 0 || r2 < 0)
			return

		resetDegeneration();

		this._simpleSwap(this.matrix,r1,r2);
		this._simpleSwap(this.removalMatrix,r1,r2);

		while (persistentData.degenerationLabels[1].length < tensor.length)
			persistentData.degenerationLabels[1].push(0)

		this._simpleSwap(persistentData.degenerationLabels[1],r1,r2);

		tensor.doMonomialDegeneration(persistentData.degenerationLabels, true);

		this._simpleSwap(persistentData.zeroingRemovals[1],r1,r2);
	}
	swapColumns(c1,c2) {
		if (c1 >= this.length || c2 >= this.length || c1 < 0 || c2 < 0)
				return

		resetDegeneration();

		const swap = matrix => {
			for (var i = 0; i < matrix.length; i++) {
				var temp = matrix[i][c1];
				matrix[i][c1] = matrix[i][c2];
				matrix[i][c2] = temp;
			}
		}
		swap(this.matrix);
		swap(this.removalMatrix);

		while (persistentData.degenerationLabels[0].length < tensor.length)
			persistentData.degenerationLabels[0].push(0)

		this._simpleSwap(persistentData.degenerationLabels[0],c1,c2);

		tensor.doMonomialDegeneration(persistentData.degenerationLabels, true);

		this._simpleSwap(persistentData.zeroingRemovals[0],c1,c2);
	}


	_reinsertion(matrix,i1,i2, copyFunc, saveFunc, writeFunc) {
		if (i1 < i2)
			i2--;

		if (i1 >= matrix.length || i2 >= matrix.length)
			return

		var temp = saveFunc(i1,matrix);
		var delta = (i1 > i2) ? -1 : 1;
		for (var i = i1; (i1 < i2) ? (i < i2) : (i > i2); i += delta) {
			// console.log(i,i+delta,i1,i2)
			copyFunc(i,i+delta,matrix);
		}
		writeFunc(i2, temp, matrix);
	}

	_copyRow(r1,r2,matrix) {
		matrix[r1] = matrix[r2];
	}

	_copyRowInverted(r1,r2,matrix) {
		matrix[r1] = matrix[r2];
	}

	_saveRow(i,matrix) {
		return matrix[i];
	}

	_writeRow(i,data,matrix) {
		matrix[i] = data;
	}
		

	reinsertRow(r1,r2) {
		resetDegeneration();


		r2++;


		this._reinsertion(this.matrix,r1,r2,this._copyRow,this._saveRow,this._writeRow);
		this._reinsertion(this.removalMatrix,r1,r2,this._copyRow,this._saveRow,this._writeRow);

		while (persistentData.degenerationLabels[1].length < tensor.length)
			persistentData.degenerationLabels[1].push(0)

		this._reinsertion(persistentData.degenerationLabels[1],r1,r2,this._copyRow,this._saveRow,this._writeRow);

		tensor.doMonomialDegeneration(persistentData.degenerationLabels, true);

		this._reinsertion(persistentData.zeroingRemovals[1],r1,r2,this._copyRow,this._saveRow,this._writeRow);
	}

	_reinsertions(matrix,r,selection,copyFunc, saveFunc, writeFunc) {

		var temp = saveFunc(selection,matrix);

		var low = Math.min(...selection);
		var high = Math.max(...selection);
		if (low >= matrix.length || high >= matrix.length || r >= matrix.length || (r >= low && r <= high))
		 	return

		var delta = (r < low) ? -1 : 1;

		for (var i = 0; i < ((r < low) ? (low-r) : (r-high)); i += 1) {
			// could do some fanciness and abstract stuff out, but this is more readable
			var i1 = (r < low) ? (high-i) : (low+i); 
			var i2 = (r < low) ? (low-(i+1)) : (high+(i+1));

			// console.log(i1,i2)
			copyFunc(i1,i2,matrix);
		}
		writeFunc(r, temp, matrix, delta);
	}

	_saveRows(selection,matrix) {
		return matrix.filter((el, ind) => selection.includes(ind));
	}

	_writeRows(r,data,matrix,delta) {
		for (var i = 0; i < data.length; i++) {
			if (delta == -1)
				matrix[r+i+1] = data[i];
			else
				matrix[r-data.length+1+i] = data[i];
		}
	}

	reinsertRows(r,selection) {
		resetDegeneration();

		this._reinsertions(this.matrix,r,selection,this._copyRowInverted,this._saveRows,this._writeRows);
		this._reinsertions(this.removalMatrix,r,selection,this._copyRowInverted,this._saveRows,this._writeRows);

		while (persistentData.degenerationLabels[1].length < tensor.length)
			persistentData.degenerationLabels[1].push(0)

		this._reinsertions(persistentData.degenerationLabels[1],r,selection,this._copyRow,this._saveRows,this._writeRows);

		tensor.doMonomialDegeneration(persistentData.degenerationLabels, true);

		this._reinsertions(persistentData.zeroingRemovals[1],r,selection,this._copyRow,this._saveRows,this._writeRows);
	}
	

	_copyColumn(c1,c2,matrix) {
		for (var i = 0; i < matrix.length; i++) {
			matrix[i][c1] = matrix[i][c2];
		}
	}
	_saveColumn(i,matrix) {
		return matrix.map(arr => arr[i]);
	}

	_writeColumn(i,data,matrix) {
		for (var j = 0; j < matrix.length; j++) {
			matrix[j][i] = data[j];
		}
	}

	reinsertColumn(c1,c2) {
		resetDegeneration();

		this._reinsertion(this.matrix,c1,c2,this._copyColumn,this._saveColumn,this._writeColumn);
		this._reinsertion(this.removalMatrix,c1,c2,this._copyColumn,this._saveColumn,this._writeColumn);

		while (persistentData.degenerationLabels[0].length < tensor.length)
			persistentData.degenerationLabels[0].push(0)

		this._reinsertion(persistentData.degenerationLabels[0],c1,c2,this._copyRow,this._saveRow,this._writeRow);

		tensor.doMonomialDegeneration(persistentData.degenerationLabels, true);

		this._reinsertion(persistentData.zeroingRemovals[0],c1,c2,this._copyRow,this._saveRow,this._writeRow);
	}

	_saveColumns(selection,matrix) {
		return matrix.map(arr => arr.filter((el, i) => selection.includes(i)));
	}

	_writeColumns(c,data,matrix,delta) {
		for (var i = 0; i < data[0].length; i++) {
			for (var j = 0; j < matrix.length; j++) {
				if (delta == -1)
					matrix[j][c+i+1] = data[j][i];
				else
					matrix[j][c-data[0].length+1+i] = data[j][i];
			}
			
		}
	}

	reinsertColumns(r,selection) {
		resetDegeneration();

		this._reinsertions(this.matrix,r,selection,this._copyColumn,this._saveColumns,this._writeColumns);
		this._reinsertions(this.removalMatrix,r,selection,this._copyColumn,this._saveColumns,this._writeColumns);


		while (persistentData.degenerationLabels[0].length < tensor.length)
			persistentData.degenerationLabels[0].push(0)

		this._reinsertions(persistentData.degenerationLabels[0],r,selection,this._copyRow,this._saveRows,this._writeRows);

		tensor.doMonomialDegeneration(persistentData.degenerationLabels, true);

		this._reinsertions(persistentData.zeroingRemovals[0],r,selection,this._copyRow,this._saveRows,this._writeRows);

	}



	_expand(matrix) {
		for (var row of matrix)
			row.push(-1);
		matrix.push(Array(matrix.length+1).fill(-1));
	}
	expand() {
		this._expand(this.matrix);
		this._expand(this.removalMatrix);
	}
	_shrink(matrix) {
		if (matrix.length > 1) {
			matrix.pop();
			for (var row of matrix)
				row.pop();
		}
	}
	shrink() {
		this._shrink(this.matrix);
		this._shrink(this.removalMatrix);
	}

	_changeAxes(matrix,changes,currentAxes,newAxes) {
		
		var newMatrix = matrix.slice().map(arr => arr.map(arr => -1))

		for (var y in matrix) {
			var row = matrix[y];
			for (var x in row) {
				var z = row[x];
				if (z != -1) {
					var newCoords = [-1,-1,-1];
					newCoords[changes[0]] = parseInt(x);
					newCoords[changes[1]] = parseInt(y);
					newCoords[changes[2]] = parseInt(z);

					newMatrix[newCoords[1]][newCoords[0]] = newCoords[2];
				}
			}
		}

		return newMatrix;
	}
	changeAxes(newAxes) {
		var changes = {};

		for (var i in this.currentAxes) {
			var oldAxis = 'xyz'.indexOf(this.currentAxes[i]);
			var newAxis = 'xyz'.indexOf(newAxes[i]);

			changes[oldAxis] = newAxis;
		}

		this.matrix = this._changeAxes(this.matrix, changes, this.currentAxes, newAxes)
		this.removalMatrix = this._changeAxes(this.removalMatrix, changes, this.currentAxes, newAxes)

		var oldLabels = persistentData.degenerationLabels.map(arr => arr.slice());
		var oldZeroes = persistentData.zeroingRemovals.map(arr => arr.slice());
		var oldPartitions = persistentData.partitions.map(arr => arr.slice());
		for (var i = 0; i < oldLabels.length; i++) {
			persistentData.degenerationLabels[changes[i]] = oldLabels[i];
			persistentData.zeroingRemovals[changes[i]] = oldZeroes[i];
			persistentData.partitions[changes[i]] = oldPartitions[i];
		}

		editState.data.locations = [];

		this.currentAxes = newAxes;
	}


	doZeroing(type, index, undo = false, blockedSpots = []) {
		var mat1 = undo ? this.removalMatrix : this.matrix;
		var mat2 = undo ? this.matrix : this.removalMatrix;

		if (type === 'spot') {
			for (var r = 0; r < mat1.length; r++) {
				for (var c = 0; c < mat1.length; c++) {
					if (index == mat1[r][c] && !arrContainsPos(persistentData.degenerationSpots, r, c) && !persistentData.zeroingRemovals[0][c] && !persistentData.zeroingRemovals[1][r]) {
						mat2[r][c] = index;
						mat1[r][c] = -1;
					}
				}
			}
		} else {
			for (var i = 0; i < mat1.length; i++) {
				var z = ((type == 'row') ? mat1[index][i] : mat1[i][index]);
				if (type == 'row') {
					if (!arrContainsPos(persistentData.degenerationSpots, index, i) && !persistentData.zeroingRemovals[0][i] && !persistentData.zeroingRemovals[2][z]) {
						if (mat2[index][i] == -1)
							mat2[index][i] = z;
						mat1[index][i] = -1;
					}
				} else {
					if (!arrContainsPos(persistentData.degenerationSpots, i, index) && !persistentData.zeroingRemovals[1][i] && !persistentData.zeroingRemovals[2][z]) {
						if (mat2[i][index] == -1)
							mat2[i][index] = z;
						mat1[i][index] = -1;
					}
				}
			}
		}
	}
	undoZeroing(type, index, blockedSpots = []) {
		this.doZeroing(type,index,true, blockedSpots);
	}

	doMonomialDegeneration(labels, save = false) {
		const safelyGetLabel = (t, i) => {
			if (i < labels[t].length) {
				if (labels[t][i] === '-')
					return 0;
				return labels[t][i];
			}
			return 0;
		}

		var sums = {};
		for (var r = 0; r < this.length; r++) {
			for (var c = 0; c < this.length; c++) {
				var z = this.matrix[r][c];

				var s = safelyGetLabel(1,r) + safelyGetLabel(0,c);
				if (sums[z] == undefined || s < sums[z]) {
					sums[z] = s;
				}
			}
		}
		labels[2] = [];
		for (var i = 0; i < tensor.length; i++) {
			labels[2].push(sums[i] ? sums[i] : 0);
		}


		for (var r = 0; r < this.length; r++) {
			for (var c = 0; c < this.length; c++) {
				var z = this.matrix[r][c];

				if (safelyGetLabel(1,r) + safelyGetLabel(0,c) !== sums[z] && this.matrix[r][c] !== -1) {
					persistentData.degenerationSpots.push({r:r,c:c});
					this.matrix[r][c] = -1;
					this.removalMatrix[r][c] = z;
				}
			}
		}
	}



	solveMonomialDegeneration(spotsToRemove) {
		// var getOrder = e => e.c+e.r*this.matrix.length;
		// var newSpots = [];
		// for (var r = this.matrix.length-1; r >= 0; r--) {
		// 	for (var c = 0; c < this.matrix.length; c++) {
		// 		if (arrContainsPos(spotsToRemove,r,c))
		// 			newSpots.push({r:r,c:c});
		// 	}
		// }
		// spotsToRemove = newSpots;


		// this first part is the setup for the simplex algorithm for minimization
		// which converts a minimization problem into a maximization problem

		// compute matrix

		// 2 cases to account for
		// case 1: keeping all of a particular z-index
		// make them all equal

		// case 2: keeping some and removing some
		// equality for the ones to keep
		// inequalities for the ones to remove


		// keep track of each spot to remove in terms of its z index
		var spotsForZ = {};


		for (var spot of spotsToRemove) {
			// get the z index at the spot
			var z = this.matrix[spot.r][spot.c];

			if (!spotsForZ[z]) // make sure the array is defined
				spotsForZ[z] = [];

			spotsForZ[z].push(spot); // add the spot to the array
		}


		var system = []; // system of equations
		
		var keep = {}; // keep track of each spot to keep in terms of z index

		for (var r = 0; r < this.matrix.length; r++) { // for each row
			var row = this.matrix[r];
			for (var c = 0; c < row.length; c++) { // for each column
				// get the z index at that spot
				var z = row[c];

				// if we are not going to keep the spot, go to the next spot
				if (z==-1 || (spotsForZ[z] !== undefined && arrContainsPos(spotsForZ[z],r,c))) continue;

				// push the spot to the dictionary of kept spots according to its z index
				if (!keep[z])
					keep[z] = [];
				keep[z].push({r : r, c : c})

				
			}
		}
		
		// for each z index
		for (var z in keep) {
			// get the first element (equality is transitive, we only need shared equality with one element!)
			var p1 = keep[z][0];

			// if we have spots to remove for this spot's z-index
			if (spotsForZ[z])
				// for each spot to remove, we want to create an inequality where
				// the sum of the row and column labels of the spot to remove is
				// less than the sum of the current spot
				// ex: for a spot to remove (xr,yr) and a spot to keep (xk,yk)
				// we want: label_xr+label_yr > label_xk+label_yk

				// converting this into a maximization equation which uses greater than or equal to
				// we get: label_xr + label_yr >= label_xk + label_yk + 1

				// rearranging to put it in the matrix, we get:
				// we get: label_xr + label_yr - label_xk - label_yk >= 1
				for (var spot of spotsForZ[z]) {
					var arr = []; // matrix row for inequality

					// start off with all zeros
					// all the x coefficients for the system, then all the y coefficients,
					// hence the 2*this.matrix.length
					for (var i = 0; i < 2*this.matrix.length; i++)
						arr.push(0);

					// we want one extra column for the other side of the inequality (1)
					arr.push(1);

					// spot to keep (- label_xk - label_yk)
					arr[p1.c] += -1;
					arr[this.matrix.length+p1.r] += -1;

					// spot to remove (label_xr + label_yr)
					arr[spot.c] += 1;
					arr[this.matrix.length+spot.r] += 1;

					system.push(arr);
				}


			// for the rest of the spots to keep
			// we want to make two inequalities to represent equality
			// (if something is both greater than or equal to and less than or equal to something else, they are equal)
			// ex: for two spots (x1,y1) and (x2,y2)
			// we want: label_x1+label_y1 == label_x2+label_y2
			// converting to inequalities, we get:
			// label_x1+label_y1 <= label_x2+label_y2
			// label_x1+label_y1 >= label_x2+label_y2

			// and rearranging for matrix form, we get:
			// label_x1 + label_y1 - label_x2 - label_y2 <= 0
			// 0 >= label_x2 + label_y2 - label_x1 - label_y1

			// one flip:
			// label_x1 + label_y1 - label_x2 - label_y2 <= 0
			// label_x2 + label_y2 - label_x1 - label_y1 <= 0 
			for (var j = 1; j < keep[z].length; j++) {
				var p2 = keep[z][j]; // get the spot

				// we need two rows for each equality 
				var arr1 = [];
				var arr2 = [];

				// fill the rows with zeros (for the coefficients)
				// we want one extra column for the other side of the inequalities (0)
				for (var i = 0; i < 2*this.matrix.length + 1; i++) {
					arr1.push(0);
					arr2.push(0);
				}

				// similar to before, fill in coefficients
				arr1[p1.c] += 1;
				arr1[this.matrix.length+p1.r] += 1;
				arr2[p1.c] += -1;
				arr2[this.matrix.length+p1.r] += -1;

				if (p1.r == p2.r)
					console.log('y',p1.c,p1.r,p2.c,p2.r)
				if (p1.c == p2.c)
					console.log('x',p1.c,p1.r,p2.c,p2.r)
				

				arr1[p2.c] += -1;
				arr1[this.matrix.length+p2.r] += -1;
				arr2[p2.c] += 1;
				arr2[this.matrix.length+p2.r] += 1;

				system.push(arr1);
				system.push(arr2);
			}
		}


		// row for the objective function
		var objectiveRow = [];
		// coefficients for all variables for objective function will be 1
		for (var i = 0; i < system[0].length-1; i++) {
			objectiveRow.push(1);
		}
		objectiveRow.push(0);

		system.push(objectiveRow);

		return system;

		// switched to a server call, so now redundant

		// // minimization problem has been put into the system array as a matrix now
		// // now make it a maximization problem

		// // transpose the matrix
		// system = transpose(system);

		// // take the objective function, make the coefficients negative
		// var arr = system.pop().map(el => -el);
		// // put the objective function at the top
		// system.unshift(arr);

		// // for each row in the matrix
		// system.forEach((row, index) => {
		// 	// add the z variable column, which is 1 in the objective function row and zero everywhere else
		// 	row.unshift(index != 0 ? 0 : 1);

		// 	// take the right side off of the matrix
		// 	var end = row.pop();
		// 	// add the slack variables
		// 	for (var j = 0; j < system.length-1; j++) {
		// 		row.push((j == index-1 && index !== 0) ? 1 : 0);
		// 	}
		// 	// put the right side back
		// 	row.push(end);
		// })
		// console.log(system.map(arr => arr.slice()));


		// // apply simplex algorithm for maximization
		// var labelSolutions = this._doSimplexLinearProgramming(system);
		// console.log(labelSolutions);
		// // get the labels out of the solution to the problem (slack variables of maximization correspond to solution to minimization)
		// labelSolutions = labelSolutions.slice(labelSolutions.length-1-tensor.length*2,labelSolutions.length-1)

		// return labelSolutions.map(el => Math.floor(el * 10000)/10000);

	}

	_doSimplexLinearProgramming(system, maxIterCount=1000) {
		// select a new entering variable
		var enteringIndex = this._computeNewEntering(system[0]);

		// keep track of the number of iterations
		var iterCount = 0;

		// while some coefficients in row 0 are negative
		while (enteringIndex !== -1) {
			// make sure we do not exceed the iteration count
			iterCount++;
			if (iterCount > maxIterCount) break;
			
			// find a pivot row index
			var min = null;
			// for each row
			for (var i = 1; i < system.length; i++) {
				// get the coefficient of the entering variable in that row
				var coeff = system[i][enteringIndex];
				// compute the ratio to element on the right side of the augmented matrix
				var ratio = system[i][system[i].length-1]/coeff;

				// if the ratio is positive and less than the current best ratio
				if (ratio >= 0 && (min == null || ratio < min.ratio))
					min = {ratio : ratio, index : i}; // make it the new current best ratio
			}
			var pivotRow = min.index; // the pivot row is the row with the lowest ratio

	
			// perform a pivot
			// for each row
			for (var r = 0; r < system.length; r++) {
				// calculate the inverse coefficient in order to eliminate the entering variable in each row
				var inverseCoeff = -system[r][enteringIndex]/system[pivotRow][enteringIndex];
				if (r !== pivotRow)
					for (var i = 1; i < system[r].length; i++) {
						system[r][i] += system[pivotRow][i]*inverseCoeff;
					}
			}

			// compute a new entering index, will be -1 if solved
			enteringIndex = this._computeNewEntering(system[0]);
		}

		var solutions = [];

		for (var i = 0; i < system[0].length; i++) {
			var coeff = null;
			for (var j = 0; j < system.length; j++) {
				if (system[j][i] !== 0) {
					if (coeff == null){
						coeff = system[j][system[j].length-1]/system[j][i];
					} else {
						coeff = 0;
						break;
					}
				}
			}
			solutions.push(coeff);
		}

		if (iterCount > maxIterCount) {
			document.getElementById("no-solution-popup").classList.remove("hidden");
		} else {
			document.getElementById("no-solution-popup").classList.add("hidden");
		}

		// console.log(system);
		return system[0];
		// return solutions;
	}

	_computeNewEntering(objectiveCoefficients) {
		// keep track of minimum value
		var minVal = null;
		var minIndex = -1;

		// for each coefficient
		for (var i = 0; i < objectiveCoefficients.length; i++) {
			// if it is negative and lower than the best so far
			if (objectiveCoefficients[i] < 0 && (objectiveCoefficients[i] < minVal || minVal === null)) {
				// keep track of it
				minVal = objectiveCoefficients[i];
				minIndex = i;
			}
		}
		// return the index, or -1 if there are no negative labels
		return minIndex
	}
	catchOverflow() {
		for (var row of this.matrix)
			while (row.length > this.length)
				row.pop()
	}
	// using the matrix-based approach as opposed to polynomials
	doSimpleKroneckerProduct(other) {
		var s1 = this.length;
		var s2 = other.length;

		var size = s1 * s2;

		var newMatrix = generateEmptyMatrix(size,size);
		for (var y1 = 0; y1 < s1; y1++) {
			for (var x1 = 0; x1 < s1; x1++) {
				var z1 = this.matrix[x1][y1];
				if (z1 !== -1) {
					for (var y2 = 0; y2 < s2; y2++) {
						for (var x2 = 0; x2 < s2; x2++) {
							var z2 = parseInt(other.matrix[x2][y2]);
							if (z2 !== -1) {
								console.log(z1,s2,z2);
								newMatrix[x1 * s2 + x2][y1 * s2 + y2] = z1 * s2 + z2;
							}
						}
					}
				}
			}
		}
		return newMatrix.reverse();
	}
	computeDensity() {
		return this.countTerms()/this.length/this.length
	}
	countTerms() {
		var count = 0;
		for (var y = 0; y < this.length; y++) {
			for (var x = 0; x < this.length; x++) {
				count += (this.matrix[y][x] != -1)
			}
		}
		return count
	}
}

