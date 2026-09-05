import { readFile, writeFile } from 'node:fs/promises';
import katex from 'katex';
const math = html => html.replace(/\\\[([\s\S]*?)\\\]|\\\(([\s\S]*?)\\\)/g, (_, display, inline) => katex.renderToString((display ?? inline).replaceAll('&amp;', '&').replaceAll('&lt;', '<').replaceAll('&gt;', '>'), { displayMode: display !== undefined, throwOnError: true, output: 'htmlAndMathml', strict: 'error' }));
function explorer(zh) {
  return `<div class="phase-lab">
    <div class="lab-heading"><span>${zh ? '交互相图' : 'Interactive phase diagram'}</span><span class="live-label">${zh ? '按论文定理计算' : 'Computed from the theorem'}</span></div>
    <div class="chart-legend"><span class="sgd"><i class="line solid"></i>SGD</span><span class="polyak"><i class="line solid"></i>Polyak</span><span class="nesterov"><i class="line solid"></i>Nesterov</span></div>
    <svg id="phase-chart" viewBox="0 0 800 548.8" role="img" aria-labelledby="chart-title chart-desc"><title id="chart-title">${zh ? '最优数据缩放指数随 batch 指数的变化' : 'Optimal data-scaling exponent versus batch exponent'}</title><desc id="chart-desc">${zh ? '三种方法在小 batch 时相同，Nesterov 在大 batch 区间最优，超大 batch 时两种动量方法重合。' : 'The methods coincide at small batches, Nesterov leads at large batches, and both momentum methods coincide at ultra-large batches.'}</desc><g id="chart-content"></g></svg>
    <div class="chart-controls">
      <label for="batch-slider"><span>${zh ? 'Batch 指数' : 'Batch exponent'} <i>b</i><output id="batch-value" for="batch-slider">0.40</output></span><input id="batch-slider" type="range" min="0" max="0.99" step="0.01" value="0.4"/></label>
      <label for="source-slider"><span>${zh ? '源指数' : 'Source exponent'} <i>s</i><output id="source-value" for="source-slider">0.3</output></span><input id="source-slider" type="range" min="0.1" max="2" step="0.1" value="0.3"/></label>
      <label for="capacity-slider"><span>${zh ? '容量指数' : 'Capacity exponent'} <i>β</i><output id="capacity-value" for="capacity-slider">4.0</output></span><input id="capacity-slider" type="range" min="1.2" max="6" step="0.1" value="4"/></label>
    </div>
    <div class="lab-readout" aria-live="polite" aria-atomic="true"><div class="regime-readout"><span id="regime-name"></span><p id="regime-description"></p></div><div class="rate-values"><div class="sgd">SGD<strong id="rate-sgd"></strong></div><div class="polyak">Polyak<strong id="rate-polyak"></strong></div><div class="nesterov">Nesterov<strong id="rate-nesterov"></strong></div></div></div>
    <div class="lab-footer"><p>${zh ? '最优调参后的渐近指数。纵轴与横轴的单位长度比固定为 1.2:1。' : 'Optimally tuned asymptotic exponents. Vertical-to-horizontal unit-length ratio: 1.2:1.'}</p><button id="reset-chart" type="button">${zh ? '重置' : 'Reset'}</button></div>
    <noscript><p>${zh ? '启用 JavaScript 即可调整相图；上方论文图 1 展示了相同结论。' : 'Enable JavaScript to adjust the chart. The paper figure above shows the same result.'}</p></noscript>
  </div>`;
}
for (const lang of ['en', 'zh']) {
  const zh = lang === 'zh';
  const labels = zh ? ['引言', '风险稳定性', '风险动力学', '数据缩放与相图', '机制分析', '数值验证', '结论与讨论'] : ['Introduction', 'Risk stability', 'Risk dynamics', 'Data scaling', 'Mechanism', 'Numerical validations', 'Conclusion'];
  const ids = ['motivation', 'stability', 'dynamics', 'phase-diagram', 'mechanism', 'experiments', 'takeaway'];
  const title = zh ? '大 Batch 训练中的动量：Polyak 扩大临界 Batch，Nesterov 提高数据效率' : 'Momentum in large-batch training: Polyak enlarges the critical batch size, Nesterov improves data efficiency';
  const description = zh ? '大 batch、one-pass 训练中 Polyak 与 Nesterov 动量的风险稳定性、风险动力学及最优数据缩放。' : 'Risk stability, risk dynamics, and optimal data scaling of Polyak and Nesterov momentum in large-batch, one-pass training.';
  const byline = `<div class="byline"><p class="authors">Jia-Nan Wang<sup>1,*</sup><span>·</span>Zixun Huang<sup>3,*</sup><span>·</span>Kairui Li<sup>1,*</sup><span>·</span>Lei Wu<sup>1,2,†</sup></p><p><sup>1</sup> ${zh ? '北京大学' : 'Peking University'} &nbsp; <sup>2</sup> ${zh ? '北京科学智能研究院' : 'AI for Science Institute, Beijing'} &nbsp; <sup>3</sup> ${zh ? '宾夕法尼亚大学' : 'University of Pennsylvania'}</p><p><sup>*</sup> ${zh ? '共同一作' : 'Equal contribution'} &nbsp; <sup>†</sup> ${zh ? '通讯作者' : 'Corresponding author'}</p></div>`;
  const article = math((await readFile(`articles/${lang}.html`, 'utf8')).replace('{{BYLINE}}', byline).replace('{{EXPLORER}}', explorer(zh)));
  const html = `<!doctype html>
<html lang="${zh ? 'zh-CN' : 'en'}">
<head>
  <meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/>
  <meta name="color-scheme" content="light dark"/>
  <title>${title}</title><meta name="description" content="${description}"/>
  <meta property="og:type" content="article"/><meta property="og:title" content="${title}"/><meta property="og:description" content="${description}"/>
  <meta name="twitter:card" content="summary"/>
  <link rel="icon" href="assets/favicon.svg" type="image/svg+xml"/>
  <link rel="alternate" hreflang="en" href="index.html"/><link rel="alternate" hreflang="zh-CN" href="zh.html"/>
  <link rel="stylesheet" href="./style.css"/>
  <script>try{var t=localStorage.getItem('momentum-theme');if(t==='dark'||(!t&&matchMedia('(prefers-color-scheme: dark)').matches))document.documentElement.classList.add('dark')}catch(e){}</script>
</head>
<body data-lang="${lang}">
  <a class="skip-link" href="#main">${zh ? '跳转到正文' : 'Skip to article'}</a>
  <div class="progress" id="progress" aria-hidden="true"></div>
  <header class="topbar"><div class="topbar__inner"><a class="brand" href="#top"><span class="brand-mark" aria-hidden="true">m</span>Momentum <span class="brand-sub">/ Scaling laws</span></a>
    <nav class="topnav" aria-label="${zh ? '文章导航' : 'Article navigation'}"><a class="nav-section" href="#phase-diagram">${zh ? '相图' : 'Phase diagram'}</a><a class="nav-section" href="#experiments">${zh ? '实验' : 'Experiments'}</a><a class="topnav__pill" href="https://arxiv.org/pdf/2609.02728" target="_blank" rel="noopener">${zh ? '论文' : 'Paper'} ↗</a>
      <div class="lang-switch" role="group" aria-label="${zh ? '语言' : 'Language'}"><a href="index.html" lang="en" ${!zh ? 'class="active" aria-current="page"' : ''}>EN</a><a href="zh.html" lang="zh-CN" ${zh ? 'class="active" aria-current="page"' : ''}>中文</a></div>
      <button id="theme-toggle" class="theme" type="button" aria-label="${zh ? '切换深色模式' : 'Toggle dark mode'}" aria-pressed="false"><svg class="sun" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M19 5l-1.5 1.5M6.5 17.5L5 19"/></svg><svg class="moon" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 15A8 8 0 0 1 9 4a7 7 0 0 0 11 11Z"/></svg></button>
    </nav>
  </div></header>
  <div id="top" class="page"><aside class="toc" aria-label="${zh ? '目录' : 'Contents'}"><p>${zh ? '本文内容' : 'On this page'}</p><nav>${ids.map((id, i) => `<a href="#${id}"><span>0${i + 1}</span>${labels[i]}</a>`).join('')}</nav><a class="toc-bottom" href="https://arxiv.org/pdf/2609.02728" target="_blank" rel="noopener">${zh ? '阅读论文' : 'Read the paper'} ↗</a></aside>
    <main id="main" class="article">${article}
      <footer id="cite" class="article-footer"><div class="hero-actions"><a class="hero-action primary" href="https://arxiv.org/pdf/2609.02728" target="_blank" rel="noopener">${zh ? '阅读完整论文' : 'Read the full paper'} ↗</a></div></footer>
    </main>
  </div>
  <script type="module" src="./script.js"></script>
</body>
</html>`;
  await writeFile(lang === 'en' ? 'index.html' : 'zh.html', html);
}
console.log('Generated English and Chinese pages; all equations rendered successfully.');
