<template>
    <v-card
        class="mx-auto rounded-lg bblinks-container"
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
        <div class="bblinks-outer">
            <h2 class="handle">{{ $t('quick_links') }}</h2>
            <v-tabs @change="relocate">
                <v-tab :key="`${this.locale}1`">{{ $t('subjects') }}</v-tab>
                <v-tab :key="`${this.locale}2`">{{ $t('portals') }}</v-tab>
                <v-tab :key="`${this.locale}3`">{{ $t('custom') }}</v-tab>

                <v-tab-item>
                    <v-container fluid>
                        <v-list flat class="list" :class="{ 'non-empty': !(shownSubjects.length === 0)}">
                            <v-list-item-group>
                                <v-list-item
                                    v-for="(subject, index) in shownSubjects"
                                    :key="`subjects-${index}`"
                                    :ripple="false"
                                >
                                    <template>
                                        <v-list-item-content>
                                            <v-list-item-title><span :class="subject.color" class="subject-color-samll"></span> <a :href="subject.homeLink" target="_blank" rel="noopener nofollow">{{ subject.name }}</a><a :href="subject.homeLink" target="_blank" rel="noopener nofollow" class="no-underline-link"><v-icon small color="primary">mdi-open-in-new</v-icon></a></v-list-item-title>
                                        </v-list-item-content>
                                    </template>
                                </v-list-item>
                            </v-list-item-group>
                        </v-list>
                        <div class="empty empty-long" v-if="shownSubjects.length === 0">
                            {{ $t('nothing') }}
                        </div>
                    </v-container>
                </v-tab-item>

                <v-tab-item>
                    <v-container fluid>
                        <v-list flat class="list" :class="{ 'non-empty': !(portalLinks.length === 0)}">
                            <v-list-item-group>
                                <v-list-item
                                    v-for="(link, index) in portalLinks"
                                    :key="index"
                                    :ripple="false"
                                >
                                    <template>
                                        <v-list-item-content>
                                            <v-list-item-title><a :href="link.link" target="_blank" rel="noopener nofollow">{{ link.title }}</a><a :href="link.link" target="_blank" rel="noopener nofollow" class="no-underline-link"><v-icon small color="primary">mdi-open-in-new</v-icon></a></v-list-item-title>
                                        </v-list-item-content>
                                    </template>
                                </v-list-item>
                            </v-list-item-group>
                        </v-list>
                        <div class="empty empty-long" v-if="portalLinks.length === 0">
                            {{ $t('nothing') }}
                        </div>
                    </v-container>
                </v-tab-item>

                <v-tab-item>
                    <v-container fluid>
                        <v-text-field
                            :label="$t('add_link')"
                            :placeholder="$t('link_format')"
                            outlined
                            class="input"
                            prepend-inner-icon="mdi-link-variant"
                            clearable
                            v-model.trim="addText"
                            v-on:keyup.enter="addOne"
                        ></v-text-field>
                        <v-list flat class="list" :class="{ 'non-empty': !(links.length === 0)}">
                            <v-list-item-group>
                                <v-list-item
                                    v-for="(link, index) in links"
                                    :key="index"
                                    :ripple="false"
                                >
                                    <template>
                                        <v-list-item-content>
                                            <v-list-item-title><a :href="link.link" target="_blank" rel="noopener nofollow">{{ link.title }}</a><a :href="link.link" target="_blank" rel="noopener nofollow" class="no-underline-link"><v-icon small color="primary">mdi-open-in-new</v-icon></a></v-list-item-title>
                                        </v-list-item-content>

                                        <v-list-item-action class="delete">
                                            <v-btn icon @click.stop="removeLink(index)">
                                                <v-icon color="grey">mdi-delete-outline</v-icon>
                                            </v-btn>
                                        </v-list-item-action>
                                    </template>
                                </v-list-item>
                            </v-list-item-group>
                        </v-list>
                        <div class="empty" v-if="links.length === 0">
                            {{ $t('nothing') }}
                        </div>
                    </v-container>
                </v-tab-item>

            </v-tabs>
        </div>
    </v-card>
</template>

<script>
import { mapState } from 'vuex';

export default {
    name: 'bblinks',
    data() {
        return {
            loading: false,
            links: [],
            classLinks: [],
            timer: null,
            portalLinks: [
                {
                    title: 'Blackboard',
                    link: 'https://online.manchester.ac.uk/',
                },
                {
                    title: 'My Manchester',
                    link: 'https://my.manchester.ac.uk/',
                },
                {
                    title: 'My Manchester uPortal',
                    link: 'https://my.manchester.ac.uk/uPortal/f/home/normal/render.uP',
                },
                {
                    title: 'Spot',
                    link: 'https://studentnet.cs.manchester.ac.uk/me/spot/',
                },
                {
                    title: 'Attendance',
                    link: 'https://studentnet.cs.manchester.ac.uk/ugt/attendance/',
                },
                {
                    title: 'Email',
                    link: 'https://outlook.com/student.manchester.ac.uk',
                },
                {
                    title: 'Timetable',
                    link: 'https://timetables.manchester.ac.uk/',
                },
                {
                    title: 'Library',
                    link: 'https://www.library.manchester.ac.uk/',
                },
                {
                    title: 'CS Student Intranet',
                    link: 'https://studentnet.cs.manchester.ac.uk/ugt/',
                },
                {
                    title: 'CS Wiki',
                    link: 'https://wiki.cs.manchester.ac.uk/index.php/Main_Page',
                },
            ],
            addText: '',
        };
    },
    methods: {
        /**
         * Add a custom link
         */
        addOne() {
            if (this.addText !== '') {
                const input = this.addText.split(' ');
                const link = input.shift();
                this.links.push({
                    title: input.length === 0 ? link : input.join(' '),
                    link: (link.indexOf('http://') === 0) || (link.indexOf('https://') === 0) ? link : `http://${link}`,
                });
                this.addText = '';
                this.packery.shiftLayout();
            }
        },
        /**
         * Remove a custom link
         */
        removeLink(index) {
            this.links.splice(index, 1);
            this.packery.shiftLayout();
        },
        /**
         * Re-layout when modifying custom links
         */
        relocate() {
            setTimeout(() => {
                this.packery.shiftLayout();
            }, 300);
        },
        /**
         * Store data when modifying custom links
         */
        store() {
            localStorage.setItem('bblinks', JSON.stringify(this.links));
            this.sync();
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
    },
    watch: {
        locale() {
            this.$i18n.locale = this.locale;
        },
        links() {
            this.store();
        },
        subjects() {
            // Layout
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
        /**
         * Get shown subject
         * @returns {array} a list of subjects that are not hidden
         */
        shownSubjects() {
            return this.subjects.filter((subject) => !subject.hide);
        },
    },
    mounted() {
        this.$i18n.locale = localStorage.getItem('language') || 'en';

        // Restore stroed custom links
        const storaged = localStorage.getItem('bblinks');
        if (storaged) {
            this.links = JSON.parse(storaged);
        }

        this.timer = setInterval(() => {
            this.sync();
        }, 1800000);

        // Layout when initialized
        setTimeout(() => {
            if (this.packery) {
                this.packery.shiftLayout();
            }
        }, 1000);
    },
    beforeDestroy() {
        clearInterval(this.timer);
    },
};
</script>

<style lang="less">
.bblinks-container {
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
        width: 10px;
        height: 10px;
        display: inline-block;
        border-radius: 50%;
        margin: 0;
        margin-right: 6px;
        margin-left: 0;
        margin-bottom: 1px;
    }
    .input {
        width: calc(100% - 32px);
        margin-left: 16px!important;
        margin-top: 15px!important;
        margin-bottom: -20px!important;
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
        .delete {
            margin: 0;
            margin-left: 8px;
            opacity: 0;
            transition: .2s;
        }
        .v-list-item:hover, .v-list-item:focus {
            .delete {
                opacity: 1;
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
    }
    .empty-long {
        height: 201px;
    }
    .bblinks-outer {
        width: 100%;
    }
}
</style>

<i18n>
{
    "en": {
        "quick_links": "Quick Links",
        "add_link": "Add a link",
        "link_format": "URL[ name]",
        "nothing": "No link here",
        "no_class": "No course yet",
        "subjects": "Courses",
        "portals": "Portals",
        "custom": "Customize"
    },
    "zh": {
        "quick_links": "快速链接",
        "add_link": "添加一个链接",
        "link_format": "URL[ 名称]",
        "nothing": "还没有链接",
        "no_class": "还没有科目",
        "subjects": "科目主页",
        "portals": "系统主页",
        "custom": "自定义"
    },
    "es": {
        "quick_links": "Enlances rápidos",
        "add_link": "Añadir un enlace",
        "link_format": "URL[ nombre]",
        "nothing": "No enlaces disponibles",
        "no_class": "No asignaturas todavía",
        "subjects": "Asignaturas",
        "portals": "Portales",
        "custom": "Personalizado"
    }
}
</i18n>
