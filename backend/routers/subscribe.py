import base64
import json
import traceback
from datetime import datetime
from typing import Optional
from urllib.parse import quote

from fastapi import APIRouter, Depends, HTTPException, Request, Query
from fastapi.responses import PlainTextResponse
from sqlalchemy.orm import Session

from database import get_db
from models import User, Server

router = APIRouter(prefix="/api/subscribe", tags=["subscribe"])


@router.get("/{token}")
def get_subscribe(
    token: str,
    request: Request,
    db: Session = Depends(get_db),
    fmt: str = Query(default="", alias="format"),
):
    try:
        user = db.query(User).filter(User.subscribe_token == token).first()
        if not user:
            raise HTTPException(404, "无效的订阅链接")
        if not user.is_active:
            raise HTTPException(403, "账号已被禁用")

        now = datetime.utcnow()
        if not user.expire_time or user.expire_time < now:
            return PlainTextResponse("# subscription expired", media_type="text/plain")
        if user.data_used >= user.data_limit > 0:
            return PlainTextResponse("# data limit exceeded", media_type="text/plain")

        servers = db.query(Server).filter(Server.is_active == True).all()

        ua = (request.headers.get("user-agent") or "").lower()
        is_clash = fmt == "clash" or "clash" in ua or "meta" in ua

        if is_clash:
            return _build_clash_yaml(servers)
        else:
            return _build_base64(servers)
    except HTTPException:
        raise
    except Exception as e:
        tb = traceback.format_exc()
        print(f"Subscribe error: {tb}")
        return PlainTextResponse(f"Error: {e}\n\n{tb}", status_code=500)


def _parse_settings(raw: str) -> dict:
    """解析 settings_json，容忍控制字符"""
    if not raw:
        return {}
    try:
        return json.loads(raw, strict=False)
    except json.JSONDecodeError:
        # 清除所有控制字符后重试
        import re
        cleaned = re.sub(r'[\x00-\x1f\x7f]', '', raw)
        return json.loads(cleaned)


def _build_base64(servers) -> PlainTextResponse:
    lines = []
    for s in servers:
        settings = _parse_settings(s.settings_json)
        link = _build_link(s, settings)
        if link:
            lines.append(link)
    content = "\n".join(lines)
    encoded = base64.b64encode(content.encode()).decode()
    return PlainTextResponse(encoded, media_type="text/plain")


def _build_clash_yaml(servers) -> PlainTextResponse:
    """直接拼接 YAML 字符串，避免复杂的序列化问题"""
    proxy_blocks = []
    proxy_names = []

    for s in servers:
        settings = _parse_settings(s.settings_json)
        block = _build_clash_proxy_yaml(s, settings)
        if block:
            proxy_blocks.append(block)
            proxy_names.append(s.name)

    if not proxy_blocks:
        return PlainTextResponse("# no available servers", media_type="text/plain")

    proxies_str = "\n".join(proxy_blocks)
    names_str = "\n".join([f"      - \"{n}\"" for n in proxy_names])

    yaml_content = f"""mixed-port: 7890
allow-lan: false
mode: rule
log-level: info

proxies:
{proxies_str}

proxy-groups:
  - name: PROXY
    type: select
    proxies:
{names_str}

rules:
  - GEOIP,CN,DIRECT
  - MATCH,PROXY
"""
    return PlainTextResponse(yaml_content, media_type="text/yaml")


def _build_clash_proxy_yaml(server, settings: dict) -> Optional[str]:
    """直接生成单个节点的 YAML 文本块"""
    proto = server.protocol.lower()
    name = server.name
    addr = server.address
    port = server.port

    if proto == "vmess":
        uuid = settings.get("uuid", "")
        aid = settings.get("alter_id", 0)
        block = f'''  - name: "{name}"
    type: vmess
    server: {addr}
    port: {port}
    uuid: {uuid}
    alterId: {aid}
    cipher: auto'''
        net = settings.get("network", "tcp")
        if net == "ws":
            block += f"\n    network: ws"
            block += f"\n    ws-opts:"
            if settings.get("path"):
                block += f"\n      path: \"{settings['path']}\""
            if settings.get("host"):
                block += f"\n      headers:"
                block += f"\n        Host: \"{settings['host']}\""
        if settings.get("tls") == "tls":
            block += f"\n    tls: true"
            if settings.get("sni"):
                block += f"\n    servername: \"{settings['sni']}\""
        return block

    elif proto == "vless":
        uuid = settings.get("uuid", "")
        net = settings.get("type", "tcp")
        block = f'''  - name: "{name}"
    type: vless
    server: {addr}
    port: {port}
    uuid: {uuid}
    network: {net}
    udp: true'''

        security = settings.get("security", "")
        if security == "reality":
            sni = settings.get("sni", "")
            pbk = settings.get("pbk", "")
            sid = settings.get("sid", "")
            fp = settings.get("fp", "chrome")
            block += f"""
    tls: true
    servername: "{sni}"
    reality-opts:
      public-key: "{pbk}"
      short-id: "{sid}"
    client-fingerprint: {fp}"""

        elif security == "tls":
            block += f"\n    tls: true"
            if settings.get("sni"):
                block += f"\n    servername: \"{settings['sni']}\""

        if settings.get("flow"):
            block += f"\n    flow: {settings['flow']}"

        if net == "ws":
            block += f"\n    ws-opts:"
            if settings.get("path"):
                block += f"\n      path: \"{settings['path']}\""
            if settings.get("host"):
                block += f"\n      headers:"
                block += f"\n        Host: \"{settings['host']}\""
        elif net == "grpc" and settings.get("serviceName"):
            block += f"\n    grpc-opts:"
            block += f"\n      grpc-service-name: \"{settings['serviceName']}\""
        return block

    elif proto in ("ss", "shadowsocks"):
        method = settings.get("method", "aes-256-gcm")
        password = settings.get("password", "")
        return f'''  - name: "{name}"
    type: ss
    server: {addr}
    port: {port}
    cipher: {method}
    password: "{password}"'''

    elif proto == "trojan":
        password = settings.get("password", "")
        sni = settings.get("sni", addr)
        return f'''  - name: "{name}"
    type: trojan
    server: {addr}
    port: {port}
    password: "{password}"
    sni: "{sni}"
    udp: true'''

    return None


def _build_link(server, settings: dict) -> str:
    """V2RayN 格式节点链接"""
    proto = server.protocol.lower()

    if proto == "vmess":
        vmess_obj = {
            "v": "2",
            "ps": server.name,
            "add": server.address,
            "port": str(server.port),
            "id": settings.get("uuid", ""),
            "aid": str(settings.get("alter_id", 0)),
            "net": settings.get("network", "tcp"),
            "type": settings.get("type", "none"),
            "host": settings.get("host", ""),
            "path": settings.get("path", ""),
            "tls": settings.get("tls", ""),
        }
        raw = json.dumps(vmess_obj, ensure_ascii=False)
        return "vmess://" + base64.b64encode(raw.encode()).decode()

    elif proto == "vless":
        uuid = settings.get("uuid", "")
        params = [f"encryption={settings.get('encryption', 'none')}"]
        for key in ("security", "type", "sni", "fp", "pbk", "sid", "flow", "path", "host", "headerType", "alpn", "spx"):
            if settings.get(key):
                params.append(f"{key}={settings[key]}")
        query = "&".join(params)
        name = quote(server.name, safe="")
        return f"vless://{uuid}@{server.address}:{server.port}?{query}#{name}"

    elif proto in ("ss", "shadowsocks"):
        method = settings.get("method", "aes-256-gcm")
        password = settings.get("password", "")
        userinfo = base64.b64encode(f"{method}:{password}".encode()).decode()
        return f"ss://{userinfo}@{server.address}:{server.port}#{server.name}"

    elif proto == "trojan":
        password = settings.get("password", "")
        sni = settings.get("sni", server.address)
        return f"trojan://{password}@{server.address}:{server.port}?sni={sni}#{server.name}"

    return ""
