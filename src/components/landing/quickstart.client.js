const copyText = async (value) => {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const textarea = document.createElement('textarea');
  textarea.value = value;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand('copy');
  document.body.removeChild(textarea);
};

const buttons = document.querySelectorAll('.code-copy-btn');

buttons.forEach((button) => {
  let resetTimer;

  button.addEventListener('click', async () => {
    const cmd = button.dataset.copy;
    const copyLabel = button.dataset.copyLabel;
    const copiedLabel = button.dataset.copiedLabel;
    const label = button.querySelector('.code-copy-label');

    if (!cmd || !copyLabel || !copiedLabel || !label) {
      return;
    }

    try {
      await copyText(cmd);
      button.classList.add('copied');
      label.textContent = copiedLabel;

      window.clearTimeout(resetTimer);
      resetTimer = window.setTimeout(() => {
        button.classList.remove('copied');
        label.textContent = copyLabel;
      }, 2000);
    } catch {
      button.classList.remove('copied');
      label.textContent = copyLabel;
    }
  });
});
