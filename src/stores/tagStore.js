(function () {
window.TaskApp = window.TaskApp || {}

const STORAGE_KEY = 'tags'

const DEFAULT_TAGS = [
  { id: 'tag-important', name: '重要', color: '#e07a5f' },
  { id: 'tag-urgent', name: '紧急', color: '#e8c97c' },
  { id: 'tag-idea', name: '灵感', color: '#9b7eb5' }
]

const state = Vue.reactive({
  tags: TaskApp.storage.loadFromStorage(STORAGE_KEY) || DEFAULT_TAGS
})

function persist() {
  TaskApp.storage.saveToStorage(STORAGE_KEY, state.tags)
}

TaskApp.tagStore = {
  state,

  getTagById(id) {
    return state.tags.find(function (t) { return t.id === id })
  },

  getTagsByIds(ids) {
    if (!ids || !Array.isArray(ids)) return []
    return ids.map(function (id) { return TaskApp.tagStore.getTagById(id) }).filter(function (t) { return t })
  },

  addTag(name, color) {
    const tag = {
      id: TaskApp.id.generateId(),
      name: name,
      color: color || '#9b7eb5',
      createdAt: TaskApp.date.getISODateTime()
    }
    state.tags.push(tag)
    persist()
    return tag
  },

  updateTag(id, updates) {
    const idx = state.tags.findIndex(function (t) { return t.id === id })
    if (idx === -1) return null
    state.tags[idx] = { ...state.tags[idx], ...updates }
    persist()
    return state.tags[idx]
  },

  deleteTag(id) {
    state.tags = state.tags.filter(function (t) { return t.id !== id })
    persist()
  }
}
})()
