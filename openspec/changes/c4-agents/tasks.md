## 1. Agent 列表页

- [ ] 1.1 创建 src/pages/Agents/index.tsx 页面组件（页面标题 + 创建按钮 + 内置区 + 自定义区）
- [ ] 1.2 创建 AgentCard 卡片组件（emoji + 名称 + 描述 + 标签 + hover 操作按钮）
- [ ] 1.3 实现卡片网格布局（每行 3 个，响应式）
- [ ] 1.4 实现内置 Agent 区域和自定义 Agent 区域分区
- [ ] 1.5 实现磁盘 Agent "来自磁盘" 标签展示
- [ ] 1.6 实现空自定义列表引导提示
- [ ] 1.7 实现创建按钮上限禁用（≥10 个自定义 Agent 时禁用 + Tooltip）

## 2. Agent 创建/编辑 Drawer

- [ ] 2.1 创建 AgentDrawer 组件（Ant Design Drawer + Form）
- [ ] 2.2 实现表单字段：名称（Input）、emoji（Input）、描述（TextArea）、关联 Skills（Select multiple）、autoMode（Switch）
- [ ] 2.3 实现创建模式：空表单 → 提交写入 useAgentStore
- [ ] 2.4 实现编辑模式：预填数据 → 提交更新 useAgentStore
- [ ] 2.5 实现内置 Agent 编辑时名称字段禁用
- [ ] 2.6 实现名称必填 + 唯一性校验
- [ ] 2.7 实现 backendName 自动生成（名称 → kebab-case）

## 3. Agent 删除

- [ ] 3.1 实现删除确认弹窗（Modal.confirm）
- [ ] 3.2 确认后从 useAgentStore 删除，列表刷新
- [ ] 3.3 内置 Agent 不显示删除按钮

## 4. 磁盘文件同步

- [ ] 4.1 实现 Electron IPC 接口：扫描 `opencode/agents/` 目录读取 `.md` 文件列表
- [ ] 4.2 实现 frontmatter 解析逻辑（YAML → Agent 配置对象）
- [ ] 4.3 实现同步写入 useAgentStore（新增/更新磁盘 Agent，标记 isFromDisk）
- [ ] 4.4 实现应用启动时触发同步
- [ ] 4.5 实现 Agents 页进入时触发同步刷新

## 5. 数据层

- [ ] 5.1 填充 useAgentStore 完整实现（agents 列表、CRUD 方法、当前 Agent 选择）
- [ ] 5.2 确保 useAgentStore persist 持久化到 localStorage
- [ ] 5.3 实现 Agent 类型定义（Agent interface）

## 6. 验证

- [ ] 6.1 验证 Agent 列表页展示正确（内置 3 个 + 自定义分区）
- [ ] 6.2 验证创建 Agent 流程（打开 Drawer → 填表 → 创建成功 → 列表刷新）
- [ ] 6.3 验证编辑 Agent 流程（内置编辑名称禁用、自定义全部可编辑）
- [ ] 6.4 验证删除 Agent 流程（确认弹窗 → 删除成功 → 列表刷新）
- [ ] 6.5 验证上限 10 个校验（创建第 11 个时按钮禁用）
- [ ] 6.6 验证深色/浅色主题下页面视觉正确
