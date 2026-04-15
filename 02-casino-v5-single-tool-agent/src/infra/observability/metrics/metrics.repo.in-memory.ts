/**
 * metrics.ts
 * in - memory metrics registry
 */


  export interface CounterMetric {
    name: string;
    value: number;
  }
  export interface GaugeMetric {
    name: string;
    value: number;
  }


  type CounterMetricsMap = Map<string, number>;
  type GaugeMetricsMap = Map<string, number>;

  
  const counters: CounterMetricsMap = new Map();
  const gauges:   GaugeMetricsMap = new Map();
  
  
  /**
   * Increment a counter metric by 1 or a custom value.
   */
  export function incrementCounter(name: string, delta = 1): void {
    const current = counters.get(name) ?? 0;
    counters.set(name, current + delta);
  }
  /**
   * Set a gauge metric to an absolute value.
   */
  export function setGauge(name: string, value: number): void {
    gauges.set(name, value);
  }
  /**
   * Read a counter value.
   */
  export function getCounter(name: string): number {
    return counters.get(name) ?? 0;
  }
  /**
   * Read a gauge value.
   */
  export function getGauge(name: string): number {
    return gauges.get(name) ?? 0;
  }
  /**
   * Return all metrics in a simple JSON-friendly shape.
   * Useful now for debugging and later easy to adapt to /metrics exposure.
   */
  export function getAllMetrics(): {
    counters: CounterMetric[];
    gauges: GaugeMetric[];
  } {
    return {
      counters: Array.from(counters.entries()).map(([name, value]) => ({
        name,
        value
      })),
      gauges: Array.from(gauges.entries()).map(([name, value]) => ({
        name,
        value
      }))
    };
  }
  