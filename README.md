# Task List App

一个基于 Vue.js 的任务管理应用，支持看板视图和拖拽排序。

## 功能特性

- ✅ 任务增删改查
- 📋 看板视图（Kanban）
- 🔄 拖拽排序
- 💾 本地存储
- 📱 响应式设计
- 🏷️ 标签分类
- 📊 数据统计

## 技术栈

- Vue.js 3 (CDN)
- Pinia（状态管理）
- @vueuse/core（工具库）
- 原生拖拽 API
- LocalStorage 数据持久化

## 安装使用

### 本地运行

```bash
# 克隆仓库
git clone https://github.com/siggy52/task-list-app.git

# 进入项目目录
cd task-list-app

# 使用任意 HTTP 服务器运行
# 方式1: 使用 Python
python -m http.server 8080

# 方式2: 使用 Node.js 的 http-server
npx http-server -p 8080

# 方式3: 直接在浏览器中打开 index.html
```

### 访问应用

打开浏览器访问 `http://localhost:8080` 或直接打开 `index.html` 文件。

## 项目结构

```
task-list-app/
├── index.html              # 入口文件
├── .gitignore              # Git 忽略配置
└── src/
    ├── App.js              # 根组件
    ├── main.js             # 应用入口
    ├── components/         # 组件目录
    │   ├── CategoryModal.js
    │   ├── ChartsView.js
    │   ├── FilterBar.js
    │   ├── KanbanBoard.js
    │   ├── KanbanColumn.js
    │   ├── RecurringPanel.js
    │   ├── StatsCards.js
    │   ├── TagModal.js
    │   ├── TaskCard.js
    │   ├── TaskFormModal.js
    │   ├── TaskList.js
    │   └── TopBar.js
    ├── stores/             # Pinia 状态管理
    │   ├── categoryStore.js
    │   ├── tagStore.js
    │   └── taskStore.js
    ├── styles/             # 样式文件
    │   └── main.css
    └── utils/              # 工具函数
        ├── date.js
        ├── id.js
        └── storage.js
```

## 主要功能说明

### 看板视图
- 支持拖拽任务卡片在不同状态列之间移动
- 三种状态：待办、进行中、已完成

### 任务管理
- 创建、编辑、删除任务
- 设置优先级、截止日期
- 添加标签分类
- 支持重复任务

### 数据统计
- 任务完成情况统计
- 可视化图表展示

## 数据存储

所有数据保存在浏览器的 LocalStorage 中，无需后端服务。

## License

[MIT](LICENSE)

## 作者

siggy52
