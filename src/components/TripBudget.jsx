
import { useState } from 'react'

export default function TripBudget() {
      console.log('TripBudget component loaded')
  const [form, setForm] = useState({
    destination: '',
    startDate: '',
    endDate: '',
    travelers: 1,
    hotelPerNight: 0,
    foodPerPersonPerDay: 0,
    transportPerDay: 0,
    activitiesPerPerson: 0,
  })

  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function handleChange(e) {
    const { name, value } = e.target

    setForm((previous) => ({
      ...previous,
      [name]: [
        'travelers',
        'hotelPerNight',
        'foodPerPersonPerDay',
        'transportPerDay',
        'activitiesPerPerson',
      ].includes(name)
        ? Number(value)
        : value,
    }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setResult(null)

    if (form.endDate < form.startDate) {
      setError('End date must be on or after the start date.')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Unable to calculate the budget.')
      }

      setResult(data)
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const money = (amount) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount)

  const inputClass =
    'w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-white outline-none focus:border-blue-400'

  const labelClass = 'mb-1 block text-sm text-gray-300'

  return (
    <section 
    id="trip-budget-calculator"
    className="mx-auto my-8 w-full max-w-2xl rounded-2xl border border-white/15 bg-gray-950/95 p-5 text-white shadow-2xl sm:p-7">
      <h2 className="text-2xl font-semibold">Trip Budget Calculator</h2>
      <p className="mb-6 mt-2 text-sm text-gray-400">
        Estimate your travel expenses before you go.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={labelClass} htmlFor="destination">
            Destination
          </label>
          <input
            id="destination"
            className={inputClass}
            name="destination"
            value={form.destination}
            onChange={handleChange}
            placeholder="e.g. Jaipur"
            required
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass} htmlFor="startDate">
              Start date
            </label>
            <input
              id="startDate"
              className={inputClass}
              type="date"
              name="startDate"
              value={form.startDate}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label className={labelClass} htmlFor="endDate">
              End date
            </label>
            <input
              id="endDate"
              className={inputClass}
              type="date"
              name="endDate"
              value={form.endDate}
              onChange={handleChange}
              min={form.startDate || undefined}
              required
            />
          </div>
        </div>

        <div>
          <label className={labelClass} htmlFor="travelers">
            Number of travellers
          </label>
          <input
            id="travelers"
            className={inputClass}
            type="number"
            name="travelers"
            min="1"
            max="100"
            value={form.travelers}
            onChange={handleChange}
            required
          />
        </div>

        <p className="pt-2 text-sm font-medium text-gray-200">
          Estimated costs (in INR)
        </p>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {[
            ['hotelPerNight', 'Hotel per night'],
            ['foodPerPersonPerDay', 'Food per person/day'],
            ['transportPerDay', 'Transport per day'],
            ['activitiesPerPerson', 'Activities per person'],
          ].map(([name, label]) => (
            <div key={name}>
              <label className={labelClass} htmlFor={name}>
                {label} (₹)
              </label>
              <input
                id={name}
                className={inputClass}
                type="number"
                name={name}
                min="0"
                step="1"
                value={form[name]}
                onChange={handleChange}
                required
              />
            </div>
          ))}
        </div>

        {error && (
          <p role="alert" className="text-sm text-red-400">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-blue-600 px-4 py-3 font-medium transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? 'Calculating...' : 'Calculate Budget'}
        </button>
      </form>

      {result && (
        <div aria-live="polite" className="mt-7 border-t border-white/15 pt-5">
          <p className="text-sm text-gray-400">Estimated total</p>
          <p className="mt-1 text-3xl font-bold text-blue-300">
            {money(result.total)}
          </p>
          <p className="mb-5 mt-2 text-sm text-gray-300">
            Per person: {money(result.perPerson)}
          </p>

          <h3 className="mb-3 font-semibold">Expense breakdown</h3>

          <div className="space-y-3">
            {[
              ['Accommodation', result.breakdown.accommodation],
              ['Food', result.breakdown.food],
              ['Transport', result.breakdown.transport],
              ['Activities', result.breakdown.activities],
            ].map(([label, amount]) => (
              <div
                key={label}
                className="flex justify-between gap-4 text-sm"
              >
                <span className="text-gray-300">{label}</span>
                <span>{money(amount)}</span>
              </div>
            ))}
          </div>

          <p className="mt-5 text-xs leading-5 text-gray-400">
            {result.disclaimer}
          </p>
        </div>
      )}
    </section>
  )
}