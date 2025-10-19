export interface SeatDefinition {
  office: string
  jurisdiction: string
  candidates: string[]
}

export const CORE_SEAT_DEFINITIONS: SeatDefinition[] = [
  { office: 'City Council Ward 1', jurisdiction: 'Kennewick', candidates: ['Austin Miller', 'Jason McShane'] },
  { office: 'City Council Ward 2', jurisdiction: 'Kennewick', candidates: ['Loren Anderson'] },
  { office: 'City Council Ward 3', jurisdiction: 'Kennewick', candidates: ['John Trumbo', 'Warren Hughs'] },
  { office: 'City Council Position 4', jurisdiction: 'Kennewick', candidates: ['Brad Klippert', 'Gloria Tyler Baker'] },

  { office: 'City Council District 1', jurisdiction: 'Pasco', candidates: ['Mark Anthony Figueroa'] },
  { office: 'City Council District 3', jurisdiction: 'Pasco', candidates: ['Leo Perales', 'Bryan Verhei'] },
  { office: 'City Council District 4', jurisdiction: 'Pasco', candidates: ['Pete Serrano'] },
  { office: 'City Council District 6', jurisdiction: 'Pasco', candidates: ['Calixto Hernandez', 'Melissa Blasdel'] },

  { office: 'City Council Position 3', jurisdiction: 'Richland', candidates: ['Pat Holten', 'Robert Walko'] },
  { office: 'City Council Position 4', jurisdiction: 'Richland', candidates: ['Donald Landsman', 'John Maier'] },
  { office: 'City Council Position 6', jurisdiction: 'Richland', candidates: ['Kurt H Maier', 'Kyle Saltz'] },
  { office: 'City Council Position 7', jurisdiction: 'Richland', candidates: ['Colin Michael', 'Ryan Whitten'] },

  { office: 'City Council Position 1', jurisdiction: 'West Richland', candidates: ['Nancy Aldrich', 'John Smart'] },
  { office: 'City Council Position 2', jurisdiction: 'West Richland', candidates: ['Ken Stoker'] },
  { office: 'City Council Position 3', jurisdiction: 'West Richland', candidates: ['David Cole', 'Robert Harvey Perkes'] },
  { office: 'City Council Position 4', jurisdiction: 'West Richland', candidates: ['Braden Sloughter', 'Richard Bloom'] },
  { office: 'Mayor', jurisdiction: 'West Richland', candidates: ['Fred Brink', 'May Hays'] },

  { office: 'School Board District 1', jurisdiction: 'Kennewick', candidates: ['Micah Valentine', 'Robert Franklin'] },
  { office: 'School Board District 2', jurisdiction: 'Kennewick', candidates: ['Nic Uhnak', 'Gabe Galbraith'] },

  { office: 'School Board District 3', jurisdiction: 'Pasco', candidates: ['Amanda Brown', 'Steve Christensen'] },
  { office: 'School Board District 4', jurisdiction: 'Pasco', candidates: ['Heather Kubalek'] },
  { office: 'School Board At-Large Position 5', jurisdiction: 'Pasco', candidates: ['Scott Lehrman', 'Valerie Torres'] },

  { office: 'School Board Position 1', jurisdiction: 'Richland', candidates: ['Jacques Bakhazi', 'Bonnie Mitchell'] },
  { office: 'School Board Position 2', jurisdiction: 'Richland', candidates: ['Rick Jansons'] },

  { office: 'Port of Benton Commissioner District 1', jurisdiction: 'Port of Benton', candidates: ['Roy Keck', "Bill O'Neil"] },
  { office: 'Port of Kennewick Commissioner District 2', jurisdiction: 'Port of Kennewick', candidates: ['Raul Contreras Gonzalez', 'Tammy Kenfield'] },

  { office: 'Port of Pasco Commissioner District 2', jurisdiction: 'Port of Pasco', candidates: ['Matt Watkins'] },
  { office: 'Port of Pasco Commissioner District 3', jurisdiction: 'Port of Pasco', candidates: ['Hans-Joachim Engelke'] }
]

export const ADDITIONAL_CANDIDATE_ALIASES: Record<string, string> = {
  'LANDSMAN DONALD C': 'Donald Landsman',
  'FREDERICK T BRINK': 'Fred Brink',
  'KECK,ROY D.': 'Roy Keck',
  'KECK ROY D': 'Roy Keck',
  'SCOTT VALERIE LEHRMAN TORRES': 'Scott Lehrman',
  'ANTHONY E SANCHEZ': 'Tony Sanchez',
  'JOHN H TRUMBO': 'John Trumbo',
  'ROBERT HARVEY PERKES': 'Robert Harvey Perkes',
  'NIC (NICOLAS) UHNAK': 'Nic Uhnak',
  'BRINK, FREDERICK T': 'Fred Brink',
  'HAYS, MAY': 'May Hays',
  'MERRILEE E HAYS': 'May Hays',
  'MERRILEE HAYS': 'May Hays',
  'LEO A PERALES': 'Leo Perales',
  'LEO A. PERALES': 'Leo Perales',
  'LANDSMAN, DONALD C': 'Donald Landsman',
  'KECK ROY D.': 'Roy Keck'
}

export const CANDIDATE_SEAT_MAP = CORE_SEAT_DEFINITIONS.reduce<Record<string, { office: string; jurisdiction: string }>>((acc, seat) => {
  for (const candidate of seat.candidates) {
    acc[candidate.toUpperCase()] = { office: seat.office, jurisdiction: seat.jurisdiction }
  }
  return acc
}, {})

for (const [alias, canonical] of Object.entries(ADDITIONAL_CANDIDATE_ALIASES)) {
  const lookup = CORE_SEAT_DEFINITIONS.find(seat => seat.candidates.some(name => name.toUpperCase() === canonical.toUpperCase()))
  if (lookup) {
    CANDIDATE_SEAT_MAP[alias.toUpperCase()] = { office: lookup.office, jurisdiction: lookup.jurisdiction }
  }
}
