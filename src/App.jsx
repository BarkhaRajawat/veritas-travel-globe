// // import { useEffect } from 'react'
// // import Globe from './components/Globe'
// // import CountryPanel from './components/CountryPanel'
// // import TopNav from './components/TopNav'
// // import HeatmapLegend from './components/HeatmapLegend'
// // import LandingOverlay from './components/LandingOverlay'
// // import { loadAdvisoryMap } from './utils/advisory'
// // import useGlobeStore from './store'
// // import TripBudget from './components/TripBudget'

// // export default function App() {
// //   const setAdvisoryMap = useGlobeStore((s) => s.setAdvisoryMap)

// //   useEffect(() => {
// //     loadAdvisoryMap().then(setAdvisoryMap)
// //   }, [setAdvisoryMap])

// //   return (
// //     <div className="relative w-screen h-screen bg-black overflow-hidden">
// //       <Globe />
// //       <CountryPanel />
// //       <TopNav />
// //       <HeatmapLegend />
// //       <TripBudget />
// //       <LandingOverlay />
// //     </div>
// //   )
// // }



import { useEffect } from 'react'
import Globe from './components/Globe'
import CountryPanel from './components/CountryPanel'
import TopNav from './components/TopNav'
import HeatmapLegend from './components/HeatmapLegend'
import LandingOverlay from './components/LandingOverlay'
import TripBudget from './components/TripBudget'
import { loadAdvisoryMap } from './utils/advisory'
import useGlobeStore from './store'

export default function App() {
  const setAdvisoryMap = useGlobeStore((s) => s.setAdvisoryMap)

  useEffect(() => {
    loadAdvisoryMap().then(setAdvisoryMap)
  }, [setAdvisoryMap])

  function openCalculator() {
    document.getElementById('trip-budget')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })
  }

  return (
    <main className="min-h-screen w-full overflow-x-hidden bg-black text-white">
      <section className="relative h-screen min-h-[600px] w-full overflow-hidden">
        <Globe />
        <CountryPanel />
        <TopNav />
        <HeatmapLegend />
        <LandingOverlay />

       
      </section>

      <section
        id="trip-budget"
        className="relative z-50 min-h-screen w-full scroll-mt-4 bg-black px-4 py-10 sm:px-8"
      >
        <TripBudget />
      </section>
    </main>
  )
}



