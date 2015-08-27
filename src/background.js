chrome.tabs.create({url: "options.html"});

// Global Variables - When possible pulling form Local Storage set via Options page.
var activeWindows = [];
var currWindowId = -1;
var newTabId = -1;
var moverInterval;
var pauseInterval = [];
var paused = false;
var firstPause = true;
var firstPlay = true;

var tabAutostart = false;
if (localStorage.autostart) {
  tabAutostart = (localStorage.autostart == 'true');
}
var waitTime = 0;
if (localStorage.waittime) {
  waitTime = localStorage.waittime;
}

var urls = [];
if (localStorage.urls) {
  urls = JSON.parse(localStorage.urls);
}
var urlsIntervals = [];
if (localStorage.urlsIntervals) {
  urlsIntervals = JSON.parse(localStorage.urlsIntervals);
}

var urlsIndex = 0;

function activeInWindow(windowId) {
  for (var i in activeWindows) {
    if (activeWindows.hasOwnProperty(i)) {
      if (activeWindows[i] == windowId) {
        return true;
      }
    }
  }
}

function mouseMovedListener(request) {
  if (request.movement == "MOUSEMOVED") {
    if (moverInterval) {
      clearInterval(pauseInterval[0]);
      pauseInterval.splice(0, 1);
      paused = true;
      stop(currWindowId, waitTime);
    }
  }
}

// Setup Initial Badge Text
var badgeColor = [139, 137, 137, 137];
chrome.browserAction.setBadgeBackgroundColor({color: badgeColor});

// Called when the user clicks on the browser action.
chrome.browserAction.onClicked.addListener(function (tab) {
  var windowId = tab.windowId;
  currWindowId = tab.windowId;
  if (activeInWindow(windowId)) {
    paused = false;
    clearInterval(pauseInterval[0]);
    pauseInterval.splice(0, 1);
    chrome.runtime.onMessage.removeListener(mouseMovedListener);
    stop(currWindowId);
  } else {
    go(currWindowId);
  }
});

function badgeTabs(text) {
  switch (text) {
    case 'on':
      chrome.browserAction.setBadgeText({text: "\u2022"});
      chrome.browserAction.setBadgeBackgroundColor({color: [0, 255, 0, 100]});
      if (firstPlay) {
        firstPlay = false;
        if (waitTime > 0) {
          chrome.runtime.onMessage.addListener(mouseMovedListener);
        } else {
          chrome.runtime.onMessage.removeListener(mouseMovedListener);
        }
      }
      firstPause = true;
      break;
    case '':
      chrome.browserAction.setBadgeText({text: "\u00D7"});
      chrome.browserAction.setBadgeBackgroundColor({color: [255, 0, 0, 100]});
      if (firstPause) {
        // Set the urlsIndex back so we don't skip over a url when we hit start
        if (urlsIndex > 0) {
          urlsIndex--;
        } else {
          urlsIndex = urls.length - 1;
        }
        firstPause = false;
      }
      break;
    default:
      chrome.browserAction.setBadgeText({text: ""});
  }
}

// Start on a specific window
function go(windowId) {
  clearInterval(pauseInterval[0]);
  pauseInterval.splice(0, 1);
  if (urls.length > 0) {
    chrome.tabs.query({
      'active': false,
      'windowId': currWindowId
    }, function (currTabs) {
      for (i = 0; i < currTabs.length; i++) {
        chrome.tabs.remove(currTabs[i].id);
      }
    });
    chrome.tabs.onUpdated.addListener(startTimer);
    if (paused) {
      paused = false;
    } else {
      activeWindows.push(windowId);
    }
    badgeTabs('on');
    moveTab();
  }
}

function startTimer(tabId, changeInfo, tab) {
  clearInterval(moverInterval);
  if (tab.status == 'complete') {
    newTabId = tab;
    var intervalIndex = urlsIndex - 2;
    if (intervalIndex < 0) {
      intervalIndex = urls.length + intervalIndex;
    }
    var delay = urlsIntervals[intervalIndex] * 1000;
    moverInterval = setInterval(function () {
      moveTab2()
    }, delay);
  }
}

// Stop on a specific window
function stop(windowId, seconds) {
  clearInterval(moverInterval);
  chrome.tabs.onUpdated.removeListener(startTimer);
  var index = activeWindows.indexOf(windowId);
  if (index >= 0) {
    badgeTabs('');
    if (seconds) {
      console.log("Pausing");
      pauseInterval.push(
        setInterval(function () {
          go(windowId);
        }, seconds * 1000));
    } else {
      activeWindows.splice(index);
    }
  }

}

// Switches to next URL in list, loops.
function moveTab() {
  badgeTabs('on');
  chrome.tabs.create({
    url: urls[urlsIndex],
    selected: false
  });
  urlsIndex++;
  if (urlsIndex == urls.length) {
    urlsIndex = 0;
  }
  clearInterval(moverInterval);
}

// Deletes the current tab.
function moveTab2() {
  clearInterval(pauseInterval[0]);
  pauseInterval.splice(0, 1);
  chrome.tabs.query({
    windowId: currWindowId
  }, function (tabs2) {
    chrome.tabs.remove(tabs2[0].id);
    moveTab();
  });
}

// Autostart function, procesed on initial startup.
if (tabAutostart) {
  chrome.tabs.query({'active': true, 'windowId': chrome.windows.WINDOW_ID_CURRENT},
    function (tabs) {
      //Start in main window.
      go(tabs[0].windowId);
    }
  );
}