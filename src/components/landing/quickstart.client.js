const copyText = async (value) => {
  if (!window.isSecureContext || !navigator.clipboard?.writeText) {
    throw new Error('Clipboard API unavailable in this context');
  }

  await navigator.clipboard.writeText(value);
};

const buttons = document.querySelectorAll('.code-copy-btn');

buttons.forEach((button) => {
  if (!(button instanceof HTMLElement)) {
    return;
  }

  const cmd = button.dataset.copy;
  const copyLabel = button.dataset.copyLabel;
  const copiedLabel = button.dataset.copiedLabel;
  const label = button.querySelector('.code-copy-label');

  if (!cmd || !copyLabel || !copiedLabel || !(label instanceof HTMLElement)) {
    return;
  }

  let resetTimer;

  const setCopied = (copied) => {
    button.classList.toggle('copied', copied);
    label.textContent = copied ? copiedLabel : copyLabel;
  };

  button.addEventListener('click', async () => {
    try {
      await copyText(cmd);
      setCopied(true);

      window.clearTimeout(resetTimer);
      resetTimer = window.setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch {
      setCopied(false);
    }
  });
});
