function saveUrlsAndIntervalsFromString(s) {
  var line = s.split('\n');
  var urlsArray = [];
  var urlsIntervalsArray = [];

  var bg = chrome.extension.getBackgroundPage();

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
  localStorage.urls = JSON.stringify(urlsArray);
  localStorage.urlsIntervals = JSON.stringify(urlsIntervalsArray);
  return urlsAndInterals;
}

