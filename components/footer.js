class Footer extends HTMLElement {
    constructor() {
      super();
    }
  
    connectedCallback() {
      this.innerHTML = `
      <script src="components/footer.js" type="text/javascript" defer></script>
        <footer>
          <nav>
        
            <div class="navbar">
              <div class="container-item-left">
                  <p style="font-size:10px; text-align:left">&copy; 2023 Nick Cartwright</p>
              </div>
              <div class="container-item-right">
                  <p style="font-size:10px; text-align:right">Wave icon by max.icons</p>
              </div>
            </div
          </nav>
        </footer>
      `;
    }
  }
  
  customElements.define('footer-component', Footer);