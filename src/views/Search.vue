<template>
    <el-container class="container">
        <el-header class="header">
            <el-row class="search_panel">
                <el-col :span="18">
                    <el-input class="search_input" v-model="query" placeholder="搜索内容" prefix-icon="el-icon-search" size="mini" autocomplete="off" @keyup.enter="search"></el-input>
                </el-col>
                <el-col :span="6">
                    <el-button class="search_btn" type="primary" icon="el-icon-search" size="mini" @click="search" />
                </el-col>
            </el-row>
        </el-header>
        <el-main class="main-content">
            <el-row>
                <template v-if="results.length > 0">
                    <el-col :span="24" class="result" v-for="(item, index) in results" :key="index" @click="jumpTo(item.page)">{{ item.text }} <span class="page">页:{{ item.page }}</span></el-col>
                </template>
                <template v-else>
                    <el-col :span="24" class="result empty">暂无内容</el-col>
                </template>
            </el-row>
        </el-main>
    </el-container>
</template>

<script>
import { defineComponent } from 'vue'
import { ipcRenderer } from 'electron'

export default defineComponent({
    name: 'Search',
    data: () => ({
        query: '',
        results: []
    }),
    methods: {
        search: function () {
            if (this.query.trim().length < 5) {
                this.$message({
                    message: '请最少输入5个字符以上',
                    type: 'error',
                    showClose: true
                })
                return
            }
            ipcRenderer.send('novel:search', this.query)
        },
        searchCb: function () {
            ipcRenderer.on('novel:search-reply', (e, data) => {
                this.results = data
            })
        },
        jumpTo: function (page) {
            ipcRenderer.send('novel:jumpTo', page)

            this.$message({
                message: '已经跳转到给页面',
                type: 'success',
                showClose: true
            })
        }
    },
    created () {
        this.searchCb()
    }
})
</script>

<style>
body {
    margin: 0;
    padding: 0;
}
</style>

<style lang='scss' scoped>
.contianer {
    width: 100%;
    height: 100vh;;
}

.header {
    background: #c6c6c6;
    .search_panel {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100%;
        .search_btn {
            width: 100%;
        }
    }
}

.main-content {
    padding: 0;
    color: hsl(0, 0%, 37%);
    max-height: calc(100vh - 60px);
    overflow-x: scroll;
    .result {
        padding: 10px;
        font-size: 14px;
        cursor: pointer;
        background-image: linear-gradient(to left, #b1e8f8, hsl(194, 43%, 90%));
        background-position: 0 0;
        background-size: 200% 200%;
        transition: background-position 0.5s ease-in-out;
        border-top: 1px solid #c6c6c6;
        position: relative;
        &:hover {
            background-position: -100%;
        }
        .page {
            float: right;
        }
    }
    .empty {
        text-align: center;
    }
}
</style>
