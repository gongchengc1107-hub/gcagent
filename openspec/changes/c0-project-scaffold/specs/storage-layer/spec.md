## ADDED Requirements

### Requirement: 类型安全的 localStorage 封装
应用 SHALL 提供类型安全的 localStorage 工具层，支持泛型读写、JSON 序列化/反序列化、异常处理。

#### Scenario: 安全写入
- **WHEN** 调用 `storage.set('key', value)`
- **THEN** value 被 JSON.stringify 后写入 localStorage

#### Scenario: 安全读取
- **WHEN** 调用 `storage.get<T>('key')`
- **THEN** 返回 JSON.parse 后的类型化数据，key 不存在时返回 undefined

#### Scenario: 读取损坏数据
- **WHEN** localStorage 中某 key 的值不是合法 JSON
- **THEN** 返回 undefined，不抛出异常，并在 console 打印警告

### Requirement: 存储键名管理
所有 localStorage 键名 SHALL 统一定义在常量文件中（如 `STORAGE_KEYS`），禁止在业务代码中硬编码字符串键名。

#### Scenario: 键名引用
- **WHEN** 业务代码需要读写 localStorage
- **THEN** 必须通过 `STORAGE_KEYS.xxx` 引用键名，不可使用字符串字面量
