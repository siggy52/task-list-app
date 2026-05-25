window.TaskApp = window.TaskApp || {}

var tpl = `
  <div class="modal-overlay" @click="handleOverlayClick">
    <div class="modal-content">
      <div class="modal-title">{{ isEditing ? '编辑任务' : (batchMode ? '批量添加任务' : '添加任务') }}</div>

      <div v-if="!isEditing" class="modal-tabs">
        <button class="tab-btn" :class="{ active: !batchMode }" @click="batchMode = false">单个添加</button>
        <button class="tab-btn" :class="{ active: batchMode }" @click="batchMode = true">批量添加</button>
      </div>

      <template v-if="!batchMode || isEditing">
        <div class="form-group">
          <label class="form-label">任务标题 *</label>
          <input class="form-input" v-model="title" placeholder="输入任务标题" />
        </div>
        <div class="form-group">
          <label class="form-label">描述</label>
          <textarea class="form-textarea" v-model="description" placeholder="添加详细描述（可选）"></textarea>
        </div>
      </template>

      <template v-if="batchMode && !isEditing">
        <div class="form-group">
          <label class="form-label">批量输入任务</label>
          <textarea class="form-textarea batch-textarea" v-model="batchText" placeholder="每行一个任务，支持以下格式：&#10;&#10;1. 任务一；2. 任务二；3. 任务三&#10;&#10;或直接每行一个：&#10;任务一&#10;任务二&#10;任务三&#10;&#10;支持分隔符：；;、,换行"></textarea>
          <div class="batch-preview" v-if="parsedTitles.length > 0">
            <div class="batch-preview-title">识别到 {{ parsedTitles.length }} 个任务：</div>
            <div v-for="(t, i) in parsedTitles" :key="i" class="batch-preview-item">{{ i + 1 }}. {{ t }}</div>
          </div>
        </div>
      </template>

      <div class="form-row">
        <div class="form-group">
          <label class="form-label">分类</label>
          <select class="form-select" v-model="categoryId">
            <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">优先级</label>
          <select class="form-select" v-model="priority">
            <option value="high">高优先级</option>
            <option value="medium">中优先级</option>
            <option value="low">低优先级</option>
          </select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">截止日期</label>
          <input class="form-input" type="date" v-model="dueDate" />
        </div>
        <div class="form-group">
          <label class="form-label" style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:13px">
            <input type="checkbox" v-model="hasRecurring" />
            循环任务
          </label>
        </div>
      </div>
      <div v-if="hasRecurring" class="form-group">
        <div class="recurring-config">
          <div class="recurring-type-select">
            <button class="recurring-option" :class="{ active: recurringType === 'daily' }" @click="setRecurringType('daily')">每天</button>
            <button class="recurring-option" :class="{ active: recurringType === 'weekly' }" @click="setRecurringType('weekly')">每周</button>
            <button class="recurring-option" :class="{ active: recurringType === 'monthly' }" @click="setRecurringType('monthly')">每月</button>
            <button class="recurring-option" :class="{ active: recurringType === 'weekdays' }" @click="setRecurringType('weekdays')">工作日</button>
            <button class="recurring-option" :class="{ active: recurringType === 'custom' }" @click="setRecurringType('custom')">自定义</button>
          </div>
          <div v-if="recurringType === 'custom'" style="display:flex;align-items:center;gap:8px">
            <span style="font-size:13px;color:var(--color-text-secondary)">每</span>
            <input class="form-input" type="number" min="1" max="90" v-model="recurringInterval" style="width:70px;padding:6px 10px" />
            <span style="font-size:13px;color:var(--color-text-secondary)">天</span>
          </div>
        </div>
      </div>
      <div class="form-actions">
        <button class="btn btn-secondary" @click="close">取消</button>
        <button class="btn btn-primary" :disabled="!isValid" @click="save">
          {{ isEditing ? '保存修改' : (batchMode ? '批量添加（' + parsedTitles.length + '个）' : '添加任务') }}
        </button>
      </div>
    </div>
  </div>
`

TaskApp.TaskFormModal = Vue.defineComponent({
  name: 'TaskFormModal',
  template: tpl,
  setup() {
    var editingTask = Vue.computed(function () { return TaskApp.taskStore.state.editingTask })
    var categories = Vue.computed(function () { return TaskApp.categoryStore.state.categories })
    var isEditing = Vue.computed(function () { return editingTask.value !== null })

    var title = Vue.ref('')
    var description = Vue.ref('')
    var categoryId = Vue.ref('')
    var priority = Vue.ref('medium')
    var dueDate = Vue.ref('')
    var hasRecurring = Vue.ref(false)
    var recurringType = Vue.ref('daily')
    var recurringInterval = Vue.ref(1)

    var batchMode = Vue.ref(false)
    var batchText = Vue.ref('')

    var isValid = Vue.computed(function () {
      if (batchMode.value && !isEditing.value) return parsedTitles.value.length > 0
      return title.value.trim().length > 0
    })

    var parsedTitles = Vue.computed(function () {
      if (!batchMode.value || isEditing.value) return []
      var text = batchText.value.trim()
      if (!text) return []

      var results = []

      var lines = text.split('\n')
      for (var i = 0; i < lines.length; i++) {
        var line = lines[i].trim()
        if (!line) continue

        var items = splitLine(line)
        if (items.length > 1) {
          for (var j = 0; j < items.length; j++) {
            var item = items[j].trim()
            if (item) results.push(cleanTaskTitle(item))
          }
        } else {
          results.push(cleanTaskTitle(line))
        }
      }

      return results.filter(function (t) { return t.length > 0 })
    })

    function splitLine(line) {
      var separators = ['；', ';', '、', ',，']
      for (var i = 0; i < separators.length; i++) {
        var sep = separators[i]
        if (line.indexOf(sep) > -1) {
          return line.split(sep)
        }
      }
      return [line]
    }

    function cleanTaskTitle(str) {
      return str.replace(/^\d+[\.\、\s]*/, '').trim()
    }

    var task = editingTask.value
    if (task) {
      title.value = task.title
      description.value = task.description || ''
      categoryId.value = task.categoryId || (TaskApp.categoryStore.state.categories[0] ? TaskApp.categoryStore.state.categories[0].id : '')
      priority.value = task.priority || 'medium'
      dueDate.value = task.dueDate || ''
      hasRecurring.value = !!task.recurring
      if (task.recurring) {
        recurringType.value = task.recurring.type
        recurringInterval.value = task.recurring.interval || 1
      }
    }

    function setRecurringType(type) { recurringType.value = type }
    function close() { TaskApp.taskStore.closeTaskForm() }
    function handleOverlayClick(e) { if (e.target === e.currentTarget) close() }

    function save() {
      if (!isValid.value) return

      var commonData = {
        description: description.value.trim(),
        categoryId: categoryId.value,
        priority: priority.value,
        dueDate: dueDate.value || ''
      }
      if (hasRecurring.value) {
        commonData.recurring = {
          type: recurringType.value,
          interval: recurringType.value === 'custom' ? recurringInterval.value : undefined
        }
      } else {
        commonData.recurring = null
      }

      if (batchMode.value && !isEditing.value) {
        var count = parsedTitles.value.length
        if (count > 0) {
          TaskApp.taskStore.addBatchTasks(parsedTitles.value, commonData)
        }
      } else if (isEditing.value) {
        TaskApp.taskStore.updateTask(editingTask.value.id, {
          title: title.value.trim(),
          description: description.value.trim(),
          categoryId: categoryId.value,
          priority: priority.value,
          dueDate: dueDate.value || '',
          recurring: commonData.recurring
        })
      } else {
        TaskApp.taskStore.addTask({
          title: title.value.trim(),
          description: description.value.trim(),
          categoryId: categoryId.value,
          priority: priority.value,
          dueDate: dueDate.value || '',
          recurring: commonData.recurring
        })
      }
      close()
    }

    return {
      editingTask: editingTask, categories: categories, isEditing: isEditing, isValid: isValid,
      title: title, description: description, categoryId: categoryId, priority: priority, dueDate: dueDate,
      hasRecurring: hasRecurring, recurringType: recurringType, recurringInterval: recurringInterval,
      batchMode: batchMode, batchText: batchText, parsedTitles: parsedTitles,
      setRecurringType: setRecurringType, save: save, close: close, handleOverlayClick: handleOverlayClick
    }
  }
})
