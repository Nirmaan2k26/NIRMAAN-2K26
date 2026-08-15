AUCTION ARENA — ADMIN MANAGER + TEAM VIEWER

Base:
This build is made directly from the uploaded Auction_Arena_FINAL_LOGIC_SYNC(1).zip.
Existing Excel import, player search, team management, auction, sold history, edit/delete,
team summary and winner logic are preserved.

Added:
- Admin Manager label and Team Viewer link.
- Team PIN field when adding a team.
- Team Viewer with team selection + PIN.
- Team View budget, purchased players, player count and remaining slots.
- Team-full message when 4 players are purchased.
- Budget-complete message when remaining budget reaches 0.
- Automatic removal of complete teams (4 players OR 0 budget) from the Admin Auction team dropdown.
- Auction Complete / Resume status.
- Final ranking and winner celebration in Team View after Admin completes the auction.
- Team View refreshes automatically from the same browser localStorage state.

Important:
This static build shares state between pages/tabs on the same browser/origin. A true multi-device
live link requires a shared backend/database; that is not added here so the original app logic remains intact.
