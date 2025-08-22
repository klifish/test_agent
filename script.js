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
    FOOD_SCORE: 10
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
        
        // 初始化蛇 - 放置在更中心的位置，更远离边界
        const centerX = Math.floor(this.gridCount / 4); // 在1/4位置开始
        const centerY = Math.floor(this.gridCount / 2);
        this.snake = [
            { x: centerX, y: centerY }
        ];
        this.direction = Direction.RIGHT;
        this.nextDirection = Direction.RIGHT;
        
        // 初始化食物
        this.generateFood();
        
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
        
        // 检查墙壁碰撞
        if (head.x < 0 || head.x >= this.gridCount || 
            head.y < 0 || head.y >= this.gridCount) {
            this.gameOver();
            return;
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
    }
    
    generateFood() {
        do {
            this.food = {
                x: Math.floor(Math.random() * this.gridCount),
                y: Math.floor(Math.random() * this.gridCount)
            };
        } while (this.snake.some(segment => 
            segment.x === this.food.x && segment.y === this.food.y));
    }
    
    draw() {
        // 清空画布
        this.ctx.fillStyle = '#f0f0f0';
        this.ctx.fillRect(0, 0, CONFIG.CANVAS_SIZE, CONFIG.CANVAS_SIZE);
        
        // 绘制网格
        this.drawGrid();
        
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