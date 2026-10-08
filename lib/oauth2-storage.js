/** Windows DPAPI protects stored OAuth2 credentials with the current user's OS key. */
import { spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { closeSync, fsyncSync, mkdirSync, openSync, readFileSync, renameSync, unlinkSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
const MAX_STORE_BYTES = 1024 * 1024;
const PROTECTION = 'windows-dpapi-current-user';
const ENTROPY = 'dsh-email/oauth2-tokens/v2';
const STORAGE_MESSAGE = '无法读取或解锁 OAuth2 登录数据：Windows 加密文件需原 Windows 账号；损坏或换设备时请先保留并移走 oauth2-tokens.json，再重新登录。原文件未被覆盖。';
const ENCRYPTION_MESSAGE = '无法安全保存 OAuth2 登录数据：Windows 用户加密不可用，请检查系统 PowerShell / DPAPI 后重试。未写入明文令牌。';
export class OAuth2StorageError extends Error {
}
// Cache only one authenticated document. File bytes are checked on every read;
// callers parse their own copy so deleting an account cannot mutate this cache.
let cached;
function dpapi(operation, input) {
    const root = process.env.SystemRoot ?? process.env.WINDIR ?? 'C:\\Windows';
    const executable = join(root, 'System32', 'WindowsPowerShell', 'v1.0', 'powershell.exe');
    // This script is static: credentials go through stdin, never argv, an env var,
    // a temporary plaintext file, a profile script or a generated shell command.
    const script = `$ErrorActionPreference='Stop'; try {
    Add-Type -AssemblyName System.Security
    $bytes=[Convert]::FromBase64String([Console]::In.ReadToEnd())
    $entropy=[Text.Encoding]::UTF8.GetBytes('${ENTROPY}')
    $result=[Security.Cryptography.ProtectedData]::${operation}($bytes,$entropy,[Security.Cryptography.DataProtectionScope]::CurrentUser)
    [Console]::Out.Write([Convert]::ToBase64String($result))
  } catch { [Console]::Error.Write('DPAPI failed'); exit 1 }`;
    const result = spawnSync(executable, ['-NoLogo', '-NoProfile', '-NonInteractive', '-EncodedCommand', Buffer.from(script, 'utf16le').toString('base64')], {
        input: input.toString('base64'), encoding: 'utf8', windowsHide: true,
        timeout: 10000, maxBuffer: MAX_STORE_BYTES * 4,
    });
    const output = result.stdout?.trim() ?? '';
    if (result.error !== undefined || result.status !== 0 || output === '' || !/^[A-Za-z0-9+/]+={0,2}$/.test(output)) {
        throw new OAuth2StorageError(operation === 'Protect' ? ENCRYPTION_MESSAGE : STORAGE_MESSAGE);
    }
    return Buffer.from(output, 'base64');
}
function isProtected(doc) {
    return doc !== null && typeof doc === 'object' && !Array.isArray(doc)
        && ((doc.version !== undefined && doc.version !== 1) || 'protection' in doc || 'ciphertext' in doc);
}
function parseDocument(raw) {
    if (Buffer.byteLength(raw) > MAX_STORE_BYTES * 2)
        throw new OAuth2StorageError(STORAGE_MESSAGE);
    try {
        return JSON.parse(raw);
    }
    catch {
        throw new OAuth2StorageError(STORAGE_MESSAGE);
    }
}
export function readOAuth2Document(file) {
    const raw = readFileSync(file, 'utf8');
    const doc = parseDocument(raw);
    if (!isProtected(doc))
        return doc;
    if (process.platform !== 'win32' || doc.version !== 2 || doc.protection !== PROTECTION
        || typeof doc.ciphertext !== 'string' || !/^[A-Za-z0-9+/]+={0,2}$/.test(doc.ciphertext)) {
        throw new OAuth2StorageError(STORAGE_MESSAGE);
    }
    try {
        const plaintext = cached?.file === file && cached.envelope === raw
            ? cached.plaintext : dpapi('Unprotect', Buffer.from(doc.ciphertext, 'base64')).toString('utf8');
        const value = JSON.parse(plaintext);
        if (value === null || typeof value !== 'object' || Array.isArray(value)
            || value.version !== 1)
            throw new Error('Invalid protected document');
        cached = { file, envelope: raw, plaintext };
        return value;
    }
    catch {
        throw new OAuth2StorageError(STORAGE_MESSAGE);
    }
}
/** Encrypt before touching the destination, then replace it in one rename. */
export function writeOAuth2Document(file, doc) {
    // Never replace a locked, foreign-user, unsupported or damaged encrypted
    // store with a new empty store during a login or account deletion.
    let existing;
    try {
        existing = parseDocument(readFileSync(file, 'utf8'));
    }
    catch (error) {
        if (error.code !== 'ENOENT')
            throw error;
    }
    if (isProtected(existing))
        readOAuth2Document(file);
    const plaintext = JSON.stringify(doc, null, 2) + '\n';
    if (Buffer.byteLength(plaintext) > MAX_STORE_BYTES)
        throw new OAuth2StorageError('OAuth2 登录数据过大，原文件未被覆盖。');
    const raw = process.platform === 'win32'
        ? JSON.stringify({ version: 2, protection: PROTECTION, ciphertext: dpapi('Protect', Buffer.from(plaintext)).toString('base64') }, null, 2) + '\n'
        : plaintext;
    mkdirSync(dirname(file), { recursive: true, mode: 0o700 });
    const temp = file + '.' + randomUUID() + '.tmp';
    let fd;
    try {
        fd = openSync(temp, 'wx', 0o600);
        writeFileSync(fd, raw, 'utf8');
        fsyncSync(fd);
        closeSync(fd);
        fd = undefined;
        renameSync(temp, file);
        cached = process.platform === 'win32' ? { file, envelope: raw, plaintext } : undefined;
    }
    finally {
        if (fd !== undefined)
            closeSync(fd);
        try {
            unlinkSync(temp);
        }
        catch (error) {
            if (error.code !== 'ENOENT')
                throw error;
        }
    }
}
export function isLegacyOAuth2Document(doc) {
    return !isProtected(doc);
}
