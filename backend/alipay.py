"""
支付宝当面付封装。

在未配置支付宝密钥时使用模拟模式，方便开发测试。
配置好 ALIPAY_APP_ID 和密钥文件后自动切换为真实支付。
"""

import os
import json
from config import ALIPAY_APP_ID, ALIPAY_PRIVATE_KEY_PATH, ALIPAY_PUBLIC_KEY_PATH, ALIPAY_SANDBOX

_alipay_client = None
_mock_mode = True


def _init_alipay():
    global _alipay_client, _mock_mode

    if not ALIPAY_APP_ID or not os.path.exists(ALIPAY_PRIVATE_KEY_PATH):
        _mock_mode = True
        return

    try:
        from alipay import AliPay
        with open(ALIPAY_PRIVATE_KEY_PATH, "r") as f:
            private_key = f.read()
        with open(ALIPAY_PUBLIC_KEY_PATH, "r") as f:
            public_key = f.read()
        _alipay_client = AliPay(
            appid=ALIPAY_APP_ID,
            app_notify_url=None,
            app_private_key_string=private_key,
            alipay_public_key_string=public_key,
            sign_type="RSA2",
            debug=ALIPAY_SANDBOX,
        )
        _mock_mode = False
    except Exception:
        _mock_mode = True


_init_alipay()


def create_qr_pay(out_trade_no: str, total_amount: float, subject: str) -> dict:
    """创建当面付订单，返回 {"qr_code": url, "mock": bool}"""
    if _mock_mode:
        return {
            "qr_code": f"mock://pay?trade_no={out_trade_no}&amount={total_amount}",
            "mock": True,
        }

    result = _alipay_client.api_alipay_trade_precreate(
        out_trade_no=out_trade_no,
        total_amount=str(total_amount),
        subject=subject,
    )
    return {
        "qr_code": result.get("qr_code", ""),
        "mock": False,
    }


def verify_notify(data: dict) -> bool:
    """验证支付宝异步通知签名"""
    if _mock_mode:
        return True
    try:
        from alipay import AliPay
        sign = data.pop("sign", None)
        sign_type = data.pop("sign_type", None)
        return _alipay_client.verify(data, sign)
    except Exception:
        return False
