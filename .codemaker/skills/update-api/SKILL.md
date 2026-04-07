---
name: update-api
description: 更新项目接口文件。选择目标环境后执行 pnpm api:genapi 生成最新接口定义。用户说"更新接口"/"刷新API"时触发。
---

# 更新接口文件工作流

## 概述

本 skill 用于从指定环境拉取最新的 OpenAPI 文档并生成 TypeScript 接口定义文件。

## 工作流程

### Step 1: 询问目标环境

使用 `ask_user_question` 工具询问用户要从哪个环境更新接口，提供以下选项：

1. **test1** - 测试环境1 (muse-test.pm.netease.com)
2. **test2** - 测试环境2 (muse-test-2.atg.netease.com)
3. **test3** - 测试环境3 (muse-test3.muse.netease.com)
4. **uat** - UAT环境
5. **后端私有IP** - 指定后端开发者的私有 IP 地址

### Step 2: 处理私有 IP 选择

如果用户选择"后端私有IP"：

1. 读取 `genapi.js` 文件，解析其中已注释的开发者 IP 配置
2. 提取开发者名称和对应的 IP:端口 信息，构建选项列表
3. 询问用户选择已有的开发者，或新增一个：
   - 已有开发者列表（从注释中提取，如"陈明帅"、"何坚林"等）
   - "新增开发者" 选项
   - "更新现有开发者IP" 选项

4. 如果用户选择"新增开发者"：
   - 询问开发者姓名
   - 询问 IP 地址（格式：`10.x.x.x:port`）
   
5. 如果用户选择"更新现有开发者IP"：
   - 让用户选择要更新的开发者
   - 询问新的 IP 地址

### Step 3: 修改 genapi.js

根据用户选择，修改 `genapi.js` 文件中的 `api` 变量：

```javascript
// 环境映射
const ENV_MAP = {
  'test1': 'http://muse-test.pm.netease.com/muse-service/v3/api-docs',
  'test2': 'http://muse-test-2.atg.netease.com/muse-service/v3/api-docs',
  'test3': 'https://muse-test3.muse.netease.com/muse-service/v3/api-docs',
  'uat':   'http://{uat-host}/muse-service/v3/api-docs',  // UAT 地址请确认
};

// 私有 IP 格式
// const api = 'http://{IP}:{PORT}/muse-service/v3/api-docs';
```

修改时的注意事项：
- 找到当前激活的 `const api = '...'` 行
- 将其注释掉
- 取消目标环境对应行的注释，或添加新的私有 IP 配置
- 如果是新增开发者，添加注释说明开发者姓名

### Step 4: 执行 pnpm api:genapi

运行命令生成接口文件：

```bash
pnpm api:genapi
```

### Step 5: 处理执行结果

- **成功**：汇报成功信息，说明已从哪个环境更新
- **失败**：
  1. 检查错误信息
  2. 自动重试，最多重试 3 次
  3. 每次重试间隔 2 秒
  4. 如果 3 次都失败，汇报失败原因

## 输出格式

执行完成后，汇报：

```
✅ 接口更新成功！

- 环境：{环境名称}
- API源：{完整URL}
- 生成文件：
  - src/OpenApiServices/index.ts（及其他自动生成文件）
```

或失败时：

```
❌ 接口更新失败（已重试 3 次）

- 环境：{环境名称}
- 错误信息：{错误详情}
- 建议：检查网络连接或目标服务器是否可达
```

## 注意事项

1. 执行前确保网络可以访问目标环境
2. 私有 IP 需要在同一内网环境下才能访问
3. 端口默认为 8094，但可能因开发者不同而变化
4. 如果遇到超时，可能是目标服务未启动
