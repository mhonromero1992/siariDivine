/**
 * Forms that really deliver (anti-slop R-26, R-27).
 * With a form endpoint configured (data-endpoint), the form posts JSON and reports the result.
 * Without one, it writes the message out, copies it, and hands over to the shrine's Messenger,
 * where the visitor pastes and sends it. Nothing claims "sent" unless it was.
 */
const fieldLabel = (el) => el.closest('.field')?.querySelector('label, legend')?.textContent.trim() || el.name;

function validate(form) {
  let first = null;
  form.querySelectorAll('[data-required]').forEach((field) => {
    const inputs = [...field.querySelectorAll('input, select, textarea')];
    const err = field.querySelector('.field__error');
    let ok;
    if (inputs[0]?.type === 'radio' || inputs[0]?.type === 'checkbox') ok = inputs.some((i) => i.checked);
    else ok = inputs.every((i) => i.value.trim() !== '');
    field.dataset.invalid = String(!ok);
    inputs.forEach((i) => i.setAttribute('aria-invalid', String(!ok)));
    if (err) err.textContent = ok ? '' : field.dataset.required;
    if (!ok && !first) first = inputs[0];
  });
  return first;
}

function compose(form) {
  const lines = [form.dataset.subject];
  const data = {};
  form.querySelectorAll('.field').forEach((field) => {
    const inputs = [...field.querySelectorAll('input, select, textarea')];
    if (!inputs.length) return;
    let value;
    if (inputs[0].type === 'radio' || inputs[0].type === 'checkbox') value = inputs.filter((i) => i.checked).map((i) => i.value).join(', ');
    else value = inputs.map((i) => i.value.trim()).join(' ');
    if (!value) return;
    const label = fieldLabel(inputs[0]).replace(/\s*\(optional\)$/i, '');
    data[label] = value;
    lines.push(`${label}: ${value}`);
  });
  return { text: lines.join('\n'), data };
}

async function copy(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.append(ta);
    ta.select();
    let ok = false;
    try {
      ok = document.execCommand('copy');
    } catch {
      ok = false;
    }
    ta.remove();
    return ok;
  }
}

document.querySelectorAll('form[data-compose]').forEach((form) => {
  const status = form.querySelector('[data-status]');
  const submit = form.querySelector('[type="submit"]');
  const ready = form.parentElement.querySelector('[data-ready]');
  const preview = ready?.querySelector('[data-ready-text]');
  const copyAgain = ready?.querySelector('[data-copy-again]');
  const readyNote = ready?.querySelector('[data-ready-note]');
  const endpoint = form.dataset.endpoint;

  form.querySelectorAll('input, select, textarea').forEach((el) =>
    el.addEventListener('input', () => {
      const field = el.closest('.field');
      if (field?.dataset.invalid === 'true') validate(form);
    }),
  );

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const firstBad = validate(form);
    if (firstBad) {
      status.dataset.state = 'error';
      status.textContent = 'Some details are missing. They are marked above.';
      firstBad.focus();
      return;
    }
    const { text, data } = compose(form);
    submit.setAttribute('aria-busy', 'true');
    status.dataset.state = '';
    status.textContent = endpoint ? 'Sending…' : 'Preparing your message…';

    if (endpoint) {
      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ subject: form.dataset.subject, message: text, ...data }),
        });
        if (!res.ok) throw new Error(String(res.status));
        status.dataset.state = 'ok';
        status.textContent = form.dataset.sent;
        form.reset();
      } catch {
        status.dataset.state = 'error';
        status.textContent = 'The message could not be sent. Check your connection and try again, or write to the shrine on Facebook.';
      } finally {
        submit.removeAttribute('aria-busy');
      }
      return;
    }

    const copied = await copy(text);
    submit.removeAttribute('aria-busy');
    if (preview) preview.value = text;
    if (readyNote)
      readyNote.textContent = copied
        ? 'Your message is copied. Open Messenger, paste it into the chat with the shrine, and press send.'
        : 'Copy the message below, then open Messenger and paste it into the chat with the shrine.';
    if (ready) {
      ready.hidden = false;
      ready.querySelector('h3')?.focus();
    }
    status.dataset.state = 'ok';
    status.textContent = copied ? 'Message ready and copied.' : 'Message ready.';
  });

  copyAgain?.addEventListener('click', async () => {
    const ok = await copy(preview.value);
    if (readyNote) readyNote.textContent = ok ? 'Copied again. Paste it into Messenger.' : 'Select the text below and copy it.';
    if (!ok) preview.select();
  });
});
