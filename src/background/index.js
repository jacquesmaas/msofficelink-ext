import { LinkHandler, openUrlInTab } from '../util';

const i18n = chrome.i18n.getMessage;

const patterns = ['docx', 'doc', 'docm', 'xls', 'xlsx', 'csv', 'xlsm', 'pptx', 'ppt', 'pptm'].map(
  el => `*://*/*.${el}*`
);

const createContextMenu = (i18nId, id) => {
  chrome.contextMenus.create({
    title: i18n(i18nId),
    id: id,
    contexts: ['link'],
    targetUrlPatterns: patterns
  });
};
const createCtxMenuSeparator = id => {
  chrome.contextMenus.create({
    type: 'separator',
    id: id,
    contexts: ['link'],
    targetUrlPatterns: patterns
  });
};

// create default context menu for showing the history
chrome.contextMenus.create({
  title: i18n('extName') + ' - ' + i18n('History_ctxMenuOpen'),
  id: 'history1',
  contexts: ['page']
});

// install the context menus to open links in ms office applications
createContextMenu('LinkOption_openProtected', 'read');
createContextMenu('LinkOption_openEdit', 'edit');
createContextMenu('LinkOption_openOnline', 'online');
createContextMenu('LinkOption_download', 'download');
createCtxMenuSeparator('sep1');
createContextMenu('LinkOption_openParent', 'parent');
createCtxMenuSeparator('sep2');
createContextMenu('LinkOption_addToFavs', 'markasfav');
chrome.contextMenus.create({
  title: i18n('History_ctxMenuOpen'),
  id: 'history2',
  contexts: ['browser_action']
});

// register command listener to open history/favorites page
chrome.commands.onCommand.addListener(command => {
  if (command === 'openLinkHistory') {
    chrome.tabs.create({ url: 'pages/history.html' });
  }
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId.startsWith('history')) {
    chrome.tabs.create({ url: 'pages/history.html' });
    return;
  }

  try {
    // Origin has to be extracted from url, because window.location.origin does not work here
    const urlPaths = info.linkUrl.split('/');
    const origin = urlPaths.length >= 3 ? urlPaths[2] : '';
    const linkHandler = new LinkHandler(info.menuItemId, info.linkUrl, origin, info.pageUrl);
    if (info.menuItemId === 'markasfav') {
      linkHandler.createFavorite();
      chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'createdFav' });
      });
    } else {
      linkHandler.sendTabUpdateImmediately();
    }
  } catch (e) {
    console.log(e);
  }
});

// handle messages from content scripts or popup pages
chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  const { action, url, openNewTab = false } = request;

  switch (action) {
    case 'handleLink':
      openUrlInTab(openNewTab, url);
      sendResponse({ success: true });
      break;
    case 'updateBadge':
      chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
        chrome.browserAction.setBadgeText({
          text: request.officeLinkCount ? `${request.officeLinkCount}` : '',
          tabId: tabs[0].id
        });
        sendResponse({ success: true, tabId: tabs[0].id });
      });
      break;
  }
});

chrome.runtime.onInstalled.addListener(details => {
  // maybe show some information about the updated

  const docLinks = {
    entries: {
      'https://google.com/someFile.docx': {
        origin: 'https://google.com',
        href: 'https://google.com/someFile.docx',
        ownerPage: 'https://google.com',
        protocol: 'ms-word',
        file: 'someFile.docx',
        type: 'word',
        isFav: true,
        isHistory: false,
        openedOn: undefined
      },
      'https://www.my-sharepoint.com/folder1/folder2/Presentation1.pptx': {
        origin: 'https://www.my-sharepoint.com',
        href: 'https://www.my-sharepoint.com/folder1/folder2/Presentation1.pptx',
        ownerPage: 'https://www.my-sharepoint.com',
        protocol: 'ms-powerpoint',
        file: 'Presentation1.pptx',
        type: 'powerpoint',
        isFav: true,
        isHistory: true,
        openedOn: new Date('2018/09/01').toJSON()
      },
      'https://www.my-sharepoint.com/folder1/folder2/folder3/New Presentation.pptx': {
        origin: 'https://www.my-sharepoint.com',
        href: 'https://www.my-sharepoint.com/folder1/folder2/folder3/Presentation1.pptx',
        ownerPage: 'https://www.my-sharepoint.com',
        protocol: 'ms-powerpoint',
        file: 'New Presentation.pptx',
        type: 'powerpoint',
        isFav: false,
        isHistory: true,
        openedOn: new Date('2018/08/01').toJSON()
      },
      'https://www.another-site.de/budgets/Year Budget.xls': {
        origin: 'https://www.another-site.de',
        href: 'https://www.another-site.de/budgets/Year Budget.xls',
        ownerPage: 'https://www.another-site.de/budgets',
        protocol: 'ms-excel',
        file: 'Year Budget.xls',
        type: 'excel',
        isFav: false,
        isHistory: true,
        openedOn: new Date('2018/08/05').toJSON()
      },
      'https://www.another-site.de/project/2018/Project Plan.xlsx': {
        origin: 'https://www.another-site.de',
        href: 'https://www.another-site.de/budgets/Project Plan.xlsx',
        ownerPage: 'https://www.another-site.de/project/2018',
        protocol: 'ms-excel',
        file: 'Project Plan.xlsx',
        type: 'excel',
        isFav: false,
        isHistory: true,
        openedOn: new Date('2018/09/05').toJSON()
      }
    }
  };
  chrome.storage.local.set({ docLinks });
});
