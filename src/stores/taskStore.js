(function () {
window.TaskApp = window.TaskApp || {}

const STORAGE_KEY = 'tasks'

function createDefaultFilters() {
  return { keyword: '', status: 'all', categoryId: 'all', priority: 'all', dueFilter: 'all' }
}

const state = Vue.reactive({
  tasks: TaskApp.storage.loadFromStorage(STORAGE_KEY) || [],
  currentView: 'kanban',
  filters: createDefaultFilters(),
  showTaskForm: false,
  showCategoryModal: false,
  editingTask: null,
  showDeleteConfirm: null,
  showRecurringPanel: false,
  showTagModal: false,
  batchMode: false,
  selectedTaskIds: [],
  showBatchDeleteConfirm: false
})

function persist() {
  TaskApp.storage.saveToStorage(STORAGE_KEY, state.tasks)
}

TaskApp.taskStore = {
  state,

  filteredTasks: Vue.computed(function () {
    let result = [...state.tasks]

    if (state.filters.keyword) {
      const kw = state.filters.keyword.toLowerCase()
      result = result.filter(function (t) {
        return t.title.toLowerCase().includes(kw) ||
          (t.description && t.description.toLowerCase().includes(kw))
      })
    }

    if (state.filters.status === 'active') {
      result = result.filter(function (t) { return !t.completed })
    } else if (state.filters.status === 'completed') {
      result = result.filter(function (t) { return t.completed })
    }

    if (state.filters.categoryId && state.filters.categoryId !== 'all') {
      result = result.filter(function (t) { return t.categoryId === state.filters.categoryId })
    }

    if (state.filters.priority && state.filters.priority !== 'all') {
      result = result.filter(function (t) { return t.priority === state.filters.priority })
    }

    if (state.filters.dueFilter === 'today') {
      const today = TaskApp.date.getISODate()
      result = result.filter(function (t) { return !t.completed && t.dueDate === today })
    }

    result.sort(function (a, b) {
      if (a.completed !== b.completed) return a.completed ? 1 : -1
      if (a.inProgress !== b.inProgress) return a.inProgress ? -1 : 1
      if ((a.priority === 'high') !== (b.priority === 'high')) return a.priority === 'high' ? -1 : 1
      if ((a.priority === 'medium') !== (b.priority === 'medium')) return a.priority === 'medium' ? -1 : 1
      return new Date(b.createdAt) - new Date(a.createdAt)
    })

    return result
  }),

  stats: Vue.computed(function () {
    const total = state.tasks.length
    const completed = state.tasks.filter(function (t) { return t.completed }).length
    const active = total - completed
    const todayDue = state.tasks.filter(function (t) {
      if (t.completed) return false
      return t.dueDate === TaskApp.date.getISODate()
    }).length
    return { total: total, completed: completed, active: active, todayDue: todayDue }
  }),

  addTask(taskData) {
    const now = TaskApp.date.getISODateTime()
    const task = {
      id: TaskApp.id.generateId(),
      title: taskData.title,
      description: taskData.description || '',
      categoryId: taskData.categoryId || '',
      tags: taskData.tags || [],
      priority: taskData.priority || 'medium',
      dueDate: taskData.dueDate || '',
      completed: false,
      completedAt: null,
      inProgress: false,
      progress: taskData.progress || { percentage: 0, note: '' },
      recurring: taskData.recurring || null,
      createdAt: now,
      updatedAt: now,
      order: state.tasks.length
    }
    state.tasks.unshift(task)
    persist()
    return task
  },

  updateTask(id, updates) {
    const idx = state.tasks.findIndex(function (t) { return t.id === id })
    if (idx === -1) return null
    const task = { ...state.tasks[idx], ...updates, updatedAt: TaskApp.date.getISODateTime() }
    state.tasks[idx] = task
    persist()
    return task
  },

  deleteTask(id) {
    state.tasks = state.tasks.filter(function (t) { return t.id !== id })
    state.showDeleteConfirm = null
    persist()
  },

  toggleComplete(id) {
    const task = state.tasks.find(function (t) { return t.id === id })
    if (!task) return

    if (!task.completed) {
      task.completed = true
      task.inProgress = false
      task.completedAt = TaskApp.date.getISODateTime()
      task.updatedAt = TaskApp.date.getISODateTime()
      if (!task.progress || task.progress.percentage < 100) {
        task.progress = { percentage: 100, note: (task.progress && task.progress.note) || '' }
      }

      if (task.recurring) {
        const nextDue = computeNextDueDate(task)
        if (nextDue) {
          const newTask = {
            ...task,
            id: TaskApp.id.generateId(),
            completed: false,
            completedAt: null,
            inProgress: false,
            dueDate: nextDue,
            progress: { percentage: 0, note: '' },
            createdAt: TaskApp.date.getISODateTime(),
            updatedAt: TaskApp.date.getISODateTime(),
            order: state.tasks.length
          }
          state.tasks.unshift(newTask)
        }
      }
    } else {
      task.completed = false
      task.completedAt = null
      task.inProgress = task.progress && task.progress.percentage > 0
      task.updatedAt = TaskApp.date.getISODateTime()
    }
    persist()
  },

  setFilter(key, value) {
    state.filters[key] = value
  },

  setStatusFilter(status) {
    state.filters.status = status
    state.filters.dueFilter = 'all'
    state.showRecurringPanel = false
  },

  resetFilters() {
    Object.assign(state.filters, createDefaultFilters())
  },

  switchView(view) {
    state.currentView = view
    state.showRecurringPanel = false
  },

  toggleRecurringPanel() {
    state.showRecurringPanel = !state.showRecurringPanel
  },

  openTagModal() {
    state.showTagModal = true
    state.showRecurringPanel = false
  },

  closeTagModal() {
    state.showTagModal = false
  },

  changeCategory(taskId, categoryId) {
    const task = state.tasks.find(function (t) { return t.id === taskId })
    if (!task) return
    task.categoryId = categoryId
    task.updatedAt = TaskApp.date.getISODateTime()
    persist()
  },

  cyclePriority(taskId) {
    const task = state.tasks.find(function (t) { return t.id === taskId })
    if (!task) return
    const map = { high: 'low', medium: 'high', low: 'medium' }
    task.priority = map[task.priority] || 'medium'
    task.updatedAt = TaskApp.date.getISODateTime()
    persist()
  },

  toggleTaskTag(taskId, tagId) {
    const task = state.tasks.find(function (t) { return t.id === taskId })
    if (!task) return
    if (!task.tags) task.tags = []
    const idx = task.tags.indexOf(tagId)
    if (idx === -1) {
      task.tags.push(tagId)
    } else {
      task.tags.splice(idx, 1)
    }
    task.updatedAt = TaskApp.date.getISODateTime()
    persist()
  },

  recurringTasks: Vue.computed(function () {
    return state.tasks.filter(function (t) { return t.recurring !== null })
  }),

  openTaskForm(task) {
    if (task === undefined) task = null
    state.editingTask = task ? { ...task } : null
    state.showTaskForm = true
  },

  closeTaskForm() {
    state.showTaskForm = false
    state.editingTask = null
  },

  openCategoryModal() {
    state.showCategoryModal = true
    state.showRecurringPanel = false
  },

  closeCategoryModal() {
    state.showCategoryModal = false
  },

  confirmDelete(task) {
    state.showDeleteConfirm = task
  },

  cancelDelete() {
    state.showDeleteConfirm = null
  },

  toggleBatchMode() {
    state.batchMode = !state.batchMode
    if (!state.batchMode) state.selectedTaskIds = []
  },

  toggleTaskSelection(id) {
    const idx = state.selectedTaskIds.indexOf(id)
    if (idx === -1) {
      state.selectedTaskIds.push(id)
    } else {
      state.selectedTaskIds.splice(idx, 1)
    }
  },

  confirmBatchDelete() {
    state.showBatchDeleteConfirm = true
  },

  cancelBatchDelete() {
    state.showBatchDeleteConfirm = false
  },

  deleteSelectedTasks() {
    const ids = state.selectedTaskIds
    state.tasks = state.tasks.filter(function (t) { return ids.indexOf(t.id) === -1 })
    state.selectedTaskIds = []
    state.batchMode = false
    state.showBatchDeleteConfirm = false
    persist()
  },

  moveTask(taskId, newStatus) {
    const task = state.tasks.find(function (t) { return t.id === taskId })
    if (!task) return
    task.completed = newStatus === 'completed'
    task.inProgress = newStatus === 'in-progress'
    task.updatedAt = TaskApp.date.getISODateTime()
    if (task.completed) {
      task.completedAt = TaskApp.date.getISODateTime()
    } else {
      task.completedAt = null
    }
    persist()
  },

  importTasks(tasks) {
    if (!Array.isArray(tasks)) return 0
    let count = 0
    const existingIds = new Set(state.tasks.map(function (t) { return t.id }))
    for (let i = 0; i < tasks.length; i++) {
      const task = tasks[i]
      if (!task.id || !task.title) continue
      if (existingIds.has(task.id)) continue
      state.tasks.push({ ...task, updatedAt: TaskApp.date.getISODateTime() })
      existingIds.add(task.id)
      count++
    }
    persist()
    return count
  },

  exportTasks() {
    return JSON.stringify(state.tasks, null, 2)
  },

  updateProgress(id, percentage, note) {
    const task = state.tasks.find(function (t) { return t.id === id })
    if (!task) return
    task.progress = { percentage: percentage, note: note || '' }
    task.inProgress = percentage > 0 && percentage < 100
    if (percentage === 100 && !task.completed) {
      task.completed = true
      task.completedAt = TaskApp.date.getISODateTime()
    } else if (percentage < 100 && task.completed) {
      task.completed = false
      task.completedAt = null
    }
    task.updatedAt = TaskApp.date.getISODateTime()
    persist()
  },

  addBatchTasks(titles, commonData) {
    const now = TaskApp.date.getISODateTime()
    var added = []
    for (var i = 0; i < titles.length; i++) {
      var title = titles[i].trim()
      if (!title) continue
      var task = {
        id: TaskApp.id.generateId(),
        title: title,
        description: commonData.description || '',
        categoryId: commonData.categoryId || '',
        tags: [],
        priority: commonData.priority || 'medium',
        dueDate: commonData.dueDate || '',
        completed: false,
        completedAt: null,
        inProgress: false,
        progress: { percentage: 0, note: '' },
        recurring: commonData.recurring || null,
        createdAt: now,
        updatedAt: now,
        order: state.tasks.length + added.length
      }
      state.tasks.unshift(task)
      added.push(task)
    }
    persist()
    return added
  }
}

function computeNextDueDate(task) {
  if (!task.recurring || !task.dueDate) return null
  const current = new Date(task.dueDate)
  const type = task.recurring.type
  const interval = task.recurring.interval
  const daysOfWeek = task.recurring.daysOfWeek

  switch (type) {
    case 'daily':
      current.setDate(current.getDate() + 1)
      return TaskApp.date.getISODate(current)
    case 'weekly':
      current.setDate(current.getDate() + 7)
      return TaskApp.date.getISODate(current)
    case 'monthly':
      current.setMonth(current.getMonth() + 1)
      return TaskApp.date.getISODate(current)
    case 'weekdays': {
      let next = new Date(current)
      next.setDate(next.getDate() + 1)
      while (next.getDay() === 0 || next.getDay() === 6) {
        next.setDate(next.getDate() + 1)
      }
      return TaskApp.date.getISODate(next)
    }
    case 'custom': {
      const days = interval || 1
      current.setDate(current.getDate() + days)
      return TaskApp.date.getISODate(current)
    }
    case 'weekly-specific': {
      if (!daysOfWeek || daysOfWeek.length === 0) return null
      const today = new Date()
      const todayDay = today.getDay()
      const sortedDays = [...daysOfWeek].sort(function (a, b) { return a - b })
      let nextDay = sortedDays.find(function (d) { return d > todayDay })
      if (nextDay === undefined) {
        nextDay = sortedDays[0] + 7
      }
      const next = new Date(today)
      next.setDate(today.getDate() + (nextDay - todayDay))
      return TaskApp.date.getISODate(next)
    }
    default:
      return null
  }
}
})()
