
//Author: ANTHONY OMIUNU


// Global Variables
let graph1;
let graph2;
let graph3;
let signalArray1 = []; // graph 1 Y-axis values for signal 1 (function 1)
let signalArray2 = []; // graph 2 Y-axis values for signal 2 (function 2)
let signalArray3 = []; // graph 3 Y-axis values from convolution or correlation result
const samplePoints = []; // X-axis values for signals 1 & 2
let sliderSamplePoints = []; // slider dependent sample points
const samplePeriod = 1 / 128; // 128 samples per unit on the X-axis
const resultPoints = []; // X-axis values for signals 3
let widthSignal1; // width of function 1 gotten from text box
let widthSignal2; // width of function 2 gotten from text box
let shiftSignal1; // shift of function 1 along the X-axis gotten from text box
let shiftSignal2; // shift of function 2 along the X-axis gotten from text box
let convoCorr = -1; // 0 for convolution and 1 for correlation
let slide; // slider variable
let pnt; // moving red point
let pntArrow2;
let pntArrow1;
//let pntArrow3;
let multiplier; // zoom factor
const sliderSnapWidth = 0.05; // slider step
let sliderLeftCoord; // X, Y coordinate of left border of slider
let sliderRightCoord;	// X, Y coordinate of right border of slider
let numOfConvoCalls = 0; // number of times convolution function (doConvo())
                         // has been called. Used to set slider default value

/* 	Results from convolution and correlation need to be scaled down
 	by a factor of the sampling frequency = 1 / samplePeriod
  results derived from Dirac and Diarac pulse train functions are not scaled -AO
  Made it so you have to pass the array to be scaled - the function has to be able to work
  with different convolution output arrays, not just one. - AU
  @Input_arg => output from convolution or correlation
  @function updates a global variable	signalArray3										*/

function scaleResult(sigAr) {
  const signal1 = document.getElementById('functionList1').value;
  const signal2 = document.getElementById('functionList2').value;
  if (signal1 !== '6' && signal2 !== '6' && signal1 !== '7') {
		for (let i = 0; i < sigAr.length; ++i) {
			sigAr[i] = sigAr[i] * samplePeriod * multiplier;
		}
  }
}

/* 	Generate Graphs 1&2 X-axis array
  Arguments are the left upper and right lower bounds of the upper board.
  Half of the plot is shown on the screen.
  This is necessitated by the step function implementation 						*/
function generateSamplePoints(leftBound, rightBound) {
  let x = 0;
  let t = 2 * leftBound;
  multiplier = rightBound / 4;
	const outerRange = Math.round((2 * rightBound) - (2 * leftBound));
	samplePoints.length = outerRange / multiplier / samplePeriod;
  for (x = 0; x < samplePoints.length; x++) {
        samplePoints[x] = t;
        t += (samplePeriod * multiplier);
  }
}

// Generate Graph 3 X-axis array
function generateResultPoints(pointAr, resAr) {
    const N = resAr.length;
    const timeRange = N * samplePeriod * multiplier; // get the required range of the X-axis
    const timeOutput = [];
  // define the starting and ending point for the X-axis
    const startTime = (-1) * (timeRange / 2);
  const endTime = timeRange / 2;
  let t = 0;
  let i = 0;
    for (t = startTime; t < endTime;) {
        timeOutput.push(t);
        t += samplePeriod * multiplier;
    }
    // pointAr = timeOutput; // JavaScript is pass by value :(
  for (i = 0; i < timeOutput.length; i++) { // TODO: fix this part, it's too lame
			pointAr[i] = timeOutput[i];
  }
}

// This function is called when the visualization tab is opened
// It plots the rect() and tri() functions with default settings
function start(brd,brd2) {

  //create slider object with range -4 to 4 and 0 default value
  slide = brd.create('slider', [[1, 1.5], [3, 1.5], [-4, 0, 4]], {
					name: 't',
					snapWidth: 0.05,
					withLabel: true
				});

  brd.defaultAxes.x.setLabel('T'); // create X-axis label for upper board and set the text
  const xAxisLabel = brd.defaultAxes.x.label; // get the label object

  // set label attributes: position => right
  xAxisLabel.setAttribute({
				position: 'rt', // possible values are 'lft', 'rt', 'top', 'bot'
				offset: [-10, 15] // (in pixels)
			});

  brd2.defaultAxes.x.setLabel('t'); // create X-axis label for lower board and set the text
  const xAxisLabel2 = brd2.defaultAxes.x.label; // get the label object

  // set label attributes: position => right
  xAxisLabel2.setAttribute({
				position: 'rt', // possible values are 'lft', 'rt', 'top', 'bot'
				offset: [-10, 15] // (in pixels)
			});

  // create function 1 graph on upper board
  graph1 = brd.create('curve', [[0], [0]], {
				name: 's1',
				strokeColor: 'green',
				strokeWidth: 1.7
			});

  //create function 2 graph on upper board
  graph2 = brd.create('Curve', [[0], [0]], {
				name: 's2',
				strokeColor: 'blue',
				strokeWidth: 1.7
			});

  // create convolution / correlation graph on lower board
  graph3 = brd2.create('curve', [[0], [0]], { strokeWidth: 1.7, strokeColor: 'blue' });

    // create red dot(point) for animation
    pnt = brd2.create('point', [100, 0], { name: '' });
  // create arrows for the dirac pulse
    pntArrow2 = brd.create('point', [100, 0.95],
			{
					name: '',
					face: '^',
					fillColor: 'blue',
					strokeColor: 'blue',
					size: 4
			});
    pntArrow1 = brd.create('point', [100, 0.95], {
					name: '',
					face: '^',
					fillColor: 'green',
					strokeColor: 'green',
					size: 4
			});
    // pntArrow3 = brd.create('point', [100,0.95],
  // 												{ name: '',
  // 													face: '^',
  // 													fillColor: 'blue',
  // 													strokeColor: 'blue',
  // 													size: 4
  // 												});

  // get the coordinates of the slider
    sliderLeftCoord = [1, 1.5];
    sliderRightCoord = [3, 1.5];

  // plot function 1 on the upper board
    graph1.updateDataArray = function () {
  // get width from textbox
        widthSignal1 = parseFloat(document.getElementById('F1_width').value);
  // get shift from textbox
        shiftSignal1 = parseFloat(document.getElementById('F1_shift').value);

        const yAxisValues = rect(samplePoints, widthSignal1, shiftSignal1);
        this.dataX = samplePoints; // x axis values for graph 1 on the upper board
        this.dataY = yAxisValues; // y axis values for graph 1 on the upper board
        signalArray1 = yAxisValues; // send values for convolution or correlation
        //console.log(samplePoints);
        //console.log(signalArray1);
    };

  // plot function two on the upper board
    graph2.updateDataArray = function () {
  // get width from textbox
        widthSignal2 = parseFloat(document.getElementById('F2_width').value);
  // get shift from textbox
        shiftSignal2 = parseFloat(document.getElementById('F2_shift').value);

        const yAxisValues = tri(samplePoints, widthSignal2, shiftSignal2);
        this.dataX = samplePoints; // x axis values for graph 2 on the upper board
        this.dataY = yAxisValues; // y axis values for graph 2 on the upper board
        signalArray2 = yAxisValues; // send values for convolution or correlation
    };

  brd.update(); // refresh the upper board with latest data

  doConvo(brd2); // perform convolution on the plotted functions
}

// Re-plot function 1 graph on upper board if user makes
// changes to the specification of function 1
function plot1(brd) {
  pntArrow1.moveTo([100, 0]);

    const signal = document.getElementById('functionList1').value;
  // get the position value of the function to plot
    const widthTextObj = document.getElementById('F1_width');
    const shiftTextObj = document.getElementById('F1_shift');
    const widthTextObjLabel = document.getElementById('f1Text1Label');

    widthTextObj.disabled = false;
    shiftTextObj.disabled = false;

  // if a value is required but none is provided
    if (widthTextObj.value === '' && signal !== '5') {
        alert('Width field for function 1 cannot be empty');
        widthTextObj.value = '' + widthSignal1 + ''; // put the previous value in the text box
    } else if (widthTextObj.value <= 0) { // width must be greater than 0
        alert('Width field for function 1 must be greater than 0');
      widthTextObj.value = ''+  widthSignal1 + ''; // put the previous value in the text box
  } else {
        widthSignal1 = parseFloat(document.getElementById('F1_width').value);// get entered value
    }

    if (shiftTextObj.value === '') {
        alert('shift field for function 1 cannot be empty');
        shiftTextObj.value = '' + shiftSignal1 + ''; // put the previous value in the text box
    } else {
        shiftSignal1 = parseFloat(document.getElementById('F1_shift').value);// get entered value
    }

  //Set label to width or rate depending on the function chosen
  if (signal === '8') {
  widthTextObjLabel.textContent = 'Function 1 Rate:';
  } else {
  widthTextObjLabel.textContent = 'Function 1 Width:';
  }

    //change the Y attribute of the graph to match new user specification
    graph1.updateDataArray = function () {
        let yAxisValues;
            if (signal === '1') { // rectangle selected
                yAxisValues = rect(samplePoints, widthSignal1, shiftSignal1);
                pntArrow1.moveTo([100, 0]); 	//move point out of view
            } else if (signal === '2') { 	// triangle selected
                yAxisValues = tri(samplePoints, widthSignal1, shiftSignal1);
                pntArrow1.moveTo([100, 0]); 	//move point out of view
            } else if (signal === '3') { 	// gaussian selected
               yAxisValues = gaussian(samplePoints, widthSignal1, shiftSignal1);
               pntArrow1.moveTo([100, 0]); 	//move point out of view
            } else if (signal === '4') {	// sinc function selected
               yAxisValues = sinc(samplePoints, widthSignal1, shiftSignal1);
               pntArrow1.moveTo([100,0]); 	//move point out of view
           } else if (signal == '5') { // step function selected
               widthTextObj.disabled = true;
               yAxisValues = step(samplePoints, shiftSignal1);
               pntArrow1.moveTo([100, 0]);	//move point out of view
           } else if (signal === '6') { // dirac selected
               widthTextObj.disabled = true;
               yAxisValues = dirac(samplePoints, shiftSignal1);
               pntArrow1.moveTo([shiftSignal1, 0.95]);
           } else if (signal === '9') {	// user defined function selected
               yAxisValues = udfValues;
               pntArrow1.moveTo([100, 0]); //move point out of view
           } else if (signal === '7') { // dirac pulse train selected
               shiftTextObj.disabled = true;
               widthTextObj.disabled = true;
               yAxisValues = diracComb(samplePoints);
               pntArrow1.moveTo([100, 0]); //move point out of view
           } else if (signal === '8') {	//one sided decreasing exponential selected
               shiftTextObj.disabled = true;
               yAxisValues = oneSidedExp(samplePoints, widthSignal1);
               pntArrow1.moveTo([100, 0]); //move point out of view
           }
        this.dataX = samplePoints; // X axis values for graph 1 on the upper board
        this.dataY = yAxisValues; // Y axis values for graph 1 on the upper board
        signalArray1 = yAxisValues;
    };

    brd.update(); 	// redraw board content

    pnt.moveTo([100, 0]); // take red point out of sight

    plot2(brd);

		reDrawSignal2();
 }

// Replot function 2 graph on upper board if user makes
// changes to the specification of function 2
// it takes the upper board as argument
function plot2(brd) {
  // get the position value of the function to plot
    const signal = document.getElementById('functionList2').value;
    const widthTextObj = document.getElementById('F2_width');
    const shiftTextObj = document.getElementById('F2_shift');
    const widthTextObjLabel = document.getElementById('f2Text1Label');

    widthTextObj.disabled = false;
    shiftTextObj.disabled = false;
    pntArrow2.moveTo([100, 0]); // move arrows out of view

  // if a value is required but none is provided
    if (widthTextObj.value === '' && signal !== '5') {
        alert('Width field for function 2 cannot be empty');
        widthTextObj.value = '' + widthSignal2 + ''; // put the previous value in the text box
    } else if (widthTextObj.value <= 0) { // width must be greater than 0
				alert('Width field for function 2 must be greater than 0');
        widthTextObj.value = '' + widthSignal1 + ''; // put the previous value in the text box
    } else {
        widthSignal2 = parseFloat(document.getElementById('F2_width').value);
    }

    if (shiftTextObj.value === '') {
				alert('shift field for function 2 cannot be empty');
        shiftTextObj.value = '' + shiftSignal2 + '';
    } else {
        shiftSignal2 = parseFloat(document.getElementById('F2_shift').value);
    }

    //Set label to width or rate depending on the function chosen
  if (signal === '7') {
      widthTextObjLabel.textContent = ' Function 2 Rate:';
  } else {
      widthTextObjLabel.textContent = 'Function 2 Width:';
  }

    //change the Y attribute of the graph to match new user specification
    graph2.updateDataArray = function () {
        let yAxisValues;

				if (signal === '1') { // triangle selected
					yAxisValues = tri(samplePoints, widthSignal2, shiftSignal2);//
					pntArrow2.moveTo([100,0]);	//move point out of view
				} else if (signal === '2') {	// rectangle selected
					yAxisValues = rect(samplePoints, widthSignal2, shiftSignal2);
					pntArrow2.moveTo([100, 0]);//move point out of view
				} else if (signal === '3') { // gaussian selected
					yAxisValues = gaussian(samplePoints, widthSignal2, shiftSignal2);
					pntArrow2.moveTo([100, 0]);//move point out of view
				} else if (signal === '4') {	// sinc function selected
					yAxisValues = sinc(samplePoints, widthSignal2, shiftSignal2);
					pntArrow2.moveTo([100, 0]); //move point out of view
				} else if (signal === '5') {	// step function selected
					widthTextObj.disabled = true;
					yAxisValues = step(samplePoints, shiftSignal2);
					pntArrow2.moveTo([100, 0]);//move point out of view
				} else if (signal === '6') {		// dirac pulse selected
					widthTextObj.disabled = true;
					yAxisValues = dirac(samplePoints, shiftSignal2);
					pntArrow2.moveTo([shiftSignal2, 0.95]); // set arrow on dirac line
				} else if (signal === '7') { //one sided decreasing exponential selected
					shiftTextObj.disabled = true;
					yAxisValues = oneSidedExp(samplePoints, widthSignal2);
					pntArrow1.moveTo([100, 0]);		//move point out of view
				}

			this.dataX = samplePoints;
			this.dataY = yAxisValues;
			signalArray2 = yAxisValues; // send values for convolution or correlation
    };

    brd.update(); // update upper board

    pnt.moveTo([100, 0]); // move red point out of sight

		reDrawSignal2();
}


// Gets and plots the convolution values for the selected functions
// it takes the lower board as argument and updates the signalArray3 global variable
function doConvo(brd2) {
  convoCorr = 0;	// confirm that the current operation is convolution
  // keep track of the number of times convoultion has been called since program started
  ++numOfConvoCalls;
  // get value of function to be plotted
  //const signal1 = document.getElementById('functionList1').value;
  //const signal2 = document.getElementById('functionList2').value;
  graph3.updateDataArray = function () {
      signalArray3 = conv(signalArray1, signalArray2);
      scaleResult(signalArray3);

      generateResultPoints(resultPoints, signalArray3); 	// X-axis points for graph 3
      this.dataX = resultPoints; // X axis values for graph 3 on the lower board
      this.dataY = signalArray3; // Y axis values for graph 3 on the lower board
  };

  brd2.update();

	if (numOfConvoCalls > 1) {
		slide.setValue(0); // set the slider value to the middle
	}
  brd.update(); // refresh the upper board with latest data

  pnt.moveTo([100, 0]); // take red point out of view

  plot2(brd); 	// re-plot the second function which is tied to animation with slider

  return false;
}

// Gets and plots the correlation values for the selected functions
function doCorrelation (brd2) {

  convoCorr = 1;	// confirm that the current operation is correlation

  graph3.updateDataArray = function () {
      signalArray3 = xcorr(signalArray1 , signalArray2);
      scaleResult(signalArray3);

      generateResultPoints(resultPoints, signalArray3); // X-axis points for graph 3
      this.dataX = resultPoints;		// X axis values for graph 3 on the lower board
      this.dataY = signalArray3;		// Y axis values for graph 3 on the lower board
  };

  brd2.update();

  pnt.moveTo([100, 0]);	// move red point out of view

  plot2(brd);		// re-plot the second function which is tied to animation with slider

  slide.setValue(0);

  brd.update(); // refresh the upper board with latest data

  return false;
}

/*
 * Function redraws function 2 plot based on the current type of operation being executed
 * i.e. correlation or convolution.
 * If it is convolution, the original function 2 is flip around the vertical(Y) axis
 * The horizontal shift of the function plot is binded to the slider value.
 * */

function reDrawSignal2() {
  let arrayIndex;
  let maxNumberOfIntervals;
  let currNumberOfIntervals;
  let intervalSize;

  resizeBoard();

  graph2.updateDataArray = function () {
			const signal = document.getElementById('functionList2').value;
			
			if (convoCorr === 0) { // convolution
				if (signal === '6') { // dirac pulse selected
					const xVal = (shiftSignal2 * -1) + slide.Value();
					console.log(xVal)
					pntArrow2.moveTo([(xVal), 0.95]); // set arrow on dirac plot
				}
				for (let x = 0; x < samplePoints.length; x++) {
					sliderSamplePoints[x] = samplePoints[x] + slide.Value(); //- Q - (shiftSignal2);
				}

				sliderSamplePoints = sliderSamplePoints.reverse();
			} else { // Correlation
				if (signal === '6') {
					const xVal = slide.Value() + (shiftSignal2);
					pntArrow2.moveTo([xVal, 0.95]); 	// set arrow on dirac plot
				}
				for (let x = 0; x < samplePoints.length; x++) {
					sliderSamplePoints[x] = samplePoints[x] + slide.Value();//- Q + (shiftSignal2);
				}
			}


			if (slide.Value() === slide._smin) { // slider at lowest value
				arrayIndex = 1536; // size of convolution array divided 2 minus 512
			} else if (slide.Value() === slide._smax) { // slider at highest value
				arrayIndex = 2560; // size of convolution array divided 2 plus 512
			} else {
				maxNumberOfIntervals = (slide._smax - slide._smin) / sliderSnapWidth;
				currNumberOfIntervals = (slide.Value() - slide._smin) / sliderSnapWidth;
				intervalSize = (1024 / maxNumberOfIntervals);
				arrayIndex = Math.floor(intervalSize * currNumberOfIntervals) + 1536;
			}

			this.dataX = sliderSamplePoints;
			this.dataY = signalArray2;

			pnt.moveTo([slide.Value(), signalArray3[arrayIndex]]);
  };

  brd.update();	// refresh the upper board with latest data
}

// resize the board to ensure that function graphs 1 and 2 do not overlap
function resizeBoard() {
  //let x = 0;
  let coords = brd.getBoundingBox();
  let currentLeftBound = coords[0];

  // value that ensures that function 2 does not overlap function 1
  const maxStartingPoint = shiftSignal1 - ((widthSignal1 / 2) + (widthSignal2 / 2) + 2);

  //zoom out until the 2 functions do not overlap
  while (maxStartingPoint < currentLeftBound) {
		brd.zoomOut();
		coords = brd.getBoundingBox();
		currentLeftBound = coords[0];
  }

  slide.setMax(-1 * currentLeftBound); // set slider upper limit
  slide.setMin(currentLeftBound);	 // set slider lower limit
}

// adjust slider size and position based on zoom factor
function adjustSlider() {
  if (currentCoordinateArray[2] < previousCoordinateArray[2]) { // zoom in
		let yCoord = 0.7826 * (currentCoordinateArray[1] - currentCoordinateArray[3]);
		yCoord += currentCoordinateArray[3];
		// set new slider coordinates
		sliderLeftCoord[0] /= 1.25;
		sliderLeftCoord[1] = yCoord;
		sliderRightCoord[0] /= 1.25;
		sliderRightCoord[1] = yCoord;
		//-------------------------------------------------------

		// Update slider slider position
		slide.baseline.point1.setPosition(JXG.COORDS_BY_USER,[sliderLeftCoord[0],sliderLeftCoord[1]]);
		slide.baseline.point2.setPosition(JXG.COORDS_BY_USER,[sliderRightCoord[0],sliderRightCoord[1]]);
  } else if (currentCoordinateArray[2] > previousCoordinateArray[2]) { // zoom out
		let yCoord = 0.7826 * (currentCoordinateArray[1] - currentCoordinateArray[3]);
		yCoord += currentCoordinateArray[3];
		// set new slider coordinates
		sliderLeftCoord[0] *= 1.25;
		sliderLeftCoord[1] = yCoord;
		sliderRightCoord[0] *= 1.25;
		sliderRightCoord[1] = yCoord;
		// ------------------------------------------------------

		// Update slider  position
		slide.baseline.point1.setPosition(JXG.COORDS_BY_USER,[sliderLeftCoord[0],sliderLeftCoord[1]]);
		slide.baseline.point2.setPosition(JXG.COORDS_BY_USER,[sliderRightCoord[0],sliderRightCoord[1]]);
  }
  brd.fullUpdate(); // slider is updated
}

/*function cancelGraphicalView(){
  //document.getElementById("sliderParagraph").classList.remove('greyed');
  //document.getElementById("slideCheckBox").checked = false;
}*/
