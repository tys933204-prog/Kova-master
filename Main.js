/****************************************************
 * KOVA MASTER – CORE ENGINE (v1)
 * Modular, Expandable, Personality-Driven AI System
 ****************************************************/

/*---------------------------------------------
    SECTION 1 — KOVA CONFIG
----------------------------------------------*/

const KOVA_CONFIG = {
    name: "Kova",
    version: "1.0",
    personality: {
        vibe: "friendly, smart, stylish",
        humor: true,
        flirty: false,  // can be toggled later
        energy: "balanced",
    },
    features: {
        voiceMode: false,
        smartShopping: true,
        productFinder: true,
        outfitStyling: true,
        moodSwitching: true, // changes Kova’s personality on command
        searchIntegration: true,
        amazon: true,
        shopify: true,
        printify: true
    }
};

/*---------------------------------------------
    SECTION 2 — PERSONALITY ENGINE
----------------------------------------------*/

function generateKovaResponse(message, moodOverride = null) {

    let mood = moodOverride || KOVA_CONFIG.personality.vibe;

    const templates = {
        friendly: [
            "Got you! Let me check that out.",
            "Sure thing, I can help with that.",
            "Absolutely! Here's what I'm thinking…"
        ],
        smart: [
            "Analyzing… give me one sec.",
            "Based on what I know, here's the best option:",
            "Logically speaking, this is your best move:"
        ],
        stylish: [
            "Ooooh this is giving *aesthetic* vibes. Let me show you.",
            "Hold up — this one's fire.",
            "Let me find something clean and modern for you."
        ],
        hype: [
            "BRO. This is insane — you’ll love this.",
            "Okay hold on, this is actually wild.",
            "You’re gonna freak out in a good way."
        ],
        calm: [
            "No rush. I’ve got you.",
            "Smooth and steady — here’s what works best:",
            "Easy. Here’s a clean option for you."
        ]
    };

    // Pick a set based on mood
    const selected = templates[mood] || templates.friendly;

    // Random line
    const opener = selected[Math.floor(Math.random() * selected.length)];

    return `${opener}\n\n${generateIntelligentResponse(message)}`;
}

/*---------------------------------------------
    SECTION 3 — INTELLIGENCE CORE
----------------------------------------------*/

function generateIntelligentResponse(message) {
    message = message.toLowerCase();

    if (message.includes("amazon")) {
        return "Searching Amazon for the best matches…";
    }

    if (message.includes("outfit") || message.includes("fit")) {
        return "Let me put together a clean outfit recommendation.";
    }

    if (message.includes("recommend")) {
        return "I’ll curate a few options you can check out.";
    }

    if (message.includes("buy") || message.includes("purchase")) {
        return "I can help you buy that — where do you want to order from?";
    }

    if (message.includes("switch vibe") || message.includes("change vibe")) {
        return "Vibe changed — how do you want me to talk now?";
    }

    return "Here’s what I think about that:";
}

/*---------------------------------------------
    SECTION 4 — SHOPPING ENGINE
----------------------------------------------*/

async function findProducts(query, provider = "amazon") {
    return {
        provider,
        query,
        results: [
            { name: "Sample Product 1", price: "$29.99", link: "#" },
            { name: "Sample Product 2", price: "$49.99", link: "#" },
            { name: "Sample Product 3", price: "$19.99", link: "#" },
        ]
    };
}

/*---------------------------------------------
    SECTION 5 — XR / VIRTUAL ASSISTANT HOOKS
----------------------------------------------*/

function onUserEnterXR() {
    return `${KOVA_CONFIG.name} activated in Virtual Space. What do you want to check out first?`;
}

function onAvatarInteraction(action) {
    switch(action) {
        case "wave":
            return "Hey! 👋 What’s up?";
        case "approach":
            return "Come here, I’ve got something to show you.";
        default:
            return "I’m here — what’s next?";
    }
}

/*---------------------------------------------
    SECTION 6 — MAIN KOVA FUNCTION
----------------------------------------------*/

async function Kova(message) {
    const response = generateKovaResponse(message);
    return {
        kova: KOVA_CONFIG.name,
        input: message,
        output: response
    };
}

/*---------------------------------------------
    SECTION 7 — EXPORTS (for future web/app use)
----------------------------------------------*/

if (typeof module !== "undefined") {
    module.exports = {
        Kova,
        KOVA_CONFIG,
        generateKovaResponse,
        findProducts,
        onUserEnterXR,
        onAvatarInteraction
    };
}
