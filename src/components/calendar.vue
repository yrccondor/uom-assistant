<template>
    <v-card
        class="mx-auto rounded-lg calendar-container"
        outlined
    >
        <v-row class="fill-height">
            <v-col class="phb-11">
                <v-sheet height="64" class="handle">
                    <v-toolbar
                        flat
                    >
                        <v-btn
                            outlined
                            class="mr-2"
                            :color="$vuetify.theme.dark ? 'grey lighten-1' : 'grey darken-2'"
                            @click="setToday"
                        >
                            {{ $t('today') }}
                        </v-btn>
                        <v-btn
                            fab
                            text
                            small
                            :color="$vuetify.theme.dark ? 'grey lighten-1' : 'grey darken-2'"
                            @click="prev"
                        >
                            <v-icon small>
                                mdi-chevron-left
                            </v-icon>
                        </v-btn>
                        <v-btn
                            fab
                            text
                            small
                            :color="$vuetify.theme.dark ? 'grey lighten-1' : 'grey darken-2'"
                            class="mr-2"
                            @click="next"
                        >
                            <v-icon small>
                                mdi-chevron-right
                            </v-icon>
                        </v-btn>
                        <v-toolbar-title v-if="$refs.calendar">
                            {{ $refs.calendar.title }}
                        </v-toolbar-title>
                        <v-progress-circular
                            indeterminate
                            color="grey"
                            :width="2"
                            :size="18"
                            class="loading"
                            v-show="loading"
                        ></v-progress-circular>
                        <v-spacer></v-spacer>
                        <v-menu
                            bottom
                            right
                        >
                            <template v-slot:activator="{ on, attrs }">
                                <v-btn
                                    outlined
                                    :color="$vuetify.theme.dark ? 'grey lighten-1' : 'grey darken-2'"
                                    v-bind="attrs"
                                    v-on="on"
                                >
                                    <span>{{ $t(typeToLabel[type].toLowerCase()) }}</span>
                                    <v-icon right>
                                        mdi-menu-down
                                    </v-icon>
                                </v-btn>
                            </template>
                            <v-list>
                                <v-list-item @click="type = 'day'">
                                    <v-list-item-title>{{ $t('day') }}</v-list-item-title>
                                </v-list-item>
                                <v-list-item @click="type = 'week'">
                                    <v-list-item-title>{{ $t('week') }}</v-list-item-title>
                                </v-list-item>
                                <v-list-item @click="type = 'month'">
                                    <v-list-item-title>{{ $t('month') }}</v-list-item-title>
                                </v-list-item>
                            </v-list>
                        </v-menu>
                    </v-toolbar>
                </v-sheet>
                <v-sheet height="680">
                    <v-calendar
                        ref="calendar"
                        v-model="focus"
                        color="primary"
                        :events="events"
                        :event-color="getEventColor"
                        :type="type"
                        :locale="calendarLocale"
                        :key="`calendar-${refreshId}`"
                        :interval-height="40"
                        @click:event="showEvent"
                        @click:more="viewDay"
                        @click:date="viewDay"
                        @change="updateRange"
                    >
                        <template v-slot:day-body="{ date, week }">
                            <div
                            class="v-current-time"
                            :class="{ first: date === week[0].date }"
                            :style="{ top: nowY }"
                            ></div>
                        </template>
                        <template v-slot:event="{ eventSummary, event }">
                            <div
                                class="pl-1"
                                :class="{ 'text--disabled': event.selfStudy }"
                                v-html="eventSummary()"
                            ></div>
                        </template>
                    </v-calendar>
                    <v-menu
                        v-model="selectedOpen"
                        nudge-right="5"
                        transition="slide-x-transition"
                        content-class="large-radius"
                        :close-on-content-click="false"
                        :activator="selectedElement"
                        offset-x
                    >
                        <v-card
                            class="event-card"
                            min-width="350px"
                            flat
                        >
                            <v-toolbar
                                color="#ffffff"
                                flat
                            >
                                <v-toolbar-title :class="selectedEvent.titleColor ? `${selectedEvent.titleColor.split(' ')[0] === 'uomtheme' ? 'primary' : selectedEvent.titleColor.split(' ')[0]}--text${selectedEvent.titleColor.split(' ').length > 1 ? ` text--${selectedEvent.titleColor.split(' ')[1]}` : ''}` : ''" class="calendar-selected-name">
                                    {{ selectedEvent.details === 'Coursework Deadline' ? selectedEvent.name : (selectedEvent.subjectName === '' ? selectedEvent.name.split('/')[0] : selectedEvent.subjectName) }}<br>
                                    <span class="text--disabled calendar-smaller-font">{{ selectedEvent.details === 'Coursework Deadline' ? (selectedEvent.subjectName === '' ? $t('coursework') : selectedEvent.subjectName) : selectedEvent.rawTitle }}{{ selectedEvent.selfStudy ? $t('self_study') : '' }}</span>
                                </v-toolbar-title>
                                <v-spacer></v-spacer>
                                <v-tooltip top v-if="selectedEvent.subjectId !== '' && subjectLinks(selectedEvent.subjectId).homeLink !== false">
                                    <template v-slot:activator="{ on, attrs }">
                                        <v-btn
                                            icon
                                            small
                                            class="mr-0 ml-2 course-home"
                                            target="_blank"
                                            :href="subjectLinks(selectedEvent.subjectId).homeLink"
                                            color="grey"
                                            v-bind="attrs"
                                            v-on="on"
                                        >
                                            <v-icon>mdi-home-outline</v-icon>
                                        </v-btn>
                                    </template>
                                    <span>{{ $t('subject_home') }}</span>
                                </v-tooltip>
                            </v-toolbar>
                            <v-card-text>
                                <span v-if="selectedEvent.details !== 'Coursework Deadline'">
                                    {{ $t('from') }}{{ selectedEvent.start ? getDate(selectedEvent.start) : '' }}<br>
                                    {{ $t('to') }}{{ selectedEvent.end ? getDate(selectedEvent.end) : '' }}<br>
                                </span>
                                <span v-else>
                                    {{ selectedEvent.start ? getDate(selectedEvent.start) : '' }}
                                </span>
                                <br>
                                <v-list flat class="list" v-if="selectedEvent.details !== 'Coursework Deadline' && selectedEvent.subjectId !== '' && subjectLinks(selectedEvent.subjectId).sessionLinks.length > 0">
                                    <v-list-item-group>
                                        <v-list-item
                                            v-for="(link, index) in subjectLinks(selectedEvent.subjectId).sessionLinks"
                                            :key="`subject-link-${index}`"
                                            :ripple="false"
                                        >
                                            <template>
                                                <v-list-item-content>
                                                    <v-list-item-title>
                                                        <v-btn x-small icon :href="meetingLink(link.link, link.passcode)" :title="ifZoomLink(link.link) ? $t('quick_zoom') : $t('quick_teams')" v-if="ifZoomLink(link.link) || ifTeamsLink(link.link)" class="mr-1 text-decoration-none"><v-icon small>{{ ifTeamsLink(link.link) ? 'mdi-microsoft-teams' : 'mdi-dock-window' }}</v-icon></v-btn><a :href="link.link" target="_blank" rel="noopener nofollow" :class="selectedEvent.titleColor ? `${selectedEvent.titleColor.split(' ')[0] === 'uomtheme' ? 'primary' : selectedEvent.titleColor.split(' ')[0]}--text${selectedEvent.titleColor.split(' ').length > 1 ? ` text--${selectedEvent.titleColor.split(' ')[1]}` : ''}` : ''">{{ link.name }}</a><a :href="link.link" target="_blank" rel="noopener nofollow" class="no-underline-link"><v-icon small :color="selectedEvent.titleColor ? (selectedEvent.titleColor === 'uomtheme' ? 'primary' : selectedEvent.titleColor) : ''">mdi-open-in-new</v-icon>
                                                        </a>
                                                    </v-list-item-title>
                                                </v-list-item-content>
                                                <v-list-item-action class="copy">
                                                    <v-btn
                                                        @click="copyingIndex = index"
                                                        v-if="link.passcode"
                                                        v-clipboard:copy="link.passcode"
                                                        v-clipboard:success="onCopy"
                                                        small
                                                        text
                                                        class="pr-2"
                                                        :color="(copySuccess && copyingIndex === index) ? 'green' : ''"
                                                        :class="(copySuccess && copyingIndex === index) ? 'copied' : ''"
                                                        :title="$t('copy_passcode')"
                                                    >
                                                        <v-icon
                                                            left
                                                            dark
                                                            small
                                                            :color="(copySuccess && copyingIndex === index) ? 'green' : 'gray'"
                                                            :class="(copySuccess && copyingIndex === index) ? 'mr-0' : ''"
                                                        >
                                                            {{ (copySuccess && copyingIndex === index) ? 'mdi-check' : 'mdi-content-copy' }}
                                                        </v-icon>
                                                        {{ (copySuccess && copyingIndex === index) ? '' : link.passcode }}
                                                    </v-btn>
                                                </v-list-item-action>
                                            </template>
                                        </v-list-item>
                                    </v-list-item-group>
                                </v-list>
                                <pre v-html="selectedEvent.details === 'Coursework Deadline' ? $t('course_ddl') : selectedEvent.details"></pre>
                                <div v-html="selectedEvent.details ? showMap(selectedEvent.details) : ''" v-if="selectedEvent.details && selectedEvent.details !== 'Coursework Deadline'"></div>
                            </v-card-text>
                        </v-card>
                    </v-menu>
                </v-sheet>
            </v-col>
        </v-row>
    </v-card>
</template>

<script>
import { mapState } from 'vuex';
import { parse } from 'ical.js';
import localForage from 'localforage';

import checkResponse from '@/mixins/checkResponse';
import liveLinks from '@/mixins/liveLinks';
import clipboard from '@/mixins/clipboard';

import formatDateTime from '@/tools/formatDateTime';
import betterFetch from '@/tools/betterFetch';

export default {
    name: 'calendar',
    mixins: [checkResponse, liveLinks, clipboard],
    data() {
        return {
            loading: false,
            focus: '',
            type: 'month',
            typeToLabel: {
                month: 'Month',
                week: 'Week',
                day: 'Day',
            },
            nowY: '-10px',
            selectedEvent: {},
            selectedElement: null,
            selectedOpen: false,
            events: [],
            today: '',
            refreshId: `${new Date().getDate()}`,
            classEvents: [],
            courseworkEvents: [],
            updateTimer: null,
            updatePointertimer: null,
        };
    },
    methods: {
        /**
         * View a specific day
         * @param {object} option options
         * @param {string} option.date target date
         */
        viewDay({ date }) {
            this.focus = date;
            this.type = 'day';
        },
        /**
         * Get an event's color
         * @param {object} event event object
         * @returns {string} event color
         */
        getEventColor(event) {
            return event.color;
        },
        /**
         * Set the focus to today
         */
        setToday() {
            this.focus = '';
        },
        /**
         * Move the calendar a page back
         */
        prev() {
            this.$refs.calendar.prev();
        },
        /**
         * Move the calendar a page forward
         */
        next() {
            this.$refs.calendar.next();
        },
        /**
         * Show the detail card for an event
         * @param {object} events click event and the selected event
         * @param {Event} events.nativeEvent event object
         * @param {object} events.event event object
         * @returns {string} event color
         */
        showEvent({ nativeEvent, event }) {
            const open = () => {
                this.selectedEvent = event;
                this.selectedElement = nativeEvent.target;
                setTimeout(() => {
                    this.selectedOpen = true;
                }, 10);
            };

            if (this.selectedOpen) {
                this.selectedOpen = false;
                setTimeout(open, 10);
            } else {
                open();
            }

            nativeEvent.stopPropagation();
        },
        /**
         * Update view when range changed
         * @param {object} data event data
         */
        updateRange(data) {
            this.today = data.start.date;
            this.$nextTick(() => {
                if (this.type === 'day') {
                    this.updateTime();
                    if (this.$refs.calendar) {
                        const todayObj = new Date();
                        const dd = String(todayObj.getDate()).padStart(2, '0');
                        const mm = String(todayObj.getMonth() + 1).padStart(2, '0');
                        const yyyy = todayObj.getFullYear();

                        if (this.today === `${yyyy}-${mm}-${dd}`) {
                            let hour = todayObj.getHours();
                            let minute = todayObj.getMinutes();
                            if (hour < 6) {
                                hour = 0;
                                minute = 0;
                            } else {
                                hour -= 6;
                            }
                            this.$refs.calendar.scrollToTime({
                                hour,
                                minute,
                            });
                        }
                    }
                } else {
                    this.nowY = '-10px';
                }
            });
        },
        /**
         * Update timing bar position in day view
         */
        updateTime() {
            if (this.type === 'day') {
                const todayObj = new Date();
                const dd = String(todayObj.getDate()).padStart(2, '0');
                const mm = String(todayObj.getMonth() + 1).padStart(2, '0');
                const yyyy = todayObj.getFullYear();

                if (this.today === `${yyyy}-${mm}-${dd}` && this.$refs.calendar) {
                    this.$refs.calendar.updateTimes();
                    this.nowY = `${this.$refs.calendar.timeToY(this.$refs.calendar.times.now)}px`;
                } else {
                    this.nowY = '-10px';
                }
            } else {
                this.nowY = '-10px';
            }
        },
        /**
         * Update events from backend
         */
        async checkUpdate(tryCount = 1) {
            if (!this.backend.url || !this.account.calendar) {
                return;
            }
            this.loading = true;
            let requestFailed = false;
            // Send request
            const response = await betterFetch(`https://${this.backend.url}/calendar/`, {
                method: 'POST',
                body: JSON.stringify({
                    subid: this.account.calendar,
                    token: this.backend.token ? this.backend.token : '',
                }),
            }).catch(() => {
                if (tryCount < 2) {
                    // Retry
                    setTimeout(() => {
                        this.checkUpdate(tryCount + 1);
                    }, 8000);
                } else {
                    // Network error
                    this.$store.commit('addError', {
                        title: this.$t('network_error'),
                        content: this.$t('network_error_body'),
                        type: 'warning',
                    });
                    this.loading = false;
                    this.updateTime();
                    this.$refs.calendar.checkChange();
                    this.refreshId = `${new Date().valueOf()}`;

                    this.updateTodayEvents();
                    this.updateNextDayFirstEvent();
                }
                requestFailed = true;
            });

            if (requestFailed) {
                return;
            }

            // Check response
            if (!this.checkResponse(response)) {
                this.loading = false;
                return;
            }

            // Construct maps
            const subjectMap = {};
            const subjectLongMap = {};
            const colorMap = {};
            const subjectIdList = [];
            for (const subject of JSON.parse(localStorage.getItem('subjects') ? localStorage.getItem('subjects') : '[]')) {
                subjectMap[subject.id] = subject.shortName;
                subjectLongMap[subject.id] = subject.name;
                colorMap[subject.id] = subject.color;
                subjectIdList.push(subject.id);
            }

            // Parse ical file
            let rawData = [[], [], []];
            try {
                rawData = parse(response.data);
                this.$store.commit('setBackendStatus', true);
            } catch (icalerr) {
                this.$store.commit('addError', {
                    title: this.$t('ical_error'),
                    content: `${icalerr.name}: ${icalerr.message} ${this.$t('at')} ${this.getDate(new Date())}`,
                    type: 'error',
                });
            }

            this.events = [];
            this.classEvents = [];

            // Update events
            const nowDate = new Date().valueOf();
            for (const item of rawData[2]) {
                if (item[0] === 'vevent') {
                    const startTime = new Date(new Date(item[1][3][3]).toUTCString());
                    const timeDiff = (startTime.valueOf() - nowDate) / 1000;
                    // Events range: -1 month to +2 months
                    if (timeDiff < 5184000 && timeDiff > -2592000) {
                        // Get event title, adapted to events with locations
                        const title = typeof item[1][6][3] === 'number' ? item[1][7][3] : item[1][6][3];

                        // Get subject name (if exists)
                        const titleSplit = title.replace('_', '').split('/');
                        const titleName = titleSplit[0];
                        titleSplit.shift();
                        const titleRemain = `/${titleSplit.join('/')}`;

                        // Convert time
                        const rawEnd = new Date(new Date(item[1][1][3]).toUTCString());

                        const selfStudy = item[1][0][3].toUpperCase().includes('EVENT TYPE: INDEPENDENT STUDY');
                        let color = colorMap[titleName] ? colorMap[titleName] : 'uomtheme';
                        if (selfStudy) {
                            color = 'colordark';
                        }

                        const event = {
                            name: `${subjectMap[titleName] ? subjectMap[titleName] : titleName}${titleRemain}`,
                            details: item[1][0][3],
                            start: startTime,
                            end: rawEnd,
                            color,
                            titleColor: colorMap[titleName] ? colorMap[titleName] : 'uomtheme',
                            timed: true,
                            rawTitle: title,
                            subjectName: `${subjectLongMap[titleName] ? subjectLongMap[titleName] : ''}`,
                            subjectId: subjectIdList.includes(titleName) ? titleName : '',
                            selfStudy,
                        };
                        this.classEvents.push(event);
                    }
                }
            }
            // Concat with cousework events
            this.events = this.classEvents.concat(this.courseworkEvents);
            await localForage.setItem('calendar', this.events);

            // Refresh calendar
            this.loading = false;
            this.updateTime();
            if (this.$refs.calendar) {
                this.$refs.calendar.checkChange();
            }
            this.refreshId = `${new Date().valueOf()}`;

            // Broadcast latest events
            this.updateTodayEvents();
            this.updateNextDayFirstEvent();
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
         * Convert a Date object to a specified time zone
         * @param {Date} date Date object
         * @param {string} tzString timezone name
         * @returns {Date} a new Date object that has converted to the specified time zone
         */
        convertTimeZone(date, tzString) {
            return new Date((typeof date === 'string' ? new Date(date) : date).toLocaleString('en-US', { timeZone: tzString }));
        },
        /**
         * Update and broadcast today's events
         */
        updateTodayEvents() {
            const eventList = [];
            for (const event of this.events) {
                if (event.details !== 'Coursework Deadline') {
                    const eventTime = this.convertTimeZone(event.start, 'Europe/London');
                    const nowTime = this.convertTimeZone(new Date(), 'Europe/London');
                    if (eventTime.getMonth() === nowTime.getMonth() && eventTime.getDate() === nowTime.getDate()) {
                        eventList.push(event);
                    }
                }
            }
            this.$store.commit('setTodayEvents', eventList);
        },
        /**
         * Update and broadcast next day's first event or `null`
         */
        updateNextDayFirstEvent() {
            const eventList = [];
            for (const event of this.events) {
                if (event.details !== 'Coursework Deadline') {
                    const eventTime = this.convertTimeZone(event.start, 'Europe/London');
                    const nowTime = this.convertTimeZone(new Date(new Date().valueOf() + 86400000), 'Europe/London');
                    if (eventTime.getMonth() === nowTime.getMonth() && eventTime.getDate() === nowTime.getDate()) {
                        eventList.push(event);
                    }
                }
            }

            let firstEvent = null;
            for (const event of eventList) {
                if (firstEvent === null || firstEvent.start.valueOf() > event.start.valueOf()) {
                    firstEvent = event;
                }
            }
            this.$store.commit('setNextDayFirstEvent', firstEvent);
        },
        /**
         * Check if there is a location link in the details of an event and show the Google map if needed
         */
        showMap(details) {
            const lines = details.split('\n');
            for (const line of lines) {
                const linePart = line.split(': ');
                if (linePart[0] === 'Map Link') {
                    // Parse URL
                    const urlQuery = new URLSearchParams(new URL(linePart[1]).search);
                    if (urlQuery.get('query_place_id') !== null) {
                        return `<iframe src="https://www.google.com/maps/embed/v1/place?key=AIzaSyAn46nX_pMvKfKcp5_Nqc4C3GCKj8CHJ7M&amp;q=place_id:${urlQuery.get('query_place_id')}" width="100%" height="300" frameborder="0" style="border:0;" allowfullscreen></iframe>`;
                    }
                    if (urlQuery.get('query') !== null) {
                        return `<iframe src="https://www.google.com/maps/embed/v1/place?key=AIzaSyAn46nX_pMvKfKcp5_Nqc4C3GCKj8CHJ7M&amp;q=${urlQuery.get('query')}" width="100%" height="300" frameborder="0" style="border:0;" allowfullscreen></iframe>`;
                    }
                }
            }
            return '';
        },
        /**
         * Map from subject ID to subject links
         * @param {string} subject subject ID
         * @returns {object} subject links, `object.homeLine`: string, `object.sessionLinks`: array
         */
        subjectLinks(id) {
            for (const subject of this.subjects) {
                if (subject.id === id) {
                    return {
                        homeLink: subject.homeLink,
                        sessionLinks: subject.sessionLinks,
                    };
                }
            }
            return {
                homeLink: false,
                sessionLinks: [],
            };
        },
    },
    watch: {
        locale() {
            this.$i18n.locale = this.locale;
        },
        subjects() {
            // Construct maps
            const subjectMap = {};
            const subjectLongMap = {};
            const colorMap = {};
            const subjectIdList = [];
            for (const subject of this.subjects) {
                subjectMap[subject.id] = subject.shortName;
                subjectLongMap[subject.id] = subject.name;
                colorMap[subject.id] = subject.color;
                subjectIdList.push(subject.id);
            }

            // Update subjects in courseworks' events
            for (const item of this.events) {
                if (item.details !== 'Coursework Deadline') {
                    const title = item.rawTitle;
                    const titleSplit = title.replace('_', '').split('/');
                    const titleName = titleSplit[0];
                    titleSplit.shift();
                    const titleRemain = `/${titleSplit.join('/')}`;
                    let color = colorMap[titleName] ? colorMap[titleName] : 'uomtheme';
                    if (item.selfStudy) {
                        color = 'colordark';
                    }

                    item.name = `${subjectMap[titleName] ? subjectMap[titleName] : titleName}${titleRemain}`;
                    item.color = color;
                    item.titleColor = colorMap[titleName] ? colorMap[titleName] : 'uomtheme';
                    item.subjectName = `${subjectLongMap[titleName] ? subjectLongMap[titleName] : ''}`;
                    item.subjectId = subjectIdList.includes(titleName) ? titleName : '';
                }
            }

            this.updateTodayEvents();
            this.updateNextDayFirstEvent();
        },
        timerMin() {
            // Check event change every minute
            this.$refs.calendar.updateTimes();
            this.$refs.calendar.checkChange();
        },
        timerHour() {
            // Update upcoming events every hour and refresh at 00:00
            this.updateTodayEvents();
            this.updateNextDayFirstEvent();

            if (this.timerHour.substr(0, 2) === '00') {
                this.refreshId = `${new Date().valueOf()}`;
            }
        },
        courseworks() {
            // Update coursworks' events
            this.courseworkEvents = this.courseworks ? this.courseworks : [];
            this.events = this.classEvents.concat(this.courseworkEvents);
            this.$refs.calendar.checkChange();
            this.refreshId = `${new Date().valueOf()}`;
        },
    },
    computed: {
        ...mapState({
            locale: (state) => state.locale,
            localeDetail: (state) => state.localeDetail,
            subjects: (state) => state.subjects,
            timerMin: (state) => state.timerMin,
            timerHour: (state) => state.timerHour,
            courseworks: (state) => state.courseworks,
            backend: (state) => state.backend,
            backendStatus: (state) => state.backendStatus,
            account: (state) => state.account,
        }),
        calendarLocale() {
            return this.localeDetail === null ? 'en' : this.localeDetail.iso;
        },
    },
    async mounted() {
        this.$i18n.locale = localStorage.getItem('language') || 'en';

        // Restore notes from localstorage
        const storaged = await localForage.getItem('calendar');
        if (storaged !== null) {
            this.events = storaged;
        }

        // Check if updating
        if ((localStorage.getItem('update_frontend') || 'false') !== 'true') {
            // Fetch events from backend
            this.$nextTick(() => {
                this.checkUpdate();
            });
        }

        // Update events every 6 hours
        this.updateTimer = setInterval(() => {
            this.checkUpdate();
        }, 21600000);

        // Update timing pointer in day view every 20 seconds
        this.updatePointertimer = setInterval(() => {
            this.updateTime();
        }, 20000);

        // Force refresh
        setTimeout(() => {
            this.refreshId = `${new Date().valueOf()}`;
        }, 1000);
    },
    beforeDestroy() {
        clearInterval(this.updateTimer);
        clearInterval(this.updatePointertimer);
    },
};
</script>

<style lang="less">
.calendar-container {
    position: relative;
    padding-left: 0;
    padding-right: 0;
    overflow: hidden;
    contain: strict;
    .loading {
        margin-left: 10px;
    }
    .phb-11 {
        padding-left: 11px;
        padding-right: 11px;
        padding-bottom: 11px;
    }
    .v-calendar-weekly__week {
        .v-calendar-weekly__day:last-child {
            border-right: none!important;
            padding-right: 1.25px;
        }
        button.v-btn.v-size--small {
            width: 35px;
            height: 35px;
            margin-bottom: 5px;
        }
    }
    .v-calendar-weekly__head {
        .v-calendar-weekly__head-weekday {
            padding-top: 5px;
            &:last-child {
                border-right: none!important;
            }
        }
    }
    .theme--light.v-calendar-events .v-event-more {
        background-color: transparent;
    }
    .v-calendar .v-event-timed-container {
        margin-right: 1px;
    }
    .v-event.v-event-start.v-event-end {
        margin-left: 2.5%;
    }
    .v-current-time {
        height: 2px;
        background-color: #ea4335;
        position: absolute;
        left: -1px;
        right: 0;
        pointer-events: none;
        &.first::before {
            content: '';
            position: absolute;
            background-color: #ea4335;
            width: 12px;
            height: 12px;
            border-radius: 50%;
            margin-top: -5px;
            margin-left: -6.5px;
        }
    }
    .v-calendar-daily__interval-text {
        top: -8px;
        padding-right: 2px;
    }
    .v-calendar-daily__interval {
        padding-right: 3px;
    }
    .v-calendar-daily__interval::after {
        width: 3px;
    }
    .v-btn.v-btn--has-bg.v-btn--round.v-size--default.primary {
        height: 50px;
        width: 50px;
        margin-top: 3px;
        margin-bottom: 3px;
    }
}
.event-card {
    .calendar-selected-name {
        line-height: 17px;
        margin-top: 10px;
        .calendar-smaller-font {
            font-size: 0.875rem;
        }
    }
    .list {
        margin-bottom: 20px;
        background-color: #f3f3f3;
        border-radius: 6px;
        .v-list-item {
            cursor: default;
            min-height: 28px;
        }
        a {
            cursor: pointer;
            text-decoration: none;
            &:hover, &:focus {
                text-decoration: underline;
            }
        }
        a.no-underline-link {
            text-decoration: none;
            padding-left: 5px;
        }
        .v-list-item__content {
            padding: 0;
        }
        .copy {
            margin: 0;
            margin-left: 8px!important;
            .v-btn {
                font-family: monospace;
                width: 90px;
                margin-right: -4px;
                .v-icon--left {
                    margin-right: 4px;
                }
            }
        }
    }
    pre {
        font-family: Roboto, -apple-system, "Noto Sans", "Helvetica Neue", Helvetica, "Nimbus Sans L", Arial,"Liberation Sans", "PingFang SC", "Hiragino Sans GB", "Noto Sans CJK SC", "Source Han Sans SC", "Source Han Sans CN", "Microsoft YaHei", "Wenquanyi Micro Hei", "WenQuanYi Zen Hei", "ST Heiti", SimHei, "WenQuanYi Zen Hei Sharp", sans-serif;
    }
}
#app.theme--dark .event-card {
    .list {
        background-color: #2c2c2c;
    }
    .v-toolbar {
        background-color: #1E1E1E!important;
    }
}
#app.theme--dark .v-calendar-events .v-event-more {
    background-color: transparent;
}
#app.theme--dark .calendar-container {
    .theme--dark.v-toolbar.v-sheet {
        background-color: #1E1E1E;
    }
}
</style>

<i18n src="../locales/network.json"></i18n>
<i18n>
{
    "en": {
        "today": "Today",
        "day": "Day",
        "week": "Week",
        "month": "Month",
        "from": "From: ",
        "to": "To: ",
        "course_ddl": "Coursework Deadline",
        "coursework": "Coursework",
        "subject_home": "Course Home Page",
        "ical_error": "Cannot parse ical file",
        "network_error_body": "Cannot fetch latest events from calendar subscription URL",
        "quick_zoom": "Zoom meeting quick start",
        "quick_teams": "Teams meeting quick start",
        "copy_passcode": "Copy passcode",
        "self_study": " (Independent Study)"
    },
    "zh": {
        "today": "今天",
        "day": "日视图",
        "week": "周视图",
        "month": "月视图",
        "from": "从：",
        "to": "到：",
        "course_ddl": "作业到期",
        "coursework": "作业",
        "subject_home": "科目主页",
        "ical_error": "无法解析 ical 文件",
        "network_error_body": "无法从日历订阅 URL 获取最新事件",
        "quick_zoom": "快速启动 Zoom 会议",
        "quick_teams": "快速启动 Teams 会议",
        "copy_passcode": "复制密码",
        "self_study": "（自学）"
    },
    "es": {
        "today": "Hoy",
        "day": "Día",
        "week": "Semana",
        "month": "Mes",
        "from": "Desde: ",
        "to": "Hasta: ",
        "course_ddl": "Fecha límite para trabajo de curso",
        "coursework": "Trabajo de curso",
        "subject_home": "Página principal de asignatura",
        "ical_error": "No ha sido posible analizar los archivos ical.",
        "network_error_body": "No ha sido posible obtener los últimos eventos desde la subscripción del calendario.",
        "quick_zoom": "Acceder a Zoom",
        "quick_teams": "Acceder a Teams",
        "copy_passcode": "Copiar contraseña",
        "self_study": " (Autoestudio) "
    }
}
</i18n>
