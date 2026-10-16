export const mockDevice = {
  id: 'vintrace001',
  name: 'Adega Principal',
  location: 'Vinheria Agnello',
  online: true,
  lastUpdate: 'Há poucos segundos',

  sensors: {
    temperature: {
      value: 16.8,
      min: 10,
      max: 18,
    },

    humidity: {
      value: 68,
      min: 60,
      max: 80,
    },

    luminosity: {
      value: 12,
      min: 0,
      max: 20,
    },
  },
}