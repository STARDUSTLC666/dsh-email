## 子代理路由约定

- 路由优先级：模型 `deepseek-v4.1-flash` > `deepseek-v4-pro` > `glm-5.3-flash`；供应商 `buddy` > `codearts` > `workbuddy`；模型优先级高于供应商。
- 思考程度：选可选的最高档（当前 buddy/deepseek-v4.1-flash 为 max）。
- 派发前不查路由列表，直接按上表用；上次实际使用：buddy / deepseek-v4.1-flash / max。
- 子代理提示词只带必需上下文：契约、任务清单、约束、验证标准。不塞调研全文——曾发生子代理读完 7 万字背景耗尽上下文零交付的事故。
- 本仓库文件是 CRLF、无 BOM 的 UTF-8 且含大量中文：绝不用 pwsh 的 `Set-Content`/`-replace` 重写，一律用 write/edit 工具或 Node 脚本（曾发生 GBK 重编码损坏 242 字符的事故）。
