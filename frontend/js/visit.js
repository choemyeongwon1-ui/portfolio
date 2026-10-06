// 찾아오는 길 페이지 — 지도(Leaflet + Esri World Imagery)와 날씨(Open-Meteo)를 표시합니다.
// 둘 다 API 키가 필요 없는 무료 서비스입니다.
//
// 타일 공급자를 세 번 바꿨다:
//   1) CARTO 익명 타일 → 키가 필요하도록 정책이 바뀌어 깨짐
//   2) Esri 회색 캔버스/스트리트맵 → 무료지만 이 캠퍼스 지역 데이터가 아예 없어 깨짐
//   3) OpenStreetMap 표준 타일 → 지역 커버리지는 완벽했지만, 이건 가벼운 개발용 서버라
//      운영 사이트에서 계속 불러오면 정책 위반으로 차단된다(x-blocked 헤더로 확인).
// 그래서 커버리지도 확실하고 운영 환경에서 막히지 않는 Esri 위성 이미지로 정착했다.

const CAMPUS_LAT = 36.8330;
const CAMPUS_LON = 127.1790;
const CAMPUS_LABEL = '상명대학교 천안 (상명대길 31) 상록관';

function initMap() {
  const map = L.map('map', {
    scrollWheelZoom: false,
    zoomControl: false,
  }).setView([CAMPUS_LAT, CAMPUS_LON], 16);

  // Esri World Imagery — 위성 이미지. 키 불필요, 전세계 커버리지, 운영 환경 사용 가능.
  L.tileLayer(
    'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    {
      attribution:
        'Tiles &copy; <a href="https://www.esri.com">Esri</a> — Esri, Maxar, Earthstar Geographics, and the GIS User Community',
      maxZoom: 19,
    }
  ).addTo(map);

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
