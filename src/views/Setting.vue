<template>
  <el-container class="container">
    <el-main>
      <el-form>
        <el-row>
          <el-col :span="24">
            <el-form-item label="小说路径">
              <el-input class="file_path_input" size="mini" v-model="configs.file_path" placeholder="请选择小说路径" prefix-icon="el-icon-tickets">
                <template v-slot:prepend>
                  <el-checkbox :border="false" size="mini" id="lm" v-model="configs.exceptionCode">乱码</el-checkbox>
                </template>
                <template v-slot:append>
                  <el-button type="primary" size="mini" @click="filePicker">
                    <i class="el-icon-folder-opened"></i>
                  </el-button>
                </template>
              </el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="文字颜色">
              <el-color-picker v-model="configs.txt_color" show-alpha></el-color-picker>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="背景颜色">
              <el-color-picker v-model="configs.bg_color" show-alpha></el-color-picker>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="当前页数">
              <el-input-number size="mini" :min="1" v-model="configs.current_page"></el-input-number>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="每页字数">
              <el-input-number size="mini" :min="5" v-model="configs.page_size" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="换行符号">
              <el-input style="width: 130px;" v-model="configs.line_break" placeholder="换行符号" prefix-icon="el-icon-sugar" size="mini" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="字体大小">
              <el-input-number size="mini" :min="10" v-model="configs.font_size" :max="40" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="显示速度">
              <el-select v-model="configs.type_speed" size="mini" placeholder="显示速度" style="width: 130px;">
                <el-option v-for="item in speedOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="14">
            <el-form-item label="上一页">
              <el-select v-model="configs.previous_hotkey_1" size="mini" placeholder="请选择">
                <el-option v-for="item in hotKeyOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
              <span class="hot_key_item">+</span>
            </el-form-item>
          </el-col>
          <el-col :span="8" :pull="2" :offset="2">
            <el-form-item>
              <el-input v-model="configs.previous_hotkey_2" maxlength="10" size="mini" placeholder="请输入按键" prefix-icon="el-icon-grape"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="14">
            <el-form-item label="下一页">
              <el-select v-model="configs.next_hotkey_1" size="mini" placeholder="请选择">
                <el-option v-for="item in hotKeyOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
              <span class="hot_key_item">+</span>
            </el-form-item>
          </el-col>
          <el-col :span="8" :pull="2" :offset="2">
            <el-form-item>
              <el-input v-model="configs.next_hotkey_2" maxlength="10" size="mini" placeholder="请输入按键" prefix-icon="el-icon-grape"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="14">
            <el-form-item label="老板键">
              <el-select v-model="configs.ninja_hotkey_1" size="mini" placeholder="请选择">
                <el-option v-for="item in hotKeyOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
              <span class="hot_key_item">+</span>
            </el-form-item>
          </el-col>
          <el-col :span="8" :pull="2" :offset="2">
            <el-form-item>
              <el-input v-model="configs.ninja_hotkey_2" maxlength="10" size="mini" placeholder="请输入按键" prefix-icon="el-icon-grape"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="14" class="hidden">
            <el-form-item label="自动翻">
              <el-select v-model="configs.autoplay_hotkey_1" size="mini" placeholder="请选择">
                <el-option v-for="item in hotKeyOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
              <span class="hot_key_item">+</span>
            </el-form-item>
          </el-col>
          <el-col :span="8" :pull="2" :offset="2" class="hidden">
            <el-form-item>
              <el-input v-model="configs.autoplay_hotkey_2" maxlength="10" size="mini" placeholder="请输入按键" prefix-icon="el-icon-grape"></el-input>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="24">
            <el-button type="primary" size="mini" style="width: 100%" @click="saveConfig">保存</el-button>
          </el-col>
        </el-row>
      </el-form>
    </el-main>
  </el-container>
</template>

<script>
import { defineComponent } from 'vue'
import { ipcRenderer } from 'electron'

export default defineComponent({
    name: 'Setting',
    data: () => ({
        configs: {
            file_path: '',
            is_chinese: true,
            current_page: 1,
            page_size: 5,
            font_size: 12,
            line_break: ' ',
            bg_color: 'rgba(255,255,255, 0.5)',
            txt_color: 'rgba(0,0,0,1)',
            type_speed: 0,
            previous_hotkey_1: 'CmdOrCtrl+Alt',
            previous_hotkey_2: ',',
            next_hotkey_1: 'CmdOrCtrl+Alt',
            next_hotkey_2: '.',
            ninja_hotkey_1: 'CmdOrCtrl+Alt',
            ninja_hotkey_2: 'm',
            autoplay_hotkey_1: 'CmdOrCtrl+Alt',
            autoplay_hotkey_2: 'n',
            show_page_num: !1
        },
        display_mode: 1,
        exceptionCode: '',
        hotKeyOptions: [
            { value: 'Alt', label: 'Alt' },
            { value: 'CmdOrCtrl', label: 'CmdOrCtrl' },
            { value: 'CmdOrCtrl+Alt', label: 'CmdOrCtrl+Alt' }
        ],
        speedOptions: [
            { value: 0, label: '直接切换' },
            { value: 20, label: '较快速度' },
            { value: 40, label: '中等速度' },
            { value: 60, label: '缓慢速度' }
        ],
        cache_page: 1
    }),
    methods: {
        filePicker: function () {
            ipcRenderer.send('settings:pick-file')
        },
        saveConfig: function () {
            ipcRenderer.invoke('db:save', JSON.stringify(this.configs)).then(rs => {
                if (rs === 1) {
                    this.$message({
                        message: '保存成功，请开始摸鱼吧!',
                        type: 'success',
                        showClose: true
                    })
                    if (this.configs.current_page !== this.cache_page) {
                        this.cache_page = this.configs.current_page
                        ipcRenderer.send('novel:jumpTo', this.configs.current_page)
                    }
                } else {
                    this.$message({
                        message: '保存失败!',
                        type: 'error',
                        showClose: true
                    })
                }
            })
        },
        _initConfigs: function () {
            const keys = Object.keys(this.configs)
            ipcRenderer.invoke('db:loads', keys).then((configs) => {
                keys.forEach(k => {
                    if (configs[k] !== null) this.configs[k] = configs[k]
                })
            })
            this.cache_page = this.configs.current_page
        },
        // check globalShortCut
        _filePicked: function () {
            ipcRenderer.on('settings:pick-file-reply', (e, file) => {
                // init page num
                if (this.configs.file_path.length > 0 && this.configs.file_path !== file) {
                    this.configs.current_page = 1
                }
                this.configs.file_path = file
            })
        }
    },
    created () {
        this._initConfigs()
        this._filePicked()
    }
})
</script>

<style scoped>
.file_path_input {
  width: calc(100% - 68px);
  position: relative;
  top: 7px;
}
.hot_key_item {
  padding-left: 15px;
}
.el-form-item {
  margin-bottom: 10px;;
}
.el-divider--horizontal {
  margin-top: 14px;
}
.hidden {
  display: none;
}
</style>
