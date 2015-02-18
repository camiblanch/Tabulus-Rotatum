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
    
    var temp = document.getElementById('urls').value.split('\n');
    var urlsArray = [];
    var urlsIntervalsArray = [];

    bg.urls = [];
    bg.urlsIntervals = [];

    for(i = 0; i < temp.length-1; i++) {
        var urlAndIndex = temp[i].split(' ');

        urlsArray.push(urlAndIndex[0]);
        urlsIntervalsArray.push(urlAndIndex[1]);

        bg.urls.push(urlAndIndex[0]);
        bg.urlsIntervals.push(urlAndIndex[1]);
    }
    localStorage['urls'] = JSON.stringify(urlsArray);
    localStorage['urlsIntervals'] = JSON.stringify(urlsIntervalsArray);
    
  // Update status to let user know options were saved.
  var status = document.getElementById("status");
  var status2 = document.getElementById("status2");
  status.innerHTML = "OPTIONS SAVED";
  status2.innerHTML = "OPTIONS SAVED";
  setTimeout(function() {
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
    var urlsLoad;
    var urlsIntervalsLoad;
    if (localStorage["urls"]) {
        urlsLoad = JSON.parse(localStorage["urls"]);
        if(localStorage["urlsIntervals"]) {
            urlsIntervalsLoad = JSON.parse(localStorage["urlsIntervals"]);
            var urlsString = '';
            for(i = 0; i < urlsLoad.length; i++) {
                urlsString += urlsLoad[i] + " " + urlsIntervalsLoad[i] + "\n";
            }
            document.getElementById("urls").value = urlsString;
        } else {
            document.getElementById("urls").value = "";
            document.getElementById("urlsIntervals").value = "";
        }
    } else {
        document.getElementById("urls").value = "";
        document.getElementById("urlsIntervals").value = "";
    }

}

// Adding listeners for restoring and saving options
document.addEventListener('DOMContentLoaded', restore_options);
document.querySelector('#save').addEventListener('click', save_options);
document.querySelector('#savetop').addEventListener('click', save_options);
