/**
 * 小黑盒 API 签名算法 — 移植自 better-XiaoHeiHe 项目
 * https://github.com/k1m0206/better-XiaoHeiHe
 */
import crypto from "node:crypto";

function md5(input: string): string {
  return crypto.createHash("md5").update(input).digest("hex");
}

/** AES MixColumns 变换，用于校验和计算 */
function mixColumns(values: number[]): number[] {
  function xtime(v: number) {
    return v & 128 ? ((v << 1) ^ 27) & 255 : v << 1;
  }
  function q(v: number) {
    return xtime(v) ^ v;
  }
  function r(v: number) {
    return q(xtime(v));
  }
  function y(v: number) {
    return r(q(xtime(v)));
  }
  function g(v: number) {
    return y(v) ^ r(v) ^ q(v);
  }

  // 关键：必须先用原始值算出 result，再写回 values
  // chain 式原位修改会导致后续行读到已被改写的值，结果错误
  const result = [0, 0, 0, 0];
  result[0] = g(values[0]) ^ y(values[1]) ^ r(values[2]) ^ q(values[3]);
  result[1] = q(values[0]) ^ g(values[1]) ^ y(values[2]) ^ r(values[3]);
  result[2] = r(values[0]) ^ q(values[1]) ^ g(values[2]) ^ y(values[3]);
  result[3] = y(values[0]) ^ r(values[1]) ^ q(values[2]) ^ g(values[3]);
  values[0] = result[0];
  values[1] = result[1];
  values[2] = result[2];
  values[3] = result[3];
  return values;
}

/** 将字符串通过字母表映射 */
function mapByAlphabet(value: string, alphabet: string, end: number): string {
  let result = "";
  const source = alphabet.slice(0, end);
  for (let i = 0; i < value.length; i++) {
    result += source[value.charCodeAt(i) % source.length];
  }
  return result;
}

/** 将字符串每个字符映射到字母表 */
function pathToAlphabet(value: string, alphabet: string): string {
  let result = "";
  for (let i = 0; i < value.length; i++) {
    result += alphabet[value.charCodeAt(i) % alphabet.length];
  }
  return result;
}

/** 交错拼接多个字符串 */
function interleave(values: string[]): string {
  let result = "";
  const maxLength = Math.max(...values.map((v) => v.length));
  for (let i = 0; i < maxLength; i++) {
    values.forEach((value) => {
      if (i < value.length) result += value[i];
    });
  }
  return result;
}

/**
 * 生成接口签名参数
 * 与小黑盒官网 www.xiaoheihe.cn 的签名逻辑完全一致
 */
export function createSignedParams(path: string): {
  hkey: string;
  _time: number;
  nonce: string;
} {
  const time = Math.floor(Date.now() / 1000);
  const nonce = md5(`${time}${Math.random()}`).toUpperCase();
  const normalizedPath = `/${path.split("/").filter(Boolean).join("/")}/`;

  const alphabet = "AB45STUVWZEFGJ6CH01D237IXYPQRKLMN89";

  const seed = interleave([
    mapByAlphabet(String(time + 1), alphabet, -2),
    pathToAlphabet(normalizedPath, alphabet),
    pathToAlphabet(nonce, alphabet),
  ]).slice(0, 20);

  const hash = md5(seed);
  const checksum = String(
    mixColumns(
      hash
        .slice(-6)
        .split("")
        .map((c) => c.charCodeAt(0))
    ).reduce((sum, v) => sum + v, 0) % 100
  ).padStart(2, "0");

  return {
    hkey: `${mapByAlphabet(hash.substring(0, 5), alphabet, -4)}${checksum}`,
    _time: time,
    nonce,
  };
}

/**
 * 获取小黑盒 Web API 基础公共参数
 */
export function getBaseApiParams(options?: { includeHeyboxId?: boolean }): Record<string, string> {
  const { includeHeyboxId = false } = options || {};
  // 参数与官网请求完全一致（参考 working curl）
  const params: Record<string, string> = {
    app: "heybox",
    os_type: "web",
    x_app: "heybox_website",
    x_client_type: "web",
    x_os_type: "Windows",
    x_client_version: "",
    client_type: "web",
    web_version: "3.0",
    version: "999.0.4",
  };

  if (!includeHeyboxId) {
    delete params.heybox_id;
  }

  return params;
}

/**
 * 构建带签名的完整 API URL
 */
export function buildSignedUrl(baseUrl: string, path: string, extraParams?: Record<string, string>): string {
  const merged: Record<string, string> = {
    ...getBaseApiParams(),
  };

  // createSignedParams 返回的 _time 是 number，需要转为 string
  const signed = createSignedParams(path);
  merged.hkey = signed.hkey;
  merged._time = String(signed._time);
  merged.nonce = signed.nonce;

  if (extraParams) {
    Object.assign(merged, extraParams);
  }

  const params = new URLSearchParams(merged);
  return `${baseUrl}${path}?${params.toString()}`;
}
