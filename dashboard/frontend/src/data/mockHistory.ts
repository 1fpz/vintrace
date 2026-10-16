export type HistoryPeriod = '24h' | '7d' | '30d'
export type MonitoringDeviceId = 'vintrace001' | 'vintrace002'

export const mockMonitoringData = {
  vintrace001: {
    id: 'vintrace001',
    name: 'Adega Principal',

    current: {
      temperature: 16.8,
      humidity: 68,
      luminosity: 12,
    },

    history: {
      '24h': {
        temperature: [
          { time: '08:00', value: 15.2 },
          { time: '09:00', value: 15.8 },
          { time: '10:00', value: 16.1 },
          { time: '11:00', value: 16.7 },
          { time: '12:00', value: 17.4 },
          { time: '13:00', value: 18.6 },
          { time: '14:00', value: 19.3 },
          { time: '15:00', value: 17.9 },
          { time: '16:00', value: 16.8 },
        ],

        humidity: [
          { time: '08:00', value: 66 },
          { time: '09:00', value: 67 },
          { time: '10:00', value: 68 },
          { time: '11:00', value: 70 },
          { time: '12:00', value: 72 },
          { time: '13:00', value: 76 },
          { time: '14:00', value: 82 },
          { time: '15:00', value: 74 },
          { time: '16:00', value: 68 },
        ],

        luminosity: [
          { time: '08:00', value: 7 },
          { time: '09:00', value: 9 },
          { time: '10:00', value: 11 },
          { time: '11:00', value: 13 },
          { time: '12:00', value: 18 },
          { time: '13:00', value: 24 },
          { time: '14:00', value: 31 },
          { time: '15:00', value: 19 },
          { time: '16:00', value: 12 },
        ],
      },

      '7d': {
        temperature: [
          { time: 'Seg', value: 15.8 },
          { time: 'Ter', value: 16.2 },
          { time: 'Qua', value: 17.1 },
          { time: 'Qui', value: 18.4 },
          { time: 'Sex', value: 16.9 },
          { time: 'Sáb', value: 16.4 },
          { time: 'Dom', value: 16.8 },
        ],

        humidity: [
          { time: 'Seg', value: 65 },
          { time: 'Ter', value: 67 },
          { time: 'Qua', value: 71 },
          { time: 'Qui', value: 83 },
          { time: 'Sex', value: 74 },
          { time: 'Sáb', value: 69 },
          { time: 'Dom', value: 68 },
        ],

        luminosity: [
          { time: 'Seg', value: 10 },
          { time: 'Ter', value: 12 },
          { time: 'Qua', value: 17 },
          { time: 'Qui', value: 28 },
          { time: 'Sex', value: 16 },
          { time: 'Sáb', value: 13 },
          { time: 'Dom', value: 12 },
        ],
      },

      '30d': {
        temperature: [
          { time: '01/10', value: 15.6 },
          { time: '05/10', value: 16.1 },
          { time: '10/10', value: 17.2 },
          { time: '15/10', value: 18.8 },
          { time: '20/10', value: 17.6 },
          { time: '25/10', value: 16.3 },
          { time: '30/10', value: 16.8 },
        ],

        humidity: [
          { time: '01/10', value: 64 },
          { time: '05/10', value: 68 },
          { time: '10/10', value: 72 },
          { time: '15/10', value: 81 },
          { time: '20/10', value: 75 },
          { time: '25/10', value: 70 },
          { time: '30/10', value: 68 },
        ],

        luminosity: [
          { time: '01/10', value: 8 },
          { time: '05/10', value: 11 },
          { time: '10/10', value: 15 },
          { time: '15/10', value: 26 },
          { time: '20/10', value: 18 },
          { time: '25/10', value: 14 },
          { time: '30/10', value: 12 },
        ],
      },
    },
  },

  vintrace002: {
    id: 'vintrace002',
    name: 'Adega Reserva',

    current: {
      temperature: 19.6,
      humidity: 84,
      luminosity: 7,
    },

    history: {
      '24h': {
        temperature: [
          { time: '08:00', value: 17.1 },
          { time: '09:00', value: 17.6 },
          { time: '10:00', value: 18.2 },
          { time: '11:00', value: 18.9 },
          { time: '12:00', value: 19.4 },
          { time: '13:00', value: 20.1 },
          { time: '14:00', value: 20.4 },
          { time: '15:00', value: 19.9 },
          { time: '16:00', value: 19.6 },
        ],

        humidity: [
          { time: '08:00', value: 73 },
          { time: '09:00', value: 75 },
          { time: '10:00', value: 78 },
          { time: '11:00', value: 80 },
          { time: '12:00', value: 82 },
          { time: '13:00', value: 85 },
          { time: '14:00', value: 87 },
          { time: '15:00', value: 86 },
          { time: '16:00', value: 84 },
        ],

        luminosity: [
          { time: '08:00', value: 4 },
          { time: '09:00', value: 5 },
          { time: '10:00', value: 6 },
          { time: '11:00', value: 7 },
          { time: '12:00', value: 8 },
          { time: '13:00', value: 9 },
          { time: '14:00', value: 8 },
          { time: '15:00', value: 7 },
          { time: '16:00', value: 7 },
        ],
      },

      '7d': {
        temperature: [
          { time: 'Seg', value: 17.2 },
          { time: 'Ter', value: 17.8 },
          { time: 'Qua', value: 18.5 },
          { time: 'Qui', value: 19.2 },
          { time: 'Sex', value: 20.1 },
          { time: 'Sáb', value: 19.8 },
          { time: 'Dom', value: 19.6 },
        ],

        humidity: [
          { time: 'Seg', value: 75 },
          { time: 'Ter', value: 77 },
          { time: 'Qua', value: 79 },
          { time: 'Qui', value: 82 },
          { time: 'Sex', value: 86 },
          { time: 'Sáb', value: 85 },
          { time: 'Dom', value: 84 },
        ],

        luminosity: [
          { time: 'Seg', value: 5 },
          { time: 'Ter', value: 6 },
          { time: 'Qua', value: 8 },
          { time: 'Qui', value: 9 },
          { time: 'Sex', value: 7 },
          { time: 'Sáb', value: 6 },
          { time: 'Dom', value: 7 },
        ],
      },

      '30d': {
        temperature: [
          { time: '01/10', value: 17.1 },
          { time: '05/10', value: 17.7 },
          { time: '10/10', value: 18.3 },
          { time: '15/10', value: 19.1 },
          { time: '20/10', value: 19.8 },
          { time: '25/10', value: 20.2 },
          { time: '30/10', value: 19.6 },
        ],

        humidity: [
          { time: '01/10', value: 74 },
          { time: '05/10', value: 76 },
          { time: '10/10', value: 79 },
          { time: '15/10', value: 82 },
          { time: '20/10', value: 85 },
          { time: '25/10', value: 86 },
          { time: '30/10', value: 84 },
        ],

        luminosity: [
          { time: '01/10', value: 5 },
          { time: '05/10', value: 6 },
          { time: '10/10', value: 8 },
          { time: '15/10', value: 10 },
          { time: '20/10', value: 8 },
          { time: '25/10', value: 6 },
          { time: '30/10', value: 7 },
        ],
      },
    },
  },
}