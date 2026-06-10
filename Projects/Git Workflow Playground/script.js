/* ==========================
   DOM REFERENCES
========================== */

const commitMessageInput = document.getElementById("commitMessage");

const branchNameInput = document.getElementById("branchName");

const branchSelect = document.getElementById("branchSelect");
const mergeBranchSelect = document.getElementById("mergeBranchSelect");
const rebaseBranchSelect = document.getElementById("rebaseBranchSelect");

const commitBtn = document.getElementById("commitBtn");
const createBranchBtn = document.getElementById("createBranchBtn");
const switchBranchBtn = document.getElementById("switchBranchBtn");
const mergeBtn = document.getElementById("mergeBtn");
const rebaseBtn = document.getElementById("rebaseBtn");
const resetBtn = document.getElementById("resetBtn");

const currentBranchEl = document.getElementById("currentBranch");
const headCommitEl = document.getElementById("headCommit");
const totalCommitsEl = document.getElementById("totalCommits");

const historyLog = document.getElementById("historyLog");

const svg = document.getElementById("gitGraph");

/* ==========================
   STATE
========================== */

let commitCounter = 1;

const repo = {
    currentBranch: "main",

    branches: {
        main: "c0"
    },

    commits: {
        c0: {
            id: "c0",
            message: "Initial Commit",
            parents: [],
            branch: "main",
            lane: 0,
            timestamp: new Date()
        }
    }
};

/* ==========================
   COLORS
========================== */

const laneColors = [
    "#3b82f6",
    "#f97316",
    "#22c55e",
    "#ec4899",
    "#a855f7",
    "#eab308",
    "#14b8a6",
    "#ef4444"
];

/* ==========================
   HELPERS
========================== */

function generateCommitId() {
    return "c" + commitCounter++;
}

function getBranchNames() {
    return Object.keys(repo.branches);
}

function getCurrentHead() {
    return repo.branches[repo.currentBranch];
}

function getCommit(commitId) {
    return repo.commits[commitId];
}

function addLog(message) {

    const entry = document.createElement("div");
    entry.className = "log-entry";

    entry.innerHTML = `
        ${message}
        <small>${new Date().toLocaleTimeString()}</small>
    `;

    historyLog.prepend(entry);
}

function updateStatus() {

    currentBranchEl.textContent = repo.currentBranch;

    headCommitEl.textContent =
        repo.branches[repo.currentBranch];

    totalCommitsEl.textContent =
        Object.keys(repo.commits).length;
}

/* ==========================
   BRANCH LANE SYSTEM
========================== */

function getLaneForBranch(branchName) {

    const names = getBranchNames();

    return names.indexOf(branchName);
}

/* ==========================
   COMMIT CREATION
========================== */

function createCommit(message) {

    const id = generateCommitId();

    const parent = getCurrentHead();

    repo.commits[id] = {

        id,
        message,

        parents: [parent],

        branch: repo.currentBranch,

        lane: getLaneForBranch(repo.currentBranch),

        timestamp: new Date()
    };

    repo.branches[repo.currentBranch] = id;

    addLog(
        `Created commit <strong>${id}</strong> on branch <strong>${repo.currentBranch}</strong>`
    );

    updateStatus();
    renderGraph();
}

/* ==========================
   CREATE BRANCH
========================== */

function createBranch(name) {

    name = name.trim();

    if (!name) {
        alert("Branch name required");
        return;
    }

    if (repo.branches[name]) {
        alert("Branch already exists");
        return;
    }

    repo.branches[name] = getCurrentHead();

    addLog(
        `Created branch <strong>${name}</strong>`
    );

    updateBranchSelectors();

    renderGraph();
}

/* ==========================
   SWITCH BRANCH
========================== */

function switchBranch(name) {

    if (!repo.branches[name]) {
        return;
    }

    repo.currentBranch = name;

    addLog(
        `Switched to branch <strong>${name}</strong>`
    );

    updateStatus();
    renderGraph();
}

/* ==========================
   MERGE
========================== */

function mergeBranch(sourceBranch) {

    if (sourceBranch === repo.currentBranch) {

        alert("Choose another branch.");
        return;
    }

    const mergeCommitId = generateCommitId();

    const currentHead =
        repo.branches[repo.currentBranch];

    const sourceHead =
        repo.branches[sourceBranch];

    repo.commits[mergeCommitId] = {

        id: mergeCommitId,

        message:
            `Merge branch '${sourceBranch}'`,

        parents: [
            currentHead,
            sourceHead
        ],

        branch: repo.currentBranch,

        lane: getLaneForBranch(
            repo.currentBranch
        ),

        merge: true,

        timestamp: new Date()
    };

    repo.branches[
        repo.currentBranch
    ] = mergeCommitId;

    addLog(
        `Merged <strong>${sourceBranch}</strong> into <strong>${repo.currentBranch}</strong>`
    );

    updateStatus();
    renderGraph();
}

/* ==========================
   REBASE
========================== */

function rebaseCurrentOnto(targetBranch) {

    if (targetBranch === repo.currentBranch) {

        alert("Cannot rebase onto same branch.");
        return;
    }

    const targetHead =
        repo.branches[targetBranch];

    const currentHead =
        repo.branches[repo.currentBranch];

    const original =
        getCommit(currentHead);

    const newCommitId =
        generateCommitId();

    repo.commits[newCommitId] = {

        id: newCommitId,

        message:
            original.message +
            " (rebased)",

        parents: [targetHead],

        branch: repo.currentBranch,

        lane: getLaneForBranch(
            repo.currentBranch
        ),

        rebased: true,

        timestamp: new Date()
    };

    repo.branches[
        repo.currentBranch
    ] = newCommitId;

    addLog(
        `Rebased <strong>${repo.currentBranch}</strong> onto <strong>${targetBranch}</strong>`
    );

    updateStatus();
    renderGraph();
}

/* ==========================
   RESET
========================== */

function resetLastCommit() {

    const head =
        repo.branches[repo.currentBranch];

    const commit =
        getCommit(head);

    if (
        !commit ||
        commit.parents.length === 0
    ) {

        alert(
            "Cannot reset initial commit."
        );

        return;
    }

    repo.branches[
        repo.currentBranch
    ] = commit.parents[0];

    addLog(
        `Reset branch <strong>${repo.currentBranch}</strong> to ${commit.parents[0]}`
    );

    updateStatus();
    renderGraph();
}

/* ==========================
   SELECTS
========================== */

function updateBranchSelectors() {

    const names = getBranchNames();

    branchSelect.innerHTML = "";
    mergeBranchSelect.innerHTML = "";
    rebaseBranchSelect.innerHTML = "";

    names.forEach(branch => {

        const opt1 =
            document.createElement("option");

        opt1.value = branch;
        opt1.textContent = branch;

        branchSelect.appendChild(opt1);

        const opt2 =
            document.createElement("option");

        opt2.value = branch;
        opt2.textContent = branch;

        mergeBranchSelect.appendChild(opt2);

        const opt3 =
            document.createElement("option");

        opt3.value = branch;
        opt3.textContent = branch;

        rebaseBranchSelect.appendChild(opt3);
    });
}

/* ==========================
   EVENT LISTENERS
========================== */

commitBtn.addEventListener(
    "click",
    () => {

        const msg =
            commitMessageInput.value.trim();

        if (!msg) {
            alert(
                "Enter commit message."
            );
            return;
        }

        createCommit(msg);

        commitMessageInput.value = "";
    }
);

createBranchBtn.addEventListener(
    "click",
    () => {

        createBranch(
            branchNameInput.value
        );

        branchNameInput.value = "";
    }
);

switchBranchBtn.addEventListener(
    "click",
    () => {

        switchBranch(
            branchSelect.value
        );
    }
);

mergeBtn.addEventListener(
    "click",
    () => {

        mergeBranch(
            mergeBranchSelect.value
        );
    }
);

rebaseBtn.addEventListener(
    "click",
    () => {

        rebaseCurrentOnto(
            rebaseBranchSelect.value
        );
    }
);

resetBtn.addEventListener(
    "click",
    resetLastCommit
);

/* ==========================
   GRAPH UTILITIES
========================== */

function getOrderedCommits() {

    return Object.values(repo.commits)
        .sort((a, b) => {

            const aNum =
                parseInt(a.id.replace("c", ""));

            const bNum =
                parseInt(b.id.replace("c", ""));

            return aNum - bNum;
        });
}

function createSvgElement(tag, attrs = {}) {

    const el = document.createElementNS(
        "http://www.w3.org/2000/svg",
        tag
    );

    Object.entries(attrs).forEach(
        ([key, value]) => {
            el.setAttribute(key, value);
        }
    );

    return el;
}

function getCommitPosition(commitId) {

    const commits =
        getOrderedCommits();

    const index =
        commits.findIndex(
            c => c.id === commitId
        );

    if (index === -1) {
        return null;
    }

    const commit =
        commits[index];

    const x =
        120 +
        (commit.lane * 180);

    const y =
        80 +
        (index * 90);

    return { x, y };
}

/* ==========================
   DRAW CONNECTIONS
========================== */

function drawParentConnections() {

    const commits =
        getOrderedCommits();

    commits.forEach(commit => {

        const childPos =
            getCommitPosition(commit.id);

        commit.parents.forEach(parentId => {

            const parentPos =
                getCommitPosition(parentId);

            if (!parentPos) return;

            const path =
                createSvgElement(
                    "path",
                    {
                        d:
                            `M ${parentPos.x} ${parentPos.y}
                             C ${parentPos.x} ${(parentPos.y + childPos.y) / 2},
                               ${childPos.x} ${(parentPos.y + childPos.y) / 2},
                               ${childPos.x} ${childPos.y}`,
                        class:
                            "connection-line",
                        stroke:
                            laneColors[
                                commit.lane %
                                laneColors.length
                            ]
                    }
                );

            svg.appendChild(path);
        });
    });
}

/* ==========================
   DRAW COMMITS
========================== */

function drawCommits() {

    const commits =
        getOrderedCommits();

    commits.forEach(commit => {

        const pos =
            getCommitPosition(
                commit.id
            );

        const group =
            createSvgElement("g");

        const color =
            commit.merge
                ? "#22c55e"
                : laneColors[
                    commit.lane %
                    laneColors.length
                ];

        const circle =
            createSvgElement(
                "circle",
                {
                    cx: pos.x,
                    cy: pos.y,
                    r: 18,
                    fill: color,
                    class:
                        "commit-node"
                }
            );

        const idLabel =
            createSvgElement(
                "text",
                {
                    x: pos.x,
                    y: pos.y + 4,
                    "text-anchor":
                        "middle",
                    class:
                        "commit-label"
                }
            );

        idLabel.textContent =
            commit.id;

        const message =
            createSvgElement(
                "text",
                {
                    x: pos.x + 35,
                    y: pos.y + 5,
                    class:
                        "commit-message"
                }
            );

        message.textContent =
            commit.message;

        group.appendChild(circle);
        group.appendChild(idLabel);
        group.appendChild(message);

        svg.appendChild(group);
    });
}

/* ==========================
   DRAW BRANCH LABELS
========================== */

function drawBranchLabels() {

    Object.entries(
        repo.branches
    ).forEach(
        ([branchName, commitId]) => {

            const pos =
                getCommitPosition(
                    commitId
                );

            if (!pos) return;

            const lane =
                getLaneForBranch(
                    branchName
                );

            const rect =
                createSvgElement(
                    "rect",
                    {
                        x: pos.x + 55,
                        y: pos.y - 16,
                        rx: 6,
                        width:
                            branchName.length *
                            10 +
                            18,
                        height: 24,
                        fill:
                            laneColors[
                                lane %
                                laneColors.length
                            ]
                    }
                );

            const text =
                createSvgElement(
                    "text",
                    {
                        x: pos.x + 65,
                        y: pos.y,
                        class:
                            "branch-label"
                    }
                );

            text.textContent =
                branchName;

            svg.appendChild(rect);
            svg.appendChild(text);
        }
    );
}

/* ==========================
   DRAW HEAD
========================== */

function drawHeadIndicator() {

    const headCommit =
        repo.branches[
            repo.currentBranch
        ];

    const pos =
        getCommitPosition(
            headCommit
        );

    if (!pos) return;

    const triangle =
        createSvgElement(
            "polygon",
            {
                points:
                    `${pos.x - 12},${pos.y - 38}
                     ${pos.x + 12},${pos.y - 38}
                     ${pos.x},${pos.y - 18}`,
                class:
                    "head-indicator"
            }
        );

    svg.appendChild(triangle);

    const label =
        createSvgElement(
            "text",
            {
                x: pos.x,
                y: pos.y - 48,
                "text-anchor":
                    "middle",
                fill: "#ef4444",
                "font-size": "13",
                "font-weight":
                    "bold"
            }
        );

    label.textContent = "HEAD";

    svg.appendChild(label);
}

/* ==========================
   SVG SIZE
========================== */

function updateSvgHeight() {

    const count =
        Object.keys(
            repo.commits
        ).length;

    const height =
        Math.max(
            650,
            count * 95
        );

    svg.setAttribute(
        "viewBox",
        `0 0 1200 ${height}`
    );

    svg.setAttribute(
        "height",
        height
    );
}

/* ==========================
   RENDER GRAPH
========================== */

function renderGraph() {

    svg.innerHTML = "";

    updateSvgHeight();

    drawParentConnections();

    drawCommits();

    drawBranchLabels();

    drawHeadIndicator();

    updateStatus();
}

/* ==========================
   SAMPLE REPOSITORY
========================== */

function createDemoRepository() {

    createCommit(
        "Setup project structure"
    );

    createCommit(
        "Add README"
    );

    createBranch(
        "feature-login"
    );

    switchBranch(
        "feature-login"
    );

    createCommit(
        "Create login form"
    );

    createCommit(
        "Add validation"
    );

    switchBranch(
        "main"
    );
}

/* ==========================
   INITIALIZE
========================== */

function initialize() {

    updateBranchSelectors();

    updateStatus();

    addLog(
        "Repository initialized"
    );

    createDemoRepository();

    renderGraph();
}

initialize();