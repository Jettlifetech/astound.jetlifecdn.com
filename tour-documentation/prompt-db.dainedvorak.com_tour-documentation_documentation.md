# itour

## itour documentation

* * *

Thank you for purchasing my plugin. If you have any questions that are beyond the scope of this help file, please feel free to email via my user page contact form [here](http://codecanyon.net/user/yurik417). Thanks so much!

* * *

## Introducing

* * *

## Description

The plugin «itour» gives you the opportunity to tell you about the functionality of any interface. In addition, the plugin «itour» can perform the function of teaching, display the task, prompt you what to do and follow up on implementation of tasks. This is the most flexible and functional plugin among all his analogs.

* * *

## Features

*   [Tour builder](http://demo.masscode.ru/itour/documentation.html#Tour_Builder)
*   Multipage
*   Ability to continue the unfinished tour
*   The intro slide in center of screen
*   Displays the tour covers
*   Works with dynamic content
*   Works with hidden content (select, tabs etc.)
*   Localization (60 languages)
*   Search elements. [Supports most CSS3 selectors](http://api.jquery.com/category/selectors/), as well as some non-standard selectors.
*   Supports operating system "windows (7,8,10)", MacOS, iOS, Android
*   Supports brousers IE 9+, Firefox, Chrome, Safari
*   Detailed documentation and [tour about the tour](http://demo.masscode.ru/itour/documentation.html#Tour_About_The_Tour)
*   37 Positions' Variants
*   Auto Positioning of Message
*   Detect Events
*   Trigger Events
*   Callback Functions
*   Map of All Steps
*   Control of Buttons Text
*   Scroll to Element
*   Highlighting of passed steps
*   Material design
*   Responsive
*   Compatibility with the "Select2" plugin
*   Compatibility with the "jQuery UI Tabs"
*   Compatibility with the "Bootstrap Collapse"

* * *

* * *

## Tour About The Tour

Better to see once than hear a hundred times.

[Start Tour](#)

* * *

## License

All parts of this plugin: CSS and javascript codes are licensed according to the license purchased from Envato.

Read more about licensing here: [http://codecanyon.net/licenses](http://codecanyon.net/licenses)

* * *

## Purchased Archive Structure

\- Plugin styles file is in the "css" folder  
\- Plugin scripts file is in the "js" folder

![](https://prompt-db.dainedvorak.com/tour-documentation/doc_files/images/files_strucutre.png)

* * *

## Files Connection

1\. The style file. Used for the decoration of all the elements of a plugin. [View details](#CSS_Structure)  
2\. Javascript library jQuery [View details](#JavaScript)  
3\. The main plugin file [View details](#JavaScript)

<head> ...\[THIS CODE\]... </head>

```
	
<link rel="stylesheet" href="css/itour.css">
<script src="js/jquery-1.11.1.min.js"></script>
<script src="js/jquery.itour.js"></script>
```

* * *

## HTML Structure

Add this HTML code with a unique data-name attribute to the code of site page.

```
	
<!-- The items to highlight-->
<div data-name="uniqueName">
	<!--Your content here-->
</div>
<div data-name="anotherUniqueName">
	<!--Your content here-->
</div>
```

* * *

## Plugin Initialization

Calling the plugin, you should be sure to specify the parameter "steps".

Parameter "steps" includes settings for each step of the tour.

The setting "name" should correspond to the value of the attribute "data-name" in the html code.

```
			
<script>
$(window).on('load',function(){
	$('body').itour({
		CSSClass:'anyClassName',				//Assign for tour a unique class name to change the display styles of the tour.
		tourID:'anyTourID',						//This string allows you to save data with a unique name about  tour progress. It can be used to save information on the progress of the tour for several users. Or save the progress of each tour separately
		introShow:false,						//If set to true, before the tour you will see the introductory slide, which will offer to see a tour.
		introCover:false,						//Path to the cover of tour
		startStep:1,							//Step from which the tour begins
		tourMapEnable:true,						//Tour Map Enable
		tourMapPos:'right',						//Tour Map Position 
		tourMapJump:true,						//If set to false, then links of steps on the tour map will not be clickable
		tourTitle:'Tour Title Default',			//Tour title
		tourMapVisible:false,					//Specifies to show or hide the map of the tour at the start of the tour
		spacing:10,								//Indent highlighting around the element
		overlayClickable:true,					//This parameter enables or disables the click event for overlying layer
		modalCancelVisible:false,				//Shows a cancel button in modal window.
		stepNumbersVisible:true,				//Shows the total number of steps and the current step number
		showAbsentElement:false,				//Shows an absent element in tour map and find this element in DOM.
		tourContinue:true,						//This parameter add the ability to continue the unfinished tour.
		textDirection:'ltr',					//The direction property specifies the text direction/writing direction. (ltr, rtl)
		lang: {									//Default language settings
			cancelText:	'Cancel Tour',			//The text in the cancel tour button
			hideText: 'Hide Tour Map',			//The text in the hidden tour map button 
			tourMapText:'•••',					//The text in the show tour button
			tourMapTitle: 'Tour Map',			//Title of Tour map button
			nextTextDefault:'Next',				//The text in the Next Button
			prevTextDefault:'Prev',				//The text in the Prev Button
			endText:'End Tour',					//sets the text for the close button in the last step of the tour
			contDialogTitle:'Continue the unfinished tour?',										//Title of continue dialog
			contDialogContent:'Click "Continue" to start with step on which finished last time.',	//Content of continue dialog
			contDialogBtnBegin:'Start from beginning',												//Text in the start button of continue dialog 
			contDialogBtnContinue:'Continue',														//Text in the continue button of continue dialog 
			introTitle:'Welcome to the interactive tour', 											//Title of introduction dialog
			introContent:'This tour will tell you about the main site functionalities',				//Content of introduction dialog
			introDialogBtnStart:'Start',															//Text in the start button of introduction dialog
			introDialogBtnCancel:'Cancel'															//Text in the cancel button of introduction dialog
		},
		steps:[{
			image:'',							//Path to image file
			title:'New Step Title',				//Name of step
			content:'New Step Description',		//Description of step
			contentPosition:'auto',				//Position of message
			name:'uniqueName',					//Unique Name (<div data-name="uniqueName"></div>) of highlighted element or .className (<div class="className"></div>) or #idValue (<div id="idValue"></div>)
			disable:false,						//Block access to element
			overlayOpacity:0.5,					//For each step, you can specify the different opacity values of the overlay layer.
			event:'next',						//An event that you need to do to go to the next step
			skip: false,						//Step can be skipped if you set parameter "skip" to true.
			nextText:'Next',					//The text in the Next Button
			prevText:'Prev',					//The text in the Prev Button
			trigger:false,						//An event which is generated on the selected element, in the transition from step to step
			stepID:'',							//Unique ID Name. This name is assigned to the "html" tag as "data-step" attribute (If not specified, the plugin generates it automatically in the form: "step-N")
			loc:false,							//The path to the page on which the step should work
			before:function(){},				//Triggered before the start of step
			during:function(){},				//Triggered after the onset of step
			after:function(){},					//Triggered After completion of the step, but before proceeding to the next
			delayBefore:0,						//The delay before the element search, ms
			delayAfter:0,						//The delay before the transition to the next step, ms
			checkNext:{							//Function in which you can carry out any verification by clicking on the "Next" button. 
				func:function(){return true},	////If the function returns True, the step will be switched.
				messageError:'Fulfill all the conditions!'	//If the function returns "False", an error message will appear in the message window
			},
			checkPrev:{										//Function in which you can carry out any verification by clicking on the "Prev" button. 
				func:function(){return true},
				messageError:'Fulfill all the conditions!'	
			}
		},
		{
			title:'Step Title 2',
			content:'Step Description 2',
			contentPosition:'auto',
			name:'anotherUniqueName',
			event:'next',
			nextText:'End tour',
			trigger:false
		}],
		create: function(){},					//Triggered when the itour is created
		end: function(){},						//Triggered when the tour ended, or was interrupted
		abort: function(){},					//Triggered when the tour aborted
		finish: function(){}					//Triggered when step sequence is over
	});
})
</script> 
```

* * *

## CSS Structure

I'm using one CSS files [itour.css](https://prompt-db.dainedvorak.com/tour-documentation/css/itour.css) (css/itour.css) in this plugin. It contains styles which are responsible for the correct plugin work.

```
/* ====================== */
/* == Base itour Style == */
/* ====================== */
.hWrap,
.hWrap * {
    box-sizing: border-box;
}
.noTransition {
	-webkit-transition: all 0s ease 0s !important;
	-moz-transition: all 0s ease 0s !important;
	-ms-transition: all 0s ease 0s !important;
	-o-transition: all 0s ease 0s !important;
	transition: all 0s ease 0s !important;
}
.hOverlay {
	position:fixed;
	z-index:999998;
	background-color:#000;
	opacity:0;
	-webkit-transform: translateZ(0);
	-moz-transform: translateZ(0);
	-ms-transform: translateZ(0);
	-o-transform: translateZ(0);
	transform: translateZ(0);
	-webkit-transition: all 0.3s ease;
	-moz-transition: all 0.3s ease;
	-ms-transition: all 0.3s ease;
	-o-transition: all 0.3s ease;
	transition: all 0.3s ease;
}
.hOverlayDisable {
	z-index:999997;
	position:fixed;
	top:0;
	left:0;
	width:100%;
	height:100%;
	display:none;
}
.hOverlayDisable.hOverlayDisableTrue {
	display:block;
}
.bms .hOverlay {
	-webkit-transition: all 0s ease 0s !important;
	-moz-transition: all 0s ease 0s !important;
	-ms-transition: all 0s ease 0s !important;
	-o-transition: all 0s ease 0s !important;
	transition: all 0s ease 0s !important;
}
.hContBlock {
	position:absolute;
	color:#333;
	width:320px;
	max-width:calc(100vw - 10px) !important;
	font:16px/20px Arial, Helvetica, sans-serif;
	background-color:#fff;
	border-radius:2px;
	overflow:hidden;
	z-index:10;
}
.hContBody {
	padding:0 16px 16px 16px;
	margin-top:16px;

	

}
.hContHeader {
	font:700 20px/1.2em Arial, Helvetica, sans-serif;
	overflow:hidden;
	padding:16px 16px 0 16px;
	margin-bottom:16px;
	word-wrap: break-word;
}
.hContFooter {
	overflow:hidden;
	padding:0 8px;
	box-shadow:inset 0 1px 0 rgba(0,0,0,0.1);
	-webkit-transform: translateZ(0);
	-moz-transform: translateZ(0);
	-ms-transform: translateZ(0);
	-o-transform: translateZ(0);
	transform: translateZ(0);
}
.hContFooter .hPrev {
	float:left;
}
.hContFooter .hNext {
	float:left;
}
.hContPos {
	width:0;
	left:-1000px;
	top:0;
	height:0;
	position:fixed;
	z-index:999999;
}
.hContPos:after {
	content:'';
	width:0;
	height:0;
	border-width:10px;
	border-color:#fff;
	border-style:solid;
	position:absolute;
	top:50%;
	left:50%;
	-webkit-transform:translate(-50%,-50%) rotate(45deg);
	-moz-transform:translate(-50%,-50%) rotate(45deg);
	-ms-transform:translate(-50%,-50%) rotate(45deg);
	-o-transform:translate(-50%,-50%) rotate(45deg);
	transform:translate(-50%,-50%) rotate(45deg);
}
.hStepItem.hElAbsent {
	color:#f00
}

/* =========================== */
/* == Message in center of screen == */
/* =========================== */
[data-pos="c"][data-cone="c"][data-cont="c"] {
	width:320px;
	position:fixed;
	top:50%;
	left:50%;
	height:auto;
	-webkit-transform:translate(-50%,-50%);
	-moz-transform:translate(-50%,-50%);
	-ms-transform:translate(-50%,-50%);
	-o-transform:translate(-50%,-50%);
	transform:translate(-50%,-50%);
}
[data-pos="c"][data-cone="c"][data-cont="c"]:after {
	display:none;
}
[data-pos="c"][data-cone="c"][data-cont="c"] .hContBlock {
	/*width:100%;*/
	margin:0 5px;
	left:0;
	top:0;
	position:relative;
}
.hContImage img,
.hContBody img { width:100%;}


/* =========================== */
/* == Message in right side == */
/* =========================== */
[data-pos="r"][data-cone="b"][data-cont="t"]:after,
[data-pos="r"][data-cone="t"][data-cont="t"]:after,
[data-pos="r"][data-cone="c"][data-cont="t"]:after{
	border-right-color: transparent;
    border-bottom-color: transparent;
}
[data-pos="r"][data-cone="b"][data-cont="b"]:after,
[data-pos="r"][data-cone="t"][data-cont="b"]:after,
[data-pos="r"][data-cone="c"][data-cont="b"]:after {
	border-left-color: transparent;
    border-top-color: transparent;
}
[data-pos="r"][data-cont="c"] .hContBlock {
	top:50%;
	left:0;
	-webkit-transform:translate(0,-50%);
	-moz-transform:translate(0,-50%);
	-ms-transform:translate(0,-50%);
	-o-transform:translate(0,-50%);
	transform:translate(0,-50%);
}
[data-pos="r"][data-cont="b"] .hContBlock {
	top:0;
	left:0;
	-webkit-transform:translate(0,0);
	-moz-transform:translate(0,0);
	-ms-transform:translate(0,0);
	-o-transform:translate(0,0);
	transform:translate(0,0);
}
[data-pos="r"][data-cont="t"] .hContBlock {
	top:0;
	left:0;
	-webkit-transform:translate(0,-100%);
	-moz-transform:translate(0,-100%);
	-ms-transform:translate(0,-100%);
	-o-transform:translate(0,-100%);
	transform:translate(0,-100%);
}

/* ========================== */
/* == Message in left side == */
/* ========================== */
[data-pos="l"][data-cone="b"][data-cont="t"]:after,
[data-pos="l"][data-cone="t"][data-cont="t"]:after,
[data-pos="l"][data-cone="c"][data-cont="t"]:after{
	border-right-color: transparent;
    border-bottom-color: transparent;
}
[data-pos="l"][data-cone="b"][data-cont="b"]:after,
[data-pos="l"][data-cone="t"][data-cont="b"]:after,
[data-pos="l"][data-cone="c"][data-cont="b"]:after {
	border-left-color: transparent;
    border-top-color: transparent;
}
[data-pos="l"][data-cont="c"] .hContBlock {
	top:50%;
	left:0;
	-webkit-transform:translate(-100%,-50%);
	-moz-transform:translate(-100%,-50%);
	-ms-transform:translate(-100%,-50%);
	-o-transform:translate(-100%,-50%);
	transform:translate(-100%,-50%);
}
[data-pos="l"][data-cont="b"] .hContBlock {
	top:0;
	left:0;
	-webkit-transform:translate(-100%,0);
	-moz-transform:translate(-100%,0);
	-ms-transform:translate(-100%,0);
	-o-transform:translate(-100%,0);
	transform:translate(-100%,0);
}
[data-pos="l"][data-cont="t"] .hContBlock {
	top:0;
	left:0;
	-webkit-transform:translate(-100%,-100%);
	-moz-transform:translate(-100%,-100%);
	-ms-transform:translate(-100%,-100%);
	-o-transform:translate(-100%,-100%);
	transform:translate(-100%,-100%);
}

/* ============================ */
/* == Message in bottom side == */
/* ============================ */
[data-pos="b"][data-cone="l"][data-cont="l"]:after,
[data-pos="b"][data-cone="r"][data-cont="l"]:after,
[data-pos="b"][data-cone="c"][data-cont="l"]:after{
	border-right-color: transparent;
    border-top-color: transparent;
}
[data-pos="b"][data-cone="l"][data-cont="r"]:after,
[data-pos="b"][data-cone="r"][data-cont="r"]:after,
[data-pos="b"][data-cone="c"][data-cont="r"]:after {
	border-left-color: transparent;
    border-bottom-color: transparent;
}
[data-pos="b"][data-cont="c"] .hContBlock {
	left:50%;
	top:0;
	-webkit-transform:translate(-50%,0);
	-moz-transform:translate(-50%,0);
	-ms-transform:translate(-50%,0);
	-o-transform:translate(-50%,0);
	transform:translate(-50%,0);
}
[data-pos="b"][data-cont="l"] .hContBlock {
	top:0;
	left:0;
	-webkit-transform:translate(-100%,0);
	-moz-transform:translate(-100%,0);
	-ms-transform:translate(-100%,0);
	-o-transform:translate(-100%,0);
	transform:translate(-100%,0);
}
[data-pos="b"][data-cont="r"] .hContBlock {
	top:0;
	left:0;
	-webkit-transform:translate(0,0);
	-moz-transform:translate(0,0);
	-ms-transform:translate(0,0);
	-o-transform:translate(0,0);
	transform:translate(0,0);
}

/* ========================= */
/* == Message in top side == */
/* ========================= */
[data-pos="t"][data-cone="l"][data-cont="l"]:after,
[data-pos="t"][data-cone="r"][data-cont="l"]:after,
[data-pos="t"][data-cone="c"][data-cont="l"]:after{
	border-right-color: transparent;
    border-top-color: transparent;
}
[data-pos="t"][data-cone="l"][data-cont="r"]:after,
[data-pos="t"][data-cone="r"][data-cont="r"]:after,
[data-pos="t"][data-cone="c"][data-cont="r"]:after {
	border-left-color: transparent;
    border-bottom-color: transparent;
}
[data-pos="t"][data-cont="c"] .hContBlock {
	left:50%;
	top:0;
	-webkit-transform:translate(-50%,-100%);
	-moz-transform:translate(-50%,-100%);
	-ms-transform:translate(-50%,-100%);
	-o-transform:translate(-50%,-100%);
	transform:translate(-50%,-100%);
}
[data-pos="t"][data-cont="l"] .hContBlock {
	top:0;
	left:0;
	-webkit-transform:translate(-100%,-100%);
	-moz-transform:translate(-100%,-100%);
	-ms-transform:translate(-100%,-100%);
	-o-transform:translate(-100%,-100%);
	transform:translate(-100%,-100%);
}
[data-pos="t"][data-cont="r"] .hContBlock {
	top:0;
	left:0;
	-webkit-transform:translate(0,-100%);
	-moz-transform:translate(0,-100%);
	-ms-transform:translate(0,-100%);
	-o-transform:translate(0,-100%);
	transform:translate(0,-100%);
}







/* =================== */
/* == Buttons style == */
/* =================== */
.hBtn {
	background: rgba(0, 0, 0, 0);
    border: medium none;
    border-radius: 2px;
    color: #3f51b5;
    cursor: pointer;
    display: inline-block;
    font-family: Arial, Helvetica, sans-serif;
    font-size: 14px;
    font-weight: 700;
    height: 36px;
    letter-spacing: 0;
    line-height: 36px;
    margin: 0;
    outline: medium none;
    overflow: hidden;
    padding: 0 8px;
    position: relative;
    text-align: center;
    text-decoration: none;
    text-transform: uppercase;
	-webkit-transition: box-shadow 0.2s cubic-bezier(0.4, 0, 1, 1) 0s, background-color 0.2s cubic-bezier(0.4, 0, 0.2, 1) 0s, color 0.2s cubic-bezier(0.4, 0, 0.2, 1) 0s;
	-moz-transition: box-shadow 0.2s cubic-bezier(0.4, 0, 1, 1) 0s, background-color 0.2s cubic-bezier(0.4, 0, 0.2, 1) 0s, color 0.2s cubic-bezier(0.4, 0, 0.2, 1) 0s;
	-ms-transition: box-shadow 0.2s cubic-bezier(0.4, 0, 1, 1) 0s, background-color 0.2s cubic-bezier(0.4, 0, 0.2, 1) 0s, color 0.2s cubic-bezier(0.4, 0, 0.2, 1) 0s;
	-o-transition: box-shadow 0.2s cubic-bezier(0.4, 0, 1, 1) 0s, background-color 0.2s cubic-bezier(0.4, 0, 0.2, 1) 0s, color 0.2s cubic-bezier(0.4, 0, 0.2, 1) 0s;
	transition: box-shadow 0.2s cubic-bezier(0.4, 0, 1, 1) 0s, background-color 0.2s cubic-bezier(0.4, 0, 0.2, 1) 0s, color 0.2s cubic-bezier(0.4, 0, 0.2, 1) 0s;
    vertical-align: middle;
    will-change: box-shadow;
}
.hBtn:hover {
	background: rgba(0, 0, 0, 0.1);
}
.hBtn:active {
	background: rgba(0, 0, 0, 0.2);
}

/* ================= */
/* == Message box == */
/* ================= */
.hContFooter .hBtn {
	margin-top:8px;
	margin-bottom:8px;
}
.hContPos ul {
	list-style-position:inside;
	margin:10px 0;
	padding:0;
	
}
.hNavHeader {
	white-space:nowrap;
	border-bottom:1px solid rgba(0,0,0,0.1);
	overflow:hidden;
	text-overflow:ellipsis;
	font: 20px/52px arial;
    padding: 0 16px;
}
.hNavHeader + .hNavWrap {
	top:52px;
}
.hNavWrap {
	top:0;
	bottom:52px;
	position:absolute;
	width:100%;
	max-height:100%;
	overflow:hidden;
	overflow-y:auto;
}

/* =============================== */
/* == Steps List Box (Tour Map) == */
/* =============================== */
.hNavPos {
	position:fixed;
	top:50px;
	bottom:50px;
	width:260px;
	background-color:#fff;
	color:#333;
	z-index:9999999;
	box-shadow: 0 2px 2px 0 rgba(0, 0, 0, 0.14), 0 3px 1px -2px rgba(0, 0, 0, 0.2), 0 1px 5px 0 rgba(0, 0, 0, 0.12);
	border-radius:2px;
	overflow:hidden;
	overflow-y:auto;
	-webkit-transition: all 0.3s ease;
	-moz-transition: all 0.3s ease;
	-ms-transition: all 0.3s ease;
	-o-transition: all 0.3s ease;
	transition: all 0.3s ease;
}
.hNavPos-right {
	right:0;
	transform:translateX(101%);
}
.hNavPos-left {
	left:0;
	transform:translateX(-101%);
}
.hNavOpen .hNavPos {
	display:block;
	transform:translateX(0);
}
.hNavAction {
	padding:8px;
	border-top:1px solid rgba(0,0,0,0.1);
	position:absolute;
	bottom:0;
	left:0;
	width:100%;
	white-space:nowrap;
}
.hStepItem{
	color: rgba(0, 0, 0, 0.87);
    flex-flow: row nowrap;
    font-family: "Roboto","Helvetica","Arial",sans-serif;
    font-size: 16px;
    font-weight: 400;
    letter-spacing: 0.04em;
    line-height: 1;
    min-height: 48px;
    overflow: hidden;
    padding: 16px 16px 16px 50px;
	cursor:pointer;
	width:100%;
	clear:both;
	position:relative;
	display:block;
}
.hStepItem:after,
.hStepItem:before {
	content:'';
	position:absolute;
	top:14px;
	left:22px;
	width:2px;
	font-size:0;
	line-height:0;
	background-color:rgba(0,0,0,0.1);
}




.hStepItem.hSuccess:after,
.hStepItem.hSuccess:before {
	background-color:#3C0;
}
.hStepItem:after {
	height:8px;
	transform-origin:right bottom;
	transform:rotate(-45deg);
	margin-top:8px;
}
.hStepItem:before {
	height:16px;
	transform-origin:left bottom;
	transform:rotate(45deg);
}
.hStepItem:hover,
.hClose:hover {
	background-color:rgba(0,0,0,0.05);
}

.hMapJump-disable .hStepItem {
	cursor: default;
}


.hStepItem:active,
.hStepItem.hCur,
.hClose:active {
	background-color:rgba(0,0,0,0.15);
}

.hMapJump-disable .hStepItem:hover:not(.hCur) {
	background:none;
}

.hAction {
	float:right;
}
.hActionRight {
	float:right;
}

.hRoundBtn {
	float:left;
	clear:right;
	width:40px;
	height:40px;
	display:block;
	text-align:center;
	margin:8px 0;
	position:relative;
	z-index:10; 
	cursor:pointer;
	border-radius:50%;
	font:18px/40px Arial, Helvetica, sans-serif;
	-webkit-transform:rotate(90deg);
	-moz-transform:rotate(90deg);
	-ms-transform:rotate(90deg);
	-o-transform:rotate(90deg);
	transform:rotate(90deg);
}
.hCancelBtn {
	font-size:27px;
}
.hAction .hRoundBtn:last-child {
	margin-right:8px;
}



.hRoundBtn:hover {
	background-color:rgba(0,0,0,0.05);
}
.hRoundBtn:active {
	background-color:rgba(0,0,0,0.15);
}
.hHideMap {
	width:40px;
	height:40px;
	top:5px;
	right:5px;
	display:block;
	text-align:center;
	float:right;
	margin:8px;
	position:absolute;
	z-index:10; 
	cursor:pointer;
	border-radius:50%;
}
.hStepNumbers {
	float:right;
	white-space:nowrap;
	padding:0 8px;
	margin:8px 0;
	line-height:36px;
	font-size: 14px;
}
.hStepNumber {
	display:inline-block; 
	vertical-align:top;
}
.hStepNumber:after {
	content:'/'
}
.hStepTotal {
	display:inline-block; 
	vertical-align:top;
}
.hBtnRight { float:right;}

.startOverlay {
	position:fixed;
	top:0;
	left:0;
	width:100%;
	height:100%;
	background-color:#000;
	z-index:999998;
	opacity:0;
	-webkit-transition: all 0.2s ease;
	-moz-transition: all 0.2s ease;
	-ms-transition: all 0.2s ease;
	-o-transition: all 0.2s ease;
	transition: all 0.2s ease;
}
.startDialog {
	position:fixed;
	top:50%;
	left:50%;
	transform:translate(-50%, -50%);
	z-index:999999;
	box-shadow: 0 2px 2px 0 rgba(0, 0, 0, 0.14), 0 3px 1px -2px rgba(0, 0, 0, 0.2), 0 1px 5px 0 rgba(0, 0, 0, 0.12);
	opacity:0;
	max-width:600px;
	-webkit-transition: all 0.3s ease;
	-moz-transition: all 0.3s ease;
	-ms-transition: all 0.3s ease;
	-o-transition: all 0.3s ease;
	transition: all 0.3s ease;
}

.introDialog {
	position:fixed;
	top:50%;
	left:50%;
	transform:translate(-50%, -50%);
	z-index:999999;
	box-shadow: 0 2px 2px 0 rgba(0, 0, 0, 0.14), 0 3px 1px -2px rgba(0, 0, 0, 0.2), 0 1px 5px 0 rgba(0, 0, 0, 0.12);
	opacity:0;
	-webkit-transition: all 0.3s ease;
	-moz-transition: all 0.3s ease;
	-ms-transition: all 0.3s ease;
	-o-transition: all 0.3s ease;
	transition: all 0.3s ease;
}

.rtl {
	direction: rtl;
}
.startOverlay.hShow {
	opacity:0.5;
}
.startDialog.hShow {
	opacity:1;
}
.introDialog.hShow {
	opacity:1;
}
.hIntroShow .hContPos {
	display:none;
}

.hNav-disable .hNavPos,
.hNav-disable .hNavBtn {
	display:none !important
}
.hErrorMessage {
	background-color:#FFE1E1;
	color:#f00;
	padding:16px;
	margin-top:1px;
}
```

* * *

## JavaScript

To use the plugin you must import two files of javascript:

1\. [jQuery](https://prompt-db.dainedvorak.com/tour-documentation/js/jquery-1.11.1.min.js) (js/jquery-1.11.1.min.js)  
2\. [jquery.itour.js](https://prompt-db.dainedvorak.com/tour-documentation/js/jquery.itour.js) (js/jquery.itour.js)

1\. jQuery is a Javascript library that greatly reduces the amount of code that you must write. If you imported this version of jQuery or any other, it is not necessary to import it for the second time

2\. The main plugin code.

* * *

* * *

## Quick Start

To add a plug-in to the site you need to walk a only 3 steps:

1\. Include all [the necessary files](#Files_Connection) to the page of the site.

2\. Place all necessary files on your server using ftp

3\. Add [HTML code](#HTML_Structure) with a unique data-name attribute to the code of site page.

4\. [Call the plug-in](#Plugin_Initialization)

**Attention!**

These code can be connected anywhere on the page,  
but it is important to follow the sequence of the JavaScript files:

1\. plugin styles

```

<link rel="stylesheet" href="css/itour.css">
```

2\. jquery library

```

<script src="js/jquery-1.11.1.min.js"></script>
```

3\. plugin code

```

<script src="js/jquery.itour.js"></script>
```

4\. initialization code

```

<script> 
$(window).on('load',function(){ 
    $('body').itour({
        // plugin parameters
    });
}); 
</script>
```

\- The first file should be the jquery library  
If you already have this library connected, then you do not need to connect another one, otherwise there may be problems with the conflict

\- The plugin code must always be connected after the jquery library. If you connect it first, it will not work!

\- The plug-in initialization code should be the last one to be connected.  
In this code, you specify all the necessary parameters for the plugin to work.

* * *

## API

* * *

## Options

Option

Default value

Datatype

Description

CSSClass

"anyClassName"

String

Assign for tour a unique class name to change the display styles of the tour.  
It may take the values: "any string value"

tourID

"anyTourID"

String

This string allows you to save data with a unique name about tour progress. It can be used to save information on the progress of the tour for several users. Or save the progress of each tour separately.  
It may take the values: "any string value"

introShow

false

Boolean

If set to true, before the tour you will see the introductory slide, which will offer to see a tour.  
It may take the values: false or true

introCover

false

Boolean / String

Path to the cover of tour.  
It may take the values: false or "Path to the cover"

startStep

1

Number

Step from which the tour begins.  
It may take the values: any positive integer

tourMapEnable

true

boolean

Tour Map Enable  
It may take the values: true or false

tourMapPos

"right"

String

Tour Map Position  
It may take the values: "right" or "left"

tourMapJump

true

Boolean

If set to false, then links of steps on the tour map will not be clickable  
It may take the values: true or false

tourTitle

"Tour Title Default"

String

Tour title  
It may take the values: "any string value"

tourMapVisible

false

Boolean

Specifies to show or hide the map of the tour at the start of the tour  
It may take the values: false or true

spacing

10

Number

Indent highlighting around the element, px  
It may take the values: any positive integer

overlayClickable

true

Boolean

This parameter enables or disables the click event for overlying layer  
It may take the values: false or true

modalCancelVisible

false

Boolean

Shows a cancel button in modal window.  
It may take the values: false or true

stepNumbersVisible

true

Boolean

Shows the total number of steps and the current step number  
It may take the values: true or false

showAbsentElement

false

Boolean

Shows an absent element in tour map and find this element in DOM.  
It may take the values: true or false

tourContinue

true

Boolean

This parameter add the ability to continue the unfinished tour.  
It may take the values: true or false

textDirection

'ltr'

String

The direction property specifies the text direction/writing direction.  
It may take the values: 'ltr' or 'rtl'

lang

```
{
cancelText:	'Cancel Tour',
hideText: 'Hide Tour Map',
tourMapText:'•••',
tourMapTitle: 'Tour Map',
nextTextDefault:'Next',	
prevTextDefault:'Prev',
endText:'End Tour',
contDialogTitle:'Continue the unfinished tour?',
contDialogContent:'Click "Continue" to start with step on which finished last time.',
contDialogBtnBegin:'Start from beginning',
contDialogBtnContinue:'Continue',
introTitle:'Welcome to the interactive tour',
introContent:'This tour will tell you about the main site functionalities',
introDialogBtnStart:'Start',
introDialogBtnCancel:'Cancel'
}			
```

Object

It contains information about the text of the interface elements  
It may take the values: objects

lang / cancelText

"Cancel Tour"

String

The text in the cancel tour button  
It may take the values: "any string value"

lang / hideText

"Hide Tour Map"

String

The text in the hidden tour map button  
It may take the values: "any string value"

lang / tourMapText

"•••"

String

The text in the show tour button  
It may take the values: "any string value"

lang / tourMapTitle

"Tour Map"

String

Title of Tour map button  
It may take the values: "any string value"

lang / nextTextDefault

"Next"

String

The text in the Next Button  
It may take the values: "any string value"

lang / prevTextDefault

"Prev"

String

The text in the Prev Button  
It may take the values: "any string value"

lang / endText

"End Tour"

String

Sets the text for the close button in the last step of the tour  
It may take the values: "any string value"

lang / contDialogTitle

"Continue the unfinished tour?"

String

Title of continue dialog  
It may take the values: "any string value"

lang / contDialogContent

"Click \\"Continue\\" to start with step on which finished last time."

String

Content of continue dialog  
It may take the values: "any string value"

lang / contDialogBtnBegin

"Start from beginning"

String

Text in the start button of continue dialog  
It may take the values: "any string value"

lang / contDialogBtnContinue

"Continue"

String

Text in the continue button of continue dialog  
It may take the values: "any string value"

lang / introTitle

"Welcome to the interactive tour"

String

Title of introduction dialog  
It may take the values: "any string value"

lang / introContent

"This tour will tell you about the main site functionalities"

String

Content of introduction dialog  
It may take the values: "any string value"

lang / introDialogBtnStart

"Start"

String

Text in the start button of introduction dialog  
It may take the values: "any string value"

lang / introDialogBtnCancel

"Cancel"

String

Text in the cancel button of introduction dialog  
It may take the values: "any string value"

steps

```
[{
image:false,
title:'New Step Title',
content:'New Step Description',	
contentPosition:'auto',
name:'uniqueName',
overlayOpacity:'0.5',
disable:false,
event:'next',
skip:false,
nextText:'Next',
prevText:'Next',
trigger:false,
stepID:'',
loc:false,
before:function(){},
during:function(){},
after:function(){},
delayBefore:0,
delayAfter:0,
checkNext:{	
	func:function(){return true},
	messageError:'Fulfill all the conditions!'
},
checkPrev:{
	func:function(){return true},
	messageError:'Fulfill all the conditions!'	
}
}]					
```

Array

Specifies information about each step of the tour  
It may take the values: array of objects

steps / image

""

String

Path to image file  
It may take the values: "" or string value of path to image

steps / title

"New Step Title"

String

Title of step  
It may take the values: "any string value"

steps / content

"New Step Description"

String

Description of step  
It may take the values: "any string value"

steps / contentPosition

"auto"

String

Position of message.  
It may take the values: "auto", "center" or positioning code: "xxx"

**"auto"** - The plugin can automatically choose the best position out of 36 available to display a tour's message.

**"center"** - The message is displayed in the center of screen and no element is highlighted. The parameter "name" in this case is not required!

**"xxx"** - Code which indicates the position of the window with the message

tll, tlc, tlr, tcl, tcc, tcr, trl, trc, trr, rtt, rtc, rtb, rct, rcc, rcb, rbt, rbc, rbb, brr, brc, brl, bcr, bcc, bcl, blr, blc, bll, lbb, lbc, lbt, lcb, lcc, lct, ltb, ltc, ltt

**"xxx"** - First Symbol: The position of message a relatively selected item.  
It may take the values: t (top),r (right),b (bottom),l (left)

**"xxx"** - Second Symbol: The position of corner a relatively selected item.  
a) if first symbol is "l" or "r" it may take the values:t (top), c (center),b (bottom);  
b) if first symbol is "t" or "b" it may take the values:l (left), c (center),r (right);

**"xxx"** - Third Symbol: The position of the window with a message a relatively coner.  
a) if first symbol is "l" or "r" it may take the values:t (top), c (center),b (bottom);  
b) if first symbol is "t" or "b" it may take the values:l (left), c (center),r (right);

steps / name

"uniqueName"

String

Unique Name of highlighted element:

```
name: "uniqueName" /* <div data-name="uniqueName"></div> */
```

or Class Name

```
name: ".className" /* <div class="className"></div> */
```

or ID Value

```
name: "#idValue" /* <div id="idValue"></div> */
```

It may take the values: "any string value"

steps / overlayOpacity

0.5

Number

Opacity value of overlay layer  
It may take the values: any positive number

steps / disable

false

Boolean

Block access to element  
It may take the values: false or true

steps / event

"next"

String / Array

An event that you need to do to go to the next step

It may take the values: "next", "click", "mousedown", "mouseup", "mouseenter", "keydown", "keyup", "blur", "submit" and others [jQuery events](https://api.jquery.com/category/events/).

If you want to listen for the event in another element, then use the array construction. The first array element is an "event", the second element is a jQuery object

It may take the values: \["eventName",$("yourSelector")\]  
"eventName" - Any jQuery event [jQuery events](https://api.jquery.com/category/events/)  
$("yourSelector") - Any jQuery object

steps / skip

false

boolean

Step can be skipped if you set parameter "skip" to true.  
It may take the values: false or true.

steps / nextText

"Next"

String

The text in the Next Button  
It may take the values: "any string value"

steps / prevText

"Prev"

String

The text in the Prev Button  
It may take the values: "any string value"

steps / trigger

false

String / boolean

An event which is generated on the selected element, in the transition from step to step. [jQuery events](https://api.jquery.com/category/events/)  
It may take the values: Name of Event or false

steps / stepID

false

String

Unique ID Name. This name is assigned to the "html" tag as "data-step" attribute (If not specified, the plugin generates it automatically in the form: "step-N")  
It may take the values: "any string value"

steps / loc

false

String

The path to the page on which the step should work. It may take the values: "anyPagePath"

steps / delayBefore

0

Number

The delay before the element search, ms It may take the values: any positive number

steps / delayAfter

0

Number

The delay before the transition to the next step, ms It may take the values: any positive number

steps / checkNext

absent

object

Parameter in which you can carry out any verification by clicking on the "Next" button. It may take the values: object

```
							
{
	func:function(){return true},
	messageError:'Any Text'
}								
```

steps / checkNext / func

absent

function

If the function returns True, the step will be switched.  
If the function returns "False", an error message will appear in the message window  
It may take the values: Any function

steps / checkNext / messageError

"Fulfill all the conditions!"

string

If the function returns "False", an error message will appear in the message window  
It may take the values: Any Text

steps / checkPrev

absent

object

Parameter in which you can carry out any verification by clicking on the "Prev" button. It may take the values: object

```
							
{
	func:function(){return true},
	messageError:'Any Text'
}								
```

steps / checkPrev / func

absent

function

If the function returns True, the step will be switched.  
If the function returns "False", an error message will appear in the message window  
It may take the values: Any function

steps / checkPrev / messageError

"Fulfill all the conditions!"

string

If the function returns "False", an error message will appear in the message window  
It may take the values: Any Text

* * *

## Methods

destroy()

Removes all effects of plugin. It returns all elements in the condition before the initialization of the plugin

This method does not accept any arguments

```

$('body').itour('destroy');
```

* * *

## Events

create()

Triggered when the plugin is created

```

$('body').itour({
	create: function(){}
});
```

end()

Triggered when the tour ended, or was interrupted

```

$('body').itour({
	end: function(){}
});
```

abort()

Triggered when the tour aborted

```

$('body').itour({
	abort: function(){}
});
```

finish()

Triggered when step sequence is over.

```

$('body').itour({
	finish: function(){}
});
```

steps / before()

Triggered before the start of step

```

$('body').itour({
	steps: [{
		before:function(){}
	}]
});				
```

steps / during()

Triggered after the onset of step

```

$('body').itour({
	steps: [{
		during:function(){}
	}]
});				
```

steps / after()

Triggered After completion of the step, but before proceeding to the next

```

$('body').itour({
	steps: [{
		after:function(){}
	}]
});				
```

* * *

## Guide and Demos

* * *

## intro

If set to true, before the tour you will see the introductory slide, which will offer to see a tour.  
It may take the values: false or true

[Start Tour](#)

Element 1 \- Element 2 \- Element 3

## Source

```
<script src="http://code.jquery.com/jquery-latest.js"></script>
<link rel="stylesheet" href="css/itour.css">
<script src="js/jquery.itour.js"></script>
<script>
$(window).on('load',function(){
	$('.introBtn').on('click',function(){
		$('body').itour({
			introShow:true,		
			introCover:'doc_files/images/hello.gif',							
			tourTitle:'Example «intro»',
			tourMapVisible:true,
			steps:[{
				title:'Step 1',				
				content:'Step 1 Description',	
				name:'introEl_1'	
			},{
				title:'Step 2',
				content:'Step 2 Description',		
				name:'introEl_2'
			},{
				title:'Step 3',		
				content:'Step 3 Description',		
				name:'introEl_3'
			}]
		});
		return false;
	});
})
</script> 
<p><a class="btn btn-success introBtn" href="#">Start Tour</a></p>
<p>
	<span data-name="introEl_1">Element 1 </span>	
	-
	<span data-name="introEl_2">Element 2 </span>	
	-	
	<span data-name="introEl_3">Element 3 </span>			
</p>
```

* * *

## multipage

For creating multi-page tour, you must specify the "loc" parameter with path to the page in value.

If the pages level is the same, just specify the page name (relative path)

```
loc:'yurPageRelativePath'

```

If different pages in tour have different depth levels:  
       site.com/parentPage/pageName  
       site.com/pageName  
then you need to specify the absolute path

```
loc:'site.com/pageName'

```

Attention! The parameter "showAbsentElement" with true value is mandatory in creating a multi-page tour.

```
showAbsentElement:true

```

[Start Tour](#)

Element 1 \- Element 2 \- Element 5

## Source

```
<script src="http://code.jquery.com/jquery-latest.js"></script>
<link rel="stylesheet" href="css/itour.css">
<script src="js/jquery.itour.js"></script>
<script>
$(window).on('load',function(){
	$('.multipageBtn').on('click',function(){
		$('body').itour({
			showAbsentElement:true,				
			tourTitle:'Example «multipage»',
			introShow:true,
			steps:[{
				title:'Step 1',				
				content:'Step 1 Description',	
				name:'multipageEl_1',
				loc:'documentation.html'
			},{
				title:'Step 2',
				content:'Step 2 Description',		
				name:'multipageEl_2',
				loc:'documentation.html',
				nextText:'Next Page'
			},{
				title:'Step 3',		
				content:'Step 3 Description',		
				name:'multipageEl_3',
				loc:'demo_multipage.html',
				prevText:'Previous Page'
				
			},{
				title:'Step Trigger',		
				content:'Step 3 Description',		
				name:'.triggerTest',
				loc:'demo_multipage.html',
				prevText:'Previous Page',
				before:function(){
					$('.testBefore').trigger('click');	
				},
				during:function(){
					$('.testDuring').trigger('click');	
				},
				after:function(){
					$('.testAfter').trigger('click');	
				}
			},{
				title:'Step 4',				
				content:'Step 4 Description',	
				name:'multipageEl_4',
				loc:'demo_multipage.html',
				nextText:'Next Page'
				
			},{
				title:'Step 5',				
				content:'Step 5 Description',	
				name:'multipageEl_5',
				loc:'documentation.html'
				
			}],
			lang:{
				introTitle:'Welcome to Multipage demo',
				introContent:'Click "Start" to begin'
			}
		});
		return false;
	});
})
</script> 
<p><a class="btn btn-success multipageBtn" href="#">Start Tour</a></p>
<p>
	<span data-name="multipageEl_1">Element 1 </span>	
	-
	<span data-name="multipageEl_2">Element 2 </span>	
	-
	<span data-name="multipageEl_5">Element 5 </span>	
</p>

<!-- demo_multipage.html-->
<h1 data-name="multipageEl_3">Attention!</h1>
<p data-name="multipageEl_4">This intermediate page.</p>


```

* * *

## startStep

Step from which the tour begins.  
It may take the values: any positive integer.  
In this example, the tour begins with the second step.

[Start Tour](#)

Element 1 \- Element 2 \- Element 3

## Source

```
<script src="http://code.jquery.com/jquery-latest.js"></script>
<link rel="stylesheet" href="css/itour.css">
<script src="js/jquery.itour.js"></script>
<script>
$(window).on('load',function(){
	$('.startStepBtn').on('click',function(){
		$('body').itour({
			startStep:2,	//Step from which the tour begins
			tourTitle:'Example «startStep»',
			tourMapVisible:true,
			steps:[{
				title:'Step 1',				
				content:'Step 1 Description',	
				name:'startStep_1'
			},{
				title:'Step 2',
				content:'Step 2 Description',		
				name:'startStep_2'
			},{
				title:'Step 3',		
				content:'Step 3 Description',		
				name:'startStep_3'
			}]
		});
		return false;
	});
})
</script> 
<p><a class="btn btn-success startStepBtn" href="#">Start Tour</a></p>
<p>
	<span data-name="startStep_1">Element 1 </span>	
	-
	<span data-name="startStep_2">Element 2 </span>	
	-	
	<span data-name="startStep_3">Element 3 </span>		
</p>
```

* * *

## Source

```
<script src="http://code.jquery.com/jquery-latest.js"></script>
<link rel="stylesheet" href="css/itour.css">
<script src="js/jquery.itour.js"></script>
<script>
$(window).on('load',function(){
	$('.tourMapPosBtn_left').on('click',function(){
		$('body').itour({
			tourTitle:'Example «tourMapPos»',
			tourMapPos:'left',					//Tour Map Position 
			tourMapVisible:true,
			steps:[{
				title:'Step 1',				
				content:'Step 1 Description',	
				name:'tourMapPos'
			}]
		});
		return false;
	});
	$('.tourMapPosBtn_right').on('click',function(){
		$('body').itour({
			tourTitle:'Example «tourMapPos»',
			tourMapPos:'right',					//Tour Map Position 
			tourMapVisible:true,
			steps:[{
				title:'Step 1',				
				content:'Step 1 Description',	
				name:'tourMapPos'
			}]
		});
		return false;
	});
})
</script> 
<p>
	<a class="btn btn-success tourMapPosBtn_left" href="#">Start with Map on the LEFT</a>
	<a class="btn btn-success tourMapPosBtn_right" href="#">Start with Map on the RIGHT</a>
</p>
<p>
	<span data-name="tourMapPos">Element</span>		
</p>	
```

* * *

## Source

```
<script src="http://code.jquery.com/jquery-latest.js"></script>
<link rel="stylesheet" href="css/itour.css">
<script src="js/jquery.itour.js"></script>
<script>
$(window).on('load',function(){
	$('.mapJumpBtn').on('click',function(){
		$('body').itour({
			tourTitle:'tourMapJump:false',
			tourMapJump:false,	
			tourMapVisible:true,
			steps:[{
				title:'Step 1',				
				content:'Step 1 Description',	
				name:'mapJumpElement_1'
			},{
				title:'Step 2',				
				content:'Step 2 Description',	
				name:'mapJumpElement_2'
			},{
				title:'Step 3',				
				content:'Step 3 Description',	
				name:'mapJumpElement_3'
			}]
		});
		return false;
	});
})
</script> 
<a class="btn btn-success mapJumpBtn" href="#">Start with disabled tourMapJump</a>
<p>
	<span data-name="mapJumpElement_1">Element 1</span>
	-
	<span data-name="mapJumpElement_2">Element 2</span>
	-
	<span data-name="mapJumpElement_3">Element 3</span>		
</p>	
```

* * *

## tourMapEnable

tour map can be disabled. To do this, set "tourMapEnable" in a false

[Start with disabled tourMap](#)

Element 1 - Element 2 - Element 3

## Source

```
<script src="http://code.jquery.com/jquery-latest.js"></script>
<link rel="stylesheet" href="css/itour.css">
<script src="js/jquery.itour.js"></script>
<script>
$(window).on('load',function(){
	$('.mapEnableBtn').on('click',function(){
		$('body').itour({
			tourTitle:'tourMapEnable:false',
			tourMapEnable:false,	
			modalCancelVisible:true,
			steps:[{
				title:'Step 1',				
				content:'Step 1 Description',	
				name:'mapEnableElement_1'
			},{
				title:'Step 2',				
				content:'Step 2 Description',	
				name:'mapEnableElement_2'
			},{
				title:'Step 3',				
				content:'Step 3 Description',	
				name:'mapEnableElement_3'
			}]
		});
		return false;
	});
})
</script> 
<a class="btn btn-success mapEnableBtn" href="#">Start with disabled tourMap</a>
<p>
	<span data-name="mapEnableElement_1">Element 1</span>
	-
	<span data-name="mapEnableElement_2">Element 2</span>
	-
	<span data-name="mapEnableElement_3">Element 3</span>		
</p>	
```

* * *

## tourMapVisible

Specifies to show or hide the map of the tour at the start of the tour. It may take the values: false or true

For example, two variants are demonstrated:

Variant 1: Disable the tour map at a certain step;  
Variant 2: Enable the tour map at a certain step;

[Variant 1](#) [Variant 2](#)

Element 1 - Element 2 - Element 3

## Source

```
<script src="http://code.jquery.com/jquery-latest.js"></script>
<link rel="stylesheet" href="css/itour.css">
<script src="js/jquery.itour.js"></script>
<script>
$(window).on('load',function(){
	$('.mapVisibleBtn_1').on('click',function(){
		$('body').itour({
			tourTitle:'tourMapVisible_1',
			tourMapVisible:true,
			steps:[{
				title:'Step 1',				
				content:'Step 1 Description',	
				name:'mapVisibleElement_1'
			},{
				title:'Step 2',				
				content:'Step 2 Description',	
				name:'mapVisibleElement_2',
				before:function(){
					$('html').removeClass('hNavOpen');	
					$('.hNavBtn').hide();
				},
				after:function(){
					$('html').addClass('hNavOpen');	
					$('.hNavBtn').show();
				}
			},{
				title:'Step 3',				
				content:'Step 3 Description',	
				name:'mapVisibleElement_3'
			}]
		});
		return false;
	});
	
	$('.mapVisibleBtn_2').on('click',function(){
		$('body').itour({
			tourTitle:'tourMapVisible_2',
			create:function(){
				$('html').removeClass('hNavOpen');
				$('.hNavBtn').hide();	
			},
			steps:[{
				title:'Step 1',				
				content:'Step 1 Description',	
				name:'mapVisibleElement_1'
			},{
				title:'Step 2',				
				content:'Step 2 Description',	
				name:'mapVisibleElement_2',
				before:function(){
					$('html').addClass('hNavOpen');	
					$('.hNavBtn').show();
				},
				after:function(){
					$('html').removeClass('hNavOpen');
					$('.hNavBtn').hide();	
				}
			},{
				title:'Step 3',				
				content:'Step 3 Description',	
				name:'mapVisibleElement_3'
			}]
		});
		return false;
	});
})
</script> 

<a class="btn btn-success mapVisibleBtn_1" href="#">Variant 1</a>
<a class="btn btn-success mapVisibleBtn_2" href="#">Variant 2</a>

<span data-name="mapVisibleElement_1">Element 1</span>
<span data-name="mapVisibleElement_2">Element 2</span>
<span data-name="mapVisibleElement_3">Element 3</span>
```

* * *

## Source

```
<script src="http://code.jquery.com/jquery-latest.js"></script>
<link rel="stylesheet" href="css/itour.css">
<script src="js/jquery.itour.js"></script>
<script>
$(window).on('load',function(){
	$('.spacingBtn_default').on('click',function(){
		$('body').itour({
			tourTitle:'Example «spacing»',
			steps:[{
				title:'Step 1',				
				content:'Step 1 Description',	
				name:'spacing'	
			}]
		});
		return false;
	});
	
	$('.spacingBtn_big').on('click',function(){
$('body').itour({
			tourTitle:'Example «spacing»',
			spacing:30,
			steps:[{
				title:'Step 1',				
				content:'Step 1 Description',	
				name:'spacing'	
			}]
		});
		return false;
	});
		
	$('.spacingBtn_empty').on('click',function(){
		$('body').itour({
			tourTitle:'Example «spacing»',
			spacing:0,
			steps:[{
				title:'Step 1',				
				content:'Step 1 Description',	
				name:'spacing'	
			}]
		});
		return false;
	});
})
</script> 
<p>
	<a class="btn btn-success spacingBtn_default" href="#">Default Spacing (10px)</a>
	<a class="btn btn-success spacingBtn_big" href="#">Spacing 30px</a>
	<a class="btn btn-success spacingBtn_empty" href="#">Without Spacing (0px)</a>
</p>
<p>
	<span data-name="spacing">Element</span>			
</p>
```

* * *

## contentPosition

Position of message.  
It may take the values: "auto", "center" or positioning code: "xxx"

**"auto"** - The plugin automatically choose the best position out of 36 available to display a tour's message.

**"center"** - The message is displayed in the center of screen and no element is highlighted. The parameter "name" in this case is not required!

**"xxx"** - Code which indicates the position of the window with the message

tll, tlc, tlr, tcl, tcc, tcr, trl, trc, trr, rtt, rtc, rtb, rct, rcc, rcb, rbt, rbc, rbb, brr, brc, brl, bcr, bcc, bcl, blr, blc, bll, lbb, lbc, lbt, lcb, lcc, lct, ltb, ltc, ltt

**"xxx"** - First Symbol: The position of message a relatively selected item.  
It may take the values: t (top),r (right),b (bottom),l (left)

**"xxx"** - Second Symbol: The position of corner a relatively selected item.  
a) if first symbol is "l" or "r" it may take the values:t (top), c (center),b (bottom);  
b) if first symbol is "t" or "b" it may take the values:l (left), c (center),r (right);

**"xxx"** - Third Symbol: The position of the window with a message a relatively coner.  
a) if first symbol is "l" or "r" it may take the values:t (top), c (center),b (bottom);  
b) if first symbol is "t" or "b" it may take the values:l (left), c (center),r (right);

[Start Tour](#)

Element

## Source

```
<script src="http://code.jquery.com/jquery-latest.js"></script>
<link rel="stylesheet" href="css/itour.css">
<script src="js/jquery.itour.js"></script>
<script>
$(window).on('load',function(){
	$('.contentPositionBtn').on('click',function(){
		$('body').itour({
			tourTitle:'Example «contentPosition»',
			steps:[{
				title:'contentPosition:"auto"',				
				content:'The plugin automatically choose the best position out of 36 available to display a tour\'s message',	
				contentPosition:'auto',
				name:'contentPosition'
			},{
				title:'contentPosition:"trr"',				
				content:'Top > Right > Right',	
				contentPosition:'trr',
				name:'contentPosition'
			},{
				title:'contentPosition:"rcc"',				
				content:'Right > Center > Center',	
				contentPosition:'rcc',
				name:'contentPosition'
			}]
		});
		return false;
	});
})
</script> 
<p>
	<a class="btn btn-success contentPositionBtn" href="#">Start Tour</a>
</p>
<p>
	<span data-name="contentPosition">Element</span>			
</p>	
```

* * *

## event

An event that you need to do to go to the next step  
It may take the values: "next", "click", "mousedown", "mouseup", "mouseenter", "keydown", "keyup", "blur", "submit" and others [jQuery events](https://api.jquery.com/category/events/).

[Start Tour](#)

Element

## Source

```
<script src="http://code.jquery.com/jquery-latest.js"></script>
<link rel="stylesheet" href="css/itour.css">
<script src="js/jquery.itour.js"></script>
<script>
$(window).on('load',function(){
	$('.eventBtn').on('click',function(){
		$('body').itour({
			tourTitle:'Example «event»',
			steps:[{
				title:'Step 1',				
				content:'Move your cursor over the "element"',	
				contentPosition:'auto',
				name:'event',					
				event:'mouseenter'
			},
			{
				title:'Step 2',				
				content:'To continue, click on the "element"',	
				contentPosition:'auto',
				name:'event',					
				event:'click'
			},
			{
				title:'Step 3',				
				content:'To continue, click on the "element" again or click "End" button',	
				contentPosition:'auto',
				name:'event',
				during:function(){
					$('[data-name="event"]').on('click',function(){
						$('.hNext').trigger('click');	
					});
				},
				after:function(){
					$('[data-name="event"]').off('click');
				}					
			}]
		});
		return false;
	});
})
</script> 
<p>
	<a class="btn btn-success eventBtn" href="#">Start Tour</a>
</p>
<p>
	<span data-name="event">Element</span>			
</p>			
```

* * *

## trigger

An event which is generated on the selected element, in the transition from step to step. [jQuery events](https://api.jquery.com/category/events/)  
It may take the values: Name of Event or false

[Start Tour](#)

Element 1 - Element 2 - Element 3

## Source

```
<script src="http://code.jquery.com/jquery-latest.js"></script>
<link rel="stylesheet" href="css/itour.css">
<script src="js/jquery.itour.js"></script>
<script>
$(window).on('load',function(){
	$('.triggerBtn').on('click',function(){
		$('body').itour({
			tourTitle:'Example «trigger»',
			steps:[{
				title:'Step 1',				
				content:'Step 1 description',	
				contentPosition:'tcc',
				name:'trigger_1',					
				trigger:'click'		
			},{
				title:'Step 2',				
				content:'Step 2 description',	
				contentPosition:'tcc',
				name:'trigger_2',					
				trigger:'click'		
			},{
				title:'Step 3',				
				content:'Step 3 description',	
				contentPosition:'tcc',
				name:'trigger_3',					
				trigger:'click'		
			}]
		});
		return false;
	});
})
</script> 
<p>
	<a class="btn btn-success triggerBtn" href="#">Start Tour</a>
</p>
<p>
	<label data-name="trigger_1"> <input type="radio" name="triggerExample"> Element 1</label>
	-
	<label data-name="trigger_2"> <input type="radio" name="triggerExample"> Element 2</label>
	-
	<label data-name="trigger_3"> <input type="radio" name="triggerExample"> Element 3</label>
</p>				
```

* * *

## Auto Start - #hash

Use a small additional snippet of code and the hash link in the page URL

Autostart on this page occurs after changing the hash of the link in the address bar to the value "itour"

[Start Tour in Other Page](https://prompt-db.dainedvorak.com/tour-documentation/demo_autostart_by_hash.html#itour)

## Source

```
<script src="http://code.jquery.com/jquery-latest.js"></script>
<link rel="stylesheet" href="css/itour.css">
<script src="js/jquery.itour.js"></script>
<script>
$(window).on('load',function(){
	var startTour = function(){
		$('body').itour({
			showAbsentElement:true,				
			tourTitle:'Example «Auto Start»',
			introShow:true,
			steps:[{
				title:'Step 1',		
				content:'Content 1',		
				name:'.asEl_1'
			},{
				title:'Step 2',		
				content:'Content 2',		
				name:'.asEl_2'
			},],
			lang:{
				introTitle:'Welcome to Auto Start demo'
			}
		});	
	}
	
	/*Check hash link in page URL*/
	var detectHash = function(){
		if(location.hash == '#itour'){
			location.hash = '';
			startTour();	
		}
	}
	/*Add event to hyperlink with hash */
	$(window).on('hashchange', function() {
		detectHash();
	});
	detectHash();
	
	/*Add event to button*/
	$('.autoStartBtn').on('click',function(){
		startTour();
		return false;
	});
});
</script> 

<a class="btn btn-success autoStartBtn" href="#">Start Tour</a>

<span class="asEl_1"> Element 1</span>
-
<span class="asEl_2"> Element 2</span>				
```

* * *

## Source

```
<script src="http://code.jquery.com/jquery-latest.js"></script>
<link rel="stylesheet" href="css/itour.css">
<script src="js/jquery.itour.js"></script>
<script>
$(window).on('load',function(){
	var startTour = function(){
		$('body').itour({
			showAbsentElement:true,				
			tourTitle:'Example «Auto Start»',
			introShow:true,
			steps:[{
				title:'Step 1',		
				content:'Content 1',		
				name:'.asEl_1'
			},{
				title:'Step 2',		
				content:'Content 2',		
				name:'.asEl_2'
			},],
			lang:{
				introTitle:'Welcome to Auto Start demo'
			}
		});	
	}

	/*Add event to button*/
	$('.start-tour').on('click',function(){
		startTour();
		return false;
	});
	
	/*Start Tour*/
	startTour();
});
</script> 

<a class="btn btn-success autoStartBtn" href="#">Start Tour</a>

<span class="asEl_1"> Element 1</span>
-
<span class="asEl_2"> Element 2</span>				
```

* * *

## Auto Start - timeout

Autostart on this page occurs immediately after the page is loaded  
A new autostart is possible only after the set time in "tourTimeout" parameter

[Start Tour in Other Page](https://prompt-db.dainedvorak.com/tour-documentation/demo_autostart_with_timeout.html)

## Source

```
<script src="http://code.jquery.com/jquery-latest.js"></script>
<link rel="stylesheet" href="css/itour.css">
<script src="js/jquery.itour.js"></script>
<script>
$(window).on('load',function(){
	/*Set Timeout*/
	var tourTimeout = 5000;
	
	/*Pligon Initialization*/
	var callTour = function(){
		$('body').itour({
			showAbsentElement:true,				
			tourTitle:'Example «Auto-Timeout»',
			introShow:true,
			steps:[{
				title:'Step 1',		
				content:'Content 1',		
				name:'.asEl_1'
			},{
				title:'Step 2',		
				content:'Content 2',		
				name:'.asEl_2'
			},],
			lang:{
				introTitle:'Welcome to Auto Start demo'
			},
			create: function(){
				localStorage.setItem('itourShowed', '1');	
			},
			end: function(){
				localStorage.setItem('itourLastDate', new Date());	
			}
		});		
	}
	
	/*Checking the tour status*/
	var preCallTour = function(){
		if(localStorage.getItem('itourCalled')){	
			callTour();
		}else{
			if(localStorage.getItem('itourShowed')){
				var interval = Date.parse(new Date(Date.now() - Date.parse(localStorage.getItem('itourLastDate') || '1/1/1917')));
				if(interval > tourTimeout){
					callTour();
				}else{
					return false;
				}
			}else{
				callTour();
			}	
		}
		localStorage.removeItem('itourCalled');		
	}
	
	/*Running the status check when the page loads*/
	preCallTour();

	/*Adding a tour call by button*/
	$('.start-tour').on('click',function(){
		localStorage.setItem('itourCalled', '1');
		preCallTour();
		return false;
	});
});
</script> 

<a class="btn btn-primary start-tour" href="#">Start Tour</a>
<span class="asEl_1"> Element 1</span>
<span class="asEl_2"> Element 2</span>			
```

* * *

## Auto Start - timeout & flag

Autostart on this page occurs immediately after the page is loaded  
1\. New start depends on the set sleep time of the tour.  
2\. If the user viewed the tour to the end, Auto Start is disabled forever

[Start Tour in Other Page](https://prompt-db.dainedvorak.com/tour-documentation/demo_autostart_with_timeout_&_flag.html)

## Source

```
<script src="http://code.jquery.com/jquery-latest.js"></script>
<link rel="stylesheet" href="css/itour.css">
<script src="js/jquery.itour.js"></script>
<script>
$(window).on('load',function(){
	$(window).on('load',function(){
	/*Set Timeout*/
	var tourTimeout = 5000;
	
	/*Pligon Initialization*/
	var callTour = function(){
		$('body').itour({
			showAbsentElement:true,				
			tourTitle:'Example «Auto-Timeout-Flag»',
			introShow:true,
			steps:[{
				title:'Step 1',		
				content:'Content 1',		
				name:'.asEl_1'
			},{
				title:'Step 2',		
				content:'Content 2',		
				name:'.asEl_2'
			},],
			lang:{
				introTitle:'Welcome to Auto Start demo'
			},
			create: function(){
				localStorage.setItem('itourShowed', '1');	
			},
			abort: function(){
				localStorage.setItem('itourLastDate', new Date());	
			},
			finish: function(){
				localStorage.setItem('itourFinished', '1');
			}
		});		
	}
	
	/*Checking the tour status*/
	var preCallTour = function(){
		if(localStorage.getItem('itourCalled')){	
			callTour();
		}else{
			if(localStorage.getItem('itourShowed')){
				if(localStorage.getItem('itourFinished')){
					return false;
				}else{
					var interval = Date.parse(new Date(Date.now() - Date.parse(localStorage.getItem('itourLastDate') || '1/1/1917')));
					if(interval > tourTimeout){
						callTour();
					}else{
						return false;
					}
				}
			}else{
				callTour();
			}	
		}
		localStorage.removeItem('itourCalled');		
	}
	
	/*Running the status check when the page loads*/
	preCallTour();

	/*Adding a tour call by button*/
	$('.start-tour').on('click',function(){
		localStorage.setItem('itourCalled', '1');
		preCallTour();
		return false;
	});
});
});
</script> 

<a class="btn btn-primary start-tour" href="#">Start Tour</a> 
<span class="asEl_1"> Element 1</span>
<span class="asEl_2"> Element 2</span>			
```

* * *

## Search of elements

If you can not add an "data-name" attribute for the required elements manually, then make a search on the name of the class, id, or by other attributes

[Start Tour](#)

Element 1 - Element 2 - Element 3

## Source

```
<script src="http://code.jquery.com/jquery-latest.js"></script>
<link rel="stylesheet" href="css/itour.css">
<script src="js/jquery.itour.js"></script>
<script>
$(window).on('load',function(){
	$('.callBtn').on('click',function(){
		$('body').itour({
			tourTitle:'Example «call»',
			steps:[{
				title:'Step 1',				
				content:'Step 1 description',	
				name:'.call_1'
			},{
				title:'Step 2',				
				content:'Step 2 description',	
				name:'#call_2'
			},{
				title:'Step 3',				
				content:'Step 3 description',	
				name:'[title="call_3"]'
			}]
		});
		return false;
	});
})
</script> 
<p>
	<a class="btn btn-success callBtn" href="#">Start Tour</a>
</p>
<p>
	<span class="call_1"> Element 1</span>
	-
	<span id="call_2"> Element 2</span>
	-
	<span title="call_3"> Element 3</span>
</p>				
```

* * *

## Only Message

If you set value "center" for parameter "contentPosition", then the message is displayed in the center of screen and no element is highlighted.

The parameter "name" in this case is not required!

[Start Tour](#)

## Source

```
<script src="http://code.jquery.com/jquery-latest.js"></script>
<link rel="stylesheet" href="css/itour.css">
<script src="js/jquery.itour.js"></script>
<script>
$(window).on('load',function(){
	$('.messageBtn').on('click',function(){
		$('body').itour({
			tourTitle:'Only Message',
			steps:[{
				title:'Step 1',				
				content:'Step 1 description',	
				contentPosition:'center'
			},
			{
				title:'Step 2',				
				content:'Step 2 description',	
				contentPosition:'center'
			},
			{
				title:'Step 3',				
				content:'Step 3 description',	
				contentPosition:'center'
			}]
		});
		return false;
	});
})
</script> 
<p>
	<a class="btn btn-success messageBtn" href="#">Start Tour</a>
</p>		
```

* * *

## Image Content

Use the "image" parameter to add a picture to the message box. As the value specify the path to the image.

[Start Tour](#)

## Source

```
<script src="http://code.jquery.com/jquery-latest.js"></script>
<link rel="stylesheet" href="css/itour.css">
<script src="js/jquery.itour.js"></script>
<script>
$(window).on('load',function(){
	$('.imageBtn').on('click',function(){
		$('body').itour({
			tourTitle:'Image Content',
			steps:[{
				image:'doc_files/images/slide_1.gif',
				title:'Step 1',				
				content:'Step 1 description',	
				contentPosition:'center'
			},
			{
				image:'doc_files/images/slide_2.gif',
				title:'Step 2',				
				content:'Step 2 description',	
				contentPosition:'center'
			},
			{
				image:'doc_files/images/slide_3.gif',
				title:'Step 3',				
				content:'Step 3 description',	
				contentPosition:'center'
			}]
		});
		return false;
	});
})
</script> 
<p>
	<a class="btn btn-success imageBtn" href="#">Start Tour</a>
</p>		
```

* * *

## Overlay Opacity

For each step, you can specify the different opacity values of the overlay layer.

[Start Tour](#)

Element 1 - Element 2 - Element 3

## Source

```
<script src="http://code.jquery.com/jquery-latest.js"></script>
<link rel="stylesheet" href="css/itour.css">
<script src="js/jquery.itour.js"></script>
<script>
$(window).on('load',function(){
	$('.opacityBtn').on('click',function(){	
		$('body').itour({
			tourTitle:'Overlay Opacity',
			steps:[{
				title:'Default',				
				content:'overlayOpacity:0.5',	
				name:'opacity_1'
			},{
				title:'Custom',				
				content:'overlayOpacity:0.2',	
				name:'opacity_2',					
				overlayOpacity:0.2
			},{
				title:'Transparent',				
				content:'overlayOpacity:0',	
				name:'opacity_3',					
				overlayOpacity:0
			}]
		});
		return false;
	});
})
</script>
<p>
	<a class="btn btn-success opacityBtn" href="#">Start Tour</a>
</p>
<p>
	<span data-name="opacity_1"> Element 1</span>
	-
	<span data-name="opacity_2"> Element 2</span>
	-
	<span data-name="opacity_3"> Element 3</span>
</p>			
```

* * *

## Highlight Class

The highlighted item is assigned to the class "itour-highlight". This class can be used for alternative highlight of element.

[Start Tour](#)

Element 1 - Element 2 - Element 3

## Source

```
<script src="http://code.jquery.com/jquery-latest.js"></script>
<link rel="stylesheet" href="css/itour.css">
<script src="js/jquery.itour.js"></script>
<script>
$(window).on('load',function(){
	$('.highlightBtn').on('click',function(){	
		$('body').itour({
			tourTitle:'Highlight Class',
			steps:[{
				title:'Step 1',				
				content:'Step 1 description',	
				name:'highlight_1',					
				overlayOpacity:0
			},{
				title:'Step 2',				
				content:'Step 2 description',	
				name:'highlight_2',					
				overlayOpacity:0
			},{
				title:'Step 3',				
				content:'Step 3 description',	
				name:'highlight_3',					
				overlayOpacity:0
			}]
		});
		return false;
	});
})
</script> 
<style>
.highlight-demo.itour-highlight {
	box-shadow:0 0 0 5px #96E7ED;
}
</style>
<p>
	<a class="btn btn-success highlightBtn" href="#">Start Tour</a>
</p>
<p>
	<span class="highlight-demo" data-name="highlight_1"> Element 1</span>
	-
	<span class="highlight-demo" data-name="highlight_2"> Element 2</span>
	-
	<span class="highlight-demo" data-name="highlight_3"> Element 3</span>
</p>			
```

* * *

## Custom Buttons Text

The buttons may contain any text.

[Start Tour](#)

Element 1 - Element 2 - Element 3

## Source

```
<script src="http://code.jquery.com/jquery-latest.js"></script>
<link rel="stylesheet" href="css/itour.css">
<script src="js/jquery.itour.js"></script>
<script>
$(window).on('load',function(){
	$('.buttonsBtn').on('click',function(){	
		$('body').itour({
			CSSClass:'buttonsDemo',
			tourTitle:'Custom Buttons Text',
			lang:{
				cancelText:	'Cancel',
				hideText: 'Hide',
				tourMapText:'|||',
				tourMapTitle: 'Step List',
				nextTextDefault:'Next Step',
				prevTextDefault:'Back',
				endText:'Done'
			},
			steps:[{
				title:'Step 1',				
				content:'Description 1',	
				name:'buttons_1'
			},{
				title:'Step 2',				
				content:'Description 2',	
				name:'buttons_2',					
				nextText:'Continue'	,
				prevText:'Return'
			},{
				title:'Step 3',				
				content:'Description 3',	
				name:'buttons_3'
			}]
		});
		return false;
	});
})
</script> 
<style>
.buttonsDemo .hNavBtn {
	line-height:33px;
	font-weight:700;
}
</style>
<p>
	<a class="btn btn-success buttonsBtn" href="#">Start Tour</a>
</p>
<p>
	<span data-name="buttons_1"> Element 1</span>
	-
	<span data-name="buttons_2"> Element 2</span>
	-
	<span data-name="buttons_3"> Element 3</span>
</p>	
```

* * *

## Localization

To localize enough use "lang" parameter.

[Start Tour](#)

Element 1 - Element 2 - Element 3

## Source

```
<script src="http://code.jquery.com/jquery-latest.js"></script>
<link rel="stylesheet" href="css/itour.css">
<script src="js/jquery.itour.js"></script>
<script>
$(window).on('load',function(){
	$('.langBtn').on('click',function(){	
		$('body').itour({
			tourMapVisible:true,
			tourTitle:'本土化',
			lang:{
				cancelText:	'取消旅遊',
				hideText: '隱藏地圖',
				tourMapText:'•••',
				tourMapTitle: '地圖之旅',
				nextTextDefault:'以下',
				prevTextDefault:'前',
				endText:'結束',
				contDialogTitle:'繼續未完成的旅遊？',
				contDialogContent:'點擊"繼續" 開始與步上最後一次完成。',
				contDialogBtnBegin:'從年初開始',
				contDialogBtnContinue:'繼續'
			},
			steps:[{
				title:'第一步',				
				content:'第一說明',	
				name:'lang_1'
			},{
				title:'第二步',				
				content:'第二描述',	
				name:'lang_2'	
			},{
				title:'第三步',				
				content:'第三描述',	
				name:'lang_3'
			}]
		});
		return false;
	});
})
</script> 
<p>
	<a class="btn btn-success langBtn" href="#">Start Tour</a>
</p>
<p>
	<span data-name="lang_1"> Element 1</span>
	-
	<span data-name="lang_2"> Element 2</span>
	-
	<span data-name="lang_3"> Element 3</span>
</p>
```

* * *

## Localization 2

To localize enough to connect the language file

[Start Tour](#)

Element 1 - Element 2 - Element 3

## Source

```
<script src="http://code.jquery.com/jquery-latest.js"></script>
<link rel="stylesheet" href="css/itour.css">
<script src="js/jquery.itour.js"></script>
<script src="js/localization/itour-es.js"></script>	
<script>
$(window).on('load',function(){
	$('.lang2Btn').on('click',function(){	
		$('body').itour({
			tourMapVisible:true,
			tourTitle:'La localización 2',
			steps:[{
				title:'Paso 1',				
				content:'Descripción 1',	
				name:'lang2_1'
			},{
				title:'Paso 1',				
				content:'Descripción 1',	
				name:'lang2_2'
			},{
				title:'Paso 1',				
				content:'Descripción 1',	
				name:'lang2_3'
			}]
		});
		return false;
	});
})
</script> 
<p>
	<a class="btn btn-success lang2Btn" href="#">Start Tour</a>
</p>
<p>
	<span data-name="lang2_1"> Element 1</span>
	-
	<span data-name="lang2_2"> Element 2</span>
	-
	<span data-name="lang2_3"> Element 3</span>
</p>	
```

* * *

## Text Direction

The direction property specifies the text direction/writing direction.

[Start Tour](#)

Element 1 - Element 2 - Element 3

## Source

```
<script src="http://code.jquery.com/jquery-latest.js"></script>
<link rel="stylesheet" href="css/itour.css">
<script src="js/jquery.itour.js"></script>
<script src="js/localization/itour-ar.js"></script>	
<script>
$(window).on('load',function(){
	$('.dirBtn').on('click',function(){	
		$('body').itour({
			textDirection:'rtl',
			tourTitle:'اتجاه النص',
			steps:[{
				title:'الخطوة الأولى',				
				content:'وصف الخطوة الأولى',	
				name:'dir_1'
			},{
				title:'الخطوة الثانية',				
				content:'وصف الخطوة الثانية',
				name:'dir_2'
			},{
				title:'الخطوة الثالثة',
				content:'وصف الخطوة الثالثة',
				name:'dir_3'
			}]
		});
		return false;
	});
})
</script> 
<a class="btn btn-success dirBtn" href="#">Start Tour</a>
<p>
	<span data-name="dir_1"> Element 1</span>
	-
	<span data-name="dir_2"> Element 2</span>
	-
	<span data-name="dir_3"> Element 3</span>
</p>	
```

* * *

## Disable Element

The parameter "disable" blocks access to element.

[Start Tour](#)

\-

## Source

```
<script src="http://code.jquery.com/jquery-latest.js"></script>
<link rel="stylesheet" href="css/itour.css">
<script src="js/jquery.itour.js"></script>
<script>
$(window).on('load',function(){
	$('.disableBtn').on('click',function(){	
		$('body').itour({
			tourTitle:'Disable Element',
			steps:[{
				title:'disable:true',				
				content:'This item is not available for editing',	
				name:'disable_1',					
				disable:true
			},{
				title:'disable:false',				
				content:'This item is available',	
				name:'disable_2'
			}]
		});
		return false;
	});
})
</script> 
<p>
	<a class="btn btn-success disableBtn" href="#">Start Tour</a>
</p>
<p>
	<input type="text" data-name="disable_1" value="Disabled element"></span>
	-
	<input type="text" data-name="disable_2" value="Enabled element"></span>
</p>		
```

* * *

## Overlay Clickable

The parameter "overlayClickable" enables or disables the click event for overlying layer.

[Start Tour](#)

## Source

```
<script src="http://code.jquery.com/jquery-latest.js"></script>
<link rel="stylesheet" href="css/itour.css">
<script src="js/jquery.itour.js"></script>
<script>
$(window).on('load',function(){
	$('.overlayBtn').on('click',function(){	
		$('body').itour({
			tourTitle:'Overlay Clickable',
			overlayClickable:false,
			steps:[{
				title:'overlayClickable:false',				
				content:'Overlay layer is now inactive. If you click on it, the tour will not be closed, as it usually happens.',	
				contentPosition:'center'
			}]
		});
		return false;
	});
})
</script> 
<p>
	<a class="btn btn-success overlayBtn" href="#">Start Tour</a>
</p>
```

* * *

## Cancel button in modal

The parameter "modalCancelVisible" shows a cancel button in modal window.  
The presence of this button is desirable if you turn off a clickability of overlay layer.

[Start Tour](#)

## Source

```
<script src="http://code.jquery.com/jquery-latest.js"></script>
<link rel="stylesheet" href="css/itour.css">
<script src="js/jquery.itour.js"></script>
<script>
$(window).on('load',function(){
	$('.modalCancelVisible').on('click',function(){	
		$('body').itour({
			tourTitle:'Modal Cancel button',
			modalCancelVisible:true,
			steps:[{
				title:'modalCancelVisible:true',				
				content:'You can stop tour by clicking the button in the upper right corner of this modal window.',	
				contentPosition:'center'
			}]
		});
		return false;
	});
})
</script> 
<a class="btn btn-success modalCancelVisible" href="#">Start Tour</a>

```

* * *

## Changing Styles

The parameter "CSSClass" assign for tour a unique class name to change the display styles of the tour.

[Start Tour](#)

Element 1

## Source

```
<script src="http://code.jquery.com/jquery-latest.js"></script>
<link rel="stylesheet" href="css/itour.css">
<script src="js/jquery.itour.js"></script>
<script>
$(window).on('load',function(){
	$('.styleBtn').on('click',function(){	
		$('body').itour({
			CSSClass:'myBlackTheme',
			tourTitle:'Changing Styles',
			steps:[{
				title:'CSSClass: "myBlackTheme"',				
				content:'In this example you can see the modified design of tour.',	
				name:'style_1',		
				overlayOpacity:0.9
			}]
		});
		return false;
	});
})
</script> 
<style>
.myBlackTheme .hContBlock {
	background-color:#000;
	color:#999;
}
.myBlackTheme .hContFooter {
    box-shadow: 0 1px 0 rgba(255, 255, 255, 0.1) inset;
}
.myBlackTheme .hBtn {
	color:#fff
}
.myBlackTheme .hBtn:hover {
	background: rgba(255, 255, 255, 0.2);
}
.myBlackTheme .hNavBtn:hover {
	background: rgba(255, 255, 255, 0.2);
}
.myBlackTheme .hOverlay {
	background-color: #23313F;
}
.myBlackTheme .hContPos::after {
	border-color:#000;
}
.myBlackTheme .hNavPos {
    background-color: #000;
    color: #999;
}
.myBlackTheme .hStepItem {
    color: rgba(255, 255, 255, 0.87);
}
.myBlackTheme .hStepItem:active, 
.myBlackTheme .hStepItem.hCur, 
.myBlackTheme .hClose:active {
    background-color: rgba(255, 255, 255, 0.15);
}
.myBlackTheme .hNavAction {
    border-top: 1px solid rgba(255, 255, 255, 0.1);
}
.myBlackTheme .hNavHeader {
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}
.myBlackTheme .hStepItem::after, 
.myBlackTheme .hStepItem::before {
    background-color: rgba(255, 255, 255, 0.1);
}
.myBlackTheme .hStepItem.hSuccess::after, 
.myBlackTheme .hStepItem.hSuccess::before {
    background-color: #3c0;
}
</style>
<p>
	<a class="btn btn-success styleBtn" href="#">Start Tour</a>
</p>
<p>
	<span data-name="style_1"> Element 1</span>
</p>
```

* * *

## Dynamic Content

You can highlight items that are created in the course of the tour.

Click to create and add a new item into code.

[Create Element](#) [Remove Element](#)

And start your tour.

[Start Tour](#)

## Source

```
<script src="http://code.jquery.com/jquery-latest.js"></script>
<link rel="stylesheet" href="css/itour.css">
<script src="js/jquery.itour.js"></script>
<script>
$(window).on('load',function(){
	$('.dynamicBtn').on('click',function(){	
		$('body').itour({
			tourTitle:'Dynamic Content',
			steps:[{
				title:'Highlight of a new element',				
				content:'Click on it to create another one element' ,	
				name:'#myNewElement_1',
				event:'click'
			},{
				title:'Highlight of a other new element',				
				content:'',	
				name:'#myNewElement_2'
			}]
		});
		return false;
	});
	
	$('.dynamicAdd').on('click',function(){
		if(!$('#myNewElement_1').length){
		
			//Create a new item
			var myNewElement = $('<b id="myNewElement_1">I am a new element. Click me!</b>');
			
			//Add new element in to page
			myNewElement.appendTo('.dynamicWrap');
		}
		return false;	
	})
	
	$('.dynamicRemove').on('click',function(){
		//Remove new element
		$('#myNewElement_1').remove();
		$('#myNewElement_2').remove();
		return false;	
	})
	
	$(document).on('click','#myNewElement_1',function(){
		if(!$('#myNewElement_2').length){
		
			//Create a new item
			var myNewElement_2 = $('<b id="myNewElement_2">I am another one a new element!</b>');
			
			//Add new element in to page
			myNewElement_2.appendTo('.dynamicWrap');
		}
		return false;	
	})
})
</script> 
<style>
#myNewElement_1 {
	border:2px solid green;
	padding:5px;
	cursor:pointer;
}
#myNewElement_2 {
	border:2px solid blue;
	padding:5px;
	cursor:pointer;
	margin-left:30px;
}
</style>
<p>Click to create and add a new item into code.</p>
<p>
	<a class="btn btn-primary dynamicAdd" href="#">Create Element</a>
	<a class="btn btn-warning dynamicRemove" href="#">Remove Element</a>
</p>
<p>And start your tour.</p>
<p>
	<a class="btn btn-success dynamicBtn" href="#">Start Tour</a>
</p>
<div class="dynamicWrap"></div>
```

* * *

## Skip Step

Step can be skipped if you set parameter "skip" to true.

[Start Tour](#)

Element 1 - Element 2 - Element 3

## Source

```
<script src="http://code.jquery.com/jquery-latest.js"></script>
<link rel="stylesheet" href="css/itour.css">
<script src="js/jquery.itour.js"></script>
<script>
$(window).on('load',function(){
	$('.skipBtn').on('click',function(){	
		$('body').itour({
			tourTitle:'Skip Step',
			steps:[{
				title:'Highlight First Element',				
				content:'Any Content' ,	
				name:'#skipElement_1'
			},{
				title:'Highlight Second Element',				
				content:'Any Content',	
				name:'#skipElement_2',
				skip:true
			},{
				title:'Highlight Third Element',				
				content:'Any Content',	
				name:'#skipElement_3'
			}]
		});
		return false;
	});
})
</script> 
<p>
	<a class="btn btn-success skipBtn" href="#">Start Tour</a>
</p>
<p>
	<span id="skipElement_1">Element 1</span>
	-
	<span id="skipElement_2">Element 2</span>
	-
	<span id="skipElement_3">Element 3</span>			
</p>
```

* * *

## Source

```
<script src="http://code.jquery.com/jquery-latest.js"></script>
<link rel="stylesheet" href="css/itour.css">
<script src="js/jquery.itour.js"></script>
<script>
$(window).on('load',function(){
	$('.showAbsentBtn_1').on('click',function(){	
		$('body').itour({
			showAbsentElement:true,
			tourMapVisible:true,
			tourTitle:'showAbsentElement:true',
			steps:[{
				title:'Highlight First Element',				
				content:'Any Content' ,	
				name:'#showAbsentElement_1'
			},{
				title:'Highlight Second Element',				
				content:'Any Content',	
				name:'#showAbsentElement_2'
			},{
				title:'Highlight Third Element',				
				content:'Any Content',	
				name:'#showAbsentElement_3'
			},{
				title:'Highlight Third Element',				
				content:'Any Content',	
				name:'#showAbsentElement_4'
			}]
		});
		return false;
	});
	
	$('.showAbsentBtn_2').on('click',function(){	
		$('body').itour({
			showAbsentElement:false,
			tourMapVisible:true,
			tourTitle:'showAbsentElement:false',
			steps:[{
				title:'Highlight First Element',				
				content:'Any Content' ,	
				name:'#showAbsentElement_1'
			},{
				title:'Highlight Second Element',				
				content:'Any Content',	
				name:'#showAbsentElement_2'
			},{
				title:'Highlight Third Element',				
				content:'Any Content',	
				name:'#showAbsentElement_3'
			},{
				title:'Highlight Third Element',				
				content:'Any Content',	
				name:'#showAbsentElement_4'
			}]
		});
		return false;
	});
	
	
})
</script> 
<style>

</style>
<p>
	<a class="btn btn-success showAbsentBtn_1" href="#">Start Tour with "showAbsentElement: true"</a>
	<a class="btn btn-success showAbsentBtn_2" href="#">Start Tour with "showAbsentElement: false"</a>
</p>
<p>
	<span id="showAbsentElement_1">Element 1</span>
	-
	<span id="showAbsentElement_4">Element 4</span>			
</p>
```

* * *

## Events and Delay

These events can trigger various functions before, during and after the demonstration step of tour.

To save the queue of functions, the events is used in conjunction with "delayBefore" and "delayAfter" parameters

[Start Tour](#)

#### Events:

## Source

```
<script src="http://code.jquery.com/jquery-latest.js"></script>
<link rel="stylesheet" href="css/itour.css">
<script src="js/jquery.itour.js"></script>
<script>
$(window).on('load',function(){
	$('.logWrap').val('');
	var logIndex = 0;
	var logView = function(mess){
		$('.logWrap').val($('.logWrap').val() + '\n'+ (logIndex++) +': '+ mess)
	};
	$('.beforeBtn').on('click',function(){	
		$('body').itour({
			tourTitle:'"before" Event',
			steps:[{
				title:'Step 1',				
				content:'Any Content 1',	
				name:'.logWrap',
				before:function(){
					logView('Step 1: before')
					logView('Step 1: Any function has started')
					setTimeout(function(){
						logView('Step 1: Any function has completed')
					},1000)
				},
				during:function(){
					logView('Step 1: during')
				},
				after:function(){
					logView('Step 1: after')
					logView('Step 1: Any function has started')
					setTimeout(function(){
						logView('Step 1: Any function has completed')
					},1000)
				},
				delayBefore:1300,
				delayAfter:1300
			},{
				title:'Step 2',					
				content:'Any Content 2',	
				name:'.logWrap',
				before:function(){
					logView('Step 2: before')
					logView('Step 2: Any function has started')
					setTimeout(function(){
						logView('Step 2: Any function has completed')
					},1000)
				},
				during:function(){
					logView('Step 2: during')
				},
				after:function(){
					logView('Step 2: after')
					logView('Step 2: Any function has started')
					setTimeout(function(){
						logView('Step 2: Any function has completed')
					},1000)
				},
				delayBefore:1300,
				delayAfter:1300
			}]
		});
		return false;
	});
})
</script> 
<style>
.logWrap {
	width:100%;
	max-width:100%;
	font-size:14px;
	height:400px;
}
.logItem { 
	padding:2px 0; 
	border-top:1px solid #ccc;
}
</style>
<p>
	<a class="btn btn-success beforeBtn" href="#">Start Tour</a>
</p>
<h4>Events:</h4>
<textarea spellcheck="false" class="logWrap"></textarea>
```

* * *

## Video

Description of step may consist of video content

[Start Tour](#)

Any Element 2 - Any Element 1

## Source

```
<script src="http://code.jquery.com/jquery-latest.js"></script>
<link rel="stylesheet" href="css/itour.css">
<script src="js/jquery.itour.js"></script>
<script>
$(window).on('load',function(){
	$('.videoBtn').on('click',function(){	
		$('body').itour({
			tourTitle:'Video Content',
			steps:[{
				title:'Youtube',				
				content:'Any Content 1',	
				name:'#videoElement_1',
				"during":function(){
					var videoTag = '<iframe width="320" height="180" src="https://www.youtube.com/embed/WDFaz98BG1U?rel=0&amp;showinfo=0" frameborder="0" allowfullscreen></iframe>';
					$(".hContImage").html(videoTag);
				}
			},{
				title:'HTML5 Video',				
				content:'Any Content 2',	
				name:'#videoElement_2',
				"during":function(){
					var videoTag = '<video width="320" height="180" controls="controls" poster="video/duel.jpg"><source src="http://www.masscode.ru/files/video/itour.webm" type="video/webm"></video>';
					$(".hContImage").html(videoTag);
				}
			}]
		});
		return false;
	});
})
</script> 
<p>
	<a class="btn btn-success videoBtn" href="#">Start Tour</a>
</p>
<span id="videoElement_1">Any Element 2</span>
-
<span id="videoElement_2">Any Element 1</span>

```

* * *

## Audio

Description of step may consist of Audio content

[Start Tour](#)

Any Element 1

## Source

```
<script src="http://code.jquery.com/jquery-latest.js"></script>
<link rel="stylesheet" href="css/itour.css">
<script src="js/jquery.itour.js"></script>
<script>
$(window).on('load',function(){
	$('.audioBtn').on('click',function(){	
		$('body').itour({
			tourTitle:'Audio Content',
			steps:[{
				title:'HTML5 Audio',				
				content:'Any Content 1',	
				name:'#audioElement_1',
				"during":function(){
					var audioTag = '<div style="margin:15px;"><audio style="width:100%;" src="http://www.masscode.ru/files/audio/Above_and_Beyond.mp3" preload="auto" controls></audio></div>';
					$(".hContImage").html(audioTag);
				}
			}]
		});
		return false;
	});
})
</script> 
<p>
	<a class="btn btn-success audioBtn" href="#">Start Tour</a>
</p>
<span id="audioElement_1">Any Element 1</span>

```

* * *

## Checking the conditions

Function in which you can carry out any verification by clicking on the "Next" button.  
If the function returns True, the step will be switched.  
If the function returns "False", an error message will appear in the message window

[Start Tour](#)

## Source

```
<script src="http://code.jquery.com/jquery-latest.js"></script>
<link rel="stylesheet" href="css/itour.css">
<script src="js/jquery.itour.js"></script>
<script>
$(window).on('load',function(){
	$('.checkBtn').on('click',function(){	
		$('body').itour({
			'showAbsentElement':true,				
			'tourTitle':'Example «Auto Start»',
			'steps':[{
				'title':'Step 1',		
				'content':'Content 1',		
				'name':'.checkEl_1',
				'checkNext': {
					'func': function(){
						if($.trim($('.checkEl_1').val()) == ''){
							return false;
						}else{
							return true;	
						}
					},
					'messageError': 'The field can not be empty!'
				}
			},{
				'title':'Step 2',		
				'content':'Click to Button',		
				'name':'.checkEl_2',
				'event':'click'
			},{
				'title':'Step 3',		
				'content':'Very good! You\'ve done it!',
				'contentPosition':'center'
			}]
		});
		return false;
	});
})
</script> 
<p>
	<a class="btn btn-success checkBtn" href="#">Start Tour</a>
</p>
<input class="checkEl_1" type="text" value=""> 
<input type="button" class="checkEl_2" value="Submit">

```

* * *

## itour & Select2 plugin

Select2 is jQuery replacement for select boxes. Select2 gives you a customizable select box with support for searching, tagging, remote data sets, infinite scrolling, and many other highly used options. [Download Select2](https://github.com/select2/select2/releases)

[Start Tour](#)

First element - Any option 1 - Any option 1 - Another element

## Source

```
<script src="http://code.jquery.com/jquery-latest.js"></script>
<link rel="stylesheet" href="css/itour.css">
<script src="js/jquery.itour.js"></script>

<link href="https://cdnjs.cloudflare.com/ajax/libs/select2/4.0.3/css/select2.min.css" rel="stylesheet" />
<script src="https://cdnjs.cloudflare.com/ajax/libs/select2/4.0.3/js/select2.min.js"></script>		
	
<script>
$(window).on('load',function(){
	
	/*call select2 plugin*/
	$('.mySelect').select2();
	
	/*Fix when you select the already active value*/
	$('.mySelect').on('select2:closing', function (evt) {
		$(this).trigger('change');
	});
	
	/*call itour*/
	$('.testBtn').on('click',function(){
		$('body').itour({
			showAbsentElement:true,
			tourTitle:'Test',
			steps:[{
				title:'This is First element of the tour',	
				name:'#target_1',
				content:'click "next" to continue'
			},{
				title:'This is your First pseudo-select',	
				/*Specify an pseudo-select element (select2)*/
				name:'.mySelect-1 + .select2', 
				content:'Click it',
				/*To open element need "click" event */
				event:'click'
			},{
				title:'This is the available options',	
				/*Specify an element with pseudo-options for highlight*/
				name:'.select2-dropdown',
				content:'Choose an option',
				/*Specify an event "change" and element for this event in array*/
				event:['change',$('.mySelect-1')],
				delayBefore:100,
				before:function(){
					$('.mySelect-1').select2("open"); 
				}
			},{
				title:'This is your Second pseudo-select',	
				/*Specify an pseudo-select element (select2)*/
				name:'.mySelect-2 + .select2', 
				content:'Click it',
				/*To open element need "click" event */
				event:'click'
			},{
				title:'This is the available options',	
				/*Specify an element with pseudo-options for highlight*/
				name:'.select2-dropdown',
				content:'Choose an option',
				/*Specify an event "change" and element for this event in array*/
				event:['change',$('.mySelect-2')],
				delayBefore:100,
				before:function(){
					$('.mySelect-2').select2("open"); 
				}
			},{
				title:'This is another element of the tour',	
				name:'#target_4',
				content:'To complete the tour, click "end"'
			}]
		});
		return false;
	});

})
</script> 
<a class="btn btn-success testBtn" href="#">Start Tour</a>
<p>
	<span id="target_1">First element</span>
	-
	<select class="mySelect mySelect-1">
		<option value="value1">Any option 1</option>
		<option value="value2">Any option 2</option>
		<option value="value3">Any option 3</option>
	</select>
	-
	<select class="mySelect mySelect-2">
		<option value="value1">Any option 1</option>
		<option value="value2">Any option 2</option>
		<option value="value3">Any option 3</option>
	</select>
	-
	<span id="target_4">Another element</span>
</p>			
```

* * *

## itour & jQuery UI Tabs

A single content area with multiple panels, each associated with a header in a list.

Click tabs to swap between content that is broken into logical sections.

[Download jQuery UI](http://jqueryui.com/download/)

[Start Tour](#)

Proin elit arcu, rutrum commodo, vehicula tempus, commodo a, risus. Curabitur nec arcu. Donec sollicitudin mi sit amet mauris. Nam elementum quam ullamcorper ante. Etiam aliquet massa et lorem. Mauris dapibus lacus auctor risus. Aenean tempor ullamcorper leo. Vivamus sed magna quis ligula eleifend adipiscing. Duis orci. Aliquam sodales tortor vitae ipsum. Aliquam nulla. Duis aliquam molestie erat. Ut et mauris vel pede varius sollicitudin. Sed ut dolor nec orci tincidunt interdum. Phasellus ipsum. Nunc tristique tempus lectus.

## Source

```
<script src="http://code.jquery.com/jquery-latest.js"></script>
<link rel="stylesheet" href="css/itour.css">
<script src="js/jquery.itour.js"></script>

<!-- Include jQuery UI -->												
<link rel="stylesheet" href="http://code.jquery.com/ui/1.12.0/themes/base/jquery-ui.css">
<script src="https://code.jquery.com/ui/1.12.0/jquery-ui.js"></script>	
	
<script>
$(window).on('load',function(){
	
	/*call jQuery UI Tabs plugin*/
	$('#tabs').tabs();
	
	/*call itour*/
	$('.tabsBtn').on('click',function(){
		$('body').itour({
			tourTitle:'jQuery UI Tabs',
			steps:[{
				title:'Tab 1 Link',	
				name:'[href="#tabs-1"]',
				content:'Any content',
				trigger:'click'
			},{
				title:'Tab 1 Content',	
				name:'#tabs-1',
				content:'Any content',
				delayBefore:100,
				before:function(){
					$('[href="#tabs-1"]').trigger('click');
				}
			},{
				title:'Tab 2 Link',	
				name:'[href="#tabs-2"]',
				content:'Any content',
				trigger:'click'
			},{
				title:'Tab 2 Content',	
				name:'#tabs-2',
				content:'Any content',
				delayBefore:100,
				before:function(){
					$('[href="#tabs-2"]').trigger('click');
				}
			},{
				title:'Tab 3 Link',	
				name:'[href="#tabs-3"]',
				content:'Any content',
				trigger:'click'
			},{
				title:'Tab 3 Content',	
				name:'#tabs-3',
				content:'Any content',
				delayBefore:100,
				before:function(){
					$('[href="#tabs-3"]').trigger('click');
				}
			}]
		});
		return false;
	});

})
</script> 
<p><a class="btn btn-success tabsBtn" href="#">Start Tour</a></p>

<div id="tabs">
	<ul>
		<li><a class="tab_link" href="#tabs-1">Nunc tincidunt</a></li>
		<li><a class="tab_link" href="#tabs-2">Proin dolor</a></li>
		<li><a class="tab_link" href="#tabs-3">Aenean lacinia</a></li>
	</ul>
	<div id="tabs-1">
		<p>Proin elit arcu, rutrum commodo, vehicula tempus, commodo a, risus. Curabitur nec arcu. Donec sollicitudin mi sit amet mauris. Nam elementum quam ullamcorper ante. Etiam aliquet massa et lorem. Mauris dapibus lacus auctor risus. Aenean tempor ullamcorper leo. Vivamus sed magna quis ligula eleifend adipiscing. Duis orci. Aliquam sodales tortor vitae ipsum. Aliquam nulla. Duis aliquam molestie erat. Ut et mauris vel pede varius sollicitudin. Sed ut dolor nec orci tincidunt interdum. Phasellus ipsum. Nunc tristique tempus lectus.</p>
	</div>
	<div id="tabs-2">
		<p>Morbi tincidunt, dui sit amet facilisis feugiat, odio metus gravida ante, ut pharetra massa metus id nunc. Duis scelerisque molestie turpis. Sed fringilla, massa eget luctus malesuada, metus eros molestie lectus, ut tempus eros massa ut dolor. Aenean aliquet fringilla sem. Suspendisse sed ligula in ligula suscipit aliquam. Praesent in eros vestibulum mi adipiscing adipiscing. Morbi facilisis. Curabitur ornare consequat nunc. Aenean vel metus. Ut posuere viverra nulla. Aliquam erat volutpat. Pellentesque convallis. Maecenas feugiat, tellus pellentesque pretium posuere, felis lorem euismod felis, eu ornare leo nisi vel felis. Mauris consectetur tortor et purus.</p>
	</div>
	<div id="tabs-3">
		<p>Mauris eleifend est et turpis. Duis id erat. Suspendisse potenti. Aliquam vulputate, pede vel vehicula accumsan, mi neque rutrum erat, eu congue orci lorem eget lorem. Vestibulum non ante. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos. Fusce sodales. Quisque eu urna vel enim commodo pellentesque. Praesent eu risus hendrerit ligula tempus pretium. Curabitur lorem enim, pretium nec, feugiat nec, luctus a, lacus.</p>
		<p>Duis cursus. Maecenas ligula eros, blandit nec, pharetra at, semper at, magna. Nullam ac lacus. Nulla facilisi. Praesent viverra justo vitae neque. Praesent blandit adipiscing velit. Suspendisse potenti. Donec mattis, pede vel pharetra blandit, magna ligula faucibus eros, id euismod lacus dolor eget odio. Nam scelerisque. Donec non libero sed nulla mattis commodo. Ut sagittis. Donec nisi lectus, feugiat porttitor, tempor ac, tempor vitae, pede. Aenean vehicula velit eu tellus interdum rutrum. Maecenas commodo. Pellentesque nec elit. Fusce in lacus. Vivamus a libero vitae lectus hendrerit hendrerit.</p>
	</div>
</div>		
```

* * *

## Bootstrap Collapse

[Start Tour](#)

[First Collapse Button](#collapseExample)

Anim pariatur cliche reprehenderit, enim eiusmod high life accusamus terry richardson ad squid. [Hidden button](https://prompt-db.dainedvorak.com/tour-documentation/btn%20btn-primary) Nihil anim keffiyeh helvetica, craft beer labore wes anderson cred nesciunt sapiente ea proident.

## Source

```
<script src="http://code.jquery.com/jquery-latest.js"></script>
<link rel="stylesheet" href="css/itour.css">
<script src="js/jquery.itour.js"></script>

<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0/css/bootstrap.min.css">
<script src="https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0/js/bootstrap.min.js"></script>	
	
<script>
$(window).on('load',function(){
	$('.collapseBtn').on('click',function(){
		$('body').itour({
			showAbsentElement:true,
			tourTitle:'Bootstrap Collapse',
			steps:[{
				title:'First Button',	
				name:'firstCollapseBtn',
				content:'This is First Collapse Button',
			},{
				title:'Hidden Element',	
				name:'hiddenButton', 
				content:'This is hidden button',
				before:function(){
					if($('#collapseExample').is(':hidden')){
						$('[data-name="firstCollapseBtn"]').trigger('click');
					}
				},
			},{
				title:'Second Button',	
				name:'secondCollapseBtn',
				content:'This is Second Collapse Button',
			},{
				title:'Hidden Element',	
				name:'hiddenButton', 
				content:'This is hidden button',
				before:function(){
					if($('#collapseExample').is(':hidden')){
						$('[data-name="firstCollapseBtn"]').trigger('click');
					}
				},
			}]
		});
		return false;
	});
})
</script> 
<p>
	<a class="btn btn-success collapseBtn" href="#">Start Tour</a>
</p>

<a data-name="firstCollapseBtn" class="btn btn-primary" role="button" data-toggle="collapse" href="#collapseExample" aria-expanded="false" aria-controls="collapseExample">
  First Collapse Button
</a>

<button data-name="secondCollapseBtn" class="btn btn-primary" type="button" data-toggle="collapse" data-target="#collapseExample" aria-expanded="false" aria-controls="collapseExample">
  Second Collapse Button
</button>

<div class="collapse" id="collapseExample">
  <div class="well">
    Anim pariatur cliche reprehenderit, enim eiusmod high life accusamus terry richardson ad squid. <a data-name="hiddenButton" href="btn btn-primary">Hidden button</a> Nihil anim keffiyeh helvetica, craft beer labore wes anderson cred nesciunt sapiente ea proident. 
  </div>
</div>	
	
```

* * *

## Source

```
<script src="http://code.jquery.com/jquery-latest.js"></script>
<link rel="stylesheet" href="css/itour.css">
<script src="js/jquery.itour.js"></script>

<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0/css/bootstrap.min.css">
<script src="https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0/js/bootstrap.min.js"></script>	
	
<script>
$(window).on('load',function(){
	$('.modalBtn').on('click',function(){
		$('body').itour({
			showAbsentElement:true,
			tourTitle:'Bootstrap Modal',
			steps:[{
				title:'Step 1 Title',	
				name:'[data-target="#exampleModalCenter"]',
				content:'<p>This is Button trigger modal. It\'s now locked.</p><p>Click "Next" to continue.</p>',
				before:function(){
					$('#exampleModalCenter').modal('hide');
				},
				disable:true
			},{
				title:'Step 2 Title',	
				name:'.modal-content', 
				content:'<p>This is Modal Content. It\'s now locked too.</p><p>Click "Next" to continue.</p>',
				before:function(){
					$('#exampleModalCenter').modal('show');
				},
				delayBefore:300,
				disable:true
			},{
				title:'Step 3 Title',	
				name:'.modal-footer .btn-primary', 
				content:'<p>This is Modal Button.</p><p>Click It to continue.</p>',
				before:function(){
					$('#exampleModalCenter').modal('show');
				},
				delayBefore:300,
				disable:false,
				event:['click',$('.modal-footer .btn-primary')]
			},{
				title:'Step 4 Title',	
				contentPosition:'center',
				content:'<p>Thank you for viewing.</p>',
				before:function(){
					$('#exampleModalCenter').modal('hide');
				}
			}]
		});
		return false;
	});
});
</script> 
<p>
	<a class="btn btn-success modalBtn" href="#">Start Tour</a>
</p>

<!-- Button trigger modal -->
<button type="button" class="btn btn-primary" data-toggle="modal" data-target="#exampleModalCenter">
  Launch demo modal
</button>

<!-- Modal -->
<div class="modal fade" id="exampleModalCenter" tabindex="-1" role="dialog" aria-labelledby="exampleModalCenterTitle" aria-hidden="true">
  <div class="modal-dialog modal-dialog-centered" role="document">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title" id="exampleModalLongTitle">Modal title</h5>
        <button type="button" class="close" data-dismiss="modal" aria-label="Close">
          <span aria-hidden="true">&times;</span>
        </button>
      </div>
      <div class="modal-body">
        Cras mattis consectetur purus sit amet fermentum. Cras justo odio, dapibus ac facilisis in, egestas eget quam. Morbi leo risus, porta ac consectetur ac, vestibulum at eros.
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
        <button type="button" class="btn btn-primary">Save changes</button>
      </div>
    </div>
  </div>
</div>
	
```

## TOUR BUILDER

### General options

### Lang options

### Step options

### Step options

### RESULT CODE

* * *

## Change Log

v.3.2.4  
\- 26/09/2018 Fixed a description of the requirements for a multi-page tour  
\- 21/09/2018 Added a demo with an "tourMapVisible" in different steps  
\- 07/09/2018 Added a demo with an Auto Start and a tour finished flag  
\- 03/09/2018 Fixed a bug with the scroller, which appeared in version 3.2.3  
v.3.2.3  
\- 16/08/2018 Add new sub-parameter for "step" parameter: "checkNext" and "checkPrev". Paremeters in which you can carry out any verification by clicking on the "Next" or "Prev" button.  
v.3.2.2  
\- 18/09/2017 Added new callback function: "abort". [View](https://prompt-db.dainedvorak.com/tour-documentation/documentation.html#Events)  
v.3.2.1  
\- 17/09/2017 Added new callback function: "finish". [View](https://prompt-db.dainedvorak.com/tour-documentation/documentation.html#Events)  
v.3.2.0  
\- 12/05/2017 Fixed conflict of the word "function" in string variable in the page with a multi-page tour  
v.3.1.0  
\- 11/04/2017 Add new sub-parameter for "step" parameter: "stepID". Unique ID Name. This name is assigned to the "html" tag as "data-step" attribute (If not specified, the plugin generates it automatically in the form: "step-N")  
v.3.0.0  
\- 16/03/2017 Fixed position of Message block for mobile devices  
v.2.9.0  
\- 13/01/2017 Added support for special characters like \[,\],{,},(,),^,# and other in page url  
v.2.8.4  
\- 05/10/2016 Fixed text blur for webkit browsers  
v.2.8.3  
\- 27/09/2016 Added support Pinch zoom gestures on touch devices  
v.2.8.2  
\- 23/09/2016 Added "delayAfter" parameter. This parameter set delay before the transition to the next step, ms  
\- 23/09/2016 Parameter "delay" replaced to "delayBefore"  
v.2.8.1  
\- 21/09/2016 Improved examples of tour work together with Select2 and UI Tabs [View](https://prompt-db.dainedvorak.com/tour-documentation/documentation.html#Select2)  
\- 21/09/2016 Added example of tour work together with Bootstrap Collapse [View](https://prompt-db.dainedvorak.com/tour-documentation/documentation.html#Bootstrap_Collapse)  
\- 21/09/2016 Added parameter "delay". This parameter sets the delay before the element searching, ms  
\- 21/09/2016 Fixed work of multi-page tour together with the parameter "tourContinue": false  
\- 21/09/2016 Fixed the events "before", "during" and "after" in the multi-page tour  
v.2.8.0  
\- 15/09/2016 Improved Tour Builder. Now it is much easier to use and pleasing to the eye. [View](https://prompt-db.dainedvorak.com/tour-documentation/documentation.html#Tour_Builder)  
\- 09/09/2016 Added a living example with the using of the tour on a real interface. [View](https://prompt-db.dainedvorak.com/tour-documentation/documentation.html#Websites_using_itour)  
v.2.7.4  
\- 05/09/2016 Fix redirect to another page with the first step.  
v.2.7.3  
\- 05/09/2016 Improved support for iOS.  
v.2.7.2  
\- 02/09/2016 Improved multi-page redirection  
v.2.7.1  
\- 01/09/2016 Added the continue of tour from another page  
\- 01/09/2016 Added parameter "loc" to the Tour Builder  
v.2.7.0  
\- 31/08/2016 Completely rewritten multi-page functional. Added parameter "loc". This parameter set path to the page on which the step should work. And no longer maintained "event":\["redirect","anyPagePath"\]  
v.2.6.0  
\- 30/08/2016 Added parameter "tourMapEnable". With it you can turn off the tour map.  
v.2.5.0  
\- 26/08/2016 Added the ability to multi-page tour  
\- 24/08/2016 Fix for windows 8, 8.1 and 10 versions  
\- 24/08/2016 Added parameter 'tourID'. This parameter allows you to save data with a unique name about tour progress. It can be used to save information on the progress of the tour for several users. Or save the progress of each tour separately  
v.2.4.0  
\- 18/08/2016 Added parameter 'tourContinue'. This parameter add the ability to continue the unfinished tour.  
\- 18/08/2016 Added parameter 'tourMapJump'. If set to false, then links of steps on the tour map will not be clickable.  
\- 18/08/2016 Added example with tabs.  
\- 17/08/2016 Added parameter 'introShow'. If set to true, before the tour you will see the introductory slide, which will offer to see a tour.  
\- 17/08/2016 Added parameter 'introCover'. It adds in intro slide a cover of tour.  
v.2.3.0  
\- 14/08/2016 Added parameter 'textDirection'. The direction property specifies the text direction/writing direction.  
\- 14/08/2016 Added the ability to continue the unfinished tour. If you re-start the same tour, the plugin will display dialog box with a choice of two optiovvns: "Start from beginning" or "Continue"  
\- 14/08/2016 Added parameter "modalCancelVisible". This parameter shows a cancel button in modal window.  
v.2.2.0  
\- 12/08/2016 Added an example of compatibility with a "select2" jquery plugin.  
\- 12/08/2016 Added the ability to pass a foreign jquery object in the "event" parameter. If you want to listen for the event in another element, then use the array construction. (Read "Options")  
v.2.1.0  
\- 10/08/2016 Added ability to skip steps and remove them from the tour map if the target is absent using an "showAbsentElement" parameter.  
\- 10/08/2016 Added ability to skip any step using an "skip" parameter.  
\- 10/08/2016 Added example with dynamic content (dynamic target).  
v.2.0.0  
\- 12/07/2016 In the archive are added localization files.  
\- 11/07/2016 Updated documentation  
\- 11/07/2016 Improved Tour Builder work  
\- 10/07/2016 Added parameter lang, which contains an object with the names of all the elements of the interface  
\- 10/07/2016 Added option "endText", which sets the text for the close button in the last step of the tour  
v.1.2.1  
\- 09/07/2016 Added the ability to assign for each tour a unique class name to change the display styles of the tour.  
\- 09/07/2016 Added the ability to insert the description of the step without title  
\- 09/07/2016 Added parameter "tourMapBtnLabel". The text in the show tour button  
\- 09/07/2016 Added cancellation of the tour by using "Esc" key  
\- 08/07/2016 Added parameter "overlayClikable". This option enables or disables the click event for overlying layer  
\- 08/07/2016 Added parameter "disable" for step item. This parameter blocks access to element  
v.1.2.0  
\- 28/06/2016 In the documentation added the convenience and easy tour builder.  
\- 28/06/2016 Added search elements by class name, id, and other attributes;  
\- 28/06/2016 In the documentation added section "Tour About Tour", which shows the living example of communication with site visitors through the plugin "itour";  
\- 28/06/2016 Added new features: add class to selected item;  
\- 27/06/2016 Added control parameter opacity blackout;  
\- 26/06/2016 Added option to display a message on the center of the screen without being tied to an element;  
\- 26/06/2016 Added parametr to inserting cover image for step;  
v.1.0.1  
\- 24/06/2016 Fixed Position  
v.1.0.0  
\- 19/06/2016 Releas  

* * *

---
Source: https://prompt-db.dainedvorak.com/tour-documentation/documentation.html
Saved: 2026-02-23T18:18:26.230Z
