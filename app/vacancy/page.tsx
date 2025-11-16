import dynamic from 'next/dynamic'

const VacancyClient = dynamic(() => import('./VacancyClient'), { ssr: false })

export default function VacancyPage() {
  return <VacancyClient />
}
