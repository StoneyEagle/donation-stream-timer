
// ---- Configuration ----
const setup = {
    webSocketUrl: "ws://localhost:8080/",    // WebSocket URL to connect to Streamer.bot or your backend
    initialHours: 48,                        // Initial countdown timer duration in hours

    // ---- Kofi Settings ----
    kofiDonationTimeIncrement: 2,            // Minutes added per $1 donated via Kofi
    kofiSubscriptionTimeIncrement: 30,       // Flat minutes added per Kofi subscription or resubscription
    kofiShopOrderTimeIncrement: 15,          // Flat minutes added per Kofi shop order

    // ---- Twitch Settings ----
    // Subscription tiers (time added per sub/resub based on tier)
    twitchSubTier1TimeIncrement: 30,         // Tier 1 subscription
    twitchSubTier2TimeIncrement: 45,         // Tier 2 subscription
    twitchSubTier3TimeIncrement: 60,         // Tier 3 subscription
    twitchReSubTier1TimeIncrement: 30,       // Tier 1 resubscription
    twitchReSubTier2TimeIncrement: 45,       // Tier 2 resubscription
    twitchReSubTier3TimeIncrement: 60,       // Tier 3 resubscription

    // Gifted and shared chat subs
    twitchGiftSubTimeIncrement: 15,          // Minutes added per gifted subscription
    twitchSharedChatSubTimeIncrement: 30,    // Shared chat subscription (from chat commands)
    twitchSharedChatResubTimeIncrement: 30,  // Shared chat resubscription
    twitchSharedChatSubGiftTimeIncrement: 15,// Shared chat gifted subscription

    // Bits/Cheers
    twitchCheerTimeIncrement: (bits) => Math.floor(bits / 100) * 1, // 1 minute added per 100 bits cheered
};


// ---- Initial timer setup ----

const textEl = document.getElementById("text");
const ws = new WebSocket(setup.webSocketUrl);

let durationSeconds = setup.initialHours * 3600; // convert hours to seconds
let endTime = Date.now() + durationSeconds * 1000;

// ---- Format as HH:MM:SS ----
function formatTime(totalSeconds) {
    const hours = Math.floor(totalSeconds / 3600);
    totalSeconds %= 3600;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    const hStr = hours.toString().padStart(2, "0");
    const mStr = minutes.toString().padStart(2, "0");
    const sStr = seconds.toString().padStart(2, "0");

    return `${hStr}:${mStr}:${sStr}`;
}

// ---- Update display based on Date.now() ----
function updateDisplay() {
    const remainingSeconds = Math.max(0, Math.floor((endTime - Date.now()) / 1000));
    textEl.textContent = formatTime(remainingSeconds);
    return remainingSeconds;
}

// ---- Animation loop ----
function tick() {
    const remaining = updateDisplay();
    if (remaining > 0) {
        requestAnimationFrame(tick);
    }
}
tick();

// ---- Time calculation function per event type ----
function calculateExtraMinutes(source, eventType, amountOrBits, tier) {
    if (source === "Kofi") {
        switch (eventType) {
            case "Donation":
            case "Commission":
                return (parseFloat(amountOrBits) || 0) * setup.kofiDonationTimeIncrement;
            case "Resubscription":
            case "Subscription":
                return setup.kofiSubscriptionTimeIncrement;
            case "ShopOrder":
                return setup.kofiShopOrderTimeIncrement;
            default: return 0;
        }
    } else if (source === "Twitch") {
        switch (eventType) {
            case "Sub":
                if (tier === "1000") return setup.twitchSubTier1TimeIncrement;
                if (tier === "2000") return setup.twitchSubTier2TimeIncrement;
                if (tier === "3000") return setup.twitchSubTier3TimeIncrement;
                return setup.twitchSubTier1TimeIncrement;
            case "ReSub":
                if (tier === "1000") return setup.twitchReSubTier1TimeIncrement;
                if (tier === "2000") return setup.twitchReSubTier2TimeIncrement;
                if (tier === "3000") return setup.twitchReSubTier3TimeIncrement;
                return setup.twitchReSubTier1TimeIncrement;
            case "GiftSub": return setup.twitchGiftSubTimeIncrement;
            case "SharedChatSub": return setup.twitchSharedChatSubTimeIncrement;
            case "SharedChatResub": return setup.twitchSharedChatResubTimeIncrement;
            case "SharedChatSubGift": return setup.twitchSharedChatSubGiftTimeIncrement;
            case "Cheer": return setup.twitchCheerTimeIncrement(amountOrBits);
            default: return 0;
        }
    }
    return 0;
}

// ---- WebSocket subscription ----
ws.onopen = () => {
    const subscribeMsg = {
        request: "Subscribe",
        id: "obsWidgetUpdate",
        events: {
            Kofi: ["Donation", "Commission", "Resubscription", "Subscription", "ShopOrder"],
            Twitch: ["Sub","ReSub","GiftSub","SharedChatSub","SharedChatResub","SharedChatSubGift","Cheer"]
        }
    };
    ws.send(JSON.stringify(subscribeMsg));
    console.log("Subscribed to Kofi events");
};


// ---- Handle incoming events ----
ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    const source = msg.event?.source;
    const eventType = msg.event?.type;
    let amountOrBits = 0;
    let tier = null;

    if (source === "Kofi") amountOrBits = msg.data?.amount || 0;
    if (source === "Twitch") {
        if (eventType === "Cheer") amountOrBits = msg.data?.bits || 0;
        if (["Sub","ReSub"].includes(eventType)) tier = msg.data?.subPlan || msg.data?.tier; // Twitch tier: 1000, 2000, 3000
    }

    const extraMinutes = calculateExtraMinutes(source, eventType, amountOrBits, tier);
    if (extraMinutes > 0) endTime += extraMinutes * 60 * 1000;
};

ws.onerror = (err) => console.error("WebSocket error:", err);

// ---- Initial display ----
updateDisplay();
