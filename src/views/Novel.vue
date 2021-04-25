<template>
    <el-container class="container" :style="color">
        <div class="text" @click="onMouse(1)" @contextmenu.prevent="onMouse(2)">
            <div class="text-content">
                {{ show_text }}
                <span class="blink-caret" :style="caret"></span>
                <span class="page_num">{{ page_num }}</span>
            </div>
        </div>
    </el-container>
</template>

<script>
import { defineComponent } from 'vue'
import { ipcRenderer } from 'electron'
import delay from 'lodash/delay'

export default defineComponent({
    name: 'Novel',
    data: () => ({
        bg_color: '',
        txt_color: '',
        font_size: 14,
        text: '',
        default_text: '',
        type_speed: 0,
        page_num: '',
        is_mouse: false,
        delayId: []
    }),
    computed: {
        color: function () {
            return `font-size: ${this.font_size}px;` +
            (this.bg_color.length > 0 ? `background: ${this.bg_color};` : '') +
            (this.txt_color.length > 0 ? `color: ${this.txt_color};` : '')
        },
        caret: function () {
            return `border-color: ${this.txt_color}`
        },
        show_text: function () {
            return this.text.length > 0 ? this.text : this.default_text
        }
    },
    methods: {
        _init: function () {
            // Register event
            ipcRenderer.on('novel:update', (e, text) => {
                this.text = ''
                this.delayId.forEach((e) => clearTimeout(e))
                this.delayId = []
                // display text
                this.displayText(text)
                // Set Page Num
                this.page_num = text[1] || ''
            })
            // Update Config Event
            ipcRenderer.on('db:update', (e, args) => {
                try {
                    args = JSON.parse(args)
                    this.bg_color = args.bg_color || this.bg_color
                    this.txt_color = args.txt_color || this.txt_color
                    this.font_size = args.font_size || this.font_size
                    this.is_mouse = args.is_mouse || this.is_mouse
                    this.type_speed = args.type_speed === undefined ? this.type_speed : args.type_speed
                } catch (err) {
                    console.error(err)
                }
            })
            // Load Configs
            const keys = ['bg_color', 'txt_color', 'font_size', 'is_mouse', 'default_text', 'type_speed']
            ipcRenderer.invoke('db:loads', keys).then((configs) => {
                keys.forEach(k => {
                    if (configs[k] !== null) this.$data[k] = configs[k]
                })
                // Get Current Page Text
                ipcRenderer.send('novel:current')
            })
        },
        onMouse: function (v) {
            if (!this.is_mouse) return
            switch (v) {
            case 1: // Click
                ipcRenderer.send('novel:next')
                break
            case 2: // Right click
                ipcRenderer.send('novel:previous')
                break
            }
        },
        displayText: function (text) {
            console.log(this.type_speed)
            if (this.type_speed > 0) {
                // type mode
                text[0].split('').forEach((val, index) => {
                    this.delayId.push(delay(() => { this.text += val }, index * this.type_speed))
                })
            } else {
                // normal mode
                this.text = text[0]
            }
        }
    },
    created () {
        this._init()
    }
})
</script>

<style scoped lang="scss">
.container {
    height: 100%;
    margin: -8px;
    .text {
        height: calc(100vh - 10px);
        width: 100%;
        padding: 5px 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        -webkit-app-region: drag;
        cursor: pointer;
        overflow: hidden;
        .text-content {
            display: block;
            width: 100%;
            height: 100%;
            -webkit-app-region: no-drag;
            position: relative;
            .blink-caret {
                border-right: .15em solid #fff;
                animation: blink-caret .75s step-end infinite;
            }
            .page_num {
                display: inline-block;
                position: absolute;
                bottom: 0;
                right: 0;
            }
        }
    }
}

@keyframes blink-caret {
    from, to { border-color: transparent }
    50% { border-color: inherit }
}
</style>
