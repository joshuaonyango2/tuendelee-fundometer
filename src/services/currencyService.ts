// Currency conversion service using exchangerate-api.com free tier
const API_BASE_URL = 'https://api.exchangerate-api.com/v4/latest';

interface ExchangeRates {
  base: string;
  rates: Record<string, number>;
  date: string;
}

class CurrencyService {
  private cache: Map<string, { data: ExchangeRates; timestamp: number }> = new Map();
  private cacheTimeout = 3600000; // 1 hour in milliseconds

  async getExchangeRates(baseCurrency: string = 'USD'): Promise<ExchangeRates> {
    const cacheKey = baseCurrency;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/${baseCurrency}`);
      if (!response.ok) {
        throw new Error('Failed to fetch exchange rates');
      }
      
      const data = await response.json();
      this.cache.set(cacheKey, { data, timestamp: Date.now() });
      return data;
    } catch (error) {
      console.error('Error fetching exchange rates:', error);
      // Return fallback rates if API fails
      return this.getFallbackRates(baseCurrency);
    }
  }

  async convertAmount(amount: number, fromCurrency: string, toCurrency: string): Promise<number> {
    if (fromCurrency === toCurrency) {
      return amount;
    }

    try {
      const rates = await this.getExchangeRates(fromCurrency);
      const rate = rates.rates[toCurrency];
      
      if (!rate) {
        throw new Error(`Exchange rate not found for ${toCurrency}`);
      }
      
      return amount * rate;
    } catch (error) {
      console.error('Error converting currency:', error);
      // Use fallback conversion rates
      return this.fallbackConvert(amount, fromCurrency, toCurrency);
    }
  }

  async convertToMultiple(amount: number, fromCurrency: string, targetCurrencies: string[]): Promise<Record<string, number>> {
    const result: Record<string, number> = {};
    
    try {
      const rates = await this.getExchangeRates(fromCurrency);
      
      for (const currency of targetCurrencies) {
        if (currency === fromCurrency) {
          result[currency] = amount;
        } else {
          const rate = rates.rates[currency];
          result[currency] = rate ? amount * rate : 0;
        }
      }
      
      return result;
    } catch (error) {
      console.error('Error converting to multiple currencies:', error);
      // Use fallback rates
      for (const currency of targetCurrencies) {
        result[currency] = this.fallbackConvert(amount, fromCurrency, currency);
      }
      return result;
    }
  }

  private getFallbackRates(baseCurrency: string): ExchangeRates {
    // Fixed exchange rates: 1 USD = 128 KES
    const fallbackRates: Record<string, Record<string, number>> = {
      USD: {
        USD: 1,
        KES: 128,
        EUR: 0.92,
        GBP: 0.79,
      },
      KES: {
        USD: 1 / 128,
        KES: 1,
        EUR: 0.92 / 128,
        GBP: 0.79 / 128,
      },
      EUR: {
        USD: 1.09,
        KES: 1.09 * 128,
        EUR: 1,
        GBP: 0.86,
      },
      GBP: {
        USD: 1.27,
        KES: 1.27 * 128,
        EUR: 1.16,
        GBP: 1,
      },
    };

    return {
      base: baseCurrency,
      rates: fallbackRates[baseCurrency] || fallbackRates.USD,
      date: new Date().toISOString(),
    };
  }

  private fallbackConvert(amount: number, fromCurrency: string, toCurrency: string): number {
    const rates = this.getFallbackRates(fromCurrency);
    const rate = rates.rates[toCurrency];
    return rate ? amount * rate : amount;
  }
}

export const currencyService = new CurrencyService();