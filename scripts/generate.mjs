import { readFile, writeFile } from 'node:fs/promises';
import katex from 'katex';
const math = html => html.replace(/\\\[([\s\S]*?)\\\]|\\\(([\s\S]*?)\\\)/g, (_, display, inline) => katex.renderToString((display ?? inline).replaceAll('&amp;', '&').replaceAll('&lt;', '<').replaceAll('&gt;', '>'), { displayMode: display !== undefined, throwOnError: true, output: 'htmlAndMathml', strict: 'error' }));
function explorer(zh) {
  return `<div class="phase-lab">
    <div class="lab-heading"><span>${zh ? '交互图：batch size 与数据效率' : 'Explore batch size and data efficiency'}</span><span class="live-label">${zh ? '理论预测' : 'Theory prediction'}</span></div>
    <div class="chart-legend"><span class="sgd"><i class="line solid"></i>SGD</span><span class="polyak"><i class="line solid"></i>Polyak</span><span class="nesterov"><i class="line solid"></i>Nesterov</span></div>
    <svg id="phase-chart" viewBox="0 0 800 548.8" role="img" aria-labelledby="chart-title chart-desc"><title id="chart-title">${zh ? '最优数据缩放指数随 batch 指数的变化' : 'Optimal data-scaling exponent versus batch exponent'}</title><desc id="chart-desc">${zh ? '三种方法在小 batch 时相同，Nesterov 在大 batch 区间最优，超大 batch 时两种动量方法重合。' : 'The methods coincide at small batches, Nesterov leads at large batches, and both momentum methods coincide at ultra-large batches.'}</desc><g id="chart-content"></g></svg>
    <div class="chart-controls">
      <label for="batch-slider"><span>${zh ? 'Batch 指数' : 'Batch exponent'} <i>b</i><output id="batch-value" for="batch-slider">0.40</output></span><input id="batch-slider" type="range" min="0" max="0.99" step="0.01" value="0.4"/></label>
      <label for="source-slider"><span>${zh ? '源指数' : 'Source exponent'} <i>s</i><output id="source-value" for="source-slider">0.3</output></span><input id="source-slider" type="range" min="0.1" max="2" step="0.1" value="0.3"/></label>
      <label for="capacity-slider"><span>${zh ? '容量指数' : 'Capacity exponent'} <i>β</i><output id="capacity-value" for="capacity-slider">4.0</output></span><input id="capacity-slider" type="range" min="1.2" max="6" step="0.1" value="4"/></label>
    </div>
    <div class="lab-readout" aria-live="polite" aria-atomic="true"><div class="regime-readout"><span id="regime-name"></span><p id="regime-description"></p></div><div class="rate-values"><div class="sgd">SGD<strong id="rate-sgd"></strong></div><div class="polyak">Polyak<strong id="rate-polyak"></strong></div><div class="nesterov">Nesterov<strong id="rate-nesterov"></strong></div></div></div>
    <div class="lab-footer"><p>${zh ? '数值越大，增加数据带来的改善越快。这里画的是最优调参后的长期趋势。' : 'Higher values mean more benefit from extra data. These curves show the long-run scaling after optimal tuning.'}</p><button id="reset-chart" type="button">${zh ? '重置' : 'Reset'}</button></div>
    <noscript><p>${zh ? '启用 JavaScript 即可调整图表。下方图 2 展示了相同的理论曲线。' : 'Enable JavaScript to adjust the chart. Figure 2 below shows the same theoretical curves.'}</p></noscript>
  </div>`;
}
for (const lang of ['en', 'zh']) {
  const zh = lang === 'zh';
  const title = zh ? '动量如何帮助大 batch 训练？' : 'How Does Momentum Help Large-Batch Training?';
  const description = zh ? '从 Polyak 和 Nesterov 的更新规则出发，逐步理解有效学习率、噪声平台，以及动量如何影响大 batch 训练的数据效率。' : 'A walkthrough of Polyak and Nesterov momentum: update rules, effective learning rates, noise floors, and data efficiency as batch sizes grow.';
  const byline = `<div class="byline"><p class="authors">Jia-Nan Wang<sup>1,*</sup><span>·</span>Zixun Huang<sup>3,*</sup><span>·</span>Kairui Li<sup>1,*</sup><span>·</span>Lei Wu<sup>1,2,†</sup></p><p><sup>1</sup> ${zh ? '北京大学' : 'Peking University'} &nbsp; <sup>2</sup> ${zh ? '北京科学智能研究院' : 'AI for Science Institute, Beijing'} &nbsp; <sup>3</sup> ${zh ? '宾夕法尼亚大学' : 'University of Pennsylvania'}</p><p><sup>*</sup> ${zh ? '共同一作' : 'Equal contribution'} &nbsp; <sup>†</sup> ${zh ? '通讯作者' : 'Corresponding author'}</p></div>`;
  const source = await readFile(`articles/${lang}.html`, 'utf8');
  const sections = [...source.matchAll(/<section class="section" id="([^"]+)">([\s\S]*?)<\/section>/g)];
  const contents = `<details class="toc"><summary>${zh ? '目录' : 'Table of Contents'}</summary><nav aria-label="${zh ? '文章目录' : 'Table of Contents'}"><ul>${sections.map(([, id, body]) => {
    const heading = body.match(/<h2>(.*?)<\/h2>/)[1];
    const children = [...body.matchAll(/<h3 id="([^"]+)">(.*?)<\/h3>/g)];
    return `<li><a href="#${id}">${heading}</a>${children.length ? `<ul>${children.map(([, childId, childHeading]) => `<li><a href="#${childId}">${childHeading}</a></li>`).join('')}</ul>` : ''}</li>`;
  }).join('')}</ul></nav></details>`;
  const prose = source.replace(/\\\[[\s\S]*?\\\]|\\\([\s\S]*?\\\)/g, '').replace(/<[^>]*>/g, '').replace(/\{\{\w+\}\}/g, '');
  const minutes = Math.max(1, Math.ceil(zh ? (prose.match(/[\u3400-\u9fff]/g) ?? []).length / 400 : prose.trim().split(/\s+/).length / 200));
  const metadata = `<p class="post-meta">${zh ? `约 ${minutes} 分钟阅读` : `${minutes} min read`} <span aria-hidden="true">·</span> <a href="https://arxiv.org/pdf/2609.02728" target="_blank" rel="noopener">${zh ? '论文与完整推导' : 'Paper and full derivations'} ↗</a></p>`;
  const article = math(source.replace('{{BYLINE}}', byline).replace('{{POST_META}}', metadata).replace('{{CONTENTS}}', contents).replace('{{EXPLORER}}', explorer(zh)));
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
  <header class="topbar"><div class="topbar__inner"><a class="brand" href="#top">Momentum Notes</a>
    <nav class="topnav" aria-label="${zh ? '文章导航' : 'Article navigation'}"><a class="nav-section" href="#phase-diagram">${zh ? '交互图' : 'Interactive chart'}</a><a class="topnav__pill" href="https://arxiv.org/pdf/2609.02728" target="_blank" rel="noopener">${zh ? '论文' : 'Paper'} ↗</a>
      <div class="lang-switch" role="group" aria-label="${zh ? '语言' : 'Language'}"><a href="index.html" lang="en" ${!zh ? 'class="active" aria-current="page"' : ''}>EN</a><a href="zh.html" lang="zh-CN" ${zh ? 'class="active" aria-current="page"' : ''}>中文</a></div>
      <button id="theme-toggle" class="theme" type="button" aria-label="${zh ? '切换深色模式' : 'Toggle dark mode'}" aria-pressed="false"><svg class="sun" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M19 5l-1.5 1.5M6.5 17.5L5 19"/></svg><svg class="moon" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 15A8 8 0 0 1 9 4a7 7 0 0 0 11 11Z"/></svg></button>
    </nav>
  </div></header>
  <div id="top" class="page">
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
