// A curated list of UK towns and cities used for the area picker.
// Keeping this as a fixed list, rather than free text, guarantees two
// people who mean the same place always match exactly for group formation.
// Not exhaustive. Add to this list as real signups reveal gaps, this is
// meant to grow with actual usage rather than trying to be complete on day one.

export const UK_TOWNS = [
  "Aberdeen", "Ashford", "Barnsley", "Basildon", "Basingstoke", "Bath",
  "Bedford", "Belfast", "Birmingham", "Blackburn", "Blackpool", "Bolton",
  "Bournemouth", "Bradford", "Brighton", "Bristol", "Bromley", "Cambridge",
  "Canterbury", "Cardiff", "Carlisle", "Chelmsford", "Cheltenham", "Chester",
  "Colchester", "Coventry", "Crawley", "Croydon", "Darlington", "Derby",
  "Doncaster", "Dundee", "Durham", "Eastbourne", "Edinburgh", "Enfield",
  "Exeter", "Gateshead", "Glasgow", "Gloucester", "Guildford", "Halifax",
  "Harlow", "Harrow", "Hastings", "Hemel Hempstead", "High Wycombe",
  "Huddersfield", "Hull", "Ilford", "Inverness", "Ipswich", "Kingston upon Thames",
  "Leeds", "Leicester", "Lincoln", "Liverpool", "Llandudno", "London",
  "Luton", "Maidstone", "Manchester", "Mansfield", "Middlesbrough",
  "Milton Keynes", "Newcastle upon Tyne", "Newport", "Northampton",
  "Norwich", "Nottingham", "Oldham", "Oxford", "Peterborough", "Plymouth",
  "Poole", "Portsmouth", "Preston", "Reading", "Redbridge", "Romford",
  "Rotherham", "Salford", "Sheffield", "Slough", "Southampton",
  "Southend-on-Sea", "St Albans", "Stevenage", "Stockport", "Stoke-on-Trent",
  "Sunderland", "Sutton", "Swansea", "Swindon", "Taunton", "Telford",
  "Tollgate", "Torquay", "Truro", "Twickenham", "Wakefield", "Walthamstow",
  "Warrington", "Watford", "West Bromwich", "Wigan", "Winchester",
  "Wolverhampton", "Worcester", "Worthing", "York",
] as const;

export type UkTown = (typeof UK_TOWNS)[number];
