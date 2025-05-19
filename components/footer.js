class Footer extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    const currentYear = new Date().getFullYear(); // Get current year
    this.innerHTML = `
      <footer>
        <nav>
          <div class="navbar">
            <div class="container-item-left">
              <p style="font-size:10px; text-align:left">&copy; ${currentYear} Nick Cartwright</p>
            </div>
          </div>
        </nav>
      </footer>
    `;
  }
}

customElements.define('footer-component', Footer);
