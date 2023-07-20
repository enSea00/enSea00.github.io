class Header extends HTMLElement {
    constructor() {
      super();
    }
  
    connectedCallback() {
      this.innerHTML = `
        <script src="components/header.js" type="text/javascript" defer></script>
        <header>
          <nav>
            <div class="header">
                <h1></h1>
            </div>
        
            <div class="navbar">
                <a href="index.html">About</a>
                <a href="TeachingApps.html" class="active">Teaching Apps</a>
                <a href="DataTools.html">Data Tools</a>
                <a href="Observations.html">Observations</a>
            </div>
          </nav>
        </header>
      `;
    }
  }
  
  customElements.define('header-component', Header);