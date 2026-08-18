let currentDeck = null;
let currentCardIndex = 0;
let currentQuizIndex = 0;
let currentWriteIndex = 0;
let isCardFlipped = false;
let isWriteAnswered = false;

// ================= ROUTING & DASHBOARD =================
function showView(viewId) {
    document.querySelectorAll(".view-section").forEach(s => s.classList.remove("active"));
    document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));

    if (viewId === "dashboard") {
        document.getElementById("dashboardView").classList.add("active");
        document.querySelector("[data-view='dashboard']").classList.add("active");
        renderDashboard();
    } else if (viewId === "study-view") {
        document.getElementById("studyView").classList.add("active");
        document.getElementById("studyNavBtn").classList.add("active");
    } else if (viewId === "planner") {
        document.getElementById("plannerView").classList.add("active");
        document.querySelector("[data-view='planner']").classList.add("active");
        Scheduler.renderPlanner();
    }
}

function renderDashboard() {
    const grid = document.getElementById("deckGrid");
    grid.innerHTML = "";
    const decks = Storage.getDecks();

    decks.forEach(deck => {
        const el = document.createElement("div");
        el.className = "deck-card";
        el.innerHTML = `
            <button class="deck-delete-btn" onclick="event.stopPropagation(); deleteDeck('${deck.id}')" title="Xóa chủ đề">✕</button>
            <div class="deck-title">${deck.title}</div>
            <div class="deck-count">${deck.cards.length} từ vựng</div>
        `;
        el.onclick = () => openStudyDeck(deck.id);
        grid.appendChild(el);
    });
}

function deleteDeck(deckId) {
    if (confirm("Bạn có chắc chắn muốn xóa bộ từ vựng này?")) {
        Storage.deleteDeck(deckId);
        renderDashboard();
    }
}

function openStudyDeck(deckId) {
    currentDeck = Storage.getDeckById(deckId);
    if (!currentDeck) return;

    document.getElementById("studyDeckName").innerText = currentDeck.title;
    document.getElementById("currentDeckTitle").innerText = currentDeck.title;
    document.getElementById("studyNavBtn").style.display = "inline-block";

    currentCardIndex = 0;
    currentQuizIndex = 0;
    currentWriteIndex = 0;

    showView("study-view");
    switchStudyMode("flashcards");
    renderCurrentCard();
    renderDeckWordList();
}

// ================= STUDY MODES =================
function switchStudyMode(mode) {
    document.querySelectorAll(".study-tab").forEach(t => t.classList.remove("active"));
    document.querySelectorAll(".mode-content").forEach(m => m.classList.remove("active"));

    const tab = document.querySelector(`.study-tab[data-mode="${mode}"]`);
    if (tab) tab.classList.add("active");

    if (mode === "flashcards") {
        document.getElementById("modeFlashcards").classList.add("active");
        renderCurrentCard();
    } else if (mode === "quiz") {
        document.getElementById("modeQuiz").classList.add("active");
        currentQuizIndex = 0;
        loadQuiz();
    } else if (mode === "write") {
        document.getElementById("modeWrite").classList.add("active");
        currentWriteIndex = 0;
        loadWrite();
    }
}

// 1. Flashcards
function renderCurrentCard() {
    if (!currentDeck || currentDeck.cards.length === 0) return;
    const card = currentDeck.cards[currentCardIndex];

    isCardFlipped = false;
    document.getElementById("flashcard").classList.remove("flipped");

    document.getElementById("frontText").innerText = card.term;
    document.getElementById("backText").innerText = card.def;
    document.getElementById("cardProgress").innerText = `${currentCardIndex + 1} / ${currentDeck.cards.length}`;
}

function flipCard() {
    isCardFlipped = !isCardFlipped;
    document.getElementById("flashcard").classList.toggle("flipped", isCardFlipped);
}

// 2. Quiz Mode
function loadQuiz() {
    if (!currentDeck || currentDeck.cards.length < 2) {
        document.getElementById("quizQuestion").innerText = "Cần tối thiểu 2 từ để mở trắc nghiệm!";
        document.getElementById("quizOptions").innerHTML = "";
        return;
    }
    const current = currentDeck.cards[currentQuizIndex];
    document.getElementById("quizProgress").innerText = `${currentQuizIndex + 1} / ${currentDeck.cards.length}`;
    document.getElementById("quizQuestion").innerText = `"${current.term}" có nghĩa là gì?`;
    document.getElementById("btnNextQuiz").style.display = "none";

    let options = [current.def];
    let pool = currentDeck.cards.filter(c => c.def !== current.def).map(c => c.def).sort(() => 0.5 - Math.random());
    options = options.concat(pool.slice(0, 3)).sort(() => 0.5 - Math.random());

    const container = document.getElementById("quizOptions");
    container.innerHTML = "";

    options.forEach(opt => {
        const btn = document.createElement("button");
        btn.className = "option-btn";
        btn.innerText = opt;
        btn.onclick = () => {
            document.querySelectorAll(".option-btn").forEach(b => b.disabled = true);
            if (opt === current.def) {
                btn.classList.add("correct");
            } else {
                btn.classList.add("wrong");
                document.querySelectorAll(".option-btn").forEach(b => { if (b.innerText === current.def) b.classList.add("correct"); });
            }
            document.getElementById("btnNextQuiz").style.display = "inline-block";
        };
        container.appendChild(btn);
    });
}

// 3. Write Mode
function loadWrite() {
    if (!currentDeck || currentDeck.cards.length === 0) return;
    isWriteAnswered = false;
    const current = currentDeck.cards[currentWriteIndex];

    document.getElementById("writeProgress").innerText = `${currentWriteIndex + 1} / ${currentDeck.cards.length}`;
    document.getElementById("writeQuestion").innerText = current.def;

    const input = document.getElementById("writeInput");
    input.value = "";
    input.disabled = false;
    document.getElementById("writeFeedback").style.display = "none";
    document.getElementById("btnSkipWrite").style.display = "inline-block";
    document.getElementById("btnSubmitWrite").innerText = "Kiểm tra (Enter)";
    setTimeout(() => input.focus(), 50);
}

function checkWrite() {
    if (isWriteAnswered) {
        currentWriteIndex = (currentWriteIndex + 1) % currentDeck.cards.length;
        loadWrite();
        return;
    }
    const input = document.getElementById("writeInput");
    const userAns = input.value.trim().toLowerCase();
    const current = currentDeck.cards[currentWriteIndex];
    const feedback = document.getElementById("writeFeedback");

    if (!userAns) return;
    isWriteAnswered = true;
    input.disabled = true;

    AudioTTS.speak(current.term);

    if (userAns === current.term.trim().toLowerCase()) {
        feedback.className = "feedback-box correct";
        feedback.innerHTML = `🎉 <strong>Chính xác!</strong> Từ đúng: ${current.term}`;
    } else {
        feedback.className = "feedback-box wrong";
        feedback.innerHTML = `❌ <strong>Chưa chính xác!</strong> Đáp án đúng: <strong>${current.term}</strong>`;
    }
    feedback.style.display = "block";
    document.getElementById("btnSkipWrite").style.display = "none";
    document.getElementById("btnSubmitWrite").innerText = "Tiếp tục (Enter) →";
    document.getElementById("btnSubmitWrite").focus();
}

function skipWrite() {
    isWriteAnswered = true;
    const current = currentDeck.cards[currentWriteIndex];
    const feedback = document.getElementById("writeFeedback");
    document.getElementById("writeInput").disabled = true;

    AudioTTS.speak(current.term);
    feedback.className = "feedback-box wrong";
    feedback.innerHTML = `💡 Đáp án đúng là: <strong>${current.term}</strong>`;
    feedback.style.display = "block";

    document.getElementById("btnSkipWrite").style.display = "none";
    document.getElementById("btnSubmitWrite").innerText = "Tiếp tục (Enter) →";
    document.getElementById("btnSubmitWrite").focus();
}

function renderDeckWordList() {
    const list = document.getElementById("deckWordsContainer");
    list.innerHTML = "";
    document.getElementById("totalDeckWords").innerText = currentDeck.cards.length;

    currentDeck.cards.forEach((c, idx) => {
        const item = document.createElement("div");
        item.className = "word-item";
        item.innerHTML = `
            <div>
                <span class="term">${idx + 1}. ${c.term}</span>
                <button class="audio-btn" style="width:28px;height:28px;font-size:12px;margin-left:6px" onclick="AudioTTS.speak('${c.term}')">🔊</button>
            </div>
            <span style="color:var(--text-muted)">${c.def}</span>
        `;
        list.appendChild(item);
    });
}

// ================= CSV IMPORT =================
function handleCsvUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    const defaultTitle = file.name.replace(/\.[^/.]+$/, "");
    const deckTitle = prompt("Đặt tên cho Chủ đề mới:", defaultTitle);
    if (!deckTitle) {
        e.target.value = "";
        return;
    }

    const reader = new FileReader();
    reader.onload = function(evt) {
        const text = evt.target.result;
        const lines = text.split(/\r\n|\n/);
        const cards = [];

        lines.forEach(line => {
            const trimmed = line.trim();
            if (!trimmed) return;

            let term = "";
            let def = "";

            if (trimmed.includes("\t")) {
                const parts = trimmed.split("\t");
                term = parts[0].trim();
                def = parts.slice(1).join("\t").trim();
            } else if (trimmed.includes(",")) {
                const firstCommaIndex = trimmed.indexOf(",");
                term = trimmed.substring(0, firstCommaIndex).trim().replace(/^["']|["']$/g, '');
                def = trimmed.substring(firstCommaIndex + 1).trim().replace(/^["']|["']$/g, '');
            }

            const isHeader = (term.toLowerCase() === "term" || term.toLowerCase() === "thuật ngữ") &&
                             (def.toLowerCase().includes("def") || def.toLowerCase().includes("định nghĩa"));

            if (term && def && !isHeader) {
                cards.push({ term, def });
            }
        });

        if (cards.length > 0) {
            const createdDeck = Storage.addDeck(deckTitle, cards);
            renderDashboard();
            openStudyDeck(createdDeck.id);
            alert(`🎉 Nạp thành công ${cards.length} từ vựng vào chủ đề "${deckTitle}"!`);
        } else {
            alert("⚠️ Không tìm thấy từ vựng hợp lệ trong file!");
        }
        e.target.value = "";
    };
    reader.readAsText(file, "UTF-8");
}

// ================= EVENT LISTENERS =================
document.querySelectorAll(".nav-btn").forEach(btn => {
    btn.addEventListener("click", () => showView(btn.getAttribute("data-view")));
});

document.getElementById("btnCreateDeck").onclick = () => {
    const title = prompt("Nhập tên chủ đề mới:");
    if (title) {
        Storage.addDeck(title, []);
        renderDashboard();
    }
};

document.getElementById("btnImportCsv").onclick = () => document.getElementById("csvFileInput").click();
document.getElementById("csvFileInput").onchange = handleCsvUpload;
document.getElementById("btnBackToDashboard").onclick = () => showView("dashboard");

document.querySelectorAll(".study-tab").forEach(tab => {
    tab.addEventListener("click", () => switchStudyMode(tab.getAttribute("data-mode")));
});

document.getElementById("flashcard").onclick = flipCard;
document.getElementById("audioBtn").onclick = (e) => {
    e.stopPropagation();
    if (currentDeck) AudioTTS.speak(currentDeck.cards[currentCardIndex].term);
};
document.getElementById("quizAudioBtn").onclick = () => {
    if (currentDeck) AudioTTS.speak(currentDeck.cards[currentQuizIndex].term);
};

document.getElementById("btnPrevCard").onclick = () => {
    if (currentCardIndex > 0) { currentCardIndex--; renderCurrentCard(); }
};
document.getElementById("btnNextCard").onclick = () => {
    if (currentDeck && currentCardIndex < currentDeck.cards.length - 1) { currentCardIndex++; renderCurrentCard(); }
};
document.getElementById("btnShuffle").onclick = () => {
    if (currentDeck) {
        currentDeck.cards.sort(() => 0.5 - Math.random());
        currentCardIndex = 0;
        renderCurrentCard();
        renderDeckWordList();
    }
};

document.getElementById("btnNextQuiz").onclick = () => {
    currentQuizIndex = (currentQuizIndex + 1) % currentDeck.cards.length;
    loadQuiz();
};

document.getElementById("btnSubmitWrite").onclick = checkWrite;
document.getElementById("btnSkipWrite").onclick = skipWrite;
document.getElementById("btnEnableNotification").onclick = () => Scheduler.requestNotificationPermission();

// Phím tắt bàn phím
window.addEventListener("keydown", (e) => {
    const isFlashcard = document.getElementById("modeFlashcards").classList.contains("active") && document.getElementById("studyView").classList.contains("active");
    const isWrite = document.getElementById("modeWrite").classList.contains("active") && document.getElementById("studyView").classList.contains("active");

    if (e.key === "r" || e.key === "R") {
        if (document.activeElement.id !== "writeInput" && currentDeck) {
            e.preventDefault();
            AudioTTS.speak(currentDeck.cards[currentCardIndex].term);
        }
    }

    if (isFlashcard) {
        if (e.code === "Space") { e.preventDefault(); flipCard(); }
        else if (e.code === "ArrowRight") { document.getElementById("btnNextCard").click(); }
        else if (e.code === "ArrowLeft") { document.getElementById("btnPrevCard").click(); }
    } else if (isWrite) {
        if (e.key === "Enter") { e.preventDefault(); checkWrite(); }
    }
});

// Khởi chạy App
showView("dashboard");
Scheduler.init();