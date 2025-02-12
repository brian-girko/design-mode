'use strict';

[...document.querySelectorAll('.edit-toolbar')].forEach(e => e.remove());
{
  let p = document.createElement('dmp-iframe');
  if (!p.shadowRoot) {
    p = document.createElement('iframe');
  }
  p.style = `
    z-index: 1000000000000;
    position: fixed;
    top: 10px;
    left: 10px;
    width: 476px;
    height: 38px;
    border: none;
  `;

  const click = e => e.stopPropagation();
  const press = e => e.stopPropagation();

  document.addEventListener('click', click, true);
  document.addEventListener('keypress', press, true);
  document.addEventListener('keydown', press, true);
  document.addEventListener('keyup', press, true);

  const unload = (report = true) => {
    document.removeEventListener('click', click, true);
    document.removeEventListener('keypress', press, true);
    document.removeEventListener('keydown', press, true);
    document.removeEventListener('keyup', press, true);
    window.onmessage = '';
    p.remove();
    chrome.runtime.onMessage.removeListener(onmessage);
    if (report) {
      chrome.runtime.sendMessage({
        method: 'close-me'
      });
    }
  };


  window.onmessage = e => {
    const command = e.data.method;
    const stop = () => {
      e.preventDefault();
      e.stopPropagation();
    };

    if (
      command === 'bold' || command === 'italic' || command === 'insertorderedlist' || command === 'removeformat' ||
      command === 'insertunorderedlist' || command === 'indent' || command === 'outdent'
    ) {
      document.execCommand(command);
      stop();
    }
    else if (command === 'link') {
      const href = prompt('Enter a URL (keep blank to remove link):', '');
      if (href) {
        document.execCommand('createlink', false, href);
      }
      else {
        document.execCommand('unlink');
      }
      stop();
    }
    else if (command === 'insertimage') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = e => {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = () => {
          document.execCommand('insertimage', false, reader.result);
        };
        if (file) {
          reader.readAsDataURL(file);
        }
      };
      input.click();

      stop();
    }
    else if (['p', 'pre', 'div'].includes(command)) {
      console.log(command);
      document.execCommand('formatBlock', false, command);
      stop();
    }
    else if (/h\d/.test(command)) {
      document.execCommand('formatBlock', false, command);
      stop();
    }
    else if (command === 'blockquote') {
      document.execCommand('formatBlock', false, 'blockquote');
      stop();
    }
    else if (command === 'move') {
      const {left, top} = getComputedStyle(p);

      p.style.left = (parseInt(left) + e.data.data.dx) + 'px';
      p.style.top = (parseInt(top) + e.data.data.dy) + 'px';
      stop();
    }
    else if (command === 'spellcheck:false') {
      document.documentElement.spellcheck = false;
    }
    else if (command === 'spellcheck:true') {
      document.documentElement.spellcheck = true;
    }
    else if (command === 'close') {
      unload();
      stop();
    }
  };

  console.log(p.gg, 'gg' in p);
  p.setAttribute(
    'src',
    chrome.runtime.getURL('/data/toolbar/index.html?spellcheck=' + document.documentElement.spellcheck)
  );
  document.documentElement.appendChild(p);

  const onmessage = request => {
    if (request.method === 'unload') {
      unload(false);
    }
  };

  chrome.runtime.onMessage.addListener(onmessage);
}
