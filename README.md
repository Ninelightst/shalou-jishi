# 沙漏记事（Hourglass Journal）

个性化离线日程 App：沙漏计时 + 分类日程 + 每日时间报告 + 沙漠养成。

**完全离线可用**，数据保存在设备本地（IndexedDB），无需注册账号。

## 功能

- **聚沙成塔**（计时 + 日程合并）：计时器支持自定义时长、快捷预设、自填新类型（自动创建分类）；日程支持工作/生活/学习/娱乐分类（可自定义）、日视图 + 月历导航；添加日程时可勾选「保存后立即开始计时」，计时随日程时间段自动开始
- **每日报告**：每天结束自动生成时间使用报告快照（分类占比环形图 + 条形图 + 日程明细）；当日实时统计
- **沙漠养成** 🎮：
  - 日程**到点自动完成**并发放奖励（结束时间过后自动触发，无需手动点击；也可点条目左侧圆圈提前完成）
  - 勾选完成日程 → 沙漏×1 + 分类奖励：学习→金币、工作→化肥、娱乐→水壶、生活→随机三选一
  - 单独计时结束（实际 ≥1 分钟）同样发放奖励；从日程启动的计时由日程完成统一发放，不重复
  - 沙漠页倒沙 → 沙漠从荒漠逐渐变成绿洲
  - 金币在商城购买树苗；化肥提升肥沃度、水壶提升湿润度
  - 肥沃度与湿润度均达 60 → 树苗长成大树，≥3 棵大树连成**森林**
- **备份**：一键导出 JSON 备份文件，可随时导入恢复

## 在 Mac 上使用

```bash
npm install
npm run dev          # 开发模式，浏览器打开 http://localhost:5173
```

或使用生产构建（含离线缓存）：

```bash
npm run build
npm run preview      # 浏览器打开 http://localhost:4173
```

Chrome 地址栏右侧会出现「安装」图标，点击即可把沙漏记事安装为独立应用。

## 安装到手机（OPPO 等安卓机型）

PWA 需要 HTTPS 才能安装，推荐用 GitHub Pages 免费托管（数据仍只存在各设备本地）：

1. 在 GitHub 上新建一个空仓库（如 `shalou-jishi`）
2. 首次推送代码：

```bash
git add .
git commit -m "沙漏记事初版"
git remote add origin https://github.com/<你的用户名>/shalou-jishi.git
git push -u origin main
```

3. 一键部署到 GitHub Pages：

```bash
npx gh-pages -d dist
```

4. 在 GitHub 仓库页面：Settings → Pages → Source 选 `gh-pages` 分支（`npx gh-pages` 首次执行后该分支会自动出现），保存后得到网址 `https://<用户名>.github.io/shalou-jishi/`

5. 手机浏览器（Chrome/系统浏览器）打开该网址 → 会出现「安装」提示（或菜单 → 添加到主屏幕）→ 安装后即可像 App 一样使用，**飞行模式下也能打开**

> 没有 GitHub 账号也可以：用 Cloudflare Pages / Netlify 同样免费（拖拽 dist 文件夹上传即可），或先用 Mac 本地使用。

## 常见问题

- **换设备数据怎么办？** 设置 → 导出备份 → 在新设备上导入即可
- **数据会传到服务器吗？** 不会。服务器只托管静态页面文件，所有数据都在设备本地
- **计时结束没听到铃声？** iOS/安卓首次使用需点击过页面（浏览器音频策略），计时开始按钮本身就是一次点击，正常使用不会遇到

## 开发

```bash
npm install
npm run dev        # 开发
npm run build      # 构建（含 Service Worker 离线缓存）
npm run preview    # 预览生产构建
npm run icons      # 重新生成 PWA 图标（修改 public/hourglass.svg 后）
```

技术栈：React 19 + TypeScript + Vite + Dexie（IndexedDB）+ vite-plugin-pwa（离线）。
