
export default function handler(req, res) {
  // 1. Allow POST requests only
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");

    return res.status(405).json({
      success: false,
      error: "Method not allowed. Use POST.",
    });
  }

  // 2. Read the incoming data
  const {
    destination,
    startDate,
    endDate,
    travelers,
    hotelPerNight,
    foodPerPersonPerDay,
    transportPerDay,
    activitiesPerPerson,
  } = req.body ?? {};

  // 3. Validate destination and dates
  if (
    typeof destination !== "string" ||
    !destination.trim() ||
    destination.trim().length > 100 ||
    typeof startDate !== "string" ||
    typeof endDate !== "string"
  ) {
    return res.status(400).json({
      success: false,
      error: "Enter a valid destination and travel dates.",
    });
  }

  // 4. Validate dates strictly
  const start = new Date(`${startDate}T00:00:00Z`);
  const end = new Date(`${endDate}T00:00:00Z`);

  if (
    Number.isNaN(start.getTime()) ||
    Number.isNaN(end.getTime()) ||
    start.toISOString().slice(0, 10) !== startDate ||
    end.toISOString().slice(0, 10) !== endDate ||
    end <= start
  ) {
    return res.status(400).json({
      success: false,
      error: "End date must be after the start date.",
    });
  }

  // 5. Validate number of travellers and expenses
  const costs = [
    hotelPerNight,
    foodPerPersonPerDay,
    transportPerDay,
    activitiesPerPerson,
  ];

  if (
    typeof travelers !== "number" ||
    !Number.isInteger(travelers) ||
    travelers < 1 ||
    travelers > 20 ||
    !costs.every(
      (cost) =>
        typeof cost === "number" &&
        Number.isFinite(cost) &&
        cost >= 0 &&
        cost <= 1000000
    )
  ) {
    return res.status(400).json({
      success: false,
      error: "Enter valid costs and 1–20 travellers.",
    });
  }

  // 6. Calculate trip duration
  const millisecondsPerDay = 24 * 60 * 60 * 1000;
  const days = (end - start) / millisecondsPerDay;
  const nights = days;

  // 7. Calculate each expense category
  const breakdown = {
    accommodation: hotelPerNight * nights,
    food: foodPerPersonPerDay * travelers * days,
    transport: transportPerDay * days,
    activities: activitiesPerPerson * travelers,
  };

  const total = Object.values(breakdown).reduce(
    (sum, cost) => sum + cost,
    0
  );

  // Protect against overflow from very large valid inputs.
  if (!Number.isFinite(total)) {
    return res.status(400).json({
      success: false,
      error: "The calculated trip cost is too large.",
    });
  }

  // 8. Send the result back to the client
  return res.status(200).json({
    success: true,
    destination: destination.trim(),
    startDate,
    endDate,
    days,
    nights,
    travelers,
    currency: "INR",
    breakdown,
    total,
    perPerson: Math.round((total / travelers) * 100) / 100,
    disclaimer:
      "Estimates are based on your inputs, not live travel prices.",
  });
}