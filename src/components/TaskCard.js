window.TaskApp = window.TaskApp || {}

var tpl = `
  <div class="task-card" :class="{ completed: task.completed, 'has-progress': hasProgress, 'tag-open': showTagPicker }">
    <div v-if="showSelection" class="task-selector" @click.stop="handleSelect">
      <div class="task-checkbox-small" :class="{ selected: isSelected }">{{ isSelected ? '✓' : '' }}</div>
    </div>
    <button class="task-checkbox" @click="handleToggle">
      <span v-if="task.completed">✓</span>
    </button>
    <div class="task-content">
      <div class="task-title">{{ task.title }}</div>
      <div class="task-meta">

        <span class="tag tag-category clickable" @click.stop="toggleCatPicker" title="点击切换分类">
          <span class="category-dot" :style="{ color: catColor }">●</span>
          {{ catName }}
        </span>
        <div v-if="showCatPicker" class="inline-dropdown cat-dropdown" @click.stop>
          <div v-for="cat in allCats" :key="cat.id" class="inline-dropdown-item" :class="{ selected: cat.id === task.categoryId }" @click="selectCategory(cat.id)">
            <span class="category-dot" :style="{ color: cat.color }">●</span>
            {{ cat.name }}
          </div>
        </div>

        <span class="tag clickable" :class="'tag-priority-' + task.priority" @click="cyclePrio" title="点击切换优先级（高→低→中→高）">
          {{ priorityLabel }}
        </span>

        <span v-if="task.dueDate" class="tag tag-due" :class="dueClass">{{ dueText }}</span>
        <span v-if="recurringLabel" class="tag tag-recurring">↻ {{ recurringLabel }}</span>

        <span v-for="tg in taskTags" :key="tg.id" class="tag tag-custom clickable" :style="{ background: tg.color + '22', color: tg.color, borderColor: tg.color }" @click.stop="toggleTagPicker" title="点击管理标签">
          {{ tg.name }}
        </span>
        <span v-if="!taskTags.length" class="tag tag-placeholder clickable" @click.stop="toggleTagPicker" title="添加标签">+ 标签</span>
        <div v-if="showTagPicker" class="inline-dropdown tag-dropdown" @click.stop>
          <div v-for="tg in allTags" :key="tg.id" class="inline-dropdown-item" :class="{ selected: hasTag(tg.id) }" @click="toggleTag(tg.id)">
            <span class="tag-dot" :style="{ background: tg.color }"></span>
            {{ tg.name }}
          </div>
        </div>
      </div>

      <div v-if="hasProgress" class="progress-section" @click.stop="openProgressModal">
        <div class="progress-bar-track">
          <div class="progress-bar-fill" :style="{ width: progressPercent + '%' }"></div>
          <span class="progress-text">{{ progressPercent }}%</span>
        </div>
        <div class="progress-note" v-if="task.progress && task.progress.note">{{ task.progress.note }}</div>
      </div>
    </div>
    <div class="task-actions">
      <button class="btn-task-action progress-toggle" @click.stop="openProgressModal" title="更新进展">📊</button>
      <button class="btn-task-action edit" @click="handleEdit" title="编辑" v-if="!compact">✎</button>
      <button class="btn-task-action delete" @click="handleDelete" title="删除" v-if="!compact">✕</button>
    </div>

    <div v-if="showProgressModal" class="progress-modal-overlay" @click="closeProgressModal">
      <div class="progress-modal" @click.stop>
        <div class="progress-modal-title">更新进展</div>
        <div class="progress-modal-body">
          <textarea class="form-textarea progress-modal-note" v-model="progressNoteInput" placeholder="进展说明..." rows="3"></textarea>
          <div class="quick-progress-btns" style="margin-top:10px">
            <button v-for="p in [0,25,50,75,100]" :key="p" class="progress-pct-btn" :class="{ active: quickPct === p }" @click="setQuickPct(p)">{{ p }}%</button>
          </div>
        </div>
        <div class="form-actions">
          <button class="btn btn-secondary" @click="closeProgressModal">取消</button>
          <button class="btn btn-primary" @click="saveQuickProgress">保存</button>
        </div>
      </div>
    </div>
  </div>
`

TaskApp.TaskCard = Vue.defineComponent({
  name: 'TaskCard',
  props: {
    task: { type: Object, required: true },
    compact: { type: Boolean, default: false }
  },
  setup(props) {
    var progressNoteInput = Vue.ref('')
    var quickPct = Vue.ref(0)
    var showCatPicker = Vue.ref(false)
    var showTagPicker = Vue.ref(false)
    var showProgressModal = Vue.ref(false)

    var allCats = Vue.computed(function () { return TaskApp.categoryStore.state.categories })
    var allTags = Vue.computed(function () { return TaskApp.tagStore.state.tags })
    var catName = Vue.computed(function () {
      var cat = TaskApp.categoryStore.getCategoryById(props.task.categoryId)
      return cat ? cat.name : '未分类'
    })
    var catColor = Vue.computed(function () {
      var cat = TaskApp.categoryStore.getCategoryById(props.task.categoryId)
      return cat ? cat.color : '#606080'
    })

    var taskTags = Vue.computed(function () {
      if (!props.task.tags) return []
      return TaskApp.tagStore.getTagsByIds(props.task.tags)
    })

    var dueText = Vue.computed(function () {
      if (!props.task.dueDate) return ''
      if (TaskApp.date.isOverdue(props.task.dueDate) && !props.task.completed) return '已过期'
      if (TaskApp.date.isToday(props.task.dueDate) && !props.task.completed) return '今天到期'
      if (TaskApp.date.isDueSoon(props.task.dueDate) && !props.task.completed) return TaskApp.date.formatRelative(props.task.dueDate) + '到期'
      return props.task.dueDate
    })

    var dueClass = Vue.computed(function () {
      if (!props.task.dueDate || props.task.completed) return ''
      if (TaskApp.date.isOverdue(props.task.dueDate)) return 'overdue'
      if (TaskApp.date.isToday(props.task.dueDate)) return 'today'
      if (TaskApp.date.isDueSoon(props.task.dueDate)) return 'due-soon'
      return ''
    })

    var priorityLabel = Vue.computed(function () {
      var labels = { high: '高优先级', medium: '中', low: '低' }
      return labels[props.task.priority] || '中'
    })

    var recurringLabel = Vue.computed(function () {
      if (!props.task.recurring) return ''
      var labels = {
        daily: '每天', weekly: '每周', monthly: '每月', weekdays: '工作日',
        custom: '每' + props.task.recurring.interval + '天',
        'weekly-specific': '每周'
      }
      return labels[props.task.recurring.type] || ''
    })

    var progressPercent = Vue.computed(function () {
      return (props.task.progress && props.task.progress.percentage) || 0
    })

    var hasProgress = Vue.computed(function () {
      return props.task.progress && props.task.progress.percentage > 0
    })

    var showSelection = Vue.computed(function () {
      return TaskApp.taskStore.state.batchMode
    })

    var isSelected = Vue.computed(function () {
      return TaskApp.taskStore.state.selectedTaskIds.indexOf(props.task.id) !== -1
    })

    function handleToggle() { TaskApp.taskStore.toggleComplete(props.task.id) }
    function handleEdit() { TaskApp.taskStore.openTaskForm(props.task) }
    function handleDelete() { TaskApp.taskStore.confirmDelete(props.task) }
    function handleSelect() { TaskApp.taskStore.toggleTaskSelection(props.task.id) }

    function openProgressModal() {
      progressNoteInput.value = (props.task.progress && props.task.progress.note) || ''
      quickPct.value = (props.task.progress && props.task.progress.percentage) || 0
      showProgressModal.value = true
    }

    function closeProgressModal() {
      showProgressModal.value = false
    }

    function setQuickPct(p) { quickPct.value = p }

    function saveQuickProgress() {
      TaskApp.taskStore.updateProgress(props.task.id, quickPct.value, progressNoteInput.value)
      showProgressModal.value = false
    }

    function toggleCatPicker() { showCatPicker.value = !showCatPicker.value; showTagPicker.value = false }
    function toggleTagPicker() { showTagPicker.value = !showTagPicker.value; showCatPicker.value = false }
    function selectCategory(id) { TaskApp.taskStore.changeCategory(props.task.id, id); showCatPicker.value = false }
    function cyclePrio() { TaskApp.taskStore.cyclePriority(props.task.id) }
    function hasTag(id) { return props.task.tags && props.task.tags.indexOf(id) !== -1 }
    function toggleTag(id) { TaskApp.taskStore.toggleTaskTag(props.task.id, id) }

    return {
      category: catName, catColor: catColor, allCats: allCats,
      showCatPicker: showCatPicker, showTagPicker: showTagPicker,
      allTags: allTags, taskTags: taskTags,
      dueText: dueText, dueClass: dueClass,
      priorityLabel: priorityLabel, recurringLabel: recurringLabel,
      progressPercent: progressPercent, hasProgress: hasProgress,
      showSelection: showSelection, isSelected: isSelected,
      progressNoteInput: progressNoteInput, quickPct: quickPct,
      showProgressModal: showProgressModal,
      handleToggle: handleToggle, handleEdit: handleEdit, handleDelete: handleDelete,
      handleSelect: handleSelect,
      openProgressModal: openProgressModal, closeProgressModal: closeProgressModal,
      setQuickPct: setQuickPct, saveQuickProgress: saveQuickProgress,
      toggleCatPicker: toggleCatPicker, selectCategory: selectCategory,
      cyclePrio: cyclePrio,
      toggleTagPicker: toggleTagPicker, hasTag: hasTag, toggleTag: toggleTag
    }
  },
  template: tpl
})
