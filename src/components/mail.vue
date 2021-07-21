<template>
    <v-card
        class="mx-auto rounded-lg mail-container"
        outlined
    >
        <div class="mail-outer">
            <h2 class="handle" :class="{ shadow: headerShadow }">
                {{ $t('mail') }}
                <span class="num-badge" v-show="mailUnseen.length > 0">{{ mailUnseen.length }}</span>
                <v-progress-circular
                    indeterminate
                    color="grey"
                    :width="2"
                    :size="18"
                    class="loading ml-3"
                    v-show="loading || loadingFlag.length > 0 || downloading !== '' || loadingPreview != ''"
                ></v-progress-circular>
                <v-menu
                    offset-y
                    bottom
                    left
                    transition="slide-y-transition"
                    nudge-bottom="5"
                >
                    <template v-slot:activator="{ on, attrs }">
                        <v-btn icon small class="float-right mr-3" :title="$t('more')" v-on="on" v-bind="attrs">
                            <v-icon>mdi-dots-vertical</v-icon>
                        </v-btn>
                    </template>
                    <v-list flat class="shown-list pt-0 pb-0">
                        <v-list-item class="pt-2 pb-2 mail-all-read" @click="markAllAsRead" :disabled="!init || loading || loadingFlag.length > 0 || downloading !== '' || loadingPreview != ''">
                            <v-list-item-icon>
                                <v-icon>mdi-email-open-multiple-outline</v-icon>
                            </v-list-item-icon>
                            <v-list-item-content>
                                <v-list-item-title>{{ $t('all_read') }}</v-list-item-title>
                            </v-list-item-content>
                        </v-list-item>
                        <v-divider></v-divider>
                        <v-list-item class="pt-2 pb-2 mail-all-read" @click="openTranslationSettingsDialog">
                            <v-list-item-icon>
                                <v-icon>mdi-translate</v-icon>
                            </v-list-item-icon>
                            <v-list-item-content>
                                <v-list-item-title>{{ $t('translation_settings') }}…</v-list-item-title>
                            </v-list-item-content>
                        </v-list-item>
                        <v-divider></v-divider>
                        <v-list-item-group
                            v-model="ifNotify"
                            multiple
                        >
                            <v-list-item class="pt-2 pb-2">
                                <template v-slot:default="{ active }">
                                    <v-list-item-action>
                                        <v-checkbox :input-value="active"></v-checkbox>
                                    </v-list-item-action>
                                    <v-list-item-content>
                                        <v-list-item-title>{{ $t('sound_notification') }}</v-list-item-title>
                                    </v-list-item-content>
                                </template>
                            </v-list-item>
                        </v-list-item-group>
                    </v-list>
                </v-menu>
                <audio class="new-mail-audio" ref="audio">
                    <source src="@/assets/audios/new_mail.mp3" type="audio/mpeg">
                    <source src="@/assets/audios/new_mail.ogg" type="audio/ogg">
                </audio>
                <v-btn icon @click.stop="manualRefresh" small class="float-right mr-1" :title="$t('refresh')" :disabled="loading || loadingFlag.length > 0 || downloading !== '' || loadingPreview != ''" v-if="init" :loading="refreshLoding">
                    <v-icon>mdi-sync</v-icon>
                    <template v-slot:loader>
                        <span class="refresh-loading">
                            <v-icon light>mdi-sync</v-icon>
                        </span>
                    </template>
                </v-btn>
                <v-btn icon @click.stop="sendMail" small class="float-right mr-2" :title="$t('write')" v-if="init">
                    <v-icon>mdi-email-edit-outline</v-icon>
                </v-btn>
            </h2>
            <v-skeleton-loader
                class="mx-auto"
                type="list-item-avatar-three-line@4"
                v-if="!init && loading"
            ></v-skeleton-loader>
            <div class="scroll" v-if="mails.length > 0" @scroll.passive="scrollHandler">
                <v-list flat class="list">
                    <v-list-item v-for="(mail, index) in mails" :key="mail.id" @click.stop="openMail(mail.id)" :class="{ flaged: mail.flagged, unseen: mail.unseen }" @contextmenu.prevent="(e) => showListMenu(e, mail.id)">
                        <v-list-item-avatar :color="(mail.flagged || mail.unseen) ? 'uomthemelight' : ($vuetify.theme.dark ? 'grey darken-1' : 'grey lighten-2')" v-if="getSubjectId(mail.subject, mail.from) === false" :class="{ 'black--text': ((mail.flagged || mail.unseen) && $vuetify.theme.dark) }">
                            <span v-if="getMailAvatar(mail.subject, mail.from, mail.fromAddress) === false">{{ getTwoLetterSenderName(mail.from ? mail.from : mail.fromAddress) }}</span>
                            <v-img v-else :src="require(`@/assets/img/mail-avatars/${getMailAvatar(mail.subject, mail.from, mail.fromAddress)}`)"></v-img>
                        </v-list-item-avatar>

                        <v-list-item-avatar :color="subjectColor(getSubjectId(mail.subject, mail.from))" v-else>
                            <v-icon color="white" v-if="getMailAvatar(mail.subject, mail.from, mail.fromAddress) === false">mdi-book-outline</v-icon><v-img v-else :src="require(`@/assets/img/mail-avatars/${getMailAvatar(mail.subject, mail.from, mail.fromAddress)}`)"></v-img>
                        </v-list-item-avatar>

                        <v-list-item-content>
                            <v-list-item-title :class="{ 'primary--text': mail.unseen }"><span v-if="mail.subject" :title="mail.subject">{{ mail.subject }}</span><em v-else>{{ $t('no_subject') }}</em></v-list-item-title>
                            <v-list-item-subtitle>
                                <span class="d-block text-truncate from">
                                    <v-icon
                                        small
                                        class="person-icon mr-1"
                                    >
                                        mdi-account-arrow-right
                                    </v-icon>
                                    <span :title="mail.fromAddress">{{ mail.from ? getShortSenderName(mail.from) : mail.fromAddress }}</span>
                                </span>
                                <v-icon
                                    small
                                    class="time-icon mr-1"
                                >
                                    mdi-clock-outline
                                </v-icon>
                                <span :title="getDate(new Date(mail.date * 1000))" :key="timeUpdate(mail.date * 1000) ? `${keyMin}-${index}` : `mail-key-${index}`">{{ displayDate(new Date(mail.date * 1000)) }}</span>
                                <v-icon
                                    small
                                    color="primary"
                                    class="time-icon ml-2"
                                    :title="$t('flagged')"
                                    v-if="mail.flagged"
                                >
                                    mdi-flag
                                </v-icon>
                                <span v-if="getSubjectId(mail.subject, mail.from) !== false" class="ml-3">
                                    <span :class="subjectColor(getSubjectId(mail.subject, mail.from))" class="subject-color-samll"></span>
                                    {{ subjectNameMap(getSubjectId(mail.subject, mail.from)) }}
                                </span>
                            </v-list-item-subtitle>
                        </v-list-item-content>
                    </v-list-item>
                </v-list>
                <div class="more-mail px-4 pb-3 text-body-2 text--secondary" v-show="mails.length > 7">
                    {{ $t('more_mail') }} <a href="https://outlook.com/student.manchester.ac.uk" target="_blank" rel="noopener nofollow">Outlook</a><a href="https://outlook.com/student.manchester.ac.uk" target="_blank" rel="noopener nofollow" class="no-underline-link"><v-icon x-small color="primary">mdi-open-in-new</v-icon></a>
                </div>
            </div>
            <div class="empty" v-if="mails.length === 0 && init && !loading">
                {{ $t('nothing') }}
            </div>
            <div class="empty" v-if="!loading && !init">
                <span class="text-center pl-6 pr-6">{{ $t('cannot_fetch') }} <a href="https://github.com/uom-assistant/uom-assistant/wiki" target="_blank" rel="noreferrer noopener">{{ $t('learn_more') }}</a></span>
            </div>
        </div>
        <div class="viewer-layer-mask" :class="{ opened: viewerOpened }"></div>
        <div class="viewer-layer" :class="{ opened: viewerOpened }">
            <h2 class="handle">
                <v-avatar v-if="getSubjectId(viewer.subject, viewer.from) === false" :color="$vuetify.theme.dark ? 'grey darken-1' : 'grey lighten-2'" size="27" class="mr-3 layer-title-avatar">
                    <span v-if="getMailAvatar(viewer.subject, viewer.from, viewer.fromAddress) === false">{{ getTwoLetterSenderName(viewer.from ? viewer.from : viewer.fromAddress) }}</span>
                    <v-img v-else :src="require(`@/assets/img/mail-avatars/${getMailAvatar(viewer.subject, viewer.from, viewer.fromAddress)}`)"></v-img>
                </v-avatar>

                <v-avatar :color="subjectColor(getSubjectId(viewer.subject, viewer.from))" v-else size="27" class="mr-3 layer-title-avatar">
                    <v-icon color="white" v-if="getMailAvatar(viewer.subject, viewer.from, viewer.fromAddress) === false" small>mdi-book-outline</v-icon><v-img v-else :src="require(`@/assets/img/mail-avatars/${getMailAvatar(viewer.subject, viewer.from, viewer.fromAddress)}`)"></v-img>
                </v-avatar>
                <span class="layer-title">{{ $t('mail_view') }}</span>
                <v-btn icon @click.stop="closeMail" small class="float-right mr-4" :title="$t('close')">
                    <v-icon>mdi-close</v-icon>
                </v-btn>
                <v-menu
                    offset-y
                    bottom
                    left
                    transition="slide-y-transition"
                    nudge-bottom="5"
                >
                    <template v-slot:activator="{ on, attrs }">
                        <v-btn icon @click.stop="2" small class="float-right mr-1" :title="$t('more')" v-on="on" v-bind="attrs" v-show="!loadingBody">
                            <v-icon>mdi-dots-vertical</v-icon>
                        </v-btn>
                    </template>
                    <v-list class="mail-menu-list">
                        <v-list-item @click="sendMail">
                            <v-list-item-icon>
                                <v-icon>mdi-reply-all-outline</v-icon>
                            </v-list-item-icon>
                            <v-list-item-content>
                                <v-list-item-title>{{ $t('reply_all') }}</v-list-item-title>
                            </v-list-item-content>
                        </v-list-item>
                        <v-list-item @click="sendMail">
                            <v-list-item-icon>
                                <v-icon>mdi-share-outline</v-icon>
                            </v-list-item-icon>
                            <v-list-item-content>
                                <v-list-item-title>{{ $t('forward') }}</v-list-item-title>
                            </v-list-item-content>
                        </v-list-item>
                        <v-list-item @click="markAsJunk(viewing)" :disabled="loading || loadingFlag.length > 0 || downloading !== '' || loadingPreview != ''">
                            <v-list-item-icon>
                                <v-icon>mdi-cancel</v-icon>
                            </v-list-item-icon>
                            <v-list-item-content>
                                <v-list-item-title>{{ $t('mark_junk') }}</v-list-item-title>
                            </v-list-item-content>
                        </v-list-item>
                        <v-list-item @click="deleteMail(viewing)" :disabled="loading || loadingFlag.length > 0 || downloading !== '' || loadingPreview != ''">
                            <v-list-item-icon>
                                <v-icon>mdi-delete-outline</v-icon>
                            </v-list-item-icon>
                            <v-list-item-content>
                                <v-list-item-title>{{ $t('delete') }}</v-list-item-title>
                            </v-list-item-content>
                        </v-list-item>
                    </v-list>
                </v-menu>
                <v-btn icon @click.stop="flagMail(viewing)" small class="float-right mr-1" :title="viewer.flagged ? $t('unflag') : $t('flag')" v-show="!loadingBody" :loading="isLoadingFlag(viewing)" :disabled="isLoadingFlag(viewing)">
                    <v-icon :color="viewer.flagged ? 'primary' : ''">
                        {{ viewer.flagged ? 'mdi-flag' : 'mdi-flag-outline' }}
                    </v-icon>
                </v-btn>
                <v-btn icon @click.stop="sendMail" small class="float-right mr-2" :title="$t('reply')" v-show="!loadingBody">
                    <v-icon>mdi-reply-outline</v-icon>
                </v-btn>
            </h2>
            <v-divider></v-divider>
            <div class="viewer" ref="viewerDom">
                <h1 class="text-subtitle-1 px-5 py-3 mail-view-subject"><span v-if="viewer.subject !== false">{{ viewer.translateState !== 'translated' ? viewer.subject : viewer.translatedSubject }}</span><em v-else>{{ $t('no_subject') }}</em></h1>
                <div v-show="viewer.courseId !== ''" class="subject-subtitle mx-5 text--disabled text-body-2 pb-3 text-truncate">
                    <v-menu
                        :close-on-content-click="false"
                        nudge-bottom="5"
                        transition="slide-y-transition"
                        content-class="large-radius"
                        offset-y
                    >
                        <template v-slot:activator="{ on, attrs }">
                            <span v-on="on" v-bind="attrs">
                                <span :class="subjectColor(viewer.courseId)" class="subject-color-samll"></span>
                                {{ subjectLongNameMap(viewer.courseId) }}
                            </span>
                        </template>
                        <v-card
                            class="mail-course-card"
                            min-width="350px"
                            flat
                        >
                            <v-toolbar
                                color="#ffffff"
                                flat
                            >
                                <v-toolbar-title :class="subjectColor(viewer.courseId) ? `${subjectColor(viewer.courseId).split(' ')[0]}--text${subjectColor(viewer.courseId).split(' ').length > 1 ? ` text--${subjectColor(viewer.courseId).split(' ')[1]}` : ''}` : ''" class="course-name">
                                    {{ subjectLongNameMap(viewer.courseId) }}<br>
                                    <span class="text--disabled course-smaller-font">{{ viewer.courseId }}</span>
                                </v-toolbar-title>
                                <v-spacer></v-spacer>
                                <v-tooltip top v-if="viewer.courseId !== '' && subjectLinks(viewer.courseId).homeLink !== false">
                                    <template v-slot:activator="{ on, attrs }">
                                        <v-btn
                                            icon
                                            small
                                            class="mr-0 ml-2 course-home"
                                            target="_blank"
                                            :href="subjectLinks(viewer.courseId).homeLink"
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
                            <v-card-text :class="{ empty: subjectLinks(viewer.courseId).sessionLinks.length === 0 }">
                                <v-list flat class="list" v-if="viewer.courseId !== '' && subjectLinks(viewer.courseId).sessionLinks.length > 0">
                                    <v-list-item-group>
                                        <v-list-item
                                            v-for="(link, index) in subjectLinks(viewer.courseId).sessionLinks"
                                            :key="`subject-link-${index}`"
                                            :ripple="false"
                                        >
                                            <template>
                                                <v-list-item-content>
                                                    <v-list-item-title>
                                                        <v-btn x-small icon :href="meetingLink(link.link, link.passcode)" :title="ifZoomLink(link.link) ? $t('quick_zoom') : $t('quick_teams')" v-if="ifZoomLink(link.link) || ifTeamsLink(link.link)" class="mr-1 text-decoration-none"><v-icon small>{{ ifTeamsLink(link.link) ? 'mdi-microsoft-teams' : 'mdi-dock-window' }}</v-icon></v-btn><a :href="link.link" target="_blank" rel="noopener nofollow" :class="subjectColor(viewer.courseId) ? `${subjectColor(viewer.courseId).split(' ')[0]}--text${subjectColor(viewer.courseId).split(' ').length > 1 ? ` text--${subjectColor(viewer.courseId).split(' ')[1]}` : ''}` : ''">{{ link.name }}</a><a :href="link.link" target="_blank" rel="noopener nofollow" class="no-underline-link"><v-icon small :color="subjectColor(viewer.courseId) ? subjectColor(viewer.courseId) : ''">mdi-open-in-new</v-icon>
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
                            </v-card-text>
                        </v-card>
                    </v-menu>
                </div>
                <div class="mail-detail mx-5 pa-3 pr-2">
                    <div class="mail-from-line">
                        <v-icon class="mr-1" :title="$t('from')">mdi-account-arrow-right</v-icon>
                        <v-tooltip top v-if="viewer.from && getShortSenderName(viewer.from) !== viewer.fromAddress" open-delay="400">
                            <template v-slot:activator="{ on, attrs }">
                                <v-chip close-icon="mdi-content-copy" close small v-on="on" v-bind="attrs" @click:close="doCopy(viewer.from ? `${viewer.from} <${viewer.fromAddress}>` : viewer.fromAddress)">{{ viewer.from ? getShortSenderName(viewer.from) : viewer.fromAddress }}</v-chip>
                            </template>
                            <span>{{ viewer.fromAddress }}</span>
                        </v-tooltip>
                        <v-chip close-icon="mdi-content-copy" close small v-else @click:close="doCopy(viewer.from ? `${viewer.from} <${viewer.fromAddress}>` : viewer.fromAddress)">{{ viewer.from ? getShortSenderName(viewer.from) : viewer.fromAddress }}</v-chip>
                        <v-btn icon @click.stop="viewDetailExpanded = !viewDetailExpanded" small class="float-right expand-btn" :title="$t('more')">
                            <v-icon :class="{ 'detail-expanded': viewDetailExpanded }">mdi-chevron-down</v-icon>
                        </v-btn>
                    </div>
                    <v-expand-transition>
                        <div class="expand" v-show="viewDetailExpanded">
                            <div class="mail-to-line mt-1">
                                <v-icon class="mt-2 mr-1" :title="$t('to')">mdi-account-arrow-left-outline</v-icon>
                                <span v-for="(item, index) in viewer.to" :key="`to-${index}`" v-show="viewer.to.length > 0">
                                    <v-tooltip top v-if="item.name && getShortSenderName(item.name) !== item.address" open-delay="400">
                                        <template v-slot:activator="{ on, attrs }">
                                            <v-chip close-icon="mdi-content-copy" close small v-on="on" v-bind="attrs" @click:close="doCopy(item.name ? `${item.name} <${item.address}>` : item.address)" class="mr-1 mt-2">{{ item.name ? getShortSenderName(item.name) : item.address }}</v-chip>
                                        </template>
                                        <span>{{ item.address }}</span>
                                    </v-tooltip>
                                    <v-chip close-icon="mdi-content-copy" close small v-else @click:close="doCopy(item.name ? `${item.name} <${item.address}>` : item.address)" class="mr-1 mt-2">{{ item.name ? getShortSenderName(item.name) : item.address }}</v-chip>
                                </span>
                                <v-tooltip top open-delay="400" v-if="!meInList(viewer.to) && !meInList(viewer.cc)">
                                    <template v-slot:activator="{ on, attrs }">
                                        <v-chip small v-on="on" v-bind="attrs" class="mr-1 mt-2 to-me">{{ $t('me') }}</v-chip>
                                    </template>
                                    <span>{{ account.email }}</span>
                                </v-tooltip>
                            </div>
                            <div class="mail-to-line mt-1" v-show="viewer.cc.length > 0">
                                <v-icon class="mt-2 mr-1" :title="$t('cc')">mdi-closed-caption-outline</v-icon>
                                <span v-for="(item, index) in viewer.cc" :key="`to-${index}`">
                                    <v-tooltip top v-if="item.name && getShortSenderName(item.name) !== item.address" open-delay="400">
                                        <template v-slot:activator="{ on, attrs }">
                                            <v-chip close-icon="mdi-content-copy" close small v-on="on" v-bind="attrs" @click:close="doCopy(item.name ? `${item.name} <${item.address}>` : item.address)" class="mr-1 mt-2">{{ item.name ? getShortSenderName(item.name) : item.address }}</v-chip>
                                        </template>
                                        <span>{{ item.address }}</span>
                                    </v-tooltip>
                                    <v-chip close-icon="mdi-content-copy" close small v-else @click:close="doCopy(item.name ? `${item.name} <${item.address}>` : item.address)" class="mr-1 mt-2">{{ item.name ? getShortSenderName(item.name) : item.address }}</v-chip>
                                </span>
                            </div>
                            <div class="mail-time-line mt-1">
                                <span class="text-body-2 mt-2">
                                    <v-icon class="mr-2" :title="$t('time')">mdi-clock-outline</v-icon>
                                    {{ getDate(new Date(viewer.date * 1000)) }}
                                </span>
                            </div>
                            <div class="mail-time-line" v-show="trustedSender(viewer.fromAddress)">
                                <span class="text-body-2 green--text mt-2">
                                    <v-icon class="mr-2" color="green">mdi-check</v-icon>
                                    {{ $t('trusted_sender') }}
                                </span>
                            </div>
                            <div class="mail-time-line" v-show="internalSender(viewer.fromAddress)">
                                <span class="text-body-2 mt-2">
                                    <v-icon class="mr-2">mdi-bank-outline</v-icon>
                                    {{ $t('internal_sender') }}
                                </span>
                            </div>
                        </div>
                    </v-expand-transition>
                </div>
                <div class="mail-detail mx-5 pa-3 pr-2 mt-2" v-show="viewer.attachments.length > 0">
                    <div class="mail-from-line">
                        <span class="text-body-2 mt-2">
                            <v-icon class="mr-1">mdi-paperclip</v-icon>
                            {{ formatString($t('attachment_num'), [viewer.attachments.length]) }}
                        </span>
                        <v-btn icon @click.stop="viewAttachmentExpanded = !viewAttachmentExpanded" small class="float-right expand-btn" :title="$t('expand')">
                            <v-icon :class="{ 'detail-expanded': viewAttachmentExpanded }">mdi-chevron-down</v-icon>
                        </v-btn>
                    </div>
                    <v-expand-transition>
                        <div class="expand attachment-list" v-show="viewAttachmentExpanded">
                            <div class="d-flex flex-wrap mt-1">
                                <div class="attachment-item d-flex justify-space-between align-center mt-2 mr-2" v-for="(file, index) in viewer.attachments" :key="`attachment-${file[0]}-${index}`" :class="{ 'full-width': viewer.attachments.length === 1, 'can-preview': canPreview(file[0], file[1]), 'loading-preview': loadingPreview === `${viewing}-${file[0]}` }">
                                    <v-icon class="ml-2 mr-1 file-ext">{{ `mdi-${getFileIcon(file[0])}` }}</v-icon>
                                    <v-btn icon small @click="downloadFile(viewing, file[0], file[1], 'preview')" class="preview-btn" v-if="canPreview(file[0], file[1])" :title="$t('preview')" :loading="loadingPreview === `${viewing}-${file[0]}`" :disabled="downloading !== '' || loadingPreview != ''">
                                        <v-icon>mdi-eye</v-icon>
                                        <template v-slot:loader>
                                            <v-progress-circular
                                                indeterminate
                                                color="grey"
                                                :width="2"
                                                :size="20"
                                                v-show="downloadProgress < 5"
                                            ></v-progress-circular>
                                            <v-progress-circular
                                                color="primary"
                                                class="rotating"
                                                :rotate="-90"
                                                :width="2.3"
                                                :size="20"
                                                :value="downloadProgress"
                                                v-show="downloadProgress >= 5"
                                            ></v-progress-circular>
                                        </template>
                                    </v-btn>
                                    <div class="text-body-2 file-name text-truncate" :title="file[0]">{{ file[0] }}<div class="text--disabled text-caption">{{ formatBytes(file[1]) }}</div></div>
                                    <v-btn icon @click="downloadFile(viewing, file[0], file[1], 'download')" small class="mr-1" :loading="downloading === `${viewing}-${file[0]}`" :disabled="downloading !== '' || loadingPreview != ''">
                                        <v-icon small>mdi-arrow-collapse-down</v-icon>
                                        <template v-slot:loader>
                                            <v-progress-circular
                                                indeterminate
                                                color="grey"
                                                :width="2"
                                                :size="20"
                                                v-show="downloadProgress < 5"
                                            ></v-progress-circular>
                                            <v-progress-circular
                                                color="primary"
                                                class="rotating"
                                                :rotate="-90"
                                                :width="2.3"
                                                :size="20"
                                                :value="downloadProgress"
                                                v-show="downloadProgress >= 5"
                                            ></v-progress-circular>
                                        </template>
                                    </v-btn>
                                </div>
                            </div>
                        </div>
                    </v-expand-transition>
                </div>
                <div class="mail-translation mx-5 pa-3 pr-2 mt-2" v-if="translateEnabled && viewer.translator && viewer.textContent !== '' && viewer.sourceLang !== 'und' && languageMap[viewer.sourceLang] && viewer.sourceLang !== preferredTranslateTo[0] && preferredTranslateTo[1][viewer.translator] !== false && !(!loadingBody && (!trustedSender(viewer.fromAddress) && !normalSender(viewer.fromAddress) && !internalSender(viewer.fromAddress)) && !viewer.allowHTML && viewer.bodyRawHTML !== '')">
                    <div class="translation-notice">
                        <v-icon class="mr-2">mdi-translate</v-icon>
                        <span class="text-body-2">{{ formatString($t('in_language'), [Array.isArray(languageMap[viewer.sourceLang]) ? $t(`lang_${viewer.sourceLang}`) : $t(`lang_${languageMap[viewer.sourceLang].locale}`)]) }}</span>
                        <v-btn icon @click.stop="viewTranslationExpanded = !viewTranslationExpanded" small class="float-right expand-btn" :title="$t('more')">
                            <v-icon :class="{ 'detail-expanded': viewTranslationExpanded }">mdi-chevron-down</v-icon>
                        </v-btn>
                    </div>
                    <v-expand-transition>
                        <div class="expand" v-show="viewTranslationExpanded">
                            <div class="d-flex">
                                <v-autocomplete
                                    class="translate-from mt-4 mr-1 flex-grow-1"
                                    v-model="viewer.translateFrom"
                                    outlined
                                    dense
                                    hide-details
                                    item-value="code"
                                    item-text="name"
                                    :items="translateFromList(viewer.translator)"
                                    :label="$t('translate_from')"
                                    :no-data-text="$t('no_language')"
                                    :key="`lang-from-${locale}`"
                                    :disabled="viewer.translateState !== 'source'"
                                    :menu-props="{
                                        closeOnClick: false,
                                        closeOnContentClick: false,
                                        disableKeys: true,
                                        openOnClick: false,
                                        maxHeight: 304,
                                        offsetY: true,
                                        offsetOverflow: true,
                                        transition: 'slide-y-transition'
                                    }"
                                ></v-autocomplete>
                                <v-text-field
                                    class="translate-to mt-4 ml-1 mr-1 flex-grow-1"
                                    outlined
                                    dense
                                    hide-details
                                    :readonly="viewer.translateState === 'source'"
                                    :disabled="viewer.translateState !== 'source'"
                                    :value="this.$t(`lang_${preferredTranslateTo[1].locale}`)"
                                    :label="$t('translate_to')"
                                ></v-text-field>
                            </div>
                            <div class="d-flex justify-space-between align-center mt-2">
                                <span class="text--disabled text-body-2 d-inline-block mt-1">
                                    <v-icon small class="text--disabled service-icon" v-if="viewer.translator !== 'deepl'">{{ viewer.translator === 'azure' ? 'mdi-microsoft-azure' : 'mdi-google-translate' }}</v-icon><svg class="deepl-logo" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 54 68" v-else><path class="deepl-bg" d="M.188 17.274v26.81c0 1.393.73 2.67 1.921 3.367l23.063 13.386a3.797 3.797 0 003.844 0L52.078 47.45A3.887 3.887 0 0054 44.085v-26.81c0-1.394-.73-2.67-1.922-3.367L29.016.522a3.797 3.797 0 00-3.844 0L2.109 13.947a3.871 3.871 0 00-1.921 3.327z"/><path class="deepl-bg" d="M36.703 67.53l-.038-5.803.038-5.339-13.453 3.327"/><path class="deepl-bg" d="M36.088 55.924l2.537-.658-.961.542c-.577.348-.961.967-.961 1.663v1.084l-.615-2.631z"/><path class="deepl-line" d="M17.79 18.474a3.95 3.95 0 015.535 0 4.016 4.016 0 010 5.804 3.95 3.95 0 01-5.535 0 4.016 4.016 0 010-5.804zM35.087 28.572a3.95 3.95 0 015.535 0 4.016 4.016 0 010 5.803 3.95 3.95 0 01-5.535 0 4.016 4.016 0 010-5.803zM17.79 39.25a3.95 3.95 0 015.535 0 4.016 4.016 0 010 5.803 3.95 3.95 0 01-5.535 0 4.016 4.016 0 010-5.803z"/><path class="deepl-line" d="M22.48 23.542l11.532 6.693 1.922-1.083-11.532-6.732-1.922 1.122zM34.78 35.148l-10.378 6.035-1.922-1.121 10.379-5.997 1.922 1.083z"/></svg>{{ formatString($t('powered_by'), [(viewer.translator === 'azure' ? 'Microsoft Azure' : (viewer.translator === 'google' ? 'Google' : 'DeepL'))]) }}
                                </span>
                                <v-btn
                                    text
                                    small
                                    color="primary"
                                    class="mr-1 mb-n1"
                                    @click="translateMail"
                                    :loading="viewer.translateState === 'loading'"
                                    :disabled="viewer.translateState === 'loading'"
                                    v-if="viewer.translateState !== 'translated'"
                                >{{ $t('translate') }}</v-btn>
                                <v-btn
                                    text
                                    small
                                    color="primary"
                                    class="mr-1 mb-n1"
                                    @click="restoreMail"
                                    v-else
                                >{{ $t('source') }}</v-btn>
                            </div>
                        </div>
                    </v-expand-transition>
                </div>
                <v-skeleton-loader
                    class="mx-auto"
                    type="list-item-three-line, list-item-two-line"
                    v-show="loadingBody || (!((!trustedSender(viewer.fromAddress) && !normalSender(viewer.fromAddress) && !internalSender(viewer.fromAddress)) && !viewer.allowHTML) && sandboxHeight < 10)"
                ></v-skeleton-loader>
                <v-alert
                    text
                    dense
                    color="red"
                    icon="mdi-shield-alert-outline"
                    class="mx-5 mt-2 mb-0"
                    v-show="!(loadingBody || (!((!trustedSender(viewer.fromAddress) && !normalSender(viewer.fromAddress) && !internalSender(viewer.fromAddress)) && !viewer.allowHTML) && sandboxHeight < 10)) && (viewer.untrust && !trustedSender(viewer.fromAddress))"
                >
                    {{ $t('untrusted_content') }}
                    <div class="d-flex flex-row-reverse flex-wrap-reverse mt-1">
                        <v-btn
                            outlined
                            small
                            color="red"
                            class="my-1 ml-2"
                            :disabled="loading || loadingFlag.length > 0 || downloading !== '' || loadingPreview != ''"
                            @click="markAsJunk(viewing)"
                        >
                            {{ $t('mark_junk') }}
                        </v-btn>
                        <v-btn
                            outlined
                            small
                            color="red"
                            class="my-1"
                            @click="viewer.untrust = false"
                        >
                            {{ $t('this_is_safe') }}
                        </v-btn>
                    </div>
                </v-alert>
                <div v-show="!loadingBody && (!trustedSender(viewer.fromAddress) && !normalSender(viewer.fromAddress) && !internalSender(viewer.fromAddress)) && !viewer.allowHTML && viewer.bodyRawHTML !== ''">
                    <v-alert
                        text
                        dense
                        color="orange"
                        icon="mdi-shield-alert-outline"
                        class="mx-5 mt-2 mb-0"
                    >
                        {{ $t('unsafe_content') }}
                        <div class="d-flex flex-row-reverse mt-1">
                            <v-btn
                                outlined
                                small
                                color="orange"
                                class="my-1"
                                @click="viewer.allowHTML = true"
                            >
                                {{ $t('this_is_safe') }}
                            </v-btn>
                        </div>
                    </v-alert>
                    <div class="body-text ma-5 mb-5">{{ viewer.bodyText }}</div>
                </div>
                <iframe
                    v-show="!loadingBody && !((!trustedSender(viewer.fromAddress) && !normalSender(viewer.fromAddress) && !internalSender(viewer.fromAddress)) && !viewer.allowHTML)"
                    class="sandbox ma-5 mt-4"
                    frameborder="0"
                    ref="sandbox"
                    allowtransparency="true"
                    sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox"
                    :title="$t('mail_body')"
                    :srcdoc="viewer.translateState !== 'translated' ? (((!trustedSender(viewer.fromAddress) && !normalSender(viewer.fromAddress) && !internalSender(viewer.fromAddress)) && !viewer.allowHTML) ? '' : viewer.bodyHTML) : viewer.translatedBody"
                    :height="`${sandboxHeight < 10 ? 0 : (sandboxHeight + 16)}px`"
                    @load="updateSandboxHeight"
                />
            </div>
        </div>
        <div class="editor-layer-mask" :class="{ opened: layerOpened }"></div>
        <div class="editor-layer" :class="{ opened: layerOpened }">
            <h2 class="handle">
                <v-icon class="mr-3 md-icon" :title="$t('md_support')">
                    mdi-language-markdown
                </v-icon>
                <input type="text" v-model.trim="editingSubject" class="title-input" :placeholder="$t('no_subject')">
                <v-btn icon @click.stop="layerOpened = false" small class="float-right mr-4" :title="$t('close')">
                    <v-icon>mdi-close</v-icon>
                </v-btn>
                <v-btn icon @click.stop="mode = 'view'" small class="float-right mr-1" :title="$t('send')" :disabled="(editingTo.length === 0 && editingCc.length === 0)">
                    <v-icon>mdi-send</v-icon>
                </v-btn>
                <v-btn icon @click.stop="mode = 'view'" v-show="mode === 'edit'" small class="float-right mr-2" :title="$t('view')">
                    <v-icon>mdi-eye</v-icon>
                </v-btn>
                <v-btn icon @click.stop="mode = 'edit'" v-show="mode === 'view'" small class="float-right mr-2" :title="$t('edit')">
                    <v-icon>mdi-pencil-outline</v-icon>
                </v-btn>
            </h2>
            <v-divider></v-divider>
            <div class="all-height" v-show="mode === 'edit'">
                <v-combobox
                    v-model="editingTo"
                    :items="mailHostListTo"
                    :search-input.sync="editingToInput"
                    :title="$t('to')"
                    multiple
                    small-chips
                    deletable-chips
                    hide-details
                    hide-no-data
                    auto-select-first
                    hide-selected
                    prepend-inner-icon="mdi-account-arrow-left-outline"
                    class="send-mail-input"
                    ref="from"
                    @input="checkEmail('editingTo')"
                    @keydown="(e) => checkUnlistedEmail('editingTo', e)"
                    @blur="checkUnlistedEmailOnBlur('editingTo')"
                ></v-combobox>
                <v-divider></v-divider>
                <v-combobox
                    v-model="editingCc"
                    :items="mailHostListCc"
                    :search-input.sync="editingCcInput"
                    :title="$t('cc')"
                    multiple
                    small-chips
                    deletable-chips
                    hide-details
                    hide-no-data
                    auto-select-first
                    hide-selected
                    prepend-inner-icon="mdi-closed-caption-outline"
                    class="send-mail-input"
                    ref="ccInput"
                    @input="checkEmail('editingCc')"
                    @keydown="(e) => checkUnlistedEmail('editingCc', e)"
                    @blur="checkUnlistedEmailOnBlur('editingCc')"
                ></v-combobox>
                <v-divider></v-divider>
                <codemirror v-model="code" :options="cmOption" class="md-editor" :key="cmRefresh" ref="codemirror"></codemirror>
            </div>
            <div class="render-result" v-show="mode === 'view'" ref="renderScroll"><div ref="render"></div></div>
            <div class="expand-layer-mask" :class="{ clickable: expandLayerOpened }" ref="expandLayerMask"></div>
            <div class="expand-layer" ref="expandLayer" :class="{ animation: !isDargging }" @dragover.prevent @drop.prevent>
                <h2 @mousedown="dragMouseDown" @touchstart.prevent="dragTouchStart" @mousewheel.prevent="onMouseWheel"><div class="expand-handle"></div></h2>
                <v-tabs
                    v-model="expandTab"
                    height="42"
                    background-color="transparent"
                    color="primary"
                    fixed-tabs
                >
                    <v-tab>{{ $t('attachment') }}</v-tab>
                    <v-tab>{{ $t('reply_forward') }}</v-tab>
                </v-tabs>
                <v-tabs-items v-model="expandTab">
                    <v-tab-item class="expand-tab-item pa-5" :class="{ 'drag-over': isDragOver }" @dragover="isDragOver = true">
                        <div class="drop-layer" @dragleave="isDragOver = false" @drop="handleFileDrop">
                            <v-icon x-large color="primary" class="mb-3">mdi-file-hidden</v-icon>
                            <span class="primary--text">{{ $t('drop_file') }}</span>
                        </div>
                        <v-btn
                            text
                            block
                            color="primary"
                            class="add-btn"
                            @click="$refs.attachmentInput.click()"
                        >
                            <v-icon class="mr-2">mdi-plus-circle-outline</v-icon>
                            {{ $t('add_attachment') }}
                        </v-btn>
                        <input type="file" multiple id="add-attachment" name="add-attachment" class="d-none" ref="attachmentInput" @change="handleFileInput">
                        <div class="attachment-add-list">
                            <div class="attachment-add-item d-flex justify-space-between align-center mt-2" v-for="(file, index) in editingAttachments" :key="`attachment-add--${index}`">
                                <v-icon class="ml-3 mr-3">{{ `mdi-${getFileIcon(file.name)}` }}</v-icon>
                                <div class="text-body-2 file-name text-truncate" :title="file.name">{{ file.name }}<div class="text--disabled text-caption">{{ formatBytes(file.size) }}</div></div>
                                <v-btn icon @click="removeAttachment(index)" small class="mr-3">
                                    <v-icon>mdi-delete-outline</v-icon>
                                    <template v-slot:loader>
                                        <v-progress-circular
                                            indeterminate
                                            color="grey"
                                            :width="2"
                                            :size="20"
                                            v-show="true"
                                        ></v-progress-circular>
                                        <v-progress-circular
                                            color="primary"
                                            class="rotating"
                                            :rotate="-90"
                                            :width="2.3"
                                            :size="20"
                                            :value="0"
                                            v-show="false"
                                        ></v-progress-circular>
                                    </template>
                                </v-btn>
                            </div>
                        </div>
                    </v-tab-item>
                    <v-tab-item class="expand-tab-item pa-5">
                        <div class="not-reply"><span class="text--disabled">{{ $t('not_reply_forward') }}</span></div>
                    </v-tab-item>
                </v-tabs-items>
                <div class="background-filler"></div>
            </div>
        </div>
        <v-menu
            v-model="listMenu"
            :position-x="listMenuX"
            :position-y="listMenuY"
            absolute
            offset-y
            close-on-click
            close-on-content-click
        >
            <v-list class="mail-menu-list">
                <v-list-item v-show="isUnseen(selectedId)" @click="markAsRead(selectedId)" :disabled="loading || loadingFlag.length > 0 || downloading !== '' || loadingPreview != ''">
                    <v-list-item-icon>
                        <v-icon>mdi-email-open-outline</v-icon>
                    </v-list-item-icon>
                    <v-list-item-content>
                        <v-list-item-title>{{ $t('mark_seen') }}</v-list-item-title>
                    </v-list-item-content>
                </v-list-item>
                <v-list-item @click="flagMail(selectedId)" :disabled="loading || loadingFlag.length > 0 || downloading !== '' || loadingPreview != ''">
                    <v-list-item-icon>
                        <v-icon :color="isFlagged(selectedId) ? 'primary' : ''" v-show="!isLoadingFlag(selectedId)">
                            {{ isFlagged(selectedId) ? 'mdi-flag' : 'mdi-flag-outline' }}
                        </v-icon>
                        <v-progress-circular
                            indeterminate
                            color="grey"
                            :width="2"
                            :size="22"
                             v-show="isLoadingFlag(selectedId)"
                        ></v-progress-circular>
                    </v-list-item-icon>
                    <v-list-item-content>
                        <v-list-item-title>{{ isFlagged(selectedId) ? $t('unflag') : $t('flag') }}</v-list-item-title>
                    </v-list-item-content>
                </v-list-item>
                <v-list-item @click="markAsJunk(selectedId)" :disabled="loading || loadingFlag.length > 0 || downloading !== '' || loadingPreview != ''">
                    <v-list-item-icon>
                        <v-icon>mdi-cancel</v-icon>
                    </v-list-item-icon>
                    <v-list-item-content>
                        <v-list-item-title>{{ $t('mark_junk') }}</v-list-item-title>
                    </v-list-item-content>
                </v-list-item>
                <v-list-item @click="deleteMail(selectedId)" :disabled="loading || loadingFlag.length > 0 || downloading !== '' || loadingPreview != ''">
                    <v-list-item-icon>
                        <v-icon>mdi-delete-outline</v-icon>
                    </v-list-item-icon>
                    <v-list-item-content>
                        <v-list-item-title>{{ $t('delete') }}</v-list-item-title>
                    </v-list-item-content>
                </v-list-item>
            </v-list>
        </v-menu>
        <previewer :content="previewerConfig.content" :blob="previewerConfig.blob" :type="previewerConfig.type" :name="previewerConfig.name" :icon="previewerConfig.icon" ref="filePreviewer"></previewer>
        <v-dialog
            v-model="tooManyAttachments"
            max-width="400"
            persistent
        >
            <v-card>
                <v-card-title class="headline">
                    {{ $t('too_many_attachments') }}
                </v-card-title>
                <v-card-text>
                    {{ $t('too_many_attachments_body') }}
                </v-card-text>
                <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn
                        color="primary"
                        text
                        @click="tooManyAttachments = false"
                    >
                        {{ $t('ok') }}
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
        <v-dialog
            v-model="translateSettingsDialog"
            max-width="500"
            content-class="translate-settings"
            persistent
        >
            <v-card>
                <v-card-title class="headline">
                    {{ $t('translation_settings') }}
                </v-card-title>
                <v-card-text>
                    <div>
                        <v-switch
                            v-model="editingTranslateEnabled"
                            :label="$t('enable_translate')"
                        ></v-switch>
                    </div>
                    <p class="text--disabled">{{ $t('translation_tip') }}</p>
                    <v-autocomplete
                        class="mt-8 mb-4"
                        v-model="editingPreferredTranslateTo"
                        outlined
                        dense
                        hide-details
                        item-value="code"
                        item-text="name"
                        prepend-inner-icon="mdi-translate"
                        :items="preferredLanguageList"
                        :label="$t('translate_to_language')"
                        :no-data-text="$t('no_language')"
                        :key="`preferred-lang-to-${locale}`"
                        :disabled="!editingTranslateEnabled"
                        :menu-props="{
                            closeOnClick: false,
                            closeOnContentClick: false,
                            disableKeys: true,
                            openOnClick: false,
                            maxHeight: 304,
                            offsetY: true,
                            offsetOverflow: true,
                            transition: 'slide-y-transition'
                        }"
                    ></v-autocomplete>
                    <p class="text--disabled mb-2" v-show="editingPreferredTranslateTo && editingPreferredTranslateTo[1] && (editingPreferredTranslateTo[1].google === false || editingPreferredTranslateTo[1].azure === false || editingPreferredTranslateTo[1].deepl === false)">{{ $t('language_unsupported_tip') }}</p>
                    <p class="text--disabled mb-0">{{ $t('language_tip') }}</p>
                </v-card-text>
                <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn
                        text
                        @click="translateSettingsDialog = false"
                    >
                        {{ $t('cancel') }}
                    </v-btn>
                    <v-btn
                        color="primary"
                        text
                        @click="saveTranslationSettingsDialog"
                    >
                        {{ $t('save') }}
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
import localForage from 'localforage';
import markdown from 'markdown-it';
import franc from 'franc-min';

import mdSub from 'markdown-it-sub';
import mdSup from 'markdown-it-sup';
import mdSpan from 'markdown-it-bracketed-spans';
import mdAttrs from 'markdown-it-attrs';
import mdTable from 'markdown-it-multimd-table';
import mdContainer from 'markdown-it-container';

import 'codemirror/mode/markdown/markdown';
import 'codemirror/addon/selection/active-line';
import 'codemirror/addon/edit/closebrackets';
import 'codemirror/addon/edit/matchbrackets';

import previewer from '@/components/previewer.vue';

import checkResponse from '@/mixins/checkResponse';
import liveLinks from '@/mixins/liveLinks';
import clipboard from '@/mixins/clipboard';
import scroll from '@/mixins/scroll';

import betterFetch from '@/tools/betterFetch';
import fetchDownload from '@/tools/fetchDownload';
import formatDateTime from '@/tools/formatDateTime';
import debounce from '@/tools/debounce';
import { mailCss, mailDarkCss, mailTextCss } from '@/tools/mailCss';

import 'codemirror/theme/xq-light.css';
import 'codemirror/lib/codemirror.css';

export default {
    name: 'mail',
    components: {
        codemirror,
        previewer,
    },
    mixins: [checkResponse, liveLinks, clipboard, scroll],
    data() {
        return {
            loading: false,
            loadingBody: false,
            loadingFlag: [],
            downloading: '',
            downloadProgress: 0,
            loadingPreview: '',
            mails: [],
            ifNotify: [0],
            layerOpened: false,
            viewerOpened: false,
            expandLayerOpened: false,
            isDargging: false,
            mouseMoveOrigin: 0,
            editingSubject: '',
            editingTo: [],
            editingCc: [],
            editingToInput: null,
            editingCcInput: null,
            mailHostListTo: [],
            mailHostListCc: [],
            backupInput: '',
            backupList: [],
            useBackup: false,
            expandTab: 0,
            isDragOver: false,
            editingAttachments: [],
            editingAttachmentsSize: 0,
            tooManyAttachments: false,
            mode: 'view',
            md: null,
            init: false,
            isSettingSound: false,
            cmRefresh: `${new Date().valueOf()}`,
            code: '',
            timer: null,
            keyMin: '',
            refreshLoding: false,
            justUpdated: false,
            viewing: -1,
            viewDetailExpanded: false,
            viewAttachmentExpanded: false,
            viewTranslationExpanded: false,
            sandboxHeight: 0,
            listMenu: false,
            listMenuX: 0,
            listMenuY: 0,
            selectedId: -1,
            cachedMails: [],
            cachedAttachments: [],
            translateSettingsDialog: false,
            translateEnabled: true,
            preferredTranslateTo: null,
            editingTranslateEnabled: true,
            editingPreferredTranslateTo: null,
            fileIconMap: {
                pdf: 'file-pdf-outline',
                zip: 'zip-box-outline',
                rar: 'zip-box-outline',
                '7z': 'zip-box-outline',
                gz: 'zip-box-outline',
                tar: 'zip-box-outline',
                mp4: 'play-box-outline',
                m4v: 'play-box-outline',
                webm: 'play-box-outline',
                flv: 'play-box-outline',
                ogv: 'play-box-outline',
                mpeg: 'play-box-outline',
                avi: 'play-box-outline',
                mov: 'play-box-outline',
                mp3: 'music-note-outline',
                wav: 'music-note-outline',
                flac: 'music-note-outline',
                ape: 'music-note-outline',
                dsd: 'music-note-outline',
                ogg: 'music-note-outline',
                oga: 'music-note-outline',
                aac: 'music-note-outline',
                jpg: 'image',
                jpeg: 'image',
                png: 'image',
                bmp: 'image',
                gif: 'image',
                webp: 'image',
                nef: 'image',
                raw: 'image',
                ppt: 'microsoft-powerpoint',
                pptx: 'microsoft-powerpoint',
                pptm: 'microsoft-powerpoint',
                pps: 'microsoft-powerpoint',
                ppsx: 'microsoft-powerpoint',
                ppsm: 'microsoft-powerpoint',
                pot: 'microsoft-powerpoint',
                potx: 'microsoft-powerpoint',
                potm: 'microsoft-powerpoint',
                doc: 'microsoft-word',
                docx: 'microsoft-word',
                docm: 'microsoft-word',
                dot: 'microsoft-word',
                dotx: 'microsoft-word',
                dotm: 'microsoft-word',
                xls: 'microsoft-excel',
                xlsx: 'microsoft-excel',
                xlsm: 'microsoft-excel',
                xlsb: 'microsoft-excel',
                xlt: 'microsoft-excel',
                xltx: 'microsoft-excel',
                xltm: 'microsoft-excel',
                txt: 'file-document-outline',
                py: 'language-python',
                pyc: 'language-python',
                java: 'language-java',
                jar: 'language-java',
                class: 'language-java',
                js: 'language-javascript',
                mjs: 'language-javascript',
                ts: 'language-typescript',
                json: 'code-json',
                c: 'language-c',
                h: 'language-c',
                cpp: 'language-cpp',
                hpp: 'language-cpp',
                r: 'language-r',
                rs: 'language-rust',
                go: 'language-go',
                hs: 'language-haskell',
                lhs: 'language-haskell',
                sass: 'sass',
                scss: 'sass',
                lua: 'language-lua',
                rb: 'language-ruby',
                erb: 'language-ruby',
                gemfile: 'language-ruby',
                html: 'language-html5',
                htm: 'language-html5',
                xml: 'xml',
                md: 'language-markdown-outline',
                php: 'language-php',
                css: 'language-css3',
                vue: 'vuejs',
                dockerfile: 'docker',
                dockerignore: 'docker',
                gitignore: 'git',
                npmignore: 'npm',
                psd: 'drawing-box',
                svg: 'svg',
                woff: 'format-size',
                woff2: 'format-size',
                ttf: 'format-size',
                otf: 'format-size',
                vsix: 'microsoft-visual-studio-code',
                csv: 'file-table-outline',
                sql: 'database-search',
                ipynb: 'notebook-outline',
                yml: 'file-cog-outline',
                yaml: 'file-cog-outline',
                conf: 'file-cog-outline',
                exe: 'console-line',
                apk: 'android',
                dmg: 'package-down',
                deb: 'debian',
                ics: 'calendar-month-outline',
                c4d: 'cube-outline',
                fbx: 'cube-outline',
                tex: 'format-text',
                dtx: 'format-text',
                ins: 'format-text',
                sty: 'format-text',
            },
            previewMap: {
                png: 'image',
                jpg: 'image',
                jpeg: 'image',
                bmp: 'image',
                gif: 'image',
                webp: 'image',
                svg: 'svg',
                mp3: 'audio',
                wav: 'audio',
                ogg: 'audio',
                oga: 'audio',
                aac: 'audio',
                flac: 'audio',
                mp4: 'video',
                m4v: 'video',
                ogv: 'video',
                webm: 'video',
                pdf: 'pdf',
                csv: 'csv',
                txt: 'text',
                dockerignore: 'text',
                gitignore: 'text',
                npmignore: 'text',
                md: 'markdown',
                dockerfile: 'code',
                js: 'code',
                py: 'code',
                php: 'code',
                sh: 'code',
                c: 'code',
                cpp: 'code',
                css: 'code',
                go: 'code',
                html: 'code',
                htm: 'code',
                xml: 'code',
                vue: 'code',
                hs: 'code',
                json: 'code',
                java: 'code',
                tex: 'code',
                dtx: 'code',
                ins: 'code',
                sty: 'code',
                lisp: 'code',
                lua: 'code',
                rs: 'code',
                ts: 'code',
                v: 'code',
                rb: 'code',
                sql: 'code',
                less: 'code',
                scss: 'code',
                yml: 'code',
                yaml: 'code',
            },
            viewer: {
                subject: '',
                from: false,
                fromAddress: '',
                to: [],
                cc: [],
                date: 0,
                flagged: false,
                bodyHTML: '',
                bodyRawHTML: '',
                bodyText: '',
                plainContent: '',
                textContent: '',
                allowHTML: false,
                untrust: false,
                attachments: [],
                courseId: '',
                sourceLang: 'und',
                translateFrom: 'auto',
                translateState: 'source',
                translated: false,
                translatedSubject: '',
                translatedBody: '',
                translatedBodyRaw: '',
                translator: false,
            },
            languageMap: {
                cmn: [
                    {
                        locale: 'zh',
                        direction: 'ltr',
                        deepl: 'ZH',
                        google: 'zh-CN',
                        azure: 'zh-Hans',
                    },
                    {
                        locale: 'zh_tw',
                        direction: 'ltr',
                        deepl: false,
                        google: 'zh-TW',
                        azure: 'zh-Hant',
                    },
                ],
                spa: {
                    locale: 'es',
                    direction: 'ltr',
                    deepl: 'ES',
                    google: 'es',
                    azure: 'es',
                },
                eng: {
                    locale: 'en',
                    direction: 'ltr',
                    deepl: 'EN',
                    google: 'en',
                    azure: 'en',
                },
                rus: {
                    locale: 'ru',
                    direction: 'ltr',
                    deepl: 'RU',
                    google: 'ru',
                    azure: 'ru',
                },
                arb: {
                    locale: 'ar',
                    direction: 'rtl',
                    deepl: false,
                    google: 'ar',
                    azure: 'ar',
                },
                ben: {
                    locale: 'bn',
                    direction: 'ltr',
                    deepl: false,
                    google: 'bn',
                    azure: 'bn',
                },
                hin: {
                    locale: 'hi',
                    direction: 'ltr',
                    deepl: false,
                    google: 'hi',
                    azure: 'hi',
                },
                por: [
                    {
                        locale: 'pt_pt',
                        direction: 'ltr',
                        deepl: 'PT',
                        google: 'pt',
                        azure: 'pt-PT',
                    },
                    {
                        locale: 'pt',
                        direction: 'ltr',
                        deepl: 'PT',
                        google: 'pt',
                        azure: 'pt',
                    },
                ],
                ind: {
                    locale: 'id',
                    direction: 'ltr',
                    deepl: false,
                    google: 'id',
                    azure: 'id',
                },
                jpn: {
                    locale: 'ja',
                    direction: 'ltr',
                    deepl: 'JA',
                    google: 'ja',
                    azure: 'ja',
                },
                fra: {
                    locale: 'fr',
                    direction: 'ltr',
                    deepl: 'FR',
                    google: 'fr',
                    azure: 'fr',
                },
                deu: {
                    locale: 'de',
                    direction: 'ltr',
                    deepl: 'DE',
                    google: 'de',
                    azure: 'de',
                },
                jav: {
                    locale: 'jv',
                    direction: 'ltr',
                    deepl: false,
                    google: 'jv',
                    azure: false,
                },
                kor: {
                    locale: 'ko',
                    direction: 'ltr',
                    deepl: false,
                    google: 'ko',
                    azure: 'ko',
                },
                tel: {
                    locale: 'te',
                    direction: 'ltr',
                    deepl: false,
                    google: 'te',
                    azure: 'te',
                },
                vie: {
                    locale: 'vi',
                    direction: 'ltr',
                    deepl: false,
                    google: 'vi',
                    azure: 'vi',
                },
                mar: {
                    locale: 'mr',
                    direction: 'ltr',
                    deepl: false,
                    google: 'mr',
                    azure: 'mr',
                },
                ita: {
                    locale: 'it',
                    direction: 'ltr',
                    deepl: 'IT',
                    google: 'it',
                    azure: 'it',
                },
                tam: {
                    locale: 'ta',
                    direction: 'ltr',
                    deepl: false,
                    google: 'ta',
                    azure: 'ta',
                },
                tur: {
                    locale: 'tr',
                    direction: 'ltr',
                    deepl: false,
                    google: 'tr',
                    azure: 'tr',
                },
                urd: {
                    locale: 'ur',
                    direction: 'rtl',
                    deepl: false,
                    google: 'ur',
                    azure: 'ur',
                },
                guj: {
                    locale: 'gu',
                    direction: 'ltr',
                    deepl: false,
                    google: 'gu',
                    azure: 'gu',
                },
                pol: {
                    locale: 'pl',
                    direction: 'ltr',
                    deepl: 'PL',
                    google: 'pl',
                    azure: 'pl',
                },
                ukr: {
                    locale: 'uk',
                    direction: 'ltr',
                    deepl: false,
                    google: 'uk',
                    azure: 'it',
                },
                fas: {
                    locale: 'fa',
                    direction: 'rtl',
                    deepl: false,
                    google: 'fa',
                    azure: 'fa',
                },
                kan: {
                    locale: 'kn',
                    direction: 'ltr',
                    deepl: false,
                    google: 'kn',
                    azure: 'kn',
                },
                mal: {
                    locale: 'ml',
                    direction: 'ltr',
                    deepl: false,
                    google: 'ml',
                    azure: 'ml',
                },
                mya: {
                    locale: 'my',
                    direction: 'ltr',
                    deepl: false,
                    google: 'my',
                    azure: 'my',
                },
                ori: {
                    locale: 'or',
                    direction: 'ltr',
                    deepl: false,
                    google: 'or',
                    azure: 'or',
                },
                swh: {
                    locale: 'sw',
                    direction: 'ltr',
                    deepl: false,
                    google: 'sw',
                    azure: 'sw',
                },
                sun: {
                    locale: 'su',
                    direction: 'ltr',
                    deepl: false,
                    google: 'su',
                    azure: false,
                },
                ron: {
                    locale: 'ro',
                    direction: 'ltr',
                    deepl: 'RO',
                    google: 'ro',
                    azure: 'ro',
                },
                pan: {
                    locale: 'pa',
                    direction: 'ltr',
                    deepl: false,
                    google: 'pa',
                    azure: 'pa',
                },
                amh: {
                    locale: 'am',
                    direction: 'ltr',
                    deepl: false,
                    google: 'am',
                    azure: 'am',
                },
                hau: {
                    locale: 'ha',
                    direction: 'ltr',
                    deepl: false,
                    google: 'ha',
                    azure: false,
                },
                bos: {
                    locale: 'bs',
                    direction: 'ltr',
                    deepl: false,
                    google: 'bs',
                    azure: 'bs',
                },
                hrv: {
                    locale: 'hr',
                    direction: 'ltr',
                    deepl: false,
                    google: 'hr',
                    azure: 'hr',
                },
                nld: {
                    locale: 'nl',
                    direction: 'ltr',
                    deepl: 'NL',
                    google: 'nl',
                    azure: 'nl',
                },
                srp: [
                    {
                        locale: 'sr_cy',
                        direction: 'ltr',
                        deepl: false,
                        google: 'sr',
                        azure: 'sr-Cyrl',
                    },
                    {
                        locale: 'sr_la',
                        direction: 'ltr',
                        deepl: false,
                        google: 'sr',
                        azure: 'sr-Latn',
                    },
                ],
                tha: {
                    locale: 'th',
                    direction: 'ltr',
                    deepl: false,
                    google: 'th',
                    azure: 'th',
                },
                ckb: {
                    locale: 'ku',
                    direction: 'rtl',
                    deepl: false,
                    google: 'ku',
                    azure: 'ku',
                },
                yor: {
                    locale: 'yo',
                    direction: 'ltr',
                    deepl: false,
                    google: 'yo',
                    azure: false,
                },
                hun: {
                    locale: 'hu',
                    direction: 'ltr',
                    deepl: 'HU',
                    google: 'hu',
                    azure: 'hu',
                },
                ell: {
                    locale: 'el',
                    direction: 'ltr',
                    deepl: 'EL',
                    google: 'el',
                    azure: 'el',
                },
                ces: {
                    locale: 'cs',
                    direction: 'ltr',
                    deepl: 'CS',
                    google: 'cs',
                    azure: 'cs',
                },
                bul: {
                    locale: 'bg',
                    direction: 'ltr',
                    deepl: 'BG',
                    google: 'bg',
                    azure: 'bg',
                },
                swe: {
                    locale: 'sv',
                    direction: 'ltr',
                    deepl: 'SV',
                    google: 'sv',
                    azure: 'sv',
                },
            },
            trustedHosts: [
                'manchester.ac.uk',
                'cs.manchester.ac.uk',
                'emarketing.manchester.ac.uk',
                'blackboard.com',
            ],
            normalHosts: [
                'github.com',
                'gitlab.com',
                'email.teams.microsoft.com',
                'piazza.com',
                'microsoft.com',
            ],
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
            untrustedKeyWords: {
                tokenlized: [
                    [
                        [
                            'nootropics',
                            'turnitin',
                            'smartdrug',
                            'smart drug',
                            'cognitive enhancer',
                            'price',
                            'sale',
                            'discount',
                        ], 0.5,
                    ],
                    [
                        [
                            'qq',
                            'wechat',
                            'brain performance',
                            'bio-hackers',
                            'bio hackers',
                            'dissertation',
                        ], 0.4,
                    ],
                    [
                        [
                            'exam',
                            'coursework',
                            'report',
                            'drug',
                            'dissertation',
                            'assignment',
                            'degree',
                        ], 0.3,
                    ],
                    [
                        [
                            'project',
                            'groupwork',
                            'assignment',
                            'writer',
                            'proofreading',
                            'service',
                        ], 0.2,
                    ],
                ],
                untokenlized: [
                    [
                        [
                            '代写',
                            '代考',
                            '导师',
                            '高分',
                            '润色',
                            '报价',
                            '写手',
                            '优惠',
                            '立减',
                            '企鹅',
                            '客服',
                            '订单',
                            '保分',
                            '申诉',
                            '答疑',
                            '辅导',
                            '服务',
                            '通过率',
                            '及格率',
                            '得分点',
                        ], 0.5,
                    ],
                    [
                        [
                            '补考',
                            '客户',
                            '微信',
                            '评分',
                            '助你',
                            '交稿',
                        ], 0.4,
                    ],
                    [
                        [
                            '分数',
                            '定制',
                            '审核',
                            '科目',
                            '免费',
                            '预定',
                        ], 0.3,
                    ],
                    [
                        [
                            '考试',
                            '论文',
                            '批改',
                            '挂科',
                            '复习',
                            '学位',
                            '考场',
                            '答题',
                            '答疑',
                            '做题',
                            '选题',
                            '检测',
                        ], 0.2,
                    ],
                    [
                        [
                            '作者',
                            '学生',
                            '课堂',
                        ], 0.1,
                    ],
                ],
            },
            sandboxCss: mailCss,
            sandboxCssDark: mailDarkCss,
            sandboxCssText: mailTextCss,
            previewerConfig: {
                content: '',
                blob: '',
                type: '',
                name: '',
                icon: '',
            },
            debouncedWheelEnd: debounce.debounce(function () {
                this.mouseWheelEnd();
            }, 200),
        };
    },
    methods: {
        /**
         * Update mail list from backend
         * @param {boolean} update update or fetch
         */
        async updateMailList(update = false, tryCount = 1) {
            if (!this.backend.url || !this.account.username || !this.account.password || !this.account.email) {
                return;
            }

            // Just updated, skip
            this.loading = true;
            if (this.justUpdated) {
                setTimeout(() => {
                    this.loading = false;
                    this.refreshLoding = false;
                }, 3000);
                return;
            }

            let requestFailed = false;
            // Send request
            const response = await betterFetch(`https://${this.backend.url}/mail/list/`, {
                method: 'POST',
                body: JSON.stringify({
                    username: this.account.username,
                    password: this.account.password,
                    email: this.account.email,
                    token: this.backend.token ? this.backend.token : '',
                }),
            }).catch(() => {
                if (tryCount < 2) {
                    // Retry
                    setTimeout(() => {
                        this.updateMailList(update, tryCount + 1);
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

            // Check response
            if (!this.checkResponse(response)) {
                this.loading = false;
                return;
            }

            // Update data
            this.$store.commit('setBackendStatus', true);
            this.loading = false;
            this.justUpdated = true;
            // Do not load list again within 15 seconds
            setTimeout(() => {
                this.justUpdated = false;
            }, 15000);

            if (!update) {
                // Is not updating, skip checking new mails
                this.init = true;
                this.mails = response.data.sort((a, b) => (b.date - a.date));
            } else {
                // Check if there is any new mail
                let newMail = false;
                for (const mail of response.data) {
                    if (this.mails.findIndex((item) => item.id === mail.id) === -1 && mail.unseen) {
                        newMail = true;
                    }
                }
                // If sound is turned on, play sound
                if (newMail && this.ifNotify.length === 1) {
                    this.$refs.audio.currentTime = 0;
                    this.$refs.audio.volume = 0.3;
                    this.$refs.audio.play();
                }
                // Update list
                this.mails = response.data.sort((a, b) => (b.date - a.date));
                this.refreshLoding = false;
            }
            if (this.viewerOpened) {
                // If viewer layer is opened, update viewer
                const mailIndex = response.data.findIndex((item) => item.id === this.viewing);
                if (mailIndex !== -1) {
                    this.viewer.subject = response.data[mailIndex].subject;
                    this.viewer.from = response.data[mailIndex].from;
                    this.viewer.fromAddress = response.data[mailIndex].fromAddress;
                    this.viewer.to = response.data[mailIndex].to;
                    this.viewer.cc = response.data[mailIndex].cc;
                    this.viewer.date = response.data[mailIndex].date;
                    this.viewer.flagged = response.data[mailIndex].flagged;
                }
            }
        },
        /**
         * Do action for a mail
         * @param {number} mailId mail ID
         * @param {string} action action
         */
        async doAction(mailId, action) {
            if (!this.backend.url || !this.account.username || !this.account.password || !this.account.email) {
                return;
            }

            this.loading = true;
            let requestFailed = false;
            // Send request
            let url = '';
            if (action === 'body') {
                this.loadingBody = true;
                url = `https://${this.backend.url}/mail/body/`;
            } else {
                url = `https://${this.backend.url}/mail/action/`;
                if (action === 'flag' || action === 'unflag') {
                    this.loadingFlag.push(mailId);
                }
            }
            const response = await betterFetch(url, {
                method: 'POST',
                body: JSON.stringify({
                    username: this.account.username,
                    password: this.account.password,
                    email: this.account.email,
                    action,
                    mailId,
                    token: this.backend.token ? this.backend.token : '',
                }),
            }).catch(() => {
                // Network error
                this.loading = false;
                if (action === 'body' && mailId === this.viewing) {
                    this.loadingBody = false;
                } else if (action === 'flag' || action === 'unflag') {
                    if (this.loadingFlag.indexOf(mailId) !== -1) {
                        this.loadingFlag.splice(this.loadingFlag.indexOf(mailId), 1);
                    }
                }
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

            // Check response
            if (!this.checkResponse(response)) {
                this.loading = false;
                if (action === 'body' && mailId === this.viewing) {
                    this.loadingBody = false;
                } else if (action === 'flag' || action === 'unflag') {
                    if (this.loadingFlag.indexOf(mailId) !== -1) {
                        this.loadingFlag.splice(this.loadingFlag.indexOf(mailId), 1);
                    }
                }
                return;
            }

            // Update data
            this.$store.commit('setBackendStatus', true);
            this.loading = false;
            if (action === 'body' && mailId === this.viewing) {
                // Get body
                this.loadingBody = false;

                if (response.data.content === '') {
                    // Empty body
                    this.viewer.bodyHTML = `<html><head><style>${this.sandboxCss}${this.$vuetify.theme.dark ? this.sandboxCssDark : ''}</style></head><body> </body></html>`;
                    this.viewer.bodyRawHTML = '';
                    this.viewer.textContent = '';
                    this.viewer.bodyText = '';
                    this.viewer.plainContent = '';
                    this.viewer.untrust = false;
                    this.viewer.sourceLang = 'und';
                    this.viewer.translator = false;
                } else {
                    this.viewer.bodyHTML = `<meta http-equiv="Content-Security-Policy" content="upgrade-insecure-requests"><base target="_blank"><style>${this.sandboxCss}${this.$vuetify.theme.dark ? this.sandboxCssDark : ''}${(response.data.content === response.data.plainContent || response.data.content.match(/<[^>]+>\s+(?=<)|<[^>]+>/g) === null) ? this.sandboxCssText : ''}</style>${response.data.content}`;
                    this.viewer.bodyRawHTML = `${response.data.content}`;
                    this.viewer.textContent = this.getInnerText(new DOMParser().parseFromString(response.data.content, 'text/html').body);
                    this.viewer.bodyText = response.data.plainContent === '' ? this.viewer.textContent : response.data.plainContent;
                    this.viewer.plainContent = response.data.plainContent;
                    this.viewer.sourceLang = franc(this.viewer.textContent);
                    this.viewer.translator = response.data.translator;

                    // Check if the content is untrusted
                    this.viewer.untrust = this.checkUntrust(this.viewer.textContent);
                }

                this.viewer.attachments = response.data.attachments;

                // Cache mail body
                if (this.cachedMails.findIndex((item) => item.id === response.data.id) === -1) {
                    response.data.textContent = this.viewer.textContent;
                    response.data.translated = {};

                    if (this.cachedMails.length === 20) {
                        this.cachedMails.shift();
                    }
                    this.cachedMails.push(response.data);

                    const cacheList = await localForage.getItem('mail_cache') || [];
                    if (cacheList.length === 10) {
                        cacheList.shift();
                    }
                    cacheList.push(response.data);
                    await localForage.setItem('mail_cache', cacheList);
                }
            } else if (action === 'flag' || action === 'unflag') {
                // Set flag state
                if (this.loadingFlag.indexOf(mailId) !== -1) {
                    this.loadingFlag.splice(this.loadingFlag.indexOf(mailId), 1);
                }
                const targetMail = this.mails.findIndex((item) => item.id === mailId);
                if (targetMail === -1) {
                    return;
                }
                this.mails[targetMail].flagged = !this.mails[targetMail].flagged;
                if (mailId === this.viewing) {
                    this.viewer.flagged = this.mails[targetMail].flagged;
                }
            }
        },
        /**
         * Download an attachment by mail ID and file name
         * @param {number} mailId mail ID
         * @param {string} fileName file name
         * @param {number} totalSize file size
         */
        async downloadFile(mailId, fileName, totalSize, action) {
            if (!this.backend.url || !this.account.username || !this.account.password || !this.account.email) {
                return;
            }

            // Looking for cache
            let response = null;
            let cacheFlag = false;
            for (const item of this.cachedAttachments) {
                if (item.id === `${mailId}-${fileName}`) {
                    response = item.content;
                    cacheFlag = true;
                }
            }

            if (!cacheFlag) {
                this.loading = true;
                if (action === 'download') {
                    this.downloading = `${mailId}-${fileName}`;
                } else {
                    this.loadingPreview = `${mailId}-${fileName}`;
                }
                this.downloadProgress = 0;
                let requestFailed = false;
                // Send request
                response = await fetchDownload(`https://${this.backend.url}/mail/attachment/`, {
                    method: 'POST',
                    body: JSON.stringify({
                        username: this.account.username,
                        password: this.account.password,
                        email: this.account.email,
                        fileName,
                        mailId,
                        token: this.backend.token ? this.backend.token : '',
                    }),
                }, (size) => {
                    let percentage = (size / totalSize) * 100;
                    if (percentage > 100) {
                        percentage = 100;
                    }
                    if (percentage < 0) {
                        percentage = 0;
                    }
                    this.downloadProgress = percentage;
                }).catch(() => {
                    // Network error
                    this.loading = false;
                    this.downloading = '';
                    this.$store.commit('addError', {
                        title: this.$t('network_error'),
                        content: this.$t('cannot_download'),
                        type: 'warning',
                    });
                    requestFailed = true;
                });

                if (requestFailed) {
                    return;
                }

                // Cache
                let foundFlag = false;
                for (let i = 0; i < this.cachedAttachments.length; i += 1) {
                    if (this.cachedAttachments[i].id === `${mailId}-${fileName}`) {
                        this.cachedAttachments[i].content = response;
                        foundFlag = true;
                    }
                }
                if (!foundFlag) {
                    this.cachedAttachments.push({
                        id: `${mailId}-${fileName}`,
                        content: response,
                    });
                }
                if (this.cachedAttachments.length > 5) {
                    this.cachedAttachments.shift();
                }
            }

            // Downloaded
            if (action === 'download') {
                // Save
                saveAs(response, fileName);
            } else {
                // Preview
                const fileNameSplited = fileName.split('.');
                this.previewerConfig.blob = URL.createObjectURL(response);
                this.previewerConfig.type = this.previewMap[fileNameSplited[fileNameSplited.length - 1].toLowerCase()];
                if (this.previewerConfig.type === 'text' || this.previewerConfig.type === 'csv' || this.previewerConfig.type === 'svg' || this.previewerConfig.type === 'markdown' || this.previewerConfig.type === 'code') {
                    this.previewerConfig.content = await response.text();
                } else {
                    this.previewerConfig.content = '';
                }
                this.previewerConfig.name = fileName;
                this.previewerConfig.icon = this.getFileIcon(fileName);

                setTimeout(() => {
                    this.$refs.filePreviewer.openPreview();
                }, cacheFlag ? 0 : 200);
            }
            setTimeout(() => {
                this.loading = false;
                if (action === 'download') {
                    this.downloading = '';
                } else {
                    this.loadingPreview = '';
                }
            }, 500);
        },
        /**
         * Manually refresh the mail list
         */
        manualRefresh() {
            this.refreshLoding = true;
            this.updateMailList(true);
        },
        /**
         * Show context menu in mail list
         * @param {Event} e context menu event
         * @param {number} mailId selected mail ID
         */
        showListMenu(e, mailId) {
            this.selectedId = mailId;
            this.listMenu = false;
            this.listMenuX = e.clientX;
            this.listMenuY = e.clientY;
            this.$nextTick(() => {
                this.listMenu = true;
            });
        },
        /**
         * Get inner text from a mail content element
         * @param {Element} ele mail content element
         * @returns {string} inner text of the element
         */
        getInnerText(ele) {
            for (const dom of ele.querySelectorAll('img, style, script, meta, title, link, head')) {
                dom.parentNode.removeChild(dom);
            }
            return ele.innerText.trim();
        },
        /**
         * Copy text
         * @param {string} text text to be copied
         */
        doCopy(text) {
            this.$copyText(text);
        },
        /**
         * Check if my email address is in a list
         * @param {array} personList list
         * @returns {boolean} if my email address is in the given list
         */
        meInList(personList) {
            return personList.findIndex((item) => item.address === this.account.email) !== -1;
        },
        /**
         * Open mail edit layer
         */
        sendMail() {
            this.code = '';
            this.mode = 'edit';
            this.expandTab = 0;
            this.editingAttachments = [];
            this.editingAttachmentsSize = 0;
            this.$refs.expandLayer.style.top = '521px';
            this.$refs.expandLayerMask.style.opacity = 0;
            this.expandLayerOpened = false;
            this.$nextTick(() => {
                this.layerOpened = true;
                setTimeout(() => {
                    this.$refs.codemirror.codemirror.scrollTo(null, 0);
                    if (this.editingTo.length === 0 && this.editingCc.length === 0) {
                        this.$refs.from.focus();
                    } else {
                        this.$refs.codemirror.codemirror.focus();
                    }
                }, 500);
            });
        },
        /**
         * Open viewer layer and show the mail by ID
         * @param {number} id mail ID
         */
        openMail(id) {
            // Mail not found
            const mail = this.mails.find((item) => item.id === id);
            if (!mail) {
                return;
            }
            // Reset viewer
            this.viewing = id;
            this.viewDetailExpanded = false;
            this.viewAttachmentExpanded = false;
            this.viewTranslationExpanded = false;
            this.viewer.subject = mail.subject;
            this.viewer.from = mail.from;
            this.viewer.fromAddress = mail.fromAddress;
            this.viewer.to = mail.to;
            this.viewer.cc = mail.cc;
            this.viewer.date = mail.date;
            this.viewer.flagged = mail.flagged;
            this.viewer.attachments = [];
            this.viewer.bodyHTML = '';
            this.viewer.bodyRawHTML = '';
            this.viewer.bodyText = '';
            this.viewer.textContent = '';
            this.viewer.allowHTML = false;
            this.viewer.untrust = false;
            this.viewer.sourceLang = 'und';
            this.viewer.translateFrom = 'auto';
            this.viewer.translateState = 'source';
            this.viewer.translated = {};
            this.viewer.translatedSubject = mail.subject;
            this.viewer.translatedBody = '';
            this.viewer.translatedBodyRaw = '';
            this.viewer.translator = false;
            this.$refs.viewerDom.scrollTop = 0;
            this.viewer.courseId = this.getSubjectId(mail.subject, mail.from) || '';
            this.$nextTick(() => {
                this.viewerOpened = true;
            });

            // Check if the mail is cached
            const cachedMail = this.cachedMails.find((item) => item.id === id);
            if (!cachedMail) {
                // Not cached, load from backend
                const targetMail = this.mails.findIndex((item) => item.id === id);
                if (targetMail === -1) {
                    return;
                }
                this.mails[targetMail].unseen = false;
                this.doAction(id, 'body');
            } else {
                // Cached, recover from cache
                this.viewer.bodyHTML = '';
                this.viewer.bodyRawHTML = '';
                this.viewer.bodyText = '';
                this.viewer.textContent = '';
                this.sandboxHeight = 0;
                if (mail.unseen) {
                    this.doAction(id, 'seen');
                }
                const targetMail = this.mails.findIndex((item) => item.id === id);
                if (targetMail === -1) {
                    return;
                }
                this.mails[targetMail].unseen = false;
                this.$nextTick(() => {
                    // Set mail body
                    if (cachedMail.content === '') {
                        // Empty body
                        this.viewer.bodyHTML = `<html><head><style>${this.sandboxCss}${this.$vuetify.theme.dark ? this.sandboxCssDark : ''}</style></head><body> </body></html>`;
                        this.viewer.bodyRawHTML = '';
                        this.viewer.textContent = '';
                        this.viewer.bodyText = '';
                        this.viewer.plainContent = '';
                        this.viewer.untrust = false;
                        this.viewer.sourceLang = 'und';
                        this.viewer.translator = false;
                        this.viewer.translated = {};
                    } else {
                        this.viewer.bodyHTML = `<meta http-equiv="Content-Security-Policy" content="upgrade-insecure-requests"><base target="_blank"><style>${this.sandboxCss}${this.$vuetify.theme.dark ? this.sandboxCssDark : ''}${(cachedMail.content === cachedMail.plainContent || cachedMail.content.match(/<[^>]+>\s+(?=<)|<[^>]+>/g) === null) ? this.sandboxCssText : ''}</style>${cachedMail.content}`;
                        this.viewer.bodyRawHTML = `${cachedMail.content}`;
                        this.viewer.textContent = cachedMail.textContent;
                        this.viewer.bodyText = cachedMail.plainContent === '' ? this.viewer.textContent : cachedMail.plainContent;
                        this.viewer.plainContent = cachedMail.plainContent;
                        this.viewer.untrust = this.checkUntrust(this.viewer.textContent);
                        this.viewer.sourceLang = franc(this.viewer.textContent);
                        this.viewer.translator = false;
                        this.viewer.translated = cachedMail.translated;
                        this.checkTranslator();
                    }
                    this.viewer.attachments = cachedMail.attachments;
                });
            }
        },
        /**
         * Close viewer layer
         */
        closeMail() {
            this.viewing = -1;
            this.viewerOpened = false;
        },
        /**
         * Mark a mail as flagged
         * @param {number} id mail ID
         */
        flagMail(id) {
            const mail = this.mails.findIndex((item) => item.id === id);
            if (mail === -1) {
                return;
            }
            this.doAction(id, this.mails[mail].flagged ? 'unflag' : 'flag');
        },
        /**
         * Check if it's send flagging requests by mail ID
         * @param {number} id mail ID
         * @returns {boolean} if it's send flagging requests by mail ID
         */
        isLoadingFlag(id) {
            return this.loadingFlag.includes(id);
        },
        /**
         * Check if a mail is unseen
         * @param {number} id mail ID
         * @returns {boolean} if the given mail is unseen
         */
        isUnseen(id) {
            const mail = this.mails.find((item) => item.id === id);
            if (!mail) {
                return false;
            }
            return mail.unseen;
        },
        /**
         * Check if a mail is flagged
         * @param {number} id mail ID
         * @returns {boolean} if the given mail is flagged
         */
        isFlagged(id) {
            const mail = this.mails.find((item) => item.id === id);
            if (!mail) {
                return false;
            }
            return mail.flagged;
        },
        /**
         * Mark all mail as read
         */
        markAllAsRead() {
            this.doAction(-1, 'allread');
            for (let i = 0; i < this.mails.length; i += 1) {
                this.mails[i].unseen = false;
            }
        },
        /**
         * Mark a mail as read by mail ID
         * @param {number} id mail ID
         */
        markAsRead(id) {
            const mail = this.mails.findIndex((item) => item.id === id);
            if (mail === -1) {
                return;
            }
            this.mails[mail].unseen = false;
            this.doAction(id, 'seen');
        },
        /**
         * Mark a mail as junk
         * @param {number} id mail ID
         */
        markAsJunk(id) {
            this.closeMail();
            const mail = this.mails.findIndex((item) => item.id === id);
            if (mail === -1) {
                return;
            }
            this.mails.splice(mail, 1);
            this.doAction(id, 'junk');
        },
        /**
         * Delete a mail by mail ID
         * @param {number} id mail ID
         */
        deleteMail(id) {
            this.closeMail();
            const mail = this.mails.findIndex((item) => item.id === id);
            if (mail === -1) {
                return;
            }
            this.mails.splice(mail, 1);
            this.doAction(id, 'delete');
        },
        /**
         * Translate current mail
         */
        async translateMail() {
            if (!this.backend.url || !this.account.username || !this.account.password || !this.account.email || this.viewing === -1) {
                return;
            }

            if (!this.viewer.translated[this.viewer.translateFrom] || (this.viewer.translated[this.viewer.translateFrom] && this.viewer.translated[this.viewer.translateFrom][3]) !== this.preferredTranslateTo[1].locale) {
                // If translation result is not cached
                this.viewer.translateState = 'loading';
                this.loading = true;

                let minBody = '';
                let styleList = [];
                let imgSrcList = [];
                let inlineStyleList = [];
                const direction = this.preferredTranslateTo[1].direction;
                let HTMLFlag = true;

                if (this.viewer.bodyRawHTML === this.viewer.plainContent || this.viewer.bodyRawHTML.match(/<[^>]+>\s+(?=<)|<[^>]+>/g) === null) {
                    // Body is plain text
                    minBody = this.viewer.bodyRawHTML;
                    HTMLFlag = false;
                } else {
                    // Minify the mail body
                    const minResult = this.getMinBodyHTML(new DOMParser().parseFromString(this.viewer.bodyRawHTML.replace(/(?=<!--)([\s\S]*?)-->/gmi, ''), 'text/html').body);
                    minBody = minResult[0];
                    styleList = minResult[1];
                    imgSrcList = minResult[2];
                    inlineStyleList = minResult[3];
                }

                let requestFailed = false;
                // Send request
                const response = await betterFetch(`https://${this.backend.url}/mail/translate/`, {
                    method: 'POST',
                    body: JSON.stringify({
                        token: this.backend.token ? this.backend.token : '',
                        email: this.account.email,
                        mailId: this.viewing,
                        subject: this.viewer.subject,
                        body: minBody,
                        from: this.viewer.translateFrom,
                        to: this.preferredTranslateTo[1][this.viewer.translator],
                    }),
                }).catch(() => {
                    // Network error
                    this.loading = false;
                    this.viewer.translateState = 'source';
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

                // Check response
                if (!this.checkResponse(response)) {
                    this.loading = false;
                    this.viewer.translateState = 'source';
                    return;
                }

                if (response.data.id !== this.viewing) {
                    this.loading = false;
                    this.viewer.translateState = 'source';
                    return;
                }

                this.$store.commit('setBackendStatus', true);
                this.loading = false;
                this.viewer.translateState = 'translated';

                // Update language detection result
                if (this.viewer.translateFrom === 'auto') {
                    for (const item of Object.entries(this.languageMap)) {
                        if (Array.isArray(item[1])) {
                            let foundFlag = false;
                            for (const lang of item[1]) {
                                if (lang[this.viewer.translator] === response.data.source) {
                                    this.viewer.sourceLang = item[0];
                                    foundFlag = true;
                                    break;
                                }
                            }
                            if (foundFlag) {
                                break;
                            }
                        } else {
                            if (item[1][this.viewer.translator] === response.data.source) {
                                this.viewer.sourceLang = item[0];
                                break;
                            }
                        }
                    }
                }

                // Restore the mail body and display the result
                const mailHTML = new DOMParser().parseFromString(this.viewer.bodyRawHTML, 'text/html');
                mailHTML.body.innerHTML = response.data.translatedBody;

                this.viewer.translatedSubject = response.data.translatedSubject;
                this.viewer.translatedBody = `<meta http-equiv="Content-Security-Policy" content="upgrade-insecure-requests"><base target="_blank"><style>${this.sandboxCss}${this.$vuetify.theme.dark ? this.sandboxCssDark : ''}${(this.viewer.bodyRawHTML === this.viewer.plainContent || this.viewer.bodyRawHTML.match(/<[^>]+>\s+(?=<)|<[^>]+>/g) === null) ? this.sandboxCssText : ''}body{direction:${direction}}</style>${HTMLFlag ? this.getStyleString(styleList) : ''}${this.revertImgAndStyle(mailHTML, imgSrcList, inlineStyleList)}`;
                this.viewer.translatedBodyRaw = this.revertImgAndStyle(mailHTML, imgSrcList, inlineStyleList);

                // Cache result
                this.viewer.translated[response.data.source] = [
                    this.viewer.translatedSubject,
                    this.viewer.translatedBody,
                    this.viewer.translatedBodyRaw,
                    this.preferredTranslateTo[1].locale,
                ];
                if (this.viewer.translateFrom === 'auto') {
                    this.viewer.translated.auto = [...this.viewer.translated[response.data.source]];
                }

                const cacheIndex = this.cachedMails.findIndex((item) => item.id === response.data.id);
                if (cacheIndex !== -1) {
                    this.cachedMails[cacheIndex].translated = this.viewer.translated;
                }
            } else {
                // Cache found, use cache
                this.viewer.translateState = 'translated';
                this.viewer.translatedSubject = this.viewer.translated[this.viewer.translateFrom][0];
                this.viewer.translatedBody = this.viewer.translated[this.viewer.translateFrom][1];
                this.viewer.translatedBodyRaw = this.viewer.translated[this.viewer.translateFrom][2];
            }
        },
        /**
         * Check current translator from backend
         */
        async checkTranslator() {
            if (!this.backend.url || !this.account.username || !this.account.password || !this.account.email || this.viewing === -1) {
                return;
            }
            let requestFailed = false;
            // Send request
            const response = await betterFetch(`https://${this.backend.url}/mail/translator/`, {
                method: 'POST',
                body: JSON.stringify({
                    token: this.backend.token ? this.backend.token : '',
                    email: this.account.email,
                }),
            }).catch(() => {
                // Network error
                this.loading = false;
                this.viewer.translateState = 'source';
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

            // Check response
            if (!this.checkResponse(response)) {
                return;
            }

            // Set result
            this.$store.commit('setBackendStatus', true);
            this.viewer.translator = response.data.translator;
        },
        /**
         * Restore current mail from translated state
         */
        restoreMail() {
            this.viewer.translateState = 'source';
        },
        /**
         * Get minified body HTML
         * @param {HTMLElement} body body element
         * @returns {array} `[minified body HTML, an array of extracted styles, an array of extracted image srcs, an array of extracted inline styles]`
         */
        getMinBodyHTML(body) {
            const styleList = [];
            const imgSrcList = [];
            const inlineStyleList = [body.getAttribute('style')];

            body.removeAttribute('style');

            // Extract styles
            for (const dom of body.querySelectorAll('style')) {
                styleList.push(dom.textContent);
                dom.parentNode.removeChild(dom);
            }
            // Extract image srcs
            for (const dom of body.querySelectorAll('img')) {
                imgSrcList.push(dom.getAttribute('src'));
                dom.removeAttribute('src');
            }
            // Extract inline styles
            for (const dom of body.querySelectorAll('img, table, thead, tbody, tfoot, section, h1, h2, h3, h4, h5, h6, svg')) {
                inlineStyleList.push(dom.getAttribute('style'));
                dom.removeAttribute('src');
            }

            return [body.innerHTML.replace(/\n{1,}/gm, ' ').replace(/ {2,}/gm, ' '), styleList, imgSrcList, inlineStyleList];
        },
        /**
         * Build a style element string for restore extracted styles
         * @param {array} styleList an array of extracted styles
         * @returns {string} a string of the built style element
         */
        getStyleString(styleList) {
            let result = '';
            for (const item of styleList) {
                result += `<style>${item}</style>`;
            }
            return result;
        },
        /**
         * Restore image srcs and inline styles and get the HTML string of the document
         * @param {HTMLElement} doc the translated document
         * @param {array} imgSrcList an array of extracted image srcs
         * @param {array} inlineStyleList an array of extracted inline styles
         * @returns {string} a string of the restored document
         */
        revertImgAndStyle(doc, imgSrcList, inlineStyleList) {
            // Restore image srcs
            for (const dom of doc.body.querySelectorAll('img')) {
                dom.setAttribute('src', imgSrcList.shift());
            }

            doc.body.setAttribute('style', inlineStyleList.shift());

            // Restore inline styles
            for (const dom of doc.body.querySelectorAll('img, table, thead, tbody, tfoot, section, h1, h2, h3, h4, h5, h6, svg')) {
                dom.setAttribute('style', inlineStyleList.shift());
            }
            return doc.documentElement.innerHTML;
        },
        /**
         * Build 'translate from' language list based on the given service
         * @param {string} service service name
         * @returns {array} an array of available languages
         */
        translateFromList(service) {
            const result = Object.entries(this.languageMap).map((item) => {
                if (Array.isArray(item[1])) {
                    // If the language have variants
                    if (item[1][0][service]) {
                        return {
                            name: this.$t(`lang_${item[0]}`),
                            code: item[1][0][service],
                        };
                    }
                    return false;
                }
                if (item[1][service]) {
                    return {
                        name: this.$t(`lang_${item[1].locale}`),
                        code: item[1][service],
                    };
                }
                return false;
            }).filter((item) => item !== false);

            // Add 'auto detection'
            result.unshift({
                name: this.$t('lang_auto'),
                code: 'auto',
            });

            return result;
        },
        /**
         * Open the translation settings dialog
         */
        openTranslationSettingsDialog() {
            this.editingTranslateEnabled = this.translateEnabled;
            this.editingPreferredTranslateTo = this.preferredTranslateTo;
            this.translateSettingsDialog = true;
        },
        /**
         * Save and close the translation settings dialog
         */
        saveTranslationSettingsDialog() {
            this.translateEnabled = this.editingTranslateEnabled;
            this.preferredTranslateTo = this.editingPreferredTranslateTo;
            this.translateSettingsDialog = false;

            // Save to localStorage
            localStorage.setItem('mail_enable_translation', this.translateEnabled);
            localStorage.setItem('mail_preferred_language', JSON.stringify(this.preferredTranslateTo));
        },
        /**
         * Update the height of the sandbox
         */
        updateSandboxHeight() {
            if (this.$refs.sandbox && this.$refs.sandbox.contentWindow.document.body) {
                this.sandboxHeight = this.$refs.sandbox.contentWindow.document.body.scrollHeight + 0.5;
                setTimeout(() => {
                    if (this.$refs.sandbox && this.$refs.sandbox.contentWindow.document.body) {
                        this.sandboxHeight = this.$refs.sandbox.contentWindow.document.body.scrollHeight + 0.5;
                    }
                }, 500);
            }
        },
        /**
         * Check if the time label needs to update
         * @param {number} date date timestamp
         * @returns {boolean} if the time label needs to update
         */
        timeUpdate(date) {
            return !(new Date().valueOf() - date >= 864000000);
        },
        /**
         * Check if the mail content is untrust
         * @param {string} content mail content
         * @returns {boolean} if the mail content is untrust
         */
        checkUntrust(content) {
            let weight = 0;

            // Check untokenlized keywords, remove all spaces in the content
            const noSpaceConetnt = content.replace(/ /g, '').replace(/\n/g, '').replace(/\t/g, '').replace(/\r/g, '');
            for (const keyword of this.untrustedKeyWords.untokenlized) {
                weight += (noSpaceConetnt.match(new RegExp(`(${keyword[0].join('|')})`, 'g')) || []).length * keyword[1];
            }

            // Check tokenlized keywords, turn the content into lower case
            const lowerConetnt = content.toLowerCase();
            for (const keyword of this.untrustedKeyWords.tokenlized) {
                weight += (lowerConetnt.match(new RegExp(`(${keyword[0].join('|')})`, 'g')) || []).length * keyword[1];
            }

            // Calculate the weight with the keyword density
            return weight * (2000 / noSpaceConetnt.length) > 10;
        },
        /**
         * Get short name from an UoM account name
         * @param {string} name mail from name
         * @returns {string} short name
         */
        getShortSenderName(name) {
            const nameSplit = name.split(' - ').filter((val) => val !== '');
            if (nameSplit.length === 2 && /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@(([a-z])+\.)*manchester\.ac\.uk$/i.test(nameSplit[1])) {
                return nameSplit[0];
            }
            return name;
        },
        /**
         * Get two-letter name for mail avatar by mail from name
         * @param {string} name mail from name
         * @returns {string} two-letter name
         */
        getTwoLetterSenderName(name) {
            // If it's an UoM address
            const nameSplit = name.split(' - ').filter((val) => val !== '');
            if (nameSplit.length === 2 && /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@(([a-z])+\.)*manchester\.ac\.uk$/i.test(nameSplit[1])) {
                const realNameSplit = nameSplit[0].split(' ').filter((val) => val !== '');
                if (realNameSplit.length >= 2) {
                    return `${realNameSplit[0][0]}${realNameSplit[realNameSplit.length - 1][0]}`.toUpperCase();
                }
                return `${nameSplit[0][0]}${nameSplit[1].split('@')[1][0]}`.toUpperCase();
            }

            // If it's an email address
            if (/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/i.test(name)) {
                const realNameSplit = name.split('@')[0].split(/-|\.| /).filter((val) => val !== '');
                if (realNameSplit.length >= 2) {
                    return `${realNameSplit[0][0]}${realNameSplit[realNameSplit.length - 1][0]}`.toUpperCase();
                }
                return `${name[0]}${name.split('@')[1][0]}`.toUpperCase();
            }

            // If it's a normal name
            const nameSplited = name.split(' ').filter((val) => val !== '');
            if (nameSplited.length >= 2) {
                return `${nameSplited[0][0]}${nameSplited[nameSplited.length - 1][0]}`.toUpperCase();
            }
            return `${name[0]}${name[1]}`.toUpperCase();
        },
        /**
         * Get mail avatar by mail subject, from name and from address
         * @param {string} subject mail subject
         * @param {string} from mail from name
         * @param {string} fromAddr mail from address
         * @returns {string} mail avatar file name
         */
        getMailAvatar(subject, from, fromAddr) {
            if (subject === false) {
                return false;
            }
            if (subject.includes('[CompSci]') && fromAddr.split('@')[1].substr(-16) === 'manchester.ac.uk') {
                return 'kilburn.jpg';
            }
            if (fromAddr.includes('.su@manchester.ac.uk')) {
                return 'su.gif';
            }
            if (from !== false && (from.toLowerCase().includes('my manchester ') || from.toLowerCase() === 'the university of manchester' || from.toLowerCase() === 'university of manchester') && fromAddr.split('@')[1].substr(-16) === 'manchester.ac.uk') {
                return 'man.gif';
            }
            if (from !== false && from.toLowerCase() === 'university of manchester student services' && fromAddr.split('@')[1].substr(-20) === 'ssc@manchester.ac.uk') {
                return 'man.gif';
            }
            if (from === false && fromAddr.includes('@blackboard.com')) {
                return 'bb.gif';
            }
            if (fromAddr.includes('@email.teams.microsoft.com')) {
                return 'teams.gif';
            }
            if (from !== false && from.toLowerCase() === 'cortana' && fromAddr.includes('@microsoft.com')) {
                return 'cortana.gif';
            }
            if (fromAddr.includes('@microsoft.com')) {
                return 'microsoft.gif';
            }
            if (fromAddr.includes('@github.com')) {
                return 'github.gif';
            }
            if (from === 'GitLab' && (fromAddr === 'support@cs.manchester.ac.uk' || fromAddr.split('@')[1].substr(-10) === 'gitlab.com')) {
                return 'gitlab.gif';
            }
            if (fromAddr.includes('@piazza.com')) {
                return 'piazza.gif';
            }
            if (fromAddr.includes('@trello.com')) {
                return 'trello.gif';
            }
            return false;
        },
        /**
         * Match course ID from mail subject or from
         * @param {string} subject mail subject
         * @param {string} from mail from address
         * @returns {string} matched course ID or false
         */
        getSubjectId(subject, from) {
            if (subject !== false) {
                const match = subject.toUpperCase().match(/[A-Z]{3,4}( |-|_){0,1}\d{5}/);
                if (match !== null) {
                    const id = match[0].replace(/( |-|_)/, '');
                    if (this.subjects.findIndex((item) => item.id === id) !== -1) {
                        return id;
                    }
                }
            }
            if (from !== false) {
                const fromMatch = from.toUpperCase().match(/[A-Z]{3,4}( |-|_){0,1}\d{5}/);
                if (fromMatch !== null) {
                    const fromId = fromMatch[0].replace(/( |-|_)/, '');
                    if (this.subjects.findIndex((item) => item.id === fromId) !== -1) {
                        return fromId;
                    }
                }
            }
            return false;
        },
        /**
         * Check if the sender is an UoM internal sender
         * @param {string} address sender address
         * @returns {boolean} if the sender is an UoM internal sender
         */
        internalSender(address) {
            return /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@(([a-z])+\.)*manchester\.ac\.uk$/i.test(address);
        },
        /**
         * Check if the sender is a trusted sender
         * @param {string} address sender address
         * @returns {boolean} if the sender is a trusted sender
         */
        trustedSender(address) {
            return this.trustedHosts.includes(address.split('@')[1]);
        },
        /**
         * Check if the sender is a normal sender
         * @param {string} address sender address
         * @returns {boolean} if the sender is a normal sender
         */
        normalSender(address) {
            return this.normalHosts.includes(address.split('@')[1]);
        },
        /**
         * Get file icon name by file name
         * @param {string} name file name
         * @returns {string} icon name
         */
        getFileIcon(name) {
            const fileName = name.split('.');
            return this.fileIconMap[fileName[fileName.length - 1].toLowerCase()] || 'file-outline';
        },
        /**
         * Check whether the file can be previewed
         * @param {string} name file name
         * @param {string} size file size
         * @returns {boolean} whether the file can be previewed
         */
        canPreview(name, size) {
            const fileName = name.split('.');
            return this.previewMap[fileName[fileName.length - 1].toLowerCase()] !== undefined && size <= 5242880;
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
         * Format bytes to file size unit
         * @param {number} bytes file byte length
         * @param {number?} decimals file size decimal number
         * @returns {string} formated string
         */
        formatBytes(bytes, decimals = 2) {
            if (bytes === 0) {
                return '0 Bytes';
            }

            const k = 1024;
            const dm = decimals < 0 ? 0 : decimals;
            const sizes = ['Bytes', 'KB', 'MB', 'GB'];

            const i = Math.floor(Math.log(bytes) / Math.log(k));

            return `${parseFloat((bytes / k ** i).toFixed(dm))} ${sizes[i]}`;
        },
        /**
         * Handle drag on mouse events
         * @param {Event} event mousedown event
         */
        dragMouseDown(event) {
            event.preventDefault();
            if (event.button === 0) {
                if (this.expandLayerOpened) {
                    this.mouseMoveOrigin = event.clientY + 460;
                } else {
                    this.mouseMoveOrigin = event.clientY;
                }
                this.updateMouseMoveDistance(this.mouseMoveOrigin - event.clientY);
                document.documentElement.addEventListener('mousemove', this.dragMove);
                document.documentElement.addEventListener('mouseup', this.removeEventsMouse);
                this.isDargging = true;
            }
        },
        /**
         * Handle drag on mouse events
         * @param {Event} event mousemove event
         */
        dragMove(event) {
            event.preventDefault();
            this.updateMouseMoveDistance(this.mouseMoveOrigin - event.clientY);
        },
        /**
         * Handle drag end
         */
        dragEnd() {
            this.isDargging = false;
            if (this.expandLayerOpened) {
                if (parseInt((this.$refs.expandLayer.style.top || '521px').slice(0, -2), 10) > 161) {
                    this.$refs.expandLayer.style.top = '521px';
                    this.expandLayerOpened = false;
                    this.$refs.expandLayerMask.style.opacity = 0;
                } else {
                    this.$refs.expandLayer.style.top = '61px';
                }
            } else {
                if (parseInt((this.$refs.expandLayer.style.top || '521px').slice(0, -2), 10) < 421) {
                    this.$refs.expandLayer.style.top = '61px';
                    this.expandLayerOpened = true;
                    this.$refs.expandLayerMask.style.opacity = 0.4;
                } else {
                    this.$refs.expandLayer.style.top = '521px';
                }
            }
        },
        /**
         * Handle drag on touch events
         * @param {Event} event touchstart event
         */
        dragTouchStart(event) {
            if (this.expandLayerOpened) {
                this.mouseMoveOrigin = event.touches[0].clientY + 460;
            } else {
                this.mouseMoveOrigin = event.touches[0].clientY;
            }
            this.updateMouseMoveDistance(this.mouseMoveOrigin - event.touches[0].clientY);
            document.documentElement.addEventListener('touchmove', this.touchDragMove, { passive: false });
            document.documentElement.addEventListener('touchend', this.removeEventsTouch, { passive: false });
            document.documentElement.addEventListener('touchcancel', this.removeEventsTouch, { passive: false });
            this.isDargging = true;
        },
        /**
         * Handle drag on touch events
         * @param {Event} event touchmove event
         */
        touchDragMove(event) {
            event.preventDefault();
            this.updateMouseMoveDistance(this.mouseMoveOrigin - event.touches[0].clientY);
        },
        /**
         * Remove event listeners on mouse events
         */
        removeEventsMouse() {
            document.documentElement.removeEventListener('mousemove', this.dragMove);
            document.documentElement.removeEventListener('mouseup', this.removeEventsMouse);
            this.dragEnd();
        },
        /**
         * Remove event listeners on touch events
         */
        removeEventsTouch() {
            document.documentElement.removeEventListener('touchmove', this.touchDragMove, { passive: false });
            document.documentElement.removeEventListener('touchend', this.removeEventsTouch, { passive: false });
            document.documentElement.removeEventListener('touchcancel', this.removeEventsTouch, { passive: false });
            this.dragEnd();
        },
        /**
         * Handle mousewheel events
         * @param {Event} event mousewheel event
         */
        onMouseWheel(event) {
            const delta = Math.sign(event.deltaY) * 10;
            const mouseMoveDistance = parseInt((this.$refs.expandLayer.style.top || '521px').slice(0, -2), 10);
            if (this.expandLayerOpened && mouseMoveDistance >= 61) {
                if (mouseMoveDistance <= 81) {
                    this.$refs.expandLayer.style.top = `${mouseMoveDistance + delta}px`;
                    this.$refs.expandLayerMask.style.opacity = ((521 - mouseMoveDistance - delta) / 460) * 0.4;
                    this.debouncedWheelEnd();
                } else {
                    this.$refs.expandLayer.style.top = '521px';
                    this.$refs.expandLayerMask.style.opacity = 0;
                    this.expandLayerOpened = false;
                }
            } else if (!this.expandLayerOpened && mouseMoveDistance <= 521) {
                if (mouseMoveDistance >= 501) {
                    this.$refs.expandLayer.style.top = `${mouseMoveDistance + delta}px`;
                    this.$refs.expandLayerMask.style.opacity = ((521 - mouseMoveDistance - delta) / 460) * 0.4;
                    this.debouncedWheelEnd();
                } else {
                    this.$refs.expandLayer.style.top = '61px';
                    this.$refs.expandLayerMask.style.opacity = 0.4;
                    this.expandLayerOpened = true;
                }
            }
        },
        /**
         * Handle the end of mousewheel events
         */
        mouseWheelEnd() {
            this.$refs.expandLayer.style.top = `${this.expandLayerOpened ? 61 : 521}px`;
        },
        /**
         * Update mouse move distance by raw input
         * @param {number} distance mouse move distance
         */
        updateMouseMoveDistance(distance) {
            if (distance >= 0 && distance <= 460) {
                this.$refs.expandLayer.style.top = `${521 - distance}px`;
                this.$refs.expandLayerMask.style.opacity = (distance / 460) * 0.4;
            } else if (distance < 0) {
                this.$refs.expandLayer.style.top = `${521 - ((800 / (0.3 * (0 - distance) + 26.65)) - 30)}px`;
                this.$refs.expandLayerMask.style.opacity = 0;
            } else if (distance > 460) {
                this.$refs.expandLayer.style.top = `${31 + (800 / (0.3 * (distance - 460) + 26.65))}px`;
                this.$refs.expandLayerMask.style.opacity = 0.4;
            }
        },
        /**
         * Check if input is a valid email
         * @param {string} name input name
         */
        checkEmail(name) {
            // Handle repeated mail addresses
            if (this.useBackup) {
                this.$nextTick(() => {
                    this.$nextTick(() => {
                        this[name] = this.backupList;
                        this.$nextTick(() => {
                            this.$nextTick(() => {
                                this[`${name}Input`] = this.backupInput;
                                this.useBackup = false;
                            });
                        });
                    });
                });
                return;
            }

            // Handle invalid mail addresses
            if (this[name].length > 0 && !/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/i.test(this[name][this[name].length - 1])) {
                const data = this[name].pop();
                this.$nextTick(() => {
                    this.$nextTick(() => {
                        this[`${name}Input`] = data;
                    });
                });
            }
        },
        /**
         * Check if the inputed mail address is out of list on blur
         * @param {string} name input name
         */
        checkUnlistedEmailOnBlur(name) {
            if (this[name].includes(this[`${name}Input`])) {
                this.backupInput = this[`${name}Input`];
                this.backupList = [...this[name]];
                this.useBackup = true;
            }
        },
        /**
         * Check if input is a valid email when pressing enter and the mail address is out of list
         * @param {string} name input name
         * @param {Event} e keyDown event
         */
        checkUnlistedEmail(name, e) {
            if (e.code === 'Enter') {
                if (this.$refs[name === 'editingTo' ? 'from' : 'ccInput'].computedItems.length === 0 && !this[name].includes(this[`${name}Input`]) && /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/i.test(this[`${name}Input`])) {
                    this[name].push(this[`${name}Input`]);
                    this[`${name}Input`] = '';
                }
            }
        },
        /**
         * Handle file drop event
         * @param {Event} e file drop event
         */
        handleFileDrop(e) {
            this.isDragOver = false;
            if (!e.dataTransfer.files) {
                return;
            }
            this.addAttachment(e.dataTransfer.files);
        },
        /**
         * Handle file input event
         * @param {Event} e file input event
         */
        handleFileInput(e) {
            if (!e.target.files) {
                return;
            }
            this.addAttachment(e.target.files);
            e.target.value = '';
        },
        /**
         * Remove a attachment from attachment list
         * @param {number} index attachment index
         */
        removeAttachment(index) {
            this.editingAttachmentsSize -= this.editingAttachments[index].size;
            this.editingAttachments.splice(index, 1);
        },
        /**
         * Add a attachment to attachment list
         * @param {array} list file list to be added
         */
        addAttachment(list) {
            [...list].forEach(async (file) => {
                if (file.size > 0 && this.editingAttachments.findIndex((item) => item.name === file.name && item.size === file.size) === -1) {
                    if (file.type === '') {
                        // Check if it's a dir
                        try {
                            await file.slice(0, 1).arrayBuffer();
                            if (this.editingAttachments.length === 10 || (this.editingAttachmentsSize + file.size) > 15728640) {
                                this.tooManyAttachments = true;
                                return;
                            }
                            this.editingAttachments.push(file);
                            this.editingAttachmentsSize += file.size;
                        } catch (err) {
                            console.warn(err);
                        }
                    } else {
                        if (this.editingAttachments.length === 10 || (this.editingAttachmentsSize + file.size) > 15728640) {
                            this.tooManyAttachments = true;
                            return;
                        }
                        this.editingAttachments.push(file);
                        this.editingAttachmentsSize += file.size;
                    }
                }
            });
        },
        /** Build recommend mail host list
         * @param {string} user mail user
         * @returns {list} recommend mail host list
         */
        buildMailHostList(user) {
            return [
                `${user}@manchester.ac.uk`,
                `${user}@student.manchester.ac.uk`,
                `${user}@postgrad.manchester.ac.uk`,
                `${user}@gmail.com`,
                `${user}@outlook.com`,
                `${user}@hotmail.com`,
                `${user}@yahoo.com`,
                `${user}@qq.com`,
                `${user}@163.com`,
                `${user}@mail.ru`,
                `${user}@yandex.ru`,
                `${user}@rawagegypt.com`,
                `${user}@dnet.net.id`,
                `${user}@tm.net.my`,
                `${user}@cwgsy.net`,
                `${user}@btinternet.com`,
                `${user}@spark.net.gr`,
                `${user}@otenet.gr`,
            ];
        },
        /**
         * Map from subject ID to subject color
         * @param {string|boolean} subject subject ID or false
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
         * Map from subject ID to subject name
         * @param {string} subject subject ID
         * @returns {string} subject name or raw ID (if none matched)
         */
        subjectLongNameMap(subject) {
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
        /**
         * Calculate the time of a mail and format it as a string
         * @param {number} date time of the mail
         * @returns {string} formatted string
         */
        displayDate(date) {
            const now = new Date().valueOf();
            const mail = date.valueOf();

            // More than 10 days
            if (now - mail >= 864000000) {
                return this.getDate(date);
            }
            // More than 1 week
            if (now - mail < 864000000 && now - mail >= 604800000) {
                return vsprintf(this.$t('remain_week'), [1]);
            }
            // More than 1 day
            if (now - mail >= 86400000) {
                const day = Math.floor((now - mail) / 86400000);
                return vsprintf(day === 1 ? this.$t('remain_day') : this.$t('remain_day_plural'), [day]);
            }
            // More than 1 hour
            if (now - mail < 86400000 && now - mail > 3600000) {
                const hour = Math.round((now - mail) / 3600000);
                return vsprintf(hour === 1 ? this.$t('remain_hour') : this.$t('remain_hour_plural'), [hour]);
            }
            // Less than 1 hour
            if (now - mail < 3600000 && now - mail > 120000) {
                const mins = Math.round((now - mail) / 60000);
                return vsprintf(mins === 1 ? this.$t('remain_min') : this.$t('remain_min_plural'), [mins]);
            }
            // Less than 2 mins
            if (now - mail < 120000 && now - mail > 0) {
                return this.$t('just_now');
            }
            return this.getDate(date);
        },
        /**
         * Format a date object to a string based on locale
         * @param {Date} dateObj Date object
         * @returns {string} formatted a date string
         */
        getDate(dateObj) {
            return formatDateTime(dateObj, this.locale, false);
        },
    },
    watch: {
        locale() {
            this.$i18n.locale = this.locale;
        },
        editingToInput() {
            if (this.editingToInput === '') {
                this.editingToInput = null;
                this.mailHostListTo = [];
            } else if (this.editingToInput !== null && typeof this.editingToInput !== 'undefined' && this.editingToInput.includes('@')) {
                const user = this.editingToInput.split('@')[0];
                if (user.length > 0) {
                    this.mailHostListTo = this.buildMailHostList(user);
                } else {
                    this.mailHostListTo = [];
                }
            } else {
                this.mailHostListTo = [];
            }
        },
        editingCcInput() {
            if (this.editingCcInput === '') {
                this.editingCcInput = null;
                this.mailHostListCc = [];
            } else if (this.editingCcInput !== null && typeof this.editingCcInput !== 'undefined' && this.editingCcInput.includes('@')) {
                const user = this.editingCcInput.split('@')[0];
                if (user.length > 0) {
                    this.mailHostListCc = this.buildMailHostList(user);
                } else {
                    this.mailHostListCc = [];
                }
            } else {
                this.mailHostListCc = [];
            }
        },
        editingTo(newVal, oldVal) {
            // Keep inputed value when deleting chips
            if (Array.isArray(newVal) && Array.isArray(oldVal)) {
                if (newVal.length === oldVal.length - 1) {
                    const data = this.editingToInput;
                    this.$nextTick(() => {
                        this.$nextTick(() => {
                            this.editingToInput = null;
                            if (data !== null) {
                                this.$nextTick(() => {
                                    this.$nextTick(() => {
                                        this.editingToInput = `${data}`;
                                    });
                                });
                            }
                        });
                    });
                }
            }
        },
        editingCc(newVal, oldVal) {
            // Keep inputed value when deleting chips
            if (Array.isArray(newVal) && Array.isArray(oldVal)) {
                if (newVal.length === oldVal.length - 1) {
                    const data = this.editingCcInput;
                    this.$nextTick(() => {
                        this.$nextTick(() => {
                            this.editingCcInput = null;
                            if (data !== null) {
                                this.$nextTick(() => {
                                    this.$nextTick(() => {
                                        this.editingCcInput = `${data}`;
                                    });
                                });
                            }
                        });
                    });
                }
            }
        },
        mode() {
            if (this.mode === 'edit') {
                // Refresh editor otherwise it will not shown
                this.cmRefresh = `${new Date().valueOf()}`;
            } else {
                if (this.$refs.render) {
                    // Render Markdown
                    this.$refs.render.innerHTML = this.md.render(this.code);
                }
            }
        },
        ifNotify() {
            // Toggle sound
            if (!this.isSettingSound) {
                if (this.ifNotify.length === 1) {
                    this.$refs.audio.currentTime = 0;
                    this.$refs.audio.volume = 0.3;
                    this.$refs.audio.play();
                    localStorage.setItem('new_mail_sound', 'true');
                } else {
                    localStorage.setItem('new_mail_sound', 'false');
                }
            } else {
                this.isSettingSound = false;
            }
        },
        timerMin() {
            this.keyMin = `key-min-${new Date().valueOf()}`;
        },
        darkMode() {
            // Update styles in sandbox when dark mode is on/off
            if (this.viewerOpened) {
                this.viewer.bodyHTML = `<meta http-equiv="Content-Security-Policy" content="upgrade-insecure-requests"><base target="_blank"><style>${this.sandboxCss}${this.$vuetify.theme.dark ? this.sandboxCssDark : ''}${(this.viewer.bodyRawHTML === this.viewer.plainContent || this.viewer.bodyRawHTML.match(/<[^>]+>\s+(?=<)|<[^>]+>/g) === null) ? this.sandboxCssText : ''}</style>${this.viewer.bodyRawHTML}`;
                if (this.viewer.translated) {
                    this.viewer.translatedBody = `<meta http-equiv="Content-Security-Policy" content="upgrade-insecure-requests"><base target="_blank"><style>${this.sandboxCss}${this.$vuetify.theme.dark ? this.sandboxCssDark : ''}${(this.viewer.bodyRawHTML === this.viewer.plainContent || this.viewer.bodyRawHTML.match(/<[^>]+>\s+(?=<)|<[^>]+>/g) === null) === null ? this.sandboxCssText : ''}</style>${this.viewer.translatedBodyRaw}`;
                }
            }
        },
    },
    computed: {
        ...mapState({
            locale: (state) => state.locale,
            backend: (state) => state.backend,
            backendStatus: (state) => state.backendStatus,
            account: (state) => state.account,
            subjects: (state) => state.subjects,
            timerMin: (state) => state.timerMin,
            darkMode: (state) => state.darkMode,
        }),
        mailUnseen() {
            // Filter out unread mails
            return this.mails.filter((item) => (item.unseen));
        },
        preferredLanguageList() {
            const result = Object.entries(this.languageMap).map((item) => {
                if (Array.isArray(item[1])) {
                    // If the language have variants
                    return item[1].map((lang) => ({
                        name: this.$t(`lang_${lang.locale}`),
                        code: [item[0], lang],
                    }));
                }
                return {
                    name: this.$t(`lang_${item[1].locale}`),
                    code: [item[0], item[1]],
                };
            }).flat();
            return result;
        },
    },
    async mounted() {
        this.$i18n.locale = localStorage.getItem('language') || 'en';

        // Read settings from localstorage
        if (localStorage.getItem('mail_enable_translation')) {
            this.translateEnabled = localStorage.getItem('mail_enable_translation') === 'true';
        } else {
            this.translateEnabled = true;
            localStorage.setItem('mail_enable_translation', 'true');
        }

        if (localStorage.getItem('mail_preferred_language')) {
            this.preferredTranslateTo = JSON.parse(localStorage.getItem('mail_preferred_language'));
        } else {
            this.preferredTranslateTo = ['eng', this.languageMap.eng];
            localStorage.setItem('mail_preferred_language', JSON.stringify(['eng', this.languageMap.eng]));
        }

        // Render note
        this.md = markdown({
            html: false,
            xhtmlOut: false,
            breaks: false,
            langPrefix: 'language-',
            linkify: true,
            typographer: false,
            highlight: '',
        });
        this.md.use(mdSub);
        this.md.use(mdSup);
        this.md.use(mdSpan);
        this.md.use(mdAttrs, {
            allowedAttributes: ['red', 'orange', 'yellow', 'green', 'teal', 'blue', 'purple', 'grey', 'bg-red', 'bg-orange', 'bg-yellow', 'bg-green', 'bg-teal', 'bg-blue', 'bg-purple', 'bg-grey', 'big', 'small', 'style'],
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

        // Restore settings
        this.isSettingSound = true;
        if (localStorage.getItem('new_mail_sound') === 'true') {
            this.ifNotify = [0];
        }

        // Check if updating
        if ((localStorage.getItem('update_frontend') || 'false') !== 'true') {
            // Fetch mail list
            this.$nextTick(() => {
                this.updateMailList();
            });
        } else {
            this.loading = true;
        }

        // Update mail list every 10 minutes
        this.timer = setInterval(() => {
            this.updateMailList(true);
        }, 600000);

        // Restore cache
        this.cachedMails = await localForage.getItem('mail_cache') || [];
    },
    beforeDestroy() {
        clearInterval(this.timer);
    },
};
</script>

<style lang="less">
@keyframes refresh {
    from {
      transform: rotate(0);
    }
    to {
      transform: rotate(-360deg);
    }
}
.mail-container {
    position: relative;
    padding-left: 0;
    padding-right: 0;
    overflow: hidden;
    contain: strict;
    h2 {
        font-size: 18px;
        font-weight: normal;
        opacity: .87;
        padding-top: 18px;
        padding-bottom: 15px;
        padding-left: 20px;
        position: relative;
        z-index: 2;
        transition: all .2s;
        .md-icon {
            padding-bottom: 2px;
        }
        .num-badge {
            display: inline-block;
            padding: 0 9px;
            min-width: 25px;
            border-radius: 10px;
            background-color: #EEEEEE;
            font-size: 13.5px;
            margin-left: 3px;
        }
        .refresh-loading {
            animation: refresh 1.5s infinite linear;
            display: flex;
        }
        &.shadow {
            box-shadow: 0px 2px 4px -1px rgba(0, 0, 0, 10%), 0px 4px 5px 0px rgba(0, 0, 0, 7%), 0px 1px 10px 0px rgba(0, 0, 0, 6%)!important;
        }
    }
    .v-skeleton-loader .v-skeleton-loader__list-item-avatar-three-line {
        height: 79px;
    }
    .new-mail-audio {
        display: none;
    }
    .viewer-layer-mask, .editor-layer-mask, .expand-layer-mask {
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
    .editor-layer-mask {
        z-index: 5;
    }
    .expand-layer-mask {
        will-change: opacity;
        transform: translateZ(0);
        &.clickable {
            pointer-events: auto;
        }
    }
    .viewer-layer, .editor-layer, .expand-layer {
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
            padding-left: 0;
            .layer-title {
                vertical-align: middle;
            }
            .title-input {
                -webkit-appearance: none;
                width: calc(100% - 155px);
                outline: transparent;
            }
            .layer-title-avatar{
                & > span {
                    font-size: 12px;
                    margin-top: 1px;
                }
                & > i {
                    margin-left: 1px;
                }
            }
        }
        &.opened {
            top: 0;
            pointer-events: auto;
        }
    }
    .expand-layer {
        background-color: #f8f8f8;
        border-radius: 8px;
        top: 521px;
        box-shadow: 0px -5px 25px -4px rgba(0, 0, 0, 0.2);
        pointer-events: auto;
        will-change: top;
        transform: translateZ(0);
        transition: none;
        h2 {
            margin: 0;
            display: flex;
            height: 40px;
            justify-content: center;
            align-items: center;
            cursor: grabbing;
            padding-top: 0;
            padding-bottom: 0;
            padding-left: 0;
            .expand-handle {
                width: 40px;
                height: 5px;
                border-radius: 2.5px;
                background-color: rgba(0, 0, 0, .2);
            }
        }
        &.animation {
            transition: top 0.3s cubic-bezier(0.215, 0.61, 0.355, 1);
            h2 {
                cursor: grab;
                padding-top: 0;
                padding-bottom: 0;
                padding-left: 0;
            }
        }
        .expand-tab-item {
            height: 418px;
            overflow: auto;
            .not-reply {
                width: 100%;
                height: 100%;
                display: flex;
                justify-content: center;
                align-items: center;
            }
            .add-btn {
                height: 48px;
                border-radius: 6px;
                background-color: fade(#660099, 12%);
                transition: filter .2s;
            }
            .attachment-add-list {
                .attachment-add-item {
                    user-select: none;
                    width: 100%;
                    margin-right: 0!important;
                    height: 55px;
                    border-radius: 6px;
                    border: 1px solid #E0E0E0;
                    transition: background-color .2s;
                    .file-name {
                        width: calc(100% - 72px);
                        margin-top: 3px;
                        .text-caption {
                            margin-top: -4px;
                        }
                    }
                    button {
                        .rotating {
                            animation: progress-circular-rotate 1.4s linear infinite;
                            .v-progress-circular__underlay {
                                stroke: transparent;
                            }
                        }
                    }
                    &:hover {
                        background-color: rgba(0, 0, 0, .03);
                    }
                }
            }
            .drop-layer {
                position: absolute;
                display: flex;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: fade(#660099, 30%);
                z-index: 3;
                justify-content: center;
                align-items: center;
                flex-direction: column;
                opacity: 0;
                transition: opacity .2s;
                user-select: none;
                pointer-events: none;
                & > i {
                    font-size: 80px!important;
                }
            }
            &.drag-over {
                * {
                    pointer-events: none;
                }
                .add-btn {
                    filter: grayscale(1);
                }
                .drop-layer {
                    opacity: 1;
                    pointer-events: auto;
                }
            }
        }
        .background-filler {
            height: 40px;
            background-color: white;
        }
    }
    .viewer-layer {
        .viewer {
            max-height: 498px;
            overflow: auto;
        }
        .subject-subtitle {
            user-select: none;
            margin-top: -5px;
            & > span {
                cursor: pointer;
            }
            .subject-color-samll {
                width: 8px;
                height: 8px;
                display: inline-block;
                border-radius: 50%;
                margin: 0;
                margin-right: 3px;
                margin-bottom: 1px;
            }
        }
        .mail-view-subject {
            font-size: 1.2rem !important;
            line-height: 1.7rem;
            opacity: .9;
        }
        .mail-detail {
            background-color: #F3F3F3;
            border-radius: 8px;
            .mail-from-line {
                position: relative;
                white-space: nowrap;
                .expand-btn {
                    position: absolute;
                    top: -1px;
                    right: 0;
                    i {
                        transition: all .3s;
                        &.detail-expanded {
                            transform: rotate(180deg);
                        }
                    }
                }
                & > span > i {
                    margin-left: -3px!important;
                }
                .v-chip {
                    width: fit-content;
                    max-width: calc(100% - 60px);
                    position: relative;
                    .v-chip__content {
                        overflow: hidden;
                        text-overflow: ellipsis;
                        margin-right: 15px;
                        display: inline-block;
                        line-height: 24px;
                        button {
                            font-size: 15px!important;
                            position: absolute;
                            right: 11px;
                            top: 7px;
                        }
                    }
                }
            }
            .expand {
                .mail-to-line {
                    .v-chip:not(.to-me) {
                        width: fit-content;
                        max-width: calc(100% - 35px);
                        position: relative;
                        .v-chip__content {
                            overflow: hidden;
                            text-overflow: ellipsis;
                            margin-right: 15px;
                            display: inline-block;
                            line-height: 24px;
                            button {
                                font-size: 15px!important;
                                position: absolute;
                                right: 11px;
                                top: 7px;
                            }
                        }
                    }
                }
                .mail-time-line {
                    & > span {
                        display: inline-flex;
                        height: 24px;
                        align-items: center;
                        vertical-align: sub;
                        & > i {
                            margin-top: -1px;
                        }
                    }
                }
            }
            .attachment-list {
                .attachment-item {
                    user-select: none;
                    width: calc(50% - 6px);
                    height: 55px;
                    border-radius: 6px;
                    border: 1px solid #E0E0E0;
                    transition: background-color .2s;
                    &:nth-of-type(2n) {
                        margin-right: 0!important;
                    }
                    &.can-preview:hover {
                        .file-ext {
                            display: none;
                        }
                        .preview-btn {
                            display: flex;
                        }
                    }
                    &.loading-preview {
                        .file-ext {
                            display: none;
                        }
                        .preview-btn {
                            display: flex;
                        }
                    }
                    .preview-btn {
                        margin-left: 6px;
                        margin-right: 2px;
                        display: none;
                    }
                    .file-name {
                        width: calc(100% - 72px);
                        margin-top: 3px;
                        .text-caption {
                            margin-top: -4px;
                        }
                    }
                    button {
                        .rotating {
                            animation: progress-circular-rotate 1.4s linear infinite;
                            .v-progress-circular__underlay {
                                stroke: transparent;
                            }
                        }
                    }
                    &.full-width {
                        width: calc(100% - 4px);
                        margin-right: 0!important;
                    }
                    &:hover {
                        background-color: rgba(0, 0, 0, .03);
                    }
                }
            }
        }
        .mail-translation {
            background-color: #F3F3F3;
            border-radius: 8px;
            .translation-notice {
                position: relative;
                white-space: nowrap;
                .expand-btn {
                    position: absolute;
                    top: -1px;
                    right: 0;
                    i {
                        transition: all .3s;
                        &.detail-expanded {
                            transform: rotate(180deg);
                        }
                    }
                }
                & > i {
                    font-size: 21px;
                }
            }
            .expand {
                .translate-from, .translate-to {
                    width: 50%;
                }
                .service-icon {
                    margin-top: -2px;
                    margin-right: 6px;
                }
                svg.deepl-logo {
                    width: 14px;
                    height: 14px;
                    margin-right: 6px;
                    vertical-align: middle;
                    margin-top: -2px;
                    .deepl-bg {
                        fill: #979797;
                    }
                    .deepl-line {
                        fill: #F3F3F3;
                    }
                }
            }
        }
        .v-skeleton-loader {
            & > div {
                padding: 0 20px;
            }
            .v-skeleton-loader__list-item-two-line {
                margin-top: -5px;
                height: 50px;
            }
        }
        .v-alert {
            border-radius: 8px;
            .v-alert__wrapper {
                margin-top: 4px!important;
                .v-alert__icon {
                    margin-top: 3px;
                    margin-right: 12px;
                }
            }
        }
        .body-text {
            white-space: pre-wrap;
        }
        .sandbox {
            border: none;
            width: calc(100% - 40px);
            overflow: visible;
            margin-bottom: 7px!important;
        }
    }
    .editor-layer {
        z-index: 6;
        .all-height {
            display: flex;
            flex-direction: column;
            height: 460px;
            overflow: hidden;
        }
        .render-result {
            height: 460px;
            overflow: auto;
            overscroll-behavior: contain;
            padding: 10px 20px;
            & > div {
                overflow: hidden;
                .accent {
                    background-color: transparent!important;
                    border: none!important;
                    border-color: transparent!important;
                }
                @import (less) "../../backend/css/md.css";
            }
        }
        .send-mail-input {
            margin: 0;
            padding: 0;
            min-height: 44px;
            flex-grow: 0;
            flex-shrink: 0;
            .v-input__slot {
                &::before, &::after {
                    display: none;
                }
                .v-input__prepend-inner {
                    margin-top: 10px;
                    margin-left: 12px;
                    padding-right: 0;
                }
                .v-select__selections {
                    padding: 6px 4px;
                    .v-chip {
                        width: fit-content;
                        max-width: 100%;
                        position: relative;
                        .v-chip__content {
                            overflow: hidden;
                            text-overflow: ellipsis;
                            margin-right: 15px;
                            display: inline-block;
                            line-height: 24px;
                            button {
                                position: absolute;
                                right: 11px;
                                top: 6px;
                            }
                        }
                    }
                }
                input {
                    padding: 4px 8px;
                    height: 32px;
                    max-height: 32px;
                }
            }
            .v-input__append-inner {
                display: none;
            }
            .v-select__selections {
                max-height: 150px;
                overflow: auto;
            }
            &.v-autocomplete--is-selecting-index input {
                opacity: 1;
            }
        }
        .md-editor {
            flex-grow: 1;
            min-height: 0;
            overflow: hidden;
            .CodeMirror {
                height: 100%;
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
        .v-list-item {
            transition: background-color .2s;
            min-height: 30px;
            &:hover, &:focus {
                background-color: rgba(0, 0, 0, .04);
            }
            &.flaged, &.unseen {
                background-color: fade(#660099, 12%);
                &:hover, &:focus {
                    background-color: fade(#660099, 20%);
                }
            }
            &.unseen {
                border-left: 4px solid #660099;
                padding-left: 12px;
                .v-list-item__title {
                    font-weight: bold;
                }
            }
        }
        .v-list-item__content {
            padding: 10px 0;
            .from {
                margin-bottom: 3px;
            }
        }
        .time-icon {
            vertical-align: text-top;
        }
        .person-icon {
            vertical-align: text-top;
        }
        .subject-color-samll {
            width: 10px;
            height: 10px;
            display: inline-block;
            border-radius: 50%;
            margin: 0;
            margin-right: 3px;
        }
    }
    .more-mail {
        margin-top: -8px;
        padding-top: 14px;
        font-family: Roboto, -apple-system, "Noto Sans", "Helvetica Neue", Helvetica, "Nimbus Sans L", Arial,"Liberation Sans", "PingFang SC", "Hiragino Sans GB", "Noto Sans CJK SC", "Source Han Sans SC", "Source Han Sans CN", "Microsoft YaHei", "Wenquanyi Micro Hei", "WenQuanYi Zen Hei", "ST Heiti", SimHei, "WenQuanYi Zen Hei Sharp", sans-serif!important;
        background-color: rgba(0, 0, 0, .02);
        a {
            cursor: pointer;
            text-decoration: none;
        }
        a.no-underline-link {
            padding-left: 3px;
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
    .mail-outer {
        width: 100%;
        height: 560px;
    }
    .scroll {
        height: 500px;
        overflow: auto;
        position: relative;
        z-index: 1;
    }
}
.mail-all-read {
    .v-list-item__icon {
        margin: 12px 16px 0 0!important;
    }
}
.mail-menu-list {
    .v-list-item__icon {
        margin: 10px 16px 0 0!important;
    }
    .v-list-item__content {
        padding: 12px 0;
    }
    .v-list-item {
        min-height: 30px;
    }
}
.mail-course-card {
    .course-name {
        line-height: 17px;
        margin-top: 10px;
        .course-smaller-font {
            font-size: 0.875rem;
        }
    }
    .course-home {
        margin-top: 10px;
    }
    .v-card__text {
        padding-top: 5px;
        &.empty {
            padding: 4.5px;
        }
    }
    .list {
        margin-bottom: 0;
        background-color: #f3f3f3;
        border-radius: 6px;
        .v-list-item {
            cursor: default;
            min-height: 32px;
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
}
.translate-settings .v-input--selection-controls__input {
    margin-right: 16px;
}
#app.theme--dark .mail-container {
    h2 {
        .num-badge {
            background-color: #3E3E3E;
        }
    }
    .viewer-layer {
        .mail-detail {
            background-color: #2C2C2C;
        }
        .mail-translation {
            background-color: #2C2C2C;
            .expand {
                svg {
                    .deepl-bg {
                        fill: #969696;
                    }
                    .deepl-line {
                        fill: #2C2C2C;
                    }
                }
            }
        }
        .attachment-list {
            .attachment-item {
                border: 1px solid #414141;
                &:hover {
                    background-color: rgba(255, 255, 255, .03);
                }
            }
        }
    }
    .viewer-layer, .editor-layer, .expand-layer {
        background-color: #1E1E1E;
        h2 {
            .title-input {
                color: white;
            }
        }
        .render-result {
            color: rgba(255, 255, 255, .87);
            blockquote {
                border-left: 4px solid #3b3b3b;
                color: #999999;
            }
            [purple] {
                color: #D099E0;
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
    .expand-layer {
        background-color: #252525;
        h2 {
            .expand-handle {
                background-color: rgba(255, 255, 255, 0.2);
            }
        }
        .add-btn {
            background-color: fade(#D099E0, 12%);
            .theme--dark.v-icon {
                color: #D099E0;
            }
        }
        .attachment-add-list {
            .attachment-add-item {
                border: 1px solid #414141;
                &:hover {
                    background-color: rgba(255, 255, 255, .03);
                }
            }
        }
        .drop-layer {
            background-color: fade(#D099E0, 30%);
        }
        .background-filler {
            background-color: #1E1E1E;
        }
    }
    .list {
        .v-list-item {
            &:hover, &:focus {
                background-color: rgba(255, 255, 255, .04);
            }
            &.flaged, &.unseen {
                background-color: fade(#D099E0, 12%);
                &:hover, &:focus {
                    background-color: fade(#D099E0, 20%);
                }
            }
            &.unseen {
                border-left: 4px solid #D099E0;
            }
        }
    }
    .more-mail {
        background-color: rgba(255, 255, 255, .025);
    }
}
#app.theme--dark .mail-course-card {
    .v-toolbar {
        background-color: #1E1E1E!important;
    }
    .list {
        background-color: #2c2c2c;
    }
}
</style>

<i18n src="../locales/network.json"></i18n>
<i18n>
{
    "en": {
        "mail": "Inbox",
        "nothing": "No mail",
        "cannot_fetch": "Unable to fetch mail list, probably you are not properly configured backend information or the backend does not allow this.",
        "network_error_body": "Cannot fetch related mail data from backend",
        "cannot_download": "Unable to download attachment from the backend",
        "learn_more": "Learn more",
        "md_support": "Markdown supported",
        "view": "Preview",
        "edit": "Edit",
        "write": "Write mail",
        "refresh": "Refresh",
        "more": "More",
        "all_read": "Mark all as read",
        "mark_seen": "Mark as read",
        "sound_notification": "New mail sound notification",
        "no_subject": "No Subject",
        "mail_view": "Mail",
        "remain_week": "%d week ago",
        "remain_day": "%d day ago",
        "remain_day_plural": "%d days ago",
        "remain_hour": "%d hour ago",
        "remain_hour_plural": "%d hours ago",
        "remain_min": "%d min ago",
        "remain_min_plural": "%d mins ago",
        "just_now": "Just now",
        "flagged": "Flagged",
        "flag": "Flag",
        "unflag": "Unflag",
        "reply": "Reply",
        "reply_all": "Reply all",
        "close": "Close",
        "forward": "Forward",
        "mark_junk": "Mark as junk",
        "delete": "Delete mail",
        "more_mail": "Showing emails from the last 2 weeks. To check out more emails please go to",
        "me": "Me",
        "from": "From",
        "to": "To",
        "cc": "CC",
        "time": "Time",
        "trusted_sender": "Trusted mail sender",
        "internal_sender": "From an UoM internal address",
        "unsafe_content": "This email is from an untrusted sender external to UoM, displaying in plain text mode",
        "untrusted_content": "This email may not be credible",
        "this_is_safe": "This email is safe",
        "expand": "Expand",
        "attachment_num": "%d attachments",
        "subject_home": "Course Home Page",
        "quick_zoom": "Zoom meeting quick start",
        "quick_teams": "Teams meeting quick start",
        "copy_passcode": "Copy passcode",
        "mail_body": "Mail body",
        "send": "Send",
        "attachment": "Attachment",
        "reply_forward": "Reply & Forward",
        "not_reply_forward": "This is not a reply or forward email",
        "add_attachment": "Click or drag & drop to add",
        "too_many_attachments": "Too many attachments",
        "too_many_attachments_body": "You can add up to 10 attachments or 15 MB in total.",
        "ok": "OK",
        "drop_file": "Drop your files here",
        "preview": "Preview",
        "translation_settings": "Translation settings",
        "translation_tip": "When enabled, the translation panel will be displayed when the email is available for translation. The content of the mail will be sent to a third-party translation service. By using translation you are agreeing to the ToS of the service. The translation service provider can be found at the bottom left of the translation panel.",
        "language_unsupported_tip": "This language may not be supported by the translation service provided by the backend. When this language is not supported, the translation panel will not be displayed.",
        "language_tip": "The translation panel will only be displayed if the language of the mail differs from the target language. Mail language detection is done locally and automatically.",
        "cancel": "Cancel",
        "save": "Save",
        "powered_by": "Powered by %s",
        "enable_translate": "Enable mail translation",
        "translate": "Translate",
        "source": "Source",
        "in_language": "It seems like %s",
        "translate_from": "Source",
        "translate_to": "Target",
        "translate_to_language": "Target language",
        "no_language": "No language found",
        "lang_auto": "Auto detect",
        "lang_cmn": "Chinese",
        "lang_zh": "Chinese (Simplified)",
        "lang_zh_tw": "Chinese (Traditional)",
        "lang_es": "Spanish",
        "lang_en": "English",
        "lang_ru": "Russian",
        "lang_ar": "Arabic",
        "lang_bn": "Bengali",
        "lang_hi": "Hindi",
        "lang_por": "Portuguese",
        "lang_pt_pt": "Portuguese (Portugal)",
        "lang_pt": "Portuguese (Brazil)",
        "lang_id": "Indonesian",
        "lang_ja": "Japanese",
        "lang_fr": "French",
        "lang_de": "German",
        "lang_jv": "Javanese",
        "lang_ko": "Korean",
        "lang_te": "Telugu",
        "lang_vi": "Vietnamese",
        "lang_mr": "Marathi",
        "lang_it": "Italian",
        "lang_ta": "Tamil",
        "lang_tr": "Turkish",
        "lang_ur": "Urdu",
        "lang_gu": "Gujarati",
        "lang_pl": "Polish",
        "lang_uk": "Ukrainian",
        "lang_fa": "Persian",
        "lang_kn": "Kannada",
        "lang_ml": "Maithili",
        "lang_my": "Burmese",
        "lang_or": "Oriya (Oria)",
        "lang_sw": "Swahili",
        "lang_su": "Sundanese",
        "lang_ro": "Romanian",
        "lang_pa": "Panjabi",
        "lang_am": "Amharic",
        "lang_ha": "Hausa",
        "lang_bs": "Bosnian",
        "lang_hr": "Croatian",
        "lang_nl": "Dutch",
        "lang_srp": "Serbian",
        "lang_sr_cy": "Serbian (Cyrillic)",
        "lang_sr_la": "Serbian (Latin)",
        "lang_th": "Thai",
        "lang_ku": "Central Kurdish",
        "lang_yo": "Yoruba",
        "lang_hu": "Hungarian",
        "lang_el": "Greek",
        "lang_cs": "Czech",
        "lang_bg": "Bulgarian",
        "lang_sv": "Swedish"
    },
    "zh": {
        "mail": "收件箱",
        "nothing": "没有邮件",
        "cannot_fetch": "无法获取邮件，可能是没有正确配置后端信息或后端不允许。",
        "network_error_body": "无法从后端获取相关邮件信息",
        "cannot_download": "无法从后端下载附件",
        "learn_more": "了解更多",
        "md_support": "支持 Markdown",
        "view": "预览",
        "edit": "编辑",
        "write": "写邮件",
        "refresh": "刷新",
        "more": "更多",
        "all_read": "全部标记已读",
        "mark_seen": "标记为已读",
        "sound_notification": "新邮件通知音",
        "no_subject": "无主题",
        "mail_view": "邮件",
        "remain_week": "%d 周前",
        "remain_day_plural": "%d 天前",
        "remain_day": "%d 天前",
        "remain_day_plural": "%d 天前",
        "remain_hour": "%d 小时前",
        "remain_hour_plural": "%d 小时前",
        "remain_min": "%d 分钟前",
        "remain_min_plural": "%d 分钟前",
        "just_now": "刚刚",
        "flagged": "已旗标",
        "flag": "旗标",
        "unflag": "取消旗标",
        "reply": "回复",
        "reply_all": "回复全部",
        "close": "关闭",
        "forward": "转发",
        "mark_junk": "标记为垃圾邮件",
        "delete": "删除邮件",
        "more_mail": "只显示近两周的邮件。要查看更多邮件请前往",
        "me": "我",
        "from": "发件人",
        "to": "收件人",
        "cc": "抄送",
        "time": "时间",
        "trusted_sender": "可信发件人",
        "internal_sender": "来自曼大内部邮箱",
        "unsafe_content": "此邮件来自曼大外部的非可信发件人，正在以纯文本模式显示",
        "untrusted_content": "此邮件内容可能不可信",
        "this_is_safe": "此内容安全",
        "expand": "展开",
        "attachment_num": "%d 个附件",
        "subject_home": "科目主页",
        "quick_zoom": "快速启动 Zoom 会议",
        "quick_teams": "快速启动 Teams 会议",
        "copy_passcode": "复制密码",
        "mail_body": "邮件正文",
        "send": "发送",
        "attachment": "附件",
        "reply_forward": "回复与转发",
        "not_reply_forward": "这不是一封回复或转发的邮件",
        "add_attachment": "点击或拖拽以添加附件",
        "too_many_attachments": "太多附件了",
        "too_many_attachments_body": "你可以添加最多 10 个或总大小不超过 15MB 的附件。",
        "ok": "好",
        "drop_file": "在此放下文件",
        "preview": "预览",
        "translation_settings": "翻译设置",
        "translation_tip": "启用邮件翻译后，在邮件可被翻译时将会显示翻译面板。翻译邮件需要将邮件内容发送至第三方翻译服务，使用翻译即代表你同意此服务的使用条款。具体的翻译服务提供商可以在翻译面板的左下方找到。",
        "language_unsupported_tip": "后端提供的翻译服务可能不支持此语言。当此语言不受支持时，翻译面板将不会显示。",
        "language_tip": "只有当邮件语言与目标语言不同时，翻译面板才会显示。检测邮件语言是在本地自动进行的。",
        "cancel": "取消",
        "save": "保存",
        "powered_by": "由 %s 翻译",
        "enable_translate": "启用邮件翻译",
        "translate": "翻译",
        "source": "原文",
        "in_language": "此邮件似乎使用了%s",
        "translate_from": "源语言",
        "translate_to": "目标语言",
        "translate_to_language": "目标语言",
        "no_language": "找不到语言",
        "lang_auto": "自动检测",
        "lang_cmn": "中文",
        "lang_zh": "中文（简体）",
        "lang_zh_tw": "中文（繁体）",
        "lang_es": "西班牙语",
        "lang_en": "英语",
        "lang_ru": "俄语",
        "lang_ar": "阿拉伯语",
        "lang_bn": "孟加拉语",
        "lang_hi": "印地语",
        "lang_por": "葡萄牙语",
        "lang_pt_pt": "葡萄牙语（葡萄牙）",
        "lang_pt": "葡萄牙语（巴西）",
        "lang_id": "印度尼西亚语",
        "lang_ja": "日语",
        "lang_fr": "法语",
        "lang_de": "德语",
        "lang_jv": "爪哇语",
        "lang_ko": "韩语",
        "lang_te": "泰卢固语",
        "lang_vi": "越南语",
        "lang_mr": "马拉地语",
        "lang_it": "意大利语",
        "lang_ta": "泰米尔语",
        "lang_tr": "土耳其语",
        "lang_ur": "乌尔都语",
        "lang_gu": "古吉拉特语",
        "lang_pl": "波兰语",
        "lang_uk": "乌克兰语",
        "lang_fa": "波斯语",
        "lang_kn": "卡纳达语",
        "lang_ml": "马拉雅拉姆文",
        "lang_my": "缅甸语",
        "lang_or": "奥里亚语（奥里亚）",
        "lang_sw": "斯瓦希里语",
        "lang_su": "巽他语",
        "lang_ro": "罗马尼亚语",
        "lang_pa": "旁遮普语",
        "lang_am": "阿姆哈拉语",
        "lang_ha": "豪萨语",
        "lang_bs": "波斯尼亚语",
        "lang_hr": "克罗地亚语",
        "lang_nl": "荷兰语",
        "lang_srp": "塞尔维亚语",
        "lang_sr_cy": "塞尔维亚语 (西里尔文)",
        "lang_sr_la": "塞尔维亚语 (拉丁文)",
        "lang_th": "泰语",
        "lang_ku": "中部库尔德语",
        "lang_yo": "约鲁巴语",
        "lang_hu": "匈牙利语",
        "lang_el": "希腊语",
        "lang_cs": "捷克语",
        "lang_bg": "保加利亚语",
        "lang_sv": "瑞典语"
    },
        "en": {
        "mail": "Bandeja de entrada",
        "nothing": "No correos",
        "cannot_fetch": "No ha sido posible obtener la lista de correos, posiblemente debido a la una configuración inapropiada del servidor back-end o por falta de permisión.",
        "network_error_body": "No ha sido posible obtener los datos de los correos a través del servidor back-end",
        "cannot_download": "No ha sido posible obtener los archivos adjuntados a través del servidor back-end",
        "learn_more": "Saber más",
        "md_support": "Markdown aplicable",
        "view": "Vista previa",
        "edit": "Editar",
        "write": "Escribir correo",
        "refresh": "Refrescar",
        "more": "Más",
        "all_read": "Marcar todas como leídas",
        "mark_seen": "Marcar como leída",
        "sound_notification": "Sonido de notificacion de un correo nuevo",
        "no_subject": "No asignaturas",
        "mail_view": "Correos",
        "remain_week": "Hace {0} semanas",
        "remain_day": "Hace {0} día",
        "remain_day_plural": "Hace {0} días",
        "remain_hour": "Hace {0} hora",
        "remain_hour_plural": "Hace {0} horas",
        "remain_min": "Hace {0} minuto",
        "remain_min_plural": "Hace {0} minutos",
        "just_now": "Ahora mismo",
        "flagged": "Marcado",
        "flag": "Marcar",
        "unflag": "Desmarcar",
        "reply": "Responder",
        "reply_all": "Responder todos",
        "close": "Cerrar",
        "forward": "Reenviar",
        "mark_junk": "Marcar como correo basura",
        "delete": "Eliminar correo",
        "more_mail": "Mostrando correos de las dos últimas semanas. Para ver más vaya a",
        "me": "Yo",
        "from": "De",
        "to": "A",
        "cc": "Copiar",
        "time": "Hora",
        "trusted_sender": "Remitente de correo de confianza",
        "internal_sender": "Desde una dirección interna de UoM",
        "unsafe_content": "Este correo es de un remitente que no es de confianza y externo a UoM, mostrando en modo textual",
        "untrusted_content": "Puede que este correo no sea seguro",
        "this_is_safe": "Este correo es seguro",
        "expand": "Expandir",
        "attachment_num": "{0} archivos adjuntados",
        "subject_home": "Página principal de asignatura",
        "quick_zoom": "Acceso rápido a Zoom",
        "quick_teams": "Acceso rápido a Teams",
        "copy_passcode": "Copiar contraseña",
        "mail_body": "Cuerpo del correo",
        "send": "Enviar",
        "attachment": "Archivos adjuntados",
        "reply_forward": "Responder y reenviar",
        "not_reply_forward": "No es un correo respondido ni reenviado",
        "add_attachment": "Haga clic o arrastre y suelte para adjuntar",
        "too_many_attachments": "Demasiados archivos adjuntados",
        "too_many_attachments_body": "Puedes adjuntar hasta 10 archivos o 15 MB en total.",
        "ok": "OK",
        "drop_file": "Arrastra tus archivos aquí",
        "preview": "Vista prevía",
        "translation_settings": "Ajustes de traducción",
        "translation_tip": "Cuando está habilitado la traducción, el panel de traducción se mostrará cuando el correo electrónico esté disponible para traducir. El contenido del correo se enviará a un servicio de traducción de terceros. Al utilizar la traducción, acepta los Términos de Servicio del tercero. El proveedor de servicios de traducción se puede encontrar en la parte inferior izquierda del panel de traducción.",
        "language_unsupported_tip": "Es posible que este idioma no sea compatible con el servicio de traducción proporcionado por el back-end. Si no se admite este idioma, no se mostrará el panel de traducción.",
        "language_tip": "El panel de traducción solo se mostrará si el idioma del correo es diferente al idioma de destino. La detección del idioma del correo se realiza de forma local y automática.",
        "cancel": "Cancelar",
        "save": "Guardar",
        "powered_by": "Proporcionada por {0}",
        "enable_translate": "Habilitar traducción de correos",
        "translate": "Traducir",
        "source": "Fuente",
        "in_language": "Parece ser {0}",
        "translate_from": "Original",
        "translate_to": "A",
        "translate_to_language": "Traducir al idioma",
        "no_language": "No idioma encontrado",
        "lang_auto": "Autodetección",
        "lang_cmn": "Chino",
        "lang_zh": "Chino (Simplificado)",
        "lang_zh_tw": "Chino (Tradicional)",
        "lang_es": "Español",
        "lang_en": "Inglés",
        "lang_ru": "Ruso",
        "lang_ar": "Árabe",
        "lang_bn": "Bengalí",
        "lang_hi": "Hindi",
        "lang_por": "Portugués",
        "lang_pt_pt": "Portugués (Portugal)",
        "lang_pt": "Portugués (Brasil)",
        "lang_id": "Indonesio",
        "lang_ja": "Japonés",
        "lang_fr": "Francés",
        "lang_de": "Alemán",
        "lang_jv": "Javanés",
        "lang_ko": "Koreano",
        "lang_te": "Telugu",
        "lang_vi": "Vietnamita",
        "lang_mr": "Maratí",
        "lang_it": "Italiano",
        "lang_ta": "Tamil",
        "lang_tr": "Turco",
        "lang_ur": "Urdu",
        "lang_gu": "Gujaratí",
        "lang_pl": "Polaco",
        "lang_uk": "Ucrainiano",
        "lang_fa": "Farsi",
        "lang_kn": "Canarés",
        "lang_ml": "Maitilí",
        "lang_my": "Birmano",
        "lang_or": "Oriya (Oria)",
        "lang_sw": "Suajili",
        "lang_su": "Sondanés",
        "lang_ro": "Rumano",
        "lang_pa": "Pynjabi",
        "lang_am": "Amhárico",
        "lang_ha": "Hausa",
        "lang_bs": "Bosnio",
        "lang_hr": "Croata",
        "lang_nl": "Neerlandés",
        "lang_srp": "Serbio",
        "lang_sr_cy": "Serbio (Cirilico)",
        "lang_sr_la": "Serbio (Latin)",
        "lang_th": "Tailandés",
        "lang_ku": "Kurdo central",
        "lang_yo": "Yoruba",
        "lang_hu": "Húngaro",
        "lang_el": "Griego",
        "lang_cs": "Checo",
        "lang_bg": "Búlgaro",
        "lang_sv": "Sueco"
    }
}
</i18n>
