<template>
    <v-card
        class="mx-auto rounded-lg attendance-container"
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
        <div class="attendance-outer">
            <h2 class="mr-5 handle">
                {{ $t('attendance') }}
                <v-btn icon small class="attendance-goto" href="https://studentnet.cs.manchester.ac.uk/ugt/attendance/" target="_blank" rel="noopener nofollow">
                    <v-icon>mdi-chevron-right</v-icon>
                </v-btn>
                <span class="float-right text-overline clickable" :class="{ 'text--disabled': view === 'annual' }" @click="view = 'lastMonth'">
                    {{ $t('last_month') }}
                </span>
                <span class="float-right text-overline mr-4 clickable" :class="{ 'text--disabled': view === 'lastMonth' }" @click="view = 'annual'">
                    {{ $t('annual') }}
                </span>
            </h2>
            <v-slide-x-transition leave-absolute>
                <div class="text-h1 font-weight-regular text-right pt-3 pr-5 big-number" v-show="view === 'annual'" :class="{
                    'green--text': statusAnnual === 'ok',
                    'amber--text': statusAnnual === 'warning',
                    'grey--text': statusAnnual === 'unknown',
                }">
                    {{ annual === '-1' ? '--' : `${annual}%` }}
                </div>
            </v-slide-x-transition>
            <v-slide-x-reverse-transition leave-absolute>
                <div class="text-h1 font-weight-regular text-right pt-3 pr-5 big-number" v-show="view === 'lastMonth'" :class="{
                    'green--text': statusLastMonth === 'ok',
                    'amber--text': statusLastMonth === 'warning',
                    'grey--text': statusLastMonth === 'unknown',
                }">
                    {{ lastMonth === '-1' ? '--' : `${lastMonth}%` }}
                </div>
            </v-slide-x-reverse-transition>
            <div class="pt-3 pr-5 place-holder"></div>
            <div class="empty" v-if="init && absentRecord.length === 0 || (!init && loading)">
                {{ $t('nothing') }}
            </div>
            <div class="empty higher" v-if="!init && !loading">
                <span class="text-center pl-6 pr-6">{{ $t('cannot_fetch') }} <a href="https://github.com/uom-assistant/uom-assistant/wiki" target="_blank" rel="noreferrer noopener">{{ $t('learn_more') }}</a></span>
            </div>
            <v-list flat class="list">
                <v-list-item v-for="(record, index) in absentRecord" :key="index">
                    <v-list-item-content>
                        <v-list-item-title>{{ record.name }}</v-list-item-title>
                        <v-list-item-subtitle>
                            <span class="mr-2">
                                <v-icon small>
                                    mdi-clock-outline
                                </v-icon>
                                {{ getDate(new Date(record.date)) }}
                            </span>
                            <span>
                                <span :class="subjectColor(record.subject)" class="subject-color-samll" v-if="subjectNameMap(record.subject) !== record.subject"></span>
                                {{ subjectNameMap(record.subject) }}
                            </span>
                        </v-list-item-subtitle>
                    </v-list-item-content>
                    <v-list-item-action class="red--text text--lighten-1">
                        {{ $t('absent') }}
                    </v-list-item-action>
                </v-list-item>
            </v-list>
            <v-icon v-show="view === 'lastMonth'" class="attendance-check" :color="statusLastMonth === 'ok' ? 'green' : (statusLastMonth === 'warning' ? 'amber' : 'gray')">{{ statusLastMonth === 'ok' ? 'mdi-check-circle-outline' : (statusLastMonth === 'warning' ? 'mdi-alert-circle-outline' : 'mdi-help-circle-outline') }}</v-icon>
            <v-icon v-show="view === 'annual'" class="attendance-check" :color="statusAnnual === 'ok' ? 'green' : (statusAnnual === 'warning' ? 'amber' : 'gray')">{{ statusAnnual === 'ok' ? 'mdi-check-circle-outline' : (statusAnnual === 'warning' ? 'mdi-alert-circle-outline' : 'mdi-help-circle-outline') }}</v-icon>
        </div>
    </v-card>
</template>

<script>
import { mapState } from 'vuex';
import formatDate from '@/tools/formatDate';

export default {
    name: 'attendance',
    data() {
        return {
            loading: false,
            lastMonth: '-1',
            annual: '-1',
            absentRecord: [],
            init: false,
            timer: null,
            view: 'lastMonth',
            statusAnnual: 'unknown',
            statusLastMonth: 'unknown',
        };
    },
    methods: {
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
         * Map from subject ID to subject short name
         * @param {string} subject subject ID
         * @returns {string} subject short name or raw ID (if none matched)
         */
        subjectNameMap(subject) {
            if (!this.subjects) {
                return subject;
            }
            for (const item of this.subjects) {
                if (item.id === subject) {
                    return item.shortName;
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
        absentRecord() {
            // Layout
            this.$nextTick(() => {
                this.packery.shiftLayout();
            });
        },
        attendanceUpdated() {
            // Update attendance
            if (this.attendance) {
                this.lastMonth = this.attendance.lastMonth;
                this.annual = this.attendance.annual;
                this.absentRecord = this.attendance.absentRecord;

                // Update status
                if (this.lastMonth === '-1') {
                    this.statusLastMonth = 'unknown';
                } else if (parseInt(this.lastMonth, 10) >= 95) {
                    this.statusLastMonth = 'ok';
                } else {
                    this.statusLastMonth = 'warning';
                }
                if (this.annual === '-1') {
                    this.statusAnnual = 'unknown';
                } else if (parseInt(this.annual, 10) >= 95) {
                    this.statusAnnual = 'ok';
                } else {
                    this.statusAnnual = 'warning';
                }
                this.init = true;
            }
            this.loading = false;
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
            attendance: (state) => state.attendance,
            attendanceUpdated: (state) => state.attendanceUpdated,
        }),
    },
    mounted() {
        this.$i18n.locale = localStorage.getItem('language') || 'en';

        if (!this.init) {
            this.loading = true;
        }
    },
    beforeDestroy() {
        clearInterval(this.timer);
    },
};
</script>

<style lang="less" scoped>
.attendance-container {
    position: relative;
    padding-left: 0;
    padding-right: 0;
    overflow: hidden;
    .loading {
        position: absolute;
        top: 10px;
        right: 10px;
    }
    h2 {
        font-size: 18px;
        font-weight: normal;
        opacity: .87;
        margin-top: 18px;
        margin-left: 20px;
        .clickable {
            cursor: pointer;
            transition: all .2s;
        }
    }
    .big-number {
        position: absolute;
        top: 50px;
        right: 0;
        width: calc(100% - 20px);
    }
    .place-holder {
        height: 110px;
    }
    .empty {
        width: 100%;
        height: 60px;
        display: flex;
        justify-content: center;
        align-items: center;
        opacity: 0.5;
        font-size: 15px;
        padding-top: 10px;
        &.higher {
            height: 80px;
        }
    }
    .attendance-goto {
        vertical-align: bottom;
    }
    .attendance-check {
        font-size: 350px;
        z-index: -1;
        position: absolute;
        top: -120px;
        left: -100px;
        opacity: .15;
    }
    .attendance-outer {
        width: 100%;
        padding-bottom: 20px;
    }
    .list {
        padding-bottom: 0;
        margin-bottom: -10px;
        background-color: transparent;
        .v-list-item {
            background-color: transparent;
            transition: background-color .2s;
            &:hover, &:focus {
                background-color: rgba(0, 0, 0, .04);
                .delete {
                    opacity: 1;
                }
            }
        }
        .time-remain {
            margin-right: 6px;
        }
        .v-list-item__subtitle {
            & > span.mr-2 > i {
                vertical-align: text-top;
            }
            .subject-color-samll {
                width: 10px;
                height: 10px;
                display: inline-block;
                border-radius: 50%;
                margin: 0;
                margin-right: 2px;
            }
        }
        .v-list-item__content {
            padding: 8px 0;
        }
        .v-list-item__action {
            margin-right: 0;
            margin-left: 8px;
        }
    }
}
</style>

<i18n src="../locales/network.json"></i18n>
<i18n>
{
    "en": {
        "attendance": "Attendance",
        "annual": "Annual",
        "last_month": "Last month",
        "nothing": "No absent record",
        "cannot_fetch": "Unable to get attendance data, probably you are not properly configured backend information or the backend does not allow this.",
        "learn_more": "Learn more",
        "absent": "Absent"
    },
    "zh": {
        "attendance": "出勤统计",
        "annual": "本年度",
        "last_month": "上月",
        "nothing": "没有缺勤记录",
        "cannot_fetch": "无法获取出勤信息，可能是没有正确配置后端信息或后端不允许。",
        "learn_more": "了解更多",
        "absent": "缺勤"
    },
    "es": {
        "attendance": "Asistencia",
        "annual": "Anual",
        "last_month": "Mes pasado",
        "nothing": "No registro de ausencia",
        "cannot_fetch": "No ha sido posible obtener los datos de asistencia, puede ser debido al inopropiado configurado servidor back-end o falta de permisión.",
        "learn_more": "Saber más",
        "absent": "Ausente"
    }
}
</i18n>
