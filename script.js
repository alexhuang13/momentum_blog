const $ = (s) => document.querySelector(s);
const zh = document.body.dataset.lang === 'zh';
const root = document.documentElement;
const toggle = $('#theme-toggle');
const themeState = () => toggle.setAttribute('aria-pressed', String(root.classList.contains('dark')));
themeState();
toggle.addEventListener('click', () => {
  root.classList.toggle('dark');
  try { localStorage.setItem('momentum-theme', root.classList.contains('dark') ? 'dark' : 'light'); } catch {}
  themeState();
});
const nav = [...document.querySelectorAll('.toc nav a')];
const sections = nav.map(a => document.querySelector(a.hash));
let frame;
function updateScroll() {
  const max = root.scrollHeight - root.clientHeight;
  $('#progress').style.width = `${max > 0 ? root.scrollTop / max * 100 : 0}%`;
  let active = 0;
  sections.forEach((s, i) => { if (s.getBoundingClientRect().top <= 160) active = i; });
  nav.forEach((a, i) => { a.classList.toggle('active', i === active); if(i === active) a.setAttribute('aria-current','location'); else a.removeAttribute('aria-current'); });
  frame = null;
}
addEventListener('scroll', () => { if (!frame) frame = requestAnimationFrame(updateScroll); }, { passive: true });
addEventListener('resize', updateScroll);
updateScroll();
// Exact piecewise exponents from the manuscript's batch-size-dependent data-scaling theorem.
export function rates(s, beta, b) {
  const b1 = s / (s + 1), b2 = (2 * s + 1 / beta) / (2 * s + 1 + 1 / beta), b3 = (2 * s + 1) / (2 * s + 2);
  return { b1, b2, b3, sgd: Math.min(b1, s * (1 - b)), polyak: Math.min(b1, 2 * s * (1 - b)),
    nesterov: b < b1 ? b1 : b < b2 ? s * (1 + (beta - 1) * b) / (s * beta + 1) : 2 * s * (1 - b) };
}
const batch = $('#batch-slider'), source = $('#source-slider'), capacity = $('#capacity-slider');
function drawChart() {
  const b = +batch.value, s = +source.value, beta = +capacity.value;
  const compact = matchMedia('(max-width:600px)').matches;
  const r = rates(s, beta, b), { b1, b2, b3 } = r;
  $('#batch-value').textContent = b.toFixed(2);
  $('#source-value').textContent = s.toFixed(1);
  $('#capacity-value').textContent = beta.toFixed(1);
  for (const name of ['sgd', 'polyak', 'nesterov']) $(`#rate-${name}`).textContent = r[name].toFixed(3);
  const small = b <= b1, large = b > b1 && b < b3;
  $('#regime-name').textContent = zh ? (small ? 'I · 小 Batch' : large ? 'II · 大 Batch' : 'III · 超大 Batch') : (small ? 'I · Small batch' : large ? 'II · Large batch' : 'III · Ultra-large batch');
  $('#regime-description').textContent = zh ? (small ? '三种方法达到相同的最优数据缩放指数。' : large ? 'Nesterov 优于 Polyak，Polyak 优于 SGD。' : 'Polyak 和 Nesterov 具有相同指数，均优于 SGD。') : (small ? 'All three methods achieve the same optimal data-scaling exponent.' : large ? 'Nesterov outperforms Polyak, which in turn outperforms SGD.' : 'Polyak and Nesterov share the same exponent and outperform SGD.');
  const L = 61, R = 774, T = 51;
  const maxY = Math.max(0.5, Math.ceil(rates(s, beta, b2).nesterov * 1.1 * 10) / 10);
  // The vertical unit length is 1.2 times the horizontal unit length.
  const B = T + 1.2 * (R - L) * maxY;
  const x = b => L + b * (R - L), y = r => B - 1.2 * r * (R - L), f = v => v.toFixed(2);
  $('#phase-chart').setAttribute('viewBox', `0 0 800 ${B + 70}`);
  let svg = `<rect x="${L}" y="${T}" width="${f(x(b1)-L)}" height="${B-T}" fill="var(--blue-wash)" opacity=".48"/>
    <rect x="${f(x(b1))}" y="${T}" width="${f(x(b3)-x(b1))}" height="${B-T}" fill="var(--green-wash)" opacity=".65"/>
    <rect x="${f(x(b3))}" y="${T}" width="${f(R-x(b3))}" height="${B-T}" fill="var(--orange-wash)" opacity=".4"/>`;
  for (let i=0; i<=Math.round(maxY * 10); i++) {
    const v = i / 10;
    svg += `<line class="chart-grid" x1="${L}" y1="${f(y(v))}" x2="${R}" y2="${f(y(v))}"/><text data-axis="y" data-value="${v}" x="${L-11}" y="${f(y(v)+4)}" text-anchor="end" font-size="11">${v.toFixed(1)}</text>`;
  }
  svg += `<line class="axis" x1="${L}" y1="${B}" x2="${R}" y2="${B}"/>`;
  (compact ? [0,.5,1] : [0,.2,.4,.6,.8,1]).forEach(t => { svg += `<text data-axis="x" data-value="${t}" x="${f(x(t))}" y="${B+19}" text-anchor="middle" font-size="10">${t.toFixed(1)}</text>`; });
  const regions = compact ? ['I', 'II', 'III'] : zh ? ['小 Batch', '大 Batch', '超大 Batch'] : ['Small batch', 'Large batch', 'Ultra-large batch'];
  [[b1/2, regions[0]],[(b1+b3)/2, regions[1]],[(b3+1)/2, regions[2]]].forEach(([position,label]) => { svg += `<text x="${f(x(position))}" y="38" text-anchor="middle" font-size="11">${label}</text>`; });
  [[b1,'b₁'],[b2,'b₂'],[b3,'b₃']].forEach(([v,label],i) => { svg += `<line x1="${f(x(v))}" x2="${f(x(v))}" y1="${T}" y2="${B}" stroke="${i===1?'var(--nesterov)':'var(--muted)'}" opacity=".4"/><text x="${f(x(v))}" y="${i===1 ? f(y(rates(s,beta,b2).nesterov)-14) : B+39}" text-anchor="middle" font-size="11">${compact ? label : label + ' = ' + v.toFixed(3)}</text>`; });
  // Exact breakpoints keep corners exact even between sampled positions.
  const points = [...new Set([0,b1,b2,b3,1,...Array.from({length:201},(_,i)=>i/200)])].sort((a,b)=>a-b);
  for(const name of ['sgd','polyak','nesterov']){
    const path = points.map((p,i) => `${i?'L':'M'}${f(x(p))},${f(y(rates(s,beta,p)[name]))}`).join(' ');
    svg += `<path class="curve curve-${name}" d="${path}"/>`;
  }
  svg += `<line x1="${f(x(b))}" x2="${f(x(b))}" y1="${T}" y2="${B}" stroke="var(--ink)" opacity=".5" stroke-width="1"/>`;
  for(const [name,size] of [['sgd',6.5],['polyak',5],['nesterov',3.5]]) svg += `<circle cx="${f(x(b))}" cy="${f(y(r[name]))}" r="${size}" stroke="var(--${name})" stroke-width="2" fill="var(--surface)"/>`;
  svg += `<text class="axis-title" x="${L}" y="15">${zh ? '数据缩放指数 r' : 'Data-scaling exponent r'}</text><text class="axis-title" x="${(L+R)/2}" y="${B+67}" text-anchor="middle">${zh ? 'Batch 指数 b · B = Dᵇ⁺ᵒ⁽¹⁾' : 'Batch exponent b · B = Dᵇ⁺ᵒ⁽¹⁾'}</text>`;
  $('#chart-content').innerHTML = svg;
  $('#chart-desc').textContent = zh ? `s=${s}，β=${beta}，b=${b}；SGD 指数 ${r.sgd.toFixed(3)}，Polyak ${r.polyak.toFixed(3)}，Nesterov ${r.nesterov.toFixed(3)}。` : `At s=${s}, beta=${beta}, b=${b}, SGD's exponent is ${r.sgd.toFixed(3)}, Polyak's is ${r.polyak.toFixed(3)}, and Nesterov's is ${r.nesterov.toFixed(3)}.`;
}
[batch, source, capacity].forEach(el => el.addEventListener('input', drawChart));
$('#reset-chart').addEventListener('click', () => { batch.value = '.4'; source.value = '.3'; capacity.value = '4'; drawChart(); });
drawChart();
addEventListener('resize', drawChart);
