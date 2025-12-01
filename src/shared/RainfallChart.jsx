import React from 'react'
import { Bar } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend)

export default function RainfallChart({ data }){
  const labels = data?.labels || ['-6','-5','-4','-3','-2','-1','Today']
  const values = data?.values || [2,5,0,12,0,3,8]
  const chartData = {
    labels,
    datasets: [{ label: 'Rainfall (mm)', data: values, backgroundColor: 'rgba(14,165,164,0.8)' }]
  }
  return (
    <div className="glass-card p-3">
      <Bar data={chartData} />
    </div>
  )
}
