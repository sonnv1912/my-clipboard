import {
   BrowserWindow,
   Menu,
   Tray,
   app,
   clipboard,
   globalShortcut,
   ipcMain,
   nativeImage,
   screen,
} from 'electron';
import Store from 'electron-store';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { appEvent } from './configs/constants';

import './events/app';
import './events/clipboard';
import { uniqBy } from 'lodash';

export const store = new Store<StoreState>();

const defaultSetting = {
   maxItem: 100,
   shortcut: 'Control+Shift+V',
   dirname: __dirname,
};

let lastClipboardText = '';
let lastClipboardImage = '';
let window: BrowserWindow;

const icon = nativeImage.createFromPath(
   app.isPackaged
      ? path.join(__dirname, '../../../FluentColorClipboard16.png')
      : path.join(
           __dirname,
           '../../src/assets/icons/FluentColorClipboard16.png',
        ),
);

const show = () => {
   window.show();
   window.focus();
};

const hide = () => {
   window.hide();
};

export const createWindow = () => {
   const { width, height } = screen.getPrimaryDisplay().workAreaSize;
   const windowWidth = 600;
   const windowHeight = 600;
   const x = Math.round((width - windowWidth) / 2);
   const y = height - windowHeight;

   window = new BrowserWindow({
      x,
      y,
      icon,
      width: windowWidth,
      height: windowHeight,
      frame: false,
      center: true,
      roundedCorners: true,
      resizable: false,
      alwaysOnTop: true,
      webPreferences: {
         preload: path.join(__dirname, 'preload.js'),
      },
   }).on('blur', () => {
      if (app.isPackaged) {
         hide();
      }
   });

   app.dock.setIcon(icon);

   if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
      window.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
   } else {
      window.loadFile(
         path.join(
            __dirname,
            `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`,
         ),
      );
   }

   if (!app.isPackaged) {
      window.webContents.openDevTools();
      window.setAlwaysOnTop(false);
      window.setResizable(true);
   }

   if (app.isPackaged) {
      app.dock.hide();
   }
};

const createTrackIcon = () => {
   const tray = new Tray(icon.resize({ height: 20, width: 20 }));

   const contextMenu = Menu.buildFromTemplate([
      {
         label: 'Hiện cửa sổ',
         click: show,
      },
      {
         label: 'Thoát',
         click: () => {
            app.quit();
         },
      },
   ]);

   tray.setToolTip('Clipboard Manager');
   tray.setContextMenu(contextMenu);
};

const watchClipboard = () => {
   setInterval(() => {
      const SETTING = store.get('setting', defaultSetting);
      const CLIPBOARD = store.get('clipboardHistory', []);
      const text = clipboard.readText();
      const image = clipboard.readImage();

      if (text && text !== lastClipboardText) {
         lastClipboardText = text;

         if (CLIPBOARD.length === SETTING.maxItem) {
            CLIPBOARD.pop();
         }

         CLIPBOARD.unshift({
            id: randomUUID(),
            value: text,
            isImage: false,
         });

         store.set('clipboardHistory', uniqBy(CLIPBOARD, 'value'));
      }

      if (!image.isEmpty() && image.toDataURL() !== lastClipboardImage) {
         lastClipboardImage = image.toDataURL();

         if (CLIPBOARD.length === SETTING.maxItem) {
            CLIPBOARD.pop();
         }

         CLIPBOARD.unshift({
            id: randomUUID(),
            value: image.toDataURL(),
            isImage: true,
         });

         store.set('clipboardHistory', uniqBy(CLIPBOARD, 'value'));
      }
   }, 1000);
};

const initEvent = () => {
   const SETTING = store.get('setting', defaultSetting);

   ipcMain.handle(appEvent.hide, hide);

   ipcMain.handle(appEvent.show, show);

   globalShortcut.register(SETTING.shortcut, () => {
      if (window.isVisible()) {
         hide();

         return;
      }

      show();
   });
};

app.on('quit', () => {
   globalShortcut.unregisterAll();
});

app.whenReady()
   .then(createWindow)
   .then(createTrackIcon)
   .then(watchClipboard)
   .then(initEvent);
