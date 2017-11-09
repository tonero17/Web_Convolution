// File	  :	udf.js
// This file contains code related to the user-defined functions implementation.
// The UDFs functionality relies on the functions present in the plots.js for plotting
// as well as on the functions located in math_functions.js for convolution & correlation.

var userDefinedExpression; // stores original user input defining the UDF
var udfValues = []; // stores the UDF function values for the Y axis
var udfDisabled = true;
var udfNeedsParsing = true;

// shows or hides the desired div block on the webpage
function toggleBlockVisibility(divID) {
    var x = document.getElementById(divID);
    if (x.style.display === "none") {
        x.style.display = "block";
    } else {
        x.style.display = "none";
    }
}

// performs actions necessary after the initial page load
function onPageLoadUdf() {
	toggleBlockVisibility("divUDF");
}

// updates the flag and enables the update button for UDF
function updateUdfParsingReq() {
	udfNeedsParsing = true;
	document.getElementById("btnUpdateUdf").disabled = false;
}

// checks if the user selected UDF from the list of available functions
function checkUdfSelected() {
	var fl = document.getElementById("functionList1");
	if (fl.value == 9) { // 9 corresponds to the UDF id in the list
		activateUdf();
	}
	else {
		deactivateUdf();
	}
}

// enables the udf functionality: updates necessary flags, enables UDF UI, 
// calls for parsing the expression and redraws the function 1 replacing it by the UDF
function activateUdf() {
	if (udfDisabled) {
		if (udfNeedsParsing) {
			parseMathExpr();
		}
		document.getElementById("F1_width").disabled = true; // TODO - this doesn't work!
		document.getElementById("F1_shift").disabled = true;
		plot1(brd);
		toggleBlockVisibility("divUDF");
	}
	udfDisabled = false;
}

// disables the UDF interface and updates necessary flags
function deactivateUdf() {
	if (!udfDisabled) {
		document.getElementById("F1_width").disabled = false;
		document.getElementById("F1_shift").disabled = false;
		toggleBlockVisibility("divUDF");
	}
	udfDisabled = true;
}

// reads and parses the expression input in the UDF input field
function parseMathExpr() {
	userDefinedExpression = document.getElementById("txtUserExpression").value; // get UDF from the text field
	// var eval_x = document.getElementById("txtEvalPoint").value; // get evaluation point (for testing)
	var udfDivId = "divUDF"; // HTML element for displaying the pretty function
	var texDisplayFieldId = "divTexExpr"; // HTML element for displaying the pretty function
	
	var node = math.parse(userDefinedExpression); // build expression tree - http://mathjs.org/docs/expressions/expression_trees.html
	var code = node.compile(); // compile to JS code 
	var texExpr = node.toTex(); // compile to LaTeX for printing
	// var scope = { x : eval_x };
	// var result = code.eval(scope); 
	// updateUDTexExpression(texExpr);
	// document.getElementById("txtEvalRes").value = result;
	// displayTex(udfDivId, texDisplayFieldId, texExpr);

	udfValues = evaluateCurrentUserDefinedFunction(samplePoints); // calculate function values
	udfNeedsParsing = false; // just parsed
	document.getElementById("btnUpdateUdf").disabled = true;
	plot1(brd);
	
	return false; // prevent page reload
}

// function displayTex(udf_id, disp_id, tex) {
	// var udf_div = document.getElementById(udf_id);
	// var disp_div = udf_div.getElementsByClassName(disp_id)[0]; // TODO: works by class but not by id
	
	// disp_div.innerHTML = "$" + tex + "$"; // inline display
	// disp_div.innerHTML = "$$" + tex + "$$"; // formula display
// }

// updates the TeX hint for what the system parsed from the user input
function updateUDTexExpression(TeX) {
    var QUEUE = MathJax.Hub.queue;  // shorthand for the queue
    var math = null;                // the element jax for the math output.
    //  Get the element jax when MathJax has produced it
	QUEUE.Push(function () {
		math = MathJax.Hub.getAllJax("divTexExpr")[0];
    });
	QUEUE.Push(["Text",math,"\\displaystyle{"+TeX+"}"]);
}

// returns corresponding UDF Y axis values based on the input vector of X axis values
function evaluateCurrentUserDefinedFunction(values) { // this assumes user input format like x^2 + 5*x
	len = values.length;
	var ret = new Array(2); // eval returns a vector of all inputs concatenated with output
	var output = new Array(len);
	
	for(i = 0; i < len; ++i) {
		ret = math.eval(['x = ' + values[i], userDefinedExpression]); // [x, f(x)]
		output[i] = ret[1]; // select f(x)
	}
	
	return output;
}

// returns UDF values at a point
function evaluateCurrentUserDefinedFunctionAtValue(value) { // this assumes user input format like x^2 + 5*x
	var ret = new Array(2); // eval returns a vector of all inputs concatenated with output
	ret = math.eval(['x = ' + value, userDefinedExpression]); // [x, f(x)]

	return ret[1]; // select f(x)
}