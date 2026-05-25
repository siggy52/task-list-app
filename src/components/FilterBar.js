window.TaskApp = window.TaskApp || {}

var tpl = `
  <div class="filter-bar">
    <div class="search-wrapper">
      <span class="search-icon">🔍</span>
      <input type="text" placeholder="搜索任务..." :value="filters.keyword" @input="onKeywordInput" />
    </div>
    <select class="filter-select" :value="filters.status" @change="setFilter('status', $event)">
      <option value="all">全部状态</option>
      <option value="active">待办</option>
      <option value="completed">已完成</option>
    </select>
    <select class="filter-select" :value="filters.categoryId" @change="setFilter('categoryId', $event)">
      <option value="all">全部分类</option>
      <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
    </select>
    <select class="filter-select" :value="filters.priority" @change="setFilter('priority', $event)">
      <option value="all">全部优先级</option>
      <option value="high">高优先级</option>
      <option value="medium">中优先级</option>
      <option value="low">低优先级</option>
    </select>
    <button class="btn-reset" @click="resetFilters">重置</button>
  </div>
`

TaskApp.FilterBar = Vue.defineComponent({
  name: 'FilterBar',
  template: tpl,
  setup() {
    var filters = Vue.computed(function () { return TaskApp.taskStore.state.filters })
    var categories = Vue.computed(function () { return TaskApp.categoryStore.state.categories })

    function setFilter(key, event) { TaskApp.taskStore.setFilter(key, event.target.value) }
    function resetFilters() { TaskApp.taskStore.resetFilters() }
    function onKeywordInput(event) { TaskApp.taskStore.setFilter('keyword', event.target.value) }

    return { filters: filters, categories: categories, setFilter: setFilter, resetFilters: resetFilters, onKeywordInput: onKeywordInput }
  }
})
