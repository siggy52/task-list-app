window.TaskApp = window.TaskApp || {}

var tpl = `
  <div class="task-list">
    <TaskCard v-for="task in tasks" :key="task.id" :task="task" />
    <div v-if="!hasTasks" class="empty-state">
      <div class="empty-icon">📋</div>
      <h3>还没有任务</h3>
      <p>点击右下角的 + 按钮添加你的第一个任务</p>
    </div>
  </div>
`

TaskApp.TaskList = Vue.defineComponent({
  name: 'TaskList',
  template: tpl,
  setup() {
    var tasks = Vue.computed(function () { return TaskApp.taskStore.filteredTasks.value })
    var hasTasks = Vue.computed(function () { return tasks.value.length > 0 })
    return { tasks: tasks, hasTasks: hasTasks }
  }
})
