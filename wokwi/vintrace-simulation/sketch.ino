/*
 * VinTrace — Simulação Wokwi para Edge Computing & FIWARE IoT Agent
 * Hardware simulado:
 *   - ESP32 DevKit v4
 *   - DHT22 (temperatura e umidade) no GPIO 4
 *   - LDR (fotoresistor) no GPIO 34
 *   - LED Azul de Alerta no GPIO 27
 *   - Buzzer no GPIO 25
 *
 * Padrões de Thresholds (Defaults VinTrace):
 *   - Temperatura: 10.0 a 18.0 °C
 *   - Umidade: 60.0 a 80.0%
 *   - Luminosidade: 0.0 a 20.0%
 */

#include <DHT.h>

#define DHTPIN 4
#define DHTTYPE DHT22
#define LDRPIN 34
#define LEDPIN 27
#define BUZZERPIN 25

DHT dht(DHTPIN, DHTTYPE);

// Thresholds padrão do VinTrace
const float TEMP_MIN = 10.0, TEMP_MAX = 18.0;
const float HUM_MIN = 60.0, HUM_MAX = 80.0;
const int LIGHT_MIN = 0, LIGHT_MAX = 20;

unsigned long lastSample = 0;
unsigned long lastBlink = 0;
unsigned long lastSoundCycle = 0;
bool ledState = false;
int soundCycleIndex = 0;

int readLuminosityPercent() {
  int raw = analogRead(LDRPIN);
  int percent = map(raw, 0, 4095, 0, 100);
  return constrain(percent, 0, 100);
}

void setup() {
  Serial.begin(115200);
  pinMode(LEDPIN, OUTPUT);
  pinMode(BUZZERPIN, OUTPUT);
  digitalWrite(LEDPIN, LOW);
  noTone(BUZZERPIN);

  analogReadResolution(12);
  dht.begin();

  Serial.println("=================================================");
  Serial.println("  VinTrace Wokwi Simulation — FIWARE Compatible  ");
  Serial.println("=================================================");
  Serial.println("Limites configurados:");
  Serial.printf("  - Temp: %.1f a %.1f C\n", TEMP_MIN, TEMP_MAX);
  Serial.printf("  - Umid: %.1f a %.1f %%\n", HUM_MIN, HUM_MAX);
  Serial.printf("  - Luz : %d a %d %%\n", LIGHT_MIN, LIGHT_MAX);
  Serial.println("-------------------------------------------------");
}

void loop() {
  unsigned long now = millis();

  float t = dht.readTemperature();
  float h = dht.readHumidity();
  int light = readLuminosityPercent();

  if (isnan(t)) t = 14.0;
  if (isnan(h)) h = 68.0;

  bool tempAnomaly = (t < TEMP_MIN || t > TEMP_MAX);
  bool humAnomaly = (h < HUM_MIN || h > HUM_MAX);
  bool lumAnomaly = (light < LIGHT_MIN || light > LIGHT_MAX);

  bool hasAnyAnomaly = (tempAnomaly || humAnomaly || lumAnomaly);

  // 1. Alerta visual: LED azul pisca continuamente enquanto persistir anomalia
  if (hasAnyAnomaly) {
    if (now - lastBlink > 300) {
      lastBlink = now;
      ledState = !ledState;
      digitalWrite(LEDPIN, ledState ? HIGH : LOW);
    }
  } else {
    ledState = false;
    digitalWrite(LEDPIN, LOW);
  }

  // 2. Alerta sonoro: buzzer diferencia o tipo de anomalia e cicla se multiplas
  if (hasAnyAnomaly) {
    if (now - lastSoundCycle > 1000) {
      lastSoundCycle = now;
      int activeList[3];
      int count = 0;
      if (tempAnomaly) activeList[count++] = 1; // 700 Hz (Temperatura)
      if (humAnomaly) activeList[count++] = 2;  // 1100 Hz (Umidade)
      if (lumAnomaly) activeList[count++] = 3;  // 1600 Hz (Luminosidade)

      if (count > 0) {
        soundCycleIndex = (soundCycleIndex + 1) % count;
        int currentType = activeList[soundCycleIndex];
        if (currentType == 1) {
          tone(BUZZERPIN, 700, 220); // Temperatura
        } else if (currentType == 2) {
          tone(BUZZERPIN, 1100, 420); // Umidade
        } else if (currentType == 3) {
          tone(BUZZERPIN, 1600, 650);  // Luminosidade
        }
      }
    }
  } else {
    noTone(BUZZERPIN);
  }

  // 3. Telemetria impressa periodicamente
  if (now - lastSample > 3000) {
    lastSample = now;
    String status = "NORMAL";
    if (hasAnyAnomaly) {
      status = "ALERTA [";
      if (tempAnomaly) status += " Temp ";
      if (humAnomaly) status += " Umid ";
      if (lumAnomaly) status += " Luz ";
      status += "]";
    }

    Serial.printf("[Telemetria UltraLight] t|%.1f|h|%.1f|l|%d  --> Status: %s\n", t, h, light, status.c_str());
  }

  delay(20);
}
