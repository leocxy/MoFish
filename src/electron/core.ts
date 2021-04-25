'use strict'
import { createProtocol } from 'vue-cli-plugin-electron-builder/lib'
import { Tray, Menu, dialog, BrowserWindow, TouchBar, globalShortcut, ipcMain } from 'electron'
import SettingDB from './db'
import Novel from './novel'
import path from 'path'
const { TouchBarButton, TouchBarSpacer } = TouchBar
const DYNAMIC_URL: string = process.env.WEBPACK_DEV_SERVER_URL ? process.env.WEBPACK_DEV_SERVER_URL : 'app://./index.html'
const DELIMITER: string = process.env.WEBPACK_DEV_SERVER_URL ? '/' : ''
const APP_URLS: {[key: string]: string} = {
    novel: `${DYNAMIC_URL}/#${DELIMITER}novel`,
    touchBar: `${DYNAMIC_URL}/#${DELIMITER}touchBar`,
    search: `${DYNAMIC_URL}/#${DELIMITER}search`,
    setting: `${DYNAMIC_URL}/#${DELIMITER}setting`
}
const isMac = process.platform === 'darwin'
type callbackFunction = () => void

class MoFish {
    app: Electron.App
    db: SettingDB
    novel: Novel
    displayMode: number
    tray?: Electron.Tray = undefined
    settingPanel: Electron.BrowserWindow | undefined
    searchPanel: Electron.BrowserWindow | undefined
    novelReader: Electron.BrowserWindow | undefined
    touchBarReader: Electron.BrowserWindow | undefined
    touchBarText: Electron.TouchBarButton | undefined

    constructor (app: Electron.App) {
        this.app = app
        this.db = new SettingDB(app)
        this.novel = new Novel(this.db)
        this.displayMode = <number> this.db.get('display_mode')
        isMac ? this._initMacOS() : this._initWindowOS()
        this._initHohKey()
        this._initTray()
        this._switchMode(this.displayMode)
        this._customEvents()
        if (!process.env.WEBPACK_DEV_SERVER_URL) createProtocol('app')
    }

    private _initMacOS = ():void => {
        console.log('mac init')
    }

    private _initWindowOS = ():void => {
        console.log('window init')
    }

    private _initHohKey = ():void => {
        // Load Hotkey from DB
        let hotkey:string
        hotkey = this.db.get('previous_hotkey_1') + '+' + this.db.get('previous_hotkey_2')
        this._registHotKey(hotkey, ():void => this._turnPage(-1))
        hotkey = this.db.get('next_hotkey_1') + '+' + this.db.get('next_hotkey_2')
        this._registHotKey(hotkey, ():void => this._turnPage(1))
        hotkey = this.db.get('ninja_hotkey_1') + '+' + this.db.get('ninja_hotkey_2')
        this._registHotKey(hotkey, ():void => this._toggleAll())
    }

    private _initTray = ():void => {
        const groups = [
            // Index 0
            [{
                label: '关于',
                click: () => {
                    dialog.showMessageBox({
                        type: 'info',
                        title: '关于',
                        message: 'MoFish是一个小说阅读器。\n\n作者：Leo Chen <leo.dev@qq.com>',
                        buttons: ['确认']
                    })
                }
            }],
            // Index 1 模式
            [{
                label: '小窗口',
                type: 'radio',
                checked: this.displayMode === 1,
                click: () => this._switchMode(1)
            }, {
                label: '任务栏',
                type: 'radio',
                checked: this.displayMode === 3,
                click: () => this._switchMode(3)
            }],
            // Index 2 翻页
            [{
                label: '上一页',
                accelerator: this.db.get('previous_hotkey_1') + '+' + this.db.get('previous_hotkey_2'),
                click: () => this._turnPage(-1)
            }, {
                label: '下一页',
                accelerator: this.db.get('next_hotkey_1') + '+' + this.db.get('next_hotkey_2'),
                click: () => this._turnPage(1)
            }, {
                label: '忍者键',
                accelerator: this.db.get('ninja_hotkey_1') + '+' + this.db.get('ninja_hotkey_2'),
                click: () => this._toggleAll()
            }, {
                label: '鼠标翻页',
                type: 'checkbox',
                checked: this.db.get('is_mouse'),
                click: (e) => {
                    this.db.set('is_mouse', e.checked ? 1 : 0)
                    if (!this.novelReader || this.novelReader.isDestroyed()) return
                    this.novelReader.webContents.send('db:update', JSON.stringify({ is_mouse: e.checked ? 1 : 0 }))
                }
            }],
            // , {
            //     label: '自动翻页',
            //     type: 'checkbox',
            //     checked: this.db.get('auto_page'),
            //     click: (e) => {
            //         console.log('toggle auto mode', e.checked)
            //     }
            // }
            // Index 3 设置
            [{
                label: '搜索',
                click: () => {
                    this._getSearchPanel()
                }
            }, {
                label: '设置',
                click: () => {
                    this._getSettingPanel()
                }
            }],
            // Index 4
            [{
                label: '退出',
                click: () => {
                    this.destroy()
                }
            }]
        ]
        // added touch bar mode base on platform
        if (isMac) {
            groups[1].push({
                label: 'Touch Bar',
                type: 'radio',
                checked: this.displayMode === 2,
                click: () => this._switchMode(2)
            })
        }
        const menuList: Array<any> = []
        for (const x of groups) {
            menuList.push({
                type: 'separator'
            }, ...x)
        }
        this.tray = new Tray(path.join(__static, 'assets', 'tray.png'))
        this.tray.setContextMenu(Menu.buildFromTemplate(menuList))
        // Register Ninja hotkey @todo
    }

    private _getSearchPanel = (): void => {
        if (this.searchPanel !== undefined && !this.searchPanel.isDestroyed()) return
        this.searchPanel = new BrowserWindow({
            useContentSize: true,
            title: '搜 索',
            width: 500,
            height: 530,
            resizable: false,
            maximizable: false,
            minimizable: false,
            webPreferences: {
                nodeIntegration: true
            }
        })

        const webContentObj: Electron.webContents = this.searchPanel.webContents

        // Init Events
        webContentObj.on('did-finish-load', () => {
            // not all zoom in or out
            webContentObj.setZoomFactor(1)
            webContentObj.setVisualZoomLevelLimits(1, 1)
            // webContentObj.setLayoutZoomLevelLimits(0, 0)
        })

        webContentObj.on('close', () => {
            if (this.searchPanel && !this.searchPanel.isDestroyed()) this.searchPanel.destroy()
        })

        // Load Setting Page
        this.searchPanel.loadURL(APP_URLS.search)
        if (process.env.WEBPACK_DEV_SERVER_URL) webContentObj.openDevTools()
        this.searchPanel.show()
    }

    private _getSettingPanel = (): void => {
        if (this.settingPanel !== undefined && !this.settingPanel.isDestroyed()) return
        this.settingPanel = new BrowserWindow({
            useContentSize: true,
            width: 500,
            height: 502,
            title: '设 置',
            resizable: false,
            maximizable: false,
            minimizable: false,
            webPreferences: {
                nodeIntegration: true
            }
        })

        const webContentObj: Electron.webContents = this.settingPanel.webContents

        // Init Events
        webContentObj.on('did-finish-load', () => {
        // Not allow zoom in or out
            webContentObj.setZoomFactor(1)
            webContentObj.setVisualZoomLevelLimits(1, 1)
            // webContentObj.setLayoutZoomLevelLimits(0, 0)
        })

        webContentObj.on('close', () => {
            if (this.settingPanel && !this.settingPanel.isDestroyed()) this.settingPanel.destroy()
        })

        // Load Setting Page
        this.settingPanel.loadURL(APP_URLS.setting)
        if (process.env.WEBPACK_DEV_SERVER_URL) webContentObj.openDevTools()
        this.settingPanel.show()
    }

    private _showMode1 (): void {
        if (this.novelReader !== undefined && !this.novelReader.isDestroyed()) return
        const sizes = (this.db.get('panel_size') || '856,47').split(',')
        const positions = (this.db.get('panel_pos') || '356,429').split(',')

        this.novelReader = new BrowserWindow({
            useContentSize: true,
            width: parseInt(sizes[0]),
            height: parseInt(sizes[1]),
            resizable: true,
            frame: false,
            movable: true,
            maximizable: false,
            fullscreenable: false,
            transparent: true,
            hasShadow: false,
            x: parseInt(positions[0]),
            y: parseInt(positions[1]),
            webPreferences: {
                nodeIntegration: true
            }
        })

        this.novelReader.setSkipTaskbar(true)

        const webContentObj = this.novelReader.webContents
        webContentObj.on('did-finish-load', () => {
            webContentObj.setZoomFactor(1)
            webContentObj.setVisualZoomLevelLimits(1, 1)
        })

        this.novelReader.setAlwaysOnTop(true)
        this.novelReader.setSkipTaskbar(true)

        // Store Panel Size
        this.novelReader.on('resize', () => this.db.set('panel_size', this.novelReader.getSize().join(',')))
        // Store Panel Position
        this.novelReader.on('move', () => this.db.set('panel_pos', this.novelReader.getPosition().join(',')))

        // Load Setting Page
        this.novelReader.loadURL(APP_URLS.novel)

        // Touch Bar
        this.novelReader.setTouchBar(new TouchBar({
            items: [
                new TouchBarButton({
                    label: '⏮️ Previous',
                    backgroundColor: '#a923ce',
                    click: () => this._turnPage(-1)
                }),
                new TouchBarSpacer({ size: 'small' }),
                new TouchBarButton({
                    label: '⏭️ Next',
                    backgroundColor: '#2342ce',
                    click: () => this._turnPage(1)
                }),
                new TouchBarSpacer({ size: 'small' }),
                new TouchBarButton({
                    label: '👻 Shit',
                    backgroundColor: '#ce2323',
                    click: () => this._toggleAll()
                }),
                new TouchBarSpacer({ size: 'small' })
            ]
        }))

        if (process.env.WEBPACK_DEV_SERVER_URL) webContentObj.openDevTools()
        this.novelReader.show()
    }

    private _hideMode1 (): void {
        if (this.novelReader && !this.novelReader.isDestroyed()) this.novelReader.destroy()
    }

    private _updaeMode1 (action: number, page: number): void {
        if (!this.novelReader || this.novelReader.isDestroyed()) return
        switch (action) {
        case 0:
            this.novelReader.webContents.send('novel:update', this.novel.getCurrentPage())
            break
        case 1:
            this.novelReader.webContents.send('novel:update', this.novel.getNextPage())
            break
        case -1:
            this.novelReader.webContents.send('novel:update', this.novel.getPreviousPage())
            break
        case 2:
            this.novelReader.webContents.send('novel:update', this.novel.jumpTo(page))
            break
        }
    }

    private _showMode2 (): void {
        if (this.touchBarReader && !this.touchBarReader.isDestroyed()) return
        this.touchBarReader = new BrowserWindow({
            useContentSize: true,
            width: 10,
            height: 10,
            resizable: false,
            frame: false,
            transparent: true,
            webPreferences: {
                nodeIntegration: true
            }
        })

        const webContentObj = this.touchBarReader.webContents
        webContentObj.on('did-finish-load', () => {
            webContentObj.setZoomFactor(1)
            webContentObj.setVisualZoomLevelLimits(1, 1)
        })

        this.touchBarReader.setAlwaysOnTop(true)
        this.touchBarReader.setSkipTaskbar(true)

        // Load Setting Page
        this.touchBarReader.loadURL(APP_URLS.touchBar)
        this.touchBarText = new TouchBarButton({
            label: '🥳👻🤓',
            backgroundColor: '#363636'
        })
        this.touchBarReader.setTouchBar(new TouchBar({
            items: [
                this.touchBarText
            ]
        }))
        this.touchBarReader.show()
    }

    private _updateMode2 (action: number, page: number): void {
        if (!this.touchBarReader || this.touchBarReader.isDestroyed() || !this.touchBarText) return
        switch (action) {
        case 0:
            this.touchBarText.label = this.novel.getCurrentPage().join(' ')
            break
        case 1:
            this.touchBarText.label = this.novel.getNextPage().join(' ')
            break
        case -1:
            this.touchBarText.label = this.novel.getPreviousPage().join(' ')
            break
        case 2:
            this.touchBarText.label = this.novel.jumpTo(page).join('')
            break
        }
    }

    private _hideMode2 (): void {
        if (this.touchBarReader && !this.touchBarReader.isDestroyed()) {
            this.touchBarReader.destroy()
            this.touchBarText = undefined
        }
    }

    private _showMode3 (): void {
        if (this.tray) this.tray.setTitle(this.novel.getCurrentPage().join(''))
    }

    private _updateMode3 (action: number, page: number): void {
        if (!this.tray) return
        let content = ''
        switch (action) {
        case 0:
            content = this.novel.getCurrentPage().join('')
            break
        case 1:
            content = this.novel.getNextPage().join('')
            break
        case -1:
            content = this.novel.getPreviousPage().join('')
            break
        case 2:
            content = this.novel.jumpTo(page).join('')
            break
        }
        this.tray.setTitle(content)
    }

    private _hideMode3 (): void {
        if (this.tray) this.tray.setTitle('')
    }

    private _switchMode (mode?: number):void {
        this.displayMode = mode || this.displayMode
        switch (this.displayMode) {
        case 3:
            // check page size
            this._checkPageSize(this.displayMode)
            this._showMode3()
            this._hideMode2()
            this._hideMode1()
            this.db.set('display_mode', this.displayMode)
            break
        case 2:
            // check page size
            this._checkPageSize(this.displayMode)
            this._hideMode3()
            this._showMode2()
            this._hideMode1()
            this.db.set('display_mode', this.displayMode)
            break
        case 1:
            // reset tray
            this._hideMode3()
            this._hideMode2()
            this._showMode1()
            this.db.set('display_mode', this.displayMode)
        }
    }

    private _toggleAll (): void {
        switch (this.displayMode) {
        case 1:
            this.novelReader && !this.novelReader.isDestroyed() ? this._hideMode1() : this._showMode1()
            break
        case 2:
            this.touchBarReader && !this.touchBarReader.isDestroyed() ? this._hideMode2() : this._showMode2()
            break
        case 3:
            this.tray && this.tray.getTitle().length > 0 ? this._hideMode3() : this._showMode3()
            break
        }
    }

    private _registHotKey (key: string, cb: callbackFunction) {
        if (globalShortcut.isRegistered(key)) globalShortcut.unregister(key)
        globalShortcut.register(key, cb)
    }

    private _customEvents = (): void => {
        // Debug
        ipcMain.on('debug', (e, args) => {
            console.log(args, 'debug')
        })

        // DB
        ipcMain.on('settings:pick-file', (e) => {
            if (!this.settingPanel) return
            dialog.showOpenDialog(this.settingPanel, {
                title: '请选择要打开的文件',
                filters: [
                    { name: 'TXT', extensions: ['txt'] },
                    { name: 'All Files', extensions: ['*'] }
                ],
                properties: ['openFile', 'showHiddenFiles']
            }).then((res: Electron.OpenDialogReturnValue):void => {
                if (!res.canceled && res.filePaths.length > 0) e.sender.send('settings:pick-file-reply', res.filePaths[0])
            })
        })

        ipcMain.handle('db:loads', (e, args) => {
            const rs: {[name: string]: string | number | boolean | null } = {}
            args.forEach((v:string) => {
                rs[v] = this.db.get(v) || null
            })
            return rs
        })

        ipcMain.handle('db:save', (e, args) => {
            let rs = 1

            try {
                args = JSON.parse(args)
                Object.getOwnPropertyNames(args).forEach((key:string) => {
                    this.db.set(key, args[key])
                })
            } catch (err) {
                console.error(err)
                rs = 0
            }
            // try to update novel
            if (this.novelReader && !this.novelReader.isDestroyed()) {
                this.novelReader.webContents.send('db:update', JSON.stringify(args))
            }
            return rs
        })

        // Novel Events
        ipcMain.on('novel:previous', () => this._turnPage(-1))

        ipcMain.on('novel:current', () => this._turnPage(0))

        ipcMain.on('novel:next', () => this._turnPage(1))

        // Search
        ipcMain.on('novel:search', (e, args) => {
            e.sender.send('novel:search-reply', this.novel.searchText(args))
        })
        ipcMain.on('novel:jumpTo', (e, args) => {
            this._turnPage(2, args)
        })
    }

    private _turnPage = (action: number, page = 0): void => {
        switch (this.displayMode) {
        case 1:
            this._updaeMode1(action, page)
            break
        case 2:
            this._updateMode2(action, page)
            break
        case 3:
            this._updateMode3(action, page)
            break
        }
    }

    private _checkPageSize (mode: number): void {
        const pageSize = this.db.get('page_size')
        if (mode === 3 && pageSize >= 18) {
            dialog.showMessageBox({
                type: 'warning',
                title: '错误',
                message: '任务栏模式字数无法超过18个,请在设置中更改',
                buttons: ['确认']
            })
        } else if (mode === 2 && pageSize >= 60) {
            dialog.showMessageBox({
                type: 'warning',
                title: '错误',
                message: 'TouchBar模式字数无法超过60个,请在设置中更改',
                buttons: ['确认']
            })
        }
    }

    public destroy = ():void => {
        this.app.quit()
    }

    public hideDock = ():void => {
        this.app.dock.hide()
    }
}

export default MoFish
