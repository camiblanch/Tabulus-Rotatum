const readLocalStorage = async (key) => {
  return new Promise((resolve) => {
    chrome.storage.local.get([key], result => {
      resolve(result[key]);
    });
  });
};

const writeLocalStorage = async (key, value) => {
  return new Promise((resolve) => {
    chrome.storage.local.set({key: value}, () => {
      resolve();
    });
  });
};

const readInteger = async (key, defaultInt = 0) => {
  let integer = await readLocalStorage(key);
  return integer ? integer : defaultInt;
};

const readArray = async (key) => {
  let array = await readLocalStorage(key);
  return array ? array : [];
};

const writeArray = async (key, value) => {
  await writeLocalStorage(key, value);
};

const readBoolean = async (key, defaultValue) => {
  let boolean = await readLocalStorage(key);
  return castStringToBool(boolean, defaultValue);
};

const castStringToBool = (stringBool, defaultValue) => {
  if (stringBool === "true") {
    return true;
  } else if (stringBool === "false") {
    return false;
  } else {
    return defaultValue;
  }
}

chrome.storage.local.get(["showoptions"], ({showoptions}) => {
  showoptions = castStringToBool(showoptions, true);
  if (showoptions) {
    chrome.tabs.create({url: "options.html"});
  }
});

const activeInWindow =  async(windowId) => {
  const activeWindows = await readArray("activeWindows");
  return activeWindows.includes(windowId);
}

async function mouseMovedListener(request) {
  if (request.movement === "MOUSEMOVED") {
    const moverInterval = await readLocalStorage("moverInterval");
    if (moverInterval) {
      const pauseInterval = await readArray("pauseInterval");
      clearInterval(pauseInterval.shift());
      await writeArray("pauseInterval", pauseInterval);
      await writeLocalStorage("paused", true);
      const waitTime = await readInteger("waitTime");
      stop(waitTime);
    }
  }
}

// Setup Initial Badge Text
chrome.action.setBadgeBackgroundColor({color: [139, 137, 137, 137]});

// Called when the user clicks on the browser action.
chrome.action.onClicked.addListener(async tab => {
  const currWindowId = tab.windowId;
  await writeLocalStorage("currWindowId", currWindowId);
  const currentWindowIsActive = await activeInWindow(currWindowId);
  if (currentWindowIsActive) {
    await writeLocalStorage("paused", false);
    const pauseInterval = await readArray("pauseInterval");
    clearInterval(pauseInterval.shift());
    await writeArray("pauseInterval", pauseInterval);
    chrome.runtime.onMessage.removeListener(mouseMovedListener);
    await stop();
  } else {
    await go(currWindowId);
  }
});

async function badgeTabs(text) {
  switch (text) {
  case "on":
    await chrome.action.setBadgeText({text: "\u2022"});
    await chrome.action.setBadgeBackgroundColor({color: [0, 255, 0, 100]});
    const firstPlay = await readBoolean("firstPlay", true);
    if (firstPlay) {
      await writeLocalStorage("firstPlay", false);
      const waitTime = await readInteger("waitTime");

      if (waitTime > 0) {
        chrome.runtime.onMessage.addListener(mouseMovedListener);
      } else {
        chrome.runtime.onMessage.removeListener(mouseMovedListener);
      }
    }
    await writeLocalStorage("firstPause", true);
    break;
  case "":
    await chrome.action.setBadgeText({text: "\u00D7"});
    await chrome.action.setBadgeBackgroundColor({color: [255, 0, 0, 100]});
    const firstPause = await readBoolean("firstPause", true);

    if (firstPause) {
      await writeLocalStorage("firstPause", false);
      // Set the urlsIndex back so we don't skip over a url when we hit start
      const urlsIndex = await readInteger("urlsIndex");
      if (urlsIndex > 0) {
        await writeLocalStorage("urlsIndex", urlsIndex - 1);
      } else {
        const urls = await readArray("urls");
        await writeLocalStorage("urlsIndex", urls.length - 1);
      }
    }
    break;
  default:
    await chrome.action.setBadgeText({text: ""});
  }
}

// Start on a specific window
async function go(windowId) {
  const pauseInterval = await readArray("pauseInterval");
  clearInterval(pauseInterval.shift());
  await writeArray("pauseInterval", pauseInterval);
  const urls = await readArray("urls");
  if (urls.length > 0) {
    chrome.tabs.query({
      "active": false,
      "windowId": currWindowId,
    }, (currTabs) => {
      currTabs.forEach(tab => {
        chrome.tabs.remove(tab.id);
      });
    });
    chrome.tabs.onUpdated.addListener(startTimer);
    const paused = await readBoolean("paused");
    if (paused) {
      await writeLocalStorage("paused", false);
    } else {
      const activeWindows = await readArray("activeWindows");
      activeWindows.push(windowId);
      await writeArray("activeWindows", activeWindows);
    }
    await badgeTabs("on");
    await moveTab();
  }
}

async function startTimer(tabId, changeInfo, tab) {
  const moverInterval = await readLocalStorage("moverInterval");
  clearInterval(moverInterval);
  if (tab.status === "complete") {
    const urlsIndex = await readInteger("urlsIndex");
    let intervalIndex = urlsIndex - 2;
    if (intervalIndex < 0) {
      const urls = await readArray("urls");
      intervalIndex = urls.length + intervalIndex;
    }
    const urlsIntervals = await readArray("urlsIntervals");
    const delay = urlsIntervals[intervalIndex] * 1000;
    const newMoverInterval = setInterval(() => {
      moveTab2();
    }, delay);
    await writeLocalStorage("moverInterval", newMoverInterval);
  }
}

// Stop on a specific window
async function stop(seconds) {
  const currWindowId = await readInteger("currWindowId", -1);
  const moverInterval = await readLocalStorage("moverInterval");
  const activeWindows = await readArray("activeWindows");
  clearInterval(moverInterval);
  chrome.tabs.onUpdated.removeListener(startTimer);
  const index = activeWindows.indexOf(currWindowId);
  if (index >= 0) {
    await badgeTabs("");
    if (seconds) {
      console.log("Pausing");
      const pauseInterval = await readArray("pauseInterval");
      pauseInterval.push(
        setInterval(async () => {
          await go(currWindowId);
        }, seconds * 1000));
      await writeArray("pauseInterval", pauseInterval);
    } else {
      activeWindows.splice(index);
      await writeArray("activeWindows", activeWindows);
    }
  }
}

// Switches to next URL in list, loops.
async function moveTab() {
  const urls = await readArray("urls");
  let urlsIndex = await readInteger("urlsIndex");
  const moverInterval = await readLocalStorage("moverInterval");

  await badgeTabs("on");
  await chrome.tabs.create({
    url: urls[urlsIndex],
    selected: false,
  });
  urlsIndex++;
  if (urlsIndex === urls.length) {
    urlsIndex = 0;
  }

  await writeLocalStorage("urlsIndex", urlsIndex);
  clearInterval(moverInterval);
}

// Deletes the current tab.
async function moveTab2() {
  const pauseInterval = await readArray("pauseInterval");
  const currWindowId = await readInteger("currWindowId", -1);

  clearInterval(pauseInterval.shift());
  await writeArray("pauseInterval", pauseInterval);
  chrome.tabs.query({
    windowId: currWindowId
  }, async (tabs2) => {
    await chrome.tabs.remove(tabs2[0].id);
    await moveTab();
  });
}

// Autostart function, processed on initial startup.
chrome.storage.local.get(["autostart"], ({autostart}) => {
  autostart = castStringToBool(autostart, false);
  if (autostart) {
    chrome.tabs.query({"active": true, "windowId": chrome.windows.WINDOW_ID_CURRENT},
      async (tabs) => {
        //Start in main window.
        await go(tabs[0].windowId);
      },
    );
  }
});