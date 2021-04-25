'use strict'
import SettingDB from './db'
import fs from 'fs'
import iconv from 'iconv-lite'

interface SearchResult {
    page: number,
    text: string
}

class Novel {
    currentPage: number
    pageSize: number
    lastPage = 1
    filePath: string
    cachePath = ''
    isChinese: boolean
    lineBreak: string
    showPageNum: boolean
    novel = 'TXT小说路径不存在或路径不正确'
    db: SettingDB
    mode = 1
    startNum = 0
    endNum = 20

    constructor (db: SettingDB) {
        this.db = db
        this.filePath = this.db.get('file_path') || ''
        this.currentPage = this.db.get('current_page') || 1
        this.pageSize = this.db.get('page_size') || 20
        this.isChinese = this.db.get('is_chinese') || false
        this.lineBreak = this.db.get('line_break') || ' '
        this.showPageNum = this.db.get('show_page_num') || false
    }

    private _reloadSetting ():void {
        const oldPageSize = this.pageSize
        const oldCurrentPage = this.currentPage
        this.filePath = this.db.get('file_path') || ''
        this.currentPage = this.db.get('current_page') || 1
        this.pageSize = this.db.get('page_size') || 20
        this.isChinese = this.db.get('is_chinese') || false
        this.lineBreak = this.db.get('line_break') || ' '
        this.showPageNum = this.db.get('show_page_num') || false
        // Reset Current Page
        if (oldPageSize !== this.pageSize) {
            const newCurrentPage = oldPageSize * oldCurrentPage / this.pageSize
            this.currentPage = (oldPageSize > this.pageSize) ? Math.floor(newCurrentPage) : Math.ceil(newCurrentPage)
        }
    }

    private _readFile (): string {
        if (this.filePath === '') {
            this.novel = 'TXT小说路径不存在或路径不正确'
            return this.novel
        }
        if (this.cachePath === this.filePath) return this.novel
        try {
            let data: Buffer | string = fs.readFileSync(this.filePath)
            const chatCode = this.isChinese ? 'gb2312' : 'utf-8'
            // Convert buffer to string
            data = iconv.decode(data, chatCode)
            /* eslint-disable */
            data = data.toString().replace(/\n/g, this.lineBreak).replace(/\r/g, ' ').replace(/　　/g, ' ').replace(/ /g, ' ')
            /* eslint-enable */
            // Calculate Last Page num
            this._getNovelSize(data)
            this.novel = data
        } catch (err) {
            this.novel = 'TXT小说路径不存在或路径不正确'
        }
        return this.novel
    }

    private _getNovelSize (text: string): void {
        this.lastPage = Math.ceil(text.length / this.pageSize)
    }

    private _turnPage (action: string, val = 0): string[] {
        let pageNum = ''
        if (this.filePath === '') return [this.novel, pageNum]
        switch (action) {
        case 'previous':
            val = -1
            break
        case 'next':
            val = 1
            break
        case 'current':
            val = 0
            break
        case 'jumpTo':
            this.currentPage = val
            val = 0
        }
        this.currentPage += val
        // Update DB
        this.db.set('current_page', this.currentPage)
        // Page Num
        if (this.showPageNum) pageNum = ` ${this.currentPage}/${this.lastPage}`
        this.endNum = this.currentPage * this.pageSize
        this.startNum = this.endNum - this.pageSize
        return [this.novel.substring(this.startNum, this.endNum), pageNum]
    }

    public getPreviousPage ():string[] {
        this._reloadSetting()
        this._readFile()
        return this._turnPage('previous')
    }

    public getNextPage ():string[] {
        this._reloadSetting()
        this._readFile()
        return this._turnPage('next')
    }

    public getCurrentPage ():string[] {
        this._readFile()
        return this._turnPage('current')
    }

    public jumpTo (val: number):string[] {
        this._readFile()
        return this._turnPage('jumpTo', val)
    }

    public searchText (text:string): Array<SearchResult> {
        this._readFile()
        const reg = new RegExp(text, 'g')
        const results = []
        let page:number
        let match
        while ((match = reg.exec(this.novel)) !== null) {
            page = Math.floor(match.index / this.pageSize)
            results.push({ page: page, text: this.novel.substring(page * this.pageSize, page * this.pageSize + 50) })
            // console.log(`Found ${match[0]} start=${match.index} end=${reg.lastIndex}.`);
        }
        return results
    }
}

export default Novel
