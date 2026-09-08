const fallbackLabels = {
  mobileToc: 'Mobile table of contents',
  desktopToc: 'Desktop table of contents',
  codeRegion: 'Documentation code block',
};

const frame =
  window.requestAnimationFrame?.bind(window) ??
  ((callback) => window.setTimeout(callback, 16));

let annotationPending = false;

function readLabels() {
  const footer = document.querySelector('[data-ntgw-docs-footer]');
  const labels = footer instanceof HTMLElement ? footer.dataset : {};

  return {
    mobileToc: labels.mobileTocLabel || fallbackLabels.mobileToc,
    desktopToc: labels.desktopTocLabel || fallbackLabels.desktopToc,
    codeRegion: labels.codeRegionLabel || fallbackLabels.codeRegion,
  };
}

function labelToc(selector, label) {
  const nav = document.querySelector(selector);
  if (!(nav instanceof HTMLElement)) {
    return;
  }

  if (nav.getAttribute('aria-label') !== label) {
    nav.setAttribute('aria-label', label);
  }
  if (nav.hasAttribute('aria-labelledby')) {
    nav.removeAttribute('aria-labelledby');
  }
}

function annotateCodeRegions(codeRegionLabel) {
  const regions = document.querySelectorAll(
    'pre[role="region"]:not([aria-label]):not([aria-labelledby]):not([title])',
  );

  regions.forEach((region, index) => {
    const language = region.getAttribute('data-language');
    const suffix = language && language !== 'text' ? ` (${language})` : '';
    region.setAttribute('aria-label', `${codeRegionLabel} ${index + 1}${suffix}`);
  });
}

function annotateDocsLandmarks() {
  annotationPending = false;
  const labels = readLabels();

  labelToc(
    'mobile-starlight-toc nav',
    labels.mobileToc,
  );
  labelToc(
    'starlight-toc nav',
    labels.desktopToc,
  );
  annotateCodeRegions(labels.codeRegion);
}

function scheduleDocsLandmarkAnnotation() {
  if (annotationPending) {
    return;
  }

  annotationPending = true;
  frame(annotateDocsLandmarks);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', scheduleDocsLandmarkAnnotation, { once: true });
} else {
  scheduleDocsLandmarkAnnotation();
}

document.addEventListener('astro:page-load', scheduleDocsLandmarkAnnotation);

const landmarkObserver = new MutationObserver(scheduleDocsLandmarkAnnotation);
landmarkObserver.observe(document.body ?? document.documentElement, {
  childList: true,
  subtree: true,
});

for (const delay of [100, 500]) {
  window.setTimeout(scheduleDocsLandmarkAnnotation, delay);
}

window.addEventListener(
  'load',
  () => {
    scheduleDocsLandmarkAnnotation();
    window.setTimeout(() => {
      scheduleDocsLandmarkAnnotation();
      landmarkObserver.disconnect();
    }, 1000);
  },
  { once: true },
);
