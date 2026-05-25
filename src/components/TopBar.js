window.TaskApp = window.TaskApp || {}

var tpl = `
  <div class="top-bar">
    <div class="app-title">任务<span>清单</span></div>
    <div class="top-bar-actions">
      <div class="view-toggle">
        <button class="btn-icon" :class="{ active: currentView === 'list' }" @click="toggleView('list')" title="列表视图">☰</button>
        <button class="btn-icon" :class="{ active: currentView === 'kanban' }" @click="toggleView('kanban')" title="看板视图">⊞</button>
        <button class="btn-icon" :class="{ active: currentView === 'charts' }" @click="toggleView('charts')" title="统计视图">📊</button>
      </div>
      <button class="btn-icon" :class="{ active: showRecurring }" @click="toggleRecurring" title="常态化任务">↻</button>
      <button class="btn-icon" :class="{ active: isBatch }" @click="doToggleBatch" title="批量操作">☑</button>
      <button class="btn-icon" @click="openCategory" title="分类管理">▦</button>
      <button class="btn-icon" @click="openTag" title="标签管理">#</button>
      <div class="import-export-menu" @mouseleave="closeDropdown">
        <button class="btn-icon" @click="toggleDropdown" title="数据管理">⋮</button>
        <div v-if="showDropdown" class="import-export-dropdown">
          <button class="dropdown-item" @click="saveToRoot">💾 保存到根目录</button>
          <button class="dropdown-item" @click="exportJSON">📥 导出 JSON</button>
          <button class="dropdown-item" @click="exportCSV">📊 导出 CSV</button>
          <button class="dropdown-item" @click="triggerImport">📤 导入数据</button>
        </div>
      </div>
    </div>
    <input type="file" ref="fileInput" accept=".json" style="display:none" @change="handleImport" />
    <div v-if="toast" class="import-toast">{{ toast }}</div>
  </div>
`

TaskApp.TopBar = Vue.defineComponent({
  name: 'TopBar',
  template: tpl,
  setup() {
    var showDropdown = Vue.ref(false)
    var toast = Vue.ref(null)
    var fileInput = Vue.ref(null)

    var currentView = Vue.computed(function () { return TaskApp.taskStore.state.currentView })
    var showRecurring = Vue.computed(function () { return TaskApp.taskStore.state.showRecurringPanel })
    var isBatch = Vue.computed(function () { return TaskApp.taskStore.state.batchMode })

    function toggleView(view) { TaskApp.taskStore.switchView(view) }
    function toggleRecurring() { TaskApp.taskStore.toggleRecurringPanel() }
    function doToggleBatch() { TaskApp.taskStore.toggleBatchMode() }
    function openCategory() { TaskApp.taskStore.openCategoryModal() }
    function openTag() { TaskApp.taskStore.openTagModal() }
    function toggleDropdown() { showDropdown.value = !showDropdown.value }
    function closeDropdown() { showDropdown.value = false }

    function showToast(msg) {
      toast.value = msg
      setTimeout(function () { toast.value = null }, 2500)
    }

    function saveToRoot() {
      var data = TaskApp.storage.gatherAllData()
      var json = JSON.stringify(data, null, 2)
      downloadFile(json, 'data.json', 'application/json')
      showDropdown.value = false
      showToast('data.json 已下载，请放到项目根目录')
    }

    function exportJSON() {
      var data = {
        version: 1,
        exportedAt: new Date().toISOString(),
        tasks: JSON.parse(TaskApp.taskStore.exportTasks()),
        categories: JSON.parse(JSON.stringify(TaskApp.categoryStore.state.categories)),
        tags: JSON.parse(JSON.stringify(TaskApp.tagStore.state.tags))
      }
      downloadFile(JSON.stringify(data, null, 2), 'task-list-backup.json', 'application/json')
      showDropdown.value = false
      showToast('数据已导出为 JSON')
    }

    function exportCSV() {
      var tasks = TaskApp.taskStore.state.tasks
      var headers = ['标题', '描述', '分类', '优先级', '截止日期', '已完成', '创建时间']
      var rows = []
      for (var i = 0; i < tasks.length; i++) {
        var t = tasks[i]
        var catName = TaskApp.categoryStore.getCategoryById(t.categoryId)
        rows.push([
          escapeCSV(t.title), escapeCSV(t.description || ''),
          escapeCSV(catName ? catName.name : ''),
          t.priority, t.dueDate || '', t.completed ? '是' : '否', t.createdAt
        ])
      }
      var csv = [headers.join(','), rows.map(function (r) { return r.join(',') }).join('\n')].join('\n')
      downloadFile('\uFEFF' + csv, 'task-list-export.csv', 'text/csv;charset=utf-8')
      showDropdown.value = false
      showToast('数据已导出为 CSV')
    }

    function triggerImport() {
      fileInput.value.click()
      showDropdown.value = false
    }

    function handleImport(event) {
      var file = event.target.files[0]
      if (!file) return
      var reader = new FileReader()
      reader.onload = function (e) {
        try {
          var data = JSON.parse(e.target.result)
          var tasks = data.tasks || (Array.isArray(data) ? data : [])
          var count = TaskApp.taskStore.importTasks(tasks)
          if (data.categories && Array.isArray(data.categories)) {
            for (var i = 0; i < data.categories.length; i++) {
              var cat = data.categories[i]
              if (!TaskApp.categoryStore.state.categories.find(function (c) { return c.id === cat.id })) {
                TaskApp.categoryStore.state.categories.push(cat)
              }
            }
          }
          if (data.tags && Array.isArray(data.tags)) {
            for (var i = 0; i < data.tags.length; i++) {
              var tag = data.tags[i]
              if (!TaskApp.tagStore.state.tags.find(function (t) { return t.id === tag.id })) {
                TaskApp.tagStore.state.tags.push(tag)
              }
            }
          }
          showToast('成功导入 ' + count + ' 条任务')
        } catch (err) {
          showToast('导入失败：文件格式不正确')
        }
      }
      reader.readAsText(file)
      event.target.value = ''
    }

    function downloadFile(content, filename, mimeType) {
      var blob = new Blob([content], { type: mimeType })
      var url = URL.createObjectURL(blob)
      var a = document.createElement('a')
      a.href = url
      a.download = filename
      a.click()
      URL.revokeObjectURL(url)
    }

    function escapeCSV(str) {
      if (!str) return ''
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return '"' + str.replace(/"/g, '""') + '"'
      }
      return str
    }

    return {
      showDropdown: showDropdown, toast: toast, fileInput: fileInput,
      currentView: currentView, showRecurring: showRecurring, isBatch: isBatch,
      toggleView: toggleView, toggleRecurring: toggleRecurring, doToggleBatch: doToggleBatch,
      openCategory: openCategory, openTag: openTag,
      toggleDropdown: toggleDropdown, closeDropdown: closeDropdown,
      saveToRoot: saveToRoot,
      exportJSON: exportJSON, exportCSV: exportCSV,
      triggerImport: triggerImport, handleImport: handleImport
    }
  }
})
