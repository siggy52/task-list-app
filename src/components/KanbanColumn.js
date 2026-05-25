window.TaskApp = window.TaskApp || {}

var tpl = `
  <div class="kanban-column" :class="columnClass">
    <div class="kanban-column-header">
      {{ title }}
      <span class="kanban-column-count">{{ tasks.length }}</span>
    </div>
    <div
      class="kanban-column-body"
      :class="{ 'drag-over': dragOver }"
      @dragover="onDragOver"
      @dragleave="onDragLeave"
      @drop="onDrop"
    >
      <div
        v-for="task in tasks"
        :key="task.id"
        class="kanban-card-wrapper"
        draggable="true"
        @dragstart="onDragStart($event, task)"
        @dragend="onDragEnd"
      >
        <TaskCard :task="task" compact />
      </div>
      <div v-if="tasks.length === 0" class="kanban-empty-hint">拖拽任务到此处</div>
    </div>
  </div>
`

TaskApp.KanbanColumn = Vue.defineComponent({
  name: 'KanbanColumn',
  props: {
    title: { type: String, required: true },
    status: { type: String, required: true },
    tasks: { type: Array, required: true }
  },
  template: tpl,
  components: { TaskCard: TaskApp.TaskCard },
  setup(props) {
    var dragOver = Vue.ref(false)

    var columnClass = Vue.computed(function () {
      var map = { todo: 'todo', 'in-progress': 'in-progress', completed: 'completed' }
      return map[props.status] || 'todo'
    })

    function onDragStart(e, task) {
      e.dataTransfer.setData('text/plain', JSON.stringify({ id: task.id, status: props.status }))
      var wrapper = e.target.closest('.kanban-card-wrapper')
      if (wrapper) wrapper.classList.add('dragging')
    }

    function onDragEnd(e) {
      var wrapper = e.target.closest('.kanban-card-wrapper')
      if (wrapper) wrapper.classList.remove('dragging')
    }

    function onDragOver(e) {
      e.preventDefault()
      dragOver.value = true
    }

    function onDragLeave() {
      dragOver.value = false
    }

    function onDrop(e) {
      e.preventDefault()
      dragOver.value = false
      try {
        var data = JSON.parse(e.dataTransfer.getData('text/plain'))
        if (data.status !== props.status) {
          TaskApp.taskStore.moveTask(data.id, props.status)
        }
      } catch (err) {}
    }

    return {
      columnClass: columnClass, dragOver: dragOver,
      onDragStart: onDragStart, onDragEnd: onDragEnd,
      onDragOver: onDragOver, onDragLeave: onDragLeave, onDrop: onDrop
    }
  }
})
