window.TaskApp = window.TaskApp || {}

var tpl = `
  <div class="app-container">
    <TopBar />
    <div v-if="showDataNotice" class="data-notice">
      <span>💡 换浏览器看不到数据？点击 ⋮ → <strong>保存到根目录</strong>，把下载的 data.json 放到本文件夹即可跨浏览器同步。</span>
      <button class="data-notice-close" @click="dismissNotice">✕</button>
    </div>
    <StatsCards v-if="currentView !== 'charts'" />
    <FilterBar v-if="currentView !== 'charts'" />

    <div v-if="showRecurringPanel" class="recurring-overlay">
      <RecurringPanel />
    </div>

    <template v-if="!showRecurringPanel">
      <div v-if="isBatch" class="batch-toolbar">
        <span class="batch-toolbar-info">已选择 {{ selectedCount }} 个任务</span>
        <button class="btn btn-danger" style="padding:8px 16px;font-size:13px" :disabled="selectedCount === 0" @click="confirmBatchDelete">🗑 删除选中</button>
        <button class="btn btn-secondary" style="padding:8px 16px;font-size:13px" @click="exitBatch">退出批量</button>
      </div>
      <TaskList v-show="currentView === 'list'" />
      <KanbanBoard v-show="currentView === 'kanban'" />
      <ChartsView v-show="currentView === 'charts'" />
    </template>

    <button class="fab" @click="taskStore.openTaskForm()" title="添加任务">+</button>
    <TaskFormModal v-if="showTaskForm" />
    <CategoryModal v-if="showCategoryModal" />
    <TagModal v-if="showTagModal" />
    <div v-if="showDeleteConfirm" class="confirm-overlay" @click="taskStore.cancelDelete()">
      <div class="confirm-dialog" @click.stop>
        <h4>确认删除</h4>
        <p>确定要删除「{{ showDeleteConfirm.title }}」吗？此操作不可撤销。</p>
        <div class="confirm-actions">
          <button class="btn btn-secondary" @click="taskStore.cancelDelete()">取消</button>
          <button class="btn btn-danger" @click="taskStore.deleteTask(showDeleteConfirm.id)">删除</button>
        </div>
      </div>
    </div>
    <div v-if="showBatchDeleteConfirm" class="confirm-overlay" @click="taskStore.cancelBatchDelete()">
      <div class="confirm-dialog" @click.stop>
        <h4>批量删除</h4>
        <p>确定要删除选中的 {{ selectedCount }} 个任务吗？此操作不可撤销。</p>
        <div class="confirm-actions">
          <button class="btn btn-secondary" @click="taskStore.cancelBatchDelete()">取消</button>
          <button class="btn btn-danger" @click="taskStore.deleteSelectedTasks()">删除 {{ selectedCount }} 个</button>
        </div>
      </div>
    </div>
  </div>
`

TaskApp.App = Vue.defineComponent({
  name: 'App',
  template: tpl,
  setup() {
    var selectedCount = Vue.computed(function () { return TaskApp.taskStore.state.selectedTaskIds.length })
    function confirmBatchDelete() { TaskApp.taskStore.confirmBatchDelete() }
    function exitBatch() { TaskApp.taskStore.toggleBatchMode() }

    var showDataNotice = Vue.computed(function () {
      return !TaskApp.storage._hasFileData && TaskApp.taskStore.state.tasks.length > 0
    })
    function dismissNotice() {
      TaskApp.storage._hasFileData = true
    }

    return {
      taskStore: TaskApp.taskStore,
      currentView: Vue.computed(function () { return TaskApp.taskStore.state.currentView }),
      showTaskForm: Vue.computed(function () { return TaskApp.taskStore.state.showTaskForm }),
      showCategoryModal: Vue.computed(function () { return TaskApp.taskStore.state.showCategoryModal }),
      showTagModal: Vue.computed(function () { return TaskApp.taskStore.state.showTagModal }),
      showDeleteConfirm: Vue.computed(function () { return TaskApp.taskStore.state.showDeleteConfirm }),
      showRecurringPanel: Vue.computed(function () { return TaskApp.taskStore.state.showRecurringPanel }),
      isBatch: Vue.computed(function () { return TaskApp.taskStore.state.batchMode }),
      showBatchDeleteConfirm: Vue.computed(function () { return TaskApp.taskStore.state.showBatchDeleteConfirm }),
      selectedCount: selectedCount,
      showDataNotice: showDataNotice,
      dismissNotice: dismissNotice,
      confirmBatchDelete: confirmBatchDelete,
      exitBatch: exitBatch
    }
  }
})
