<template>
    <v-dialog
        v-model="open"
        persistent
        max-width="1700"
        content-class="preview-dialog"
        :no-click-animation="true"
        :fullscreen="$vuetify.breakpoint.xs"
        :transition="$vuetify.breakpoint.xs ? 'slide-y-reverse-transition' : 'dialog-transition'"
    >
        <v-card class="preview-card" :class="$vuetify.breakpoint.xs ? 'rounded-0' : ''" v-if="show">
            <div class="d-flex flex-column">
                <h3 class="text-subtitle-1 pl-3 pr-0 py-2">
                    <v-icon class="float-left">mdi-{{ icon }}</v-icon>
                    <span class="title-span text-truncate float-left">{{ name }}</span>
                    <v-btn icon small class="float-right mr-3" :title="$t('close')" @click="closePreview">
                        <v-icon>mdi-close</v-icon>
                    </v-btn>
                    <v-btn icon small class="float-right mr-1 download-btn" :title="$t('download')" :href="blob" :download="name">
                        <v-icon>mdi-arrow-collapse-down</v-icon>
                    </v-btn>
                    <span class="float-right mr-2 ml-0" :class="$vuetify.theme.dark ? 'grey--text text--darken-2' : 'grey--text text--lighten-2'" v-show="((type === 'svg' || type === 'markdown' || type === 'csv' || type === 'code' || type === 'text') && (rawView || !$vuetify.breakpoint.smAndDown)) || ((type === 'svg' || type === 'markdown' || type === 'csv') && $vuetify.breakpoint.smAndDown)">|</span>
                    <v-btn icon small class="float-right mr-1 breakline-btn" :title="rawView ? $t('preview') : $t('raw_view')" v-show="(type === 'svg' || type === 'markdown' || type === 'csv') && $vuetify.breakpoint.smAndDown" @click="rawView = !rawView">
                        <v-icon>mdi-{{ rawView ? 'eye' : 'xml' }}</v-icon>
                    </v-btn>
                    <v-btn :color="csvHead ? 'primary' : ''" icon small class="float-right mr-2" :title="csvHead ? $t('head_row') : $t('no_head_row')" v-show="type === 'csv' && (!rawView || !$vuetify.breakpoint.smAndDown)" @click="toggleCsv">
                        <v-icon :class="csvHead ? 'primary--text' : ''">mdi-card-text-outline</v-icon>
                    </v-btn>
                    <v-btn :color="breakLine ? 'primary' : ''" icon small class="float-right mr-2 breakline-btn" :title="$t('breakline')" v-show="(type === 'svg' || type === 'markdown' || type === 'csv' || type === 'code' || type === 'text') && (rawView || !$vuetify.breakpoint.smAndDown)" @click="breakLine = !breakLine">
                        <v-icon :class="breakLine ? 'primary--text' : ''">mdi-subdirectory-arrow-left</v-icon>
                    </v-btn>
                </h3>
                <div class="main-content" :class="$vuetify.breakpoint.xs ? 'size-small' : 'size-large'">
                    <pre v-if="type === 'code'" class="text-pre hljs-pre" :class="{ breakline: breakLine }"><code :class="`language-${fileExt}`" ref="codeele"></code></pre>
                    <pre v-if="type === 'text'" class="text-pre hljs-pre" :class="{ breakline: breakLine }">{{ content }}</pre>
                    <div v-if="type === 'svg'" class="svg-viewer" :class="{ 'small-view': $vuetify.breakpoint.smAndDown}">
                        <pre class="text-pre hljs-pre" :class="{ breakline: breakLine, hide: !rawView }"><code class="language-svg" ref="codeelesvg"></code></pre>
                        <div class="image-viewer-split" :class="{ hide: rawView }">
                            <div class="image-viewer" v-viewer.static="imageViewer">
                                <img :src="svgBlob">
                            </div>
                        </div>
                    </div>
                    <div v-if="type === 'csv'" class="csv-viewer" :class="{ 'small-view': $vuetify.breakpoint.smAndDown}">
                        <pre class="text-pre hljs-pre" :class="{ breakline: breakLine, hide: !rawView }"><code class="language-csv" ref="codeelecsv"></code></pre>
                        <div class="table-view" :class="{ hide: rawView }">
                            <v-data-table
                                :headers="tableHead"
                                :items="tableData"
                                :items-per-page="30"
                                :locale="tableLocale"
                                :footer-props="{
                                    itemsPerPageOptions: [15, 30, 50, 100, -1]
                                }"
                                mobile-breakpoint="0"
                                height="100%"
                                fixed-header
                            ></v-data-table>
                        </div>
                    </div>
                    <div v-if="type === 'markdown'" class="md-viewer" :class="{ 'small-view': $vuetify.breakpoint.smAndDown}">
                        <pre class="text-pre hljs-pre" :class="{ breakline: breakLine, hide: !rawView }" ref="codescroll" data-scrollname="code" @scroll.passive="handleScroll"><code class="language-md" ref="codeelemd"></code></pre>
                        <div class="md-view" :class="{ hide: rawView }" ref="renderscroll" data-scrollname="render" @scroll.passive="handleScroll"><div ref="render"></div></div>
                    </div>
                    <iframe
                        v-if="type === 'pdf'"
                        class="pdf-iframe"
                        frameborder="0"
                        allowtransparency="true"
                        sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-forms allow-scripts allow-modals"
                        :src="`/pdf-viewer/web/viewer.html?file=${encodeURIComponent(blob)}&theme=${$vuetify.theme.dark ?'dark' : 'light'}#pagemode=none`"
                    ></iframe>
                    <div v-if="type === 'image'" class="image-viewer" v-viewer.static="imageViewer">
                        <img :src="blob">
                    </div>
                    <div v-if="type === 'audio'" class="audio-player">
                        <audio controls controlsList="nodownload noremoteplayback">
                            <source :src="blob" :type="audioType">
                            <p class="grey--text mb-0">{{ $t('audio_unsupported') }}</p>
                        </audio>
                    </div>
                    <div v-if="type === 'video'" class="video-player">
                        <video controls controlslist="nodownload noremoteplayback" playsinline>
                            <source :src="blob" :type="videoType">
                            <p class="grey--text mb-0">{{ $t('video_unsupported') }}</p>
                        </video>
                    </div>
                </div>
            </div>
        </v-card>
    </v-dialog>
</template>

<script>
import { mapState } from 'vuex';
import VueViewer from 'v-viewer/dist/v-viewer.min';
import * as csv from 'csvtojson';
import Vue from 'vue';
import markdown from 'markdown-it';
import renderMathInElement from 'katex/contrib/auto-render/auto-render';
import 'katex/contrib/copy-tex/copy-tex';
import hljs from 'highlight.js/lib/core';

import mdTaskLists from 'markdown-it-task-lists';
import mdLinkAttr from 'markdown-it-link-attributes';
import mdMark from 'markdown-it-mark';
import mdSub from 'markdown-it-sub';
import mdSup from 'markdown-it-sup';
import mdSpan from 'markdown-it-bracketed-spans';
import mdAttrs from 'markdown-it-attrs';
import mdTable from 'markdown-it-multimd-table';
import mdContainer from 'markdown-it-container';

import javascript from 'highlight.js/lib/languages/javascript';
import python from 'highlight.js/lib/languages/python';
import php from 'highlight.js/lib/languages/php';
import armasm from 'highlight.js/lib/languages/armasm';
import bash from 'highlight.js/lib/languages/bash';
import purec from 'highlight.js/lib/languages/c';
import cpp from 'highlight.js/lib/languages/cpp';
import css from 'highlight.js/lib/languages/css';
import go from 'highlight.js/lib/languages/go';
import xml from 'highlight.js/lib/languages/xml';
import haskell from 'highlight.js/lib/languages/haskell';
import json from 'highlight.js/lib/languages/json';
import java from 'highlight.js/lib/languages/java';
import latex from 'highlight.js/lib/languages/latex';
import lisp from 'highlight.js/lib/languages/lisp';
import lua from 'highlight.js/lib/languages/lua';
import md from 'highlight.js/lib/languages/markdown';
import rust from 'highlight.js/lib/languages/rust';
import shell from 'highlight.js/lib/languages/shell';
import typescript from 'highlight.js/lib/languages/typescript';
import verilog from 'highlight.js/lib/languages/verilog';
import ruby from 'highlight.js/lib/languages/ruby';
import sql from 'highlight.js/lib/languages/sql';
import less from 'highlight.js/lib/languages/less';
import scss from 'highlight.js/lib/languages/scss';
import yaml from 'highlight.js/lib/languages/yaml';
import docker from 'highlight.js/lib/languages/dockerfile';
import csvLang from '@/tools/csvHighlight';

import 'viewerjs/dist/viewer.css';
import 'katex/dist/katex.css';
import 'katex/contrib/copy-tex/copy-tex.css';

hljs.registerLanguage('js', javascript);
hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('py', python);
hljs.registerLanguage('python', python);
hljs.registerLanguage('php', php);
hljs.registerLanguage('arm', armasm);
hljs.registerLanguage('sh', bash);
hljs.registerLanguage('bash', bash);
hljs.registerLanguage('c', purec);
hljs.registerLanguage('cpp', cpp);
hljs.registerLanguage('c++', cpp);
hljs.registerLanguage('css', css);
hljs.registerLanguage('go', go);
hljs.registerLanguage('html', xml);
hljs.registerLanguage('htm', xml);
hljs.registerLanguage('xml', xml);
hljs.registerLanguage('svg', xml);
hljs.registerLanguage('vue', xml);
hljs.registerLanguage('hs', haskell);
hljs.registerLanguage('haskell', haskell);
hljs.registerLanguage('json', json);
hljs.registerLanguage('java', java);
hljs.registerLanguage('tex', latex);
hljs.registerLanguage('latex', latex);
hljs.registerLanguage('dtx', latex);
hljs.registerLanguage('ins', latex);
hljs.registerLanguage('sty', latex);
hljs.registerLanguage('lisp', lisp);
hljs.registerLanguage('lua', lua);
hljs.registerLanguage('md', md);
hljs.registerLanguage('rs', rust);
hljs.registerLanguage('rust', rust);
hljs.registerLanguage('ts', typescript);
hljs.registerLanguage('typescript', typescript);
hljs.registerLanguage('v', verilog);
hljs.registerLanguage('verilog', verilog);
hljs.registerLanguage('rb', ruby);
hljs.registerLanguage('ruby', ruby);
hljs.registerLanguage('sql', sql);
hljs.registerLanguage('less', less);
hljs.registerLanguage('scss', scss);
hljs.registerLanguage('yaml', yaml);
hljs.registerLanguage('yml', yaml);
hljs.registerLanguage('docker', docker);
hljs.registerLanguage('dockerfile', docker);
hljs.registerLanguage('csv', csvLang);
hljs.registerLanguage('shell', shell);

Vue.use(VueViewer);

let scroller = 0;

export default {
    name: 'previewer',
    props: {
        content: String,
        blob: String,
        type: String,
        name: String,
        icon: String,
    },
    data() {
        return {
            open: false,
            show: false,
            svgBlob: '',
            breakLine: false,
            rawView: false,
            csvHead: true,
            tableHead: [],
            tableData: [],
            md: null,
            imageViewer: {
                inline: true,
                button: false,
                navbar: false,
                title: false,
                toolbar: false,
                tooltip: true,
                movable: true,
                zoomable: true,
                rotatable: false,
                scalable: true,
                transition: false,
                fullscreen: false,
                keyboard: false,
                minZoomRatio: 0.05,
                maxZoomRatio: 10,
                loading: false,
            },
        };
    },
    methods: {
        /**
         * Open preview dialog
         */
        openPreview() {
            if (this.type === 'svg') {
                // Create blob URL for svg
                this.svgBlob = URL.createObjectURL(new Blob([this.content], { type: 'image/svg+xml;charset=utf-8' }));
            } else {
                this.svgBlob = '';
            }
            this.$nextTick(() => {
                // Detect whether to breakline
                if (this.type === 'code' || this.type === 'svg' || this.type === 'csv') {
                    this.breakLine = !this.content.trim().includes('\n');
                } else {
                    this.breakLine = (this.type === 'markdown' || this.type === 'text');
                }

                // Parse CSV
                if (this.type === 'csv') {
                    // First line as header
                    csv({
                        noheader: false,
                        output: 'json',
                    }).fromString(this.content).then((csvRow) => {
                        this.tableData = csvRow;

                        // Handle empty header field
                        const heads = Object.keys(csvRow[0]).filter((val) => /^field\d+$/g.test(val)).sort();
                        let fieldCount = 0;
                        csv({
                            noheader: true,
                            output: 'csv',
                        }).fromString(this.content.split('\n')[0]).then((headRow) => {
                            this.tableHead = [];
                            // Build header, fill empty header field with fieldN
                            for (const item of headRow[0]) {
                                this.tableHead.push({
                                    text: item === '' ? heads[fieldCount] : item,
                                    value: item === '' ? heads[fieldCount] : item,
                                });
                                if (item === '' || /^field\d+$/g.test(item)) {
                                    fieldCount += 1;
                                }
                            }
                        });
                    });
                } else {
                    this.tableHead = [];
                    this.tableData = [];
                }

                this.rawView = !(this.type === 'svg' || this.type === 'csv' || this.type === 'markdown');
                this.open = true;
                this.show = true;
                this.csvHead = true;
                this.$nextTick(() => {
                    // Highlight code
                    if (this.type === 'code') {
                        this.$refs.codeele.textContent = this.content;
                        hljs.highlightElement(this.$refs.codeele);
                    } else if (this.type === 'svg') {
                        this.$refs.codeelesvg.textContent = this.content;
                        hljs.highlightElement(this.$refs.codeelesvg);
                    } else if (this.type === 'csv') {
                        this.$refs.codeelecsv.textContent = this.content;
                        hljs.highlightElement(this.$refs.codeelecsv);
                    } else if (this.type === 'markdown') {
                        this.$refs.codeelemd.textContent = this.content;
                        hljs.highlightElement(this.$refs.codeelemd);

                        // Render markdown
                        this.$refs.render.innerHTML = this.md.render(this.content);
                        // Render LaTeX
                        renderMathInElement(this.$refs.render, {
                            delimiters: [
                                { left: '$$', right: '$$', display: true },
                                { left: '$', right: '$', display: false },
                                { left: '\\(', right: '\\)', display: false },
                                { left: '\\[', right: '\\]', display: true },
                            ],
                        });
                        this.$refs.renderscroll.scrollTo(null, 0);
                    }
                });
            });
        },
        /**
         * Close preview dialog
         */
        closePreview() {
            this.open = false;
            setTimeout(() => {
                this.show = false;

                // Revoke blob URL
                URL.revokeObjectURL(this.blob);
                if (this.svgBlob !== '') {
                    URL.revokeObjectURL(this.svgBlob);
                }
                this.svgBlob = '';
            }, 500);
        },
        /**
         * Toggle the way to parse the CSV content. First line as header or as body
         */
        toggleCsv() {
            this.csvHead = !this.csvHead;
            csv({
                noheader: !this.csvHead,
                output: 'json',
            }).fromString(this.content).then((csvRow) => {
                this.tableData = csvRow;

                if (this.csvHead) {
                    // First line as header
                    const heads = Object.keys(csvRow[0]).filter((val) => /^field\d+$/g.test(val)).sort();
                    let fieldCount = 0;
                    csv({
                        noheader: true,
                        output: 'csv',
                    }).fromString(this.content.split('\n')[0]).then((headRow) => {
                        this.tableHead = [];
                        // Build header, fill empty header field with fieldN
                        for (const item of headRow[0]) {
                            this.tableHead.push({
                                text: item === '' ? heads[fieldCount] : item,
                                value: item === '' ? heads[fieldCount] : item,
                            });
                            if (item === '' || /^field\d+$/g.test(item)) {
                                fieldCount += 1;
                            }
                        }
                    });
                } else {
                    // Just fill up all header fields with fieldN
                    this.tableHead = [];
                    for (const item of Object.keys(csvRow[0]).sort()) {
                        this.tableHead.push({
                            text: item,
                            value: item,
                        });
                    }
                }
            });
        },
        /**
         * Handle scroll events between two markdown views
         * @param {Event} e scroll event
         */
        handleScroll(e) {
            if (scroller === 0) {
                // The scroll origin, calculate scroll distance and sync scroll
                scroller = 1;
                const scroll = e.target.scrollTop / (e.target.children[0].clientHeight - e.target.clientHeight + 30);
                if (e.target.dataset.scrollname === 'code') {
                    this.$refs.renderscroll.scrollTo(null, scroll * (this.$refs.renderscroll.children[0].clientHeight - this.$refs.renderscroll.clientHeight + 30));
                } else {
                    this.$refs.codescroll.scrollTo(null, scroll * (this.$refs.codescroll.children[0].clientHeight - this.$refs.codescroll.clientHeight + 30));
                }
            } else {
                // Don't sync scroll again
                scroller = 0;
            }
        },
    },
    computed: {
        ...mapState({
            localeDetail: (state) => state.localeDetail,
        }),
        tableLocale() {
            return this.localeDetail === null ? 'en' : this.localeDetail.iso;
        },
        // File extension
        fileExt() {
            const nameSplited = this.name.split('.');
            return nameSplited[nameSplited.length - 1].toLowerCase();
        },
        // File MIME type for audios
        audioType() {
            if (this.fileExt === 'mp3') {
                return 'audio/mpeg';
            }
            if (this.fileExt === 'ogg') {
                return 'audio/ogg';
            }
            if (this.fileExt === 'oga') {
                return 'audio/ogg';
            }
            if (this.fileExt === 'wav') {
                return 'audio/wav';
            }
            if (this.fileExt === 'aac') {
                return 'audio/wav';
            }
            if (this.fileExt === 'flac') {
                return 'audio/flac';
            }
            return 'audio/mpeg';
        },
        // File MIME type for videos
        videoType() {
            if (this.fileExt === 'mp4') {
                return 'video/mp4';
            }
            if (this.fileExt === 'webm') {
                return 'video/webm';
            }
            if (this.fileExt === 'ogv') {
                return 'video/ogg';
            }
            if (this.fileExt === 'm4v') {
                return 'video/mp4';
            }
            return 'video/mp4';
        },
    },
    mounted() {
        this.$i18n.locale = localStorage.getItem('language') || 'en';

        // Config markdown render
        this.md = markdown({
            html: false,
            xhtmlOut: false,
            breaks: false,
            langPrefix: 'language-',
            linkify: true,
            typographer: false,
            highlight: (str, lang) => {
                if (lang && hljs.getLanguage(lang)) {
                    try {
                        return `<pre class="hljs">${hljs.highlight(str, { language: lang, ignoreIllegals: true }, true).value}</code></pre>`;
                    } catch (__) {
                        this.$store.commit('addError', {
                            title: this.$t('hl_error'),
                            content: `${__.name}: ${__.message} ${this.$t('at')} ${this.getDate(new Date())}`,
                            type: 'warning',
                        });
                    }
                }

                return '';
            },
        });

        // Register markdown-it plugins
        this.md.use(mdTaskLists);
        this.md.use(mdLinkAttr, {
            attrs: {
                target: '_blank',
                rel: 'noreferrer noopener',
            },
        });
        this.md.use(mdMark);
        this.md.use(mdSub);
        this.md.use(mdSup);
        this.md.use(mdSpan);
        this.md.use(mdAttrs, {
            allowedAttributes: ['red', 'orange', 'yellow', 'green', 'teal', 'blue', 'purple', 'grey', 'bg-red', 'bg-orange', 'bg-yellow', 'bg-green', 'bg-teal', 'bg-blue', 'bg-purple', 'bg-grey', 'big', 'small', 'mask', 'blur', 'style'],
        });
        this.md.use(mdTable, {
            multiline: true,
            rowspan: true,
            headerless: true,
        });
        this.md.use(mdContainer, 'info');
        this.md.use(mdContainer, 'success');
        this.md.use(mdContainer, 'warning');
        this.md.use(mdContainer, 'error');
    },
    beforeDestroy() {
        // Revoke blob URLs
        if (this.blob !== '') {
            URL.revokeObjectURL(this.blob);
        }
        if (this.svgBlob !== '') {
            URL.revokeObjectURL(this.svgBlob);
        }
    },
};
</script>

<style lang="less">
.preview-dialog {
    .preview-card {
        height: 100%;
        & > div {
            height: 100%;
        }
        h3 {
            width: 100%;
            flex-grow: 0;
            .title-span {
                margin-left: 6px;
                display: block;
                line-height: 28px;
                width: calc(100% - 185px);
            }
            .download-btn i {
                font-size: 19px!important;
            }
            .breakline-btn i {
                font-size: 22px!important;
            }
            & > .v-icon {
                font-size: 20px;
                margin-top: 4px;
            }
        }
        .main-content {
            width: 100%;
            flex-grow: 1;
            display: flex;
            flex-direction: column;
            position: relative;
            overflow: hidden;
            &.size-large {
                height: calc(90vh - 48px);
            }
            &.size-small {
                height: calc(100% - 44px);
            }
            .viewer-container {
                width: 100%!important;
                height: 100%!important;
            }
            .text-pre {
                width: 100%;
                flex-grow: 1;
                overflow: auto;
            }
            .hljs-pre {
                background-color: #F5F5F5;
                padding: 15px 20px;
                code {
                    padding: 0;
                    background-color: transparent;
                    font-size: 100%;
                    display: inline-block;
                    overflow-x: visible;
                    background-color: transparent;
                }
                &.breakline {
                    white-space: pre-wrap!important;
                    word-break: break-all;
                }
            }
            .pdf-iframe {
                width: 100%;
                flex-grow: 1;
            }
            .image-viewer {
                width: 100%;
                flex-grow: 1;
                img {
                    display: none;
                }
            }
            .viewer-backdrop {
                background-color: rgba(0, 0, 0, .75);
            }
            .svg-viewer {
                display: flex;
                height: 100%;
                .text-pre, .image-viewer-split {
                    width: 50%;
                    height: 100%;
                }
                &.small-view {
                    .text-pre, .image-viewer-split {
                        width: 100%;
                        &.hide {
                            display: none;
                        }
                    }
                }
            }
            .csv-viewer {
                display: flex;
                height: 100%;
                .text-pre, .table-view {
                    width: 50%;
                    height: 100%;
                }
                .v-data-table.v-data-table--fixed-header {
                    height: calc(100% - 60px);
                }
                th.text-start, td.text-start {
                    min-width: 120px;
                }
                .v-data-footer{
                    margin-right: 0;
                    padding-right: 8px;
                    & > .v-data-footer__select > .v-input {
                        margin-left: 16px;
                    }
                    & > .v-data-footer__pagination {
                        margin: 0 16px 0 8px;
                    }
                    & > .v-data-footer__icons-before > button {
                        margin-right: 4px;
                    }
                    & > .v-data-footer__icons-after > button {
                        margin-left: 4px;
                        margin-right: 8px;
                    }
                }
                &.small-view {
                    .text-pre, .table-view {
                        width: 100%;
                        &.hide {
                            display: none;
                        }
                    }
                }
            }
            .md-viewer {
                display: flex;
                height: 100%;
                .text-pre, .md-view {
                    width: 50%;
                    height: 100%;
                }
                .md-view {
                    padding: 15px 20px;
                    overflow: auto;
                    overscroll-behavior: contain;
                    & > div {
                        overflow: hidden;
                        h1 {
                            border-bottom: 1px solid #eaecef;
                        }
                        h2 {
                            display: block;
                            font-size: 1.5em;
                            margin-block-start: 0.83em;
                            margin-block-end: 0.83em;
                            margin-inline-start: 0px;
                            margin-inline-end: 0px;
                            margin: 0;
                            font-weight: bold;
                            border-bottom: 1px solid #eaecef;
                            padding-bottom: .2rem;
                        }
                        h3 {
                            font-size: 1.25em;
                        }
                        h1, h2, h3, h4, h5, h6 {
                            margin-bottom: 0.5em;
                        }
                        hr {
                            display: block;
                            flex: 1 1 0px;
                            max-width: 100%;
                            height: 0px;
                            max-height: 0px;
                            border: solid;
                            border-width: thin 0 0 0;
                            border-color: rgba(0, 0, 0, 0.2);
                            margin-bottom: 12px;
                        }
                        .hljs {
                            margin: 5px 0 12px 0;
                            border-radius: 5px;
                            font-size: 14px;
                            padding: 10px 12px;
                            background-color: #f8f8f8;
                        }
                        ul.contains-task-list li.task-list-item {
                            list-style: none;
                            margin-left: -24px;
                        }
                        img + em {
                            color: #a1a1a1;
                            display: inline-block;
                            font-size: 14px;
                            text-align: center;
                            width: 100%;
                        }
                        .accent {
                            background-color: transparent!important;
                            border: none!important;
                            border-color: transparent!important;
                        }
                        blockquote {
                            padding-left: 12px;
                            border-left: 4px solid #EEEEEE;
                            color: #999999;
                        }
                        table {
                            border-collapse: collapse;
                            border-spacing: 0;
                            margin: 16px 0;
                            text-align: left;
                            width: 100%;
                            td, th {
                                border-bottom: 1px solid #EEEEEE;
                                padding: 8px 4px;
                            }
                            th {
                                border-bottom-width: 2px;
                            }
                        }
                        @import (less) "../../backend/css/md.css";
                        [mask] {
                            background-color: #1E1E1E;
                            color: #1E1E1E;
                            &:hover {
                                color: white;
                            }
                        }
                        [blur] {
                            filter: blur(7px);
                            transition: filter .2s;
                            &:hover {
                                filter: blur(0);
                            }
                        }
                    }
                }
                &.small-view {
                    .text-pre, .md-view {
                        width: 100%;
                        position: absolute;
                        top: 0;
                        left: 0;
                        z-index: 2;
                        &.hide {
                            z-index: 1;
                            visibility: hidden;
                        }
                    }
                }
            }
            .audio-player {
                width: 100%;
                flex-grow: 1;
                display: flex;
                justify-content: center;
                align-items: center;
                background-color: #2d2d2d;
            }
            .video-player {
                width: 100%;
                flex-grow: 1;
                display: flex;
                justify-content: center;
                align-items: center;
                background-color: #2d2d2d;
                video {
                    object-fit: scale-down;
                    object-position: 50% 50%;
                    max-width: 100%;
                    max-height: 100%;
                }
            }
        }
    }
}

#app.theme--dark .preview-dialog {
    .hljs-pre {
        background-color: #272727;
    }
    .md-view > div {
        color: rgba(255, 255, 255, .87);
        h1 {
            border-bottom: 1px solid #3A3A3A;
        }
        h2 {
            border-bottom: 1px solid #3A3A3A;
        }
        hr {
            border-color: rgba(255, 255, 255, 0.2);
        }
        blockquote {
            border-left: 4px solid #3b3b3b;
            color: #999999;
        }
        table {
            td, th {
                border-bottom: 1px solid #3b3b3b;
            }
            th {
                border-bottom-width: 2px;
            }
        }
        [purple] {
            color: #D099E0;
        }
        [mask] {
            background-color: white;
            color: white;
            &:hover {
                color: #1E1E1E;
            }
        }
    }
}
</style>

<i18n>
{
    "en": {
        "close": "Close",
        "download": "Download",
        "audio_unsupported": "Your browser doesn't support playing audio.",
        "video_unsupported": "Your browser doesn't support playing video.",
        "breakline": "Break line",
        "raw_view": "Raw view",
        "head_row": "Use first row as header: Enabled",
        "no_head_row": "Use first row as header: Disabled"
    },
    "zh": {
        "close": "关闭",
        "download": "下载",
        "audio_unsupported": "你的浏览器不支持播放音频。",
        "video_unsupported": "你的浏览器不支持播放视频。",
        "breakline": "换行",
        "raw_view": "原始视图",
        "preview": "预览视图",
        "head_row": "首行作为表头：已开启",
        "no_head_row": "首行作为表头：已关闭"
    },
    "es": {
        "close": "Cerrar",
        "download": "Descargar",
        "audio_unsupported": "Su navegador no admite la reproducción de audio",
        "video_unsupported": "Su navegador no admite la reproducción de video.",
        "breakline": "Cambiar de línea",
        "raw_view": "Vista original",
        "preview": "Vista prevía",
        "head_row": "Usar la primera línea como encabezado: habilitado",
        "no_head_row": "Usar la primera línea como encabezado: deshabilitado"
    }
}
</i18n>
