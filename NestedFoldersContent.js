

/*
* Creating javascript to be used on the main page.
*/
var html_head = document.getElementsByTagName('head')[0];
var _js = document.createElement('script');
_js.setAttribute('type', 'text/javascript');
_js.setAttribute('id', 'nestedjavascript');
html_head.appendChild(_js);
document.getElementById('nestedjavascript').innerHTML = ""+
	"function showSubAlbums(loc) { " +
	"	window.postMessage({ type: 'FROM_PAGE', text: loc }, '*');" +
	"	return true;" +
	" } ";

//var port = chrome.extension.connect();



window.addEventListener("message", function(event) {
    // We only accept messages from ourselves
    if (event.source != window) return;
	displaySubAlbums(event.data.text); // needed to make the back link work

	//console.log("Content script received: " + event.data.source);

    //if (event.data.type && (event.data.type == "FROM_PAGE")) {
	  //port.postMessage(event.data.text); // send data to the background.js?
    //}
}, false);

// capture clicks so we can navigate to sub albums
window.addEventListener("click", function(event) {
	// handle capturing 'Add to album' click, wait for box to popup then sort it.
	if(_NFSettings.SortAddToAlbum == true && event.target.innerHTML == 'Album') setTimeout(function(){sortAddToAlbum();}, 2000);
	// refresh the album if the user clicks on the Albums button
	if(event.target.innerHTML == 'Albums') {
		clearTimeout(tmrURLCheck);
		tmrURLCheck = setInterval(function(){checkURL();}, 1000);
	}

	// handle drilling into sub albums on photos tab
	var param = '';
	if(event.target.id.indexOf('albumNF') > -1) param = event.target.childNodes[0].getAttribute("data-nf_path");
	if(event.target.id.indexOf('imageNF') > -1) param = event.target.childNodes[0].getAttribute("data-nf_path");
	if(event.target.id.indexOf('spanNF') > -1) param = event.target.getAttribute("data-nf_path");
	if(param.indexOf('(s)') > -1) displaySubAlbums(param.replace('(s)',''));
	else if(param.length > 0) redirectToAlbum(event.target.id);
}, false);

/*
* Start the main modifications of the page.
*   Array positions:
*  0 - Name of the album with /
*  1 - Node itself
*  2 - Name split into an array
*  3 - Original URL of the album
*/

console.log('The Google Photos Nested Folders is running.');

var divAlbums = null;
var length = 0; 
var aAlbums = new Array();
var _aback = document.createElement('div');
var _abacklink = '';
var _debug = 0;
var mainBodyDivHeight = 0;

var iTries = 0;
function GetStarted() {

	divAlbums = document.querySelectorAll('[jsname=edfd3]'); // get base album div
	if(_debug == 1) console.log('rootname:'+divAlbums.id);
	// make sure page has loaded first
	if(typeof(divAlbums) == 'undefined' || divAlbums[0] == null) {
		iTries += 1;
		if(iTries < _NFSettings.NumErrorRetries) setTimeout(function(){GetStarted();}, 1000); // only try 4 times
		return;
	}
	divAlbums = divAlbums[0];

	if(typeof(divAlbums) == 'undefined') { // check again to make sure the sub structure has loaded
		iTries += 1;
		if(iTries < _NFSettings.NumErrorRetries) setTimeout(function(){GetStarted();}, 1000); // only try 4 times
		return;
	}
	
	// scroll to bottom of main div so Google loads all albums
	var divMainBody = divAlbums.parentNode.parentNode.parentNode.parentNode;
	if(mainBodyDivHeight == 0 || mainBodyDivHeight != divMainBody.scrollHeight) {
		iTries += 1;
		mainBodyDivHeight = divMainBody.scrollHeight;
		divMainBody.scrollTop = mainBodyDivHeight;
			// come back in two seconds and see if the height has changed
		if(iTries < _NFSettings.NumScrollAttempts) setTimeout(function() {GetStarted();}, _NFSettings.DelayScrollSeconds*1000);
		return;
	}

	iTries = 0;

	
	length = divAlbums.childNodes.length; 

	// Loop through each album, unless the script is still loaded
	if(_debug == 1) console.log('all album:'+length);
	var idx = 0;
	for(var i = 0; i < length; i++) {
		if(divAlbums.childNodes[i].tagName == 'A') {
			aAlbums[idx] = new Array();
			aAlbums[idx][0] = divAlbums.childNodes[i].childNodes[2].childNodes[0].innerText; // get the album name
			aAlbums[idx][1] = divAlbums.childNodes[i]; // keep the node itself
			aAlbums[idx][2] = new Array()
			aAlbums[idx][2] = aAlbums[idx][0].split('/');

			aAlbums[idx][3] = aAlbums[idx][1].href; // hyperlink to the actual albumn
			aAlbums[idx][4] = aAlbums[idx][1].childNodes[0]; // get the image div
			aAlbums[idx][4].id = 'imageNF_';
			aAlbums[idx][5] = aAlbums[idx][1].childNodes[2].childNodes[1].innerText; // get the album statistics

			// create div that we can work with
			var dv = document.createElement('div');
			var sText = '<span style="word-wrap:break-word;font-weight:bold;color:white;position:absolute;bottom:0px;" id="spanNF_">' + aAlbums[idx][0];
			if(aAlbums[idx][0].indexOf('/') == -1) sText += '<br />' + aAlbums[idx][5];
			sText += '</span>';
			dv.innerHTML = sText; // make desired content
			dv.style.backgroundImage = aAlbums[idx][4].style.backgroundImage;
			dv.style.backgroundRepeat = "no-repeat";
			dv.style.backgroundSize = "194px 180px";
			dv.id = 'albumNF_';
			dv.style.width = '194px';
			dv.style.height = '180px';
			dv.style.margin = '10px';
			dv.style.float = 'left';
			dv.style.position = 'relative';
			aAlbums[idx][1] = dv; // store the new element
			idx += 1;
		}
	}

	aAlbums.sort(); // alphabetise the album data;
	divAlbums.innerHTML = '';

	// have to set the id's after the sort otherwise they won't match the correct index
	for(var i = 0; i < aAlbums.length; i++) {
		if(_debug == 1) console.log('setid:'+i);
		aAlbums[i][1].innerHTML = aAlbums[i][1].innerHTML.replace('NF_','NF_'+i);
		aAlbums[i][1].id = aAlbums[i][1].id.replace('NF_','NF_'+i);
		divAlbums.appendChild(aAlbums[i][1]); // alphabetise the albums on screen
	}
	
	// create the back link
	_aback.setAttribute('id', 'subAlbumsBack');
	_aback.setAttribute('style', 'display:none;');
	_aback.innerText = 'Back a Level';
	_aback.addEventListener('click', function() {displaySubAlbums(_abacklink);});
	
	divAlbums.appendChild(_aback, divAlbums.firstChild);

	displaySubAlbums("");
	
	// report usage to google analytics
	let request = new XMLHttpRequest();
	let message = "v=1&tid=UA-6097089-11&cid=nested79-1a05-49d7-b876-2b884d0f825b&aip=1&ds=add-on&t=event&ec=AAA&ea=folders";
	request.open("POST", "https://www.google-analytics.com/collect", true);
	request.send(message);
}

function displaySubAlbums(sLevel) {

	var aLevels = sLevel.split('/');
	var iLevels = aLevels.length - 1;
	var sLast = "";

	// modify the back link
	_abacklink = combineLevels(aLevels, aLevels.length-2);
	if(sLevel == "") _aback.setAttribute('style', 'display:none;');
	else _aback.setAttribute('style', 'clear:both;cursor:pointer;');

	if(_debug == 1) console.log('displaysub');

	for(var i = 0; i < aAlbums.length; i++) {
		if(sLevel == "") {
				// put node back in original state.
				aAlbums[i][1].style.display = 'block'; //.removeAttribute('style');
				aAlbums[i][1].childNodes[0].innerHTML = aAlbums[i][0] + '<br />' + aAlbums[i][5];
				aAlbums[i][1].childNodes[0].setAttribute("data-nf_path", aAlbums[i][0] + '<br />' + aAlbums[i][5]);
			if(sLast == aAlbums[i][2][0]) {
				aAlbums[i][1].style.display = 'none';
			} else if(aAlbums[i][0].indexOf('/') > -1) {
				aAlbums[i][1].childNodes[0].innerText = aAlbums[i][2][0] + "(s)";
				aAlbums[i][1].childNodes[0].setAttribute("data-nf_path", aAlbums[i][2][0] + "(s)");
			}
			sLast = aAlbums[i][2][0];
		} else {
			if(sLast == combineLevels(aAlbums[i][2], aLevels.length)) {
				// get rid of albums that are children
				aAlbums[i][1].style.display = 'none';
			} else if(aAlbums[i][0] == sLevel || (aAlbums[i][0].indexOf(sLevel) == 0 && aAlbums[i][2].length-1 == aLevels.length && (i == aAlbums.length-1 || aAlbums[i+1][0].indexOf(aAlbums[i][0]) == -1))) {
				// put node back in original state.
				aAlbums[i][1].style.display = 'block';
				var viewText = (typeof aAlbums[i][2][aLevels.length] == 'undefined') ? aAlbums[i][2][aLevels.length-1] : aAlbums[i][2][aLevels.length];
				aAlbums[i][1].childNodes[0].innerHTML = viewText + '<br />' + aAlbums[i][5];
				aAlbums[i][1].childNodes[0].setAttribute("data-nf_path", aAlbums[i][0] + '<br />' + aAlbums[i][5]);
			} else if(aAlbums[i][0].indexOf(sLevel) == 0) {
				// make album into parent node
				aAlbums[i][1].style.display = 'block';
				aAlbums[i][1].childNodes[0].innerText = aAlbums[i][2][aLevels.length] + "(s)";
				aAlbums[i][1].childNodes[0].setAttribute("data-nf_path", combineLevels(aAlbums[i][2], aLevels.length) + "(s)");
			} else {
				// get rid of all other albums
				aAlbums[i][1].style.display = 'none';
			}
			sLast = combineLevels(aAlbums[i][2], aLevels.length);
		}
	}
} // displaySubAlbums

function combineLevels(aAlb, iCount) {
	var sRet = "";
	for(var i = 0; i <= iCount; i++) {
		if(aAlb.length > i) {
			if(sRet != "") sRet += "/";
			sRet += aAlb[i];
		}
	}

	return sRet;
} // combineLevels




function redirectToAlbum(param) {
	if(_debug == 1) console.log('album id='+param);
	var albumIdx = param.split('_')[1];
	window.location = aAlbums[albumIdx][3];
}

// can't capture Google's pushState event so must check periodically.
var bURL = true;
var tmrURLCheck = setInterval(function(){checkURL();}, 1000);
function checkURL() {
	if (/photos.google.com\/albums$/.test(document.URL) == false && bURL == true) { bURL = false; console.log('false'); }
	if (/photos.google.com\/albums$/.test(document.URL) && bURL == false) {
		bURL = true;
		iTries = 0;
		GetStarted();
	}
	
}























/*
Code to sort the "Add to album" popup.
when a user has too many albums it can
be a nightmare trying to find them in the
date sorted environment that Google uses.
*/




var iSTries = -1;
var baseAddToAlbumsElement = null;
var baseAddToAlbumsElementHeight = 0;
function sortAddToAlbum() {
	var elems = document.getElementsByClassName('pXeIKc KUe8L');
	// make sure popup has loaded first
	if(_debug == 1) console.log('base sort elems length:'+elems.length);
    if(elems == null) {
		iSTries += 1;
		if(iSTries == 4) setTimeout(function(){sortAddToAlbum();}, 1000); // only try 4 times
		return;
	}

	var baseElem = baseAddToAlbumsElement = elems[0];

	if(_debug == 1) console.log('sort child length:'+baseElem.childNodes.length);
	var aElems = new Array();
	for(var i = 0; i < baseElem.childNodes.length-1; i++) { // start at elem 1 since 0 is the New Album textbox
		aElems[i] = new Array();
		
		// if image has already been removed then this node was processed before
		if(baseElem.childNodes[i+1].childNodes[1].childNodes[1] == null) {
			aElems[i][0] = baseElem.childNodes[i+1].childNodes[1].childNodes[0].childNodes[0].innerText; // get the album name
			aElems[i][1] = baseElem.childNodes[i+1]; // keep the node itself
		} 
		// process node for first time
		else {
			aElems[i][0] = baseElem.childNodes[i+1].childNodes[1].childNodes[1].childNodes[0].innerText; // get the album name
			aElems[i][1] = baseElem.childNodes[i+1]; // keep the node itself
			aElems[i][1].childNodes[1].removeChild(aElems[i][1].childNodes[1].firstChild); // remove image to speed things up
			aElems[i][1].style.width='600px';
			aElems[i][1].style.opacity='1';
			aElems[i][1].childNodes[1].style.width='600px';
		}
	}
	
	// alphabetise the album data;
	if(_NFSettings.CaseSensitiveSort == true)
		aElems.sort(); 
	else {
		aElems.sort(function (a, b) {
			return a.toLowerCase().localeCompare(b.toLowerCase());
		});
	}
		
	// save the "New album" node
	var firstElem = new Array();
	firstElem[1] = baseElem.childNodes[0]; // keep the node itself
	aElems.splice(0,0,firstElem);
	
	// clear out the div tag; can't use innerHTML='' as it screws up the DOM
	while( baseElem.hasChildNodes() ){
		baseElem.removeChild(baseElem.lastChild);
	}
	// add the new alphabetized nodes
	for(var i = 0; i < aElems.length; i++) { // start at elem 1 since 0 is the New Album textbox
		baseElem.appendChild(aElems[i][1]);
	}
	baseAddToAlbumsElementHeight = baseAddToAlbumsElement.parentElement.scrollHeight;
	
	// add a scroll monitor for long lists that google auto updates as they scroll
	if(baseElem.parentElement != null && _NFSettings.ReSortAddToAlbum == true) {
		baseElem.parentElement.addEventListener("scroll", addToAlbumRefresh)
	}
	if(_debug == 1) console.log('scrollY:'+baseElem.parentElement.scrollTop+':height:'+baseElem.parentElement.clientHeight)
}


function addToAlbumRefresh() {
	if(baseAddToAlbumsElement != null && baseAddToAlbumsElement.parentElement != null) {
		// check to see if google has added albums to the list, when the user scrolls to the bottom.
		if(baseAddToAlbumsElement.parentElement.scrollHeight != baseAddToAlbumsElementHeight) 
		{
			if(_debug == 1) console.log('resorting old length:'+baseAddToAlbumsElementHeight + ': new length:' + baseAddToAlbumsElement.parentElement.scrollHeight);
			sortAddToAlbum();
		}
	}
}

















/*
THE SETTING SECTION OF THE CODE
*/





//chrome.extension.sendRequest({method: "getLocalStorage"}, function(response) {
//	console.log(response.data);
//	for (var key in response.data) {
//		console.log(key);
//		localStorage[key] = response.data[key];
//	}
//});

// the settings object
function NFSettings() {
	this.SortAddToAlbum = true;
	this.ReSortAddToAlbum = true;
	this.CaseSensitiveSort = true;
	this.NumErrorRetries = 4;
	this.NumScrollAttempts = 10;
	this.DelayScrollSeconds = 2;
}
var _NFSettings = new NFSettings();

// disable sorting if desired.
chrome.storage.sync.get(null, function (val) {
	if(val.chk_SortAddToAlbum == "false") _NFSettings.SortAddToAlbum = false;
	if(val.chk_ReSortAddToAlbum == "false") _NFSettings.ReSortAddToAlbum = false;
	if(val.chk_CaseSensitiveSort == "false") _NFSettings.CaseSensitiveSort = false;
	if(val.txt_NumErrorRetries != undefined) _NFSettings.NumErrorRetries = parseInt(val.txt_NumErrorRetries);
	if(val.txt_NumScrollAttempts != undefined) _NFSettings.NumScrollAttempts = parseInt(val.txt_NumScrollAttempts);
	if(val.txt_DelayScrollSeconds != undefined) _NFSettings.DelayScrollSeconds = parseInt(val.txt_DelayScrollSeconds);
});










GetStarted(); // kick the whole thing off after everything has loaded