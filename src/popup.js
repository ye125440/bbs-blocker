'use strict';

import './popup.css';

(function () {
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

  function setupBlockList(defaultList = []) {
    document.getElementById('addBlockKeyword').addEventListener('click', () => {
      updateBlockList();
    });
    const blockListEl = document.getElementById('blockList');
    console.log(
      'debug ~ file: popup.js ~ line 29 ~ setupBlockList ~ blockListEl',
      blockListEl,
    );
    defaultList.forEach((item) =>
      blockListEl.insertAdjacentHTML('afterbegin', renderItem(item)),
    );
    blockListEl.addEventListener('click', blockListClick);
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];

      chrome.tabs.sendMessage(
        tab.id,
        {
          type: 'SETUP',
          payload: {
            blockList: defaultList,
          },
        },
        (response) => {},
      );
    });
  }

  function blockListClick({ target }) {
    const role = target.getAttribute('role');
    if (!role) return;
    blockListStorage.get((blockList) => {
      const newList = blockList.filter((keyword) => keyword !== role);
      console.log('debug ~ file: popup.js ~ line 58 ~ blockListStorage.get ~ newList', newList);
      blockListStorage.set(newList, () => {
        const blockListEl = document.getElementById('blockList');
        blockListEl.removeChild(target);
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          const tab = tabs[0];

          chrome.tabs.sendMessage(
            tab.id,
            {
              type: 'APPLY',
              payload: {
                blockList: newList,
              },
            },
            (response) => {
              console.log(
                'Current blockList value passed to contentScript file',
              );
            },
          );
        });
      });
    });
  }

  function updateBlockList() {
    const inputEl = document.getElementById('keyword');
    const keywordText = inputEl.value;
    if (!keywordText) return;
    blockListStorage.get((blockList) => {
      if (blockList.includes(keywordText)) return;
      blockListStorage.set([keywordText, ...blockList], () => {
        const blockListEl = document.getElementById('blockList');
        blockListEl.insertAdjacentHTML('afterbegin', renderItem(keywordText));
        inputEl.value = '';
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          const tab = tabs[0];
          chrome.tabs.sendMessage(
            tab.id,
            {
              type: 'APPLY',
              payload: {
                blockList: [keywordText, ...blockList],
              },
            },
            (response) => {
              console.log(
                'Current blockList value passed to contentScript file',
              );
            },
          );
        });
      });
    });
  }

  function renderItem(keyword) {
    return `<span role=${keyword} class="tag">${keyword}</span>`;
  }

  function restoreBlockList() {
    blockListStorage.get((blockList) => {
      if (typeof blockList === 'undefined') {
        // Set blockList value as []
        blockListStorage.set([], () => {
          setupBlockList([]);
        });
      } else {
        setupBlockList(blockList);
      }
    });
  }

  // document.addEventListener('DOMContentLoaded', restoreCounter);
  document.addEventListener('DOMContentLoaded', restoreBlockList);

  // Communicate with background file by sending a message
  chrome.runtime.sendMessage(
    {
      type: 'GREETINGS',
      payload: {
        message: 'Hello, my name is BBS Blocker. I am from Popup.',
      },
    },
    (response) => {
      console.log('debug ~ file: popup.js ~ line 103 ~ response', response);
    },
  );

  // We will make use of Storage API to get and store `count` value
  // More information on Storage API can we found at
  // https://developer.chrome.com/extensions/storage

  // To get storage access, we have to mention it in `permissions` property of manifest.json file
  // More information on Permissions can we found at
  // https://developer.chrome.com/extensions/declare_permissions
})();
