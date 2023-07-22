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
                <p style="font-size:10px; text-align:center">&copy; 2023 Nick Cartwright</p>
                <p style="font-size:10px; text-align:center">Wave icon created by max.icons - Flaticon</p>
            </div>
          </nav>
        </footer>
      `;
    }
  }
  
  customElements.define('footer-component', Footer);