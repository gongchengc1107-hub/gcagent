## 1. Skill 列表页

- [ ] 1.1 创建 src/pages/Skills/index.tsx 页面组件（标题 + "安装 Skill" 按钮 + "Skill Hub" 链接 + 表格）
- [ ] 1.2 实现 Skill 表格（Ant Design Table：名称、描述、标签、启用开关、操作列）
- [ ] 1.3 实现启用/禁用 Switch 切换（更新 useSkillStore + 磁盘同步）
- [ ] 1.4 实现空列表引导状态
- [ ] 1.5 实现 Skill Hub 外部链接按钮（Electron shell.openExternal）

## 2. Skill 安装

- [ ] 2.1 创建 InstallSkillModal 安装弹窗组件（Modal + Tabs 三种方式）
- [ ] 2.2 实现"安装命令" Tab（输入框 + 命令预览 + 确认执行 + Electron IPC 执行）
- [ ] 2.3 实现"上传文件" Tab（Ant Design Upload + 文件解析 + 预览确认）
- [ ] 2.4 实现"手动填写" Tab（表单：名称、描述、说明文档 Markdown 编辑、标签输入、触发词输入）
- [ ] 2.5 实现触发词输入组件（Tag 样式，支持添加/删除多个触发词）
- [ ] 2.6 实现标签输入组件（Tag 样式，支持添加/删除多个标签）
- [ ] 2.7 实现 frontmatter 解析工具函数（YAML frontmatter → Skill 对象）

## 3. Skill 编辑/删除

- [ ] 3.1 创建 EditSkillDrawer 编辑抽屉组件（预填数据的表单）
- [ ] 3.2 实现保存编辑（更新 useSkillStore + 更新磁盘文件）
- [ ] 3.3 实现删除确认弹窗 + 删除逻辑（store + 磁盘文件同步删除）

## 4. 磁盘持久化

- [ ] 4.1 实现 Electron IPC 接口：读取 `opencode/skills/` 目录 `.md` 文件列表
- [ ] 4.2 实现 Electron IPC 接口：写入/更新 `.md` 文件（frontmatter + body）
- [ ] 4.3 实现 Electron IPC 接口：删除 `.md` 文件
- [ ] 4.4 实现 Skill 对象 → `.md` 文件序列化（生成 YAML frontmatter + readme body）
- [ ] 4.5 实现应用启动时磁盘同步（读取磁盘文件 → 合并到 useSkillStore）
- [ ] 4.6 实现 Skills 页进入时触发磁盘同步刷新

## 5. 数据层

- [ ] 5.1 填充 useSkillStore 完整实现（skills 列表、CRUD 方法、启用/禁用）
- [ ] 5.2 实现 Skill 类型定义（Skill interface）

## 6. 验证

- [ ] 6.1 验证三种安装方式均可成功安装 Skill
- [ ] 6.2 验证 Skill 启用/禁用开关正常，禁用后不出现在 `/` 命令菜单
- [ ] 6.3 验证编辑 Skill 流程（修改后 store 和磁盘同步更新）
- [ ] 6.4 验证删除 Skill 流程（store 和磁盘文件同步删除）
- [ ] 6.5 验证磁盘同步（手动添加文件后重启 → 新 Skill 出现）
- [ ] 6.6 验证 Skill Hub 链接正常跳转外部浏览器
- [ ] 6.7 验证深色/浅色主题下页面视觉正确
