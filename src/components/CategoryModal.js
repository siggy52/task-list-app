window.TaskApp = window.TaskApp || {}

var tpl = `
  <div class="modal-overlay" @click="handleOverlayClick">
    <div class="modal-content">
      <div class="modal-title">分类管理</div>
      <div class="category-manager">
        <div v-for="cat in categories" :key="cat.id" class="category-item">
          <template v-if="editingCat === cat.id">
            <div class="color-picker-wrapper">
              <input type="color" v-model="editColor" />
            </div>
            <input class="form-input" v-model="editName" style="flex:1" />
            <div class="category-actions">
              <button class="btn btn-primary" style="padding:6px 14px;font-size:12px" @click="saveEdit">保存</button>
              <button class="btn btn-secondary" style="padding:6px 14px;font-size:12px" @click="cancelEdit">取消</button>
            </div>
          </template>
          <template v-else>
            <span class="category-color" :style="{ background: cat.color }"></span>
            <span class="category-name">{{ cat.name }}</span>
            <div class="category-actions">
              <button class="btn-task-action" @click="startEdit(cat)" title="编辑">✎</button>
              <button class="btn-task-action delete" @click="deleteCategory(cat.id)" title="删除">✕</button>
            </div>
          </template>
        </div>
      </div>
      <div style="margin-top:16px;padding-top:16px;border-top:1px solid var(--color-border)">
        <div style="font-size:13px;font-weight:500;color:var(--color-text-secondary);margin-bottom:8px">添加分类</div>
        <div class="add-category-row">
          <div class="color-picker-wrapper">
            <input type="color" v-model="newColor" />
          </div>
          <input class="form-input" v-model="newName" placeholder="分类名称" style="flex:1" @keyup.enter="addCategory" />
          <button class="btn btn-primary" style="padding:10px 16px;flex-shrink:0" :disabled="!newName.trim()" @click="addCategory">添加</button>
        </div>
      </div>
      <div class="form-actions">
        <button class="btn btn-secondary" @click="close">关闭</button>
      </div>
    </div>
  </div>
`

TaskApp.CategoryModal = Vue.defineComponent({
  name: 'CategoryModal',
  template: tpl,
  setup() {
    var categories = Vue.computed(function () { return TaskApp.categoryStore.state.categories })
    var newName = Vue.ref('')
    var newColor = Vue.ref('#e8a87c')
    var editingCat = Vue.ref(null)
    var editName = Vue.ref('')
    var editColor = Vue.ref('')

    function addCategory() {
      var name = newName.value.trim()
      if (!name) return
      TaskApp.categoryStore.addCategory(name, newColor.value)
      newName.value = ''
      newColor.value = '#e8a87c'
    }

    function startEdit(cat) {
      editingCat.value = cat.id
      editName.value = cat.name
      editColor.value = cat.color
    }

    function saveEdit() {
      var name = editName.value.trim()
      if (!name || !editingCat.value) return
      TaskApp.categoryStore.updateCategory(editingCat.value, { name: name, color: editColor.value })
      editingCat.value = null
    }

    function cancelEdit() { editingCat.value = null }

    function deleteCategory(id) { TaskApp.categoryStore.deleteCategory(id) }

    function close() { TaskApp.taskStore.closeCategoryModal() }

    function handleOverlayClick(e) { if (e.target === e.currentTarget) close() }

    return {
      categories: categories,
      newName: newName, newColor: newColor,
      editingCat: editingCat, editName: editName, editColor: editColor,
      addCategory: addCategory, startEdit: startEdit, saveEdit: saveEdit,
      cancelEdit: cancelEdit, deleteCategory: deleteCategory,
      close: close, handleOverlayClick: handleOverlayClick
    }
  }
})
