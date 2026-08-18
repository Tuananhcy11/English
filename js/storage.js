// Storage Manager
const Storage = {
    DEFAULT_DECKS: [
        {
            id: "deck_tech",
            title: "Công nghệ & Tin học",
            cards: [
                { term: "algorithm", def: "thuật toán" },
                { term: "bandwidth", def: "băng thông mạng" },
                { term: "compile", def: "biên dịch mã nguồn" },
                { term: "database", def: "cơ sở dữ liệu" },
                { term: "encryption", def: "mã hóa dữ liệu" }
            ]
        },
        {
            id: "deck_travel",
            title: "Du lịch & Giao thông",
            cards: [
                { term: "itinerary", def: "lịch trình chuyến đi" },
                { term: "accommodation", def: "chỗ ở, nơi lưu trú" },
                { term: "boarding pass", def: "thẻ lên máy bay" },
                { term: "destination", def: "điểm đến" },
                { term: "customs", def: "hải quan sân bay" }
            ]
        }
    ],

    getDecks() {
        const data = localStorage.getItem("vocab_decks");
        return data ? JSON.parse(data) : this.DEFAULT_DECKS;
    },

    saveDecks(decks) {
        localStorage.setItem("vocab_decks", JSON.stringify(decks));
    },

    getDeckById(id) {
        const decks = this.getDecks();
        return decks.find(d => d.id === id);
    },

    addDeck(title, cards = []) {
        const decks = this.getDecks();
        const newDeck = {
            id: "deck_" + Date.now(),
            title: title.trim(),
            cards: cards
        };
        decks.push(newDeck);
        this.saveDecks(decks);
        return newDeck;
    },

    deleteDeck(id) {
        let decks = this.getDecks();
        decks = decks.filter(d => d.id !== id);
        this.saveDecks(decks);
    },

    getSchedule() {
        const data = localStorage.getItem("vocab_schedule");
        return data ? JSON.parse(data) : {
            "2": { deckId: "deck_tech", time: "20:00" }, // Thứ 2
            "3": { deckId: "deck_travel", time: "20:00" },
            "4": { deckId: "", time: "20:00" },
            "5": { deckId: "", time: "20:00" },
            "6": { deckId: "", time: "20:00" },
            "7": { deckId: "", time: "20:00" },
            "CN": { deckId: "", time: "20:00" }
        };
    },

    saveSchedule(schedule) {
        localStorage.setItem("vocab_schedule", JSON.stringify(schedule));
    }
};