window.TaskApp = window.TaskApp || {}

TaskApp.date = {
  formatDate(dateStr) {
    if (!dateStr) return ''
    const d = new Date(dateStr)
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return year + '-' + month + '-' + day
  },

  isToday(dateStr) {
    if (!dateStr) return false
    const d = new Date(dateStr)
    const today = new Date()
    return d.getFullYear() === today.getFullYear()
      && d.getMonth() === today.getMonth()
      && d.getDate() === today.getDate()
  },

  isTomorrow(dateStr) {
    if (!dateStr) return false
    const d = new Date(dateStr)
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    return d.getFullYear() === tomorrow.getFullYear()
      && d.getMonth() === tomorrow.getMonth()
      && d.getDate() === tomorrow.getDate()
  },

  isOverdue(dateStr) {
    if (!dateStr) return false
    const d = new Date(dateStr)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    d.setHours(0, 0, 0, 0)
    return d < today
  },

  isDueSoon(dateStr, days) {
    if (days === undefined) days = 3
    if (!dateStr) return false
    const d = new Date(dateStr)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    d.setHours(0, 0, 0, 0)
    const diff = Math.ceil((d - today) / (1000 * 60 * 60 * 24))
    return diff >= 0 && diff <= days
  },

  formatRelative(dateStr) {
    if (!dateStr) return ''
    if (TaskApp.date.isToday(dateStr)) return '今天'
    if (TaskApp.date.isTomorrow(dateStr)) return '明天'
    if (TaskApp.date.isOverdue(dateStr)) return '已过期'
    return TaskApp.date.formatDate(dateStr)
  },

  getISODate(date) {
    if (!date) date = new Date()
    var y = date.getFullYear()
    var m = String(date.getMonth() + 1).padStart(2, '0')
    var d = String(date.getDate()).padStart(2, '0')
    return y + '-' + m + '-' + d
  },

  getISODateTime(date) {
    if (!date) date = new Date()
    return date.toISOString()
  }
}
