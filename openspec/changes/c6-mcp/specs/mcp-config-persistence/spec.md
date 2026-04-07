## ADDED Requirements

### Requirement: 配置文件读写
MCP 配置 SHALL 持久化到 `~/.config/codemaker-dashboard/opencode/opencode.json`。

#### Scenario: 启动时读取配置
- **WHEN** 应用启动且配置文件存在
- **THEN** 通过 Electron IPC 读取文件内容，解析 `mcpServers` 字段，合并内置 MCP 后写入 useMCPStore

#### Scenario: 配置文件不存在
- **WHEN** 应用启动且配置文件不存在
- **THEN** 创建默认配置文件，仅包含 3 个内置 MCP 的配置

#### Scenario: 配置写入
- **WHEN** 用户执行 MCP 增删改操作
- **THEN** 将当前所有 MCP 配置序列化为 JSON，通过 Electron IPC 写入配置文件
- **AND** 写入格式符合 `{ "mcpServers": { "name": { type, command, args, env, url, headers } } }` 结构

### Requirement: 配置文件格式
持久化文件 SHALL 使用与 `codemaker serve` 兼容的 JSON 格式。

#### Scenario: 文件结构
- **WHEN** 系统写入配置
- **THEN** 文件内容为：
  ```json
  {
    "mcpServers": {
      "mcp-name": {
        "type": "local",
        "command": "npx",
        "args": ["-y", "@mcp/server"],
        "env": { "API_KEY": "xxx" }
      }
    }
  }
  ```
- **AND** 内置 MCP 不写入文件（由应用代码硬编码管理）

### Requirement: IPC 通道定义
主进程 SHALL 注册 MCP 配置相关的 IPC 通道。

#### Scenario: IPC 通道列表
- **WHEN** 主进程初始化
- **THEN** 注册以下 IPC 通道：
  - `mcp:read-config` → 读取配置文件并返回解析后的对象
  - `mcp:write-config` → 接收配置对象，序列化写入文件
  - `mcp:get-config-path` → 返回配置文件绝对路径

### Requirement: 写入后提示
MCP 配置变更后 SHALL 提示用户重启服务。

#### Scenario: 保存后提示
- **WHEN** MCP 增删改触发配置写入成功
- **THEN** 在页面底部显示 info 类型消息 "配置已保存。如需生效，请重启 codemaker serve"
