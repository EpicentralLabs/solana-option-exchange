interface OptionCalculation {
  price: number;
  greeks: {
    delta: number;
    gamma: number;
    theta: number;
    vega: number;
    rho: number;
  };
}

// Standard normal cumulative distribution function
function normalCDF(x: number): number {
  // This is an approximation of the cumulative normal distribution function
  // using Abramowitz and Stegun's approximation (1964)
  const t = 1 / (1 + 0.2316419 * Math.abs(x));
  const d = 0.3989423 * Math.exp(-x * x / 2);
  const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  if (x > 0) {
    return 1 - p;
  }
  return p;
}

// Normal probability density function
function normalPDF(x: number): number {
  return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
}

export function calculateOption(params: {
  isCall: boolean;
  strikePrice: number;
  spotPrice: number;
  timeUntilExpirySeconds: number;
  volatility: number;
  riskFreeRate: number;
}): OptionCalculation {
  console.log('Input Parameters:', {
    type: params.isCall ? 'CALL' : 'PUT',
    strike: params.strikePrice.toFixed(2),
    spot: params.spotPrice.toFixed(2),
    timeToExpiryDays: (params.timeUntilExpirySeconds / (24 * 60 * 60)).toFixed(1),
    volatility: (params.volatility * 100).toFixed(1) + '%',
    riskFreeRate: (params.riskFreeRate * 100).toFixed(1) + '%'
  });

  // Convert time to years (same as Rust implementation)
  const timeToExpiry = params.timeUntilExpirySeconds / 31_536_000;
  
  if (timeToExpiry <= 0) {
    console.log('Option Expired');
    return {
      price: 0,
      greeks: { delta: 0, gamma: 0, theta: 0, vega: 0, rho: 0 }
    };
  }

  const S = params.spotPrice;
  const K = params.strikePrice;
  const T = timeToExpiry;
  const r = params.riskFreeRate;
  const v = params.volatility;
  const sqrtT = Math.sqrt(T);

  // Calculate d1 and d2 exactly as in Rust implementation
  const d1 = (Math.log(S / K) + (r + 0.5 * v * v) * T) / (v * sqrtT);
  const d2 = d1 - v * sqrtT;

  console.log('Calculation Variables:', {
    timeToExpiryYears: T.toFixed(3),
    d1: d1.toFixed(4),
    d2: d2.toFixed(4),
    S, K, r, v
  });

  const Nd1 = normalCDF(d1);
  const Nd2 = normalCDF(d2);
  const NNd1 = normalPDF(d1);

  let price: number;
  let delta: number;
  let gamma: number;
  let theta: number;
  let vega: number;
  let rho: number;

  // Match Rust implementation exactly
  if (params.isCall) {
    price = S * Nd1 - K * Math.exp(-r * T) * Nd2;
    delta = Nd1;
    gamma = NNd1 / (S * v * sqrtT);
    theta = -(S * v * NNd1) / (2 * sqrtT) - r * K * Math.exp(-r * T) * Nd2;
    vega = S * sqrtT * NNd1;
    rho = K * T * Math.exp(-r * T) * Nd2;
  } else {
    const NegNd1 = normalCDF(-d1);
    const NegNd2 = normalCDF(-d2);
    price = K * Math.exp(-r * T) * NegNd2 - S * NegNd1;
    delta = -NegNd1;
    gamma = NNd1 / (S * v * sqrtT);
    theta = -(S * v * NNd1) / (2 * sqrtT) + r * K * Math.exp(-r * T) * NegNd2;
    vega = S * sqrtT * NNd1;
    rho = -K * T * Math.exp(-r * T) * NegNd2;
  }

  const result = {
    price: Math.max(0, price),
    greeks: {
      delta,
      gamma,
      theta,
      vega,
      rho
    }
  };

  console.log('Option Calculation Result:', {
    price: result.price.toFixed(4),
    greeks: {
      delta: result.greeks.delta.toFixed(4),
      gamma: result.greeks.gamma.toFixed(6),
      theta: result.greeks.theta.toFixed(4),
      vega: result.greeks.vega.toFixed(4),
      rho: result.greeks.rho.toFixed(4)
    }
  });

  return result;
}

// Add this test function at the bottom of the file
function testCalculation() {
  // Using the same values as in Rust test
  const testParams = {
    isCall: true,
    strikePrice: 250,
    spotPrice: 218.54,
    timeUntilExpirySeconds: 716747, // 8.3 days in seconds
    volatility: 0.35,
    riskFreeRate: 0.08
  };

  console.log('Running test calculation with Rust test values:');
  const result = calculateOption(testParams);
  console.log('Test result:', result);
}

// Run the test
testCalculation();