(function () {
  const form = document.getElementById('submit-form');
  const formCard = document.getElementById('form-card');
  const paymentCard = document.getElementById('payment-card');
  const paymentUnpaid = document.getElementById('payment-unpaid');
  const paymentPaid = document.getElementById('payment-paid');
  const paymentStepBadge = document.getElementById('payment-step-badge');
  const submitInstruction = document.getElementById('submit-instruction');
  const payBtn = document.getElementById('pay-btn');
  const testModeBanner = document.getElementById('test-mode-banner');
  const coverFile = document.getElementById('coverArtFile');
  const coverUrl = document.getElementById('coverArtUrl');
  const coverPreview = document.getElementById('cover-preview');

  let coverArtValue = '';

  function isTestMode() {
    return CONFIG.testMode === true;
  }

  function isPaid() {
    return isTestMode() || sessionStorage.getItem(CONFIG.paymentSessionKey) === 'true';
  }

  function setPaid() {
    sessionStorage.setItem(CONFIG.paymentSessionKey, 'true');
    updatePaymentUI();
  }

  function updatePaymentUI() {
    if (isTestMode()) {
      testModeBanner.classList.remove('hidden');
      paymentCard.classList.add('hidden');
      submitInstruction.classList.add('hidden');
      formCard.classList.remove('locked');
      return;
    }

    testModeBanner.classList.add('hidden');
    paymentCard.classList.remove('hidden');
    submitInstruction.classList.remove('hidden');

    const paid = sessionStorage.getItem(CONFIG.paymentSessionKey) === 'true';
    formCard.classList.toggle('locked', !paid);
    paymentCard.classList.toggle('paid', paid);
    paymentUnpaid.classList.toggle('hidden', paid);
    paymentPaid.classList.toggle('hidden', !paid);
    submitInstruction.classList.toggle('instruction-active', paid);

    if (paymentStepBadge) {
      paymentStepBadge.innerHTML = paid
        ? '<i class="fa-solid fa-circle-check"></i> Step 1 — Payment Complete'
        : '<i class="fa-solid fa-lock"></i> Step 1 — Payment Required';
    }
  }

  function showToast(message, type = 'success') {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<i class="fa-solid fa-${type === 'success' ? 'check' : 'exclamation-circle'}"></i> ${message}`;
    document.body.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('show'));
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 5000);
  }

  function handlePaymentReturn() {
    const params = new URLSearchParams(window.location.search);
    const successKey = (CONFIG.paymentSuccessParam || 'payment=success').split('=')[0];
    const successValue = (CONFIG.paymentSuccessParam || 'payment=success').split('=')[1] || 'success';

    if (params.get(successKey) === successValue) {
      setPaid();
      showToast('Payment successful! The form is now unlocked.');
      window.history.replaceState({}, '', window.location.pathname);
      document.getElementById('form-card').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  function updateCoverPreview(src) {
    if (src) {
      coverPreview.innerHTML = `<img src="${src}" alt="Cover art preview">`;
      coverArtValue = src;
    } else {
      coverPreview.innerHTML = '<span>No image</span>';
      coverArtValue = '';
    }
  }

  coverFile.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Please select an image file.', 'error');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast('Image must be under 5 MB.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      coverUrl.value = '';
      updateCoverPreview(ev.target.result);
    };
    reader.readAsDataURL(file);
  });

  coverUrl.addEventListener('input', () => {
    const url = coverUrl.value.trim();
    if (url) {
      coverFile.value = '';
      updateCoverPreview(url);
    } else if (!coverFile.files.length) {
      updateCoverPreview('');
    }
  });

  payBtn.addEventListener('click', () => {
    if (!CONFIG.stripePaymentLink) {
      showToast('Payment link is not configured.', 'error');
      return;
    }
    window.location.href = CONFIG.stripePaymentLink;
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!isPaid()) {
      showToast('Please complete the $5 payment first.', 'error');
      return;
    }

    const data = {
      artistName: form.artistName.value.trim(),
      songTitle: form.songTitle.value.trim(),
      coverArt: coverArtValue || coverUrl.value.trim(),
      description: form.description.value.trim(),
      duration: form.duration.value.trim(),
      releaseDate: form.releaseDate.value,
      label: form.label.value.trim(),
      writers: form.writers.value.trim(),
      musicians: form.musicians.value.trim(),
      previewLink: form.previewLink.value.trim(),
      mp3DownloadLink: form.mp3DownloadLink.value.trim(),
      wavDownloadLink: form.wavDownloadLink.value.trim(),
      generatedOneSheet: '',
      paymentId: `PAY-${Date.now()}`,
    };

    if (!data.artistName || !data.songTitle) {
      showToast('Artist Name and Song Title are required.', 'error');
      return;
    }

    const submitBtn = form.querySelector('[type="submit"]');
    submitBtn.disabled = true;

    try {
      if (!BluegrassDB.isConfigured()) {
        showToast('Google Sheets is not connected. See SETUP-INSTRUCTIONS.txt.', 'error');
        return;
      }
      const record = await BluegrassDB.addSingle(data);
      showToast(`"${record.songTitle}" submitted successfully!`);
      form.reset();
      coverFile.value = '';
      updateCoverPreview('');
      sessionStorage.removeItem(CONFIG.paymentSessionKey);
      updatePaymentUI();
    } catch (err) {
      const msg = err.message === 'NOT_CONFIGURED'
        ? 'Google Sheets is not connected. See SETUP-INSTRUCTIONS.txt.'
        : (err.message || 'Submission failed. Please try again.');
      showToast(msg, 'error');
      console.error(err);
    } finally {
      submitBtn.disabled = false;
    }
  });

  handlePaymentReturn();
  updatePaymentUI();
})();