window.TaskApp = window.TaskApp || {}

TaskApp.id = {
  generateId() {
    const timestamp = Date.now().toString(36)
    const random = Math.random().toString(36).substring(2, 10)
    return timestamp + '-' + random
  }
}
