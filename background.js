'use strict';

const notify = e => chrome.notifications.create({
  type: 'basic',
  iconUrl: '/data/icons/48.png',
  title: chrome.runtime.getManifest().name,
  message: e.message || e
});

const onCommand = tab => chrome.tabs.executeScript({
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
    tabId: tab.id,
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
    chrome.tabs.executeScript({
      file: 'data/toolbar/inject.js'
    });
  }
  else {
    chrome.tabs.sendMessage(tab.id, {
      method: 'unload'
    });
  }
});
chrome.browserAction.onClicked.addListener(onCommand);
chrome.runtime.onMessage.addListener((request, sender) => {
  if (request.method === 'close-me') {
    onCommand(sender.tab);
  }
});

/* FAQs & Feedback */
{
  const {management, runtime: {onInstalled, setUninstallURL, getManifest}, storage, tabs} = chrome;
  if (navigator.webdriver !== true) {
    const page = getManifest().homepage_url;
    const {name, version} = getManifest();
    onInstalled.addListener(({reason, previousVersion}) => {
      management.getSelf(({installType}) => installType === 'normal' && storage.local.get({
        'faqs': true,
        'last-update': 0
      }, prefs => {
        if (reason === 'install' || (prefs.faqs && reason === 'update')) {
          const doUpdate = (Date.now() - prefs['last-update']) / 1000 / 60 / 60 / 24 > 45;
          if (doUpdate && previousVersion !== version) {
            tabs.create({
              url: page + '?version=' + version + (previousVersion ? '&p=' + previousVersion : '') + '&type=' + reason,
              active: reason === 'install'
            });
            storage.local.set({'last-update': Date.now()});
          }
        }
      }));
    });
    setUninstallURL(page + '?rd=feedback&name=' + encodeURIComponent(name) + '&version=' + version);
  }
}
