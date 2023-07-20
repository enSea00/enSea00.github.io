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
                <p>&copy; N. Cartwright, 2023</p>
            </div>
          </nav>
        </footer>
      `;
    }
  }
  
  customElements.define('footer-component', Footer);