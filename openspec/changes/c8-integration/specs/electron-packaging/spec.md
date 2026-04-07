## ADDED Requirements

### Requirement: macOS DMG 打包
系统 SHALL 配置 electron-builder 生成 macOS .dmg 安装包。

#### Scenario: 打包配置
- **WHEN** 执行 `npm run build` 打包命令
- **THEN** 生成 macOS .dmg 文件，包含：App 名称 "Codemaker Dashboard"、Bundle ID "com.netease.codemaker-dashboard"、占位图标

#### Scenario: 打包产物
- **WHEN** 打包完成
- **THEN** 产物位于 `dist/` 目录，包含：.dmg（安装包）+ .zip（压缩包）

### Requirement: Electron 主进程窗口管理
主进程 SHALL 实现标准 macOS 窗口行为。

#### Scenario: 窗口创建
- **WHEN** 应用启动
- **THEN** 创建单个主窗口，默认尺寸 1280x800，最小尺寸 960x600

#### Scenario: macOS 关闭行为
- **WHEN** 用户点击窗口关闭按钮（红色圆点）
- **THEN** 窗口隐藏到 Dock 而非退出应用

#### Scenario: Dock 图标点击
- **WHEN** 用户点击 Dock 图标且所有窗口已隐藏
- **THEN** 重新显示主窗口

### Requirement: IPC 通道汇总注册
主进程 SHALL 注册所有模块需要的 IPC 通道。

#### Scenario: IPC 通道列表
- **WHEN** 主进程初始化
- **THEN** 注册以下 IPC 通道：
  - 文件操作：`fs:read` / `fs:write` / `fs:delete` / `fs:list-dir`
  - MCP 配置：`mcp:read-config` / `mcp:write-config`
  - Shell：`shell:open-external`
  - CLI：`cli:execute`（执行 codemaker 子命令）
