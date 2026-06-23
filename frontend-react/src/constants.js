// The 8 canonical franchises the model was trained on. We show ONLY these in the
// predictor dropdowns. (The notebook left some old names like "Deccan Chargers"
// in the delivery-level data, but the model's meaningful predictions are for the
// current 8 teams, so we constrain the UI to them.)
export const TEAMS = [
  "Chennai Super Kings",
  "Delhi Capitals",
  "Kings XI Punjab",
  "Kolkata Knight Riders",
  "Mumbai Indians",
  "Rajasthan Royals",
  "Royal Challengers Bangalore",
  "Sunrisers Hyderabad",
];

// Host cities present in the training data. These are the values the model's
// city encoder recognizes; picking from this list avoids unseen-category issues.
export const CITIES = [
  "Abu Dhabi",
  "Ahmedabad",
  "Bangalore",
  "Bengaluru",
  "Bloemfontein",
  "Cape Town",
  "Centurion",
  "Chandigarh",
  "Chennai",
  "Cuttack",
  "Delhi",
  "Dharamsala",
  "Dubai",
  "Durban",
  "East London",
  "Guwahati",
  "Hyderabad",
  "Indore",
  "Jaipur",
  "Johannesburg",
  "Kimberley",
  "Kolkata",
  "Mumbai",
  "Nagpur",
  "Navi Mumbai",
  "Port Elizabeth",
  "Pune",
  "Raipur",
  "Ranchi",
  "Sharjah",
  "Visakhapatnam",
];

// Short codes for compact display (used on the win-probability bar, chips, etc.)
export const TEAM_SHORT = {
  "Chennai Super Kings": "CSK",
  "Delhi Capitals": "DC",
  "Kings XI Punjab": "PBKS",
  "Kolkata Knight Riders": "KKR",
  "Mumbai Indians": "MI",
  "Rajasthan Royals": "RR",
  "Royal Challengers Bangalore": "RCB",
  "Sunrisers Hyderabad": "SRH",
};
