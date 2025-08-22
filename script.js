// 游戏状态
const GameState = {
    READY: 'ready',
    PLAYING: 'playing',
    PAUSED: 'paused',
    GAME_OVER: 'game_over'
};

// 方向常量
const Direction = {
    UP: { x: 0, y: -1 },
    DOWN: { x: 0, y: 1 },
    LEFT: { x: -1, y: 0 },
    RIGHT: { x: 1, y: 0 }
};

// 游戏配置
const CONFIG = {
    GRID_SIZE: 20,
    CANVAS_SIZE: 400,
    INITIAL_SPEED: 300,  // 增加初始速度延迟，让游戏更慢一些
    SPEED_INCREASE: 5,
    FOOD_SCORE: 10,
    PORTAL_TELEPORT_OFFSET: 2  // 传送后的位置偏移，避免立即再次传送
};

class SnakeGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.scoreElement = document.getElementById('score');
        this.highScoreElement = document.getElementById('high-score');
        this.finalScoreElement = document.getElementById('finalScore');
        this.gameOverScreen = document.getElementById('gameOverScreen');
        this.startBtn = document.getElementById('startBtn');
        this.pauseBtn = document.getElementById('pauseBtn');
        this.restartBtn = document.getElementById('restartBtn');
        
        this.initGame();
        this.setupEventListeners();
        this.loadHighScore();
    }
    
    initGame() {
        this.state = GameState.READY;
        this.score = 0;
        this.speed = CONFIG.INITIAL_SPEED;
        this.gridCount = CONFIG.CANVAS_SIZE / CONFIG.GRID_SIZE;
        
        // 初始化蛇 - 放置在更中心的位置，更远离边界和传送门
        const centerX = Math.floor(this.gridCount / 4); // 在1/4位置开始
        const centerY = Math.floor(this.gridCount / 2);
        this.snake = [
            { x: centerX, y: centerY }
        ];
        this.direction = Direction.RIGHT;
        this.nextDirection = Direction.RIGHT;
        
        // 初始化传送门（先初始化蛇，再初始化传送门）
        this.generatePortals();
        
        // 初始化随机传送门重生系统
        this.initRandomPortalSystem();
        
        // 初始化食物
        this.generateFood();
        
        // 初始化闪烁动画计时器
        this.blinkTimer = 0;
        
        this.updateDisplay();
        this.draw();
    }
    
    setupEventListeners() {
        // 按钮事件
        this.startBtn.addEventListener('click', () => this.startGame());
        this.pauseBtn.addEventListener('click', () => this.togglePause());
        this.restartBtn.addEventListener('click', () => this.restartGame());
        
        // 键盘控制
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));
        
        // 防止方向键滚动页面
        document.addEventListener('keydown', (e) => {
            if(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                e.preventDefault();
            }
        });
    }
    
    handleKeyPress(event) {
        if (this.state !== GameState.PLAYING) return;
        
        switch(event.key) {
            case 'ArrowUp':
                if (this.direction.y === 0) this.nextDirection = Direction.UP;
                break;
            case 'ArrowDown':
                if (this.direction.y === 0) this.nextDirection = Direction.DOWN;
                break;
            case 'ArrowLeft':
                if (this.direction.x === 0) this.nextDirection = Direction.LEFT;
                break;
            case 'ArrowRight':
                if (this.direction.x === 0) this.nextDirection = Direction.RIGHT;
                break;
            case ' ':
                this.togglePause();
                break;
        }
    }
    
    startGame() {
        this.state = GameState.PLAYING;
        this.startBtn.disabled = true;
        this.pauseBtn.disabled = false;
        // Add a small delay before starting the game loop
        setTimeout(() => this.gameLoop(), 500);
    }
    
    togglePause() {
        if (this.state === GameState.PLAYING) {
            this.state = GameState.PAUSED;
            this.pauseBtn.textContent = '继续';
        } else if (this.state === GameState.PAUSED) {
            this.state = GameState.PLAYING;
            this.pauseBtn.textContent = '暂停';
            this.gameLoop();
        }
    }
    
    restartGame() {
        this.gameOverScreen.style.display = 'none';
        this.startBtn.disabled = false;
        this.pauseBtn.disabled = true;
        this.pauseBtn.textContent = '暂停';
        this.initGame();
    }
    
    gameLoop() {
        if (this.state !== GameState.PLAYING) return;
        
        this.update();
        this.draw();
        
        setTimeout(() => this.gameLoop(), this.speed);
    }
    
    update() {
        // 更新方向
        this.direction = this.nextDirection;
        
        // 计算新的头部位置
        const head = { ...this.snake[0] };
        head.x += this.direction.x;
        head.y += this.direction.y;
        
        // 检查边界碰撞，游戏结束
        if (this.checkWallCollision(head)) {
            this.gameOver();
            return;
        }
        
        // 检查传送门碰撞
        const teleportResult = this.checkPortalTeleport(head);
        if (teleportResult) {
            head.x = teleportResult.x;
            head.y = teleportResult.y;
        }
        
        // 检查自身碰撞
        if (this.snake.some(segment => segment.x === head.x && segment.y === head.y)) {
            this.gameOver();
            return;
        }
        
        // 添加新头部
        this.snake.unshift(head);
        
        // 检查食物碰撞
        if (head.x === this.food.x && head.y === this.food.y) {
            this.score += CONFIG.FOOD_SCORE;
            this.speed = Math.max(50, this.speed - CONFIG.SPEED_INCREASE);
            this.generateFood();
            this.updateDisplay();
        } else {
            // 移除尾部
            this.snake.pop();
        }
        
        // 更新随机传送门系统
        this.updateRandomPortalSystem();
        
        // 更新闪烁动画计时器
        this.blinkTimer++;
    }
    
    initRandomPortalSystem() {
        // 初始化随机传送门重生系统
        this.nextRandomPortalSpawnTime = this.getRandomSpawnTime();
        this.randomPortalTimer = 0;
        this.randomPortalsActive = false;
        
        // 立即生成第一对随机传送门
        this.spawnRandomPortals();
    }
    
    getRandomSpawnTime() {
        // 返回随机的重生时间（50-200个游戏循环）
        return Math.floor(Math.random() * 151) + 50;
    }
    
    updateRandomPortalSystem() {
        this.randomPortalTimer++;
        
        // 检查是否到了生成随机传送门的时间
        if (!this.randomPortalsActive && this.randomPortalTimer >= this.nextRandomPortalSpawnTime) {
            this.spawnRandomPortals();
        }
    }
    
    spawnRandomPortals() {
        this.generateRandomPortals();
        this.portals = [...this.fixedPortals, ...this.randomPortals];
        this.randomPortalsActive = true;
        console.log('Random portals spawned at time:', this.randomPortalTimer);
    }
    
    removeRandomPortals() {
        this.randomPortals = [];
        this.portals = [...this.fixedPortals];
        this.randomPortalsActive = false;
        
        // 设置下次重生时间
        this.randomPortalTimer = 0;
        this.nextRandomPortalSpawnTime = this.getRandomSpawnTime();
        console.log('Random portals removed, next spawn in:', this.nextRandomPortalSpawnTime, 'cycles');
    }
    
    generateFood() {
        do {
            this.food = {
                x: Math.floor(Math.random() * this.gridCount),
                y: Math.floor(Math.random() * this.gridCount)
            };
        } while (this.snake.some(segment => 
            segment.x === this.food.x && segment.y === this.food.y) ||
            this.portals.some(portal => 
                portal.x === this.food.x && portal.y === this.food.y));
    }
    
    generatePortals() {
        // 先生成固定传送门，位置不变
        this.fixedPortals = [
            {
                id: 'A',
                x: 2,
                y: 2,
                color: '#3498db',  // 蓝色传送门A
                type: 'fixed'
            },
            {
                id: 'B', 
                x: this.gridCount - 3,
                y: this.gridCount - 3,
                color: '#9b59b6',  // 紫色传送门B
                type: 'fixed'
            }
        ];
        
        // 初始化随机传送门数组（但不立即生成）
        this.randomPortals = [];
        
        // 开始时只有固定传送门
        this.portals = [...this.fixedPortals];
    }
    
    generateRandomPortals() {
        // 生成两个随机位置的传送门
        this.randomPortals = [];
        
        for (let i = 0; i < 2; i++) {
            let randomPortal;
            let attempts = 0;
            
            do {
                randomPortal = {
                    id: i === 0 ? 'C' : 'D',
                    x: Math.floor(Math.random() * this.gridCount),
                    y: Math.floor(Math.random() * this.gridCount),
                    color: i === 0 ? '#e67e22' : '#1abc9c',  // 橙色C和青色D
                    type: 'random'
                };
                attempts++;
            } while (
                attempts < 100 && (
                    // 避免与固定传送门重叠
                    this.fixedPortals.some(fp => fp.x === randomPortal.x && fp.y === randomPortal.y) ||
                    // 避免与蛇身重叠
                    this.snake.some(segment => segment.x === randomPortal.x && segment.y === randomPortal.y) ||
                    // 避免与已生成的随机传送门重叠
                    this.randomPortals.some(rp => rp.x === randomPortal.x && rp.y === randomPortal.y) ||
                    // 避免与食物重叠
                    (this.food && this.food.x === randomPortal.x && this.food.y === randomPortal.y)
                )
            );
            
            this.randomPortals.push(randomPortal);
        }
    }
    
    checkPortalTeleport(head) {
        // 检查是否撞到传送门
        for (let portal of this.portals) {
            if (head.x === portal.x && head.y === portal.y) {
                // 根据传送门类型找到对应的传送门
                let otherPortal;
                
                if (portal.type === 'fixed') {
                    // 固定传送门：A和B互相传送
                    otherPortal = this.fixedPortals.find(p => p.id !== portal.id);
                } else {
                    // 随机传送门：C和D互相传送
                    otherPortal = this.randomPortals.find(p => p.id !== portal.id);
                }
                
                if (otherPortal) {
                    // 传送到另一个传送门，根据移动方向在传送门旁边出现
                    const newX = otherPortal.x + this.direction.x * CONFIG.PORTAL_TELEPORT_OFFSET;
                    const newY = otherPortal.y + this.direction.y * CONFIG.PORTAL_TELEPORT_OFFSET;
                    
                    // 如果使用的是随机传送门，传送后立即移除随机传送门
                    if (portal.type === 'random') {
                        this.removeRandomPortals();
                    }
                    
                    // 确保传送后的位置在边界内
                    return {
                        x: Math.max(0, Math.min(this.gridCount - 1, newX)),
                        y: Math.max(0, Math.min(this.gridCount - 1, newY))
                    };
                }
            }
        }
        
        return null;  // 没有传送
    }
    
    checkWallCollision(head) {
        // 检查边界碰撞，游戏结束
        return head.x < 0 || head.x >= this.gridCount || head.y < 0 || head.y >= this.gridCount;
    }
    
    draw() {
        // 清空画布
        this.ctx.fillStyle = '#f0f0f0';
        this.ctx.fillRect(0, 0, CONFIG.CANVAS_SIZE, CONFIG.CANVAS_SIZE);
        
        // 绘制网格
        this.drawGrid();
        
        // 绘制传送门
        this.portals.forEach(portal => {
            // 为随机传送门添加闪烁效果
            let alpha = 1;
            if (portal.type === 'random') {
                // 使用正弦波创建闪烁效果，周期大约20帧
                alpha = 0.3 + 0.7 * (Math.sin(this.blinkTimer / 10) + 1) / 2;
            }
            
            this.ctx.globalAlpha = alpha;
            this.ctx.fillStyle = portal.color;
            this.ctx.beginPath();
            this.ctx.arc(
                portal.x * CONFIG.GRID_SIZE + CONFIG.GRID_SIZE / 2,
                portal.y * CONFIG.GRID_SIZE + CONFIG.GRID_SIZE / 2,
                CONFIG.GRID_SIZE / 2 - 2,
                0,
                2 * Math.PI
            );
            this.ctx.fill();
            
            // 为随机传送门添加闪烁边框效果
            if (portal.type === 'random') {
                this.ctx.strokeStyle = portal.color;
                this.ctx.lineWidth = 2;
                this.ctx.setLineDash([4, 4]); // 虚线效果
                this.ctx.stroke();
                this.ctx.setLineDash([]); // 重置线条样式
            }
            
            // 绘制传送门标识
            this.ctx.fillStyle = 'white';
            this.ctx.font = '12px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(
                portal.id,
                portal.x * CONFIG.GRID_SIZE + CONFIG.GRID_SIZE / 2,
                portal.y * CONFIG.GRID_SIZE + CONFIG.GRID_SIZE / 2 + 4
            );
            
            // 重置透明度
            this.ctx.globalAlpha = 1;
        });
        
        // 绘制食物
        this.ctx.fillStyle = '#e74c3c';
        this.ctx.fillRect(
            this.food.x * CONFIG.GRID_SIZE + 2,
            this.food.y * CONFIG.GRID_SIZE + 2,
            CONFIG.GRID_SIZE - 4,
            CONFIG.GRID_SIZE - 4
        );
        
        // 绘制蛇
        this.snake.forEach((segment, index) => {
            if (index === 0) {
                // 蛇头
                this.ctx.fillStyle = '#27ae60';
            } else {
                // 蛇身
                this.ctx.fillStyle = '#2ecc71';
            }
            
            this.ctx.fillRect(
                segment.x * CONFIG.GRID_SIZE + 1,
                segment.y * CONFIG.GRID_SIZE + 1,
                CONFIG.GRID_SIZE - 2,
                CONFIG.GRID_SIZE - 2
            );
        });
    }
    
    drawGrid() {
        this.ctx.strokeStyle = '#ddd';
        this.ctx.lineWidth = 1;
        
        for (let i = 0; i <= this.gridCount; i++) {
            // 垂直线
            this.ctx.beginPath();
            this.ctx.moveTo(i * CONFIG.GRID_SIZE, 0);
            this.ctx.lineTo(i * CONFIG.GRID_SIZE, CONFIG.CANVAS_SIZE);
            this.ctx.stroke();
            
            // 水平线
            this.ctx.beginPath();
            this.ctx.moveTo(0, i * CONFIG.GRID_SIZE);
            this.ctx.lineTo(CONFIG.CANVAS_SIZE, i * CONFIG.GRID_SIZE);
            this.ctx.stroke();
        }
    }
    
    updateDisplay() {
        this.scoreElement.textContent = this.score;
    }
    
    gameOver() {
        this.state = GameState.GAME_OVER;
        this.finalScoreElement.textContent = this.score;
        this.gameOverScreen.style.display = 'block';
        
        // 更新最高分
        const highScore = this.loadHighScore();
        if (this.score > highScore) {
            this.saveHighScore(this.score);
            this.highScoreElement.textContent = this.score;
        }
        
        this.startBtn.disabled = false;
        this.pauseBtn.disabled = true;
        this.pauseBtn.textContent = '暂停';
    }
    
    loadHighScore() {
        const highScore = localStorage.getItem('snakeHighScore') || 0;
        this.highScoreElement.textContent = highScore;
        return parseInt(highScore);
    }
    
    saveHighScore(score) {
        localStorage.setItem('snakeHighScore', score.toString());
    }
}

// 初始化游戏
document.addEventListener('DOMContentLoaded', () => {
    new SnakeGame();
});