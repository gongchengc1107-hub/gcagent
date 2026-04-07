# 项目名词表

> 本文件记录 MUSE 项目中的专有名词、缩写、业务术语。AI 在开发中遇到不确定的名词时应先查阅此文件。

## 业务名词

| 名词 | 解释 |
|------|------|
| MUSE | 素材资产管理平台（网易内部） |
| 仓库 / Organization / Org | 素材资源的归属组织，URL 中通常体现为 `/:org/` |
| 素材 / Asset | 平台管理的数字资源（3D 模型、音频、图片、特效等） |
| 资源包 | 素材的打包形式，可包含多个文件 |
| withPM | `src/Performance.tsx` 导出的高阶组件，用于组件级性能监控 |
| PMSelect | `src/components/PMSelect`，对 Bedrock Select 的性能监控包装 |
| BedrockComponentsProxy | `src/components/BedrockComponentsProxy/`，通过 Webpack alias 代理 @bedrock/components |
| SSO | 网易内部单点登录系统 |
| Scout | 网易内部前端监控系统 |
| pont-engine | 历史遗留的接口生成工具，对应 `src/services/` 目录 |
| OpenApiServices | 当前使用的自动生成接口服务，对应 `src/OpenApiServices/` 目录 |
| apiHandles | `src/apiHandles/`，对 OpenApiServices 方法的二次封装（参数预处理） |

## 素材类型英文标识

| 标识 | 中文 |
|------|------|
| `model` | 3D 模型 |
| `audio` | 音频 |
| `gallery` | 图库 |
| `effects` | 特效 |
| `engineering` | 工程文件 |
| `simpleAction` | 简单动作 |
| `advancedMaterial` | 高级材质 |
| `patent` | 专利 |
| `innovation` | 创新素材 |
| `tools` | 工具 |
