console.log("ADDED IN: " + document.location);
var i = 0;
document.onmousemove = function () {
  chrome.runtime.sendMessage({movement: "MOUSEMOVED"});

  // console.log(++i);
};
