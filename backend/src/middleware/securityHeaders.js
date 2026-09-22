// ==========================================
// 보안 헤더
// ------------------------------------------
// 새 패키지(helmet 등) 없이, 필요한 헤더 몇 개만 직접 붙인다.
// 특히 관리자 로그인 페이지(admin.html)를 겨냥한 방어가 목적이다.
//
//   X-Frame-Options / frame-ancestors
//     다른 사이트가 우리 로그인 페이지를 자기 페이지의 <iframe> 안에
//     몰래 넣고, 사용자가 클릭했다고 착각하게 만드는 "클릭재킹"을 막는다.
//     예: 진짜처럼 보이는 버튼 위에 투명하게 로그인 폼을 겹쳐 놓고
//     비밀번호를 입력하게 유도하는 공격.
//
//   X-Content-Type-Options: nosniff
//     브라우저가 파일 내용을 보고 "이건 사실 HTML/스크립트인 것 같다"며
//     응답의 Content-Type을 무시하고 제멋대로 해석하는 것을 막는다.
//
//   Referrer-Policy: no-referrer
//     admin.html에서 구글 폰트 같은 외부 자원을 불러올 때,
//     "어느 페이지에서 왔는지"(주소)가 그쪽 서버 로그에 남지 않게 한다.
// ==========================================

export function securityHeaders(req, res, next) {
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Content-Security-Policy', "frame-ancestors 'none'");
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
  next();
}
