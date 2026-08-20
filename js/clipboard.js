const toast = document.getElementById('toast');

export function copyFieldToClipboard(textValue, label) {
  if (!textValue || textValue === '-') return;
  navigator.clipboard.writeText(textValue)
    .then(() => showToast(`${label} copiado!`))
    .catch(err => console.error('Erro ao copiar:', err));
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.remove('opacity-0');
  toast.classList.add('opacity-100');
  setTimeout(() => {
    toast.classList.remove('opacity-100');
    toast.classList.add('opacity-0');
  }, 2500);
}