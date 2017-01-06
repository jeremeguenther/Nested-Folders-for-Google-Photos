function updateSetting(sObj) {
	obj = document.getElementById(sObj);
        if(sObj.indexOf("chk_") > -1) obj.value = obj.checked;

	// save it using the Chrome extension storage API
	var saveObj = {};
	saveObj[sObj] = obj.value;
	chrome.storage.sync.set(saveObj, function () {
		console.log("setting: " + sObj + " = " + obj.value);
	});
	//localStorage[sObj] = obj.value;
}

function loadSettings() {
	chrome.storage.sync.get(null, function (val) {
		document.getElementById('chk_SortAddToAlbum').checked = (val.chk_SortAddToAlbum=="false") ? 0 : 1;
		document.getElementById('chk_ReSortAddToAlbum').checked = (val.chk_ReSortAddToAlbum=="false") ? 0 : 1;
		document.getElementById('chk_CaseSensitiveSort').checked = (val.chk_CaseSensitiveSort=="false") ? 0 : 1;
		document.getElementById('txt_NumErrorRetries').value = (val.txt_NumErrorRetries==undefined) ? 4 : val.txt_NumErrorRetries;
		document.getElementById('txt_NumScrollAttempts').value = (val.txt_NumScrollAttempts==undefined) ? 10 : val.txt_NumScrollAttempts;
		document.getElementById('txt_DelayScrollSeconds').value = (val.txt_DelayScrollSeconds==undefined) ? 2 : val.txt_DelayScrollSeconds;
	});
}






// Add event listeners once the DOM has fully loaded by listening for the
// `DOMContentLoaded` event on the document, and adding your listeners to
// specific elements when it triggers.
document.addEventListener('DOMContentLoaded', function () {
  document.getElementById('chk_SortAddToAlbum').addEventListener('change', function(){updateSetting('chk_SortAddToAlbum');}, false );
  document.getElementById('chk_ReSortAddToAlbum').addEventListener('change', function(){updateSetting('chk_ReSortAddToAlbum');}, false );
  document.getElementById('chk_CaseSensitiveSort').addEventListener('change', function(){updateSetting('chk_CaseSensitiveSort');}, false );
  document.getElementById('txt_NumErrorRetries').addEventListener('change', function(){
		if(parseInt(document.getElementById('txt_NumErrorRetries').value).toString()=='NaN') 
			alert('Error Retries must be a number'); 
		else 
			updateSetting('txt_NumErrorRetries');
	}, false );
  document.getElementById('txt_NumScrollAttempts').addEventListener('change', function(){
		if(parseInt(document.getElementById('txt_NumScrollAttempts').value).toString()=='NaN') 
			alert('Scroll Attempts must be a number'); 
		else 
			updateSetting('txt_NumScrollAttempts');
	}, false );
  document.getElementById('txt_DelayScrollSeconds').addEventListener('change', function(){
		if(parseInt(document.getElementById('txt_DelayScrollSeconds').value).toString()=='NaN') 
			alert('Delay seconds must be a number'); 
		else 
			updateSetting('txt_DelayScrollSeconds');
	}, false );
	
  loadSettings();
});