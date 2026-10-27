# 第三方声明

本项目包含经筛选、重组或改写的第三方材料。Taste 和 Impeccable 的名称仅用于说明来源；本项目不是两者的官方发行版，也不代表原作者背书。

<!-- BEGIN GENERATED UPSTREAM PINS -->
- Taste：`refs/heads/main` → `12af471f627f866411b4bd785b19646d3672784c`
- Impeccable：`refs/tags/skill-v4.8.0` → `414603bf14c7a344edb466bb1f85690c77ce8b7d`
<!-- END GENERATED UPSTREAM PINS -->

## Taste

- 原项目：<https://github.com/Leonxlnx/taste-skill>
- 锁定来源：以 `upstreams.lock.json` 和上方生成区块为准
- 原作者：Leonxlnx
- 许可证：MIT，全文见 `LICENSES/TASTE-MIT.txt`

本项目携带新版 Taste v2 的 builder 指导、参考材料、方向库、基础素材与配套脚本；
主入口被改写为 builder-only 参考，上游独立审校轮次和报告流程由本项目编排替代。
方向库 JSON 保留原始字节，来源与 SHA-256 在 upstreams.lock.json 逐文件绑定；
其余衍生文件带来源标记。库内外部照片链接不表示本项目拥有图片权利，使用前须
核验相应来源、授权与署名。其它设计入口、实验版、安装器与上游评测不打包。

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
