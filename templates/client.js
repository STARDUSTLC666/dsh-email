// Editable browser entry. Build with node scripts/build-client.mjs.
window.__ModuleLoader__.load({ id: "dsh-email", factory: (require) => {
        var module = { exports: {} };
        var exports = module.exports;
        "use strict";
        Object.defineProperty(exports, "__esModule", { value: true });
        const React = require("react");
        const W = createWorkbenchUI(React);
        const { useState, useEffect, useCallback, useRef } = React;
        const h = React.createElement;
        // Harness supplies document.baseURI for reverse-proxy mounts and in-page navigation.
        const ROUTE = "api/dsh-email/settings";
        function translateError(message) {
            const common = {
                es: ['La cuenta seleccionada no está configurada o no ha iniciado sesión. Revisa la configuración de la cuenta.', 'No se pudo guardar de forma segura la credencial OAuth2. No se escribió ningún token en texto sin cifrar.', 'No se pudo leer el archivo de inicio de sesión OAuth2. Comprueba los permisos; el archivo original no se modificó.', 'El resultado del envío no está claro. Comprueba el buzón antes de volver a enviar para evitar duplicados.', 'La operación de correo ha fallado. Revisa la cuenta y los registros de DSH.'],
                fr: ['Le compte sélectionné n’est pas configuré ou connecté. Vérifiez ses paramètres.', 'Impossible d’enregistrer les identifiants OAuth2 en toute sécurité. Aucun jeton en clair n’a été écrit.', 'Impossible de lire le fichier de connexion OAuth2. Vérifiez les droits ; le fichier original n’a pas été modifié.', 'Le résultat de l’envoi est incertain. Vérifiez la boîte aux lettres avant de réessayer afin d’éviter les doublons.', 'L’opération de messagerie a échoué. Vérifiez le compte et les journaux DSH.'],
                de: ['Das ausgewählte Konto ist nicht eingerichtet oder angemeldet. Prüfe die Kontoeinstellungen.', 'OAuth2-Zugangsdaten konnten nicht sicher gespeichert werden. Es wurden keine Klartext-Token geschrieben.', 'Die OAuth2-Anmeldedatei konnte nicht gelesen werden. Prüfe die Zugriffsrechte; die Originaldatei blieb unverändert.', 'Das Ergebnis des Versands ist unklar. Prüfe das Postfach vor einem erneuten Versuch, um Duplikate zu vermeiden.', 'Der E-Mail-Vorgang ist fehlgeschlagen. Prüfe Kontoeinstellungen und DSH-Protokolle.'],
                ja: ['選択したアカウントが未設定または未ログインです。アカウント設定を確認してください。', 'OAuth2 認証情報を安全に保存できませんでした。平文トークンは書き込まれていません。', 'OAuth2 ログインファイルを読み取れません。アクセス権を確認してください。元のファイルは変更されていません。', '送信結果が不明です。重複を避けるため、再送信前にメールボックスを確認してください。', 'メール操作に失敗しました。アカウント設定と DSH ログを確認してください。'],
                pt: ['A conta selecionada não está configurada ou conectada. Verifique as configurações da conta.', 'Não foi possível salvar as credenciais OAuth2 com segurança. Nenhum token em texto simples foi gravado.', 'Não foi possível ler o arquivo de login OAuth2. Verifique as permissões; o arquivo original não foi alterado.', 'O resultado do envio é incerto. Verifique a caixa de correio antes de tentar novamente para evitar duplicatas.', 'A operação de e-mail falhou. Verifique a conta e os registros do DSH.'],
                ru: ['Выбранный аккаунт не настроен или не авторизован. Проверьте настройки аккаунта.', 'Не удалось безопасно сохранить данные OAuth2. Токены в открытом виде не записывались.', 'Не удалось прочитать файл входа OAuth2. Проверьте права доступа; исходный файл не изменён.', 'Результат отправки неизвестен. Проверьте почту перед повторной отправкой, чтобы избежать дубликатов.', 'Не удалось выполнить почтовую операцию. Проверьте настройки аккаунта и журналы DSH.'],
            }[uiLanguage()];
            if (!common) return message;
            if (/未写入明文令牌/.test(message)) return common[1];
            if (/无法读取 OAuth2 登录数据/.test(message)) return common[2];
            if (/结果.*未|不要.*重发|不要.*发送|本地保存失败|回执未能保存/.test(message)) return common[3];
            if (/账号|配置不完整|尚未登录|OAuth|设备码/.test(message)) return common[0];
            if (/邮件操作失败|邮箱操作失败/.test(message)) return common[4];
            return message;
        }
        function emailError(error) {
            const message = typeof error === 'string' ? error : error?.message || String(error || '');
            if(message.includes(' / ') && /[\u3400-\u9fff]/.test(message)){const split=message.indexOf(' / ');return uiLanguage()==='zh'?message.slice(0,split):message.slice(split+3);}
            if (/^(?:图片或附件|公网图片或附件|当前网络使用虚拟地址|无法解析图片或附件|下载大小上限)/.test(message) && message.includes(' / ')) {
                const split = message.indexOf(' / ');
                return uiLanguage() === 'zh' ? message.slice(0, split) : message.slice(split + 3);
            }
            if (uiLanguage() !== 'en')
                return translateError(message);
            if (error?.status === 401)
                return 'Your DSH session expired. Reopen DSH and try again.';
            if (!/[\u3400-\u9fff]/.test(message))
                return message;
            if (/未写入明文令牌/.test(message))
                return 'Windows credential encryption is unavailable. Check system PowerShell / DPAPI and retry. No plaintext tokens were written.';
            if (/无法读取或解锁 OAuth2 登录数据/.test(message))
                return 'The OAuth login file could not be read or unlocked. Windows encrypted files require the original Windows user. Preserve and move aside oauth2-tokens.json before signing in again on a new device or recovering damaged data. The original file was not overwritten.';
            if (/无法读取 OAuth2 登录数据/.test(message))
                return 'The OAuth login file could not be read. Check file access permissions; the original file was not overwritten.';
            if (/OAuth2 登录数据过大/.test(message))
                return 'The OAuth login data exceeds the storage limit. The original file was not overwritten.';
            if (/结果.*未|不要.*重发|不要.*发送|本地保存失败|回执未能保存/.test(message))
                return 'The send outcome is uncertain or its receipt could not be saved. Check the mailbox before sending again to avoid duplicate delivery.';
            if (/已提交|不能再次发送/.test(message))
                return 'This draft was submitted or its outcome is uncertain. Check the mailbox before copying it to a new draft.';
            if (/预览已过期|draft-preview-expired/.test(message + ' ' + (error?.code || '')))
                return 'The send review expired or was already used. Review the current draft again.';
            if (/改变|已更新|冲突|重新加载/.test(message))
                return 'The draft, account or rules changed. Reload the latest version and review your input before retrying.';
            if (/请先填写并保存邮件主题/.test(message))
                return 'Fill in and save the email subject first.';
            if (/附件/.test(message))
                return 'Check the attachments and the selected account limit (up to 4 MiB for AgentMail, 20 MiB for IMAP). Save first, use at most 10 files, and remove unreadable or oversized files.';
            if (/AgentMail/.test(message)) {
                const status = message.match(/HTTP \d+/)?.[0];
                return 'AgentMail request failed' + (status ? ' (' + status + ')' : '') + '. Check the API region, key, inbox and service status. For sending, check Sent before trying again.';
            }
            if (/账号|配置不完整|尚未登录|OAuth|设备码/.test(message))
                return 'Check the selected email account. Complete its credentials or OAuth sign-in in Account settings, then test the connection.';
            if (/收件人|邮箱地址/.test(message))
                return 'Check the recipient addresses and trusted-recipient rules before reviewing the draft again.';
            return 'The email operation failed. Check the account settings and DSH logs, then retry. For a send operation, check the mailbox before retrying.';
        }
        /** 「编辑即保存」的防抖窗口：连续打字只落一次盘。 */
        const SAVE_DEBOUNCE_MS = 800;
        async function api(action, payload, signal) {
            const init = action === undefined
                ? { credentials: "same-origin", headers: { "x-dsh-email-settings": "1" } }
                : {
                    credentials: "same-origin",
                    method: "POST",
                    headers: { "Content-Type": "application/json", "x-dsh-email-settings": "1" },
                    body: JSON.stringify(Object.assign({ action }, payload)),
                };
            const res = await fetch(ROUTE, { ...init, signal });
            const body = await res.json();
            if (!res.ok || !body.ok) {
                const error = new Error((body && body.error && body.error.message) || ("request failed " + res.status));
                // Callers branch on these: a revision conflict is retryable after a rebase,
                // anything else is not, and the message alone cannot tell them apart.
                error.code = body && body.error ? body.error.code : undefined;
                error.status = res.status;
                error.message = emailError(error);
                throw error;
            }
            return body.value;
        }
        /**
         * 登录失败的文案：平铺的 message 优先，退回 error.message，再退回调用方给的兜底。
         */
        function oauthErrorMessage(body, fallback) {
            if (body && typeof body.message === "string" && body.message !== "")
                return emailError(body.message);
            if (body && body.error && typeof body.error.message === "string" && body.error.message !== "")
                return emailError(body.error);
            return fallback;
        }
        /**
         * 只发请求、拆出 OAuth2 的契约体。
         *
         * 两个 action 的语义就在 { ok, status } 上，不是「成功即 value」，所以不能走那个
         * 会抛的 api()。而且信封有两种，必须都认：
         *   - 后端实际发的是和其它 action 一致的信封 { ok:true, value:{ status, url… } }；
         *     抛错时是 HTTP 400 + { ok:false, error:{ message } }。
         *   - 契约本身写成平铺的 { ok:true, status… } / { ok:false, message }。
         * 归一化成同一个平铺结构再交给调用方，调用方就不用管信封了。
         * 网络/非 JSON 响应仍照抛，由调用方兜成一条可重试的错误。
         */
        async function apiOauth(action, payload) {
            const res = await fetch(ROUTE, {
                credentials: "same-origin",
                method: "POST",
                headers: { "Content-Type": "application/json", "x-dsh-email-settings": "1" },
                body: JSON.stringify(Object.assign({ action }, payload)),
            });
            const body = await res.json();
            if (body === null || typeof body !== "object")
                return { ok: false, message: t("oauth.badResponse") };
            // 信封里的 value 才是契约体；平铺时就整个 body 当契约体（value 缺失即此情形）。
            const inner = body.value !== null && body.value !== undefined && typeof body.value === "object" ? body.value : body;
            if (body.ok === false) {
                return { ok: false, message: oauthErrorMessage(body) || oauthErrorMessage(inner) || t("oauth.loginFailed") };
            }
            // 契约体自己也可能说 ok:false（contract 的 { ok:false, message } 形态），它的字段优先。
            return Object.assign({ ok: true }, inner);
        }
        /**
         * 组装要落盘的完整 value：整份表单 + 当前有效的 accountsYaml，maxBodyChars 缺省
         * 20000。provider/user/password/inboxFolder 已经不在页面上编辑（账号都在卡片里、
         * 只存服务商 id），但它们仍随 value 原样带着 —— 后端 resolveEmailSettings 要拿它们
         * 做默认账号兜底。imap/smtp 同理只是随行，端点由预设展开，这里不再定型端口。
         */
        function settingsValueOf(draft, accountsYaml) {
            if (draft === null || draft === undefined)
                return null;
            return {
                ...draft,
                accountsYaml: typeof accountsYaml === "string" ? accountsYaml : "",
                maxBodyChars: typeof draft.maxBodyChars === "number" ? draft.maxBodyChars : 20000,
            };
        }
        /**
         * 「这份草稿是否已经落过盘」的签名：和最近一次成功保存的签名比对，一样就跳过。
         * 加载完、保存成功后都会对齐，所以「编辑即保存」不会变成「一动就存」。
         */
        function signatureOf(draft, accountsYaml) {
            const value = settingsValueOf(draft, accountsYaml);
            return value === null ? "" : JSON.stringify(value);
        }
        /**
         * 内置服务商：[值, 文案 key]。这里刻意存 key 而不是译文本体 —— 这张表在模块初始化
         * 时求值，那时 UI 字典还没建立；取文案一律走 t(entry[1])，只发生在渲染期。
         */
        const PROVIDERS = [
            ["qq", "provider.qq"],
            ["exmail", "provider.exmail"],
            ["163", "provider.163"],
            ["126", "provider.126"],
            ["sina", "provider.sina"],
            ["aliyun", "provider.aliyun"],
            ["gmail", "provider.gmail"],
            ["outlook", "provider.outlook"],
            ["icloud", "provider.icloud"],
        ];
        /**
         * 「自定义服务器」在服务商下拉里的哨兵值。这种账号在 YAML 里不写 provider，而是把
         * host/port/secure 直接写在账号自己的 imap/smtp 段里 —— 后端 resolveAccount() 原生
         * 支持这种账号（它的错误信息一直写着「或省略 provider 直接填 imap.host 与
         * smtp.host」），这里只是给这种账号一个可以点选的下拉项。
         * 双下划线包起来，避免和 serverPresets 里的预设名撞车（预设编辑器会拒绝同名）。
         */
        const CUSTOM_SERVER_PROVIDER = "__custom__";
        const EMPTY = {
            provider: "",
            user: "",
            password: "",
            inboxFolder: "INBOX",
            sendApproval: true,
            allowTrustedReply: false,
            replyLocale: "auto",
            replyTimeZone: "",
            newMailPopup: true,
            downloadDir: "",
            accountsYaml: "",
            serverPresets: "",
            imap: { host: "", port: 993, secure: true },
            smtp: { host: "", port: 465, secure: true },
        };
        /**
         * 走 OAuth2 的服务商（后端 authKind === 'oauth2' 的同一份名单）。这张表只是
         * 「还没保存、卡片数据没回来」时的本地预判：新选一个 provider，快照要等下一次
         * reload 才会说它是不是 oauth2，本地按名字先切成登录区，免得先让用户看到一个
         * 密码框、存完再变成登录按钮。
         */
        const OAUTH2_PROVIDERS = ["outlook"];
        /** 兜底轮询间隔：后端没给 interval 时按 5 秒问一次。 */
        const OAUTH_POLL_FALLBACK_MS = 5000;
        /** 后端返回的 expires_in 缺省是秒；缺省值取 15 分钟（和设备的码同寿）。 */
        const OAUTH_EXPIRES_FALLBACK_S = 900;
        const CSS = [
            ".dshe-settings{display:grid;gap:14px;padding:8px 2px 32px;color:var(--dsw-alias-label-primary,#26231f);color-scheme:light dark}",
            ".dshe-header{display:grid;gap:4px;padding:8px 2px}",
            ".dshe-header h2{font-size:22px;letter-spacing:-.02em;margin:0}",
            ".dshe-header p{max-width:640px;margin:4px 0 0;color:var(--dsw-alias-label-tertiary,#77736d);font-size:13px;line-height:1.55}",
            ".dshe-kicker{font-size:10px;text-transform:uppercase;letter-spacing:.1em;color:var(--dsw-alias-state-business-primary,#0b6c9f);font-weight:700}",
            ".dshe-panel{display:grid;gap:12px;padding:15px;border:1px solid var(--dsw-alias-border-l2,#dedbd5);border-radius:14px;background:var(--dsw-alias-bg-layer-1,#fff);box-shadow:0 1px 1px rgba(0,0,0,.02)}",
            ".dshe-panel{container-type:inline-size}@container(max-width:650px){.dshe-panel .dshe-workbench{grid-template-columns:minmax(0,1fr)}.dshe-panel .dshe-draft-list{max-height:160px;grid-template-columns:repeat(auto-fit,minmax(min(100%,180px),1fr))}}",
            "@media(max-width:700px){[role=dialog]:has(.dshe-settings){width:100%!important;max-width:100%!important;flex-direction:column!important}[role=dialog]:has(.dshe-settings)>nav+div{min-width:0;width:100%}[role=dialog]:has(.dshe-settings)>nav+div>div:has(.dshe-settings){padding:12px!important;min-width:0}[role=dialog]:has(.dshe-settings) nav{width:100%!important;flex-basis:auto!important;border-right:0;max-height:170px;overflow:auto}[role=dialog]:has(.dshe-settings) nav>div:has(>button){display:flex;flex-direction:row!important;flex-wrap:wrap;flex-shrink:0;gap:4px}}",
            ".dshe-tabs{display:flex;gap:6px;flex-wrap:wrap}.dshe-tabs [aria-selected=true]{background:var(--dsw-alias-button-primary-fill,#0b6c9f);color:var(--dsw-alias-label-primary-foreground,#fff)}",
            ".dshe-workbench{display:grid;grid-template-columns:minmax(150px,210px) minmax(0,1fr);gap:14px}.dshe-workbench>*{min-width:0}.dshe-draft-list{display:grid;gap:6px;max-height:340px;overflow:auto;align-content:start}.dshe-draft-row{display:grid;gap:4px;text-align:left;padding:10px;border:1px solid var(--dsw-alias-border-l2,#dedbd5);border-radius:9px;background:transparent;color:inherit;cursor:pointer;overflow-wrap:anywhere}.dshe-draft-row[aria-pressed=true]{border-color:var(--dsw-alias-state-business-primary,#0b6c9f)}.dshe-draft-row small{font-size:11px;opacity:.75}.dshe-draft-editor{display:grid;gap:12px;min-width:0}.dshe-review{display:grid;gap:10px;padding:12px;border:1px solid var(--dsw-alias-state-business-primary,#0b6c9f);border-radius:12px}.dshe-review h3{margin:0;font-size:16px}.dshe-review p{margin:0;overflow-wrap:anywhere;font-size:13px}.dshe-review pre{margin:0;padding:10px;background:var(--dsw-specific-input-major,#fafafa);border-radius:8px;white-space:pre-wrap;overflow-wrap:anywhere;max-height:240px;overflow:auto;font:inherit;font-size:13px}.dshe-files{display:grid;gap:7px;margin:0;padding:0;list-style:none}.dshe-files li{display:flex;align-items:center;justify-content:space-between;gap:8px;overflow-wrap:anywhere;font-size:13px}.dshe-files li span{min-width:0}.dshe-match-list{margin:0;padding-left:18px;font-size:12px;line-height:1.8;overflow-wrap:anywhere}.dshe-review .dshe-check{align-items:flex-start}.dshe-draft-editor textarea{resize:vertical;min-height:160px}.dshe-rule-panel textarea{resize:vertical;min-height:100px}.dshe-section-hidden[hidden]{display:none}.dshe-upload{display:grid;gap:6px;font-size:12px;min-width:0}.dshe-upload input{max-width:100%;font:inherit}.dshe-local-actions{display:flex;gap:6px;flex-wrap:wrap}.dshe-workbench h3{font-size:15px;margin:0}.dshe-workbench .dshe-grid{grid-template-columns:1fr}.dshe-editor-empty{padding:20px 0;color:var(--dsw-alias-label-tertiary,#77736d)}@media(max-width:600px){.dshe-workbench{grid-template-columns:minmax(0,1fr)}.dshe-draft-list{max-height:180px}.dshe-review{padding:10px}.dshe-files li{align-items:flex-start}}",
            ".dshe-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}",
            ".dshe-field{display:grid;gap:6px}",
            ".dshe-field label{font-size:12px;font-weight:600;color:var(--dsw-alias-label-primary,#26231f)}",
            ".dshe-field input[type=text],.dshe-field input[type=password],.dshe-field input[type=number],.dshe-field select,.dshe-field textarea{width:100%;box-sizing:border-box;padding:8px 10px;border:1px solid var(--dsw-alias-border-l2,#dedbd5);border-radius:9px;background:var(--dsw-specific-input-major,#fff);color:var(--dsw-alias-label-primary,#26231f);font:inherit;font-size:13px}",
            ".dshe-field select option{background:var(--dsw-alias-bg-layer-1,#fff);color:var(--dsw-alias-label-primary,#26231f)}",
            ".dshe-check{display:flex;gap:8px;align-items:center;font-size:13px}",
            ".dshe-endpoint-row{display:flex;gap:8px;align-items:center;flex-wrap:wrap}",
            ".dshe-endpoint-row input[type=text]{flex:1 1 180px;min-width:150px;width:auto}",
            ".dshe-endpoint-row input[type=number]{width:110px}",
            ".dshe-global{display:grid;gap:10px;padding:11px 12px;border:1px dashed var(--dsw-alias-border-l2,#dedbd5);border-radius:11px}",
            ".dshe-actions{display:flex;gap:8px;flex-wrap:wrap}",
            ".dshe-btn{display:inline-flex;align-items:center;height:32px;padding:0 14px;border-radius:999px;border:1px solid var(--dsw-alias-border-l2,#dedbd5);background:var(--dsw-alias-button-elevated-fill,transparent);color:inherit;font-size:13px;font-weight:600;cursor:pointer}",
            ".dshe-btn.primary{background:var(--dsw-alias-button-primary-fill,#0b6c9f);border-color:var(--dsw-alias-button-primary-fill,#0b6c9f);color:var(--dsw-alias-label-primary-foreground,#fff)}",
            ".dshe-btn.primary:hover{background:var(--dsw-alias-button-primary-hover,#0b6c9f);border-color:var(--dsw-alias-button-primary-hover,#0b6c9f)}",
            ".dshe-btn:disabled{opacity:.55;cursor:default}",
            ".dshe-alert{padding:10px 12px;border-radius:10px;font-size:12px;line-height:1.5;border:1px solid transparent}",
            ".dshe-alert.error{background:color-mix(in srgb,var(--dsw-alias-state-error-primary,#aa3939) 10%,transparent);border-color:color-mix(in srgb,var(--dsw-alias-state-error-primary,#aa3939) 22%,transparent);color:var(--dsw-alias-state-error-primary,#aa3939)}",
            ".dshe-alert.success{background:color-mix(in srgb,var(--dsw-alias-state-success-primary,#267d52) 10%,transparent);border-color:color-mix(in srgb,var(--dsw-alias-state-success-primary,#267d52) 22%,transparent);color:var(--dsw-alias-state-success-primary,#267d52)}",
            ".dshe-alert.info{background:color-mix(in srgb,var(--dsw-alias-state-business-primary,#0b5c86) 8%,transparent);border-color:color-mix(in srgb,var(--dsw-alias-state-business-primary,#0b5c86) 20%,transparent);color:var(--dsw-alias-state-business-primary,#0b5c86)}",
            ".dshe-alert.warn{background:color-mix(in srgb,var(--dsw-alias-state-warn-primary,#9a6700) 10%,transparent);border-color:color-mix(in srgb,var(--dsw-alias-state-warn-primary,#9a6700) 22%,transparent);color:var(--dsw-alias-state-warn-primary,#9a6700)}",
            ".dshe-details summary{font-size:12px;font-weight:600;cursor:pointer;color:var(--dsw-alias-label-tertiary,#77736d)}",
            ".dshe-hint{font-size:12px;color:var(--dsw-alias-label-tertiary,#77736d);line-height:1.5}",
            ".dshe-whale-root{position:fixed;right:20px;bottom:20px;z-index:2147483000;pointer-events:none}",
            ".dshe-whale-card{pointer-events:auto;position:relative;width:300px;border:1px solid var(--dsw-alias-border-l2,#e5e2db);border-radius:14px;background:var(--dsw-alias-bg-layer-1,#fff);box-shadow:var(--dsw-elevation-prominent,0 8px 24px rgba(0,0,0,.18));overflow:hidden;animation:dshe-whale-in .35s ease-out;font-size:13px;color:var(--dsw-alias-label-primary,#26231f);color-scheme:light dark}",
            "@keyframes dshe-whale-in{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}",
            ".dshe-whale-img{display:block;width:100%;height:120px;object-fit:cover;object-position:center top;background:var(--dsw-alias-bg-layer-2,#eaf3f8)}",
            ".dshe-whale-body{padding:10px 12px 12px;display:grid;gap:6px}",
            ".dshe-whale-title{font-weight:700;font-size:13px}",
            ".dshe-whale-item{color:var(--dsw-alias-label-tertiary,#77736d);font-size:12px;line-height:1.45;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
            ".dshe-whale-credit{font-size:10px;color:var(--dsw-alias-label-tertiary,#77736d);opacity:.8;line-height:1.4}",
            ".dshe-whale-close{position:absolute;top:6px;right:6px;width:22px;height:22px;border-radius:50%;border:none;background:var(--dsw-alias-bg-mask-3,rgba(0,0,0,.35));color:var(--dsw-alias-label-primary-inverted,#fff);cursor:pointer;font-size:12px;line-height:1}",
            ".dshe-acc-list{display:grid;gap:10px}",
            ".dshe-acc-card{display:grid;gap:9px;padding:11px 12px;border:1px solid var(--dsw-alias-border-l2,#dedbd5);border-radius:11px;background:var(--dsw-alias-bg-layer-2,#f7f6f2)}",
            ".dshe-acc-head{display:flex;flex-wrap:wrap;gap:8px;align-items:center}",
            ".dshe-acc-name{font-size:13px;font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
            ".dshe-acc-badge{display:inline-flex;align-items:center;height:18px;padding:0 8px;border-radius:999px;border:1px solid var(--dsw-alias-border-l2,#dedbd5);font-size:10px;font-weight:700;color:var(--dsw-alias-state-business-primary,#0b5c86)}",
            ".dshe-acc-badge.todo{border-style:dashed;color:inherit;opacity:.75}",
            ".dshe-acc-badge.is-default{border-color:transparent;background:color-mix(in srgb,var(--dsw-alias-state-success-primary,#267d52) 12%,transparent);color:var(--dsw-alias-state-success-primary,#267d52)}",
            ".dshe-acc-meta{font-size:12px;opacity:.72;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
            ".dshe-acc-actions{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-left:auto}",
            ".dshe-acc-danger{border-color:color-mix(in srgb,var(--dsw-alias-state-error-primary,#aa3939) 38%,transparent);color:var(--dsw-alias-state-error-primary,#aa3939)}",
            ".dshe-acc-body{display:grid;gap:12px;padding-top:2px}",
            ".dshe-acc-confirm{display:flex;flex-wrap:wrap;gap:8px;align-items:center;padding:8px 10px;border-radius:10px;font-size:12px;line-height:1.5;border:1px solid color-mix(in srgb,var(--dsw-alias-state-error-primary,#aa3939) 22%,transparent);background:color-mix(in srgb,var(--dsw-alias-state-error-primary,#aa3939) 10%,transparent);color:var(--dsw-alias-state-error-primary,#aa3939)}",
            ".dshe-acc-empty{padding:12px;border:1px dashed var(--dsw-alias-border-l2,#dedbd5);border-radius:11px;font-size:12px;text-align:center;opacity:.72}",
            ".dshe-acc-warn{color:var(--dsw-alias-state-error-primary,#aa3939)}",
            ".dshe-prst-list{display:grid;gap:10px}",
            ".dshe-prst-card{display:grid;gap:9px;padding:11px 12px;border:1px solid var(--dsw-alias-border-l2,#dedbd5);border-radius:11px;background:var(--dsw-alias-bg-layer-2,#f7f6f2)}",
            ".dshe-prst-head{display:flex;flex-wrap:wrap;gap:8px;align-items:center}",
            ".dshe-prst-name{font-size:13px;font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
            ".dshe-prst-badge{display:inline-flex;align-items:center;height:18px;padding:0 8px;border-radius:999px;border:1px solid var(--dsw-alias-border-l2,#dedbd5);font-size:10px;font-weight:700;color:var(--dsw-alias-state-business-primary,#0b5c86)}",
            ".dshe-prst-badge.todo{border-style:dashed;color:inherit;opacity:.75}",
            ".dshe-prst-badge.done{border-color:transparent;background:color-mix(in srgb,var(--dsw-alias-state-success-primary,#267d52) 12%,transparent);color:var(--dsw-alias-state-success-primary,#267d52)}",
            ".dshe-prst-meta{font-size:12px;opacity:.72;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
            ".dshe-prst-actions{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-left:auto}",
            ".dshe-prst-danger{border-color:color-mix(in srgb,var(--dsw-alias-state-error-primary,#aa3939) 38%,transparent);color:var(--dsw-alias-state-error-primary,#aa3939)}",
            ".dshe-prst-body{display:grid;gap:12px;padding-top:2px}",
            ".dshe-prst-confirm{display:flex;flex-wrap:wrap;gap:8px;align-items:center;padding:8px 10px;border-radius:10px;font-size:12px;line-height:1.5;border:1px solid color-mix(in srgb,var(--dsw-alias-state-error-primary,#aa3939) 22%,transparent);background:color-mix(in srgb,var(--dsw-alias-state-error-primary,#aa3939) 10%,transparent);color:var(--dsw-alias-state-error-primary,#aa3939)}",
            ".dshe-prst-empty{padding:12px;border:1px dashed var(--dsw-alias-border-l2,#dedbd5);border-radius:11px;font-size:12px;text-align:center;opacity:.72}",
            ".dshe-prst-warn{color:var(--dsw-alias-state-error-primary,#aa3939)}",
            ".dshe-prst-section{margin-top:4px}",
            ".dshe-auto-status{font-size:12px;font-weight:600;align-self:center;color:var(--dsw-alias-label-tertiary,#77736d)}",
            ".dshe-auto-status.is-saved{color:var(--dsw-alias-state-success-primary,#267d52)}",
            ".dshe-auto-status.is-error{color:var(--dsw-alias-state-error-primary,#aa3939)}",
            ".dshe-auto-status.is-draft{color:var(--dsw-alias-state-warning-primary,#986000)}",
            ".dshe-acc-badge.is-oauth{border-color:transparent;background:color-mix(in srgb,var(--dsw-alias-state-success-primary,#267d52) 12%,transparent);color:var(--dsw-alias-state-success-primary,#267d52)}",
            ".dshe-oauth{display:grid;gap:8px;padding:10px 11px;border:1px dashed var(--dsw-alias-border-l2,#dedbd5);border-radius:10px;background:var(--dsw-alias-bg-layer-1,#fff)}",
            ".dshe-oauth.is-logged-in{border-style:solid;border-color:color-mix(in srgb,var(--dsw-alias-state-success-primary,#267d52) 34%,transparent);background:color-mix(in srgb,var(--dsw-alias-state-success-primary,#267d52) 8%,transparent)}",
            ".dshe-oauth-head{font-size:12px;font-weight:600;line-height:1.5}",
            ".dshe-oauth-ok{color:var(--dsw-alias-state-success-primary,#267d52)}",
            ".dshe-oauth-wait{font-size:12px;color:var(--dsw-alias-label-tertiary,#77736d)}",
            ".dshe-oauth-code{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:20px;font-weight:700;letter-spacing:.14em;padding:8px 10px;border-radius:9px;border:1px solid var(--dsw-alias-border-l2,#dedbd5);background:var(--dsw-alias-bg-layer-2,#f7f6f2);text-align:center;user-select:all;overflow-wrap:anywhere}",
            ".dshe-oauth-url{font-size:12px;line-height:1.5;overflow-wrap:anywhere}",
            ".dshe-oauth-url a{color:var(--dsw-alias-state-business-primary,#0b5c86)}",
            ".dshe-oauth-actions{display:flex;flex-wrap:wrap;gap:8px;align-items:center}",
        ].join("\n");
        // ---------------------------------------------------------------------------
        // 界面文案字典。zh 是原文，en 是对照译文；两张表的 key 集必须逐键相同。
        //
        // 几条规矩，改文案时照做：
        //   - key 是「区域.名字」的短标识，跟文案内容无关，改文案不动 key；
        //   - 占位符写成 {name}，由 t() 做字面替换。**替换是字面量级的**，所以一条文案里
        //     的 {x} 顺序由这条文案自己决定（中英文语序不同也不需要动调用点）；
        //   - key 不存在时 t() 原样返回 key —— 界面上会直接露出 'card.add' 这样的字符串，
        //     这是故意的：漏译要看得见，不能静默变成空字符串。
        //   - 全角空格一律写成 \u3000，别在这份字典里直接敲。
        // ---------------------------------------------------------------------------
        var UI = {
            zh: {
                // 通用
                "common.cancel": "取消",
                "common.retry": "重试",
                "common.delete": "删除",
                "common.edit": "编辑",
                "common.collapse": "收起",
                "common.confirmDelete": "确认删除",
                "common.loading": "加载中…",
                "common.listSeparator": "、",
                // 导航 / 段标题
                "nav.title": "邮件 (dsh-email)",
                "section.title": "邮件",
                "section.intro": "添加邮箱后，就可以让助手帮你查收、搜索和回复邮件。选择服务商并填写邮箱地址与授权码，修改会自动保存。",
                "section.readonly": "当前配置为只读，可以查看，但无法保存修改。",
                "section.activeAccounts": "当前生效账号：{accounts}",
                // 内置服务商名（PROVIDERS 里存的就是这些 key）
                "provider.qq": "QQ 邮箱",
                "provider.163": "163 邮箱",
                "provider.126": "126 邮箱",
                "provider.sina": "新浪邮箱",
                "provider.aliyun": "阿里邮箱",
                "provider.gmail": "Gmail",
                "provider.exmail": "腾讯企业邮箱 / 企业微信邮箱",
                "provider.outlook": "Outlook",
                "provider.icloud": "iCloud",
                "provider.custom": "自定义",
                "provider.noneInYaml": "请选择邮箱服务商",
                "provider.undefinedPresetSuffix": "（未定义预设）",
                // 全局设置
                "global.sendApproval": "模型发信前确认（建议保留；可信规则可按账号跳过）",
                "global.sendApprovalRisk": "关闭后，所有账号的模型发信、回复和转发将不再逐次询问，未列入可信名单的收件人也可能直接收到邮件。禁止收件人规则和宿主权限继续生效；草稿页仍需手动确认发送。",
                "global.downloadDirLabel": "附件下载目录（默认保存在当前工作区）",
                "global.downloadDirPlaceholder": "留空使用默认",
                "global.hint": "以上设置对所有账号统一生效。需要插件确认的工具发信在 Full Access 下不会弹框；可改用草稿页手动核对并确认。禁止收件人规则始终生效。",
                // 自动保存状态条
                "status.saved": "已保存",
                "status.saving": "保存中…",
                "status.draft": "还有未保存的内容，请补全下方标记的字段。",
                "status.saveFailed": "保存失败：{message}（点击重试）",
                // 账号卡片
                "card.add": "+ 添加账号",
                "card.empty": "还没有账号。点「+ 添加账号」新增一个。",
                "card.unnamed": "（未命名）",
                "card.noAddress": "（未填邮箱地址）",
                "card.meta": "{address} · {folder} · {provider}",
                "card.noProvider": "未选服务商",
                "card.defaultBadge": "默认",
                "card.defaultAccount": "默认账号",
                "card.setDefault": "设为默认",
                "card.setDefaultAs": "设为默认：{name}",
                "card.incomplete": "未完成",
                "card.renamedBadge": "改名 → 按新名保存",
                "card.notLoggedIn": "未登录",
                "card.loggedInAs": "已登录 {user}",
                "card.testConnect": "测试连接",
                "card.testing": "测试中…",
                "card.testOk": "连接成功（{ms} ms）· {host}:{port}",
                "card.testFailed": "连接失败：{message}",
                "card.testMissingAddress": "请先填写这个账号的邮箱地址，再测试连接。",
                "card.pickDefault": "配置了多个账号，请设置默认账号：",
                "card.errNoName": "有账号还没填账号名，这份改动先不保存。",
                "card.errNoProvider": "有账号还没选服务商，这份改动先不保存。",
                "card.errDuplicateName": "已经有同名账号了，改名会覆盖掉它，这份改动先不保存。",
                "card.errReservedName": "账号名不能是 defaultAccount（该键保留给默认账号），这份改动先不保存。",
                "card.errNoDefault": "有多个账号还没指定默认账号，这份改动先不保存。",
                "card.yamlParseFailed": "accountsYaml 解析失败：{error}",
                "card.confirmDelete": "删除账号「{name}」会同时移除已保存的登录信息，不会删除邮箱里的邮件。",
                "card.nameLabel": "账号名称",
                "card.nameHint": "用来区分多个邮箱，例如「工作邮箱」。修改名称会保留原有设置；名称不能为 defaultAccount。",
                "card.reservedNameWarn": "defaultAccount 是保留键（表示默认账号），请换一个名字。",
                "card.providerLabel": "服务商",
                "card.addressLabel": "邮箱地址",
                "card.authKindLabel": "认证方式",
                "card.authKindAuto": "自动（按服务商判断）",
                "card.authKindOAuth2": "OAuth2 设备码登录",
                "card.authKindPassword": "密码 / 授权码",
                "card.authKindHint": "默认按服务商判断。仍能用应用密码连 Exchange Online 的租户（混合或本地部署、SMTP AUTH 未关闭）选「密码 / 授权码」；改动后请重新「测试连接」。",
                "card.passwordLabel": "授权码 / 应用专用密码",
                "card.passwordPlaceholder": "留空保持不变",
                "card.passwordSaved": "已存有授权码：留空保持不变，清空后填内容即覆盖。",
                "card.passwordHint": "请填写邮箱服务商提供的授权码或应用专用密码，然后点击「测试连接」。",
                "card.senderNameLabel": "发件显示名（可选）",
                "card.senderNamePlaceholder": "只影响收件人看到的名称",
                "card.senderNameHint": "只改收件人看到的显示名，发件地址仍是上面的邮箱地址。",
                "card.authUserLabel": "登录账号（与邮箱地址不同时填）",
                "card.authUserPlaceholder": "留空 = 用上面的邮箱地址登录",
                "card.authUserHint": "别名或中继场景：上面填信件发出的地址，这里填真正用于 IMAP/SMTP 登录的账号。留空即与邮箱地址相同。",
                "card.authPasswordLabel": "登录账号的密码（可选）",
                "card.authPasswordSaved": "已存有登录密码：留空保持不变，清空后填内容即覆盖。",
                "card.authPasswordHint": "留空即沿用上面那栏的授权码 / 应用专用密码；只有登录账号与邮箱地址不同、且密码也不一样时才需要单独填。",
                "card.inboxLabel": "收件文件夹（默认 INBOX）",
                "card.autoSaveHint": "改动会自动保存。",
                "card.autoSaveHintNoDefault": " 现在有多个账号但没有默认账号，必须先指定一个。",
                "card.builtinEndpoints": " · {imap} ｜ {smtp}",
                "card.customEndpoint": " · {endpoint}",
                "provider.customServer": "自定义服务器（手动填写）",
                "card.customServerHint": "内网或自建邮件服务器：填收信服务器地址即可；发信服务器留空时沿用收信服务器。端口留空按默认值处理（IMAP 993 / SMTP 465）。",
                "card.imapServerLabel": "IMAP 收信服务器",
                "card.smtpServerLabel": "SMTP 发信服务器（留空沿用收信服务器）",
                "card.portLabel": "端口",
                "card.tlsLabel": "SSL / TLS",
                "card.errNoCustomHost": "自定义服务器账号还没填收信服务器地址，这份改动先不保存。",
                "preset.errReservedName": "预设名不能是「{name}」：这个值保留给「自定义服务器」下拉项，请换一个名字。",
                // OAuth2 登录区
                "oauth.clientIdLabel": "应用（客户端）ID",
                "oauth.clientIdPlaceholder": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
                "oauth.clientIdHint": "留空即用插件内置的社区应用（免费、开箱即用）：微软同意屏上显示的是贡献者的应用名，登录日志也归到对方租户。想换成自己的 Azure（Entra）公共客户端 ID（需勾选 IMAP/SMTP 委托权限并开启设备码流）就填进来，改动它需要重新登录。",
                "oauth.clientIdMissing": "当前构建没有内置应用（客户端）ID，设备码登录无法开始：按 README 的「Outlook OAuth2」一节注册一个，填进来即可。",
                "oauth.clientIdBuiltIn": "将使用插件内置的社区应用：{id}（贡献者 gurio-wine 注册并授权本项目内置使用）。企业策略不接受第三方应用时，请换成自己的。",
                "oauth.passwordless": "这个服务商使用 OAuth2 授权，不需要密码{label}。",
                "oauth.passwordlessLabel": "（{label}）",
                "oauth.signIn.outlook": "登录 Microsoft 账号",
                "oauth.signIn.generic": "登录 {provider} 账号",
                "oauth.requestingCode": "正在获取授权码…",
                "oauth.signingIn": "登录中…",
                "oauth.reLogin": "重新登录",
                "oauth.pendingHint": "在浏览器打开下面的地址，输入代码完成授权：",
                "oauth.noUrl": "（后端没有返回授权地址，请点取消后重试）",
                "oauth.polling": "轮询中…（每 {seconds} 秒检查一次，授权链接约 {minutes} 分钟内有效）",
                "oauth.loggedInAs": "已登录：{user}",
                "oauth.unknownUser": "（未知账号）",
                "oauth.loginOk": "登录成功。",
                "oauth.loginOkAs": "登录成功：{user}",
                "oauth.loginFailed": "登录失败",
                "oauth.badResponse": "服务端返回了无法识别的响应",
                // 服务器预设
                "preset.sectionTitle": "服务器预设（自定义服务商，高级）",
                "preset.add": "+ 添加预设",
                "preset.empty": "还没有自定义服务器预设。点「+ 添加预设」，账号卡片的服务商下拉里就会多出这个名字。",
                "preset.cleared": "卡片已清空：填完剩下的字段即会写回，删除全部 {count} 条预设。",
                "preset.badgeUnnamed": "未命名",
                "preset.badgeRenamed": "改名 → 删旧建新",
                "preset.badgeDuplicate": "重名",
                "preset.noHost": "（未填主机）",
                "preset.endpointMissing": "端点未填",
                "preset.metaImap": "imap {host}:{port}",
                "preset.metaSmtp": " ｜ smtp {host}:{port}",
                "preset.ssl": " · SSL",
                "preset.plain": " · 明文",
                "preset.confirmDelete": "删除预设「{name}」后，指向它的账号卡片会失去端点（服务商下拉里也不再列出它）。",
                "preset.nameLabel": "预设名（serverPresets 的键，也是账号 provider 的值）",
                "preset.nameHint": "不能和内置服务商同名（qq/163/126/sina/aliyun/gmail/outlook/icloud）—— 那会被内置预设挡住。改名会删旧键、建新键。",
                "preset.duplicateWarn": "已经有同名预设了：预设名是 YAML 的键，必须唯一。",
                "preset.labelLabel": "显示名 label（可选）",
                "preset.labelPlaceholder": "公司邮箱",
                "preset.imapHostLabel": "IMAP 主机",
                "preset.imapPortLabel": "IMAP 端口",
                "preset.imapPortHint": "留空即用默认 993。",
                "preset.imapSsl": "IMAP SSL",
                "preset.smtpHostLabel": "SMTP 主机",
                "preset.smtpPortLabel": "SMTP 端口",
                "preset.smtpPortHint": "留空即用默认 465。",
                "preset.smtpSsl": "SMTP SSL（587 端口请取消勾选）",
                "preset.portProblem": "{problem}。",
                "preset.yamlParseFailed": "serverPresets 解析失败：{error}",
                "preset.yamlParseFailedHint": "下面的卡片是从快照里的（空）预设表建的，不代表这份文本。可以直接改下面的 YAML 重新写一份。",
                "preset.footerHint": "预设不含邮箱地址和授权码，只记连接参数；账号只存服务商名，端点在连接时从预设展开。",
                "preset.portNumeric": "端口必须是数字",
                "preset.portRange": "端口必须在 1-65535 之间",
                "preset.errNoName": "有预设还没填名称（预设名就是 YAML 的键）。",
                "preset.errDuplicate": "有两张预设卡都叫「{name}」：预设名是 YAML 的键，不能重名。",
                "preset.errNoImapHost": "预设「{name}」还没填 IMAP 主机。",
                "preset.errNoSmtpHost": "预设「{name}」还没填 SMTP 主机。",
                "preset.errImapPort": "预设「{name}」的 IMAP {problem}。",
                "preset.errSmtpPort": "预设「{name}」的 SMTP {problem}。",
                // 卡片级提示
                "notice.commentsDropped": "原文档无法就地编辑，注释已丢失；",
                "notice.passwordsDropped": "有账号的已存密码无法保留，请在对应卡片重输；",
                "notice.restSaved": "其余改动已自动保存。",
                "notice.cardsNotWritten": "账号改动没能写进 YAML：{message}",
                // 鲸鱼娘弹窗
                "whale.title": "鲸鱼娘递信：有 {count} 封新邮件",
                "whale.unknownSender": "(未知)",
                "whale.noSubject": "(无主题)",
                "whale.row": "{who} · {subject}",
                "whale.more": "…其余 {count} 封，用 email_watch / email_read 查看",
                "whale.close": "关闭",
            },
            // 与 zh 逐键对照。技术名词（IMAP/SMTP/OAuth2/INBOX/SSL/YAML、键名与预设名）原样保留；
            // 占位符逐键与 zh 相同，语序按英文自己排。
            en: {
                // 通用
                "common.cancel": "Cancel",
                "common.retry": "Retry",
                "common.delete": "Delete",
                "common.edit": "Edit",
                "common.collapse": "Collapse",
                "common.confirmDelete": "Confirm delete",
                "common.loading": "Loading…",
                "common.listSeparator": ", ",
                // 导航 / 段标题
                "nav.title": "Email (dsh-email)",
                "section.title": "Email",
                "section.intro": "Add a mailbox so your assistant can read, search and reply to mail. Choose a provider and enter your email address and app password. Changes save automatically.",
                "section.readonly": "The settings store is read-only right now: you can view the settings but not save them.",
                "section.activeAccounts": "Active accounts: {accounts}",
                // 内置服务商名（PROVIDERS 里存的就是这些 key）
                "provider.qq": "QQ Mail",
                "provider.163": "163 Mail",
                "provider.126": "126 Mail",
                "provider.sina": "Sina Mail",
                "provider.aliyun": "Alibaba Mail",
                "provider.gmail": "Gmail",
                "provider.exmail": "Tencent Enterprise / WeCom Mail",
                "provider.outlook": "Outlook",
                "provider.icloud": "iCloud",
                "provider.custom": "Custom",
                "provider.noneInYaml": "Choose your email provider",
                "provider.undefinedPresetSuffix": "(undefined preset)",
                // 全局设置
                "global.sendApproval": "Confirm model-initiated sends (recommended; saved trust can skip per account)",
                "global.sendApprovalRisk": "With this off, model-initiated sends, replies and forwards skip this plugin's confirmation for every account, including recipients outside the trusted list. Blocked-recipient rules and host permissions still apply. Drafts still require manual send confirmation.",
                "global.downloadDirLabel": "Attachment download directory (defaults to the current workspace)",
                "global.downloadDirPlaceholder": "Leave empty for the default",
                "global.hint": "These settings apply to every account. Tool sends that still require plugin confirmation cannot show a dialog under Full Access; use the Drafts tab to review and confirm manually. Blocked-recipient rules always apply.",
                // 自动保存状态条
                "status.saved": "Saved",
                "status.saving": "Saving…",
                "status.draft": "Some edits are not saved yet. Complete the highlighted fields below.",
                "status.saveFailed": "Save failed: {message} (click to retry)",
                // 账号卡片
                "card.add": "+ Add account",
                "card.empty": "No accounts yet. Click “+ Add account” to create one.",
                "card.unnamed": "(unnamed)",
                "card.noAddress": "(no email address)",
                "card.meta": "{address} · {folder} · {provider}",
                "card.noProvider": "No provider",
                "card.defaultBadge": "Default",
                "card.defaultAccount": "Default account",
                "card.setDefault": "Set as default",
                "card.setDefaultAs": "Set as default: {name}",
                "card.incomplete": "Incomplete",
                "card.renamedBadge": "Renamed → saves under the new name",
                "card.notLoggedIn": "Not signed in",
                "card.loggedInAs": "Signed in as {user}",
                "card.testConnect": "Test connection",
                "card.testing": "Testing…",
                "card.testOk": "Connected ({ms} ms) · {host}:{port}",
                "card.testFailed": "Connection failed: {message}",
                "card.testMissingAddress": "Enter this account's email address before testing the connection.",
                "card.pickDefault": "Several accounts are configured; choose the default account:",
                "card.errNoName": "An account has no name yet; this change will not be saved.",
                "card.errNoProvider": "An account has no provider selected; this change will not be saved.",
                "card.errDuplicateName": "Another account already has that name; renaming would overwrite it, so this change will not be saved.",
                "card.errReservedName": "An account cannot be named defaultAccount (that key is reserved for the default account); this change will not be saved.",
                "card.errNoDefault": "Several accounts exist but no default account was chosen; this change will not be saved.",
                "card.yamlParseFailed": "accountsYaml failed to parse: {error}",
                "card.confirmDelete": "Deleting account “{name}” also removes its saved login details. Messages in the mailbox are not deleted.",
                "card.nameLabel": "Account name",
                "card.nameHint": "Use a name such as “Work” to distinguish your mailboxes. Renaming keeps the existing settings; defaultAccount is reserved.",
                "card.reservedNameWarn": "defaultAccount is a reserved key (it means the default account); pick another name.",
                "card.providerLabel": "Provider",
                "card.addressLabel": "Email address",
                "card.authKindLabel": "Authentication",
                "card.authKindAuto": "Automatic (decided by the provider)",
                "card.authKindOAuth2": "OAuth2 device-code login",
                "card.authKindPassword": "Password / app password",
                "card.authKindHint": "Decided by the provider by default. Choose「Password / app password」for a tenant that still accepts basic auth against Exchange Online (hybrid or on-premises, SMTP AUTH left enabled); re-run「Test connection」after changing it.",
                "card.passwordLabel": "Authorization code / app password",
                "card.passwordPlaceholder": "Leave empty to keep it",
                "card.passwordSaved": "A password is already stored: leave empty to keep it, or clear the field and type to overwrite.",
                "card.passwordHint": "Enter the authorization code or app password from your email provider, then click “Test connection”.",
                "card.senderNameLabel": "Sender display name (optional)",
                "card.senderNamePlaceholder": "Only the name recipients see",
                "card.senderNameHint": "Changes only the name recipients see; the address stays the one above.",
                "card.authUserLabel": "Login user (when it differs from the address)",
                "card.authUserPlaceholder": "Empty = log in with the address above",
                "card.authUserHint": "Alias or relay: the address above is what mail is sent from, this is the account IMAP/SMTP authenticates. Empty means they are the same.",
                "card.authPasswordLabel": "Password for the login user (optional)",
                "card.authPasswordSaved": "A login password is stored: leave it empty to keep it, or type to replace it.",
                "card.authPasswordHint": "Leave empty to reuse the authorization code / app password above; only needed when the login user has a password of its own.",
                "card.inboxLabel": "Inbox folder (default INBOX)",
                "card.autoSaveHint": " Changes save automatically.",
                "card.autoSaveHintNoDefault": " There are several accounts but no default account yet; you must pick one first.",
                "card.builtinEndpoints": " · {imap} | {smtp}",
                "card.customEndpoint": " · {endpoint}",
                "provider.customServer": "Custom server (enter details)",
                "card.customServerHint": "For an intranet or self-hosted mail server: enter the incoming server. The outgoing server follows it when left blank. Empty ports fall back to the defaults (IMAP 993 / SMTP 465).",
                "card.imapServerLabel": "IMAP incoming server",
                "card.smtpServerLabel": "SMTP outgoing server (blank = incoming server)",
                "card.portLabel": "Port",
                "card.tlsLabel": "SSL / TLS",
                "card.errNoCustomHost": "A custom-server account has no incoming server yet, so this change is not saved.",
                "preset.errReservedName": "A preset cannot be named “{name}”: that value is reserved for the custom-server option. Pick another name.",
                // OAuth2 登录区
                "oauth.clientIdLabel": "Application (client) ID",
                "oauth.clientIdPlaceholder": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
                "oauth.clientIdHint": "Leave this empty to log in with the plugin's built-in community application (free, nothing to set up): the Microsoft consent screen names the contributor's app and the sign-in logs land in their tenant. Paste your own Azure (Entra) public client ID here (with the IMAP/SMTP delegated permissions and the device-code flow enabled) to use that instead; changing it requires signing in again.",
                "oauth.clientIdMissing": "This build carries no built-in application (client) ID, so the device-code login cannot start: register one as described in the README's「Outlook OAuth2」section and paste it here.",
                "oauth.clientIdBuiltIn": "Signing in through the plugin's built-in community application: {id} (registered by contributor gurio-wine, used with permission). Use your own application if third-party apps are not allowed.",
                "oauth.passwordless": "This provider authorizes over OAuth2, so no password is needed{label}.",
                "oauth.passwordlessLabel": " ({label})",
                "oauth.signIn.outlook": "Sign in with Microsoft",
                "oauth.signIn.generic": "Sign in to {provider}",
                "oauth.requestingCode": "Requesting a code…",
                "oauth.signingIn": "Signing in…",
                "oauth.reLogin": "Sign in again",
                "oauth.pendingHint": "Open the address below in your browser and enter the code to finish authorizing:",
                "oauth.noUrl": "(the backend returned no authorization URL; cancel and try again)",
                "oauth.polling": "Waiting… (checking every {seconds} seconds; the authorization link stays valid for about {minutes} minutes)",
                "oauth.loggedInAs": "Signed in: {user}",
                "oauth.unknownUser": "(unknown account)",
                "oauth.loginOk": "Signed in.",
                "oauth.loginOkAs": "Signed in: {user}",
                "oauth.loginFailed": "Sign-in failed",
                "oauth.badResponse": "The server returned a response we do not recognize",
                // 服务器预设
                "preset.sectionTitle": "Server presets (custom providers, advanced)",
                "preset.add": "+ Add preset",
                "preset.empty": "No custom server presets yet. Click “+ Add preset” and the name shows up in the provider dropdown of the account cards.",
                "preset.cleared": "Cards cleared: finish the remaining fields and it is written back, deleting all {count} presets.",
                "preset.badgeUnnamed": "Unnamed",
                "preset.badgeRenamed": "Renamed → old key deleted, new one created",
                "preset.badgeDuplicate": "Duplicate",
                "preset.noHost": "(no host)",
                "preset.endpointMissing": "No endpoint",
                "preset.metaImap": "imap {host}:{port}",
                "preset.metaSmtp": " | smtp {host}:{port}",
                "preset.ssl": " · SSL",
                "preset.plain": " · plain",
                "preset.confirmDelete": "Deleting preset “{name}” leaves the account cards pointing at it without endpoints (and it is no longer listed in the provider dropdown).",
                "preset.nameLabel": "Preset name (the serverPresets key, also the account's provider value)",
                "preset.nameHint": "Cannot collide with a built-in provider (qq/163/126/sina/aliyun/gmail/outlook/icloud) — the built-in preset would shadow it. Renaming deletes the old key and creates a new one.",
                "preset.duplicateWarn": "A preset with this name already exists: preset names are YAML keys and must be unique.",
                "preset.labelLabel": "Display label (label key, optional)",
                "preset.labelPlaceholder": "Work email",
                "preset.imapHostLabel": "IMAP host",
                "preset.imapPortLabel": "IMAP port",
                "preset.imapPortHint": "Leave empty to use the default 993.",
                "preset.imapSsl": "IMAP SSL",
                "preset.smtpHostLabel": "SMTP host",
                "preset.smtpPortLabel": "SMTP port",
                "preset.smtpPortHint": "Leave empty to use the default 465.",
                "preset.smtpSsl": "SMTP SSL (uncheck it for port 587)",
                "preset.portProblem": "{problem}.",
                "preset.yamlParseFailed": "serverPresets failed to parse: {error}",
                "preset.yamlParseFailedHint": "The cards below were built from the (empty) preset table in the snapshot, not from this text. Edit the YAML below to write a new one from scratch.",
                "preset.footerHint": "A preset carries no email address and no password, only connection parameters; an account stores just the provider name and expands its endpoints from the preset when it connects.",
                "preset.portNumeric": "The port must be a number",
                "preset.portRange": "The port must be between 1 and 65535",
                "preset.errNoName": "A preset has no name yet (the preset name is the YAML key).",
                "preset.errDuplicate": "Two preset cards are both named “{name}”: preset names are YAML keys and must be unique.",
                "preset.errNoImapHost": "Preset “{name}” has no IMAP host yet.",
                "preset.errNoSmtpHost": "Preset “{name}” has no SMTP host yet.",
                "preset.errImapPort": "Preset “{name}” has an invalid IMAP port: {problem}.",
                "preset.errSmtpPort": "Preset “{name}” has an invalid SMTP port: {problem}.",
                // 卡片级提示
                "notice.commentsDropped": "Comments were dropped: the original document cannot be edited in place. ",
                "notice.passwordsDropped": "Some stored passwords could not be kept; re-enter them on the matching cards. ",
                "notice.restSaved": "Everything else was saved automatically.",
                "notice.cardsNotWritten": "The account changes could not be written to the YAML: {message}",
                // 鲸鱼娘弹窗
                "whale.title": "Whale courier: {count} new messages",
                "whale.unknownSender": "(unknown)",
                "whale.noSubject": "(no subject)",
                "whale.row": "{who} · {subject}",
                "whale.more": "…and {count} more; use email_watch / email_read to see them",
                "whale.close": "Close",
            },
        };
        // Supported host locales receive a complete table. Overrides keep the most
        // visible controls native; newly added keys remain readable in English.
        const UI_LOCALE_OVERRIDES = {
            es: {
                "common.cancel": "Cancelar", "common.retry": "Reintentar", "common.delete": "Eliminar", "common.edit": "Editar", "common.collapse": "Contraer", "common.loading": "Cargando…",
                "nav.title": "Correo (dsh-email)", "section.title": "Correo", "section.intro": "Añade un buzón para que tu asistente pueda leer, buscar y responder correos. Elige un proveedor e introduce tu dirección y contraseña de aplicación. Los cambios se guardan automáticamente.",
                "global.sendApproval": "Confirmar envíos iniciados por el modelo", "global.downloadDirLabel": "Directorio de descargas de adjuntos", "status.saved": "Guardado", "status.saving": "Guardando…", "status.draft": "Hay cambios sin guardar.", "status.saveFailed": "No se pudo guardar: {message}",
                "card.add": "+ Añadir cuenta", "card.empty": "Todavía no hay cuentas.", "card.defaultBadge": "Predeterminada", "card.defaultAccount": "Cuenta predeterminada", "card.setDefault": "Establecer como predeterminada", "card.incomplete": "Incompleta", "card.notLoggedIn": "No has iniciado sesión", "card.loggedInAs": "Sesión iniciada como {user}", "card.testConnect": "Probar conexión", "card.testing": "Probando…", "card.testOk": "Conectado ({ms} ms) · {host}:{port}", "card.testFailed": "Error de conexión: {message}", "card.providerLabel": "Proveedor", "card.addressLabel": "Dirección de correo", "card.passwordLabel": "Código de autorización / contraseña de aplicación", "card.passwordPlaceholder": "Déjalo vacío para conservarlo",
                "oauth.signIn.outlook": "Iniciar sesión con Microsoft", "oauth.signIn.generic": "Iniciar sesión en {provider}", "oauth.requestingCode": "Solicitando código…", "oauth.signingIn": "Iniciando sesión…", "oauth.reLogin": "Iniciar sesión de nuevo", "oauth.pendingHint": "Abre la dirección en el navegador e introduce el código:", "oauth.loggedInAs": "Sesión iniciada: {user}", "oauth.loginOk": "Sesión iniciada.", "oauth.loginFailed": "Error al iniciar sesión",
                "preset.sectionTitle": "Preajustes de servidor", "preset.add": "+ Añadir preajuste", "preset.empty": "Todavía no hay preajustes personalizados.", "preset.nameLabel": "Nombre del preajuste", "preset.imapHostLabel": "Servidor IMAP", "preset.imapPortLabel": "Puerto IMAP", "preset.smtpHostLabel": "Servidor SMTP", "preset.smtpPortLabel": "Puerto SMTP", "preset.imapSsl": "SSL de IMAP", "preset.smtpSsl": "SSL de SMTP", "preset.yamlParseFailed": "No se pudo analizar serverPresets: {error}",
                "whale.title": "Mensajero: {count} mensajes nuevos", "whale.unknownSender": "(desconocido)", "whale.noSubject": "(sin asunto)", "whale.close": "Cerrar",
            },
            fr: {
                "common.cancel": "Annuler", "common.retry": "Réessayer", "common.delete": "Supprimer", "common.edit": "Modifier", "common.collapse": "Réduire", "common.loading": "Chargement…",
                "nav.title": "E-mail (dsh-email)", "section.title": "E-mail", "section.intro": "Ajoutez une boîte aux lettres pour que votre assistant puisse lire, rechercher et répondre aux messages. Choisissez un fournisseur et saisissez votre adresse ainsi que votre mot de passe d’application. Les changements sont enregistrés automatiquement.",
                "global.sendApproval": "Confirmer les envois lancés par le modèle", "global.downloadDirLabel": "Dossier de téléchargement des pièces jointes", "status.saved": "Enregistré", "status.saving": "Enregistrement…", "status.draft": "Certains changements ne sont pas enregistrés.", "status.saveFailed": "Échec de l’enregistrement : {message}",
                "card.add": "+ Ajouter un compte", "card.empty": "Aucun compte pour le moment.", "card.defaultBadge": "Par défaut", "card.defaultAccount": "Compte par défaut", "card.setDefault": "Définir par défaut", "card.incomplete": "Incomplet", "card.notLoggedIn": "Non connecté", "card.loggedInAs": "Connecté en tant que {user}", "card.testConnect": "Tester la connexion", "card.testing": "Test en cours…", "card.testOk": "Connecté ({ms} ms) · {host}:{port}", "card.testFailed": "Échec de la connexion : {message}", "card.providerLabel": "Fournisseur", "card.addressLabel": "Adresse e-mail", "card.passwordLabel": "Code d’autorisation / mot de passe d’application", "card.passwordPlaceholder": "Laisser vide pour conserver",
                "oauth.signIn.outlook": "Se connecter avec Microsoft", "oauth.signIn.generic": "Se connecter à {provider}", "oauth.requestingCode": "Demande de code…", "oauth.signingIn": "Connexion…", "oauth.reLogin": "Se reconnecter", "oauth.pendingHint": "Ouvrez l’adresse dans votre navigateur et saisissez le code :", "oauth.loggedInAs": "Connecté : {user}", "oauth.loginOk": "Connecté.", "oauth.loginFailed": "Échec de la connexion",
                "preset.sectionTitle": "Préréglages serveur", "preset.add": "+ Ajouter un préréglage", "preset.empty": "Aucun préréglage personnalisé.", "preset.nameLabel": "Nom du préréglage", "preset.imapHostLabel": "Serveur IMAP", "preset.imapPortLabel": "Port IMAP", "preset.smtpHostLabel": "Serveur SMTP", "preset.smtpPortLabel": "Port SMTP", "preset.imapSsl": "SSL IMAP", "preset.smtpSsl": "SSL SMTP", "preset.yamlParseFailed": "Échec de l’analyse de serverPresets : {error}",
                "whale.title": "Courrier : {count} nouveaux messages", "whale.unknownSender": "(inconnu)", "whale.noSubject": "(sans objet)", "whale.close": "Fermer",
            },
            de: {
                "common.cancel": "Abbrechen", "common.retry": "Erneut versuchen", "common.delete": "Löschen", "common.edit": "Bearbeiten", "common.collapse": "Einklappen", "common.loading": "Wird geladen…",
                "nav.title": "E-Mail (dsh-email)", "section.title": "E-Mail", "section.intro": "Füge ein Postfach hinzu, damit dein Assistent E-Mails lesen, suchen und beantworten kann. Wähle einen Anbieter und gib deine E-Mail-Adresse sowie das App-Passwort ein. Änderungen werden automatisch gespeichert.",
                "global.sendApproval": "Vom Modell gestartete Sendungen bestätigen", "global.downloadDirLabel": "Downloadordner für Anhänge", "status.saved": "Gespeichert", "status.saving": "Wird gespeichert…", "status.draft": "Einige Änderungen sind noch nicht gespeichert.", "status.saveFailed": "Speichern fehlgeschlagen: {message}",
                "card.add": "+ Konto hinzufügen", "card.empty": "Noch keine Konten vorhanden.", "card.defaultBadge": "Standard", "card.defaultAccount": "Standardkonto", "card.setDefault": "Als Standard festlegen", "card.incomplete": "Unvollständig", "card.notLoggedIn": "Nicht angemeldet", "card.loggedInAs": "Angemeldet als {user}", "card.testConnect": "Verbindung testen", "card.testing": "Wird getestet…", "card.testOk": "Verbunden ({ms} ms) · {host}:{port}", "card.testFailed": "Verbindung fehlgeschlagen: {message}", "card.providerLabel": "Anbieter", "card.addressLabel": "E-Mail-Adresse", "card.passwordLabel": "Autorisierungscode / App-Passwort", "card.passwordPlaceholder": "Leer lassen, um es zu behalten",
                "oauth.signIn.outlook": "Mit Microsoft anmelden", "oauth.signIn.generic": "Bei {provider} anmelden", "oauth.requestingCode": "Code wird angefordert…", "oauth.signingIn": "Anmeldung…", "oauth.reLogin": "Erneut anmelden", "oauth.pendingHint": "Öffne die Adresse im Browser und gib den Code ein:", "oauth.loggedInAs": "Angemeldet: {user}", "oauth.loginOk": "Angemeldet.", "oauth.loginFailed": "Anmeldung fehlgeschlagen",
                "preset.sectionTitle": "Servervoreinstellungen", "preset.add": "+ Voreinstellung hinzufügen", "preset.empty": "Noch keine benutzerdefinierten Servervoreinstellungen.", "preset.nameLabel": "Name der Voreinstellung", "preset.imapHostLabel": "IMAP-Server", "preset.imapPortLabel": "IMAP-Port", "preset.smtpHostLabel": "SMTP-Server", "preset.smtpPortLabel": "SMTP-Port", "preset.imapSsl": "IMAP-SSL", "preset.smtpSsl": "SMTP-SSL", "preset.yamlParseFailed": "serverPresets konnte nicht gelesen werden: {error}",
                "whale.title": "Briefdienst: {count} neue Nachrichten", "whale.unknownSender": "(unbekannt)", "whale.noSubject": "(kein Betreff)", "whale.close": "Schließen",
            },
            ja: {
                "common.cancel": "キャンセル", "common.retry": "再試行", "common.delete": "削除", "common.edit": "編集", "common.collapse": "折りたたむ", "common.loading": "読み込み中…",
                "nav.title": "メール (dsh-email)", "section.title": "メール", "section.intro": "メールボックスを追加すると、アシスタントがメールの読み取り、検索、返信を行えます。プロバイダーを選び、メールアドレスとアプリパスワードを入力してください。変更は自動保存されます。",
                "global.sendApproval": "モデルによる送信を確認する", "global.downloadDirLabel": "添付ファイルのダウンロード先", "status.saved": "保存済み", "status.saving": "保存中…", "status.draft": "未保存の変更があります。", "status.saveFailed": "保存に失敗しました: {message}",
                "card.add": "+ アカウントを追加", "card.empty": "アカウントはまだありません。", "card.defaultBadge": "既定", "card.defaultAccount": "既定のアカウント", "card.setDefault": "既定に設定", "card.incomplete": "未完了", "card.notLoggedIn": "未ログイン", "card.loggedInAs": "{user} としてログイン中", "card.testConnect": "接続をテスト", "card.testing": "テスト中…", "card.testOk": "接続済み ({ms} ms) · {host}:{port}", "card.testFailed": "接続に失敗しました: {message}", "card.providerLabel": "プロバイダー", "card.addressLabel": "メールアドレス", "card.passwordLabel": "認証コード / アプリパスワード", "card.passwordPlaceholder": "保持する場合は空欄",
                "oauth.signIn.outlook": "Microsoft でログイン", "oauth.signIn.generic": "{provider} にログイン", "oauth.requestingCode": "コードを取得中…", "oauth.signingIn": "ログイン中…", "oauth.reLogin": "再ログイン", "oauth.pendingHint": "ブラウザーでアドレスを開き、コードを入力してください:", "oauth.loggedInAs": "ログイン済み: {user}", "oauth.loginOk": "ログインしました。", "oauth.loginFailed": "ログインに失敗しました",
                "preset.sectionTitle": "サーバープリセット", "preset.add": "+ プリセットを追加", "preset.empty": "カスタムプリセットはまだありません。", "preset.nameLabel": "プリセット名", "preset.imapHostLabel": "IMAP ホスト", "preset.imapPortLabel": "IMAP ポート", "preset.smtpHostLabel": "SMTP ホスト", "preset.smtpPortLabel": "SMTP ポート", "preset.imapSsl": "IMAP SSL", "preset.smtpSsl": "SMTP SSL", "preset.yamlParseFailed": "serverPresets の解析に失敗しました: {error}",
                "whale.title": "メール便: 新着 {count} 件", "whale.unknownSender": "(不明)", "whale.noSubject": "(件名なし)", "whale.close": "閉じる",
            },
            pt: {
                "common.cancel": "Cancelar", "common.retry": "Tentar novamente", "common.delete": "Excluir", "common.edit": "Editar", "common.collapse": "Recolher", "common.loading": "Carregando…",
                "nav.title": "E-mail (dsh-email)", "section.title": "E-mail", "section.intro": "Adicione uma caixa de correio para que o assistente possa ler, pesquisar e responder mensagens. Escolha um provedor e informe seu endereço e senha de aplicativo. As alterações são salvas automaticamente.",
                "global.sendApproval": "Confirmar envios iniciados pelo modelo", "global.downloadDirLabel": "Pasta de download de anexos", "status.saved": "Salvo", "status.saving": "Salvando…", "status.draft": "Há alterações não salvas.", "status.saveFailed": "Falha ao salvar: {message}",
                "card.add": "+ Adicionar conta", "card.empty": "Ainda não há contas.", "card.defaultBadge": "Padrão", "card.defaultAccount": "Conta padrão", "card.setDefault": "Definir como padrão", "card.incomplete": "Incompleta", "card.notLoggedIn": "Não conectado", "card.loggedInAs": "Conectado como {user}", "card.testConnect": "Testar conexão", "card.testing": "Testando…", "card.testOk": "Conectado ({ms} ms) · {host}:{port}", "card.testFailed": "Falha na conexão: {message}", "card.providerLabel": "Provedor", "card.addressLabel": "Endereço de e-mail", "card.passwordLabel": "Código de autorização / senha de aplicativo", "card.passwordPlaceholder": "Deixe vazio para manter",
                "oauth.signIn.outlook": "Entrar com a Microsoft", "oauth.signIn.generic": "Entrar em {provider}", "oauth.requestingCode": "Solicitando código…", "oauth.signingIn": "Entrando…", "oauth.reLogin": "Entrar novamente", "oauth.pendingHint": "Abra o endereço no navegador e informe o código:", "oauth.loggedInAs": "Conectado: {user}", "oauth.loginOk": "Conectado.", "oauth.loginFailed": "Falha ao entrar",
                "preset.sectionTitle": "Predefinições de servidor", "preset.add": "+ Adicionar predefinição", "preset.empty": "Ainda não há predefinições personalizadas.", "preset.nameLabel": "Nome da predefinição", "preset.imapHostLabel": "Servidor IMAP", "preset.imapPortLabel": "Porta IMAP", "preset.smtpHostLabel": "Servidor SMTP", "preset.smtpPortLabel": "Porta SMTP", "preset.imapSsl": "SSL do IMAP", "preset.smtpSsl": "SSL do SMTP", "preset.yamlParseFailed": "Falha ao analisar serverPresets: {error}",
                "whale.title": "Correio: {count} novas mensagens", "whale.unknownSender": "(desconhecido)", "whale.noSubject": "(sem assunto)", "whale.close": "Fechar",
            },
            ru: {
                "common.cancel": "Отмена", "common.retry": "Повторить", "common.delete": "Удалить", "common.edit": "Изменить", "common.collapse": "Свернуть", "common.loading": "Загрузка…",
                "nav.title": "Почта (dsh-email)", "section.title": "Почта", "section.intro": "Добавьте почтовый ящик, чтобы помощник мог читать, искать и отвечать на письма. Выберите провайдера и укажите адрес и пароль приложения. Изменения сохраняются автоматически.",
                "global.sendApproval": "Подтверждать отправку по запросу модели", "global.downloadDirLabel": "Папка загрузки вложений", "status.saved": "Сохранено", "status.saving": "Сохранение…", "status.draft": "Есть несохранённые изменения.", "status.saveFailed": "Не удалось сохранить: {message}",
                "card.add": "+ Добавить аккаунт", "card.empty": "Аккаунтов пока нет.", "card.defaultBadge": "По умолчанию", "card.defaultAccount": "Аккаунт по умолчанию", "card.setDefault": "Сделать основным", "card.incomplete": "Не заполнено", "card.notLoggedIn": "Не выполнен вход", "card.loggedInAs": "Выполнен вход: {user}", "card.testConnect": "Проверить соединение", "card.testing": "Проверка…", "card.testOk": "Подключено ({ms} мс) · {host}:{port}", "card.testFailed": "Ошибка соединения: {message}", "card.providerLabel": "Провайдер", "card.addressLabel": "Адрес электронной почты", "card.passwordLabel": "Код авторизации / пароль приложения", "card.passwordPlaceholder": "Оставьте пустым, чтобы сохранить",
                "oauth.signIn.outlook": "Войти через Microsoft", "oauth.signIn.generic": "Войти в {provider}", "oauth.requestingCode": "Запрос кода…", "oauth.signingIn": "Выполняется вход…", "oauth.reLogin": "Войти снова", "oauth.pendingHint": "Откройте адрес в браузере и введите код:", "oauth.loggedInAs": "Выполнен вход: {user}", "oauth.loginOk": "Вход выполнен.", "oauth.loginFailed": "Не удалось войти",
                "preset.sectionTitle": "Предустановки сервера", "preset.add": "+ Добавить предустановку", "preset.empty": "Пользовательских предустановок пока нет.", "preset.nameLabel": "Название предустановки", "preset.imapHostLabel": "Сервер IMAP", "preset.imapPortLabel": "Порт IMAP", "preset.smtpHostLabel": "Сервер SMTP", "preset.smtpPortLabel": "Порт SMTP", "preset.imapSsl": "SSL IMAP", "preset.smtpSsl": "SSL SMTP", "preset.yamlParseFailed": "Не удалось разобрать serverPresets: {error}",
                "whale.title": "Почтовый курьер: новых сообщений — {count}", "whale.unknownSender": "(неизвестно)", "whale.noSubject": "(без темы)", "whale.close": "Закрыть",
            },
        };
        // The 104 keys the first-pass override tables did not cover, reviewed per
        // language. Splitting them out keeps the visible-control translations above
        // readable while guaranteeing no supported locale falls back to English.
        // Placeholders and the leading/trailing spaces that join concatenated
        // fragments are preserved exactly as in UI.en.
        const UI_LOCALE_COMPLETION = {
            es: {
                // common
                "common.confirmDelete": "Confirmar eliminación",
                "common.listSeparator": ", ",
                // section
                "section.readonly": "La configuración es de solo lectura: puedes consultarla, pero no guardar cambios.",
                "section.activeAccounts": "Cuentas activas: {accounts}",
                // provider
                "provider.qq": "QQ Mail",
                "provider.163": "163 Mail",
                "provider.126": "126 Mail",
                "provider.sina": "Sina Mail",
                "provider.aliyun": "Alibaba Mail",
                "provider.gmail": "Gmail",
                "provider.exmail": "Tencent Enterprise / WeCom Mail",
                "provider.outlook": "Outlook",
                "provider.icloud": "iCloud",
                "provider.custom": "Personalizado",
                "provider.noneInYaml": "Elige tu proveedor de correo",
                "provider.undefinedPresetSuffix": "(ajuste no definido)",
                // global
                "global.sendApprovalRisk": "Si se desactiva, los envíos, respuestas y reenvíos iniciados por el modelo omiten la confirmación del complemento en todas las cuentas, incluso para destinatarios no incluidos en la lista de confianza. Las reglas de destinatarios bloqueados y los permisos del host siguen aplicándose. Los borradores aún requieren confirmación manual para enviar.",
                "global.downloadDirPlaceholder": "Déjalo vacío para usar el valor predeterminado",
                "global.hint": "Estos ajustes se aplican a todas las cuentas. En Full Access no se mostrarán diálogos para los envíos desde herramientas que aún requieran confirmación del complemento; usa la pestaña Borradores para revisar y confirmar manualmente. Las reglas de destinatarios bloqueados siempre se aplican.",
                // card
                "card.unnamed": "(sin nombre)",
                "card.noAddress": "(sin dirección de correo)",
                "card.meta": "{address} · {folder} · {provider}",
                "card.noProvider": "Sin proveedor",
                "card.setDefaultAs": "Establecer como predeterminada: {name}",
                "card.renamedBadge": "Renombrada → se guardará con el nombre nuevo",
                "card.testMissingAddress": "Introduce la dirección de correo de esta cuenta antes de probar la conexión.",
                "card.pickDefault": "Hay varias cuentas configuradas; elige la cuenta predeterminada:",
                "card.errNoName": "Hay una cuenta sin nombre; no se guardarán estos cambios.",
                "card.errNoProvider": "Hay una cuenta sin proveedor seleccionado; no se guardarán estos cambios.",
                "card.errDuplicateName": "Ya existe otra cuenta con ese nombre; renombrarla la sobrescribiría, así que no se guardarán estos cambios.",
                "card.errReservedName": "Una cuenta no puede llamarse defaultAccount (esa clave está reservada para la cuenta predeterminada); no se guardarán estos cambios.",
                "card.errNoDefault": "Hay varias cuentas y no se eligió una predeterminada; no se guardarán estos cambios.",
                "card.yamlParseFailed": "No se pudo analizar accountsYaml: {error}",
                "card.confirmDelete": "Al eliminar la cuenta «{name}», también se borrarán sus datos de inicio de sesión guardados. Los mensajes del buzón no se eliminarán.",
                "card.nameLabel": "Nombre de la cuenta",
                "card.nameHint": "Usa un nombre como «Trabajo» para distinguir tus buzones. Al cambiar el nombre se conservan los ajustes existentes; defaultAccount está reservado.",
                "card.reservedNameWarn": "defaultAccount es una clave reservada (indica la cuenta predeterminada); elige otro nombre.",
                "card.authKindLabel": "Autenticación",
                "card.authKindAuto": "Automática (según el proveedor)",
                "card.authKindOAuth2": "Inicio de sesión OAuth2 con código de dispositivo",
                "card.authKindPassword": "Contraseña / contraseña de aplicación",
                "card.authKindHint": "El proveedor determina el método de forma predeterminada. Elige «Contraseña / contraseña de aplicación» para un tenant que aún acepte autenticación básica con Exchange Online (híbrido o local, con SMTP AUTH habilitado); vuelve a probar la conexión después de cambiarlo.",
                "card.passwordSaved": "Ya hay una contraseña guardada: déjalo vacío para conservarla o borra el campo y escribe otra para sustituirla.",
                "card.passwordHint": "Introduce el código de autorización o la contraseña de aplicación proporcionados por tu proveedor de correo y haz clic en «Probar conexión».",
                "card.senderNameLabel": "Nombre del remitente (opcional)",
                "card.senderNamePlaceholder": "Solo el nombre que ven los destinatarios",
                "card.senderNameHint": "Solo cambia el nombre que ven los destinatarios; la dirección sigue siendo la indicada arriba.",
                "card.authUserLabel": "Usuario de inicio de sesión (si es distinto de la dirección)",
                "card.authUserPlaceholder": "Vacío = iniciar sesión con la dirección anterior",
                "card.authUserHint": "Alias o retransmisión: arriba va la dirección desde la que se envía el correo; aquí, la cuenta usada para autenticarse en IMAP/SMTP. Si se deja vacío, ambas son iguales.",
                "card.authPasswordLabel": "Contraseña del usuario de inicio de sesión (opcional)",
                "card.authPasswordSaved": "Hay una contraseña de inicio de sesión guardada: déjala vacía para conservarla o escribe otra para sustituirla.",
                "card.authPasswordHint": "Déjalo vacío para reutilizar el código de autorización o la contraseña de aplicación de arriba; solo hace falta si el usuario de inicio de sesión tiene una contraseña propia.",
                "card.inboxLabel": "Carpeta de entrada (predeterminada: INBOX)",
                "card.autoSaveHint": " Los cambios se guardan automáticamente.",
                "card.autoSaveHintNoDefault": " Hay varias cuentas, pero aún no hay una predeterminada; primero debes elegir una.",
                "card.builtinEndpoints": " · {imap} | {smtp}",
                "card.customEndpoint": " · {endpoint}",
                "provider.customServer": "Servidor personalizado (introducir datos)",
                "card.customServerHint": "Para un servidor de correo interno o propio: introduce el servidor de entrada. El de salida usará el mismo si se deja vacío. Los puertos vacíos usan los valores predeterminados (IMAP 993 / SMTP 465).",
                "card.imapServerLabel": "Servidor IMAP de entrada",
                "card.smtpServerLabel": "Servidor SMTP de salida (vacío = servidor de entrada)",
                "card.portLabel": "Puerto",
                "card.tlsLabel": "SSL / TLS",
                "card.errNoCustomHost": "La cuenta de servidor personalizado aún no tiene servidor de entrada; este cambio no se guarda.",
                "preset.errReservedName": "El preajuste no puede llamarse «{name}»: ese valor está reservado para la opción de servidor personalizado. Elige otro nombre.",
                // oauth
                "oauth.clientIdLabel": "ID de aplicación (cliente)",
                "oauth.clientIdPlaceholder": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
                "oauth.clientIdHint": "Déjalo vacío para iniciar sesión con la aplicación comunitaria integrada del complemento (gratuita y lista para usar): la pantalla de consentimiento de Microsoft mostrará el nombre de la aplicación del colaborador y los registros de inicio de sesión aparecerán en su tenant. Para usar tu propio ID de cliente público de Azure (Entra), con permisos delegados IMAP/SMTP y el flujo de código de dispositivo habilitado, pégalo aquí; cambiarlo requiere iniciar sesión de nuevo.",
                "oauth.clientIdMissing": "Esta compilación no incluye un ID de aplicación (cliente), por lo que no se puede iniciar el acceso con código de dispositivo. Registra uno según la sección «Outlook OAuth2» del README y pégalo aquí.",
                "oauth.clientIdBuiltIn": "Se iniciará sesión con la aplicación comunitaria integrada del complemento: {id} (registrada por el colaborador gurio-wine y autorizada para el uso integrado en este proyecto). Si las políticas de la empresa no permiten aplicaciones de terceros, usa la tuya.",
                "oauth.passwordless": "Este proveedor usa autorización OAuth2, por lo que no se necesita contraseña{label}.",
                "oauth.passwordlessLabel": " ({label})",
                "oauth.noUrl": "(el servidor no devolvió una URL de autorización; cancela y vuelve a intentarlo)",
                "oauth.polling": "Esperando… (se comprueba cada {seconds} segundos; el enlace de autorización es válido durante unos {minutes} minutos)",
                "oauth.unknownUser": "(cuenta desconocida)",
                "oauth.loginOkAs": "Sesión iniciada: {user}",
                "oauth.badResponse": "El servidor devolvió una respuesta que no se reconoce",
                // preset
                "preset.cleared": "Tarjetas borradas: completa los campos restantes para volver a guardarlas; se eliminarán los {count} preajustes.",
                "preset.badgeUnnamed": "Sin nombre",
                "preset.badgeRenamed": "Renombrado → se elimina la clave antigua y se crea una nueva",
                "preset.badgeDuplicate": "Duplicado",
                "preset.noHost": "(sin host)",
                "preset.endpointMissing": "Falta el endpoint",
                "preset.metaImap": "imap {host}:{port}",
                "preset.metaSmtp": " | smtp {host}:{port}",
                "preset.ssl": " · SSL",
                "preset.plain": " · sin cifrar",
                "preset.confirmDelete": "Al eliminar el preajuste «{name}», las cuentas que lo usan se quedarán sin endpoints (y dejará de aparecer en el selector de proveedores).",
                "preset.nameHint": "No puede coincidir con un proveedor integrado (qq/163/126/sina/aliyun/gmail/outlook/icloud), ya que el preajuste integrado lo ocultaría. Al cambiar el nombre se elimina la clave antigua y se crea una nueva.",
                "preset.duplicateWarn": "Ya existe un preajuste con este nombre: los nombres son claves YAML y deben ser únicos.",
                "preset.labelLabel": "Etiqueta visible (clave label, opcional)",
                "preset.labelPlaceholder": "Correo de trabajo",
                "preset.imapPortHint": "Déjalo vacío para usar el valor predeterminado 993.",
                "preset.smtpPortHint": "Déjalo vacío para usar el valor predeterminado 465.",
                "preset.portProblem": "{problem}.",
                "preset.yamlParseFailedHint": "Las tarjetas se crearon a partir de la tabla de preajustes (vacía) de la instantánea, no de este texto. Edita el YAML de abajo para escribir uno nuevo desde cero.",
                "preset.footerHint": "Un preajuste no contiene dirección de correo ni contraseña, solo parámetros de conexión; una cuenta guarda únicamente el nombre del proveedor y expande sus endpoints desde el preajuste al conectarse.",
                "preset.portNumeric": "El puerto debe ser un número",
                "preset.portRange": "El puerto debe estar entre 1 y 65535",
                "preset.errNoName": "Hay un preajuste sin nombre (el nombre es la clave YAML).",
                "preset.errDuplicate": "Dos tarjetas tienen el nombre «{name}»: los nombres son claves YAML y deben ser únicos.",
                "preset.errNoImapHost": "El preajuste «{name}» aún no tiene host IMAP.",
                "preset.errNoSmtpHost": "El preajuste «{name}» aún no tiene host SMTP.",
                "preset.errImapPort": "El preajuste «{name}» tiene un puerto IMAP no válido: {problem}.",
                "preset.errSmtpPort": "El preajuste «{name}» tiene un puerto SMTP no válido: {problem}.",
                // notice
                "notice.commentsDropped": "Se han eliminado los comentarios: el documento original no se puede editar in situ. ",
                "notice.passwordsDropped": "No se han podido conservar algunas contraseñas guardadas; vuelve a introducirlas en las tarjetas correspondientes. ",
                "notice.restSaved": "Todo lo demás se ha guardado automáticamente.",
                "notice.cardsNotWritten": "No se pudieron escribir los cambios de las cuentas en YAML: {message}",
                // whale
                "whale.row": "{who} · {subject}",
                "whale.more": "…y {count} más; usa email_watch / email_read para verlos",
            },
            fr: {
                // common
                "common.confirmDelete": "Confirmer la suppression",
                "common.listSeparator": ", ",
                // section
                "section.readonly": "Le stockage des paramètres est en lecture seule : vous pouvez les consulter, mais pas les enregistrer.",
                "section.activeAccounts": "Comptes actifs : {accounts}",
                // provider
                "provider.qq": "QQ Mail",
                "provider.163": "163 Mail",
                "provider.126": "126 Mail",
                "provider.sina": "Sina Mail",
                "provider.aliyun": "Alibaba Mail",
                "provider.gmail": "Gmail",
                "provider.exmail": "Tencent Enterprise / WeCom Mail",
                "provider.outlook": "Outlook",
                "provider.icloud": "iCloud",
                "provider.custom": "Personnalisé",
                "provider.noneInYaml": "Choisissez votre fournisseur de messagerie",
                "provider.undefinedPresetSuffix": "(préréglage non défini)",
                // global
                "global.sendApprovalRisk": "Si cette option est désactivée, les envois, réponses et transferts lancés par le modèle ne demandent plus la confirmation de ce module pour aucun compte, y compris pour les destinataires hors liste de confiance. Les règles de blocage des destinataires et les autorisations de l’hôte restent appliquées. L’envoi des brouillons nécessite toujours une confirmation manuelle.",
                "global.downloadDirPlaceholder": "Laissez vide pour utiliser la valeur par défaut",
                "global.hint": "Ces paramètres s’appliquent à tous les comptes. Sous Full Access, les envois depuis les outils qui nécessitent encore la confirmation du module ne peuvent pas afficher de boîte de dialogue ; utilisez l’onglet Brouillons pour vérifier et confirmer manuellement. Les règles de blocage des destinataires s’appliquent toujours.",
                // card
                "card.unnamed": "(sans nom)",
                "card.noAddress": "(aucune adresse e-mail)",
                "card.meta": "{address} · {folder} · {provider}",
                "card.noProvider": "Aucun fournisseur",
                "card.setDefaultAs": "Définir comme compte par défaut : {name}",
                "card.renamedBadge": "Renommé → sera enregistré sous le nouveau nom",
                "card.testMissingAddress": "Saisissez l’adresse e-mail de ce compte avant de tester la connexion.",
                "card.pickDefault": "Plusieurs comptes sont configurés ; choisissez le compte par défaut :",
                "card.errNoName": "Un compte n’a pas encore de nom ; cette modification ne sera pas enregistrée.",
                "card.errNoProvider": "Aucun fournisseur n’est sélectionné pour un compte ; cette modification ne sera pas enregistrée.",
                "card.errDuplicateName": "Un autre compte porte déjà ce nom ; le renommage l’écraserait, cette modification ne sera donc pas enregistrée.",
                "card.errReservedName": "Un compte ne peut pas s’appeler defaultAccount (cette clé est réservée au compte par défaut) ; cette modification ne sera pas enregistrée.",
                "card.errNoDefault": "Plusieurs comptes existent, mais aucun compte par défaut n’a été choisi ; cette modification ne sera pas enregistrée.",
                "card.yamlParseFailed": "Échec de l’analyse de accountsYaml : {error}",
                "card.confirmDelete": "La suppression du compte « {name} » supprime également ses identifiants enregistrés. Les messages de la boîte aux lettres ne sont pas supprimés.",
                "card.nameLabel": "Nom du compte",
                "card.nameHint": "Utilisez un nom comme « Travail » pour distinguer vos boîtes aux lettres. Le renommage conserve les paramètres existants ; defaultAccount est réservé.",
                "card.reservedNameWarn": "defaultAccount est une clé réservée (elle désigne le compte par défaut) ; choisissez un autre nom.",
                "card.authKindLabel": "Authentification",
                "card.authKindAuto": "Automatique (déterminée par le fournisseur)",
                "card.authKindOAuth2": "Connexion OAuth2 par code d’appareil",
                "card.authKindPassword": "Mot de passe / mot de passe d’application",
                "card.authKindHint": "Le fournisseur détermine le mode par défaut. Choisissez « Mot de passe / mot de passe d’application » pour un tenant qui accepte encore l’authentification de base avec Exchange Online (hybride ou local, avec SMTP AUTH activé) ; testez à nouveau la connexion après modification.",
                "card.passwordSaved": "Un mot de passe est déjà enregistré : laissez le champ vide pour le conserver, ou effacez-le puis saisissez-en un autre pour le remplacer.",
                "card.passwordHint": "Saisissez le code d’autorisation ou le mot de passe d’application fourni par votre fournisseur de messagerie, puis cliquez sur « Tester la connexion ».",
                "card.senderNameLabel": "Nom d’expéditeur (facultatif)",
                "card.senderNamePlaceholder": "Uniquement le nom visible par les destinataires",
                "card.senderNameHint": "Seul le nom visible par les destinataires change ; l’adresse reste celle indiquée ci-dessus.",
                "card.authUserLabel": "Identifiant de connexion (s’il diffère de l’adresse)",
                "card.authUserPlaceholder": "Vide = connexion avec l’adresse ci-dessus",
                "card.authUserHint": "Alias ou relais : indiquez ci-dessus l’adresse d’envoi, et ici le compte utilisé pour s’authentifier auprès d’IMAP/SMTP. Si ce champ est vide, les deux sont identiques.",
                "card.authPasswordLabel": "Mot de passe de l’identifiant de connexion (facultatif)",
                "card.authPasswordSaved": "Un mot de passe de connexion est enregistré : laissez le champ vide pour le conserver, ou saisissez-en un autre pour le remplacer.",
                "card.authPasswordHint": "Laissez vide pour réutiliser le code d’autorisation ou le mot de passe d’application ci-dessus ; ce champ n’est nécessaire que si l’identifiant de connexion possède son propre mot de passe.",
                "card.inboxLabel": "Dossier de réception (par défaut : INBOX)",
                "card.autoSaveHint": " Les changements sont enregistrés automatiquement.",
                "card.autoSaveHintNoDefault": " Plusieurs comptes sont configurés, mais aucun n’est défini par défaut ; vous devez d’abord en choisir un.",
                "card.builtinEndpoints": " · {imap} | {smtp}",
                "card.customEndpoint": " · {endpoint}",
                "provider.customServer": "Serveur personnalisé (saisie manuelle)",
                "card.customServerHint": "Pour un serveur de messagerie interne ou auto-hébergé : saisissez le serveur d’entrée. Le serveur de sortie reprend celui d’entrée s’il est laissé vide. Les ports vides utilisent les valeurs par défaut (IMAP 993 / SMTP 465).",
                "card.imapServerLabel": "Serveur IMAP d’entrée",
                "card.smtpServerLabel": "Serveur SMTP de sortie (vide = serveur d’entrée)",
                "card.portLabel": "Port",
                "card.tlsLabel": "SSL / TLS",
                "card.errNoCustomHost": "Le compte à serveur personnalisé n’a pas encore de serveur d’entrée ; cette modification n’est pas enregistrée.",
                "preset.errReservedName": "Un préréglage ne peut pas s’appeler « {name} » : cette valeur est réservée à l’option de serveur personnalisé. Choisissez un autre nom.",
                // oauth
                "oauth.clientIdLabel": "ID d’application (client)",
                "oauth.clientIdPlaceholder": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
                "oauth.clientIdHint": "Laissez ce champ vide pour utiliser l’application communautaire intégrée au module (gratuite, sans configuration) : l’écran de consentement Microsoft affiche le nom de l’application du contributeur et les journaux de connexion sont associés à son tenant. Pour utiliser votre propre ID client public Azure (Entra), avec les autorisations déléguées IMAP/SMTP et le flux de code d’appareil activés, collez-le ici ; toute modification nécessite une nouvelle connexion.",
                "oauth.clientIdMissing": "Cette version ne contient aucun ID d’application (client) intégré ; la connexion par code d’appareil ne peut donc pas démarrer. Enregistrez-en un comme indiqué dans la section « Outlook OAuth2 » du README, puis collez-le ici.",
                "oauth.clientIdBuiltIn": "Connexion via l’application communautaire intégrée au module : {id} (enregistrée par le contributeur gurio-wine, qui a autorisé son intégration à ce projet). Si les règles de votre entreprise interdisent les applications tierces, utilisez la vôtre.",
                "oauth.passwordless": "Ce fournisseur utilise l’autorisation OAuth2 ; aucun mot de passe n’est donc nécessaire{label}.",
                "oauth.passwordlessLabel": " ({label})",
                "oauth.noUrl": "(le serveur n’a renvoyé aucune URL d’autorisation ; annulez et réessayez)",
                "oauth.polling": "En attente… (vérification toutes les {seconds} secondes ; le lien d’autorisation reste valable environ {minutes} minutes)",
                "oauth.unknownUser": "(compte inconnu)",
                "oauth.loginOkAs": "Connecté : {user}",
                "oauth.badResponse": "Le serveur a renvoyé une réponse non reconnue",
                // preset
                "preset.cleared": "Cartes effacées : complétez les champs restants pour les réenregistrer ; les {count} préréglages seront supprimés.",
                "preset.badgeUnnamed": "Sans nom",
                "preset.badgeRenamed": "Renommé → ancienne clé supprimée, nouvelle créée",
                "preset.badgeDuplicate": "Doublon",
                "preset.noHost": "(aucun hôte)",
                "preset.endpointMissing": "Point de terminaison manquant",
                "preset.metaImap": "imap {host}:{port}",
                "preset.metaSmtp": " | smtp {host}:{port}",
                "preset.ssl": " · SSL",
                "preset.plain": " · non chiffré",
                "preset.confirmDelete": "La suppression du préréglage « {name} » laissera les comptes qui l’utilisent sans points de terminaison (et il ne sera plus proposé dans la liste des fournisseurs).",
                "preset.nameHint": "Ne peut pas être identique à un fournisseur intégré (qq/163/126/sina/aliyun/gmail/outlook/icloud) : le préréglage intégré le masquerait. Le renommage supprime l’ancienne clé et en crée une nouvelle.",
                "preset.duplicateWarn": "Un préréglage portant ce nom existe déjà : les noms sont des clés YAML et doivent être uniques.",
                "preset.labelLabel": "Libellé affiché (clé label, facultatif)",
                "preset.labelPlaceholder": "E-mail professionnel",
                "preset.imapPortHint": "Laissez vide pour utiliser la valeur par défaut 993.",
                "preset.smtpPortHint": "Laissez vide pour utiliser la valeur par défaut 465.",
                "preset.portProblem": "{problem}.",
                "preset.yamlParseFailedHint": "Les cartes ci-dessous ont été créées à partir de la table des préréglages (vide) de l’instantané, et non de ce texte. Modifiez le YAML ci-dessous pour en créer un nouveau depuis zéro.",
                "preset.footerHint": "Un préréglage ne contient ni adresse e-mail ni mot de passe, uniquement des paramètres de connexion ; un compte ne conserve que le nom du fournisseur et développe ses points de terminaison depuis le préréglage lors de la connexion.",
                "preset.portNumeric": "Le port doit être un nombre",
                "preset.portRange": "Le port doit être compris entre 1 et 65535",
                "preset.errNoName": "Un préréglage n’a pas encore de nom (le nom est la clé YAML).",
                "preset.errDuplicate": "Deux cartes portent le nom « {name} » : les noms sont des clés YAML et doivent être uniques.",
                "preset.errNoImapHost": "Le préréglage « {name} » n’a pas encore d’hôte IMAP.",
                "preset.errNoSmtpHost": "Le préréglage « {name} » n’a pas encore d’hôte SMTP.",
                "preset.errImapPort": "Le préréglage « {name} » possède un port IMAP non valide : {problem}.",
                "preset.errSmtpPort": "Le préréglage « {name} » possède un port SMTP non valide : {problem}.",
                // notice
                "notice.commentsDropped": "Commentaires supprimés : le document d’origine ne peut pas être modifié sur place. ",
                "notice.passwordsDropped": "Certains mots de passe enregistrés n’ont pas pu être conservés ; saisissez-les à nouveau dans les cartes correspondantes. ",
                "notice.restSaved": "Tout le reste a été enregistré automatiquement.",
                "notice.cardsNotWritten": "Les modifications des comptes n’ont pas pu être écrites dans le YAML : {message}",
                // whale
                "whale.row": "{who} · {subject}",
                "whale.more": "…et {count} autres ; utilisez email_watch / email_read pour les consulter",
            },
            de: {
                // common
                "common.confirmDelete": "Löschen bestätigen",
                "common.listSeparator": ", ",
                // section
                "section.readonly": "Der Einstellungsspeicher ist schreibgeschützt: Einstellungen können angezeigt, aber nicht gespeichert werden.",
                "section.activeAccounts": "Aktive Konten: {accounts}",
                // provider
                "provider.qq": "QQ Mail",
                "provider.163": "163 Mail",
                "provider.126": "126 Mail",
                "provider.sina": "Sina Mail",
                "provider.aliyun": "Alibaba Mail",
                "provider.gmail": "Gmail",
                "provider.exmail": "Tencent Enterprise / WeCom Mail",
                "provider.outlook": "Outlook",
                "provider.icloud": "iCloud",
                "provider.custom": "Benutzerdefiniert",
                "provider.noneInYaml": "E-Mail-Anbieter auswählen",
                "provider.undefinedPresetSuffix": "(nicht definierte Voreinstellung)",
                // global
                "global.sendApprovalRisk": "Ist diese Option deaktiviert, überspringen vom Modell gestartete Sendungen, Antworten und Weiterleitungen in allen Konten die Bestätigung dieses Plugins, auch bei Empfängern außerhalb der Vertrauensliste. Regeln für gesperrte Empfänger und Host-Berechtigungen gelten weiterhin. Entwürfe müssen weiterhin manuell zum Senden bestätigt werden.",
                "global.downloadDirPlaceholder": "Leer lassen, um den Standard zu verwenden",
                "global.hint": "Diese Einstellungen gelten für alle Konten. Unter Full Access können Werkzeug-Sendungen, für die weiterhin eine Plugin-Bestätigung erforderlich ist, keinen Dialog anzeigen. Prüfen und bestätigen Sie sie manuell im Tab „Entwürfe“. Regeln für gesperrte Empfänger gelten immer.",
                // card
                "card.unnamed": "(unbenannt)",
                "card.noAddress": "(keine E-Mail-Adresse)",
                "card.meta": "{address} · {folder} · {provider}",
                "card.noProvider": "Kein Anbieter",
                "card.setDefaultAs": "Als Standard festlegen: {name}",
                "card.renamedBadge": "Umbenannt → wird unter dem neuen Namen gespeichert",
                "card.testMissingAddress": "Geben Sie vor dem Verbindungstest die E-Mail-Adresse dieses Kontos ein.",
                "card.pickDefault": "Mehrere Konten sind eingerichtet. Wählen Sie das Standardkonto aus:",
                "card.errNoName": "Ein Konto hat noch keinen Namen. Diese Änderung wird nicht gespeichert.",
                "card.errNoProvider": "Für ein Konto ist kein Anbieter ausgewählt. Diese Änderung wird nicht gespeichert.",
                "card.errDuplicateName": "Ein anderes Konto hat bereits diesen Namen. Beim Umbenennen würde es überschrieben; diese Änderung wird daher nicht gespeichert.",
                "card.errReservedName": "Ein Konto darf nicht defaultAccount heißen (dieser Schlüssel ist für das Standardkonto reserviert). Diese Änderung wird nicht gespeichert.",
                "card.errNoDefault": "Es gibt mehrere Konten, aber kein Standardkonto. Diese Änderung wird nicht gespeichert.",
                "card.yamlParseFailed": "accountsYaml konnte nicht gelesen werden: {error}",
                "card.confirmDelete": "Beim Löschen des Kontos „{name}“ werden auch die gespeicherten Anmeldedaten entfernt. Nachrichten im Postfach werden nicht gelöscht.",
                "card.nameLabel": "Kontoname",
                "card.nameHint": "Verwenden Sie einen Namen wie „Arbeit“, um Ihre Postfächer zu unterscheiden. Beim Umbenennen bleiben die Einstellungen erhalten; defaultAccount ist reserviert.",
                "card.reservedNameWarn": "defaultAccount ist ein reservierter Schlüssel (für das Standardkonto). Wählen Sie einen anderen Namen.",
                "card.authKindLabel": "Authentifizierung",
                "card.authKindAuto": "Automatisch (vom Anbieter festgelegt)",
                "card.authKindOAuth2": "OAuth2-Anmeldung mit Gerätecode",
                "card.authKindPassword": "Passwort / App-Passwort",
                "card.authKindHint": "Standardmäßig legt der Anbieter die Methode fest. Wählen Sie „Passwort / App-Passwort“ für einen Mandanten, der bei Exchange Online noch Basisauthentifizierung akzeptiert (Hybrid- oder lokale Bereitstellung, SMTP AUTH aktiviert). Testen Sie die Verbindung nach der Änderung erneut.",
                "card.passwordSaved": "Ein Passwort ist bereits gespeichert: Leer lassen, um es beizubehalten, oder das Feld leeren und einen neuen Wert eingeben.",
                "card.passwordHint": "Geben Sie den vom E-Mail-Anbieter bereitgestellten Autorisierungscode oder das App-Passwort ein und klicken Sie auf „Verbindung testen“.",
                "card.senderNameLabel": "Anzeigename des Absenders (optional)",
                "card.senderNamePlaceholder": "Nur der für Empfänger sichtbare Name",
                "card.senderNameHint": "Geändert wird nur der für Empfänger sichtbare Name; die Adresse bleibt die oben angegebene.",
                "card.authUserLabel": "Anmeldebenutzer (wenn abweichend von der Adresse)",
                "card.authUserPlaceholder": "Leer = mit der obigen Adresse anmelden",
                "card.authUserHint": "Alias oder Relay: Oben steht die Absenderadresse, hier das Konto für die IMAP-/SMTP-Anmeldung. Leer lassen, wenn beide identisch sind.",
                "card.authPasswordLabel": "Passwort des Anmeldebenutzers (optional)",
                "card.authPasswordSaved": "Ein Anmeldepasswort ist gespeichert: Leer lassen, um es beizubehalten, oder einen neuen Wert eingeben.",
                "card.authPasswordHint": "Leer lassen, um den obigen Autorisierungscode bzw. das App-Passwort wiederzuverwenden. Nur erforderlich, wenn der Anmeldebenutzer ein eigenes Passwort hat.",
                "card.inboxLabel": "Posteingangsordner (Standard: INBOX)",
                "card.autoSaveHint": " Änderungen werden automatisch gespeichert.",
                "card.autoSaveHintNoDefault": " Es gibt mehrere Konten, aber noch kein Standardkonto. Wählen Sie zuerst eines aus.",
                "card.builtinEndpoints": " · {imap} | {smtp}",
                "card.customEndpoint": " · {endpoint}",
                "provider.customServer": "Benutzerdefinierter Server (manuelle Eingabe)",
                "card.customServerHint": "Für einen internen oder selbst gehosteten Mailserver: Trage den eingehenden Server ein. Der ausgehende Server übernimmt ihn, wenn er leer bleibt. Leere Ports nutzen die Standardwerte (IMAP 993 / SMTP 465).",
                "card.imapServerLabel": "IMAP-Eingangsserver",
                "card.smtpServerLabel": "SMTP-Ausgangsserver (leer = Eingangsserver)",
                "card.portLabel": "Port",
                "card.tlsLabel": "SSL / TLS",
                "card.errNoCustomHost": "Beim Konto mit benutzerdefiniertem Server fehlt noch der Eingangsserver; diese Änderung wird nicht gespeichert.",
                "preset.errReservedName": "Eine Voreinstellung darf nicht „{name}“ heißen: Dieser Wert ist für die Option „benutzerdefinierter Server“ reserviert. Wähle einen anderen Namen.",
                // oauth
                "oauth.clientIdLabel": "Anwendungs- (Client-) ID",
                "oauth.clientIdPlaceholder": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
                "oauth.clientIdHint": "Leer lassen, um sich mit der integrierten Community-Anwendung des Plugins anzumelden (kostenlos, ohne Einrichtung): Auf dem Microsoft-Zustimmungsbildschirm wird der Name der App des Beitragenden angezeigt, und die Anmeldeprotokolle werden dessen Tenant zugeordnet. Für Ihre eigene öffentliche Azure-(Entra-)Client-ID mit delegierten IMAP-/SMTP-Berechtigungen und aktiviertem Gerätecodeflow fügen Sie diese hier ein; bei einer Änderung ist eine erneute Anmeldung erforderlich.",
                "oauth.clientIdMissing": "Dieser Build enthält keine integrierte Anwendungs- (Client-) ID; die Gerätecode-Anmeldung kann daher nicht starten. Registrieren Sie eine gemäß dem Abschnitt „Outlook OAuth2“ in der README und fügen Sie sie hier ein.",
                "oauth.clientIdBuiltIn": "Anmeldung über die integrierte Community-Anwendung des Plugins: {id} (vom Beitragenden gurio-wine registriert und zur integrierten Nutzung in diesem Projekt freigegeben). Falls Unternehmensrichtlinien Drittanbieter-Apps nicht zulassen, verwenden Sie Ihre eigene.",
                "oauth.passwordless": "Dieser Anbieter verwendet OAuth2-Autorisierung, daher ist kein Passwort erforderlich{label}.",
                "oauth.passwordlessLabel": " ({label})",
                "oauth.noUrl": "(Backend hat keine Autorisierungs-URL zurückgegeben; abbrechen und erneut versuchen)",
                "oauth.polling": "Warten… (Prüfung alle {seconds} Sekunden; der Autorisierungslink ist etwa {minutes} Minuten gültig)",
                "oauth.unknownUser": "(unbekanntes Konto)",
                "oauth.loginOkAs": "Angemeldet: {user}",
                "oauth.badResponse": "Der Server hat eine unbekannte Antwort zurückgegeben",
                // preset
                "preset.cleared": "Karten gelöscht: Füllen Sie die restlichen Felder aus, um sie zurückzuschreiben; alle {count} Voreinstellungen werden gelöscht.",
                "preset.badgeUnnamed": "Unbenannt",
                "preset.badgeRenamed": "Umbenannt → alter Schlüssel gelöscht, neuer erstellt",
                "preset.badgeDuplicate": "Doppelt",
                "preset.noHost": "(kein Host)",
                "preset.endpointMissing": "Endpunkt fehlt",
                "preset.metaImap": "imap {host}:{port}",
                "preset.metaSmtp": " | smtp {host}:{port}",
                "preset.ssl": " · SSL",
                "preset.plain": " · unverschlüsselt",
                "preset.confirmDelete": "Beim Löschen der Voreinstellung „{name}“ fehlen den darauf verweisenden Konten die Endpunkte (und sie wird nicht mehr im Anbietermenü angezeigt).",
                "preset.nameHint": "Darf nicht mit einem integrierten Anbieter (qq/163/126/sina/aliyun/gmail/outlook/icloud) kollidieren, da die integrierte Voreinstellung ihn überdecken würde. Beim Umbenennen wird der alte Schlüssel gelöscht und ein neuer erstellt.",
                "preset.duplicateWarn": "Eine Voreinstellung mit diesem Namen existiert bereits: Voreinstellungsnamen sind YAML-Schlüssel und müssen eindeutig sein.",
                "preset.labelLabel": "Anzeigename (Schlüssel label, optional)",
                "preset.labelPlaceholder": "Arbeits-E-Mail",
                "preset.imapPortHint": "Leer lassen, um den Standardwert 993 zu verwenden.",
                "preset.smtpPortHint": "Leer lassen, um den Standardwert 465 zu verwenden.",
                "preset.portProblem": "{problem}.",
                "preset.yamlParseFailedHint": "Die Karten unten wurden aus der (leeren) Voreinstellungstabelle des Snapshots erstellt, nicht aus diesem Text. Bearbeiten Sie das YAML unten, um von Grund auf eine neue Tabelle zu schreiben.",
                "preset.footerHint": "Eine Voreinstellung enthält weder E-Mail-Adresse noch Passwort, sondern nur Verbindungsparameter; ein Konto speichert nur den Anbieternamen und ermittelt beim Verbinden die Endpunkte aus der Voreinstellung.",
                "preset.portNumeric": "Der Port muss eine Zahl sein",
                "preset.portRange": "Der Port muss zwischen 1 und 65535 liegen",
                "preset.errNoName": "Eine Voreinstellung hat noch keinen Namen (der Name ist der YAML-Schlüssel).",
                "preset.errDuplicate": "Zwei Karten heißen „{name}“: Voreinstellungsnamen sind YAML-Schlüssel und müssen eindeutig sein.",
                "preset.errNoImapHost": "Bei der Voreinstellung „{name}“ fehlt der IMAP-Host.",
                "preset.errNoSmtpHost": "Bei der Voreinstellung „{name}“ fehlt der SMTP-Host.",
                "preset.errImapPort": "Die Voreinstellung „{name}“ hat einen ungültigen IMAP-Port: {problem}.",
                "preset.errSmtpPort": "Die Voreinstellung „{name}“ hat einen ungültigen SMTP-Port: {problem}.",
                // notice
                "notice.commentsDropped": "Kommentare wurden entfernt: Das Originaldokument kann nicht direkt bearbeitet werden. ",
                "notice.passwordsDropped": "Einige gespeicherte Passwörter konnten nicht beibehalten werden; geben Sie sie in den entsprechenden Karten erneut ein. ",
                "notice.restSaved": "Alles andere wurde automatisch gespeichert.",
                "notice.cardsNotWritten": "Die Kontoänderungen konnten nicht in YAML geschrieben werden: {message}",
                // whale
                "whale.row": "{who} · {subject}",
                "whale.more": "…und {count} weitere; verwenden Sie email_watch / email_read, um sie anzuzeigen",
            },
            ja: {
                // common
                "common.confirmDelete": "削除を確認",
                "common.listSeparator": "、",
                // section
                "section.readonly": "設定ストアは読み取り専用です。設定を確認できますが、変更は保存できません。",
                "section.activeAccounts": "有効なアカウント: {accounts}",
                // provider
                "provider.qq": "QQメール",
                "provider.163": "163メール",
                "provider.126": "126メール",
                "provider.sina": "Sinaメール",
                "provider.aliyun": "Alibabaメール",
                "provider.gmail": "Gmail",
                "provider.exmail": "Tencent企業メール / WeComメール",
                "provider.outlook": "Outlook",
                "provider.icloud": "iCloud",
                "provider.custom": "カスタム",
                "provider.noneInYaml": "メールプロバイダーを選択",
                "provider.undefinedPresetSuffix": "(未定義のプリセット)",
                // global
                "global.sendApprovalRisk": "オフにすると、モデルによる送信・返信・転送は、信頼リストにない宛先を含め、すべてのアカウントでこのプラグインの確認を省略します。禁止宛先ルールとホスト権限は引き続き適用されます。下書きの送信には引き続き手動確認が必要です。",
                "global.downloadDirPlaceholder": "空欄でデフォルトを使用",
                "global.hint": "これらの設定はすべてのアカウントに適用されます。Full Access では、プラグインの確認が必要なツール送信でダイアログを表示できません。「下書き」タブで確認して手動承認してください。禁止宛先ルールは常に適用されます。",
                // card
                "card.unnamed": "(名前なし)",
                "card.noAddress": "(メールアドレス未入力)",
                "card.meta": "{address} · {folder} · {provider}",
                "card.noProvider": "プロバイダー未選択",
                "card.setDefaultAs": "デフォルトに設定: {name}",
                "card.renamedBadge": "名前変更済み → 新しい名前で保存",
                "card.testMissingAddress": "接続テストの前に、このアカウントのメールアドレスを入力してください。",
                "card.pickDefault": "複数のアカウントが設定されています。デフォルトアカウントを選択してください:",
                "card.errNoName": "名前が未入力のアカウントがあります。この変更は保存されません。",
                "card.errNoProvider": "プロバイダーが選択されていないアカウントがあります。この変更は保存されません。",
                "card.errDuplicateName": "同じ名前のアカウントがすでにあります。名前を変更すると上書きされるため、この変更は保存されません。",
                "card.errReservedName": "アカウント名に defaultAccount は使えません（デフォルトアカウント用の予約キーです）。この変更は保存されません。",
                "card.errNoDefault": "複数のアカウントがありますが、デフォルトアカウントが指定されていません。この変更は保存されません。",
                "card.yamlParseFailed": "accountsYaml を解析できませんでした: {error}",
                "card.confirmDelete": "アカウント「{name}」を削除すると、保存済みのログイン情報も削除されます。メールボックス内のメッセージは削除されません。",
                "card.nameLabel": "アカウント名",
                "card.nameHint": "「仕事用」などの名前を付けてメールボックスを区別できます。名前を変更しても既存の設定は保持されます。defaultAccount は予約されています。",
                "card.reservedNameWarn": "defaultAccount は予約キー（デフォルトアカウントを表す）です。別の名前を指定してください。",
                "card.authKindLabel": "認証方式",
                "card.authKindAuto": "自動（プロバイダーに応じて判定）",
                "card.authKindOAuth2": "OAuth2 デバイスコードログイン",
                "card.authKindPassword": "パスワード / アプリパスワード",
                "card.authKindHint": "既定ではプロバイダーに応じて認証方式を判定します。Exchange Online で基本認証をまだ利用できるテナント（ハイブリッドまたはオンプレミス、SMTP AUTH が有効）では「パスワード / アプリパスワード」を選択し、変更後に接続を再テストしてください。",
                "card.passwordSaved": "パスワードはすでに保存されています。保持する場合は空欄のままにし、置き換える場合は入力欄を消去して新しい値を入力してください。",
                "card.passwordHint": "メールプロバイダーから提供された認証コードまたはアプリパスワードを入力し、「接続をテスト」をクリックしてください。",
                "card.senderNameLabel": "差出人の表示名（任意）",
                "card.senderNamePlaceholder": "受信者に表示される名前のみ",
                "card.senderNameHint": "受信者に表示される名前だけが変わり、差出人アドレスは上記のままです。",
                "card.authUserLabel": "ログインユーザー（メールアドレスと異なる場合）",
                "card.authUserPlaceholder": "空欄 = 上記のアドレスでログイン",
                "card.authUserHint": "エイリアスまたはリレーの場合、上には送信元アドレス、ここには IMAP/SMTP ログインに使うアカウントを入力します。空欄なら同じアドレスを使います。",
                "card.authPasswordLabel": "ログインユーザーのパスワード（任意）",
                "card.authPasswordSaved": "ログインパスワードはすでに保存されています。保持する場合は空欄にし、置き換える場合は新しい値を入力してください。",
                "card.authPasswordHint": "上の認証コード / アプリパスワードを使う場合は空欄にしてください。ログインユーザーに別のパスワードがある場合のみ入力します。",
                "card.inboxLabel": "受信フォルダー（デフォルト: INBOX）",
                "card.autoSaveHint": " 変更は自動的に保存されます。",
                "card.autoSaveHintNoDefault": " 複数のアカウントがありますが、デフォルトが未設定です。先に1つ選択してください。",
                "card.builtinEndpoints": " · {imap} ｜ {smtp}",
                "card.customEndpoint": " · {endpoint}",
                "provider.customServer": "カスタムサーバー（手動入力）",
                "card.customServerHint": "社内または自前のメールサーバー向け: 受信サーバーを入力してください。送信サーバーが空欄の場合は受信サーバーを使用します。ポートが空欄の場合は既定値（IMAP 993 / SMTP 465）を使用します。",
                "card.imapServerLabel": "IMAP 受信サーバー",
                "card.smtpServerLabel": "SMTP 送信サーバー（空欄＝受信サーバー）",
                "card.portLabel": "ポート",
                "card.tlsLabel": "SSL / TLS",
                "card.errNoCustomHost": "カスタムサーバーのアカウントに受信サーバーが未入力のため、この変更は保存されません。",
                "preset.errReservedName": "プリセット名に「{name}」は使えません。この値は「カスタムサーバー」オプション用に予約されています。別の名前を指定してください。",
                // oauth
                "oauth.clientIdLabel": "アプリケーション（クライアント）ID",
                "oauth.clientIdPlaceholder": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
                "oauth.clientIdHint": "空欄にすると、プラグイン内蔵のコミュニティアプリ（無料・設定不要）でログインします。Microsoft の同意画面にはコントリビューターのアプリ名が表示され、ログイン記録もそのテナントに記録されます。独自の Azure (Entra) パブリッククライアント ID（IMAP/SMTP の委任アクセス許可とデバイスコードフローを有効化済み）を使う場合はここに貼り付けてください。変更後は再ログインが必要です。",
                "oauth.clientIdMissing": "このビルドにはアプリケーション（クライアント）ID が組み込まれていないため、デバイスコードログインを開始できません。README の「Outlook OAuth2」節に従って登録し、ここに入力してください。",
                "oauth.clientIdBuiltIn": "プラグイン内蔵のコミュニティアプリ {id} でログインします（コントリビューターの gurio-wine が登録し、本プロジェクトでの内蔵利用を許可）。組織のポリシーでサードパーティアプリが禁止されている場合は、独自のアプリを使用してください。",
                "oauth.passwordless": "このプロバイダーは OAuth2 認証を使用するため、パスワードは不要です{label}。",
                "oauth.passwordlessLabel": "（{label}）",
                "oauth.noUrl": "(サーバーから認証 URL が返されませんでした。キャンセルして再試行してください)",
                "oauth.polling": "待機中…（{seconds} 秒ごとに確認します。認証リンクの有効期限は約 {minutes} 分です）",
                "oauth.unknownUser": "(不明なアカウント)",
                "oauth.loginOkAs": "ログインしました: {user}",
                "oauth.badResponse": "サーバーから認識できない応答が返されました",
                // preset
                "preset.cleared": "カードをクリアしました。残りの項目を入力すると書き戻され、{count} 件のプリセットがすべて削除されます。",
                "preset.badgeUnnamed": "名前なし",
                "preset.badgeRenamed": "名前変更済み → 古いキーを削除し、新しいキーを作成",
                "preset.badgeDuplicate": "重複",
                "preset.noHost": "(ホスト未入力)",
                "preset.endpointMissing": "エンドポイント未入力",
                "preset.metaImap": "imap {host}:{port}",
                "preset.metaSmtp": " ｜ smtp {host}:{port}",
                "preset.ssl": " · SSL",
                "preset.plain": " · 平文",
                "preset.confirmDelete": "プリセット「{name}」を削除すると、それを指すアカウントカードからエンドポイントが失われ、プロバイダー選択にも表示されなくなります。",
                "preset.nameHint": "組み込みプロバイダー（qq/163/126/sina/aliyun/gmail/outlook/icloud）とは同名にできません。組み込みプリセットに隠されます。名前変更では古いキーを削除し、新しいキーを作成します。",
                "preset.duplicateWarn": "この名前のプリセットはすでに存在します。プリセット名は YAML キーのため、一意である必要があります。",
                "preset.labelLabel": "表示ラベル（label キー、任意）",
                "preset.labelPlaceholder": "仕事用メール",
                "preset.imapPortHint": "空欄でデフォルトの 993 を使用",
                "preset.smtpPortHint": "空欄でデフォルトの 465 を使用",
                "preset.portProblem": "{problem}。",
                "preset.yamlParseFailedHint": "下のカードは、このテキストではなくスナップショットの（空の）プリセット表から作成されています。下の YAML を直接編集して新しく書き直せます。",
                "preset.footerHint": "プリセットにはメールアドレスやパスワードは含まれず、接続パラメーターだけが保存されます。アカウントはプロバイダー名だけを保持し、接続時にプリセットからエンドポイントを展開します。",
                "preset.portNumeric": "ポートは数字で指定してください",
                "preset.portRange": "ポートは 1～65535 の範囲で指定してください",
                "preset.errNoName": "名前が未入力のプリセットがあります（プリセット名は YAML キーです）。",
                "preset.errDuplicate": "2 枚のプリセットカードが「{name}」という名前です。プリセット名は YAML キーのため、一意である必要があります。",
                "preset.errNoImapHost": "プリセット「{name}」に IMAP ホストが未入力です。",
                "preset.errNoSmtpHost": "プリセット「{name}」に SMTP ホストが未入力です。",
                "preset.errImapPort": "プリセット「{name}」の IMAP ポートが無効です: {problem}。",
                "preset.errSmtpPort": "プリセット「{name}」の SMTP ポートが無効です: {problem}。",
                // notice
                "notice.commentsDropped": "コメントを削除しました。元のドキュメントはその場で編集できません。 ",
                "notice.passwordsDropped": "保存済みパスワードの一部を保持できませんでした。該当するカードで再入力してください。",
                "notice.restSaved": "その他の変更は自動保存されました。",
                "notice.cardsNotWritten": "アカウントの変更を YAML に書き込めませんでした: {message}",
                // whale
                "whale.row": "{who} · {subject}",
                "whale.more": "…ほか {count} 件。email_watch / email_read で確認してください",
            },
            pt: {
                // common
                "common.confirmDelete": "Confirmar exclusão",
                "common.listSeparator": ", ",
                // section
                "section.readonly": "O armazenamento de configurações está somente para leitura: você pode consultá-las, mas não salvá-las.",
                "section.activeAccounts": "Contas ativas: {accounts}",
                // provider
                "provider.qq": "QQ Mail",
                "provider.163": "163 Mail",
                "provider.126": "126 Mail",
                "provider.sina": "Sina Mail",
                "provider.aliyun": "Alibaba Mail",
                "provider.gmail": "Gmail",
                "provider.exmail": "Tencent Enterprise / WeCom Mail",
                "provider.outlook": "Outlook",
                "provider.icloud": "iCloud",
                "provider.custom": "Personalizado",
                "provider.noneInYaml": "Escolha seu provedor de e-mail",
                "provider.undefinedPresetSuffix": "(predefinição não definida)",
                // global
                "global.sendApprovalRisk": "Se desativada, esta extensão não solicitará confirmação para envios, respostas e encaminhamentos iniciados pelo modelo em nenhuma conta, inclusive para destinatários fora da lista de confiança. As regras de destinatários bloqueados e as permissões do host continuam valendo. Rascunhos ainda exigem confirmação manual para envio.",
                "global.downloadDirPlaceholder": "Deixe vazio para usar o padrão",
                "global.hint": "Estas configurações valem para todas as contas. No Full Access, envios por ferramentas que ainda exigem confirmação da extensão não exibem uma caixa de diálogo; use a aba Rascunhos para revisar e confirmar manualmente. As regras de destinatários bloqueados sempre se aplicam.",
                // card
                "card.unnamed": "(sem nome)",
                "card.noAddress": "(sem endereço de e-mail)",
                "card.meta": "{address} · {folder} · {provider}",
                "card.noProvider": "Nenhum provedor",
                "card.setDefaultAs": "Definir como padrão: {name}",
                "card.renamedBadge": "Renomeada → será salva com o novo nome",
                "card.testMissingAddress": "Informe o endereço de e-mail desta conta antes de testar a conexão.",
                "card.pickDefault": "Há várias contas configuradas; escolha a conta padrão:",
                "card.errNoName": "Há uma conta sem nome; esta alteração não será salva.",
                "card.errNoProvider": "Há uma conta sem provedor selecionado; esta alteração não será salva.",
                "card.errDuplicateName": "Já existe outra conta com esse nome; renomeá-la a substituiria, então esta alteração não será salva.",
                "card.errReservedName": "Uma conta não pode se chamar defaultAccount (essa chave é reservada para a conta padrão); esta alteração não será salva.",
                "card.errNoDefault": "Há várias contas, mas nenhuma foi definida como padrão; esta alteração não será salva.",
                "card.yamlParseFailed": "Falha ao analisar accountsYaml: {error}",
                "card.confirmDelete": "Excluir a conta “{name}” também remove os dados de login salvos. As mensagens da caixa de correio não serão excluídas.",
                "card.nameLabel": "Nome da conta",
                "card.nameHint": "Use um nome como “Trabalho” para distinguir suas caixas de correio. A renomeação mantém as configurações existentes; defaultAccount é reservado.",
                "card.reservedNameWarn": "defaultAccount é uma chave reservada (indica a conta padrão); escolha outro nome.",
                "card.authKindLabel": "Autenticação",
                "card.authKindAuto": "Automática (definida pelo provedor)",
                "card.authKindOAuth2": "Login OAuth2 por código do dispositivo",
                "card.authKindPassword": "Senha / senha de aplicativo",
                "card.authKindHint": "Por padrão, o provedor determina o método. Escolha “Senha / senha de aplicativo” para um tenant que ainda aceite autenticação básica no Exchange Online (híbrido ou local, com SMTP AUTH habilitado); teste a conexão novamente após alterar.",
                "card.passwordSaved": "Já há uma senha salva: deixe o campo vazio para mantê-la ou apague-o e digite outra para substituí-la.",
                "card.passwordHint": "Informe o código de autorização ou a senha de aplicativo fornecida pelo provedor de e-mail e clique em “Testar conexão”.",
                "card.senderNameLabel": "Nome de exibição do remetente (opcional)",
                "card.senderNamePlaceholder": "Apenas o nome visto pelos destinatários",
                "card.senderNameHint": "Altera apenas o nome exibido aos destinatários; o endereço continua sendo o informado acima.",
                "card.authUserLabel": "Usuário de login (se diferente do endereço)",
                "card.authUserPlaceholder": "Vazio = entrar usando o endereço acima",
                "card.authUserHint": "Alias ou retransmissão: acima fica o endereço de envio; aqui, a conta usada para autenticação IMAP/SMTP. Deixe vazio se forem iguais.",
                "card.authPasswordLabel": "Senha do usuário de login (opcional)",
                "card.authPasswordSaved": "Há uma senha de login salva: deixe o campo vazio para mantê-la ou digite outra para substituí-la.",
                "card.authPasswordHint": "Deixe vazio para reutilizar o código de autorização ou a senha de aplicativo acima; só é necessário se o usuário de login tiver uma senha própria.",
                "card.inboxLabel": "Pasta de entrada (padrão: INBOX)",
                "card.autoSaveHint": " As alterações são salvas automaticamente.",
                "card.autoSaveHintNoDefault": " Há várias contas, mas nenhuma está definida como padrão; escolha uma primeiro.",
                "card.builtinEndpoints": " · {imap} | {smtp}",
                "card.customEndpoint": " · {endpoint}",
                "provider.customServer": "Servidor personalizado (preenchimento manual)",
                "card.customServerHint": "Para um servidor de e-mail interno ou próprio: informe o servidor de entrada. O de saída usa o mesmo quando deixado em branco. Portas em branco usam os padrões (IMAP 993 / SMTP 465).",
                "card.imapServerLabel": "Servidor IMAP de entrada",
                "card.smtpServerLabel": "Servidor SMTP de saída (em branco = servidor de entrada)",
                "card.portLabel": "Porta",
                "card.tlsLabel": "SSL / TLS",
                "card.errNoCustomHost": "A conta de servidor personalizado ainda não tem servidor de entrada; esta alteração não será salva.",
                "preset.errReservedName": "Uma predefinição não pode se chamar “{name}”: esse valor é reservado para a opção de servidor personalizado. Escolha outro nome.",
                // oauth
                "oauth.clientIdLabel": "ID do aplicativo (cliente)",
                "oauth.clientIdPlaceholder": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
                "oauth.clientIdHint": "Deixe vazio para entrar com o aplicativo comunitário integrado à extensão (gratuito e pronto para usar): a tela de consentimento da Microsoft exibirá o nome do aplicativo do colaborador, e os registros de login ficarão no tenant dele. Para usar seu próprio ID de cliente público do Azure (Entra), com permissões delegadas IMAP/SMTP e fluxo de código do dispositivo habilitados, cole-o aqui; alterá-lo exige um novo login.",
                "oauth.clientIdMissing": "Esta versão não inclui um ID de aplicativo (cliente) integrado, então o login por código do dispositivo não pode ser iniciado. Registre um conforme a seção “Outlook OAuth2” do README e cole-o aqui.",
                "oauth.clientIdBuiltIn": "Login pela aplicação comunitária integrada à extensão: {id} (registrada pelo colaborador gurio-wine, que autorizou o uso integrado neste projeto). Se as políticas da empresa não permitirem aplicativos de terceiros, use o seu próprio.",
                "oauth.passwordless": "Este provedor usa autorização OAuth2, portanto não é necessária uma senha{label}.",
                "oauth.passwordlessLabel": " ({label})",
                "oauth.noUrl": "(o servidor não retornou uma URL de autorização; cancele e tente novamente)",
                "oauth.polling": "Aguardando… (verificação a cada {seconds} segundos; o link de autorização é válido por cerca de {minutes} minutos)",
                "oauth.unknownUser": "(conta desconhecida)",
                "oauth.loginOkAs": "Conectado: {user}",
                "oauth.badResponse": "O servidor retornou uma resposta não reconhecida",
                // preset
                "preset.cleared": "Cartões limpos: preencha os campos restantes para gravá-los novamente; os {count} predefinições serão excluídos.",
                "preset.badgeUnnamed": "Sem nome",
                "preset.badgeRenamed": "Renomeado → chave antiga excluída, nova criada",
                "preset.badgeDuplicate": "Duplicado",
                "preset.noHost": "(sem host)",
                "preset.endpointMissing": "Endpoint ausente",
                "preset.metaImap": "imap {host}:{port}",
                "preset.metaSmtp": " | smtp {host}:{port}",
                "preset.ssl": " · SSL",
                "preset.plain": " · sem criptografia",
                "preset.confirmDelete": "Excluir a predefinição “{name}” deixará sem endpoints os cartões de conta que apontam para ela (e ela não será mais listada no seletor de provedores).",
                "preset.nameHint": "Não pode coincidir com um provedor integrado (qq/163/126/sina/aliyun/gmail/outlook/icloud), pois a predefinição integrada o ocultaria. Renomear exclui a chave antiga e cria uma nova.",
                "preset.duplicateWarn": "Já existe uma predefinição com esse nome: nomes de predefinições são chaves YAML e devem ser exclusivos.",
                "preset.labelLabel": "Rótulo exibido (chave label, opcional)",
                "preset.labelPlaceholder": "E-mail de trabalho",
                "preset.imapPortHint": "Deixe vazio para usar o padrão 993.",
                "preset.smtpPortHint": "Deixe vazio para usar o padrão 465.",
                "preset.portProblem": "{problem}.",
                "preset.yamlParseFailedHint": "Os cartões abaixo foram criados a partir da tabela de predefinições (vazia) do instantâneo, não deste texto. Edite o YAML abaixo para criar uma nova do zero.",
                "preset.footerHint": "Uma predefinição não contém endereço de e-mail nem senha, apenas parâmetros de conexão; uma conta armazena só o nome do provedor e expande os endpoints da predefinição ao conectar.",
                "preset.portNumeric": "A porta deve ser um número",
                "preset.portRange": "A porta deve estar entre 1 e 65535",
                "preset.errNoName": "Há uma predefinição sem nome (o nome é a chave YAML).",
                "preset.errDuplicate": "Dois cartões de predefinição têm o nome “{name}”: nomes de predefinições são chaves YAML e devem ser exclusivos.",
                "preset.errNoImapHost": "A predefinição “{name}” ainda não tem host IMAP.",
                "preset.errNoSmtpHost": "A predefinição “{name}” ainda não tem host SMTP.",
                "preset.errImapPort": "A predefinição “{name}” tem uma porta IMAP inválida: {problem}.",
                "preset.errSmtpPort": "A predefinição “{name}” tem uma porta SMTP inválida: {problem}.",
                // notice
                "notice.commentsDropped": "Os comentários foram removidos: o documento original não pode ser editado no local. ",
                "notice.passwordsDropped": "Algumas senhas salvas não puderam ser mantidas; digite-as novamente nos cartões correspondentes. ",
                "notice.restSaved": "Todo o restante foi salvo automaticamente.",
                "notice.cardsNotWritten": "Não foi possível gravar as alterações das contas no YAML: {message}",
                // whale
                "whale.row": "{who} · {subject}",
                "whale.more": "…e mais {count}; use email_watch / email_read para vê-los",
            },
            ru: {
                // common
                "common.confirmDelete": "Подтвердить удаление",
                "common.listSeparator": ", ",
                // section
                "section.readonly": "Хранилище настроек доступно только для чтения: настройки можно просматривать, но нельзя сохранять.",
                "section.activeAccounts": "Активные аккаунты: {accounts}",
                // provider
                "provider.qq": "QQ Mail",
                "provider.163": "163 Mail",
                "provider.126": "126 Mail",
                "provider.sina": "Sina Mail",
                "provider.aliyun": "Alibaba Mail",
                "provider.gmail": "Gmail",
                "provider.exmail": "Tencent Enterprise / WeCom Mail",
                "provider.outlook": "Outlook",
                "provider.icloud": "iCloud",
                "provider.custom": "Другой",
                "provider.noneInYaml": "Выберите почтового провайдера",
                "provider.undefinedPresetSuffix": "(неопределённая настройка)",
                // global
                "global.sendApprovalRisk": "При отключении отправка, ответы и пересылка по инициативе модели во всех аккаунтах будут обходить подтверждение этого плагина, в том числе для адресатов вне списка доверенных. Правила блокировки получателей и разрешения хоста продолжают действовать. Отправку черновиков по-прежнему нужно подтверждать вручную.",
                "global.downloadDirPlaceholder": "Оставьте пустым, чтобы использовать значение по умолчанию",
                "global.hint": "Эти настройки применяются ко всем аккаунтам. В режиме Full Access для отправок инструментами, которым всё ещё требуется подтверждение плагина, нельзя показать диалог; проверяйте и подтверждайте их вручную на вкладке «Черновики». Правила блокировки получателей действуют всегда.",
                // card
                "card.unnamed": "(без имени)",
                "card.noAddress": "(адрес электронной почты не указан)",
                "card.meta": "{address} · {folder} · {provider}",
                "card.noProvider": "Провайдер не выбран",
                "card.setDefaultAs": "Сделать аккаунт основным: {name}",
                "card.renamedBadge": "Переименован → будет сохранён под новым именем",
                "card.testMissingAddress": "Перед проверкой подключения укажите адрес электронной почты этого аккаунта.",
                "card.pickDefault": "Настроено несколько аккаунтов. Выберите аккаунт по умолчанию:",
                "card.errNoName": "У одного из аккаунтов не указано имя; изменения не будут сохранены.",
                "card.errNoProvider": "Для одного из аккаунтов не выбран провайдер; изменения не будут сохранены.",
                "card.errDuplicateName": "Аккаунт с таким именем уже существует. Переименование приведёт к перезаписи, поэтому изменения не будут сохранены.",
                "card.errReservedName": "Аккаунт не может называться defaultAccount (этот ключ зарезервирован для аккаунта по умолчанию); изменения не будут сохранены.",
                "card.errNoDefault": "Есть несколько аккаунтов, но аккаунт по умолчанию не выбран; изменения не будут сохранены.",
                "card.yamlParseFailed": "Не удалось разобрать accountsYaml: {error}",
                "card.confirmDelete": "При удалении аккаунта «{name}» также будут удалены сохранённые данные для входа. Письма в почтовом ящике не удаляются.",
                "card.nameLabel": "Имя аккаунта",
                "card.nameHint": "Используйте, например, имя «Рабочий», чтобы различать почтовые ящики. При переименовании настройки сохраняются; defaultAccount зарезервирован.",
                "card.reservedNameWarn": "defaultAccount — зарезервированный ключ (обозначает аккаунт по умолчанию); выберите другое имя.",
                "card.authKindLabel": "Способ аутентификации",
                "card.authKindAuto": "Автоматически (определяется провайдером)",
                "card.authKindOAuth2": "Вход OAuth2 с кодом устройства",
                "card.authKindPassword": "Пароль / пароль приложения",
                "card.authKindHint": "По умолчанию способ определяется провайдером. Выберите «Пароль / пароль приложения» для арендатора, который ещё принимает базовую аутентификацию в Exchange Online (гибридная или локальная среда, SMTP AUTH включён); после изменения повторно проверьте подключение.",
                "card.passwordSaved": "Пароль уже сохранён: оставьте поле пустым, чтобы сохранить его, или очистите поле и введите новый.",
                "card.passwordHint": "Введите код авторизации или пароль приложения, предоставленный почтовым провайдером, затем нажмите «Проверить соединение».",
                "card.senderNameLabel": "Отображаемое имя отправителя (необязательно)",
                "card.senderNamePlaceholder": "Только имя, которое видят получатели",
                "card.senderNameHint": "Изменится только имя, видимое получателям; адрес останется таким, как указан выше.",
                "card.authUserLabel": "Имя пользователя для входа (если отличается от адреса)",
                "card.authUserPlaceholder": "Пусто = вход с указанным выше адресом",
                "card.authUserHint": "Для псевдонима или ретрансляции: выше указывается адрес отправителя, здесь — аккаунт для аутентификации IMAP/SMTP. Если оставить поле пустым, адреса считаются одинаковыми.",
                "card.authPasswordLabel": "Пароль пользователя для входа (необязательно)",
                "card.authPasswordSaved": "Пароль для входа уже сохранён: оставьте поле пустым, чтобы сохранить его, или введите новый.",
                "card.authPasswordHint": "Оставьте поле пустым, чтобы использовать указанный выше код авторизации или пароль приложения. Заполняйте только если у пользователя для входа есть отдельный пароль.",
                "card.inboxLabel": "Папка входящих (по умолчанию INBOX)",
                "card.autoSaveHint": " Изменения сохраняются автоматически.",
                "card.autoSaveHintNoDefault": " Настроено несколько аккаунтов, но основной не выбран; сначала выберите его.",
                "card.builtinEndpoints": " · {imap} | {smtp}",
                "card.customEndpoint": " · {endpoint}",
                "provider.customServer": "Свой сервер (ручной ввод)",
                "card.customServerHint": "Для внутреннего или собственного почтового сервера: укажите сервер входящей почты. Сервер исходящей почты будет тем же, если оставить поле пустым. Пустые порты используют значения по умолчанию (IMAP 993 / SMTP 465).",
                "card.imapServerLabel": "IMAP-сервер входящей почты",
                "card.smtpServerLabel": "SMTP-сервер исходящей почты (пусто = сервер входящей)",
                "card.portLabel": "Порт",
                "card.tlsLabel": "SSL / TLS",
                "card.errNoCustomHost": "У аккаунта со своим сервером ещё не указан сервер входящей почты; изменение не сохраняется.",
                "preset.errReservedName": "Предустановка не может называться «{name}»: это значение зарезервировано для варианта «свой сервер». Укажите другое имя.",
                // oauth
                "oauth.clientIdLabel": "Идентификатор приложения (клиента)",
                "oauth.clientIdPlaceholder": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
                "oauth.clientIdHint": "Оставьте поле пустым, чтобы войти через встроенное приложение сообщества (бесплатно, настройка не требуется): на экране согласия Microsoft будет указано приложение участника, а журналы входа попадут в его tenant. Чтобы использовать собственный общедоступный идентификатор клиента Azure (Entra) с делегированными разрешениями IMAP/SMTP и включённым потоком кода устройства, вставьте его сюда; после изменения потребуется войти заново.",
                "oauth.clientIdMissing": "В этой сборке нет встроенного идентификатора приложения (клиента), поэтому вход с кодом устройства невозможен. Зарегистрируйте его по инструкции в разделе «Outlook OAuth2» файла README и вставьте сюда.",
                "oauth.clientIdBuiltIn": "Вход через встроенное приложение сообщества: {id} (зарегистрировано участником gurio-wine, который разрешил встроенное использование в этом проекте). Если политика организации запрещает сторонние приложения, используйте собственное.",
                "oauth.passwordless": "Этот провайдер использует авторизацию OAuth2, поэтому пароль не требуется{label}.",
                "oauth.passwordlessLabel": " ({label})",
                "oauth.noUrl": "(сервер не вернул URL авторизации; отмените операцию и попробуйте снова)",
                "oauth.polling": "Ожидание… (проверка каждые {seconds} сек.; ссылка авторизации действительна около {minutes} мин.)",
                "oauth.unknownUser": "(неизвестный аккаунт)",
                "oauth.loginOkAs": "Вход выполнен: {user}",
                "oauth.badResponse": "Сервер вернул нераспознанный ответ",
                // preset
                "preset.cleared": "Карточки очищены: заполните оставшиеся поля, чтобы записать их заново; все настройки ({count}) будут удалены.",
                "preset.badgeUnnamed": "Без имени",
                "preset.badgeRenamed": "Переименовано → старый ключ удалён, создан новый",
                "preset.badgeDuplicate": "Дубликат",
                "preset.noHost": "(хост не указан)",
                "preset.endpointMissing": "Конечная точка не указана",
                "preset.metaImap": "imap {host}:{port}",
                "preset.metaSmtp": " | smtp {host}:{port}",
                "preset.ssl": " · SSL",
                "preset.plain": " · без шифрования",
                "preset.confirmDelete": "После удаления настройки «{name}» у связанных аккаунтов не будет конечных точек (и она исчезнет из списка провайдеров).",
                "preset.nameHint": "Имя не может совпадать со встроенным провайдером (qq/163/126/sina/aliyun/gmail/outlook/icloud), иначе встроенная настройка скроет его. При переименовании старый ключ удаляется и создаётся новый.",
                "preset.duplicateWarn": "Настройка с таким именем уже существует: имена настроек являются ключами YAML и должны быть уникальными.",
                "preset.labelLabel": "Отображаемая метка (ключ label, необязательно)",
                "preset.labelPlaceholder": "Рабочая почта",
                "preset.imapPortHint": "Оставьте пустым, чтобы использовать значение по умолчанию 993.",
                "preset.smtpPortHint": "Оставьте пустым, чтобы использовать значение по умолчанию 465.",
                "preset.portProblem": "{problem}.",
                "preset.yamlParseFailedHint": "Карточки ниже созданы из (пустой) таблицы настроек в снимке, а не из этого текста. Отредактируйте YAML ниже, чтобы создать новую таблицу с нуля.",
                "preset.footerHint": "Настройка не содержит адреса почты и пароля, только параметры подключения; аккаунт хранит лишь имя провайдера и при подключении получает конечные точки из настройки.",
                "preset.portNumeric": "Порт должен быть числом",
                "preset.portRange": "Порт должен быть от 1 до 65535",
                "preset.errNoName": "У настройки не указано имя (имя настройки — ключ YAML).",
                "preset.errDuplicate": "Две карточки настроек имеют имя «{name}»: имена настроек — ключи YAML и должны быть уникальными.",
                "preset.errNoImapHost": "В настройке «{name}» не указан хост IMAP.",
                "preset.errNoSmtpHost": "В настройке «{name}» не указан хост SMTP.",
                "preset.errImapPort": "В настройке «{name}» указан недопустимый порт IMAP: {problem}.",
                "preset.errSmtpPort": "В настройке «{name}» указан недопустимый порт SMTP: {problem}.",
                // notice
                "notice.commentsDropped": "Комментарии удалены: исходный документ нельзя редактировать на месте. ",
                "notice.passwordsDropped": "Некоторые сохранённые пароли не удалось сохранить; введите их заново в соответствующих карточках. ",
                "notice.restSaved": "Остальные изменения сохранены автоматически.",
                "notice.cardsNotWritten": "Не удалось записать изменения аккаунтов в YAML: {message}",
                // whale
                "whale.row": "{who} · {subject}",
                "whale.more": "…и ещё {count}; используйте email_watch / email_read для просмотра",
            },
        };
        // Every supported locale ships a complete table: the primary overrides plus
        // this completion layer. Any key that still has no translation deliberately
        // falls back to English instead of surfacing a missing-key identifier, and
        // test/client-locale.test.mjs fails if the completion layer falls behind UI.en.
        for (const language of ["es", "fr", "de", "ja", "pt", "ru"]) {
            const overrides = Object.assign({}, UI_LOCALE_OVERRIDES[language], UI_LOCALE_COMPLETION[language]);
            for (const key of Object.keys(UI.en))
                if (!Object.prototype.hasOwnProperty.call(overrides, key)) overrides[key] = UI.en[key];
            UI[language] = Object.assign({}, UI.en, overrides);
        }
        const INLINE_LOCALE_OVERRIDES = {
            es: { "Cancel": "Cancelar", "Retry": "Reintentar", "Delete": "Eliminar", "Close": "Cerrar", "Search": "Buscar", "Refresh mail": "Actualizar correo", "Clear search": "Borrar búsqueda", "Unread only": "Solo no leídos", "Inbox": "Bandeja de entrada", "Sent": "Enviados", "Trash": "Papelera", "All folders": "Todas las carpetas", "Manage folders": "Administrar carpetas", "Account": "Cuenta", "Mail folders": "Carpetas de correo", "Back to messages": "Volver a los mensajes", "Loading messages…": "Cargando mensajes…", "Loading message…": "Cargando mensaje…", "Select a message": "Selecciona un mensaje", "No messages on this page.": "No hay mensajes en esta página.", "Previous page": "Página anterior", "Next page": "Página siguiente", "Email drafts": "Borradores de correo", "Local drafts": "Borradores locales", "Refresh list": "Actualizar lista", "Save draft": "Guardar borrador", "Confirm send": "Confirmar envío", "Cancel review": "Cancelar revisión", "Email features": "Funciones de correo", "Mailbox": "Buzón", "Drafts": "Borradores", "Accounts": "Cuentas", "Recipient rules": "Reglas de destinatarios", "Mail tasks": "Tareas de correo", "Compose": "Redactar", "Email": "Correo", "Read, reply and manage drafts.": "Lee, responde y administra borradores.", "From: ": "De: ", "Subject: ": "Asunto: ", "To: ": "Para: ", "Attachments": "Adjuntos", "Download attachment": "Descargar adjunto", "Reply in drafts": "Responder en borradores", "Reply all in drafts": "Responder a todos en borradores", "Not sent": "No enviado", "Scheduled": "Programado", "Submitting…": "Enviando…", "Confirm scheduled send": "Confirmar envío programado", "No attachments": "Sin adjuntos", "Review before sending": "Revisar antes de enviar", "Needs confirmation": "Requiere confirmación", "No match": "Sin coincidencia", "Check matches (no email sent)": "Comprobar coincidencias (no se envía correo)", "Mail-triggered tasks": "Tareas activadas por correo", "Receiving account": "Cuenta receptora", "Receiving folder": "Carpeta receptora", "Enable mail tasks": "Activar tareas de correo", "Save task settings": "Guardar configuración de tareas", "Check now": "Comprobar ahora", "Task records": "Registros de tareas" },
            fr: { "Cancel": "Annuler", "Retry": "Réessayer", "Delete": "Supprimer", "Close": "Fermer", "Search": "Rechercher", "Refresh mail": "Actualiser les e-mails", "Clear search": "Effacer la recherche", "Unread only": "Non lus uniquement", "Inbox": "Boîte de réception", "Sent": "Envoyés", "Trash": "Corbeille", "All folders": "Tous les dossiers", "Manage folders": "Gérer les dossiers", "Account": "Compte", "Mail folders": "Dossiers de messagerie", "Back to messages": "Retour aux messages", "Loading messages…": "Chargement des messages…", "Loading message…": "Chargement du message…", "Select a message": "Sélectionnez un message", "No messages on this page.": "Aucun message sur cette page.", "Previous page": "Page précédente", "Next page": "Page suivante", "Email drafts": "Brouillons d’e-mails", "Local drafts": "Brouillons locaux", "Refresh list": "Actualiser la liste", "Save draft": "Enregistrer le brouillon", "Confirm send": "Confirmer l’envoi", "Cancel review": "Annuler la vérification", "Email features": "Fonctions e-mail", "Mailbox": "Boîte aux lettres", "Drafts": "Brouillons", "Accounts": "Comptes", "Recipient rules": "Règles de destinataires", "Mail tasks": "Tâches de messagerie", "Compose": "Rédiger", "Email": "E-mail", "Read, reply and manage drafts.": "Lisez, répondez et gérez les brouillons.", "From: ": "De : ", "Subject: ": "Objet : ", "To: ": "À : ", "Attachments": "Pièces jointes", "Download attachment": "Télécharger la pièce jointe", "Reply in drafts": "Répondre dans les brouillons", "Reply all in drafts": "Répondre à tous dans les brouillons", "Not sent": "Non envoyé", "Scheduled": "Planifié", "Submitting…": "Envoi…", "Confirm scheduled send": "Confirmer l’envoi planifié", "No attachments": "Aucune pièce jointe", "Review before sending": "Vérifier avant l’envoi", "Needs confirmation": "Confirmation requise", "No match": "Aucune correspondance", "Check matches (no email sent)": "Vérifier les correspondances (aucun envoi)", "Mail-triggered tasks": "Tâches déclenchées par e-mail", "Receiving account": "Compte de réception", "Receiving folder": "Dossier de réception", "Enable mail tasks": "Activer les tâches de messagerie", "Save task settings": "Enregistrer les paramètres", "Check now": "Vérifier maintenant", "Task records": "Historique des tâches" },
            de: { "Cancel": "Abbrechen", "Retry": "Erneut versuchen", "Delete": "Löschen", "Close": "Schließen", "Search": "Suchen", "Refresh mail": "E-Mail aktualisieren", "Clear search": "Suche löschen", "Unread only": "Nur ungelesene", "Inbox": "Posteingang", "Sent": "Gesendet", "Trash": "Papierkorb", "All folders": "Alle Ordner", "Manage folders": "Ordner verwalten", "Account": "Konto", "Mail folders": "E-Mail-Ordner", "Back to messages": "Zurück zu Nachrichten", "Loading messages…": "Nachrichten werden geladen…", "Loading message…": "Nachricht wird geladen…", "Select a message": "Nachricht auswählen", "No messages on this page.": "Keine Nachrichten auf dieser Seite.", "Previous page": "Vorherige Seite", "Next page": "Nächste Seite", "Email drafts": "E-Mail-Entwürfe", "Local drafts": "Lokale Entwürfe", "Refresh list": "Liste aktualisieren", "Save draft": "Entwurf speichern", "Confirm send": "Senden bestätigen", "Cancel review": "Prüfung abbrechen", "Email features": "E-Mail-Funktionen", "Mailbox": "Postfach", "Drafts": "Entwürfe", "Accounts": "Konten", "Recipient rules": "Empfängerregeln", "Mail tasks": "E-Mail-Aufgaben", "Compose": "Verfassen", "Email": "E-Mail", "Read, reply and manage drafts.": "E-Mails lesen, beantworten und Entwürfe verwalten.", "From: ": "Von: ", "Subject: ": "Betreff: ", "To: ": "An: ", "Attachments": "Anhänge", "Download attachment": "Anhang herunterladen", "Reply in drafts": "In Entwürfen antworten", "Reply all in drafts": "Allen in Entwürfen antworten", "Not sent": "Nicht gesendet", "Scheduled": "Geplant", "Submitting…": "Wird gesendet…", "Confirm scheduled send": "Geplantes Senden bestätigen", "No attachments": "Keine Anhänge", "Review before sending": "Vor dem Senden prüfen", "Needs confirmation": "Bestätigung erforderlich", "No match": "Keine Übereinstimmung", "Check matches (no email sent)": "Übereinstimmungen prüfen (keine E-Mail)", "Mail-triggered tasks": "E-Mail-Aufgaben", "Receiving account": "Empfangskonto", "Receiving folder": "Empfangsordner", "Enable mail tasks": "E-Mail-Aufgaben aktivieren", "Save task settings": "Aufgabeneinstellungen speichern", "Check now": "Jetzt prüfen", "Task records": "Aufgabenprotokoll" },
            ja: { "Cancel": "キャンセル", "Retry": "再試行", "Delete": "削除", "Close": "閉じる", "Search": "検索", "Refresh mail": "メールを更新", "Clear search": "検索をクリア", "Unread only": "未読のみ", "Inbox": "受信トレイ", "Sent": "送信済み", "Trash": "ゴミ箱", "All folders": "すべてのフォルダー", "Manage folders": "フォルダーを管理", "Account": "アカウント", "Mail folders": "メールフォルダー", "Back to messages": "メッセージに戻る", "Loading messages…": "メッセージを読み込み中…", "Loading message…": "メッセージを読み込み中…", "Select a message": "メッセージを選択", "No messages on this page.": "このページにメッセージはありません。", "Previous page": "前のページ", "Next page": "次のページ", "Email drafts": "メール下書き", "Local drafts": "ローカル下書き", "Refresh list": "一覧を更新", "Save draft": "下書きを保存", "Confirm send": "送信を確認", "Cancel review": "確認をキャンセル", "Email features": "メール機能", "Mailbox": "メールボックス", "Drafts": "下書き", "Accounts": "アカウント", "Recipient rules": "宛先ルール", "Mail tasks": "メールタスク", "Compose": "作成", "Email": "メール", "Read, reply and manage drafts.": "メールを読み、返信し、下書きを管理します。", "From: ": "差出人: ", "Subject: ": "件名: ", "To: ": "宛先: ", "Attachments": "添付ファイル", "Download attachment": "添付ファイルをダウンロード", "Reply in drafts": "下書きで返信", "Reply all in drafts": "下書きで全員に返信", "Not sent": "未送信", "Scheduled": "予約済み", "Submitting…": "送信中…", "Confirm scheduled send": "予約送信を確認", "No attachments": "添付ファイルなし", "Review before sending": "送信前に確認", "Needs confirmation": "確認が必要", "No match": "一致なし", "Check matches (no email sent)": "一致を確認（送信なし）", "Mail-triggered tasks": "メール起動タスク", "Receiving account": "受信アカウント", "Receiving folder": "受信フォルダー", "Enable mail tasks": "メールタスクを有効化", "Save task settings": "タスク設定を保存", "Check now": "今すぐ確認", "Task records": "タスク記録" },
            pt: { "Cancel": "Cancelar", "Retry": "Tentar novamente", "Delete": "Excluir", "Close": "Fechar", "Search": "Pesquisar", "Refresh mail": "Atualizar e-mail", "Clear search": "Limpar pesquisa", "Unread only": "Apenas não lidos", "Inbox": "Caixa de entrada", "Sent": "Enviados", "Trash": "Lixeira", "All folders": "Todas as pastas", "Manage folders": "Gerenciar pastas", "Account": "Conta", "Mail folders": "Pastas de e-mail", "Back to messages": "Voltar às mensagens", "Loading messages…": "Carregando mensagens…", "Loading message…": "Carregando mensagem…", "Select a message": "Selecione uma mensagem", "No messages on this page.": "Não há mensagens nesta página.", "Previous page": "Página anterior", "Next page": "Próxima página", "Email drafts": "Rascunhos de e-mail", "Local drafts": "Rascunhos locais", "Refresh list": "Atualizar lista", "Save draft": "Salvar rascunho", "Confirm send": "Confirmar envio", "Cancel review": "Cancelar revisão", "Email features": "Funções de e-mail", "Mailbox": "Caixa de correio", "Drafts": "Rascunhos", "Accounts": "Contas", "Recipient rules": "Regras de destinatários", "Mail tasks": "Tarefas de e-mail", "Compose": "Redigir", "Email": "E-mail", "Read, reply and manage drafts.": "Leia, responda e gerencie rascunhos.", "From: ": "De: ", "Subject: ": "Assunto: ", "To: ": "Para: ", "Attachments": "Anexos", "Download attachment": "Baixar anexo", "Reply in drafts": "Responder nos rascunhos", "Reply all in drafts": "Responder a todos nos rascunhos", "Not sent": "Não enviado", "Scheduled": "Agendado", "Submitting…": "Enviando…", "Confirm scheduled send": "Confirmar envio agendado", "No attachments": "Sem anexos", "Review before sending": "Revisar antes de enviar", "Needs confirmation": "Requer confirmação", "No match": "Sem correspondência", "Check matches (no email sent)": "Verificar correspondências (nenhum e-mail)", "Mail-triggered tasks": "Tarefas acionadas por e-mail", "Receiving account": "Conta de recebimento", "Receiving folder": "Pasta de recebimento", "Enable mail tasks": "Ativar tarefas de e-mail", "Save task settings": "Salvar configurações", "Check now": "Verificar agora", "Task records": "Registros de tarefas" },
            ru: { "Cancel": "Отмена", "Retry": "Повторить", "Delete": "Удалить", "Close": "Закрыть", "Search": "Поиск", "Refresh mail": "Обновить почту", "Clear search": "Очистить поиск", "Unread only": "Только непрочитанные", "Inbox": "Входящие", "Sent": "Отправленные", "Trash": "Корзина", "All folders": "Все папки", "Manage folders": "Управление папками", "Account": "Аккаунт", "Mail folders": "Почтовые папки", "Back to messages": "Назад к письмам", "Loading messages…": "Загрузка писем…", "Loading message…": "Загрузка письма…", "Select a message": "Выберите письмо", "No messages on this page.": "На этой странице нет писем.", "Previous page": "Предыдущая страница", "Next page": "Следующая страница", "Email drafts": "Черновики писем", "Local drafts": "Локальные черновики", "Refresh list": "Обновить список", "Save draft": "Сохранить черновик", "Confirm send": "Подтвердить отправку", "Cancel review": "Отменить проверку", "Email features": "Возможности почты", "Mailbox": "Почтовый ящик", "Drafts": "Черновики", "Accounts": "Аккаунты", "Recipient rules": "Правила получателей", "Mail tasks": "Почтовые задачи", "Compose": "Написать", "Email": "Почта", "Read, reply and manage drafts.": "Читайте, отвечайте и управляйте черновиками.", "From: ": "От: ", "Subject: ": "Тема: ", "To: ": "Кому: ", "Attachments": "Вложения", "Download attachment": "Скачать вложение", "Reply in drafts": "Ответить в черновике", "Reply all in drafts": "Ответить всем в черновике", "Not sent": "Не отправлено", "Scheduled": "Запланировано", "Submitting…": "Отправка…", "Confirm scheduled send": "Подтвердить запланированную отправку", "No attachments": "Нет вложений", "Review before sending": "Проверить перед отправкой", "Needs confirmation": "Требуется подтверждение", "No match": "Нет совпадений", "Check matches (no email sent)": "Проверить совпадения (без отправки)", "Mail-triggered tasks": "Задачи, запущенные письмом", "Receiving account": "Аккаунт получения", "Receiving folder": "Папка получения", "Enable mail tasks": "Включить почтовые задачи", "Save task settings": "Сохранить настройки задач", "Check now": "Проверить сейчас", "Task records": "Журнал задач" },
        };
        // The inline phrases that the first-pass table did not cover. dt() texts are
        // the mailbox workbench's own copy, so a translated UI would still fall back
        // to English without this layer. Keys are the exact English source strings:
        // leading/trailing spaces join concatenated fragments and must not move.
        const INLINE_LOCALE_COMPLETION = {
            es: {
                "Enter the custom proxy URL.": "Escribe la dirección del proxy personalizado.",
                "Create a Desktop app OAuth client in Google Cloud, enable Gmail mail consent and add your account as a test user. Complete sign-in in your browser; no mailbox password is needed.": "Crea un cliente OAuth de tipo «Desktop app» en Google Cloud, habilita el consentimiento de Gmail y añade tu cuenta como usuario de prueba. El inicio de sesión se completa en el navegador; no hace falta la contraseña del buzón.",
                "Google client secret (if issued)": "Secreto de cliente de Google (si se emitió)",
                "Saved; leave unchanged to keep": "Guardado; déjalo igual para conservarlo",
                "Open Google authorization; this panel updates after sign-in.": "Abre la autorización de Google; este panel se actualiza al iniciar sesión.",
                "Enter your Google Desktop app client ID. App passwords remain available where your account policy permits.": "Introduce el ID de cliente de tu aplicación de escritorio de Google. Las contraseñas de aplicación siguen disponibles si la política de tu cuenta lo permite.",
                "Sign in with Google": "Iniciar sesión con Google",
                "API connected · ": "API conectada · ",
                "POP3 connected · ": "POP3 conectado · ",
                "; SMTP sending was not tested": "; no se probó el envío por SMTP",
                "Incoming protocol": "Protocolo de recepción",
                "POP3 reads the inbox and uses SMTP for sending. Server read/star flags and a Sent folder are unavailable; search shows its scan coverage.": "POP3 lee la bandeja de entrada y usa SMTP para enviar. No hay marcas de leído/destacado ni carpeta de Enviados en el servidor; la búsqueda indica su cobertura.",
                "POP3 incoming server": "Servidor de entrada POP3",
                "SMTP outgoing server (optional for receiving)": "Servidor de salida SMTP (opcional para recibir)",
                "POP3 host": "Host POP3",
                "SMTP host": "Host SMTP",
                "POP3 port": "Puerto POP3",
                "SMTP port": "Puerto SMTP",
                "TLS is off: POP3 login and content use plaintext. Use only with a trusted server where plaintext is intended. This is not STARTTLS.": "TLS está desactivado: el inicio de sesión y el contenido POP3 viajan sin cifrar. Úsalo solo con un servidor de confianza donde el texto plano sea intencionado. Esto no es STARTTLS.",
                "Google OAuth requires your own Desktop app client; app-password availability depends on account policy.": "Google OAuth requiere tu propio cliente de aplicación de escritorio; la disponibilidad de contraseñas de aplicación depende de la política de la cuenta.",
                "Connection routing": "Enrutamiento de la conexión",
                "Follow global or environment settings": "Seguir la configuración global o del entorno",
                "Connect directly (ignore proxies)": "Conectar directamente (ignorar proxies)",
                "Custom proxy": "Proxy personalizado",
                "Custom proxy URL": "Dirección del proxy personalizado",
                "Saved; leave blank to retain": "Guardado; déjalo vacío para conservarlo",
                "Applies to IMAP and SMTP. Supports HTTP CONNECT, HTTPS and SOCKS. Saved URLs may contain passwords and are not displayed. POP3 receiving still connects directly.": "Se aplica a IMAP y SMTP. Compatible con HTTP CONNECT, HTTPS y SOCKS. Las direcciones guardadas pueden contener contraseñas y no se muestran. La recepción POP3 sigue conectando directamente.",
                "API key; leave blank to retain saved key": "Clave de API; déjala vacía para conservar la guardada",
                "Use an API key from the AgentMail console. The key is stored in the local account configuration; the DSH backend calls the selected region.": "Usa una clave de API de la consola de AgentMail. La clave se guarda en la configuración local de la cuenta; el backend de DSH llama a la región seleccionada.",
                "Mailbox action failed": "La operación del buzón ha fallado",
                "Mailbox workbench": "Área de trabajo del buzón",
                "Moved ": "Se han movido ",
                " messages to ": " mensajes a ",
                "Undo move": "Deshacer el movimiento",
                "To restore, move the messages back in your mail client.": "Para restaurarlos, vuelve a mover los mensajes en tu cliente de correo.",
                "Dismiss": "Descartar",
                "Check account settings": "Revisar la configuración de la cuenta",
                "Loading accounts…": "Cargando cuentas…",
                "Mailbox unavailable": "Buzón no disponible",
                "Connect your mailbox": "Conecta tu buzón",
                "Account settings": "Configuración de la cuenta",
                "Add and test an email account to read and reply here.": "Añade y prueba una cuenta de correo para leer y responder aquí.",
                "Accounts and folders": "Cuentas y carpetas",
                "Search current folder": "Buscar en la carpeta actual",
                "Trash is unavailable for this protocol; delete in your mail client.": "La papelera no está disponible con este protocolo; elimina los mensajes en tu cliente de correo.",
                "POP3 inbox · Server read/star flags and a Sent folder are unavailable. Replies open in local Drafts and use SMTP after confirmation.": "Bandeja POP3 · No hay marcas de leído/destacado ni carpeta de Enviados. Las respuestas se abren en Borradores locales y se envían por SMTP tras confirmarlas.",
                "Select page": "Seleccionar página",
                "Move to Trash (": "Mover a la papelera (",
                ")": ")",
                "Select message: ": "Seleccionar mensaje: ",
                "Unread": "No leído",
                "(No subject)": "(Sin asunto)",
                "Messages could not be loaded": "No se pudieron cargar los mensajes",
                "No results in the current search window.": "No hay resultados en el rango de búsqueda actual.",
                "This page: ": "Esta página: ",
                " messages": " mensajes",
                " · Ranked by relevance": " · Ordenado por relevancia",
                " · Mailbox arrival order": " · Orden de llegada al buzón",
                "Add and test an account in settings to browse mail.": "Añade y prueba una cuenta en la configuración para explorar el correo.",
                "Headers scanned: ": "Encabezados escaneados: ",
                "; headers fully covered; body search has a separate limit.": "; los encabezados están completos; la búsqueda en el cuerpo tiene otro límite.",
                "; folder coverage is partial.": "; la cobertura de la carpeta es parcial.",
                "Bodies scanned: ": "Cuerpos escaneados: ",
                " messages; limit ": " mensajes; límite ",
                "; bounded by the body display limit.": "; limitado por el máximo de visualización del cuerpo.",
                "AgentMail ranks results by relevance and excludes spam, trash and other protected mail.": "AgentMail ordena los resultados por relevancia y excluye el spam, la papelera y otros correos protegidos.",
                "Page ": "Página ",
                "": "",
                "Search older headers": "Buscar encabezados más antiguos",
                "This message could not be loaded": "No se pudo cargar este mensaje",
                "Open a message to reply in drafts, mark its state or download attachments.": "Abre un mensaje para responder desde borradores, marcar su estado o descargar adjuntos.",
                "Email action failed": "La operación de correo ha fallado",
                "View plain-text alternative": "Ver la alternativa en texto plano",
                "Submitting / check mailbox": "Enviando / comprueba el buzón",
                "Server receipt saved": "Recibo del servidor guardado",
                "Outcome uncertain, check mailbox": "Resultado incierto, comprueba el buzón",
                "Draft saved. No email was sent.": "Borrador guardado. No se envió ningún correo.",
                "Scheduled for: ": "Programado para: ",
                "A recipient is blocked. Change the draft or recipient rules before sending.": "Hay un destinatario bloqueado. Cambia el borrador o las reglas de destinatarios antes de enviar.",
                "Blocked: ": "Bloqueado: ",
                "Matches a trusted rule": "Coincide con una regla de confianza",
                "(Empty body)": "(Cuerpo vacío)",
                "Download to check": "Descargar para comprobar",
                "Attachments are fixed to this preview. Review again after 10 minutes or when the draft, account or rules change.": "Los adjuntos quedan fijados a esta vista previa. Vuelve a revisar tras 10 minutos o si cambian el borrador, la cuenta o las reglas.",
                "I checked the sender, all recipients, content and attachments": "He revisado el remitente, todos los destinatarios, el contenido y los adjuntos",
                "Review cancelled. No email was sent.": "Revisión cancelada. No se envió ningún correo.",
                "Drafts stay on this device. Ask the model to prepare one with email_draft, then edit, save and confirm here.": "Los borradores se quedan en este dispositivo. Pide al modelo que prepare uno con email_draft y luego edítalo, guárdalo y confírmalo aquí.",
                "The current draft has unsaved edits.": "El borrador actual tiene cambios sin guardar.",
                "Save and switch": "Guardar y cambiar",
                "Discard edits and switch": "Descartar cambios y cambiar",
                "Keep editing": "Seguir editando",
                "Reopen saved version": "Reabrir la versión guardada",
                "Back to drafts": "Volver a los borradores",
                "Untitled draft": "Borrador sin título",
                "No account selected": "Ninguna cuenta seleccionada",
                "Unsaved": "Sin guardar",
                "No drafts yet": "Todavía no hay borradores",
                "Choose Compose above to begin.": "Pulsa «Redactar» arriba para empezar.",
                "This draft replies in the original thread and includes a quoted copy. Write above the quote, then review and confirm before sending.": "Este borrador responde en el hilo original e incluye una copia citada. Escribe encima de la cita, revisa y confirma antes de enviar.",
                "Unsaved edits": "Cambios sin guardar",
                "Send time: ": "Hora de envío: ",
                "Cancel schedule and return to draft": "Cancelar la programación y volver al borrador",
                "Sending account": "Cuenta de envío",
                "Choose an account": "Elige una cuenta",
                "Schedule (optional, this device’s timezone)": "Programar (opcional, zona horaria de este dispositivo)",
                "Scheduled send time": "Hora de envío programada",
                "Keep DSH running. Missed times while closed are not sent on restart; uncertain submissions are never retried automatically.": "Mantén DSH en ejecución. Las horas perdidas mientras está cerrado no se envían al reiniciar; los envíos inciertos nunca se reintentan automáticamente.",
                "Body format": "Formato del cuerpo",
                "Plain text": "Texto plano",
                "Formatted HTML": "HTML con formato",
                "Preview and send safe formatting. Plain text is generated when omitted. Scripts and external images are removed.": "Previsualiza y envía formato seguro. Si omites el texto plano, se genera. Se eliminan scripts e imágenes externas.",
                "Remove attachment ": "Quitar el adjunto ",
                "Remove": "Quitar",
                "Add attachments (save edits first; up to 10 files / ": "Añadir adjuntos (guarda antes los cambios; hasta 10 archivos / ",
                " total)": " en total)",
                "Add attachments": "Añadir adjuntos",
                "Attachment exceeds ": "El adjunto supera ",
                "Attachments added. Review before sending.": "Adjuntos añadidos. Revísalos antes de enviar.",
                "Some addresses were rejected. This email will not retry automatically. Server accepted: ": "El servidor rechazó algunas direcciones. Este correo no se reintentará automáticamente. Aceptados por el servidor: ",
                "Server receipt saved. This draft will not send again. Server accepted: ": "Recibo del servidor guardado. Este borrador no se enviará de nuevo. Aceptados por el servidor: ",
                "none": "ninguno",
                "Server rejected: ": "El servidor rechazó: ",
                "This confirms the server response, not delivery to the recipient inbox.": "Esto confirma la respuesta del servidor, no la entrega en la bandeja del destinatario.",
                "No receipt yet. Check your mailbox, then refresh the list. Do not send again.": "Aún no hay recibo. Comprueba tu buzón y luego actualiza la lista. No lo envíes otra vez.",
                "Copy to a new draft": "Copiar a un borrador nuevo",
                "Delete local draft": "Eliminar el borrador local",
                "Copies content and attachments to a new unsent draft. Check the mailbox first if the original was submitted or its result is uncertain.": "Copia el contenido y los adjuntos en un borrador nuevo sin enviar. Si el original se envió o su resultado es incierto, comprueba antes el buzón.",
                "Confirm copy": "Confirmar copia",
                "Deletes this local draft and plugin-uploaded copies. Original files and mailbox messages stay intact.": "Elimina este borrador local y las copias subidas por el complemento. Los archivos originales y los mensajes del buzón no se modifican.",
                "Confirm delete": "Confirmar eliminación",
                "Select a draft or create one to start editing.": "Selecciona un borrador o crea uno para empezar a editar.",
                "Rules saved for this account.": "Reglas guardadas para esta cuenta.",
                "Trusted recipients": "Destinatarios de confianza",
                "Approval is the default. When enabled, email_send skips this plugin's approval only if every To/Cc address matches this account's rules. Host permissions still apply, and drafts still need manual confirmation. Domain rules exclude subdomains.": "La confirmación es lo predeterminado. Si se activa, email_send omite la confirmación del complemento solo cuando todas las direcciones To/Cc coinciden con las reglas de esta cuenta. Los permisos del host siguen aplicándose y los borradores requieren confirmación manual. Las reglas de dominio excluyen los subdominios.",
                "Blocked recipients take precedence over trusted rules, even with send approval off. Blocks also apply to drafts, replies and forwards. Blocked domains match exactly and exclude subdomains.": "Los destinatarios bloqueados prevalecen sobre las reglas de confianza, incluso con la confirmación desactivada. Los bloqueos también se aplican a borradores, respuestas y reenvíos. Los dominios bloqueados coinciden exactamente y excluyen los subdominios.",
                "Trusted reply skipping is off by default and can be enabled in Connection settings. It checks every actual To/Cc for replies, reply-all and forwards; any unmatched recipient still needs confirmation. Use Drafts for manual review if Full Access cannot show a prompt.": "La omisión en respuestas de confianza está desactivada por defecto y se activa en los ajustes de conexión. Comprueba todos los To/Cc reales en respuestas, responder a todos y reenvíos; cualquier destinatario no coincidente sigue necesitando confirmación. Si Full Access no puede mostrar un aviso, usa Borradores para revisar manualmente.",
                "Global send approval is off; blocked-recipient rules still apply.": "La confirmación global de envío está desactivada; las reglas de destinatarios bloqueados siguen aplicándose.",
                "Account for these rules": "Cuenta de estas reglas",
                "Choose a configured account": "Elige una cuenta configurada",
                "Rules have unsaved edits.": "Las reglas tienen cambios sin guardar.",
                "Trusted email addresses (one per line)": "Direcciones de correo de confianza (una por línea)",
                "Trusted domains (one per line, all mailboxes in that domain)": "Dominios de confianza (uno por línea, todos los buzones del dominio)",
                "Blocked email addresses (one per line)": "Direcciones de correo bloqueadas (una por línea)",
                "Blocked domains (one per line)": "Dominios bloqueados (uno por línea)",
                "Skip plugin approval for email_send when all addresses match": "Omitir la confirmación del complemento para email_send cuando todas las direcciones coincidan",
                "Save rules for this account": "Guardar las reglas de esta cuenta",
                "Reload rules": "Recargar las reglas",
                "Unsaved; matching uses the rules you are editing.": "Sin guardar; la comprobación usa las reglas que estás editando.",
                "Only saved rules affect model-initiated sends.": "Solo las reglas guardadas afectan a los envíos iniciados por el modelo.",
                "Try recipients To": "Probar destinatarios To",
                "Try copy Cc": "Probar copia Cc",
                "A recipient is blocked; sending is refused.": "Hay un destinatario bloqueado; se rechaza el envío.",
                "All To/Cc match; plugin approval can be skipped.": "Todos los To/Cc coinciden; se puede omitir la confirmación del complemento.",
                "Plugin approval will remain.": "La confirmación del complemento se mantendrá.",
                "Match: ": "Coincidencia: ",
                "Task operation failed": "La operación de la tarea ha fallado",
                "Loading mail tasks…": "Cargando tareas de correo…",
                "Each line: alias = absolute path to an existing folder": "Cada línea: alias = ruta absoluta a una carpeta existente",
                "Duplicate workspace alias": "Alias de espacio de trabajo duplicado",
                "Saved. The first check establishes a baseline; only later mail can trigger tasks.": "Guardado. La primera comprobación solo crea un punto de partida; solo el correo posterior puede activar tareas.",
                "Starting": "Iniciando",
                "Running": "En ejecución",
                "Waiting for your input in DSH": "Esperando tu confirmación en DSH",
                "Completed": "Completada",
                "Needs attention": "Requiere atención",
                "Submitting reply": "Enviando la respuesta",
                "Replied": "Respondida",
                "Mail outcome uncertain; check sent mail": "Resultado del envío incierto; revisa los enviados",
                "Turn email into a DSH task": "Convierte el correo en una tarea de DSH",
                "Send a task from an authorized mailbox to an approved workspace, then continue the same session by email. Off by default. Tasks use your model and may incur usage; DSH permissions still require your input.": "Envía una tarea desde un buzón autorizado a un espacio de trabajo aprobado y continúa la misma sesión por correo. Desactivado por defecto. Las tareas usan tu modelo y pueden generar consumo; los permisos de DSH siguen requiriendo tu confirmación.",
                "Native task services are unavailable; update DSH to use this feature.": "Los servicios de tareas nativos no están disponibles; actualiza DSH para usar esta función.",
                "Task subject prefix": "Prefijo del asunto de la tarea",
                "Allowed senders (one per line; empty means the mailbox itself)": "Remitentes permitidos (uno por línea; vacío significa el propio buzón)",
                "Workspace aliases (each line: alias = absolute folder path)": "Alias de espacios de trabajo (cada línea: alias = ruta absoluta de carpeta)",
                "work = /home/me/projects/my-project": "work = /home/me/projects/my-project",
                "Tasks can use only saved aliases. Existing sessions must belong to that workspace.": "Las tareas solo pueden usar los alias guardados. Las sesiones existentes deben pertenecer a ese espacio de trabajo.",
                "New key shown once; the old key is invalid. Save your configuration before enabling.": "La nueva clave se muestra una sola vez; la anterior ya no es válida. Guarda la configuración antes de activar.",
                "Rotate task key (pauses tasks)": "Rotar la clave de tareas (pausa las tareas)",
                "Generate task key": "Generar clave de tareas",
                "Copy this email template and keep the key private": "Copia esta plantilla de correo y guarda la clave en privado",
                "Write your task here": "Escribe aquí tu tarea",
                "Hide key": "Ocultar la clave",
                "Subject: dsh:alias or dsh:alias:sessionId. Begin the body with DSH-Key: your-task-key, then write the task. The key authorizes whitelisted senders to start tasks in your approved workspace; keep it private.": "Asunto: dsh:alias o dsh:alias:sessionId. Empieza el cuerpo con DSH-Key: tu-clave-de-tarea y luego escribe la tarea. La clave autoriza a los remitentes de la lista blanca a iniciar tareas en tu espacio aprobado; mantenla en privado.",
                "Automatically email the final result to the authorized sender (no Cc; recipient blocks apply)": "Enviar automáticamente el resultado final al remitente autorizado (sin Cc; se aplican los bloqueos de destinatarios)",
                "Poll interval (seconds)": "Intervalo de comprobación (segundos)",
                "Advanced matching and extraction": "Coincidencia y extracción avanzadas",
                "Rules run after sender and key checks. Use all / any, fields subject / body / from / to / cc, operators contains / equals / regex. Named captures work as ${name} in workspace, session and prompt; ${body} is the body with the key and quoted history removed. Workspace results must match an allowed alias.": "Las reglas se ejecutan tras comprobar el remitente y la clave. Usa all / any, campos subject / body / from / to / cc y operadores contains / equals / regex. Las capturas con nombre funcionan como ${name} en workspace, session y prompt; ${body} es el cuerpo sin la clave ni el historial citado. El resultado del espacio de trabajo debe coincidir con un alias permitido.",
                "Rules (JSON array)": "Reglas (array JSON)",
                "Check finished; see task records below.": "Comprobación terminada; consulta los registros de tareas abajo.",
                "Clear finished task records": "Borrar los registros de tareas terminadas",
                "Keep DSH running. In-progress tasks are not replayed after restart. Handle approvals, timeouts or manual takeover in the original session.": "Mantén DSH en ejecución. Las tareas en curso no se repiten al reiniciar. Gestiona aprobaciones, tiempos de espera o la toma manual en la sesión original.",
                "Session ID": "ID de sesión",
                "Open DSH session": "Abrir la sesión de DSH",
                "No tasks yet. The first check establishes a baseline.": "Todavía no hay tareas. La primera comprobación solo crea un punto de partida.",
                "Retry save": "Reintentar guardado",
                "Show new-mail popups": "Mostrar avisos de correo nuevo",
                "Turning this off hides the popup and stops automatic mail checks. You can still check mail in a conversation. Turning it back on starts with a fresh baseline.": "Al desactivarlo se oculta el aviso y se detienen las comprobaciones automáticas. Aún puedes revisar el correo en una conversación. Al reactivarlo se empieza con un punto de partida nuevo.",
                "Reply quote language": "Idioma de la cita en respuestas",
                "Follow interface; English if unknown": "Seguir la interfaz; inglés si se desconoce",
                "Allow trusted replies without confirmation (off by default)": "Permitir respuestas de confianza sin confirmación (desactivado por defecto)",
                "When enabled, every actual To/Cc in a reply, reply-all or forward must match that account’s trusted rules. Block rules and host permissions still apply.": "Si se activa, todos los To/Cc reales de una respuesta, respuesta a todos o reenvío deben coincidir con las reglas de confianza de esa cuenta. Las reglas de bloqueo y los permisos del host siguen aplicándose.",
                "Quote date timezone (optional)": "Zona horaria de la fecha citada (opcional)",
                "These accounts are managed in the configuration file: ": "Estas cuentas se gestionan en el archivo de configuración: ",
                "You can save general settings here. Accounts and credentials are preserved; add or edit accounts in the configuration accounts map.": "Aquí puedes guardar los ajustes generales. Las cuentas y credenciales se conservan; añade o edita cuentas en el mapa accounts de la configuración.",
                " messages\n": " mensajes\n",
                "Manage custom IMAP folders. Purge requires preview and confirmation, affects reviewed messages only, and requires UIDPLUS (up to 2000 messages). Only empty folders can be deleted. Permanent deletion cannot be undone.": "Gestiona carpetas IMAP personalizadas. El vaciado requiere vista previa y confirmación, afecta solo a los mensajes revisados y necesita UIDPLUS (hasta 2000 mensajes). Solo se pueden eliminar carpetas vacías. El borrado permanente no se puede deshacer.",
                "New folder": "Nueva carpeta",
                "e.g. Tenders": "p. ej. Licitaciones",
                "Create": "Crear",
                "Save": "Guardar",
                "(System folder)": "(Carpeta del sistema)",
                "Rename": "Renombrar",
                "Empty permanently deletes every message in this folder. Continue?": "Vaciar elimina permanentemente todos los mensajes de esta carpeta. ¿Continuar?",
                "Empty": "Vaciar",
                "Delete removes the folder and all its messages forever. Continue?": "Eliminar quita la carpeta y todos sus mensajes para siempre. ¿Continuar?",
                "Move to Trash": "Mover a la papelera",
                "Move the selected messages to the existing folder below. This does not permanently delete them.": "Mueve los mensajes seleccionados a la carpeta existente de abajo. Esto no los elimina permanentemente.",
                "Destination folder": "Carpeta de destino",
                "Detect Trash automatically": "Detectar la papelera automáticamente",
                "Checking messages and folders…": "Comprobando mensajes y carpetas…",
                "Move to: ": "Mover a: ",
                "Confirmation expires in 90 seconds and must be renewed if the mailbox changes. A 5-minute Undo is offered when the server returns destination UIDs.": "La confirmación caduca en 90 segundos y debe renovarse si el buzón cambia. Se ofrece deshacer durante 5 minutos cuando el servidor devuelve los UID de destino.",
                "Moving…": "Moviendo…",
                "Confirm move: ": "Confirmar movimiento: ",
                "Email image": "Imagen del correo",
                "Failed to load; retry available": "No se pudo cargar; puedes reintentar",
                "External image blocked": "Imagen externa bloqueada",
                "Loading…": "Cargando…",
                "View formatted message": "Ver el mensaje con formato",
                "View plain text": "Ver texto plano",
                "External images allowed for this message": "Imágenes externas permitidas para este mensaje",
                "Load external images (": "Cargar imágenes externas (",
                "Retry images": "Reintentar las imágenes",
                "External images are blocked by default. Loading may reveal your reading time and network address to the sender. Consent applies only to this message.": "Las imágenes externas se bloquean por defecto. Cargarlas puede revelar al remitente tu hora de lectura y tu dirección de red. El consentimiento solo afecta a este mensaje.",
                "Body or formatting exceeds the display limit. Some content was omitted; try plain text or your mail client.": "El cuerpo o el formato supera el límite de visualización. Se omitió parte del contenido; prueba el texto plano o tu cliente de correo.",
                "Message details": "Detalles del mensaje",
                "Mark unread": "Marcar como no leído",
                "Mark read": "Marcar como leído",
                "Unstar": "Quitar la estrella",
                "Star": "Destacar",
                "Edit the reply in Drafts. Review and confirm before sending.": "Edita la respuesta en Borradores. Revísala y confírmala antes de enviar.",
            },
            fr: {
                "Enter the custom proxy URL.": "Saisissez l’adresse du proxy personnalisé.",
                "Create a Desktop app OAuth client in Google Cloud, enable Gmail mail consent and add your account as a test user. Complete sign-in in your browser; no mailbox password is needed.": "Créez un client OAuth « Desktop app » dans Google Cloud, activez le consentement Gmail et ajoutez votre compte comme utilisateur de test. La connexion se termine dans le navigateur ; aucun mot de passe de boîte aux lettres n’est nécessaire.",
                "Google client secret (if issued)": "Secret client Google (si fourni)",
                "Saved; leave unchanged to keep": "Enregistré ; laissez tel quel pour conserver",
                "Open Google authorization; this panel updates after sign-in.": "Ouvrez l’autorisation Google ; ce panneau se met à jour après la connexion.",
                "Enter your Google Desktop app client ID. App passwords remain available where your account policy permits.": "Saisissez l’ID client de votre application de bureau Google. Les mots de passe d’application restent disponibles si la stratégie de votre compte le permet.",
                "Sign in with Google": "Se connecter avec Google",
                "API connected · ": "API connectée · ",
                "POP3 connected · ": "POP3 connecté · ",
                "; SMTP sending was not tested": " ; l’envoi SMTP n’a pas été testé",
                "Incoming protocol": "Protocole de réception",
                "POP3 reads the inbox and uses SMTP for sending. Server read/star flags and a Sent folder are unavailable; search shows its scan coverage.": "POP3 lit la boîte de réception et utilise SMTP pour l’envoi. Les indicateurs lu/favori et le dossier Envoyés sont indisponibles ; la recherche indique sa couverture.",
                "POP3 incoming server": "Serveur de réception POP3",
                "SMTP outgoing server (optional for receiving)": "Serveur d’envoi SMTP (facultatif pour la réception)",
                "POP3 host": "Hôte POP3",
                "SMTP host": "Hôte SMTP",
                "POP3 port": "Port POP3",
                "SMTP port": "Port SMTP",
                "TLS is off: POP3 login and content use plaintext. Use only with a trusted server where plaintext is intended. This is not STARTTLS.": "TLS est désactivé : l’authentification et le contenu POP3 circulent en clair. À réserver à un serveur de confiance où le clair est voulu. Ce n’est pas STARTTLS.",
                "Google OAuth requires your own Desktop app client; app-password availability depends on account policy.": "Google OAuth nécessite votre propre client d’application de bureau ; la disponibilité des mots de passe d’application dépend de la stratégie du compte.",
                "Connection routing": "Routage de la connexion",
                "Follow global or environment settings": "Suivre les paramètres globaux ou d’environnement",
                "Connect directly (ignore proxies)": "Se connecter directement (ignorer les proxys)",
                "Custom proxy": "Proxy personnalisé",
                "Custom proxy URL": "Adresse du proxy personnalisé",
                "Saved; leave blank to retain": "Enregistré ; laissez vide pour conserver",
                "Applies to IMAP and SMTP. Supports HTTP CONNECT, HTTPS and SOCKS. Saved URLs may contain passwords and are not displayed. POP3 receiving still connects directly.": "S’applique à IMAP et SMTP. Prend en charge HTTP CONNECT, HTTPS et SOCKS. Les adresses enregistrées peuvent contenir des mots de passe et ne sont pas affichées. La réception POP3 reste directe.",
                "API key; leave blank to retain saved key": "Clé d’API ; laissez vide pour conserver la clé enregistrée",
                "Use an API key from the AgentMail console. The key is stored in the local account configuration; the DSH backend calls the selected region.": "Utilisez une clé d’API de la console AgentMail. La clé est stockée dans la configuration locale du compte ; le backend DSH appelle la région choisie.",
                "Mailbox action failed": "L’opération sur la boîte aux lettres a échoué",
                "Mailbox workbench": "Espace de travail de la boîte aux lettres",
                "Moved ": "Déplacé ",
                " messages to ": " messages vers ",
                "Undo move": "Annuler le déplacement",
                "To restore, move the messages back in your mail client.": "Pour les restaurer, replacez les messages dans votre client de messagerie.",
                "Dismiss": "Ignorer",
                "Check account settings": "Vérifier les paramètres du compte",
                "Loading accounts…": "Chargement des comptes…",
                "Mailbox unavailable": "Boîte aux lettres indisponible",
                "Connect your mailbox": "Connectez votre boîte aux lettres",
                "Account settings": "Paramètres du compte",
                "Add and test an email account to read and reply here.": "Ajoutez et testez un compte de messagerie pour lire et répondre ici.",
                "Accounts and folders": "Comptes et dossiers",
                "Search current folder": "Rechercher dans le dossier actuel",
                "Trash is unavailable for this protocol; delete in your mail client.": "La corbeille n’est pas disponible avec ce protocole ; supprimez les messages dans votre client de messagerie.",
                "POP3 inbox · Server read/star flags and a Sent folder are unavailable. Replies open in local Drafts and use SMTP after confirmation.": "Boîte de réception POP3 · Les indicateurs lu/favori et le dossier Envoyés sont indisponibles. Les réponses s’ouvrent dans les brouillons locaux et partent en SMTP après confirmation.",
                "Select page": "Sélectionner la page",
                "Move to Trash (": "Mettre à la corbeille (",
                ")": ")",
                "Select message: ": "Sélectionner le message : ",
                "Unread": "Non lu",
                "(No subject)": "(Sans objet)",
                "Messages could not be loaded": "Les messages n’ont pas pu être chargés",
                "No results in the current search window.": "Aucun résultat dans la fenêtre de recherche actuelle.",
                "This page: ": "Cette page : ",
                " messages": " messages",
                " · Ranked by relevance": " · Classé par pertinence",
                " · Mailbox arrival order": " · Ordre d’arrivée dans la boîte",
                "Add and test an account in settings to browse mail.": "Ajoutez et testez un compte dans les paramètres pour parcourir les messages.",
                "Headers scanned: ": "En-têtes analysés : ",
                "; headers fully covered; body search has a separate limit.": " ; les en-têtes sont couverts intégralement ; la recherche dans le corps a une limite distincte.",
                "; folder coverage is partial.": " ; la couverture du dossier est partielle.",
                "Bodies scanned: ": "Corps analysés : ",
                " messages; limit ": " messages ; limite ",
                "; bounded by the body display limit.": " ; limité par la taille d’affichage du corps.",
                "AgentMail ranks results by relevance and excludes spam, trash and other protected mail.": "AgentMail classe les résultats par pertinence et exclut le spam, la corbeille et les autres messages protégés.",
                "Page ": "Page ",
                "": "",
                "Search older headers": "Rechercher des en-têtes plus anciens",
                "This message could not be loaded": "Ce message n’a pas pu être chargé",
                "Open a message to reply in drafts, mark its state or download attachments.": "Ouvrez un message pour y répondre dans les brouillons, changer son état ou télécharger les pièces jointes.",
                "Email action failed": "L’opération de messagerie a échoué",
                "View plain-text alternative": "Voir la version en texte brut",
                "Submitting / check mailbox": "Envoi en cours / vérifiez la boîte",
                "Server receipt saved": "Accusé du serveur enregistré",
                "Outcome uncertain, check mailbox": "Résultat incertain, vérifiez la boîte",
                "Draft saved. No email was sent.": "Brouillon enregistré. Aucun e-mail n’a été envoyé.",
                "Scheduled for: ": "Programmé pour : ",
                "A recipient is blocked. Change the draft or recipient rules before sending.": "Un destinataire est bloqué. Modifiez le brouillon ou les règles de destinataires avant l’envoi.",
                "Blocked: ": "Bloqué : ",
                "Matches a trusted rule": "Correspond à une règle de confiance",
                "(Empty body)": "(Corps vide)",
                "Download to check": "Télécharger pour vérifier",
                "Attachments are fixed to this preview. Review again after 10 minutes or when the draft, account or rules change.": "Les pièces jointes sont figées dans cet aperçu. Vérifiez à nouveau après 10 minutes ou si le brouillon, le compte ou les règles changent.",
                "I checked the sender, all recipients, content and attachments": "J’ai vérifié l’expéditeur, tous les destinataires, le contenu et les pièces jointes",
                "Review cancelled. No email was sent.": "Vérification annulée. Aucun e-mail n’a été envoyé.",
                "Drafts stay on this device. Ask the model to prepare one with email_draft, then edit, save and confirm here.": "Les brouillons restent sur cet appareil. Demandez au modèle d’en préparer un avec email_draft, puis modifiez, enregistrez et confirmez ici.",
                "The current draft has unsaved edits.": "Le brouillon actuel contient des modifications non enregistrées.",
                "Save and switch": "Enregistrer et changer",
                "Discard edits and switch": "Abandonner les modifications et changer",
                "Keep editing": "Continuer la modification",
                "Reopen saved version": "Rouvrir la version enregistrée",
                "Back to drafts": "Retour aux brouillons",
                "Untitled draft": "Brouillon sans titre",
                "No account selected": "Aucun compte sélectionné",
                "Unsaved": "Non enregistré",
                "No drafts yet": "Aucun brouillon pour le moment",
                "Choose Compose above to begin.": "Cliquez sur « Rédiger » ci-dessus pour commencer.",
                "This draft replies in the original thread and includes a quoted copy. Write above the quote, then review and confirm before sending.": "Ce brouillon répond dans le fil d’origine et inclut une copie citée. Écrivez au-dessus de la citation, puis vérifiez et confirmez avant l’envoi.",
                "Unsaved edits": "Modifications non enregistrées",
                "Send time: ": "Heure d’envoi : ",
                "Cancel schedule and return to draft": "Annuler la programmation et revenir au brouillon",
                "Sending account": "Compte d’envoi",
                "Choose an account": "Choisissez un compte",
                "Schedule (optional, this device’s timezone)": "Programmer (facultatif, fuseau horaire de cet appareil)",
                "Scheduled send time": "Heure d’envoi programmée",
                "Keep DSH running. Missed times while closed are not sent on restart; uncertain submissions are never retried automatically.": "Gardez DSH en cours d’exécution. Les heures manquées pendant l’arrêt ne sont pas rattrapées au redémarrage ; les envois incertains ne sont jamais réessayés automatiquement.",
                "Body format": "Format du corps",
                "Plain text": "Texte brut",
                "Formatted HTML": "HTML mis en forme",
                "Preview and send safe formatting. Plain text is generated when omitted. Scripts and external images are removed.": "Prévisualisez et envoyez une mise en forme sûre. Le texte brut est généré s’il est omis. Les scripts et images externes sont supprimés.",
                "Remove attachment ": "Retirer la pièce jointe ",
                "Remove": "Retirer",
                "Add attachments (save edits first; up to 10 files / ": "Ajouter des pièces jointes (enregistrez d’abord ; jusqu’à 10 fichiers / ",
                " total)": " au total)",
                "Add attachments": "Ajouter des pièces jointes",
                "Attachment exceeds ": "La pièce jointe dépasse ",
                "Attachments added. Review before sending.": "Pièces jointes ajoutées. Vérifiez avant l’envoi.",
                "Some addresses were rejected. This email will not retry automatically. Server accepted: ": "Certaines adresses ont été refusées. Cet e-mail ne sera pas réessayé automatiquement. Acceptées par le serveur : ",
                "Server receipt saved. This draft will not send again. Server accepted: ": "Accusé du serveur enregistré. Ce brouillon ne sera plus envoyé. Acceptées par le serveur : ",
                "none": "aucun",
                "Server rejected: ": "Refusés par le serveur : ",
                "This confirms the server response, not delivery to the recipient inbox.": "Cela confirme la réponse du serveur, pas la remise dans la boîte du destinataire.",
                "No receipt yet. Check your mailbox, then refresh the list. Do not send again.": "Pas encore d’accusé. Vérifiez votre boîte, puis actualisez la liste. Ne renvoyez pas.",
                "Copy to a new draft": "Copier dans un nouveau brouillon",
                "Delete local draft": "Supprimer le brouillon local",
                "Copies content and attachments to a new unsent draft. Check the mailbox first if the original was submitted or its result is uncertain.": "Copie le contenu et les pièces jointes dans un nouveau brouillon non envoyé. Vérifiez d’abord la boîte si l’original a été soumis ou si son résultat est incertain.",
                "Confirm copy": "Confirmer la copie",
                "Deletes this local draft and plugin-uploaded copies. Original files and mailbox messages stay intact.": "Supprime ce brouillon local et les copies téléversées par le module. Les fichiers d’origine et les messages de la boîte restent intacts.",
                "Confirm delete": "Confirmer la suppression",
                "Select a draft or create one to start editing.": "Sélectionnez un brouillon ou créez-en un pour commencer.",
                "Rules saved for this account.": "Règles enregistrées pour ce compte.",
                "Trusted recipients": "Destinataires de confiance",
                "Approval is the default. When enabled, email_send skips this plugin's approval only if every To/Cc address matches this account's rules. Host permissions still apply, and drafts still need manual confirmation. Domain rules exclude subdomains.": "La confirmation est le comportement par défaut. Une fois activée, email_send n’omet la confirmation du module que si toutes les adresses To/Cc correspondent aux règles de ce compte. Les autorisations de l’hôte s’appliquent toujours et les brouillons exigent une confirmation manuelle. Les règles de domaine excluent les sous-domaines.",
                "Blocked recipients take precedence over trusted rules, even with send approval off. Blocks also apply to drafts, replies and forwards. Blocked domains match exactly and exclude subdomains.": "Les destinataires bloqués priment sur les règles de confiance, même si la confirmation est désactivée. Les blocages s’appliquent aussi aux brouillons, réponses et transferts. Les domaines bloqués correspondent exactement et excluent les sous-domaines.",
                "Trusted reply skipping is off by default and can be enabled in Connection settings. It checks every actual To/Cc for replies, reply-all and forwards; any unmatched recipient still needs confirmation. Use Drafts for manual review if Full Access cannot show a prompt.": "L’omission pour les réponses de confiance est désactivée par défaut et s’active dans les paramètres de connexion. Elle vérifie tous les To/Cc réels des réponses, réponses à tous et transferts ; tout destinataire non correspondant exige encore une confirmation. Si Full Access ne peut pas afficher d’invite, passez par Brouillons.",
                "Global send approval is off; blocked-recipient rules still apply.": "La confirmation globale d’envoi est désactivée ; les règles de blocage restent appliquées.",
                "Account for these rules": "Compte concerné par ces règles",
                "Choose a configured account": "Choisissez un compte configuré",
                "Rules have unsaved edits.": "Les règles contiennent des modifications non enregistrées.",
                "Trusted email addresses (one per line)": "Adresses e-mail de confiance (une par ligne)",
                "Trusted domains (one per line, all mailboxes in that domain)": "Domaines de confiance (un par ligne, toutes les boîtes du domaine)",
                "Blocked email addresses (one per line)": "Adresses e-mail bloquées (une par ligne)",
                "Blocked domains (one per line)": "Domaines bloqués (un par ligne)",
                "Skip plugin approval for email_send when all addresses match": "Omettre la confirmation du module pour email_send lorsque toutes les adresses correspondent",
                "Save rules for this account": "Enregistrer les règles de ce compte",
                "Reload rules": "Recharger les règles",
                "Unsaved; matching uses the rules you are editing.": "Non enregistré ; la vérification utilise les règles en cours d’édition.",
                "Only saved rules affect model-initiated sends.": "Seules les règles enregistrées s’appliquent aux envois lancés par le modèle.",
                "Try recipients To": "Tester les destinataires To",
                "Try copy Cc": "Tester la copie Cc",
                "A recipient is blocked; sending is refused.": "Un destinataire est bloqué ; l’envoi est refusé.",
                "All To/Cc match; plugin approval can be skipped.": "Tous les To/Cc correspondent ; la confirmation du module peut être omise.",
                "Plugin approval will remain.": "La confirmation du module reste requise.",
                "Match: ": "Correspondance : ",
                "Task operation failed": "L’opération de tâche a échoué",
                "Loading mail tasks…": "Chargement des tâches de messagerie…",
                "Each line: alias = absolute path to an existing folder": "Chaque ligne : alias = chemin absolu vers un dossier existant",
                "Duplicate workspace alias": "Alias d’espace de travail en double",
                "Saved. The first check establishes a baseline; only later mail can trigger tasks.": "Enregistré. La première vérification établit un point de départ ; seuls les messages ultérieurs peuvent déclencher des tâches.",
                "Starting": "Démarrage",
                "Running": "En cours",
                "Waiting for your input in DSH": "En attente de votre validation dans DSH",
                "Completed": "Terminée",
                "Needs attention": "Nécessite votre attention",
                "Submitting reply": "Envoi de la réponse",
                "Replied": "Répondu",
                "Mail outcome uncertain; check sent mail": "Résultat d’envoi incertain ; vérifiez les éléments envoyés",
                "Turn email into a DSH task": "Transformer un e-mail en tâche DSH",
                "Send a task from an authorized mailbox to an approved workspace, then continue the same session by email. Off by default. Tasks use your model and may incur usage; DSH permissions still require your input.": "Envoyez une tâche depuis une boîte autorisée vers un espace de travail approuvé, puis poursuivez la même session par e-mail. Désactivé par défaut. Les tâches utilisent votre modèle et peuvent consommer des ressources ; les autorisations DSH demandent toujours votre validation.",
                "Native task services are unavailable; update DSH to use this feature.": "Les services de tâches natifs sont indisponibles ; mettez à jour DSH pour utiliser cette fonction.",
                "Task subject prefix": "Préfixe d’objet des tâches",
                "Allowed senders (one per line; empty means the mailbox itself)": "Expéditeurs autorisés (un par ligne ; vide = la boîte elle-même)",
                "Workspace aliases (each line: alias = absolute folder path)": "Alias d’espaces de travail (chaque ligne : alias = chemin absolu de dossier)",
                "work = /home/me/projects/my-project": "work = /home/me/projects/my-project",
                "Tasks can use only saved aliases. Existing sessions must belong to that workspace.": "Les tâches ne peuvent utiliser que les alias enregistrés. Les sessions existantes doivent appartenir à cet espace de travail.",
                "New key shown once; the old key is invalid. Save your configuration before enabling.": "La nouvelle clé n’est affichée qu’une fois ; l’ancienne est invalide. Enregistrez la configuration avant d’activer.",
                "Rotate task key (pauses tasks)": "Renouveler la clé des tâches (met les tâches en pause)",
                "Generate task key": "Générer une clé de tâches",
                "Copy this email template and keep the key private": "Copiez ce modèle d’e-mail et gardez la clé confidentielle",
                "Write your task here": "Écrivez votre tâche ici",
                "Hide key": "Masquer la clé",
                "Subject: dsh:alias or dsh:alias:sessionId. Begin the body with DSH-Key: your-task-key, then write the task. The key authorizes whitelisted senders to start tasks in your approved workspace; keep it private.": "Objet : dsh:alias ou dsh:alias:sessionId. Commencez le corps par DSH-Key: votre-clé-de-tâche, puis écrivez la tâche. La clé autorise les expéditeurs de la liste blanche à lancer des tâches dans votre espace approuvé ; gardez-la confidentielle.",
                "Automatically email the final result to the authorized sender (no Cc; recipient blocks apply)": "Envoyer automatiquement le résultat final à l’expéditeur autorisé (sans Cc ; les blocages de destinataires s’appliquent)",
                "Poll interval (seconds)": "Intervalle de vérification (secondes)",
                "Advanced matching and extraction": "Correspondance et extraction avancées",
                "Rules run after sender and key checks. Use all / any, fields subject / body / from / to / cc, operators contains / equals / regex. Named captures work as ${name} in workspace, session and prompt; ${body} is the body with the key and quoted history removed. Workspace results must match an allowed alias.": "Les règles s’exécutent après vérification de l’expéditeur et de la clé. Utilisez all / any, les champs subject / body / from / to / cc, les opérateurs contains / equals / regex. Les captures nommées s’utilisent comme ${name} dans workspace, session et prompt ; ${body} est le corps sans la clé ni l’historique cité. Le résultat d’espace de travail doit correspondre à un alias autorisé.",
                "Rules (JSON array)": "Règles (tableau JSON)",
                "Check finished; see task records below.": "Vérification terminée ; voir les enregistrements de tâches ci-dessous.",
                "Clear finished task records": "Effacer les enregistrements de tâches terminées",
                "Keep DSH running. In-progress tasks are not replayed after restart. Handle approvals, timeouts or manual takeover in the original session.": "Gardez DSH en cours d’exécution. Les tâches en cours ne sont pas rejouées après redémarrage. Gérez les validations, délais ou reprises manuelles dans la session d’origine.",
                "Session ID": "ID de session",
                "Open DSH session": "Ouvrir la session DSH",
                "No tasks yet. The first check establishes a baseline.": "Aucune tâche pour le moment. La première vérification établit un point de départ.",
                "Retry save": "Réessayer l’enregistrement",
                "Show new-mail popups": "Afficher les notifications de nouveau message",
                "Turning this off hides the popup and stops automatic mail checks. You can still check mail in a conversation. Turning it back on starts with a fresh baseline.": "La désactivation masque la notification et arrête les vérifications automatiques. Vous pouvez toujours consulter le courrier dans une conversation. La réactivation repart d’un nouveau point de départ.",
                "Reply quote language": "Langue de citation des réponses",
                "Follow interface; English if unknown": "Suivre l’interface ; anglais si inconnu",
                "Allow trusted replies without confirmation (off by default)": "Autoriser les réponses de confiance sans confirmation (désactivé par défaut)",
                "When enabled, every actual To/Cc in a reply, reply-all or forward must match that account’s trusted rules. Block rules and host permissions still apply.": "Une fois activé, tous les To/Cc réels d’une réponse, réponse à tous ou transfert doivent correspondre aux règles de confiance de ce compte. Les règles de blocage et les autorisations de l’hôte s’appliquent toujours.",
                "Quote date timezone (optional)": "Fuseau horaire de la date citée (facultatif)",
                "These accounts are managed in the configuration file: ": "Ces comptes sont gérés dans le fichier de configuration : ",
                "You can save general settings here. Accounts and credentials are preserved; add or edit accounts in the configuration accounts map.": "Vous pouvez enregistrer les réglages généraux ici. Les comptes et identifiants sont préservés ; ajoutez ou modifiez des comptes dans la table accounts de la configuration.",
                " messages\n": " messages\n",
                "Manage custom IMAP folders. Purge requires preview and confirmation, affects reviewed messages only, and requires UIDPLUS (up to 2000 messages). Only empty folders can be deleted. Permanent deletion cannot be undone.": "Gérez les dossiers IMAP personnalisés. Le vidage exige un aperçu et une confirmation, ne touche qu’aux messages vérifiés et nécessite UIDPLUS (jusqu’à 2000 messages). Seuls les dossiers vides peuvent être supprimés. La suppression définitive est irréversible.",
                "New folder": "Nouveau dossier",
                "e.g. Tenders": "p. ex. Appels d’offres",
                "Create": "Créer",
                "Save": "Enregistrer",
                "(System folder)": "(Dossier système)",
                "Rename": "Renommer",
                "Empty permanently deletes every message in this folder. Continue?": "Vider supprime définitivement tous les messages de ce dossier. Continuer ?",
                "Empty": "Vider",
                "Delete removes the folder and all its messages forever. Continue?": "Supprimer retire le dossier et tous ses messages définitivement. Continuer ?",
                "Move to Trash": "Mettre à la corbeille",
                "Move the selected messages to the existing folder below. This does not permanently delete them.": "Déplace les messages sélectionnés vers le dossier existant ci-dessous. Cela ne les supprime pas définitivement.",
                "Destination folder": "Dossier de destination",
                "Detect Trash automatically": "Détecter automatiquement la corbeille",
                "Checking messages and folders…": "Vérification des messages et dossiers…",
                "Move to: ": "Déplacer vers : ",
                "Confirmation expires in 90 seconds and must be renewed if the mailbox changes. A 5-minute Undo is offered when the server returns destination UIDs.": "La confirmation expire au bout de 90 secondes et doit être renouvelée si la boîte change. Une annulation de 5 minutes est proposée lorsque le serveur renvoie les UID de destination.",
                "Moving…": "Déplacement…",
                "Confirm move: ": "Confirmer le déplacement : ",
                "Email image": "Image de l’e-mail",
                "Failed to load; retry available": "Échec du chargement ; nouvelle tentative possible",
                "External image blocked": "Image externe bloquée",
                "Loading…": "Chargement…",
                "View formatted message": "Voir le message mis en forme",
                "View plain text": "Voir en texte brut",
                "External images allowed for this message": "Images externes autorisées pour ce message",
                "Load external images (": "Charger les images externes (",
                "Retry images": "Réessayer les images",
                "External images are blocked by default. Loading may reveal your reading time and network address to the sender. Consent applies only to this message.": "Les images externes sont bloquées par défaut. Les charger peut révéler à l’expéditeur votre heure de lecture et votre adresse réseau. Le consentement ne vaut que pour ce message.",
                "Body or formatting exceeds the display limit. Some content was omitted; try plain text or your mail client.": "Le corps ou la mise en forme dépasse la limite d’affichage. Une partie du contenu a été omise ; essayez le texte brut ou votre client de messagerie.",
                "Message details": "Détails du message",
                "Mark unread": "Marquer comme non lu",
                "Mark read": "Marquer comme lu",
                "Unstar": "Retirer l’étoile",
                "Star": "Ajouter une étoile",
                "Edit the reply in Drafts. Review and confirm before sending.": "Modifiez la réponse dans Brouillons. Vérifiez et confirmez avant l’envoi.",
            },
            de: {
                "Enter the custom proxy URL.": "Gib die Adresse des benutzerdefinierten Proxys ein.",
                "Create a Desktop app OAuth client in Google Cloud, enable Gmail mail consent and add your account as a test user. Complete sign-in in your browser; no mailbox password is needed.": "Erstelle in Google Cloud einen OAuth-Client vom Typ „Desktop-App“, aktiviere die Gmail-Berechtigung und füge dein Konto als Testnutzer hinzu. Die Anmeldung erfolgt im Browser; ein Postfachpasswort ist nicht nötig.",
                "Google client secret (if issued)": "Google-Client-Secret (falls ausgestellt)",
                "Saved; leave unchanged to keep": "Gespeichert; unverändert lassen, um es zu behalten",
                "Open Google authorization; this panel updates after sign-in.": "Öffne die Google-Autorisierung; dieser Bereich aktualisiert sich nach der Anmeldung.",
                "Enter your Google Desktop app client ID. App passwords remain available where your account policy permits.": "Gib die Client-ID deiner Google-Desktop-App ein. App-Passwörter bleiben verfügbar, sofern die Kontorichtlinie es zulässt.",
                "Sign in with Google": "Mit Google anmelden",
                "API connected · ": "API verbunden · ",
                "POP3 connected · ": "POP3 verbunden · ",
                "; SMTP sending was not tested": "; SMTP-Versand wurde nicht getestet",
                "Incoming protocol": "Empfangsprotokoll",
                "POP3 reads the inbox and uses SMTP for sending. Server read/star flags and a Sent folder are unavailable; search shows its scan coverage.": "POP3 liest den Posteingang und sendet über SMTP. Gelesen-/Markierungsstatus und der Ordner „Gesendet“ fehlen; die Suche zeigt ihren Abdeckungsbereich.",
                "POP3 incoming server": "POP3-Eingangsserver",
                "SMTP outgoing server (optional for receiving)": "SMTP-Ausgangsserver (optional zum Empfangen)",
                "POP3 host": "POP3-Host",
                "SMTP host": "SMTP-Host",
                "POP3 port": "POP3-Port",
                "SMTP port": "SMTP-Port",
                "TLS is off: POP3 login and content use plaintext. Use only with a trusted server where plaintext is intended. This is not STARTTLS.": "TLS ist aus: POP3-Anmeldung und Inhalte laufen im Klartext. Nur bei einem vertrauenswürdigen Server verwenden, bei dem Klartext beabsichtigt ist. Das ist nicht STARTTLS.",
                "Google OAuth requires your own Desktop app client; app-password availability depends on account policy.": "Google OAuth erfordert einen eigenen Desktop-App-Client; ob App-Passwörter verfügbar sind, hängt von der Kontorichtlinie ab.",
                "Connection routing": "Verbindungsweg",
                "Follow global or environment settings": "Globalen oder Umgebungseinstellungen folgen",
                "Connect directly (ignore proxies)": "Direkt verbinden (Proxys ignorieren)",
                "Custom proxy": "Benutzerdefinierter Proxy",
                "Custom proxy URL": "Adresse des benutzerdefinierten Proxys",
                "Saved; leave blank to retain": "Gespeichert; leer lassen, um es zu behalten",
                "Applies to IMAP and SMTP. Supports HTTP CONNECT, HTTPS and SOCKS. Saved URLs may contain passwords and are not displayed. POP3 receiving still connects directly.": "Gilt für IMAP und SMTP. Unterstützt HTTP CONNECT, HTTPS und SOCKS. Gespeicherte Adressen können Passwörter enthalten und werden nicht angezeigt. POP3-Empfang verbindet weiterhin direkt.",
                "API key; leave blank to retain saved key": "API-Schlüssel; leer lassen, um den gespeicherten zu behalten",
                "Use an API key from the AgentMail console. The key is stored in the local account configuration; the DSH backend calls the selected region.": "Verwende einen API-Schlüssel aus der AgentMail-Konsole. Der Schlüssel wird in der lokalen Kontokonfiguration gespeichert; das DSH-Backend ruft die gewählte Region auf.",
                "Mailbox action failed": "Postfachaktion fehlgeschlagen",
                "Mailbox workbench": "Postfach-Arbeitsbereich",
                "Moved ": "Verschoben: ",
                " messages to ": " Nachrichten nach ",
                "Undo move": "Verschieben rückgängig machen",
                "To restore, move the messages back in your mail client.": "Zum Wiederherstellen verschiebe die Nachrichten in deinem E-Mail-Client zurück.",
                "Dismiss": "Ausblenden",
                "Check account settings": "Kontoeinstellungen prüfen",
                "Loading accounts…": "Konten werden geladen…",
                "Mailbox unavailable": "Postfach nicht verfügbar",
                "Connect your mailbox": "Postfach verbinden",
                "Account settings": "Kontoeinstellungen",
                "Add and test an email account to read and reply here.": "Füge ein E-Mail-Konto hinzu und teste es, um hier zu lesen und zu antworten.",
                "Accounts and folders": "Konten und Ordner",
                "Search current folder": "Im aktuellen Ordner suchen",
                "Trash is unavailable for this protocol; delete in your mail client.": "Der Papierkorb ist mit diesem Protokoll nicht verfügbar; lösche Nachrichten in deinem E-Mail-Client.",
                "POP3 inbox · Server read/star flags and a Sent folder are unavailable. Replies open in local Drafts and use SMTP after confirmation.": "POP3-Posteingang · Gelesen-/Markierungsstatus und der Ordner „Gesendet“ fehlen. Antworten öffnen sich in den lokalen Entwürfen und gehen nach Bestätigung per SMTP raus.",
                "Select page": "Seite auswählen",
                "Move to Trash (": "In den Papierkorb (",
                ")": ")",
                "Select message: ": "Nachricht auswählen: ",
                "Unread": "Ungelesen",
                "(No subject)": "(Kein Betreff)",
                "Messages could not be loaded": "Nachrichten konnten nicht geladen werden",
                "No results in the current search window.": "Keine Treffer im aktuellen Suchbereich.",
                "This page: ": "Diese Seite: ",
                " messages": " Nachrichten",
                " · Ranked by relevance": " · Nach Relevanz sortiert",
                " · Mailbox arrival order": " · Reihenfolge des Posteingangs",
                "Add and test an account in settings to browse mail.": "Füge in den Einstellungen ein Konto hinzu und teste es, um E-Mails zu durchsuchen.",
                "Headers scanned: ": "Scannte Kopfzeilen: ",
                "; headers fully covered; body search has a separate limit.": "; Kopfzeilen vollständig erfasst; die Textsuche hat eine eigene Grenze.",
                "; folder coverage is partial.": "; der Ordner ist nur teilweise erfasst.",
                "Bodies scanned: ": "Scannte Texte: ",
                " messages; limit ": " Nachrichten; Grenze ",
                "; bounded by the body display limit.": "; begrenzt durch die Anzeigegrenze des Textes.",
                "AgentMail ranks results by relevance and excludes spam, trash and other protected mail.": "AgentMail sortiert Treffer nach Relevanz und schließt Spam, Papierkorb und andere geschützte Nachrichten aus.",
                "Page ": "Seite ",
                "": "",
                "Search older headers": "Ältere Kopfzeilen durchsuchen",
                "This message could not be loaded": "Diese Nachricht konnte nicht geladen werden",
                "Open a message to reply in drafts, mark its state or download attachments.": "Öffne eine Nachricht, um in den Entwürfen zu antworten, ihren Status zu setzen oder Anhänge herunterzuladen.",
                "Email action failed": "E-Mail-Aktion fehlgeschlagen",
                "View plain-text alternative": "Nur-Text-Version anzeigen",
                "Submitting / check mailbox": "Wird gesendet / Postfach prüfen",
                "Server receipt saved": "Serverbeleg gespeichert",
                "Outcome uncertain, check mailbox": "Ergebnis unklar, Postfach prüfen",
                "Draft saved. No email was sent.": "Entwurf gespeichert. Es wurde keine E-Mail gesendet.",
                "Scheduled for: ": "Geplant für: ",
                "A recipient is blocked. Change the draft or recipient rules before sending.": "Ein Empfänger ist gesperrt. Ändere den Entwurf oder die Empfängerregeln vor dem Senden.",
                "Blocked: ": "Gesperrt: ",
                "Matches a trusted rule": "Entspricht einer Vertrauensregel",
                "(Empty body)": "(Leerer Text)",
                "Download to check": "Zum Prüfen herunterladen",
                "Attachments are fixed to this preview. Review again after 10 minutes or when the draft, account or rules change.": "Anhänge sind an diese Vorschau gebunden. Prüfe nach 10 Minuten oder bei Änderungen an Entwurf, Konto oder Regeln erneut.",
                "I checked the sender, all recipients, content and attachments": "Ich habe Absender, alle Empfänger, Inhalt und Anhänge geprüft",
                "Review cancelled. No email was sent.": "Prüfung abgebrochen. Es wurde keine E-Mail gesendet.",
                "Drafts stay on this device. Ask the model to prepare one with email_draft, then edit, save and confirm here.": "Entwürfe bleiben auf diesem Gerät. Lass das Modell mit email_draft einen vorbereiten und bearbeite, speichere und bestätige ihn hier.",
                "The current draft has unsaved edits.": "Der aktuelle Entwurf enthält ungespeicherte Änderungen.",
                "Save and switch": "Speichern und wechseln",
                "Discard edits and switch": "Änderungen verwerfen und wechseln",
                "Keep editing": "Weiter bearbeiten",
                "Reopen saved version": "Gespeicherte Version erneut öffnen",
                "Back to drafts": "Zurück zu den Entwürfen",
                "Untitled draft": "Unbenannter Entwurf",
                "No account selected": "Kein Konto ausgewählt",
                "Unsaved": "Ungespeichert",
                "No drafts yet": "Noch keine Entwürfe",
                "Choose Compose above to begin.": "Klicke oben auf „Verfassen“, um zu beginnen.",
                "This draft replies in the original thread and includes a quoted copy. Write above the quote, then review and confirm before sending.": "Dieser Entwurf antwortet im ursprünglichen Thread und enthält ein zitiertes Original. Schreibe über das Zitat, prüfe und bestätige vor dem Senden.",
                "Unsaved edits": "Ungespeicherte Änderungen",
                "Send time: ": "Sendezeit: ",
                "Cancel schedule and return to draft": "Planung abbrechen und zum Entwurf zurückkehren",
                "Sending account": "Sendekonto",
                "Choose an account": "Konto auswählen",
                "Schedule (optional, this device’s timezone)": "Planen (optional, Zeitzone dieses Geräts)",
                "Scheduled send time": "Geplante Sendezeit",
                "Keep DSH running. Missed times while closed are not sent on restart; uncertain submissions are never retried automatically.": "DSH muss laufen. Während der Schließung verpasste Zeiten werden beim Neustart nicht nachgeholt; unklare Sendungen werden nie automatisch wiederholt.",
                "Body format": "Textformat",
                "Plain text": "Nur Text",
                "Formatted HTML": "Formatiertes HTML",
                "Preview and send safe formatting. Plain text is generated when omitted. Scripts and external images are removed.": "Sichere Formatierung ansehen und senden. Fehlt der Nur-Text, wird er erzeugt. Skripte und externe Bilder werden entfernt.",
                "Remove attachment ": "Anhang entfernen: ",
                "Remove": "Entfernen",
                "Add attachments (save edits first; up to 10 files / ": "Anhänge hinzufügen (zuerst speichern; bis zu 10 Dateien / ",
                " total)": " gesamt)",
                "Add attachments": "Anhänge hinzufügen",
                "Attachment exceeds ": "Anhang überschreitet ",
                "Attachments added. Review before sending.": "Anhänge hinzugefügt. Vor dem Senden prüfen.",
                "Some addresses were rejected. This email will not retry automatically. Server accepted: ": "Einige Adressen wurden abgelehnt. Diese E-Mail wird nicht automatisch erneut gesendet. Vom Server angenommen: ",
                "Server receipt saved. This draft will not send again. Server accepted: ": "Serverbeleg gespeichert. Dieser Entwurf wird nicht erneut gesendet. Vom Server angenommen: ",
                "none": "keine",
                "Server rejected: ": "Vom Server abgelehnt: ",
                "This confirms the server response, not delivery to the recipient inbox.": "Das bestätigt die Serverantwort, nicht die Zustellung in den Posteingang des Empfängers.",
                "No receipt yet. Check your mailbox, then refresh the list. Do not send again.": "Noch kein Beleg. Prüfe dein Postfach und aktualisiere dann die Liste. Nicht erneut senden.",
                "Copy to a new draft": "In einen neuen Entwurf kopieren",
                "Delete local draft": "Lokalen Entwurf löschen",
                "Copies content and attachments to a new unsent draft. Check the mailbox first if the original was submitted or its result is uncertain.": "Kopiert Inhalt und Anhänge in einen neuen, ungesendeten Entwurf. Prüfe zuerst das Postfach, wenn das Original gesendet wurde oder das Ergebnis unklar ist.",
                "Confirm copy": "Kopieren bestätigen",
                "Deletes this local draft and plugin-uploaded copies. Original files and mailbox messages stay intact.": "Löscht diesen lokalen Entwurf und vom Plugin hochgeladene Kopien. Originaldateien und Postfachnachrichten bleiben erhalten.",
                "Confirm delete": "Löschen bestätigen",
                "Select a draft or create one to start editing.": "Wähle einen Entwurf aus oder erstelle einen, um zu beginnen.",
                "Rules saved for this account.": "Regeln für dieses Konto gespeichert.",
                "Trusted recipients": "Vertrauenswürdige Empfänger",
                "Approval is the default. When enabled, email_send skips this plugin's approval only if every To/Cc address matches this account's rules. Host permissions still apply, and drafts still need manual confirmation. Domain rules exclude subdomains.": "Die Bestätigung ist der Standard. Wenn aktiviert, überspringt email_send die Plugin-Bestätigung nur, wenn alle To/Cc-Adressen den Regeln dieses Kontos entsprechen. Host-Berechtigungen gelten weiter, Entwürfe brauchen weiterhin eine manuelle Bestätigung. Domänenregeln schließen Subdomänen aus.",
                "Blocked recipients take precedence over trusted rules, even with send approval off. Blocks also apply to drafts, replies and forwards. Blocked domains match exactly and exclude subdomains.": "Gesperrte Empfänger haben Vorrang vor Vertrauensregeln, auch bei ausgeschalteter Sendebestätigung. Sperren gelten auch für Entwürfe, Antworten und Weiterleitungen. Gesperrte Domänen stimmen exakt überein und schließen Subdomänen aus.",
                "Trusted reply skipping is off by default and can be enabled in Connection settings. It checks every actual To/Cc for replies, reply-all and forwards; any unmatched recipient still needs confirmation. Use Drafts for manual review if Full Access cannot show a prompt.": "Das Überspringen bei vertrauenswürdigen Antworten ist standardmäßig aus und lässt sich in den Verbindungseinstellungen aktivieren. Geprüft werden alle tatsächlichen To/Cc bei Antworten, Antworten an alle und Weiterleitungen; jeder nicht passende Empfänger braucht weiterhin eine Bestätigung. Kann Full Access keinen Dialog zeigen, nutze die Entwürfe.",
                "Global send approval is off; blocked-recipient rules still apply.": "Die globale Sendebestätigung ist aus; Regeln für gesperrte Empfänger gelten weiterhin.",
                "Account for these rules": "Konto für diese Regeln",
                "Choose a configured account": "Konfiguriertes Konto auswählen",
                "Rules have unsaved edits.": "Die Regeln enthalten ungespeicherte Änderungen.",
                "Trusted email addresses (one per line)": "Vertrauenswürdige E-Mail-Adressen (eine pro Zeile)",
                "Trusted domains (one per line, all mailboxes in that domain)": "Vertrauenswürdige Domänen (eine pro Zeile, alle Postfächer der Domäne)",
                "Blocked email addresses (one per line)": "Gesperrte E-Mail-Adressen (eine pro Zeile)",
                "Blocked domains (one per line)": "Gesperrte Domänen (eine pro Zeile)",
                "Skip plugin approval for email_send when all addresses match": "Plugin-Bestätigung für email_send überspringen, wenn alle Adressen passen",
                "Save rules for this account": "Regeln für dieses Konto speichern",
                "Reload rules": "Regeln neu laden",
                "Unsaved; matching uses the rules you are editing.": "Ungespeichert; die Prüfung nutzt die Regeln, die du gerade bearbeitest.",
                "Only saved rules affect model-initiated sends.": "Nur gespeicherte Regeln gelten für vom Modell gestartete Sendungen.",
                "Try recipients To": "Empfänger To testen",
                "Try copy Cc": "Kopie Cc testen",
                "A recipient is blocked; sending is refused.": "Ein Empfänger ist gesperrt; das Senden wird abgelehnt.",
                "All To/Cc match; plugin approval can be skipped.": "Alle To/Cc passen; die Plugin-Bestätigung kann entfallen.",
                "Plugin approval will remain.": "Die Plugin-Bestätigung bleibt bestehen.",
                "Match: ": "Treffer: ",
                "Task operation failed": "Aufgabenaktion fehlgeschlagen",
                "Loading mail tasks…": "E-Mail-Aufgaben werden geladen…",
                "Each line: alias = absolute path to an existing folder": "Jede Zeile: Alias = absoluter Pfad zu einem vorhandenen Ordner",
                "Duplicate workspace alias": "Doppelter Arbeitsbereichs-Alias",
                "Saved. The first check establishes a baseline; only later mail can trigger tasks.": "Gespeichert. Die erste Prüfung setzt nur einen Ausgangspunkt; nur spätere E-Mails können Aufgaben auslösen.",
                "Starting": "Wird gestartet",
                "Running": "Läuft",
                "Waiting for your input in DSH": "Wartet auf deine Bestätigung in DSH",
                "Completed": "Abgeschlossen",
                "Needs attention": "Prüfung nötig",
                "Submitting reply": "Antwort wird gesendet",
                "Replied": "Beantwortet",
                "Mail outcome uncertain; check sent mail": "Sendungsergebnis unklar; Gesendetes prüfen",
                "Turn email into a DSH task": "E-Mail in eine DSH-Aufgabe verwandeln",
                "Send a task from an authorized mailbox to an approved workspace, then continue the same session by email. Off by default. Tasks use your model and may incur usage; DSH permissions still require your input.": "Sende eine Aufgabe aus einem autorisierten Postfach an einen freigegebenen Arbeitsbereich und führe dieselbe Sitzung per E-Mail fort. Standardmäßig aus. Aufgaben nutzen dein Modell und können Verbrauch erzeugen; DSH-Berechtigungen verlangen weiterhin deine Bestätigung.",
                "Native task services are unavailable; update DSH to use this feature.": "Native Aufgabendienste sind nicht verfügbar; aktualisiere DSH, um diese Funktion zu nutzen.",
                "Task subject prefix": "Betreff-Präfix für Aufgaben",
                "Allowed senders (one per line; empty means the mailbox itself)": "Erlaubte Absender (einer pro Zeile; leer = das Postfach selbst)",
                "Workspace aliases (each line: alias = absolute folder path)": "Arbeitsbereichs-Aliasnamen (je Zeile: Alias = absoluter Ordnerpfad)",
                "work = /home/me/projects/my-project": "work = /home/me/projects/my-project",
                "Tasks can use only saved aliases. Existing sessions must belong to that workspace.": "Aufgaben können nur gespeicherte Aliasnamen nutzen. Bestehende Sitzungen müssen zu diesem Arbeitsbereich gehören.",
                "New key shown once; the old key is invalid. Save your configuration before enabling.": "Der neue Schlüssel wird nur einmal angezeigt; der alte ist ungültig. Speichere die Konfiguration vor dem Aktivieren.",
                "Rotate task key (pauses tasks)": "Aufgabenschlüssel erneuern (pausiert Aufgaben)",
                "Generate task key": "Aufgabenschlüssel erzeugen",
                "Copy this email template and keep the key private": "Kopiere diese E-Mail-Vorlage und halte den Schlüssel geheim",
                "Write your task here": "Schreibe deine Aufgabe hier",
                "Hide key": "Schlüssel ausblenden",
                "Subject: dsh:alias or dsh:alias:sessionId. Begin the body with DSH-Key: your-task-key, then write the task. The key authorizes whitelisted senders to start tasks in your approved workspace; keep it private.": "Betreff: dsh:alias oder dsh:alias:sessionId. Beginne den Text mit DSH-Key: dein-aufgabenschlüssel und schreibe dann die Aufgabe. Der Schlüssel erlaubt Absendern auf der Positivliste, Aufgaben in deinem freigegebenen Arbeitsbereich zu starten; halte ihn geheim.",
                "Automatically email the final result to the authorized sender (no Cc; recipient blocks apply)": "Das Endergebnis automatisch an den autorisierten Absender mailen (kein Cc; Empfängersperren gelten)",
                "Poll interval (seconds)": "Prüfintervall (Sekunden)",
                "Advanced matching and extraction": "Erweiterte Zuordnung und Extraktion",
                "Rules run after sender and key checks. Use all / any, fields subject / body / from / to / cc, operators contains / equals / regex. Named captures work as ${name} in workspace, session and prompt; ${body} is the body with the key and quoted history removed. Workspace results must match an allowed alias.": "Regeln laufen nach Absender- und Schlüsselprüfung. Nutze all / any, Felder subject / body / from / to / cc, Operatoren contains / equals / regex. Benannte Gruppen wirken als ${name} in workspace, session und prompt; ${body} ist der Text ohne Schlüssel und zitierten Verlauf. Das Arbeitsbereichsergebnis muss einem erlaubten Alias entsprechen.",
                "Rules (JSON array)": "Regeln (JSON-Array)",
                "Check finished; see task records below.": "Prüfung abgeschlossen; siehe Aufgabenprotokolle unten.",
                "Clear finished task records": "Abgeschlossene Aufgabenprotokolle löschen",
                "Keep DSH running. In-progress tasks are not replayed after restart. Handle approvals, timeouts or manual takeover in the original session.": "DSH muss laufen. Laufende Aufgaben werden nach einem Neustart nicht erneut ausgeführt. Bestätigungen, Zeitüberschreitungen oder manuelle Übernahme in der ursprünglichen Sitzung behandeln.",
                "Session ID": "Sitzungs-ID",
                "Open DSH session": "DSH-Sitzung öffnen",
                "No tasks yet. The first check establishes a baseline.": "Noch keine Aufgaben. Die erste Prüfung setzt nur einen Ausgangspunkt.",
                "Retry save": "Speichern erneut versuchen",
                "Show new-mail popups": "Popups für neue E-Mails anzeigen",
                "Turning this off hides the popup and stops automatic mail checks. You can still check mail in a conversation. Turning it back on starts with a fresh baseline.": "Beim Ausschalten wird das Popup ausgeblendet und die automatische Prüfung beendet. In einem Gespräch kannst du weiterhin E-Mails prüfen. Beim Wiedereinschalten startet eine neue Ausgangsbasis.",
                "Reply quote language": "Sprache des Antwortzitats",
                "Follow interface; English if unknown": "Oberfläche folgen; Englisch, wenn unbekannt",
                "Allow trusted replies without confirmation (off by default)": "Vertrauenswürdige Antworten ohne Bestätigung zulassen (standardmäßig aus)",
                "When enabled, every actual To/Cc in a reply, reply-all or forward must match that account’s trusted rules. Block rules and host permissions still apply.": "Wenn aktiviert, müssen alle tatsächlichen To/Cc einer Antwort, Antwort an alle oder Weiterleitung den Vertrauensregeln des Kontos entsprechen. Sperrregeln und Host-Berechtigungen gelten weiterhin.",
                "Quote date timezone (optional)": "Zeitzone des Zitatsdatums (optional)",
                "These accounts are managed in the configuration file: ": "Diese Konten werden in der Konfigurationsdatei verwaltet: ",
                "You can save general settings here. Accounts and credentials are preserved; add or edit accounts in the configuration accounts map.": "Hier kannst du allgemeine Einstellungen speichern. Konten und Zugangsdaten bleiben erhalten; Konten fügst du in der accounts-Map der Konfiguration hinzu oder bearbeitest sie dort.",
                " messages\n": " Nachrichten\n",
                "Manage custom IMAP folders. Purge requires preview and confirmation, affects reviewed messages only, and requires UIDPLUS (up to 2000 messages). Only empty folders can be deleted. Permanent deletion cannot be undone.": "Verwalte benutzerdefinierte IMAP-Ordner. Leeren erfordert Vorschau und Bestätigung, betrifft nur geprüfte Nachrichten und benötigt UIDPLUS (bis zu 2000 Nachrichten). Nur leere Ordner lassen sich löschen. Endgültiges Löschen ist nicht umkehrbar.",
                "New folder": "Neuer Ordner",
                "e.g. Tenders": "z. B. Ausschreibungen",
                "Create": "Erstellen",
                "Save": "Speichern",
                "(System folder)": "(Systemordner)",
                "Rename": "Umbenennen",
                "Empty permanently deletes every message in this folder. Continue?": "Leeren löscht alle Nachrichten in diesem Ordner endgültig. Fortfahren?",
                "Empty": "Leeren",
                "Delete removes the folder and all its messages forever. Continue?": "Löschen entfernt den Ordner und alle seine Nachrichten endgültig. Fortfahren?",
                "Move to Trash": "In den Papierkorb",
                "Move the selected messages to the existing folder below. This does not permanently delete them.": "Verschiebt die ausgewählten Nachrichten in den vorhandenen Ordner unten. Das löscht sie nicht endgültig.",
                "Destination folder": "Zielordner",
                "Detect Trash automatically": "Papierkorb automatisch erkennen",
                "Checking messages and folders…": "Nachrichten und Ordner werden geprüft…",
                "Move to: ": "Verschieben nach: ",
                "Confirmation expires in 90 seconds and must be renewed if the mailbox changes. A 5-minute Undo is offered when the server returns destination UIDs.": "Die Bestätigung läuft nach 90 Sekunden ab und muss bei Änderungen im Postfach erneuert werden. Ein 5-minütiges Rückgängigmachen wird angeboten, wenn der Server Ziel-UIDs zurückgibt.",
                "Moving…": "Wird verschoben…",
                "Confirm move: ": "Verschieben bestätigen: ",
                "Email image": "E-Mail-Bild",
                "Failed to load; retry available": "Laden fehlgeschlagen; erneut versuchen möglich",
                "External image blocked": "Externes Bild blockiert",
                "Loading…": "Wird geladen…",
                "View formatted message": "Formatierte Nachricht anzeigen",
                "View plain text": "Nur-Text anzeigen",
                "External images allowed for this message": "Externe Bilder für diese Nachricht erlaubt",
                "Load external images (": "Externe Bilder laden (",
                "Retry images": "Bilder erneut laden",
                "External images are blocked by default. Loading may reveal your reading time and network address to the sender. Consent applies only to this message.": "Externe Bilder sind standardmäßig blockiert. Das Laden kann dem Absender deine Lesezeit und Netzwerkadresse offenbaren. Die Zustimmung gilt nur für diese Nachricht.",
                "Body or formatting exceeds the display limit. Some content was omitted; try plain text or your mail client.": "Text oder Formatierung überschreiten die Anzeigegrenze. Ein Teil des Inhalts wurde weggelassen; nutze Nur-Text oder deinen E-Mail-Client.",
                "Message details": "Nachrichtendetails",
                "Mark unread": "Als ungelesen markieren",
                "Mark read": "Als gelesen markieren",
                "Unstar": "Markierung entfernen",
                "Star": "Markieren",
                "Edit the reply in Drafts. Review and confirm before sending.": "Bearbeite die Antwort in den Entwürfen. Prüfe und bestätige vor dem Senden.",
            },
            ja: {
                "Enter the custom proxy URL.": "カスタムプロキシのアドレスを入力してください。",
                "Create a Desktop app OAuth client in Google Cloud, enable Gmail mail consent and add your account as a test user. Complete sign-in in your browser; no mailbox password is needed.": "Google Cloud で「デスクトップアプリ」の OAuth クライアントを作成し、Gmail のメール許可を有効にして、自分のアカウントをテストユーザーに追加します。ログインはブラウザーで完了するため、メールボックスのパスワードは不要です。",
                "Google client secret (if issued)": "Google クライアントシークレット（発行された場合）",
                "Saved; leave unchanged to keep": "保存済み。変更しない場合はそのまま保持されます",
                "Open Google authorization; this panel updates after sign-in.": "Google の認証ページを開いてください。ログイン後にこのパネルが更新されます。",
                "Enter your Google Desktop app client ID. App passwords remain available where your account policy permits.": "Google デスクトップアプリのクライアント ID を入力してください。アカウント ポリシーで許可されている場合は、アプリパスワードも引き続き使用できます。",
                "Sign in with Google": "Google でログイン",
                "API connected · ": "API 接続成功 · ",
                "POP3 connected · ": "POP3 受信接続成功 · ",
                "; SMTP sending was not tested": "。SMTP 送信はテストしていません",
                "Incoming protocol": "受信プロトコル",
                "POP3 reads the inbox and uses SMTP for sending. Server read/star flags and a Sent folder are unavailable; search shows its scan coverage.": "POP3 は受信トレイのみを読み、送信には SMTP を使います。既読・スター状態や送信済みフォルダーはサーバーにありません。検索時は対象範囲を表示します。",
                "POP3 incoming server": "POP3 受信サーバー",
                "SMTP outgoing server (optional for receiving)": "SMTP 送信サーバー（受信のみなら任意）",
                "POP3 host": "POP3 ホスト",
                "SMTP host": "SMTP ホスト",
                "POP3 port": "POP3 ポート",
                "SMTP port": "SMTP ポート",
                "TLS is off: POP3 login and content use plaintext. Use only with a trusted server where plaintext is intended. This is not STARTTLS.": "TLS が無効です。POP3 のログインと内容は平文で送信されます。平文が意図されている信頼できるサーバーでのみ使用してください。これは STARTTLS ではありません。",
                "Google OAuth requires your own Desktop app client; app-password availability depends on account policy.": "Google OAuth には独自のデスクトップアプリクライアントが必要です。アプリパスワードが使えるかはアカウント ポリシーによります。",
                "Connection routing": "接続経路",
                "Follow global or environment settings": "グローバル設定または環境設定に従う",
                "Connect directly (ignore proxies)": "直接接続（プロキシを使用しない）",
                "Custom proxy": "カスタムプロキシ",
                "Custom proxy URL": "カスタムプロキシのアドレス",
                "Saved; leave blank to retain": "保存済み。空欄のままにすると保持されます",
                "Applies to IMAP and SMTP. Supports HTTP CONNECT, HTTPS and SOCKS. Saved URLs may contain passwords and are not displayed. POP3 receiving still connects directly.": "IMAP と SMTP に適用されます。HTTP CONNECT / HTTPS / SOCKS に対応。保存されたアドレスにはパスワードが含まれる場合があり、再表示されません。POP3 の受信は引き続き直接接続します。",
                "API key; leave blank to retain saved key": "API キー。空欄にすると保存済みのキーを保持します",
                "Use an API key from the AgentMail console. The key is stored in the local account configuration; the DSH backend calls the selected region.": "AgentMail コンソールの API キーを使用します。キーはローカルのアカウント設定に保存され、DSH バックエンドが選択したリージョンの API を呼び出します。",
                "Mailbox action failed": "メールボックス操作に失敗しました",
                "Mailbox workbench": "メールボックス作業台",
                "Moved ": "移動しました: ",
                " messages to ": " 件 → ",
                "Undo move": "移動を元に戻す",
                "To restore, move the messages back in your mail client.": "元に戻すには、メールクライアントでメッセージを移動し直してください。",
                "Dismiss": "閉じる",
                "Check account settings": "アカウント設定を確認",
                "Loading accounts…": "アカウントを読み込み中…",
                "Mailbox unavailable": "メールボックスを利用できません",
                "Connect your mailbox": "メールボックスを接続",
                "Account settings": "アカウント設定",
                "Add and test an email account to read and reply here.": "メールアカウントを追加してテストすると、ここで読信と返信ができます。",
                "Accounts and folders": "アカウントとフォルダー",
                "Search current folder": "現在のフォルダーを検索",
                "Trash is unavailable for this protocol; delete in your mail client.": "このプロトコルではゴミ箱を利用できません。メールクライアントで削除してください。",
                "POP3 inbox · Server read/star flags and a Sent folder are unavailable. Replies open in local Drafts and use SMTP after confirmation.": "POP3 受信トレイ · 既読・スター状態や送信済みフォルダーは利用できません。返信はローカル下書きで開き、確認後に SMTP で送信します。",
                "Select page": "ページを選択",
                "Move to Trash (": "ゴミ箱へ移動（",
                ")": "）",
                "Select message: ": "メッセージを選択: ",
                "Unread": "未読",
                "(No subject)": "（件名なし）",
                "Messages could not be loaded": "メッセージを読み込めませんでした",
                "No results in the current search window.": "現在の検索範囲に結果はありません。",
                "This page: ": "このページ: ",
                " messages": " 件",
                " · Ranked by relevance": " ｜ 関連度順",
                " · Mailbox arrival order": " ｜ メールボックス到着順",
                "Add and test an account in settings to browse mail.": "設定でアカウントを追加してテストすると、メールを閲覧できます。",
                "Headers scanned: ": "走査したヘッダー: ",
                "; headers fully covered; body search has a separate limit.": "。ヘッダーは全体を網羅しています。本文検索には別の上限があります。",
                "; folder coverage is partial.": "。フォルダーの走査は途中までです。",
                "Bodies scanned: ": "走査した本文: ",
                " messages; limit ": " 件（上限 ",
                "; bounded by the body display limit.": "）、本文表示の上限による制限です。",
                "AgentMail ranks results by relevance and excludes spam, trash and other protected mail.": "AgentMail は関連度順に結果を返し、迷惑メール・ゴミ箱などの保護されたメールは対象外です。",
                "Page ": "ページ ",
                "": "",
                "Search older headers": "さらに古いヘッダーを検索",
                "This message could not be loaded": "このメッセージを読み込めませんでした",
                "Open a message to reply in drafts, mark its state or download attachments.": "メッセージを開くと、下書きで返信したり、状態を変更したり、添付ファイルをダウンロードできます。",
                "Email action failed": "メール操作に失敗しました",
                "View plain-text alternative": "プレーンテキスト版を表示",
                "Submitting / check mailbox": "送信中 / メールボックスを確認",
                "Server receipt saved": "サーバー応答を保存済み",
                "Outcome uncertain, check mailbox": "結果不明。メールボックスを確認してください",
                "Draft saved. No email was sent.": "下書きを保存しました。メールは送信されていません。",
                "Scheduled for: ": "予約送信: ",
                "A recipient is blocked. Change the draft or recipient rules before sending.": "禁止された宛先が含まれています。送信前に下書きまたは宛先ルールを変更してください。",
                "Blocked: ": "送信禁止: ",
                "Matches a trusted rule": "信頼ルールに一致",
                "(Empty body)": "（本文なし）",
                "Download to check": "ダウンロードして確認",
                "Attachments are fixed to this preview. Review again after 10 minutes or when the draft, account or rules change.": "添付ファイルはこのプレビュー時点で固定されます。10 分後、または下書き・アカウント・ルールを変更した場合は再確認してください。",
                "I checked the sender, all recipients, content and attachments": "差出人・すべての宛先・本文・添付ファイルを確認しました",
                "Review cancelled. No email was sent.": "確認をキャンセルしました。メールは送信されていません。",
                "Drafts stay on this device. Ask the model to prepare one with email_draft, then edit, save and confirm here.": "下書きはこの端末にのみ保存されます。モデルに email_draft で作成させ、ここで編集・保存・確認してください。",
                "The current draft has unsaved edits.": "現在の下書きに未保存の編集があります。",
                "Save and switch": "保存して切り替え",
                "Discard edits and switch": "編集を破棄して切り替え",
                "Keep editing": "編集を続ける",
                "Reopen saved version": "保存済みの版を開き直す",
                "Back to drafts": "下書き一覧に戻る",
                "Untitled draft": "無題の下書き",
                "No account selected": "アカウント未選択",
                "Unsaved": "未保存",
                "No drafts yet": "下書きはまだありません",
                "Choose Compose above to begin.": "上の「作成」を押して開始してください。",
                "This draft replies in the original thread and includes a quoted copy. Write above the quote, then review and confirm before sending.": "この下書きは元のスレッドに返信し、引用文を含みます。引用の上に本文を書き、確認してから送信してください。",
                "Unsaved edits": "未保存の編集",
                "Send time: ": "送信日時: ",
                "Cancel schedule and return to draft": "予約を取り消して下書きに戻る",
                "Sending account": "送信アカウント",
                "Choose an account": "アカウントを選択",
                "Schedule (optional, this device’s timezone)": "予約送信（任意・この端末のタイムゾーン）",
                "Scheduled send time": "予約送信日時",
                "Keep DSH running. Missed times while closed are not sent on restart; uncertain submissions are never retried automatically.": "DSH を起動したままにしてください。終了中に過ぎた時刻は再起動後も送信されません。結果不明の送信は自動再試行しません。",
                "Body format": "本文形式",
                "Plain text": "プレーンテキスト",
                "Formatted HTML": "HTML 整形",
                "Preview and send safe formatting. Plain text is generated when omitted. Scripts and external images are removed.": "安全な整形のみをプレビューして送信します。プレーンテキストが未入力なら自動生成します。スクリプトと外部画像は削除されます。",
                "Remove attachment ": "添付ファイルを削除: ",
                "Remove": "削除",
                "Add attachments (save edits first; up to 10 files / ": "添付を追加（先に編集を保存。最大 10 ファイル / ",
                " total)": " 合計）",
                "Add attachments": "添付を追加",
                "Attachment exceeds ": "添付ファイルが上限を超えています: ",
                "Attachments added. Review before sending.": "添付ファイルを追加しました。送信前に確認してください。",
                "Some addresses were rejected. This email will not retry automatically. Server accepted: ": "一部のアドレスが拒否されました。このメールは自動再送しません。サーバーが受理: ",
                "Server receipt saved. This draft will not send again. Server accepted: ": "サーバー応答を保存しました。この下書きは再送信しません。サーバーが受理: ",
                "none": "なし",
                "Server rejected: ": "サーバーが拒否: ",
                "This confirms the server response, not delivery to the recipient inbox.": "これはサーバーの応答であり、受信者の受信トレイへの到達を保証するものではありません。",
                "No receipt yet. Check your mailbox, then refresh the list. Do not send again.": "まだ応答がありません。メールボックスを確認してから一覧を更新してください。再送信しないでください。",
                "Copy to a new draft": "新しい下書きにコピー",
                "Delete local draft": "ローカル下書きを削除",
                "Copies content and attachments to a new unsent draft. Check the mailbox first if the original was submitted or its result is uncertain.": "内容と添付ファイルを新しい未送信の下書きにコピーします。元のメールを送信済み、または結果が不明な場合は、先にメールボックスを確認してください。",
                "Confirm copy": "コピーを確認",
                "Deletes this local draft and plugin-uploaded copies. Original files and mailbox messages stay intact.": "このローカル下書きとプラグインがアップロードしたコピーを削除します。元のファイルとメールボックス内のメールは残ります。",
                "Confirm delete": "削除を確認",
                "Select a draft or create one to start editing.": "下書きを選択するか、新規作成して編集を始めてください。",
                "Rules saved for this account.": "このアカウントのルールを保存しました。",
                "Trusted recipients": "信頼できる宛先",
                "Approval is the default. When enabled, email_send skips this plugin's approval only if every To/Cc address matches this account's rules. Host permissions still apply, and drafts still need manual confirmation. Domain rules exclude subdomains.": "既定では毎回確認します。有効にすると、このアカウントのルールにすべての To/Cc が一致した場合に限り、email_send はプラグイン確認を省略します。ホスト権限は引き続き適用され、下書きは手動確認が必要です。ドメインルールはサブドメインを含みません。",
                "Blocked recipients take precedence over trusted rules, even with send approval off. Blocks also apply to drafts, replies and forwards. Blocked domains match exactly and exclude subdomains.": "禁止された宛先は、送信確認がオフでも信頼ルールより優先されます。禁止は下書き・返信・転送にも適用されます。禁止ドメインは完全一致のみで、サブドメインは含みません。",
                "Trusted reply skipping is off by default and can be enabled in Connection settings. It checks every actual To/Cc for replies, reply-all and forwards; any unmatched recipient still needs confirmation. Use Drafts for manual review if Full Access cannot show a prompt.": "信頼できる返信の省略は既定でオフで、接続設定から有効にできます。返信・全員に返信・転送の実際の To/Cc をすべて確認し、一致しない宛先が1つでもあれば確認が必要です。Full Access でダイアログを表示できない場合は、下書きで手動確認してください。",
                "Global send approval is off; blocked-recipient rules still apply.": "グローバル送信確認はオフです。禁止宛先ルールは引き続き適用されます。",
                "Account for these rules": "このルールの対象アカウント",
                "Choose a configured account": "設定済みのアカウントを選択",
                "Rules have unsaved edits.": "ルールに未保存の編集があります。",
                "Trusted email addresses (one per line)": "信頼できるメールアドレス（1 行に 1 件）",
                "Trusted domains (one per line, all mailboxes in that domain)": "信頼できるドメイン（1 行に 1 件、そのドメインの全メールボックス）",
                "Blocked email addresses (one per line)": "禁止するメールアドレス（1 行に 1 件）",
                "Blocked domains (one per line)": "禁止するドメイン（1 行に 1 件）",
                "Skip plugin approval for email_send when all addresses match": "すべての宛先が一致する場合に email_send のプラグイン確認を省略",
                "Save rules for this account": "このアカウントのルールを保存",
                "Reload rules": "ルールを再読み込み",
                "Unsaved; matching uses the rules you are editing.": "未保存。一致確認には編集中のルールが使われます。",
                "Only saved rules affect model-initiated sends.": "保存済みのルールだけがモデルからの送信に適用されます。",
                "Try recipients To": "宛先 To を試す",
                "Try copy Cc": "Cc を試す",
                "A recipient is blocked; sending is refused.": "禁止された宛先があるため送信できません。",
                "All To/Cc match; plugin approval can be skipped.": "すべての To/Cc が一致しています。プラグイン確認を省略できます。",
                "Plugin approval will remain.": "プラグイン確認は残ります。",
                "Match: ": "一致: ",
                "Task operation failed": "タスク操作に失敗しました",
                "Loading mail tasks…": "メールタスクを読み込み中…",
                "Each line: alias = absolute path to an existing folder": "各行: エイリアス = 既存フォルダーの絶対パス",
                "Duplicate workspace alias": "ワークスペースのエイリアスが重複しています",
                "Saved. The first check establishes a baseline; only later mail can trigger tasks.": "保存しました。初回チェックは基準点を作るだけで、その後届いたメールだけがタスクを起動します。",
                "Starting": "開始中",
                "Running": "実行中",
                "Waiting for your input in DSH": "DSH での確認待ち",
                "Completed": "完了",
                "Needs attention": "確認が必要",
                "Submitting reply": "返信を送信中",
                "Replied": "返信済み",
                "Mail outcome uncertain; check sent mail": "送信結果が不明です。送信済みを確認してください",
                "Turn email into a DSH task": "メールを DSH タスクにする",
                "Send a task from an authorized mailbox to an approved workspace, then continue the same session by email. Off by default. Tasks use your model and may incur usage; DSH permissions still require your input.": "許可されたメールボックスから承認済みワークスペースへタスクを送り、同じセッションをメールで継続できます。既定ではオフです。タスクはモデルを使用し、利用量が発生する場合があります。DSH の権限確認は引き続き必要です。",
                "Native task services are unavailable; update DSH to use this feature.": "ネイティブのタスクサービスが利用できません。この機能を使うには DSH を更新してください。",
                "Task subject prefix": "タスク件名のプレフィックス",
                "Allowed senders (one per line; empty means the mailbox itself)": "許可する送信者（1 行に 1 件。空欄ならメールボックス本人のみ）",
                "Workspace aliases (each line: alias = absolute folder path)": "ワークスペースのエイリアス（各行: エイリアス = フォルダーの絶対パス）",
                "work = /home/me/projects/my-project": "work = /home/me/projects/my-project",
                "Tasks can use only saved aliases. Existing sessions must belong to that workspace.": "タスクはここに保存したエイリアスのみ使用できます。既存のセッションも同じワークスペースに属している必要があります。",
                "New key shown once; the old key is invalid. Save your configuration before enabling.": "新しいキーは一度だけ表示されます。古いキーは無効になりました。有効にする前に設定を保存してください。",
                "Rotate task key (pauses tasks)": "タスクキーを更新（タスクは一時停止）",
                "Generate task key": "タスクキーを生成",
                "Copy this email template and keep the key private": "このメールテンプレートをコピーし、キーは大切に保管してください",
                "Write your task here": "ここにタスクを書いてください",
                "Hide key": "キーを隠す",
                "Subject: dsh:alias or dsh:alias:sessionId. Begin the body with DSH-Key: your-task-key, then write the task. The key authorizes whitelisted senders to start tasks in your approved workspace; keep it private.": "件名: dsh:エイリアス または dsh:エイリアス:セッションID。本文の先頭行を DSH-Key: タスクキー とし、次の行からタスクを書きます。このキーは許可リストの送信者が承認済みワークスペースでタスクを開始する権限を与えます。他人に渡さないでください。",
                "Automatically email the final result to the authorized sender (no Cc; recipient blocks apply)": "最終結果を承認済み送信者へ自動返信します（Cc なし。禁止宛先ルールを適用）",
                "Poll interval (seconds)": "確認間隔（秒）",
                "Advanced matching and extraction": "高度なマッチングと抽出",
                "Rules run after sender and key checks. Use all / any, fields subject / body / from / to / cc, operators contains / equals / regex. Named captures work as ${name} in workspace, session and prompt; ${body} is the body with the key and quoted history removed. Workspace results must match an allowed alias.": "ルールは送信者とキーの確認後に実行されます。all / any、項目 subject / body / from / to / cc、演算子 contains / equals / regex を使用できます。名前付きキャプチャは workspace・session・prompt で ${name} として使え、${body} はキーと引用履歴を除いた本文です。ワークスペースの結果は許可されたエイリアスに一致する必要があります。",
                "Rules (JSON array)": "ルール（JSON 配列）",
                "Check finished; see task records below.": "確認が完了しました。下のタスク記録をご覧ください。",
                "Clear finished task records": "終了したタスク記録を消去",
                "Keep DSH running. In-progress tasks are not replayed after restart. Handle approvals, timeouts or manual takeover in the original session.": "DSH を起動したままにしてください。再起動後、進行中のタスクは再実行されません。承認待ち・タイムアウト・手動引き継ぎは元のセッションで行ってください。",
                "Session ID": "セッション ID",
                "Open DSH session": "DSH セッションを開く",
                "No tasks yet. The first check establishes a baseline.": "タスクはまだありません。初回チェックは基準点を作るだけです。",
                "Retry save": "保存を再試行",
                "Show new-mail popups": "新着メールのポップアップを表示",
                "Turning this off hides the popup and stops automatic mail checks. You can still check mail in a conversation. Turning it back on starts with a fresh baseline.": "オフにするとポップアップが非表示になり、自動チェックも停止します。会話内でのメール確認は引き続き可能です。再度オンにすると新しい基準点から始まります。",
                "Reply quote language": "返信の引用言語",
                "Follow interface; English if unknown": "インターフェースに従う（不明時は英語）",
                "Allow trusted replies without confirmation (off by default)": "信頼できる返信を確認なしで許可（既定ではオフ）",
                "When enabled, every actual To/Cc in a reply, reply-all or forward must match that account’s trusted rules. Block rules and host permissions still apply.": "有効にすると、返信・全員に返信・転送の実際の To/Cc がすべてそのアカウントの信頼ルールに一致する必要があります。禁止ルールとホスト権限は引き続き適用されます。",
                "Quote date timezone (optional)": "引用日時のタイムゾーン（任意）",
                "These accounts are managed in the configuration file: ": "次のアカウントは設定ファイルで管理されています: ",
                "You can save general settings here. Accounts and credentials are preserved; add or edit accounts in the configuration accounts map.": "ここでは共通設定を保存できます。アカウントと認証情報はそのまま保持されます。追加や編集は設定ファイルの accounts で行ってください。",
                " messages\n": " 件\n",
                "Manage custom IMAP folders. Purge requires preview and confirmation, affects reviewed messages only, and requires UIDPLUS (up to 2000 messages). Only empty folders can be deleted. Permanent deletion cannot be undone.": "IMAP の自建フォルダーを管理します。空にする操作はプレビューと確認が必要で、確認したメールのみが対象、UIDPLUS が必要です（最大 2000 件）。削除できるのは空のフォルダーだけです。完全削除は元に戻せません。",
                "New folder": "新しいフォルダー",
                "e.g. Tenders": "例: 入札",
                "Create": "作成",
                "Save": "保存",
                "(System folder)": "（システムフォルダー）",
                "Rename": "名前を変更",
                "Empty permanently deletes every message in this folder. Continue?": "空にすると、このフォルダー内のすべてのメールが完全に削除されます。続行しますか？",
                "Empty": "空にする",
                "Delete removes the folder and all its messages forever. Continue?": "削除すると、フォルダーとそのすべてのメールが完全に削除されます。続行しますか？",
                "Move to Trash": "ゴミ箱へ移動",
                "Move the selected messages to the existing folder below. This does not permanently delete them.": "選択したメールを下の既存フォルダーへ移動します。完全削除は行いません。",
                "Destination folder": "移動先フォルダー",
                "Detect Trash automatically": "ゴミ箱を自動判定",
                "Checking messages and folders…": "メールとフォルダーを確認中…",
                "Move to: ": "移動先: ",
                "Confirmation expires in 90 seconds and must be renewed if the mailbox changes. A 5-minute Undo is offered when the server returns destination UIDs.": "確認の有効期限は 90 秒で、メールボックスが変わるとやり直しが必要です。サーバーが移動先 UID を返した場合は 5 分間取り消せます。",
                "Moving…": "移動中…",
                "Confirm move: ": "移動を確認: ",
                "Email image": "メール画像",
                "Failed to load; retry available": "読み込みに失敗しました。再試行できます",
                "External image blocked": "外部画像をブロックしました",
                "Loading…": "読み込み中…",
                "View formatted message": "整形されたメールを表示",
                "View plain text": "プレーンテキストを表示",
                "External images allowed for this message": "このメールでは外部画像を許可しました",
                "Load external images (": "外部画像を読み込む（",
                "Retry images": "画像を再試行",
                "External images are blocked by default. Loading may reveal your reading time and network address to the sender. Consent applies only to this message.": "外部画像は既定でブロックされます。読み込むと、閲覧時刻やネットワークアドレスが送信者に伝わる可能性があります。許可はこのメールにのみ適用されます。",
                "Body or formatting exceeds the display limit. Some content was omitted; try plain text or your mail client.": "本文または整形が表示上限を超えています。一部の内容は省略されました。プレーンテキストかメールクライアントで確認してください。",
                "Message details": "メッセージの詳細",
                "Mark unread": "未読にする",
                "Mark read": "既読にする",
                "Unstar": "スターを外す",
                "Star": "スターを付ける",
                "Edit the reply in Drafts. Review and confirm before sending.": "返信は下書きで編集します。送信前に確認してください。",
            },
            pt: {
                "Enter the custom proxy URL.": "Informe o endereço do proxy personalizado.",
                "Create a Desktop app OAuth client in Google Cloud, enable Gmail mail consent and add your account as a test user. Complete sign-in in your browser; no mailbox password is needed.": "Crie um cliente OAuth do tipo “Desktop app” no Google Cloud, ative o consentimento do Gmail e adicione sua conta como usuário de teste. O login é concluído no navegador; não é necessário informar a senha da caixa de correio.",
                "Google client secret (if issued)": "Segredo do cliente Google (se emitido)",
                "Saved; leave unchanged to keep": "Salvo; deixe como está para manter",
                "Open Google authorization; this panel updates after sign-in.": "Abra a autorização do Google; este painel é atualizado após o login.",
                "Enter your Google Desktop app client ID. App passwords remain available where your account policy permits.": "Informe o ID de cliente do seu aplicativo de desktop do Google. As senhas de aplicativo continuam disponíveis quando a política da conta permite.",
                "Sign in with Google": "Entrar com o Google",
                "API connected · ": "API conectada · ",
                "POP3 connected · ": "POP3 conectado · ",
                "; SMTP sending was not tested": "; o envio por SMTP não foi testado",
                "Incoming protocol": "Protocolo de recebimento",
                "POP3 reads the inbox and uses SMTP for sending. Server read/star flags and a Sent folder are unavailable; search shows its scan coverage.": "O POP3 lê a caixa de entrada e usa SMTP para enviar. Não há marcações de lido/favorito nem pasta Enviados no servidor; a pesquisa informa seu alcance.",
                "POP3 incoming server": "Servidor de entrada POP3",
                "SMTP outgoing server (optional for receiving)": "Servidor de saída SMTP (opcional para receber)",
                "POP3 host": "Host POP3",
                "SMTP host": "Host SMTP",
                "POP3 port": "Porta POP3",
                "SMTP port": "Porta SMTP",
                "TLS is off: POP3 login and content use plaintext. Use only with a trusted server where plaintext is intended. This is not STARTTLS.": "O TLS está desativado: o login e o conteúdo POP3 trafegam em texto simples. Use apenas com um servidor confiável em que o texto simples seja intencional. Isto não é STARTTLS.",
                "Google OAuth requires your own Desktop app client; app-password availability depends on account policy.": "O Google OAuth exige seu próprio cliente de aplicativo de desktop; a disponibilidade de senhas de aplicativo depende da política da conta.",
                "Connection routing": "Roteamento da conexão",
                "Follow global or environment settings": "Seguir as configurações globais ou de ambiente",
                "Connect directly (ignore proxies)": "Conectar diretamente (ignorar proxies)",
                "Custom proxy": "Proxy personalizado",
                "Custom proxy URL": "Endereço do proxy personalizado",
                "Saved; leave blank to retain": "Salvo; deixe em branco para manter",
                "Applies to IMAP and SMTP. Supports HTTP CONNECT, HTTPS and SOCKS. Saved URLs may contain passwords and are not displayed. POP3 receiving still connects directly.": "Aplica-se a IMAP e SMTP. Compatível com HTTP CONNECT, HTTPS e SOCKS. Os endereços salvos podem conter senhas e não são exibidos. O recebimento POP3 continua conectando diretamente.",
                "API key; leave blank to retain saved key": "Chave de API; deixe vazio para manter a chave salva",
                "Use an API key from the AgentMail console. The key is stored in the local account configuration; the DSH backend calls the selected region.": "Use uma chave de API do console do AgentMail. A chave fica na configuração local da conta; o backend do DSH chama a região selecionada.",
                "Mailbox action failed": "A operação na caixa de correio falhou",
                "Mailbox workbench": "Área de trabalho da caixa de correio",
                "Moved ": "Movidas ",
                " messages to ": " mensagens para ",
                "Undo move": "Desfazer movimentação",
                "To restore, move the messages back in your mail client.": "Para restaurar, mova as mensagens de volta no seu cliente de e-mail.",
                "Dismiss": "Dispensar",
                "Check account settings": "Verificar as configurações da conta",
                "Loading accounts…": "Carregando contas…",
                "Mailbox unavailable": "Caixa de correio indisponível",
                "Connect your mailbox": "Conecte sua caixa de correio",
                "Account settings": "Configurações da conta",
                "Add and test an email account to read and reply here.": "Adicione e teste uma conta de e-mail para ler e responder aqui.",
                "Accounts and folders": "Contas e pastas",
                "Search current folder": "Pesquisar na pasta atual",
                "Trash is unavailable for this protocol; delete in your mail client.": "A lixeira não está disponível neste protocolo; exclua as mensagens no seu cliente de e-mail.",
                "POP3 inbox · Server read/star flags and a Sent folder are unavailable. Replies open in local Drafts and use SMTP after confirmation.": "Caixa de entrada POP3 · Não há marcações de lido/favorito nem pasta Enviados. As respostas abrem nos rascunhos locais e saem por SMTP após confirmação.",
                "Select page": "Selecionar página",
                "Move to Trash (": "Mover para a lixeira (",
                ")": ")",
                "Select message: ": "Selecionar mensagem: ",
                "Unread": "Não lido",
                "(No subject)": "(Sem assunto)",
                "Messages could not be loaded": "Não foi possível carregar as mensagens",
                "No results in the current search window.": "Nenhum resultado no intervalo de pesquisa atual.",
                "This page: ": "Esta página: ",
                " messages": " mensagens",
                " · Ranked by relevance": " · Ordenado por relevância",
                " · Mailbox arrival order": " · Ordem de chegada na caixa",
                "Add and test an account in settings to browse mail.": "Adicione e teste uma conta nas configurações para navegar pelos e-mails.",
                "Headers scanned: ": "Cabeçalhos verificados: ",
                "; headers fully covered; body search has a separate limit.": "; os cabeçalhos estão completos; a pesquisa no corpo tem outro limite.",
                "; folder coverage is partial.": "; a cobertura da pasta é parcial.",
                "Bodies scanned: ": "Corpos verificados: ",
                " messages; limit ": " mensagens; limite ",
                "; bounded by the body display limit.": "; limitado pelo máximo de exibição do corpo.",
                "AgentMail ranks results by relevance and excludes spam, trash and other protected mail.": "O AgentMail ordena os resultados por relevância e exclui spam, lixeira e outros e-mails protegidos.",
                "Page ": "Página ",
                "": "",
                "Search older headers": "Pesquisar cabeçalhos mais antigos",
                "This message could not be loaded": "Não foi possível carregar esta mensagem",
                "Open a message to reply in drafts, mark its state or download attachments.": "Abra uma mensagem para responder nos rascunhos, marcar o estado ou baixar anexos.",
                "Email action failed": "A operação de e-mail falhou",
                "View plain-text alternative": "Ver a alternativa em texto simples",
                "Submitting / check mailbox": "Enviando / verifique a caixa",
                "Server receipt saved": "Recibo do servidor salvo",
                "Outcome uncertain, check mailbox": "Resultado incerto, verifique a caixa",
                "Draft saved. No email was sent.": "Rascunho salvo. Nenhum e-mail foi enviado.",
                "Scheduled for: ": "Agendado para: ",
                "A recipient is blocked. Change the draft or recipient rules before sending.": "Há um destinatário bloqueado. Altere o rascunho ou as regras de destinatários antes de enviar.",
                "Blocked: ": "Bloqueado: ",
                "Matches a trusted rule": "Corresponde a uma regra de confiança",
                "(Empty body)": "(Corpo vazio)",
                "Download to check": "Baixar para verificar",
                "Attachments are fixed to this preview. Review again after 10 minutes or when the draft, account or rules change.": "Os anexos ficam fixos nesta prévia. Revise novamente após 10 minutos ou se o rascunho, a conta ou as regras mudarem.",
                "I checked the sender, all recipients, content and attachments": "Revisei o remetente, todos os destinatários, o conteúdo e os anexos",
                "Review cancelled. No email was sent.": "Revisão cancelada. Nenhum e-mail foi enviado.",
                "Drafts stay on this device. Ask the model to prepare one with email_draft, then edit, save and confirm here.": "Os rascunhos ficam neste dispositivo. Peça ao modelo para preparar um com email_draft e depois edite, salve e confirme aqui.",
                "The current draft has unsaved edits.": "O rascunho atual tem alterações não salvas.",
                "Save and switch": "Salvar e trocar",
                "Discard edits and switch": "Descartar alterações e trocar",
                "Keep editing": "Continuar editando",
                "Reopen saved version": "Reabrir a versão salva",
                "Back to drafts": "Voltar aos rascunhos",
                "Untitled draft": "Rascunho sem título",
                "No account selected": "Nenhuma conta selecionada",
                "Unsaved": "Não salvo",
                "No drafts yet": "Ainda não há rascunhos",
                "Choose Compose above to begin.": "Clique em “Redigir” acima para começar.",
                "This draft replies in the original thread and includes a quoted copy. Write above the quote, then review and confirm before sending.": "Este rascunho responde no tópico original e inclui uma cópia citada. Escreva acima da citação, revise e confirme antes de enviar.",
                "Unsaved edits": "Alterações não salvas",
                "Send time: ": "Horário de envio: ",
                "Cancel schedule and return to draft": "Cancelar o agendamento e voltar ao rascunho",
                "Sending account": "Conta de envio",
                "Choose an account": "Escolha uma conta",
                "Schedule (optional, this device’s timezone)": "Agendar (opcional, fuso horário deste dispositivo)",
                "Scheduled send time": "Horário de envio agendado",
                "Keep DSH running. Missed times while closed are not sent on restart; uncertain submissions are never retried automatically.": "Mantenha o DSH em execução. Horários perdidos enquanto ele estava fechado não são enviados ao reiniciar; envios incertos nunca são repetidos automaticamente.",
                "Body format": "Formato do corpo",
                "Plain text": "Texto simples",
                "Formatted HTML": "HTML formatado",
                "Preview and send safe formatting. Plain text is generated when omitted. Scripts and external images are removed.": "Pré-visualize e envie formatação segura. O texto simples é gerado quando omitido. Scripts e imagens externas são removidos.",
                "Remove attachment ": "Remover o anexo ",
                "Remove": "Remover",
                "Add attachments (save edits first; up to 10 files / ": "Adicionar anexos (salve as alterações antes; até 10 arquivos / ",
                " total)": " no total)",
                "Add attachments": "Adicionar anexos",
                "Attachment exceeds ": "O anexo excede ",
                "Attachments added. Review before sending.": "Anexos adicionados. Revise antes de enviar.",
                "Some addresses were rejected. This email will not retry automatically. Server accepted: ": "Alguns endereços foram recusados. Este e-mail não será reenviado automaticamente. Aceitos pelo servidor: ",
                "Server receipt saved. This draft will not send again. Server accepted: ": "Recibo do servidor salvo. Este rascunho não será enviado novamente. Aceitos pelo servidor: ",
                "none": "nenhum",
                "Server rejected: ": "Recusados pelo servidor: ",
                "This confirms the server response, not delivery to the recipient inbox.": "Isto confirma a resposta do servidor, não a entrega na caixa do destinatário.",
                "No receipt yet. Check your mailbox, then refresh the list. Do not send again.": "Ainda sem recibo. Verifique sua caixa e atualize a lista. Não envie novamente.",
                "Copy to a new draft": "Copiar para um novo rascunho",
                "Delete local draft": "Excluir o rascunho local",
                "Copies content and attachments to a new unsent draft. Check the mailbox first if the original was submitted or its result is uncertain.": "Copia o conteúdo e os anexos para um novo rascunho não enviado. Verifique a caixa antes se o original foi enviado ou o resultado é incerto.",
                "Confirm copy": "Confirmar cópia",
                "Deletes this local draft and plugin-uploaded copies. Original files and mailbox messages stay intact.": "Exclui este rascunho local e as cópias enviadas pela extensão. Os arquivos originais e as mensagens da caixa permanecem.",
                "Confirm delete": "Confirmar exclusão",
                "Select a draft or create one to start editing.": "Selecione um rascunho ou crie um para começar a editar.",
                "Rules saved for this account.": "Regras salvas para esta conta.",
                "Trusted recipients": "Destinatários confiáveis",
                "Approval is the default. When enabled, email_send skips this plugin's approval only if every To/Cc address matches this account's rules. Host permissions still apply, and drafts still need manual confirmation. Domain rules exclude subdomains.": "A confirmação é o padrão. Quando ativada, o email_send só dispensa a confirmação da extensão se todos os endereços To/Cc corresponderem às regras desta conta. As permissões do host continuam valendo e os rascunhos ainda exigem confirmação manual. Regras de domínio não incluem subdomínios.",
                "Blocked recipients take precedence over trusted rules, even with send approval off. Blocks also apply to drafts, replies and forwards. Blocked domains match exactly and exclude subdomains.": "Destinatários bloqueados têm precedência sobre regras de confiança, mesmo com a confirmação de envio desativada. Os bloqueios também valem para rascunhos, respostas e encaminhamentos. Domínios bloqueados exigem correspondência exata e não incluem subdomínios.",
                "Trusted reply skipping is off by default and can be enabled in Connection settings. It checks every actual To/Cc for replies, reply-all and forwards; any unmatched recipient still needs confirmation. Use Drafts for manual review if Full Access cannot show a prompt.": "A dispensa para respostas confiáveis fica desativada por padrão e pode ser ativada nas configurações de conexão. Ela verifica todos os To/Cc reais em respostas, responder a todos e encaminhamentos; qualquer destinatário não correspondente ainda exige confirmação. Se o Full Access não puder exibir um aviso, use Rascunhos.",
                "Global send approval is off; blocked-recipient rules still apply.": "A confirmação global de envio está desativada; as regras de destinatários bloqueados continuam valendo.",
                "Account for these rules": "Conta destas regras",
                "Choose a configured account": "Escolha uma conta configurada",
                "Rules have unsaved edits.": "As regras têm alterações não salvas.",
                "Trusted email addresses (one per line)": "Endereços de e-mail confiáveis (um por linha)",
                "Trusted domains (one per line, all mailboxes in that domain)": "Domínios confiáveis (um por linha, todas as caixas do domínio)",
                "Blocked email addresses (one per line)": "Endereços de e-mail bloqueados (um por linha)",
                "Blocked domains (one per line)": "Domínios bloqueados (um por linha)",
                "Skip plugin approval for email_send when all addresses match": "Dispensar a confirmação da extensão para email_send quando todos os endereços corresponderem",
                "Save rules for this account": "Salvar as regras desta conta",
                "Reload rules": "Recarregar as regras",
                "Unsaved; matching uses the rules you are editing.": "Não salvo; a verificação usa as regras que você está editando.",
                "Only saved rules affect model-initiated sends.": "Apenas as regras salvas afetam os envios iniciados pelo modelo.",
                "Try recipients To": "Testar destinatários To",
                "Try copy Cc": "Testar cópia Cc",
                "A recipient is blocked; sending is refused.": "Há um destinatário bloqueado; o envio é recusado.",
                "All To/Cc match; plugin approval can be skipped.": "Todos os To/Cc correspondem; a confirmação da extensão pode ser dispensada.",
                "Plugin approval will remain.": "A confirmação da extensão continuará.",
                "Match: ": "Correspondência: ",
                "Task operation failed": "A operação da tarefa falhou",
                "Loading mail tasks…": "Carregando tarefas de e-mail…",
                "Each line: alias = absolute path to an existing folder": "Cada linha: alias = caminho absoluto para uma pasta existente",
                "Duplicate workspace alias": "Alias de área de trabalho duplicado",
                "Saved. The first check establishes a baseline; only later mail can trigger tasks.": "Salvo. A primeira verificação apenas define um ponto de partida; somente e-mails posteriores podem acionar tarefas.",
                "Starting": "Iniciando",
                "Running": "Em execução",
                "Waiting for your input in DSH": "Aguardando sua confirmação no DSH",
                "Completed": "Concluída",
                "Needs attention": "Requer atenção",
                "Submitting reply": "Enviando a resposta",
                "Replied": "Respondida",
                "Mail outcome uncertain; check sent mail": "Resultado do envio incerto; verifique os enviados",
                "Turn email into a DSH task": "Transformar e-mail em tarefa do DSH",
                "Send a task from an authorized mailbox to an approved workspace, then continue the same session by email. Off by default. Tasks use your model and may incur usage; DSH permissions still require your input.": "Envie uma tarefa de uma caixa autorizada para um workspace aprovado e continue a mesma sessão por e-mail. Desativado por padrão. As tarefas usam seu modelo e podem gerar consumo; as permissões do DSH ainda exigem sua confirmação.",
                "Native task services are unavailable; update DSH to use this feature.": "Os serviços nativos de tarefas não estão disponíveis; atualize o DSH para usar este recurso.",
                "Task subject prefix": "Prefixo do assunto da tarefa",
                "Allowed senders (one per line; empty means the mailbox itself)": "Remetentes permitidos (um por linha; vazio significa a própria caixa)",
                "Workspace aliases (each line: alias = absolute folder path)": "Aliases de workspace (cada linha: alias = caminho absoluto de pasta)",
                "work = /home/me/projects/my-project": "work = /home/me/projects/my-project",
                "Tasks can use only saved aliases. Existing sessions must belong to that workspace.": "As tarefas só podem usar os aliases salvos. As sessões existentes precisam pertencer a esse workspace.",
                "New key shown once; the old key is invalid. Save your configuration before enabling.": "A nova chave é exibida uma única vez; a antiga é inválida. Salve a configuração antes de ativar.",
                "Rotate task key (pauses tasks)": "Renovar a chave de tarefas (pausa as tarefas)",
                "Generate task key": "Gerar chave de tarefas",
                "Copy this email template and keep the key private": "Copie este modelo de e-mail e mantenha a chave em sigilo",
                "Write your task here": "Escreva sua tarefa aqui",
                "Hide key": "Ocultar a chave",
                "Subject: dsh:alias or dsh:alias:sessionId. Begin the body with DSH-Key: your-task-key, then write the task. The key authorizes whitelisted senders to start tasks in your approved workspace; keep it private.": "Assunto: dsh:alias ou dsh:alias:sessionId. Comece o corpo com DSH-Key: sua-chave-de-tarefa e depois escreva a tarefa. A chave autoriza remetentes da lista de permissões a iniciar tarefas no seu workspace aprovado; mantenha-a em sigilo.",
                "Automatically email the final result to the authorized sender (no Cc; recipient blocks apply)": "Enviar automaticamente o resultado final ao remetente autorizado (sem Cc; bloqueios de destinatários se aplicam)",
                "Poll interval (seconds)": "Intervalo de verificação (segundos)",
                "Advanced matching and extraction": "Correspondência e extração avançadas",
                "Rules run after sender and key checks. Use all / any, fields subject / body / from / to / cc, operators contains / equals / regex. Named captures work as ${name} in workspace, session and prompt; ${body} is the body with the key and quoted history removed. Workspace results must match an allowed alias.": "As regras são executadas após a verificação do remetente e da chave. Use all / any, campos subject / body / from / to / cc e operadores contains / equals / regex. Capturas nomeadas funcionam como ${name} em workspace, session e prompt; ${body} é o corpo sem a chave e o histórico citado. O resultado do workspace precisa corresponder a um alias permitido.",
                "Rules (JSON array)": "Regras (array JSON)",
                "Check finished; see task records below.": "Verificação concluída; veja os registros de tarefas abaixo.",
                "Clear finished task records": "Limpar os registros de tarefas concluídas",
                "Keep DSH running. In-progress tasks are not replayed after restart. Handle approvals, timeouts or manual takeover in the original session.": "Mantenha o DSH em execução. Tarefas em andamento não são repetidas após reiniciar. Trate aprovações, tempos esgotados ou assuma manualmente na sessão original.",
                "Session ID": "ID da sessão",
                "Open DSH session": "Abrir a sessão do DSH",
                "No tasks yet. The first check establishes a baseline.": "Ainda não há tarefas. A primeira verificação apenas define um ponto de partida.",
                "Retry save": "Tentar salvar novamente",
                "Show new-mail popups": "Mostrar avisos de novo e-mail",
                "Turning this off hides the popup and stops automatic mail checks. You can still check mail in a conversation. Turning it back on starts with a fresh baseline.": "Desativar oculta o aviso e interrompe as verificações automáticas. Você ainda pode verificar e-mails em uma conversa. Ao reativar, começa de um novo ponto de partida.",
                "Reply quote language": "Idioma da citação nas respostas",
                "Follow interface; English if unknown": "Seguir a interface; inglês se desconhecido",
                "Allow trusted replies without confirmation (off by default)": "Permitir respostas confiáveis sem confirmação (desativado por padrão)",
                "When enabled, every actual To/Cc in a reply, reply-all or forward must match that account’s trusted rules. Block rules and host permissions still apply.": "Quando ativado, todos os To/Cc reais de uma resposta, resposta a todos ou encaminhamento precisam corresponder às regras de confiança dessa conta. As regras de bloqueio e as permissões do host continuam valendo.",
                "Quote date timezone (optional)": "Fuso horário da data citada (opcional)",
                "These accounts are managed in the configuration file: ": "Estas contas são gerenciadas no arquivo de configuração: ",
                "You can save general settings here. Accounts and credentials are preserved; add or edit accounts in the configuration accounts map.": "Aqui você pode salvar as configurações gerais. As contas e credenciais são preservadas; adicione ou edite contas no mapa accounts da configuração.",
                " messages\n": " mensagens\n",
                "Manage custom IMAP folders. Purge requires preview and confirmation, affects reviewed messages only, and requires UIDPLUS (up to 2000 messages). Only empty folders can be deleted. Permanent deletion cannot be undone.": "Gerencie pastas IMAP personalizadas. O esvaziamento exige prévia e confirmação, afeta apenas as mensagens revisadas e requer UIDPLUS (até 2000 mensagens). Só pastas vazias podem ser excluídas. A exclusão permanente não pode ser desfeita.",
                "New folder": "Nova pasta",
                "e.g. Tenders": "ex.: Licitações",
                "Create": "Criar",
                "Save": "Salvar",
                "(System folder)": "(Pasta do sistema)",
                "Rename": "Renomear",
                "Empty permanently deletes every message in this folder. Continue?": "Esvaziar exclui permanentemente todas as mensagens desta pasta. Continuar?",
                "Empty": "Esvaziar",
                "Delete removes the folder and all its messages forever. Continue?": "Excluir remove a pasta e todas as suas mensagens para sempre. Continuar?",
                "Move to Trash": "Mover para a lixeira",
                "Move the selected messages to the existing folder below. This does not permanently delete them.": "Move as mensagens selecionadas para a pasta existente abaixo. Isso não as exclui permanentemente.",
                "Destination folder": "Pasta de destino",
                "Detect Trash automatically": "Detectar a lixeira automaticamente",
                "Checking messages and folders…": "Verificando mensagens e pastas…",
                "Move to: ": "Mover para: ",
                "Confirmation expires in 90 seconds and must be renewed if the mailbox changes. A 5-minute Undo is offered when the server returns destination UIDs.": "A confirmação expira em 90 segundos e precisa ser renovada se a caixa mudar. Um desfazer de 5 minutos é oferecido quando o servidor retorna os UIDs de destino.",
                "Moving…": "Movendo…",
                "Confirm move: ": "Confirmar movimentação: ",
                "Email image": "Imagem do e-mail",
                "Failed to load; retry available": "Falha ao carregar; nova tentativa disponível",
                "External image blocked": "Imagem externa bloqueada",
                "Loading…": "Carregando…",
                "View formatted message": "Ver a mensagem formatada",
                "View plain text": "Ver texto simples",
                "External images allowed for this message": "Imagens externas permitidas para esta mensagem",
                "Load external images (": "Carregar imagens externas (",
                "Retry images": "Tentar imagens novamente",
                "External images are blocked by default. Loading may reveal your reading time and network address to the sender. Consent applies only to this message.": "Imagens externas são bloqueadas por padrão. Carregá-las pode revelar ao remetente seu horário de leitura e endereço de rede. O consentimento vale apenas para esta mensagem.",
                "Body or formatting exceeds the display limit. Some content was omitted; try plain text or your mail client.": "O corpo ou a formatação excede o limite de exibição. Parte do conteúdo foi omitida; tente o texto simples ou seu cliente de e-mail.",
                "Message details": "Detalhes da mensagem",
                "Mark unread": "Marcar como não lido",
                "Mark read": "Marcar como lido",
                "Unstar": "Remover a estrela",
                "Star": "Destacar",
                "Edit the reply in Drafts. Review and confirm before sending.": "Edite a resposta em Rascunhos. Revise e confirme antes de enviar.",
            },
            ru: {
                "Enter the custom proxy URL.": "Введите адрес собственного прокси.",
                "Create a Desktop app OAuth client in Google Cloud, enable Gmail mail consent and add your account as a test user. Complete sign-in in your browser; no mailbox password is needed.": "Создайте в Google Cloud OAuth-клиент типа «Desktop app», включите согласие для Gmail и добавьте свой аккаунт в тестовые пользователи. Вход завершается в браузере; пароль от почтового ящика не требуется.",
                "Google client secret (if issued)": "Секрет клиента Google (если выдан)",
                "Saved; leave unchanged to keep": "Сохранено; оставьте без изменений, чтобы сохранить",
                "Open Google authorization; this panel updates after sign-in.": "Откройте страницу авторизации Google; после входа панель обновится.",
                "Enter your Google Desktop app client ID. App passwords remain available where your account policy permits.": "Укажите идентификатор клиента вашего приложения Google для настольных систем. Пароли приложений остаются доступны, если это разрешает политика аккаунта.",
                "Sign in with Google": "Войти через Google",
                "API connected · ": "API подключён · ",
                "POP3 connected · ": "POP3 подключён · ",
                "; SMTP sending was not tested": "; отправка через SMTP не проверялась",
                "Incoming protocol": "Протокол получения",
                "POP3 reads the inbox and uses SMTP for sending. Server read/star flags and a Sent folder are unavailable; search shows its scan coverage.": "POP3 читает только входящие, а отправка идёт через SMTP. Флагов «прочитано»/«важное» и папки «Отправленные» на сервере нет; поиск сообщает охват.",
                "POP3 incoming server": "Сервер входящей почты POP3",
                "SMTP outgoing server (optional for receiving)": "Сервер исходящей почты SMTP (необязателен для получения)",
                "POP3 host": "Хост POP3",
                "SMTP host": "Хост SMTP",
                "POP3 port": "Порт POP3",
                "SMTP port": "Порт SMTP",
                "TLS is off: POP3 login and content use plaintext. Use only with a trusted server where plaintext is intended. This is not STARTTLS.": "TLS отключён: вход и содержимое POP3 передаются открытым текстом. Используйте только с доверенным сервером, где это предусмотрено. Это не STARTTLS.",
                "Google OAuth requires your own Desktop app client; app-password availability depends on account policy.": "Google OAuth требует собственного клиента приложения для настольных систем; доступность паролей приложений зависит от политики аккаунта.",
                "Connection routing": "Маршрут подключения",
                "Follow global or environment settings": "Следовать глобальным настройкам или переменным среды",
                "Connect directly (ignore proxies)": "Подключаться напрямую (без прокси)",
                "Custom proxy": "Свой прокси",
                "Custom proxy URL": "Адрес своего прокси",
                "Saved; leave blank to retain": "Сохранено; оставьте пустым, чтобы сохранить",
                "Applies to IMAP and SMTP. Supports HTTP CONNECT, HTTPS and SOCKS. Saved URLs may contain passwords and are not displayed. POP3 receiving still connects directly.": "Применяется к IMAP и SMTP. Поддерживаются HTTP CONNECT, HTTPS и SOCKS. Сохранённые адреса могут содержать пароли и не отображаются. Получение по POP3 по-прежнему идёт напрямую.",
                "API key; leave blank to retain saved key": "Ключ API; оставьте пустым, чтобы сохранить текущий",
                "Use an API key from the AgentMail console. The key is stored in the local account configuration; the DSH backend calls the selected region.": "Используйте ключ API из консоли AgentMail. Ключ хранится в локальной конфигурации аккаунта, а бэкенд DSH обращается к выбранному региону.",
                "Mailbox action failed": "Не удалось выполнить действие с почтовым ящиком",
                "Mailbox workbench": "Рабочая область почтового ящика",
                "Moved ": "Перемещено: ",
                " messages to ": " сообщений в ",
                "Undo move": "Отменить перемещение",
                "To restore, move the messages back in your mail client.": "Чтобы восстановить, переместите письма обратно в почтовом клиенте.",
                "Dismiss": "Скрыть",
                "Check account settings": "Проверить настройки аккаунта",
                "Loading accounts…": "Загрузка аккаунтов…",
                "Mailbox unavailable": "Почтовый ящик недоступен",
                "Connect your mailbox": "Подключите почтовый ящик",
                "Account settings": "Настройки аккаунта",
                "Add and test an email account to read and reply here.": "Добавьте и проверьте почтовый аккаунт, чтобы читать и отвечать здесь.",
                "Accounts and folders": "Аккаунты и папки",
                "Search current folder": "Искать в текущей папке",
                "Trash is unavailable for this protocol; delete in your mail client.": "Корзина недоступна для этого протокола; удаляйте письма в почтовом клиенте.",
                "POP3 inbox · Server read/star flags and a Sent folder are unavailable. Replies open in local Drafts and use SMTP after confirmation.": "Входящие POP3 · Флаги «прочитано»/«важное» и папка «Отправленные» недоступны. Ответы открываются в локальных черновиках и отправляются через SMTP после подтверждения.",
                "Select page": "Выбрать страницу",
                "Move to Trash (": "В корзину (",
                ")": ")",
                "Select message: ": "Выбрать письмо: ",
                "Unread": "Непрочитанное",
                "(No subject)": "(Без темы)",
                "Messages could not be loaded": "Не удалось загрузить письма",
                "No results in the current search window.": "В текущем диапазоне поиска ничего не найдено.",
                "This page: ": "На этой странице: ",
                " messages": " писем",
                " · Ranked by relevance": " · По релевантности",
                " · Mailbox arrival order": " · По порядку поступления",
                "Add and test an account in settings to browse mail.": "Добавьте и проверьте аккаунт в настройках, чтобы просматривать почту.",
                "Headers scanned: ": "Проверено заголовков: ",
                "; headers fully covered; body search has a separate limit.": "; заголовки охвачены полностью; у поиска по тексту свой лимит.",
                "; folder coverage is partial.": "; папка охвачена не полностью.",
                "Bodies scanned: ": "Проверено текстов: ",
                " messages; limit ": " писем; лимит ",
                "; bounded by the body display limit.": "; ограничено лимитом отображения текста.",
                "AgentMail ranks results by relevance and excludes spam, trash and other protected mail.": "AgentMail сортирует результаты по релевантности и исключает спам, корзину и другие защищённые письма.",
                "Page ": "Страница ",
                "": "",
                "Search older headers": "Искать более старые заголовки",
                "This message could not be loaded": "Не удалось загрузить это письмо",
                "Open a message to reply in drafts, mark its state or download attachments.": "Откройте письмо, чтобы ответить черновиком, изменить состояние или скачать вложения.",
                "Email action failed": "Не удалось выполнить действие с почтой",
                "View plain-text alternative": "Показать текстовую версию",
                "Submitting / check mailbox": "Отправляется / проверьте ящик",
                "Server receipt saved": "Отметка сервера сохранена",
                "Outcome uncertain, check mailbox": "Результат неизвестен, проверьте ящик",
                "Draft saved. No email was sent.": "Черновик сохранён. Письмо не отправлено.",
                "Scheduled for: ": "Запланировано на: ",
                "A recipient is blocked. Change the draft or recipient rules before sending.": "Один из получателей заблокирован. Измените черновик или правила получателей перед отправкой.",
                "Blocked: ": "Заблокирован: ",
                "Matches a trusted rule": "Соответствует доверенному правилу",
                "(Empty body)": "(Пустое письмо)",
                "Download to check": "Скачать для проверки",
                "Attachments are fixed to this preview. Review again after 10 minutes or when the draft, account or rules change.": "Вложения зафиксированы в этой версии предпросмотра. Проверьте снова через 10 минут или после изменения черновика, аккаунта либо правил.",
                "I checked the sender, all recipients, content and attachments": "Я проверил отправителя, всех получателей, текст и вложения",
                "Review cancelled. No email was sent.": "Проверка отменена. Письмо не отправлено.",
                "Drafts stay on this device. Ask the model to prepare one with email_draft, then edit, save and confirm here.": "Черновики остаются на этом устройстве. Попросите модель подготовить черновик через email_draft, затем отредактируйте, сохраните и подтвердите здесь.",
                "The current draft has unsaved edits.": "В текущем черновике есть несохранённые изменения.",
                "Save and switch": "Сохранить и переключить",
                "Discard edits and switch": "Отменить изменения и переключить",
                "Keep editing": "Продолжить редактирование",
                "Reopen saved version": "Открыть сохранённую версию",
                "Back to drafts": "Назад к черновикам",
                "Untitled draft": "Черновик без названия",
                "No account selected": "Аккаунт не выбран",
                "Unsaved": "Не сохранено",
                "No drafts yet": "Черновиков пока нет",
                "Choose Compose above to begin.": "Нажмите «Написать» выше, чтобы начать.",
                "This draft replies in the original thread and includes a quoted copy. Write above the quote, then review and confirm before sending.": "Этот черновик отвечает в исходной цепочке и содержит цитату. Пишите над цитатой, затем проверьте и подтвердите отправку.",
                "Unsaved edits": "Несохранённые изменения",
                "Send time: ": "Время отправки: ",
                "Cancel schedule and return to draft": "Отменить планирование и вернуться к черновику",
                "Sending account": "Аккаунт отправки",
                "Choose an account": "Выберите аккаунт",
                "Schedule (optional, this device’s timezone)": "Запланировать (необязательно, часовой пояс устройства)",
                "Scheduled send time": "Время запланированной отправки",
                "Keep DSH running. Missed times while closed are not sent on restart; uncertain submissions are never retried automatically.": "DSH должен быть запущен. Пропущенные за время остановки сроки не отправляются после перезапуска; при неясном результате автоматических повторов нет.",
                "Body format": "Формат текста",
                "Plain text": "Обычный текст",
                "Formatted HTML": "Форматированный HTML",
                "Preview and send safe formatting. Plain text is generated when omitted. Scripts and external images are removed.": "Просмотрите и отправьте безопасное форматирование. Если обычный текст не указан, он создаётся. Скрипты и внешние изображения удаляются.",
                "Remove attachment ": "Удалить вложение ",
                "Remove": "Удалить",
                "Add attachments (save edits first; up to 10 files / ": "Добавить вложения (сначала сохраните; до 10 файлов / ",
                " total)": " всего)",
                "Add attachments": "Добавить вложения",
                "Attachment exceeds ": "Вложение превышает ",
                "Attachments added. Review before sending.": "Вложения добавлены. Проверьте перед отправкой.",
                "Some addresses were rejected. This email will not retry automatically. Server accepted: ": "Часть адресов отклонена. Письмо не будет отправлено повторно автоматически. Сервер принял: ",
                "Server receipt saved. This draft will not send again. Server accepted: ": "Отметка сервера сохранена. Этот черновик больше не отправится. Сервер принял: ",
                "none": "нет",
                "Server rejected: ": "Сервер отклонил: ",
                "This confirms the server response, not delivery to the recipient inbox.": "Это подтверждает ответ сервера, а не доставку в ящик получателя.",
                "No receipt yet. Check your mailbox, then refresh the list. Do not send again.": "Отметки пока нет. Проверьте ящик и обновите список. Не отправляйте снова.",
                "Copy to a new draft": "Скопировать в новый черновик",
                "Delete local draft": "Удалить локальный черновик",
                "Copies content and attachments to a new unsent draft. Check the mailbox first if the original was submitted or its result is uncertain.": "Копирует содержимое и вложения в новый неотправленный черновик. Если исходное письмо отправлено или результат неясен, сначала проверьте ящик.",
                "Confirm copy": "Подтвердить копирование",
                "Deletes this local draft and plugin-uploaded copies. Original files and mailbox messages stay intact.": "Удаляет этот локальный черновик и копии, загруженные плагином. Исходные файлы и письма в ящике остаются.",
                "Confirm delete": "Подтвердить удаление",
                "Select a draft or create one to start editing.": "Выберите черновик или создайте новый, чтобы начать.",
                "Rules saved for this account.": "Правила для этого аккаунта сохранены.",
                "Trusted recipients": "Доверенные получатели",
                "Approval is the default. When enabled, email_send skips this plugin's approval only if every To/Cc address matches this account's rules. Host permissions still apply, and drafts still need manual confirmation. Domain rules exclude subdomains.": "По умолчанию требуется подтверждение. Если включено, email_send пропускает подтверждение плагина только когда все адреса To/Cc соответствуют правилам аккаунта. Разрешения хоста продолжают действовать, а черновики по-прежнему требуют ручного подтверждения. Правила домена не включают поддомены.",
                "Blocked recipients take precedence over trusted rules, even with send approval off. Blocks also apply to drafts, replies and forwards. Blocked domains match exactly and exclude subdomains.": "Заблокированные получатели важнее доверенных правил, даже при отключённом подтверждении. Блокировки действуют и для черновиков, ответов и пересылок. Домены блокируются по точному совпадению, без поддоменов.",
                "Trusted reply skipping is off by default and can be enabled in Connection settings. It checks every actual To/Cc for replies, reply-all and forwards; any unmatched recipient still needs confirmation. Use Drafts for manual review if Full Access cannot show a prompt.": "Пропуск подтверждения для доверенных ответов по умолчанию выключен и включается в настройках подключения. Проверяются все фактические To/Cc в ответах, ответах всем и пересылках; любой несовпадающий получатель требует подтверждения. Если Full Access не может показать запрос, используйте «Черновики».",
                "Global send approval is off; blocked-recipient rules still apply.": "Глобальное подтверждение отправки отключено; правила блокировки получателей действуют.",
                "Account for these rules": "Аккаунт для этих правил",
                "Choose a configured account": "Выберите настроенный аккаунт",
                "Rules have unsaved edits.": "В правилах есть несохранённые изменения.",
                "Trusted email addresses (one per line)": "Доверенные адреса (по одному в строке)",
                "Trusted domains (one per line, all mailboxes in that domain)": "Доверенные домены (по одному в строке, все ящики домена)",
                "Blocked email addresses (one per line)": "Заблокированные адреса (по одному в строке)",
                "Blocked domains (one per line)": "Заблокированные домены (по одному в строке)",
                "Skip plugin approval for email_send when all addresses match": "Пропускать подтверждение плагина для email_send, если все адреса совпадают",
                "Save rules for this account": "Сохранить правила для этого аккаунта",
                "Reload rules": "Перезагрузить правила",
                "Unsaved; matching uses the rules you are editing.": "Не сохранено; проверка использует редактируемые правила.",
                "Only saved rules affect model-initiated sends.": "На отправку по инициативе модели влияют только сохранённые правила.",
                "Try recipients To": "Проверить получателей To",
                "Try copy Cc": "Проверить копию Cc",
                "A recipient is blocked; sending is refused.": "Один из получателей заблокирован; отправка отклонена.",
                "All To/Cc match; plugin approval can be skipped.": "Все To/Cc совпадают; подтверждение плагина можно пропустить.",
                "Plugin approval will remain.": "Подтверждение плагина останется.",
                "Match: ": "Совпадение: ",
                "Task operation failed": "Не удалось выполнить действие с задачей",
                "Loading mail tasks…": "Загрузка почтовых задач…",
                "Each line: alias = absolute path to an existing folder": "Каждая строка: псевдоним = абсолютный путь к существующей папке",
                "Duplicate workspace alias": "Псевдоним рабочей области повторяется",
                "Saved. The first check establishes a baseline; only later mail can trigger tasks.": "Сохранено. Первая проверка только задаёт точку отсчёта; задачи запускает лишь последующая почта.",
                "Starting": "Запуск",
                "Running": "Выполняется",
                "Waiting for your input in DSH": "Ожидает вашего подтверждения в DSH",
                "Completed": "Завершена",
                "Needs attention": "Требует внимания",
                "Submitting reply": "Отправка ответа",
                "Replied": "Ответ отправлен",
                "Mail outcome uncertain; check sent mail": "Результат отправки неизвестен; проверьте отправленные",
                "Turn email into a DSH task": "Превратить письмо в задачу DSH",
                "Send a task from an authorized mailbox to an approved workspace, then continue the same session by email. Off by default. Tasks use your model and may incur usage; DSH permissions still require your input.": "Отправьте задачу из разрешённого ящика в одобренную рабочую область и продолжайте ту же сессию по почте. По умолчанию выключено. Задачи используют вашу модель и могут расходовать квоту; разрешения DSH по-прежнему требуют вашего подтверждения.",
                "Native task services are unavailable; update DSH to use this feature.": "Встроенные сервисы задач недоступны; обновите DSH, чтобы использовать эту функцию.",
                "Task subject prefix": "Префикс темы задачи",
                "Allowed senders (one per line; empty means the mailbox itself)": "Разрешённые отправители (по одному в строке; пусто — сам ящик)",
                "Workspace aliases (each line: alias = absolute folder path)": "Псевдонимы рабочих областей (в строке: псевдоним = абсолютный путь к папке)",
                "work = /home/me/projects/my-project": "work = /home/me/projects/my-project",
                "Tasks can use only saved aliases. Existing sessions must belong to that workspace.": "Задачи используют только сохранённые псевдонимы. Существующие сессии должны относиться к этой рабочей области.",
                "New key shown once; the old key is invalid. Save your configuration before enabling.": "Новый ключ показывается один раз; старый уже недействителен. Сохраните настройки перед включением.",
                "Rotate task key (pauses tasks)": "Сменить ключ задач (приостанавливает задачи)",
                "Generate task key": "Создать ключ задач",
                "Copy this email template and keep the key private": "Скопируйте этот шаблон письма и храните ключ в тайне",
                "Write your task here": "Напишите здесь задачу",
                "Hide key": "Скрыть ключ",
                "Subject: dsh:alias or dsh:alias:sessionId. Begin the body with DSH-Key: your-task-key, then write the task. The key authorizes whitelisted senders to start tasks in your approved workspace; keep it private.": "Тема: dsh:псевдоним или dsh:псевдоним:sessionId. Начните текст строкой DSH-Key: ваш-ключ-задачи, затем напишите задачу. Ключ разрешает отправителям из белого списка запускать задачи в одобренной рабочей области; храните его в тайне.",
                "Automatically email the final result to the authorized sender (no Cc; recipient blocks apply)": "Автоматически отправлять итог авторизованному отправителю (без Cc; действуют блокировки получателей)",
                "Poll interval (seconds)": "Интервал проверки (секунды)",
                "Advanced matching and extraction": "Расширенное сопоставление и извлечение",
                "Rules run after sender and key checks. Use all / any, fields subject / body / from / to / cc, operators contains / equals / regex. Named captures work as ${name} in workspace, session and prompt; ${body} is the body with the key and quoted history removed. Workspace results must match an allowed alias.": "Правила выполняются после проверки отправителя и ключа. Доступны all / any, поля subject / body / from / to / cc, операторы contains / equals / regex. Именованные группы подставляются как ${name} в workspace, session и prompt; ${body} — текст без ключа и цитируемой переписки. Результат рабочей области должен совпадать с разрешённым псевдонимом.",
                "Rules (JSON array)": "Правила (массив JSON)",
                "Check finished; see task records below.": "Проверка завершена; записи задач ниже.",
                "Clear finished task records": "Очистить записи завершённых задач",
                "Keep DSH running. In-progress tasks are not replayed after restart. Handle approvals, timeouts or manual takeover in the original session.": "DSH должен быть запущен. Незавершённые задачи не повторяются после перезапуска. Подтверждения, тайм-ауты и ручную передачу обрабатывайте в исходной сессии.",
                "Session ID": "ID сессии",
                "Open DSH session": "Открыть сессию DSH",
                "No tasks yet. The first check establishes a baseline.": "Задач пока нет. Первая проверка только задаёт точку отсчёта.",
                "Retry save": "Повторить сохранение",
                "Show new-mail popups": "Показывать уведомления о новых письмах",
                "Turning this off hides the popup and stops automatic mail checks. You can still check mail in a conversation. Turning it back on starts with a fresh baseline.": "Отключение скрывает уведомление и останавливает автоматические проверки. Проверять почту в беседе по-прежнему можно. При повторном включении отсчёт начнётся заново.",
                "Reply quote language": "Язык цитаты в ответах",
                "Follow interface; English if unknown": "Как в интерфейсе; английский, если неизвестно",
                "Allow trusted replies without confirmation (off by default)": "Разрешать доверенные ответы без подтверждения (по умолчанию выключено)",
                "When enabled, every actual To/Cc in a reply, reply-all or forward must match that account’s trusted rules. Block rules and host permissions still apply.": "Если включено, все фактические To/Cc в ответе, ответе всем или пересылке должны соответствовать доверенным правилам аккаунта. Правила блокировки и разрешения хоста продолжают действовать.",
                "Quote date timezone (optional)": "Часовой пояс даты цитаты (необязательно)",
                "These accounts are managed in the configuration file: ": "Эти аккаунты управляются в файле конфигурации: ",
                "You can save general settings here. Accounts and credentials are preserved; add or edit accounts in the configuration accounts map.": "Здесь можно сохранить общие настройки. Аккаунты и учётные данные сохраняются; добавляйте и изменяйте аккаунты в карте accounts конфигурации.",
                " messages\n": " писем\n",
                "Manage custom IMAP folders. Purge requires preview and confirmation, affects reviewed messages only, and requires UIDPLUS (up to 2000 messages). Only empty folders can be deleted. Permanent deletion cannot be undone.": "Управление пользовательскими папками IMAP. Очистка требует предпросмотра и подтверждения, затрагивает только проверенные письма и требует UIDPLUS (до 2000 писем). Удалять можно только пустые папки. Окончательное удаление необратимо.",
                "New folder": "Новая папка",
                "e.g. Tenders": "напр. Тендеры",
                "Create": "Создать",
                "Save": "Сохранить",
                "(System folder)": "(Системная папка)",
                "Rename": "Переименовать",
                "Empty permanently deletes every message in this folder. Continue?": "Очистка окончательно удалит все письма в этой папке. Продолжить?",
                "Empty": "Очистить",
                "Delete removes the folder and all its messages forever. Continue?": "Удаление безвозвратно удалит папку и все её письма. Продолжить?",
                "Move to Trash": "В корзину",
                "Move the selected messages to the existing folder below. This does not permanently delete them.": "Перемещает выбранные письма в существующую папку ниже. Окончательного удаления не происходит.",
                "Destination folder": "Папка назначения",
                "Detect Trash automatically": "Определять корзину автоматически",
                "Checking messages and folders…": "Проверка писем и папок…",
                "Move to: ": "Переместить в: ",
                "Confirmation expires in 90 seconds and must be renewed if the mailbox changes. A 5-minute Undo is offered when the server returns destination UIDs.": "Подтверждение действует 90 секунд и требует обновления при изменении ящика. Отмена доступна 5 минут, если сервер вернул UID назначения.",
                "Moving…": "Перемещение…",
                "Confirm move: ": "Подтвердить перемещение: ",
                "Email image": "Изображение из письма",
                "Failed to load; retry available": "Не удалось загрузить; можно повторить",
                "External image blocked": "Внешнее изображение заблокировано",
                "Loading…": "Загрузка…",
                "View formatted message": "Показать форматированное письмо",
                "View plain text": "Показать обычный текст",
                "External images allowed for this message": "Внешние изображения разрешены для этого письма",
                "Load external images (": "Загрузить внешние изображения (",
                "Retry images": "Повторить загрузку изображений",
                "External images are blocked by default. Loading may reveal your reading time and network address to the sender. Consent applies only to this message.": "Внешние изображения по умолчанию блокируются. Их загрузка может раскрыть отправителю время прочтения и сетевой адрес. Согласие действует только для этого письма.",
                "Body or formatting exceeds the display limit. Some content was omitted; try plain text or your mail client.": "Текст или форматирование превышают лимит отображения. Часть содержимого опущена; попробуйте обычный текст или почтовый клиент.",
                "Message details": "Сведения о письме",
                "Mark unread": "Отметить как непрочитанное",
                "Mark read": "Отметить как прочитанное",
                "Unstar": "Снять отметку",
                "Star": "Пометить",
                "Edit the reply in Drafts. Review and confirm before sending.": "Отредактируйте ответ в «Черновиках». Проверьте и подтвердите перед отправкой.",
            },
        };
        function inlineLocaleKeys() {
            const keys = new Set();
            for (const table of [INLINE_LOCALE_OVERRIDES, INLINE_LOCALE_COMPLETION])
                for (const language of Object.keys(table))
                    for (const english of Object.keys(table[language])) keys.add(english);
            return [...keys];
        }
        function emailLocaleDictionaries() {
            const dictionaries = {};
            const inlineKeys = inlineLocaleKeys();
            for (const language of ["zh", "en", "es", "fr", "de", "ja", "pt", "ru"]) {
                const table = language === "zh" ? UI.zh : UI[language] || UI.en;
                dictionaries[language] = Object.assign({}, table);
                // English carries an identity mapping for every phrase: it is the end of
                // the host's fallback chain, so a missing key here would surface as the
                // raw "inline:…" identifier instead of readable copy.
                const inline = language === "zh" ? null
                    : Object.assign({}, INLINE_LOCALE_OVERRIDES[language], INLINE_LOCALE_COMPLETION[language]);
                if (language === "en") for (const english of inlineKeys) dictionaries[language]["inline:" + english] = english;
                else if (inline) for (const [english, translated] of Object.entries(inline)) dictionaries[language]["inline:" + english] = translated;
            }
            return dictionaries;
        }
        const EMAIL_LOCALE_NAMESPACE = "dsh-email";
        const EMAIL_LOCALE_IDS = ["zh", "en", "es", "fr", "de", "ja", "pt", "ru"];
        const EMAIL_LOCALE_LABELS = {
            zh: "中文", en: "English", es: "Español", fr: "Français", de: "Deutsch",
            ja: "日本語", pt: "Português (Brasil)", ru: "Русский",
        };
        /**
         * 当前界面语言。真正的语言选择、持久化和 fallback 由 DSH locale runtime 负责；
         * UI_LANG 只为旧宿主和模块尚未挂载 locale 服务时保留一个兼容初值。
         */
        var UI_LANG = "zh";
        var activeLocaleService = null;
        var localeTranslate = null;
        function uiLanguage() {
            try {
                const active = activeLocaleService?.getSnapshot?.().active;
                if (active !== undefined && active !== null && String(active) !== "") return localeToLang(active);
            }
            catch { /* 旧宿主可能没有完整的 locale snapshot */ }
            return UI_LANG;
        }
        function inlineText(zh, en) {
            const language = uiLanguage();
            if (language === "zh") return zh;
            if (language === "en") return en;
            const key = "inline:" + en;
            if (typeof localeTranslate === "function") {
                const localized = localeTranslate(key);
                if (localized !== key) return localized;
            }
            const table = Object.assign({}, INLINE_LOCALE_OVERRIDES[language], INLINE_LOCALE_COMPLETION[language]);
            return table && Object.prototype.hasOwnProperty.call(table, en) ? table[en] : en;
        }
        /**
         * Resolve the host language against the available UI dictionaries.
         * Unknown locales use English; hosts without a locale service keep the zh initial value.
         */
        function localeToLang(active) {
            const tag = String(active === undefined || active === null ? "" : active).toLowerCase();
            for (const language of ["zh", "en", "es", "fr", "de", "ja", "pt", "ru"])
                if (tag.indexOf(language) === 0)
                    return language;
            return "en";
        }
        /**
         * 语言切换后的重绘钩子。React 那边由各自的 setState / 外壳的 locale 订阅兜底，
         * 命令式 DOM（鲸鱼娘弹窗）没有那一层，只能自己登记一个。同一时刻只有可能开着一个
         * 弹窗，所以这里是单槽而不是列表；弹窗销毁时它会把自己的钩子摘掉。
         */
        var relocalize = null;
        /**
         * 取 locale 服务。两条路都试，因为「服务在不在」和「ctx 长什么样」是两件事：
         *   - ctx.get('locale') 是可选服务的正规读法（服务缺席时返回 undefined）；
         *   - ctx.locale 直接读，留给没有 get() 的旧 ctx。
         * 两条都拿不到就返回 null —— 调用方按「没有 locale」处理。
         */
        function localeServiceOf(ctx) {
            try {
                if (typeof ctx.get === "function") {
                    const viaGet = ctx.get("locale");
                    if (viaGet !== undefined && viaGet !== null)
                        return viaGet;
                }
            }
            catch (e) { /* use the direct service when available */ }
            const direct = ctx.locale;
            return direct === undefined || direct === null ? null : direct;
        }
        function registerEmailLocale(service) {
            if (!service || typeof service.register !== "function" || typeof service.addLanguage !== "function") return () => { };
            const disposers = [];
            const snapshot = service.getSnapshot?.();
            const hasCatalog = Array.isArray(snapshot?.locales);
            if (!hasCatalog) return () => { };
            const available = new Set((snapshot.locales || []).map(locale => String(locale.id).toLowerCase()));
            if (typeof service.addLanguage === "function" && hasCatalog) {
                for (const language of EMAIL_LOCALE_IDS) {
                    if (language === "zh" || language === "en" || available.has(language)) continue;
                    try {
                        const dispose = service.addLanguage({ id: language, label: EMAIL_LOCALE_LABELS[language], fallback: "en" });
                        if (typeof dispose === "function") disposers.push(dispose);
                        available.add(language);
                    }
                    catch { /* an unavailable optional locale falls back to English */ }
                }
            }
            const dictionaries = emailLocaleDictionaries();
            for (const language of EMAIL_LOCALE_IDS) {
                if (hasCatalog && !available.has(language)) continue;
                try {
                    const dispose = service.register(EMAIL_LOCALE_NAMESPACE, language, dictionaries[language]);
                    if (typeof dispose === "function") disposers.push(dispose);
                }
                catch (error) {
                    // Baseline registrations must work on the supported DSH client API.
                    if (language === "zh" || language === "en") throw error;
                }
            }
            try { localeTranslate = service.bind?.(EMAIL_LOCALE_NAMESPACE) || null; }
            catch { localeTranslate = null; }
            return () => {
                localeTranslate = null;
                for (const dispose of disposers.reverse()) {
                    try { dispose(); }
                    catch { /* one stale locale registration must not block cleanup */ }
                }
            };
        }
        /** Subscribe to DSH's locale runtime and redraw the imperative popup on language changes. */
        function subscribeLocale(ctx) {
            const service = localeServiceOf(ctx);
            activeLocaleService = service;
            const disposeDictionaries = registerEmailLocale(service);
            const apply = () => {
                try {
                    if (typeof service?.getSnapshot === "function") UI_LANG = localeToLang(service.getSnapshot().active);
                }
                catch { UI_LANG = "en"; }
                if (typeof relocalize === "function") {
                    try { relocalize(); }
                    catch { /* popup redraw failures must not break locale subscribers */ }
                }
            };
            apply();
            let unsubscribe = () => { };
            try {
                if (typeof service?.subscribe === "function") {
                    const off = service.subscribe(apply);
                    if (typeof off === "function") unsubscribe = off;
                }
            }
            catch { /* service is optional on older hosts */ }
            return () => { unsubscribe(); disposeDictionaries(); activeLocaleService = null; };
        }
        /** 取一条界面文案。{name} 占位符按字面替换（不是正则、也不做 HTML 转义 ——
         * 这些文案全部进 DOM 文本节点或 textContent，从不拼成 HTML）。
         *
         * 回退只有一级：**语言表里没有 key、或整张语言表不存在，都返回 key 本身**。
         * 刻意不退回 zh —— 两张表理应逐键相同，真漏一条就露一条 'card.add'，漏译在界面
         * 上现形；静默退回中文会让「英文界面里混着中文」这种半成品看起来像做完了。
         */
        function t(key, params) {
            const language = uiLanguage();
            const table = UI[language] || UI.en;
            let raw = table && Object.prototype.hasOwnProperty.call(table, key) ? table[key] : UI.en && Object.prototype.hasOwnProperty.call(UI.en, key) ? UI.en[key] : key;
            if (typeof localeTranslate === "function" && language !== "zh" && language !== "en") {
                const localized = localeTranslate(key);
                if (localized !== key) raw = localized;
            }
            if (typeof raw !== "string" || params === undefined || params === null)
                return raw;
            return raw.replace(/\{(\w+)\}/g, (whole, name) => Object.prototype.hasOwnProperty.call(params, name) ? String(params[name]) : whole);
        }
        function formatDate(value) {
            const date = new Date(value);
            if (Number.isNaN(date.getTime())) return value;
            const locales = { zh: 'zh-CN', en: 'en-US', es: 'es-ES', fr: 'fr-FR', de: 'de-DE', ja: 'ja-JP', pt: 'pt-BR', ru: 'ru-RU' };
            return new Intl.DateTimeFormat(locales[uiLanguage()] || 'en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
        }
        const dt = inlineText;
        function fieldInput(type, value, onChange, placeholder) {
            return h("input", {
                type,
                value: value === undefined || value === null ? "" : String(value),
                placeholder,
                onChange: (e) => onChange(e.target.value),
            });
        }
        // ---------------------------------------------------------------------------
        // 多账户卡片编辑器 helper。纯函数，不认识 React state：卡片是「账号名 -> 草稿」
        // 的扁平映射，任何字段都可能是半填状态。
        // ---------------------------------------------------------------------------
        /**
         * 卡片行的稳定内部 id。React key 只认它：账号名/预设名每敲一个字符都变，用名字
         * 当 key 会让整张卡重挂载、输入框失焦。id 只在「卡片集合来源变化」（加载 / 解析
         * YAML / 从快照重建）时重新分配，改名不动它。
         */
        let nextCardId = 1;
        let nextPresetId = 1;
        /**
         * 卡片集合来源变化（加载 / 解析 YAML / 从快照重建）时重建顺序表：每行拿一个新 id。
         * 行 = { id, key }，key 是草稿映射的键（账号名 / 预设名，也就是 YAML 的键）。
         */
        function cardRows(names) {
            return (names || []).map((key) => ({ id: nextCardId++, key }));
        }
        function presetRows(names) {
            return (names || []).map((key) => ({ id: nextPresetId++, key }));
        }
        /** 改名只换行的 key，id 不动 —— React key 不变，输入框不会重挂载失焦。 */
        function rekeyRows(rows, oldKey, nextKey) {
            return rows.map((row) => (row.key === oldKey ? { id: row.id, key: nextKey } : row));
        }
        /** 新卡片的空草稿。账号只认服务商 + 凭证，端点由预设展开，草稿里不存端点。 */
        function emptyAccountDraft(name) {
            return {
                name: name === undefined ? "" : name,
                provider: "",
                user: "",
                password: "",
                proxy: "", proxyMode: "inherit", hasProxy: false, proxyDirty: false,
                inboxFolder: "INBOX",
            };
        }
        /** 卡片上的 provider 名 -> 那个 provider 的登录方式。没有卡片数据时按本地名单预判。 */
        function authKindOf(provider) {
            return OAUTH2_PROVIDERS.indexOf(String(provider === undefined || provider === null ? "" : provider)) >= 0
                ? "oauth2"
                : "password";
        }
        /** 这张卡片是不是走 OAuth2：服务端字段优先（它知道真实预设表），否则本地按名单判。 */
        function isOauthDraft(draft) {
            if (draft === null || draft === undefined)
                return false;
            if (draft.authKind === "oauth2")
                return true;
            if (draft.authKind === "password")
                return false;
            return authKindOf(draft.provider) === "oauth2";
        }
        /**
         * 服务端卡片（永不含密码明文）-> 草稿。user 为空表示「就留空」，不是未加载。
         * 卡片的 imap/smtp 是后端计算的生效端点，只用于显示，不写回 YAML。
         * 它们可能包含用户明确指定的服务器，不能用服务商默认值代替。
         * authKind/oauthState/oauthUser 是卡片的登录态投影，只用于显示与本地判定，
         * 不进 draftToInput（它们不是 YAML 的字段，后端认的是账号自己的 oauth 段）。
         */
        /**
         * 卡片对应的服务商取值：真实服务商名 / 自定义服务器哨兵 / 空（还没选）。
         * 没有 provider 但快照已经带着显式端点的卡片，是 YAML 里手写的自定义服务器
         * 账号，也可能是刚存下的自定义账号 —— 下拉要选中「自定义服务器」，
         * 端点才会以可编辑的输入框出现。
         */
        function providerOfCard(card) {
            const named = card.provider === undefined || card.provider === null ? "" : String(card.provider);
            if (named !== "")
                return named;
            const hasEndpoint = card.receiveProtocol === "pop3"
                ? String(card.pop3?.host || "").trim() !== ""
                : String(card.imap?.host || "").trim() !== "" || String(card.smtp?.host || "").trim() !== "";
            return hasEndpoint ? CUSTOM_SERVER_PROVIDER : "";
        }
        /**
         * 自定义服务器账号的端点齐了吗：POP3 只看 pop3.host，IMAP 只看 imap.host ——
         * 发信主机可以留空，draftToInput 会用收信主机补齐（与卡片标签「留空沿用收信
         * 服务器」一致）。
         */
        function customEndpointsPresent(draft) {
            if (draft.receiveProtocol === 'pop3')
                return String(draft.pop3?.host || "").trim() !== "";
            return String(draft.imap?.host || "").trim() !== "";
        }
        function draftFromCard(card) {
            return {
                proxy: "", proxyMode: card.proxyMode || "inherit", hasProxy: card.hasProxy === true, proxyDirty: false,
                name: String(card.name || ""),
                originalName: String(card.name || ""),
                imap: card.imap,
                receiveProtocol: card.receiveProtocol === 'pop3' ? 'pop3' : 'imap',
                pop3: card.pop3 || { host: '', port: 995, secure: true },
                smtp: card.smtp,
                provider: providerOfCard(card),
                user: card.user === undefined || card.user === null ? "" : String(card.user),
                password: "",
                // 登录密码与 password 同一套三态契约：卡片永远拿不到明文，只有"是否已存"。
                authPassword: "",
                hasAuthPassword: card.hasAuthPassword === true,
                senderName: card.senderName === undefined || card.senderName === null ? "" : String(card.senderName),
                authUser: card.authUser === undefined || card.authUser === null ? "" : String(card.authUser),
                clientId: card.clientId === undefined || card.clientId === null ? "" : String(card.clientId),
                clientSecret: "", hasClientSecret: card.hasClientSecret === true,
                oauthProvider: card.oauthProvider || (card.provider === 'gmail' ? 'google' : 'microsoft'),
                // 卡片只在账号自己的 clientId 为空时报内置值：它是「留空会用哪个应用」的答案，
                // 不是账号的字段，所以既不进 YAML，也不参与三态写入。
                defaultClientId: card.oauthDefaultClientId === undefined || card.oauthDefaultClientId === null
                    ? ""
                    : String(card.oauthDefaultClientId),
                // authKind 是生效裁决（决定显示登录区还是密码框），authKindSetting 是用户钉住
                // 了什么（'' = 自动）。两者必须分开：都从裁决读的话，「自动」与「显式密码」在
                // 编辑器里长得一样，那条给混合/本地租户留的退路就没法从面板操作。
                authKindSetting: card.authKindDeclared === "oauth2" || card.authKindDeclared === "password" ? card.authKindDeclared : "",
                inboxFolder: card.inboxFolder === undefined || card.inboxFolder === null ? "INBOX" : String(card.inboxFolder),
                authKind: card.authKind === "oauth2" || card.authKind === "password" ? card.authKind : undefined,
                oauthState: card.oauthState === "pending" || card.oauthState === "logged-in" ? card.oauthState : "none",
                oauthUser: card.oauthUser === undefined || card.oauthUser === null ? "" : String(card.oauthUser),
            };
        }
        /** 卡片列表 -> { 账号名: 草稿 }。同名重复只留第一个（账号名是映射键）。 */
        function draftsFromCards(list) {
            const map = {};
            for (const card of list || []) {
                const name = String(card.name || "");
                if (name === "" || Object.prototype.hasOwnProperty.call(map, name))
                    continue;
                map[name] = draftFromCard(card);
            }
            return map;
        }
        /**
         * 下拉的选项集合：内置服务商 + AgentMail + serverPresets 里的自定义名 +
         * 永远存在的「自定义服务器」。自定义预设项的显示文案取预设自己的 label
         * （预设编辑器里那个「显示名」），没写 label 才退回预设名。
         */
        function providerOptions(presets) {
            const out = PROVIDERS.map(([value, labelKey]) => ({ value, label: t(labelKey) }));
            out.push({ value: "agentmail", label: "AgentMail (US API)" }, { value: "agentmail-eu", label: "AgentMail (EU API)" });
            // 内网/自建服务器没有预设名可用：选中它以后端点在卡片里直接填，
            // 账号的 imap/smtp 段就是端点的存放处。
            out.push({ value: CUSTOM_SERVER_PROVIDER, label: t("provider.customServer") });
            const custom = (presets && presets.custom) || {};
            for (const name of Object.keys(custom)) {
                if (name === "" || name === CUSTOM_SERVER_PROVIDER)
                    continue;
                if (out.some((option) => option.value === name))
                    continue;
                const entry = custom[name] || {};
                out.push({ value: name, label: presetLabelOf(name, entry) });
            }
            return out;
        }
        /** 预设的显示名：label 优先，没有就用预设名本身（label 只是显示名，不是键）。 */
        function presetLabelOf(name, preset) {
            const label = preset && typeof preset.label === "string" ? preset.label.trim() : "";
            return label !== "" ? label : String(name);
        }
        /**
         * select 的 value 必须能在选项里找到：否则浏览器把选中项显示成空/错位，等于把
         * 真实值藏起来。YAML 里本来就没有 provider、或用了一个没写进 serverPresets 的
         * 名字时，补一条只代表「当前值」的占位项（不改变 provider 本身，也不新增端点编辑）。
         */
        function providerOptionsFor(presets, current) {
            const out = providerOptions(presets);
            const value = current === undefined || current === null ? "" : String(current);
            if (out.some((option) => option.value === value))
                return out;
            const placeholder = { value, label: value === "" ? t("provider.noneInYaml") : value + t("provider.undefinedPresetSuffix") };
            return value === "" ? [placeholder].concat(out) : out.concat([placeholder]);
        }
        /**
         * 选服务商：大部分服务商只把 provider 键写进草稿 —— 端点不展开，账号在 YAML 里
         * 只记 provider id，host/port/secure 由后端在解析时从预设表展开，前端抄一份只会是
         * 一份会过期的副本（预设改了它不会跟着变，保存时还会把它写回 YAML）。
         * 预设名合不合法由后端裁定：它才是预设表的持有者。
         *
         * 「自定义服务器」是例外：它没有预设可展开，端点就存在账号自己的 imap/smtp 段
         * 里。所以选中它时把端点草稿清成空白、端口填默认值（993/465），交给用户填。
         *
         * 换服务商 = 换一套凭证：旧服务商的密码留着毫无意义（后端也不会拿它去连新主机），
         * 而 oauth2 的服务商本来就不要密码。所以这里顺手清掉 password 和登录态投影，
         * 免得「qq 的授权码」被当成 outlook 的密码交上去。
         */
        function applyPreset(draft, provider) {
            const next = provider === undefined || provider === null ? "" : String(provider);
            const custom = next === CUSTOM_SERVER_PROVIDER;
            return Object.assign({}, draft, {
                provider: next,
                receiveProtocol: custom || next.startsWith('agentmail')
                    ? (custom && draft.receiveProtocol === 'pop3' ? 'pop3' : 'imap')
                    : draft.receiveProtocol,
                imap: custom ? { host: "", port: 993, secure: true } : undefined,
                pop3: custom ? { host: "", port: 995, secure: true } : undefined,
                smtp: custom ? { host: "", port: 465, secure: true } : undefined,
                password: "",
                authKind: undefined,
                authKindSetting: '',
                oauthProvider: next === 'gmail' ? 'google' : 'microsoft',
                clientId: '', clientSecret: '', hasClientSecret: false,
                oauthState: "none",
                oauthUser: "",
            });
        }
        /**
         * 草稿 -> serializeAccounts 的输入。密码三态在这里定型：'' 或 untouched 都不带
         * password 键（继承已存密码），只有用户真的打了字才写进去。服务商账号的端点一概
         * 不带：账号只存 provider id，后端 resolveAccount() 在连接时从预设表展开。
         * 「自定义服务器」账号是唯一的例外：它没有预设，端点必须随卡片写进账号的
         * imap/smtp 段，否则后端没有任何地方能把它展开出来。
         *
         * OAuth2 账号没有密码可带：登录结果（refresh token）由后端 oauthLogin/oauthPoll
         * 自己落盘，前端一个字都不写。authKind/oauthState/oauthUser 是显示用的投影，
         * 不是 YAML 字段，一个都不进这份输入。
         */
        function draftToInput(draft) {
            const input = {
                name: draft.name,
                originalName: draft.originalName,
                user: draft.user,
                inboxFolder: draft.inboxFolder,
            };
            const endpoint = value => ({host:String(value?.host || '').trim(),...(String(value?.port ?? '') !== '' ? {port:Number(value.port)} : {}),secure:value?.secure !== false});
            if (draft.receiveProtocol !== undefined) input.receiveProtocol = draft.receiveProtocol;
            if (draft.receiveProtocol === 'pop3') {
                input.pop3 = endpoint(draft.pop3);
                // 发信主机留空时不写 smtp：POP3 收信不依赖 SMTP，写一个空端点只会把
                // 「还没配发信」伪装成已配置。
                if (draft.smtp && String(draft.smtp.host || '').trim() !== '') input.smtp = endpoint(draft.smtp);
            } else if (String(draft.provider || '') === CUSTOM_SERVER_PROVIDER) {
                // 自定义服务器：端点直接写进账号的 imap/smtp 段（后端 resolveAccount 的
                // 「省略 provider 直接填 imap.host 与 smtp.host」路径）。端口留空时把
                // 默认值显式写下去（IMAP 993 / SMTP 465），避免「文档说 993、YAML 里
                // 却没有 port、连接层只能靠隐式默认」的歧义。
                const endpointWithDefault = (value, defaultPort) => ({
                    host: String(value?.host || '').trim(),
                    port: String(value?.port ?? '') !== '' ? Number(value.port) : defaultPort,
                    secure: value?.secure !== false,
                });
                const imap = endpointWithDefault(draft.imap, 993);
                const smtp = endpointWithDefault(draft.smtp, 465);
                // 发信服务器主机留空时沿用收信服务器：内网/自建邮箱通常同一台机器，
                // 用户只需要填一次地址。
                if (smtp.host === '') smtp.host = imap.host;
                input.imap = imap;
                input.smtp = smtp;
            }
            if (draft.provider && draft.provider !== CUSTOM_SERVER_PROVIDER)
                input.provider = draft.provider;
            if (!isOauthDraft(draft) && draft.password)
                input.password = draft.password;
            // 显示名/登录名是普通三态字段（留空 = 清掉该键），密码与 password 同规：只有真打了字才写。
            if (draft.senderName !== undefined)
                input.senderName = String(draft.senderName || "").trim();
            if (!isOauthDraft(draft) && draft.authUser !== undefined)
                input.authUser = String(draft.authUser || "").trim();
            if (!isOauthDraft(draft) && draft.authPassword)
                input.authPassword = draft.authPassword;
            if (draft.proxyDirty) {
                if (draft.proxyMode === 'custom' && !draft.proxy.trim() && !draft.hasProxy) throw new Error(dt('请填写自定义代理地址。', 'Enter the custom proxy URL.'));
                if (draft.proxyMode !== 'custom' || draft.proxy.trim()) input.proxy = draft.proxyMode === 'direct' ? 'direct' : draft.proxyMode === 'custom' ? draft.proxy.trim() : '';
            }
            // Only an OAuth2 card models the application id; for any other account the
            // field stays undefined, which the backend reads as「没说」and leaves the
            // stored key alone. An empty string here is the user clearing it on purpose.
            if (isOauthDraft(draft))
                input.clientId = String(draft.clientId || "").trim();
            if (isOauthDraft(draft)) input.oauthProvider = draft.provider === 'gmail' ? 'google' : draft.oauthProvider || 'microsoft';
            if (isOauthDraft(draft) && draft.clientSecret !== undefined && (draft.clientSecret || draft.clientSecretDirty)) input.clientSecret = draft.clientSecret;
            // '' is a real value here, not an omission: it takes the pin off and returns
            // the account to the derivation. Only a draft that models the selector speaks.
            if (draft.authKindSetting !== undefined)
                input.authKind = String(draft.authKindSetting || "");
            return input;
        }
        /**
         * 半填账号：名字、邮箱地址、服务商三者缺一都算。服务商是账号的连接身份：
         * 没有服务商又没有完整的自定义服务器端点时，就没有端点可展开。
         * 「自定义服务器」账号没有预设可查，端点本身就在卡片里，按端点是否填齐判断。
         * OAuth2 账号不要密码：有 (name, provider, user) 就算填完了。
         */
        function accountIncomplete(draft) {
            if (String(draft.name || "").trim() === "" || String(draft.user || "").trim() === "")
                return true;
            const provider = String(draft.provider || "").trim();
            if (provider === CUSTOM_SERVER_PROVIDER)
                return !customEndpointsPresent(draft);
            return provider === "" && !customEndpointsPresent(draft);
        }
        /** 改过名字后草稿要跟着键走：旧键删掉，整份草稿（含 imap/smtp）搬到新键下。 */
        function renameDrafts(drafts, oldName, nextName) {
            if (nextName !== oldName && Object.prototype.hasOwnProperty.call(drafts, nextName)) {
                throw new Error(t("card.errDuplicateName"));
            }
            const next = {};
            for (const key of Object.keys(drafts)) {
                if (key === oldName)
                    continue;
                next[key] = drafts[key];
            }
            const entry = drafts[oldName];
            if (entry !== undefined)
                next[nextName] = Object.assign({}, entry, { name: nextName });
            return next;
        }
        /**
         * 卡片徽标：内置服务商用中文名，自定义预设用它自己的 label（没 label 用预设名），
         * 未知/未指定一律「自定义」。徽标只负责显示，provider 的键始终是预设名。
         * 「自定义」判据用 hasOwnProperty 而不是端点是否到位：刚存下的预设名会先一步进
         * presets.custom（值还是 undefined，端点要等下一次快照），它已经是合法预设了。
         */
        function accountSummary(draft, presets) {
            if (draft.provider === "agentmail" || draft.provider === "agentmail-eu")
                return { label: draft.provider === "agentmail-eu" ? "AgentMail EU" : "AgentMail US", isCustom: false };
            const provider = draft.provider || "";
            const entry = PROVIDERS.filter(([value]) => value === provider)[0];
            if (entry)
                return { label: t(entry[1]), isCustom: false };
            const custom = (presets && presets.custom) || {};
            if (provider !== "" && Object.prototype.hasOwnProperty.call(custom, provider)) {
                return { label: presetLabelOf(provider, custom[provider]), isCustom: true };
            }
            return { label: t("provider.custom"), isCustom: true };
        }
        /** 预设端点写成 host:port；主机没填就说没填，端口缺省不装成合法值。 */
        function presetEndpointText(endpoint) {
            const host = endpoint && typeof endpoint.host === "string" ? endpoint.host.trim() : "";
            if (host === "")
                return t("preset.endpointMissing");
            return host + ":" + portLabel(endpoint.port);
        }
        /**
         * 卡片显示后端的生效服务器，含手动覆盖；换服务商的未保存草稿才查预设。
         * 保存后的新快照优先，避免自定义预设更新后继续显示旧地址。
         */
        function providerMetaText(draft, presets, cards) {
            if (draft.provider === "agentmail" || draft.provider === "agentmail-eu")
                return draft.provider === "agentmail-eu" ? "AgentMail · api.agentmail.eu" : "AgentMail · api.agentmail.to";
            const provider = String(draft.provider || "").trim();
            const saved = (cards || []).find(card => card.name === draft.name)
                || (cards || []).find(card => card.name === draft.originalName);
            const actual = saved && String(saved.provider || "").trim() === provider ? saved : draft;
            const endpoints = fallback => ({
                imap: actual.imap && actual.imap.host ? actual.imap : fallback && fallback.imap,
                smtp: actual.smtp && actual.smtp.host ? actual.smtp : fallback && fallback.smtp,
            });
            const describe = (name, fallback) => {
                const target = endpoints(fallback);
                return name + t("card.builtinEndpoints", { imap: presetEndpointText(target.imap), smtp: presetEndpointText(target.smtp) });
            };
            if (provider === CUSTOM_SERVER_PROVIDER) {
                // POP3 自定义账号的端点存在 pop3/smtp 段，meta 行要按它自己的协议说。
                if (draft.receiveProtocol === 'pop3') {
                    const host = actual.pop3 && typeof actual.pop3.host === "string" ? actual.pop3.host.trim() : "";
                    const endpoint = host !== "" ? "POP3 " + host + ":" + portLabel(actual.pop3.port) : t("preset.endpointMissing");
                    return t("provider.custom") + t("card.customEndpoint", { endpoint });
                }
                return actual.imap?.host || actual.smtp?.host ? describe(t("provider.custom")) : t("provider.custom");
            }
            if (provider === "")
                return actual.imap?.host || actual.smtp?.host ? describe(t("provider.custom")) : t("card.noProvider");
            const entry = PROVIDERS.filter(([value]) => value === provider)[0];
            if (entry) {
                const builtin = (presets && presets.builtin && presets.builtin[provider]) || undefined;
                return describe(t(entry[1]), builtin);
            }
            const custom = (presets && presets.custom) || {};
            if (!Object.prototype.hasOwnProperty.call(custom, provider))
                return provider + t("provider.undefinedPresetSuffix");
            const preset = custom[provider] || undefined;
            return describe(presetLabelOf(provider, preset), preset);
        }
        // ---------------------------------------------------------------------------
        // 服务器预设 helper。同样是纯函数：预设是「预设名 -> 草稿」的扁平映射，端口在
        // 草稿里保持用户输入的原文（可能半填），序列化时才定型。预设不含凭证。
        // ---------------------------------------------------------------------------
        /** 空预设草稿：端口默认对齐端点回退值（IMAP 993 / SMTP 465）。 */
        function emptyPresetDraft(name) {
            return {
                name: name === undefined ? "" : name,
                label: "",
                imap: { host: "", port: "993", secure: true },
                smtp: { host: "", port: "465", secure: true },
            };
        }
        /**
         * 快照里的一个自定义预设 -> 草稿。缺省端口按端点回退值显示（993/465）：
         * 那正是它解析出来的端口，写回去只是把它显式化，语义不变。
         */
        function draftFromPreset(name, preset) {
            const value = preset || {};
            const imap = value.imap || {};
            const smtp = value.smtp || {};
            return {
                name: String(name),
                label: value.label === undefined || value.label === null ? "" : String(value.label),
                imap: {
                    host: imap.host === undefined || imap.host === null ? "" : String(imap.host),
                    port: typeof imap.port === "number" ? String(imap.port) : "993",
                    secure: imap.secure !== false,
                },
                smtp: {
                    host: smtp.host === undefined || smtp.host === null ? "" : String(smtp.host),
                    port: typeof smtp.port === "number" ? String(smtp.port) : "465",
                    secure: smtp.secure !== false,
                },
            };
        }
        /** 快照的 presets.custom -> { 预设名: 草稿 }。 */
        function presetDrafts(custom) {
            const map = {};
            for (const name of Object.keys(custom || {}))
                map[name] = draftFromPreset(name, custom[name]);
            return map;
        }
        /** 端口前端拦：空 = 用默认（序列化不写这个键）；否则必须是 1-65535 的整数。 */
        function portTextProblem(value) {
            const text = String(value === undefined || value === null ? "" : value).trim();
            if (text === "")
                return "";
            if (!/^[0-9]+$/.test(text))
                return t("preset.portNumeric");
            const n = Number(text);
            if (n < 1 || n > 65535)
                return t("preset.portRange");
            return "";
        }
        /** 端口原文 -> 写进 YAML 的整数文本（"0993" -> "993"）。 */
        function portScalar(value) {
            return String(Number(String(value).trim()));
        }
        /** 卡片 meta 里的端口显示：空或非法一律「—」，不把半填状态装成合法值。 */
        function portLabel(value) {
            const text = String(value === undefined || value === null ? "" : value).trim();
            return text !== "" && portTextProblem(text) === "" ? text : "—";
        }
        /**
         * YAML 标量。字段值都在我们控制范围内，只放行「字母开头、纯标识符样」的裸值；
         * 其余（含 : # { } [ ] , & * ' "、首尾空白、空串、YAML 保留字）一律走
         * JSON.stringify 的双引号形式 —— JSON 字符串转义是 YAML 双引号风格的子集。
         */
        function yamlScalar(value) {
            const text = value === undefined || value === null ? "" : String(value);
            const plain = /^[A-Za-z_][A-Za-z0-9_.@+-]*$/;
            const reserved = /^(?:y|n|yes|no|true|false|on|off|null|none)$/i;
            if (text !== "" && plain.test(text) && !reserved.test(text))
                return text;
            return JSON.stringify(text);
        }
        /**
         * 卡片态 -> serverPresets YAML 文本。空列表 -> ''（解析侧用 .trim() 判断「有没有
         * 预设」，空映射不能写成 '{}'）。返回 { text } 或 { error }：预设名缺失/重名、
         * host 缺失、端口非法都在这里拦下，报的是第一处问题。
         */
        function serializePresetDrafts(names, drafts) {
            const lines = [];
            const seen = {};
            for (const key of names) {
                const draft = drafts[key];
                if (draft === undefined)
                    continue;
                const name = String(draft.name === undefined || draft.name === null ? "" : draft.name).trim();
                if (name === "")
                    return { error: t("preset.errNoName") };
                if (Object.prototype.hasOwnProperty.call(seen, name)) {
                    return { error: t("preset.errDuplicate", { name }) };
                }
                // 哨兵值是服务商下拉里「自定义服务器」的选中值，预设不能用它当名字，
                // 否则两个下拉项会撞成同一个 value。
                if (name === CUSTOM_SERVER_PROVIDER) {
                    return { error: t("preset.errReservedName", { name: t("provider.customServer") }) };
                }
                seen[name] = true;
                const label = String(draft.label === undefined || draft.label === null ? "" : draft.label).trim();
                const imapHost = String(draft.imap.host || "").trim();
                const smtpHost = String(draft.smtp.host || "").trim();
                if (imapHost === "")
                    return { error: t("preset.errNoImapHost", { name }) };
                if (smtpHost === "")
                    return { error: t("preset.errNoSmtpHost", { name }) };
                const imapProblem = portTextProblem(draft.imap.port);
                if (imapProblem !== "")
                    return { error: t("preset.errImapPort", { name, problem: imapProblem }) };
                const smtpProblem = portTextProblem(draft.smtp.port);
                if (smtpProblem !== "")
                    return { error: t("preset.errSmtpPort", { name, problem: smtpProblem }) };
                const imapPort = String(draft.imap.port).trim();
                const smtpPort = String(draft.smtp.port).trim();
                lines.push(yamlScalar(name) + ":");
                if (label !== "")
                    lines.push("  label: " + yamlScalar(label));
                lines.push("  imap:");
                lines.push("    host: " + yamlScalar(imapHost));
                if (imapPort !== "")
                    lines.push("    port: " + portScalar(imapPort));
                lines.push("    secure: " + (draft.imap.secure === true ? "true" : "false"));
                lines.push("  smtp:");
                lines.push("    host: " + yamlScalar(smtpHost));
                if (smtpPort !== "")
                    lines.push("    port: " + portScalar(smtpPort));
                lines.push("    secure: " + (draft.smtp.secure === true ? "true" : "false"));
            }
            if (lines.length === 0)
                return { text: "" };
            return { text: lines.join("\n") + "\n" };
        }
        /**
         * serverPresets 文本里的顶层键名（预设名）。不引 yaml 包：顶层键就是行首标识符，
         * 够用来在保存落地之前先把新预设名喂给账号卡片的服务商下拉。
         */
        function presetNamesOf(text) {
            const names = [];
            const lines = String(text === undefined || text === null ? "" : text).split(/\r?\n/);
            for (const line of lines) {
                const match = /^([A-Za-z0-9_-]+):/.exec(line);
                if (match && names.indexOf(match[1]) < 0)
                    names.push(match[1]);
            }
            return names;
        }
        /**
         * 快照 presets + 父级刚解析出的名字：名字先到、端点随后（保存成功后由快照补齐）。
         * 只有快照的 custom 里没有的名字才补一个空位 —— 端点永远以快照为准。
         */
        function presetsWithNames(presets, names) {
            const base = presets || { builtin: {}, custom: {} };
            if (!names || names.length === 0)
                return base;
            const custom = Object.assign({}, base.custom || {});
            for (const name of names) {
                if (!Object.prototype.hasOwnProperty.call(custom, name))
                    custom[name] = undefined;
            }
            return Object.assign({}, base, { custom });
        }
        /** OAuth2 服务商的中文登录按钮文案；没登记的按 provider id 拼一个，不装成认识的。 */
        const OAUTH2_SIGN_IN_LABELS = { outlook: "oauth.signIn.outlook" };
        function oauthSignInLabel(provider) {
            const key = String(provider === undefined || provider === null ? "" : provider);
            const known = OAUTH2_SIGN_IN_LABELS[key];
            return known === undefined ? t("oauth.signIn.generic", { provider: key || "OAuth2" }) : t(known);
        }
        /**
         * 登录区该显示哪一态。这是一次纯投影，优先级写死在这里：
         * 进行中的会话 > 失败 > 卡片快照说已登录 > 未登录。
         * 「pending 优先」是必要的：点完登录之后卡片数据还是旧的（oauthState === 'none'），
         * 若先看卡片就会把刚弹出来的指引面板又按回去。
         */
        function oauthLoginState(draft, session, view) {
            if (session && session.state === "pending")
                return "pending";
            if (session && session.state === "error")
                return "error";
            const loggedIn = view ? view.oauthState === "logged-in" : (draft && draft.oauthState === "logged-in");
            return loggedIn ? "logged-in" : "none";
        }
        /**
         * 卡片登录态的「当前事实」：草稿自己的 provider 和快照里那张卡一致时，服务端的
         * authKind / oauthState / oauthUser 才作数；不一致（刚在本地换了服务商、或名字刚改
         * 过）就按本地名单判 —— 服务端那三个字段描述的是**已保存的那个 provider**。
         *
         * 为什么不直接用草稿里的副本：卡片草稿只在 listKey 变化时从快照重建，而登录成功
         * 后的重拉快照账号名没变、listKey 也没变，草稿里那份就停在旧值上。这正是文件里
         * hasPassword 一律现查 cards 的原因，这里沿用同一条规矩。
         */
        function oauthViewOf(draft, cards) {
            const live = (cards || []).filter((c) => String(c.name) === String(draft.name))[0] || null;
            const sameProvider = live !== null
                && String(live.provider === undefined || live.provider === null ? "" : live.provider) === String(draft.provider || "");
            const draftKind = draft.authKind === "oauth2" || draft.authKind === "password" ? draft.authKind : "";
            const liveKind = live && (live.authKind === "oauth2" || live.authKind === "password") ? live.authKind : "";
            const authKind = sameProvider && liveKind !== "" ? liveKind : (draftKind !== "" ? draftKind : authKindOf(draft.provider));
            const draftState = draft.oauthState === "logged-in" || draft.oauthState === "pending" ? draft.oauthState : "none";
            const liveState = live && (live.oauthState === "logged-in" || live.oauthState === "pending") ? live.oauthState : "";
            return {
                authKind,
                isOauth: authKind === "oauth2",
                oauthState: sameProvider && liveState !== "" ? liveState : draftState,
                oauthUser: sameProvider && live && typeof live.oauthUser === "string" ? live.oauthUser : String(draft.oauthUser || ""),
                hasPassword: live !== null && live.hasPassword === true,
                hasAuthPassword: live !== null && live.hasAuthPassword === true,
                defaultClientId: sameProvider && typeof live.oauthDefaultClientId === "string"
                    ? live.oauthDefaultClientId : String(draft.defaultClientId || ""),
            };
        }
        /**
         * 轮询间隔（秒）。后端给的 interval 就是权威值，**0 也是合法值**（表示不用等，
         * 每 0.5 秒问一次）—— 只有缺失、非数字、或负数才退回兜底 5 秒。
         */
        function oauthIntervalSeconds(session) {
            const raw = session ? session.interval : undefined;
            if (typeof raw === "number")
                return isFinite(raw) && raw >= 0 ? raw : OAUTH_POLL_FALLBACK_MS / 1000;
            if (typeof raw === "string" && raw.trim() !== "") {
                const n = Number(raw);
                if (isFinite(n) && n >= 0)
                    return n;
            }
            return OAUTH_POLL_FALLBACK_MS / 1000;
        }
        /** 授权链接的有效期（秒）：后端给了就用它的，没给按 15 分钟说。 */
        function oauthExpiresSeconds(session) {
            const raw = session ? session.expiresIn : undefined;
            const n = typeof raw === "number" ? raw : Number(raw);
            return isFinite(n) && n > 0 ? n : OAUTH_EXPIRES_FALLBACK_S;
        }
        /**
         * OAuth2 卡片的登录区。设备码流程没有密码可填：这一块就是凭证本身，所以它
         * 和数据字段同级，但驱动它的状态（session）由卡片持有 —— 轮询是「这次点击」的
         * 生命周期，不是配置的一部分，快照回来不该把它打断。
         */
        function OauthLoginPanel(props) {
            const draft = props.draft || {};
            const session = props.session || null;
            const view = props.view || { oauthState: "none", oauthUser: "" };
            const state = oauthLoginState(draft, session, view);
            const disabled = props.disabled === true;
            const label = props.providerLabel || draft.provider || "OAuth2";
            const google = draft.provider === 'gmail' || draft.oauthProvider === 'google';
            // 「用哪个应用登录」是账号自己的配置项，面板是用户唯一的常规入口。它不是机密
            // （公共客户端 ID 每次都随请求发出），因此可以直接回填、直接编辑。留空不是
            // 「没配置」：插件自带一份社区注册，所以这里必须说清生效的到底是哪个应用 ——
            // 同意屏上写的名字不是账号主人自己的，这件事不该等点了登录才发现。
            const builtInClientId = String(view.defaultClientId ?? draft.defaultClientId ?? "").trim();
            const clientIdField = () => h("div", { className: "dshe-field dshe-oauth-client" }, [
                h("label", null, t("oauth.clientIdLabel")),
                h("input", {
                    type: "text",
                    value: String(draft.clientId || ""),
                    disabled: disabled,
                    spellcheck: "false",
                    placeholder: google ? '…apps.googleusercontent.com' : builtInClientId !== "" ? builtInClientId : t("oauth.clientIdPlaceholder"),
                    onChange: (e) => { if (props.onClientId)
                        props.onClientId(e.target.value); },
                }),
                h("div", { className: "dshe-hint" }, google ? dt('在 Google Cloud 创建「桌面应用」OAuth 客户端，启用 Gmail 邮件授权并将自己的账号加入测试用户。登录会在浏览器完成，再自动回到本机；无需提供邮箱密码。','Create a Desktop app OAuth client in Google Cloud, enable Gmail mail consent and add your account as a test user. Complete sign-in in your browser; no mailbox password is needed.') : t("oauth.clientIdHint")),
                google ? h('label', null, dt('Google 客户端密钥（如注册信息提供）','Google client secret (if issued)')) : null,
                google ? h('input',{type:'password',autoComplete:'new-password',value:draft.clientSecret || '',placeholder:draft.hasClientSecret ? dt('已保存；留空保持','Saved; leave unchanged to keep') : '',disabled,onChange:e=>props.onClientSecret?.(e.target.value)}) : null,
                String(draft.clientId || "").trim() === "" && builtInClientId !== ""
                    ? h("div", { className: "dshe-hint dshe-oauth-builtin" }, t("oauth.clientIdBuiltIn", { id: builtInClientId }))
                    : null,
            ]);
            if (state === "pending") {
                const url = String(session.url || "");
                const code = String(session.code || "");
                const seconds = oauthIntervalSeconds(session);
                return h("div", { className: "dshe-oauth" }, [
                    h("div", { className: "dshe-oauth-head" }, google ? dt('打开 Google 授权页，完成后此处会自动显示登录状态。','Open Google authorization; this panel updates after sign-in.') : t("oauth.pendingHint")),
                    url === ""
                        ? h("div", { className: "dshe-oauth-url" }, t("oauth.noUrl"))
                        : h("div", { className: "dshe-oauth-url" }, h("a", { href: url, target: "_blank", rel: "noreferrer" }, url)),
                    code === "" ? null : h("div", { className: "dshe-oauth-code" }, code),
                    h("div", { className: "dshe-oauth-wait" }, t("oauth.polling", {
                        seconds,
                        minutes: Math.max(1, Math.round(oauthExpiresSeconds(session) / 60)),
                    })),
                    h("div", { className: "dshe-oauth-actions" }, [
                        h("button", {
                            type: "button",
                            className: "dshe-btn",
                            disabled: disabled,
                            onClick: () => props.onCancel(),
                        }, t("common.cancel")),
                    ]),
                ]);
            }
            if (state === "error") {
                return h("div", { className: "dshe-oauth" }, [
                    h("div", { className: "dshe-alert error" }, emailError(session.message || t("oauth.loginFailed"))),
                    clientIdField(),
                    h("div", { className: "dshe-oauth-actions" }, [
                        h("button", {
                            type: "button",
                            className: "dshe-btn primary",
                            disabled: disabled,
                            onClick: () => props.onStart(),
                        }, t("common.retry")),
                        h("button", {
                            type: "button",
                            className: "dshe-btn",
                            disabled: disabled,
                            onClick: () => props.onCancel(),
                        }, t("common.cancel")),
                    ]),
                ]);
            }
            if (state === "logged-in") {
                return h("div", { className: "dshe-oauth is-logged-in" }, [
                    h("div", { className: "dshe-oauth-head dshe-oauth-ok" }, t("oauth.loggedInAs", { user: view.oauthUser || String(draft.user || "") || t("oauth.unknownUser") })),
                    clientIdField(),
                    h("div", { className: "dshe-oauth-actions" }, [
                        h("button", {
                            type: "button",
                            className: "dshe-btn",
                            disabled: disabled,
                            onClick: () => props.onStart(),
                        }, props.restarting === true ? t("oauth.signingIn") : t("oauth.reLogin")),
                    ]),
                ]);
            }
            return h("div", { className: "dshe-oauth" }, [
                h("div", { className: "dshe-oauth-head" }, t("oauth.passwordless", { label: label ? t("oauth.passwordlessLabel", { label }) : "" })),
                clientIdField(),
                String(draft.clientId || "").trim() === "" && builtInClientId === ""
                    ? h("div", { className: "dshe-alert warn" }, google ? dt('请先填写自己的 Google Desktop app 客户端 ID。也可切换为应用密码（是否可用取决于账号策略）。','Enter your Google Desktop app client ID. App passwords remain available where your account policy permits.') : t("oauth.clientIdMissing"))
                    : null,
                h("div", { className: "dshe-oauth-actions" }, [
                    h("button", {
                        type: "button",
                        className: "dshe-btn primary",
                        disabled: disabled,
                        onClick: () => props.onStart(),
                    }, props.starting === true ? t("oauth.requestingCode") : google ? dt('使用 Google 登录','Sign in with Google') : oauthSignInLabel(draft.provider)),
                ]),
            ]);
        }
        /**
         * 账号卡片编辑器。YAML 仍然是唯一的真相源，但改动是「编辑即保存」：每次改动都
         * 把 {卡片快照, 默认账号} 抛给父级，由父级统一 serializeAccounts + 防抖落盘。
         * 卡片自己不再写 YAML，也不再区分「已写入 / 未写入」。
         */
        function AccountCardsEditor(props) {
            const presets = props.presets || { builtin: {}, custom: {} };
            const detail = props.detail || { raw: {}, list: [] };
            const cards = detail.list || [];
            const [drafts, setDrafts] = React.useState(() => draftsFromCards(cards));
            // order 是 [{ id, key }]：id 是 React key（稳定，只随卡片集合来源变化而重建），
            // key 是草稿映射的键（账号名，也就是 YAML 的键）。展开态/确认态一律按 id 记。
            const [order, setOrder] = React.useState(() => cardRows(cards.map((c) => String(c.name))));
            const [open, setOpen] = React.useState(0);
            const [defaultAccount, setDefaultAccount] = React.useState(detail.defaultAccount || "");
            const [confirming, setConfirming] = React.useState(0);
            const [busy, setBusy] = React.useState("");
            const [rowStatus, setRowStatus] = React.useState({});
            const [notice, setNotice] = React.useState(null);
            /**
             * OAuth2 的登录会话：{ [账号名]: { state:'pending'|'error', url, code, interval,
             * expiresIn, message, startedAt } }。它刻意和卡片草稿分开 —— 草稿是「要落盘的
             * 配置」，会话是「这次点击的进度」，一次性、不落盘、刷新即丢（码也就作废了）。
             * 取消 = 删掉这一项，轮询的 effect 跟着这一项存亡。
             */
            const [oauth, setOauth] = React.useState({});
            /** 每个账号的会话序号：取消 / 重启 / 换服务商都 +1，晚到的轮询结果据此作废。 */
            const oauthSeqRef = React.useRef({});
            const listKey = cards.map((c) => String(c.name) + ":" + c.isDefault).join("|") + "|" + (detail.defaultAccount || "");
            React.useEffect(() => {
                setDrafts(draftsFromCards(cards));
                setOrder(cardRows(cards.map((c) => String(c.name))));
                setOpen(0);
                setConfirming(0);
                setDefaultAccount(detail.defaultAccount || "");
                // 详情对象每次快照都是新的：只依赖它的投影，免得无谓重建草稿。
                // eslint-disable-next-line
            }, [listKey]);
            /**
             * 最新草稿/顺序的镜像。改动处理函数如果直接闭包 state，两次改动落在同一批次里
             * 时后一次会拿着旧快照算，把前一次改的字段抹掉（快速连填两个输入框就会）。
             * 一律从镜像读、算完再 setState，改动之间就不会互相丢。
             */
            const draftsRef = React.useRef(drafts);
            const orderRef = React.useRef(order);
            draftsRef.current = drafts;
            orderRef.current = order;
            /**
             * 卡片的当前快照 -> 父级。顺序来自 order，内容来自 drafts（键已随改名同步）。
             * 半填的账号照抛不误 —— 这正是草稿的意义；名字没填、重名、或「多账号却没指定
             * 默认账号」是「还不能写进 YAML」，只提示、不抛给父级（否则一次半填就会把
             * YAML 里的账号整片抹掉）。改名/删除这类中间态同理，等名字打完自然就存了。
             */
            const autoSave = (draftsNow, orderNow, defaultNow, immediate) => {
                if (typeof props.onAutoSave !== "function")
                    return null;
                const incomplete = (text) => {
                    setNotice({ kind: "error", text });
                    if (typeof props.onDraftStatus === "function")
                        props.onDraftStatus(true);
                };
                const names = orderNow.map((row) => row.key).filter((name) => Object.prototype.hasOwnProperty.call(draftsNow, name));
                let built;
                try {
                    built = names.map((name) => draftToInput(draftsNow[name]));
                }
                catch (e) {
                    incomplete(emailError(e));
                    return null;
                }
                if (built.some((card) => String(card.name || "").trim() === "")) {
                    incomplete(t("card.errNoName"));
                    return null;
                }
                if (names.some((name) => !draftsNow[name].provider && !(draftsNow[name].imap?.host && draftsNow[name].smtp?.host))) {
                    // 服务商就是账号的连接身份：没有它，后端写回时会把 provider 键删掉，这个账号
                    // 永远连不上。名字和它都属于「这还是一张半填的卡」，一起拦在这里。
                    incomplete(t("card.errNoProvider"));
                    return null;
                }
                if (names.some((name) => String(draftsNow[name].provider || "").trim() === CUSTOM_SERVER_PROVIDER && !customEndpointsPresent(draftsNow[name]))) {
                    // 自定义服务器账号没有预设可查，端点是它唯一的连接信息；端点没填齐之前
                    // 写进 YAML 也连不上。
                    incomplete(t("card.errNoCustomHost"));
                    return null;
                }
                if (built.some((card) => card.name === "defaultAccount")) {
                    incomplete(t("card.errReservedName"));
                    return null;
                }
                if (built.length > 1 && String(defaultNow || "") === "") {
                    incomplete(t("card.errNoDefault"));
                    return null;
                }
                setNotice(null);
                if (typeof props.onDraftStatus === "function")
                    props.onDraftStatus(false);
                // 返回值只给 OAuth 登录用：它必须等这份配置真的落盘（后端按账号名去读 provider
                // 和端点）。其余调用方照旧忽略返回值。
                return props.onAutoSave(built, String(defaultNow || ""), immediate === true);
            };
            const patchDraft = (name, patch) => {
                const next = Object.assign({}, draftsRef.current, { [name]: Object.assign({}, draftsRef.current[name], patch) });
                draftsRef.current = next;
                setDrafts(next);
                autoSave(next, orderRef.current, defaultAccount);
            };
            // -------------------------------------------------------------------------
            // OAuth2 登录。会话只存在于内存（见 oauth state 的注释），三个动作：
            // startOauth 取设备码、pollOauth 轮询、cancelOauth 放弃。
            // -------------------------------------------------------------------------
            /** 会话的序号：取消/重启/换服务商都会 +1，晚到的轮询结果据此作废。 */
            const bumpOauth = (name) => {
                oauthSeqRef.current[name] = (oauthSeqRef.current[name] || 0) + 1;
                return oauthSeqRef.current[name];
            };
            const oauthCurrent = (name) => oauthSeqRef.current[name] || 0;
            const setOauthOf = (name, entry) => {
                setOauth((cur) => {
                    const next = Object.assign({}, cur);
                    if (entry === null)
                        delete next[name];
                    else
                        next[name] = entry;
                    return next;
                });
            };
            const cancelOauth = (name) => {
                bumpOauth(name);
                setOauthOf(name, null);
                void apiOauth('oauthCancel',{account:name}).catch(()=>{});
            };
            /**
             * 登录前先把这张卡片落盘：oauthLogin 只认账号名，后端要从已保存的配置里读这个
             * 账号的 provider 与端点。草稿没写进 YAML 就点登录的话，后端根本找不到它。
             * 等这次落盘真的结束（成功或失败），别让 oauthLogin 和后端的写盘抢。
             */
            const ensureSaved = async () => {
                const pending = autoSave(draftsRef.current, orderRef.current, defaultAccount, true);
                if (pending && typeof pending.then === "function") {
                    try {
                        await pending;
                    }
                    catch (e) { /* 保存失败由父级的状态条报，这里不重复说 */ }
                }
            };
            const startOauth = async (name) => {
                const draft = draftsRef.current[name];
                if (draft === undefined)
                    return;
                const seq = bumpOauth(name);
                setRowStatus((cur) => Object.assign({}, cur, { [name]: { kind: "busy", text: t("oauth.requestingCode") } }));
                setOauthOf(name, { state: "starting" });
                await ensureSaved();
                if (seq !== oauthCurrent(name))
                    return;
                try {
                    const body = await apiOauth("oauthLogin", { account: name, force: draft.oauthState === 'logged-in' });
                    if (seq !== oauthCurrent(name))
                        return;
                    if (!body.ok) {
                        setOauthOf(name, { state: "error", message: oauthErrorMessage(body, t("oauth.loginFailed")) });
                        setRowStatus((cur) => { const next = Object.assign({}, cur); delete next[name]; return next; });
                        return;
                    }
                    setRowStatus((cur) => { const next = Object.assign({}, cur); delete next[name]; return next; });
                    if (body.status === "pending") {
                        setOauthOf(name, {
                            state: "pending",
                            url: String(body.url === undefined || body.url === null ? "" : body.url),
                            code: String(body.code === undefined || body.code === null ? "" : body.code),
                            // 后端给的是 interval（秒）与 expiresIn（秒）；契约文本里叫 expires_in。
                            interval: body.interval,
                            expiresIn: body.expires_in !== undefined ? body.expires_in : body.expiresIn,
                        });
                        return;
                    }
                    // status === 'already'：后端说这个账号已经登录过了，没有码可取。
                    setOauthOf(name, null);
                    await finishOauth(name, "");
                }
                catch (e) {
                    if (seq !== oauthCurrent(name))
                        return;
                    setRowStatus((cur) => { const next = Object.assign({}, cur); delete next[name]; return next; });
                    setOauthOf(name, { state: "error", message: emailError(e) });
                }
            };
            /** 轮询一次。pending 就等下一轮（定时器由 effect 按会话自己排），ok 就收尾。 */
            const pollOauth = async (name) => {
                const seq = oauthCurrent(name);
                let body;
                try {
                    body = await apiOauth("oauthPoll", { account: name });
                }
                catch (e) {
                    if (seq !== oauthCurrent(name))
                        return;
                    setOauthOf(name, { state: "error", message: emailError(e) });
                    return;
                }
                if (seq !== oauthCurrent(name))
                    return;
                if (body.ok && body.status === "ok") {
                    bumpOauth(name); // 会话结束：晚到的结果不再有意义
                    setOauthOf(name, null);
                    await finishOauth(name, String(body.user === undefined || body.user === null ? "" : body.user));
                    return;
                }
                if (!body.ok) {
                    bumpOauth(name);
                    setOauthOf(name, { state: "error", message: oauthErrorMessage(body, t("oauth.loginFailed")) });
                }
            };
            /**
             * 登录成功：重新拉一次卡片快照（和加载/保存同一条路径），让卡片拿到
             * oauthState/oauthUser，再报一句成功。
             */
            const finishOauth = async (name, user) => {
                setNotice({ kind: "success", text: user === "" ? t("oauth.loginOk") : t("oauth.loginOkAs", { user }) });
                if (typeof props.onReload === "function")
                    await props.onReload();
            };
            /** 每次渲染都刷新这个 ref：定时器回调永远拿到最新的 pollOauth，不会闭包旧 state。 */
            const pollOauthRef = React.useRef(pollOauth);
            pollOauthRef.current = pollOauth;
            /**
             * 轮询排期。签名里带账号名和它自己的间隔，所以「谁在 pending、间隔是多少」一变
             * 就重排一次定时器；取消或成功后签名变空，定时器全清。多个账号可以同时 pending，
             * 一个账号一个定时器。
             */
            const oauthPendingSig = Object.keys(oauth)
                .filter((name) => oauth[name] && oauth[name].state === "pending")
                .map((name) => name + "\t" + oauthIntervalSeconds(oauth[name]))
                .join("|");
            React.useEffect(() => {
                if (oauthPendingSig === "")
                    return undefined;
                const timers = oauthPendingSig.split("|").map((entry) => {
                    const cut = entry.lastIndexOf("\t");
                    const name = entry.slice(0, cut);
                    const delay = (Number(entry.slice(cut + 1)) + 0.5) * 1000;
                    return setInterval(() => { pollOauthRef.current(name); }, delay);
                });
                return () => { timers.forEach((timer) => clearInterval(timer)); };
                // eslint-disable-next-line
            }, [oauthPendingSig]);
            /** 换服务商 = 换一套凭证：进行中的登录会话跟着作废。 */
            const changeProvider = (name, provider) => {
                cancelOauth(name);
                patchDraft(name, applyPreset(draftsRef.current[name], provider));
            };
            const renameDraft = (oldName, nextName) => {
                // 映射键必须立刻跟着名字走，否则改名会留下旧键的孤儿。
                // 行的 id 不动，所以改名不会让输入框重挂载失焦。
                let nextDrafts;
                try {
                    nextDrafts = renameDrafts(draftsRef.current, oldName, nextName);
                }
                catch (error) {
                    setNotice({ kind: "error", text: error.message });
                    return;
                }
                const nextOrder = rekeyRows(orderRef.current, oldName, nextName);
                const nextDefault = defaultAccount === oldName ? nextName : defaultAccount;
                draftsRef.current = nextDrafts;
                orderRef.current = nextOrder;
                setDrafts(nextDrafts);
                setOrder(nextOrder);
                setDefaultAccount(nextDefault);
                autoSave(nextDrafts, nextOrder, nextDefault);
            };
            const addAccount = () => {
                let n = Object.keys(draftsRef.current).length + 1;
                let name = "account" + n;
                while (Object.prototype.hasOwnProperty.call(draftsRef.current, name)) {
                    n += 1;
                    name = "account" + n;
                }
                const nextDrafts = Object.assign({}, draftsRef.current, { [name]: emptyAccountDraft(name) });
                const row = cardRows([name])[0];
                const nextOrder = orderRef.current.concat([row]);
                setDrafts(nextDrafts);
                setOrder(nextOrder);
                setOpen(row.id);
                autoSave(nextDrafts, nextOrder, defaultAccount);
            };
            const removeAccount = (id) => {
                const row = orderRef.current.filter((item) => item.id === id)[0];
                if (row === undefined)
                    return;
                const name = row.key;
                const nextDrafts = Object.assign({}, draftsRef.current);
                delete nextDrafts[name];
                const nextOrder = orderRef.current.filter((item) => item.id !== id);
                const nextDefault = defaultAccount === name ? "" : defaultAccount;
                setDrafts(nextDrafts);
                setOrder(nextOrder);
                setDefaultAccount(nextDefault);
                setConfirming(0);
                setOpen((cur) => (cur === id ? 0 : cur));
                // 删除是明确动作：确认之后立刻落盘，不等防抖（用户可能马上就走）。
                autoSave(nextDrafts, nextOrder, nextDefault, true);
            };
            /** 默认账号也是配置的一部分：换一个就等于一次改动，同样立刻抛给父级保存。 */
            const setDefaultAccountAndSave = (name) => {
                setDefaultAccount(name);
                autoSave(draftsRef.current, orderRef.current, name);
            };
            /** 传的是卡片上的「当前账号名」（可能刚改过名），行内提示按它归类。 */
            const testCard = async (draftName) => {
                // An empty card must not fall back to credentials in the hidden legacy form.
                if (String(draftsRef.current[draftName]?.user || "").trim() === "") {
                    setRowStatus((cur) => Object.assign({}, cur, {
                        [draftName]: { kind: "error", text: t("card.testMissingAddress") },
                    }));
                    return;
                }
                setBusy(draftName);
                setRowStatus((cur) => Object.assign({}, cur, { [draftName]: { kind: "busy", text: t("card.testing") } }));
                try {
                    // 测试也要看到「你正在编辑的这份表单」，所以抛给父级组装完整 value。
                    const cardsNow = orderRef.current.map((row) => row.key)
                        .filter((name) => Object.prototype.hasOwnProperty.call(draftsRef.current, name))
                        .map((name) => draftToInput(draftsRef.current[name]));
                    const result = await props.onTest(draftName, cardsNow, defaultAccount);
                    setRowStatus((cur) => Object.assign({}, cur, {
                        [draftName]: {
                            kind: "success",
                            text: result.apiHost ? dt("API 连接成功 · ", "API connected · ") + result.apiHost : result.protocol === 'POP3' ? dt('POP3 收信连接成功 · ', 'POP3 connected · ') + result.imapHost + ':' + result.imapPort + dt('；本次未测试 SMTP 发信', '; SMTP sending was not tested') : t("card.testOk", { ms: result.ms, host: result.imapHost, port: result.imapPort }),
                        },
                    }));
                }
                catch (e) {
                    setRowStatus((cur) => Object.assign({}, cur, {
                        [draftName]: { kind: "error", text: t("card.testFailed", { message: emailError(e) }) },
                    }));
                }
                finally {
                    setBusy("");
                }
            };
            /**
             * 自定义服务器账号的端点编辑行：主机 + 端口 + TLS 放在同一个单元格里。
             * 收信主机变化时同步发信主机（它为空、或还停在旧的收信主机上时）：内网/自建
             * 邮箱通常同一台机器，用户不必把地址抄两遍，后端要求 IMAP 账号两个 host 都在。
             */
            const endpointRow = (name, draft, kind, labelKey, placeholder) => {
                const value = draft[kind] || { host: "", port: kind === "imap" ? 993 : 465, secure: true };
                return h("div", { className: "dshe-field", style: { gridColumn: "1 / -1" } }, [
                    h("label", null, t(labelKey)),
                    h("div", { className: "dshe-endpoint-row" }, [
                        h("input", {
                            type: "text",
                            "aria-label": t(labelKey),
                            value: value.host || "",
                            placeholder,
                            disabled: busy !== "",
                            onChange: (e) => {
                                const host = e.target.value;
                                if (kind !== "imap") {
                                    patchDraft(name, { smtp: Object.assign({}, value, { host }) });
                                    return;
                                }
                                const smtp = draft.smtp || { host: "", port: 465, secure: true };
                                const follows = String(smtp.host || "").trim() === "" || String(smtp.host) === String(draft.imap?.host || "");
                                patchDraft(name, follows
                                    ? { imap: Object.assign({}, value, { host }), smtp: Object.assign({}, smtp, { host }) }
                                    : { imap: Object.assign({}, value, { host }) });
                            },
                        }),
                        h("input", {
                            type: "number", min: 1, max: 65535,
                            "aria-label": t("card.portLabel"),
                            value: value.port ?? "",
                            disabled: busy !== "",
                            onChange: (e) => {
                                const raw = String(e.target.value).trim();
                                patchDraft(name, { [kind]: Object.assign({}, value, { port: raw === "" ? undefined : Number(raw) }) });
                            },
                        }),
                        h("label", { className: "dshe-check" }, [
                            h("input", {
                                type: "checkbox",
                                "aria-label": t("card.tlsLabel"),
                                checked: value.secure !== false,
                                disabled: busy !== "",
                                onChange: (e) => patchDraft(name, { [kind]: Object.assign({}, value, { secure: e.target.checked }) }),
                            }),
                            t("card.tlsLabel"),
                        ]),
                    ]),
                    kind === "imap" && h("div", { className: "dshe-hint" }, t("card.customServerHint")),
                ]);
            };
            const defaultMissing = order.length > 1 && !defaultAccount;
            return h("div", { className: "dshe-acc-list" }, [
                detail.error
                    ? h("div", { className: "dshe-alert error" }, t("card.yamlParseFailed", { error: detail.error }))
                    : null,
                props.extraNotice
                    ? h("div", { className: "dshe-alert " + props.extraNotice.kind }, props.extraNotice.text)
                    : null,
                defaultMissing
                    ? h("div", { className: "dshe-alert error" }, [
                        t("card.pickDefault"),
                        h("span", { className: "dshe-actions", style: { marginTop: 6 } }, order.map((row) => h("button", {
                            key: row.id,
                            type: "button",
                            className: "dshe-btn",
                            onClick: () => setDefaultAccountAndSave(row.key),
                        }, t("card.setDefaultAs", { name: drafts[row.key] ? drafts[row.key].name || row.key : row.key })))),
                    ])
                    : null,
                order.length === 0
                    ? h("div", { className: "dshe-acc-empty" }, t("card.empty"))
                    : null,
                order.map((row) => {
                    const id = row.id;
                    const name = row.key;
                    const draft = drafts[name];
                    if (draft === undefined)
                        return null;
                    const summary = accountSummary(draft, presets);
                    const isDefault = defaultAccount !== "" && defaultAccount === draft.name;
                    const expanded = open === id;
                    const status = rowStatus[name];
                    const renamed = draft.name !== name;
                    const busyHere = busy === name;
                    const view = oauthViewOf(draft, cards);
                    const oauthCard = view.isOauth;
                    const oauthSession = oauthCard ? (oauth[name] || null) : null;
                    const oauthLive = oauthLoginState(draft, oauthSession, view);
                    /** 卡片的登录态显示：服务端字段说了算，进行中的会话盖过它。 */
                    const oauthLabel = oauthLive === "pending"
                        ? t("oauth.signingIn")
                        : (view.oauthState === "logged-in"
                            ? t("card.loggedInAs", { user: view.oauthUser || draft.user || t("oauth.unknownUser") })
                            : t("card.notLoggedIn"));
                    const oauthBusy = oauthSession !== null && oauthSession.state === "starting";
                    return h("div", { key: id, className: "dshe-acc-card" }, [
                        h("div", { className: "dshe-acc-head" }, [
                            h("span", { className: "dshe-acc-name" }, draft.name || t("card.unnamed")),
                            h("span", { className: "dshe-acc-badge" + (summary.isCustom ? " todo" : "") }, summary.label),
                            oauthCard
                                ? h("span", { className: "dshe-acc-badge" + (view.oauthState === "logged-in" ? " is-oauth" : " todo") }, oauthLabel)
                                : null,
                            isDefault ? h("span", { className: "dshe-acc-badge is-default" }, t("card.defaultBadge")) : null,
                            accountIncomplete(draft) ? h("span", { className: "dshe-acc-badge todo" }, t("card.incomplete")) : null,
                            renamed ? h("span", { className: "dshe-acc-badge todo dshe-acc-warn" }, t("card.renamedBadge")) : null,
                            h("span", { className: "dshe-acc-actions" }, [
                                h("button", {
                                    type: "button",
                                    className: "dshe-btn",
                                    onClick: () => setOpen(expanded ? 0 : id),
                                }, expanded ? t("common.collapse") : t("common.edit")),
                                h("button", {
                                    type: "button",
                                    className: "dshe-btn",
                                    disabled: busy !== "" || draft.name === "",
                                    onClick: () => testCard(draft.name),
                                }, busyHere ? t("card.testing") : t("card.testConnect")),
                                h("button", {
                                    type: "button",
                                    className: "dshe-btn",
                                    disabled: isDefault || draft.name === "",
                                    onClick: () => setDefaultAccountAndSave(draft.name),
                                }, isDefault ? t("card.defaultAccount") : t("card.setDefault")),
                                h("button", {
                                    type: "button",
                                    className: "dshe-btn dshe-acc-danger",
                                    onClick: () => setConfirming(confirming === id ? 0 : id),
                                }, t("common.delete")),
                            ]),
                        ]),
                        h("div", { className: "dshe-acc-meta" }, t("card.meta", {
                            address: draft.user || t("card.noAddress"),
                            folder: draft.inboxFolder || "INBOX",
                            provider: providerMetaText(draft, presets, cards),
                        })),
                        status
                            ? h("div", { className: "dshe-hint" + (status.kind === "error" ? " dshe-acc-warn" : "") }, status.text)
                            : null,
                        confirming === id
                            ? h("div", { className: "dshe-acc-confirm" }, [
                                t("card.confirmDelete", { name: draft.name || t("card.unnamed") }),
                                h("span", { className: "dshe-actions" }, [
                                    h("button", {
                                        type: "button",
                                        className: "dshe-btn dshe-acc-danger",
                                        onClick: () => removeAccount(id),
                                    }, t("common.confirmDelete")),
                                    h("button", { type: "button", className: "dshe-btn", onClick: () => setConfirming(0) }, t("common.cancel")),
                                ]),
                            ])
                            : null,
                        expanded
                            ? h("div", { className: "dshe-acc-body" }, [
                                h("div", { className: "dshe-grid" }, [
                                    h("div", { className: "dshe-field" }, [
                                        h("label", null, t("card.nameLabel")),
                                        h("input", {
                                            type: "text",
                                            value: draft.name,
                                            placeholder: "work",
                                            onChange: (e) => renameDraft(name, e.target.value),
                                        }),
                                        h("div", { className: "dshe-hint" }, draft.name === "defaultAccount"
                                            ? h("span", { className: "dshe-acc-warn" }, t("card.reservedNameWarn"))
                                            : t("card.nameHint")),
                                    ]),
                                    h("div", { className: "dshe-field" }, [
                                        h("label", null, t("card.providerLabel")),
                                        h("select", {
                                            value: draft.provider || "",
                                            onChange: (e) => changeProvider(name, e.target.value),
                                        }, providerOptionsFor(presets, draft.provider).map((option) => h("option", { key: option.value, value: option.value }, option.label))),
                                    ]),
                                    h("div", { className: "dshe-field" }, [
                                        h("label", null, t("card.addressLabel")),
                                        fieldInput("text", draft.user, (v) => patchDraft(name, { user: v }), "you@example.com"),
                                    ]),
                                    !draft.provider?.startsWith('agentmail') && h('div', {className:'dshe-field'}, [
                                        h('label', null, dt('收信协议','Incoming protocol')),
                                        h('select', {'aria-label':dt('收信协议','Incoming protocol'),value:draft.receiveProtocol || 'imap',disabled:busy !== '',onChange:e=>patchDraft(name,{receiveProtocol:e.target.value,inboxFolder:'INBOX',pop3:draft.pop3 || {host:'',port:995,secure:true}})},[
                                            h('option',{value:'imap'},'IMAP'),h('option',{value:'pop3',disabled:oauthCard},'POP3')]),
                                        draft.receiveProtocol === 'pop3' && h('p',{className:'dshe-hint',role:'note'},dt('POP3 只读取收件箱，发送使用 SMTP。无服务器已读、星标或已发送文件夹；搜索会说明扫描范围。','POP3 reads the inbox and uses SMTP for sending. Server read/star flags and a Sent folder are unavailable; search shows its scan coverage.')),
                                    ]),
                                    // 自定义服务器账号的端点：没有预设可展开，直接写在卡片里。
                                    draft.provider === CUSTOM_SERVER_PROVIDER && draft.receiveProtocol !== 'pop3' && h(React.Fragment, null, [
                                        endpointRow(name, draft, "imap", "card.imapServerLabel", "imap.corp.example"),
                                        endpointRow(name, draft, "smtp", "card.smtpServerLabel", "smtp.corp.example"),
                                    ]),
                                    draft.receiveProtocol === 'pop3' && h(React.Fragment,null,['pop3','smtp'].map(kind=>{
                                        const value=draft[kind] || {host:'',port:kind==='pop3'?995:465,secure:true};
                                        const patch=fields=>patchDraft(name,{[kind]:Object.assign({},value,fields)});
                                        return h('div',{key:kind,className:'dshe-field'},[
                                            h('label',null,kind==='pop3'?dt('POP3 收信服务器','POP3 incoming server'):dt('SMTP 发信服务器（可稍后填写）','SMTP outgoing server (optional for receiving)')),
                                            h('input',{type:'text','aria-label':kind==='pop3'?dt('POP3 主机','POP3 host'):dt('SMTP 主机','SMTP host'),value:value.host || '',onChange:e=>patch({host:e.target.value}),placeholder:kind==='pop3'?'pop.example.com':'smtp.example.com'}),
                                            h('input',{type:'number',min:1,max:65535,'aria-label':kind==='pop3'?dt('POP3 端口','POP3 port'):dt('SMTP 端口','SMTP port'),value:value.port ?? '',onChange:e=>patch({port:e.target.value})}),
                                            h('label',{className:'dshe-check'},h('input',{type:'checkbox','aria-label':kind==='pop3'?'POP3 TLS':'SMTP TLS',checked:value.secure !== false,onChange:e=>patch({secure:e.target.checked})}),kind.toUpperCase()+' TLS'),
                                            kind==='pop3' && value.secure===false ? h('p',{className:'dshe-hint'},dt('未开启 TLS，POP3 登录与内容将以明文传输；仅用于明确允许明文的受信任服务器。此选项不是 STARTTLS。','TLS is off: POP3 login and content use plaintext. Use only with a trusted server where plaintext is intended. This is not STARTTLS.')) : null,
                                        ]);
                                    })),
                                    !draft.provider?.startsWith("agentmail") && h("div", { className: "dshe-field" }, [
                                        h("label", null, t("card.senderNameLabel")),
                                        fieldInput("text", draft.senderName, (v) => patchDraft(name, { senderName: v }), t("card.senderNamePlaceholder")),
                                        h("div", { className: "dshe-hint" }, t("card.senderNameHint")),
                                    ]),
                                    // 认证方式只在「可能是 OAuth2」的账号上出现：给 QQ/163 用户多一个
                                    // 下拉框只是噪音。它是那条逃生舱的唯一面板入口——仍能用应用密码连
                                    // Exchange Online 的租户（混合/本地部署、SMTP AUTH 未关）靠它才不用
                                    // 去手改 YAML。
                                    (oauthCard || authKindOf(draft.provider) === "oauth2" || draft.provider === 'gmail')
                                        ? h("div", { className: "dshe-field" }, [
                                            h("label", null, t("card.authKindLabel")),
                                            h("select", {
                                                value: draft.authKindSetting || "",
                                                disabled: busy !== "",
                                                onChange: (e) => patchDraft(name, {
                                                    authKindSetting: e.target.value,
                                                    // 「自动」= 不钉住：把裁决交回派生，isOauthDraft 会按
                                                    // provider 立刻切回对应的凭证区。
                                                    authKind: e.target.value === "" ? undefined : e.target.value,
                                                }),
                                            }, [
                                                h("option", { key: "auto", value: "" }, t("card.authKindAuto")),
                                                h("option", { key: "oauth2", value: "oauth2" }, t("card.authKindOAuth2")),
                                                h("option", { key: "password", value: "password" }, t("card.authKindPassword")),
                                            ]),
                                            h("div", { className: "dshe-hint" }, draft.provider==='gmail'?dt('Google OAuth 需要自己的桌面应用客户端；应用密码是否可用取决于账号策略。','Google OAuth requires your own Desktop app client; app-password availability depends on account policy.'):t("card.authKindHint")),
                                        ])
                                        : null,
                                    !draft.provider?.startsWith('agentmail') && h('div', { className: 'dshe-field' },
                                      h('label', null, dt('连接方式', 'Connection routing')),
                                      h('select', { value: draft.proxyMode || 'inherit', 'aria-label': dt('连接方式', 'Connection routing'), disabled: busy !== '', onChange: e => patchDraft(name, { proxyMode: e.target.value, proxyDirty: true }) },
                                        h('option', { value: 'inherit' }, dt('跟随全局或环境设置', 'Follow global or environment settings')),
                                        h('option', { value: 'direct' }, dt('直接连接（不使用代理）', 'Connect directly (ignore proxies)')),
                                        h('option', { value: 'custom' }, dt('自定义代理', 'Custom proxy'))),
                                      draft.proxyMode === 'custom' && h('input', { type: 'password', autoComplete: 'new-password', value: draft.proxy || '', 'aria-label': dt('自定义代理地址', 'Custom proxy URL'), placeholder: draft.hasProxy ? dt('已保存，留空保持不变', 'Saved; leave blank to retain') : 'http://127.0.0.1:7897', disabled: busy !== '', onChange: e => patchDraft(name, { proxy: e.target.value, proxyDirty: true }) }),
                                      h('div', { className: 'dshe-hint' }, dt('用于 IMAP 和 SMTP，支持 HTTP CONNECT / HTTPS / SOCKS。代理地址可能含密码，保存后不会回显。POP3 收信仍直接连接。', 'Applies to IMAP and SMTP. Supports HTTP CONNECT, HTTPS and SOCKS. Saved URLs may contain passwords and are not displayed. POP3 receiving still connects directly.'))),
                                    // OAuth2 的服务商没有密码可填：这一格的凭证就是下面那块登录区。
                                    // 留着密码框只会让人以为「填了密码就能用」，而后端根本不会读它。
                                    oauthCard
                                        ? h(OauthLoginPanel, {
                                            draft: draft,
                                            view: view,
                                            session: oauthSession,
                                            providerLabel: summary.label,
                                            disabled: busy !== "" || oauthBusy,
                                            starting: oauthBusy,
                                            restarting: oauthBusy,
                                            onStart: () => startOauth(name),
                                            onCancel: () => cancelOauth(name),
                                            onClientId: (v) => patchDraft(name, { clientId: v }),
                                            onClientSecret: v=>patchDraft(name,{clientSecret:v,clientSecretDirty:true}),
                                        })
                                        : h(React.Fragment, null, [
                                            h("div", { className: "dshe-field" }, [
                                                h("label", null, draft.provider?.startsWith("agentmail") ? "AgentMail API Key" : t("card.passwordLabel")),
                                                h("input", {
                                                    type: "password",
                                                    value: draft.password,
                                                    disabled: busy !== "",
                                                    placeholder: draft.provider?.startsWith("agentmail") ? dt("输入 API Key；留空保留已存密钥", "API key; leave blank to retain saved key") : t("card.passwordPlaceholder"),
                                                    onChange: (e) => patchDraft(name, { password: e.target.value }),
                                                }),
                                                h("div", { className: "dshe-hint" }, view.hasPassword
                                                    ? t("card.passwordSaved")
                                                    : draft.provider?.startsWith("agentmail") ? dt("从 AgentMail 控制台取得 API Key。API Key 保存在本机账号配置中，由 DSH 后端调用所选区域的 API。", "Use an API key from the AgentMail console. The key is stored in the local account configuration; the DSH backend calls the selected region.") : t("card.passwordHint")),
                                            ]),
                                            // 别名/中继：登录名与登录密码都只在密码类账号上有意义（OAuth2 用 token 登录）。
                                            !draft.provider?.startsWith("agentmail") && h("div", { className: "dshe-field" }, [
                                                h("label", null, t("card.authUserLabel")),
                                                fieldInput("text", draft.authUser, (v) => patchDraft(name, { authUser: v }), t("card.authUserPlaceholder")),
                                                h("div", { className: "dshe-hint" }, t("card.authUserHint")),
                                            ]),
                                            !draft.provider?.startsWith("agentmail") && h("div", { className: "dshe-field" }, [
                                                h("label", null, t("card.authPasswordLabel")),
                                                h("input", {
                                                    type: "password",
                                                    value: draft.authPassword,
                                                    disabled: busy !== "",
                                                    placeholder: draft.provider?.startsWith("agentmail") ? dt("输入 API Key；留空保留已存密钥", "API key; leave blank to retain saved key") : t("card.passwordPlaceholder"),
                                                    onChange: (e) => patchDraft(name, { authPassword: e.target.value }),
                                                }),
                                                h("div", { className: "dshe-hint" }, view.hasAuthPassword
                                                    ? t("card.authPasswordSaved")
                                                    : t("card.authPasswordHint")),
                                            ]),
                                        ]),
                                    !draft.provider?.startsWith("agentmail") && draft.receiveProtocol !== 'pop3' && h("div", { className: "dshe-field" }, [
                                        h("label", null, t("card.inboxLabel")),
                                        fieldInput("text", draft.inboxFolder, (v) => patchDraft(name, { inboxFolder: v }), "INBOX"),
                                    ]),
                                ]),
                            ])
                            : null,
                    ]);
                }),
                h("div", { className: "dshe-actions" }, [
                    h("button", { type: "button", className: "dshe-btn", onClick: addAccount, disabled: busy !== "" }, t("card.add")),
                ]),
                h("div", { className: "dshe-hint" }, t("card.autoSaveHint") + (defaultMissing ? t("card.autoSaveHintNoDefault") : "")),
                notice
                    ? h("div", { className: "dshe-alert " + notice.kind }, notice.text)
                    : null,
            ]);
        }
        /**
         * 服务器预设编辑器。快照的 presets.custom 是卡片的数据源，YAML 是真相源；改动
         * 「编辑即保存」：每次改动序列化后抛给父级，由父级防抖落盘。
         * 预设不含凭证；内置的 8 个服务商不在这里编辑（它们由 PROVIDERS 定义）。
         */
        function ServerPresetsEditor(props) {
            const presets = props.presets || { builtin: {}, custom: {} };
            const custom = presets.custom || {};
            const [drafts, setDrafts] = React.useState(() => presetDrafts(custom));
            // 同账号卡片：行 = { id, key }，id 是 React key，key 是预设名（YAML 的键）。
            const [order, setOrder] = React.useState(() => presetRows(Object.keys(custom)));
            /** 同账号卡片：最新草稿/顺序的镜像，改动处理函数一律从它读（见那边的说明）。 */
            const draftsRef = React.useRef(drafts);
            const orderRef = React.useRef(order);
            draftsRef.current = drafts;
            orderRef.current = order;
            const [open, setOpen] = React.useState(0);
            const [confirming, setConfirming] = React.useState(0);
            const [notice, setNotice] = React.useState(null);
            // 预设列表每次快照都是一个新对象：只依赖它的投影重建卡片。
            const listKey = Object.keys(custom).map((name) => {
                const entry = custom[name] || {};
                const imap = entry.imap || {};
                const smtp = entry.smtp || {};
                return [name, entry.label || "", imap.host || "", imap.port, imap.secure, smtp.host || "", smtp.port, smtp.secure].join(":");
            }).join("|");
            React.useEffect(() => {
                setDrafts(presetDrafts(custom));
                setOrder(presetRows(Object.keys(custom)));
                setOpen(0);
                setConfirming(0);
                // eslint-disable-next-line
            }, [listKey]);
            /**
             * 序列化 + 抛给父级。预设名缺失/重名、主机缺失、端口非法都在这里被拦下：只提示，
             * 不动父级的文本（半填状态不该把已保存的预设整片清掉）。
             */
            const autoSave = (nextDrafts, nextOrder) => {
                if (typeof props.onAutoSave !== "function")
                    return;
                const result = serializePresetDrafts(nextOrder.map((row) => row.key), nextDrafts);
                if (result.error !== undefined) {
                    setNotice({ kind: "error", text: result.error });
                    if (typeof props.onDraftStatus === "function")
                        props.onDraftStatus(true);
                    return;
                }
                setNotice(null);
                if (typeof props.onDraftStatus === "function")
                    props.onDraftStatus(false);
                props.onAutoSave(result.text);
            };
            const patchDraft = (key, patch) => {
                const next = Object.assign({}, draftsRef.current, { [key]: Object.assign({}, draftsRef.current[key], patch) });
                setDrafts(next);
                autoSave(next, orderRef.current);
            };
            const renameDraft = (oldKey, nextName) => {
                // 预设名就是 YAML 的键：映射键必须立刻跟着走，否则改名会留下旧键的孤儿。
                const next = {};
                for (const key of Object.keys(draftsRef.current)) {
                    if (key === oldKey)
                        continue;
                    next[key] = draftsRef.current[key];
                }
                const entry = draftsRef.current[oldKey];
                if (entry !== undefined)
                    next[nextName] = Object.assign({}, entry, { name: nextName });
                const nextOrder = rekeyRows(orderRef.current, oldKey, nextName);
                setDrafts(next);
                setOrder(nextOrder);
                autoSave(next, nextOrder);
            };
            const addPreset = () => {
                let n = orderRef.current.length + 1;
                let name = "preset" + n;
                while (Object.prototype.hasOwnProperty.call(draftsRef.current, name)) {
                    n += 1;
                    name = "preset" + n;
                }
                const next = Object.assign({}, draftsRef.current, { [name]: emptyPresetDraft(name) });
                const row = presetRows([name])[0];
                const nextOrder = orderRef.current.concat([row]);
                setDrafts(next);
                setOrder(nextOrder);
                setOpen(row.id);
                setConfirming(0);
                // 新预设还没有主机，autoSave 只会提示「还没填 IMAP 主机」，不会动文本。
                autoSave(next, nextOrder);
            };
            const removePreset = (id) => {
                const row = orderRef.current.filter((item) => item.id === id)[0];
                if (row === undefined)
                    return;
                const key = row.key;
                const next = Object.assign({}, draftsRef.current);
                delete next[key];
                const nextOrder = orderRef.current.filter((item) => item.id !== id);
                setDrafts(next);
                setOrder(nextOrder);
                setConfirming(0);
                setOpen((cur) => (cur === id ? 0 : cur));
                autoSave(next, nextOrder);
            };
            const rebuiltCount = Object.keys(custom).length;
            return h("div", { className: "dshe-prst-list" }, [
                presets.error
                    ? h("div", { className: "dshe-alert error" }, [
                        t("preset.yamlParseFailed", { error: presets.error }),
                        h("div", { className: "dshe-hint", style: { marginTop: 4 } }, t("preset.yamlParseFailedHint")),
                    ])
                    : null,
                order.length === 0
                    ? h("div", { className: "dshe-prst-empty" }, rebuiltCount === 0
                        ? t("preset.empty")
                        : t("preset.cleared", { count: rebuiltCount }))
                    : null,
                order.map((row) => {
                    const id = row.id;
                    const key = row.key;
                    const draft = drafts[key];
                    if (draft === undefined)
                        return null;
                    const name = String(draft.name === undefined || draft.name === null ? "" : draft.name);
                    const trimmed = name.trim();
                    const expanded = open === id;
                    const renamed = trimmed !== key;
                    const duplicate = trimmed !== "" && order.some((other) => other.key !== key && String((drafts[other.key] || {}).name || "").trim() === trimmed);
                    const empty = trimmed === "";
                    const label = String(draft.label || "").trim();
                    return h("div", { key: id, className: "dshe-prst-card" }, [
                        h("div", { className: "dshe-prst-head" }, [
                            h("span", { className: "dshe-prst-name" }, trimmed || t("card.unnamed")),
                            label === "" ? null : h("span", { className: "dshe-prst-badge" }, label),
                            empty ? h("span", { className: "dshe-prst-badge todo" }, t("preset.badgeUnnamed")) : null,
                            renamed ? h("span", { className: "dshe-prst-badge todo dshe-prst-warn" }, t("preset.badgeRenamed")) : null,
                            duplicate ? h("span", { className: "dshe-prst-badge todo dshe-prst-warn" }, t("preset.badgeDuplicate")) : null,
                            h("span", { className: "dshe-prst-actions" }, [
                                h("button", {
                                    type: "button",
                                    className: "dshe-btn",
                                    onClick: () => setOpen(expanded ? 0 : id),
                                }, expanded ? t("common.collapse") : t("common.edit")),
                                h("button", {
                                    type: "button",
                                    className: "dshe-btn dshe-prst-danger",
                                    onClick: () => setConfirming(confirming === id ? 0 : id),
                                }, t("common.delete")),
                            ]),
                        ]),
                        h("div", { className: "dshe-prst-meta" }, t("preset.metaImap", { host: draft.imap.host || t("preset.noHost"), port: portLabel(draft.imap.port) })
                            + (draft.imap.secure === true ? t("preset.ssl") : t("preset.plain"))
                            + t("preset.metaSmtp", { host: draft.smtp.host || t("preset.noHost"), port: portLabel(draft.smtp.port) })
                            + (draft.smtp.secure === true ? t("preset.ssl") : t("preset.plain"))),
                        confirming === id
                            ? h("div", { className: "dshe-prst-confirm" }, [
                                t("preset.confirmDelete", { name: trimmed || t("card.unnamed") }),
                                h("span", { className: "dshe-actions" }, [
                                    h("button", { type: "button", className: "dshe-btn dshe-prst-danger", onClick: () => removePreset(id) }, t("common.confirmDelete")),
                                    h("button", { type: "button", className: "dshe-btn", onClick: () => setConfirming(0) }, t("common.cancel")),
                                ]),
                            ])
                            : null,
                        expanded
                            ? h("div", { className: "dshe-prst-body" }, [
                                h("div", { className: "dshe-grid" }, [
                                    h("div", { className: "dshe-field" }, [
                                        h("label", null, t("preset.nameLabel")),
                                        h("input", {
                                            type: "text",
                                            value: name,
                                            placeholder: "corp",
                                            onChange: (e) => renameDraft(key, e.target.value),
                                        }),
                                        h("div", { className: "dshe-hint" }, duplicate
                                            ? h("span", { className: "dshe-prst-warn" }, t("preset.duplicateWarn"))
                                            : t("preset.nameHint")),
                                    ]),
                                    h("div", { className: "dshe-field" }, [
                                        h("label", null, t("preset.labelLabel")),
                                        fieldInput("text", draft.label, (v) => patchDraft(key, { label: v }), t("preset.labelPlaceholder")),
                                    ]),
                                ]),
                                h("div", { className: "dshe-grid" }, [
                                    h("div", { className: "dshe-field" }, [
                                        h("label", null, t("preset.imapHostLabel")),
                                        fieldInput("text", draft.imap.host, (v) => patchDraft(key, { imap: Object.assign({}, draft.imap, { host: v }) }), "imap.corp.com"),
                                    ]),
                                    h("div", { className: "dshe-field" }, [
                                        h("label", null, t("preset.imapPortLabel")),
                                        h("input", {
                                            type: "text",
                                            inputMode: "numeric",
                                            value: draft.imap.port,
                                            placeholder: "993",
                                            onChange: (e) => patchDraft(key, { imap: Object.assign({}, draft.imap, { port: e.target.value }) }),
                                        }),
                                        portTextProblem(draft.imap.port) === ""
                                            ? h("div", { className: "dshe-hint" }, t("preset.imapPortHint"))
                                            : h("div", { className: "dshe-hint dshe-prst-warn" }, t("preset.portProblem", { problem: portTextProblem(draft.imap.port) })),
                                    ]),
                                    h("label", { className: "dshe-check" }, [
                                        h("input", {
                                            type: "checkbox",
                                            checked: draft.imap.secure === true,
                                            onChange: (e) => patchDraft(key, { imap: Object.assign({}, draft.imap, { secure: e.target.checked }) }),
                                        }),
                                        t("preset.imapSsl"),
                                    ]),
                                ]),
                                h("div", { className: "dshe-grid" }, [
                                    h("div", { className: "dshe-field" }, [
                                        h("label", null, t("preset.smtpHostLabel")),
                                        fieldInput("text", draft.smtp.host, (v) => patchDraft(key, { smtp: Object.assign({}, draft.smtp, { host: v }) }), "smtp.corp.com"),
                                    ]),
                                    h("div", { className: "dshe-field" }, [
                                        h("label", null, t("preset.smtpPortLabel")),
                                        h("input", {
                                            type: "text",
                                            inputMode: "numeric",
                                            value: draft.smtp.port,
                                            placeholder: "465",
                                            onChange: (e) => patchDraft(key, { smtp: Object.assign({}, draft.smtp, { port: e.target.value }) }),
                                        }),
                                        portTextProblem(draft.smtp.port) === ""
                                            ? h("div", { className: "dshe-hint" }, t("preset.smtpPortHint"))
                                            : h("div", { className: "dshe-hint dshe-prst-warn" }, t("preset.portProblem", { problem: portTextProblem(draft.smtp.port) })),
                                    ]),
                                    h("label", { className: "dshe-check" }, [
                                        h("input", {
                                            type: "checkbox",
                                            checked: draft.smtp.secure === true,
                                            onChange: (e) => patchDraft(key, { smtp: Object.assign({}, draft.smtp, { secure: e.target.checked }) }),
                                        }),
                                        t("preset.smtpSsl"),
                                    ]),
                                ]),
                            ])
                            : null,
                    ]);
                }),
                h("div", { className: "dshe-actions" }, [
                    h("button", { type: "button", className: "dshe-btn", onClick: addPreset }, t("preset.add")),
                ]),
                h("div", { className: "dshe-hint" }, t("preset.footerHint") + t("card.autoSaveHint")),
                notice ? h("div", { className: "dshe-alert " + notice.kind }, notice.text) : null,
            ]);
        }
        const MAILBOX_ROUTE = "api/dsh-email/mailbox";
        async function mailboxApi(action, payload = {}, signal) {
            const response = await fetch(MAILBOX_ROUTE, { credentials: "same-origin", method: "POST", headers: { "Content-Type": "application/json", "x-dsh-email-mailbox": "1" }, body: JSON.stringify({ ...payload, action }), signal });
            if ((action === "download" || action === "image") && response.ok)
                return response.blob();
            const result = await response.json();
            if (!response.ok || !result.ok)
                throw new Error(result.error?.message || dt("邮箱操作失败", "Mailbox action failed"));
            return result.value;
        }
        function MailboxWorkbench({active,onConfigure,onDraft,onAccountChange}) {
const [accountsLoading,setAccountsLoading]=useState(true),[accountReload,setAccountReload]=useState(0);

            const [accounts, setAccounts] = useState([]), [account, setAccount] = useState(""), [folders, setFolders] = useState([]), [folder, setFolder] = useState("");
            const isPop3 = accounts.find(a=>a.name===account)?.incoming === 'pop3';
            const canTrash = accounts.find(a=>a.name===account)?.trashSupported === true;
            const [checked, setChecked] = useState([]), [trash, setTrash] = useState(null), [moved, setMoved] = useState(null), [foldersOpen, setFoldersOpen] = useState(false), [folderReload, setFolderReload] = useState(0);
            __stardustUpdatesGuard(React, 'dsh-email.mailbox', { busy: !!trash || foldersOpen });
            useEffect(() => setFoldersOpen(false), [account]);
useEffect(()=>{onAccountChange?.(account);},[account,onAccountChange]);
            const [input, setInput] = useState(""), [query, setQuery] = useState(""), [offset, setOffset] = useState(0), [scanOffset, setScanOffset] = useState(0), [unread, setUnread] = useState(false), [refresh, setRefresh] = useState(0);
            const [result, setResult] = useState(null), [selected, setSelected] = useState(null), [detail, setDetail] = useState(null), [loading, setLoading] = useState(false), [reading, setReading] = useState(false), [busy, setBusy] = useState(false), [error, setError] = useState(""), [readToken, setReadToken] = useState(0);
            const busyRef = useRef(false), context = useRef(0);
            __stardustUpdatesGuard(React, 'dsh-email.mailbox-operation', { busy });
            useEffect(() => { setChecked([]); setTrash(null); }, [active, account, folder, query, offset, scanOffset, refresh]);
            useEffect(() => { setMoved(null); }, [active, account]);

            useEffect(() => {
                if (!active)
                    return;
                const ctrl = new AbortController();
setAccountsLoading(true);
                setError("");
                mailboxApi("accounts", {}, ctrl.signal).then(value => { if (ctrl.signal.aborted)
                    return; setAccounts(value.accounts); setAccount(old => value.accounts.some(a => a.name === old) ? old : value.defaultAccount); }).catch(e => { if (!ctrl.signal.aborted)
                    setError(emailError(e)); }).finally(()=>{if(!ctrl.signal.aborted)setAccountsLoading(false);});
                return () => ctrl.abort();
            }, [active,accountReload]);
            useEffect(() => {
                context.current++;
                setSelected(null);
                setDetail(null);
                setResult(null);
                setFolder("");
                setFolders([]);
                setOffset(0);
                setScanOffset(0);
                if (!active || !account)
                    return;
                const ctrl = new AbortController();
                mailboxApi("folders", { account }, ctrl.signal).then(value => { if (ctrl.signal.aborted)
                    return; setFolders(value.folders); setFolder(value.folders.find(f => f.specialUse === "\\Inbox")?.path || value.folders.find(f => f.path === "INBOX")?.path || value.folders[0]?.path || ""); }).catch(e => { if (!ctrl.signal.aborted)
                    setError(emailError(e)); });
                return () => ctrl.abort();
            }, [active, account, folderReload]);
            useEffect(() => {
                context.current++;
                setSelected(null);
                setDetail(null);
                setResult(null);
                if (!active || !account || !folder)
                    return;
                const ctrl = new AbortController();
                setLoading(true);
                setError("");
                mailboxApi("list", { account, folder, query, offset, unreadOnly: unread, headerScanOffset: scanOffset }, ctrl.signal).then(value => { if (!ctrl.signal.aborted)
                    setResult(value); }).catch(e => { if (!ctrl.signal.aborted)
                    setError(emailError(e)); }).finally(() => { if (!ctrl.signal.aborted)
                    setLoading(false); });
                return () => ctrl.abort();
            }, [active, account, folder, query, offset, scanOffset, unread, refresh]);
            useEffect(() => {
                setDetail(null);
                if (!active || selected === null)
                    return;
                const ctrl = new AbortController();
                setReading(true);
                setError("");
                mailboxApi("read", { account, folder, uid: selected }, ctrl.signal).then(value => { if (!ctrl.signal.aborted)
                    setDetail(value); }).catch(e => { if (!ctrl.signal.aborted)
                    setError(emailError(e)); }).finally(() => { if (!ctrl.signal.aborted)
                    setReading(false); });
                return () => ctrl.abort();
            }, [active, account, folder, selected, readToken]);
            const run = async (task) => { if (busyRef.current)
                return; busyRef.current = true; setBusy(true); setError(""); const generation = context.current; try {
                await task(() => generation === context.current);
            }
            catch (e) {
                if (generation === context.current)
                    setError(emailError(e));
            }
            finally {
                busyRef.current = false;
                setBusy(false);
            } };
            /** 失败后的一键重试：账号、文件夹、列表、正文按各自依赖重取，不靠用户到处找刷新按钮。 */
            const retry = () => { setAccountReload(n => n + 1); setRefresh(n => n + 1); setReadToken(n => n + 1); };
            const reset = () => { setOffset(0); setScanOffset(0); setSelected(null); setDetail(null); };
            const changeFolder = value => { reset(); setFolder(value); };
            const requestTrash = uids => { setMoved(null); setTrash(uids); };
            const confirmTrash = preview => run(async valid => {
              try {
                const value = await mailboxApi('trashConfirm', { account, folder, receipt: preview.id, confirmed: true });
                if (valid()) setMoved({ ...value, account });
              } finally { if (valid()) { setTrash(null); setChecked([]); setOffset(0); setRefresh(n => n + 1); } }
            });
            const undoTrash = () => run(async valid => {
              const operation = moved; setMoved(null);
              try { await mailboxApi('undoTrash', { account: operation.account, folder: operation.target, receipt: operation.undo, confirmed: true }); }
              finally { if (valid()) { setOffset(0); setRefresh(n => n + 1); } }
            });
            const who = list => (list || []).map(a => a.name && a.address ? a.name + " <" + a.address + ">" : a.address || a.name).filter(Boolean).join(", ");
            const date = value => formatDate(value);
            const rows = result?.messages || [], currentRow = rows.find(m => m.uid === selected), hasMore = result?.hasMore ?? (result?.headerScan && result?.searchSource === "local-headers" ? offset + rows.length < result.count : result?.bodyScan ? rows.length === 20 : offset + rows.length < (result?.count || 0));
            const folderButton = (special, zh, en) => { const target = folders.find(f => f.specialUse === special) || folders.find(f => special === "\\Sent" ? /^(sent|sent messages|已发送)$/i.test(f.path) : f.path === "INBOX"); return target ? h("button", { type: "button", className: "dshe-btn", disabled: busy || loading, "aria-pressed": folder === target.path, onClick: () => changeFolder(target.path) }, dt(zh, en)) : null; };
            return h('section',{className:'email-mailbox','aria-label':dt('邮箱工作台','Mailbox workbench')},
 trash ? h(MailTrashDialog, { account, folder, uids: trash, uidValidity: result?.uidValidity, folders, busy, onClose: () => setTrash(null), onConfirm: confirmTrash }) : null,
 moved ? h('div', { className: 'email-move-notice', role: 'status' }, dt('已移动 ', 'Moved ') + moved.count + dt(' 封至 ', ' messages to ') + moved.target, moved.undo && moved.undoExpires > Date.now() ? h(W.Button, { disabled: busy, onClick: undoTrash }, dt('撤销移动', 'Undo move')) : h('p', { className: 'dshe-hint' }, dt('如需恢复，请在邮箱客户端移回原文件夹。', 'To restore, move the messages back in your mail client.')), h(W.Button, { variant: 'ghost', onClick: () => setMoved(null) }, dt('关闭提示', 'Dismiss'))) : null,
 h(W.Status,{tone:'error'},error ? h(React.Fragment,null,[error,h('div',{key:'actions',className:'w-toolbar'},[h(W.Button,{key:'retry',icon:'refresh',variant:'primary',disabled:busy || accountsLoading,onClick:retry},dt('重试','Retry')),h(W.Button,{key:'configure',variant:'ghost',onClick:onConfigure},dt('检查账号设置','Check account settings'))])]) : null),
 accountsLoading ? h(W.Empty,{title:dt('正在读取邮箱账号…','Loading accounts…'),icon:'mail'}) : !accounts.length ? h(W.Empty,{title:error?dt('暂时无法读取邮箱','Mailbox unavailable'):dt('连接你的邮箱','Connect your mailbox'),icon:'mail',action:h(React.Fragment,null,h(W.Button,{variant:'primary',onClick:onConfigure},dt('邮箱设置','Account settings')),h(W.Button,{onClick:()=>setAccountReload(n=>n+1)},dt('重试','Retry')))},dt('添加并测试邮箱账号后，即可在这里阅读和回复邮件。','Add and test an email account to read and reply here.')) :
 h('div',{className:'email-mailbox-columns'},
 h('aside',{className:'email-folder-rail','aria-label':dt('账号与文件夹','Accounts and folders')},
 h('label',null,dt('邮箱账号','Account'),h('select',{value:account,disabled:busy,onChange:event=>{reset();setInput('');setQuery('');setUnread(false);setAccount(event.target.value);}},accounts.map(a=>h('option',{key:a.name,value:a.name},a.name+' · '+a.user)))),
 h('nav',{'aria-label':dt('邮件文件夹','Mail folders')},folders.filter(f=>f.specialUse === '\\Trash' || f.specialUse === '\\Inbox' || f.specialUse === '\\Sent' || /^(INBOX|sent|sent messages|已发送)$/i.test(f.path)).map(f=>h(W.Button,{key:f.path,className:'email-folder-button',variant:'ghost',icon:f.specialUse === '\\Sent' || /sent|已发送/i.test(f.path)?'reply':'mail',disabled:busy || loading,'aria-pressed':folder === f.path,onClick:()=>changeFolder(f.path)},f.specialUse === '\\Trash'?dt('废纸篓','Trash'):f.specialUse === '\\Inbox' || f.path === 'INBOX'?dt('收件箱','Inbox'):dt('已发送','Sent')))),
 folders.length>2 || !folders.some(f=>(f.specialUse === '\\Inbox' || f.specialUse === '\\Sent' || /^(INBOX|sent|sent messages|已发送)$/i.test(f.path)) && f.path===folder) ? h('label',{className:'email-custom-folder'},dt('所有文件夹','All folders'),h('div',{style:{display:'flex',gap:6,alignItems:'center'}},h('select',{value:folder,disabled:busy || !folders.length,onChange:event=>changeFolder(event.target.value)},folders.map(f=>h('option',{key:f.path,value:f.path},f.name))),h(W.IconButton,{icon:'plus',label:dt('管理文件夹','Manage folders'),disabled:busy || !folders.length || accounts.find(a=>a.name===account)?.incoming !== 'imap',onClick:()=>setFoldersOpen(true)}))) : h('div',{style:{marginTop:4}},h(W.Button,{variant:'ghost',icon:'plus',disabled:busy || !folders.length || accounts.find(a=>a.name===account)?.incoming !== 'imap',onClick:()=>setFoldersOpen(true)},dt('管理文件夹','Manage folders')))),
 !foldersOpen ? null : h(MailFoldersDialog,{account,folders,busy,onClose:()=>setFoldersOpen(false),onChanged:()=>setFolderReload(n=>n+1)}),
 h(W.Split,{className:'email-message-split',listWidth:330,selected:selected===null?null:String(selected),onBack:()=>setSelected(null),backLabel:dt('返回邮件列表','Back to messages'),
 list:h('div',null,
 h('form',{className:'email-search',onSubmit:event=>{event.preventDefault();reset();setUnread(false);setQuery(input.trim());setRefresh(n=>n+1);}},
 h(W.Search,{label:dt('搜索当前文件夹','Search current folder'),value:input,maxLength:500,disabled:busy,onChange:event=>setInput(event.target.value)}),
 h(W.Button,{type:'submit',disabled:loading || busy || !folder},dt('搜索','Search')),h(W.IconButton,{icon:'refresh',label:dt('刷新邮件','Refresh mail'),disabled:loading || busy || !account,onClick:()=>setRefresh(n=>n+1)}),
 query ? h(W.Button,{variant:'ghost',disabled:busy,onClick:()=>{reset();setInput('');setQuery('');}},dt('清除搜索','Clear search')) : null,
 !isPop3 && h('label',{className:'email-unread-filter'},h('input',{type:'checkbox',checked:unread,disabled:busy || !!query,onChange:event=>{reset();setUnread(event.target.checked);}}),dt('只看未读','Unread only'))),
 !canTrash ? h('p', { className: 'email-list-note' }, dt('此协议暂不支持移入废纸篓，请使用邮箱原生客户端删除。', 'Trash is unavailable for this protocol; delete in your mail client.')) : null,
 isPop3 ? h('p',{className:'email-list-note',role:'note'},dt('POP3 收件箱 · 不提供服务器已读、星标或已发送文件夹。回复会进入本地草稿，确认后通过 SMTP 发送。','POP3 inbox · Server read/star flags and a Sent folder are unavailable. Replies open in local Drafts and use SMTP after confirmation.')) : null,
 canTrash && rows.length ? h('div', { className: 'email-batch-tools' }, h('label', null, h('input', { type: 'checkbox', checked: checked.length === rows.length && rows.length > 0, disabled: busy || loading, onChange: event => setChecked(event.target.checked ? rows.map(m => m.uid) : []) }), dt('选择本页', 'Select page')), h(W.Button, { disabled: busy || loading || !checked.length, onClick: () => requestTrash(checked) }, dt('移入废纸篓（', 'Move to Trash (') + checked.length + dt('）', ')'))) : null,
 rows.length ? rows.map(m=>h(W.Row,{key:String(m.uid),disabled:busy,children:canTrash ? h('input', { type: 'checkbox', 'aria-label': dt('选择邮件：', 'Select message: ') + (m.subject || String(m.uid)), checked: checked.includes(m.uid), disabled: busy || loading, onChange: event => setChecked(old => event.target.checked ? [...old, m.uid] : old.filter(uid => uid !== m.uid)) }) : null,title:h(React.Fragment,null,m.flagsSupported !== false && !m.seen?h('span',{className:'email-unread-dot',role:'img','aria-label':dt('未读','Unread')}):null,m.flagged?h(W.Icon,{name:'star',size:14}):null,m.subject || dt('（无主题）','(No subject)')),meta:who(m.from),description:date(m.date),active:selected===m.uid,onClick:()=>setSelected(m.uid)})) : h(W.Empty,{icon:'mail',title:error && !result?dt('邮件列表没有读出来','Messages could not be loaded'):loading?dt('正在读取邮件…','Loading messages…'):query?dt('当前检索范围内没有结果。','No results in the current search window.'):dt('当前页没有邮件。','No messages on this page.'),action:error && !result?h(W.Button,{icon:'refresh',disabled:busy || loading,onClick:retry},dt('重试','Retry')):undefined}),
 h('div',{className:'email-list-note'},h("div", { role: "status", "aria-live": "polite", className: "dshe-hint" }, loading ? dt("正在读取邮件…", "Loading messages…") : result ? dt("本页 ", "This page: ") + rows.length + dt(" 封", " messages") + (result.order === "relevance" ? dt(" · 按相关性排序", " · Ranked by relevance") : dt(" · 按邮箱到达序排列", " · Mailbox arrival order")) : dt("在账号设置中添加并测试邮箱后，即可浏览邮件。", "Add and test an account in settings to browse mail.")),
result?.headerScan ? h("p", { className: "dshe-hint" }, dt("信封实际扫描：", "Headers scanned: ") + result.headerScan.scanned + " / " + result.headerScan.mailboxTotal + (result.headerScan.complete ? dt("，信封覆盖完整；正文另有限制。", "; headers fully covered; body search has a separate limit.") : dt("，尚未覆盖全文件夹。", "; folder coverage is partial."))) : null,
result?.bodyScan ? h('p',{className:'dshe-hint'},dt('正文实际扫描：','Bodies scanned: ')+result.bodyScan.scanned+dt(' 封；最多 ',' messages; limit ')+result.bodyScan.scanLimit+dt(' 封，受正文显示上限限制。','; bounded by the body display limit.')) : null,
result?.searchSource === "api" ? h("p", { className: "dshe-hint" }, dt("AgentMail 搜索由服务按相关性返回，垃圾箱等特殊邮件不在其搜索范围。", "AgentMail ranks results by relevance and excludes spam, trash and other protected mail.")) : null),h("div", { className: "dshe-mail-footer" }, [
                    h(W.Button, { icon: 'left', disabled: loading || busy || offset === 0, onClick: () => setOffset(n => Math.max(0, n - 20)) }, dt("上一页", "Previous page")), h("span", { className: 'w-muted' }, dt("第 ", "Page ") + (Math.floor(offset / 20) + 1) + dt(" 页", "")), h(W.Button, { icon: 'right', disabled: loading || busy || !hasMore, onClick: () => setOffset(n => n + 20) }, dt("下一页", "Next page")),
                    result?.headerScan?.nextScanOffset !== undefined ? h(W.Button, { icon: 'search', disabled: loading || busy, onClick: () => { setOffset(0); setScanOffset(result.headerScan.nextScanOffset); } }, dt("继续搜索更早邮件", "Search older headers")) : null,
                ])),
 detail:reading && selected!==null ? h(W.Empty,{title:dt('正在读取正文…','Loading message…'),icon:'mail'}) : error && selected!==null && !detail ? h(W.Empty,{icon:'mail',title:dt('这封邮件没有读出来','This message could not be loaded'),action:h(W.Button,{icon:'refresh',disabled:busy,onClick:retry},dt('重试','Retry'))}) : detail ? h(MailMessage,{key:JSON.stringify([account,folder,selected,detail.rich?.images?.[0]?.id]),detail,currentRow,account,folder,selected,busy,run,who,date,onDraft,canTrash,onTrash:requestTrash,onMark:value=>setResult(old=>({...old,messages:old.messages.map(m=>m.uid===selected?{...m,...(value==='read'||value==='unread'?{seen:value==='read'}:{flagged:value==='star'})}:m)}))}) : h(W.Empty,{title:dt('选择一封邮件','Select a message'),icon:'mail'},dt('打开正文后，可以回复到草稿、标记状态或下载附件。','Open a message to reply in drafts, mark its state or download attachments.'))})));
        }
        const DRAFT_ROUTE = "api/dsh-email/drafts";
        // Session memory survives closing the host settings dialog. A page reload
        // still uses the unsaved-edits guard, and only an explicit Save writes content.
        let draftUiCache = null, rulesUiCache = null, emailActiveTab = "mailbox", emailSettingsActiveTab = "accounts";
        async function draftApi(action, payload, upload) {
            const init = { credentials: "same-origin", method: "POST", headers: { "x-dsh-email-draft": "1", "Content-Type": upload ? "application/octet-stream" : "application/json" } };
            if (upload) {
                Object.assign(init.headers, { "x-dsh-draft-id": payload.id, "x-dsh-draft-revision": String(payload.revision), "x-dsh-draft-filename": encodeURIComponent(upload.name) });
                init.body = upload;
            }
            else
                init.body = JSON.stringify({ ...payload, action });
            const response = await fetch(upload ? DRAFT_ROUTE + "/upload" : DRAFT_ROUTE, init), result = await response.json();
            if (!response.ok || !result.ok) {
                const error = new Error(result.error && result.error.message || dt("邮件操作失败", "Email action failed"));
                error.code = result.error && result.error.code;
                error.status = response.status;
                error.message = emailError(error);
                throw error;
            }
            return result.value;
        }
        function OutgoingMailPreview({body}) {
          const render=(nodes,prefix='')=>(nodes||[]).map((node,index)=>{if(typeof node==='string')return node;const props={key:prefix+index,style:node.style,...(node.href?{href:node.href,target:'_blank',rel:'noopener noreferrer'}:{}),...(node.span?{colSpan:node.span}:{})};return ['br','hr'].includes(node.tag)?h(node.tag,props):h(node.tag,props,render(node.children,prefix+index+'-'));});
          return h('div',null,h('div',{className:'email-draft-rich',style:{maxHeight:320,overflow:'auto',overflowWrap:'anywhere'}},render(body.rich.nodes)),h('details',null,h('summary',null,dt('查看纯文本备选','View plain-text alternative')),h('pre',null,body.text)));
        }
        const draftForm = (draft) => ({ account: draft.account || "", to: draft.to || "", cc: draft.cc || "", subject: draft.subject || "", text: draft.text || "", html: draft.html || "", sendAt:draft.sendAt||'', attachments: draft.attachments.map(file => file.id) });
        const draftState = (state) => ({ draft: dt("未发送", "Not sent"), scheduled:dt('等待定时发送','Scheduled'), sending: dt("正在提交 / 待核对", "Submitting / check mailbox"), sent: dt("已保存服务端回执", "Server receipt saved"), uncertain: dt("结果未确定，请核对邮箱", "Outcome uncertain, check mailbox") })[state] || state;
        const localSendTime = iso => {if(!iso)return'';const d=new Date(iso);return Number.isFinite(d.getTime())?new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,16):'';};
        function DraftWorkbench({active,requestedDraft,composeRequest,onComposeFinished}) {
const [bodyFormat,setBodyFormat]=useState(() => draftUiCache?.form?.html ? 'html' : 'text');
const [showEditor,setShowEditor]=useState(false);const handledCompose=useRef(null),composeStage=useRef(null);const controlId=React.useId();
            const [data, setData] = useState({ drafts: [], accounts: [] }), [selected, setSelected] = useState(() => draftUiCache && draftUiCache.selected), [form, setForm] = useState(() => draftUiCache && draftUiCache.form);
            const [busy, setBusy] = useState(false), [error, setError] = useState(""), [notice, setNotice] = useState(""), [preview, setPreview] = useState(null), [acknowledged, setAcknowledged] = useState(false), [pending, setPending] = useState(null), [remove, setRemove] = useState(false), [copy, setCopy] = useState(false);
            const operation = useRef(false), handledRequested = useRef("");
            const dirty = selected && form && JSON.stringify(form) !== JSON.stringify(draftForm(selected));
// Update protection: dsh-email.draft
__stardustUpdatesGuard(React, "dsh-email.draft", { dirty: !!dirty, busy, retainOnClose: true });

            useEffect(() => { draftUiCache = { selected, form }; }, [selected, form]);
            const locked = !selected || selected.state !== "draft";
            const attachmentCap = data.attachmentLimits?.[form?.account] ?? 20 * 1024 * 1024;
            const capLabel = attachmentCap >= 1024 * 1024 ? (attachmentCap / 1024 / 1024) + " MiB" : Math.ceil(attachmentCap / 1024) + " KiB";
            const reload = async () => { const next = await draftApi("list"); setData(next); return next; };
            const run = async (fn) => {
                if (operation.current)
                    return;
                operation.current = true;
                setBusy(true);
                setError("");
                try {
                    return await fn();
                }
                catch (e) {
                    setError(e.message || String(e));
                    return undefined;
                }
                finally {
                    operation.current = false;
                    setBusy(false);
                }
            };
            const adopt = (draft) => { setShowEditor(true); setSelected(draft); setForm(draftForm(draft)); setBodyFormat(draft.html ? 'html' : 'text'); setPreview(null); setAcknowledged(false); setRemove(false); setCopy(false); setError(""); setNotice(""); };
            useEffect(() => { if (active) {
                setPreview(null);
                setAcknowledged(false);
                run(reload);
            } }, [active]);
            useEffect(() => {
                const guard = (event) => { if (dirty) {
                    event.preventDefault();
                    event.returnValue = "";
                } };
                window.addEventListener("beforeunload", guard);
                return () => window.removeEventListener("beforeunload", guard);
            }, [dirty]);
            const save = async () => { const value = await draftApi("update", { ...form, id: selected.id, revision: selected.revision }); adopt(value); await reload(); setNotice(dt("草稿已保存，邮件未发送。", "Draft saved. No email was sent.")); return value; };
            const switchTo = async (target) => {
                if (target.kind === "new")
                    adopt(await draftApi("create", { account: target.account || "", to: "", cc: "", subject: "", text: "" }));
                else
                    adopt(await draftApi("get", { id: target.id }));
                await reload();
                setPending(null);
            };
            const requestSwitch = (target) => { if (dirty)
                setPending(target);
            else
                run(() => switchTo(target)); };
            useEffect(() => { if (active && requestedDraft && handledRequested.current !== requestedDraft && !operation.current && !busy) {
                handledRequested.current = requestedDraft;
                requestSwitch({ kind: "open", id: requestedDraft });
            } }, [active, requestedDraft, busy]);
            useEffect(()=>{if(active && composeRequest && handledCompose.current!==composeRequest.id && !operation.current && !busy){handledCompose.current=composeRequest.id;composeStage.current=dirty?'waiting':'running';requestSwitch({kind:'new',account:composeRequest.account});}},[active,composeRequest,busy]);
useEffect(()=>{if(composeRequest && handledCompose.current===composeRequest.id){if(pending)composeStage.current='waiting-observed';if(!operation.current && !busy && !pending && composeStage.current!=='waiting'){composeStage.current=null;onComposeFinished?.();}}},[composeRequest,busy,pending,onComposeFinished]);
const field = (key, zh, en, multiline) => h("div", { className: "dshe-field", key }, [
                h("label", { htmlFor: controlId + "-" + key }, dt(zh, en)),
                h(multiline ? "textarea" : "input", { id: controlId + "-" + key, type: multiline ? undefined : "text", value: form[key], disabled: busy || locked || !!selected?.reply && key === "subject", rows: multiline ? 8 : undefined, maxLength: multiline ? 102400 : key === "subject" ? 500 : 4096, onChange: (event) => { const value = event.target.value; setForm(current => ({ ...current, [key]: value })); setPreview(null); setAcknowledged(false); setNotice(""); } }),
            ]);
            const review = preview && h("section", { className: "dshe-review", "aria-label": dt("发送前预览", "Review before sending") }, [
                h("h3", null, dt("发送前预览", "Review before sending")),
                h("p", null, dt("发件人：", "From: ") + (preview.from.name ? preview.from.name + " <" + preview.from.address + ">" : preview.from.address)),
                h("p", null, dt("主题：", "Subject: ") + preview.draft.subject),
                preview.draft.sendAt?h('p',null,dt('定时发送：','Scheduled for: ')+formatDate(preview.draft.sendAt)):null,
                preview.matching.blocked ? h("div", { className: "dshe-alert error", role: "alert" }, dt("有收件人命中禁止规则，无法发送。请修改草稿或收件人规则。", "A recipient is blocked. Change the draft or recipient rules before sending.")) : null,
                h("ul", { className: "dshe-match-list" }, preview.matching.rows.map((row, index) => h("li", { key: index }, (row.field === "cc" ? "Cc: " : "To: ") + row.address + " · " + (row.blocked ? dt("禁止发送：", "Blocked: ") + row.value : row.matched ? dt("匹配可信规则", "Matches a trusted rule") : dt("需要确认", "Needs confirmation"))))),
                preview.body?.rich?.nodes?.length ? h(OutgoingMailPreview,{body:preview.body}) : h("pre", null, preview.body?.text || preview.draft.text || dt("（空正文）", "(Empty body)")),
                preview.attachments.length ? h("ul", { className: "dshe-files" }, preview.attachments.map(file => h("li", { key: file.id }, [
                    h("span", null, file.filename + " · " + Math.ceil(file.size / 1024) + " KiB"),
                    h("a", { href: DRAFT_ROUTE + "?preview=" + encodeURIComponent(preview.id) + "&attachment=" + encodeURIComponent(file.id), download: file.filename }, dt("下载检查", "Download to check")),
                ]))) : h("p", null, dt("没有附件", "No attachments")),
                h("div", { className: "dshe-hint" }, dt("附件已固定为本次预览快照。10 分钟后需重新预览；修改草稿、账号或规则也会使预览失效。", "Attachments are fixed to this preview. Review again after 10 minutes or when the draft, account or rules change.")),
                h("label", { className: "dshe-check" }, [h("input", { type: "checkbox", checked: acknowledged, disabled: busy, onChange: event => setAcknowledged(event.target.checked) }), dt("我已核对发件人、所有收件人、正文和附件", "I checked the sender, all recipients, content and attachments")]),
                h("div", { className: "dshe-actions" }, [
                    h("button", { type: "button", className: "dshe-btn", disabled: busy, onClick: () => run(async () => { await draftApi("cancelPreview", { id: selected.id }); setPreview(null); setAcknowledged(false); setNotice(dt("预览已取消，邮件未发送。", "Review cancelled. No email was sent.")); }) }, dt("取消预览", "Cancel review")),
                    h("button", { type: "button", className: "dshe-btn primary", disabled: busy || !acknowledged || dirty || preview.matching.blocked, onClick: () => run(async () => {
                            try {
                                const result = await draftApi(preview.draft.sendAt?'schedule':'send', { id: selected.id, preview: preview.id, confirmed: true, ...(preview.draft.sendAt?{sendAt:preview.draft.sendAt}:{}) });
                                adopt(result.draft);
                            }
                            finally {
                                setPreview(null);
                                setAcknowledged(false);
                                const fresh = await reload();
                                const current = fresh.drafts.find(draft => draft.id === selected.id);
                                if (current && current.state !== "draft")
                                    adopt(current);
                            }
                        }) }, busy ? dt("正在提交…", "Submitting…") : preview.draft.sendAt?dt('确认定时发送','Confirm scheduled send'):dt("确认发送", "Confirm send")),
                ]),
            ]);
            return h('section',{className:'email-drafts','aria-label':dt('邮件草稿','Email drafts')},
 h('div',{className:'email-draft-toolbar'},h('h3',null,dt('本地草稿','Local drafts')+' · '+data.drafts.length),h("button", { type: "button", className: "dshe-btn", disabled: busy, onClick: () => run(async () => { const next = await reload(); if (selected && !dirty) {
                            const saved = next.drafts.find(draft => draft.id === selected.id);
                            if (saved)
                                adopt(saved);
                        } }) }, dt("刷新列表", "Refresh list"))),h("p", { className: "dshe-hint" }, dt("草稿只保存在本机。模型可用 email_draft 准备内容，你在这里编辑、保存和确认发送。", "Drafts stay on this device. Ask the model to prepare one with email_draft, then edit, save and confirm here.")),
pending ? h("div", { className: "dshe-alert info", role: "alert" }, [dt("当前草稿有未保存的编辑。", "The current draft has unsaved edits."), h("div", { className: "dshe-actions" }, [
                        h("button", { type: "button", className: "dshe-btn", disabled: busy || locked, onClick: () => run(async () => { await save(); await switchTo(pending); }) }, dt("保存并切换", "Save and switch")),
                        h("button", { type: "button", className: "dshe-btn", disabled: busy, onClick: () => run(() => switchTo(pending)) }, dt("放弃编辑并切换", "Discard edits and switch")),
                        h("button", { type: "button", className: "dshe-btn", onClick: () => setPending(null) }, dt("保留编辑", "Keep editing")),
                    ])]) : null,
error ? h("div", { className: "dshe-alert error", role: "alert" }, [error, selected ? h("button", { type: "button", className: "dshe-btn", disabled: busy, onClick: () => requestSwitch({ kind: "open", id: selected.id }) }, dt("重新打开服务器版本", "Reopen saved version")) : null]) : null,
notice ? h("div", { className: "dshe-alert info", role: "status" }, notice) : null,
 h(W.Split,{listWidth:330,selected:showEditor && selected?selected.id:null,onBack:()=>setShowEditor(false),backLabel:dt('返回草稿列表','Back to drafts'),
 list:h('div',null,data.drafts.length?data.drafts.map(draft=>h(W.Row,{key:draft.id,disabled:busy,title:draft.subject || dt('未命名草稿','Untitled draft'),meta:draft.account || dt('尚未选择账号','No account selected'),status:selected?.id===draft.id && dirty?dt('未保存','Unsaved'):draftState(draft.state),active:selected?.id===draft.id,onClick:()=>{setShowEditor(true);requestSwitch({kind:'open',id:draft.id});}})):h(W.Empty,{title:dt('还没有草稿','No drafts yet'),icon:'mail'},dt('点击上方“写邮件”开始。','Choose Compose above to begin.'))),detail:selected && form ? h("div", { className: "dshe-draft-editor" }, [
 selected.reply ? h('p', { className: 'dshe-alert', role: 'note' }, dt('此草稿回复原邮件，保留会话关联与原文引用。请在引用上方填写回复，预览后再确认发送。', 'This draft replies in the original thread and includes a quoted copy. Write above the quote, then review and confirm before sending.')) : null,
                        h("div", { role: "status", className: "dshe-hint" }, dirty ? dt("有未保存的编辑", "Unsaved edits") : draftState(selected.state)),
                        selected.sendAt?h('p',{className:'dshe-hint'},dt('发送时间：','Send time: ')+formatDate(selected.sendAt)):null,
                        selected.error?h('p',{className:'dshe-alert warn',role:'status'},selected.error):null,
                        selected.state==='scheduled'?h('button',{className:'dshe-btn',disabled:busy,onClick:()=>run(async()=>{adopt(await draftApi('cancelSchedule',{id:selected.id,revision:selected.revision}));await reload();})},dt('取消定时并返回草稿','Cancel schedule and return to draft')):null,
                        h("div", { className: "dshe-field" }, [h("label", { htmlFor: controlId + "-account" }, dt("发件账号", "Sending account")), h("select", { id: controlId + "-account", value: form.account, disabled: busy || locked || !!selected?.reply, onChange: event => { const value = event.target.value; setForm(current => ({ ...current, account: value })); setPreview(null); setAcknowledged(false); } }, [h("option", { value: "" }, dt("请选择账号", "Choose an account")), ...[...new Set([...data.accounts, ...(form.account ? [form.account] : [])])].map(name => h("option", { key: name, value: name }, name))])]),
                        field("to", "收件人 To", "Recipients To"), field("cc", "抄送 Cc", "Copy Cc"), field("subject", "主题", "Subject"),
                        h('label',{className:'dshe-field'},dt('定时发送（可选，当前设备时区）','Schedule (optional, this device’s timezone)'),h('input',{type:'datetime-local','aria-label':dt('定时发送时间','Scheduled send time'),value:localSendTime(form.sendAt),disabled:busy||locked,onChange:e=>{const value=e.target.value;setForm(current=>({...current,sendAt:value?new Date(value).toISOString():''}));setPreview(null);setAcknowledged(false);}})),
                        h('p',{className:'dshe-hint'},dt('需保持 DSH 运行。关闭期间错过的时间不会自动补发；提交结果不确定时也不会自动重试。','Keep DSH running. Missed times while closed are not sent on restart; uncertain submissions are never retried automatically.')),
                        h('label',{className:'dshe-field'},dt('正文格式','Body format'),h('select',{'aria-label':dt('正文格式','Body format'),value:bodyFormat,disabled:busy||locked,onChange:e=>{const next=e.target.value;setBodyFormat(next);setForm(current=>({...current,html:next==='html'?(current.html||'<p>'+String(current.text||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g,'<br>')+'</p>'):'',text:next==='html'?'':current.text||current.html.replace(/<[^>]*>/g,' ')}));setPreview(null);setAcknowledged(false);}},h('option',{value:'text'},dt('纯文本','Plain text')),h('option',{value:'html'},dt('HTML 排版','Formatted HTML')))),
                        bodyFormat==='html'?h(React.Fragment,null,field('html','HTML 正文','HTML body',true),field('text','纯文本备选（可选）','Plain-text alternative (optional)',true),h('p',{className:'dshe-hint'},dt('预览并发送安全排版；未填写纯文本时自动生成。脚本和外部图片会移除。','Preview and send safe formatting. Plain text is generated when omitted. Scripts and external images are removed.'))):field("text", "正文", "Message", true),
                        h("ul", { className: "dshe-files" }, selected.attachments.filter(file => form.attachments.includes(file.id)).map(file => h("li", { key: file.id }, [h("span", null, file.filename), !locked ? h("button", { type: "button", className: "dshe-btn", disabled: busy, "aria-label": dt("移除附件 ", "Remove attachment ") + file.filename, onClick: () => { setForm(current => ({ ...current, attachments: current.attachments.filter(id => id !== file.id) })); setPreview(null); setAcknowledged(false); } }, dt("移除", "Remove")) : null]))),
                        !locked ? h("label", { className: "dshe-upload" }, [dt("添加附件（先保存编辑，最多 10 个 / 合计 ", "Add attachments (save edits first; up to 10 files / ") + capLabel + dt("）", " total)"), h("input", { type: "file", multiple: true, disabled: busy || dirty, "aria-label": dt("添加附件", "Add attachments"), onChange: event => { const files = Array.from(event.target.files || []); event.target.value = ""; run(async () => { let current = selected; for (const file of files) {
                                    if (file.size > attachmentCap)
                                        throw new Error(dt("单个附件超过 ", "Attachment exceeds ") + capLabel);
                                    current = await draftApi("upload", { id: current.id, revision: current.revision }, file);
                                    adopt(current);
                                } await reload(); setNotice(dt("附件已添加，尚未发送。请检查预览。", "Attachments added. Review before sending.")); }); } })]) : null,
                        !locked ? h("div", { className: "dshe-actions" }, [
                            h("button", { type: "button", className: "dshe-btn", disabled: busy || !dirty, onClick: () => run(save) }, dt("保存草稿", "Save draft")),
                            h("button", { type: "button", className: "dshe-btn primary", disabled: busy || dirty, onClick: () => run(async () => { setPreview(await draftApi("preview", { id: selected.id, revision: selected.revision })); setAcknowledged(false); setNotice(""); }) }, dt("检查发送预览", "Review before sending")),
                        ]) : null,
                        review,
                        selected.receipt ? h("div", { className: "dshe-alert " + (selected.receipt.rejected.length ? "info" : "success"), role: "status" }, [(selected.receipt.rejected.length ? dt("部分地址被服务器拒绝，邮件不会自动重发。服务器接受：", "Some addresses were rejected. This email will not retry automatically. Server accepted: ") : dt("服务器已返回回执，邮件不会再次发送。服务器接受：", "Server receipt saved. This draft will not send again. Server accepted: ")) + (selected.receipt.accepted.join(", ") || dt("无", "none")), h("p", null, dt("服务器拒绝：", "Server rejected: ") + (selected.receipt.rejected.join(", ") || dt("无", "none"))), h("p", null, dt("这是服务器提交结果，不代表已送达收件人的收件箱。", "This confirms the server response, not delivery to the recipient inbox."))]) : null,
                        selected.state === "uncertain" || selected.state === "sending" ? h("div", { className: "dshe-alert info", role: "status" }, selected.error || dt("提交尚未留下回执。先核对邮箱，再刷新列表；不要重复发送。", "No receipt yet. Check your mailbox, then refresh the list. Do not send again.")) : null,
                        h("div", { className: "dshe-local-actions" }, [
                            h("button", { type: "button", className: "dshe-btn", disabled: busy || selected.state === "sending" || dirty, onClick: () => setCopy(true) }, dt("复制为新草稿", "Copy to a new draft")),
                            h("button", { type: "button", className: "dshe-btn", disabled: busy || selected.state === "sending", onClick: () => setRemove(true) }, dt("删除本地草稿", "Delete local draft")),
                        ]),
                        copy ? h("div", { className: "dshe-alert info" }, [dt("会复制内容及附件为一份新的未发送草稿。若上次已提交或结果不明，请先核对邮箱，避免重复投递。", "Copies content and attachments to a new unsent draft. Check the mailbox first if the original was submitted or its result is uncertain."), h("div", { className: "dshe-actions" }, [h("button", { type: "button", className: "dshe-btn", disabled: busy, onClick: () => run(async () => { adopt(await draftApi("copy", { id: selected.id, revision: selected.revision, confirmed: true })); await reload(); }) }, dt("确认复制", "Confirm copy")), h("button", { type: "button", className: "dshe-btn", onClick: () => setCopy(false) }, dt("取消", "Cancel"))])]) : null,
                        remove ? h("div", { className: "dshe-alert info" }, [dt("只删除本地草稿与插件上传的附件副本；引用的原文件和邮箱中的邮件不会删除。", "Deletes this local draft and plugin-uploaded copies. Original files and mailbox messages stay intact."), h("div", { className: "dshe-actions" }, [h("button", { type: "button", className: "dshe-btn", disabled: busy, onClick: () => run(async () => { await draftApi("delete", { id: selected.id, revision: selected.revision, confirmed: true }); setSelected(null); setForm(null); setRemove(false); await reload(); }) }, dt("确认删除", "Confirm delete")), h("button", { type: "button", className: "dshe-btn", onClick: () => setRemove(false) }, dt("取消", "Cancel"))])]) : null,
                    ]) : h("div", { className: "dshe-editor-empty" }, dt("选择一份草稿，或新建草稿开始编辑。", "Select a draft or create one to start editing."))}));
        }
        function RecipientRules({ active, onSaved }) {
const fieldId=React.useId();
            const [data, setData] = useState(() => rulesUiCache && rulesUiCache.data), [account, setAccount] = useState(() => rulesUiCache && rulesUiCache.account || ""), [form, setForm] = useState(() => rulesUiCache && rulesUiCache.form || { addresses: "", domains: "", denyAddresses: "", denyDomains: "", skipApproval: false });
            const [base, setBase] = useState(() => rulesUiCache && rulesUiCache.base || ""), [busy, setBusy] = useState(false), [error, setError] = useState(""), [notice, setNotice] = useState(""), [pending, setPending] = useState(null), [to, setTo] = useState(() => rulesUiCache && rulesUiCache.to || ""), [cc, setCc] = useState(() => rulesUiCache && rulesUiCache.cc || ""), [match, setMatch] = useState(null);
            const operation = useRef(false), dirty = data && JSON.stringify(form) !== base;
// Update protection: dsh-email.rules
__stardustUpdatesGuard(React, "dsh-email.rules", { dirty: !!dirty, busy, retainOnClose: true });

            useEffect(() => { rulesUiCache = { data, account, form, base, to, cc }; }, [data, account, form, base, to, cc]);
            const choose = (next, name) => { const rule = next.policies[name] || { addresses: [], domains: [], skipApproval: false }, fields = { addresses: rule.addresses.join("\n"), domains: rule.domains.join("\n"), denyAddresses: (rule.denyAddresses || []).join("\n"), denyDomains: (rule.denyDomains || []).join("\n"), skipApproval: rule.skipApproval }; setAccount(name); setForm(fields); setBase(JSON.stringify(fields)); setMatch(null); setPending(null); };
            const run = async (fn) => { if (operation.current)
                return; operation.current = true; setBusy(true); setError(""); try {
                await fn();
            }
            catch (e) {
                setError(e.message || String(e));
            }
            finally {
                operation.current = false;
                setBusy(false);
            } };
            const load = async () => { const next = await draftApi("rules"); setData(next); choose(next, next.accounts.includes(account) ? account : next.accounts[0] || ""); };
            useEffect(() => { if (active && !dirty)
                run(load); }, [active]);
            useEffect(() => { const guard = event => { if (dirty) {
                event.preventDefault();
                event.returnValue = "";
            } }; window.addEventListener("beforeunload", guard); return () => window.removeEventListener("beforeunload", guard); }, [dirty]);
            const policy = () => ({ skipApproval: form.skipApproval, ...Object.fromEntries(['addresses', 'domains', 'denyAddresses', 'denyDomains'].map(key => [key, (form[key] || '').split(/\r?\n/).map(row => row.trim()).filter(Boolean)])) });
            const save = async () => { const next = await draftApi("saveRules", { account, policy: policy(), revision: data.revision }); setData(next); choose(next, account); onSaved(next.revision); setNotice(dt("此账号规则已保存。", "Rules saved for this account.")); return next; };
            const change = patch => { setForm(current => ({ ...current, ...patch })); setMatch(null); setNotice(""); };
            const request = target => { if (dirty)
                setPending(target);
            else if (target.kind === "reload")
                run(load);
            else
                choose(data, target.name); };
            return h("section", { className: "dshe-panel dshe-rule-panel", "aria-label": dt("可信收件人规则", "Trusted recipients") }, [
                h("p", { className: "dshe-hint" }, dt("默认每次确认。主动启用后，只有该账号的全部 To/Cc 都匹配时，email_send 才跳过插件确认；宿主权限仍然生效，草稿仍需手动确认。域名规则只匹配指定域名，不包含子域名。", "Approval is the default. When enabled, email_send skips this plugin's approval only if every To/Cc address matches this account's rules. Host permissions still apply, and drafts still need manual confirmation. Domain rules exclude subdomains.")),
                h("p", { className: "dshe-hint" }, dt("禁止规则优先于可信规则，关闭发信确认也不能绕过；同样适用于草稿、回复与转发。禁止域名也仅精确匹配，不包含子域名。", "Blocked recipients take precedence over trusted rules, even with send approval off. Blocks also apply to drafts, replies and forwards. Blocked domains match exactly and exclude subdomains.")),
                h('p', { className: 'dshe-hint' }, dt('可信回复免审默认关闭，可在连接设置中单独开启。开启后会读取原邮件并核对回复、回复全部或转发的所有实际 To/Cc；任何一位不可信都仍需确认。Full Access 无法显示确认时，可在草稿页预览并手动发送。', 'Trusted reply skipping is off by default and can be enabled in Connection settings. It checks every actual To/Cc for replies, reply-all and forwards; any unmatched recipient still needs confirmation. Use Drafts for manual review if Full Access cannot show a prompt.')),
                error ? h("div", { className: "dshe-alert error", role: "alert" }, error) : null,
                notice ? h("div", { className: "dshe-alert success", role: "status" }, notice) : null,
                data && data.sendApproval === false ? h("div", { className: "dshe-alert info" }, dt("全局发信确认目前已关闭；禁止规则仍然生效。", "Global send approval is off; blocked-recipient rules still apply.")) : null,
                h("div", { className: "dshe-field" }, [h("label", { htmlFor: fieldId + '-dshe-rule-account' }, dt("规则所属账号", "Account for these rules")), h("select", { id: fieldId + '-dshe-rule-account', value: account, disabled: busy, onChange: event => request({ kind: "account", name: event.target.value }) }, [h("option", { value: "", disabled: true }, dt("请选择已配置账号", "Choose a configured account")), ...(data ? data.accounts : []).map(name => h("option", { key: name, value: name }, name))])]),
                pending ? h("div", { className: "dshe-alert info" }, [dt("规则还未保存。", "Rules have unsaved edits."), h("div", { className: "dshe-actions" }, [h("button", { type: "button", className: "dshe-btn", disabled: busy, onClick: () => run(async () => { const next = await save(); if (pending.kind === "reload")
                                await load();
                            else
                                choose(next, pending.name); }) }, dt("保存并切换", "Save and switch")), h("button", { type: "button", className: "dshe-btn", disabled: busy, onClick: () => { if (pending.kind === "reload")
                                run(load);
                            else
                                choose(data, pending.name); } }, dt("放弃编辑并切换", "Discard edits and switch")), h("button", { type: "button", className: "dshe-btn", onClick: () => setPending(null) }, dt("保留编辑", "Keep editing"))])]) : null,
                h("div", { className: "dshe-field" }, [h("label", { htmlFor: fieldId + '-dshe-rule-addresses' }, dt("可信邮箱地址（每行一个）", "Trusted email addresses (one per line)")), h("textarea", { id: fieldId + '-dshe-rule-addresses', rows: 4, value: form.addresses, placeholder: "name@example.com", disabled: busy || !account, onChange: event => change({ addresses: event.target.value }) })]),
                h("div", { className: "dshe-field" }, [h("label", { htmlFor: fieldId + '-dshe-rule-domains' }, dt("可信域名（每行一个，匹配该域所有邮箱）", "Trusted domains (one per line, all mailboxes in that domain)")), h("textarea", { id: fieldId + '-dshe-rule-domains', rows: 3, value: form.domains, placeholder: "example.com", disabled: busy || !account, onChange: event => change({ domains: event.target.value }) })]),
                h("div", { className: "dshe-field" }, [h("label", { htmlFor: fieldId + '-dshe-rule-deny-addresses' }, dt("禁止邮箱地址（每行一个）", "Blocked email addresses (one per line)")), h("textarea", { id: fieldId + '-dshe-rule-deny-addresses', rows: 3, value: form.denyAddresses || '', placeholder: "blocked@example.com", disabled: busy || !account, onChange: event => change({ denyAddresses: event.target.value }) })]),
                h("div", { className: "dshe-field" }, [h("label", { htmlFor: fieldId + '-dshe-rule-deny-domains' }, dt("禁止域名（每行一个）", "Blocked domains (one per line)")), h("textarea", { id: fieldId + '-dshe-rule-deny-domains', rows: 3, value: form.denyDomains || '', placeholder: "blocked.example.com", disabled: busy || !account, onChange: event => change({ denyDomains: event.target.value }) })]),
                h("label", { className: "dshe-check" }, [h("input", { type: "checkbox", checked: form.skipApproval, disabled: busy || !account, onChange: event => change({ skipApproval: event.target.checked }) }), dt("允许全部匹配时跳过 email_send 的插件确认", "Skip plugin approval for email_send when all addresses match")]),
                h("div", { className: "dshe-actions" }, [h("button", { type: "button", className: "dshe-btn primary", disabled: busy || !dirty || !account || data && !data.writable, onClick: () => run(save) }, dt("保存此账号规则", "Save rules for this account")), h("button", { type: "button", className: "dshe-btn", disabled: busy, onClick: () => request({ kind: "reload" }) }, dt("重新加载规则", "Reload rules"))]),
                h("div", { className: "dshe-hint", role: "status" }, dirty ? dt("未保存；匹配预览使用当前编辑的规则。", "Unsaved; matching uses the rules you are editing.") : dt("已保存的规则才会作用于模型发信。", "Only saved rules affect model-initiated sends.")),
                h("div", { className: "dshe-field" }, [h("label", { htmlFor: fieldId + '-dshe-rule-to' }, dt("试填收件人 To", "Try recipients To")), h("input", { id: fieldId + '-dshe-rule-to', type: "text", value: to, disabled: busy, onChange: event => { setTo(event.target.value); setMatch(null); } })]),
                h("div", { className: "dshe-field" }, [h("label", { htmlFor: fieldId + '-dshe-rule-cc' }, dt("试填抄送 Cc", "Try copy Cc")), h("input", { id: fieldId + '-dshe-rule-cc', type: "text", value: cc, disabled: busy, onChange: event => { setCc(event.target.value); setMatch(null); } })]),
                h("button", { type: "button", className: "dshe-btn", disabled: busy || !account, onClick: () => run(async () => setMatch(await draftApi("matchRules", { account, policy: policy(), to, cc }))) }, dt("检查规则匹配（不发送）", "Check matches (no email sent)")),
                match ? h("div", { className: "dshe-review", role: "status" }, [h("p", null, match.blocked ? dt("收件人被禁止，无法发送。", "A recipient is blocked; sending is refused.") : match.skipsApproval ? dt("全部 To/Cc 匹配，可跳过插件确认。", "All To/Cc match; plugin approval can be skipped.") : dt("不会跳过插件确认。", "Plugin approval will remain.")), h("ul", { className: "dshe-match-list" }, match.rows.map((row, index) => h("li", { key: index }, row.field.toUpperCase() + ": " + row.address + " · " + (row.blocked ? dt("禁止：", "Blocked: ") + row.value : row.matched ? dt("匹配：", "Match: ") + row.value : dt("未匹配", "No match")))))]) : null,
            ]);
        }
        let emailWorkspace=null;
        async function mailTaskApi(action,payload={}) {
            const response=await fetch('/api/dsh-email/tasks',{credentials:'same-origin',method:'POST',headers:{'content-type':'application/json','x-dsh-email-tasks':'1'},body:JSON.stringify({action,...payload})});
            const result=await response.json();if(!response.ok||!result.ok)throw new Error(result.message||dt('任务操作失败','Task operation failed'));return result.value;
        }
        function MailTaskWorkbench({active,accounts=[]}) {
            const [data,setData]=useState(null),[config,setConfig]=useState(null),[aliases,setAliases]=useState(''),[rules,setRules]=useState('[]'),[senders,setSenders]=useState(''),[key,setKey]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false),[notice,setNotice]=useState('');
            const adopt=value=>{setData(value);setConfig(value.config);setAliases(Object.entries(value.config.workspaces||{}).map(([name,path])=>name+' = '+path).join('\n'));setRules(JSON.stringify(value.config.rules||[],null,2));setSenders((value.config.senders||[]).join('\n'));};
            const run=async fn=>{setBusy(true);setError('');setNotice('');try{await fn()}catch(e){setError(emailError(e))}finally{setBusy(false)}};
            useEffect(()=>{if(active)run(async()=>adopt(await mailTaskApi('list')));return()=>setKey('')},[active]);
            if(!config)return h('p',{role:'status'},error||dt('正在加载邮件任务…','Loading mail tasks…'));
            const change=patch=>setConfig(old=>({...old,...patch}));
            const field=(label,node)=>h('label',{className:'dshe-field'},h('span',null,label),node);
            const save=async()=>{const workspaces={};for(const line of aliases.split('\n').filter(x=>x.trim())){const at=line.indexOf('=');if(at<1)throw new Error(dt('每行填写：别名 = 现有文件夹绝对路径','Each line: alias = absolute path to an existing folder'));const name=line.slice(0,at).trim();if(Object.hasOwn(workspaces,name))throw new Error(dt('工作区别名重复','Duplicate workspace alias'));workspaces[name]=line.slice(at+1).trim();}adopt(await mailTaskApi('save',{revision:data.revision,config:{...config,senders:senders.split('\n').map(x=>x.trim()).filter(Boolean),workspaces,rules:JSON.parse(rules)}}));setNotice(dt('已保存。首次检查只建立起点，之后的新邮件才会触发任务。','Saved. The first check establishes a baseline; only later mail can trigger tasks.'));};
            const states={dispatching:dt('正在创建任务','Starting'),running:dt('执行中','Running'),waiting:dt('等待你在 DSH 中确认','Waiting for your input in DSH'),completed:dt('已完成','Completed'),attention:dt('需要查看','Needs attention'),replying:dt('正在提交回复','Submitting reply'),replied:dt('已回复','Replied'),uncertain:dt('发送结果不确定，请核对','Mail outcome uncertain; check sent mail')};
            return h('section',{'aria-label':dt('邮件触发任务','Mail-triggered tasks'),className:'dshe-global'},
                h('h3',null,dt('把邮件变成 DSH 任务','Turn email into a DSH task')),
                h('p',{className:'dshe-hint'},dt('从自己的邮箱发出任务，在指定工作区执行；可回复同一会话继续。默认关闭。任务使用你的模型，可能产生用量；权限请求仍需在 DSH 中确认。','Send a task from an authorized mailbox to an approved workspace, then continue the same session by email. Off by default. Tasks use your model and may incur usage; DSH permissions still require your input.')),
                !data.available?h('p',{className:'dshe-alert warn'},dt('当前 DSH 未提供原生任务服务，请升级 DSH 后使用。','Native task services are unavailable; update DSH to use this feature.')):null,
                error||data.error?h('p',{role:'alert',className:'dshe-alert error'},error||emailError(data.error)):null,
                notice?h('p',{role:'status'},notice):null,
                field(dt('接收任务的邮箱','Receiving account'),h('select',{value:config.account,disabled:busy,onChange:e=>change({account:e.target.value})},h('option',{value:''},dt('选择邮箱','Choose an account')),accounts.map(name=>h('option',{key:name,value:name},name)))),
                field(dt('接收文件夹','Receiving folder'),h('input',{value:config.folder,disabled:busy,onChange:e=>change({folder:e.target.value})})),
                field(dt('任务主题前缀','Task subject prefix'),h('input',{value:config.prefix||'dsh',disabled:busy,maxLength:32,onChange:e=>change({prefix:e.target.value})})),
                field(dt('允许的发件人（每行一个；留空仅允许邮箱本人）','Allowed senders (one per line; empty means the mailbox itself)'),h('textarea',{rows:3,value:senders,disabled:busy,placeholder:'you@example.com',onChange:e=>setSenders(e.target.value)})),
                field(dt('工作区别名（每行：别名 = 文件夹绝对路径）','Workspace aliases (each line: alias = absolute folder path)'),h('textarea',{rows:3,value:aliases,disabled:busy,placeholder:dt('work = E:\\projects\\my-project','work = /home/me/projects/my-project'),onChange:e=>setAliases(e.target.value)})),
                h('p',{className:'dshe-hint'},dt('任务只能选择这里保存的别名。现有会话也必须属于同一工作区；不会按邮件正文中的任意路径执行。','Tasks can use only saved aliases. Existing sessions must belong to that workspace.')),
                h('button',{type:'button',className:'dshe-btn',disabled:busy,onClick:()=>run(async()=>{const value=await mailTaskApi('rotateKey',{revision:data.revision});setData(value);setConfig(old=>({...old,enabled:false}));setKey(value.key);setNotice(dt('新口令只显示这一次，旧口令已失效。请保存后再启用。','New key shown once; the old key is invalid. Save your configuration before enabling.'));})},data.hasKey?dt('轮换任务口令（会暂停任务）','Rotate task key (pauses tasks)'):dt('生成任务口令','Generate task key')),
                key?h('div',{className:'dshe-review'},field(dt('复制以下邮件模板，妥善保存口令','Copy this email template and keep the key private'),h('textarea',{readOnly:true,rows:5,value:'Subject: '+(config.prefix||'dsh')+':'+(aliases.split('\n').find(x=>x.includes('='))?.split('=')[0].trim()||'work')+'\n\nDSH-Key: '+key+'\n'+dt('请在这里填写任务','Write your task here')})),h('button',{type:'button',className:'dshe-btn',onClick:()=>setKey('')},dt('隐藏口令','Hide key'))):null,
                h('p',{className:'dshe-hint'},dt('邮件主题：dsh:别名，或 dsh:别名:会话ID。正文第一行须为 DSH-Key: 任务口令；下一行起写任务。该口令授予白名单发件人在所选工作区发起任务的能力，请勿转发。','Subject: dsh:alias or dsh:alias:sessionId. Begin the body with DSH-Key: your-task-key, then write the task. The key authorizes whitelisted senders to start tasks in your approved workspace; keep it private.')),
                h('label',{className:'dshe-check'},h('input',{type:'checkbox',checked:config.autoReply,disabled:busy,onChange:e=>change({autoReply:e.target.checked})}),dt('自动回复最终结果给授权发件人（不抄送；沿用禁止收件人规则）','Automatically email the final result to the authorized sender (no Cc; recipient blocks apply)')),
                field(dt('检查间隔（秒）','Poll interval (seconds)'),h('input',{type:'number',min:30,max:3600,value:config.pollSeconds,disabled:busy,onChange:e=>change({pollSeconds:Number(e.target.value)})})),
                h('details',null,h('summary',null,dt('高级匹配与内容提取','Advanced matching and extraction')),h('p',{className:'dshe-hint'},dt('先核对发件人和口令，再匹配规则。支持 all / any、subject / body / from / to / cc、contains / equals / regex。命名分组可在 workspace、session、prompt 中用 ${name}；${body} 为已去除口令和引用的正文。工作区模板的结果仍须匹配允许别名。','Rules run after sender and key checks. Use all / any, fields subject / body / from / to / cc, operators contains / equals / regex. Named captures work as ${name} in workspace, session and prompt; ${body} is the body with the key and quoted history removed. Workspace results must match an allowed alias.')),field(dt('匹配规则（JSON 数组）','Rules (JSON array)'),h('textarea',{rows:8,value:rules,disabled:busy,spellCheck:false,onChange:e=>setRules(e.target.value)}))),
                h('label',{className:'dshe-check'},h('input',{type:'checkbox',checked:config.enabled,disabled:busy||!data.hasKey||!data.available,onChange:e=>change({enabled:e.target.checked})}),dt('启用邮件任务','Enable mail tasks')),
                h('div',{className:'dshe-actions'},h('button',{type:'button',className:'dshe-btn primary',disabled:busy,onClick:()=>run(save)},dt('保存任务设置','Save task settings')),h('button',{type:'button',className:'dshe-btn',disabled:busy,onClick:()=>run(async()=>{const value=await mailTaskApi('check');setData(value);setNotice(dt('检查完成；请查看下方任务记录。','Check finished; see task records below.'));})},dt('立即检查','Check now')),h('button',{type:'button',className:'dshe-btn',disabled:busy,onClick:()=>run(async()=>setData(await mailTaskApi('archive',{revision:data.revision})))},dt('清理已结束的任务记录','Clear finished task records'))),
                h('p',{className:'dshe-hint'},dt('DSH 需保持运行。重启后不重复执行进行中的任务；等待审批、超时或人工接手时请到原会话处理。','Keep DSH running. In-progress tasks are not replayed after restart. Handle approvals, timeouts or manual takeover in the original session.')),
                h('h4',null,dt('任务记录','Task records')),
                data.records?.length?h('ul',{className:'dshe-match-list'},data.records.map(row=>h('li',{key:row.id},h('strong',null,states[row.state]||row.state),' · '+row.sender+' · '+row.workspace+' · '+formatDate(row.createdAt),row.message?h('p',null,emailError(row.message)):null,row.sessionId?h('div',null,field(dt('会话 ID','Session ID'),h('input',{readOnly:true,value:row.sessionId})),emailWorkspace?h('button',{type:'button',className:'dshe-btn',onClick:()=>run(async()=>emailWorkspace.openSession(row.sessionId))},dt('打开 DSH 会话','Open DSH session')):null):null))):h('p',null,dt('暂无任务；首次检查仅建立起点。','No tasks yet. The first check establishes a baseline.'))
            );
        }
        function EmailSettingsSection({workbench=false}={}) {
const [composeAccount,setComposeAccount]=useState(''),[composeRequest,setComposeRequest]=useState(null);
const [,redrawLocale]=useState(0);useEffect(()=>activeLocaleService?.subscribe?.(()=>redrawLocale(n=>n+1)),[]);
            const [tab, setTab] = useState(workbench ? emailActiveTab : emailSettingsActiveTab);
            const [requestedDraft, setRequestedDraft] = useState("");
            const openMailboxDraft = id => { setRequestedDraft(id); setTab("drafts"); };
            useEffect(() => { if(workbench) emailActiveTab=tab;else emailSettingsActiveTab=tab; }, [tab]);
            const [draft, setDraft] = useState(null);
            useEffect(() => {
                if (draft === null)
                    return undefined;
                updateWhalePreference?.(draft.newMailPopup !== false);
                return () => updateWhalePreference?.(null);
            }, [draft?.newMailPopup]);
            const [snapshot, setSnapshot] = useState(undefined);
            const [busy, setBusy] = useState(false);
            const [error, setError] = useState("");
            /** 自动保存的可见状态：null 视同「已保存」（刚加载完、什么都没改）。 */
            const [saveState, setSaveState] = useState(null);
            const [incompleteDrafts, setIncompleteDrafts] = useState({ accounts: false, presets: false });
            const hasIncompleteDraft = incompleteDrafts.accounts || incompleteDrafts.presets;
// Update protection: dsh-email.settings
__stardustUpdatesGuard(React, "dsh-email.settings", { dirty: !!hasIncompleteDraft || !!saveState && saveState.kind !== "saved", busy: saveState?.kind === "saving" });

            /** 卡片级提示（注释丢失、序列化失败…）：走卡片自己的 notice 位，不打断顶部状态。 */
            const [cardsNotice, setCardsNotice] = useState(null);
            /**
             * 账号卡片的初始快照。只在 load 时取一次，保存之后**故意不刷新**：自动保存的
             * 往返若按新快照重建卡片，正在输入的密码框会被清空（用户接着打的就成了半截
             * 密码）。编辑期的卡片状态由卡片自己持有，要按 YAML 重建就点那个按钮。
             */
            const [cardsDetail, setCardsDetail] = useState(undefined);
            /**
             * 服务器预设的初始快照（同样只在 load 时取一次）。预设编辑器的卡片列表由它派生：
             * 自动保存的往返若让列表跟着快照重建，用户正在填的那张卡会被收起、未提交的字段
             * 会被旧值盖掉。账号卡片要的是「最新端点」，所以它们另走 live 快照 + customNames。
             */
            const [presetsAtLoad, setPresetsAtLoad] = useState(undefined);
            /**
             * 刚保存成功的预设名。端点仍以快照为准，这里只让「新预设名」先一步出现在账号卡片
             * 的服务商下拉里 —— 不然要等下一次 GET 才看得到自己刚加的名字。
             */
            const [customNames, setCustomNames] = useState([]);
            /** 最近一次成功保存/序列化后的 accountsYaml 原文：serializeAccounts 的种子（注释保留链）。 */
            const savedYamlRef = useRef(null);
            /** 当前该写进 value.accountsYaml 的文本（卡片序列化产物优先）。 */
            const accountsYamlRef = useRef(null);
            /** 已落盘的 value 签名：和当前值一样就不重复提交（加载完不会立刻白存一次）。 */
            const savedSignatureRef = useRef(null);
            /** 已排队/正在飞的签名：防止「刚 flush 完，effect 又排一次同样的值」。 */
            const pendingSignatureRef = useRef(null);
            const saveTimerRef = useRef(0);
            /** 每次「改动 / 开始保存」都 +1：结果回来时对不上就说明用户又改过了。 */
            const seqRef = useRef(0);
            const draftRef = useRef(null);
            const snapshotRef = useRef(undefined);
            draftRef.current = draft;
            snapshotRef.current = snapshot;
            const load = useCallback(async () => {
                setBusy(true);
                setError("");
                try {
                    const snap = await api();
                    setSnapshot(snap);
                    const value = (snap && snap.settings && snap.settings.value) || EMPTY;
                    const next = {
                        ...EMPTY,
                        ...value,
                        imap: { ...EMPTY.imap, ...(value.imap || {}) },
                        smtp: { ...EMPTY.smtp, ...(value.smtp || {}) },
                    };
                    setDraft(next);
                    // 新快照 = 新的 accountsYaml 基线：卡片产物作废，签名对齐，免得回存一次。
                    savedYamlRef.current = next.accountsYaml || "";
                    accountsYamlRef.current = next.accountsYaml || "";
                    savedSignatureRef.current = signatureOf(next, next.accountsYaml || "");
                    setSaveState(null);
                    setIncompleteDrafts({ accounts: false, presets: false });
                    setCardsNotice(null);
                    setCustomNames(presetNamesOf(next.serverPresets));
                    setCardsDetail(snap.accountsDetail);
                    setPresetsAtLoad(snap.presets);
                }
                catch (e) {
                    setError(emailError(e));
                }
                finally {
                    setBusy(false);
                }
            }, []);
            useEffect(() => { load(); }, [load]);
            const update = (patch) => setDraft((cur) => Object.assign({}, cur, patch));
            /**
             * 防抖排期。immediate = 明确动作（确认删除 / 登录前落盘），立刻落盘、不等那 800ms。
             * immediate 时把落盘的 promise 交出去，调用方要等「真的写完了」可以先 await 它；
             * 防抖那条路交不出 promise（定时器还没到点），返回 null。
             */
            const scheduleSave = (immediate) => {
                setSaveState({ kind: "busy" });
                // 用户又改了：还在飞的那次保存结果就作废，别拿旧结果盖住新状态。
                seqRef.current += 1;
                if (saveTimerRef.current)
                    clearTimeout(saveTimerRef.current);
                if (immediate === true) {
                    saveTimerRef.current = 0;
                    return flushSave();
                }
                saveTimerRef.current = setTimeout(() => {
                    saveTimerRef.current = 0;
                    flushSave();
                }, SAVE_DEBOUNCE_MS);
                return null;
            };
            /**
             * 落盘。读到的是 ref 里的最新值，所以「最后一次防抖周期」写的一定是用户最新的字。
             */
            const flushSave = async () => {
                const cur = draftRef.current;
                if (cur === null)
                    return;
                if (snapshotRef.current && snapshotRef.current.writable === false)
                    return;
                const seq = ++seqRef.current;
                const value = settingsValueOf(cur, accountsYamlRef.current === null ? (cur.accountsYaml || "") : accountsYamlRef.current);
                pendingSignatureRef.current = signatureOf(cur, value.accountsYaml);
                setSaveState({ kind: "busy" });
                try {
                    const rev = snapshotRef.current && snapshotRef.current.settings ? snapshotRef.current.settings.revision : 0;
                    let snap;
                    try {
                        snap = await api("save", { value, expectedRevision: rev });
                    }
                    catch (e) {
                        // Another writer moved the revision. Re-read it — and only it: the
                        // snapshot's draft fields are somebody else's truth, while the keystrokes
                        // in `value` are the user's. Retrying with the stale revision, which is
                        // what a bare retry button does, would conflict forever.
                        if (!e || e.code !== "settings-conflict")
                            throw e;
                        const fresh = await api();
                        const rebased = fresh && fresh.settings ? fresh.settings.revision : rev;
                        snap = await api("save", { value, expectedRevision: rebased });
                    }
                    savedYamlRef.current = value.accountsYaml;
                    savedSignatureRef.current = signatureOf(cur, value.accountsYaml);
                    pendingSignatureRef.current = savedSignatureRef.current;
                    if (seq !== seqRef.current) {
                        // 保存期间又改过：只吸收新 revision（否则下一次保存会拿旧 revision 撞车），
                        // 其余一律不动 —— 快照里的 accountsDetail / presets 是「上一次的值」，
                        // 用它重建会把用户正在打的字盖掉。状态指示交给新一轮防抖周期。
                        setSnapshot((old) => Object.assign({}, old, {
                            settings: snap.settings,
                            writable: snap.writable,
                        }));
                        return;
                    }
                    setSnapshot(snap);
                    setSaveState({ kind: "saved" });
                    const nextNames = presetNamesOf(value.serverPresets);
                    setCustomNames((old) => (old.join("|") === nextNames.join("|") ? old : nextNames));
                }
                catch (e) {
                    if (seq !== seqRef.current)
                        return;
                    // 失败时清掉「正在飞」的签名，否则同一个值再也不会被重排（点重试即可再存）。
                    pendingSignatureRef.current = null;
                    setSaveState({ kind: "error", text: emailError(e) });
                }
            };
            // 唯一的自动保存触发点：draft 变了就排一次防抖（不含 revision，不会自激）。
            useEffect(() => {
                if (draft === null)
                    return undefined;
                if (snapshotRef.current && snapshotRef.current.writable === false)
                    return undefined;
                const text = accountsYamlRef.current === null ? (draft.accountsYaml || "") : accountsYamlRef.current;
                const signature = signatureOf(draft, text);
                // 已落盘、或正在飞的就是这份值 → 不重复提交。
                if (signature === savedSignatureRef.current)
                    return undefined;
                if (signature === pendingSignatureRef.current)
                    return undefined;
                scheduleSave(false);
                return undefined;
                // eslint-disable-next-line
            }, [draft]);
            useEffect(() => () => {
                if (saveTimerRef.current)
                    clearTimeout(saveTimerRef.current);
            }, []);
            // 有没落盘的内容（保存中或保存失败）才拦离开：这正是「编辑即保存」剩下的窗口。
            useEffect(() => {
                const guard = (e) => {
                    if (!hasIncompleteDraft && (saveState === null || saveState.kind === "saved"))
                        return undefined;
                    e.preventDefault();
                    e.returnValue = "";
                    return "";
                };
                window.addEventListener("beforeunload", guard);
                return () => window.removeEventListener("beforeunload", guard);
            }, [saveState, hasIncompleteDraft]);
            /** 卡片序列化的往返序号：打字快时多个 serializeAccounts 会并发，只认最后一个。 */
            const cardsSeqRef = useRef(0);
            /**
             * 卡片快照 -> YAML 文本。种子用最近一次落盘的原文，注释能保就保。
             *
             * serverPresets 必须随行：账号只存 provider id，后端要认「这个自定义预设名是不是
             * 合法名字」只能查预设表。不带的话，一个刚定义、还没落盘的自定义预设名会被当成
             * 未知名字丢掉，账号的 provider 键就白选了。这里发的是「当前正在编辑的这份文本」，
             * 而不是已落盘的那份。
             */
            const serializeCards = async (cards, defaultAccount) => {
                const seed = savedYamlRef.current === null
                    ? (draftRef.current ? draftRef.current.accountsYaml || "" : "")
                    : savedYamlRef.current;
                const serverPresets = draftRef.current && typeof draftRef.current.serverPresets === "string"
                    ? draftRef.current.serverPresets
                    : "";
                return api("serializeAccounts", {
                    accountsYaml: seed,
                    accounts: cards,
                    defaultAccount: defaultAccount || "",
                    serverPresets,
                });
            };
            /**
             * 卡片改动：先序列化，再交给同一条防抖管道保存（immediate = 删除这类明确动作）。
             * 返回 { ok } 而不是抛：调用方大多忽略它，只有 OAuth 登录前那次要等「真的写完了」，
             * 而又没有任何地方需要为一个后台保存失败去 catch（失败由状态条 / 卡片提示说）。
             */
            const onCardsAutoSave = async (cards, defaultAccount, immediate) => {
                const seq = ++cardsSeqRef.current;
                setSaveState({ kind: "busy" });
                try {
                    const result = await serializeCards(cards, defaultAccount);
                    if (seq !== cardsSeqRef.current)
                        return { ok: false, reason: "superseded" }; // 更晚的一次已经在路上，别用旧结果盖新状态
                    const text = result && typeof result.accountsYaml === "string" ? result.accountsYaml : "";
                    accountsYamlRef.current = text;
                    update({ accountsYaml: text });
                    setCardsNotice(result.commentsDropped || result.passwordsDropped
                        ? {
                            kind: "info",
                            text: (result.commentsDropped ? t("notice.commentsDropped") : "")
                                + (result.passwordsDropped ? t("notice.passwordsDropped") : "")
                                + t("notice.restSaved"),
                        }
                        : null);
                    // immediate 时 scheduleSave 把落盘的 promise 交出来，等它才算「写完了」。
                    const flushed = scheduleSave(immediate === true);
                    if (flushed && typeof flushed.then === "function")
                        await flushed;
                    return { ok: true };
                }
                catch (e) {
                    if (seq !== cardsSeqRef.current)
                        return { ok: false, reason: "superseded" };
                    const message = emailError(e);
                    setCardsNotice({ kind: "error", text: t("notice.cardsNotWritten", { message }) });
                    setSaveState({ kind: "error", text: message });
                    return { ok: false, reason: message };
                }
            };
            /**
             * 卡片「测试连接」：先把卡片序列化成 YAML，再用整份表单去测。
             * 历史 bug 是这里只送了 accountsYaml —— 表单里的 provider/邮箱地址根本没进请求。
             * 现在唯一的 test 入口就是卡片上的按钮：单账户表单没了，顶部那个「测试连接」
             * 也就没有「测哪个账号」可言，一并去掉。
             */
            const onCardTest = async (accountName, cards, defaultAccount) => {
                const result = await serializeCards(cards, defaultAccount);
                const text = result && typeof result.accountsYaml === "string" ? result.accountsYaml : "";
                const value = settingsValueOf(draftRef.current, text);
                return api("test", { value, account: accountName });
            };
            if (draft === null) {
                return h(W.Page,{workbench,title:dt('邮件','Email'),subtitle:dt('阅读、回复和管理草稿。','Read, reply and manage drafts.'),className:'dshe-settings email-workbench'},h('style',null,EMAIL_WORKBENCH_CSS),h(W.Status,{tone:error?'error':'info'},error || t('common.loading')),error?h(W.Button,{disabled:busy,onClick:load},dt('重试','Retry')):null);
            }
            const accounts = snapshot && snapshot.accounts ? snapshot.accounts : [];
            const presetsMerged = presetsWithNames((snapshot && snapshot.presets) || undefined, customNames);
            const statusText = hasIncompleteDraft ? t("status.draft") : saveState === null
                ? t("status.saved")
                : saveState.kind === "busy"
                    ? t("status.saving")
                    : saveState.kind === "saved"
                        ? t("status.saved")
                        : t("status.saveFailed", { message: saveState.text });
            const status = h("span", {
                role: "status",
                "aria-live": "polite",
                className: "dshe-auto-status" + (hasIncompleteDraft ? " is-draft" : saveState === null ? "" : " is-" + saveState.kind),
            }, statusText);
            return h(W.Page,{workbench,title:dt('邮件','Email'),subtitle:dt('阅读、回复和管理草稿。','Read, reply and manage drafts.'),className:'dshe-settings email-workbench',actions:h(React.Fragment,null,
 h(W.Button,{variant:'primary',icon:'edit',disabled:!!composeRequest,onClick:()=>{setComposeRequest({id:crypto.randomUUID(),account:composeAccount || accounts[0] || ''});setTab('drafts');}},dt('写邮件','Compose')),
 h(W.Button,{icon:'settings',onClick:()=>setTab('accounts')},dt('邮箱设置','Account settings')))},h('style',null,EMAIL_WORKBENCH_CSS),
 h(W.Tabs,{label:dt('邮件功能','Email features'),value:tab,onChange:setTab,items:[{id:'mailbox',label:dt('收发邮件','Mailbox')},{id:'drafts',label:dt('草稿','Drafts')},{id:'accounts',label:dt('邮箱账号','Accounts')},{id:'rules',label:dt('收件人规则','Recipient rules')},{id:'tasks',label:dt('邮件任务','Mail tasks')}]},
 tab === 'accounts' && (saveState !== null || hasIncompleteDraft) ? h('div',{key:hasIncompleteDraft?'draft':saveState?.kind||'idle','data-kind':hasIncompleteDraft?'draft':saveState?.kind||'idle',className:'email-account-status'},status,!hasIncompleteDraft && saveState?.kind==='error'?h(W.Button,{onClick:()=>flushSave()},dt('重试保存','Retry save')):null) : null,
 h("div", { hidden: tab !== "mailbox", className: "dshe-section-hidden" }, h(MailboxWorkbench, { active: tab === "mailbox", onConfigure: () => setTab("accounts"), onDraft: openMailboxDraft, onAccountChange:setComposeAccount })),
h("div", { hidden: tab !== "drafts", className: "dshe-section-hidden" }, h(DraftWorkbench, { active: tab === "drafts", requestedDraft,composeRequest,onComposeFinished:()=>setComposeRequest(null) })),
h("div", { hidden: tab !== "rules", className: "dshe-section-hidden" }, h(RecipientRules, { active: tab === "rules", onSaved: revision => { setSnapshot(old => ({ ...old, settings: { ...old.settings, revision } })); } })),
h('div',{hidden:tab!=='tasks',className:'dshe-section-hidden'},h(MailTaskWorkbench,{active:tab==='tasks',accounts})),
h("section", { hidden: tab !== "accounts", className: "dshe-panel dshe-section-hidden" }, [
                    // 全局设置：发信确认和下载目录对所有账号一视同仁，不属于任何一张卡片，
                    // 所以摆在卡片列表上方，而不是塞进某一张卡里。
                    h("div", { className: "dshe-global" }, [
                        h("label", { className: "dshe-check" }, [
                            h("input", {
                                type: "checkbox",
                                checked: draft.newMailPopup !== false,
                                disabled: snapshot?.writable === false,
                                onChange: (e) => update({ newMailPopup: e.target.checked }),
                            }),
                            dt("显示新邮件弹窗", "Show new-mail popups"),
                        ]),
                        h("div", { className: "dshe-hint" }, dt("关闭后立即隐藏弹窗并停止自动检查，不影响对话中手动查看邮件。重新开启时从当前邮件开始提醒。", "Turning this off hides the popup and stops automatic mail checks. You can still check mail in a conversation. Turning it back on starts with a fresh baseline.")),
                        h("label", { className: "dshe-check" }, [
                            h("input", {
                                type: "checkbox",
                                checked: draft.sendApproval === true,
                                disabled: snapshot?.writable === false,
                                "aria-describedby": draft.sendApproval === false ? "dshe-send-approval-risk" : undefined,
                                onChange: (e) => update({ sendApproval: e.target.checked }),
                            }),
                            t("global.sendApproval"),
                        ]),
                        draft.sendApproval === false
                            ? h("div", { id: "dshe-send-approval-risk", className: "dshe-alert info", role: "status" }, t("global.sendApprovalRisk"))
                            : null,
                        h('label',{className:'dshe-field'},dt('回复引用语言','Reply quote language'),h('select',{'aria-label':dt('回复引用语言','Reply quote language'),value:draft.replyLocale||'auto',disabled:snapshot?.writable===false,onChange:e=>update({replyLocale:e.target.value})},h('option',{value:'auto'},dt('跟随界面，未知时用英语','Follow interface; English if unknown')),h('option',{value:'zh'},'中文'),h('option',{value:'en'},'English'),h('option',{value:'fr'},'Français'))),
                        h('label',{className:'dshe-check'},h('input',{type:'checkbox',checked:draft.allowTrustedReply===true,disabled:snapshot?.writable===false,onChange:e=>update({allowTrustedReply:e.target.checked})}),dt('允许可信回复免审（默认关闭）','Allow trusted replies without confirmation (off by default)')),
                        h('p',{className:'dshe-hint'},dt('开启后，仅当回复、回复全部或转发的所有实际 To/Cc 都匹配该账号可信规则时免审；禁止规则和宿主权限继续生效。','When enabled, every actual To/Cc in a reply, reply-all or forward must match that account’s trusted rules. Block rules and host permissions still apply.')),
                        h('label',{className:'dshe-field'},dt('引用日期时区（可选）','Quote date timezone (optional)'),h('input',{value:draft.replyTimeZone||'',placeholder:'Asia/Shanghai · Europe/Paris',disabled:snapshot?.writable===false,onChange:e=>update({replyTimeZone:e.target.value})})),
                        h("div", { className: "dshe-field" }, [
                            h("label", null, t("global.downloadDirLabel")),
                            fieldInput("text", draft.downloadDir, (v) => update({ downloadDir: v }), t("global.downloadDirPlaceholder")),
                        ]),
                        h("div", { className: "dshe-hint" }, t("global.hint")),
                    ]),
                    snapshot?.configurationManagedAccounts?.length ? h('div', { className: 'dshe-alert info', role: 'status' },
                        h('p', null, dt('以下账号由配置文件管理：', 'These accounts are managed in the configuration file: '), snapshot.configurationManagedAccounts.join('、')),
                        h('p', null, dt('可以在这里保存通用设置。账号及其授权码保持原样；如需新增或编辑账号，请修改配置文件中的 accounts。', 'You can save general settings here. Accounts and credentials are preserved; add or edit accounts in the configuration accounts map.')))
                    : h(AccountCardsEditor, {
                        detail: cardsDetail,
                        presets: presetsMerged,
                        extraNotice: cardsNotice,
                        onAutoSave: onCardsAutoSave,
                        onDraftStatus: (blocked) => setIncompleteDrafts((current) => ({ ...current, accounts: blocked })),
                        onTest: onCardTest,
                        // OAuth2 登录成功后重拉整份快照：卡片的 authKind/oauthState/oauthUser 是
                        // 服务端算出来的，只有新快照才拿得到（和加载走同一条路径）。
                        onReload: load,
                    }),
                    h("details", { className: "dshe-details dshe-prst-section" }, [
                        h("summary", null, t("preset.sectionTitle")),
                        h(ServerPresetsEditor, {
                            presets: presetsAtLoad,
                            onAutoSave: (text) => update({ serverPresets: typeof text === "string" ? text : "" }),
                            onDraftStatus: (blocked) => setIncompleteDrafts((current) => ({ ...current, presets: blocked })),
                        }),
                    ]),
                    snapshot && snapshot.writable === false
                        ? h("div", { className: "dshe-alert info" }, t("section.readonly"))
                        : null,
                ]),error ? h("div", { className: "dshe-alert error" }, error) : null,
accounts.length > 0
                    ? h("div", { className: "dshe-hint" }, t("section.activeAccounts", { accounts: accounts.join(t("common.listSeparator")) }))
                    : null));
        }
        // Whale-girl courier popup: polls the same-origin watch route every 30s.
        // The first poll seeds the baseline silently; later polls pop a card only
        // when newCount > 0. The artwork URL/credit come from the settings snapshot
        // (skin artwork is served from the user's local dsh-deep-whale install with
        // its CC BY-NC-SA attribution chain; otherwise a built-in fallback is used).
        let updateWhalePreference = null;
        function startWhaleWidget() {
            if (document.querySelector("#dsh-email-whale-root"))
                return () => { };
            const root = document.createElement("div");
            root.id = "dsh-email-whale-root";
            root.className = "dshe-whale-root";
            document.body.appendChild(root);
            let pollTimer = 0;
            let hideTimer = 0;
            let whaleUrl = "";
            let whaleCredit = "";
            let enabled = true;
            let localPreference = null;
            let disposed = false;
            let running = false;
            let generation = 0;
            let seedBaseline = true;
            let watchAbort = null;
            /** 当前弹窗的数据。语言切了就靠它原样重画一遍，无需再拉一次接口。 */
            let current = null;
            const closePopup = () => {
                if (hideTimer) {
                    clearTimeout(hideTimer);
                    hideTimer = 0;
                }
                root.replaceChildren();
                current = null;
            };
            const showPopup = (value) => {
                closePopup();
                if (disposed || !enabled)
                    return;
                current = value;
                const card = document.createElement("div");
                card.className = "dshe-whale-card";
                if (whaleUrl) {
                    const img = document.createElement("img");
                    img.className = "dshe-whale-img";
                    img.src = whaleUrl;
                    img.alt = "";
                    img.onerror = () => { img.remove(); };
                    card.appendChild(img);
                }
                const body = document.createElement("div");
                body.className = "dshe-whale-body";
                const title = document.createElement("div");
                title.className = "dshe-whale-title";
                title.textContent = t("whale.title", { count: value.newCount });
                body.appendChild(title);
                (value.messages || []).slice(0, 3).forEach((m) => {
                    const row = document.createElement("div");
                    row.className = "dshe-whale-item";
                    const who = (m.from || []).map((a) => a.name || a.address).filter(Boolean).join(", ") || t("whale.unknownSender");
                    row.textContent = t("whale.row", { who, subject: m.subject || t("whale.noSubject") });
                    body.appendChild(row);
                });
                if (value.newCount > 3) {
                    const more = document.createElement("div");
                    more.className = "dshe-whale-item";
                    more.textContent = t("whale.more", { count: value.newCount - 3 });
                    body.appendChild(more);
                }
                if (whaleCredit) {
                    const credit = document.createElement("div");
                    credit.className = "dshe-whale-credit";
                    credit.textContent = whaleCredit;
                    body.appendChild(credit);
                }
                card.appendChild(body);
                const closeBtn = document.createElement("button");
                closeBtn.className = "dshe-whale-close";
                closeBtn.textContent = "\u2715";
                closeBtn.setAttribute("aria-label", t("whale.close"));
                closeBtn.onclick = closePopup;
                card.appendChild(closeBtn);
                root.appendChild(card);
                hideTimer = setTimeout(closePopup, 12000);
            };
            // 轮询策略：页面不可见时完全不打扰邮箱服务器；失败指数退避（上限 10 分钟），
            // 成功立刻回到 30s；本地设置快照同样刷新，以便跨页面的通知开关生效。
            const POLL_MS = 30000;
            const MAX_BACKOFF_MS = 600000;
            let failures = 0;
            const setEnabled = (value) => {
                if (value === enabled)
                    return;
                enabled = value;
                generation++;
                seedBaseline = true;
                watchAbort?.abort();
                if (!enabled)
                    closePopup();
            };
            updateWhalePreference = value => {
                localPreference = value;
                if (value !== null)
                    setEnabled(value);
            };
            const tick = async () => {
                if (disposed || document.hidden || running)
                    return;
                running = true;
                try {
                    // Refresh the small local snapshot even when disabled so another tab's
                    // saved preference takes effect. This does not contact the mail server.
                    const snap = await api();
                    if (disposed)
                        return;
                    setEnabled(localPreference ?? (snap?.settings?.value?.newMailPopup !== false));
                    if (snap && snap.whale) {
                        whaleUrl = (snap.whale.url || "").replace(/^\/_dsh\//, "_dsh/");
                        whaleCredit = snap.whale.credit || "";
                    }
                    if (!enabled || !snap?.accounts?.length || document.hidden) {
                        failures = 0;
                        return;
                    }
                    const version = generation;
                    watchAbort = new AbortController();
                    const value = await api("watch", { limit: 5 }, watchAbort.signal);
                    if (disposed || !enabled || version !== generation || document.hidden)
                        return;
                    if (!seedBaseline && value && value.newCount > 0)
                        showPopup(value);
                    seedBaseline = false;
                    failures = 0;
                }
                catch (e) {
                    // Not configured or transient error: stay silent and back off.
                    failures = Math.min(failures + 1, 8);
                }
                finally {
                    running = false;
                    watchAbort = null;
                }
            };
            const schedule = () => {
                clearTimeout(pollTimer);
                if (disposed || document.hidden)
                    return;
                const delay = failures === 0 ? POLL_MS : Math.min(POLL_MS * Math.pow(2, failures - 1), MAX_BACKOFF_MS);
                pollTimer = setTimeout(() => { void tick().then(schedule); }, delay);
            };
            const onVisibility = () => {
                clearTimeout(pollTimer);
                if (disposed || document.hidden) {
                    watchAbort?.abort();
                    closePopup();
                    return;
                }
                failures = 0;
                void tick().then(schedule);
            };
            document.addEventListener("visibilitychange", onVisibility);
            void tick().then(schedule);
            // 弹窗是命令式 DOM，没有 React 那层重渲染：语言切换后自己重画一次（开着的才重画）。
            relocalize = () => { if (current !== null && root.childElementCount > 0)
                showPopup(current); };
            return () => {
                disposed = true;
                generation++;
                watchAbort?.abort();
                clearTimeout(pollTimer);
                document.removeEventListener("visibilitychange", onVisibility);
                if (hideTimer)
                    clearTimeout(hideTimer);
                relocalize = null;
                updateWhalePreference = null;
                root.remove();
            };
        }
        // 'locale' 在这里是**硬依赖**（cordis 语义：inject 里列了就等于「缺它就不启动」，
        // 服务缺席时 fiber 停在 pending，apply 根本不会被调用）。官方每个带 UI 文案的插件
        // 都这么写，本插件照抄：Web profile 的 bundle 无条件提供 locale 这一行。
        //
        // 那下面为什么还要那一整套存在性判断？因为它挡的不是「服务没列进 compose」，而是
        // 「服务在，但不是这个形状」——旧 ctx 没有 get()、getSnapshot/subscribe 由别的包
        // 提供且行为不同、测试里塞进来的替身只有一半。这些是 subscribeLocale 真正兜住的东西，
        // 兜不住也不会连带把 settings 段和鲸鱼娘一起拖垮。
        const inject = ["slots", "locale"];
        function apply(ctx) {
            ctx.inject?.(['uiWorkspace'],host=>{emailWorkspace=host.uiWorkspace;host.effect?.(()=>()=>{emailWorkspace=null})});
W.register(ctx,{id:'dsh-email.workbench',label:()=>dt('邮件','Email'),icon:'mail',component:EmailSettingsSection,order:54});

            // 语言要在任何 t() 之前定下来：槽位的 label thunk 和鲸鱼娘都在挂载时就取文案。
            ctx.effect(() => subscribeLocale(ctx), "dsh-email: locale");
            ctx.effect(() => {
                const id = "dsh-email/client";
                if (document.querySelector('style[data-plugin-css="' + id + '"]'))
                    return () => { };
                const style = document.createElement("style");
                style.dataset.plugin = "dsh-email";
                style.dataset.pluginCss = id;
                style.textContent = CSS;
                document.head.appendChild(style);
                return () => { style.remove(); };
            }, "dsh-email: styles");
            ctx.effect(() => startWhaleWidget(), "dsh-email: whale courier");
            ctx.slots.inject("settings.section", () => ctx.slots.register({
                name: "settings.section",
                id: "dsh-email",
                order: 45,
                label: () => {
                    const lang = uiLanguage();
                    if (typeof localeTranslate === "function") {
                        const localized = localeTranslate("nav.title");
                        if (localized !== "nav.title") return localized;
                    }
                    return (UI[lang] || UI.en)["nav.title"];
                },
                inject: () => ({}),
            }, EmailSettingsSection));
        }
        exports.apply = apply;
        exports.inject = inject;
        return module.exports;
    } });
