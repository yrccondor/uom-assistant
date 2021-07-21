<template>
    <v-card
        class="mx-auto rounded-lg plugin-container"
        :class="expanded ? 'expanded' : ''"
        outlined
    >
        <div class="plugin-outer">
            <h2 class="handle" :class="{ shadow: headerShadow }">
                <span class="h2-title">{{ $t('plugins') }}</span>
                <v-progress-circular
                    indeterminate
                    color="grey"
                    :width="2"
                    :size="18"
                    class="loading ml-3"
                    v-show="loading"
                ></v-progress-circular>
                <v-btn icon small @click.stop="toggleExpanded" class="float-right mr-4 plugin-expand-btn" :title="expanded ? $t('collapse') : $t('expand')">
                    <v-icon>{{ expanded ? 'mdi-unfold-less-vertical' : 'mdi-unfold-more-vertical' }}</v-icon>
                </v-btn>
            </h2>
            <v-skeleton-loader
                class="mx-auto"
                type="list-item-avatar-three-line@3"
                v-if="!init && loading"
            ></v-skeleton-loader>
            <div class="scroll" v-if="plugins.length > 0" @scroll.passive="scrollHandler">
                <v-list flat class="list" three-line>
                    <v-list-item v-for="(item, index) in plugins" :key="item.id" @click="openPlugin(index)">
                        <v-badge
                            avatar
                            bordered
                            color="primary"
                            icon="mdi-star-four-points"
                            overlap
                            bottom
                            offset-x="30"
                            offset-y="23"
                            v-if="item.verified"
                        >
                            <v-list-item-avatar :color="$vuetify.theme.dark ? 'grey darken-1' : 'grey lighten-2'" :size="45">
                                <v-img :src="`/plugins/plugins/${item.id}/avatar.jpg`"></v-img>
                            </v-list-item-avatar>
                        </v-badge>
                        <v-list-item-avatar v-else :color="$vuetify.theme.dark ? 'grey darken-1' : 'grey lighten-2'" :size="45">
                            <v-img :src="`/plugins/plugins/${item.id}/avatar.jpg`"></v-img>
                        </v-list-item-avatar>

                        <v-list-item-content>
                            <v-list-item-title :title="item.name">{{ item.name }}</v-list-item-title>
                            <v-list-item-subtitle>
                                <span :title="item.description">{{ item.description }}</span>
                            </v-list-item-subtitle>
                        </v-list-item-content>
                    </v-list-item>
                </v-list>
            </div>
            <div class="empty" v-if="plugins.length === 0 && init && !loading">
                {{ $t('nothing') }}
            </div>
            <div class="plugin-panel">
                <h2 class="handle">
                    <v-btn icon small @click.stop="toggleExpanded" class="float-right mr-4 plugin-expand-btn" :title="expanded ? $t('collapse') : $t('expand')">
                        <v-icon>{{ expanded ? 'mdi-unfold-less-vertical' : 'mdi-unfold-more-vertical' }}</v-icon>
                    </v-btn>
                </h2>
                <div class="text--disabled">
                    {{ $t('nothing_opened') }}
                </div>
            </div>
            <v-slide-x-reverse-transition>
                <div v-show="shownTabs" class="plugin-tabs">
                    <h2 class="handle">
                        <v-btn icon small @click.stop="shownTabs = !shownTabs" :title="$t('return')" class="mr-3 return-btn">
                            <v-icon>mdi-arrow-left</v-icon>
                        </v-btn>
                        <span class="h2-title">{{ $t('running-plugins') }}</span>
                        <v-progress-circular
                            indeterminate
                            color="grey"
                            :width="2"
                            :size="18"
                            class="loading ml-3"
                            v-show="loading"
                        ></v-progress-circular>
                        <v-btn icon small @click.stop="toggleExpanded" class="float-right mr-4 plugin-expand-btn" :title="expanded ? $t('collapse') : $t('expand')">
                            <v-icon>{{ expanded ? 'mdi-unfold-less-vertical' : 'mdi-unfold-more-vertical' }}</v-icon>
                        </v-btn>
                        <v-menu
                            :close-on-content-click="false"
                            nudge-bottom="5"
                            content-class="large-radius"
                            transition="slide-y-transition"
                            offset-y
                            left
                        >
                            <template v-slot:activator="{ on, attrs }">
                                <v-btn icon small v-show="tab !== undefined && tabs[tab] && tabs[tab].state === 'running'" class="float-right mr-2" :title="$t('plugin_info')" v-on="on" v-bind="attrs">
                                    <v-icon>mdi-information-outline</v-icon>
                                </v-btn>
                            </template>
                            <v-card
                                class="plugin-info-card d-flex justify-start"
                                v-if="tab !== undefined && tabs[tab] && tabs[tab].state === 'running'"
                                flat
                            >
                                <div class="d-flex flex-row justify-start plugin-detail align-start mt-1">
                                    <v-badge
                                        avatar
                                        bordered
                                        color="primary"
                                        icon="mdi-star-four-points"
                                        overlap
                                        bottom
                                        offset-x="22"
                                        offset-y="22"
                                        v-if="tabs[tab].verified"
                                        class="mr-5 mt-1"
                                    >
                                        <v-avatar :color="$vuetify.theme.dark ? 'grey darken-1' : 'grey lighten-2'" :size="80">
                                            <v-img :src="`/plugins/plugins/${tabs[tab].id}/avatar.jpg`"></v-img>
                                        </v-avatar>
                                    </v-badge>
                                    <v-avatar v-else :color="$vuetify.theme.dark ? 'grey darken-1' : 'grey lighten-2'" :size="80" class="mr-5 mt-1">
                                        <v-img :src="`/plugins/plugins/${tabs[tab].id}/avatar.jpg`"></v-img>
                                    </v-avatar>
                                    <div class="d-flex flex-column align-start">
                                        <h3 class="text-h5">{{ tabs[tab].name }}</h3>
                                        <p class="text--secondary">{{ tabs[tab].description }}</p>
                                        <p class="primary--text font-weight-bold verified" v-if="tabs[tab].verified && tabs[tab].verifiedMessage !==''">
                                            <v-icon
                                                small
                                                color="primary"
                                                class="mr-1"
                                            >
                                                mdi-star-four-points
                                            </v-icon> {{ tabs[tab].verifiedMessage }}
                                        </p>
                                        <div class="plugin-meta">
                                            <span class="d-inline-block mb-1">
                                                <v-icon
                                                    small
                                                    color="primary"
                                                    class="mr-1"
                                                >
                                                    mdi-account
                                                </v-icon><span class="mr-3" v-if="tabs[tab].authorUrl === ''">{{ tabs[tab].author }}</span><a class="mr-3" v-else :href="tabs[tab].authorUrl" target="_blank">{{ tabs[tab].author }}</a>
                                            </span>
                                            <span v-if="tabs[tab].type === 'local'" class="d-inline-block mb-1">
                                                <v-icon
                                                    small
                                                    color="primary"
                                                    class="mr-1"
                                                >
                                                    mdi-pound-box
                                                </v-icon>{{ tabs[tab].version }}
                                            </span>
                                            <span v-else class="d-inline-block mb-1">
                                                <v-icon
                                                    small
                                                    color="primary"
                                                    class="mr-2"
                                                >
                                                    mdi-cloud
                                                </v-icon>{{ $t('cloud_plugin') }}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </v-card>
                        </v-menu>
                    </h2>
                    <v-tabs
                        v-model="tab"
                        show-arrows
                    >
                        <v-tab
                            v-for="(tab, index) in tabs"
                            :key="`tab-${tab.id}-${tab.state}`"
                        >
                            <v-icon x-small class="info-icon" color="grey" v-if="tab.state === 'unconfirmed' || tab.state === 'broken'">mdi-information-outline</v-icon>
                            {{ tab.name }}
                            <v-btn icon x-small class="ml-1" @click.stop="closeTab(index)" :title="$t('close')">
                                <v-icon>mdi-close</v-icon>
                            </v-btn>
                        </v-tab>
                    </v-tabs>
                    <v-tabs-items v-model="tab">
                        <v-tab-item
                            v-for="tab in tabs"
                            :key="`tab-item-${tab.id}`"
                        >
                            <v-card flat>
                                <div v-if="tab.state === 'unconfirmed'" class="detail-screen d-flex justify-start">
                                    <div class="d-flex flex-row justify-start plugin-detail align-start mt-4">
                                        <v-badge
                                            avatar
                                            bordered
                                            color="primary"
                                            icon="mdi-star-four-points"
                                            overlap
                                            bottom
                                            offset-x="22"
                                            offset-y="22"
                                            v-if="tab.verified"
                                            class="mr-5 mt-1"
                                        >
                                            <v-avatar :color="$vuetify.theme.dark ? 'grey darken-1' : 'grey lighten-2'" :size="80">
                                                <v-img :src="`/plugins/plugins/${tab.id}/avatar.jpg`"></v-img>
                                            </v-avatar>
                                        </v-badge>
                                        <v-avatar v-else :color="$vuetify.theme.dark ? 'grey darken-1' : 'grey lighten-2'" :size="80" class="mr-5 mt-1">
                                            <v-img :src="`/plugins/plugins/${tab.id}/avatar.jpg`"></v-img>
                                        </v-avatar>
                                        <div class="d-flex flex-column align-start">
                                            <h3 class="text-h5">{{ tab.name }}</h3>
                                            <p class="text--secondary">{{ tab.description }}</p>
                                            <p class="primary--text font-weight-bold verified" v-if="tab.verified && tab.verifiedMessage !==''">
                                                <v-icon
                                                    small
                                                    color="primary"
                                                    class="mr-1"
                                                >
                                                    mdi-star-four-points
                                                </v-icon> {{ tab.verifiedMessage }}
                                            </p>
                                            <div class="plugin-meta">
                                                <span class="d-inline-block mb-1">
                                                    <v-icon
                                                        small
                                                        color="primary"
                                                        class="mr-1"
                                                    >
                                                        mdi-account
                                                    </v-icon><span class="mr-3" v-if="tab.authorUrl === ''">{{ tab.author }}</span><a class="mr-3" v-else :href="tab.authorUrl" target="_blank">{{ tab.author }}</a>
                                                </span>
                                                <span v-if="tab.type === 'local'" class="d-inline-block mb-1">
                                                    <v-icon
                                                        small
                                                        color="primary"
                                                        class="mr-1"
                                                    >
                                                        mdi-pound-box
                                                    </v-icon>{{ tab.version }}
                                                </span>
                                                <span v-else class="d-inline-block mb-1">
                                                    <v-icon
                                                        small
                                                        color="primary"
                                                        class="mr-2"
                                                    >
                                                        mdi-cloud
                                                    </v-icon>{{ $t('cloud_plugin') }}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="d-flex align-self-start mt-8 px-3 run-btns">
                                        <v-btn
                                            outlined
                                            color="primary"
                                            class="run-btn"
                                        >
                                        {{ $t('allow_run') }}
                                        </v-btn>
                                        <v-btn
                                            depressed
                                            color="primary"
                                            class="run-btn"
                                        >
                                        {{ $t('run_once') }}
                                        </v-btn>
                                    </div>
                                    <p class="text--disabled allow-notice px-3 mt-3">{{ tab.type === 'local' ? $t('allow_notice') : $t('allow_notice_cloud') }}</p>
                                    <div v-if="tab.type === 'local'" class="full-width">
                                        <h4 class="text-subtitle-1 permission-title px-3 mt-3">{{ $t('declared_permission') }}<span class="num-badge" v-show="tab.permissions.danger.length + tab.permissions.declare.length > 0">{{ getPermissionNum(tab.permissions) }}</span></h4>
                                        <div class="permisson-list px-3 pt-2">
                                            <p class="text-body-2 pr-3 text--secondary" v-if="tab.permissions.danger.length + tab.permissions.declare.length === 0">
                                                <v-icon
                                                    small
                                                    color="grey"
                                                    class="mr-1"
                                                >
                                                    mdi-layers-off-outline
                                                </v-icon>{{ $t('no_permission') }}
                                            </p>
                                            <div v-for="(item, index) in tab.permissions.danger" :key="`danger-${index}`" class="permisson-item">
                                                <v-badge
                                                    bordered
                                                    color="orange darken-2"
                                                    content="!"
                                                    overlap
                                                    bottom
                                                    offset-x="17"
                                                    offset-y="23"
                                                    :title="$t('sensitive_permission')"
                                                >
                                                    <v-icon
                                                        x-large
                                                        :color="$vuetify.theme.dark ? 'grey' : 'grey darken-1'"
                                                        class="mb-1 permission-icon"
                                                    >
                                                        {{ item.name === 'global' ? `mdi-${permissionIcons.global[item.group]}` : `mdi-${permissionIcons[item.name]}` }}
                                                    </v-icon>
                                                </v-badge>
                                                <span v-if="item.name === 'global'" v-html="formatString($t(`${item.name}/${item.group}`), [item.rw.size > 0 ? `<strong>${$t(item.rw.size === 2 ? 'read_and_write' : (item.rw.has('read') ? 'read' : 'write'))}</strong>` : ''])"></span>
                                                <div v-else>
                                                    <div v-for="(list, listIndex) in item.group" :key="`item-${item.name}-${list.name}-${listIndex}`" v-html="formatString($t(`${item.name}/${list.name}`), [list.rw.size > 0 ? `<strong>${$t(list.rw.size === 2 ? 'read_and_write' : (list.rw.has('read') ? 'read' : 'write'))}</strong>` : ''])"></div>
                                                </div>
                                            </div>
                                            <div v-for="(item, index) in tab.permissions.declare" :key="`declare-${index}`" class="permisson-item">
                                                <v-icon
                                                    x-large
                                                    :color="$vuetify.theme.dark ? 'grey' : 'grey darken-1'"
                                                    class="mb-1 permission-icon"
                                                >
                                                    {{ item.name === 'global' ? `mdi-${permissionIcons.global[item.group]}` : `mdi-${permissionIcons[item.name]}` }}
                                                </v-icon>
                                                <span v-if="item.name === 'global' && item.group !== 'trackingId'" v-html="formatString($t(`${item.name}/${item.group}`), [item.rw.size > 0 ? `<strong>${$t(item.rw.size === 2 ? 'read_and_write' : (item.rw.has('read') ? 'read' : 'write'))}</strong>` : ''])"></span>
                                                <span v-else-if="item.name === 'global' && item.group === 'trackingId'"><span v-html="formatString($t(`${item.name}/${item.group}`), [`<strong>${$t('read')}</strong>`])"></span><v-tooltip top max-width="400"><template v-slot:activator="{ on, attrs }"><v-icon small :color="'grey'" class="tracking-notice" v-bind="attrs" v-on="on">mdi-information-outline</v-icon></template><span>{{ $t('tracking_note') }}</span></v-tooltip>{{ $t('tracking_id') }}</span>
                                                <div v-else>
                                                    <div v-for="(list, listIndex) in item.group" :key="`item-${item.name}-${list.name}-${listIndex}`" v-html="formatString($t(`${item.name}/${list.name}`), [list.rw.size > 0 ? `<strong>${$t(list.rw.size === 2 ? 'read_and_write' : (list.rw.has('read') ? 'read' : 'write'))}</strong>` : ''])"></div>
                                                </div>
                                            </div>
                                        </div>
                                        <p class="text--disabled permission-notice px-3" v-html="$t('permission_notice')"></p>
                                    </div>
                                    <div v-else class="full-width">
                                        <h4 class="text-subtitle-1 permission-title px-3 mt-3">{{ $t('scopes') }}<span class="num-badge" v-show="tab.scope.length > 1">{{ tab.scope.length }}</span></h4>
                                        <div class="px-3 pt-2">
                                            <p class="text-body-2 pr-3 text--secondary mb-2" v-for="(scope, index) in tab.scope" :key="`scope-${index}`">
                                                <v-icon
                                                    small
                                                    color="grey"
                                                    class="mr-2"
                                                >
                                                    mdi-earth
                                                </v-icon>{{ scope.replace(/^https:\/\//, '').replace(/^http:\/\//, '') }}
                                            </p>
                                        </div>
                                        <p class="text--disabled permission-notice px-3 mt-3" v-html="$t('scope_notice')"></p>
                                    </div>
                                    <div class="full-width px-3 mb-2 plugin-links mt-1" v-if="tab.pluginHomepage !=='' || tab.privacyPolicy !== ''">
                                        <span class="mr-2" v-if="tab.pluginHomepage !==''"><a :href="tab.pluginHomepage" target="_blank" rel="noopener nofollow">{{ $t('home_page') }}</a><a :href="tab.pluginHomepage" target="_blank" rel="noopener nofollow" class="no-underline-link"><v-icon x-small color="primary">mdi-open-in-new</v-icon></a></span>
                                        <span class="text--disabled mr-2" v-if="tab.pluginHomepage !=='' && tab.privacyPolicy !== ''">|</span>
                                        <span class="mr-2" v-if="tab.privacyPolicy !==''"><a :href="tab.privacyPolicy" target="_blank" rel="noopener nofollow">{{ $t('privacy_policy') }}</a><a :href="tab.privacyPolicy" target="_blank" rel="noopener nofollow" class="no-underline-link"><v-icon x-small color="primary">mdi-open-in-new</v-icon></a></span>
                                    </div>
                                </div>
                                <div v-if="tab.state === 'loading'" class="pa-5 detail-screen">
                                    <v-skeleton-loader
                                        class="mx-auto"
                                        type="paragraph"
                                    ></v-skeleton-loader>
                                </div>
                                <div v-if="tab.state === 'broken'" class="detail-screen d-flex justify-start">
                                    <div class="d-flex flex-row justify-start plugin-detail align-start mt-4">
                                        <v-badge
                                            avatar
                                            bordered
                                            color="primary"
                                            icon="mdi-star-four-points"
                                            overlap
                                            bottom
                                            offset-x="22"
                                            offset-y="22"
                                            v-if="tab.verified"
                                            class="mr-5 mt-1"
                                        >
                                            <v-avatar :color="$vuetify.theme.dark ? 'grey darken-1' : 'grey lighten-2'" :size="80">
                                                <v-img :src="`/plugins/plugins/${tab.id}/avatar.jpg`"></v-img>
                                            </v-avatar>
                                        </v-badge>
                                        <v-avatar v-else :color="$vuetify.theme.dark ? 'grey darken-1' : 'grey lighten-2'" :size="80" class="mr-5 mt-1">
                                            <v-img :src="`/plugins/plugins/${tab.id}/avatar.jpg`"></v-img>
                                        </v-avatar>
                                        <div class="d-flex flex-column align-start">
                                            <h3 class="text-h5">{{ tab.name }}</h3>
                                            <p class="text--secondary">{{ tab.description }}</p>
                                        </div>
                                    </div>
                                    <v-alert
                                        text
                                        color="error"
                                        icon="mdi-puzzle-remove-outline"
                                        class="mt-5"
                                    >
                                        {{ $t('plugin_broken') }}
                                    </v-alert>
                                </div>
                            </v-card>
                        </v-tab-item>
                    </v-tabs-items>
                </div>
            </v-slide-x-reverse-transition>
        </div>
    </v-card>
</template>

<script>
import { mapState } from 'vuex';
import { vsprintf } from 'sprintf-js';

import scroll from '@/mixins/scroll';

import betterFetch from '@/tools/betterFetch';

export default {
    name: 'plugins',
    props: {
        searchid: Number,
    },
    mixins: [scroll],
    data() {
        return {
            init: false,
            loading: false,
            expanded: false,
            plugins: [],
            installedPlugins: [],
            shownTabs: false,
            tabs: [],
            tab: 0,
            permissions: {
                danger: {
                    global: [
                        'account:read',
                        'backend:read',
                        'account:write',
                        'backend:write',
                    ],
                    attendance: [
                        'absentList:read',
                    ],
                    inbox: [
                        'list:read',
                        'mailContent:read',
                    ],
                    gradeSummary: [
                        'list:read',
                    ],
                },
                silent: {
                    global: [
                        'language:read',
                        'theme:read',
                        'widgets:read',
                    ],
                },
                declare: {
                    global: [
                        'notification:write',
                        'trackingId:read',
                    ],
                    clock: [
                        'timezone:read',
                        'timezone:write',
                    ],
                    todo: [
                        'list:read',
                        'list:write',
                    ],
                    quickLink: [
                        'custom:read',
                        'custom:write',
                    ],
                    course: [
                        'list:read',
                        'list:write',
                    ],
                    calendar: [
                        'events:read',
                        'events:write',
                        'view:read',
                        'view:write',
                    ],
                    coursework: [
                        'list:read',
                        'list:write',
                    ],
                    quickNote: [
                        'list:read',
                        'list:write',
                        'noteContent:read',
                        'noteContent:write',
                        'view:read',
                        'view:write',
                    ],
                    inbox: [
                        'view:read',
                        'view:write',
                    ],
                    plugin: [
                        'runningPlugins:read',
                    ],
                },
            },
            permissionIcons: {
                global: {
                    account: 'clipboard-account',
                    backend: 'server-network',
                    notification: 'bell-outline',
                    background: 'flip-to-back',
                    trackingId: 'shield-account-outline',
                },
                clock: 'map-clock-outline',
                todo: 'format-list-checks',
                quickLink: 'link-variant',
                course: 'book-multiple-outline',
                attendance: 'order-bool-ascending-variant',
                calendar: 'calendar-month-outline',
                coursework: 'book-open-page-variant-outline',
                quickNote: 'file-document-edit-outline',
                inbox: 'email-multiple-outline',
                gradeSummary: 'clipboard-list-outline',
                plugin: 'puzzle-outline',
            },
            timer: null,
            widthChecker: null,
        };
    },
    methods: {
        /**
         * Toggle widget width
         */
        toggleExpanded() {
            this.expanded = !this.expanded;
            this.$emit('toggle-expanded', {
                expanded: this.expanded,
                isResize: false,
            });
            localStorage.setItem('plugin_expanded', this.expanded);
            if (this.expanded && this.tabs.length > 0) {
                this.shownTabs = true;
            }
        },
        /**
         * Update plugin list
         */
        async updateList(tryCount = 1) {
            this.loading = true;
            let requestFailed = false;
            // Send request
            const response = await betterFetch('/plugins/plugins.json').catch(() => {
                if (tryCount < 2) {
                    // Retry
                    setTimeout(() => {
                        this.updateList(tryCount + 1);
                    }, 8000);
                } else {
                    // Network error
                    this.loading = false;
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

            if (Object.prototype.toString.call(response) !== '[object Object]' || !response.plugins) {
                this.$store.commit('addError', {
                    title: this.$t('plugin_load_error'),
                    content: this.$t('plugin_load_error_body'),
                    type: 'error',
                });
                this.loading = false;
                return;
            }

            // Update data
            this.loading = false;
            this.init = true;
            this.plugins = response.plugins.sort((a, b) => (a.name < b.name ? -1 : 1));
        },
        /**
         * Load plugin info
         * @param {string} pluginId plugin ID
         */
        async loadPluginInfo(pluginId) {
            let requestFailed = false;
            // Send request
            const response = await betterFetch(`/plugins/plugins/${pluginId}/uoma.json`).catch(() => {
                // Network error
                this.loading = false;
                this.$store.commit('addError', {
                    title: this.$t('network_error'),
                    content: this.$t('network_error_body'),
                    type: 'warning',
                });
                requestFailed = true;
            });

            if (requestFailed) {
                return;
            }

            if (Object.prototype.toString.call(response) !== '[object Object]') {
                this.$store.commit('addError', {
                    title: this.$t('plugin_load_error'),
                    content: this.$t('plugin_load_error_body'),
                    type: 'error',
                });
                this.loading = false;
                return;
            }

            // Update data
            for (let i = 0; i < this.tabs.length; i += 1) {
                if (this.tabs[i].id === pluginId) {
                    // Check if the plugin profile is valid
                    const checkResult = this.checkProfile(response);
                    this.tabs[i].version = response.version;
                    this.tabs[i].author = response.author;
                    this.tabs[i].authorUrl = response.author_url;
                    this.tabs[i].type = response.type;
                    if (response.type === 'local') {
                        this.tabs[i].dist = response.dist;
                        this.tabs[i].foreground = response.foreground;
                        this.tabs[i].background = response.background;
                        this.tabs[i].rawPermissions = response.permissions;
                    } else {
                        this.tabs[i].entry = response.entry;
                        this.tabs[i].scope = response.scope;
                    }
                    this.tabs[i].permissions = checkResult;
                    this.tabs[i].privacyPolicy = response.privacy_policy;
                    this.tabs[i].pluginHomepage = response.plugin_homepage;
                    this.tabs[i].state = checkResult === false ? 'broken' : 'unconfirmed';
                    return;
                }
            }
        },
        /**
         * Check if the plugin profile is valid
         * @param {Object} pluginProfile plugin profile object
         * @returns {boolean|Object} false on fail or parsed permission object
         */
        checkProfile(pluginProfile) {
            if (pluginProfile.author === undefined || typeof pluginProfile.author !== 'string') {
                return false;
            }
            if (pluginProfile.author_url === undefined || typeof pluginProfile.author_url !== 'string' || (pluginProfile.author_url !== '' && !this.isUrl(pluginProfile.author_url))) {
                return false;
            }
            if (pluginProfile.privacy_policy === undefined || typeof pluginProfile.privacy_policy !== 'string' || (pluginProfile.privacy_policy !== '' && !this.isUrl(pluginProfile.privacy_policy))) {
                return false;
            }
            if (pluginProfile.plugin_homepage === undefined || typeof pluginProfile.plugin_homepage !== 'string' || (pluginProfile.plugin_homepage !== '' && !this.isUrl(pluginProfile.plugin_homepage))) {
                return false;
            }
            if (pluginProfile.type === undefined || (pluginProfile.type !== 'local' && pluginProfile.type !== 'remote')) {
                return false;
            }

            if (pluginProfile.type === 'local') {
                // Check local plugin profile
                if (pluginProfile.version === undefined || typeof pluginProfile.version !== 'string') {
                    return false;
                }
                if (pluginProfile.dist === undefined || typeof pluginProfile.dist !== 'string' || pluginProfile.dist.length === 0 || pluginProfile.dist[0] !== '/') {
                    return false;
                }
                if (pluginProfile.foreground === undefined || typeof pluginProfile.foreground !== 'boolean') {
                    return false;
                }
                if (pluginProfile.background === undefined || !Array.isArray(pluginProfile.background)) {
                    return false;
                }
                if (pluginProfile.permissions === undefined || !Array.isArray(pluginProfile.permissions)) {
                    return false;
                }
                for (const item of pluginProfile.background) {
                    if (typeof item !== 'string') {
                        return false;
                    }
                }
                // Parse permission list and return the result
                return this.getGroupedPermissions(pluginProfile.permissions, pluginProfile.background.length > 0);
            }
            if (pluginProfile.entry === undefined || !this.isUrl(pluginProfile.entry)) {
                return false;
            }
            if (pluginProfile.scope === undefined || !Array.isArray(pluginProfile.scope)) {
                return false;
            }
            let foundFlag = false;
            for (const item of pluginProfile.scope) {
                if (!this.isUrl(item)) {
                    return false;
                }
                // The entry should be contained in at least one scope
                const scope = item[item.length - 1] === '/' ? item : `${item}/`;
                if (!(pluginProfile.entry !== item && pluginProfile.entry !== scope && pluginProfile.entry.indexOf(scope) !== 0)) {
                    foundFlag = true;
                }
            }
            if (!foundFlag) {
                return false;
            }
            // Remote pligin, just no more permissions
            return {
                danger: [],
                silent: [],
                declare: [],
            };
        },
        /**
         * Parse and group permissions
         * @param {Array} rawPermissions raw permission list
         * @param {boolean} background whether this plugin has any background scripts
         * @returns {boolean|Object} false on fail or parsed permission object
         */
        getGroupedPermissions(rawPermissions, background) {
            // Sort permission list so the result will be the same regardless of the original order
            const permissions = rawPermissions.sort();
            const group = {
                danger: [],
                silent: [],
                declare: [],
            };
            for (const item of permissions) {
                // Check permission strings
                if (typeof item !== 'string') {
                    return false;
                }
                const splitedItem = item.split('/');
                if (splitedItem.length !== 2) {
                    return false;
                }

                // Check whether the permission exists
                let foundFlag = false;
                for (const target of ['danger', 'silent', 'declare']) {
                    if (!foundFlag && this.permissions[target][splitedItem[0]]) {
                        for (const permission of this.permissions[target][splitedItem[0]]) {
                            if (permission === splitedItem[1]) {
                                // Found a permission class
                                const permissionName = splitedItem[1].split(':');
                                if (splitedItem[0] !== 'global') {
                                    // Not global, all permissions in the same class will be grouped
                                    let hasGroupFlag = false;
                                    for (let i = 0; i < group[target].length; i += 1) {
                                        if (group[target][i].name === splitedItem[0]) {
                                            // Found a existing group, looking for the target permission
                                            hasGroupFlag = true;
                                            let hasFlag = false;
                                            for (let j = 0; j < group[target][i].group.length; j += 1) {
                                                // Found the target permission, update it
                                                if (group[target][i].group[j].name === permissionName[0]) {
                                                    group[target][i].group[j].rw.add(permissionName[1]);
                                                    hasFlag = true;
                                                    break;
                                                }
                                            }
                                            if (!hasFlag) {
                                                // Target permission not found, create a new one
                                                group[target][i].group.push({
                                                    name: permissionName[0],
                                                    rw: (new Set()).add(permissionName[1]), // We use set here because its elements may only occur once
                                                });
                                            }
                                        }
                                    }
                                    if (!hasGroupFlag) {
                                        // No group found, create a new one
                                        group[target].push({
                                            name: splitedItem[0],
                                            group: [
                                                {
                                                    name: permissionName[0],
                                                    rw: (new Set()).add(permissionName[1]),
                                                },
                                            ],
                                        });
                                    }
                                } else {
                                    // Global, all permissions in global are independent
                                    let hasFlag = false;
                                    for (let i = 0; i < group[target].length; i += 1) {
                                        if (group[target][i].name === 'global' && group[target][i].group === permissionName[0]) {
                                            // Found the target permission, update it
                                            hasFlag = true;
                                            group[target][i].rw.add(permissionName[1]);
                                            break;
                                        }
                                    }
                                    if (!hasFlag) {
                                        // Target permission not found, create a new one
                                        group[target].push({
                                            name: splitedItem[0],
                                            group: permissionName[0],
                                            rw: (new Set()).add(permissionName[1]),
                                        });
                                    }
                                }
                                // Now we sure this permission is valid
                                foundFlag = true;
                                break;
                            }
                        }
                    }
                }
                if (!foundFlag) {
                    // Found a invalid permission, exit
                    return false;
                }
            }
            // If there is any background script, ask for background permission
            if (background) {
                group.declare.push({
                    name: 'global',
                    group: 'background',
                    rw: new Set(),
                });
            }
            return group;
        },
        /**
         *  Open a plugin based on plugin index
         * @param {number} index plugin index
         */
        openPlugin(index) {
            // If already opened, just display it
            for (const tab of this.tabs) {
                if (tab.id === this.plugins[index].id) {
                    this.tab = this.tabs.indexOf(tab);
                    this.shownTabs = true;
                    return;
                }
            }
            // If installed, just use known info
            for (const plugin of this.installedPlugins) {
                if (plugin.id === this.plugins[index].id) {
                    this.tabs.push({
                        name: plugin.name,
                        id: plugin.id,
                        version: plugin.version,
                        description: plugin.description,
                        author: plugin.author,
                        authorUrl: plugin.author_url,
                        verified: plugin.verified,
                        verifiedMessage: plugin.verified_message,
                        type: plugin.type,
                        dist: plugin.dist,
                        foreground: plugin.foreground,
                        background: plugin.background,
                        rawPermissions: plugin.rawPermissions,
                        permissions: plugin.permissions,
                        privacyPolicy: plugin.privacyPolicy,
                        pluginHomepage: plugin.pluginHomepage,
                        entry: plugin.entry,
                        scope: plugin.scope,
                        state: 'confirmed',
                    });
                    this.$nextTick(() => {
                        this.tab = this.tabs.length - 1;
                    });
                    this.shownTabs = true;
                    return;
                }
            }
            // New plugin, show loading and load plugin profile
            this.tabs.push({
                name: this.plugins[index].name,
                id: this.plugins[index].id,
                version: '',
                description: this.plugins[index].description,
                author: '',
                authorUrl: '',
                verified: this.plugins[index].verified,
                verifiedMessage: this.plugins[index].verified_message,
                type: '',
                dist: '',
                foreground: false,
                background: [],
                rawPermissions: [],
                permissions: [],
                privacyPolicy: '',
                pluginHomepage: '',
                entry: '',
                scope: [],
                state: 'loading',
            });
            this.$nextTick(() => {
                this.tab = this.tabs.length - 1;
            });
            this.shownTabs = true;
            this.loadPluginInfo(this.plugins[index].id);
        },
        /**
         *  CLose a tab based on index
         * @param {number} index tab index
         */
        closeTab(index) {
            const currentTab = this.tab;

            // Close tab
            this.tabs.splice(index, 1);
            // If there is no tab anymore, hide tab layer
            if (this.tabs.length === 0) {
                this.shownTabs = false;
            }

            // Update new selected tab index
            this.$nextTick(() => {
                this.$nextTick(() => {
                    if (this.shownTabs) {
                        if (currentTab === index) {
                            this.tab = Math.max(0, index - 1);
                        } else if (currentTab > index) {
                            this.tab = currentTab - 1;
                        }
                    }
                });
            });
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
         * Count grouped permission number
         * @param {Object} permission parsed permission object
         * @returns {number} permission count
         */
        getPermissionNum(permission) {
            let result = permission.danger.length + permission.declare.length;
            for (const item of permission.danger.concat(permission.declare)) {
                if (Array.isArray(item.group) && item.group.length > 1) {
                    result += item.group.length - 1;
                }
            }
            return result;
        },
        /**
         * Check whether the given string is a valid URL
         * @param {string} url the url to be checked
         * @returns {boolean} whether the given string is a valid URL
         */
        isUrl(url) {
            if (typeof url !== 'string') {
                return false;
            }
            return /^(https?):\/\/[\w-]+(\.[\w-]+)+([\w.,@?^=%&:/~+#-]*[\w@?^=%&/~+#-])?$/.test(url);
        },
    },
    watch: {
        locale() {
            this.$i18n.locale = this.locale;
        },
    },
    computed: {
        ...mapState({
            locale: (state) => state.locale,
            packery: (state) => state.packery,
        }),
    },
    mounted() {
        this.$i18n.locale = localStorage.getItem('language') || 'en';

        // Initialize widget width
        this.expanded = (localStorage.getItem('plugin_expanded') || 'false') === 'true';

        // Update plugin list every day
        this.timer = setInterval(() => {
            this.updateList();
        }, 86400000);

        this.updateList();

        this.widthChecker = (e) => {
            if (e.currentTarget.innerWidth <= 670) {
                this.expanded = false;
                this.$emit('toggle-expanded', {
                    expanded: this.expanded,
                    isResize: true,
                });
                localStorage.setItem('plugin_expanded', this.expanded);
            }
        };

        window.addEventListener('resize', this.widthChecker);
    },
    beforeDestroy() {
        clearInterval(this.timer);
        window.removeEventListener('resize', this.widthChecker);
    },
};
</script>

<style lang="less">
.plugin-container {
    position: relative;
    padding-left: 0;
    padding-right: 0;
    overflow: hidden;
    contain: strict;
    h2 {
        font-size: 18px;
        font-weight: normal;
        opacity: 0.87;
        padding-top: 16px;
        padding-bottom: 15px;
        padding-left: 20px;
        position: relative;
        z-index: 2;
        transition: all .2s;
        span.h2-title {
            vertical-align: text-top;
        }
        &.shadow {
            box-shadow: 0px 2px 4px -1px rgba(0, 0, 0, 10%), 0px 4px 5px 0px rgba(0, 0, 0, 7%), 0px 1px 10px 0px rgba(0, 0, 0, 6%)!important;
        }
    }
    .scroll {
        height: 420px;
        overflow: auto;
        width: 100%;
        position: relative;
        z-index: 1;
    }
    .plugin-panel {
        display: none;
    }
    .v-list--three-line .v-list-item {
        min-height: 73px;
    }
    .list {
        padding-top: 0;
        .v-list-item__action {
            margin: 7.5px 16px 7.5px 0;
        }
        .v-list-item {
            background-color: transparent;
            transition: background-color .2s;
            .v-list-item__avatar {
                margin-bottom: 8px;
                margin-top: 12px;
                margin-left: 0;
            }
            .v-badge .v-list-item__avatar {
                margin-top: 7px;
            }
            .v-list-item__content {
                align-self: center;
                padding: 0;
            }
            &:hover, &:focus {
                background-color: rgba(0, 0, 0, .04);
            }
        }
    }
    .plugin-tabs {
        position: absolute;
        left: 0;
        top: 0;
        height: 100%;
        width: 100%;
        background: white;
        z-index: 4;
        h2 {
            padding-left: 14px;
            padding-bottom: 8px;
            background-color: #F4F4F4;
        }
        .v-tab {
            font-size: 9px;
            padding: 0 8px;
            .info-icon {
                margin-left: -3px;
                margin-right: 5px;
            }
            .v-btn--icon.v-size--x-small {
                margin-right: -5px;
                i {
                    font-size: 12px;
                }
            }
        }
        .v-tabs-bar {
            height: 32px;
            background-color: #F5F5F5;
        }
        .v-slide-group__prev, .v-slide-group__next {
            min-width: 30px;
            flex: 0 1 30px;
            i {
                font-size: 20px;
            }
        }
        .detail-screen {
            width: 100%;
            height: 395px;
            justify-content: center;
            align-items: center;
            flex-direction: column;
            padding: 10px;
            overflow-x: hidden;
            overflow-y: auto;
            .full-width{
                width: 100%;
            }
            a.no-underline-link {
                text-decoration: none;
                padding-left: 2px;
            }
            .plugin-detail {
                width: calc(100% - 20px);
                .text-h5 {
                    font-size: 1.4rem!important;
                    line-height: 25px;
                    padding-bottom: 6px;
                }
                p {
                    font-size: 14px;
                    line-height: 16px;
                    margin-bottom: 12px;
                }
                .verified i {
                    vertical-align: text-top;
                }
                .plugin-meta {
                    font-size: 12px;
                    i {
                        margin-left: -2px;
                        vertical-align: text-bottom;
                        transform: translateY(1.5px);
                        &.mr-2 {
                            margin-right: 6px!important;
                        }
                    }
                }
            }
            .v-alert {
                width: calc(100% - 24px);
                margin-left: 12px;
                margin-right: 12px;
            }
            .run-btns {
                width: 100%;
                .run-btn {
                    width: calc(50% - 6px);
                    margin-left: 6px;
                    &:first-of-type {
                        margin-right: 6px;
                        margin-left: 0;
                    }
                }
            }
            .allow-notice {
                font-size: 12px;
                text-align: center;
            }
            .permission-title {
                width: 100%;
                padding-bottom: 0;
            }
            .permisson-list {
                width: calc(100% + 14px);
                display: flex;
                align-items: flex-start;
                flex-wrap: wrap;
                margin-left: -14px;
                .text-body-2 {
                    margin-left: 14px;
                }
                .permisson-item {
                    width: calc(50% - 14px);
                    display: flex;
                    justify-content: center;
                    align-items: flex-start;
                    flex-direction: column;
                    margin-bottom: 18px;
                    font-size: 14px;
                    margin-left: 14px;
                    .v-badge__badge {
                        font-weight: bold;
                    }
                    .permission-icon {
                        font-size: 45px!important;
                    }
                    .tracking-notice {
                        margin: 0 3px;
                        vertical-align: text-bottom;
                    }
                }
            }
            .permission-notice {
                font-size: 12px;
                width: 100%;
                margin-top: -8px;
                margin-bottom: 8px;
            }
            .plugin-links {
                font-size: 12px;
            }
        }
    }
    .plugin-outer {
        width: 100%;
        height: 480px;
    }
    .empty {
        width: 100%;
        height: 420px;
        display: flex;
        justify-content: center;
        align-items: center;
        opacity: .5;
        font-size: 15px;
    }
    .num-badge {
        display: inline-block;
        padding: 1.5px 8px 0 8px;
        min-width: 23px;
        border-radius: 10px;
        background-color: #EEEEEE;
        font-size: 14px;
        margin-left: 6px;
        line-height: 18px;
        vertical-align: text-top;
    }
    &.expanded {
        background-color: #F8F8F8;
        .scroll {
            width: 280px;
            .list {
                background-color: #F8F8F8;
            }
        }
        .plugin-panel {
            width: calc(100% - 280px);
            height: 100%;
            display: block;
            top: 0;
            left: 280px;
            position: absolute;
            z-index: 2;
            background: white;
            & > div {
                position: absolute;
                top: 0;
                left: 0;
                pointer-events: none;
                width: 100%;
                height: 100%;
                display: flex;
                justify-content: center;
                align-items: center;
            }
        }
        .plugin-tabs {
            width: calc(100% - 280px);
            left: 280px;
            z-index: 3;
            .handle {
                background-color: #EEEEEE;
                padding-bottom: 3px;
                .return-btn, .h2-title {
                    visibility: hidden;
                }
            }
            .v-tabs-bar {
                background-color: #F0F0F0;
            }
            .detail-screen {
                height: 400px;
                .permisson-list {
                    width: calc(100% + 14px);
                    margin-left: -14px;
                    .permisson-item {
                        width: calc(33.3% - 14px);
                        margin-left: 14px;
                    }
                }
            }
        }
    }
}
.plugin-info-card {
    justify-content: center;
    align-items: center;
    flex-direction: column;
    padding: 15px 10px;
    overflow-x: hidden;
    overflow-y: auto;
    width: 380px;
    .plugin-detail {
        width: calc(100% - 20px);
        .text-h5 {
            font-size: 1.4rem!important;
            line-height: 25px;
            padding-bottom: 6px;
        }
        p {
            font-size: 14px;
            line-height: 16px;
            margin-bottom: 12px;
        }
        .verified i {
            vertical-align: text-top;
        }
        .plugin-meta {
            font-size: 12px;
            i {
                margin-left: -2px;
                vertical-align: text-bottom;
                transform: translateY(1.5px);
                &.mr-2 {
                    margin-right: 6px!important;
                }
            }
        }
    }
}
@media (max-width: 670px) {
    .plugin-expand-btn {
        visibility: hidden;
    }
}
#app.theme--dark .plugin-container {
    .v-list-item {
        .v-badge .v-badge__wrapper i {
            color: rgba(0, 0, 0, .8);
        }
        &:hover, &:focus {
            background-color: rgba(255, 255, 255, .04);
        }
    }
    .num-badge {
        background-color: #3E3E3E;
    }
    .plugin-tabs {
        background: #1E1E1E;
        h2 {
            background-color: #262626;
        }
        .v-tabs-bar {
            height: 32px;
            background-color: #252525;
        }
        .detail-screen {
            .v-badge .v-badge__wrapper i {
                color: rgba(0, 0, 0, .8);
            }
        }
    }
    &.expanded {
        background-color: #272727;
        .scroll {
            .list {
                background-color: #272727;
            }
        }
        .plugin-panel {
            background: #1E1E1E;
        }
        .plugin-tabs {
            .handle {
                background-color: #2E2E2E;
            }
            .v-tabs-bar {
                background-color: #2C2C2C;
            }
        }
    }
}
</style>

<i18n>
{
    "en": {
        "plugins": "Plug-ins",
        "running-plugins": "Opened Plug-ins",
        "nothing": "No plug-in available",
        "network_error": "Network Error",
        "network_error_body": "Cannot update plug-in list",
        "plugin_load_error": "Plug-in List Load Error",
        "plugin_load_error_body": "Cannot load plug-in list, please contact the frontend admin",
        "expand": "Expand",
        "collapse": "Collapse",
        "return": "Return",
        "close": "Close",
        "allow_run": "Run & Remember",
        "run_once": "Run Once",
        "allow_notice": "You haven't allowed this plugin to run. Please check the permissions declared before authorising this plugin to run.",
        "allow_notice_cloud": "You haven't allowed this plugin to run. Plug-ins on cloud cannot read your data and doesn't require any permission.",
        "declared_permission": "Declared Permissions",
        "permission_notice": "The permissions declared <strong>CANNOT</strong> limit the scope of data accessible for the plugin, the list is for reference only. Please ensure that you trust the plugin before running it.",
        "global/account": "%s your UoM account info",
        "global/backend": "%s your backend login info",
        "global/notification": "Send notifications",
        "global/background": "Running in background",
        "global/trackingId": "%s your",
        "clock/timezone": "%s clock widget timezone",
        "todo/list": "%s your TO-DO list",
        "quickLink/custom": "%s your custom links",
        "course/list": "%s your course list",
        "attendance/absentList": "%s your absent record",
        "calendar/events": "%s your course events",
        "calendar/view": "%s the view of the calendar",
        "coursework/list": "%s your coursework list",
        "quickNote/list": "%s your quick note list",
        "quickNote/noteContent": "%sthe content of a quick note",
        "quickNote/view": "%s the UI of quick note widget",
        "inbox/list": "%s your inbox mail list",
        "inbox/mailContent": "%s the content of a mail",
        "inbox/view": "%s the UI of inbox widget",
        "inbox/gradeSummary/list": "%s your grades",
        "plugin/runningPlugins": "%s the list of running plugins",
        "tracking_id": "tracking ID",
        "read": "Read",
        "write": "Modify",
        "read_and_write": "Read and modify",
        "sensitive_permission": "Sensitive permission",
        "cloud_plugin": "On Cloud",
        "no_permission": "No permission declared",
        "scopes": "Websites May Visit",
        "home_page": "Plugin-in Home Page",
        "privacy_policy": "Plug-in Privacy Policy",
        "plugin_broken": "Unable to load plug-in, because the plug-in's profile is broken.",
        "tracking_note": "Corresponds to your UoM account but does not contain any sensitive information",
        "scope_notice": "This plug-in cannot access any website outside of this list.",
        "plugin_info": "Plug-in Info",
        "nothing_opened": "No plug-in opened"
    },
    "zh": {
        "plugins": "插件",
        "running-plugins": "打开的插件",
        "nothing": "无可用插件",
        "network_error": "网络错误",
        "network_error_body": "无法从获取插件列表。",
        "plugin_load_error": "插件列表加载错误",
        "plugin_load_error_body": "无法加载插件列表，请联系前端管理员",
        "expand": "展开",
        "collapse": "收缩",
        "return": "返回",
        "close": "关闭",
        "allow_run": "总是允许运行",
        "run_once": "运行一次",
        "allow_notice": "你尚未允许此插件运行。在授权允许插件运行之前，请务必检查此插件声明的权限。",
        "allow_notice_cloud": "你尚未允许此插件运行。云端插件无法读取你的数据，因此不需要任何权限。",
        "declared_permission": "声明的权限",
        "permission_notice": "插件声明的权限<strong>不能</strong>限制插件读取数据的范围，权限列表仅供参考。在运行插件之前，请确保你信任此插件。",
        "global/account": "%s你的曼大账户信息",
        "global/backend": "%s你的后端信息",
        "global/notification": "向你发送通知",
        "global/background": "在后台运行",
        "global/trackingId": "%s你的",
        "clock/timezone": "%s时钟组件的时区",
        "todo/list": "%s你的 TO-DO 列表",
        "quickLink/custom": "%s你的自定义链接",
        "course/list": "%s你的课程列表",
        "attendance/absentList": "%s你的缺勤记录",
        "calendar/events": "%s你的课程事件",
        "calendar/view": "%s日历组件的视图",
        "coursework/list": "%s你的作业列表",
        "quickNote/list": "%s你的快速笔记列表",
        "quickNote/noteContent": "%s某一篇快速笔记的内容",
        "quickNote/view": "%s快速笔记组件的界面",
        "inbox/list": "%s你的邮件列表",
        "inbox/mailContent": "%s某一封邮件的内容",
        "inbox/view": "%s收件箱组件的界面",
        "inbox/gradeSummary/list": "%s你的成绩信息",
        "plugin/runningPlugins": "%s正在运行的插件列表",
        "tracking_id": "身份追踪标识",
        "read": "读取",
        "write": "修改",
        "read_and_write": "读取并修改",
        "sensitive_permission": "敏感权限",
        "cloud_plugin": "云端插件",
        "no_permission": "此插件没有声明任何权限",
        "scopes": "可能访问的网站",
        "home_page": "插件主页",
        "privacy_policy": "插件隐私政策",
        "plugin_broken": "无法载入插件，因为此插件的配置文件已损坏。",
        "tracking_note": "与曼大账户对应，但不包含任何敏感信息",
        "scope_notice": "插件无法访问此列表以外的任何网站。",
        "plugin_info": "插件信息",
        "nothing_opened": "没有打开的插件"
    },
    "es": {
        "plugins": "Complementos",
        "running-plugins": "Complementos habilitados",
        "nothing": "No complementos disponibles",
        "network_error": "Error de red",
        "network_error_body": "No ha sido posible actualizar la lista de complementos",
        "plugin_load_error": "Error al cargar complementos",
        "plugin_load_error_body": "No ha sido posible cargar la lista de complementos, por favor contacte con el administrador de front-end",
        "expand": "Expandir",
        "collapse": "Colapsar",
        "return": "Volver",
        "close": "Cerrar",
        "allow_run": "Siempre admitir",
        "run_once": "Admitir esta vez",
        "allow_notice": "No ha permitido que se ejecute este complemento. Verifique los permisos declarados antes de autorizar la ejecución de este complemento.",
        "allow_notice_cloud": "No ha permitido que se ejecute este complemento. Los complementos en la nube no pueden leer sus datos y no requieren ningún permiso.",
        "declared_permission": "Permisiones declaradas",
        "permission_notice": "Los permisos declarados <strong>NO PUEDEN</strong> limitar la accesibilidad de los datos del complemento, la lista es solo de referencia. Asegúrese de confiar en el complemento antes de ejecutarlo.",
        "global/account": "{0} su cuenta de UoM",
        "global/backend": "{0} su información de inicio de sesión",
        "global/notification": "Enviar notificaciones",
        "global/background": "Ejecutar en el fondo",
        "global/trackingId": "{0} tu",
        "clock/timezone": "{0} zona horaria del widget en el reloj",
        "todo/list": "{0} su lista PARA-HACER",
        "quickLink/custom": "{0} sus enlaces personalizadas",
        "course/list": "{0} su lista de asignaturas",
        "attendance/absentList": "{0} su lista de ausencias",
        "calendar/events": "{0} sus eventos de asignatura",
        "calendar/view": "{0} vista del calendario",
        "coursework/list": "{0} su lista de trabajos de curso",
        "quickNote/list": "{0} su lista de apuntes rápidos",
        "quickNote/noteContent": "{0} contenido de un apunte rápido",
        "quickNote/view": "{0} interfaz del usuario del widget apuntes rápidos",
        "inbox/list": "{0} su bandeja de entradas",
        "inbox/mailContent": "{0} contenido de un correo",
        "inbox/view": "{0} interfaz del usuario de la bandeja de entradas",
        "inbox/gradeSummary/list": "{0} sus notas",
        "plugin/runningPlugins": "{0} complementos en ejecución",
        "tracking_id": "Rastreando id",
        "read": "Leer",
        "write": "Modificar",
        "read_and_write": "Leer y modificar",
        "sensitive_permission": "Permiso sensible",
        "cloud_plugin": "Complemento de la nube",
        "no_permission": "No permiso declarado",
        "scopes": "Webs que quizá visita",
        "home_page": "Página principal de complementos",
        "privacy_policy": "Pólitica de Privacidad de los Complementos",
        "plugin_broken": "No ha sido posible cargar el complemento porque el archivo de perfil del complemento está dañado.",
        "tracking_note": "Corresponde a su cuenta de UoM pero no contiene ninguna información sensible.",
        "scope_notice": "Este complemento no visitará ninguna web fuera de la lista señalada.",
        "plugin_info": "Información del complemento",
        "nothing_opened": "No complementos en ejecución"
    }
}
</i18n>
