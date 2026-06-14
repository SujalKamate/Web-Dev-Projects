 const QUESTIONS = [
        { i: "Apple, Banana, Mango", a: "Fruits", o: ["Vegetables", "Fruits", "Grains", "Desserts"] },
        { i: "Lion, Tiger, Elephant", a: "Animals", o: ["Birds", "Insects", "Animals", "Fish"] },
        { i: "Red, Blue, Green", a: "Colors", o: ["Shapes", "Numbers", "Colors", "Sizes"] },
        { i: "Piano, Guitar, Violin", a: "Instruments", o: ["Tools", "Instruments", "Toys", "Furniture"] },
        { i: "London, Paris, Tokyo", a: "Cities", o: ["Countries", "Cities", "Islands", "Continents"] },
        { i: "Mars, Earth, Jupiter", a: "Planets", o: ["Stars", "Comets", "Moons", "Planets"] },
        { i: "Carrot, Broccoli, Potato", a: "Vegetables", o: ["Fruits", "Vegetables", "Legumes", "Roots"] },
        { i: "Soccer, Tennis, Cricket", a: "Sports", o: ["Hobbies", "Games", "Sports", "Work"] },
        { i: "Rose, Lily, Tulip", a: "Flowers", o: ["Trees", "Shrubs", "Flowers", "Grass"] },
        { i: "Python, Java, C++", a: "Coding", o: ["Math", "Coding", "Writing", "Logic"] }
    ];

    let state = { score: 0, level: 0, current: null };

    function startGame() {
        state.score = 0; state.level = 0;
        document.getElementById('screen-overlay').classList.add('hidden');
        nextQuestion();
    }

    function nextQuestion() {
        if (state.level >= QUESTIONS.length) return endGame("You're a Genius! 🌟");
        state.current = QUESTIONS[state.level];
        document.getElementById('items-list').innerText = state.current.i;
        const container = document.getElementById('options-container');
        container.innerHTML = '';
        state.current.o.forEach(opt => {
            const btn = document.createElement('button');
            btn.className = 'option-btn';
            btn.innerText = opt;
            btn.onclick = () => {
                const btns = document.querySelectorAll('.option-btn');
                btns.forEach(b => b.disabled = true);
                if (opt === state.current.a) {
                    btn.classList.add('correct');
                    state.score += 10; state.level++;
                    setTimeout(nextQuestion, 1000);
                } else {
                    btn.classList.add('wrong');
                    Array.from(btns).find(b => b.innerText === state.current.a).classList.add('correct');
                    setTimeout(() => endGame("Game Over! 🍎"), 1500);
                }
                document.getElementById('score').innerText = state.score;
                document.getElementById('level').innerText = Math.min(state.level + 1, 10);
            };
            container.appendChild(btn);
        });
    }

    function endGame(title) {
        const overlay = document.getElementById('screen-overlay');
        document.getElementById('overlay-title').innerText = title;
        document.getElementById('overlay-desc').innerText = `Final Score: ${state.score} | Categories Matched: ${state.level}`;
        overlay.classList.remove('hidden');
    }