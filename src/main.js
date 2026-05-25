function tryLoadFromFile() {
  return TaskApp.storage.loadFileData().then(function (fileData) {
    if (!fileData) return false

    if (fileData.tasks && Array.isArray(fileData.tasks) && fileData.tasks.length > 0) {
      TaskApp.storage.saveToStorage('tasks', fileData.tasks)
      TaskApp.taskStore.state.tasks.splice(0, TaskApp.taskStore.state.tasks.length)
      for (var i = 0; i < fileData.tasks.length; i++) {
        TaskApp.taskStore.state.tasks.push(fileData.tasks[i])
      }
    }
    if (fileData.categories && Array.isArray(fileData.categories) && fileData.categories.length > 0) {
      TaskApp.storage.saveToStorage('categories', fileData.categories)
      TaskApp.categoryStore.state.categories.splice(0, TaskApp.categoryStore.state.categories.length)
      for (var j = 0; j < fileData.categories.length; j++) {
        TaskApp.categoryStore.state.categories.push(fileData.categories[j])
      }
    }
    if (fileData.tags && Array.isArray(fileData.tags) && fileData.tags.length > 0) {
      TaskApp.storage.saveToStorage('tags', fileData.tags)
      TaskApp.tagStore.state.tags.splice(0, TaskApp.tagStore.state.tags.length)
      for (var k = 0; k < fileData.tags.length; k++) {
        TaskApp.tagStore.state.tags.push(fileData.tags[k])
      }
    }
    return true
  })
}

var app = Vue.createApp(TaskApp.App)

app.component('TopBar', TaskApp.TopBar)
app.component('StatsCards', TaskApp.StatsCards)
app.component('FilterBar', TaskApp.FilterBar)
app.component('TaskList', TaskApp.TaskList)
app.component('TaskCard', TaskApp.TaskCard)
app.component('KanbanBoard', TaskApp.KanbanBoard)
app.component('KanbanColumn', TaskApp.KanbanColumn)
app.component('TaskFormModal', TaskApp.TaskFormModal)
app.component('CategoryModal', TaskApp.CategoryModal)
app.component('TagModal', TaskApp.TagModal)
app.component('RecurringPanel', TaskApp.RecurringPanel)
app.component('ChartsView', TaskApp.ChartsView)

app.mount('#app')

tryLoadFromFile().then(function (hasFileData) {
  TaskApp.storage._hasFileData = hasFileData
})
