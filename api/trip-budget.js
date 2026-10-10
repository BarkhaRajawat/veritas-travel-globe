
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed. Use POST."
    });
  }

  const {
    destination,
    days,
    travelers,
    hotelPerNight,
    foodPerDay,
    transport,
    activities
  } = req.body || {};

  const numbers = [
    days,
    travelers,
    hotelPerNight,
    foodPerDay,
    transport,
    activities
  ];

  if (
    typeof destination !== "string" ||
    !destination.trim() ||
    !numbers.every(Number.isFinite) ||
    !Number.isInteger(days) ||
    !Number.isInteger(travelers) ||
    days < 1 ||
    travelers < 1 ||
    numbers.slice(2).some((n) => n < 0)
  ) {
    return res.status(400).json({
      error: "Please provide valid trip details and non-negative costs."
    });
  }

  const accommodation = hotelPerNight * days;
  const food = foodPerDay * days * travelers;
  const total = accommodation + food + transport + activities;

  return res.status(200).json({
    destination: destination.trim(),
    days,
    travelers,
    breakdown: {
      accommodation,
      food,
      transport,
      activities
    },
    totalEstimatedCost: total,
    currency: "INR"
  });
}