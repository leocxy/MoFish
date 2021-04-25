'use strict'
import lowdb from 'lowdb'
import FileSync from 'lowdb/adapters/FileSync'
import path from 'path'

const DEFAULT_CONFIGS: {[key: string]: string| number | boolean} = {
    // setting
    file_path: '',
    is_chinese: false,
    current_page: 1,
    page_size: 20,
    font_size: 14,
    line_break: ' ',
    bg_color: 'rgba(0, 0, 0, 0.8)',
    txt_color: 'rgba(255, 255, 255, 1)',
    type_speed: 0,
    previous_hotkey_1: 'CmdOrCtrl+Alt',
    previous_hotkey_2: ',',
    next_hotkey_1: 'CmdOrCtrl+Alt',
    next_hotkey_2: '.',
    ninja_hotkey_1: 'CmdOrCtrl+Alt',
    ninja_hotkey_2: 'm',
    autoplay_hotkey_1: 'CmdOrCtrl+Alt',
    autoplay_hotkey_2: 'n',
    // Other
    auto_page_delay: 5, // 5 seconds
    auto_page: !1, // true or false
    is_mouse: !1,
    show_page_num: !0,
    display_mode: 1, // 1 => WindowPanel, 2 => TouchBar, 3 => TaskBar
    default_text: 'Hello World',
    // Panel Setting
    panel_size: '856,47',
    panel_pos: '356,429'
}

class SettingDB {
    filePath: string
    fileJson: lowdb.AdapterSync
    db: Lowdb.lowdb
    constructor (app: Electron.App) {
        this.filePath = app.getPath('userData')
        // https://www.electronjs.org/docs/api/app#appgetpathname

        this.fileJson = new FileSync(path.join(this.filePath, 'mo-fish.json'))
        // Init DB
        this.db = lowdb(this.fileJson)

        // Different OS different default mode @todo

        for (const x in DEFAULT_CONFIGS) {
            if (!this.db.has(x).value()) {
                this.db.set(x, DEFAULT_CONFIGS[x]).write()
            }
        }
    }

    get (key: string):string | number | boolean {
        return this.db.get(key).value()
    }

    set (key: string, val: string | number | boolean):string | number | boolean {
        return this.db.set(key, val).write()
    }
}

export default SettingDB
