window.TaskApp = window.TaskApp || {}

var tpl = `
  <div class="stats-cards">
    <div class="stat-card total clickable" :class="{ 'active-filter': activeFilter === 'all' }" @click="filterAll">
      <div class="stat-number">{{ stats.total }}</div>
      <div class="stat-label">全部</div>
    </div>
    <div class="stat-card active clickable" :class="{ 'active-filter': activeFilter === 'active' }" @click="filterActive">
      <div class="stat-number">{{ stats.active }}</div>
      <div class="stat-label">待办</div>
    </div>
    <div class="stat-card completed clickable" :class="{ 'active-filter': activeFilter === 'completed' }" @click="filterCompleted">
      <div class="stat-number">{{ stats.completed }}</div>
      <div class="stat-label">已完成</div>
    </div>
    <div class="stat-card due-today clickable" :class="{ 'active-filter': activeFilter === 'today' }" @click="filterToday">
      <div class="stat-number">{{ stats.todayDue }}</div>
      <div class="stat-label">今日到期</div>
    </div>
  </div>
`

TaskApp.StatsCards = Vue.defineComponent({
  name: 'StatsCards',
  template: tpl,
  setup() {
    var stats = Vue.computed(function () { return TaskApp.taskStore.stats.value })
    var activeFilter = Vue.computed(function () {
      var f = TaskApp.taskStore.state.filters
      if (f.dueFilter === 'today') return 'today'
      if (f.status === 'all') return 'all'
      return f.status
    })
    function filterAll() {
      TaskApp.taskStore.resetFilters()
    }
    function filterActive() {
      TaskApp.taskStore.setStatusFilter('active')
    }
    function filterCompleted() {
      TaskApp.taskStore.setStatusFilter('completed')
    }
    function filterToday() {
      var f = TaskApp.taskStore.state.filters
      f.status = 'active'
      f.dueFilter = 'today'
      f.categoryId = 'all'
      f.priority = 'all'
      TaskApp.taskStore.state.showRecurringPanel = false
    }
    return { stats: stats, activeFilter: activeFilter, filterAll: filterAll, filterActive: filterActive, filterCompleted: filterCompleted, filterToday: filterToday }
  }
})
