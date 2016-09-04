var bg = chrome.extension.getBackgroundPage();
// Saves options to localStorage.
function save_options() {
  bg.firstPlay = true;
  if (document.getElementById("autostart").checked == true) {
    localStorage.autostart = 'true';
    bg.tabAutostart = true;
  } else {
    localStorage.autostart = 'false';
    bg.tabAutostart = false;
  }

  localStorage.waittime = document.getElementById("waittime").value;
  localStorage.refreshList = document.getElementById("refreshList").value;
  bg.waitTime = localStorage.waittime;

  localStorage.loadurl = document.getElementById("loadurl").value;

  if (document.getElementById("autoloadurls").checked == true) {
    localStorage.autoloadurls = 'true';
    localStorage.loadurl = document.getElementById("loadurl").value;
    load_urls();
  } else {
    localStorage.autoloadurls = 'false';
    saveUrlsAndIntervals();
  }

  if (document.getElementById("showoptions").checked == true) {
    localStorage.showoptions = 'true';
    bg.tabAutostart = true;
  } else {
    localStorage.showoptions = 'false';
    bg.tabAutostart = false;
  }

  // Update status to let user know options were saved.
  var status = document.getElementById("status");
  var status2 = document.getElementById("status2");
  status.innerHTML = "OPTIONS SAVED";
  status2.innerHTML = "OPTIONS SAVED";
  setTimeout(function () {
    status.innerHTML = "";
    status2.innerHTML = "";
  }, 1000);
}

// Restores saved values from localStorage.
function restore_options() {
  if (localStorage.autostart) {
    document.getElementById("autostart").checked = (localStorage.autostart == 'true');
  } else {
    document.getElementById("autostart").checked = false;
  }
  if (localStorage.waittime) {
    dropDown = document.getElementById("waittime");
    for (var i = 0; i < dropDown.options.length; i++) {
      if (dropDown.options[i].text === localStorage.waittime) {
        dropDown.selectedIndex = i;
        break;
      }
    }
  }
  if (localStorage.refreshList) {
    dropDown = document.getElementById("refreshList");
    for (var i = 0; i < dropDown.options.length; i++) {
      if (dropDown.options[i].value === localStorage.refreshList) {
        dropDown.selectedIndex = i;
        break;
      }
    }
  }

  if (localStorage.loadurl) {
    document.getElementById("loadurl").value = localStorage.loadurl;
  }
  if (localStorage.autoloadurls) {
    if (localStorage.autoloadurls == 'true') {
      document.getElementById("autoloadurls").checked = true;
      load_urls();
    } else {
      document.getElementById("autoloadurls").checked = false;
      var urlsLoad;
      var urlsIntervalsLoad;
      if (localStorage.urls && localStorage.urlsIntervals) {
        urlsLoad = JSON.parse(localStorage.urls);
        urlsIntervalsLoad = JSON.parse(localStorage.urlsIntervals);
        var urlsString = '';
        for (var i = 0; i < urlsLoad.length; i++) {
          urlsString += urlsIntervalsLoad[i] + ";" + urlsLoad[i] + "\n";
        }
        document.getElementById("urls").value = urlsString;
      } else {
        document.getElementById("urls").value = "";
        document.getElementById("urlsIntervals").value = "";
      }
    }
  } else {
    document.getElementById("autoloadurls").checked = false;
  }
  if (localStorage.showoptions) {
    document.getElementById("showoptions").checked = (localStorage.showoptions == 'true');
  } else {
    document.getElementById("showoptions").checked = true;
    localStorage.showoptions = 'true';
  }
}

// Loads the URLs and intervals from text loaded from a URL
function load_urls() {
  var xmlhttp = new XMLHttpRequest();
  var url = document.getElementById("loadurl").value;
  if (url !== "") {
    xmlhttp.onreadystatechange = function () {
      if (xmlhttp.readyState == 4) {
        localStorage.loadurl = document.getElementById("loadurl").value;
        document.getElementById("urls").value = xmlhttp.responseText;
        saveUrlsAndIntervals();
      }
    };

    xmlhttp.open("GET", url, true);
    xmlhttp.send(null);
  }
}

function saveUrlsAndIntervals() {
  document.getElementById('urls').value =
    saveUrlsAndIntervalsFromString(document.getElementById('urls').value);
}

// Adding listeners for restoring and saving options
document.getElementById('load').addEventListener('click', load_urls);
document.addEventListener('DOMContentLoaded', restore_options);
document.querySelector('#save').addEventListener('click', save_options);
document.querySelector('#savetop').addEventListener('click', save_options);
