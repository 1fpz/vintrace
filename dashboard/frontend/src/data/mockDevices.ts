export interface Device {
  id: string
  name: string
  location: string
  online: boolean
  temperature: number
  humidity: number
  luminosity: number
}

export const mockDevices: Device[] = [
  {
    id: 'vintrace001',
    name: 'Adega Principal',
    location: 'Vinheria Agnello',
    online: true,
    temperature: 16.8,
    humidity: 68,
    luminosity: 12,
  },
  {
    id: 'vintrace002',
    name: 'Adega Reserva',
    location: 'Estoque',
    online: false,
    temperature: 17.2,
    humidity: 71,
    luminosity: 8,
  },
]