<template>
    <v-card
        class="mx-auto rounded-lg grade-container"
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
        <div class="grade-outer">
            <h2 class="pr-5 handle">
                {{ $t('grade') }}
                <v-btn icon small class="grade-goto" href="https://studentnet.cs.manchester.ac.uk/me/spot/" target="_blank" rel="noopener nofollow">
                    <v-icon>mdi-chevron-right</v-icon>
                </v-btn>
            </h2>
            <v-skeleton-loader
                v-if="!init && loading"
                class="mx-auto loading-tab"
                type="heading"
            ></v-skeleton-loader>
            <div class="loading-view" v-if="(!init && loading) || (!init && !loading) || (init && !loading && gradeListFilteredFlat.length === 0)" :class="{ 'not-inited-yet': (!init && !loading) || (init && !loading && gradeListFilteredFlat.length === 0) }">
                <v-card class="loading-bg mx-auto mb-2" v-if="!init && loading" outlined>
                    <v-skeleton-loader
                        class="mx-auto "
                        type="list-item-two-line, divider, list-item-two-line, list-item"
                    ></v-skeleton-loader>
                </v-card>
                <div class="not-inited mx-auto mb-2" v-if="!init && !loading">
                    <span class="text-center pl-6 pr-6">{{ $t('cannot_fetch') }} <a href="https://github.com/uom-assistant/uom-assistant/wiki" target="_blank" rel="noreferrer noopener">{{ $t('learn_more') }}</a></span>
                </div>
                <div class="not-inited mx-auto mb-2" v-if="init && !loading && gradeListFilteredFlat.length === 0">
                    <span>{{ $t('nothing') }}</span>
                </div>
            </div>
            <v-tabs v-model="tabs" :class="{ shadow: headerShadow }" class="tab-items" @change="updateView" show-arrows v-show="init && gradeListFilteredFlat.length > 0">
                <v-tab v-for="(semester, i) in gradeListFiltered" :key="`tab-${i}`">{{ gradeList[i].name }}</v-tab>
            </v-tabs>

            <v-tabs-items v-model="tabs">
                <v-tab-item v-for="(semester, i) in gradeListFiltered" :key="`tab-item-${i}`">
                    <v-container fluid class="tab-container">
                        <div class="subject-list" :class="{ 'detail-expended': showMainChart }" :ref="`list${i}`" v-if="init" @scroll.passive="scrollHandler">
                            <div class="not-inited mx-auto mb-2" v-if="init && !loading && gradeListFiltered[i].length === 0">
                                <span>{{ $t('nothing') }}</span>
                            </div>
                            <v-card
                                class="mx-auto rounded grade-item"
                                outlined
                                v-for="(subject, index) in gradeListFiltered[i]"
                                :key="index"
                                :ref="`subject-${subject.subject}-${i}`"
                            >
                                <div class="subject-summary">
                                    <v-progress-circular
                                        :rotate="-90"
                                        :size="49"
                                        :width="3"
                                        :value="subject.weightedGrade"
                                        color="primary"
                                        class="float-right ml-3"
                                    >
                                        {{ subject.weightedGrade }}<span class="text-caption">%</span>
                                    </v-progress-circular>
                                    <div class="text-truncate">{{ subjectNameMap(subject.subject) === subject.subject ? subject.name : subjectNameMap(subject.subject) }}</div>
                                    <span class="text--disabled text-body-2">
                                        <span :class="subjectColor(subject.subject)" class="subject-color-samll" v-if="subjectNameMap(subject.subject) !== subject.subject"></span>
                                        {{ subject.subject }}
                                    </span>
                                </div>
                                <v-divider class="mb-2" :class="{ hide: gradeExpending && gradeExpended === index }"></v-divider>
                                <v-list flat class="list hide-when-expending" :class="{ hide: gradeExpending && gradeExpended === index }">
                                    <v-list-item v-for="(item, gradeIndex) in latestTwo(subject.detail)" :key="gradeIndex">
                                        <v-list-item-content>
                                            <v-list-item-title><v-icon class="mr-1" dense :title="$t('formative')" v-if="!item.summative">mdi-bookmark-off-outline</v-icon>{{ item.name }}</v-list-item-title>
                                            <v-list-item-subtitle>
                                                <span>
                                                    <v-icon small>
                                                        mdi-clock-outline
                                                    </v-icon>
                                                    {{ getDate(new Date(item.time.replace(' ', 'T'))) }}
                                                </span>
                                                <span class="orange--text ml-2" v-if="item.late">LATE</span>
                                            </v-list-item-subtitle>
                                        </v-list-item-content>

                                        <v-list-item-action class="grade">
                                            {{ item.grade }}<span class="text--disabled">/{{ item.gradeAll }}</span>
                                            <v-progress-circular
                                                :rotate="-90"
                                                :size="17"
                                                :width="2.3"
                                                :value="(parseFloat(item.grade) / parseFloat(item.gradeAll)) * 100"
                                                :color="getColorByGrade((parseFloat(item.grade) / parseFloat(item.gradeAll)) * 100)"
                                                :title="`${parseFloat(((parseFloat(item.grade) / parseFloat(item.gradeAll)) * 100).toFixed(2))}%`"
                                                class="ml-2"
                                            ></v-progress-circular>
                                        </v-list-item-action>
                                    </v-list-item>
                                    <v-list-item class="more-info" @click="(e) => openDetail(index, tabs, e)">
                                        <v-list-item-content>
                                            <v-list-item-title>{{ $t('more_info') }}</v-list-item-title>
                                        </v-list-item-content>

                                        <v-list-item-action>
                                            <v-icon small>
                                                mdi-arrow-right
                                            </v-icon>
                                        </v-list-item-action>
                                    </v-list-item>
                                </v-list>
                            </v-card>
                            <div class="text--secondary text-caption more-click" :class="{ 'more-shown': moreShown.includes(i) }" v-show="gradeListEmpty[i].length > 0" v-if="init && gradeListEmpty.length > 0 && gradeListEmpty[i].length > 0">
                                <span @click="toggleMore(i)">
                                    <span class="d-inline-block mr-1">{{ $t('empty_subject') }}</span>
                                    <v-icon x-small class="icon-more" :class="{ 'more-shown': moreShown.includes(i) }">
                                        mdi-chevron-down
                                    </v-icon>
                                </span>
                            </div>
                            <v-expand-transition>
                                <div class="more-container" v-show="moreShown.includes(i)" v-if="init && gradeListEmpty.length > 0 && gradeListEmpty[i].length > 0">
                                    <v-card
                                        class="mx-auto rounded grade-item"
                                        outlined
                                        v-for="(subject, index) in gradeListEmpty[i]"
                                        :key="index"
                                    >
                                        <div class="subject-summary">
                                            <v-progress-circular
                                                :rotate="-90"
                                                :size="49"
                                                :width="3"
                                                :value="subject.weightedGrade"
                                                color="grey"
                                                class="float-right ml-3"
                                            >
                                                0<span class="text-caption">%</span>
                                            </v-progress-circular>
                                            <div class="text-truncate">{{ subjectNameMap(subject.subject) === subject.subject ? subject.name : subjectNameMap(subject.subject) }}</div>
                                            <span class="text--disabled text-body-2">
                                                <span :class="subjectColor(subject.subject)" class="subject-color-samll" v-if="subjectNameMap(subject.subject) !== subject.subject"></span>
                                                {{ subject.subject }}
                                            </span>
                                        </div>
                                    </v-card>
                                </div>
                            </v-expand-transition>
                        </div>
                    </v-container>
                </v-tab-item>
            </v-tabs-items>
        </div>
        <div class="subject-detail" :class="{ shown: gradeExpending }" :style="{ top: `${detailLayer.top}px`, left: `${detailLayer.left}px`, width: (listOverflow ? '100%' : `${detailLayer.width}px`), height: `${detailLayer.height}px` }">
            <v-btn icon class="icon-close" @click="closeDetail" :class="{ 'shown': showMainChart }">
                <v-icon>
                    mdi-close
                </v-icon>
            </v-btn>
            <div>
                <chart
                    v-if="!(gradeExpended < 0 || openedTab < 0 || gradeExpended > gradeListFiltered[openedTab].length - 1)"
                    class="main-chart"
                    :width="3"
                    :class="{ 'show-chart': showMainChart }"
                    :value="allGradeNumbers(gradeListFiltered[openedTab][gradeExpended].detail)"
                    :key="`chart-${gradeExpended}-${$vuetify.theme.dark + 1}`"
                ></chart>
                <div
                    class="subject-summary"
                    v-if="!(gradeExpended < 0 || openedTab < 0 || gradeExpended > gradeListFiltered[openedTab].length - 1)"
                    :class="{ 'shown': showMainChart }"
                >
                    <v-progress-circular
                        :rotate="-90"
                        :size="49"
                        :width="3"
                        :value="gradeListFiltered[openedTab][gradeExpended].weightedGrade"
                        color="primary"
                        class="float-right ml-3"
                    >
                        {{ gradeListFiltered[openedTab][gradeExpended].weightedGrade }}<span class="text-caption">%</span>
                    </v-progress-circular>
                    <div class="text-truncate">{{ subjectNameMap(gradeListFiltered[openedTab][gradeExpended].subject) === gradeListFiltered[openedTab][gradeExpended].subject ? gradeListFiltered[openedTab][gradeExpended].name : subjectNameMap(gradeListFiltered[openedTab][gradeExpended].subject) }}</div>
                    <span class="text--disabled text-body-2">
                        <span :class="subjectColor(gradeListFiltered[openedTab][gradeExpended].subject)" class="subject-color-samll" v-if="subjectNameMap(gradeListFiltered[openedTab][gradeExpended].subject) !== gradeListFiltered[openedTab][gradeExpended].subject"></span>
                        {{ gradeListFiltered[openedTab][gradeExpended].subject }}
                    </span>
                </div>
            </div>
            <v-divider v-if="!(gradeExpended < 0 || openedTab < 0 || gradeExpended > gradeListFiltered[openedTab].length - 1) && gradeListFiltered[openedTab][gradeExpended].detail.length > 0" class="mt-3"></v-divider>
            <div class="detail-grades-list" :class="{ shown: listOverflow }" v-if="!(gradeExpended < 0 || openedTab < 0 || gradeExpended > gradeListFiltered[openedTab].length - 1) && gradeListFiltered[openedTab][gradeExpended].detail.length > 0">
                <v-list
                    flat
                    class="list"
                    :class="{ 'shown': showMainChart }"
                    v-if="!(gradeExpended < 0 || openedTab < 0 || gradeExpended > gradeListFiltered[openedTab].length - 1)"
                >
                    <v-list-item v-for="(item, gradeIndex) in sortListByDate(gradeListFiltered[openedTab][gradeExpended].detail)" :key="gradeIndex">
                        <div v-if="!Array.isArray(item)" class="list-item-warpper">
                            <v-list-item-content>
                                <v-list-item-title><v-icon class="mr-1" dense :title="$t('formative')" v-if="!item.summative">mdi-bookmark-off-outline</v-icon>{{ item.name }}</v-list-item-title>
                                <v-list-item-subtitle>
                                    <span>
                                        <v-icon small>
                                            mdi-clock-outline
                                        </v-icon>
                                        {{ getDate(new Date(item.time.replace(' ', 'T'))) }}
                                    </span>
                                    <span class="orange--text ml-2" v-if="item.late">LATE</span>
                                </v-list-item-subtitle>
                            </v-list-item-content>

                            <v-list-item-action class="grade">
                                {{ item.grade }}<span class="text--disabled">/{{ item.gradeAll }}</span>
                                <v-progress-circular
                                    :rotate="-90"
                                    :size="17"
                                    :width="2.3"
                                    :value="(parseFloat(item.grade) / parseFloat(item.gradeAll)) * 100"
                                    :color="getColorByGrade((parseFloat(item.grade) / parseFloat(item.gradeAll)) * 100)"
                                    :title="`${parseFloat(((parseFloat(item.grade) / parseFloat(item.gradeAll)) * 100).toFixed(2))}%`"
                                    class="ml-2"
                                ></v-progress-circular>
                            </v-list-item-action>
                        </div>

                        <div v-if="Array.isArray(item)" class="list-item-warpper expendable" @click="toggleSubTree(gradeIndex)">
                            <v-list-item-icon>
                                <v-icon :class="{ opened: expendingSubTree.includes(gradeIndex) }">mdi-chevron-right</v-icon>
                            </v-list-item-icon>

                            <v-list-item-content>
                                <v-list-item-title>{{ sortListByDate(item)[0].name }} {{ $t('etc') }}</v-list-item-title>
                                <v-list-item-subtitle>
                                    <span>
                                        {{ formatString($t('total'), [item.length]) }}
                                    </span>
                                </v-list-item-subtitle>
                            </v-list-item-content>

                            <v-list-item-action class="grade">
                                <chart
                                    class="mini-chart"
                                    :width="6"
                                    :value="allGradeNumbers(item)"
                                    :key="`chart-mini-${gradeIndex}-${$vuetify.theme.dark + 1}`"
                                ></chart>
                            </v-list-item-action>
                        </div>

                        <v-expand-transition>
                            <v-list
                                flat
                                class="list"
                                v-if="Array.isArray(item)"
                                v-show="expendingSubTree.includes(gradeIndex)"
                                :key="`${gradeIndex}-${subRefreshKey}`"
                            >
                                <v-list-item v-for="(gradeItem, gradeItemIndex) in sortListByDate(item)" :key="gradeItemIndex">
                                    <div class="list-item-warpper">
                                        <v-list-item-content>
                                            <v-list-item-title><v-icon class="mr-1" dense :title="$t('formative')" v-if="!gradeItem.summative">mdi-bookmark-off-outline</v-icon>{{ gradeItem.name }}</v-list-item-title>
                                            <v-list-item-subtitle>
                                                <span>
                                                    <v-icon small>
                                                        mdi-clock-outline
                                                    </v-icon>
                                                    {{ getDate(new Date(gradeItem.time.replace(' ', 'T'))) }}
                                                </span>
                                                <span class="orange--text ml-2" v-if="gradeItem.late">LATE</span>
                                            </v-list-item-subtitle>
                                        </v-list-item-content>

                                        <v-list-item-action class="grade">
                                            {{ gradeItem.grade }}<span class="text--disabled">/{{ gradeItem.gradeAll }}</span>
                                            <v-progress-circular
                                                :rotate="-90"
                                                :size="17"
                                                :width="2.3"
                                                :value="(parseFloat(gradeItem.grade) / parseFloat(gradeItem.gradeAll)) * 100"
                                                :color="getColorByGrade((parseFloat(gradeItem.grade) / parseFloat(gradeItem.gradeAll)) * 100)"
                                                :title="`${parseFloat(((parseFloat(gradeItem.grade) / parseFloat(gradeItem.gradeAll)) * 100).toFixed(2))}%`"
                                                class="ml-2"
                                            ></v-progress-circular>
                                        </v-list-item-action>
                                    </div>
                                </v-list-item>
                            </v-list>
                        </v-expand-transition>
                    </v-list-item>
                </v-list>
            </div>
        </div>
    </v-card>
</template>

<script>
import { mapState } from 'vuex';
import { vsprintf } from 'sprintf-js';

import chart from '@/components/chart.vue';

import checkResponse from '@/mixins/checkResponse';
import scroll from '@/mixins/scroll';

import betterFetch from '@/tools/betterFetch';
import formatDate from '@/tools/formatDate';

export default {
    name: 'grade',
    components: {
        chart,
    },
    props: {
        searchid: Number,
    },
    mixins: [checkResponse, scroll],
    data() {
        return {
            loading: false,
            init: false,
            timer: null,
            gradeList: [],
            moreShown: [],
            gradeExpended: -1,
            openedTab: -1,
            tabs: 0,
            detailLayer: {
                top: 0,
                left: 0,
                width: 0,
                height: 0,
            },
            targetSize: {
                top: 0,
                width: 0,
                height: 0,
            },
            targetEle: null,
            gradeExpending: false,
            showMainChart: false,
            listOverflow: false,
            expendingSubTree: [],
            subRefreshKey: 0,
        };
    },
    methods: {
        /**
         * Update grade data from backend
         */
        async updateGrade(tryCount = 1) {
            if (!this.backend.url || !this.account.username || !this.account.password) {
                this.$store.commit('setAttendance', false);
                return;
            }
            this.loading = true;
            let requestFailed = false;
            // Send request
            const response = await betterFetch(`https://${this.backend.url}/grade_attendance/`, {
                method: 'POST',
                body: JSON.stringify({
                    username: this.account.username,
                    password: this.account.password,
                    token: this.backend.token ? this.backend.token : '',
                }),
            }).catch(() => {
                if (tryCount < 2) {
                    // Retry
                    setTimeout(() => {
                        this.updateGrade(tryCount + 1);
                    }, 8000);
                } else {
                    // Network error
                    this.loading = false;
                    this.$store.commit('setAttendance', false);
                    this.$store.commit('addError', {
                        title: this.$t('network_error'),
                        content: this.$t('network_error_body'),
                        type: 'warning',
                    });
                }
                requestFailed = true;
            });

            if (requestFailed) {
                return;
            }

            // Check response
            if (!this.checkResponse(response)) {
                this.loading = false;
                this.$store.commit('setAttendance', false);
                return;
            }

            if (!response.data.grade) {
                // Not a valid UoM Assistant backend
                if (this.backendStatus) {
                    this.$store.commit('addError', {
                        title: this.$t('backend_error'),
                        content: this.$t('backend_error_body'),
                        type: 'error',
                    });
                    this.$store.commit('setBackendStatus', false);
                }
                this.loading = false;
                this.$store.commit('setAttendance', false);
                return;
            }

            if (!response.data.attendance) {
                // Cannnot login
                this.$store.commit('addError', {
                    title: this.$t('request_error'),
                    content: 'Unable to login',
                    type: 'error',
                });
                this.loading = false;
                this.$store.commit('setAttendance', false);
                return;
            }

            // Update data
            this.$store.commit('setBackendStatus', true);
            this.loading = false;
            this.gradeList = response.data.grade;

            if (!this.init) {
                // Find the last item with non-empty courses
                for (let i = this.gradeList.length - 1; i >= 0; i -= 1) {
                    if (this.gradeListFiltered[i].length > 0) {
                        this.tabs = i;
                        break;
                    }
                }
            }

            this.init = true;

            this.$store.commit('setAttendance', response.data.attendance);
            this.$nextTick(() => {
                this.relocate();
            });
        },
        /**
         * Update view
         * @param {number} index tab index
         */
        updateView(index) {
            this.$nextTick(() => {
                this.$nextTick(() => {
                    this.$nextTick(() => {
                        if (this.$refs[`list${index}`] && this.$refs[`list${index}`][0]) {
                            this.scrollHandler({
                                target: this.$refs[`list${index}`][0],
                            });
                            setTimeout(() => {
                                if (this.$refs[`list${index}`] && this.$refs[`list${index}`][0]) {
                                    this.scrollHandler({
                                        target: this.$refs[`list${index}`][0],
                                    });
                                }
                            }, 50);
                        }
                    });
                });
            });
            setTimeout(() => {
                this.relocate();
            }, 400);
        },
        /**
         * Map from subject ID to subject color
         * @param {string} subject subject ID
         * @returns {string} subject color name or ''
         */
        subjectColor(subject) {
            if (!this.subjects) {
                return '';
            }
            for (const item of this.subjects) {
                if (item.id === subject) {
                    if (item.color) {
                        return item.color;
                    }
                }
            }
            return '';
        },
        /**
         * Map from subject ID to subject name
         * @param {string} subject subject ID
         * @returns {string} subject name or raw ID (if none matched)
         */
        subjectNameMap(subject) {
            if (!this.subjects) {
                return subject;
            }
            for (const item of this.subjects) {
                if (item.id === subject) {
                    return item.name;
                }
            }
            return subject;
        },
        /**
         * Format a date object to a string based on locale
         * @param {Date} dateObj Date object
         * @returns {string} formatted a date string
         */
        getDate(dateObj) {
            return formatDate(dateObj, this.locale, false);
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
         * Update layout after animation
         */
        relocate() {
            this.$nextTick(() => {
                this.packery.shiftLayout();
            });
        },
        /**
         * Get latest 2 grade items from a grade list
         * @param {array} grades grade list
         * @returns {array} a grade list that conatins latest 2 grade items
         */
        latestTwo(grades) {
            const sortedList = grades.flat().sort((a, b) => ((new Date(b.time.replace(' ', 'T')).valueOf() - new Date(a.time.replace(' ', 'T')).valueOf()) <= 0 ? -1 : 1));
            if (sortedList.length <= 2) {
                return sortedList;
            }
            return [sortedList[0], sortedList[1]];
        },
        /**
         * Get latest 2 grade items from a grade list
         * @param {array} grades grade list
         * @returns {array} a grade list that conatins latest 2 grade items
         */
        allGradeNumbers(grades) {
            return grades.flat().map((item) => (parseFloat(item.grade) / parseFloat(item.gradeAll)) * 100);
        },
        /**
         * Fet grade color by grade
         * @param {number} grade grade (max 100)
         * @returns {string} color keyword
         */
        getColorByGrade(grade) {
            if (grade >= 80) {
                return 'green';
            }
            if (grade >= 40) {
                return 'orange';
            }
            return 'red';
        },
        /**
         * Open a layer to show details of a subject
         * @param {number} index subject index
         * @param {number} tab tab index
         * @param {Event} e click event
         */
        openDetail(index, tab, e, selected = false) {
            // Set size for detail layer
            const ele = selected ? e[0].$el : e.target.closest('.grade-item') || e.target;
            this.detailLayer.top = ele.offsetTop - this.$refs[`list${tab}`][0].scrollTop + 95;
            this.detailLayer.left = 20;
            this.detailLayer.width = ele.clientWidth + 2;
            this.detailLayer.height = ele.clientHeight + 2;

            this.targetEle = ele;
            this.targetSize.top = ele.offsetTop - this.$refs[`list${tab}`][0].scrollTop + 95;
            this.targetSize.width = ele.clientWidth + 2;
            this.targetSize.height = ele.clientHeight + 2;

            this.openedTab = tab;

            // If there is only one group, expend it
            if (this.gradeListFiltered[tab][index].detail.length === 1 && Array.isArray(this.gradeListFiltered[tab][index].detail[0])) {
                this.expendingSubTree = [0];
            } else {
                this.expendingSubTree = [];
            }

            this.subRefreshKey = new Date().valueOf();

            this.$nextTick(() => {
                this.gradeExpended = index;
                this.$nextTick(() => {
                    this.gradeExpending = true;
                    this.showMainChart = true;
                    this.detailLayer.top = 0;
                    this.detailLayer.left = 0;
                    this.detailLayer.width = document.getElementsByClassName('grade-container')[0].clientWidth;
                    this.detailLayer.height = 562.25;
                    setTimeout(() => {
                        this.listOverflow = true;
                    }, 600);
                });
            });
        },
        /**
         * Open course detail from search
         * @param {number} index subject index
         * @param {number} tab tab index
         * @param {string} subject course ID
         */
        openDetailFromSearch(index, tab, subject) {
            if (tab === this.tabs) {
                this.openDetail(index, tab, this.$refs[`subject-${subject}-${tab}`], true);
            } else {
                // Different tab
                if (this.listOverflow) {
                    // Course detail layer already opened
                    this.closeDetail();
                    setTimeout(() => {
                        this.tabs = tab;
                        this.$nextTick(() => {
                            setTimeout(() => {
                                this.openDetail(index, tab, this.$refs[`subject-${subject}-${tab}`], true);
                            }, 300);
                        });
                    }, 600);
                } else {
                    this.tabs = tab;
                    this.$nextTick(() => {
                        setTimeout(() => {
                            this.openDetail(index, tab, this.$refs[`subject-${subject}-${tab}`], true);
                        }, 300);
                    });
                }
            }
        },
        /**
         * Close detail layer
         */
        closeDetail() {
            // Try to recover size
            if (this.targetEle) {
                this.detailLayer.width = this.targetEle.clientWidth + 2;
            } else {
                this.detailLayer.width = this.targetSize.width;
            }

            this.detailLayer.top = this.targetSize.top;
            this.detailLayer.left = 20;
            this.detailLayer.height = this.targetSize.height;

            this.showMainChart = false;
            this.listOverflow = false;

            setTimeout(() => {
                this.gradeExpended = -1;
                this.gradeExpending = false;
                this.openedTab = -1;
            }, 600);
        },
        toggleMore(index) {
            const findIndex = this.moreShown.indexOf(index);
            if (findIndex === -1) {
                this.moreShown.push(index);
            } else {
                this.moreShown.splice(findIndex, 1);
            }
        },
        /**
         * Sort the given list by date with deepth 1 and return a new list
         * @param {array} list the list to be sorted
         * @returns {array} sorted new list
         */
        sortListByDate(list) {
            // Copy list
            const newList = [];
            for (let i = 0; i < list.length; i += 1) {
                newList.push(list[i]);
            }

            // Sort by date
            return newList.sort((a, b) => {
                let targetA = a;
                let targetB = b;
                if (Array.isArray(a)) {
                    targetA = a[a.length - 1];
                }
                if (Array.isArray(b)) {
                    targetB = b[b.length - 1];
                }
                return (new Date(targetB.time.replace(' ', 'T')).valueOf() - new Date(targetA.time.replace(' ', 'T')).valueOf()) <= 0 ? -1 : 1;
            });
        },
        /**
         * Expend a subtree in detail layer by index
         * @param {number} index subtree index
         */
        toggleSubTree(index) {
            if (this.expendingSubTree.includes(index)) {
                this.expendingSubTree.splice(this.expendingSubTree.indexOf(index), 1);
            } else {
                this.expendingSubTree.push(index);
            }
        },
    },
    watch: {
        locale() {
            this.$i18n.locale = this.locale;
        },
        init() {
            // Layout
            this.$nextTick(() => {
                this.packery.shiftLayout();
            });
        },
        moreShown() {
            // Layout
            setTimeout(() => {
                this.relocate();
            }, 300);
        },
        showMainChart() {
            // Layout
            setTimeout(() => {
                this.relocate();
            }, 600);
        },
        gradeList() {
            // Commit search index
            this.$store.commit('setSearchIndex', {
                id: this.searchid,
                payload: {
                    name: 'grade',
                    key: 'searchId',
                    indexes: ['name', 'subject'],
                    data: this.searchIndexMap,
                },
            });
        },
        searchNotification() {
            // Handle search actions
            if (this.searchNotification.target === 'grade') {
                this.openDetailFromSearch(this.searchNotification.payload.index, this.searchNotification.payload.tab, this.searchNotification.payload.subject);
            }
        },
    },
    computed: {
        ...mapState({
            locale: (state) => state.locale,
            backend: (state) => state.backend,
            backendStatus: (state) => state.backendStatus,
            account: (state) => state.account,
            packery: (state) => state.packery,
            subjects: (state) => state.subjects,
            searchNotification: (state) => state.searchNotification,
        }),
        gradeListFiltered() {
            // Filter out empty subjects
            const result = [];
            for (const semester of this.gradeList) {
                result.push(semester.data.filter((item) => (item.weightedGrade !== '0' || item.detail.length !== 0)));
            }
            return result;
        },
        gradeListFilteredFlat() {
            // Filter out empty subjects and flat the array
            return this.gradeListFiltered.flat();
        },
        gradeListEmpty() {
            // Filter out non-empty subjects
            const result = [];
            for (const semester of this.gradeList) {
                result.push(semester.data.filter((item) => (item.weightedGrade === '0' && item.detail.length === 0)));
            }
            return result;
        },
        searchIndexMap() {
            // Build subject index
            const flatedList = [];
            for (let i = 0; i < this.gradeListFiltered.length; i += 1) {
                let index = 0;
                for (const item of this.gradeListFiltered[i]) {
                    const itemCopy = { ...item };
                    itemCopy.indexName = this.gradeList[i].name;
                    itemCopy.tabIndex = i;
                    itemCopy.rawIndex = index;
                    flatedList.push(itemCopy);
                    index += 1;
                }
            }

            let newList = [];
            for (let i = 0; i < flatedList.length; i += 1) {
                newList.push(flatedList[i]);
                newList[i].searchType = 'subject';
                newList[i].searchId = `subject-${newList[i].name}${i}-${newList[i].indexName}`;
            }

            // Build coursework grade index
            let courseworks = [];
            for (const subject of newList) {
                const newDetailList = subject.detail.flat().sort((a, b) => ((new Date(b.time.replace(' ', 'T')).valueOf() - new Date(a.time.replace(' ', 'T')).valueOf()) <= 0 ? -1 : 1));
                let index = 0;
                for (const item of newDetailList) {
                    item.searchType = 'grade';
                    item.indexName = subject.indexName;
                    item.subject = subject.subject;
                    item.searchId = `coursework-${item.name}${index}-${subject.indexName}`;
                    index += 1;
                }
                courseworks = courseworks.concat(newDetailList);
            }

            newList = newList.concat(courseworks);
            return newList;
        },
    },
    mounted() {
        this.$i18n.locale = localStorage.getItem('language') || 'en';

        // Check if updating
        if ((localStorage.getItem('update_frontend') || 'false') !== 'true') {
            // Fetch grade data
            this.$nextTick(() => {
                this.updateGrade();
            });
        } else {
            this.loading = true;
        }

        // Update grade data every 3 hours
        this.timer = setInterval(() => {
            this.updateGrade();
        }, 10800000);
    },
    beforeDestroy() {
        clearInterval(this.timer);
    },
};
</script>

<style lang="less">
.grade-container {
    position: relative;
    padding-left: 0;
    padding-right: 0;
    overflow: hidden;
    border-color: #E0E0E0!important;
    .loading {
        position: absolute;
        top: 10px;
        right: 10px;
        z-index: 10;
    }
    h2 {
        position: relative;
        z-index: 3;
        background-color: white;
        font-size: 18px;
        font-weight: normal;
        opacity: .87;
        padding-top: 18px;
        padding-left: 20px;
        .clickable {
            cursor: pointer;
            transition: all .2s;
        }
    }
    .loading-tab{
        padding: 12px;
        .v-skeleton-loader__heading {
            width: 100px;
        }
    }
    .loading-view {
        padding: 20px 20px 12px 20px;
        min-height: 126px;
        max-height: 466px;
        background-color: #FFFFFF;
        .loading-bg {
            border-radius: 6px;
            & > div > .v-skeleton-loader__bone:not(.v-skeleton-loader__divider) {
                background-color: transparent;
            }
            & > div > .v-skeleton-loader__divider {
                border-radius: 0;
                height: 1px;
            }
        }
    }
    .tab-items {
        position: relative;
        z-index: 2;
        transition: all .2s;
        &.shadow {
            box-shadow: 0px 2px 4px -1px rgba(0, 0, 0, 10%), 0px 4px 5px 0px rgba(0, 0, 0, 7%), 0px 1px 10px 0px rgba(0, 0, 0, 6%)!important;
        }
    }
    .tab-container {
        margin: 0;
        padding: 0;
        .subject-list {
            padding: 20px 20px 12px 20px;
            min-height: 126px;
            max-height: 466px;
            overflow-y: auto;
            transition: min-height .5s .3s;
            &.detail-expended {
                min-height: 466px;
                transition: min-height .5s 0s;
            }
        }
    }
    .subject-summary {
        padding: 12px 12px 12px 15px;
        .subject-color-samll {
            width: 10px;
            height: 10px;
            display: inline-block;
            border-radius: 50%;
            margin: 0;
            margin-right: 3px;
        }
    }
    .hide-when-expending {
        opacity: 1;
        transition: opacity .1s;
        &.hide {
            opacity: 0;
        }
    }
    .grade-item {
        background-color: white;
        border-radius: 6px!important;
        overflow: hidden;
        margin-bottom: 10px;
    }
    .list {
        padding-top: 0;
        padding-bottom: 0;
        background-color: transparent;
        .v-list-item__action {
            margin: 6px 16px 6px 0;
        }
        .grade {
            margin: 0 0 0 5px;
            justify-content: end;
            align-items: center;
            flex-direction: row;
        }
        .v-list-item {
            background-color: transparent;
            min-height: 20px;
            .v-list-item__title {
                font-size: .9rem;
                i.mr-1 {
                    vertical-align: middle;
                    font-size: 16px;
                }
            }
        }
        .v-list-item__subtitle {
            font-size: .75rem;
            & > span > i {
                transform-origin: left center;
                transform: scale(.8) translateY(-.1rem);
                vertical-align: text-top;
                margin-right: -3px;
            }
        }
        .v-list-item__content {
            padding: 4px 0;
        }
        .more-info {
            background-color: transparent;
            transition: background-color .2s;
            margin-top: -2px;
            &:hover, &:focus {
                background-color: rgba(0, 0, 0, .04);
            }
            .v-list-item__action {
                margin: 6px 0 6px 0;
                align-items: center;
                flex-direction: row-reverse;
            }
            .v-list-item__content {
                padding: 10px 0;
            }
        }
    }
    .more-click {
        text-align: center;
        margin-bottom: -2px;
        transition: margin-bottom .1s .2s;
        & > span {
            opacity: .7;
            cursor: pointer;
            user-select: none;
            transition: opacity .2s;
            .icon-more {
                transform: rotate(0) translateY(0);
                transition: transform .2s;
                &.more-shown {
                    transform: rotate(180deg) translateY(1px);
                }
            }
            &:hover {
                opacity: 1;
            }
        }
        &.more-shown {
            margin-bottom: 6px;
            transition: margin-bottom 0s;
        }
    }
    .subject-detail {
        position: absolute;
        background-color: white;
        border-radius: 6px;
        left: 20px;
        opacity: 0;
        pointer-events: none;
        z-index: -1;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        .subject-summary {
            padding: 0 13px 0 16px;
            transition: padding .5s .1s cubic-bezier(0.77, 0, 0.175, 1);
            .v-progress-circular__overlay {
                transition: all 0s;
            }
            &.shown {
                padding: 0 17px 0 20px;
            }
        }
        .main-chart {
            margin-top: calc(-32.2% + 13px);
            transition: all .5s .1s cubic-bezier(0.77, 0, 0.175, 1);
            &.show-chart {
                margin-top: 50px;
            }
        }
        .icon-close {
            position: absolute;
            top: 10px;
            right: 10px;
            z-index: 12;
            opacity: 0;
            transition: opacity .2s 0s;
            &.shown {
                opacity: 1;
                transition: opacity .2s .6s;
            }
        }
        .detail-grades-list {
            overflow: hidden;
            padding-bottom: 10px;
            &.shown {
                overflow: auto;
            }
        }
        .list {
            margin-top: 8px;
            opacity: 0;
            transition: opacity .2s .3s;
            .v-list-item {
                padding: 0 20px;
                flex-direction: column;
                .list-item-warpper {
                    display: flex;
                    flex-direction: row;
                    width: 100%;
                    &.expendable{
                        cursor: pointer;
                        &:hover .v-list-item__icon {
                            opacity: 1;
                        }
                    }
                }
                .list {
                    margin-top: 0;
                    width: 100%;
                    opacity: 1;
                    overflow: hidden;
                    transition: height .3s;
                    .v-list-item {
                        padding-right: 0;
                    }
                }
                .v-list-item__icon {
                    margin: 13px 3px 13px -8px!important;
                    opacity: .6;
                    cursor: pointer;
                    transition: opacity .2s;
                    i {
                        transition: transform .3s;
                    }
                    i.opened {
                        transform: rotate(90deg);
                    }
                }
                .v-list-item__title {
                    font-size: .95rem;
                }
                &::after {
                    min-height: 0;
                }
            }
            .v-list-item__subtitle {
                font-size: .82rem;
                & > span > i {
                    transform: scale(.85);
                    margin-right: -2px;
                }
            }
            .v-list-item__content {
                padding: 8px 0;
            }
            &.shown {
                opacity: 1;
            }
        }
        .mini-chart {
            width: 72px;
        }
        &.shown {
            opacity: 1;
            pointer-events: auto;
            z-index: 10;
            transition: opacity .2s, height .5s .1s cubic-bezier(0.77, 0, 0.175, 1), width .5s .1s cubic-bezier(0.77, 0, 0.175, 1), top .5s .1s cubic-bezier(0.77, 0, 0.175, 1), left .5s .1s cubic-bezier(0.77, 0, 0.175, 1);
        }
    }
    .not-inited {
        display: flex;
        justify-content: center;
        align-items: center;
        height: 200px;
        opacity: 0.5;
    }
}
#app.theme--dark .grade-container {
    background-color: #1E1E1E!important;
    border-color: #393939!important;
    h2 {
        background-color: #1E1E1E;
    }
    .loading-view {
        background-color: #272727;
        &.not-inited-yet {
            background-color: #1E1E1E;
        }
    }
    .subject-list{
        .loading-bg {
            background-color: #1E1E1E;
            & > div > .v-skeleton-loader__bone:not(.v-skeleton-loader__divider) {
                background: transparent;
            }
        }
    }
    .grade-item {
        background-color: #1E1E1E;
        .more-info {
            &:hover, &:focus {
                background-color: rgba(255, 255, 255, .04);
            }
        }
    }
    .subject-detail {
        background-color: #1E1E1E;
    }
}
</style>

<i18n src="../locales/network.json"></i18n>
<i18n>
{
    "en": {
        "grade": "Grade Summary",
        "nothing": "No grade data yet",
        "network_error_body": "Cannot fetch latest grade and attendance data from backend",
        "cannot_fetch": "Unable to get grade data, probably you are not properly configured backend information or the backend does not allow this.",
        "learn_more": "Learn more",
        "empty_subject": "Courses with empty grade data",
        "more_info": "More",
        "etc": "etc.",
        "total": "%d total",
        "formative": "Formative"
    },
    "zh": {
        "grade": "成绩概览",
        "nothing": "还没有成绩信息",
        "network_error_body": "无法从后端获取最新成绩和出勤信息",
        "cannot_fetch": "无法获取成绩信息，可能是没有正确配置后端信息或后端不允许。",
        "learn_more": "了解更多",
        "empty_subject": "暂无成绩信息的课程",
        "more_info": "更多",
        "etc": "等",
        "total": "共 %d 项",
        "formative": "不计入总分"
    },
    "es": {
        "grade": "Resumen de notas",
        "nothing": "No hay nada todavía",
        "network_error_body": "No ha sido posible obtener las últimas notas y datos de asistencias desde el servidor back-end",
        "cannot_fetch": "No ha sido posible obtener los datos de las notas, posiblemente debido a la una configuración inapropiada del servidor back-end o por falta de permisión.",
        "learn_more": "Saber más",
        "empty_subject": "Asignatura sin calificaciones todavía",
        "more_info": "Más",
        "etc": "etc.",
        "total": "{0} en total",
        "formative": "Formativa"
    }
}
</i18n>
