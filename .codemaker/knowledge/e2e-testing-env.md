# E2E 测试环境配置

## Dev Server

- **启动命令**: `pnpm start` 或 `pnpm dev`
- **实际命令**: `cross-env NODE_OPTIONS='--max-old-space-size=4096' max dev`
- **端口**: `8181`（UmiJS max dev 配置）
- **启动时间**: 约 15 秒编译完成

## 本地代理

- **代理工具**: Proxyman
- **代理端口**: `127.0.0.1:8888`
- **用途**: HTTPS 代理映射，将 `muse-test.pm.netease.com` 的请求代理到本地或测试环境

## E2E 测试执行流程

### 1. 环境检查

```bash
# 检查 dev server 是否已启动（端口 8181）
lsof -i :8181 -P -n

# 检查 Proxyman 代理是否在运行（端口 8888）
lsof -i :8888 -P -n
```

### 2. 启动 Dev Server（如未启动）

```bash
# 后台启动
nohup pnpm start > /tmp/muse-dev-server.log 2>&1 &

# 等待编译完成（检查日志）
tail -f /tmp/muse-dev-server.log
# 看到 "Compiled in XXXms" 即启动完成
```

### 3. Playwright 配置

- **配置文件**: `playwright.config.ts`
- **baseURL**: `http://localhost:8181`（通过 `E2E_BASE_URL` 环境变量可覆盖）
- **代理**: `http://127.0.0.1:8888`（Proxyman）
- **测试文件位置**: `e2e/changes/{change-id}/`

### 4. 运行测试

```bash
# 运行特定 change 的 E2E 测试
npx playwright test e2e/changes/<change-id>/

# 指定 baseURL
E2E_BASE_URL=http://localhost:8181 npx playwright test e2e/changes/<change-id>/
```

## 已知限制

1. **登录态**: MUSE 平台需要网易内部 SSO 登录，Playwright 无法自动完成 SSO 认证。需要手动在浏览器中验证需要登录态的场景。
2. **测试数据**: 需要特定类型的资产数据，无法在测试中自动创建。E2E 测试中标记为 `test.skip` 的用例需手动验证。
3. **Proxyman 配置**: Proxyman 是 HTTP 代理（非反向代理），Playwright 通过 `proxy` 配置项使用它。确保 Proxyman 已配置好映射规则。
