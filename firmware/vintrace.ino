/*
 * VinTrace Edge — Firmware Integrado ESP32 para FIWARE IoT Agent UltraLight 2.0.
 *
 * Hardware:
 *   - ESP32 DevKit
 *   - DHT11 (Físico) / DHT22 (Wokwi) no GPIO 4
 *   - LDR em divisor de tensão no GPIO 34 (ADC1)
 *   - LED Azul de Alerta no GPIO 2
 *   - Buzzer Passivo no GPIO 25 (GPIO 18 liberado para SCLK do display TFT)
 *
 * Protocolo:
 *   - Telemetria UltraLight 2.0: /<API_KEY>/<DEVICE_ID>/attrs (ex: /TEF/vintrace001/attrs)
 *     Payload: t|14.2|h|68.0|l|12
 *   - Comandos IoT Agent: /<API_KEY>/<DEVICE_ID>/cmd (ex: /TEF/vintrace001/cmd)
 *     Payload: <DEVICE_ID>@<COMMAND>|<VALUE> (ex: vintrace001@alertTemp|on)
 *   - Resposta de comando: /<API_KEY>/<DEVICE_ID>/cmdexe
 *     Payload: <DEVICE_ID>@<COMMAND>|<COMMAND> OK
 */

#include <WiFi.h>
#include <PubSubClient.h>
#include <DHT.h>

#if __has_include("secrets.h")
  #include "secrets.h"
#else
  #include "secrets.example.h"
#endif

#define DHT_PIN 4
#define DHT_TYPE DHT11 // No simulador Wokwi altere para DHT22

#define LDR_PIN 34
#define BLUE_LED_PIN 2
#define BUZZER_PIN 25

#define SAMPLE_INTERVAL_MS 5000UL
#define BLINK_INTERVAL_MS 300UL
#define SOUND_CYCLE_INTERVAL_MS 1000UL

#ifndef FIWARE_API_KEY
  #define FIWARE_API_KEY "TEF"
#endif

#ifndef MQTT_CLIENT_ID
  #define MQTT_CLIENT_ID "vintrace001"
#endif

DHT dht(DHT_PIN, DHT_TYPE);
WiFiClient wifiClient;
PubSubClient mqtt(wifiClient);

// Tópicos MQTT padronizados do IoT Agent UltraLight
String telemetryTopic = "/" + String(FIWARE_API_KEY) + "/" + String(MQTT_CLIENT_ID) + "/attrs";
String commandTopic = "/" + String(FIWARE_API_KEY) + "/" + String(MQTT_CLIENT_ID) + "/cmd";
String cmdexeTopic = "/" + String(FIWARE_API_KEY) + "/" + String(MQTT_CLIENT_ID) + "/cmdexe";

// Estados dos alertas remotos (controlados exclusivamente pelo backend/FIWARE)
bool alertTempActive = false;
bool alertHumActive = false;
bool alertLumActive = false;

unsigned long lastSample = 0;
unsigned long lastBlink = 0;
unsigned long lastSoundCycle = 0;
bool ledState = false;
int currentSoundIndex = 0;

// Converte leitura analógica do LDR para escala 0 a 100% de luminosidade
int readLuminosityPercent() {
  int raw = analogRead(LDR_PIN); // 0..4095
  // Divisor padrão: maior luz = menor resistência = maior tensão
  int percent = map(raw, 0, 4095, 0, 100);
  return constrain(percent, 0, 100);
}

void parseAndExecuteCommand(const String& payload) {
  Serial.printf("[COMANDO BRUTO] %s\n", payload.c_str());

  // Formato UltraLight padrão: <device_id>@<command>|<value>
  // Exemplos:
  //   vintrace001@alertTemp|on
  //   vintrace001@alertHum|off
  //   alertLum|on
  //   ALERT_ON
  String cmdName = "";
  String cmdVal = "";

  int atIdx = payload.indexOf('@');
  int pipeIdx = payload.indexOf('|');
  int eqIdx = payload.indexOf('=');

  if (pipeIdx != -1) {
    if (atIdx != -1 && atIdx < pipeIdx) {
      cmdName = payload.substring(atIdx + 1, pipeIdx);
    } else {
      cmdName = payload.substring(0, pipeIdx);
    }
    cmdVal = payload.substring(pipeIdx + 1);
  } else if (eqIdx != -1) {
    cmdName = payload.substring(0, eqIdx);
    cmdVal = payload.substring(eqIdx + 1);
  } else {
    cmdName = payload;
    cmdVal = "on";
  }

  cmdName.trim();
  cmdVal.trim();
  cmdVal.toLowerCase();
  bool turnOn = (cmdVal == "on" || cmdVal == "true" || cmdVal == "1");

  Serial.printf("[COMANDO PROCESSADO] Ação: %s | Valor: %s\n", cmdName.c_str(), cmdVal.c_str());

  if (cmdName.equalsIgnoreCase("alertTemp")) {
    alertTempActive = turnOn;
    Serial.printf(">> Alerta Temperatura: %s\n", turnOn ? "ATIVADO" : "NORMALIZADO");
  } else if (cmdName.equalsIgnoreCase("alertHum")) {
    alertHumActive = turnOn;
    Serial.printf(">> Alerta Umidade: %s\n", turnOn ? "ATIVADO" : "NORMALIZADO");
  } else if (cmdName.equalsIgnoreCase("alertLum")) {
    alertLumActive = turnOn;
    Serial.printf(">> Alerta Luminosidade: %s\n", turnOn ? "ATIVADO" : "NORMALIZADO");
  } else if (cmdName.equalsIgnoreCase("ALERT_ON")) {
    alertTempActive = true;
  } else if (cmdName.equalsIgnoreCase("ALERT_OFF")) {
    alertTempActive = false;
    alertHumActive = false;
    alertLumActive = false;
  } else if (cmdName.equalsIgnoreCase("BUZZER_TEST")) {
    tone(BUZZER_PIN, 1500, 250);
  }

  // Responde confirmação no cmdexe para o IoT Agent
  String ackPayload = String(MQTT_CLIENT_ID) + "@" + cmdName + "|" + cmdName + " OK";
  if (mqtt.connected()) {
    mqtt.publish(cmdexeTopic.c_str(), ackPayload.c_str());
  }
}

void mqttCallback(char* topic, byte* payload, unsigned int length) {
  String message = "";
  for (unsigned int i = 0; i < length; i++) {
    message += (char)payload[i];
  }
  message.trim();
  Serial.printf("[MQTT MSG] Topico: %s | Conteudo: %s\n", topic, message.c_str());
  parseAndExecuteCommand(message);
}

void connectWiFi() {
  if (WiFi.status() == WL_CONNECTED) return;
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Conectando ao Wi-Fi");
  unsigned long start = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - start < 15000) {
    delay(400);
    Serial.print(".");
  }
  if (WiFi.status() == WL_CONNECTED) {
    Serial.printf("\nWi-Fi Conectado! IP: %s\n", WiFi.localIP().toString().c_str());
  } else {
    Serial.println("\nFalha de conexao Wi-Fi.");
  }
}

void reconnectMqtt() {
  if (WiFi.status() != WL_CONNECTED) connectWiFi();
  if (WiFi.status() != WL_CONNECTED) return;

  mqtt.setServer(MQTT_HOST, MQTT_PORT);
  mqtt.setCallback(mqttCallback);

  String clientId = String(MQTT_CLIENT_ID) + "-" + String((uint32_t)ESP.getEfuseMac(), HEX);
  Serial.printf("Conectando MQTT Broker (%s:%d)... ", MQTT_HOST, MQTT_PORT);

  if (mqtt.connect(clientId.c_str(), MQTT_USERNAME, MQTT_PASSWORD)) {
    Serial.println("Conectado com sucesso!");
    mqtt.subscribe(commandTopic.c_str(), 1);
    Serial.printf("Inscrito no topico de comando: %s\n", commandTopic.c_str());
  } else {
    Serial.printf("Falha na conexao MQTT, rc=%d\n", mqtt.state());
  }
}

void publishUltraLightTelemetry(float temp, float hum, int lum) {
  // Formato UltraLight 2.0: t|<temp>|h|<hum>|l|<lum>
  String payload = "t|" + String(temp, 1) + "|h|" + String(hum, 1) + "|l|" + String(lum);
  if (mqtt.connected()) {
    mqtt.publish(telemetryTopic.c_str(), payload.c_str());
    Serial.printf("[TELEMETRIA ENVIADA] Topico: %s | Payload: %s\n", telemetryTopic.c_str(), payload.c_str());
  } else {
    Serial.printf("[TELEMETRIA LOCAL] (MQTT desconectado) Payload: %s\n", payload.c_str());
  }
}

void handleAlertOutputs(unsigned long now) {
  bool hasAnyAlert = alertTempActive || alertHumActive || alertLumActive;

  // 1. LED Azul piscando continuamente enquanto houver QUALQUER anomalia
  if (hasAnyAlert) {
    if (now - lastBlink >= BLINK_INTERVAL_MS) {
      lastBlink = now;
      ledState = !ledState;
      digitalWrite(BLUE_LED_PIN, ledState ? HIGH : LOW);
    }
  } else {
    ledState = false;
    digitalWrite(BLUE_LED_PIN, LOW);
  }

  // 2. Buzzer diferenciado por tom / ciclando se multiplos alertas estiverem ativos
  if (hasAnyAlert) {
    if (now - lastSoundCycle >= SOUND_CYCLE_INTERVAL_MS) {
      lastSoundCycle = now;
      // Monta lista de alertas ativos para ciclar deterministamente
      int activeAlertsCount = 0;
      int alertTypes[3];
      if (alertTempActive) alertTypes[activeAlertsCount++] = 1; // Temperatura: tom agudo
      if (alertHumActive) alertTypes[activeAlertsCount++] = 2;  // Umidade: tom medio
      if (alertLumActive) alertTypes[activeAlertsCount++] = 3;  // Luz: tom grave

      if (activeAlertsCount > 0) {
        currentSoundIndex = (currentSoundIndex + 1) % activeAlertsCount;
        int activeType = alertTypes[currentSoundIndex];

        if (activeType == 1) {
          // Temperatura: tom 1800 Hz
          tone(BUZZER_PIN, 1800, 220);
        } else if (activeType == 2) {
          // Umidade: tom 1200 Hz
          tone(BUZZER_PIN, 1200, 420);
        } else if (activeType == 3) {
          // Luminosidade: tom 800 Hz
          tone(BUZZER_PIN, 800, 650);
        }
      }
    }
  } else {
    noTone(BUZZER_PIN);
  }
}

void setup() {
  Serial.begin(115200);
  delay(500);
  Serial.println("\n=== VinTrace ESP32 Firmware Iniciado ===");

  pinMode(BLUE_LED_PIN, OUTPUT);
  pinMode(BUZZER_PIN, OUTPUT);
  digitalWrite(BLUE_LED_PIN, LOW);
  noTone(BUZZER_PIN);

  analogReadResolution(12);
  dht.begin();

  connectWiFi();
  reconnectMqtt();
}

void loop() {
  if (WiFi.status() == WL_CONNECTED && !mqtt.connected()) {
    reconnectMqtt();
  }
  if (mqtt.connected()) {
    mqtt.loop();
  }

  unsigned long now = millis();

  // Publicacao periodica da telemetria
  if (now - lastSample >= SAMPLE_INTERVAL_MS) {
    lastSample = now;
    float temp = dht.readTemperature();
    float hum = dht.readHumidity();
    int lum = readLuminosityPercent();

    if (isnan(temp)) temp = 14.5;
    if (isnan(hum)) hum = 68.0;

    publishUltraLightTelemetry(temp, hum, lum);
  }

  // Gerenciamento dos atuadores de alerta (LED e Buzzer)
  handleAlertOutputs(now);

  delay(20);
}
