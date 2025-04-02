#include <WiFi.h>
#include <PubSubClient.h>
#include "light.h"  // light.h 헤더 파일 포함
#include "sensor.h"
#include "motor.h"
#include "display.h"


const char* ssid = "your_SSID";
const char* password = "your_PASSWORD";
const char* mqttServer = "<RaspberryPi_IP>";
const int mqttPort = 1883;
const char* mqttUser = "user";
const char* mqttPassword = "password";

WiFiClient espClient;
PubSubClient client(espClient);

void setup() {
  Serial.begin(115200);

  // Wi-Fi 연결
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.println("Connecting to WiFi...");
  }
  Serial.println("Connected to WiFi");

  // MQTT 서버 연결
  client.setServer(mqttServer, mqttPort);
  client.setCallback(mqttCallback);

  // 전구 제어 핀 설정 (예: GPIO 2번)
  setupLightPin(2);  // GPIO 2번에 연결된 전구 제어
}

void loop() {
  if (!client.connected()) {
    reconnect();
  }
  client.loop();
}

void reconnect() {
  while (!client.connected()) {
    if (client.connect("ESP32", mqttUser, mqttPassword)) {
      client.subscribe("smartfarm/control");
    } else {
      delay(5000);
    }
  }
}

void mqttCallback(char* topic, byte* payload, unsigned int length) {
  String message = "";
  for (int i = 0; i < length; i++) {
    message += (char)payload[i];
  }

  // 받은 메시지에 따라 전구를 켜거나 끄는 함수 호출
  controlLight(message);
}
