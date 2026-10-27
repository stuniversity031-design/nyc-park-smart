export type Borough = "Manhattan" | "Brooklyn" | "Queens" | "Bronx" | "Staten Island" | "Unknown";

export function getBoroughFromZip(zip: string): Borough {
  const z = parseInt(zip);
  if (z >= 10001 && z <= 10282) return "Manhattan";
  if (z >= 10301 && z <= 10314) return "Staten Island";
  if (z >= 10451 && z <= 10475) return "Bronx";
  if (z >= 11004 && z <= 11109) return "Queens";
  if (z >= 11351 && z <= 11697) return "Queens";
  if (z >= 11201 && z <= 11256) return "Brooklyn";
  if (z >= 11201 && z <= 11239) return "Brooklyn";
  if (z >= 11368 && z <= 11385) return "Queens";
  if (z >= 11411 && z <= 11436) return "Queens";
  if (z >= 11691 && z <= 11697) return "Queens";
  return "Unknown";
}

export const GARAGES: Record<string, { name: string; rate: string; dist: string; hours: string }[]> = {
  Manhattan: [
    { name: "Icon Parking — W 75th St", rate: "$18/hr", dist: "0.2 mi", hours: "24hr" },
    { name: "QuickPark — W 72nd St", rate: "$14/hr", dist: "0.4 mi", hours: "7am–11pm" },
    { name: "Central Park Garage", rate: "$22/hr", dist: "0.5 mi", hours: "24hr" },
  ],
  Brooklyn: [
    { name: "Willoughby Parking — Downtown BK", rate: "$12/hr", dist: "0.3 mi", hours: "24hr" },
    { name: "Fulton Mall Garage", rate: "$10/hr", dist: "0.5 mi", hours: "7am–10pm" },
    { name: "Atlantic Terminal Garage", rate: "$15/hr", dist: "0.6 mi", hours: "24hr" },
  ],
  Queens: [
    { name: "LGA Airport Garage", rate: "$10/hr", dist: "1.2 mi", hours: "24hr" },
    { name: "Queens Center Parking", rate: "$8/hr", dist: "0.4 mi", hours: "8am–10pm" },
    { name: "Jamaica Station Garage", rate: "$7/hr", dist: "0.8 mi", hours: "6am–midnight" },
  ],
  Bronx: [
    { name: "Yankee Stadium Garage", rate: "$25/event", dist: "0.3 mi", hours: "Event days" },
    { name: "Fordham Plaza Parking", rate: "$9/hr", dist: "0.5 mi", hours: "7am–9pm" },
    { name: "Cross County Garage", rate: "$8/hr", dist: "1.0 mi", hours: "24hr" },
  ],
  "Staten Island": [
    { name: "St. George Terminal Lot", rate: "$5/hr", dist: "0.2 mi", hours: "24hr" },
    { name: "Empire Outlets Garage", rate: "$6/hr", dist: "0.3 mi", hours: "9am–9pm" },
    { name: "Richmond County Parking", rate: "$4/hr", dist: "0.6 mi", hours: "8am–8pm" },
  ],
  Unknown: [
    { name: "Icon Parking — W 75th St", rate: "$18/hr", dist: "0.2 mi", hours: "24hr" },
    { name: "QuickPark — W 72nd St", rate: "$14/hr", dist: "0.4 mi", hours: "7am–11pm" },
    { name: "Central Park Garage", rate: "$22/hr", dist: "0.5 mi", hours: "24hr" },
  ],
};

export const METERS: Record<string, { street: string; hours: string; dist: string }[]> = {
  Manhattan: [
    { street: "W 74th St (North)", hours: "Mon–Sat 8am–7pm", dist: "0.1 mi" },
    { street: "Amsterdam Ave", hours: "Mon–Sat 8am–10pm", dist: "0.2 mi" },
    { street: "W 72nd St (South)", hours: "Mon–Sat 8am–7pm", dist: "0.3 mi" },
  ],
  Brooklyn: [
    { street: "Flatbush Ave", hours: "Mon–Sat 8am–6pm", dist: "0.1 mi" },
    { street: "Atlantic Ave (East)", hours: "Mon–Sat 8am–7pm", dist: "0.2 mi" },
    { street: "DeKalb Ave", hours: "Mon–Sat 9am–7pm", dist: "0.3 mi" },
  ],
  Queens: [
    { street: "Jamaica Ave", hours: "Mon–Sat 8am–6pm", dist: "0.2 mi" },
    { street: "Queens Blvd", hours: "Mon–Sat 8am–7pm", dist: "0.3 mi" },
    { street: "Northern Blvd", hours: "Mon–Fri 8am–6pm", dist: "0.4 mi" },
  ],
  Bronx: [
    { street: "Grand Concourse", hours: "Mon–Sat 8am–7pm", dist: "0.2 mi" },
    { street: "Fordham Rd", hours: "Mon–Sat 8am–6pm", dist: "0.3 mi" },
    { street: "E Tremont Ave", hours: "Mon–Fri 9am–6pm", dist: "0.5 mi" },
  ],
  "Staten Island": [
    { street: "Bay St", hours: "Mon–Sat 9am–6pm", dist: "0.2 mi" },
    { street: "Victory Blvd", hours: "Mon–Sat 8am–6pm", dist: "0.4 mi" },
    { street: "Richmond Ave", hours: "Mon–Fri 9am–5pm", dist: "0.6 mi" },
  ],
  Unknown: [
    { street: "W 74th St (North)", hours: "Mon–Sat 8am–7pm", dist: "0.1 mi" },
    { street: "Amsterdam Ave", hours: "Mon–Sat 8am–10pm", dist: "0.2 mi" },
    { street: "W 72nd St (South)", hours: "Mon–Sat 8am–7pm", dist: "0.3 mi" },
  ],
};
