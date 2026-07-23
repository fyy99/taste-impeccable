# Changelog

本项目遵循 [Semantic Versioning](https://semver.org/)。

## 0.1.0 - 2026-07-23

首次公开发布。

### Added

- 单一 `$taste-impeccable:design-frontend` 编排入口。
- Taste 主设计与实现、运行证据冻结、隔离只读 Impeccable 双审校的固定顺序。
- 校验与修复分事务：Impeccable reviewer 只读，Taste/main 裁决并修复采纳项，写入后重新冻结并 fresh 复审。
- Taste/Impeccable 内容白名单、适用范围门禁和主动改写 Skills 排除清单。
- 基于可证实用户影响的 P0-P3 门禁；P0/P1 阻断，P2/P3 保持 advisory。
- 上游版本锁定、确定性同步、角色契约版本、默认关闭的 remediation executor 扩展点、许可证与生成物哈希校验。
- 正向/负向触发、执行顺序、只读审校、修复所有权、fresh 复审与降级模式的升级回归用例。
- 中文优先、英文完整镜像的双语 README。
