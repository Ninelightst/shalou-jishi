#!/bin/bash
# 修复：VPN 系统代理劫持 localhost，导致本地应用（沙漏记事等）打不开
for svc in $(networksetup -listallnetworkservices | tail -n +2 | grep -v "^\*"); do
  networksetup -setproxybypassdomains "$svc" '*.local' '169.254/16' 'localhost' '127.0.0.1' 2>/dev/null
done
echo ""
echo "✅ 修复完成：localhost 和 127.0.0.1 已加入代理绕过列表"
echo ""
echo "现在去刷新浏览器里的 http://localhost:5173 即可。"
echo ""
read -p "按回车键关闭本窗口"
