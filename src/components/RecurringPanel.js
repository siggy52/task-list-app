window.TaskApp = window.TaskApp || {}

var tpl = `
  <div class="recurring-panel">
    <div class="recurring-panel-header">
      <span class="recurring-panel-title">↻ 常态化任务</span>
      <span class="recurring-panel-count">{{ activeTasks.length + completedTasks.length }} 个</span>
      <button class="btn-icon" @click="closePanel" title="关闭">✕</button>
    </div>
    <div v-if="activeTasks.length === 0 && completedTasks.length === 0" class="empty-state" style="padding:30px 20px">
      <div class="empty-icon">🔄</div>
      <h3>暂无常态化任务</h3>
      <p>添加任务时勾选"循环任务"即可设置</p>
    </div>
    <div v-else class="recurring-list">
      <div v-if="activeTasks.length" class="recurring-section-label">待办</div>
      <TaskCard v-for="task in activeTasks" :key="task.id" :task="task" />
      <div v-if="completedTasks.length" class="recurring-section-label" style="margin-top:12px">已完成</div>
      <TaskCard v-for="task in completedTasks" :key="task.id" :task="task" />
    </div>
  </div>
`

TaskApp.RecurringPanel = Vue.defineComponent({
  name: 'RecurringPanel',
  template: tpl,
  components: { TaskCard: TaskApp.TaskCard },
  setup() {
    var activeTasks = Vue.computed(function () {
      var ts = TaskApp.taskStore.state.tasks
      return ts.filter(function (t) { return t.recurring !== null && !t.completed })
    })
    var completedTasks = Vue.computed(function () {
      var ts = TaskApp.taskStore.state.tasks
      return ts.filter(function (t) { return t.recurring !== null && t.completed })
    })
    function closePanel() {
      TaskApp.taskStore.state.showRecurringPanel = false
    }
    return { activeTasks: activeTasks, completedTasks: completedTasks, closePanel: closePanel }
  }
})
