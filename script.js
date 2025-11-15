
// ---- Configuration ----
const setup = {
    webSocketUrl: "ws://localhost:8080/",    // WebSocket URL to connect to Streamer.bot or your backend

    // Permissions
    allowMods: true,
                             // If true, moderators may use timer chat commands; if false, only the broadcaster may
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

let remainingSeconds = 0;
let endTime = Date.now() + remainingSeconds * 1000;
// Default behavior: start paused at 0 (no automatic default time). Use chat `!time set <duration>` to set and start the timer.
let paused = true;

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

// ---- Remaining time helper and display ----
function getRemainingSeconds() {
    if (paused) return remainingSeconds;
    return Math.max(0, Math.floor((endTime - Date.now()) / 1000));
}

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

// ---- Parse human-friendly time formats ----
function parseHumanTime(str) {
    if (!str) return 0;
    str = str.trim().toLowerCase();

    // Format like 1:20, 10:30:15
    if (/^\d+(:\d+){1,2}$/.test(str)) {
        const parts = str.split(":").map(Number);
        if (parts.length === 2) {
            const [m, s] = parts;
            return (m * 60) + s;
        }
        if (parts.length === 3) {
            const [h, m, s] = parts;
            return (h * 3600) + (m * 60) + s;
        }
    }

    // Format like "1h 20m", "10m", "90s"
    let total = 0;
    const regex = /(\d+)\s*(h|hr|hrs|hour|hours|m|min|mins|minute|minutes|s|sec|secs|second|seconds)/g;
    let match;

    while ((match = regex.exec(str)) !== null) {
        const value = parseInt(match[1]);
        const unit = match[2];

        if (unit.startsWith("h")) total += value * 3600;
        else if (unit.startsWith("m")) total += value * 60;
        else if (unit.startsWith("s")) total += value;
    }

    return total;
}

// ---- Twitch Chat Message Command Handler ----
function handleTwitchChatMessage(msg) {
    const data = msg.data;

    // Extract text safely
    const text = (data.text || data.message?.message || "").toLowerCase().trim();

    // Allow both "!time" and "time"
    if (!text.startsWith("!time") && !text.startsWith("time")) return;

    // Permissions: broadcaster OR (moderator if enabled in setup)
    const badges = data.message?.badges || [];
    const isBroadcaster = badges.some(b => b.name === "broadcaster");
    const isModerator = badges.some(b => b.name === "moderator");

    if (!isBroadcaster && !(setup.allowMods && isModerator)) return;

    // Remove prefix
    const cleaned = text.replace("!time", "").replace("time", "").trim();
    const parts = cleaned.split(" ");
    const action = parts[0];
    const timeString = parts.slice(1).join(" ");

    switch (action) {
        case "pause":
            if (!paused) {
                remainingSeconds = Math.max(0, Math.floor((endTime - Date.now()) / 1000));
                paused = true;
            }
            break;

        case "resume":
            if (paused) {
                endTime = Date.now() + remainingSeconds * 1000;
                paused = false;
            }
            break;
            case "start": {
                // start accepts an optional duration: '!time start <duration>' will set-and-start.
                // If no duration is provided, start behaves like resume but only if remainingSeconds > 0.
                const startSeconds = parseHumanTime(timeString);
                if (startSeconds > 0) {
                    // set the timer to the provided duration and start
                    remainingSeconds = startSeconds;
                    endTime = Date.now() + remainingSeconds * 1000;
                    paused = false;
                } else {
                    // no duration provided or parsed as 0 — behave like resume if there is remaining time
                    if (paused) {
                        if (remainingSeconds > 0) {
                            endTime = Date.now() + remainingSeconds * 1000;
                            paused = false;
                        } else {
                            console.log("!time start ignored: remaining time is 0. Use '!time set <duration>' or '!time start <duration>' first.");
                        }
                    }
                }
                break;
            }
        case "add": {
            const addSeconds = parseHumanTime(timeString);
            if (addSeconds > 0) {
                if (paused) {
                    remainingSeconds += addSeconds;
                } else {
                    endTime += addSeconds * 1000;
                }
            }
            break;
        }

        case "sub":
        case "subtract": {
            const subSeconds = parseHumanTime(timeString);
            if (subSeconds > 0) {
                if (paused) {
                    remainingSeconds = Math.max(0, remainingSeconds - subSeconds);
                } else {
                    endTime -= subSeconds * 1000;
                }
            }
            break;
        }

        case "set": {
            const setStr = timeString;
            const setSeconds = parseHumanTime(setStr);
            if (setSeconds >= 0) {
                endTime = Date.now() + setSeconds * 1000;
                remainingSeconds = setSeconds;
                paused = false;
            }
            break;
        }
    }
}

// ---- Update display function ----
function updateDisplay() {
    const remaining = getRemainingSeconds();
    textEl.textContent = formatTime(remaining);
    return remaining;
}

// ---- Animation loop ----
function tick() {
    updateDisplay();
    // keep the animation frame running so the display updates when unpaused or on events
    requestAnimationFrame(tick);
}

// Start the animation loop
tick();

// ---- WebSocket subscription ----
ws.onopen = () => {
    const subscribeMsg = {
        request: "Subscribe",
        id: "obsWidgetUpdate",
        events: {
            Kofi: ["Donation", "Commission", "Resubscription", "Subscription", "ShopOrder"],
            Twitch: [
                "Sub","ReSub","GiftSub","SharedChatSub",
                "SharedChatResub","SharedChatSubGift",
                "Cheer","ChatMessage"
            ]
        }
    };

    ws.send(JSON.stringify(subscribeMsg));
    console.log("Subscribed to StreamerBot events");
};


// ---- Handle incoming events ----
ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    console.log("Received:", msg);

    const source = msg.event?.source;
    const eventType = msg.event?.type;
    let amount = 0;

    // ---- Handle Twitch.ChatMessage ----
    if (source === "Twitch" && eventType === "ChatMessage") {
        handleTwitchChatMessage(msg);
        return; // don't process timer logic for chat messages
    }

    // ---- Normal event handling ----
    if (source === "Kofi") amount = msg.data?.amount || 0;
    if (source === "Twitch") {
        if (eventType === "Cheer") amount = msg.data?.bits || 0;
        if (eventType === "Sub" || eventType === "ReSub") {
            amount = msg.data?.subTier || "1000"; // default T1
        }
    }

    const extraMinutes = calculateExtraMinutes(source, eventType, amount);

    if (extraMinutes > 0) {
        if (paused) {
            remainingSeconds += extraMinutes * 60;
        } else {
            endTime += extraMinutes * 60 * 1000;
        }
    }
};

ws.onerror = (err) => console.error("WebSocket error:", err);

// ---- Initial display ----
updateDisplay();
