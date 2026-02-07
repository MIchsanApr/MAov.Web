class AIController {
    constructor(player, opponent, difficulty) {
        this.player = player;
        this.opponent = opponent;
        this.difficulty = difficulty; // 'easy', 'normal', 'hard'
        this.reactionTimer = 0;
        this.actionTimer = 0;
    }

    update(deltaTime) {
        this.reactionTimer -= deltaTime;
        if (this.reactionTimer > 0) return;

        // Reset reaction based on difficulty
        const reactionBase = this.difficulty === 'hard' ? 0.2 : (this.difficulty === 'normal' ? 0.5 : 1.0);
        this.reactionTimer = reactionBase;

        const dist = Math.abs(this.player.x - this.opponent.x);
        const rng = Math.random();

        // 1. Defense (Blocking)
        if (this.opponent.isAttacking && dist < 150) {
            let blockChance = this.difficulty === 'hard' ? 0.8 : 0.3;
            if (rng < blockChance) {
                this.player.performAction('BLOCK');
                return;
            }
        }

        // 2. Ultimate Logic
        if (this.player.ultMeter >= 100 && dist < 200 && this.opponent.health < 40) {
            this.player.performAction('ULTIMATE');
            return;
        }

        // 3. Offense
        if (dist < 80) {
            // Close range: Attack
            if (rng < 0.7) this.player.performAction('PUNCH');
            else this.player.performAction('KICK');
        } else {
            // Long range: Move Closer
            const dir = this.opponent.x > this.player.x ? 1 : -1;
            this.player.move(dir);
        }

        // Jump Logic (Hard mode only)
        if (this.difficulty === 'hard' && rng < 0.1) {
            this.player.jump();
        }
    }
}