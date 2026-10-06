// 찾아오는 길 페이지 — 지도(Leaflet + OpenStreetMap)와 날씨(Open-Meteo)를 표시합니다.
// 둘 다 API 키가 필요 없는 무료 서비스입니다.
// (CARTO는 키가 필요하도록 바뀌었고, Esri 회색 타일은 이 지역 커버리지가 없어서
//  전세계 커버리지가 확실한 표준 OSM 타일로 정착했습니다. 톤은 CSS 필터로 조정.)

const CAMPUS_LAT = 36.8330;
const CAMPUS_LON = 127.1790;
const CAMPUS_LABEL = '상명대학교 천안 (상명대길 31) 상록관';

function initMap() {
  const map = L.map('map', {
    scrollWheelZoom: false,
    zoomControl: false,
  }).setView([CAMPUS_LAT, CAMPUS_LON], 16);

  // OpenStreetMap 표준 타일 — 전세계 커버리지가 확실한 무료 타일 (키 불필요)
  // 기본 색이 진해서 .visit-map 에 CSS 필터를 걸어 톤을 차분하게 눌렀습니다.
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
  }).addTo(map);

  L.control.zoom({ position: 'bottomright' }).addTo(map);

  // 브랜드 컬러의 커스텀 핀 마커
  const pinIcon = L.divIcon({
    className: 'campus-pin',
    html: '<span class="campus-pin-dot"></span><span class="campus-pin-pulse"></span>',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });

  L.marker([CAMPUS_LAT, CAMPUS_LON], { icon: pinIcon })
    .addTo(map)
    .bindPopup(`<strong>${CAMPUS_LABEL}</strong>`)
    .openPopup();

  // 모바일에서 지도 위 스크롤이 페이지 스크롤을 막지 않도록, 지도를 탭/클릭했을 때만 휠 줌 허용
  map.on('click', () => map.scrollWheelZoom.enable());
  map.getContainer().addEventListener('mouseleave', () => map.scrollWheelZoom.disable());
}

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

initMap();
loadWeather();
