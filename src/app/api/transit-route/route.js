export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const origin = searchParams.get('origin');
    const destination = searchParams.get('destination');
    
    if (!origin || !destination) {
      return Response.json({ error: 'Origin and destination are required' }, { status: 400 });
    }

    // Set departure time to next Monday at 11:00 AM
    const now = new Date();
    const nextMonday = new Date();
    const daysUntilMonday = (1 + 7 - now.getDay()) % 7 || 7; // Get days until next Monday
    nextMonday.setDate(now.getDate() + daysUntilMonday);
    nextMonday.setHours(11, 0, 0, 0); // Set to 11:00 AM
    
    const departureTime = Math.floor(nextMonday.getTime() / 1000); // Convert to Unix timestamp

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&mode=transit&departure_time=${departureTime}&key=${apiKey}`;

    const response = await fetch(url);
    const data = await response.json();

    if (!data.routes || data.routes.length === 0) {
      return Response.json({ firstTrainStation: null, lastTrainStation: null });
    }

    const trainStations = [];

    data.routes.forEach((route) => {
      route.legs.forEach((leg) => {
        leg.steps.forEach((step) => {
          if (step.travel_mode === "TRANSIT" && 
              step.transit_details?.line?.vehicle?.type === "HEAVY_RAIL") {
            trainStations.push({
              departure: step.transit_details.departure_stop.name,
              arrival: step.transit_details.arrival_stop.name,
            });
          }
        });
      });
    });

    // Return only first and last train stations
    if (trainStations.length > 0) {
      const result = {
        firstTrainStation: trainStations[0].departure,
        lastTrainStation: trainStations[trainStations.length - 1].arrival
      };
      return Response.json(result);
    }

    return Response.json({ firstTrainStation: null, lastTrainStation: null });
    
  } catch (error) {
    console.error('Error in transit route API:', error);
    return Response.json({ error: 'Failed to get transit route' }, { status: 500 });
  }
}