'use strict';

const notify = e => chrome.notifications.create({
  type: 'basic',
  iconUrl: '/data/icons/48.png',
  title: chrome.runtime.getManifest().name,
  message: e.message || e
}, id => setTimeout(chrome.notifications.clear, 5000, id));

const onCommand = async tab => {
  try {
    const r = await chrome.scripting.executeScript({
      target: {
        tabId: tab.id
      },
      func: () => document.designMode
    });
    // Firefox's protected page
    if (r.length === 0 || r[0] === undefined) {
      throw Error('Cannot edit this page');
    }

    const mode = r[0].result === 'off' ? 'on' : 'off';

    chrome.scripting.executeScript({
      target: {
        tabId: tab.id,
        allFrames: true
      },
      func: mode => {
        document.designMode = mode;
      },
      args: [mode]
    });
    chrome.action.setIcon({
      tabId: tab.id,
      path: {
        '16': '/data/icons/' + (mode === 'on' ? 'active/' : '') + '16.png',
        '32': '/data/icons/' + (mode === 'on' ? 'active/' : '') + '32.png',
        '48': '/data/icons/' + (mode === 'on' ? 'active/' : '') + '48.png'
      }
    });
    if (mode === 'on') {
      await chrome.scripting.executeScript({
        target: {
          tabId: tab.id
        },
        files: ['/data/toolbar/inject/main.js'],
        world: 'MAIN'
      });
      await chrome.scripting.executeScript({
        target: {
          tabId: tab.id
        },
        files: ['/data/toolbar/inject/isolated.js']
      });
    }
    else {
      chrome.tabs.sendMessage(tab.id, {
        method: 'unload'
      }).catch(() => {});
    }
  }
  catch (e) {
    console.warn(e);
    notify(e);
  }
};
chrome.action.onClicked.addListener(onCommand);
chrome.runtime.onMessage.addListener((request, sender) => {
  if (request.method === 'close-me') {
    onCommand(sender.tab);
  }
});

/* FAQs & Feedback */
{
  const {management, runtime: {onInstalled, setUninstallURL, getManifest}, storage, tabs} = chrome;
  if (navigator.webdriver !== true) {
    const {homepage_url: page, name, version} = getManifest();
    onInstalled.addListener(({reason, previousVersion}) => {
      management.getSelf(({installType}) => installType === 'normal' && storage.local.get({
        'faqs': true,
        'last-update': 0
      }, prefs => {
        if (reason === 'install' || (prefs.faqs && reason === 'update')) {
          const doUpdate = (Date.now() - prefs['last-update']) / 1000 / 60 / 60 / 24 > 45;
          if (doUpdate && previousVersion !== version) {
            tabs.query({active: true, lastFocusedWindow: true}, tbs => tabs.create({
              url: page + '?version=' + version + (previousVersion ? '&p=' + previousVersion : '') + '&type=' + reason,
              active: reason === 'install',
              ...(tbs && tbs.length && {index: tbs[0].index + 1})
            }));
            storage.local.set({'last-update': Date.now()});
          }
        }
      }));
    });
    setUninstallURL(page + '?rd=feedback&name=' + encodeURIComponent(name) + '&version=' + version);
  }
}
