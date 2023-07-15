window.addEventListener("load" , function() {
    const canvas = document.getElementById("canvas1");
    const ctx = canvas.getContext("2d");
    canvas.width = 1400;
    canvas.height = 720;
    let enemies = [];
    let score = 0;
    let gameOver = false;
    const fullScreenBtn = document.getElementById("fullScreen")

        //classes
    class InputHandler {
        constructor() {
            this.keys= [];
            this.touchY = "";
            this.touchTreshold = 30; //how long to swipe for
            window.addEventListener("keydown", e => {
                if((e.key === "ArrowDown" ||
                e.key === "ArrowUp" ||
                e.key === "ArrowLeft" ||
                e.key === "ArrowRight") 
                && this.keys.indexOf(e.key) == -1) 
                this.keys.push(e.key);
                else if(e.key === "Enter" && gameOver) restartGame();
            });
            window.addEventListener("keyup", e => {
                if(e.key === "ArrowDown" ||
                e.key === "ArrowUp" ||
                e.key === "ArrowLeft" ||
                e.key === "ArrowRight") 
                this.keys.splice(this.keys.indexOf(e.key), 1);
            });
            // for mobile devices
            window.addEventListener("touchstart", (e) => {
                this.touchY = e.changedTouches[0].pageY;
            });
            window.addEventListener("touchmove", (e) => {
                const swipeDistance = e.changedTouches[0].pageY - this.touchY;
                if ( swipeDistance < -this.touchTreshold && this.keys.indexOf("swipe up") == -1) this.keys.push("swipe up");
                else if ( swipeDistance > this.touchTreshold && this.keys.indexOf("swipe down") == -1 ) {
                    this.keys.push("swipe down");
                    if (gameOver) restartGame();
                }
            });
            window.addEventListener("touchend", (e) => {
                this.keys.splice(this.keys.indexOf("swipe up"), 1);
                this.keys.splice(this.keys.indexOf("swipe down"), 1);
            });
        }
    }

    class Player {
        constructor(gameWidth, gameHeight) {
            this.gameWidth = gameWidth;
            this.gameHeight = gameHeight;
            this.width = 200;
            this.height = 200;
            this.position = {
                x: 100, 
                y: this.gameHeight - this.height
            };
            this.velocity = {x: 0, y: 0};
            this.gravity = 1;
            this.image = document.getElementById("playerImage");
            this.frame = {
                x: 0,
                y: 0
            }
            this.maxFrame = 8;
            this.fbs = 20;
            this.frameTimer = 0;
            this.frameInterval = 1000/this.fbs;
        }
        restart() {
            this.position = {
                x: 100, 
                y: this.gameHeight - this.height
            };
            this.maxFrame = 8;
            this.frame.y = 0;
        }
        draw(context) {
            context.drawImage(this.image, this.frame.x * this.width, this.frame.y * this.height, this.width, this.height, this.position.x, this.position.y, this.width, this.height);
        }
        update(context, input, deltaTime, enemies) {
            this.draw(context);
            // collision detection
            enemies.forEach((enemy) => {
                const dx = (enemy.x + enemy.width/2 -20)- (this.position.x + this.width/2);
                const dy = (enemy.y + enemy.height/2) - (this.position.y + this.height/2 +20);
                const distance = Math.sqrt(dx * dx + dy * dy);
                if(distance < enemy.width/2.5 + this.width/3) {
                    gameOver = true;
                }
            })
            //sprite animations
            if(this.frameTimer > this.frameInterval) {
                if(this.frame.x >= this.maxFrame) this.frame.x = 0;
                else this.frame.x++;
                this.frameTimer = 0;
            } else {
                this.frameTimer += deltaTime;
            }
                // movements
            // horizontal movement
            this.position.x += this.velocity.x;
            if(input.keys.indexOf("ArrowRight") > -1) this.velocity.x = 5;
            else if(input.keys.indexOf("ArrowLeft") > -1) this.velocity.x = -5;
            else if(input.keys.indexOf("ArrowUp") > -1 || input.keys.indexOf("swipe up") > -1 && this.onGround()) this.velocity.y = -30;
            else this.velocity.x = 0;

            if(this.position.x < 0) this.position.x = 0; 
            else if(this.position.x > this.gameWidth - this.width) this.position.x = this.gameWidth - this.width;

            //vertical movement
            this.position.y += this.velocity.y;
            if(!this.onGround()){
                this.velocity.y += this.gravity;
                this.maxFrame = 5;
                this.frame.y =1;
            } 
            else {
                this.velocity.y = 0; 
                this.maxFrame = 8;
                this.frame.y = 0;
            } 

            if(this.position.y > this.gameHeight - this.height) this.position.y = this.gameHeight - this.height;
        }
        onGround() {
            return this.position.y >= this.gameHeight - this.height;
        }
    }

    class Background {
        constructor(gameWidth, gameHeight) {
            this.gameWidth = gameWidth;
            this.gameHeight = gameHeight;
            this.image = document.getElementById("backgroundImage");
            this.x = 0;
            this.y = 0;
            this.width = 2400;
            this.height = 720;
            this.speed = 7;
        }
        draw(context) {
            context.drawImage(this.image, this.x, this.y, this.width, this.height);
            context.drawImage(this.image, this.x + this.width - this.speed, this.y, this.width, this.height);
        }
        update(context) {
            this.draw(context)
            this.x -= this.speed;
            if(this.x < 0 -this.width) {
                this.x = 0;
            }
        }
        restart() {
            this.x = 0;
        }
    }

    class Enemy {
        constructor(gameWidth, gameHeight) {
            this.gameWidth = gameWidth;
            this.gameHeight = gameHeight;
            this.width = 160;
            this.height = 119;
            this.image = document.getElementById("enemyImage");
            this.x = this.gameWidth - this.width ;
            this.y = this.gameHeight - this.height;
            this.frameX = 0;
            this.maxFrame = 5;
            this.fbs = 20;
            this.frameTimer = 0;
            this.frameInterval = 1000/this.fbs;
            this.speed = 8;
            this.markedForeDeletion = false;
        }
        draw(context) {
            context.drawImage(this.image, this.frameX *this.width, 0, this.width, this.height, this.x, this.y, this.width, this.height);
        }
        update(context, deltaTime) {
            this.draw(context);
            if(this.frameTimer > this.frameInterval) {
                if(this.frameX >= this.maxFrame) this.frameX = 0;
                else this.frameX++;
                this.frameTimer = 0;
            } else {
                this.frameTimer += deltaTime;
            }
            this.x -= this.speed;
            if(this.x < 0 - this.width) {
                this.markedForeDeletion = true;
                score++;
            } 
        }
    }

        //functions
    function handleEnimies(deltaTime) {
        if(enemyTimer > enemyInterval + randomEnemyInterval) {
            enemies.push(new Enemy(canvas.width, canvas.height));
            enemyTimer = 0;
        } else {
            enemyTimer += deltaTime;
        }
        enemies.forEach(enemy => {
            enemy.update(ctx, deltaTime);
        });
        enemies = enemies.filter(enemy  => !enemy.markedForeDeletion);
    }

    function displayStatusText(context) {
        context.textAlign = 'left';
        context.font = "40px Helvetica";
        context.fillStyle = "black";
        context.font = "40px Helvetica";
        context.fillStyle = "white";
        context.fillText("Score: " + score, 20, 50);
        context.font = "40px Helvetica";
        context.fillStyle = "black";
        context.fillText("Score: " + score, 22, 52);

        if(gameOver) {
            context.textAlign = "center";
            context.fillStyle = "black";
            context.fillText("GAME OVER, press Enter or SWIPE DOWN to restart! ", canvas.width/2, 200);
            context.fillStyle = "white";
            context.fillText("GAME OVER, press Enter or SWIPE DOWN to restart! ", canvas.width/2 +2, 202);
        }
    }

    function restartGame() {
        player.restart();
        background.restart();
        enemies = [];
        score = 0;
        gameOver = false;
        animate(0);
    }

    function toggleFullScreen() {
        if(!document.fullscreenElement) {
            fullScreenBtn.style.display = "block"
            canvas.requestFullscreen().catch(err => {
                alert(`Error, can't enable fullscreen mode: ${err.messsage}`);
            });
        } else {
            fullScreenBtn.style.display = "none";
            document.exitFullscreen();
        }
    }

    fullScreenBtn.addEventListener("click", toggleFullScreen);

        //variables
    const input = new InputHandler();
    const player = new Player(canvas.width, canvas.height);
    const background = new Background(canvas.width, canvas.height);

    let lastTime = 0;
    let enemyTimer = 0;
    let enemyInterval = 2000;
    let randomEnemyInterval = Math.random() *800 +500;


        // main animation loop
    function animate(timeStamp) {
        const deltaTime = timeStamp - lastTime;
        lastTime = timeStamp;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        background.update(ctx);
        player.update(ctx, input, deltaTime, enemies);
        handleEnimies(deltaTime);
        displayStatusText(ctx);
        if(!gameOver) {
            requestAnimationFrame(animate);
        } 
    }
    animate(0);
})