"use client"

import { useState, useEffect, useReducer } from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { ChevronDown, Filter, RefreshCw } from "lucide-react"
import { OptionsChainTable } from "./OptionsChainTable"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { OrdersContainer } from "./OrdersContainer"
import { OptionOrder } from "@/types/order"
import { v4 as uuidv4 } from 'uuid'
import { useWallet } from '@solana/wallet-adapter-react'
import { Keypair, PublicKey } from '@solana/web3.js'
import { EXPIRATION_DATES } from "@/lib/constants"
import { getTokenPrice } from '@/lib/birdeye'
import { usePageVisibility } from '@/hooks/usePageVisibility'
import { getPriceFromStorage, storePriceData } from '@/lib/priceStorage'

interface OptionParameter {
  id: string
  name: string
  visible: boolean
  required?: boolean
}

const defaultParameters: OptionParameter[] = [
  { id: "bid", name: "Bid", visible: true, required: true },
  { id: "ask", name: "Ask", visible: true, required: true },
  { id: "volume", name: "Volume", visible: true, required: true },
  { id: "oi", name: "OI", visible: true },
  { id: "iv", name: "IV", visible: true },
  { id: "delta", name: "Delta", visible: true },
  { id: "theta", name: "Theta", visible: true },
  { id: "gamma", name: "Gamma", visible: false },
  { id: "vega", name: "Vega", visible: false },
  { id: "rho", name: "Rho", visible: false }
]

// Define available underlying assets
const underlyingAssets = [
  { value: "SOL", label: "Solana (SOL)" },
  { value: "LABS", label: "Epicentral Labs (LABS)" },
]

interface MarketPrices {
  [key: string]: {
    bid: number;
    ask: number;
  }
}

interface PriceState {
  currentPrice: number | null;
  previousPrice: number | null;
  priceChange24h: number;
  isLoading: boolean;
  initialLoad: boolean;
}

const priceReducer = (state: PriceState, action: any) => {
  switch (action.type) {
    case 'UPDATE_PRICE':
      return {
        ...state,
        previousPrice: state.currentPrice ?? 0,
        currentPrice: action.price,
        priceChange24h: action.priceChange24h,
        isLoading: false,
        initialLoad: false
      };
    default:
      return state;
  }
};

export function OptionsChain() {
  const [parameters, setParameters] = useState<OptionParameter[]>(defaultParameters)
  const [selectedAsset, setSelectedAsset] = useState("SOL")
  const [selectedExpiry, setSelectedExpiry] = useState(EXPIRATION_DATES[0].value)
  const [orders, setOrders] = useState<OptionOrder[]>([])
  const { publicKey } = useWallet()
  const [limitPrices, setLimitPrices] = useState<Record<string, number>>({})
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [marketPrices, setMarketPrices] = useState<MarketPrices>({})
  const [priceState, dispatch] = useReducer(priceReducer, {
    currentPrice: null,
    previousPrice: null,
    priceChange24h: 0,
    isLoading: true,
    initialLoad: true
  })
  const [isTableRefreshing, setIsTableRefreshing] = useState(false)
  const [priceChangeDirection, setPriceChangeDirection] = useState<'up' | 'down' | null>(null)
  const isPageVisible = usePageVisibility()
  
  // Get current price data based on selected asset
  const currentPriceData = {
    price: priceState.currentPrice ?? 0,
    change: priceState.priceChange24h,
    direction: priceState.priceChange24h >= 0 ? 'up' as const : 'down' as const
  }

  // Calculate height based on number of strikes
  const tableHeight = Math.min(600, 10 * 42 + 50); // 10 strikes * 42px per row + 50px buffer

  const toggleParameter = (id: string) => {
    const parameter = parameters.find(p => p.id === id)
    if (parameter?.required) return // Don't toggle if required

    setParameters(
      parameters.map(param =>
        param.id === id ? { ...param, visible: !param.visible } : param
      )
    )
  }

  const handleOrderCreate = (orderData: Omit<OptionOrder, 'publicKey' | 'timestamp' | 'owner' | 'status'>) => {
    if (!publicKey) {
      console.error('Wallet not connected')
      return
    }

    // Check if this order type already exists
    const existingOrder = orders.find(order => 
      order.strike === orderData.strike && 
      order.optionSide === orderData.optionSide && 
      order.type === orderData.type
    )

    if (existingOrder) {
      // If it exists, increment its quantity
      handleUpdateQuantity(existingOrder.publicKey.toString(), (existingOrder.size || 1) + 1)
      return
    }

    if (orders.length >= 4) {
      console.error('Maximum number of legs reached')
      return
    }

    const newOrder: OptionOrder = {
      ...orderData,
      publicKey: new PublicKey(Keypair.generate().publicKey),
      timestamp: new Date(),
      owner: publicKey,
      status: 'pending',
      size: 1,
      bidPrice: orderData.type === 'buy' ? orderData.price : orderData.price * 0.95, // Example bid price
      askPrice: orderData.type === 'buy' ? orderData.price * 1.05 : orderData.price, // Example ask price
    }
    setOrders((prev) => [newOrder, ...prev])
  }

  const handleUpdateQuantity = (publicKey: string, newSize: number) => {
    setOrders(prev => prev.map(order => 
      order.publicKey.toString() === publicKey 
        ? { ...order, size: newSize }
        : order
    ))
  }

  const handleRemoveOrder = (publicKey: string) => {
    setOrders((prev) => prev.filter((order) => order.publicKey.toString() !== publicKey))
  }

  const handleLimitPriceUpdate = (publicKey: string, price: number) => {
    setLimitPrices(prev => ({
      ...prev,
      [publicKey]: price
    }))
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      // Fetch latest market prices
      const latestPrices = await fetchLatestMarketPrices() // You'll need to implement this
      setMarketPrices(latestPrices)
      
      // Update orders with new prices
      setOrders(prevOrders => prevOrders.map(order => {
        const orderKey = `${order.optionSide}-${order.strike}`
        const latestPrices = marketPrices[orderKey]
        if (latestPrices) {
          return {
            ...order,
            price: order.type === 'buy' ? latestPrices.ask : latestPrices.bid,
            bidPrice: latestPrices.bid,
            askPrice: latestPrices.ask
          }
        }
        return order
      }))

      // Revalidate all current limit orders with new prices
      orders.forEach(order => {
        const publicKey = order.publicKey.toString()
        const currentLimitPrice = limitPrices[publicKey]
        if (currentLimitPrice) {
          handleLimitPriceUpdate(publicKey, Number(currentLimitPrice))
        }
      })
    } catch (error) {
      console.error('Failed to refresh market prices:', error)
    } finally {
      setIsRefreshing(false)
    }
  }

  const fetchLatestMarketPrices = async (): Promise<MarketPrices> => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // Generate mock updated prices
    const mockPrices: MarketPrices = {}
    
    // For each existing order, generate new prices
    orders.forEach(order => {
      const key = `${order.optionSide}-${order.strike}`
      const randomChange = (Math.random() - 0.5) * 0.5 // -0.25 to +0.25 change
      
      mockPrices[key] = {
        bid: order.bidPrice * (1 + randomChange),
        ask: order.askPrice * (1 + randomChange)
      }
    })
    
    return mockPrices
  }

  // Initialize with stored data if available
  useEffect(() => {
    const storedData = getPriceFromStorage(selectedAsset)
    if (storedData) {
      dispatch({ 
        type: 'UPDATE_PRICE', 
        price: storedData.price, 
        priceChange24h: storedData.priceChange24h 
      })
    }
  }, [selectedAsset])

  useEffect(() => {
    let intervalId: NodeJS.Timeout
    let isSubscribed = true

    const fetchPrice = async () => {
      if (!isPageVisible) return
      
      try {
        const priceData = await getTokenPrice(selectedAsset)
        if (priceData && isSubscribed) {
          dispatch({ 
            type: 'UPDATE_PRICE', 
            price: priceData.price, 
            priceChange24h: priceData.priceChange24h 
          });
          
          storePriceData(selectedAsset, {
            price: priceData.price,
            priceChange24h: priceData.priceChange24h,
            timestamp: Date.now()
          })
        }
      } catch (error) {
        console.error('Error fetching price:', error)
      }
    }

    if (isPageVisible) {
      fetchPrice()
      intervalId = setInterval(fetchPrice, 5000)
    }

    return () => {
      isSubscribed = false
      if (intervalId) clearInterval(intervalId)
    }
  }, [selectedAsset, isPageVisible])

  const PriceDigit = ({ 
    currentDigit, 
    previousDigit, 
    isNumber,
    isPartOfChangedSegment
  }: { 
    currentDigit: string
    previousDigit?: string
    isNumber: boolean
    isPartOfChangedSegment: boolean
  }) => {
    const direction = isPartOfChangedSegment && previousDigit 
      ? (Number(currentDigit) > Number(previousDigit) ? 'up' : 'down') 
      : null

    if (!isNumber) return <span>{currentDigit}</span>

    return (
      <span className={isPartOfChangedSegment ? (direction === 'up' ? 'price-flash-up' : 'price-flash-down') : ''}>
        {currentDigit}
      </span>
    )
  }

  const formatPriceWithAnimation = (currentPrice: number | null, previousPrice: number | null, symbol: string) => {
    if (!currentPrice) return '--.--'
    
    const formatNumber = (num: number) => {
      return num.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: symbol === 'SOL' ? 2 : 6
      })
    }

    const current = formatNumber(currentPrice)

    // Always create a new span element with a unique key to force re-render
    return (
      <span 
        key={`price-${currentPrice}-${Date.now()}`} 
        className={`tabular-nums ${currentPrice !== previousPrice ? `price-flash-${currentPrice > (previousPrice ?? 0) ? 'up' : 'down'}` : ''}`}
      >
        ${current}
      </span>
    )
  }

  const handleTableRefresh = async () => {
    setIsTableRefreshing(true)
    try {
      const priceData = await getTokenPrice(selectedAsset)
      if (priceData) {
        dispatch({ 
          type: 'UPDATE_PRICE', 
          price: priceData.price, 
          priceChange24h: priceData.priceChange24h 
        })
      }
    } catch (error) {
      console.error('Error refreshing data:', error)
    } finally {
      setIsTableRefreshing(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        {/* Left side - Price and Asset Selector */}
        <div className="flex flex-col gap-2">
          <div className="flex flex-col">
            {priceState.initialLoad && priceState.isLoading ? (
              <div className="h-9 animate-pulse bg-muted rounded" />
            ) : (
              <>
                <h2 className="text-3xl font-bold">
                  {formatPriceWithAnimation(priceState.currentPrice, priceState.previousPrice, selectedAsset)}
                </h2>
                <span className={`text-sm font-medium mb-2 ${
                  priceState.priceChange24h >= 0 ? 'text-green-500' : 'text-red-500'
                }`}>
                  {priceState.priceChange24h >= 0 ? '↑' : '↓'} {
                    Math.abs(priceState.priceChange24h).toFixed(2)
                  }%
                </span>
              </>
            )}
          </div>
          <Select
            value={selectedAsset}
            onValueChange={setSelectedAsset}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select asset" />
            </SelectTrigger>
            <SelectContent>
              {underlyingAssets.map((asset) => (
                <SelectItem key={asset.value} value={asset.value}>
                  {asset.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Right side - Expiration and Filter */}
        <div className="flex flex-col">
          <div className="flex items-end gap-2 justify-end">
            <div className="flex flex-col gap-1">
              <TooltipProvider delayDuration={100}>
                <Tooltip>
                  <div className="flex items-center">
                    <TooltipTrigger className="text-sm border-b border-dotted border-muted-foreground hover:border-primary cursor-help">
                      Expiration Date
                    </TooltipTrigger>
                    <span className="text-sm">:</span>
                  </div>
                  <TooltipContent>
                    <p className="max-w-xs">
                      The date when the option contract expires and becomes invalid.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <Select
                value={selectedExpiry}
                onValueChange={setSelectedExpiry}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Select date" />
                </SelectTrigger>
                <SelectContent>
                  {EXPIRATION_DATES.map((date) => (
                    <SelectItem key={date.value} value={date.value}>
                      {date.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="flex h-9 w-10 items-center justify-center rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground cursor-pointer">
                  <Filter className="h-4 w-4" />
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {parameters.map((param) => (
                  <div key={param.id} className="flex items-center space-x-2 p-2">
                    <Checkbox
                      id={param.id}
                      checked={param.visible}
                      disabled={param.required}
                      onCheckedChange={() => toggleParameter(param.id)}
                    />
                    <label
                      htmlFor={param.id}
                      className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${
                        param.required ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'
                      }`}
                    >
                      {param.name}
                    </label>
                  </div>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Refresh Button - now after the filter dropdown */}
            <button
              onClick={handleTableRefresh}
              disabled={isTableRefreshing}
              className="flex h-9 w-10 items-center justify-center rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${isTableRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Options Table */}
      <div className="relative border rounded-md shadow-md">
        <ScrollArea className="w-full" style={{ height: `${tableHeight}px` }}>
          <div className="min-w-[800px]">
            <OptionsChainTable 
              parameters={parameters.filter(p => p.visible)} 
              onOrderCreate={handleOrderCreate}
              marketPrice={currentPriceData.price}
              options={[]}  // Initially empty array
              assetType={selectedAsset as 'SOL' | 'LABS'}
            />
          </div>
          <ScrollBar orientation="vertical" />
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>

      {/* Orders Section */}
      <OrdersContainer 
        orders={orders} 
        onRemoveOrder={handleRemoveOrder}
        onUpdateQuantity={handleUpdateQuantity}
        selectedAsset={selectedAsset}
        onUpdateLimitPrice={handleLimitPriceUpdate}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
        currentMarketPrices={marketPrices}
      />
    </div>
  )
} 