'use strict';

const notify = e => chrome.notifications.create({
  type: 'basic',
  iconUrl: '/data/icons/48.png',
  title: chrome.runtime.getManifest().name,
  message: e.message || e
});

chrome.browserAction.onClicked.addListener(() => chrome.tabs.executeScript({
  runAt: 'document_start',
  code: `document.designMode`
}, arr => {
  const lastError = chrome.runtime.lastError;
  if (lastError) {
    return notify(lastError);
  }
  const mode = arr[0] === 'off' ? 'on' : 'off';
  chrome.tabs.executeScript({
    allFrames: true,
    runAt: 'document_start',
    code: `document.designMode = '${mode}';`
  });
  chrome.browserAction.setIcon({
    path: {
      '16': 'data/icons/' + (mode === 'on' ? 'active/' : '') + '16.png',
      '19': 'data/icons/' + (mode === 'on' ? 'active/' : '') + '19.png',
      '32': 'data/icons/' + (mode === 'on' ? 'active/' : '') + '32.png',
      '38': 'data/icons/' + (mode === 'on' ? 'active/' : '') + '38.png',
      '48': 'data/icons/' + (mode === 'on' ? 'active/' : '') + '48.png',
      '64': 'data/icons/' + (mode === 'on' ? 'active/' : '') + '64.png'
    }
  });
  if (mode === 'on') {
    notify('Document is now editable!');
  }
}));
