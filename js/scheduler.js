const Scheduler = {
    daysMap: {
        "2": "Thứ Hai",
        "3": "Thứ Ba",
        "4": "Thứ Tư",
        "5": "Thứ Năm",
        "6": "Thứ Sáu",
        "7": "Thứ Bảy",
        "CN": "Chủ Nhật"
    },

    init() {
        this.renderPlanner();
        this.startReminderChecker();
    },

    requestNotificationPermission() {
        if (!("Notification" in window)) {
            alert("Trình duyệt không hỗ trợ thông báo đẩy.");
            return;
        }
        Notification.requestPermission().then(permission => {
            if (permission === "granted") {
                alert("Đã bật nhắc nhở học từ vựng thành công!");
                new Notification("VocabMaster 🎓", {
                    body: "Hệ thống nhắc nhở học tập đã sẵn sàng!",
                    icon: "https://cdn-icons-png.flaticon.com/512/3429/3429434.png"
                });
            }
        });
    },

    renderPlanner() {
        const grid = document.getElementById("plannerGrid");
        grid.innerHTML = "";
        const schedule = Storage.getSchedule();
        const decks = Storage.getDecks();

        for (let key in this.daysMap) {
            const item = schedule[key] || { deckId: "", time: "20:00" };
            const card = document.createElement("div");
            card.className = "planner-day-card";

            let optionsHtml = `<option value="">-- Không có lịch --</option>`;
            decks.forEach(d => {
                optionsHtml += `<option value="${d.id}" ${d.id === item.deckId ? "selected" : ""}>${d.title}</option>`;
            });

            card.innerHTML = `
                <div class="day-header">
                    <span>${this.daysMap[key]}</span>
                </div>
                <label style="font-size:12px; color:var(--text-muted)">Chủ đề cần học:</label>
                <select class="day-select" onchange="Scheduler.updateDay('${key}', this.value, null)">
                    ${optionsHtml}
                </select>
                <label style="font-size:12px; color:var(--text-muted)">Giờ nhắc nhở:</label>
                <input type="time" class="time-input" value="${item.time || '20:00'}" onchange="Scheduler.updateDay('${key}', null, this.value)">
            `;
            grid.appendChild(card);
        }
    },

    updateDay(dayKey, deckId, time) {
        const schedule = Storage.getSchedule();
        if (!schedule[dayKey]) schedule[dayKey] = { deckId: "", time: "20:00" };
        if (deckId !== null) schedule[dayKey].deckId = deckId;
        if (time !== null) schedule[dayKey].time = time;
        Storage.saveSchedule(schedule);
    },

    startReminderChecker() {
        setInterval(() => {
            const now = new Date();
            const dayOfWeek = now.getDay(); // 0 là CN, 1 là T2...
            const dayKey = dayOfWeek === 0 ? "CN" : (dayOfWeek + 1).toString();
            
            const currentHours = String(now.getHours()).padStart(2, '0');
            const currentMinutes = String(now.getMinutes()).padStart(2, '0');
            const currentTimeStr = `${currentHours}:${currentMinutes}`;

            const schedule = Storage.getSchedule();
            const todayPlan = schedule[dayKey];

            if (todayPlan && todayPlan.deckId && todayPlan.time === currentTimeStr && now.getSeconds() < 2) {
                const deck = Storage.getDeckById(todayPlan.deckId);
                if (deck && Notification.permission === "granted") {
                    new Notification("Đã đến giờ học từ vựng! ⏰", {
                        body: `Hôm nay là ${this.daysMap[dayKey]}, hãy mở chủ đề "${deck.title}" để ôn tập nhé!`,
                        icon: "https://cdn-icons-png.flaticon.com/512/3429/3429434.png"
                    });
                }
            }
        }, 1000);
    }
};