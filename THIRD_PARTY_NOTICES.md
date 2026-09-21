# 第三方声明

本项目包含经筛选、重组或改写的第三方材料。Taste 和 Impeccable 的名称仅用于说明来源；本项目不是两者的官方发行版，也不代表原作者背书。

<!-- BEGIN GENERATED UPSTREAM PINS -->
- Taste：`refs/heads/main` → `5217fb45be2c0b302f29c9cd31cbd3237501c684`
- Impeccable：`refs/tags/skill-v4.3.1` → `cd12f8660e2dde57b9615c8a6b8ea674101f9cfc`
<!-- END GENERATED UPSTREAM PINS -->

## Taste

- 原项目：<https://github.com/Leonxlnx/taste-skill>
- 锁定来源：以 `upstreams.lock.json` 和上方生成区块为准
- 原作者：Leonxlnx
- 许可证：MIT，全文见 `LICENSES/TASTE-MIT.txt`

本项目仅提取 Taste v2 中与 brief 推断、设计旋钮、设计系统映射、实现质量和预检有关的内容，并为渐进披露拆分、缩写和调整路径。采纳范围不包括其他设计入口、风格预设、图像生成、品牌、Stitch 与输出链 Skills。

## Impeccable

- 原项目：<https://github.com/pbakaus/impeccable>
- 锁定来源：以 `upstreams.lock.json` 和上方生成区块为准
- 原作者：Paul Bakaus
- 许可证：Apache License 2.0，全文见 `LICENSES/IMPECCABLE-APACHE-2.0.txt`
- 原 NOTICE：见 `LICENSES/IMPECCABLE-NOTICE.md`

本项目只采用 critique、audit、detector 和 finish-reviewer 的只读审校方法；内容已为本插件的目录、报告格式、分级门禁和阶段顺序做修改。所有从 Impeccable 修改而来的文件应保留显著的来源、锁定版本和“已修改”说明。

Impeccable 的原 NOTICE 进一步声明其 `skill/reference/ios.md` 和 `skill/reference/android.md` 源自 ehmo 的 `platform-design-skills`（MIT）。上述平台参考文件不在本插件的采纳范围；仓库完整附带原 NOTICE 以保留归属信息。

## 本项目许可

除上述第三方内容及各文件另行标注外，本项目自有代码与文档采用根目录 `LICENSE` 中的 MIT License。第三方内容继续受各自许可证约束；根许可证不会替代这些条款。

原生检测引擎由 `setup-detector.mjs` 从 Impeccable 官方固定 release 下载到用户缓存，按锁文件中的平台 SHA-256 校验；本仓库不重新分发原生二进制。`detect.mjs` 与 `engine.mjs` 是本项目的本地只读适配代码，只开放检测入口。
