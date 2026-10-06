// 찾아오는 길 페이지 — 상명대학교 천안캠퍼스 상록관 날씨 표시
// 날씨는 API 키가 필요 없는 Open-Meteo를 사용합니다.

const CAMPUS_LAT = 36.8330;
const CAMPUS_LON = 127.1790;

async function loadWeather() {
  const box = document.getElementById('weather-box');
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${CAMPUS_LAT}&longitude=${CAMPUS_LON}&current=temperature_2m,relative_humidity_2m`;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('날씨 응답 오류');
    const data = await res.json();
    const temp = data.current?.temperature_2m;
    const humidity = data.current?.relative_humidity_2m;

    if (temp === undefined || humidity === undefined) throw new Error('날씨 데이터 없음');

    box.innerHTML = `
      <div class="weather-item">
        <span class="weather-label">기온</span>
        <span class="weather-value">${temp}°C</span>
      </div>
      <div class="weather-item">
        <span class="weather-label">습도</span>
        <span class="weather-value">${humidity}%</span>
      </div>
    `;
  } catch (err) {
    box.innerHTML = '<p class="weather-error">날씨 정보를 불러오지 못했습니다.</p>';
  }
}

loadWeather();
