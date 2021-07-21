<template>
    <v-card
        class="mx-auto rounded-lg livelinks-container"
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
        <div class="livelinks-outer">
            <h2 class="handle">{{ $t('live_links') }}</h2>
            <v-tabs @change="relocate" show-arrows v-if="shownSubjects.length > 0">
                <v-tab
                    v-for="(item, index) in shownSubjects"
                    :key="`${index}`"
                >
                    <span><span :class="item.color" class="subject-color-samll"></span> {{ item.shortName }}</span>
                </v-tab>

                <v-tab-item
                    v-for="(item, index) in shownSubjects"
                    :key="`tab-item-${index}`"
                >
                    <v-container fluid>
                        <v-list flat class="list" :class="{ 'non-empty': !(item.sessionLinks.length === 0)}">
                            <v-list-item-group>
                                <v-list-item
                                    v-for="(link, index) in item.sessionLinks"
                                    :key="`tab-item-link-${index}`"
                                    :ripple="false"
                                >
                                    <template>
                                        <v-list-item-content>
                                            <v-list-item-title>
                                                <v-btn x-small icon :href="meetingLink(link.link, link.passcode)" :title="ifZoomLink(link.link) ? $t('quick_zoom') : $t('quick_teams')" v-if="ifZoomLink(link.link) || ifTeamsLink(link.link)" class="mr-1 text-decoration-none"><v-icon small>{{ ifTeamsLink(link.link) ? 'mdi-microsoft-teams' : 'mdi-dock-window' }}</v-icon></v-btn>
                                                <a :href="link.link" target="_blank" rel="noopener nofollow">{{ link.name }}</a><a :href="link.link" target="_blank" rel="noopener nofollow" class="no-underline-link"><v-icon small color="primary">mdi-open-in-new</v-icon></a>
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
                        <div class="empty" v-if="item.sessionLinks.length === 0">
                            {{ $t('nothing') }}
                        </div>
                    </v-container>
                </v-tab-item>
            </v-tabs>
            <div class="empty empty-high" v-else>
                {{ $t('no_class') }}
            </div>
        </div>
    </v-card>
</template>

<script>
import { mapState } from 'vuex';

import liveLinks from '@/mixins/liveLinks';
import clipboard from '@/mixins/clipboard';

export default {
    name: 'livelinks',
    mixins: [liveLinks, clipboard],
    data() {
        return {
            loading: false,
        };
    },
    methods: {
        /**
         * Update layout after animation
         */
        relocate() {
            setTimeout(() => {
                this.packery.shiftLayout();
            }, 300);
        },
    },
    watch: {
        locale() {
            this.$i18n.locale = this.locale;
        },
        links() {
            this.store();
        },
        subjects() {
            // Update layout when subjects changed
            this.$nextTick(() => {
                this.packery.shiftLayout();
            });
        },
    },
    computed: {
        ...mapState({
            locale: (state) => state.locale,
            packery: (state) => state.packery,
            subjects: (state) => state.subjects,
        }),
        shownSubjects() {
            // Filter out hidden subjects
            return this.subjects.filter((subject) => !subject.hide);
        },
    },
    mounted() {
        this.$i18n.locale = localStorage.getItem('language') || 'en';

        // Update layout
        setTimeout(() => {
            if (this.packery) {
                this.packery.shiftLayout();
            }
        }, 1000);
    },
};
</script>

<style lang="less">
.livelinks-container {
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
    }
    .subject-color-samll {
        width: 9px;
        height: 9px;
        display: inline-block;
        border-radius: 50%;
        margin: 0;
        margin-right: 3px;
        margin-left: -1px;
    }
    .list {
        padding-top: 0;
        background-color: transparent;
        &.non-empty {
            min-height: 130px;
        }
        .v-list-item {
            cursor: default;
            min-height: 36px;
        }
        a {
            cursor: pointer;
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
    .empty {
        width: 100%;
        height: 120px;
        display: flex;
        justify-content: center;
        align-items: center;
        opacity: .5;
        font-size: 15px;
        &.empty-high {
            height: 200px;
        }
    }
    .livelinks-outer {
        width: 100%;
    }
}
</style>

<i18n>
{
    "en": {
        "live_links": "Online Session Links",
        "add_link": "Add a link",
        "nothing": "No link here",
        "no_class": "No course yet",
        "quick_zoom": "Zoom meeting quick start",
        "quick_teams": "Teams meeting quick start",
        "copy_passcode": "Copy passcode"
    },
    "zh": {
        "live_links": "在线课程链接",
        "nothing": "没有链接",
        "no_class": "还没有科目",
        "quick_zoom": "快速启动 Zoom 会议",
        "quick_teams": "快速启动 Teams 会议",
        "copy_passcode": "复制密码"
    },
    "es": {
        "live_links": "Enlaces de clases online",
        "nothing": "No hay enlaces",
        "no_class": "No hay clases todavía",
        "quick_zoom": "Acceder a Zoom",
        "quick_teams": "Acceder a Teams",
        "copy_passcode": "Copiar contraseña"
    }
}
</i18n>
