<template>
    <v-card
        class="mx-auto rounded-lg todo-container"
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
        <div class="todo-outer">
            <h2 class="handle">
                TO-DO
                <span class="num-badge" v-show="(todos.length - ifTodos.length) > 0">{{ todos.length - ifTodos.length }}</span>
            </h2>
            <v-text-field
                :label="$t('add_todo')"
                outlined
                class="input"
                prepend-inner-icon="mdi-format-list-checks"
                clearable
                v-model.trim="addText"
                v-on:keyup.enter="addOne"
            ></v-text-field>
            <v-list flat class="list">
                <v-list-item-group
                    v-model="ifTodos"
                    multiple
                    active-class="done"
                >
                    <v-list-item v-for="(todo, index) in todos" :key="index">
                        <template v-slot:default="{ active }">
                            <v-list-item-action>
                                <v-checkbox :input-value="active"></v-checkbox>
                            </v-list-item-action>

                            <v-list-item-content>
                                <v-list-item-title>{{ todo }}</v-list-item-title>
                            </v-list-item-content>

                            <v-list-item-action class="delete">
                                <v-btn icon @click.stop="removeTodo(index)">
                                    <v-icon color="grey">mdi-delete-outline</v-icon>
                                </v-btn>
                            </v-list-item-action>
                        </template>
                    </v-list-item>
                </v-list-item-group>
            </v-list>
            <div class="empty" v-if="todos.length === 0">
                <v-icon color="grey" x-large>mdi-check-all</v-icon>
            </div>
        </div>
    </v-card>
</template>

<script>
import { mapState } from 'vuex';

export default {
    name: 'todo',
    props: {
        searchid: Number,
    },
    data() {
        return {
            loading: false,
            todos: [],
            ifTodos: [],
            addText: '',
            timer: null,
        };
    },
    methods: {
        /**
         * Add a TO-DO into TO-DO list
         */
        addOne() {
            if (this.addText !== '') {
                this.todos.push(this.addText);
                this.addText = '';
                this.$nextTick(() => {
                    this.packery.shiftLayout();
                });
            }
        },
        /**
         * Remove one TO-DO from the list by index
         * @param {number} index TO-DO index
         */
        removeTodo(index) {
            // Create a copy to protect the original array
            const ifTodosCopy = [];
            for (let i = 0; i < this.ifTodos.length; i += 1) {
                ifTodosCopy.push(this.ifTodos[i]);
            }

            // Remove the index and update the remaining
            for (let i = 0; i < ifTodosCopy.length; i += 1) {
                if (ifTodosCopy[i] === index) {
                    ifTodosCopy.splice(i, 1);
                } else {
                    if (ifTodosCopy[i] > index) {
                        ifTodosCopy[i] -= 1;
                    }
                }
            }
            this.ifTodos = ifTodosCopy;

            // Update TO-DOs list
            this.todos.splice(index, 1);

            // Update layout
            this.$nextTick(() => {
                this.packery.shiftLayout();
            });
        },
        /**
         * Store TO-DOs into localstorage
         */
        store() {
            localStorage.setItem('todos', JSON.stringify({
                todos: this.todos,
                ifTodos: this.ifTodos,
            }));
            this.sync();
        },
        /**
         * Sync TO-DOs with backend
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
            const index = [];
            for (let i = 0; i < this.todos.length; i += 1) {
                index.push({
                    content: this.todos[i],
                    id: `todo-${i}`,
                    rawIndex: i,
                    done: this.ifTodos.includes(i),
                });
            }
            this.$store.commit('setSearchIndex', {
                id: this.searchid,
                payload: {
                    name: 'todo',
                    key: 'id',
                    indexes: ['content'],
                    data: index,
                },
            });
        },
    },
    watch: {
        locale() {
            this.$i18n.locale = this.locale;
        },
        todos() {
            // Store if TO-DO list changed
            this.store();
            this.buildSearchIndex();
        },
        ifTodos() {
            // Store if TO-DOs' states changed
            this.store();
            this.buildSearchIndex();
        },
        searchNotification() {
            // Handle search actions
            if (this.searchNotification.target === 'todo') {
                if (this.searchNotification.payload.action === 'syncDone') {
                    // Sync states
                    for (const item of this.searchNotification.payload.payload) {
                        if (item.done) {
                            if (!this.ifTodos.includes(item.rawIndex)) {
                                this.ifTodos.push(item.rawIndex);
                            }
                        } else {
                            if (this.ifTodos.includes(item.rawIndex)) {
                                this.ifTodos.splice(this.ifTodos.indexOf(item.rawIndex), 1);
                            }
                        }
                    }
                } else if (this.searchNotification.payload.action === 'delete') {
                    // Delete one
                    this.removeTodo(this.searchNotification.payload.index);
                }
            }
        },
    },
    computed: {
        ...mapState({
            locale: (state) => state.locale,
            packery: (state) => state.packery,
            searchNotification: (state) => state.searchNotification,
        }),
    },
    mounted() {
        this.$i18n.locale = localStorage.getItem('language') || 'en';

        // Restore TO-DOs from localstorage
        const storaged = localStorage.getItem('todos');
        if (storaged) {
            const storagedTodos = JSON.parse(storaged);
            this.todos = storagedTodos.todos;
            this.ifTodos = storagedTodos.ifTodos;
        }

        // Sync with backend every 30 minutes
        this.timer = setInterval(() => {
            this.sync();
        }, 1800000);

        this.buildSearchIndex();
    },
    beforeDestroy() {
        clearInterval(this.timer);
    },
};
</script>

<style lang="less">
.todo-container {
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
        .num-badge {
            display: inline-block;
            padding: 0 9px;
            min-width: 25px;
            border-radius: 10px;
            background-color: #EEEEEE;
            font-size: 13.5px;
            vertical-align: text-top;
            margin-left: 3px;
        }
    }
    .input {
        width: 92%;
        margin-left: 4%!important;
        margin-top: 15px!important;
        margin-bottom: -20px!important;
    }
    .list {
        padding-top: 0;
        .v-list-item__action {
            margin: 7.5px 16px 7.5px 0;
        }
        .delete {
            margin-right: 0;
            margin-left: 8px;
            opacity: 0;
            transition: .2s;
        }
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
    .done {
        color: rgba(0, 0, 0, .4);
        .v-list-item__title {
            text-decoration: line-through;
        }
    }
    .todo-outer {
        width: 100%;
        min-height: 260px;
    }
}
#app.theme--dark .todo-container {
    h2 {
        .num-badge {
            background-color: #3E3E3E;
        }
    }
    .v-list-item {
        &:hover, &:focus {
            background-color: rgba(255, 255, 255, .04);
        }
    }
    .done {
        color: rgba(255, 255, 255, 0.4);
    }
}
</style>

<i18n>
{
    "en": {
        "add_todo": "Add a TO-DO"
    },
    "zh": {
        "add_todo": "添加一个待办"
    },
    "es": {
        "add_todo": "Añadir un PARA-HACER"
    }
}
</i18n>
