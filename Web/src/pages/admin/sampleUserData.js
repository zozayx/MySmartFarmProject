const sampleUserData = [
    {
      id: 1,
      username: "user01",
      fullName: "김철수",
      email: "chulsoo@example.com",
      farmLocation: "경기도 수원시",
      lastLogin: "2025-04-02 14:20",
      sensorData: [
        { timestamp: "2025-04-02 14:00", temperature: 24.5, humidity: 60 },
        { timestamp: "2025-04-02 15:00", temperature: 25.1, humidity: 58 },
      ],
      recentData: {
        temperature: 25.1,
        humidity: 58,
        soilMoisture: 45, // 추가된 값
        timestamp: "2025-04-02 15:00",
      },
      devices: {
        irrigation: "ON",
        lighting: "OFF",
      },
      environmentSettings: {
        temperatureThreshold: 25,
        humidityThreshold: 60,
        soilMoistureThreshold: 45,
      },
    },
    {
      id: 2,
      username: "user02",
      fullName: "이영희",
      email: "younghee@example.com",
      farmLocation: "전라남도 순천시",
      lastLogin: "2025-04-03 09:12",
      sensorData: [
        { timestamp: "2025-04-02 14:00", temperature: 22.0, humidity: 70 },
        { timestamp: "2025-04-02 15:00", temperature: 23.3, humidity: 68 },
      ],
      recentData: {
        temperature: 23.3,
        humidity: 68,
        soilMoisture: 52,
        timestamp: "2025-04-02 15:00",
      },
      devices: {
        irrigation: "OFF",
        lighting: "ON",
      },
      environmentSettings: {
        temperatureThreshold: 24,
        humidityThreshold: 65,
        soilMoistureThreshold: 50,
      },
    },
    {
      id: 3,
      username: "user03",
      fullName: "박민수",
      email: "minsoo@example.com",
      farmLocation: "강원도 강릉시",
      lastLogin: "2025-04-01 17:45",
      sensorData: [
        { timestamp: "2025-04-02 14:00", temperature: 21.8, humidity: 65 },
        { timestamp: "2025-04-02 15:00", temperature: 22.4, humidity: 63 },
      ],
      recentData: {
        temperature: 22.4,
        humidity: 63,
        soilMoisture: 49,
        timestamp: "2025-04-02 15:00",
      },
      devices: {
        irrigation: "ON",
        lighting: "ON",
      },
      environmentSettings: {
        temperatureThreshold: 24,
        humidityThreshold: 65,
        soilMoistureThreshold: 50,
      },
    },
  ];
  
  export default sampleUserData;
  