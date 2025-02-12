if (!customElements.get('dmp-iframe')) {
  class DMPIframe extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({mode: 'open'});
    }
    connectedCallback() {
      const iframe = document.createElement('iframe');
      iframe.src = this.getAttribute('src');

      const style = document.createElement('style');
      style.textContent = `
        iframe {
          color-scheme: light;
          width: 100%;
          height: 100%;
          border: none;
        }`;

      this.shadowRoot.append(style, iframe);
    }
  }
  customElements.define('dmp-iframe', DMPIframe);
}
