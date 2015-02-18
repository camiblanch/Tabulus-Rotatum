chrome.tabs.create({url: "options.html"});

// Global Variables - When possible pulling form Local Storage set via Options page.
var activeWindows = new Array();
var timeDelay = 10000;
var currWindowId = -1;
var newTabId = -1;
var moverInterval;

var tabAutostart = false;
if (localStorage["autostart"]) { 
	if (localStorage["autostart"] == 'true') {
		tabAutostart = true;
	} else {
		tabAutostart = false;
	}
}

var urls = [];
if(localStorage["urls"]) {
	urls = JSON.parse(localStorage["urls"]);
}
var urlsIntervals = [];
if(localStorage["urlsIntervals"]) {
	urlsIntervals = JSON.parse(localStorage["urlsIntervals"]);
}

var urlsIndex = 0;
var currTabId = -1;
var nextTabId = -1;

function include(arr,obj) {
    return (arr.indexOf(obj) != -1);
}

function activeInWindow(windowId) {
	for(i in activeWindows) {
		if(activeWindows[i] == windowId) {
			return true;
		}
	}
}

// Setup Initial Badge Text
var badgeColor = [139,137,137,137];
chrome.browserAction.setBadgeBackgroundColor({color: badgeColor});

// Called when the user clicks on the browser action.
chrome.browserAction.onClicked.addListener(function(tab) {
	var windowId = tab.windowId;
	currWindowId = tab.windowId;
	if (activeInWindow(windowId)) {
		stop(windowId);
	} else {
		go(windowId);
	}
});	

function badgeTabs(windowId, text) {
	chrome.tabs.getAllInWindow(windowId, function(tabs) {
		for(i in tabs) {
			switch (text)
			{
			case 'on':
			  chrome.browserAction.setBadgeText({text:"\u2022"});
			  chrome.browserAction.setBadgeBackgroundColor({color:[0,255,0,100]});
			  break;
			case '':
			  chrome.browserAction.setBadgeText({text:"\u00D7"});
			  chrome.browserAction.setBadgeBackgroundColor({color:[255,0,0,100]});
			  break;
			default:
			  chrome.browserAction.setBadgeText({text:""});
			}
		}	
	});
}

// Start on a specific window
function go(windowId) {
	chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
		clearInterval(moverInterval);
		console.log("Listener triggered");
		if(tab.status == 'complete') {
			console.log("Tab loaded");
			newTabId = tab;
			var intervalIndex = urlsIndex - 2;
			if(intervalIndex < 0) {
				intervalIndex = urls.length + intervalIndex;
			}
			var delay = urlsIntervals[intervalIndex] * 1000;
			console.log("This tab will be shown for " + urlsIntervals[intervalIndex] + " seconds.");
			moverInterval = setInterval(function() { moveTab2() }, delay);
		}
	});
	activeWindows.push(windowId);
	badgeTabs(windowId, 'on');
	moveTab();
}

// Stop on a specific window
function stop(windowId) {
	clearInterval(moverInterval);
    console.log('Stopped.');
    chrome.tabs.onUpdated.removeListener();
	var index = activeWindows.indexOf(windowId);
	if(index >= 0) {
		activeWindows.splice(index);
		badgeTabs(windowId, '');
	}
}

// Switches to next URL in list, loops.
function moveTab() {
	console.log("In moveTab() function");
	badgeTabs(currWindowId, 'on');
	chrome.tabs.create({
		url: urls[urlsIndex], 
		selected: false
	});
	urlsIndex++;
	if(urlsIndex == urls.length) {
		urlsIndex = 0;
	}
	clearInterval(moverInterval);
}

// Deletes the current tab.
function moveTab2() {
	console.log("In moveTab2() function");
	chrome.tabs.query( {
		windowId: currWindowId
	}, function(tabs2) {
		chrome.tabs.remove(tabs2[0].id);
		moveTab();
	});
}
// Autostart function, procesed on initial startup.
if(tabAutostart) {
	chrome.tabs.query({'active': true, 'windowId': chrome.windows.WINDOW_ID_CURRENT},
		function(tabs){
			//Start Revolver Tabs in main window.
			go(tabs[0].windowId);
		}
	);
}
