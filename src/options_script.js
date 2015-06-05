var bg = chrome.extension.getBackgroundPage();
// Saves options to localStorage.
function save_options() {
  if (document.getElementById("autostart").checked == true) {
    localStorage["autostart"] = 'true';
    bg.tabInactive = true;
  } else {
    localStorage["autostart"] = 'false';
    bg.tabInactive = false;
  }

  localStorage["loadurl"] = document.getElementById("loadurl").value;

  if (document.getElementById("autoloadurls").checked == true) {
    localStorage["autoloadurls"] = 'true';
    localStorage["loadurl"] = document.getElementById("loadurl").value;
    load_urls();
  } else {
    localStorage["autoloadurls"] = 'false';
    saveUrlsAndIntervals();
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
  if (localStorage["autostart"]) {
    if (localStorage["autostart"] == 'true') {
      document.getElementById("autostart").checked = true;
    } else {
      document.getElementById("autostart").checked = false;
    }
  } else {
    document.getElementById("autostart").checked = false;
  }
  if (localStorage["loadurl"]) {
    document.getElementById("loadurl").value = localStorage["loadurl"];
  }
  if (localStorage["autoloadurls"]) {
    if (localStorage["autoloadurls"] == 'true') {
      document.getElementById("autoloadurls").checked = true;
      load_urls();
    } else {
      document.getElementById("autoloadurls").checked = false;
      var urlsLoad;
      var urlsIntervalsLoad;
      if (localStorage["urls"] && localStorage["urlsIntervals"]) {
        urlsLoad = JSON.parse(localStorage["urls"]);
        urlsIntervalsLoad = JSON.parse(localStorage["urlsIntervals"]);
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
}

// Loads the URLs and intervals from text loaded from a URL
function load_urls() {
  var xmlhttp = new XMLHttpRequest();
  var url = document.getElementById("loadurl").value;
  if (url !== "") {
    xmlhttp.onreadystatechange = function () {
      if (xmlhttp.readyState == 4) {
        localStorage["loadurl"] = document.getElementById("loadurl").value;
        document.getElementById("urls").value = xmlhttp.responseText;
        saveUrlsAndIntervals();
      }
    };

    xmlhttp.open("GET", url, true);
    xmlhttp.send(null);
  }
}

function saveUrlsAndIntervals() {
  var line = document.getElementById('urls').value.split('\n');
  var urlsArray = [];
  var urlsIntervalsArray = [];

  bg.urls = [];
  bg.urlsIntervals = [];
  var badLine = [];

  for (var i = 0; i < line.length; i++) {
    if (line[i] != "") {
      if (line[i].indexOf(";") < 0) {
        badLine.push(i);
        console.log("Missing ;\nLine " + i + " ignored.");
      } else {
        var urlAndIndex = line[i].split(';');
        if (urlAndIndex.length > 2) {
          badLine.push(i);
          console.log("Too many ';'\nLine " + i + " ignored");
        } else if (urlAndIndex[0] == "" && urlAndIndex[1] == "") {
          badLine.push(i);
          console.log("Missing url and/or time interval.\nLine " + i + " ignored.");
        } else if (isNaN(urlAndIndex[0])) {
          badLine.push(i);
          console.log("Time interval is not a number.\nLine " + i + " ignored.");
        } else {
          urlsArray.push(urlAndIndex[1]);
          urlsIntervalsArray.push(urlAndIndex[0]);

          bg.urls.push(urlAndIndex[1]);
          bg.urlsIntervals.push(urlAndIndex[0]);
        }
      }
    }
  }
  for (i = badLine.length - 1; i >= 0; i--) {
    line.splice(badLine[i], 1);
  }

  var urlsAndInterals = "";

  for (i = 0; i < line.length; i++) {
    urlsAndInterals = urlsAndInterals + line[i] + "\n";
  }
  document.getElementById('urls').value = urlsAndInterals;
  localStorage['urls'] = JSON.stringify(urlsArray);
  localStorage['urlsIntervals'] = JSON.stringify(urlsIntervalsArray);
}

// Adding listeners for restoring and saving options
document.getElementById('load').addEventListener('click', load_urls);
document.addEventListener('DOMContentLoaded', restore_options);
document.querySelector('#save').addEventListener('click', save_options);
document.querySelector('#savetop').addEventListener('click', save_options);
