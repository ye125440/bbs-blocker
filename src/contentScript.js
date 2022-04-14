'use strict';

// Content script file will run in the context of web page.
// With content script you can manipulate the web pages using
// Document Object Model (DOM).
// You can also pass information to the parent extension.

// We execute this script by making an entry in manifest.json file
// under `content_scripts` property

// For more information on Content Scripts,
// See https://developer.chrome.com/extensions/content_scripts

// Log `title` of current active web page
const pageTitle = document.head.getElementsByTagName('title')[0].innerHTML;
console.log(
  `Page title is: '${pageTitle}' - evaluated by Chrome extension's 'contentScript.js' file`,
);

const enableStorage = {
  get: (cb) => {
    chrome.storage.sync.get(['enable'], (result) => {
      cb(result.enable);
    });
  },
  set: (value, cb) => {
    chrome.storage.sync.set(
      {
        enable: value,
      },
      () => {
        cb();
      },
    );
  },
};

const blockListStorage = {
  get: (cb) => {
    chrome.storage.sync.get(['blockList'], (result) => {
      cb(result.blockList);
    });
  },
  set: (value, cb) => {
    chrome.storage.sync.set(
      {
        blockList: value,
      },
      () => {
        cb();
      },
    );
  },
};

// Communicate with background file by sending a message
// chrome.runtime.sendMessage(
//   {
//     type: 'GREETINGS',
//     payload: {
//       message: 'Hello, my name is Con. I am from ContentScript.',
//     },
//   },
//   (response) => {
//     console.log('debug ~ file: contentScript.js ~ line 29 ~ response', response);
//   },
// );

// Listen for message
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'SETUP') {
    console.log('APPLY', `当前屏蔽词为 ${request.payload.blockList.join(';')}`);
    enableStorage.get((enable) =>
      applyBlock(enable, request.payload.blockList),
    );
  }

  if (request.type === 'APPLY') {
    console.log('APPLY', `当前屏蔽词为 ${request.payload.blockList.join(';')}`);
    enableStorage.get((enable) =>
      applyBlock(enable, request.payload.blockList),
    );
  }

  if (request.type === 'TEST') {
    console.log('TEST', `当前屏蔽词为 ${request.payload.blockList.join(';')}`);
    console.log(
      'debug ~ file: contentScript.js ~ line 84 ~ chrome.runtime.onMessage.addListener ~ request.payload',
      request.payload,
    );
  }

  // Send an empty response
  // See https://github.com/mozilla/webextension-polyfill/issues/130#issuecomment-531531890
  sendResponse({});
  return true;
});

function applyBlock(enable, blockList = []) {
  const tableEl = document.querySelectorAll('.bbs_table > tbody > tr');
  let blockedList = [];
  tableEl.forEach((el) => {
    const titleEl = el.querySelector('a');
    if (blockList.some((keyword) => titleEl.title.includes(keyword))) {
      blockedList.push(el);
      el.style.display = 'none';
    }
    if (!enable || blockedList.length === 0) el.style.display = 'table-row';
  });
  const blockResultEl = document.querySelector('#blockResult');
  blockResultEl.innerHTML = enable
    ? `共屏蔽${blockedList.length}条。`
    : '勾选启动屏蔽';
}

function restoreCheckbox() {
  enableStorage.get((enable) => {
    if (typeof enable === 'undefined') {
      enableStorage.set(false, () => setupCheckbox(false));
    } else {
      setupCheckbox(enable);
      blockListStorage.get((blockList) => applyBlock(enable, blockList));
    }
  });
}

function setupCheckbox(enable = false) {
  const tableHead = document.querySelector('.bbs_table > thead > tr > th');
  tableHead.insertAdjacentHTML('beforeend', renderCheckbox(enable));
  const switchEl = document.querySelector('#blockSwitch');
  switchEl.addEventListener('change', checkChange);
}

function renderCheckbox(checked = false) {
  return `
    <span style="margin-left: 4px">
      <input style="vertical-align: middle" id="blockSwitch" type="checkbox" checked=${checked} />
      <span style="vertical-align: middle" id="blockResult"></span>
    </span>`;
}

function checkChange(evt) {
  const checked = evt.target.checked;
  enableStorage.set(checked, () =>
    blockListStorage.get((blockList) => applyBlock(checked, blockList)),
  );
}

restoreCheckbox();
