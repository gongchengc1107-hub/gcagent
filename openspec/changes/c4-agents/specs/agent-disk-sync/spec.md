## ADDED Requirements

### Requirement: 启动时磁盘同步
应用启动时 SHALL 扫描 `opencode/agents/` 目录下的 `.md` 文件，将磁盘 Agent 同步到 useAgentStore。

#### Scenario: 发现磁盘 Agent 文件
- **WHEN** `opencode/agents/` 目录下存在 `my-agent.md` 文件
- **THEN** 解析文件 frontmatter 提取 Agent 配置，写入 useAgentStore，标记 `isFromDisk: true`

#### Scenario: 目录不存在
- **WHEN** `opencode/agents/` 目录不存在
- **THEN** 跳过磁盘同步，不报错

#### Scenario: 文件解析失败
- **WHEN** 某个 `.md` 文件 frontmatter 格式不合法
- **THEN** 跳过该文件，console 打印警告，不影响其他文件

### Requirement: 进入页面时刷新同步
用户进入 Agents 管理页时 SHALL 重新触发一次磁盘同步。

#### Scenario: 页面进入刷新
- **WHEN** 用户从其他页面切换到 Agents 页
- **THEN** 重新扫描磁盘文件，更新或新增 Agent 数据

### Requirement: 磁盘 Agent 文件格式
磁盘 Agent 的 `.md` 文件 SHALL 使用 YAML frontmatter 定义配置。

#### Scenario: 标准格式
- **WHEN** 文件内容为：
  ```
  ---
  name: My Agent
  emoji: 🤖
  description: A custom agent
  autoMode: false
  ---
  System prompt content here...
  ```
- **THEN** 解析出 name="My Agent", emoji="🤖", description="A custom agent", autoMode=false

### Requirement: 单向同步
磁盘同步 SHALL 为单向（磁盘 → 界面），界面创建的 Agent 不写回磁盘。

#### Scenario: 界面创建的 Agent 不写磁盘
- **WHEN** 用户在界面创建了一个自定义 Agent
- **THEN** `opencode/agents/` 目录下不产生新文件
