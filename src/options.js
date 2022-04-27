function save_options() {
  const options = {};
  options.firstPlay = true;
  options.autostart = document.getElementById("autostart").checked;
  options.waitTime = parseInt(document.getElementById("waittime").value);
  options.loadUrl = document.getElementById("loadurl").value;

  if (document.getElementById("autoloadurls").checked) {
    options.autoloadurls = true;
    load_urls();
  } else {
    options.autoloadurls = false;
    saveUrlsAndIntervals();
  }

  options.showoptions = !!document.getElementById("showoptions").checked;

  chrome.storage.local.set(options, () => {
    // Update status to let user know options were saved.
    const status = document.getElementById("status");
    const status2 = document.getElementById("status2");
    const savedText = "OPTIONS SAVED";
    status.innerHTML = savedText;
    status2.innerHTML = savedText;
    setTimeout(() => {
      status.innerHTML = "";
      status2.innerHTML = "";
    }, 1000);
  });
}

// Restores saved values from localStorage.
function restore_options() {
  chrome.storage.local.get({
    autostart: false,
    waitTime: 0,
    loadUrl: "",
    autoloadurls: false,
    urls: [],
    urlsIntervals: [],
    showoptions: true,
  }, (options) => {
    console.log("Options from localStorage: ", options);
    document.getElementById("autostart").checked = options.autostart;
    const waitTimeDropdown = document.getElementById("waittime");
    waitTimeDropdown.selectedIndex = Array.from(waitTimeDropdown.options).findIndex((dropdownOption) => parseInt(dropdownOption.text) === options.waitTime);
    document.getElementById("loadurl").value = options.loadUrl;
    document.getElementById("autoloadurls").checked = options.autoloadurls;
    document.getElementById("showoptions").checked = options.showoptions;

    if (options.autoloadurls) {
      load_urls();
    } else {
      if (options.urls.length && options.urlsIntervals.length) {
        const urlsFromStorage = options.urls;
        const urlsIntervalsFromStorage = options.urlsIntervals;
        let urlsString = "";

        urlsFromStorage.forEach((url, i) => {
          urlsString += urlsIntervalsFromStorage[i] + ";" + url + "\n";
        });

        document.getElementById("urls").value = urlsString;
      }
    }
  });
}

// Loads the URLs and intervals from text loaded from a URL
function load_urls() {
  const xmlhttp = new XMLHttpRequest();
  const url = document.getElementById("loadurl").value;
  if (url.length) {
    xmlhttp.onreadystatechange = function () {
      if (xmlhttp.readyState === 4) {
        document.getElementById("urls").value = xmlhttp.responseText;
        saveUrlsAndIntervals();
      }
    };

    xmlhttp.open("GET", url, true);
    xmlhttp.send(null);
  }
}

function saveUrlsAndIntervals() {
  const urlLines = document.getElementById("urls").value.split("\n");
  const urlsArray = [];
  const urlsIntervalsArray = [];

  const badLines = [];

  urlLines.forEach((urlLine, i) => {
    if (urlLine.length) {
      if (urlLine.indexOf(";") < 0) {
        badLines.push(i);
        console.log("Missing ;\nLine " + i + " ignored.");
      } else {
        const urlAndIndex = urlLine.split(";");
        if (urlAndIndex.length > 2) {
          badLines.push(i);
          console.log("Too many ';'\nLine " + i + " ignored");
        } else if (urlAndIndex[0] === "" && urlAndIndex[1] === "") {
          badLines.push(i);
          console.log("Missing url and/or time interval.\nLine " + i + " ignored.");
        } else if (isNaN(urlAndIndex[0])) {
          badLines.push(i);
          console.log("Time interval is not a number.\nLine " + i + " ignored.");
        } else {
          urlsArray.push(urlAndIndex[1]);
          urlsIntervalsArray.push(parseInt(urlAndIndex[0]));
        }
      }
    }
  });

  for (let i = badLines.length - 1; i >= 0; i--) {
    urlLines.splice(badLines[i], 1);
  }

  document.getElementById("urls").value = urlLines.join("\n");
  chrome.storage.local.set({urls: urlsArray, urlsIntervals: urlsIntervalsArray});
}

// Adding listeners for restoring and saving options
document.getElementById("load").addEventListener("click", load_urls);
document.addEventListener("DOMContentLoaded", restore_options);
document.querySelector("#save").addEventListener("click", save_options);
document.querySelector("#savetop").addEventListener("click", save_options);