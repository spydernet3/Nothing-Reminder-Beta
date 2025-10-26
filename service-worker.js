// This function runs on page load and on data save (according to your snippet)
function checkNotifications() {
    if (Notification.permission !== "granted") {
        return;
    }

    // --- REMINDERS LOGIC ---
    appData.reminders.forEach(r => {
        // Assuming you have a function daysLeft that returns days remaining
        const diff = daysLeft(r.endDate); 
        
        // This is the detailed logic that generates the specific text
        if (diff === 0) {
            new Notification(`⏰ Reminder Due Today: ${r.title}`, {
                body: "This reminder expires today.",
                icon: 'assets/icon.png'
            });
        } else if (diff < 0 && r.status !== 'complete') { // Expired
            new Notification(`⚠️ Reminder Expired: ${r.title}`, {
                body: "Check your expired reminders!",
                icon: 'assets/icon.png'
            });
        }
    });
    
    // --- Repeat similar detailed logic for NOTES, BUDGET, CHECKLIST here ---
    // Example: Budget
    appData.budget.forEach(b => {
        const isAlert = checkBudgetAlert(b); // Placeholder for your complex check
        if (isAlert) {
             new Notification(`💰 Budget Alert: ${b.title}`, {
                body: `Your daily limit is ₹${b.costPerDay} for ${b.daysLeft} days.`,
                icon: 'assets/icon.png'
            });
        }
    });
    
    // ... other checks ...
}
