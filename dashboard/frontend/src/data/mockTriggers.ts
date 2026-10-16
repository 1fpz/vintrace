import type { MonitoringDeviceId } from './mockHistory'

export interface TriggerValues {
  temperature: {
    min: number
    max: number
  }

  humidity: {
    min: number
    max: number
  }

  luminosity: {
    min: number
    max: number
  }
}

export const mockTriggers: Record<
  MonitoringDeviceId,
  TriggerValues
> = {
  vintrace001: {
    temperature: {
      min: 10,
      max: 18,
    },

    humidity: {
      min: 60,
      max: 80,
    },

    luminosity: {
      min: 0,
      max: 20,
    },
  },

  vintrace002: {
    temperature: {
      min: 11,
      max: 18,
    },

    humidity: {
      min: 60,
      max: 78,
    },

    luminosity: {
      min: 0,
      max: 18,
    },
  },
}