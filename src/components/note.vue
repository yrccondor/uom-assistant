<template>
    <v-card
        class="mx-auto rounded-lg note-container"
        outlined
    >
        <v-progress-circular
            indeterminate
            color="grey"
            :width="2"
            :size="18"
            class="loading"
            v-show="loading"
        ></v-progress-circular>
        <div class="note-outer">
            <div :class="{ shadow: headerShadow }" class="titles">
                <h2 class="handle" v-show="!multi">
                    {{ $t('note') }}
                    <v-icon class="ml-1 md-icon" :title="$t('md_support')">
                        mdi-language-markdown
                    </v-icon>
                    <v-btn icon small class="float-right mr-4" :title="$t('new')" @click.stop="addOne(false)">
                        <v-icon>mdi-plus</v-icon>
                    </v-btn>
                    <v-btn icon small class="float-right mr-2" :title="$t('select')" @click.stop="multi = true" v-show="notes.length > 0">
                        <v-icon>mdi-checkbox-multiple-blank-outline</v-icon>
                    </v-btn>
                </h2>
                <h2 class="handle" v-show="multi">
                    {{ formatString($t('num_selected'), [ifNotes.length]) }}
                    <v-btn icon small class="float-right mr-4" :title="allSelected ? $t('select_none') : $t('select_all')" @click.stop="selectAll">
                        <v-icon>{{ allSelected ? 'mdi-playlist-remove' : 'mdi-playlist-check' }}</v-icon>
                    </v-btn>
                    <v-btn icon small class="float-right mr-2" :title="$t('cancel_select')" @click.stop="multi = false">
                        <v-icon>mdi-close</v-icon>
                    </v-btn>
                    <span class="float-right mr-2 ml-0" :class="$vuetify.theme.dark ? 'grey--text text--darken-2' : 'grey--text text--lighten-2'" v-show="ifNotes.length > 0">|</span>
                    <v-btn icon small class="float-right mr-2" :title="$t('delete_selected')" @click.stop="removeSelectedConfirm" v-show="ifNotes.length > 0">
                        <v-icon>mdi-delete-outline</v-icon>
                    </v-btn>
                    <v-btn icon small class="float-right mr-2" :title="$t('download_selected')" @click.stop="downloadSelected" v-show="ifNotes.length > 0">
                        <v-icon>mdi-arrow-collapse-down</v-icon>
                    </v-btn>
                </h2>
            </div>
            <div class="scroll" v-if="notes.length !== 0" @scroll.passive="scrollHandler">
                <v-list flat class="list">
                    <v-list-item-group
                        v-model="ifNotes"
                        multiple
                        :color="multi ? 'primary' : ''"
                    >
                        <v-list-item v-for="(note, index) in notes" :key="index" @click.stop="multi ? null : openNote(index)" :class="{ multi }">
                            <template v-slot:default="{ active }">
                                <v-list-item-action v-show="multi">
                                    <v-checkbox :input-value="active"></v-checkbox>
                                </v-list-item-action>

                                <v-list-item-icon v-show="!multi">
                                    <v-icon>mdi-file-document-edit-outline</v-icon>
                                </v-list-item-icon>

                                <v-list-item-content>
                                    <v-list-item-title :title="note.title === $t('untitled') ? '' : note.title">{{ note.title === '' ? '' : note.title }}<em v-if="note.title === ''">{{ $t('untitled') }}</em></v-list-item-title>
                                    <v-list-item-subtitle>
                                        <span :class="{ hide: previews[index] !== '' }">
                                            <v-icon
                                                small
                                                class="time-icon"
                                            >
                                                mdi-clock-outline
                                            </v-icon>
                                            {{ getDate(new Date(note.update)) }}
                                        </span>
                                        <div class="text-truncate" v-if="previews[index] !== ''">{{ previews[index] }}</div>
                                    </v-list-item-subtitle>
                                </v-list-item-content>

                                <v-list-item-action class="delete" v-show="!multi">
                                    <div>
                                        <v-btn icon @click.stop="downloadNote(index)" :title="$t('download')">
                                            <v-icon color="grey">mdi-arrow-collapse-down</v-icon>
                                        </v-btn>
                                        <v-btn icon @click.stop="removeNote(index)" :title="$t('delete')">
                                            <v-icon color="grey">mdi-delete-outline</v-icon>
                                        </v-btn>
                                    </div>
                                </v-list-item-action>
                            </template>
                        </v-list-item>
                    </v-list-item-group>
                </v-list>
            </div>
            <div class="empty" v-else>
                {{ $t('nothing') }}
            </div>
        </div>
        <div class="editor-layer-mask" :class="{ opened: layerOpened }"></div>
        <div class="editor-layer" :class="{ opened: layerOpened }">
            <h2 class="handle">
                <v-icon class="mr-2 md-icon">
                    mdi-file-document-edit-outline
                </v-icon>
                <input type="text" v-model.trim="editingTitle" class="title-input" v-if="notes[editing]" :placeholder="$t('title_placeholder')">
                <v-btn icon @click.stop="layerOpened = false" small class="float-right mr-4">
                    <v-icon>mdi-close</v-icon>
                </v-btn>
                <v-btn icon @click.stop="mode = 'view'" v-show="mode === 'edit'" small class="float-right mr-2" :title="$t('view')">
                    <v-icon>mdi-eye</v-icon>
                </v-btn>
                <v-btn icon @click.stop="mode = 'edit'" v-show="mode === 'view'" small class="float-right mr-2" :title="$t('edit')">
                    <v-icon>mdi-pencil-outline</v-icon>
                </v-btn>
            </h2>
            <v-divider></v-divider>
            <codemirror v-model="code" :options="cmOption" class="md-editor" v-show="mode === 'edit'" :key="cmRefresh" ref="codemirror" @scroll.passive="onScroll"></codemirror>
            <div class="render-result" v-show="mode === 'view'" @scroll.passive="onScrollView" ref="renderScroll"><div ref="render"></div></div>
        </div>
        <v-dialog
            v-model="removeConfirm"
            max-width="400"
            persistent
        >
            <v-card>
                <v-card-title class="headline">
                    {{ $t('confirm') }}
                </v-card-title>
                <v-card-text>
                    {{ allSelected ? $t('remove_all') : (ifNotes.length > 1 ? formatString($t('want_remove_plural'), [ifNotes.length]) : formatString($t('want_remove'), [ifNotes.length])) }}
                </v-card-text>
                <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn
                    text
                    @click="removeConfirm = false"
                >
                    {{ $t('cancel') }}
                </v-btn>
                <v-btn
                    color="red"
                    text
                    @click="removeSelected"
                >
                    {{ $t('delete') }}
                </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
        <v-dialog
            v-model="removeNoteConfirm"
            max-width="400"
            persistent
            v-if="notes[toRemove]"
        >
            <v-card>
                <v-card-title class="headline">
                    {{ $t('confirm') }}
                </v-card-title>
                <v-card-text>
                    {{ formatString($t('want_remove_single'), [notes[toRemove].title || $t('untitled')]) }}
                </v-card-text>
                <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn
                    text
                    @click="removeNoteConfirm = false"
                >
                    {{ $t('cancel') }}
                </v-btn>
                <v-btn
                    color="red"
                    text
                    @click="removeConfirmed"
                >
                    {{ $t('delete') }}
                </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
        <v-dialog
            v-model="tooManyWarning"
            max-width="400"
            persistent
        >
            <v-card>
                <v-card-title class="headline">
                    {{ $t('too_many_title') }}
                </v-card-title>
                <v-card-text>
                    {{ $t('too_many_body') }}
                </v-card-text>
                <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn
                    color="primary"
                    text
                    @click="addOne(true)"
                >
                    {{ $t('ok') }}
                </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </v-card>
</template>

<script>
import { mapState } from 'vuex';
import { codemirror } from 'vue-codemirror';
import { vsprintf } from 'sprintf-js';
import { saveAs } from 'file-saver';
import { zipSync, strToU8 } from 'fflate';
import localForage from 'localforage';
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

import 'codemirror/mode/markdown/markdown';
import 'codemirror/mode/python/python';
import 'codemirror/mode/clike/clike';
import 'codemirror/mode/verilog/verilog';
import 'codemirror/mode/stex/stex';
import 'codemirror/mode/shell/shell';
import 'codemirror/mode/javascript/javascript';
import 'codemirror/addon/selection/active-line';
import 'codemirror/addon/edit/closebrackets';
import 'codemirror/addon/edit/matchbrackets';

import scroll from '@/mixins/scroll';

import formatDateTime from '@/tools/formatDateTime';
import debounce from '@/tools/debounce';
import csv from '@/tools/csvHighlight';

import 'codemirror/theme/xq-light.css';
import 'codemirror/lib/codemirror.css';
import 'katex/dist/katex.css';
import 'katex/contrib/copy-tex/copy-tex.css';

hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('js', javascript);
hljs.registerLanguage('python', python);
hljs.registerLanguage('php', php);
hljs.registerLanguage('arm', armasm);
hljs.registerLanguage('bash', bash);
hljs.registerLanguage('c', purec);
hljs.registerLanguage('cpp', cpp);
hljs.registerLanguage('c++', cpp);
hljs.registerLanguage('css', css);
hljs.registerLanguage('go', go);
hljs.registerLanguage('html', xml);
hljs.registerLanguage('xml', xml);
hljs.registerLanguage('vue', xml);
hljs.registerLanguage('svg', xml);
hljs.registerLanguage('haskell', haskell);
hljs.registerLanguage('json', json);
hljs.registerLanguage('java', java);
hljs.registerLanguage('latex', latex);
hljs.registerLanguage('tex', latex);
hljs.registerLanguage('lisp', lisp);
hljs.registerLanguage('lua', lua);
hljs.registerLanguage('markdown', md);
hljs.registerLanguage('md', md);
hljs.registerLanguage('rust', rust);
hljs.registerLanguage('shell', shell);
hljs.registerLanguage('typescript', typescript);
hljs.registerLanguage('ts', typescript);
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
hljs.registerLanguage('csv', csv);

export default {
    name: 'note',
    components: {
        codemirror,
    },
    props: {
        searchid: Number,
    },
    mixins: [scroll],
    data() {
        return {
            disableNew: false,
            loading: false,
            notes: [],
            ifNotes: [],
            layerOpened: false,
            timer: null,
            mode: 'view',
            md: null,
            cmRefresh: `${new Date().valueOf()}`,
            editing: 0,
            code: '',
            scrollPercentage: 0,
            multi: false,
            removeConfirm: false,
            tooManyWarning: false,
            editingTitle: '',
            previews: [],
            removeNoteConfirm: false,
            toRemove: -1,
            cmOption: {
                tabSize: 4,
                indentUnit: 4,
                styleActiveLine: true,
                lineNumbers: false,
                lineWrapping: true,
                line: true,
                mode: 'text/x-markdown',
                theme: 'xq-light',
                autoCloseBrackets: true,
                showCursorWhenSelecting: true,
                matchBrackets: true,
                insertSoftTab: true,
                extraKeys: {
                    Tab: (cm) => {
                        if (cm.somethingSelected()) {
                            cm.indentSelection('add');
                        } else {
                            cm.replaceSelection('    ', 'end');
                        }
                    },
                    'Shift-Tab': (cm) => {
                        if (cm.somethingSelected()) {
                            cm.indentSelection('subtract');
                        } else {
                            cm.indentLine(cm.getCursor().line, 'subtract');
                        }
                    },
                },
            },
            debouncedSave: debounce.debounce(function () {
                this.store();
            }, 500),
        };
    },
    methods: {
        /**
         * Add a new empty note to note list
         * @param {boolean} skip whether to skip the "too many" warning
         */
        addOne(skip) {
            // Disable the button if just clicked
            if (this.disableNew) {
                return;
            }

            if (!skip) {
                // Show a warning when the number of notes larger than 50
                if (this.notes.length >= 50) {
                    this.tooManyWarning = true;
                    return;
                }
            } else {
                this.tooManyWarning = false;
            }

            this.notes.unshift({
                title: this.$t('new_note'),
                content: '',
                update: new Date().valueOf(),
            });
            this.previews.unshift('');
            this.code = '';
            this.editing = 0;
            this.editingTitle = this.notes[this.editing].title;
            this.mode = 'edit';
            this.scrollPercentage = 0;
            this.disableNew = true;

            // Disable the button for 500ms
            setTimeout(() => {
                this.disableNew = false;
            }, 500);

            // Open editor
            this.$nextTick(() => {
                this.layerOpened = true;
                setTimeout(() => {
                    this.$refs.codemirror.codemirror.scrollTo(null, 0);
                    this.$refs.codemirror.codemirror.focus();
                }, 500);
            });
        },
        /**
         * Open a note
         * @param {number} index note index
         */
        openNote(index) {
            this.editing = index;
            this.editingTitle = this.notes[this.editing].title;
            this.code = this.notes[index].content;
            if (this.code !== '') {
                // If the note is not empty, switch to view mode
                this.mode = 'view';
                this.scrollPercentage = 0;
                this.$nextTick(() => {
                    this.layerOpened = true;

                    // Render Markdown
                    if (this.$refs.render) {
                        // Make links open in new tab
                        this.$refs.render.innerHTML = this.md.render(this.code);
                        // Render LaTeX
                        renderMathInElement(this.$refs.render, {
                            delimiters: [
                                { left: '$$', right: '$$', display: true },
                                { left: '$', right: '$', display: false },
                                { left: '\\(', right: '\\)', display: false },
                                { left: '\\[', right: '\\]', display: true },
                            ],
                        });
                        this.$refs.renderScroll.scrollTo(null, 0);
                    }
                });
            } else {
                // If the note is empty, switch to edit mode
                this.mode = 'edit';
                this.scrollPercentage = 0;
                this.$nextTick(() => {
                    this.layerOpened = true;
                    setTimeout(() => {
                        this.$refs.codemirror.codemirror.scrollTo(null, 0);
                        this.$refs.codemirror.codemirror.focus();
                    }, 500);
                });
            }
            this.$nextTick(() => {
                this.ifNotes = [];
            });
        },
        /**
         * Show a dialog before remove a note from note list
         * @param {number} index note index
         */
        removeNote(index) {
            this.removeNoteConfirm = true;
            this.toRemove = index;
        },
        /**
         * Remove a note from note list
         */
        removeConfirmed() {
            if (this.toRemove < 0) {
                return;
            }
            if (this.layerOpened) {
                this.layerOpened = false;
                setTimeout(() => {
                    this.removeConfirmed();
                }, 350);
                return;
            }
            this.editing = 0;
            this.editingTitle = '';
            this.scrollPercentage = 0;
            this.notes.splice(this.toRemove, 1);
            this.previews.splice(this.toRemove, 1);
            this.removeNoteConfirm = false;

            // If all notes are deleted, exit multi selection mode
            if (this.notes.length === 0 && this.multi) {
                this.multi = false;
            }
        },
        /**
         * Download a note
         * @param {number} index note index
         */
        downloadNote(index) {
            saveAs(new Blob([this.notes[index].content], { type: 'text/plain;charset=utf-8' }), `${this.notes[index].title === '' ? this.$t('untitled') : this.notes[index].title}.md`);
        },
        /**
         * Select all notes in multiple selection mode
         */
        selectAll() {
            if (!this.allSelected) {
                this.ifNotes = [];
                for (let index = 0; index < this.notes.length; index += 1) {
                    this.ifNotes.push(index);
                }
            } else {
                this.ifNotes = [];
            }
        },
        /**
         * Download selected notes in multiple selection mode
         */
        downloadSelected() {
            if (this.ifNotes.length === 0) {
                return;
            }
            if (this.ifNotes.length === 1) {
                // Download 1 note as .md
                this.downloadNote(this.ifNotes[0]);
            } else {
                // Download multiple notes as .zip
                const content = {};

                // Add numbers if two files names are the same
                const fileNameList = {};
                for (const index of this.ifNotes) {
                    // Add default filename if it is empty
                    let fileName = this.notes[index].title === '' ? this.$t('untitled') : this.notes[index].title;
                    if (!fileNameList[fileName]) {
                        fileNameList[fileName] = 1;
                    } else {
                        fileNameList[fileName] += 1;
                        fileName += ` (${fileNameList[fileName]})`;
                    }
                    content[`${fileName}.md`] = strToU8(this.notes[index].content);
                }

                // Zip and download them
                saveAs(new Blob([zipSync(content)]), `${this.$t('note')}.zip`);
            }
        },
        /**
         * Show a dialog before remove mutiple notes
         */
        removeSelectedConfirm() {
            if (this.ifNotes.length === 0) {
                return;
            }
            this.removeConfirm = true;
        },
        /**
         * Remove selected notes
         */
        removeSelected() {
            this.removeConfirm = false;
            if (this.ifNotes.length === 0) {
                return;
            }
            if (this.ifNotes.length === 1) {
                this.toRemove = this.ifNotes[0];
                this.removeConfirmed();
            } else {
                const newNotes = [];
                const newPreviews = [];
                for (let index = 0; index < this.notes.length; index += 1) {
                    if (!this.ifNotes.includes(index)) {
                        newNotes.push(this.notes[index]);
                        newPreviews.push(this.previews[index]);
                    }
                }
                this.notes = newNotes;
                this.previews = newPreviews;

                // If all notes are deleted, exit multi selection mode
                if (this.notes.length === 0 && this.multi) {
                    this.multi = false;
                }
            }
            this.ifNotes = [];
        },
        /**
         * Store notes to localstorage
         */
        async store() {
            await localForage.setItem('notes', this.notes);
            // this.sync();
            this.buildSearchIndex();
        },
        /**
         * Sync data with backend
         */
        sync() {
            this.loading = true;
            setTimeout(() => {
                this.loading = false;
            }, 1000);
        },
        /**
         * Build search index
         */
        buildSearchIndex() {
            this.$store.commit('setSearchIndex', {
                id: this.searchid,
                payload: {
                    name: 'note',
                    key: 'update',
                    indexes: ['title', 'content'],
                    data: this.getSearchIndexArray(),
                },
            });
        },
        /**
         * Get search index array
         * @returns {array} search index
         */
        getSearchIndexArray() {
            const searchIndex = [];
            const tempDOM = document.createElement('div');
            for (let i = 0; i < this.notes.length; i += 1) {
                tempDOM.innerHTML = this.md.render(this.notes[i].content);
                searchIndex.push({
                    title: this.notes[i].title === '' ? this.$t('untitled') : this.notes[i].title,
                    rawTitle: this.notes[i].title,
                    content: this.previews[i],
                    rawIndex: i,
                    update: this.notes[i].update,
                });
            }
            return searchIndex;
        },
        /**
         * Build plain text preview for notes
         * @param {number?} index index of note to be updated or update all
         */
        buildPreviews(index = -1) {
            if (index < 0) {
                const previews = [];
                const tempDOM = document.createElement('div');
                for (const note of this.notes) {
                    tempDOM.innerHTML = this.md.render(note.content);
                    previews.push(tempDOM.textContent);
                }
                this.previews = previews;
            } else {
                const tempDOM = document.createElement('div');
                tempDOM.innerHTML = this.md.render(this.notes[index].content);
                this.previews[index] = tempDOM.textContent;
            }
        },
        /**
         * Format strings like `printf()`
         * @param {string} str string template
         * @param {array} args arguments
         * @returns {string} formated string
         */
        formatString(str, args) {
            return vsprintf(str, args);
        },
        /**
         * Format a date object to a string based on locale
         * @param {Date} dateObj Date object
         * @returns {string} formatted a date string
         */
        getDate(dateObj) {
            return formatDateTime(dateObj, this.locale);
        },
        /**
         * Update scroll percentage when editor scrolls
         * @param {Event} e scroll event
         */
        onScroll(e) {
            const scroller = e.getScrollInfo();
            this.scrollPercentage = scroller.top / (scroller.height - 500);
        },
        /**
         * Update scroll percentage when viewer scrolls
         * @param {Event} e scroll event
         */
        onScrollView(e) {
            this.scrollPercentage = e.target.scrollTop / (this.$refs.render.clientHeight - 480);
        },
    },
    watch: {
        locale() {
            this.$i18n.locale = this.locale;
            this.buildSearchIndex();
        },
        notes() {
            // Update updated time of a note
            if (this.layerOpened) {
                this.notes[this.editing].update = new Date().valueOf();
            }
            this.debouncedSave();
        },
        editingTitle() {
            // Store notes when title changed
            if (this.layerOpened) {
                this.notes[this.editing].title = this.editingTitle;
                this.notes[this.editing].update = new Date().valueOf();
                this.debouncedSave();
            }
        },
        code() {
            // Store notes when changed
            if (this.layerOpened) {
                this.notes[this.editing].content = this.code;
                this.notes[this.editing].update = new Date().valueOf();
                this.buildPreviews(this.editing);
                this.debouncedSave();
            }
        },
        mode() {
            if (this.mode === 'edit') {
                // Refresh editor otherwise it will not shown
                this.cmRefresh = `${new Date().valueOf()}`;
                this.$nextTick(() => {
                    // Sync scroll between to views
                    const savedPercentage = this.scrollPercentage;
                    this.$refs.codemirror.codemirror.scrollTo(null, savedPercentage * (this.$refs.codemirror.codemirror.getScrollInfo().height - 500));
                    // Since codemirror cannot get correct height at first, re-position after the first scrollTo
                    this.$nextTick(() => {
                        this.$refs.codemirror.codemirror.scrollTo(null, savedPercentage * (this.$refs.codemirror.codemirror.getScrollInfo().height - 500));
                    });
                });
            } else {
                if (this.$refs.render) {
                    // Render Markdown
                    this.$refs.render.innerHTML = this.md.render(this.code);
                    // Render LaTeX
                    renderMathInElement(this.$refs.render, {
                        delimiters: [
                            { left: '$$', right: '$$', display: true },
                            { left: '$', right: '$', display: false },
                            { left: '\\(', right: '\\)', display: false },
                            { left: '\\[', right: '\\]', display: true },
                        ],
                    });
                    this.$nextTick(() => {
                        // Sync scroll between to views
                        this.$refs.renderScroll.scrollTo(null, this.scrollPercentage * (this.$refs.render.clientHeight - 480));
                    });
                }
            }
        },
        multi() {
            this.ifNotes = [];
        },
        searchNotification() {
            // Handle search actions
            if (this.searchNotification.target === 'note') {
                this[this.searchNotification.payload.action](this.searchNotification.payload.index);
            }
        },
    },
    computed: {
        ...mapState({
            locale: (state) => state.locale,
            searchNotification: (state) => state.searchNotification,
        }),
        allSelected() {
            if (this.notes.length === 0) {
                return false;
            }
            return this.notes.length === this.ifNotes.length;
        },
    },
    async mounted() {
        this.$i18n.locale = localStorage.getItem('language') || 'en';

        // Restore notes from localstorage
        const storaged = await localForage.getItem('notes');
        if (storaged !== null) {
            this.notes = storaged;
        }

        // Sync with backend every 30 minutes
        this.timer = setInterval(() => {
            this.sync();
        }, 1800000);

        // Configure Markdown renderer
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

        this.buildPreviews();
        this.buildSearchIndex();
    },
    beforeDestroy() {
        clearInterval(this.timer);
    },
};
</script>

<style lang="less">
.note-container {
    position: relative;
    padding-left: 0;
    padding-right: 0;
    overflow: hidden;
    contain: strict;
    .loading {
        position: absolute;
        top: 10px;
        right: 10px;
        z-index: 99;
    }
    .titles {
        position: relative;
        z-index: 2;
        height: 60px;
        transition: all .2s;
        &.shadow {
            box-shadow: 0px 2px 4px -1px rgba(0, 0, 0, 10%), 0px 4px 5px 0px rgba(0, 0, 0, 7%), 0px 1px 10px 0px rgba(0, 0, 0, 6%)!important;
        }
    }
    h2 {
        font-size: 18px;
        font-weight: normal;
        opacity: .87;
        padding-top: 18px;
        padding-bottom: 15px;
        margin-left: 20px;
        height: 27px;
        .md-icon {
            padding-bottom: 2px;
        }
    }
    .scroll {
        position: relative;
        z-index: 1;
    }
    .editor-layer-mask {
        position: absolute;
        top: 0;
        left: 0;
        z-index: 3;
        width: 100%;
        height: 561px;
        background-color: black;
        opacity: 0;
        pointer-events: none;
        transition: opacity .4s cubic-bezier(0.23, 1, 0.32, 1);
        &.opened {
            opacity: .4;
        }
    }
    .editor-layer {
        position: absolute;
        top: 561px;
        left: 0;
        z-index: 4;
        width: 100%;
        height: 561px;
        background-color: white;
        border-radius: 5px;
        pointer-events: none;
        transition: top .4s cubic-bezier(0.23, 1, 0.32, 1);
        h2 {
            font-size: 18px;
            font-weight: normal;
            opacity: .87;
            margin-top: 18px;
            margin-bottom: 15px;
            margin-left: 20px;
            padding-top: 0;
            padding-bottom: 0;
            .title-input {
                -webkit-appearance: none;
                width: calc(100% - 120px);
                outline: transparent;
            }
        }
        &.opened {
            top: 0;
            pointer-events: auto;
        }
        .render-result {
            height: 500px;
            overflow: auto;
            overscroll-behavior: contain;
            padding: 10px 20px;
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
                    padding-bottom: 2.2rem;
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
                div.success, div.info, div.warning, div.error {
                    display: flex;
                    &:before {
                        font-family: 'Material Design Icons';
                        font-size: 20px;
                        height: 20px;
                        line-height: 20px;
                    }
                    & > p {
                        margin-left: 10px;
                        line-height: 20px;
                    }
                }
                div.success:before {
                    content: '\F05E1';
                }
                div.info:before {
                    content: '\F02FD';
                }
                div.warning:before {
                    content: '\F002A';
                }
                div.error:before {
                    content: '\F05D6';
                }
            }
        }
        .md-editor {
            height: 500px;
            .CodeMirror {
                height: 500px;
                padding: 0;
                font-family: Consolas, "Liberation Mono", Courier, "Courier New", Monaco, "Courier New SC", "Noto Sans", "Helvetica Neue", Helvetica, "Nimbus Sans L", Arial,"Liberation Sans", "PingFang SC", "Hiragino Sans GB", "Noto Sans CJK SC", "Source Han Sans SC", "Source Han Sans CN", "Microsoft YaHei", "Wenquanyi Micro Hei", "WenQuanYi Zen Hei", "ST Heiti", SimHei, "WenQuanYi Zen Hei Sharp", monospace;
                line-height: 20px;
                overscroll-behavior: contain;
                pre.CodeMirror-line, pre.CodeMirror-line-like {
                    padding: 0 10px;
                }
            }
            .cm-s-xq-light .CodeMirror-activeline-background {
                background-color: #f3f3f3;
            }
            .cm-s-xq-light .CodeMirror-matchingbracket {
                background-color: transparent;
            }
            .cm-s-xq-light span.cm-comment {
                color: #888888;
            }
            .cm-s-xq-light span.cm-def {
                text-decoration: none;
                color: #660099;
            }
            .cm-s-xq-light span.cm-header {
                text-decoration: none;
                color: #f89500;
            }
            .cm-s-xq-light span.cm-string {
                color: #2196F3;
            }
            .CodeMirror-focused .CodeMirror-selected {
                background: #cbe4ff;
            }
            .cm-s-xq-light span.cm-keyword {
                font-weight: normal;
            }
            .cm-s-xq-light span.cm-meta {
                color: #ec134a;
            }
            .cm-s-xq-light .cm-variable-2 {
                color: #877a9b;
            }
            .cm-s-xq-light .cm-variable {
                color: #7a9b98;
            }
            .cm-s-xq-light span.cm-type {
                color: #6da0c2;
            }
        }
    }
    .list {
        padding-top: 0;
        .v-list-item__action {
            margin: 0px 16px 0 0;
        }
        .v-list-item__icon {
            margin: 15px 16px 0 0;
        }
        .v-list-item__subtitle {
            & > div {
                display: none;
                margin-top: 1px;
            }
        }
        .delete {
            margin: 0 0 0 8px!important;
            opacity: 0;
            transition: .2s;
        }
        .v-list-item {
            transition: background-color .2s;
            min-height: 30px;
            &:hover, &:focus {
                background-color: rgba(0, 0, 0, .04);
                .delete {
                    opacity: 1;
                }
                .v-list-item__subtitle {
                    & > span.hide {
                        display: none;
                    }
                    & > div {
                        display: block;
                    }
                }
            }
        }
        .v-list-item__content {
            padding: 8px 0;
        }
        .time-icon {
            vertical-align: text-top;
        }
        .multi.v-list-item--active {
            background-color: fade(#660099, 12%);
            .v-icon {
                color: rgba(0, 0, 0, 0.54);
            }
        }
    }
    .empty {
        width: 100%;
        height: 500px;
        display: flex;
        justify-content: center;
        align-items: center;
        opacity: .5;
        font-size: 15px;
    }
    .note-outer {
        width: 100%;
        height: 560px;
    }
    .scroll {
        height: 500px;
        overflow: auto;
    }
}
#app.theme--dark .note-container {
    .editor-layer {
        background-color: #1E1E1E;
        h2 {
            .title-input {
                color: white;
            }
        }
        .render-result {
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
        .md-editor {
            .CodeMirror-sizer, .CodeMirror-scroll {
                background-color: #1E1E1E;
                color: rgba(255, 255, 255, .87);
            }
            .cm-s-xq-light .CodeMirror-matchingbracket {
                color: white!important;
            }
            .cm-s-xq-light .CodeMirror-activeline-background {
                background-color: #303030;
            }
            .cm-s-xq-light span.cm-comment {
                color: #777777;
            }
            .cm-s-xq-light span.cm-def {
                text-decoration: none;
                color: #D099E0;
            }
            .cm-s-xq-light span.cm-keyword {
                color: #6a6baa;
            }
            .CodeMirror-focused .CodeMirror-selected {
                background: #343a41;
            }
            .cm-s-xq-light span.cm-meta {
                color: #e96888;
            }
            .cm-s-xq-light span.cm-number {
                color: #6DC2A0;
            }
            .CodeMirror-cursor {
                border-left: 1px solid white;
            }
        }
    }
    .list {
        .v-list-item {
            &:hover, &:focus {
                background-color: rgba(255, 255, 255, .04);
            }
        }
        .multi.v-list-item--active {
            background-color: fade(#D099E0, 12%);
            .v-icon {
                color: rgba(255, 255, 255, 0.7);
            }
        }
    }
}
</style>

<i18n>
{
    "en": {
        "note": "Quick Notes",
        "nothing": "No note yet",
        "new_note": "New Note",
        "title_placeholder": "Note Title",
        "md_support": "Markdown supported",
        "view": "View",
        "edit": "Edit",
        "new": "New",
        "download": "Download",
        "delete": "Delete",
        "select": "Multiple selection",
        "untitled": "Untitled",
        "num_selected": "%d selected",
        "select_all": "Select all",
        "select_none": "Select none",
        "cancel_select": "Exit multiple selection",
        "delete_selected": "Delete selected",
        "download_selected": "Download selected",
        "confirm": "Confirm",
        "cancel": "Cancel",
        "ok": "OK",
        "want_remove": "Are you sure to delete %d note that is selected?",
        "want_remove_single": "Are you sure to delete note \"%s\"?",
        "want_remove_plural": "Are you sure to delete %d notes that are selected?",
        "remove_all": "Are you sure to delete all notes?",
        "too_many_title": "Maybe too many notes",
        "too_many_body": "This is not an error. You are creating more than 50 notes, which is not a good idea. Please consider moving them to a better place like a note management app. You can continue using quick notes anyway.",
        "hl_error": "Error when highlighting code",
        "at": "at"
    },
    "zh": {
        "note": "快速笔记",
        "nothing": "还没有笔记",
        "new_note": "新建笔记",
        "title_placeholder": "笔记标题",
        "md_support": "支持 Markdown",
        "view": "查看",
        "edit": "编辑",
        "new": "新建",
        "download": "下载",
        "delete": "删除",
        "select": "多选",
        "untitled": "无标题",
        "num_selected": "已选择 %d 项",
        "select_all": "全选",
        "select_none": "取消全选",
        "cancel_select": "退出多选",
        "delete_selected": "删除选中",
        "download_selected": "下载选中",
        "confirm": "确认",
        "cancel": "取消",
        "ok": "好",
        "want_remove": "你确定要删除选中的 %d 个笔记吗？",
        "want_remove_single": "你确定要删除笔记“%s”吗？",
        "want_remove_plural": "你确定要删除选中的 %d 个笔记吗？",
        "remove_all": "你确定要删除所有笔记吗？",
        "too_many_title": "太多笔记了",
        "too_many_body": "这不是一个错误。你正在创建超过 50 个笔记，这不是一个好主意。请考虑将它们移动到笔记管理应用等更合适的地方。无论如何，你仍然可以继续使用快速笔记。",
        "hl_error": "在创建代码高亮时出错",
        "at": "于"
    },
    "es": {
        "note": "Apuntes rápidos",
        "nothing": "No hay apuntes todavía",
        "new_note": "Nuevo apunte",
        "title_placeholder": "Título del apunte",
        "md_support": "Markdown aplicable",
        "view": "Ver",
        "edit": "Editar",
        "new": "Nuevo",
        "download": "Descargar",
        "delete": "Eliminar",
        "select": "Selección múltiples",
        "untitled": "Sin título",
        "num_selected": "{0} seleccionado",
        "select_all": "Seleccionar todos",
        "select_none": "Dejar de seleccionar",
        "cancel_select": "Salir de selección múltiples",
        "delete_selected": "Eliminar lo seleccionado",
        "download_selected": "Descargar lo seleccionado",
        "confirm": "Confirmar",
        "cancel": "Cancelar",
        "ok": "OK",
        "want_remove": "Está seguro de eliminar {0} apunte seleccionado?",
        "want_remove_single": "Está seguro de eliminar {0}?",
        "want_remove_plural": "Está seguro de eliminar los {0} apuntes elegido",
        "remove_all": "Está seguro de eliminar todos los apuntes?",
        "too_many_title": "Demasiados apuntes quizás",
        "too_many_body": "Esto no es un error. Está creando más de 50 apuntes, que no es una buena idea. Por favor considere usar una aplicación para organizar apuntes en lugar de apuntes rápidos. Puedes continuar a usar apuntes rápidos de todas formas.",
        "hl_error": "Error cuando intenta subrayar al código",
        "at": "en"
    }
}
</i18n>
