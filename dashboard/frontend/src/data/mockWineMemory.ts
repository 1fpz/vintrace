import type { MonitoringDeviceId } from './mockHistory'

export interface EnvironmentalIncident {
  id: number
  type: 'temperature' | 'humidity' | 'luminosity'
  title: string
  startedAt: string
  endedAt: string
  duration: string
  peakValue: string
  description: string
}

export interface WineMemoryData {
  totalIncidents: number
  exposureTime: string
  lastIncident: string
  stability: number
  incidents: EnvironmentalIncident[]
}

export const mockWineMemory: Record<
  MonitoringDeviceId,
  WineMemoryData
> = {
  vintrace001: {
    totalIncidents: 3,
    exposureTime: '2h 18min',
    lastIncident: 'Hoje, 14:32',
    stability: 94,

    incidents: [
      {
        id: 1,
        type: 'temperature',
        title: 'Temperatura elevada',
        startedAt: 'Hoje, 13:48',
        endedAt: 'Hoje, 14:32',
        duration: '44 min',
        peakValue: '21.4 °C',
        description:
          'A temperatura permaneceu acima do limite máximo configurado.',
      },

      {
        id: 2,
        type: 'luminosity',
        title: 'Excesso de luminosidade',
        startedAt: 'Ontem, 18:20',
        endedAt: 'Ontem, 18:45',
        duration: '25 min',
        peakValue: '34%',
        description:
          'A luminosidade ultrapassou o limite recomendado para o ambiente.',
      },

      {
        id: 3,
        type: 'humidity',
        title: 'Umidade baixa',
        startedAt: '05/10, 10:11',
        endedAt: '05/10, 11:20',
        duration: '1h 09min',
        peakValue: '54%',
        description:
          'A umidade permaneceu abaixo do limite mínimo configurado.',
      },
    ],
  },

  vintrace002: {
    totalIncidents: 5,
    exposureTime: '6h 42min',
    lastIncident: 'Hoje, 16:10',
    stability: 81,

    incidents: [
      {
        id: 1,
        type: 'temperature',
        title: 'Temperatura elevada',
        startedAt: 'Hoje, 14:20',
        endedAt: 'Hoje, 16:10',
        duration: '1h 50min',
        peakValue: '20.4 °C',
        description:
          'A temperatura permaneceu acima do limite máximo configurado.',
      },

      {
        id: 2,
        type: 'humidity',
        title: 'Umidade elevada',
        startedAt: 'Hoje, 13:35',
        endedAt: 'Hoje, 16:05',
        duration: '2h 30min',
        peakValue: '87%',
        description:
          'A umidade ultrapassou o limite máximo configurado.',
      },

      {
        id: 3,
        type: 'temperature',
        title: 'Temperatura elevada',
        startedAt: 'Ontem, 15:10',
        endedAt: 'Ontem, 16:04',
        duration: '54 min',
        peakValue: '19.8 °C',
        description:
          'Foi detectado novo período de exposição a temperatura elevada.',
      },

      {
        id: 4,
        type: 'humidity',
        title: 'Umidade elevada',
        startedAt: '04/10, 12:40',
        endedAt: '04/10, 13:28',
        duration: '48 min',
        peakValue: '84%',
        description:
          'A umidade ficou acima da faixa configurada.',
      },

      {
        id: 5,
        type: 'temperature',
        title: 'Temperatura elevada',
        startedAt: '03/10, 09:30',
        endedAt: '03/10, 10:10',
        duration: '40 min',
        peakValue: '19.6 °C',
        description:
          'A temperatura ultrapassou temporariamente o limite máximo.',
      },
    ],
  },
}