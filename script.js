// ==========================================
// 네비바 스크롤 효과
// ==========================================
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 50);
});

// ==========================================
// 모바일 네비 토글
// ==========================================
const navToggle = document.getElementById('navToggle');
const navLinks  = document.querySelector('.nav-links');
let navOpen = false;

navToggle.addEventListener('click', () => {
  navOpen = !navOpen;
  if (navOpen) {
    Object.assign(navLinks.style, {
      display: 'flex', flexDirection: 'column',
      position: 'absolute', top: '100%',
      left: '0', right: '0',
      background: 'rgba(240,237,230,0.97)',
      padding: '1.2rem 6%', gap: '1rem',
      borderBottom: '1.5px solid rgba(156,169,152,0.3)',
      backdropFilter: 'blur(16px)'
    });
  } else {
    navLinks.style.display = 'none';
  }
});

document.querySelectorAll('.nav-link').forEach(link => {
  link.addEventListener('click', () => {
    if (window.innerWidth <= 900) {
      navLinks.style.display = 'none';
      navOpen = false;
    }
  });
});

// ==========================================
// 스크롤 리빌 애니메이션
// ==========================================
const revealTargets = document.querySelectorAll(
  '.acard, .skill-box, .proj-card, .ct-card, ' +
  '.info-table, .tag-cloud, .msg-bubble, .section-header, .profile-card'
);

revealTargets.forEach(el => el.classList.add('reveal'));

const revealObs = new IntersectionObserver((entries) => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      setTimeout(() => entry.target.classList.add('visible'), i * 70);
      revealObs.unobserve(entry.target);
    }
  });
}, { threshold: 0.1, rootMargin: '0px 0px -30px 0px' });

revealTargets.forEach(el => revealObs.observe(el));

// ==========================================
// 스킬바 애니메이션
// ==========================================
const skillBoxObs = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.querySelectorAll('.sk-fill').forEach((fill, i) => {
        const w = fill.getAttribute('data-w');
        setTimeout(() => { fill.style.width = w + '%'; }, i * 120);
      });
      skillBoxObs.unobserve(entry.target);
    }
  });
}, { threshold: 0.3 });

document.querySelectorAll('.skill-box').forEach(b => skillBoxObs.observe(b));

// ==========================================
// 태그 호버 시 살짝 기울어짐
// ==========================================
document.querySelectorAll('.tag').forEach(tag => {
  tag.addEventListener('mouseenter', () => {
    const deg = (Math.random() - 0.5) * 6;
    tag.style.transform = `translateY(-2px) rotate(${deg}deg)`;
  });
  tag.addEventListener('mouseleave', () => {
    tag.style.transform = '';
  });
});

// ==========================================
// 페이지 로드 페이드인
// ==========================================
window.addEventListener('load', () => {
  document.body.style.opacity = '0';
  document.body.style.transition = 'opacity 0.5s ease';
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      document.body.style.opacity = '1';
    });
  });
});
