// Основные переменные игры
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startScreen = document.getElementById('startScreen');
const levelCompleteScreen = document.getElementById('levelCompleteScreen');
const gameOverScreen = document.getElementById('gameOverScreen');
const startButton = document.getElementById('startButton');
const nextLevelButton = document.getElementById('nextLevelButton');
const restartButton = document.getElementById('restartButton');
const scoreElement = document.getElementById('score');
const levelElement = document.getElementById('level');
const healthFill = document.getElementById('healthFill');
const completedLevelElement = document.getElementById('completedLevel');
const levelScoreElement = document.getElementById('levelScore');
const finalScoreElement = document.getElementById('finalScore');
const finalLevelElement = document.getElementById('finalLevel');

// Игровые настройки
let gameActive = false;
let score = 0;
let level = 1;
let playerHealth = 100;
let enemies = [];
let bullets = [];
let enemyBullets = [];
let particles = [];
let clouds = [];
let lastEnemySpawn = 0;
let enemySpawnRate = 2000;
let gameTime = 0;

// Создание облаков для фона
function createClouds() {
    clouds = [];
    for (let i = 0; i < 8; i++) {
        clouds.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            width: 60 + Math.random() * 40,
            height: 30 + Math.random() * 20,
            speed: 0.2 + Math.random() * 0.3
        });
    }
}

// Игрок
const player = {
    x: canvas.width / 2,
    y: canvas.height - 100,
    width: 40,
    height: 60,
    speed: 6,
    color: '#4FC3F7',
    lastShot: 0,
    shotDelay: 300
};

// Управление
const keys = {
    ArrowUp: false,
    ArrowDown: false,
    ArrowLeft: false,
    ArrowRight: false,
    ' ': false
};

// Обработчики событий
window.addEventListener('keydown', (e) => {
    if (keys.hasOwnProperty(e.key)) {
        keys[e.key] = true;
        e.preventDefault();
    }
});

window.addEventListener('keyup', (e) => {
    if (keys.hasOwnProperty(e.key)) {
        keys[e.key] = false;
    }
});

startButton.addEventListener('click', startGame);
nextLevelButton.addEventListener('click', nextLevel);
restartButton.addEventListener('click', restartGame);

// Функции игры
function startGame() {
    startScreen.classList.add('hidden');
    gameActive = true;
    score = 0;
    level = 1;
    playerHealth = 100;
    enemies = [];
    bullets = [];
    enemyBullets = [];
    particles = [];
    createClouds();
    updateUI();
    gameLoop();
}

function nextLevel() {
    levelCompleteScreen.classList.add('hidden');
    level++;
    playerHealth = Math.min(playerHealth + 25, 100);
    enemySpawnRate = Math.max(800, enemySpawnRate - 200);
    enemies = [];
    bullets = [];
    enemyBullets = [];
    particles = [];
    updateUI();
    gameActive = true;
    gameLoop();
}

function restartGame() {
    gameOverScreen.classList.add('hidden');
    startGame();
}

function gameOver() {
    gameActive = false;
    finalScoreElement.textContent = score;
    finalLevelElement.textContent = level;
    gameOverScreen.classList.remove('hidden');
}

function levelComplete() {
    gameActive = false;
    completedLevelElement.textContent = level;
    levelScoreElement.textContent = score;
    levelCompleteScreen.classList.remove('hidden');
}

function updateUI() {
    scoreElement.textContent = score;
    levelElement.textContent = level;
    healthFill.style.width = playerHealth + '%';
    
    // Изменение цвета здоровья
    if (playerHealth > 70) {
        healthFill.style.background = 'linear-gradient(to right, #00ff00, #80ff00)';
    } else if (playerHealth > 30) {
        healthFill.style.background = 'linear-gradient(to right, #ffff00, #ff8000)';
    } else {
        healthFill.style.background = 'linear-gradient(to right, #ff0000, #ff4000)';
    }
}

// Рисование самолета игрока
function drawPlayer() {
    ctx.save();
    ctx.translate(player.x + player.width / 2, player.y + player.height / 2);
    
    // Корпус
    ctx.fillStyle = player.color;
    ctx.beginPath();
    ctx.moveTo(0, -player.height / 2);
    ctx.lineTo(player.width / 2, player.height / 2);
    ctx.lineTo(0, player.height / 3);
    ctx.lineTo(-player.width / 2, player.height / 2);
    ctx.closePath();
    ctx.fill();
    
    // Кабина
    ctx.fillStyle = '#87CEEB';
    ctx.beginPath();
    ctx.arc(0, -player.height / 6, 8, 0, Math.PI * 2);
    ctx.fill();
    
    // Крылья
    ctx.fillStyle = '#1976D2';
    ctx.fillRect(-player.width / 2 - 10, player.height / 6 - 5, player.width + 20, 10);
    
    // Хвост
    ctx.fillStyle = '#1565C0';
    ctx.fillRect(-8, player.height / 2 - 10, 16, 20);
    
    // Огни выхлопа (анимация)
    const flameSize = 5 + Math.sin(gameTime * 0.1) * 2;
    ctx.fillStyle = '#FF6D00';
    ctx.fillRect(-4, player.height / 2 + 10, 8, flameSize);
    
    ctx.restore();
}

// Создание врага
function spawnEnemy() {
    const enemyType = Math.random();
    let enemy;
    
    if (enemyType < 0.7) {
        // Обычный враг
        enemy = {
            x: Math.random() * (canvas.width - 40),
            y: -50,
            width: 35,
            height: 45,
            speed: 1.5 + level * 0.3,
            color: '#F44336',
            lastShot: 0,
            shotDelay: 2000 + Math.random() * 1000,
            health: 1,
            type: 'normal'
        };
    } else {
        // Босс
        enemy = {
            x: Math.random() * (canvas.width - 60),
            y: -70,
            width: 50,
            height: 65,
            speed: 0.8 + level * 0.2,
            color: '#D32F2F',
            lastShot: 0,
            shotDelay: 1000 + Math.random() * 500,
            health: 3,
            type: 'boss'
        };
    }
    
    enemies.push(enemy);
}

// Рисование врага
function drawEnemy(enemy) {
    ctx.save();
    ctx.translate(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2);
    
    // Корпус
    ctx.fillStyle = enemy.color;
    ctx.beginPath();
    ctx.moveTo(0, -enemy.height / 2);
    ctx.lineTo(enemy.width / 2, enemy.height / 2);
    ctx.lineTo(0, enemy.height / 4);
    ctx.lineTo(-enemy.width / 2, enemy.height / 2);
    ctx.closePath();
    ctx.fill();
    
    // Кабина
    ctx.fillStyle = '#FF8A65';
    ctx.beginPath();
    ctx.arc(0, -enemy.height / 8, 6, 0, Math.PI * 2);
    ctx.fill();
    
    // Крылья
    ctx.fillStyle = '#C62828';
    ctx.fillRect(-enemy.width / 2 - 8, enemy.height / 8 - 4, enemy.width + 16, 8);
    
    // Хвост (для босса больше)
    const tailHeight = enemy.type === 'boss' ? 25 : 15;
    ctx.fillStyle = '#B71C1C';
    ctx.fillRect(-6, enemy.height / 2 - 5, 12, tailHeight);
    
    // Индикатор здоровья для босса
    if (enemy.type === 'boss') {
        ctx.fillStyle = '#333';
        ctx.fillRect(-15, -enemy.height / 2 - 10, 30, 5);
        ctx.fillStyle = '#4CAF50';
        ctx.fillRect(-15, -enemy.height / 2 - 10, 30 * (enemy.health / 3), 5);
    }
    
    ctx.restore();
}

// Стрельба игрока
function shoot() {
    const now = Date.now();
    if (now - player.lastShot > player.shotDelay) {
        // Основная пушка
        bullets.push({
            x: player.x + player.width / 2 - 2,
            y: player.y,
            width: 4,
            height: 12,
            speed: 8,
            color: '#00FF00',
            type: 'player'
        });
        
        // Боковые пушки на высоких уровнях
        if (level >= 3) {
            bullets.push({
                x: player.x + 10,
                y: player.y + 20,
                width: 3,
                height: 10,
                speed: 8,
                color: '#00FF00',
                type: 'player'
            });
            bullets.push({
                x: player.x + player.width - 13,
                y: player.y + 20,
                width: 3,
                height: 10,
                speed: 8,
                color: '#00FF00',
                type: 'player'
            });
        }
        
        player.lastShot = now;
    }
}

// Стрельба врага
function enemyShoot(enemy) {
    const now = Date.now();
    if (now - enemy.lastShot > enemy.shotDelay) {
        enemyBullets.push({
            x: enemy.x + enemy.width / 2 - 2,
            y: enemy.y + enemy.height,
            width: 4,
            height: 10,
            speed: 6,
            color: '#FF5252',
            type: 'enemy'
        });
        
        // Боссы стреляют веером
        if (enemy.type === 'boss') {
            enemyBullets.push({
                x: enemy.x + 10,
                y: enemy.y + enemy.height,
                width: 4,
                height: 10,
                speed: 6,
                color: '#FF5252',
                type: 'enemy'
            });
            enemyBullets.push({
                x: enemy.x + enemy.width - 14,
                y: enemy.y + enemy.height,
                width: 4,
                height: 10,
                speed: 6,
                color: '#FF5252',
                type: 'enemy'
            });
        }
        
        enemy.lastShot = now;
    }
}

// Создание частиц для взрыва
function createParticles(x, y, color, count) {
    for (let i = 0; i < count; i++) {
        particles.push({
            x: x,
            y: y,
            size: Math.random() * 4 + 2,
            speedX: Math.random() * 6 - 3,
            speedY: Math.random() * 6 - 3,
            color: color,
            life: 40 + Math.random() * 20
        });
    }
}

// Рисование облаков
function drawClouds() {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    clouds.forEach(cloud => {
        ctx.beginPath();
        ctx.arc(cloud.x, cloud.y, cloud.width / 3, 0, Math.PI * 2);
        ctx.arc(cloud.x + cloud.width / 3, cloud.y - cloud.height / 4, cloud.width / 4, 0, Math.PI * 2);
        ctx.arc(cloud.x - cloud.width / 3, cloud.y - cloud.height / 4, cloud.width / 4, 0, Math.PI * 2);
        ctx.fill();
    });
}

// Обновление облаков
function updateClouds() {
    clouds.forEach(cloud => {
        cloud.y += cloud.speed;
        if (cloud.y > canvas.height + cloud.height) {
            cloud.y = -cloud.height;
            cloud.x = Math.random() * canvas.width;
        }
    });
}

// Проверка столкновений
function checkCollisions() {
    // Пули игрока с врагами
    for (let i = bullets.length - 1; i >= 0; i--) {
        for (let j = enemies.length - 1; j >= 0; j--) {
            if (
                bullets[i].x < enemies[j].x + enemies[j].width &&
                bullets[i].x + bullets[i].width > enemies[j].x &&
                bullets[i].y < enemies[j].y + enemies[j].height &&
                bullets[i].y + bullets[i].height > enemies[j].y
            ) {
                createParticles(
                    enemies[j].x + enemies[j].width / 2, 
                    enemies[j].y + enemies[j].height / 2, 
                    '#FF9800', 
                    enemies[j].type === 'boss' ? 8 : 15
                );
                
                bullets.splice(i, 1);
                enemies[j].health--;
                
                if (enemies[j].health <= 0) {
                    const points = enemies[j].type === 'boss' ? 30 : 10;
                    score += points * level;
                    enemies.splice(j, 1);
                }
                
                updateUI();
                break;
            }
        }
    }
    
    // Пули врагов с игроком
    for (let i = enemyBullets.length - 1; i >= 0; i--) {
        if (
            enemyBullets[i].x < player.x + player.width &&
            enemyBullets[i].x + enemyBullets[i].width > player.x &&
            enemyBullets[i].y < player.y + player.height &&
            enemyBullets[i].y + enemyBullets[i].height > player.y
        ) {
            createParticles(
                player.x + player.width / 2, 
                player.y + player.height / 2, 
                '#4FC3F7', 
                8
            );
            enemyBullets.splice(i, 1);
            playerHealth -= 8;
            updateUI();
            
            if (playerHealth <= 0) {
                createParticles(
                    player.x + player.width / 2, 
                    player.y + player.height / 2, 
                    '#FF6D00', 
                    30
                );
                setTimeout(gameOver, 500);
            }
            break;
        }
    }
    
    // Враги с игроком
    for (let i = enemies.length - 1; i >= 0; i--) {
        if (
            enemies[i].x < player.x + player.width &&
            enemies[i].x + enemies[i].width > player.x &&
            enemies[i].y < player.y + player.height &&
            enemies[i].y + enemies[i].height > player.y
        ) {
            createParticles(
                enemies[i].x + enemies[i].width / 2, 
                enemies[i].y + enemies[i].height / 2, 
                '#FF9800', 
                20
            );
            createParticles(
                player.x + player.width / 2, 
                player.y + player.height / 2, 
                '#4FC3F7', 
                15
            );
            
            const damage = enemies[i].type === 'boss' ? 25 : 15;
            playerHealth -= damage;
            enemies.splice(i, 1);
            updateUI();
            
            if (playerHealth <= 0) {
                createParticles(
                    player.x + player.width / 2, 
                    player.y + player.height / 2, 
                    '#FF6D00', 
                    40
                );
                setTimeout(gameOver, 500);
            }
            break;
        }
    }
}

// Обновление игры
function update() {
    if (!gameActive) return;
    
    gameTime += 0.1;
    
    // Движение игрока
    if (keys.ArrowUp && player.y > 0) player.y -= player.speed;
    if (keys.ArrowDown && player.y < canvas.height - player.height) player.y += player.speed;
    if (keys.ArrowLeft && player.x > 0) player.x -= player.speed;
    if (keys.ArrowRight && player.x < canvas.width - player.width) player.x += player.speed;
    
    // Стрельба
    if (keys[' ']) {
        shoot();
    }
    
    // Создание врагов
    const now = Date.now();
    if (now - lastEnemySpawn > enemySpawnRate) {
        spawnEnemy();
        lastEnemySpawn = now;
    }
    
    // Обновление врагов
    for (let i = enemies.length - 1; i >= 0; i--) {
        enemies[i].y += enemies[i].speed;
        
        // Случайное движение по горизонтали
        enemies[i].x += (Math.random() - 0.5) * 2;
        enemies[i].x = Math.max(0, Math.min(canvas.width - enemies[i].width, enemies[i].x));
        
        // Стрельба врагов
        if (Math.random() < 0.008 * level) {
            enemyShoot(enemies[i]);
        }
        
        // Удаление врагов за пределами экрана
        if (enemies[i].y > canvas.height) {
            enemies.splice(i, 1);
        }
    }
    
    // Обновление пуль игрока
    for (let i = bullets.length - 1; i >= 0; i--) {
        bullets[i].y -= bullets[i].speed;
        if (bullets[i].y < 0) {
            bullets.splice(i, 1);
        }
    }
    
    // Обновление пуль врагов
    for (let i = enemyBullets.length - 1; i >= 0; i--) {
        enemyBullets[i].y += enemyBullets[i].speed;
        if (enemyBullets[i].y > canvas.height) {
            enemyBullets.splice(i, 1);
        }
    }
    
    // Обновление частиц
    for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].x += particles[i].speedX;
        particles[i].y += particles[i].speedY;
        particles[i].life--;
        
        if (particles[i].life <= 0) {
            particles.splice(i, 1);
        }
    }
    
    // Обновление облаков
    updateClouds();
    
    // Проверка столкновений
    checkCollisions();
    
    // Проверка завершения уровня
    if (score >= level * 100) {
        setTimeout(levelComplete, 500);
    }
}

// Отрисовка игры
function draw() {
    // Очистка canvas
    ctx.fillStyle = '#000033';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Звезды
    ctx.fillStyle = 'white';
    for (let i = 0; i < 100; i++) {
        const brightness = Math.random() * 0.8 + 0.2;
        ctx.globalAlpha = brightness;
        const x = (i * 13.7) % canvas.width;
        const y = (i * 7.3) % canvas.height;
        const size = Math.random() * 1.5;
        ctx.fillRect(x, y, size, size);
    }
    ctx.globalAlpha = 1;
    
    // Облака
    drawClouds();
    
    // Пули врагов
    ctx.fillStyle = '#FF5252';
    enemyBullets.forEach(bullet => {
        ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
    });
    
    // Пули игрока
    ctx.fillStyle = '#00FF00';
    bullets.forEach(bullet => {
        ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
        // Эффект свечения
        ctx.shadowColor = '#00FF00';
        ctx.shadowBlur = 10;
        ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
        ctx.shadowBlur = 0;
    });
    
    // Враги
    enemies.forEach(drawEnemy);
    
    // Игрок
    drawPlayer();
    
    // Частицы
    particles.forEach(particle => {
        ctx.globalAlpha = particle.life / 60;
        ctx.fillStyle = particle.color;
        ctx.fillRect(particle.x, particle.y, particle.size, particle.size);
    });
    ctx.globalAlpha = 1;
}

// Игровой цикл
function gameLoop() {
    if (!gameActive) return;
    
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Инициализация игры
function init() {
    createClouds();
    updateUI();
}

// Запуск инициализации при загрузке страницы
window.onload = init;