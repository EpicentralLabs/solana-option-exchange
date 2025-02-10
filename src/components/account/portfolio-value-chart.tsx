'use client'

import { useState } from "react"
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useGetHistoricalBalances } from "./account-data-access"
import { PublicKey } from "@solana/web3.js"
import { useWallet } from "@solana/wallet-adapter-react"

// Helper to generate dates
const generatePastDate = (daysAgo: number) => {
  const date = new Date()
  date.setDate(date.getDate() - daysAgo)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// Helper to generate YTD dates for 2025
const generateYTDDate = (dayOffset: number) => {
  const startDate = new Date(2025, 0, 1)
  const date = new Date(startDate)
  date.setDate(startDate.getDate() + dayOffset)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// Mock data for rolling 30 days
const thirtyDayData = Array.from({ length: 30 }, (_, i) => ({
  date: generatePastDate(29 - i),
  sol: 2.8366 + (Math.random() - 0.5) * 0.2 // Smaller fluctuation for more realistic data
})).map(item => ({
  ...item,
  sol: Number(item.sol.toFixed(4))
}))

// Mock data for 2025 YTD
const ytdData = Array.from({ length: getDaysInYTD() }, (_, i) => ({
  date: generateYTDDate(i),
  sol: 2.8366 + (Math.random() - 0.5) * 0.3
})).map(item => ({
  ...item,
  sol: Number(item.sol.toFixed(4))
}))

type TimeRange = '30D' | 'YTD'

export function PortfolioValueChart() {
  const [timeRange, setTimeRange] = useState<TimeRange>('30D')
  const { publicKey } = useWallet()
  const historicalBalances = useGetHistoricalBalances({ 
    address: publicKey as PublicKey 
  })

  // Process the data based on selected time range
  const data = historicalBalances.data?.filter(item => {
    if (!item) return false
    const itemDate = new Date(item.date)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    if (timeRange === '30D') {
      return itemDate >= thirtyDaysAgo
    } else {
      const startOfYear = new Date(2025, 0, 1)
      return itemDate >= startOfYear
    }
  })

  if (historicalBalances.isLoading) {
    return (
      <Card className="border-0 mb-8">
        <CardContent className="flex items-center justify-center h-[300px]">
          <div className="text-muted-foreground">Loading balance history...</div>
        </CardContent>
      </Card>
    )
  }

  if (historicalBalances.isError) {
    return (
      <Card className="border-0 mb-8">
        <CardContent className="flex items-center justify-center h-[300px]">
          <div className="text-red-500">Error loading balance history</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-0 mb-8">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-xl font-semibold">Portfolio Balance History</CardTitle>
        <div className="flex gap-2">
          <Button 
            variant={timeRange === '30D' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTimeRange('30D')}
            className="text-sm"
          >
            30D
          </Button>
          <Button 
            variant={timeRange === 'YTD' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTimeRange('YTD')}
            className="text-sm"
          >
            YTD
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full mt-4">
          {data && data.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <XAxis 
                  dataKey="date"
                  stroke="#888888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  interval={timeRange === 'YTD' ? 30 : 4}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                  dy={16}
                />
                <YAxis
                  stroke="#888888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `${value.toFixed(4)} SOL`}
                  domain={['auto', 'auto']}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="rounded-lg border bg-background p-2 shadow-sm">
                          <div className="flex flex-col">
                            <span className="text-[0.70rem] uppercase text-muted-foreground">
                              {payload[0].payload.date}
                            </span>
                            <span className="font-bold text-muted-foreground">
                              {payload[0].value.toFixed(4)} SOL
                            </span>
                          </div>
                        </div>
                      )
                    }
                    return null
                  }}
                />
                <Bar
                  dataKey="sol"
                  fill="#4a85ff"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={50}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              No transaction history found
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function getDaysInYTD() {
  const start = new Date(2025, 0, 1)
  const today = new Date()
  const millisecondsPerDay = 1000 * 60 * 60 * 24
  return Math.floor((today.getTime() - start.getTime()) / millisecondsPerDay)
} 