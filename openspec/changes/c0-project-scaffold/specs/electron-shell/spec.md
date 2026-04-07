## ADDED Requirements

### Requirement: Electron 主进程窗口创建
应用启动时 SHALL 创建一个 BrowserWindow，默认尺寸 1280x800，最小尺寸 960x600，居中显示。窗口标题为 "Codemaker Dashboard"。

#### Scenario: 应用正常启动
- **WHEN** 用户启动应用
- **THEN** 系统创建主窗口，加载渲染进程页面，窗口居中显示

#### Scenario: 窗口尺寸限制
- **WHEN** 用户拖拽缩小窗口
- **THEN** 窗口尺寸不得小于 960x600

### Requirement: 预加载脚本安全隔离
主进程与渲染进程之间 SHALL 通过 preload 脚本暴露有限 API，渲染进程不可直接访问 Node.js API。

#### Scenario: 渲染进程调用系统能力
- **WHEN** 渲染进程需要访问文件系统或执行 shell 命令
- **THEN** 必须通过 preload 暴露的 IPC 接口调用，不可直接 require Node 模块

### Requirement: 开发环境热重载
开发模式下 SHALL 支持渲染进程 HMR 和主进程自动重启。

#### Scenario: 修改渲染进程代码
- **WHEN** 开发者修改 src/ 下的 React 代码
- **THEN** 浏览器页面热更新，不丢失组件状态

#### Scenario: 修改主进程代码
- **WHEN** 开发者修改 electron/ 下的主进程代码
- **THEN** Electron 主进程自动重启，重新加载窗口
