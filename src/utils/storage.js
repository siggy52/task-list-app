window.TaskApp = window.TaskApp || {}
const PREFIX = 'task-list-'

TaskApp.storage = {
  _hasFileData: false,

  loadFromStorage(key) {
    try {
      const raw = localStorage.getItem(PREFIX + key)
      if (raw === null) return null
      return JSON.parse(raw)
    } catch (e) {
      return null
    }
  },

  saveToStorage(key, data) {
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify(data))
      return true
    } catch (e) {
      return false
    }
  },

  removeFromStorage(key) {
    try {
      localStorage.removeItem(PREFIX + key)
    } catch (e) {}
  },

  loadFileData() {
    return fetch('data.json')
      .then(function (r) {
        if (!r.ok) throw new Error('not found')
        return r.json()
      })
      .then(function (data) {
        if (data && data.tasks && data.tasks.length > 0) return data
        return null
      })
      .catch(function () {
        return null
      })
  },

  gatherAllData() {
    var tasks = TaskApp.taskStore.state.tasks || []
    var categories = TaskApp.categoryStore.state.categories || []
    var tags = TaskApp.tagStore.state.tags || []
    return { version: 1, tasks: tasks, categories: categories, tags: tags }
  }
}
