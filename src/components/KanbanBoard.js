window.TaskApp = window.TaskApp || {}

var tpl = `
  <div class="kanban-board">
    <KanbanColumn title="待办" status="todo" :tasks="todoTasks" />
    <KanbanColumn title="进行中" status="in-progress" :tasks="inProgressTasks" />
    <KanbanColumn title="已完成" status="completed" :tasks="completedTasks" />
  </div>
`

TaskApp.KanbanBoard = Vue.defineComponent({
  name: 'KanbanBoard',
  template: tpl,
  setup() {
    var todoTasks = Vue.computed(function () {
      return TaskApp.taskStore.filteredTasks.value.filter(function (t) {
        return !t.completed && !t.inProgress && !(t.progress && t.progress.percentage > 0)
      })
    })
    var inProgressTasks = Vue.computed(function () {
      return TaskApp.taskStore.filteredTasks.value.filter(function (t) {
        return !t.completed && (t.inProgress || (t.progress && t.progress.percentage > 0))
      })
    })
    var completedTasks = Vue.computed(function () {
      return TaskApp.taskStore.filteredTasks.value.filter(function (t) { return t.completed })
    })
    return { todoTasks: todoTasks, inProgressTasks: inProgressTasks, completedTasks: completedTasks }
  }
})
