const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const levelText = document.getElementById("level");
const progressText = document.getElementById("progress");
const timerText = document.getElementById("timer");

const resetBtn = document.getElementById("resetBtn");
const nextBtn = document.getElementById("nextBtn");

const modal = document.getElementById("winModal");
const continueBtn = document.getElementById("continueBtn");

let level = 1;
let nodes = [];
let edges = [];
let visitedEdges = new Set();
let currentNode = null;

let seconds = 0;
let timerInterval;

function startTimer() {
    clearInterval(timerInterval);

    seconds = 0;

    timerInterval = setInterval(() => {

        seconds++;

        let mins = String(Math.floor(seconds / 60)).padStart(2, "0");
        let secs = String(seconds % 60).padStart(2, "0");

        timerText.textContent = `${mins}:${secs}`;

    }, 1000);
}

function generatePuzzle() {

    nodes = [];
    edges = [];
    visitedEdges.clear();
    currentNode = null;

    const totalNodes = Math.min(level + 4, 12);

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = 180;

    for(let i=0;i<totalNodes;i++){

        const angle = (Math.PI*2*i)/totalNodes;

        nodes.push({
            x:centerX + radius*Math.cos(angle),
            y:centerY + radius*Math.sin(angle)
        });
    }

    for(let i=0;i<totalNodes;i++){

        edges.push([i,(i+1)%totalNodes]);

        if(level>2 && i%2===0){

            edges.push([i,(i+2)%totalNodes]);
        }
    }

    updateProgress();
    draw();
    startTimer();
}

function draw(){

    ctx.clearRect(0,0,canvas.width,canvas.height);

    edges.forEach((edge,index)=>{

        const a = nodes[edge[0]];
        const b = nodes[edge[1]];

        ctx.beginPath();
        ctx.moveTo(a.x,a.y);
        ctx.lineTo(b.x,b.y);

        ctx.lineWidth = 5;

        if(visitedEdges.has(index)){

            ctx.strokeStyle="#8b5cf6";
            ctx.shadowBlur=15;
            ctx.shadowColor="#8b5cf6";

        }else{

            ctx.strokeStyle="#64748b";
            ctx.shadowBlur=0;
        }

        ctx.stroke();
    });

    nodes.forEach((node,index)=>{

        ctx.beginPath();
        ctx.arc(node.x,node.y,14,0,Math.PI*2);

        ctx.fillStyle =
        currentNode===index
        ? "#22c55e"
        : "#ffffff";

        ctx.fill();

        ctx.strokeStyle="#0f172a";
        ctx.lineWidth=3;
        ctx.stroke();
    });
}

function getNode(x,y){

    for(let i=0;i<nodes.length;i++){

        const dx=x-nodes[i].x;
        const dy=y-nodes[i].y;

        if(Math.sqrt(dx*dx+dy*dy)<18){

            return i;
        }
    }

    return null;
}

function updateProgress(){

    progressText.textContent =
    `${visitedEdges.size}/${edges.length}`;
}
function resizeCanvas() {
    const canvas = document.getElementById("gameCanvas");

    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;

    draw();
}

window.addEventListener("resize", resizeCanvas);
canvas.addEventListener("click",(e)=>{

    const rect = canvas.getBoundingClientRect();

    const x =
    (e.clientX-rect.left)*(canvas.width/rect.width);

    const y =
    (e.clientY-rect.top)*(canvas.height/rect.height);

    const clicked = getNode(x,y);

    if(clicked===null) return;

    if(currentNode===null){

        currentNode = clicked;
        draw();
        return;
    }

    for(let i=0;i<edges.length;i++){

        if(visitedEdges.has(i)) continue;

        const [a,b] = edges[i];

        const valid =
        (a===currentNode && b===clicked) ||
        (b===currentNode && a===clicked);

        if(valid){

            visitedEdges.add(i);
            currentNode = clicked;

            updateProgress();
            draw();

            if(visitedEdges.size===edges.length){

                clearInterval(timerInterval);

                setTimeout(()=>{
                    modal.classList.remove("hidden");
                },300);
            }

            return;
        }
    }
});

resetBtn.addEventListener("click",()=>{
    generatePuzzle();
});

nextBtn.addEventListener("click",()=>{
    level++;
    levelText.textContent = level;
    generatePuzzle();
});

continueBtn.addEventListener("click",()=>{
    modal.classList.add("hidden");
    level++;
    levelText.textContent = level;
    generatePuzzle();
});

generatePuzzle();
resizeCanvas();