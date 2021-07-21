<template>
    <v-app>
        <v-app-bar class="elevation-0" color="lighten-4">
            <v-app-bar-nav-icon @click="drawer = true"></v-app-bar-nav-icon>
            <v-toolbar-title class="not-selectable" @click="$route.path === '/' ? null : $router.push('/')" :class="{ pointer: $route.path !== '/' }">{{ $t('title') }}</v-toolbar-title>
            <v-spacer></v-spacer>
            <v-menu
                offset-y
                bottom
                left
                transition="slide-y-transition"
                nudge-bottom="5"
                v-show="$route.path === '/'"
                :close-on-content-click="false"
            >
                <template v-slot:activator="{ on, attrs }">
                   <v-btn
                        icon
                        v-bind="attrs"
                        v-on="on"
                        v-show="$route.path === '/'"
                    >
                        <v-icon>mdi-tune</v-icon>
                    </v-btn>
                </template>
                <v-list flat class="shown-list pt-0">
                    <v-list-item class="pt-2 pb-2 daynight" @click="toggleDark">
                        <v-list-item-icon>
                            <v-icon>{{ $vuetify.theme.dark ? 'mdi-white-balance-sunny' : 'mdi-weather-night' }}</v-icon>
                        </v-list-item-icon>
                        <v-list-item-content>
                            <v-list-item-title>{{ $vuetify.theme.dark ? $t('light_mode') : $t('dark_mode') }}</v-list-item-title>
                        </v-list-item-content>
                    </v-list-item>
                    <v-divider class="mb-2"></v-divider>
                    <v-list-item-group
                        v-model="ifWidgets"
                        multiple
                    >
                        <v-list-item v-for="(item, index) in widgets" :key="index">
                            <template v-slot:default="{ active }">
                                <v-list-item-action>
                                    <v-checkbox :input-value="active"></v-checkbox>
                                </v-list-item-action>
                                <v-list-item-content>
                                    <v-list-item-title>{{ $t(item) }}</v-list-item-title>
                                </v-list-item-content>
                            </template>
                        </v-list-item>
                    </v-list-item-group>
                </v-list>
            </v-menu>
            <v-btn
                icon
                v-show="$route.path !== '/'"
                @click="toggleDark"
            >
                <v-icon>{{ $vuetify.theme.dark ? 'mdi-weather-night' : 'mdi-white-balance-sunny' }}</v-icon>
            </v-btn>
            <v-menu
                offset-y
                bottom
                left
                transition="slide-y-transition"
                nudge-bottom="5"
            >
                <template v-slot:activator="{ on, attrs }">
                   <v-btn
                        icon
                        v-bind="attrs"
                        v-on="on"
                    >
                        <v-icon>mdi-translate</v-icon>
                    </v-btn>
                </template>
                <v-list>
                    <v-list-item v-for="language in languageList" :key="language.locale" @click="toggleLocale(language.locale)">
                        <v-list-item-title>{{ language.name }}</v-list-item-title>
                    </v-list-item>
                </v-list>
            </v-menu>
            <v-btn
                icon
                v-show="$route.path === '/'"
                @click="openSearch"
            >
                <v-icon>mdi-magnify</v-icon>
            </v-btn>
            <v-text-field
                solo
                v-model="searching"
                :label="$t('search')"
                :class="{ open: searchOpened }"
                hide-details="auto"
                prepend-inner-icon="mdi-magnify"
                append-icon="mdi-close"
                class="global-search-input"
                ref="searchInput"
                @click:append="closeSearch"
            ></v-text-field>
        </v-app-bar>
        <div id="search-result" class="elevation-3" :class="{ open: searchOpened }" v-show="searching !== '' && searching !== null && searchIndexFiltered.filter((item) => item).flat().length > 0">
            <div>
                <div class="overline mb-1 text--secondary" v-if="searchIndexFiltered[8] && searchIndexFiltered[8].length > 0">
                    {{ $t('note') }}
                </div>
                <noteSearch :notes="searchIndexFiltered[8]" v-if="searchIndexFiltered[8] && searchIndexFiltered[8].length > 0"></noteSearch>
                <div class="overline mb-1 text--secondary" v-if="searchIndexFiltered[7] && searchIndexFiltered[7].length > 0">
                    {{ $t('coursework') }}
                </div>
                <courseworkSearch :courseworks="searchIndexFiltered[7]" v-if="searchIndexFiltered[7] && searchIndexFiltered[7].length > 0"></courseworkSearch>
                <div class="overline mb-1 text--secondary" v-if="searchIndexFiltered[1] && searchIndexFiltered[1].length > 0">
                    {{ $t('todo') }}
                </div>
                <todoSearch :todos="searchIndexFiltered[1]" v-if="searchIndexFiltered[1] && searchIndexFiltered[1].length > 0"></todoSearch>
                <div class="overline mb-1 text--secondary" v-if="searchIndexFiltered[10] && searchIndexFiltered[10].length > 0">
                    {{ $t('grade') }}
                </div>
                <gradeSearch :grades="searchIndexFiltered[10]" v-if="searchIndexFiltered[10] && searchIndexFiltered[10].length > 0"></gradeSearch>
                <div class="overline mb-1 text--secondary" v-if="searchIndexFiltered[0] && searchIndexFiltered[0].length > 0">
                    {{ $t('clock') }}
                </div>
                <clockSearch v-if="searchIndexFiltered[0] && searchIndexFiltered[0].length > 0" :city="searchIndexFiltered[0][0].display" :timezone="searchIndexFiltered[0][0].code"></clockSearch>
            </div>
        </div>
        <v-navigation-drawer
            v-model="drawer"
            absolute
            temporary
        >
            <v-list-item>
                <v-list-item-content class="not-selectable">
                    <v-list-item-title class="title">
                        {{ $t('title') }}
                    </v-list-item-title>
                    <v-list-item-subtitle>
                        By Axton
                    </v-list-item-subtitle>
                </v-list-item-content>
            </v-list-item>

            <v-divider></v-divider>

            <v-list
                nav
                dense
            >
                <v-list-item-group
                    v-model="group"
                    active-class="primary--text"
                >
                <v-list-item to="/">
                    <v-list-item-icon>
                    <v-icon>mdi-view-dashboard</v-icon>
                    </v-list-item-icon>
                    <v-list-item-title>{{ $t('dashboard') }}</v-list-item-title>
                </v-list-item>
                <v-list-item to="/settings">
                    <v-list-item-icon>
                    <v-icon>mdi-cog-outline</v-icon>
                    </v-list-item-icon>
                    <v-list-item-title>{{ $t('settings') }}</v-list-item-title>
                </v-list-item>
                <v-list-item to="/about">
                    <v-list-item-icon>
                    <v-icon>mdi-information-outline</v-icon>
                    </v-list-item-icon>
                    <v-list-item-title>{{ $t('about') }}</v-list-item-title>
                </v-list-item>
                </v-list-item-group>
            </v-list>
        </v-navigation-drawer>
        <v-main>
            <v-container fluid>
                <router-view ref="view"></router-view>
            </v-container>
        </v-main>
        <v-dialog
            v-model="welcome"
            persistent
            max-width="1000"
            :content-class="welcomeMessageDialog ? 'welcome-dialog welcome-overflow' : 'welcome-dialog'"
            :no-click-animation="true"
            :fullscreen="$vuetify.breakpoint.xs"
            :transition="$vuetify.breakpoint.xs ? 'slide-y-reverse-transition' : 'dialog-transition'"
        >
            <v-card class="welcome-dialog-card" :class="$vuetify.breakpoint.xs ? 'rounded-0' : ''">
                <v-stepper
                    :value="stage"
                    class="mb-10 stepper elevation-0"
                    :class="{ shown: stage !== 0 }"
                >
                    <v-stepper-header>
                        <v-stepper-step
                            step="1"
                            :complete="stage > 1"
                        ></v-stepper-step>
                        <v-divider></v-divider>
                        <v-stepper-step
                            step="2"
                            :complete="stage > 2"
                        >
                        </v-stepper-step>
                        <v-divider></v-divider>
                        <v-stepper-step
                            step="3"
                            :complete="stage > 3"
                        ></v-stepper-step>
                    </v-stepper-header>
                </v-stepper>
                <v-card-text :class="{ 'hide-0': stage !== 0 }">
                    <img src="@/assets/img/welcome/welcome.svg" :class="{ 'small-screen': $vuetify.breakpoint.xs, animation: welcome }" alt="Welcome!">
                    <h1 class="text-h4" :class="$vuetify.breakpoint.xs ? 'mb-4' : 'mb-6'">{{ $t('welcome') }}</h1>
                    <v-select
                        v-model="locale"
                        :items="languageList"
                        :class="$vuetify.breakpoint.xs ? 'small-screen' : ''"
                        item-text="name"
                        item-value="locale"
                        prepend-inner-icon="mdi-translate"
                        class="select"
                        outlined
                        dense
                    ></v-select>
                    <p class="text-body-1" :class="$vuetify.breakpoint.xs ? 'mb-4' : 'mb-7'">{{ $t('not_yet') }}<br>{{ $t('press_to_settings') }}</p>
                    <v-btn
                        depressed
                        x-large
                        color="primary"
                        class="mb-3 main-btn"
                        @click="goToSettings"
                    >
                        {{ $t('continue') }}
                    </v-btn>
                    <div>
                        <v-btn
                            depressed
                            small
                            class="mr-1 second-btn"
                            @click="skip"
                        >
                            {{ $t('import') }}
                        </v-btn>
                        <v-btn
                            depressed
                            small
                            class="second-btn"
                            @click="skip"
                        >
                            {{ $t('skip') }}
                        </v-btn>
                    </div>
                </v-card-text>
                <v-card-text class="same-height backend" :class="{ 'show-1': stage === 1 }">
                    <div class="mt-12 settings">
                        <h1 class="mt-12 pb-12 pt-10" :class="$vuetify.breakpoint.xs ? 'text-h5' : 'text-h4'">{{ $t('connect_to') }}</h1>
                        <v-text-field
                            v-model.trim="backendURL"
                            outlined
                            validate-on-blur
                            :label="$t('backend_url')"
                            :rules="rulesUrl"
                            :disabled="needToken"
                            :error="urlError"
                            :error-messages="urlError ? (urlErrorTemp ? $t('backend_maintenance') : $t('wrong_url')) : []"
                            prefix="https://"
                            prepend-inner-icon="mdi-server"
                            class="input mt-12"
                            ref="backendUrl"
                            @keydown="urlError = false"
                            @keydown.enter="checkConnection"
                        ></v-text-field>
                        <v-text-field
                            v-model.trim="backendToken"
                            outlined
                            :label="$t('backend_token')"
                            :class="{ shown: needToken }"
                            :hint="$t('need_token')"
                            :error="tokenError"
                            :error-messages="tokenError ? $t('wrong_token') : []"
                            :type="showToken ? 'text' : 'password'"
                            :append-icon="showToken ? 'mdi-eye' : 'mdi-eye-off'"
                            prepend-inner-icon="mdi-shield-lock"
                            class="input mb-10 token-input"
                            ref="backendTk"
                            @keydown="tokenError = false"
                            @keydown.enter="checkConnection"
                            @click:append="showToken = !showToken"
                        ></v-text-field>
                    </div>
                    <v-btn
                        depressed
                        large
                        color="primary"
                        class="mb-3 main-btn mt-10"
                        @click="checkConnection"
                        :loading="loading"
                        :disabled="loading || !urlValid || !tokenValid"
                    >
                        {{ $t('next') }}
                    </v-btn>
                    <v-btn
                        depressed
                        small
                        class="second-btn"
                        @click="skip"
                    >
                        {{ $t('skip') }}
                    </v-btn>
                </v-card-text>
                <v-card-text class="same-height personal" :class="{ 'show-1': stage === 2 }">
                    <h1 class="mt-12 pb-4 pt-10" :class="$vuetify.breakpoint.xs ? 'text-h5' : 'text-h4'">{{ $t('account_settings') }}</h1>
                    <settings class="settings mt-4" ref="settingsField"></settings>
                    <v-btn
                        depressed
                        large
                        color="primary"
                        class="mb-3 main-btn mt-3"
                        @click="welcome = false"
                        :loading="loading"
                        :disabled="loading"
                    >
                        {{ $t('next') }}
                    </v-btn>
                </v-card-text>
            </v-card>
        </v-dialog>
        <v-dialog
            v-model="welcomeMessageDialog"
            max-width="400"
            persistent
        >
            <v-card>
                <v-card-title class="headline">
                    {{ $t('message_from_backend') }}
                </v-card-title>
                <v-card-text>
                    {{ welcomeMessage }}
                </v-card-text>
                <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn
                    color="primary"
                    text
                    @click="dismissWelcomeMessage"
                >
                    {{ $t('ok') }}
                </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
        <v-dialog
            v-model="updating"
            max-width="400"
            persistent
        >
            <v-card>
                <v-card-title class="headline text-center d-block">
                    {{ $t('updating') }}
                </v-card-title>
                <v-card-text>
                    <v-progress-linear
                        indeterminate
                        color="primary"
                    ></v-progress-linear>
                </v-card-text>
            </v-card>
        </v-dialog>
        <div id="alert-space" v-show="displayErrors.length > 0" :style="{ bottom: updateReady ? '135px' : '5px' }">
            <v-alert
                v-for="(item, index) in displayErrors"
                :key="item.id"
                border="left"
                elevation="6"
                dismissible
                :type="item.type"
                :icon="item.type === 'error' ? 'mdi-alert-circle-outline' : (item.type === 'warning' ? 'mdi-alert-outline' : 'mdi-check-circle-outline')"
                close-icon="mdi-close"
            >
            <template v-slot:close>
                <v-btn icon small @click="dismissError(index)">
                    <v-icon>mdi-close</v-icon>
                </v-btn>
            </template>
                <strong>{{ item.title }}</strong><br><span class="text-body-2">{{ item.content }}</span>
            </v-alert>
        </div>
        <v-snackbar
            v-model="updateReady"
            vertical
            timeout="-1"
            right
        >
            <div>
                <strong class="mb-2 d-block update-title">{{ $t('title') }} {{ updateReadyVersion }}</strong>
                {{ $t('front_end_update_ready') }}
            </div>
            <template v-slot:action="{ attrs }">
                <v-btn
                    color="grey lighten-1"
                    text
                    v-bind="attrs"
                    @click="updateReady = false"
                >
                    {{ $t('front_end_ignore') }}
                </v-btn>
                <v-btn
                    color="uomthemelight"
                    text
                    v-bind="attrs"
                    @click="updateFrontend"
                >
                    {{ $t('front_end_update') }}
                </v-btn>
            </template>
        </v-snackbar>
    </v-app>
</template>

<script>
import { mapState } from 'vuex';
import semVerCmp from 'semver-compare';
import * as JsSearch from 'js-search';

import settings from '@/components/settings.vue';
import noteSearch from '@/components/search/note.vue';
import courseworkSearch from '@/components/search/coursework.vue';
import todoSearch from '@/components/search/todo.vue';
import gradeSearch from '@/components/search/grade.vue';
import clockSearch from '@/components/search/clock.vue';

import checkBackendVersion from '@/tools/checkBackendVersion';
import betterFetch from '@/tools/betterFetch';
import formatDateTime from '@/tools/formatDateTime';
import updateStorage from '@/tools/update';
import localeList from '@/locales/localeList';
import * as version from '../public/version.json';

import '@/styles/highlight.less';

export default {
    name: 'App',
    components: {
        settings,
        noteSearch,
        courseworkSearch,
        todoSearch,
        gradeSearch,
        clockSearch,
    },
    data: () => ({
        welcome: false,
        drawer: false,
        group: 0,
        stage: 0,
        backendURL: '',
        urlError: false,
        urlErrorTemp: false,
        backendToken: '',
        showToken: false,
        needToken: false,
        tokenError: false,
        loading: false,
        welcomeMessage: '',
        welcomeMessageDialog: false,
        darkMode: false,
        locale: 'en',
        localeDetail: null,
        backend: {},
        account: {},
        searchOpened: false,
        rulesUrl: [
            (value) => !!value || '',
            (value) => /^[\w-]+(\.[\w-]+)+([\w.,@^=%:/~+-]*)?$/i.test(value) || '',
        ],
        languageList: localeList,
        ifWidgets: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
        widgets: [
            'clock',
            'todo',
            'bblinks',
            'livelinks',
            'subjects',
            'attendance',
            'calendar',
            'coursework',
            'note',
            'mail',
            'grade',
            'plugins',
        ],
        searching: '',
        searchIndexFiltered: [null, null, null, null, null, null, null, null, null, null, null, null],
        searchers: [null, null, null, null, null, null, null, null, null, null, null, null],
        timer: null,
        updateReady: false,
        updateReadyVersion: '',
        updating: false,
    }),
    methods: {
        /**
         * Set language globally
         * @param {string} language target langue
         */
        toggleLocale(language) {
            this.locale = language;
            this.localeDetail = this.languageList.find((item) => item.locale === language);
        },
        /**
         * Dismiss an error
         * @param {string} index target error index
         */
        dismissError(index) {
            this.$store.commit('removeError', index);
        },
        /**
         * Skip initial settings
         */
        skip() {
            this.welcome = false;
        },
        /**
         * Start initial settings
         */
        goToSettings() {
            this.stage = 1;
            setTimeout(() => {
                this.$refs.backendUrl.focus();
            }, 500);
        },
        /**
         * Check if the backend is ready
         */
        async checkConnection() {
            if (!this.urlValid || !this.tokenValid) {
                // Button disabled
                return;
            }
            // Reset flags
            this.tokenError = false;
            this.loading = true;

            let requestFailed = false;
            // Send request
            const response = await betterFetch(`https://${this.backendURL}${this.backendURL.substr(-1) === '/' ? '' : '/'}check_ability/`, {
                headers: new Headers({
                    'X-UOMA-TOKEN': this.backendToken ? this.backendToken : '',
                }),
            }).catch(() => {
                // Network error
                this.urlErrorTemp = false;
                this.urlError = true;
                this.loading = false;
                requestFailed = true;
            });

            if (requestFailed) {
                return;
            }

            if (Object.prototype.toString.call(response) !== '[object Object]' || !response.uomabVersion || !response.success) {
                // Not a valid UoM Assistant backend
                this.urlErrorTemp = false;
                this.urlError = true;
                this.loading = false;
                return;
            }

            if (response.maintenance || !checkBackendVersion(response.uomabVersion)) {
                // Backend maintenance
                this.urlErrorTemp = true;
                this.urlError = true;
                this.loading = false;
                return;
            }

            if (response.data.tokenRequired) {
                // Wrong Token
                if (this.needToken) {
                    this.tokenError = true;
                }

                this.needToken = true;
                setTimeout(() => {
                    this.$refs.backendTk.focus();
                }, 500);
                this.loading = false;
            } else {
                // Connected successfully
                if (response.data.welcomeMessage && response.data.welcomeMessage !== '') {
                    // Show welcome messages
                    this.welcomeMessage = response.data.welcomeMessage;
                    this.welcomeMessageDialog = true;
                    this.$refs.settingsField.setState(response.data);
                } else {
                    // Go to account settings
                    this.stage = 2;
                    this.$refs.settingsField.setState(response.data);
                    setTimeout(() => {
                        this.$refs.settingsField.focusFirst();
                    }, 500);
                    setTimeout(() => {
                        this.loading = false;
                    }, 200);
                }
            }
        },
        /**
         * Dismiss welcome message dialog and go to account settings
         */
        dismissWelcomeMessage() {
            this.welcomeMessageDialog = false;
            this.stage = 2;
            setTimeout(() => {
                this.$refs.settingsField.focusFirst();
            }, 500);
            setTimeout(() => {
                this.loading = false;
            }, 200);
        },
        /**
         * Toggle dark mode globally
         */
        toggleDark() {
            this.$vuetify.theme.dark = !this.$vuetify.theme.dark;
            this.$store.commit('setDarkMode', this.$vuetify.theme.dark);
            localStorage.setItem('dark', this.$vuetify.theme.dark ? 'true' : 'false');
        },
        /**
         * Open search bar and focus on it
         */
        openSearch() {
            this.searchOpened = true;
            if (this.searching !== '' && this.searching !== null) {
                this.searchResult();
            }
            setTimeout(() => {
                if (this.searchOpened) {
                    this.$refs.searchInput.focus();
                }
            }, 350);
        },
        /**
         * Close search bar and blur the input field
         */
        closeSearch() {
            this.searchOpened = false;
            this.$refs.searchInput.blur();
        },
        /**
         * Rebuild searchers from search indexes when search indexes changed
         */
        rebuildSearchIndex() {
            for (let i = 0; i < this.searchIndex.length; i += 1) {
                const item = this.searchIndex[i];
                if (item.name) {
                    const searcher = new JsSearch.Search(item.key);

                    searcher.tokenizer = {
                        tokenize: (text) => [].concat(...text.split(/([\u4E00-\u9FA5\uF900-\uFA2D])/).map((textMap) => textMap.split(' '))).filter((textFilter) => textFilter !== ''),
                    };
                    searcher.indexStrategy = new JsSearch.AllSubstringsIndexStrategy();
                    for (let j = 0; j < item.indexes.length; j += 1) {
                        searcher.addIndex(item.indexes[j]);
                    }
                    searcher.addDocuments(item.data);

                    this.searchers[i] = searcher;
                } else {
                    this.searchers[i] = null;
                }
            }
        },
        /**
         * Search result from search index based on input
         */
        searchResult() {
            const result = [];
            for (let i = 0; i < this.searchIndex.length; i += 1) {
                const item = this.searchIndex[i];
                if (item.name) {
                    result.push(this.searchers[i].search(this.searching).slice(0, 7));
                } else {
                    result.push(null);
                }
            }
            this.searchIndexFiltered = result;
        },
        /**
         * Check if there is a new version of the frontend
         */
        async checkFrontEndUpdate() {
            let requestFailed = false;
            // Send request
            const response = await betterFetch('/version.json').catch(() => {
                // Network error
                requestFailed = true;
            });

            if (requestFailed) {
                return;
            }

            if (semVerCmp(version.version, response.version) < 0) {
                this.updateReady = true;
                this.updateReadyVersion = response.version;
            }
        },
        /**
         * Update frontend
         */
        updateFrontend() {
            localStorage.setItem('update_frontend', 'true');
            window.location.replace(window.location.href);
        },
        /**
         * Check whether to show the welcome dialog
         */
        checkWelcome() {
            if (this.$route.path === '/' || this.$route.path === '/settings') {
                this.welcome = true;
            }
        },
    },
    computed: {
        ...mapState({
            displayErrors: (state) => state.errorList,
            backendStatus: (state) => state.backendStatus,
            searchIndex: (state) => state.searchIndex,
            searchIndexChecker: (state) => state.searchIndexChecker,
        }),
        /**
         * Check if the URL field is valid
         * @returns {boolean} whether the URL field is valid
         */
        urlValid() {
            if (this.backendURL.length === 0) {
                return false;
            }
            if (/^[\w-]+(\.[\w-]+)+([\w.,@^=%:/~+-]*)?$/i.test(this.backendURL)) {
                return true;
            }
            return false;
        },
        /**
         * Check if the token field is valid
         * @returns {boolean} whether the token field is valid
         */
        tokenValid() {
            if (this.needToken && ((this.backendToken && this.backendToken.length !== 32) || !this.backendToken)) {
                return false;
            }
            return true;
        },
    },
    watch: {
        ifWidgets() {
            // Store widget status to local storage
            localStorage.setItem('if_widgets', JSON.stringify(this.ifWidgets));
            this.$store.commit('setWidgets', this.ifWidgets);
        },
        locale() {
            // Store language settings to local storage
            this.$i18n.locale = this.locale;
            this.localeDetail = this.languageList.find((item) => item.locale === this.locale);
            this.$vuetify.lang.current = this.localeDetail.localeName;

            document.documentElement.lang = this.locale;
            localStorage.setItem('language', this.locale);

            this.$store.commit('setLocale', this.locale);
            this.$store.commit('setLocaleDetail', this.localeDetail);

            this.$nextTick(() => {
                this.searchResult();
            });
        },
        backendStatus() {
            if (this.backendStatus === true) {
                this.$store.commit('addError', {
                    title: this.$t('backend_reconnect'),
                    content: this.$t('backend_reconnect_body'),
                    type: 'success',
                });
            }
        },
        searching() {
            this.searchResult();
        },
        searchIndexChecker() {
            // Search indexes changed
            this.rebuildSearchIndex();
            if (this.searching !== '' && this.searching !== null && this.searchOpened) {
                this.searchResult();
            }
        },
    },
    mounted() {
        window.isUoma = true;

        // Initialize language
        this.locale = localStorage.getItem('language') || 'en';
        this.$i18n.locale = this.locale;
        localStorage.setItem('language', this.$i18n.locale);

        // Set version
        updateStorage();
        localStorage.setItem('uoma_version', version.version);

        // Check if updating
        const updating = localStorage.getItem('update_frontend') || 'false';
        if (updating === 'true') {
            localStorage.setItem('update_frontend', 'remove');
            this.updating = true;
            window.addEventListener('load', () => {
                setTimeout(() => {
                    window.location.replace(window.location.href);
                }, 30000);
            });
        } else if (updating === 'remove') {
            localStorage.removeItem('update_frontend');
        }

        // Initialize widget status
        try {
            this.ifWidgets = JSON.parse(localStorage.getItem('if_widgets')) || [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
        } catch {
            this.ifWidgets = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
        }
        localStorage.setItem('if_widgets', JSON.stringify(this.ifWidgets));
        this.$store.commit('setWidgets', this.ifWidgets);

        // Initialize dark mode status
        const darkMode = localStorage.getItem('dark');
        this.$vuetify.theme.dark = darkMode ? (darkMode === 'true') : false;
        this.$store.commit('setDarkMode', this.$vuetify.theme.dark);

        // Initialize backend connection
        try {
            this.backend = JSON.parse(localStorage.getItem('backend')) || { status: true };
        } catch {
            this.backend = { status: true };
        }
        this.$store.commit('setBackend', this.backend);
        this.$store.commit('setBackendStatus', this.backend.status);

        // Initialize account data
        try {
            this.account = JSON.parse(localStorage.getItem('account')) || {};
        } catch {
            this.account = {};
        }
        this.$store.commit('setAccount', this.account);

        this.rebuildSearchIndex();

        if (updating !== 'true') {
            // Check update for front-end every 2 hours
            this.checkFrontEndUpdate();
            this.timer = setInterval(() => {
                this.checkFrontEndUpdate();
            }, 7200000);
        }

        this.$router.onReady(() => {
            this.checkWelcome();
        });
        this.$router.afterEach(() => {
            this.checkWelcome();
        });
    },
    beforeDestroy() {
        clearInterval(this.timer);
    },
    errorCaptured(err) {
        // Handle uncaught errors
        this.$store.commit('addError', {
            title: `${this.$t('unknown')} ${err.name}`,
            content: `${err.message} ${this.$t('at')} ${formatDateTime(new Date(), this.locale)}`,
            type: 'error',
        });
        return true;
    },
};
</script>

<style lang="less">
@keyframes welcome {
    to {
        opacity: 1;
        transform: translateY(0);
    }
}
html::-webkit-scrollbar {
    width: 0;
}
.v-application {
    font-family: Roboto, -apple-system, "Noto Sans", "Helvetica Neue", Helvetica, "Nimbus Sans L", Arial,"Liberation Sans", "PingFang SC", "Hiragino Sans GB", "Noto Sans CJK SC", "Source Han Sans SC", "Source Han Sans CN", "Microsoft YaHei", "Wenquanyi Micro Hei", "WenQuanYi Zen Hei", "ST Heiti", SimHei, "WenQuanYi Zen Hei Sharp", sans-serif;
    -webkit-font-smoothing: antialiased;
    #alert-space {
        width: calc(100% - 50px);
        right: 25px;
        max-width: 350px;
        position: fixed;
        z-index: 9999;
    }
    .text-h1, .overline, .title, .mail-view-subject > span, .mail-detail .text-body-2, .mail-translation .text-body-2 {
        font-family: Roboto, -apple-system, "Noto Sans", "Helvetica Neue", Helvetica, "Nimbus Sans L", Arial,"Liberation Sans", "PingFang SC", "Hiragino Sans GB", "Noto Sans CJK SC", "Source Han Sans SC", "Source Han Sans CN", "Microsoft YaHei", "Wenquanyi Micro Hei", "WenQuanYi Zen Hei", "ST Heiti", SimHei, "WenQuanYi Zen Hei Sharp", sans-serif!important;
    }
    .v-application--wrap > header {
        flex-grow: 0;
    }
    .v-main {
        overflow: hidden;
    }
}
.gray-container, .v-window-item > .container, .v-main__wrap > .container {
    background-color: #F5F5F5;
}
.v-main__wrap > .container {
    padding-top: 0;
    padding-bottom: 0;
    .v-calendar-events .v-event-timed {
        border-color: transparent!important;
    }
}
#app.theme--dark .v-window-item > .container, #app.theme--dark .v-main__wrap > .container {
    background-color: #272727;
}
.v-menu__content.large-radius {
    border-radius: 8px!important;
}
.not-selectable {
    user-select: none;
    &.pointer {
        cursor: pointer;
    }
}
.daynight {
    .v-list-item__icon {
        margin: 12px 16px 12px 0;
        margin-right: 16px!important;
    }
}
.shown-list {
    .v-list-item__action {
        margin-right: 16px!important;
    }
    .v-list-item {
        padding-right: 32px;
    }
}
.handle {
    user-select: none;
}
.welcome-dialog.welcome-overflow {
    overflow: hidden;
}
.welcome-dialog.rounded-0 .welcome-dialog-card {
    border-radius: 0;
}
.welcome-dialog .welcome-dialog-card {
    .stepper {
        position: absolute;
        top: 30px;
        left: 10%;
        width: 0;
        height: 0;
        overflow: hidden;
        box-shadow: none;
        pointer-events: none;
        opacity: 0;
        background-color: transparent;
        transition: opacity .2s .2s;
        &.shown {
            width: 80%;
            height: auto;
            opacity: 1;
            pointer-events: auto;
        }
    }
    .v-card__text {
        display: flex;
        justify-content: center;
        align-items: center;
        flex-direction: column;
        transition: opacity .2s;
        img {
            width: 90%;
            max-width: 500px;
            margin: 50px 0 30px 0;
            transform: translateY(30px);
            opacity: 0;
            &.animation {
                animation: welcome .3s .5s forwards;
            }
            &.small-screen {
                margin: 30px 0 30px 0;
            }
        }
        h1, p {
            text-align: center;
        }
        .select {
            width: 80%;
            max-width: 200px;
            &.small-screen {
                margin-bottom: -10px;
            }
        }
        .main-btn {
            border-radius: 6px;
        }
        .second-btn {
            background-color: transparent;
        }
        .input {
            width: 100%;
        }
        .settings {
            width: 95%;
            max-width: 500px;
        }
        &.same-height {
            position: absolute;
            top: 0;
            left: 0;
            width: 0;
            height: 0;
            pointer-events: none;
            opacity: 0;
            transition: opacity .2s, height 0s .2s, width 0s .2s;
            &.backend {
                z-index: 2;
            }
            &.personal {
                z-index: 3;
            }
            .token-input {
                height: 0;
                opacity: 0;
                transition: height .2s, opacity .2s .2s;
                &.shown {
                    height: 87px;
                    opacity: 1;
                }
            }
        }
        &.hide-0 {
            opacity: 0;
        }
        &.show-1 {
            opacity: 1;
            width: 100%;
            height: 100%;
            pointer-events: auto;
            transition: opacity .2s .2s;
        }
    }
}
.global-search-input {
    position: absolute;
    top: 8px;
    right: 12px;
    opacity: 0;
    width: 52px;
    z-index: 5;
    pointer-events: none;
    transition: all .2s;
    .v-input__slot {
        border-radius: 6px;
    }
    &.open {
        opacity: 1;
        width: 600px;
        pointer-events: auto;
    }
}
#search-result {
    position: absolute;
    top: 64px;
    right: 12px;
    opacity: 0;
    width: 52px;
    z-index: 5;
    background-color: #F8F8F8;
    max-height: ~"min(700px, calc(100vh - 100px))";
    overflow: hidden;
    border-radius: 6px;
    pointer-events: none;
    transition: all .2s;
    & > div {
        width: 600px;
        padding: 10px 15px 7px 15px;
        max-height: ~"min(700px, calc(100vh - 200px))";
        overflow: auto;
    }
    &.open {
        opacity: 1;
        width: 600px;
        pointer-events: auto;
    }
}
.update-title {
    font-size: 1rem;
}
.v-application--is-ltr .v-toolbar__content > .v-btn.v-btn--icon:first-child + .v-toolbar__title {
    padding-left: 12px!important;
}
.v-slider__thumb:after {
    transition: 0.3s cubic-bezier(0.25, 0.8, 0.5, 1);
    content: '';
    color: inherit;
    width: 300%;
    height: 300%;
    border-radius: 50%;
    background: transparent;
    position: absolute;
    left: -100%;
    top: -100%;
}
@media (max-width: 960px) {
    .global-search-input {
        top: 4px;
    }
    #search-result {
        top: 58px;
    }
}
@media (max-width: 624px) {
    .global-search-input, #search-result {
        &.open {
            width: calc(100% - 24px);
        }
    }
    #search-result > div {
        width: calc(100vw - 24px);
    }
}
#app.theme--dark {
    color-scheme: dark;
    .v-picker__title.primary {
        color: #424242;
        .v-time-picker-title {
            color: #424242;
        }
    }
    .welcome-dialog .welcome-dialog-card .main-btn {
        color: black;
    }
    .v-picker__body .v-btn--active, .v-slider__thumb-label, .v-time-picker-clock__item--active {
        color: #424242;
    }
    .v-btn.primary {
        color: #272727;
        .v-btn__content .v-icon {
            color: #272727;
        }
    }
    .theme--dark.v-icon {
        color: rgba(255, 255, 255, 0.7);
    }
    .v-stepper__step__step {
        color: #1E1E1E;
        .v-icon {
            color: #1E1E1E;
        }
    }
    .v-calendar-weekly {
        border-color: #575757;
        .v-calendar-weekly__day, .v-calendar-weekly__head-weekday {
            border-color: #575757;
        }
    }
    .v-calendar-daily {
        border-color: #575757;
        .v-calendar-daily__day, .v-calendar-daily__intervals-body, .v-calendar-daily__day-interval, .v-calendar-daily_head-day {
            border-color: #575757;
        }
        .v-calendar-daily__intervals-head {
            border-color: #575757;
            &::after {
                background: #575757;
                background: linear-gradient(90deg, transparent, #575757);
            }
        }
        .v-calendar-daily__interval {
            &::after {
                border-color: #575757;
            }
        }
    }
    .v-navigation-drawer__content .primary--text .v-icon {
        color: #D099E0;
    }
    .v-data-table > .v-data-table__wrapper > table > tbody > tr:hover:not(.v-data-table__expanded__content):not(.v-data-table__empty-wrapper) {
        background: #333333;
    }
    #search-result {
        background-color: #1E1E1E;
    }
    .v-autocomplete__content.v-menu__content {
        box-shadow: 0px 5px 5px -3px rgba(0, 0, 0, .2), 0px 8px 10px 1px rgba(0, 0, 0, .14), 0px 3px 14px 2px rgba(0, 0, 0, .12);
    }
}
</style>

<i18n>
{
    "en": {
        "title": "UoM Assistant",
        "dark_mode": "Switch to dark mode",
        "light_mode": "Switch to light mode",
        "front_end_update_ready": "New version of the frontend is available",
        "front_end_update": "Update",
        "front_end_ignore": "Ignore",
        "updating": "Updating...",
        "dashboard": "Dashboard",
        "settings": "Settings",
        "about": "About",
        "unknown": "Unknown",
        "at": "at",
        "backend_reconnect": "Backend is up",
        "backend_reconnect_body": "We have just reconnected to the backend",
        "search": "Search...",
        "welcome": "Hi there!",
        "not_yet": "It looks like you haven't set up your UoM Assistant yet",
        "press_to_settings": "Press \"Continue\" to set up your own dashboard",
        "continue": "Continue",
        "next": "Next",
        "import": "Import",
        "skip": "Skip",
        "connect_to": "Connection",
        "backend_url": "Backend URL",
        "backend_maintenance": "This backend is being maintenanced or backend version not supported",
        "wrong_url": "Cannot connect to this URL",
        "backend_token": "Token",
        "need_token": "To access to this backend you need a valid token",
        "wrong_token": "This token is invalid",
        "message_from_backend": "Message from the backend",
        "ok": "OK",
        "account_settings": "Account Settings",
        "clock": "Clock",
        "todo": "TO-DO",
        "bblinks": "Quick Links",
        "livelinks": "Online Session Links",
        "subjects": "Manage Course",
        "attendance": "Attendance",
        "calendar": "Calendar",
        "coursework": "Coursework",
        "note": "Quick Notes",
        "mail": "Inbox",
        "grade": "Grade Summary",
        "plugins": "Plug-ins"
    },
    "zh": {
        "title": "曼大助手",
        "dark_mode": "切换到暗色模式",
        "light_mode": "切换到亮色模式",
        "front_end_update_ready": "新版本的前端已经可用",
        "front_end_update": "更新",
        "front_end_ignore": "忽略",
        "updating": "正在更新…",
        "dashboard": "仪表板",
        "settings": "设置",
        "about": "关于",
        "unknown": "未知",
        "at": "于",
        "backend_reconnect": "后端已恢复",
        "backend_reconnect_body": "已经成功连接到后端",
        "search": "搜索…",
        "welcome": "欢迎！",
        "not_yet": "看起来你还没有配置你的曼大助手",
        "press_to_settings": "点按“开始设置”来配置你的个人仪表板",
        "continue": "开始设置",
        "next": "下一步",
        "import": "导入",
        "skip": "跳过",
        "connect_to": "连接信息",
        "backend_url": "后端 URL",
        "backend_maintenance": "不支持的后端版本或后端正在维护，暂时无法连接",
        "wrong_url": "无法连接到这个地址",
        "backend_token": "令牌",
        "need_token": "访问这个后端需要正确的令牌",
        "wrong_token": "此令牌无效",
        "message_from_backend": "来自后端的消息",
        "ok": "好",
        "account_settings": "账户设置",
        "clock": "时钟",
        "todo": "TO-DO",
        "bblinks": "快速链接",
        "livelinks": "在线课程链接",
        "subjects": "科目管理",
        "attendance": "出勤统计",
        "calendar": "日历",
        "coursework": "作业",
        "note": "快速笔记",
        "mail": "收件箱",
        "grade": "成绩概览",
        "plugins": "插件"
    },
    "es": {
        "title": "UoM Assistant",
        "dark_mode": "Cambiar a modo oscuro",
        "light_mode": "Cambiar a modo claro",
        "front_end_update_ready": "Nuava versión de front-end disponible",
        "front_end_update": "Actualizar",
        "front_end_ignore": "Ignorar",
        "updating": "Actualizando...",
        "dashboard": "Tablero",
        "settings": "Ajustes",
        "about": "Sobre",
        "unknown": "Desconocido",
        "at": "en",
        "backend_reconnect": "Back-end reconectado",
        "backend_reconnect_body": "Conectada a back-end correctamente",
        "search": "Buscar...",
        "welcome": "Bienvenido!",
        "not_yet": "Parace ser que todavía no ha ajustado su UoM Assistant",
        "press_to_settings": "Haga clic en \"Continuar\" para ajustar tu propio tablero",
        "continue": "Continuar",
        "next": "Siguiente",
        "import": "Importar",
        "skip": "Saltar",
        "connect_to": "Conexión",
        "backend_url": "Back-end URL",
        "backend_maintenance": "Versión de back-end no compatible o back-end en mantenimiento",
        "wrong_url": "No ha sido posible conectarse a este URL",
        "backend_token": "Token",
        "need_token": "Para acceder este back-end necesita un token válido",
        "wrong_token": "Token invalido",
        "message_from_backend": "Mensaje desde back-end",
        "ok": "OK",
        "account_settings": "Ajustes de la cuenta",
        "clock": "Reloj",
        "todo": "PARA-HACER",
        "bblinks": "Enlaces rápidos",
        "livelinks": "Enlaces de sesiones online",
        "subjects": "Asignaturas",
        "attendance": "Asistencia",
        "calendar": "Calendario",
        "coursework": "Trabajo de curso",
        "note": "Apuntes rápidos",
        "mail": "Correos",
        "grade": "Resumen de notas ",
        "plugins": "Complementos"
    }
}
</i18n>
