<template>
    <div>
        <v-text-field
            v-model.trim="calendarURL"
            outlined
            :label="$t('calendar_subscription')"
            :rules="rulesUrl"
            validate-on-blur
            prepend-inner-icon="mdi-calendar-sync-outline"
            class="input"
            ref="calendarSub"
            hide-details="auto"
        ></v-text-field>
        <span class="mt-1 mb-2 clickable" @click="icaHelper = true">
            <v-icon small class="help-icon">
                mdi-help-circle-outline
            </v-icon>
            {{ $t('where_ica') }}
        </span>
        <v-text-field
            v-model.trim="username"
            outlined
            :label="$t('uom_username')"
            :rules="rulesUsername"
            validate-on-blur
            :disabled="!allowAccount"
            :error-messages="hintUsername"
            prepend-inner-icon="mdi-account-circle-outline"
            class="input"
        ></v-text-field>
        <v-text-field
            v-model.trim="password"
            outlined
            :label="$t('uom_password')"
            :type="showPassword ? 'text' : 'password'"
            :append-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
            :disabled="!allowAccount"
            :error-messages="hintPassword"
            prepend-inner-icon="mdi-lock-outline"
            class="input"
            hide-details="auto"
            @click:append="showPassword = !showPassword"
        ></v-text-field>
        <span class="mt-1 mb-2 clickable" v-show="allowAccount" @click="privacyPolicy = true">
            <v-icon small class="help-icon">
                mdi-information-outline
            </v-icon>
            {{ $t('privacy_policy') }}
        </span>
        <v-text-field
            v-model.trim="email"
            outlined
            :label="$t('uom_email')"
            :disabled="!allowAccount || !allowEmail"
            :error-messages="hintEmail"
            prepend-inner-icon="mdi-at"
            suffix=".manchester.ac.uk"
            class="input"
            hide-details="auto"
        ></v-text-field>
        <v-switch
            v-model="allowSave"
            :label="$t('allow_save')"
            :disabled="!allowSync"
            color="primary"
            class="d-inline-block"
            :class="(allowAccount && allowEmail) ? 'mt-6' : 'mt-0'"
        ></v-switch>
        <v-tooltip top>
            <template v-slot:activator="{ on, attrs }">
                <v-icon
                    v-bind="attrs"
                    v-on="on"
                    class="d-inline-block inline-icon"
                >
                    mdi-information-outline
                </v-icon>
            </template>
            <span>{{ allowSync ? $t('will_store_on') : $t('not_allow_sync') }}</span>
        </v-tooltip>
        <v-dialog
            v-model="icaHelper"
            max-width="550"
        >
            <v-card>
                <v-card-title class="headline">
                    {{ $t('where_ica') }}
                </v-card-title>
                <v-card-text v-html="$t('where_ica_body')">
                </v-card-text>
                <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn
                    color="primary"
                    text
                    @click="icaHelper = false"
                >
                    {{ $t('ok') }}
                </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
        <v-dialog
            v-model="privacyPolicy"
            max-width="500"
        >
            <v-card>
                <v-card-title class="headline">
                    {{ $t('privacy_policy') }}
                </v-card-title>
                <v-card-text v-html="$t('privacy_policy_body')">
                </v-card-text>
                <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn
                    color="primary"
                    text
                    @click="privacyPolicy = false"
                >
                    {{ $t('ok') }}
                </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </div>
</template>

<script>
import { mapState } from 'vuex';

export default {
    name: 'settings',
    data() {
        return {
            calendarURL: '',
            username: '',
            password: '',
            email: '',
            hintUsername: [],
            hintPassword: [],
            hintEmail: [],
            showPassword: false,
            allowSave: false,
            allowAccount: true,
            allowEmail: true,
            allowSync: true,
            icaHelper: false,
            privacyPolicy: false,
            rulesUrl: [
                (value) => (value === '' || /^((https):\/\/)[\w-]+(\.[\w-]+)+([\w.,@?^=%&:/~+#-]*(\.ics))$/i.test(value)) || '',
            ],
            rulesUsername: [
                (value) => (value === '' || /^[a-z]\d{5}[a-z]{2}$/i.test(value.toLowerCase())) || '',
            ],
        };
    },
    methods: {
        /**
         * Focus on the first input
         */
        focusFirst() {
            this.$refs.calendarSub.focus();
        },
        /**
         * Set input's states
         */
        setState(info) {
            if (!info.allowAccount) {
                this.allowAccount = false;
                this.hintUsername = this.$t('not_allow_account');
                this.hintPassword = this.$t('not_allow_account');
                this.hintEmail = this.$t('not_allow_email');
            } else if (!info.allowEmail) {
                this.allowEmail = false;
                this.hintEmail = this.$t('not_allow_email');
            }
            if (!info.allowAccount || !info.allowSync) {
                this.allowSync = false;
            }
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
        }),
    },
    mounted() {
        this.$i18n.locale = localStorage.getItem('language') || 'en';
    },
};
</script>

<style lang="less" scoped>
.inline-icon {
    vertical-align: baseline!important;
    margin-left: 5px;
    font-size: 22px!important;
}
.help-icon {
    vertical-align: text-top!important;
}
.clickable {
    user-select: none;
    display: inline-block;
    cursor: pointer;
}
</style>

<i18n>
{
    "en": {
        "calendar_subscription": "Calendar Subscription",
        "uom_username": "UoM Username",
        "uom_email": "UoM Email",
        "uom_password": "UoM Account Password",
        "allow_save": "Use this backend to sync settings",
        "will_store_on": "Turn on means your UoM account will be stored on this backend",
        "not_allow_account": "This backend doesn't allow you to store UoM account",
        "not_allow_email": "This backend doesn't allow you to sync email",
        "not_allow_sync": "This backend doesn't allow you to sync settings",
        "where_ica": "Where can I get my calendar subscription?",
        "where_ica_body": "Go to <a href=\"https://timetables.manchester.ac.uk/\" target=\"_blank\" rel=\"noreferrer noopener\">this page</a> and click the \"Subscribe\" button in the top right corner of the page after logging in, then click \"More\" and \"Copy\" and paste the URL here.",
        "privacy_policy": "Privacy Policy",
        "privacy_policy_body": "If \"Sync Settings\" is not turned on, <strong>the backend will not store or retain any of your UoM account information</strong>, including username, password, email, grades and more. However, in order to access your grades, emails, attendance etc. from the UoM systems, your UoM account information will be securely transferred to the backend (but will not retained). <br><br>When \"Sync Settings\" is turned on, <strong>your username, password and email will be stored on the backend</strong>, but no other information will be stored.",
        "ok": "OK"
    },
    "zh": {
        "calendar_subscription": "日历订阅",
        "uom_username": "曼大用户名",
        "uom_email": "曼大邮箱",
        "uom_password": "曼大账户密码",
        "allow_save": "使用这个后端同步设置",
        "will_store_on": "启用这个选项意味着此后端将会保存你的曼大账户信息",
        "not_allow_account": "这个后端不允许使用曼大账户",
        "not_allow_email": "这个后端不允许使用邮箱",
        "not_allow_sync": "这个后端不允许同步设置",
        "where_ica": "我能在哪里获得我的日历订阅？",
        "where_ica_body": "前往<a href=\"https://timetables.manchester.ac.uk/\" target=\"_blank\" rel=\"noreferrer noopener\">此页面</a>，并在登录后点击页面右上角 \"Subscribe\" 按钮，然后依次点击 \"More\", \"Copy\"，并在此粘贴得到的 URL。",
        "privacy_policy": "隐私政策",
        "privacy_policy_body": "在未打开“同步设置”选项的情况下，<strong>后端不会存储或保留你的任何曼大账户信息</strong>，包括用户名、密码、邮箱、成绩等。但为了从曼大系统中获取你的成绩、邮件、出席等信息，你的曼大账户信息会被安全地传输至后端（但不会被保留）。<br><br>在打开“同步设置”选项时，<strong>后端会存储你的用户名、密码和邮箱</strong>，但不会存储其他任何信息。",
        "ok": "好"
    },
    "es": {
        "calendar_subscription": "Subscripción de Calendario",
        "uom_username": "UoM nombre de usuario",
        "uom_email": "UoM correo",
        "uom_password": "UoM contraseña de cuenta",
        "allow_save": "Usar este servidor back-end para sincronizar ajustes",
        "will_store_on": "Habilitado permitirá el servidor back-end guardar la información de su cuenta UoM",
        "not_allow_account": "Este servidor back-end no permite guardar la cuenta UoM",
        "not_allow_email": "Este servidor back-end no permite la sincronización del correo",
        "not_allow_sync": "Este servidor back-end no permite la sincronización de ajustes",
        "where_ica": "Dónde puedo obtener mi subscripción del calendario",
        "where_ica_body": "Vaya a <a href=\"https://timetables.manchester.ac.uk/\" target=\"_blank\" rel=\"noreferrer noopener\">, esta página</a>，y tras iniciar sesión haga clic en el botón de \"Subscribe\" en la parte de arriba derecha，más tarde a \"More\", \"Copy\"，respectivamente, y copie el URL obtenido.",
        "privacy_policy": "Política de Privacidad",
        "privacy_policy_body": "Si la \"Configuración de sincronización \" no está activada, <strong> el servidor back-end no almacenará ni retendrá la información de su cuenta de UoM </strong>, incluidos el nombre de usuario, la contraseña, el correo electrónico, las notas y más. Sin embargo, para acceder a sus notas, correos electrónicos, asistencia, etc. desde los sistemas de UoM, la información de su cuenta de UoM se transferirá de forma segura al back-end (pero no se conservará). <br> <br> Cuando la \"Configuración de sincronización \" está activada, <strong> su nombre de usuario, contraseña y correo electrónico se almacenarán en el back-end </strong>, pero no se almacenará ninguna otra información.",
        "ok": "OK"
    }
}
</i18n>
