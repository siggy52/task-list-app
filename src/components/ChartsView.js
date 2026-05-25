window.TaskApp = window.TaskApp || {}

var tpl = `
  <div class="charts-view">
    <div class="charts-grid">
      <div class="chart-card">
        <div class="chart-title">完成率</div>
        <div class="chart-canvas-wrap">
          <canvas ref="donutCanvas" width="200" height="200"></canvas>
        </div>
        <div class="chart-legend">
          <span><span class="legend-dot" style="background:#84a98c"></span>已完成 {{ stats.completed }}</span>
          <span><span class="legend-dot" style="background:#e8a87c"></span>待办 {{ stats.active }}</span>
        </div>
      </div>
      <div class="chart-card">
        <div class="chart-title">优先级分布</div>
        <div class="chart-canvas-wrap">
          <canvas ref="priorityCanvas" width="340" height="180"></canvas>
        </div>
      </div>
      <div class="chart-card">
        <div class="chart-title">分类统计</div>
        <div class="chart-canvas-wrap">
          <canvas ref="categoryCanvas" width="340" height="180"></canvas>
        </div>
      </div>
      <div class="chart-card">
        <div class="chart-title">到期状态</div>
        <div class="chart-canvas-wrap">
          <canvas ref="dueCanvas" width="340" height="180"></canvas>
        </div>
      </div>
    </div>
  </div>
`

TaskApp.ChartsView = Vue.defineComponent({
  name: 'ChartsView',
  template: tpl,
  setup() {
    var stats = Vue.computed(function () { return TaskApp.taskStore.stats.value })
    var tasks = Vue.computed(function () { return TaskApp.taskStore.state.tasks })
    var categories = Vue.computed(function () { return TaskApp.categoryStore.state.categories })

    var donutCanvas = Vue.ref(null)
    var priorityCanvas = Vue.ref(null)
    var categoryCanvas = Vue.ref(null)
    var dueCanvas = Vue.ref(null)

    function drawDonut(canvas, completed, active) {
      if (!canvas) return
      var ctx = canvas.getContext('2d')
      var w = canvas.width, h = canvas.height
      var cx = w / 2, cy = h / 2, r = 80, lw = 28
      ctx.clearRect(0, 0, w, h)

      var total = completed + active
      if (total === 0) {
        ctx.beginPath()
        ctx.arc(cx, cy, r - lw / 2, 0, Math.PI * 2)
        ctx.strokeStyle = '#2a2a44'
        ctx.lineWidth = lw
        ctx.stroke()
        ctx.fillStyle = '#606080'
        ctx.font = '16px Inter, sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText('0', cx, cy)
        return
      }

      var completedAngle = (completed / total) * Math.PI * 2
      var startAngle = -Math.PI / 2

      ctx.beginPath()
      ctx.arc(cx, cy, r - lw / 2, startAngle, startAngle + completedAngle)
      ctx.strokeStyle = '#84a98c'
      ctx.lineWidth = lw
      ctx.lineCap = 'round'
      ctx.stroke()

      ctx.beginPath()
      ctx.arc(cx, cy, r - lw / 2, startAngle + completedAngle, startAngle + Math.PI * 2)
      ctx.strokeStyle = '#e8a87c'
      ctx.lineWidth = lw
      ctx.lineCap = 'round'
      ctx.stroke()

      var pct = Math.round((completed / total) * 100)
      ctx.fillStyle = '#e8e8f0'
      ctx.font = 'bold 22px Inter, sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(pct + '%', cx, cy - 6)
      ctx.fillStyle = '#9090b0'
      ctx.font = '11px Inter, sans-serif'
      ctx.fillText('完成率', cx, cy + 14)
    }

    function drawBarChart(canvas, items, colorFn, labelKey, valueKey) {
      if (!canvas) return
      var ctx = canvas.getContext('2d')
      var w = canvas.width, h = canvas.height
      ctx.clearRect(0, 0, w, h)

      if (!items || items.length === 0) {
        ctx.fillStyle = '#606080'
        ctx.font = '13px Inter, sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText('暂无数据', w / 2, h / 2)
        return
      }

      var maxVal = Math.max.apply(null, items.map(function (it) { return it[valueKey] }))
      if (maxVal === 0) maxVal = 1
      var barW = Math.min(36, (w - 40) / items.length - 8)
      var gap = 8
      var startX = 20
      var bottomY = h - 20
      var topY = 10
      var chartH = bottomY - topY

      for (var i = 0; i < items.length; i++) {
        var item = items[i]
        var val = item[valueKey]
        var barH = (val / maxVal) * chartH
        var x = startX + i * (barW + gap)
        var y = bottomY - barH
        var color = colorFn(item, i)

        ctx.fillStyle = color
        ctx.beginPath()
        ctx.roundRect(x, y, barW, barH, [4, 4, 0, 0])
        ctx.fill()

        ctx.fillStyle = '#e8e8f0'
        ctx.font = 'bold 12px Inter, sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'bottom'
        ctx.fillText(String(val), x + barW / 2, y - 4)

        var label = labelKey ? item[labelKey] : ''
        if (label) {
          ctx.fillStyle = '#9090b0'
          ctx.font = '10px Inter, sans-serif'
          ctx.textAlign = 'center'
          ctx.textBaseline = 'top'
          var maxChars = Math.floor(barW / 6)
          var displayLabel = label.length > maxChars ? label.substring(0, maxChars) + '..' : label
          ctx.fillText(displayLabel, x + barW / 2, bottomY + 4)
        }
      }
    }

    function drawDueChart(canvas, tasks) {
      if (!canvas) return
      var ctx = canvas.getContext('2d')
      var w = canvas.width, h = canvas.height
      ctx.clearRect(0, 0, w, h)

      var today = TaskApp.date.getISODate()
      var overdue = 0, dueToday = 0, dueSoon = 0, dueLater = 0, noDate = 0, completedCount = 0

      for (var i = 0; i < tasks.length; i++) {
        var t = tasks[i]
        if (t.completed) { completedCount++; continue }
        if (!t.dueDate) { noDate++; continue }
        if (TaskApp.date.isOverdue(t.dueDate)) { overdue++; continue }
        if (t.dueDate === today) { dueToday++; continue }
        if (TaskApp.date.isDueSoon(t.dueDate, 3)) { dueSoon++; continue }
        dueLater++
      }

      var items = []
      var labels = ['已过期', '今日到期', '近3天', '稍后到期', '无日期']
      var values = [overdue, dueToday, dueSoon, dueLater, noDate]
      var colors = ['#e07a5f', '#e8c97c', '#6b8cae', '#84a98c', '#606080']

      for (var j = 0; j < labels.length; j++) {
        items.push({ label: labels[j], value: values[j], color: colors[j] })
      }

      var maxVal = Math.max.apply(null, values.concat([1]))
      var barW = Math.min(36, (w - 40) / items.length - 8)
      var gap = 8
      var startX = 20
      var bottomY = h - 20
      var topY = 10
      var chartH = bottomY - topY

      for (var k = 0; k < items.length; k++) {
        var item = items[k]
        var val = item.value
        var barH = (val / maxVal) * chartH
        var x = startX + k * (barW + gap)
        var y = bottomY - barH

        ctx.fillStyle = item.color
        ctx.beginPath()
        ctx.roundRect(x, y, barW, barH, [4, 4, 0, 0])
        ctx.fill()

        if (val > 0) {
          ctx.fillStyle = '#e8e8f0'
          ctx.font = 'bold 12px Inter, sans-serif'
          ctx.textAlign = 'center'
          ctx.textBaseline = 'bottom'
          ctx.fillText(String(val), x + barW / 2, y - 4)
        }

        ctx.fillStyle = '#9090b0'
        ctx.font = '10px Inter, sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'top'
        ctx.fillText(item.label, x + barW / 2, bottomY + 4)
      }

      ctx.fillStyle = '#606080'
      ctx.font = '10px Inter, sans-serif'
      ctx.textAlign = 'left'
      ctx.textBaseline = 'top'
      ctx.fillText('（不含已完成）', 4, 2)
    }

    function drawAll() {
      var s = TaskApp.taskStore.stats.value
      var allTasks = TaskApp.taskStore.state.tasks
      var cats = TaskApp.categoryStore.state.categories

      drawDonut(donutCanvas.value, s.completed, s.active)

      var prioItems = [
        { label: '高', value: allTasks.filter(function (t) { return t.priority === 'high' }).length },
        { label: '中', value: allTasks.filter(function (t) { return t.priority === 'medium' || !t.priority }).length },
        { label: '低', value: allTasks.filter(function (t) { return t.priority === 'low' }).length }
      ]
      drawBarChart(priorityCanvas.value, prioItems, function (it) {
        return { high: '#e07a5f', medium: '#e8c97c', low: '#6b8cae' }[it.label] || '#84a98c'
      }, 'label', 'value')

      var catItems = cats.map(function (c) {
        return { label: c.name, value: allTasks.filter(function (t) { return t.categoryId === c.id }).length, color: c.color }
      })
      var uncategorized = allTasks.filter(function (t) { return !t.categoryId || !cats.find(function (c) { return c.id === t.categoryId }) }).length
      if (uncategorized > 0) catItems.push({ label: '未分类', value: uncategorized, color: '#606080' })
      drawBarChart(categoryCanvas.value, catItems, function (it) { return it.color }, 'label', 'value')

      drawDueChart(dueCanvas.value, allTasks)
    }

    Vue.onMounted(function () { drawAll() })
    Vue.watch(tasks, function () { drawAll() }, { deep: true })

    return {
      stats: stats, tasks: tasks, categories: categories,
      donutCanvas: donutCanvas, priorityCanvas: priorityCanvas,
      categoryCanvas: categoryCanvas, dueCanvas: dueCanvas
    }
  }
})
