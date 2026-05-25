window.TaskApp = window.TaskApp || {}

var tpl = `
  <div class="modal-overlay" @click="handleOverlayClick">
    <div class="modal-content">
      <div class="modal-title">标签管理</div>
      <div class="category-manager">
        <div v-for="tag in tags" :key="tag.id" class="category-item">
          <template v-if="editingTag === tag.id">
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
            <span class="category-color" :style="{ background: tag.color }"></span>
            <span class="category-name">{{ tag.name }}</span>
            <div class="category-actions">
              <button class="btn-task-action" @click="startEdit(tag)" title="编辑">✎</button>
              <button class="btn-task-action delete" @click="deleteTag(tag.id)" title="删除">✕</button>
            </div>
          </template>
        </div>
      </div>
      <div style="margin-top:16px;padding-top:16px;border-top:1px solid var(--color-border)">
        <div style="font-size:13px;font-weight:500;color:var(--color-text-secondary);margin-bottom:8px">添加标签</div>
        <div class="add-category-row">
          <div class="color-picker-wrapper">
            <input type="color" v-model="newColor" />
          </div>
          <input class="form-input" v-model="newName" placeholder="标签名称" style="flex:1" @keyup.enter="addTag" />
          <button class="btn btn-primary" style="padding:10px 16px;flex-shrink:0" :disabled="!newName.trim()" @click="addTag">添加</button>
        </div>
      </div>
      <div class="form-actions">
        <button class="btn btn-secondary" @click="close">关闭</button>
      </div>
    </div>
  </div>
`

TaskApp.TagModal = Vue.defineComponent({
  name: 'TagModal',
  template: tpl,
  setup() {
    var tags = Vue.computed(function () { return TaskApp.tagStore.state.tags })
    var newName = Vue.ref('')
    var newColor = Vue.ref('#9b7eb5')
    var editingTag = Vue.ref(null)
    var editName = Vue.ref('')
    var editColor = Vue.ref('')

    function addTag() {
      var name = newName.value.trim()
      if (!name) return
      TaskApp.tagStore.addTag(name, newColor.value)
      newName.value = ''
      newColor.value = '#9b7eb5'
    }

    function startEdit(tag) {
      editingTag.value = tag.id
      editName.value = tag.name
      editColor.value = tag.color
    }

    function saveEdit() {
      var name = editName.value.trim()
      if (!name || !editingTag.value) return
      TaskApp.tagStore.updateTag(editingTag.value, { name: name, color: editColor.value })
      editingTag.value = null
    }

    function cancelEdit() { editingTag.value = null }
    function deleteTag(id) { TaskApp.tagStore.deleteTag(id) }
    function close() { TaskApp.taskStore.closeTagModal() }
    function handleOverlayClick(e) { if (e.target === e.currentTarget) close() }

    return {
      tags: tags,
      newName: newName, newColor: newColor,
      editingTag: editingTag, editName: editName, editColor: editColor,
      addTag: addTag, startEdit: startEdit, saveEdit: saveEdit,
      cancelEdit: cancelEdit, deleteTag: deleteTag,
      close: close, handleOverlayClick: handleOverlayClick
    }
  }
})
