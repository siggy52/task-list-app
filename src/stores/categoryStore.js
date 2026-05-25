(function () {
window.TaskApp = window.TaskApp || {}

const STORAGE_KEY = 'categories'

const DEFAULT_CATEGORIES = [
  { id: 'cat-work', name: '工作', color: '#e8a87c' },
  { id: 'cat-personal', name: '个人', color: '#84a98c' },
  { id: 'cat-study', name: '学习', color: '#6b8cae' }
]

const state = Vue.reactive({
  categories: TaskApp.storage.loadFromStorage(STORAGE_KEY) || DEFAULT_CATEGORIES
})

function persist() {
  TaskApp.storage.saveToStorage(STORAGE_KEY, state.categories)
}

TaskApp.categoryStore = {
  state,

  getCategoryById(id) {
    return state.categories.find(c => c.id === id)
  },

  addCategory(name, color) {
    const category = {
      id: TaskApp.id.generateId(),
      name,
      color: color || '#e8a87c',
      createdAt: TaskApp.date.getISODateTime()
    }
    state.categories.push(category)
    persist()
    return category
  },

  updateCategory(id, updates) {
    const idx = state.categories.findIndex(c => c.id === id)
    if (idx === -1) return null
    state.categories[idx] = { ...state.categories[idx], ...updates }
    persist()
    return state.categories[idx]
  },

  deleteCategory(id) {
    state.categories = state.categories.filter(c => c.id !== id)
    persist()
  }
}
})()
