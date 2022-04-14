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
    defaultList.forEach((item) =>
      blockListEl.insertAdjacentHTML('afterbegin', renderItem(item)),
    );
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

  function deleteTag(evt) {
    console.log('debug ~ file: popup.js ~ line 49 ~ deleteTag ~ evt', evt);
    blockListStorage.get((blockList) => {
      // blockListStorage.set(blockList, () => {
      //   const blockListEl = document.getElementById('blockList');
      //   blockListEl.insertAdjacentHTML('afterbegin', renderItem(keywordText));
      //   const tags = blockListEl.querySelectorAll('span');
      //   tags.forEach((tag) => tag.addEventListener('click', deleteTag));
      // });
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const tab = tabs[0];

        chrome.tabs.sendMessage(
          tab.id,
          {
            type: 'APPLY',
            payload: {
              blockList,
              evt,
            },
          },
          (response) => {
            console.log('Current blockList value passed to contentScript file');
          },
        );
      });
    });
  }

  function updateBlockList() {
    const keywordText = document.getElementById('keyword').value;
    if (!keywordText) return;
    blockListStorage.get((blockList) => {
      if (blockList.includes(keywordText)) return;
      blockListStorage.set([keywordText, ...blockList], () => {
        const blockListEl = document.getElementById('blockList');
        blockListEl.insertAdjacentHTML('afterbegin', renderItem(keywordText));
        const tags = blockListEl.querySelectorAll('span');
        tags.forEach((tag) => tag.addEventListener('click', deleteTag));
      });
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
            console.log('Current blockList value passed to contentScript file');
          },
        );
      });
    });
  }

  function renderItem(keyword) {
    return `<span id=${keyword} class="tag">${keyword}</span>`;
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
  const counterStorage = {
    get: (cb) => {
      chrome.storage.sync.get(['count'], (result) => {
        cb(result.count);
      });
    },
    set: (value, cb) => {
      chrome.storage.sync.set(
        {
          count: value,
        },
        () => {
          cb();
        },
      );
    },
  };
  function setupCounter(initialValue = 0) {
    document.getElementById('counter').innerHTML = initialValue;

    document.getElementById('incrementBtn').addEventListener('click', () => {
      updateCounter({
        type: 'INCREMENT',
      });
    });

    document.getElementById('decrementBtn').addEventListener('click', () => {
      updateCounter({
        type: 'DECREMENT',
      });
    });
  }

  function updateCounter({ type }) {
    counterStorage.get((count) => {
      let newCount;

      if (type === 'INCREMENT') {
        newCount = count + 3;
      } else if (type === 'DECREMENT') {
        newCount = count - 3;
      } else {
        newCount = count;
      }

      counterStorage.set(newCount, () => {
        document.getElementById('counter').innerHTML = newCount;

        // Communicate with content script of
        // active tab by sending a message
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          const tab = tabs[0];

          chrome.tabs.sendMessage(
            tab.id,
            {
              type: 'COUNT',
              payload: {
                count: newCount,
              },
            },
            (response) => {
              console.log('Current count value passed to contentScript file');
            },
          );
        });
      });
    });
  }

  function restoreCounter() {
    // Restore count value
    counterStorage.get((count) => {
      if (typeof count === 'undefined') {
        // Set counter value as 0
        counterStorage.set(0, () => {
          setupCounter(0);
        });
      } else {
        setupCounter(count);
      }
    });
  }
})();
