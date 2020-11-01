/* eslint-disable no-undef,no-param-reassign */
const copyToClipboardElems = document.querySelectorAll('.js-copy-to-clipboard');
copyToClipboardElems.forEach((elem) => {
  elem.addEventListener('click', () => {
    const origTooltip = elem.dataset.tooltip;
    const tmpInput = document.createElement('input');
    tmpInput.value = elem.dataset.copy;
    try {
      elem.appendChild(tmpInput);
      tmpInput.select();
      const copied = document.execCommand('copy');
      if (!copied) throw new Error('Copy failed');
      elem.dataset.tooltip = 'Copied!';
    } catch (err) {
      elem.dataset.tooltip = 'Copying failed :(';
    }
    tmpInput.remove();
    setTimeout(() => {
      elem.dataset.tooltip = origTooltip;
    }, 2500);
  });
});
