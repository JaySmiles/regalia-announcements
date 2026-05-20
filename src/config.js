// Regalia Announcements Configuration

export const GOOGLE_SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vS353gf_5__9DF8GxNxwe8ryXOsiUOaqTJBvVTCGxGnMtd_DiKrx-g0EAtAwDswRt0Ki5isg-AHGTvw/pub?output=csv";

// Premium Mock Data to serve as an instant offline/fail-safe fallback
export const MOCK_ANNOUNCEMENTS = [
  {
    name: "Pastor Marcus",
    ambition: "General Fellowship",
    announcement: "Welcome to Regalia Church! We are thrilled to gather together. Join us for Sunday Service at 9:00 AM and 11:00 AM.",
    targetDate: "2026-05-20" // Today
  },
  {
    name: "Sister Sarah",
    ambition: "Worship Team",
    announcement: "Worship team rehearsal will take place this Thursday at 7:00 PM in the Main Sanctuary. All members please attend.",
    targetDate: "2026-05-21" // Tomorrow
  },
  {
    name: "Elder Dave",
    ambition: "Youth Ministry",
    announcement: "Regalia Youth Night is happening this Friday! Games, worship, and group discussions start at 6:30 PM.",
    targetDate: "2026-05-22" // Future
  },
  {
    name: "Sister Jane",
    ambition: "Children's Church",
    announcement: "Teacher training for the Summer curriculum is scheduled for Saturday morning at 9:00 AM in Room 102.",
    targetDate: "2026-05-19" // Yesterday (New, within 48h)
  },
  {
    name: "Pastor Marcus",
    ambition: "Community Outreach",
    announcement: "Our annual food drive was a massive success! Thank you to everyone who volunteered. We served over 200 local families.",
    targetDate: "2026-05-15" // Past (> 2 days ago)
  },
  {
    name: "Brother Caleb",
    ambition: "Men's Ministry",
    announcement: "The Men's Breakfast at the local diner is next Saturday at 8:00 AM. Sign up in the lobby.",
    targetDate: "2026-05-12" // Past (> 2 days ago)
  }
];
