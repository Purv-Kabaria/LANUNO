const colors = ["Red", "Green", "Blue", "Yellow"];

function createDeck() {
    let deck = [];
    for (const color of colors) {
        deck.push({ id: `${color}_0`, color, value: "0", image: `${color}_0.png` });
        for (let i = 1; i <= 9; i++) {
            deck.push({ id: `${color}_${i}_1`, color, value: i.toString(), image: `${color}_${i}.png` });
            deck.push({ id: `${color}_${i}_2`, color, value: i.toString(), image: `${color}_${i}.png` });
        }
        for (const special of ["Skip", "Reverse", "Draw2"]) {
            deck.push({ id: `${color}_${special}_1`, color, value: special, image: `${color}_${special}.png` });
            deck.push({ id: `${color}_${special}_2`, color, value: special, image: `${color}_${special}.png` });
        }
    }
    for (let i = 0; i < 4; i++) {
        deck.push({ id: `Wild_${i}`, color: "Wild", value: "Wild", image: `Wild.png` });
        deck.push({ id: `Draw4_${i}`, color: "Wild", value: "Draw4", image: `Draw4.png` });
    }
    return deck;
}

function shuffle(array) {
    let currentIndex = array.length, randomIndex;
    while (currentIndex !== 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    }
    return array;
}

function initializeGame(room) {
    let deck = shuffle(createDeck());
    const players = Array.from(room.members.values()).filter(m => m.role !== 'host');

    players.forEach(p => {
        p.hand = deck.splice(0, 7);
        p.cardsCount = 7;
    });

    // Find a valid starting card (a number card is best)
    let topCardIndex = deck.findIndex(c => c.color !== "Wild" && !["Skip", "Reverse", "Draw2"].includes(c.value));
    if (topCardIndex === -1) topCardIndex = 0; // fallback
    let topCard = deck.splice(topCardIndex, 1)[0];

    room.gameState = {
        deck,
        discardPile: [topCard],
        topCard,
        turnIndex: 0,
        direction: 1 // 1 for normal, -1 for reverse
    };

    return room;
}

module.exports = { createDeck, shuffle, initializeGame };
