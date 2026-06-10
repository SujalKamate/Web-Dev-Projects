const input = document.getElementById("commandInput");
const output = document.getElementById("output");

let history = [];
let historyIndex = -1;

let matrixEnabled = false;
let matrixInterval;

const jokes = [
    "Why do programmers prefer dark mode? Because light attracts bugs.",
    "There are 10 kinds of people. Those who understand binary and those who don't.",
    "A SQL query walks into a bar and joins two tables.",
    "Debugging: Being the detective in a crime movie where you're also the murderer."
];

function print(text) {
    const div = document.createElement("div");
    div.className = "response";
    div.innerHTML = text;
    output.appendChild(div);

    output.scrollTop = output.scrollHeight;
}

function typeText(text, speed = 15) {
    const div = document.createElement("div");
    div.className = "response";
    output.appendChild(div);

    let i = 0;

    const interval = setInterval(() => {
        div.textContent += text[i];
        i++;

        output.scrollTop = output.scrollHeight;

        if (i >= text.length) {
            clearInterval(interval);
        }
    }, speed);
}

const commands = {

    help() {
        typeText(`
Available Commands

help      - Show commands
about     - About simulator
date      - Current date
clear     - Clear terminal
matrix    - Toggle matrix mode
joke      - Random joke
whoami    - User info
projects  - Sample projects
echo txt  - Print text
`);
    },

    about() {
        typeText(
            "Retro Terminal Simulator built using HTML, CSS and JavaScript."
        );
    },

    date() {
        typeText(new Date().toString());
    },

    clear() {
        output.innerHTML = "";
    },

    matrix() {
        toggleMatrix();
        typeText(
            matrixEnabled
                ? "Matrix mode enabled."
                : "Matrix mode disabled."
        );
    },

    joke() {
        typeText(
            jokes[Math.floor(Math.random() * jokes.length)]
        );
    },

    whoami() {
        typeText("guest_user");
    },

    projects() {
        typeText(`
Recent Projects

- Browser Whiteboard
- Block Puzzle Game
- Fruit Cutting Game
- Coding Challenge Tracker
- Retro Terminal Simulator
`);
    }
};

input.addEventListener("keydown", e => {

    if (e.key === "Enter") {

        const value = input.value.trim();

        if (!value) return;

        history.push(value);
        historyIndex = history.length;

        print(`<span class="command">> ${value}</span>`);

        const parts = value.split(" ");
        const command = parts[0].toLowerCase();

        if (command === "echo") {
            typeText(parts.slice(1).join(" "));
        }
        else if (commands[command]) {
            commands[command]();
        }
        else {
            typeText(
                `'${command}' is not recognized. Type help.`
            );
        }

        input.value = "";
    }

    if (e.key === "ArrowUp") {

        if (historyIndex > 0) {
            historyIndex--;
            input.value = history[historyIndex];
        }
    }

    if (e.key === "ArrowDown") {

        if (historyIndex < history.length - 1) {
            historyIndex++;
            input.value = history[historyIndex];
        } else {
            input.value = "";
        }
    }
});

function toggleMatrix() {

    matrixEnabled = !matrixEnabled;

    if (matrixEnabled) {

        document.body.classList.add("matrix-active");

        matrixInterval = setInterval(() => {

            const line = Array.from(
                { length: 80 },
                () => Math.random() > 0.5 ? "1" : "0"
            ).join("");

            const div = document.createElement("div");

            div.textContent = line;
            div.style.color = "#003300";
            div.style.fontSize = "12px";

            output.appendChild(div);

            if (output.children.length > 200) {
                output.removeChild(output.children[0]);
            }

            output.scrollTop = output.scrollHeight;

        }, 100);

    } else {

        document.body.classList.remove("matrix-active");
        clearInterval(matrixInterval);
    }
}