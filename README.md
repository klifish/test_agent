# 贪吃蛇游戏 - Snake Game

一个使用 HTML5 Canvas 和 JavaScript 开发的经典贪吃蛇游戏。

## 游戏特性

- 🐍 经典贪吃蛇玩法
- 🎮 响应式键盘控制
- 🏆 分数记录和最高分保存
- ⏸️ 暂停/继续功能
- 🎨 现代化界面设计
- 📱 支持移动设备

## 如何运行

1. 直接在浏览器中打开 `index.html` 文件
2. 或者使用本地服务器运行：
   ```bash
   # 使用 Python 3
   python -m http.server 8000
   
   # 使用 Python 2
   python -m SimpleHTTPServer 8000
   
   # 使用 Node.js
   npx http-server
   ```
3. 在浏览器中访问 `http://localhost:8000`

## 游戏规则

- 使用方向键（↑↓←→）控制贪吃蛇的移动方向
- 吃到红色食物可以增长身体和获得分数
- 不能撞到墙壁或者自己的身体
- 游戏结束后可以重新开始

## 游戏控制

- **方向键**：控制蛇的移动
- **开始游戏**：开始新的游戏
- **暂停/继续**：暂停或继续当前游戏
- **重新开始**：重置游戏状态

## 文件结构

```
├── index.html    # 主页面文件
├── style.css     # 样式文件
├── snake.js      # 游戏逻辑文件
└── README.md     # 说明文档
```

## 技术实现

- **HTML5 Canvas**：用于游戏渲染
- **JavaScript ES6+**：游戏逻辑和交互
- **CSS3**：现代化样式和动画效果
- **LocalStorage**：保存最高分记录

享受游戏吧！🎮