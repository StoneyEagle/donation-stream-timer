# Donation Stream Timer

A simple web-based timer designed for donation streams. This project allows streamers to display a countdown timer on their stream, which can be extended or reset based on donations or other events.

## Features
- Countdown timer display
- Easy to use and customize
- Responsive design for overlay use
- Simple HTML, CSS, and JavaScript implementation

## Getting Started

1. **Clone or download the repository.**
2. Open `index.html` in your browser.
3. Customize the timer settings in `script.js` as needed.

## File Structure
- `index.html` – Main HTML file for the timer UI
- `styles.css` – Styling for the timer
- `script.js` – Timer logic and controls

## Usage
- Add the timer as a browser source in your streaming software (e.g., OBS, Streamlabs).
- Adjust the timer duration and appearance as needed.
- Integrate with donation alerts manually or via custom scripts.

## Customization
- Edit `styles.css` to change the look and feel.
- Modify `script.js` to add features like auto-extension, sound alerts, or integration with donation APIs.

## License
MIT License



*Created for streamers who want a simple, customizable donation timer overlay.*

## Configuration (`setup` object in `script.js`)

The `setup` object at the top of `script.js` lets you customize how the timer works and how much time is added for each event:

- **webSocketUrl**: The WebSocket endpoint for receiving donation/subscription events (e.g., from Streamer.bot or your backend).
- **initialHours**: The starting duration of the timer in hours.

### Kofi Settings
- **kofiDonationTimeIncrement**: Minutes added per $1 donated via Kofi.
- **kofiSubscriptionTimeIncrement**: Flat minutes added per Kofi subscription or resubscription.
- **kofiShopOrderTimeIncrement**: Flat minutes added per Kofi shop order.

### Twitch Settings
- **twitchSubTier1TimeIncrement**: Minutes added for a Tier 1 subscription.
- **twitchSubTier2TimeIncrement**: Minutes added for a Tier 2 subscription.
- **twitchSubTier3TimeIncrement**: Minutes added for a Tier 3 subscription.
- **twitchReSubTier1TimeIncrement**: Minutes added for a Tier 1 resubscription.
- **twitchReSubTier2TimeIncrement**: Minutes added for a Tier 2 resubscription.
- **twitchReSubTier3TimeIncrement**: Minutes added for a Tier 3 resubscription.
- **twitchGiftSubTimeIncrement**: Minutes added per gifted subscription.
- **twitchSharedChatSubTimeIncrement**: Minutes added for a shared chat subscription.
- **twitchSharedChatResubTimeIncrement**: Minutes added for a shared chat resubscription.
- **twitchSharedChatSubGiftTimeIncrement**: Minutes added for a shared chat gifted subscription.
- **twitchCheerTimeIncrement**: Function to calculate minutes added per bits cheered (default: 1 minute per 100 bits).

You can adjust these values in `script.js` to fit your stream’s needs.
